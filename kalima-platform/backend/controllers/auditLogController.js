const AuditLog = require("../models/auditLogModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const QueryFeatures = require("../utils/queryFeatures");
const mongoose = require("mongoose");

// Models for populating resource data
const Center = require("../models/centerModel");
const Code = require("../models/codeModel");
const Container = require("../models/containerModel");
const Moderator = require("../models/moderatorModel");
const SubAdmin = require("../models/subAdminModel");
const Assistant = require("../models/assistantModel");
const Admin = require("../models/adminModel");
const Lecturer = require("../models/lecturerModel");
const Package = require("../models/packageModel");
const Lesson = require("../models/lessonModel");
const ECSection = require("../models/ec.sectionModel");
const ECProduct = require("../models/ec.productModel");
const ECPurchase = require("../models/ec.purchaseModel");

// Helper function to enrich audit logs with readable resource data
const enrichAuditLogs = async (logs) => {
  const enrichedLogs = [];
  const User = require("../models/userModel");

  for (const log of logs) {
    const enrichedLog = log.toObject();

    // Populate user info if userId exists
    if (enrichedLog.user && enrichedLog.user.userId) {
      try {
        const userDoc = await User.findById(enrichedLog.user.userId).lean();
        if (userDoc) {
          enrichedLog.user = {
            userId: userDoc._id,
            name: userDoc.name,
            email: userDoc.email,
            role: userDoc.role,
            // add more fields if needed
          };
        }
      } catch (err) {
        // If user not found or error, leave as is
      }
    }

    if (enrichedLog.resource && enrichedLog.resource.id) {
      const resourceId = enrichedLog.resource.id;
      const resourceType = enrichedLog.resource.type;

      try {
        switch (resourceType) {
          case "center":
            const center = await Center.findById(resourceId).lean();
            if (center) {
              enrichedLog.resource.details = {
                name: center.name,
                location: center.location
              };
            }
            break;

          case "code":
            const code = await Code.findById(resourceId).lean();
            if (code) {
              enrichedLog.resource.details = {
                code: code.code,
                type: code.type,
                isRedeemed: code.isRedeemed
              };
            }
            break;

          case "container":
            const container = await Container.findById(resourceId)
              .populate("subject", "name")
              .populate("level", "name")
              .lean();
            if (container) {
              enrichedLog.resource.details = {
                name: container.name,
                type: container.type,
                subject: container.subject?.name || "Unknown",
                level: container.level?.name || "Unknown"
              };
            }
            break;

          case "moderator":
            const moderator = await Moderator.findById(resourceId).lean();
            if (moderator) {
              enrichedLog.resource.details = {
                name: moderator.name,
                email: moderator.email
              };
            }
            break;

          case "subAdmin":
            const subAdmin = await SubAdmin.findById(resourceId).lean();
            if (subAdmin) {
              enrichedLog.resource.details = {
                name: subAdmin.name,
                email: subAdmin.email
              };
            }
            break;

          case "assistant":
            const assistant = await Assistant.findById(resourceId)
              .populate("assignedLecturer", "name")
              .lean();
            if (assistant) {
              enrichedLog.resource.details = {
                name: assistant.name,
                email: assistant.email,
                assignedTo: assistant.assignedLecturer?.name || "Unknown"
              };
            }
            break;

          case "admin":
            const admin = await Admin.findById(resourceId).lean();
            if (admin) {
              enrichedLog.resource.details = {
                name: admin.name,
                email: admin.email
              };
            }
            break;

          case "lecturer":
            const lecturer = await Lecturer.findById(resourceId).lean();
            if (lecturer) {
              enrichedLog.resource.details = {
                name: lecturer.name,
                email: lecturer.email,
                expertise: lecturer.expertise
              };
            }
            break;

          case "package":
            const packageItem = await Package.findById(resourceId).lean();
            if (packageItem) {
              enrichedLog.resource.details = {
                name: packageItem.name,
                type: packageItem.type,
                price: packageItem.price
              };
            }
            break;

          case "lesson":
            const lesson = await Lesson.findById(resourceId)
              .populate("subject", "name")
              .populate("level", "name")
              .populate("lecturer", "name")
              .lean();
            if (lesson) {
              enrichedLog.resource.details = {
                subject: lesson.subject?.name || "Unknown",
                level: lesson.level?.name || "Unknown",
                lecturer: lesson.lecturer?.name || "Unknown",
                startTime: lesson.startTime
              };
            }
            break;

          case "ec.section":
            const ecSection = await ECSection.findById(resourceId).lean();
            if (ecSection) {
              enrichedLog.resource.details = {
                name: ecSection.name,
                description: ecSection.description,
                isActive: ecSection.isActive,
                allowedRoles: ecSection.allowedRoles
              };
            }
            break;

          case "ec.product":
            const ecProduct = await ECProduct.findById(resourceId)
              .populate("section", "name")
              .lean();
            if (ecProduct) {
              enrichedLog.resource.details = {
                title: ecProduct.title,
                description: ecProduct.description,
                price: ecProduct.price,
                section: ecProduct.section?.name || "Unknown",
                isActive: ecProduct.isActive
              };
            }
            break;

          case "ec.purchase":
            const ecPurchase = await ECPurchase.findById(resourceId)
              .populate("productId", "title")
              .populate("createdBy", "name email")
              .populate("confirmedBy", "name email")
              .lean();
            if (ecPurchase) {
              enrichedLog.resource.details = {
                purchaseSerial: ecPurchase.purchaseSerial,
                productName: ecPurchase.productName || ecPurchase.productId?.title,
                price: ecPurchase.price,
                userName: ecPurchase.userName,
                confirmed: ecPurchase.confirmed,
                confirmedBy: ecPurchase.confirmedBy?.name || null,
                createdBy: ecPurchase.createdBy?.name || "Unknown"
              };
            }
            break;

          default:
            // No additional details for unhandled resource types
            break;
        }
      } catch (error) {
        console.error(`Error enriching ${resourceType} with ID ${resourceId}:`, error);
        // Continue processing other logs even if one fails
      }
    }

    enrichedLogs.push(enrichedLog);
  }

  return enrichedLogs;
};

// Get all audit logs with filtering, sorting, and pagination
exports.getAllAuditLogs = catchAsync(async (req, res, next) => {
  // Create a base query (do not filter by user.role at DB level)
  const query = AuditLog.find();

  // Apply query features (filtering, sorting, pagination)
  const features = new QueryFeatures(query, req.query)
    .filter()
    .sort()
    .paginate();

  // Execute the query
  let logs = await features.query;

  // Enrich logs with readable data (populates user info)
  let enrichedLogs = await enrichAuditLogs(logs);

  // If filtering by user role, do it after enrichment (when user.role is available)
  if (req.query.role) {
    enrichedLogs = enrichedLogs.filter(log => log.user && log.user.role === req.query.role);
  }

  // Send the response
  res.status(200).json({
    status: 'success',
    results: enrichedLogs.length,
    data: {
      logs: enrichedLogs
    }
  });
});

// Get audit logs for a specific resource type
exports.getResourceAuditLogs = catchAsync(async (req, res, next) => {
  const { resourceType } = req.params;

  // Validate resource type
  const validResourceTypes = [
    "center", "code", "container", "moderator", "subAdmin",
    "assistant", "admin", "lecturer", "package", "lesson",
    "timetable", "center-lesson", "ec.section", "ec.product", "ec.purchase"
  ];

  if (!validResourceTypes.includes(resourceType)) {
    return next(new AppError(`Invalid resource type: ${resourceType}`, 400));
  }

  // Create a base query filtered by resource type
  const query = AuditLog.find({ "resource.type": resourceType });

  // Apply query features
  const features = new QueryFeatures(query, req.query)
    .filter()
    .sort()
    .paginate();

  // Execute the query
  const logs = await features.query;

  // Enrich logs with readable data
  const enrichedLogs = await enrichAuditLogs(logs);

  // Send the response
  res.status(200).json({
    status: 'success',
    results: enrichedLogs.length,
    data: {
      logs: enrichedLogs
    }
  });
});

// Get audit logs for a specific user by email
exports.getUserAuditLogsByEmail = catchAsync(async (req, res, next) => {
  const { email } = req.params;
  const User = require("../models/userModel");
  const user = await User.findOne({ email }).select("_id");
  if (!user) {
    return next(new AppError("User with this email not found", 404));
  }
  // Query logs by userId
  const query = AuditLog.find({ "user.userId": user._id });
  const features = new QueryFeatures(query, req.query)
    .filter()
    .sort()
    .paginate();
  const logs = await features.query;
  const enrichedLogs = await enrichAuditLogs(logs);
  res.status(200).json({
    status: 'success',
    results: enrichedLogs.length,
    data: { logs: enrichedLogs }
  });
});

// Get audit logs for a specific resource ID
exports.getResourceInstanceAuditLogs = catchAsync(async (req, res, next) => {
  const { resourceType, resourceId } = req.params;

  // Validate resource type
  const validResourceTypes = [
    "center", "code", "container", "moderator", "subAdmin",
    "assistant", "admin", "lecturer", "package", "lesson",
    "timetable", "center-lesson", "ec.section", "ec.product", "ec.purchase"
  ];

  if (!validResourceTypes.includes(resourceType)) {
    return next(new AppError(`Invalid resource type: ${resourceType}`, 400));
  }

  // Create a query to find logs for the specific resource
  const query = AuditLog.find({
    "resource.type": resourceType,
    "resource.id": resourceId
  });

  // Apply query features
  const features = new QueryFeatures(query, req.query)
    .filter()
    .sort()
    .paginate();

  // Execute the query
  const logs = await features.query;

  // Enrich logs with readable data
  const enrichedLogs = await enrichAuditLogs(logs);

  // Send the response
  res.status(200).json({
    status: 'success',
    results: enrichedLogs.length,
    data: {
      logs: enrichedLogs
    }
  });
});