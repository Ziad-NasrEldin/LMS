const express = require('express');
const courseController = require('../controllers/groupedLessonsController'); // Assuming your controller path

const router = express.Router();

// Routes for /api/v1/courses
// This route handles requests to the base path for courses.
router
  .route('/')
  .get(courseController.getAllCourses) // Handles GET requests to fetch all courses.
  .post(courseController.createCourseOrmonth); // Handles POST requests to create a new course.

// Routes for /api/v1/courses/:id
// This route handles requests targeting a specific course using its ID.
router
  .route('/:id')
  .get(courseController.getCourse)       // Handles GET requests to fetch a single course by its ID.
  .patch(courseController.updateCourse)   // Handles PATCH requests to update a course by its ID.
  .delete(courseController.deleteCourse); // Handles DELETE requests to delete a course by its ID.

  router
  .route('/:courseId/lessons') // Define the path including the courseId parameter and '/lessons'
  .get(courseController.getLessonsByCourse);

module.exports = router; // Export the configured router to be used in your main app file.
