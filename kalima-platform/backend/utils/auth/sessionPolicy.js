const END_USER_ROLES = new Set(["student", "parent", "teacher"]);
const SESSION_REVOKED_MESSAGE =
  "Session has been replaced by a newer login. Please login again.";

const normalizeRole = (role) =>
  String(role || "")
    .toLowerCase()
    .replace(/[_\-\s]+/g, "")
    .trim();

const isEndUserRole = (role) => END_USER_ROLES.has(normalizeRole(role));

const shouldEnforceSingleSession = ({ role, impersonation } = {}) =>
  isEndUserRole(role) && impersonation?.isActive !== true;

module.exports = {
  SESSION_REVOKED_MESSAGE,
  isEndUserRole,
  shouldEnforceSingleSession,
};
