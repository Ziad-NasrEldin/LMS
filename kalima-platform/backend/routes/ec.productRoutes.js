const express = require("express");
const router = express.Router();
const productController = require("../controllers/ec.productController");
const authController = require("../controllers/authController");
const verifyJWT = require("../middleware/verifyJWT");
const { uploadProductFilesToDisk } = require("../utils/upload files/uploadFiles");

// All routes require authentication

router
    .route("/")
    .get(productController.getAllProducts)
    .post(
        verifyJWT,
        authController.verifyRoles("Admin", "SubAdmin"),
        uploadProductFilesToDisk, // handles both thumbnail and sample
        productController.createProduct
    );

router
    .route("/:id")
    .get(productController.getProductById)
    .patch(
        verifyJWT,
        authController.verifyRoles("Admin", "SubAdmin"),
        uploadProductFilesToDisk, // handles both thumbnail and sample
        productController.updateProduct
    )
    .delete(
        verifyJWT,
        authController.verifyRoles("Admin", "SubAdmin"),
        productController.deleteProduct);

module.exports = router;
