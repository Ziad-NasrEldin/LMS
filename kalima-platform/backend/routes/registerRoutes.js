const multer = require("multer");
const { uploadProfilePicToDisk } = require("../utils/upload files/uploadFiles");
const express = require("express");
const router = express.Router();
const registerController = require("../controllers/registerController.js");
const validateUser = require("../middleware/validateUser.js");

router.route("/").post(
    uploadProfilePicToDisk, // handle profilePic upload
    validateUser,
    registerController.registerNewUser
);

module.exports = router;
