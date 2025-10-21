const Container = require("../models/containerModel");
const Purchase = require("../models/purchaseModel");
const mongoose = require("mongoose");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const QueryFeatures = require("../utils/queryFeatures");
const Level = require("../models/levelModel");
const Subject = require("../models/subjectModel");
const Lecturer = require("../models/lecturerModel");
const StudentLectureAccess = require("../models/studentLectureAccessModel");
const NotificationTemplate = require("../models/notificationTemplateModel");
const Notification = require("../models/notification");
const Student = require("../models/studentModel");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const configureCloudinary = require("../config/cloudinaryOptions");

// Configure Cloudinary for container images
configureCloudinary();
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "container-images",
  },
});

// Set up multer for container image uploads
exports.uploadContainerImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for images
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new AppError("Please upload only images", 400), false);
    }
  },
}).single("image");

const checkDoc = async (Model, id, session) => {
  const doc = await Model.findById(id).session(session);
  if (!doc) {
    throw new AppError(`${Model.modelName} not found`, 404);
  }
  return doc;
};
exports.getAccessibleChildContainers = catchAsync(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { studentId, containerId, purchaseId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(studentId) ||
      !mongoose.Types.ObjectId.isValid(containerId) ||
      (purchaseId && !mongoose.Types.ObjectId.isValid(purchaseId))
    ) {
      throw new AppError("Invalid ID provided.", 400);
    }

    let purchasedContainerId;

    if (purchaseId) {
      const purchase = await Purchase.findById(purchaseId)
        .select("container lecture type")
        .session(session);
      if (!purchase) {
        throw new AppError("Purchase not found or unauthorized", 403);
      }
      
      // Handle both container purchases and lecture purchases
      if (purchase.type === "containerPurchase" && purchase.container) {
        purchasedContainerId = purchase.container.toString();
        console.log("Container purchase found, using container ID:", purchasedContainerId);
      } else if (purchase.type === "lecturePurchase" && purchase.lecture) {
        // For lecture purchases, the lecture ID is the container ID
        purchasedContainerId = purchase.lecture.toString();
        console.log("Lecture purchase found, using lecture ID:", purchasedContainerId);
      } else {
        console.log("Invalid purchase type or missing data:", { type: purchase.type, container: purchase.container, lecture: purchase.lecture });
        throw new AppError("Invalid purchase type or missing purchase data", 403);
      }
    }
    //  else {
    //   // Otherwise, fallback to finding any purchase for this student.
    //   const purchase = await Purchase.findOne({
    //     student: studentId,
    //     type: "containerPurchase",
    //   })
    //     .select("container")
    //     .session(session);
    //   if (!purchase) {
    //     throw new AppError("No purchases found for this student", 403);
    //   }
    //   purchasedContainerId = purchase.container.toString();
    // }

    // Traverse upward from the provided container to get its parent chain.
    const containerChainResult = await Container.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(containerId) },
      },
      {
        $graphLookup: {
          from: "containers", // Ensure this matches your actual collection name.
          startWith: "$parent",
          connectFromField: "parent",
          connectToField: "_id",
          as: "parentChain",
        },
      },
    ]).session(session);

    if (!containerChainResult || containerChainResult.length === 0) {
      throw new AppError("Container not found", 404);
    }
    const containerDoc = containerChainResult[0];

    // Build set of container IDs from the container upward.
    const accessibleChainIds = new Set();
    accessibleChainIds.add(containerDoc._id.toString());
    containerDoc.parentChain.forEach((doc) => {
      accessibleChainIds.add(doc._id.toString());
    });

    // Check if the purchased container is in the chain.
    if (!accessibleChainIds.has(purchasedContainerId)) {
      throw new AppError("You do not have access to this container", 403);
    }

    delete containerDoc.parentChain;
    let access;
    if (containerDoc.kind === "Lecture") {
      access = await StudentLectureAccess.findOne({
        student: studentId,
        lecture: containerDoc._id,
      }).session(session);

      if (!access) {
        const remainingViews = containerDoc.numberOfViews !== undefined && containerDoc.numberOfViews !== null 
          ? containerDoc.numberOfViews 
          : 3; // Default to 3 if not set
        
        const accessRecords = await StudentLectureAccess.create(
          [
            {
              student: studentId,
              lecture: containerDoc._id,
              remainingViews: remainingViews,
            },
          ],
          { session }
        );
        access = accessRecords[0];
        if (!access) {
          throw new AppError("Failed to grant access", 500);
        }
      } else {
        if (access.remainingViews > 0) {
          // access.remainingViews -= 1;
          access.lastAccessed = Date.now();
          await access.save({ session });
        } else {
          delete containerDoc.videoLink;
        }
      }
    }

    await session.commitTransaction();
    res
      .status(200)
      .json({ status: "success", data: { container: containerDoc, access } });
  } catch (error) {
    await session.abortTransaction();
    return next(error);
  } finally {
    session.endSession();
  }
});

exports.getAllContainerPurchaseCounts = catchAsync(async (req, res, next) => {
  // Aggregate purchase counts for all containers
  const purchaseCounts = await Purchase.aggregate([
    {
      $group: {
        _id: "$container", // Group by container ID
        purchaseCount: { $sum: 1 }, // Count the number of purchases
      },
    },
    {
      $lookup: {
        from: "containers", // Ensure this matches your actual collection name
        localField: "_id",
        foreignField: "_id",
        as: "containerDetails",
      },
    },
    {
      $unwind: "$containerDetails", // Unwind the container details
    },
    {
      $project: {
        _id: 0,
        containerId: "$_id",
        containerName: "$containerDetails.name",
        purchaseCount: 1,
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    results: purchaseCounts.length,
    data: purchaseCounts,
  });
});

exports.getContainerPurchaseCountById = catchAsync(async (req, res, next) => {
  const { containerId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(containerId)) {
    return next(new AppError("Invalid container ID", 400));
  }

  // Fetch the container details
  const container = await Container.findById(containerId).select("name");
  if (!container) {
    return next(new AppError("Container not found", 404));
  }

  // Count the number of purchases for the specific container
  const purchaseCount = await Purchase.countDocuments({
    container: containerId,
  });

  res.status(200).json({
    status: "success",
    data: {
      containerId,
      containerName: container.name,
      purchaseCount,
    },
  });
});

exports.createContainer = catchAsync(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      name,
      type,
      price,
      level,
      teacherAllowed,
      subject,
      parent,
      createdBy,
      description,
      goal,
    } = req.body;

    // Check required documents exist
    const levelDoc = await checkDoc(Level, level, session);
    const subjectDoc = await checkDoc(Subject, subject, session);
    const lecturerDoc = await checkDoc(
      Lecturer,
      createdBy || req.user._id,
      session
    );

    // Validate required fields for course type
    if (type === "course" && (!description || !goal)) {
      // Clean up any uploaded image if validation fails
      if (req.file && req.file.filename) {
        await cloudinary.uploader.destroy(req.file.filename);
      }
      return next(
        new AppError("Description and goal are required for course type.", 400)
      );
    }

    // Create container data with optional image if provided
    const containerData = {
      name,
      type,
      price: price || 0,
      level,
      teacherAllowed,
      subject,
      parent,
      createdBy: createdBy || req.user._id,
      description: type === "course" ? description : undefined,
      goal: type === "course" ? goal : undefined,
    };

    // Add image data if an image was uploaded
    if (req.file) {
      containerData.image = {
        url: req.file.path,
        publicId: req.file.filename,
      };
    }

    // Create the container
    const container = await Container.create([containerData], { session });

    // If this container has a parent, update the parent's children array
    if (parent) {
      const parentContainer = await checkDoc(Container, parent, session);
      parentContainer.children.push(container[0]._id);
      await parentContainer.save({ session });
    }

    // Notification logic - only for paid containers with parent
    let studentsNotified = 0;
    if (price > 0 && parent) {
      // Get the container chain (all parent containers up the hierarchy)
      const containerChainResult = await Container.aggregate([
        {
          $match: { _id: new mongoose.Types.ObjectId(parent) },
        },
        {
          $graphLookup: {
            from: "containers",
            startWith: "$parent",
            connectFromField: "parent",
            connectToField: "_id",
            as: "parentChain",
          },
        },
      ]).session(session);

      // Extract all container IDs in the hierarchy (including the direct parent)
      const containerIds = [
        parent,
        ...(containerChainResult[0]?.parentChain.map((c) => c._id) || []),
      ];

      // Find all purchases where container is in this hierarchy
      const purchases = await Purchase.find({
        container: { $in: containerIds },
        type: "containerPurchase",
      }).session(session);

      // Get unique student IDs from these purchases
      const studentIds = [
        ...new Set(purchases.map((p) => p.student.toString())),
      ];

      // Find these students who want notifications
      const students = await Student.find({
        _id: { $in: studentIds },
        $or: [
          { containerNotify: true },
          { containerNotify: { $exists: false } },
        ],
      }).session(session);

      // Get notification template
      const template = await NotificationTemplate.findOne({
        type: "new_container",
      }).session(session);

      if (template && students.length > 0) {
        const io = req.app.get("io");
        const notificationsToCreate = [];

        await Promise.all(
          students.map(async (student) => {
            // Prepare notification data
            const notificationData = {
              title: template.title,
              message: template.message
                .replace("{container}", name)
                .replace("{subject}", subjectDoc.name),
              type: "new_container",
              relatedId: container[0]._id,
            };

            // Check if student is online
            const isOnline = io.sockets.adapter.rooms.has(
              student._id.toString()
            );
            const isSent = isOnline;

            // Create notification
            const notification = await Notification.create(
              [
                {
                  userId: student._id,
                  ...notificationData,
                  isSent,
                },
              ],
              { session }
            );

            notificationsToCreate.push(notification[0]);

            // Send immediately if online
            if (isOnline) {
              studentsNotified++;
              io.to(student._id.toString()).emit("newContainer", {
                ...notificationData,
                notificationId: notification[0]._id,
              });
            }
          })
        );
      }
    }

    await session.commitTransaction();
    res.status(201).json({
      status: "success",
      data: {
        container: container[0],
        studentsNotified,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    // Clean up any uploaded image if there was an error
    if (req.file && req.file.filename) {
      await cloudinary.uploader.destroy(req.file.filename);
    }
    return next(error);
  } finally {
    session.endSession();
  }
});

exports.getContainerById = catchAsync(async (req, res, next) => {
  const { containerId } = req.params;

  // Check if containerId is provided
  if (!containerId) {
    return next(new AppError("Container ID is required.", 400));
  }

  // Special case handling for "my-containers" path
  if (containerId === "my-containers") {
    // Only authenticated users with role Lecturer can access this resource
    if (!req.user || req.user.role !== "Lecturer") {
      return next(
        new AppError(
          "Please log in as a lecturer to access your containers.",
          401
        )
      );
    }

    // Forward to the getMyContainers function
    return exports.getMyContainers(req, res, next);
  }

  // Verify containerId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(containerId)) {
    return next(new AppError("Invalid container ID format.", 400));
  }

  // Fetch the container with enhanced population
  const container = await Container.findById(containerId).populate([
    {
      path: "children",
      select: "name type level subject image price description goal",
    },
    { path: "createdBy", select: "name" },
    { path: "subject", select: "name" },
    { path: "level", select: "name" },
  ]);

  if (!container) {
    return next(new AppError("Container not found.", 404));
  }

  // Add image inheritance logic - if no image, check parents
  let inheritedImage = null;
  let inheritedFrom = null;

  // Only look for parent images if this container doesn't have its own image
  if (!container.image || !container.image.url) {
    // Start with the current container's parent
    let currentParentId = container.parent;

    // Keep searching up the parent chain until we find an image or reach the top
    while (currentParentId) {
      const parentContainer = await Container.findById(currentParentId);
      if (!parentContainer) break;

      // If this parent has an image, use it
      if (parentContainer.image && parentContainer.image.url) {
        inheritedImage = parentContainer.image;
        inheritedFrom = parentContainer._id;
        break;
      }

      // Move up to the next parent
      currentParentId = parentContainer.parent;
    }
  }

  // Role-specific logic for authenticated users
  if (req.user && req.user.role?.toLowerCase() === "teacher") {
    if (!container.teacherAllowed) {
      return res.status(200).json({
        status: "restricted",
        data: {
          id: container._id,
          name: container.name,
          owner: container.createdBy.name || container.createdBy._id,
          subject: container.subject?.name || container.subject?._id,
          type: container.type,
        },
      });
    }
  }

  // Convert to plain object so we can add inherited image info
  const responseData = container.toObject
    ? container.toObject()
    : { ...container };

  // Add inherited image info to the response if applicable
  if (inheritedImage) {
    responseData.inheritedImage = {
      image: inheritedImage,
      inheritedFrom: inheritedFrom,
    };
  }

  // Default response for all roles and unauthenticated users
  return res.status(200).json({
    status: "success",
    data: responseData,
  });
});

exports.getAllContainers = catchAsync(async (req, res, next) => {
  // Create base query
  let query = Container.find();
  if (!req.user) {
    if (req.query.type && req.query.type.toLowerCase() === "lecture") {
      // Remove the type filter if it's lecture
      delete req.query.type;
    }
    query = query.where("type").ne("lecture");
  }
  const features = new QueryFeatures(query, req.query)
    .filter()
    .sort()
    .paginate();
  query = features.query;

  // Fetch containers based on the query with explicit field selection for related entities
  const containers = await query.populate([
    { path: "createdBy", select: "name" },
    { path: "subject", select: "name" },
    { path: "level", select: "name" },
    { path: "parent", select: "name" },
  ]);

  if (!containers || containers.length === 0) {
    return next(new AppError("No containers found.", 404));
  }

  // Role-specific logic for authenticated users
  if (req.user && req.user.role?.toLowerCase() === "teacher") {
    // Filter containers based on `teacherAllowed` property
    const filteredContainers = containers.map((container) => {
      if (!container.teacherAllowed) {
        return {
          id: container._id,
          name: container.name,
          owner: container.createdBy.name || container.createdBy._id,
          subject: container.subject.name || container.subject._id,
          type: container.type,
        };
      }
      return container;
    });

    return res.status(200).json({
      status: "success",
      results: filteredContainers.length,
      data: {
        containers: filteredContainers,
      },
    });
  }

  // Default response for all roles and unauthenticated users
  return res.status(200).json({
    status: "success",
    results: containers.length,
    data: {
      containers,
    },
  });
});

exports.getLecturerContainers = catchAsync(async (req, res, next) => {
  const { lecturerId } = req.params;

  if (!lecturerId) {
    return next(new AppError("Lecturer ID is required", 400));
  }

  let query = Container.find({ createdBy: lecturerId });

  // If the user is not authenticated, select only basic fields
  if (!req.user) {
    query = query.select("name type subject level createdBy"); // Select basic fields + createdBy for context
  }

  const containers = await query.populate([
    { path: "createdBy", select: "name" }, // Keep createdBy populated for context
    { path: "subject", select: "name" },
    { path: "level", select: "name" },
  ]);

  if (!containers || containers.length === 0) {
    return next(new AppError("No containers found for this lecturer.", 404));
  }

  res.status(200).json({
    status: "success",
    results: containers.length,
    data: {
      containers,
    },
  });
});

exports.getMyContainers = catchAsync(async (req, res, next) => {
  const lecturerId = req.user._id; // Extract the logged-in lecturer's ID from the JWT token

  const containers = await Container.find({ createdBy: lecturerId }).populate([
    { path: "subject", select: "name" },
    { path: "level", select: "name" },
    {
      path: "children",
      populate: [
        { path: "subject", select: "name" },
        { path: "level", select: "name" },
      ],
    },
    { path: "parent", select: "name type" },
    { path: "createdBy", select: "name email" },
  ]);

  if (!containers || containers.length === 0) {
    return next(new AppError("No containers found for this lecturer.", 404));
  }

  res.status(200).json({
    status: "success",
    results: containers.length,
    data: { containers },
  });
});

exports.updateContainer = catchAsync(async (req, res, next) => {
  const { name, type, price, level, subject, description, goal, removeImage } =
    req.body;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Find the container first to check if it exists and to get the current image (if any)
    const container = await Container.findById(req.params.containerId).session(
      session
    );
    if (!container) {
      // If container not found and there's an uploaded image, clean it up
      if (req.file && req.file.filename) {
        await cloudinary.uploader.destroy(req.file.filename);
      }
      throw new AppError("No container found with that ID", 404);
    }

    let obj = { name, type, price };
    let unsetObj = {};

    if (type === "course") {
      if (!description || !goal) {
        // Clean up uploaded image if validation fails
        if (req.file && req.file.filename) {
          await cloudinary.uploader.destroy(req.file.filename);
        }
        return next(
          new AppError(
            "Description and goal are required for course type.",
            400
          )
        );
      }
      obj.description = description;
      obj.goal = goal;
    }

    if (subject) {
      const subjectDoc = await checkDoc(Subject, subject, session);
      obj.subject = subjectDoc._id;
    }
    if (level) {
      const levelDoc = await checkDoc(Level, level, session);
      obj.level = levelDoc._id;
    }

    // Handle image operations
    if (removeImage === "true" || removeImage === true) {
      // Delete existing image if present
      if (container.image && container.image.publicId) {
        await cloudinary.uploader.destroy(container.image.publicId);
      }
      // Properly remove image field using $unset
      unsetObj.image = "";
    } else if (req.file) {
      // New image uploaded - update the image field
      // First delete any existing image
      if (container.image && container.image.publicId) {
        await cloudinary.uploader.destroy(container.image.publicId);
      }
      // Then set the new image
      obj.image = {
        url: req.file.path,
        publicId: req.file.filename,
      };
    }

    // Update using both $set and $unset operators if needed
    const updateOptions = {
      $set: obj,
      ...(Object.keys(unsetObj).length > 0 ? { $unset: unsetObj } : {}),
    };

    const updatedContainer = await Container.findByIdAndUpdate(
      req.params.containerId,
      updateOptions,
      {
        new: true,
        runValidators: true,
        session,
      }
    ).populate([
      { path: "children", select: "name" },
      { path: "createdBy", select: "name" },
      { path: "subject", select: "name" },
      { path: "level", select: "name" },
    ]);

    await session.commitTransaction();
    res.status(200).json({
      status: "success",
      data: {
        container: updatedContainer,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    // Clean up uploaded image if there was an error
    if (req.file && req.file.filename) {
      await cloudinary.uploader.destroy(req.file.filename);
    }
    return next(error);
  } finally {
    session.endSession();
  }
});

exports.UpdateChildOfContainer = catchAsync(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { containerId, childId, operation } = req.body;
    const container = await Container.findById(containerId).session(session);
    if (!container) {
      throw new AppError("Container not found", 404);
    }

    const childContainer = await Container.findById(childId).session(session);
    if (!childContainer) {
      throw new AppError("Child container not found", 404);
    }
    if (operation === "add") {
      // Use findByIdAndUpdate instead of save to avoid validation
      await Container.findByIdAndUpdate(
        childId,
        { parent: containerId },
        { session, runValidators: false }
      );
      container.children.push(childId);
      await container.save({ session });
    } else if (operation === "remove") {
      // Use findByIdAndUpdate instead of save to avoid validation
      await Container.findByIdAndUpdate(
        childId,
        { parent: null },
        { session, runValidators: false }
      );
      container.children = container.children.filter(
        (child) => child.toString() !== childId
      );
      await container.save({ session });
    } else {
      throw new AppError("Invalid operation", 400);
    }
    await session.commitTransaction();

    // Re-fetch the updated container with properly populated children
    const updatedContainer = await Container.findById(containerId).populate([
      {
        path: "children",
        select: "name type level subject image price description goal",
      },
      { path: "subject", select: "name" },
      { path: "level", select: "name" },
      { path: "createdBy", select: "name" },
    ]);

    res
      .status(200)
      .json({ status: "success", data: { container: updatedContainer } });
  } catch (error) {
    await session.abortTransaction();
    return next(error);
  } finally {
    session.endSession();
  }
});

exports.deleteContainerAndChildren = catchAsync(async (req, res, next) => {
  let session;
  try {
    const { containerId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(containerId)) {
      throw new AppError("Invalid container id", 400);
    }

    session = await mongoose.startSession();
    session.startTransaction();

    // Find the container and recursively search for nested children.
    const containerTree = await Container.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(containerId) },
      },
      {
        $graphLookup: {
          from: "containers", // Ensure this matches your actual collection name
          startWith: "$children",
          connectFromField: "children",
          connectToField: "_id",
          as: "nestedChildren",
        },
      },
    ]).session(session);

    if (!containerTree || containerTree.length === 0) {
      throw new AppError("Container not found", 404);
    }

    const containerDoc = containerTree[0];
    const toDeleteIds = [
      containerDoc._id,
      ...containerDoc.nestedChildren.map((child) => child._id),
    ];

    // Remove the container id from its parent's children array if applicable.
    if (containerDoc.parent) {
      const parent = await Container.findByIdAndUpdate(
        containerDoc.parent,
        { $pull: { children: containerDoc._id } },
        { session }
      );
      if (!parent) {
        throw new AppError(
          "Failed to remove the container from parent's children array",
          404
        );
      }
    }

    // Delete the container and all nested children.
    await Container.deleteMany({ _id: { $in: toDeleteIds } }).session(session);

    await session.commitTransaction();
    res.status(204).json({ status: "success", data: null });
  } catch (error) {
    if (session) {
      await session.abortTransaction();
    }
    return next(error);
  } finally {
    if (session) {
      session.endSession();
    }
  }
});

// get the total revenue for a container by Id
exports.getContainerRevenue = catchAsync(async (req, res, next) => {
  const { containerId } = req.params;
  const container = await Container.findById(containerId);
  if (!container) {
    return next(new AppError("Container not found", 404));
  }

  const purchaseCount = await Purchase.countDocuments({
    container: containerId,
  });

  const revenue = container.price * purchaseCount;

  res.status(200).json({
    status: "success",
    data: {
      containerId,
      purchaseCount,
      containerPrice: container.price,
      revenue,
    },
  });
});

// Get lecturer revenue by month from container sales
exports.getLecturerRevenueByMonth = catchAsync(async (req, res, next) => {
  const { lecturerId } = req.params;
  const { startDate, endDate } = req.query;

  if (!mongoose.Types.ObjectId.isValid(lecturerId)) {
    return next(new AppError("Invalid lecturer ID format", 400));
  }

  // Build date filters
  let dateFilter = {};
  if (startDate || endDate) {
    dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999); // Include the whole end day
      dateFilter.$lte = endOfDay;
    }
  }

  // Aggregate pipeline to calculate revenue by month
  const monthlyRevenue = await Purchase.aggregate([
    {
      $match: {
        lecturer: new mongoose.Types.ObjectId(lecturerId),
        type: "containerPurchase",
        ...(Object.keys(dateFilter).length > 0 && { purchasedAt: dateFilter }),
      },
    },
    {
      $lookup: {
        from: "containers",
        localField: "container",
        foreignField: "_id",
        as: "containerDetails",
      },
    },
    {
      $unwind: "$containerDetails",
    },
    {
      $project: {
        year: { $year: "$purchasedAt" },
        month: { $month: "$purchasedAt" },
        revenue: "$containerDetails.price",
        container: "$containerDetails._id",
        containerName: "$containerDetails.name",
      },
    },
    {
      $group: {
        _id: {
          year: "$year",
          month: "$month",
        },
        totalRevenue: { $sum: "$revenue" },
        purchaseCount: { $sum: 1 },
        containers: {
          $addToSet: {
            id: "$container",
            name: "$containerName",
          },
        },
      },
    },
    {
      $sort: {
        "_id.year": 1,
        "_id.month": 1,
      },
    },
    {
      $project: {
        _id: 0,
        year: "$_id.year",
        month: "$_id.month",
        totalRevenue: 1,
        purchaseCount: 1,
        containers: 1,
        monthName: {
          $let: {
            vars: {
              monthsInString: [
                "",
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
              ],
            },
            in: { $arrayElemAt: ["$$monthsInString", "$_id.month"] },
          },
        },
      },
    },
  ]);

  // Check if lecturer exists
  const lecturer = await Lecturer.findById(lecturerId);
  if (!lecturer && monthlyRevenue.length === 0) {
    return next(new AppError("Lecturer not found or has no revenue data", 404));
  }

  // Calculate overall total revenue
  const overallTotal = monthlyRevenue.reduce(
    (sum, month) => sum + month.totalRevenue,
    0
  );
  const overallPurchaseCount = monthlyRevenue.reduce(
    (sum, month) => sum + month.purchaseCount,
    0
  );

  res.status(200).json({
    status: "success",
    data: {
      lecturer: lecturer
        ? {
            id: lecturer._id,
            name: lecturer.name,
          }
        : "Unknown lecturer",
      monthlyRevenue,
      summary: {
        totalRevenue: overallTotal,
        totalPurchases: overallPurchaseCount,
        monthsWithRevenue: monthlyRevenue.length,
      },
    },
  });
});
