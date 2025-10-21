const { required } = require("joi");
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        serial: { type: String, required: true },
        thumbnail: { type: String, required: true }, // Store local file path for product image
        sample: { type: String }, // Store local file path for sample PDF
        gallery: [{
            type: String,
        }], // Array of local file paths for gallery images
        section: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ECSection",
            required: true,
        },
        price: { type: Number, required: true },
        paymentNumber: { type: String, required: true },
        discountPercentage: { type: Number },
        priceAfterDiscount: { type: Number },
        subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        description: { type: String, required: [true, "Description is required"], trim: true },
        whatsAppNumber: {
            type: String,
            required: [true, "WhatsApp number is required"],
            trim: true,
        },
        subSection: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ECSubsection",
            required: [true, "Subsection is required"],
            index: true
        },

    },
    {
        timestamps: { createdAt: true, updatedAt: true },
    }
);

// Middleware to calculate discountPercentage from price and priceAfterDiscount
productSchema.pre("save", function (next) {
    if (this.price && this.priceAfterDiscount !== undefined && this.price !== 0) {
        this.discountPercentage = Math.round(((this.price - this.priceAfterDiscount) / this.price) * 100);
    } else {
        this.discountPercentage = 0;
    }
    next();
});

productSchema.pre("findOneAndUpdate", function (next) {
    const update = this.getUpdate();
    let price = update.price;
    let priceAfterDiscount = update.priceAfterDiscount;
    if (update.$set) {
        price = update.$set.price !== undefined ? update.$set.price : price;
        priceAfterDiscount = update.$set.priceAfterDiscount !== undefined ? update.$set.priceAfterDiscount : priceAfterDiscount;
    }
    this.model.findOne(this.getQuery()).then((doc) => {
        const finalPrice = typeof price === "number" ? price : doc ? doc.price : 0;
        const finalPriceAfterDiscount = typeof priceAfterDiscount === "number" ? priceAfterDiscount : doc ? doc.priceAfterDiscount : finalPrice;
        let discount = 0;
        if (finalPrice && finalPriceAfterDiscount !== undefined && finalPrice !== 0) {
            discount = Math.round(((finalPrice - finalPriceAfterDiscount) / finalPrice) * 100);
            ;
        }
        if (update.$set) update.$set.discountPercentage = discount;
        else update.discountPercentage = discount;
        this.setUpdate(update);
        next();
    });
});

module.exports = mongoose.model("ECProduct", productSchema);
