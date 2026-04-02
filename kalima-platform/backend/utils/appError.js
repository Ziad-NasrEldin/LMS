class AppError extends Error {
  constructor(message, statusCode, options = {}) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    this.code = options.code;
    this.field = options.field;
    this.errors = options.errors;
    this.details = options.details;
    this.requestId = options.requestId;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
