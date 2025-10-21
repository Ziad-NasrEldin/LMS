const AppError = require("../utils/appError");
const path = require("path");
const fs = require('fs/promises')


const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message); // ✅ Get message property
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  //const value = err.message.match(/(["'])(\\?.)*?\1/)[0]
  //const value = err.message.match(/ "(.*?)"/)[0];
  const value = err.keyValue.name;
  console.log(value);

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const sendDevError = async(err, req, res) => {
 
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendProdError = async(err, req, res) => {
  //known trused operational error

  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.error("Error 💥 ", err);
    //unexpected error
    res.status(500).json({
      status: "Error",
      message: "Something went wrong!",
    });
  }
};

// module.exports = (err , req , res , next)=>{

//     err.statusCode = err.statusCode || 500;
//     err.status = err.status || 'error';

//     if (process.env.NODE_ENV === 'development') {
//         sendDevError(err , req,  res)
//       } else if (process.env.NODE_ENV === 'production') {
//         // let error = JSON.parse(JSON.stringify(err));
//         // Copy enumerable properties and explicitly copy critical non-enumerable ones
//         let error = { ...err };
//         error.message = err.message; // Copy the message explicitly
//         error.name = err.name; // Copy the name explicitly
//         error.stack = err.stack; // Preserve the stack trace if needed
//         console.log(error)

//         if(error.name === 'CastError') error = handleCastErrorDB(error)
//         if(error.code === 11000)  error = handleDuplicateFieldsDB(error);
//         if(error.name === 'ValidationError') error =  handleValidationErrorDB(error);
//         sendProdError(error ,req,res)
//       }

// }

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendDevError(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    // Proper error cloning
    let error = Object.create(Object.getPrototypeOf(err));
    error.message = err.message;
    error.name = err.name;
    error.code = err.code;
    error.errors = err.errors;
    error.stack = err.stack;

    if (error.name === "CastError") error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === "ValidationError")
      error = handleValidationErrorDB(error);

    sendProdError(error, req, res);
  }
};
