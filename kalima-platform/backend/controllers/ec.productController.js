const ECProduct = require("../models/ec.productModel");
const path = require("path");
const fs = require("fs");

// Helper to check PDF file size (max 50MB)
function isValidPDF(file) {
    return (
        file &&
        file.mimetype === "application/pdf" &&
        file.size <= 75 * 1024 * 1024 // 50MB
    );
}

exports.createProduct = async (req, res, next) => {
    try {
        const { title, serial, section, price, priceAfterDiscount, description, whatsAppNumber, paymentNumber, subSection } = req.body;
        const createdBy = req.user._id;
        let sample, imageUrl, gallery = [];
        if (req.files && req.files.sample && req.files.sample[0]) {
            const file = req.files.sample[0];
            if (file.mimetype !== "application/pdf" || file.size > 75 * 1024 * 1024) {
                return res.status(400).json({ message: "Sample must be a PDF and <= 75MB" });
            }
            sample = file.path;
        }
        if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
            imageUrl = req.files.thumbnail[0].path;
        }
        if (req.files && req.files.gallery) {
            gallery = req.files.gallery.map(file => file.path);
        }
        // discountPercentage will be auto-calculated in the model, do not include in create
        const product = await ECProduct.create({
            title,
            thumbnail: imageUrl,
            sample,
            gallery,
            section,
            serial,
            price,
            priceAfterDiscount,
            description,
            whatsAppNumber,
            paymentNumber,
            subSection,
            createdBy,
        });

        res.status(201).json({
            message: "Product created successfully",
            data: {
                product
            }
        });
    } catch (err) {
        next(err);
    }
};

exports.getAllProducts = async (req, res) => {
    try {
        const products = await ECProduct.find().populate({
            path: "section",
            select: "number"
        }).sort({ createdAt: -1 }).populate({ path: "subSection", select: "name" });
        // Ensure all fields are present in the response
        const productsWithAllFields = products.map(product => {
            const obj = product.toObject();
            return {
                ...obj,
                description: obj.description,
                whatsAppNumber: obj.whatsAppNumber,
                paymentNumber: obj.paymentNumber,
                gallery: obj.gallery
            };
        });
        res.status(200).json({
            status: "success",
            results: productsWithAllFields.length,
            data: {
                products: productsWithAllFields,
            },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const product = await ECProduct.findById(req.params.id).populate({
            path: "section",
            select: "number"
        }).populate({ path: "subSection", select: "name" });

        if (!product) return res.status(404).json({ message: "Product not found" });
        const obj = product.toObject();
        res.status(200).json({
            status: "success",
            data: {
                product: {
                    ...obj,
                    description: obj.description,
                    whatsAppNumber: obj.whatsAppNumber,
                    paymentNumber: obj.paymentNumber,
                    gallery: obj.gallery
                },
            },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { title, section, price, priceAfterDiscount, serial, description, subSection, whatsAppNumber, paymentNumber, subject } = req.body;
        const updatedBy = req.user._id;

        // 1️⃣ Get the existing product first
        const existingProduct = await ECProduct.findById(req.params.id);
        if (!existingProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        // 2️⃣ Start building the update object after we have existingProduct
        const update = {
            title,
            section,
            price,
            priceAfterDiscount,
            serial,
            description,
            updatedBy,
            whatsAppNumber,
            subSection,
            paymentNumber,
            subject: subject || existingProduct.subject,
            thumbnail: existingProduct.thumbnail,
            sample: existingProduct.sample,
            gallery: existingProduct.gallery,
            updatedAt: new Date(),
        };

        // Handle PDF sample update
        if (req.files?.sample?.[0]) {
            const file = req.files.sample[0];

            if (file.mimetype !== "application/pdf") {
                return res.status(400).json({ message: "Sample must be a PDF file" });
            }
            if (file.size > 75 * 1024 * 1024) {
                return res.status(400).json({ message: "Sample file size must be <= 75MB" });
            }

            if (existingProduct.sample && fs.existsSync(existingProduct.sample)) {
                fs.unlinkSync(existingProduct.sample);
            }

            update.sample = file.path;
        }

        // Handle thumbnail update
        if (req.files?.thumbnail?.[0]) {
            const file = req.files.thumbnail[0];
            const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

            if (!allowedImageTypes.includes(file.mimetype)) {
                return res.status(400).json({ message: "Thumbnail must be JPEG, PNG, or WebP" });
            }
            if (file.size > 5 * 1024 * 1024) {
                return res.status(400).json({ message: "Thumbnail file size must be <= 5MB" });
            }

            if (existingProduct.thumbnail && fs.existsSync(existingProduct.thumbnail)) {
                fs.unlinkSync(existingProduct.thumbnail);
            }

            update.thumbnail = file.path;
        }

        // Handle gallery update
        if (req.files?.gallery?.length > 0) {
            const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

            for (const file of req.files.gallery) {
                if (!allowedImageTypes.includes(file.mimetype)) {
                    return res.status(400).json({ message: "All gallery images must be JPEG, PNG, or WebP" });
                }
                if (file.size > 5 * 1024 * 1024) {
                    return res.status(400).json({ message: "Each gallery image must be <= 5MB" });
                }
            }

            if (existingProduct.gallery?.length > 0) {
                existingProduct.gallery.forEach((imagePath) => {
                    if (fs.existsSync(imagePath)) {
                        fs.unlinkSync(imagePath);
                    }
                });
            }

            update.gallery = req.files.gallery.map((file) => file.path);
        }

        // 3️⃣ Save the updated product
        const product = await ECProduct.findByIdAndUpdate(req.params.id, update, {
            new: true,
            runValidators: true,
        }).populate({ path: "section", select: "number" });

        res.status(200).json({
            status: "success",
            data: { product },
        });
    } catch (err) {
        console.error("Error updating product:", err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
            error: process.env.NODE_ENV === "development" ? err.message : undefined,
        });
    }
};


exports.deleteProduct = async (req, res) => {
    try {
        const product = await ECProduct.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });
        // Optionally delete the sample file
        if (product.sample && fs.existsSync(product.sample)) {
            fs.unlinkSync(product.sample);
        }
        res.status(200).json({
            status: "success",
            message: "Product deleted"
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
