const SubAdmin = require("../models/subAdminModel");
const AppError = require("../utils/appError");
const bcrypt = require("bcrypt");

exports.createSubAdmin = async (req, res, next) => {
    try {
        const { name, email, gender, password, role } = req.body;

        const hashedPassword = await bcrypt.hash(password, 12);

        const subAdmin = await SubAdmin.create({ name, email, gender, password: hashedPassword, role });
        res.status(201).json({ status: "success", data: subAdmin });
    } catch (error) {
        next(error);
    }
};


exports.getAllSubAdmins = async (req, res, next) => {
    try {
        const subAdmins = await SubAdmin.find();
        res.status(200).json({ status: "success", data: subAdmins });
    } catch (error) {
        next(error);
    }
};


exports.getSubAdminById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const subAdmin = await SubAdmin.findById(id);

        if (!subAdmin) {
            return next(new AppError("SubAdmin not found", 404));
        }

        res.status(200).json({ status: "success", data: subAdmin });
    } catch (error) {
        next(error);
    }
};


exports.updateSubAdmin = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email } = req.body;

        const subAdmin = await SubAdmin.findByIdAndUpdate(
            id,
            { name, email },
            { new: true, runValidators: true }
        );

        if (!subAdmin) {
            return next(new AppError("SubAdmin not found", 404));
        }

        res.status(200).json({ status: "success", data: subAdmin });
    } catch (error) {
        next(error);
    }
};

exports.deleteSubAdmin = async (req, res, next) => {
    try {
        const { id } = req.params;

        const subAdmin = await SubAdmin.findByIdAndDelete(id);

        if (!subAdmin) {
            return next(new AppError("SubAdmin not found", 404));
        }

        res.status(204).json({ status: "success", message: "SubAdmin deleted successfully" });
    } catch (error) {
        next(error);
    }
};