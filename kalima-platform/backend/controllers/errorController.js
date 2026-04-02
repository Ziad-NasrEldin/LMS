const AppError = require("../utils/appError");
const {
  createSignupError,
  createSignupValidationError,
  isSignupRequest,
  mapMongooseValidationIssueToSignupItem,
} = require("../utils/signupErrors");

const createRequestId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const ensureRequestId = (err, req) => {
  const headerId = req?.headers?.["x-request-id"];
  err.requestId = err.requestId || headerId || createRequestId();
};

const handleValidationErrorDB = (err, req) => {
  const validationMessages = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${validationMessages.join(". ")}`;

  if (!isSignupRequest(req)) {
    return new AppError(message, 400);
  }

  const role = String(req?.body?.role || "").toLowerCase();
  const issues = Object.values(err.errors).map((issue) =>
    mapMongooseValidationIssueToSignupItem({
      field: issue?.path,
      message: issue?.message,
      role,
    })
  );

  return createSignupValidationError(issues, {
    message: "Signup validation failed. Please review the provided details.",
  });
};

const handleCastErrorDB = (err, req) => {
  if (isSignupRequest(req)) {
    return createSignupError("SIGNUP_FIELD_INVALID", {
      field: err.path,
      message: `Invalid value provided for ${err.path}.`,
    });
  }
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err, req) => {
  const duplicateFields = err?.keyValue || {};
  const duplicateKeys = Object.keys(duplicateFields);
  const duplicateField = duplicateKeys[0];
  const duplicateValue = duplicateField ? duplicateFields[duplicateField] : undefined;

  if (isSignupRequest(req)) {
    if (duplicateField === "email") {
      return createSignupError("SIGNUP_EMAIL_ALREADY_EXISTS");
    }
    if (duplicateField === "phoneNumber") {
      return createSignupError("SIGNUP_PHONE_ALREADY_EXISTS");
    }
    if (duplicateField === "phoneNumber2") {
      return createSignupError("SIGNUP_PHONE2_DUPLICATE");
    }
    return createSignupError("SIGNUP_FIELD_CONFLICT", {
      field: duplicateField,
      details: { field: duplicateField, value: duplicateValue },
      message:
        duplicateField && duplicateValue !== undefined
          ? `${duplicateField} "${duplicateValue}" is already in use.`
          : "A unique signup field already exists.",
    });
  }

  const message = `Duplicate field value: ${duplicateValue}. Please use another value!`;
  return new AppError(message, 400);
};

const handleMulterError = (err, req) => {
  if (!isSignupRequest(req)) {
    return new AppError(err.message || "File upload error", 400);
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    return createSignupError("SIGNUP_PROFILE_PIC_TOO_LARGE");
  }
  return createSignupError("SIGNUP_PROFILE_PIC_INVALID_TYPE", {
    details: { multerCode: err.code },
  });
};

const upgradeSignupOperationalError = (err, req) => {
  if (!isSignupRequest(req)) return err;
  if (err?.code) return err;
  const message = String(err?.message || "").toLowerCase();

  if (message.includes("profile picture") || message.includes("invalid image type")) {
    return createSignupError("SIGNUP_PROFILE_PIC_INVALID_TYPE");
  }
  if (message.includes("phone number 2 must be different")) {
    return createSignupError("SIGNUP_TEACHER_PHONE2_SAME_AS_PHONE1");
  }
  return err;
};

const sendDevError = (err, _req, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    code: err.code,
    field: err.field,
    message: err.message,
    errors: err.errors,
    details: err.details,
    requestId: err.requestId,
    error: err,
    stack: err.stack,
  });
};

const sendProdError = (err, req, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      code: err.code,
      field: err.field,
      message: err.message,
      errors: err.errors,
      details: err.details,
      requestId: err.requestId,
    });
  }

  console.error("Error 💥", err);
  if (isSignupRequest(req)) {
    return res.status(500).json({
      status: "error",
      code: "SIGNUP_UNKNOWN_ERROR",
      message:
        "Signup could not be completed because of an internal server issue. Please retry and share the request ID if the issue persists.",
      requestId: err.requestId,
    });
  }

  return res.status(500).json({
    status: "error",
    message: "Something went wrong!",
    requestId: err.requestId,
  });
};

module.exports = (err, req, res, _next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  ensureRequestId(err, req);

  if (process.env.NODE_ENV === "development") {
    sendDevError(err, req, res);
    return;
  }

  let error = {
    ...err,
    message: err.message,
    name: err.name,
    code: err.code,
    errors: err.errors,
    details: err.details,
    stack: err.stack,
    statusCode: err.statusCode,
    status: err.status,
    field: err.field,
    isOperational: err.isOperational,
    requestId: err.requestId,
  };

  if (error.name === "CastError") error = handleCastErrorDB(error, req);
  if (error.code === 11000) error = handleDuplicateFieldsDB(error, req);
  if (error.name === "ValidationError") error = handleValidationErrorDB(error, req);
  if (error.name === "MulterError") error = handleMulterError(error, req);
  error = upgradeSignupOperationalError(error, req);

  ensureRequestId(error, req);
  sendProdError(error, req, res);
};
