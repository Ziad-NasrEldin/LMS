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

const Lesson = require("../models/lessonModel");
const ECSection = require("../models/ec.sectionModel");
const ECProduct = require("../models/ec.productModel");
const ECPurchase = require("../models/ec.purchaseModel");

// Helper function to enrich audit logs with readable resource data
const enrichAuditLogs = async (logs) => {
  const User = require("../models/userModel");
  const userCache = new Map();
  const resourceCache = new Map();

  const getUserById = async (userId) => {
    const key = userId.toString();

    if (!userCache.has(key)) {
      userCache.set(
        key,
        User.findById(userId)
          .lean()
          .catch(() => null)
      );
    }

    return userCache.get(key);
  };

  const getResourceDetails = async (resourceType, resourceId) => {
    const cacheKey = `${resourceType}:${resourceId}`;

    if (resourceCache.has(cacheKey)) {
      return resourceCache.get(cacheKey);
    }

    const detailsPromise = (async () => {
      switch (resourceType) {
        case "center": {
          const center = await Center.findById(resourceId).lean();
          return center
            ? {
              name: center.name,
              location: center.location
            }
            : null;
        }

        case "code": {
          const code = await Code.findById(resourceId).lean();
          return code
            ? {
              code: code.code,
              type: code.type,
              isRedeemed: code.isRedeemed
            }
            : null;
        }

        case "container": {
          const container = await Container.findById(resourceId)
            .populate("subject", "name")
            .populate("level", "name")
            .lean();
          return container
            ? {
              name: container.name,
              type: container.type,
              subject: container.subject?.name || "Unknown",
              level: container.level?.name || "Unknown"
            }
            : null;
        }

        case "moderator": {
          const moderator = await Moderator.findById(resourceId).lean();
          return moderator
            ? {
              name: moderator.name,
              email: moderator.email
            }
            : null;
        }

        case "subAdmin": {
          const subAdmin = await SubAdmin.findById(resourceId).lean();
          return subAdmin
            ? {
              name: subAdmin.name,
              email: subAdmin.email
            }
            : null;
        }

        case "assistant": {
          const assistant = await Assistant.findById(resourceId)
            .populate("assignedLecturer", "name")
            .lean();
          return assistant
            ? {
              name: assistant.name,
              email: assistant.email,
              assignedTo: assistant.assignedLecturer?.name || "Unknown"
            }
            : null;
        }

        case "admin": {
          const admin = await Admin.findById(resourceId).lean();
          return admin
            ? {
              name: admin.name,
              email: admin.email
            }
            : null;
        }

        case "lecturer": {
          const lecturer = await Lecturer.findById(resourceId).lean();
          return lecturer
            ? {
              name: lecturer.name,
              email: lecturer.email,
              expertise: lecturer.expertise
            }
            : null;
        }

        case "lesson": {
          const lesson = await Lesson.findById(resourceId)
            .populate("subject", "name")
            .populate("level", "name")
            .populate("lecturer", "name")
            .lean();
          return lesson
            ? {
              subject: lesson.subject?.name || "Unknown",
              level: lesson.level?.name || "Unknown",
              lecturer: lesson.lecturer?.name || "Unknown",
              startTime: lesson.startTime
            }
            : null;
        }

        case "ec.section": {
          const ecSection = await ECSection.findById(resourceId).lean();
          return ecSection
            ? {
              name: ecSection.name,
              description: ecSection.description,
              isActive: ecSection.isActive,
              allowedRoles: ecSection.allowedRoles
            }
            : null;
        }

        case "ec.product": {
          const ecProduct = await ECProduct.findById(resourceId)
            .populate("section", "name")
            .lean();
          return ecProduct
            ? {
              title: ecProduct.title,
              description: ecProduct.description,
              price: ecProduct.price,
              section: ecProduct.section?.name || "Unknown",
              isActive: ecProduct.isActive
            }
            : null;
        }

        case "ec.purchase": {
          const ecPurchase = await ECPurchase.findById(resourceId)
            .populate("productId", "title")
            .populate("createdBy", "name email")
            .populate("confirmedBy", "name email")
            .lean();
          return ecPurchase
            ? {
              purchaseSerial: ecPurchase.purchaseSerial,
              productName: ecPurchase.productName || ecPurchase.productId?.title,
              price: ecPurchase.price,
              userName: ecPurchase.userName,
              confirmed: ecPurchase.confirmed,
              confirmedBy: ecPurchase.confirmedBy?.name || null,
              createdBy: ecPurchase.createdBy?.name || "Unknown"
            }
            : null;
        }

        default:
          return null;
      }
    })().catch((error) => {
      console.error(`Error enriching ${resourceType} with ID ${resourceId}:`, error);
      return null;
    });

    resourceCache.set(cacheKey, detailsPromise);
    return detailsPromise;
  };

  const enrichedLogs = await Promise.all(
    logs.map(async (log) => {
      const enrichedLog = typeof log.toObject === "function" ? log.toObject() : { ...log };

      // Populate user info if userId exists
      if (enrichedLog.user && enrichedLog.user.userId) {
        const userDoc = await getUserById(enrichedLog.user.userId);
        if (userDoc) {
          enrichedLog.user = {
            userId: userDoc._id,
            name: userDoc.name,
            email: userDoc.email,
            role: userDoc.role
          };
        }
      }

      if (enrichedLog.resource && enrichedLog.resource.id) {
        const resourceId = enrichedLog.resource.id;
        const resourceType = enrichedLog.resource.type;

        const details = await getResourceDetails(resourceType, resourceId);
        if (details) {
          enrichedLog.resource.details = details;
        }
      }

      return enrichedLog;
    })
  );

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
    "assistant", "admin", "lecturer", "lesson",
    "timetable", "center-lesson", "ec.section", "ec.product", "ec.purchase",
    "impersonation"
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
    "assistant", "admin", "lecturer", "lesson",
    "timetable", "center-lesson", "ec.section", "ec.product", "ec.purchase",
    "impersonation"
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

