const fs = require("fs");
const Lecturer = require("../models/lecturerModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const bcrypt = require("bcrypt");
const { uploadProfilePicToDisk } = require("./../utils/upload files/uploadFiles");

// Upload middleware for lecturer profile picture
exports.uploadLecturerPhoto = uploadProfilePicToDisk;

// Create a new lecturer
exports.createLecturer = catchAsync(async (req, res, next) => {
    const { name, email, password, gender, role, bio, expertise } = req.body;

    if (!bio || !expertise) {
        return next(new AppError("Bio and expertise are required.", 400));
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const lecturerData = {
        name,
        email,
        password: hashedPassword,
        gender,
        role,
        bio,
        expertise,
        profilePic: req.file ? req.file.path : null,
    };

    const lecturer = await Lecturer.create(lecturerData);

    res.status(201).json({
        status: "success",
        data: lecturer,
    });
});

// Get all lecturers
exports.getAllLecturers = catchAsync(async (req, res, next) => {
    const lecturers = await Lecturer.find();
    res.status(200).json({
        status: "success",
        data: lecturers,
    });
});

// Get a lecturer by ID
exports.getLecturerById = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const lecturer = await Lecturer.findById(id);

    if (!lecturer) {
        return next(new AppError("Lecturer not found.", 404));
    }

    res.status(200).json({
        status: "success",
        data: lecturer,
    });
});

// Update a lecturer by ID
exports.updateLecturer = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { name, email, bio, expertise } = req.body;

    const lecturer = await Lecturer.findById(id);
    if (!lecturer) {
        return next(new AppError("Lecturer not found.", 404));
    }

    // If a new file is uploaded, delete the old one
    if (req.file) {
        if (lecturer.profilePic && fs.existsSync(lecturer.profilePic)) {
            fs.unlinkSync(lecturer.profilePic);
        }
        lecturer.profilePic = req.file.path;
    }

    lecturer.name = name || lecturer.name;
    lecturer.email = email || lecturer.email;
    lecturer.bio = bio || lecturer.bio;
    lecturer.expertise = expertise || lecturer.expertise;

    await lecturer.save();

    res.status(200).json({
        status: "success",
        data: lecturer,
    });
});

// Delete a lecturer by ID
exports.deleteLecturer = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const lecturer = await Lecturer.findByIdAndDelete(id);

    if (!lecturer) {
        return next(new AppError("Lecturer not found.", 404));
    }

    // Delete profile picture if exists
    if (lecturer.profilePic && fs.existsSync(lecturer.profilePic)) {
        fs.unlinkSync(lecturer.profilePic);
    }

    res.status(204).json({
        status: "success",
        message: "Lecturer deleted successfully.",
    });
});
