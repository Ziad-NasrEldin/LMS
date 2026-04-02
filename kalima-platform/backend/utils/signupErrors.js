const AppError = require("./appError");

const SIGNUP_ERROR_CATALOG = Object.freeze({
  SIGNUP_VALIDATION_FAILED: {
    statusCode: 400,
    message: "Signup validation failed. Please review the highlighted fields.",
  },
  SIGNUP_FIELD_REQUIRED: { statusCode: 400, message: "This field is required for signup." },
  SIGNUP_FIELD_INVALID: { statusCode: 400, message: "This field is invalid for signup." },
  SIGNUP_FIELD_NOT_ALLOWED: { statusCode: 400, message: "This field is not allowed for signup." },
  SIGNUP_FIELD_CONFLICT: { statusCode: 409, message: "This value is already in use." },
  SIGNUP_INVALID_ROLE: { statusCode: 400, field: "role", message: "Invalid role selected for signup." },
  SIGNUP_EMAIL_REQUIRED: { statusCode: 400, field: "email", message: "Email address is required." },
  SIGNUP_EMAIL_ALREADY_EXISTS: {
    statusCode: 409,
    field: "email",
    message: "This email is already associated with an existing account.",
  },
  SIGNUP_PASSWORD_TOO_SHORT: {
    statusCode: 400,
    field: "password",
    message: "Password must be at least 8 characters long.",
  },
  SIGNUP_PASSWORD_MISMATCH: {
    statusCode: 400,
    field: "confirmPassword",
    message: "Password and confirmation do not match.",
  },
  SIGNUP_PHONE_REQUIRED: {
    statusCode: 400,
    field: "phoneNumber",
    message: "A valid phone number is required for signup.",
  },
  SIGNUP_PHONE_INVALID: {
    statusCode: 400,
    field: "phoneNumber",
    message: "Phone number format is invalid.",
  },
  SIGNUP_PHONE_ALREADY_EXISTS: {
    statusCode: 409,
    field: "phoneNumber",
    message: "This phone number is already associated with an existing account.",
  },
  SIGNUP_PHONE2_INVALID: {
    statusCode: 400,
    field: "phoneNumber2",
    message: "Secondary phone number format is invalid.",
  },
  SIGNUP_PHONE2_DUPLICATE: {
    statusCode: 409,
    field: "phoneNumber2",
    message: "This secondary phone number is already in use.",
  },
  SIGNUP_GOVERNMENT_REQUIRED: {
    statusCode: 400,
    field: "government",
    message: "Government is required.",
  },
  SIGNUP_GOVERNMENT_INVALID: {
    statusCode: 400,
    field: "government",
    message: "Selected government is invalid.",
  },
  SIGNUP_ADMIN_ZONE_REQUIRED: {
    statusCode: 400,
    field: "administrationZone",
    message: "Administration zone is required.",
  },
  SIGNUP_ADMIN_ZONE_INVALID: {
    statusCode: 400,
    field: "administrationZone",
    message: "Selected administration zone is invalid for the selected government.",
  },
  SIGNUP_LOCATION_VALIDATION_FAILED: {
    statusCode: 500,
    message: "Location validation failed due to a server-side validation error.",
  },
  SIGNUP_PROFILE_PIC_INVALID_TYPE: {
    statusCode: 400,
    field: "profilePic",
    message: "Profile picture must be a valid image file type.",
  },
  SIGNUP_PROFILE_PIC_TOO_LARGE: {
    statusCode: 413,
    field: "profilePic",
    message: "Profile picture exceeds the maximum allowed size.",
  },
  SIGNUP_CHILD_REFERENCE_INVALID: {
    statusCode: 400,
    field: "children",
    message: "One or more child references are invalid.",
  },
  SIGNUP_TEACHER_SUBJECT_REQUIRED: {
    statusCode: 400,
    field: "subject",
    message: "Teacher subject is required.",
  },
  SIGNUP_TEACHER_LEVEL_REQUIRED: {
    statusCode: 400,
    field: "level",
    message: "At least one teaching level is required for teacher signup.",
  },
  SIGNUP_TEACHER_LEVEL_INVALID: {
    statusCode: 400,
    field: "level",
    message: "One or more selected teacher levels are invalid.",
  },
  SIGNUP_TEACHER_LEVEL_INACTIVE: {
    statusCode: 400,
    field: "level",
    message: "One or more selected teacher levels are inactive.",
  },
  SIGNUP_TEACHER_LEVEL_KIND_INVALID: {
    statusCode: 400,
    field: "level",
    message: "Teachers can only select stage-level entries.",
  },
  SIGNUP_TEACHER_TEACHES_AT_TYPE_REQUIRED: {
    statusCode: 400,
    field: "teachesAtType",
    message: "Teacher must specify where they teach (Center, School, or Both).",
  },
  SIGNUP_TEACHER_CENTERS_REQUIRED: {
    statusCode: 400,
    field: "centers",
    message: "At least one center is required for the selected teaching type.",
  },
  SIGNUP_TEACHER_SCHOOL_REQUIRED: {
    statusCode: 400,
    field: "school",
    message: "School is required for the selected teaching type.",
  },
  SIGNUP_TEACHER_SOCIAL_MEDIA_NOT_ARRAY: {
    statusCode: 400,
    field: "socialMedia",
    message: "Social media entries must be provided as an array.",
  },
  SIGNUP_TEACHER_SOCIAL_MEDIA_PLATFORM_INVALID: {
    statusCode: 400,
    field: "socialMedia",
    message: "One or more social media platforms are invalid.",
  },
  SIGNUP_TEACHER_PHONE2_SAME_AS_PHONE1: {
    statusCode: 400,
    field: "phoneNumber2",
    message: "Secondary phone number must be different from primary phone number.",
  },
  SIGNUP_PARENT_PROFESSION_REQUIRED: {
    statusCode: 400,
    field: "profession",
    message: "Profession is required for parent signup.",
  },
  SIGNUP_PARENT_LEVEL_INVALID: {
    statusCode: 400,
    field: "level",
    message: "Selected parent level is invalid.",
  },
  SIGNUP_PARENT_LEVEL_INACTIVE: {
    statusCode: 400,
    field: "level",
    message: "Selected parent level is inactive.",
  },
  SIGNUP_STUDENT_STAGE_REQUIRED: {
    statusCode: 400,
    field: "stage",
    message: "Stage is required for student signup.",
  },
  SIGNUP_STUDENT_STAGE_INVALID: {
    statusCode: 400,
    field: "stage",
    message: "Selected student stage is invalid.",
  },
  SIGNUP_STUDENT_LEVEL_REQUIRED: {
    statusCode: 400,
    field: "level",
    message: "Level is required for student signup.",
  },
  SIGNUP_STUDENT_LEVEL_INVALID: {
    statusCode: 400,
    field: "level",
    message: "Selected student level is invalid.",
  },
  SIGNUP_STUDENT_LEVEL_STAGE_MISMATCH: {
    statusCode: 400,
    field: "level",
    message: "Selected grade does not belong to the selected stage.",
  },
  SIGNUP_STUDENT_HOBBY_REQUIRED: {
    statusCode: 400,
    field: "hobby",
    message: "At least one hobby is required for student signup.",
  },
  SIGNUP_STUDENT_HOBBY_INVALID: {
    statusCode: 400,
    field: "hobby",
    message: "Selected hobby is invalid.",
  },
  SIGNUP_STUDENT_PARENT_PHONE_REQUIRED: {
    statusCode: 400,
    field: "parentPhoneNumber",
    message: "Primary parent phone number is required for student signup.",
  },
  SIGNUP_STUDENT_PARENT_PHONE_INVALID: {
    statusCode: 400,
    field: "parentPhoneNumber",
    message: "Primary parent phone number format is invalid.",
  },
  SIGNUP_STUDENT_PARENT_RELATION_REQUIRED: {
    statusCode: 400,
    field: "parentPhoneRelation",
    message: "Primary parent relation is required for student signup.",
  },
  SIGNUP_STUDENT_PARENT_RELATION_INVALID: {
    statusCode: 400,
    field: "parentPhoneRelation",
    message: "Primary parent relation must be mother, father, or other.",
  },
  SIGNUP_STUDENT_PARENT2_PHONE_REQUIRED: {
    statusCode: 400,
    field: "parentPhoneNumber2",
    message: "Additional parent phone number is required when additional relation is provided.",
  },
  SIGNUP_STUDENT_PARENT2_PHONE_INVALID: {
    statusCode: 400,
    field: "parentPhoneNumber2",
    message: "Additional parent phone number format is invalid.",
  },
  SIGNUP_STUDENT_PARENT2_RELATION_REQUIRED: {
    statusCode: 400,
    field: "parentPhoneRelation2",
    message: "Additional parent relation is required when additional parent phone number is provided.",
  },
  SIGNUP_STUDENT_PARENT2_RELATION_INVALID: {
    statusCode: 400,
    field: "parentPhoneRelation2",
    message: "Additional parent relation must be mother, father, or other.",
  },
  SIGNUP_UNKNOWN_ERROR: {
    statusCode: 500,
    message: "Signup could not be completed because of an internal server error.",
  },
});

const isSignupRequest = (req) => {
  const originalUrl = String(req?.originalUrl || "");
  const method = String(req?.method || "").toUpperCase();
  if (originalUrl.includes("/api/v1/register")) return true;
  return originalUrl.includes("/api/v1/users") && method === "POST";
};

const getCatalogEntry = (code) => SIGNUP_ERROR_CATALOG[code] || null;

const createSignupError = (code, overrides = {}) => {
  const catalogEntry = getCatalogEntry(code) || getCatalogEntry("SIGNUP_UNKNOWN_ERROR");
  const statusCode = overrides.statusCode || catalogEntry.statusCode || 500;
  const message = overrides.message || catalogEntry.message || "Signup failed.";
  const field = overrides.field === undefined ? catalogEntry.field : overrides.field;

  return new AppError(message, statusCode, {
    code,
    field,
    errors: overrides.errors,
    details: overrides.details,
  });
};

const createSignupValidationError = (errors = [], overrides = {}) =>
  createSignupError("SIGNUP_VALIDATION_FAILED", {
    ...overrides,
    errors,
    field: undefined,
    message:
      overrides.message ||
      "Signup validation failed. Please fix the highlighted fields and try again.",
  });

const normalizeFieldFromPath = (pathValue) => {
  if (Array.isArray(pathValue) && pathValue.length > 0) {
    return String(pathValue[0] || "").trim();
  }
  if (typeof pathValue === "string" && pathValue.trim()) {
    return pathValue.split(".")[0];
  }
  return "";
};

const pickByRoleAndField = (map, role, field) => {
  if (!field) return null;
  const normalizedRole = String(role || "").toLowerCase();
  if (map[normalizedRole] && map[normalizedRole][field]) return map[normalizedRole][field];
  if (map["*"] && map["*"][field]) return map["*"][field];
  return null;
};

const REQUIRED_CODE_BY_ROLE_AND_FIELD = {
  "*": {
    email: "SIGNUP_EMAIL_REQUIRED",
    phoneNumber: "SIGNUP_PHONE_REQUIRED",
    government: "SIGNUP_GOVERNMENT_REQUIRED",
    administrationZone: "SIGNUP_ADMIN_ZONE_REQUIRED",
    role: "SIGNUP_INVALID_ROLE",
  },
  teacher: {
    subject: "SIGNUP_TEACHER_SUBJECT_REQUIRED",
    level: "SIGNUP_TEACHER_LEVEL_REQUIRED",
    teachesAtType: "SIGNUP_TEACHER_TEACHES_AT_TYPE_REQUIRED",
    centers: "SIGNUP_TEACHER_CENTERS_REQUIRED",
    school: "SIGNUP_TEACHER_SCHOOL_REQUIRED",
  },
  parent: {
    profession: "SIGNUP_PARENT_PROFESSION_REQUIRED",
  },
  student: {
    stage: "SIGNUP_STUDENT_STAGE_REQUIRED",
    level: "SIGNUP_STUDENT_LEVEL_REQUIRED",
    hobby: "SIGNUP_STUDENT_HOBBY_REQUIRED",
    parentPhoneNumber: "SIGNUP_STUDENT_PARENT_PHONE_REQUIRED",
    parentPhoneRelation: "SIGNUP_STUDENT_PARENT_RELATION_REQUIRED",
    parentPhoneNumber2: "SIGNUP_STUDENT_PARENT2_PHONE_REQUIRED",
    parentPhoneRelation2: "SIGNUP_STUDENT_PARENT2_RELATION_REQUIRED",
  },
};

const INVALID_CODE_BY_ROLE_AND_FIELD = {
  "*": {
    phoneNumber: "SIGNUP_PHONE_INVALID",
    phoneNumber2: "SIGNUP_PHONE2_INVALID",
    government: "SIGNUP_GOVERNMENT_INVALID",
    administrationZone: "SIGNUP_ADMIN_ZONE_INVALID",
  },
  teacher: {
    level: "SIGNUP_TEACHER_LEVEL_INVALID",
    socialMedia: "SIGNUP_TEACHER_SOCIAL_MEDIA_PLATFORM_INVALID",
  },
  parent: {
    level: "SIGNUP_PARENT_LEVEL_INVALID",
  },
  student: {
    stage: "SIGNUP_STUDENT_STAGE_INVALID",
    level: "SIGNUP_STUDENT_LEVEL_INVALID",
    hobby: "SIGNUP_STUDENT_HOBBY_INVALID",
    parentPhoneNumber: "SIGNUP_STUDENT_PARENT_PHONE_INVALID",
    parentPhoneRelation: "SIGNUP_STUDENT_PARENT_RELATION_INVALID",
    parentPhoneNumber2: "SIGNUP_STUDENT_PARENT2_PHONE_INVALID",
    parentPhoneRelation2: "SIGNUP_STUDENT_PARENT2_RELATION_INVALID",
  },
};

const mapJoiDetailToSignupItem = (detail, role) => {
  const field = normalizeFieldFromPath(detail?.path);
  const type = String(detail?.type || "");
  let code = null;

  if (type === "any.required") {
    code = pickByRoleAndField(REQUIRED_CODE_BY_ROLE_AND_FIELD, role, field) || "SIGNUP_FIELD_REQUIRED";
  } else if (type === "string.pattern.base" || type === "string.email") {
    code = pickByRoleAndField(INVALID_CODE_BY_ROLE_AND_FIELD, role, field) || "SIGNUP_FIELD_INVALID";
  } else if (type === "any.only") {
    code =
      pickByRoleAndField(INVALID_CODE_BY_ROLE_AND_FIELD, role, field) ||
      (field === "role" ? "SIGNUP_INVALID_ROLE" : "SIGNUP_FIELD_INVALID");
  } else if (type === "array.min") {
    code =
      pickByRoleAndField(REQUIRED_CODE_BY_ROLE_AND_FIELD, role, field) ||
      "SIGNUP_FIELD_REQUIRED";
  } else if (type === "any.unknown") {
    code = "SIGNUP_FIELD_NOT_ALLOWED";
  } else {
    code = pickByRoleAndField(INVALID_CODE_BY_ROLE_AND_FIELD, role, field) || "SIGNUP_FIELD_INVALID";
  }

  const catalogEntry = getCatalogEntry(code) || {};
  return {
    code,
    field: field || catalogEntry.field,
    message: detail?.message || catalogEntry.message || "Invalid signup input.",
    source: "joi",
  };
};

const mapJoiDetailsToSignupItems = (details = [], role) =>
  details.map((detail) => mapJoiDetailToSignupItem(detail, role));

const mapLevelHierarchyAppError = (err, role, field = "level") => {
  const message = String(err?.message || "");
  const normalizedRole = String(role || "").toLowerCase();

  if (message.includes("Level is required for teacher role")) {
    return createSignupError("SIGNUP_TEACHER_LEVEL_REQUIRED");
  }
  if (message.includes("Selected grade does not belong to the selected stage")) {
    return createSignupError("SIGNUP_STUDENT_LEVEL_STAGE_MISMATCH");
  }
  if (message.includes("The selected level is inactive")) {
    if (normalizedRole === "teacher") return createSignupError("SIGNUP_TEACHER_LEVEL_INACTIVE");
    if (normalizedRole === "parent") return createSignupError("SIGNUP_PARENT_LEVEL_INACTIVE");
    return createSignupError("SIGNUP_STUDENT_LEVEL_INVALID");
  }
  if (message.includes("The selected level must be a stage")) {
    return createSignupError("SIGNUP_TEACHER_LEVEL_KIND_INVALID");
  }
  if (message.includes("The selected level must be a grade")) {
    return createSignupError("SIGNUP_STUDENT_LEVEL_INVALID");
  }
  if (message.includes("Invalid level id") || message.includes("There is no level with this id")) {
    if (normalizedRole === "teacher") return createSignupError("SIGNUP_TEACHER_LEVEL_INVALID");
    if (normalizedRole === "parent") return createSignupError("SIGNUP_PARENT_LEVEL_INVALID");
    if (field === "stage") return createSignupError("SIGNUP_STUDENT_STAGE_INVALID");
    return createSignupError("SIGNUP_STUDENT_LEVEL_INVALID");
  }

  return createSignupError("SIGNUP_FIELD_INVALID", {
    message: err?.message || "Level validation failed.",
    field,
  });
};

const mapMongooseValidationIssueToSignupItem = ({ field, message, role }) => {
  const normalizedField = normalizeFieldFromPath(field);
  const normalizedMessage = String(message || "");
  const normalizedRole = String(role || "").toLowerCase();

  if (normalizedField === "phoneNumber2" && normalizedMessage.includes("different from phone number 1")) {
    return { code: "SIGNUP_TEACHER_PHONE2_SAME_AS_PHONE1", field: "phoneNumber2", message: normalizedMessage, source: "mongoose" };
  }
  if (normalizedField === "government") {
    return { code: "SIGNUP_GOVERNMENT_INVALID", field: "government", message: normalizedMessage, source: "mongoose" };
  }
  if (normalizedField === "zone" || normalizedField === "administrationZone") {
    return { code: "SIGNUP_ADMIN_ZONE_INVALID", field: "administrationZone", message: normalizedMessage, source: "mongoose" };
  }
  if (normalizedField === "stage") {
    return { code: "SIGNUP_STUDENT_STAGE_INVALID", field: "stage", message: normalizedMessage, source: "mongoose" };
  }
  if (normalizedField === "level") {
    if (normalizedMessage.includes("does not belong")) {
      return { code: "SIGNUP_STUDENT_LEVEL_STAGE_MISMATCH", field: "level", message: normalizedMessage, source: "mongoose" };
    }
    if (normalizedMessage.includes("inactive")) {
      if (normalizedRole === "teacher") {
        return { code: "SIGNUP_TEACHER_LEVEL_INACTIVE", field: "level", message: normalizedMessage, source: "mongoose" };
      }
      if (normalizedRole === "parent") {
        return { code: "SIGNUP_PARENT_LEVEL_INACTIVE", field: "level", message: normalizedMessage, source: "mongoose" };
      }
    }
    if (normalizedRole === "teacher") {
      return { code: "SIGNUP_TEACHER_LEVEL_INVALID", field: "level", message: normalizedMessage, source: "mongoose" };
    }
    if (normalizedRole === "parent") {
      return { code: "SIGNUP_PARENT_LEVEL_INVALID", field: "level", message: normalizedMessage, source: "mongoose" };
    }
    return { code: "SIGNUP_STUDENT_LEVEL_INVALID", field: "level", message: normalizedMessage, source: "mongoose" };
  }

  if (normalizedMessage.toLowerCase().includes("required")) {
    const requiredCode = pickByRoleAndField(REQUIRED_CODE_BY_ROLE_AND_FIELD, normalizedRole, normalizedField);
    return {
      code: requiredCode || "SIGNUP_FIELD_REQUIRED",
      field: normalizedField || undefined,
      message: normalizedMessage,
      source: "mongoose",
    };
  }

  const invalidCode = pickByRoleAndField(INVALID_CODE_BY_ROLE_AND_FIELD, normalizedRole, normalizedField);
  return {
    code: invalidCode || "SIGNUP_FIELD_INVALID",
    field: normalizedField || undefined,
    message: normalizedMessage,
    source: "mongoose",
  };
};

module.exports = {
  SIGNUP_ERROR_CATALOG,
  isSignupRequest,
  createSignupError,
  createSignupValidationError,
  mapJoiDetailsToSignupItems,
  mapLevelHierarchyAppError,
  mapMongooseValidationIssueToSignupItem,
};
