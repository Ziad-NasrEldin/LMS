const express = require("express");
const packageController = require("../controllers/packageController");
const router = express.Router();
const verifyJWT = require("../middleware/verifyJWT");
const authController = require("../controllers/authController");


router
  .route("/")
  .get(authController.optionalJWT, packageController.getAllPackages);

router
  .route("/:id")
  .get(authController.optionalJWT, packageController.getPackageById)


// Apply JWT verification middleware to all routes
router.use(verifyJWT);

router
  .route("/")
  .post(authController.verifyRoles("Admin", "SubAdmin", "Moderator"), packageController.createPackage);

router.patch("/:id/points", authController.verifyRoles("Admin", "SubAdmin", "Moderator"), packageController.managePackagePoints);
router
  .route("/:id")
  .patch(authController.verifyRoles("Admin", "SubAdmin", "Moderator"), packageController.updatePackage)
  .delete(authController.verifyRoles("Admin", "SubAdmin", "Moderator"), packageController.deletePackage);

module.exports = router;
