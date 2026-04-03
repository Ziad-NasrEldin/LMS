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
const {
  SESSION_REVOKED_MESSAGE,
  shouldEnforceSingleSession,
} = require("../utils/auth/sessionPolicy.js");

const normalizeRole = (role) =>
  String(role || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const normalizePolicyTargetRole = (role) => {
  const normalized = normalizeRole(role);

  if (["lecturer", "teacher assistant"].includes(normalized)) return "lecturer";
  if (["student", "pupil"].includes(normalized)) return "student";
  if (["parent", "guardian"].includes(normalized)) return "parent";
  if (["teacher", "instructor", "educator", "معلم", "المعلم"].includes(normalized)) {
    return "teacher";
  }

  return normalized;
};

const normalizeActorRoleForPolicy = (role) => {
  const normalized = normalizeRole(role);
  const adminAliases = new Set([
    "admin",
    "subadmin",
    "sub-admin",
    "superadmin",
    "super admin",
    "administrator",
    "moderator",
  ]);
  if (
    adminAliases.has(normalized) ||
    normalized.includes("admin") ||
    normalized.includes("super")
  ) {
    return "admin";
  }
  return normalized;
};

const canImpersonate = (actorRole, targetRole) => {
  const matrix = {
    admin: new Set(["lecturer", "student", "parent", "teacher"]),
    lecturer: new Set(["student", "parent"]),
    assistant: new Set(["student"]),
  };
  const actor = normalizeActorRoleForPolicy(actorRole);
  const target = normalizePolicyTargetRole(targetRole);
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
  event,
  actorId,
  actorName,
  actorRole,
  targetId,
  targetName,
  targetRole,
  sessionId,
  startedAt,
  endedAt,
  durationSeconds,
}) => {
  const normalizedEvent =
    event === "IMPERSONATION_ENDED"
      ? "IMPERSONATION_ENDED"
      : "IMPERSONATION_STARTED";

  const action = normalizedEvent === "IMPERSONATION_STARTED" ? "create" : "delete";
  const nameParts = [
    normalizedEvent,
    `session:${sessionId}`,
    `actor:${actorName || actorId}(${actorRole || "Unknown"})`,
    `target:${targetName || targetId}(${targetRole || "Unknown"})`,
  ];
  if (typeof durationSeconds === "number") {
    nameParts.push(`duration:${durationSeconds}s`);
  }
  const resourceName = nameParts.join(" | ");

  const metadata = {
    event: normalizedEvent,
    actorId: actorId ? String(actorId) : null,
    actorName: actorName || null,
    actorRole: actorRole || null,
    targetId: targetId ? String(targetId) : null,
    targetName: targetName || null,
    targetRole: targetRole || null,
    sessionId: sessionId || null,
    startedAt: startedAt || null,
    endedAt: endedAt || null,
    durationSeconds:
      typeof durationSeconds === "number" ? durationSeconds : null,
  };

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
        name: resourceName,
        details: {
          name: resourceName,
          ...metadata,
        },
      },
      description: normalizedEvent,
      metadata,
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
  const enforceSingleSession = shouldEnforceSingleSession({
    role: refreshUserRole,
    impersonation,
  });
  const tokenSessionId = decoded.UserInfo?.sessionId;

  if (enforceSingleSession && !tokenSessionId) {
    return next(new AppError(SESSION_REVOKED_MESSAGE, 401));
  }

  const refreshTokenQuery = enforceSingleSession
    ? { user: refreshUserId, sessionId: tokenSessionId }
    : { user: refreshUserId };

  const refreshToken = await RefreshToken.findOne(refreshTokenQuery);

  if (!refreshToken?.token) {
    if (enforceSingleSession) {
      return next(new AppError(SESSION_REVOKED_MESSAGE, 401));
    }

    return next(
      new AppError("Refresh token not found, please login again", 401)
    );
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
      await RefreshToken.deleteMany(refreshTokenQuery);
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
    : enforceSingleSession
      ? generateAccessToken(refreshUserId, refreshUserRole, {
        sessionId: tokenSessionId,
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
  const normalizedActorRole = normalizeActorRoleForPolicy(actor.role);
  const normalizedRequestedTargetRole = normalizePolicyTargetRole(targetRole);
  if (!canImpersonate(actor.role, targetRole)) {
    return next(
      new AppError(
        `Forbidden. ${actor.role} cannot impersonate ${targetRole}. (policy actor:${normalizedActorRole} target:${normalizedRequestedTargetRole})`,
        403
      )
    );
  }

  const target = await User.findById(targetUserId).select("name role");
  if (!target) {
    return next(new AppError("Target user not found", 404));
  }

  if (
    normalizePolicyTargetRole(target.role) !==
    normalizePolicyTargetRole(targetRole)
  ) {
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
    event: "IMPERSONATION_STARTED",
    actorId: actor._id,
    actorName: actor.name,
    actorRole: actor.role,
    targetId: target._id,
    targetName: target.name,
    targetRole: target.role,
    sessionId,
    startedAt,
  });

  return res.status(200).json({
    status: "success",
    success: true,
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
  const endedAt = new Date().toISOString();
  const startedAtDate = impersonation.startedAt
    ? new Date(impersonation.startedAt)
    : null;
  const durationSeconds =
    startedAtDate && !Number.isNaN(startedAtDate.getTime())
      ? Math.max(0, Math.round((Date.now() - startedAtDate.getTime()) / 1000))
      : null;

  await createImpersonationAuditLog({
    event: "IMPERSONATION_ENDED",
    actorId: actor._id,
    actorName: actor.name,
    actorRole: actor.role,
    targetId: impersonation.targetId,
    targetName: impersonation.targetName,
    targetRole: impersonation.targetRole,
    sessionId: impersonation.sessionId,
    startedAt: impersonation.startedAt || null,
    endedAt,
    durationSeconds,
  });

  return res.status(200).json({
    status: "success",
    success: true,
    accessToken,
    sessionId: impersonation.sessionId,
    actor: {
      id: actor._id,
      role: actor.role,
      name: actor.name,
    },
    target: {
      id: impersonation.targetId,
      role: impersonation.targetRole,
      name: impersonation.targetName,
    },
    startedAt: impersonation.startedAt || null,
    endedAt,
    durationSeconds,
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
