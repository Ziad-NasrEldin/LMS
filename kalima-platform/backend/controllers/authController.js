const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel.js");
const AuditLog = require("../models/auditLogModel.js");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { generateAccessToken } = require("../utils/tokens/generateTokens.js");
const { sendToken } = require("../utils/tokens/sendToken.js");
const RefreshToken = require("../models/refreshTokenModel.js");

const normalizeRole = (role) => String(role || "").trim().toLowerCase();

const normalizeActorRoleForPolicy = (role) => {
  const normalized = normalizeRole(role);
  if (normalized === "admin" || normalized === "subadmin") return "admin";
  return normalized;
};

const canImpersonate = (actorRole, targetRole) => {
  const matrix = {
    admin: new Set(["lecturer", "student", "parent"]),
    lecturer: new Set(["student", "parent"]),
    assistant: new Set(["student"]),
  };
  const actor = normalizeActorRoleForPolicy(actorRole);
  const target = normalizeRole(targetRole);
  return matrix[actor]?.has(target) || false;
};

const decodeAccessTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (!token) return null;

  try {
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, {
      ignoreExpiration: true,
    });
  } catch (_error) {
    return null;
  }
};

const createImpersonationAuditLog = async ({
  action,
  actorId,
  actorName,
  actorRole,
  targetId,
  targetName,
  targetRole,
  sessionId,
}) => {
  try {
    await AuditLog.create({
      user: {
        userId: actorId,
        name: actorName || "Unknown",
        role: actorRole || "Unknown",
      },
      action,
      resource: {
        type: "impersonation",
        id: targetId,
        name: `session:${sessionId} actor:${actorName || actorId} target:${targetName || targetId
          } role:${targetRole}`,
      },
      status: "success",
    });
  } catch (auditError) {
    console.error("Failed to write impersonation audit log:", auditError);
  }
};

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

  await sendToken(foundUser, res);
});

const refresh = catchAsync(async (req, res, next) => {
  const decoded = decodeAccessTokenFromRequest(req);

  if (!decoded?.UserInfo?.id) {
    return next(new AppError("Access token required", 401));
  }

  const impersonation = decoded.UserInfo.impersonation;
  const isImpersonating = impersonation?.isActive === true;

  const refreshUserId = isImpersonating
    ? impersonation.actorId
    : decoded.UserInfo.id;
  const refreshUserRole = isImpersonating
    ? impersonation.actorRole
    : decoded.UserInfo.role;

  const refreshToken = await RefreshToken.findOne({
    user: refreshUserId,
  });

  if (!refreshToken?.token) {
    return next(new AppError("Refresh token not found, please login again", 401));
  }

  const currentUserRefreshToken = refreshToken.token;

  let decodedRefreshToken;
  try {
    decodedRefreshToken = jwt.verify(
      currentUserRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
  } catch (err) {
    if (err.name === "TokenExpiredError" || !decodedRefreshToken) {
      await RefreshToken.deleteOne({ user: refreshUserId });
      return next(
        new AppError("Refresh token is expired, plese login again", 401)
      );
    }
  }

  const newAccessToken = isImpersonating
    ? generateAccessToken(decoded.UserInfo.id, decoded.UserInfo.role, {
      impersonation: {
        ...impersonation,
      },
    })
    : generateAccessToken(refreshUserId, refreshUserRole);

  return res.status(200).json({ accessToken: newAccessToken });
});

const logout = catchAsync(async (req, res) => {
  if (req.user?._id == null) {
    return res.json({ message: "You are not logged in." });
  }

  const decoded = decodeAccessTokenFromRequest(req);
  const impersonation = decoded?.UserInfo?.impersonation;
  const logoutUserId =
    impersonation?.isActive && impersonation.actorId
      ? impersonation.actorId
      : req.user._id;

  await RefreshToken.deleteMany({ user: logoutUserId });
  return res.json({ message: "Logged out successfully" });
});

const startImpersonation = catchAsync(async (req, res, next) => {
  const { targetUserId, targetRole } = req.body;

  if (!targetUserId || !targetRole) {
    return next(new AppError("targetUserId and targetRole are required", 400));
  }

  const decoded = decodeAccessTokenFromRequest(req);
  if (!decoded?.UserInfo?.id || !decoded?.UserInfo?.role) {
    return next(new AppError("Unauthorized", 401));
  }

  if (decoded.UserInfo?.impersonation?.isActive) {
    return next(
      new AppError("Nested impersonation is not allowed. Exit current view first.", 400)
    );
  }

  const actor = req.user;
  if (!canImpersonate(actor.role, targetRole)) {
    return next(
      new AppError(
        `Forbidden. ${actor.role} cannot impersonate ${targetRole}.`,
        403
      )
    );
  }

  const target = await User.findById(targetUserId).select("name role");
  if (!target) {
    return next(new AppError("Target user not found", 404));
  }

  if (normalizeRole(target.role) !== normalizeRole(targetRole)) {
    return next(
      new AppError(
        `Target user role mismatch. Requested ${targetRole}, but user is ${target.role}.`,
        400
      )
    );
  }

  const sessionId = crypto.randomUUID();
  const startedAt = new Date().toISOString();

  const impersonationData = {
    isActive: true,
    sessionId,
    actorId: actor._id.toString(),
    actorRole: actor.role,
    actorName: actor.name,
    targetId: target._id.toString(),
    targetRole: target.role,
    targetName: target.name,
    startedAt,
  };

  const accessToken = generateAccessToken(target._id, target.role, {
    impersonation: impersonationData,
  });

  await createImpersonationAuditLog({
    action: "create",
    actorId: actor._id,
    actorName: actor.name,
    actorRole: actor.role,
    targetId: target._id,
    targetName: target.name,
    targetRole: target.role,
    sessionId,
  });

  return res.status(200).json({
    status: "success",
    accessToken,
    sessionId,
    actor: {
      id: actor._id,
      role: actor.role,
      name: actor.name,
    },
    target: {
      id: target._id,
      role: target.role,
      name: target.name,
    },
    startedAt,
  });
});

const stopImpersonation = catchAsync(async (req, res, next) => {
  const decoded = decodeAccessTokenFromRequest(req);
  const impersonation = decoded?.UserInfo?.impersonation;

  if (!impersonation?.isActive) {
    return next(new AppError("No active impersonation session found", 400));
  }

  const requestedSessionId = req.body?.sessionId;
  if (requestedSessionId && requestedSessionId !== impersonation.sessionId) {
    return next(new AppError("Impersonation session mismatch", 400));
  }

  const actor = await User.findById(impersonation.actorId).select("name role");
  if (!actor) {
    return next(new AppError("Impersonation actor not found", 404));
  }

  const accessToken = generateAccessToken(actor._id, actor.role);

  await createImpersonationAuditLog({
    action: "delete",
    actorId: actor._id,
    actorName: actor.name,
    actorRole: actor.role,
    targetId: impersonation.targetId,
    targetName: impersonation.targetName,
    targetRole: impersonation.targetRole,
    sessionId: impersonation.sessionId,
  });

  return res.status(200).json({
    status: "success",
    accessToken,
    actor: {
      id: actor._id,
      role: actor.role,
      name: actor.name,
    },
    endedAt: new Date().toISOString(),
  });
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

const optionalJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const currentUser = await User.findById(decoded.UserInfo.id).select(
      "-password"
    );

    if (currentUser) {
      req.user = currentUser;
    }
  } catch (_err) {
    // Intentionally continue without auth context.
  }

  next();
};

module.exports = {
  login,
  refresh,
  logout,
  startImpersonation,
  stopImpersonation,
  verifyRoles,
  optionalJWT,
};
