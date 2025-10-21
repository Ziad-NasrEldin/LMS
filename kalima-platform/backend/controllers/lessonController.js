const mongoose = require("mongoose");
const Lesson = require("../models/lessonModel");
const Subject = require("../models/subjectModel");
const CLecturer = require("../models/center.lecturerModel");
const Level = require("../models/levelModel");
const Center = require("../models/centerModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const QueryFeatures = require("../utils/queryFeatures");
// This is the imported model, variable name is groupedLessonsModel
const groupedLessonsModel = require('../models/groupedLessonsModel'); // Renamed for clarity


// Helper function to validate related document IDs
// This function will be called inside the transaction, so it receives the session.
const validateRelatedDocs = async (
  subjectId,
  lecturerId,
  levelId,
  centerId,
  courseOrmonthId = null, // Made optional with a default value
  session // session is required when called within a transaction
) => {
  // Use the session for findById calls within the transaction
  const findOptions = { session };

  const [subject, lecturer, level, center, groupedLesson] = await Promise.all([
    Subject.findById(subjectId, null, findOptions),
    CLecturer.findById(lecturerId, null, findOptions),
    Level.findById(levelId, null, findOptions),
    Center.findById(centerId, null, findOptions),
    // Validate groupedLessons document only if courseOrmonthId is provided
    courseOrmonthId ? groupedLessonsModel.findById(courseOrmonthId, null, findOptions) : Promise.resolve(null),
  ]);

  if (!subject) throw new AppError("Subject not found.", 404);
  if (!lecturer) throw new AppError("Lecturer not found.", 404);
  if (!level) throw new AppError("Level not found.", 404);
  if (!center) throw new AppError("Center not found.", 404);
  if (courseOrmonthId && !groupedLesson) {
    throw new AppError("Related groupedLessons document not found with the provided ID.", 404);
  }

  // Optional: Check if the lecturer belongs to the specified center
  // Ensure lecturer.center exists before checking toString()
  if (lecturer.center && lecturer.center.toString() !== centerId) {
    throw new AppError(
      "Lecturer does not belong to the specified center.",
      400
    );
  }
};

// Create a new lesson
exports.createLesson = catchAsync(async (req, res, next) => {
  // 1. Destructure fields from the request body, using courseOrmonth
  const { subject, lecturer, level, startTime, duration, center, courseOrmonth } = req.body;

  // 2. Modify validation to exclude courseOrmonth from strictly required fields if it's optional in the schema (which it is)
  if (!subject || !lecturer || !level || !startTime || !center) {
    return next(
      new AppError(
        "Subject, lecturer, level, start time, and center are required.",
        400
      )
    );
  }

  // Validate courseOrmonth ID format if provided
  if (courseOrmonth && !mongoose.Types.ObjectId.isValid(courseOrmonth)) {
    return next(new AppError("Invalid courseOrmonth ID format.", 400));
  }

  // Start a session
  const session = await mongoose.startSession();

  try {
    // Use withTransaction for automatic retries and capture the returned data
    const resultData = await session.withTransaction(async () => {
      // All operations inside this async function will be part of the transaction

      // 3. Validate related documents using the imported function, passing courseOrmonth and session
      await validateRelatedDocs(subject, lecturer, level, center, courseOrmonth, session);

      // 4. Create lesson object
      const lessonData = {
        subject,
        lecturer,
        level,
        startTime,
        duration,
        center,
      };

      // Add courseOrmonth to the lesson data only if it was provided
      if (courseOrmonth) {
        lessonData.courseOrmonth = courseOrmonth;
      }

      // Create the new lesson (needs to be await Lesson.create([lessonData], { session }))
      const [newLesson] = await Lesson.create([lessonData], { session });

      // 5. Only update the related groupedLessons document if a courseOrmonth ID was provided
      let updatedGroupedLesson = null; // Declare here to potentially return it
      if (courseOrmonth) {
          updatedGroupedLesson = await groupedLessonsModel.findByIdAndUpdate( // Using the imported model variable
            courseOrmonth, // This is the ID from req.body
            { $push: { lessons: newLesson._id } }, // Assuming 'lessons' is the array field name
            {
              new: true,
              runValidators: true,
              session // Pass session to the update operation
            }
          );
      }

       // Fetch the created lesson again with populate to send it in the response
       const lessonWithPopulatedData = await Lesson.findById(newLesson._id)
         .populate({ path: "subject", select: "name" })
         .populate({ path: "lecturer", select: "name" })
         .populate({ path: "level", select: "name" })
         .populate({ path: "center", select: "name" })
         .populate({ path: "courseOrmonth", select: "name description" })
         .session(session); // Use session for populate within transaction

       // Return the data needed for the response from the transaction function
       return {
            lesson: lessonWithPopulatedData,
            groupedLesson: updatedGroupedLesson // Return the result of the update
       };

    }); // End of session.withTransaction(). The returned object is now in `resultData`.

    // 7. Send the success response using the data returned by the transaction function
    res.status(201).json({
      status: "success",
      data: resultData // Use the data captured from the transaction
    });

  } catch (error) {
    // session.withTransaction() automatically aborts the transaction on error
    // No need for explicit session.abortTransaction() here
    // 9. Pass the error to the global error handler
    next(error);
  } finally {
    // 10. End the session
    session.endSession();
  }
});

// Get all lessons (No change needed)
exports.getAllLessons = catchAsync(async (req, res, next) => {
  const features = new QueryFeatures(Lesson.find(), req.query)
    .filter()
    .sort()
    .paginate();

  const lessons = await features.query
    .populate({ path: "subject", select: "name" }) // Adjust select as needed
    .populate({ path: "lecturer", select: "name" }) // Adjust select as needed
    .populate({ path: "level", select: "name" }) // Adjust select as needed
    .populate({ path: "center", select: "name" }) // Adjust select as needed
     .populate({ path: "courseOrmonth", select: "name description" }); // Populate the courseOrmonth field


  res.status(200).json({
    status: "success",
    results: lessons.length,
    data: {
      lessons,
    },
  });
});

// Get a single lesson by ID (No change needed)
exports.getLessonById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid lesson ID format.", 400));
  }

  const lesson = await Lesson.findById(id)
    .populate({ path: "subject", select: "name" })
    .populate({ path: "lecturer", select: "name" })
    .populate({ path: "level", select: "name" })
    .populate({ path: "center", select: "name" })
     .populate({ path: "courseOrmonth", select: "name description" }); // Populate the courseOrmonth field


  if (!lesson) {
    return next(new AppError("Lesson not found.", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      lesson,
    },
  });
});

// Update a lesson by ID
exports.updateLesson = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body; // Get all update data from body

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid lesson ID format.", 400));
  }

  // Validate courseOrmonth ID format if provided in updateData
  if (updateData.courseOrmonth !== undefined && updateData.courseOrmonth !== null && !mongoose.Types.ObjectId.isValid(updateData.courseOrmonth)) {
      return next(new AppError("Invalid courseOrmonth ID format in update data.", 400));
  }


  // Start a session
  const session = await mongoose.startSession();

  try {
    // Use withTransaction for automatic retries and capture the updated lesson
    const updatedLesson = await session.withTransaction(async () => {
      // All operations inside this async function will be part of the transaction

      // Fetch the current lesson within the transaction to get its state
      const currentLesson = await Lesson.findById(id).session(session);
      if (!currentLesson) {
           throw new AppError("Lesson not found.", 404);
      }

      // Validate related documents if they are being updated in the request body
      // Use provided values or current values for validation
      await validateRelatedDocs(
        updateData.subject || currentLesson.subject,
        updateData.lecturer || currentLesson.lecturer,
        updateData.level || currentLesson.level,
        updateData.center || currentLesson.center,
        updateData.courseOrmonth !== undefined ? updateData.courseOrmonth : currentLesson.courseOrmonth, // Handle explicit removal (setting to null/undefined)
        session // Pass session
      );

      // Handle potential update of courseOrmonth and its inverse relationship
      const oldCourseOrmonthId = currentLesson.courseOrmonth ? currentLesson.courseOrmonth.toString() : null;
      // Determine the new ID: use updateData if provided, otherwise keep the old one.
      // Handle explicit setting to null by checking `!== undefined`.
      const newCourseOrmonthId = updateData.courseOrmonth !== undefined ? updateData.courseOrmonth : oldCourseOrmonthId;


      // Case 1: courseOrmonth is being removed or changed from a non-null value
      // This happens if there was an old ID, AND the new ID is either null/undefined OR different from the old ID.
      if (oldCourseOrmonthId && (!newCourseOrmonthId || newCourseOrmonthId.toString() !== oldCourseOrmonthId)) {
          await groupedLessonsModel.findByIdAndUpdate(oldCourseOrmonthId, { $pull: { lessons: id } }, { session });
      }
      // Case 2: courseOrmonth is being added or changed to a different non-null value
      // This happens if there is a new ID, AND the new ID is either null/undefined OR different from the old ID.
       if (newCourseOrmonthId && (!oldCourseOrmonthId || newCourseOrmonthId.toString() !== oldCourseOrmonthId)) {
            // Ensure the new ID is not null/undefined before attempting to push
            if (newCourseOrmonthId) {
                await groupedLessonsModel.findByIdAndUpdate(newCourseOrmonthId, { $push: { lessons: id } }, { session });
            }
       }


      // Update the lesson itself
      const lessonAfterUpdate = await Lesson.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
        session // Pass session to the update operation
      })
        .populate({ path: "subject", select: "name" })
        .populate({ path: "lecturer", select: "name" })
        .populate({ path: "level", select: "name" })
        .populate({ path: "center", select: "name" })
        .populate({ path: "courseOrmonth", select: "name description" }); // Populate the courseOrmonth field

      if (!lessonAfterUpdate) {
        // This should not happen if currentLesson was found, but included for safety
        throw new AppError("Lesson not found during update.", 404);
      }

      return lessonAfterUpdate; // Return the updated lesson from the transaction function

    }); // End of session.withTransaction(). The returned lesson is now in `updatedLesson`.

    // The transaction was successful, send the response
    res.status(200).json({
      status: "success",
      data: {
        lesson: updatedLesson, // Use the result captured from the transaction
      },
    });

  } catch (error) {
    // session.withTransaction() automatically aborts on error
    next(error);
  } finally {
    session.endSession();
  }
});


// Delete a lesson by ID (No major change needed for the error, but applying the same pattern)
exports.deleteLesson = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid lesson ID format.", 400));
  }

  // Start a session
  const session = await mongoose.startSession();

  try {
    // Use withTransaction for automatic retries
    await session.withTransaction(async () => {
      // All operations inside this async function will be part of the transaction

      // Find the lesson within the transaction
      const lessonToDelete = await Lesson.findById(id).session(session);

      if (!lessonToDelete) {
        throw new AppError("Lesson not found.", 404); // Throw to be caught by the outer catch block
      }

      // If the lesson is part of a groupedLessons document, remove it from the array
      if (lessonToDelete.courseOrmonth) {
          await groupedLessonsModel.findByIdAndUpdate(
              lessonToDelete.courseOrmonth,
              { $pull: { lessons: id } },
              { session }
          );
      }

      // Now delete the lesson within the transaction
      await Lesson.findByIdAndDelete(id, { session });

    }); // End of session.withTransaction(). No return value needed for 204 response.

    // The transaction was successful
    res.status(204).json({
      status: "success",
      data: null,
    });

  } catch (error) {
     // session.withTransaction() automatically aborts on error
     next(error);
  } finally {
    session.endSession();
  }
});