const jwt = require("jsonwebtoken");
const AppError = require("../utils/appError");
const User = require("../models/userModel");
const RefreshToken = require("../models/refreshTokenModel");
const {
  SESSION_REVOKED_MESSAGE,
  shouldEnforceSingleSession,
} = require("../utils/auth/sessionPolicy.js");

const verifyJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(new AppError("Unauthorized", 401));
  }

  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new AppError("Access token expired", 401));
    }
    return next(new AppError("Forbidden", 403));
  }

  const currentUser = await User.findById(decoded.UserInfo.id).select(
    "-password"
  );

  if (!currentUser) {
    return next(
      new AppError(
        "The user associated with this token no longer exists. Please log in again.",
        401
      )
    );
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        "User has recently changed their password. Please log in again.",
        401
      )
    );
  }

  const enforceSingleSession = shouldEnforceSingleSession({
    role: decoded.UserInfo?.role,
    impersonation: decoded.UserInfo?.impersonation,
  });

  if (enforceSingleSession) {
    const tokenSessionId = decoded.UserInfo?.sessionId;

    if (!tokenSessionId) {
      return next(new AppError(SESSION_REVOKED_MESSAGE, 401));
    }

    const activeSession = await RefreshToken.findOne({
      user: decoded.UserInfo.id,
      sessionId: tokenSessionId,
    }).select("_id");

    if (!activeSession) {
      return next(new AppError(SESSION_REVOKED_MESSAGE, 401));
    }
  }

  //logging the logged in user's information
  req.user = currentUser;
  // console.log("Authenticated User:", {
  //   id: req.user._id.toString(), // 67e4b08442290f1d7b5eaeb8
  //   _id: req.user._id, // new ObjectId('67e4b08442290f1d7b5eaeb8')
  //   role: req.user.role, // Student
  //   email: req.user.email, // abmawogud@example.com
  // });

  // console.log("req.user", req.user);
  /**
  req.user {
  _id: new ObjectId('67e4b08442290f1d7b5eaeb8'),
  name: 'abmawogud student',
  gender: 'male',
  email: 'abmawogud@example.com',
  role: 'Student',
  level: 'first secondary',
  phoneNumber: '01205215565',
  teacherPoints: [],
  createdAt: 2025-03-27T01:57:24.078Z,
  updatedAt: 2025-03-27T02:25:17.139Z,
  sequencedId: 1000008,
  __v: 0,
  passwordChangedAt: 2025-03-27T02:25:16.139Z
}
  */

  next();
};

module.exports = verifyJWT;

/*
const jwt = require('jsonwebtoken');

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  
  jwt.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET,
    (err, decoded) => {
      if (err) {
        console.log('JWT verification error:', err);
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      
      // Create user property on request with both standard formats
      req.user = {
        id: decoded.UserInfo.id || decoded.UserInfo._id,
        _id: decoded.UserInfo.id || decoded.UserInfo._id,
        role: decoded.UserInfo.role,
        email: decoded.UserInfo.email
      };
      next();
    }
  );
};

module.exports = verifyJWT;
*/
