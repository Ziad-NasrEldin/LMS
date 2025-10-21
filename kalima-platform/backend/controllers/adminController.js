const bcrypt = require("bcrypt");
const Admin = require("../models/adminModel");
const AppError = require("../utils/appError");


// Create a new admin.
exports.createAdmin = async (req, res, next) => {
    try {
        const { name, email, gender, password, role } = req.body;

        const hashedPassword = await bcrypt.hash(password, 12);

        const admin = await Admin.create({ name, email, gender, password: hashedPassword, role });
        res.status(201).json({ status: "success", data: admin });
    } catch (error) {
        next(error);
    }
};


// Get all admins.
exports.getAllAdmins = async (req, res, next) => {
    try {
        const admins = await Admin.find().select('name email role gender createdAt updatedAt');
        res.status(200).json({ status: "success", data: admins });
    } catch (error) {
        next(error);
    }
};


//Get an admin by ID.
exports.getAdminById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const admin = await Admin.findById(id);

        if (!admin) {
            return next(new AppError("Admin not found", 404));
        }

        res.status(200).json({ status: "success", data: admin });
    } catch (error) {
        next(error);
    }
};


//Update an admin by ID.
exports.updateAdmin = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email } = req.body;

        const admin = await Admin.findByIdAndUpdate(id, { name, email }, { new: true, runValidators: true });

        if (!admin) {
            return next(new AppError("Admin not found", 404));
        }

        res.status(200).json({ status: "success", data: admin });
    } catch (error) {
        next(error);
    }
};

//Delete an admin by ID.
exports.deleteAdmin = async (req, res, next) => {
    try {
        const { id } = req.params;

        const admin = await Admin.findByIdAndDelete(id);

        if (!admin) {
            return next(new AppError("Admin not found", 404));
        }

        res.status(204).json({ status: "success", message: "Admin deleted successfully" });
    } catch (error) {
        next(error);
    }
};