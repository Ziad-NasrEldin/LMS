const Moderator = require("../models/moderatorModel");
const AppError = require("../utils/appError");
const bcrypt = require("bcrypt");
// Create a new moderator.
exports.createModerator = async (req, res, next) => {
    try {
        const { name, email, gender, password, role } = req.body;

        const hashedPassword = await bcrypt.hash(password, 12);

        const moderator = await Moderator.create({ name, email, gender, password: hashedPassword, role });
        res.status(201).json({ status: "success", data: moderator });
    } catch (error) {
        next(error);
    }
};

// Get all moderators.
exports.getAllModerators = async (req, res, next) => {
    try {
        const moderators = await Moderator.find();
        res.status(200).json({ status: "success", data: moderators });
    } catch (error) {
        next(error);
    }
};

// Get a moderator by ID.
exports.getModeratorById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const moderator = await Moderator.findById(id);

        if (!moderator) {
            return next(new AppError("Moderator not found", 404));
        }

        res.status(200).json({ status: "success", data: moderator });
    } catch (error) {
        next(error);
    }
};

// Update a moderator by ID.
exports.updateModerator = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email } = req.body;

        const moderator = await Moderator.findByIdAndUpdate(
            id,
            { name, email },
            { new: true, runValidators: true }
        );

        if (!moderator) {
            return next(new AppError("Moderator not found", 404));
        }

        res.status(200).json({ status: "success", data: moderator });
    } catch (error) {
        next(error);
    }
};

// Delete a moderator by ID.
exports.deleteModerator = async (req, res, next) => {
    try {
        const { id } = req.params;

        const moderator = await Moderator.findByIdAndDelete(id);

        if (!moderator) {
            return next(new AppError("Moderator not found", 404));
        }

        res.status(204).json({ status: "success", message: "Moderator deleted successfully" });
    } catch (error) {
        next(error);
    }
};