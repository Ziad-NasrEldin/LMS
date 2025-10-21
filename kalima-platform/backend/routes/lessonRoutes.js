const express = require("express");
const lessonController = require("../controllers/lessonController");
const verifyJWT = require('../middleware/verifyJWT');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(verifyJWT, authController.verifyRoles('Admin', 'SubAdmin', 'Moderator', 'Assistant', 'Lecturer'));

router
  .route("/")
  .post(lessonController.createLesson)
  .get(lessonController.getAllLessons);

router
  .route("/:id")
  .get(lessonController.getLessonById)
  .patch(lessonController.updateLesson)
  .delete(lessonController.deleteLesson);

module.exports = router;
