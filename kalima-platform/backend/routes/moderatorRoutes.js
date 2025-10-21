const express = require("express");
const moderatorController = require("../controllers/moderatorController");
const verifyJWT = require("../middleware/verifyJWT");
const authController = require("../controllers/authController");

const router = express.Router();

router.use(verifyJWT,authController.verifyRoles("Admin", "SubAdmin", "Moderator"));

router
    .route("/")
    .post(moderatorController.createModerator)
    .get(moderatorController.getAllModerators);

router
    .route("/:id")
    .get(moderatorController.getModeratorById)
    .patch(moderatorController.updateModerator)
    .delete(moderatorController.deleteModerator);

module.exports = router;