const express = require("express");
const subjectController = require("../controllers/subjectController");

const router = express.Router();

router
  .route("/")
  .post(subjectController.createSubject)
  .get(subjectController.getAllSubjects);

router.route("/:id/level").patch(subjectController.updateLevelOfSubject);
router
  .route("/:id")
  .get(subjectController.getSubjectById)
  .patch(subjectController.updateSubjectById)
  .delete(subjectController.deleteSubjectById);



module.exports = router;
