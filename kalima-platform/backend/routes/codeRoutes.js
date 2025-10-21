const express = require("express");
const router = express.Router();
const verifyJWT = require("../middleware/verifyJWT");
const codeController = require("../controllers/codeController");
const authController = require("../controllers/authController");

router.use(verifyJWT);

router
  .route("/")
  .get(
    authController.verifyRoles("Admin", "SubAdmin"),
    codeController.getAllCodes
  )
  .post(
    authController.verifyRoles("Admin", "SubAdmin"),
    codeController.createCodes
  )
  .delete(
    authController.verifyRoles("Admin", "SubAdmin"),
    codeController.deleteCodes
  );

router.route("/:id").get(codeController.getCodeById);

router.delete(
  "/multiple",
  authController.verifyRoles("Admin", "SubAdmin"),
  codeController.deleteMultipleCodes
);

router
  .route("/redeem")
  .post(
    authController.verifyRoles("Student", "Parent", "Teacher"),
    codeController.redeemCode
  );

module.exports = router;
