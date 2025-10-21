const Assistant = require("../models/assistantModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const bcrypt = require("bcrypt");
const configureCloudinary = require("../config/cloudinaryOptions");
// const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

configureCloudinary();

const multerImageStorage = multer.memoryStorage();

const multerImageFilter = (req, file, cb) => {
    // Check if the file mimetype starts with 'image/'
    if (file.mimetype.startsWith('image')) {
        cb(null, true); // Accept file
    } else {
        cb(new AppError('Not an image! Please upload only images.', 400), false); // Reject file
    }
};

const upload = multer({
    storage: multerImageStorage,
    fileFilter: multerImageFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // Example: Limit file size to 5MB
});

exports.uploadAssistantPhoto = upload.single('profilePicture');

exports.createAssistant = catchAsync(async (req, res, next) => {
    const { name, email, password, gender, role, assignedLecturer } = req.body;
    
    if (!assignedLecturer) {
        return next(new AppError("Assigned lecturer is required.", 400));
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const assistantData = {
        name,
        email,
        password: hashedPassword,
        role,
        gender,
        assignedLecturer,
        // Initialize profilePicture as an object structure that matches your schema
        profilePicture: req.body.profilePicture || null,
    };
    
    
    if (req.file) {
        try {
            const imageUploadResult = await new Promise((resolve, reject) => {
                const base64File = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
                
                cloudinary.uploader.upload(
                    base64File, 
                    { folder: 'assistant_profiles', resource_type: 'auto' },
                    (error, result) => {
                        if (error) {
                            console.error("Cloudinary upload error:", error);
                            reject(error);
                        } else {
                            resolve(result);
                        }
                    }
                );
            });
            
            
            if (imageUploadResult && imageUploadResult.secure_url) {
                // Set profilePicture as an object with url and publicId properties
                assistantData.profilePicture = {
                    url: imageUploadResult.secure_url,
                    publicId: imageUploadResult.public_id
                };
            }
        } catch (err) {
            console.error("Image upload error:", err);
            return next(new AppError(`Image upload failed: ${err.message}`, 500));
        }
    }
    
    
    const assistant = await Assistant.create(assistantData);
    
    
    res.status(201).json({
        status: "success",
        data: assistant,
    });
});

// Get all assistants
exports.getAllAssistants = catchAsync(async (req, res, next) => {
    const assistants = await Assistant.find()
        .select('name email gender role assignedLecturer profilePicture')
        .populate("assignedLecturer", "name email");

    res.status(200).json({
        status: "success",
        data: assistants,
    });
});

// Get an assistant by ID
exports.getAssistantById = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const assistant = await Assistant.findById(id).populate("assignedLecturer");

    if (!assistant) {
        return next(new AppError("Assistant not found.", 404));
    }

    res.status(200).json({
        status: "success",
        data: assistant,
    });
});

// Update an assistant by ID
exports.updateAssistant = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { name, email, assignedLecturer } = req.body;

    const assistant = await Assistant.findByIdAndUpdate(
        id,
        { name, email, assignedLecturer },
        { new: true, runValidators: true }
    );

    if (!assistant) {
        return next(new AppError("Assistant not found.", 404));
    }

    res.status(200).json({
        status: "success",
        data: assistant,
    });
});

// Delete an assistant by ID
exports.deleteAssistant = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const assistant = await Assistant.findByIdAndDelete(id);

    if (!assistant) {
        return next(new AppError("Assistant not found.", 404));
    }

    res.status(204).json({
        status: "success",
        message: "Assistant deleted successfully.",
    });
});

// Get assistants by assigned lecturer
exports.getAssistantsByLecturer = catchAsync(async (req, res, next) => {
    const { lecturerId } = req.params;

    if (!lecturerId) {
        return next(new AppError("Lecturer ID is required.", 400));
    }

    const assistants = await Assistant.find({ assignedLecturer: lecturerId })
        .populate("assignedLecturer", "name email")
        .select("-password");

    if (!assistants || assistants.length === 0) {
        return next(new AppError("No assistants found for this lecturer.", 404));
    }

    res.status(200).json({
        status: "success",
        results: assistants.length,
        data: {
            assistants
        }
    });
});