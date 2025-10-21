const express = require("express");
const router = express.Router();
const ecSubsectionController = require("../controllers/ec.subSectionController");
const authController = require("../controllers/authController"); // assuming you have one
const verifyJWT = require("./../middleware/verifyJWT");

// Get all subsections
router.get("/", ecSubsectionController.getAllSubSections);

// Protect all routes after this middleware
router.post(
    "/",
    verifyJWT,
    authController.verifyRoles("Admin", "SubAdmin"), // adjust roles as needed
    ecSubsectionController.createSubSection
);


// Get a single subsection with its products
router.get("/:id", ecSubsectionController.getSubSectionWithProducts);

// Update a subsection
router.patch(
    "/:id",
    verifyJWT,
    authController.verifyRoles("Admin", "SubAdmin"),
    ecSubsectionController.updateSubSection
);

// Delete a subsection
router.delete(
    "/:id",
    verifyJWT,
    authController.verifyRoles("Admin", "SubAdmin"),
    ecSubsectionController.deleteSubSection
);

module.exports = router;
