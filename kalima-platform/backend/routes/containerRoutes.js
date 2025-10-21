const express = require("express");
const containerController = require("../controllers/containerController");
const authController = require("../controllers/authController.js");
const router = express.Router();

const verifyJWT = require("../middleware/verifyJWT");

// Get containers for a specific lecturer
router.get(
  "/lecturer/:lecturerId",
  containerController.getLecturerContainers
);

// Get all containers - works with or without authentication
router.get(
  "/",
  authController.optionalJWT,  // Apply optional JWT middleware
  containerController.getAllContainers
);

// Get container by ID - works with or without authentication
// Note: This handles /my-containers as a special case for authenticated lecturers
router.get(
  "/:containerId", authController.optionalJWT,  // Apply optional JWT middleware
  containerController.getContainerById
);

// Apply JWT verification middleware to all routes below this line
router.use(verifyJWT);

// Get accessible child containers for a student by container ID
router.get(
  "/student/:studentId/container/:containerId/purchase/:purchaseId",
  containerController.getAccessibleChildContainers
);

//purchaseCounter for all containers
router.get(
  "/purchase-counts",
  authController.verifyRoles("admin", "subadmin", "moderator"), // Restrict access to specific roles
  containerController.getAllContainerPurchaseCounts
);

//purchaseCounter for a container
router.get(
  "/purchase-counts/:containerId",
  authController.verifyRoles("admin", "subadmin", "moderator"), // Restrict access to specific roles
  containerController.getContainerPurchaseCountById
);

// Update a child container's parent
router.patch(
  "/update-child",
  authController.verifyRoles("Admin", "SubAdmin", "Moderator", "Lecturer", "Assistant"),
  containerController.UpdateChildOfContainer
);

// Create containers - with image upload support
router
  .route("/")
  .post(
    authController.verifyRoles("Admin", "SubAdmin", "Moderator", "Lecturer", "Assistant"),
    containerController.uploadContainerImage, // Add image upload middleware
    containerController.createContainer
  );

// Operations on a specific container by ID - with image upload support for updates
router
  .route("/:containerId")
  .patch(
    authController.verifyRoles(
      "Admin",
      "SubAdmin",
      "Moderator",
      "Lecturer",
      "Assistant"
    ),
    containerController.uploadContainerImage, // Add image upload middleware
    containerController.updateContainer
  )
  .delete(
    authController.verifyRoles(
      "Admin",
      "SubAdmin",
      "Moderator",
      "Lecturer"
    ),
    containerController.deleteContainerAndChildren
  );

// Get revenue for a specific container by Id
router
  .get(
    "/:containerId/revenue",
    authController.verifyRoles(
      "Admin",
      "Sub-Admin",
      "Moderator",
      "Lecturer",
      "Assistant",
      "Student",
      "Parent"
    ),
    containerController.getContainerRevenue
  );

// Get lecturer revenue per month from container sales
router
  .get(
    "/:lecturerId/monthly-revenue",
    authController.verifyRoles(
      "Admin",
      "Sub-Admin",
      "Moderator",
      "Lecturer"
    ),
    containerController.getLecturerRevenueByMonth
  );

module.exports = router;
