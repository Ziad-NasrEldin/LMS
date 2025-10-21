const express = require("express");
const auditLogController = require("../controllers/auditLogController");
const verifyJWT = require("../middleware/verifyJWT");
const authController = require("../controllers/authController");

const router = express.Router();

// Protect all routes and restrict to admin roles
router.use(verifyJWT, authController.verifyRoles("Admin", "SubAdmin", "Moderator"));

// Get all audit logs with filtering, sorting and pagination
router.get("/", auditLogController.getAllAuditLogs);

// Get logs for specific resource type
router.get("/resource/:resourceType", auditLogController.getResourceAuditLogs);

// Get logs for specific user by email
router.get("/user/email/:email", auditLogController.getUserAuditLogsByEmail);

// Get logs for specific resource instance
router.get("/resource/:resourceType/:resourceId", auditLogController.getResourceInstanceAuditLogs);

module.exports = router;