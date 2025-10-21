const mongoose = require('mongoose'); 
const Course = require('../models/groupedLessonsModel'); 
const Lesson = require('../models/lessonModel'); 
const AppError = require("../utils/appError"); 
const catchAsync = require('../utils/catchAsync'); 


const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);


exports.createCourseOrmonth = catchAsync(async (req, res, next) => {
  const { name, description, groupedLessonstype } = req.body;
  
  // Basic validation
  if (!name) {
    return next(new AppError('Course name is required.', 400));
  }
  
  // Create course with name, description, and groupedLessonstype
  const newCourse = await Course.create({
    name,
    description,
    groupedLessonstype, 
  });
  
  res.status(201).json({
    status: 'success',
    data: {
      course: newCourse,
    },
  });
});

exports.getAllCourses = catchAsync(async (req, res, next) => {
  const courses = await Course.find();

  res.status(200).json({
    status: 'success',
    results: courses.length,
    data: {
      courses,
    },
  });
});

// --- Get Course by ID ---
exports.getCourse = catchAsync(async (req, res, next) => {
  const courseId = req.params.id;

  // Validate the ID format
  if (!isValidObjectId(courseId)) {
    return next(new AppError('Invalid Course ID format.', 400));
  }

  // Find the course and populate the lessons array
  // .populate('lessons') will replace the lesson ObjectIds with the actual lesson documents
  const course = await Course.findById(courseId).populate('lessons');

  if (!course) {
    return next(new AppError('No course found with that ID.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      course,
    },
  });
});

// --- Update Course by ID ---
exports.updateCourse = catchAsync(async (req, res, next) => {
  const courseId = req.params.id;
  const updateData = req.body;

  // Validate the ID format
  if (!isValidObjectId(courseId)) {
    return next(new AppError('Invalid Course ID format.', 400));
  }

  // We only allow updating name and description directly here.
  // The lessons array is managed when creating/deleting lessons.
  const allowedUpdates = ['name', 'description'];
  const updates = {};
  Object.keys(updateData).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updates[key] = updateData[key];
    }
  });

  // Check if there are any valid fields to update
  if (Object.keys(updates).length === 0) {
     return next(new AppError('No valid fields provided for update (only name and description are directly updateable).', 400));
  }


  const updatedCourse = await Course.findByIdAndUpdate(
    courseId,
    updates, // Apply only allowed updates
    {
      new: true, // Return the updated document
      runValidators: true, // Run validators defined in the schema
    }
  );

  if (!updatedCourse) {
    return next(new AppError('No course found with that ID.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      course: updatedCourse,
    },
  });
});

// --- Delete Course by ID (and associated lessons) ---
exports.deleteCourse = catchAsync(async (req, res, next) => {
  const courseId = req.params.id;

  // Validate the ID format
  if (!isValidObjectId(courseId)) {
    return next(new AppError('Invalid Course ID format.', 400));
  }

  // --- Start Transaction ---
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Find the course to get the list of lessons
    const courseToDelete = await Course.findById(courseId).session(session);

    if (!courseToDelete) {
      // If course not found, abort and return 404
      await session.abortTransaction();
      return next(new AppError('No course found with that ID.', 404));
    }

    // 2. Get the IDs of the lessons associated with this course
    const lessonIdsToDelete = courseToDelete.lessons;

    // 3. Delete all associated lessons
    // Use deleteMany with the session and the array of lesson IDs
    if (lessonIdsToDelete && lessonIdsToDelete.length > 0) {
        await Lesson.deleteMany(
            { _id: { $in: lessonIdsToDelete } },
            { session }
        );
    }

    // 4. Delete the course itself
    const deletedCourse = await Course.findByIdAndDelete(courseId, { session });

    // This check is redundant because we already checked if courseToDelete exists,
    // but it's a safeguard if something goes wrong during the delete itself.
    if (!deletedCourse) {
         await session.abortTransaction();
         return next(new AppError('Error deleting course.', 500));
    }


    // 5. If both deletions were successful, commit the transaction
    await session.commitTransaction();

    // 6. Send success response (204 No Content is standard for successful deletion)
    res.status(204).json({
      status: 'success',
      data: null, // No data is typically returned for 204
    });

  } catch (error) {
    // 7. If any operation failed, abort the transaction
    await session.abortTransaction();
    // 8. Pass the error to the global error handler
    next(error);
  } finally {
    // 9. End the session
    session.endSession();
  }
});

exports.getLessonsByCourse = catchAsync(async (req, res, next) => {
    // Get the courseId from the URL parameters
    const courseId = req.params.courseId; // Make sure the route parameter name matches (:courseId)
  
    // Validate the courseId format
    if (!isValidObjectId(courseId)) {
      return next(new AppError('Invalid Course ID format.', 400));
    }
  
    // Find all lessons where the 'course' field matches the provided courseId
    const lessons = await Lesson.find({ course: courseId });
  
  
    res.status(200).json({
      status: 'success',
      results: lessons.length,
      data: {
        lessons,
      },
    });
  });