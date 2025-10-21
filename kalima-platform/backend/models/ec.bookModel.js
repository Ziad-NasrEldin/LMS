const mongoose = require("mongoose");
const Product = require("./ec.productModel");

const bookSchema = new mongoose.Schema({
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true }
});

bookSchema.add({
    description: { type: String, required: [true, "Description is required"], }
});

const ECBook = Product.discriminator("ECBook", bookSchema);

module.exports = ECBook;
