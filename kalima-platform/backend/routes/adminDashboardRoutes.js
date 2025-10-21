const adminDashboardController = require("../controllers/adminDashboardController");
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const verifyJWT = require("../middleware/verifyJWT");

router.use(verifyJWT, authController.verifyRoles("admin"));

router.route("/users").get(adminDashboardController.getAllUsers);
router.route("/containers").get(adminDashboardController.getAllContainers);
router
  .route("/containers/:containerId")
  .get(adminDashboardController.getContainerData);
router
  .route("/students/:studentId")
  .get(adminDashboardController.getStudentData);

router.route("/users-stats").get(adminDashboardController.getUserStats);

module.exports = router;
