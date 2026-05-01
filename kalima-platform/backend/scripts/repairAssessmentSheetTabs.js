require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const LecturerExamConfig = require("../models/ExamConfigModel");
const { configureGoogleSheets } = require("../config/googleApiConfig");
const {
  ensureAssessmentSheetTab,
  isLegacyFormResponsesTab,
  listSpreadsheetTabs,
  normalizeSheetTabName,
} = require("../utils/assessmentSheetTabs");

const argSet = new Set(process.argv.slice(2));
const applyChanges = argSet.has("--apply");
const preferLatest = argSet.has("--prefer-latest");

const ensureOutputDir = (outputDir) => {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
};

const sanitizeTabSegment = (value) => {
  const normalizedValue = String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalizedValue || "lecture";
};

const buildFallbackTabName = (config) => {
  const suffix = config.type === "homework" ? "homework" : "exam";
  const baseName = config.name
    ? config.name.replace(new RegExp(`\\s+${suffix}$`, "i"), "")
    : `lecture-${suffix}`;

  return `${sanitizeTabSegment(baseName)}-${suffix}`.slice(0, 100);
};

const run = async () => {
  if (!process.env.DATABASE_URI) {
    throw new Error("DATABASE_URI is required");
  }

  await mongoose.connect(process.env.DATABASE_URI);

  const writableSheets = configureGoogleSheets({ readOnly: false });
  const configs = await LecturerExamConfig.find({ isActive: { $ne: false } })
    .sort({ updatedAt: 1 })
    .lean();

  const outputDir = path.join(__dirname, "output");
  ensureOutputDir(outputDir);

  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-");
  const reportPath = path.join(outputDir, `assessment-sheet-tab-repair-${timestamp}.json`);

  const report = {
    generatedAt: now.toISOString(),
    applyChanges,
    preferLatest,
    summary: {
      total: configs.length,
      healthy: 0,
      repaired: 0,
      unresolved: 0,
      inaccessible: 0,
      skipped: 0,
    },
    items: [],
  };

  for (const config of configs) {
    const currentTabName = normalizeSheetTabName(config.googleSheetTabName);
    const desiredTabName = currentTabName && !isLegacyFormResponsesTab(currentTabName)
      ? currentTabName
      : buildFallbackTabName(config);

    const claimedConfigs = configs.filter(
      (candidate) =>
        String(candidate._id) !== String(config._id) &&
        String(candidate.googleSheetId) === String(config.googleSheetId)
    );
    const claimedTabNames = claimedConfigs.map((candidate) => candidate.googleSheetTabName);
    let spreadsheetTabs = [];

    try {
      spreadsheetTabs = await listSpreadsheetTabs({
        sheets: writableSheets,
        sheetId: config.googleSheetId,
      });
    } catch (error) {
      report.summary.inaccessible += 1;
      report.items.push({
        configId: String(config._id),
        name: config.name,
        type: config.type,
        desiredTabName,
        currentTabName,
        googleSheetId: config.googleSheetId,
        status: "inaccessible",
        reason: error.message,
      });
      continue;
    }

    if (spreadsheetTabs.some((tab) => tab.title === desiredTabName)) {
      report.summary.healthy += 1;
      report.items.push({
        configId: String(config._id),
        name: config.name,
        type: config.type,
        desiredTabName,
        status: "healthy",
      });
      continue;
    }

    let resolution;
    try {
      resolution = await ensureAssessmentSheetTab({
        sheets: writableSheets,
        sheetId: config.googleSheetId,
        desiredTabName,
        currentTabName,
        claimedTabNames,
        preferNewestUnclaimed: preferLatest,
        createIfMissing: false,
      });
    } catch (error) {
      report.summary.inaccessible += 1;
      report.items.push({
        configId: String(config._id),
        name: config.name,
        type: config.type,
        desiredTabName,
        currentTabName,
        googleSheetId: config.googleSheetId,
        status: "inaccessible",
        reason: error.message,
      });
      continue;
    }

    if (resolution.action === "missing") {
      report.summary.unresolved += 1;
      report.items.push({
        configId: String(config._id),
        name: config.name,
        type: config.type,
        desiredTabName,
        currentTabName,
        status: "unresolved",
        reason: "No resolvable linked response tab found",
        unclaimedTabs: (resolution.unclaimedTabs || []).map((tab) => tab.title),
      });
      continue;
    }

    if (applyChanges) {
      await LecturerExamConfig.findByIdAndUpdate(config._id, {
        googleSheetTabName: resolution.title,
      });
    }

    report.summary.repaired += 1;
    report.items.push({
      configId: String(config._id),
      name: config.name,
      type: config.type,
      desiredTabName,
      currentTabName,
      status: applyChanges ? "repaired" : "repair-preview",
      action: resolution.action,
      previousTitle: resolution.previousTitle || null,
    });
  }

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");

  console.log("Assessment sheet tab repair report written:");
  console.log(reportPath);
  console.log(JSON.stringify(report.summary, null, 2));

  await mongoose.connection.close();
};

run()
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error("Assessment sheet tab repair failed:", error);
    try {
      await mongoose.connection.close();
    } catch (_error) {
      // no-op
    }
    process.exit(1);
  });
