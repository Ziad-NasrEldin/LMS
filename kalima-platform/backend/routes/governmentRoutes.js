// routes/governmentRoutes.js
const express = require("express");
const router = express.Router();
const Government = require("../models/governmentModel");

router.get("/", async (req, res) => {
    const governments = await Government.find({}, "name");
    res.json(governments);
});

router.get("/:name/zones", async (req, res) => {
  const gov = await Government.findOne({ name: req.params.name });
  if (!gov) return res.status(404).json({ message: "Government not found" });
  res.json({ zones: gov.administrationZone });
});


module.exports = router;