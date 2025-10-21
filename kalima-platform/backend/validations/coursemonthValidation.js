
const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

const Subject = require('../models/subjectModel'); 
const Lecturer = require('../models/lecturerModel'); 
const Level = require('../models/levelModel'); 
const Center = require('../models/centerModel'); 
const Course = require('../models/groupedLessonsModel'); 

const validateRelatedDocs = async (subject, lecturer, level, center, course, session) => {
    // Validate subject
    const subjectDoc = await Subject.findById(subject).session(session);
    if (!subjectDoc) {
      throw new AppError('Subject not found with the provided ID.', 404);
    }
  
    // Validate lecturer
    const lecturerDoc = await Lecturer.findById(lecturer).session(session);
    if (!lecturerDoc) {
      throw new AppError('Lecturer not found with the provided ID.', 404);
    }
  
    // Validate level
    const levelDoc = await Level.findById(level).session(session);
    if (!levelDoc) {
      throw new AppError('Level not found with the provided ID.', 404);
    }
  
    // Validate center
    const centerDoc = await Center.findById(center).session(session);
    if (!centerDoc) {
      throw new AppError('Center not found with the provided ID.', 404);
    }
  
    // Validate course only if a course ID was provided
    if (course) {
      const courseDoc = await Course.findById(course).session(session);
      if (!courseDoc) {
        throw new AppError('Course not found with the provided ID.', 404);
      }
    }
  
    // All validations passed
    return true;
  };