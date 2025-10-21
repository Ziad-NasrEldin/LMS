const ECBook = require("../models/ec.bookModel");
const mongoose = require("mongoose");

// Create ECBook
exports.createECBook = async (req, res, next) => {
    try {
        const { title, serial, section, price, paymentNumber, priceAfterDiscount, subject, description, gallery, subSection, whatsAppNumber } = req.body;
        const createdBy = req.user._id;
        let sample, thumbnail, galleryArr = [];
        // Handle sample PDF
        if (req.files && req.files.sample && req.files.sample[0]) {
            const file = req.files.sample[0];
            // Debug: log file info
            console.log('Sample file:', file);
            if (file.mimetype !== "application/pdf" || file.size > 75 * 1024 * 1024) {
                return res.status(400).json({ message: "Sample must be a PDF and <= 75MB" });
            }
            // Use local file path from multer
            sample = file.path;
        }
        // Handle thumbnail image
        if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
            const file = req.files.thumbnail[0];
            // Use local file path from multer
            thumbnail = file.path;
        } else {
            return res.status(400).json({ message: "Thumbnail image is required" });
        }
        // Handle gallery images
        if (req.files && req.files.gallery) {
            galleryArr = req.files.gallery.map(file => file.path);
        } else if (gallery) {
            galleryArr = Array.isArray(gallery) ? gallery : [gallery];
        }
        const newBook = await ECBook.create({
            title,
            serial,
            section,
            price,
            paymentNumber,
            priceAfterDiscount,
            subject,
            thumbnail,
            sample,
            description,
            gallery: galleryArr,
            subSection,
            whatsAppNumber,
            createdBy
        });
        res.status(201).json({
            message: "ECBook created successfully",
            data: { book: newBook }
        });
    } catch (err) {
        next(err);
    }
};

// Get all ECBooks
exports.getAllECBooks = async (req, res) => {
    try {
        const books = await ECBook.find({}, "-__v")
            .populate({ path: "subject", model: "Subject", select: "name" }).populate({ path: "section", model: "ECSection", select: "number" })
            .select("-__v");
        res.status(200).json({
            status: "success",
            results: books.length,
            data: { books }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get ECBook by ID
exports.getECBookById = async (req, res) => {
    try {
        const book = await ECBook.findById(req.params.id).populate("subject", "name").select("-__v");
        if (!book) return res.status(404).json({ message: "Book not found" });
        res.status(201).json({
            status: "success",
            data: { book }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update ECBook
exports.updateECBook = async (req, res) => {
    try {
        const updateData = { ...req.body };
        if (req.files?.thumbnail?.[0]) updateData.thumbnail = req.files.thumbnail[0].path;
        if (req.files?.sample?.[0]) updateData.sample = req.files.sample[0].path;
        // Handle gallery update
        if (req.files?.gallery) {
            updateData.gallery = req.files.gallery.map(file => file.path);
        } else if (updateData.gallery) {
            // If gallery is sent as array or string in body
            updateData.gallery = Array.isArray(updateData.gallery) ? updateData.gallery : [updateData.gallery];
        }
        const book = await ECBook.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
        if (!book) return res.status(404).json({ message: "ECBook not found" });
        res.status(201).json({
            message: "Book updated successfully",
            data: { book }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete ECBook
exports.deleteECBook = async (req, res) => {
    try {
        const book = await ECBook.findByIdAndDelete(req.params.id);
        if (!book) return res.status(404).json({ message: "Book not found" });
        res.status(204).json({ message: "Book deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
