const express = require("express");
const subAdminController = require("../controllers/subAdminController");
const authController = require("../controllers/authController");
const verifyJWT = require("../middleware/verifyJWT");

const router = express.Router();

router.use(verifyJWT, authController.verifyRoles("Admin", "SubAdmin", "Moderator"));

router
  .route("/")
  .post(subAdminController.createSubAdmin)
  .get(subAdminController.getAllSubAdmins);

router
  .route("/:id")
  .get(subAdminController.getSubAdminById)
  .patch(subAdminController.updateSubAdmin)
  .delete(subAdminController.deleteSubAdmin);

module.exports = router;
