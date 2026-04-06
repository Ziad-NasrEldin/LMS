const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController.js");
const loginLimiter = require("../middleware/loginLimiter.js");
const verifyJWT = require("../middleware/verifyJWT");

router.route("/").post(loginLimiter, authController.login);
router.route("/check-session").post(loginLimiter, authController.checkActiveSession);
router.route("/refresh").post(authController.refresh);
router.route("/logout").post(verifyJWT, authController.logout);
router.route("/impersonation/start").post(verifyJWT, authController.startImpersonation);
router.route("/impersonation/stop").post(verifyJWT, authController.stopImpersonation);

module.exports = router;
