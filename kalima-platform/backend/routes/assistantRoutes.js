const express = require("express");
const assistantController = require("../controllers/assistantController");
const authController = require("../controllers/authController");
const verifyJWT = require("../middleware/verifyJWT");

const router = express.Router();

router.use(verifyJWT, authController.verifyRoles("admin", "subadmin", "moderator", "lecturer", "assistant"));

router
    .route("/")
    .get(assistantController.getAllAssistants)
    .post(assistantController.uploadAssistantPhoto ,assistantController.createAssistant);

router
    .route("/lecturer/:lecturerId")
    .get(assistantController.getAssistantsByLecturer);

router
    .route("/:id")
    .get(assistantController.getAssistantById)
    .patch(assistantController.updateAssistant)
    .delete(assistantController.deleteAssistant);

module.exports = router;