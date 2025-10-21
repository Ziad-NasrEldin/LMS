const express = require("express");
const router = express.Router();
const ecBookController = require("../controllers/ec.bookController");
const verifyJWT = require("../middleware/verifyJWT");
const { uploadProductFilesToDisk } = require("../utils/upload files/uploadFiles");
const authController = require("../controllers/authController");


router
    .route("/")
    .get(ecBookController.getAllECBooks)
    .post(
        verifyJWT,
        authController.verifyRoles("Admin", "SubAdmin"),
        uploadProductFilesToDisk, // handles both thumbnail and sample
        ecBookController.createECBook
    );

router
    .route("/:id")
    .get(ecBookController.getECBookById)
    .patch(
        verifyJWT,
        authController.verifyRoles("Admin", "SubAdmin"),
        uploadProductFilesToDisk, // handles both thumbnail and sample
        ecBookController.updateECBook
    )
    .delete(
        verifyJWT,
        authController.verifyRoles("Admin", "SubAdmin"),
        ecBookController.deleteECBook);

module.exports = router;