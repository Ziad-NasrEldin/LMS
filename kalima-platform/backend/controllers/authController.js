const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel.js");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const Container = require("../models/containerModel.js");
const { generateAccessToken } = require("../utils/tokens/generateTokens.js");
const { sendToken } = require("../utils/tokens/sendToken.js");
const RefreshToken = require("../models/refreshTokenModel.js");

const login = catchAsync(async (req, res, next) => {
  const { email, phoneNumber, password } = req.body;

  if (!((email && password) || (phoneNumber && password))) {
    return next(
      new AppError(
        "Please provide either email and password or phone number and password.",
        400
      )
    );
  }

  const newMail = email ? email.toLowerCase() : null;
  const newPhoneNumber = phoneNumber ? phoneNumber.toLowerCase() : null;

  const foundUser = email
    ? await User.findOne({ email: newMail })
    : await User.findOne({ phoneNumber: newPhoneNumber });

  if (!foundUser) {
    return next(
      new AppError(
        `Couldn't find a user with this ${newMail ? "email" : "phone number"
        } and password.`,
        400
      )
    );
  }

  const match = await bcrypt.compare(password, foundUser.password);

  if (!match) {
    return next(
      new AppError(
        `Couldn't find a user with this ${newMail ? "email" : "phone number"
        } and password.`,
        400
      )
    );
  }

  // The check for existing tokens is now handled in sendToken function
  await sendToken(foundUser, res);
});

const refresh = catchAsync(async (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    return next(new AppError("Access token required", 401));
  }
  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, {
    ignoreExpiration: true,
  });
  const userId = decoded.UserInfo.id;
  const userRole = decoded.UserInfo.role;

  const refreshToken = await RefreshToken.findOne({
    user: userId,
  });

  const currentUserRefreshToken = refreshToken.token;

  let decodedRefreshToken;
  try {
    decodedRefreshToken = jwt.verify(
      currentUserRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
  } catch (err) {
    if (err.name === "TokenExpiredError" || !decodedRefreshToken) {
      await RefreshToken.deleteOne({ user: userId });
      return next(
        new AppError("Refresh token is expired, plese login again", 401)
      );
    }
  }

  const newAccessToken = generateAccessToken(userId, userRole);

  return res.status(200).json({ accessToken: newAccessToken });
});

const logout = catchAsync(async (req, res, next) => {
  if (req.user._id == null) {
    return res.json({ message: "You are not logged in." });
  }
  await RefreshToken.deleteMany({ user: req.user._id });
  return res.json({ message: "Logged out successfully" });
});

const verifyRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    const Role = req.user.role?.toLowerCase();
    if (!Role) {
      return next(new AppError("Unauthorized", 401));
    }

    const rolesArray = allowedRoles.map((role) => role.toLowerCase());
    if (!rolesArray.includes(Role)) {
      return next(
        new AppError(
          `Forbidden, you are a ${Role} and don't have access to this resource.`,
          403
        )
      );
    }
    next();
  };
};

// Middleware to optionally verify JWT
// This middleware attempts to verify the JWT if provided, but continues either way
const optionalJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  // If no auth header is provided, continue without authentication
  if (!authHeader?.startsWith("Bearer ")) {
    return next(); // Continue without authentication
  }

  const token = authHeader.split(" ")[1];

  try {
    // Try to verify token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // If token is valid, set req.user
    const currentUser = await User.findById(decoded.UserInfo.id).select(
      "-password"
    );

    if (currentUser) {
      req.user = currentUser;
    }
  } catch (err) {
    // If token verification fails, continue without setting req.user
    // No error is thrown, the route will work as unauthenticated
  }

  // Continue to the next middleware or route handler
  next();
};

module.exports = { login, refresh, logout, verifyRoles, optionalJWT };
