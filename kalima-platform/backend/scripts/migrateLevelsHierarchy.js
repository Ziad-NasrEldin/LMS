require("dotenv").config();
const mongoose = require("mongoose");

const Level = require("../models/levelModel");
const Student = require("../models/studentModel");
const Teacher = require("../models/teacherModel");
const Parent = require("../models/parentModel");
const {
  STAGE_KEYS,
  inferStageKeyFromName,
  normalizeText,
} = require("../utils/levelHierarchy");

const argSet = new Set(process.argv.slice(2));
const shouldApply = argSet.has("--apply");

const STAGE_META = {
  primary: { order: 1, en: "primary", ar: "الابتدائي" },
  preparatory: { order: 2, en: "preparatory", ar: "الإعدادي" },
  secondary: { order: 3, en: "secondary", ar: "الثانوي" },
};

const ORDINAL_META = [
  { order: 1, en: ["first", "1st", "1", "one"], ar: ["الأول", "الاول"] },
  { order: 2, en: ["second", "2nd", "2", "two"], ar: ["الثاني", "الثانى"] },
  { order: 3, en: ["third", "3rd", "3", "three"], ar: ["الثالث"] },
  { order: 4, en: ["fourth", "4th", "4rth", "4", "four"], ar: ["الرابع", "الرابعه", "الرابعة"] },
  { order: 5, en: ["fifth", "5th", "5", "five"], ar: ["الخامس"] },
  { order: 6, en: ["sixth", "6th", "6", "six"], ar: ["السادس"] },
];

const STAGE_DEFINITIONS = STAGE_KEYS.map((key, index) => ({
  key,
  name: STAGE_META[key].en,
  nameAr: STAGE_META[key].ar,
  sortOrder: index + 1,
}));

const GRADE_DEFINITIONS = STAGE_KEYS.flatMap((stageKey) =>
  ORDINAL_META.map((ordinal) => ({
    stageKey,
    order: ordinal.order,
    name: `${ordinal.en[0]} ${STAGE_META[stageKey].en}`,
    nameAr: `الصف ${ordinal.ar[0]} ${STAGE_META[stageKey].ar}`,
    sortOrder: ordinal.order,
  }))
);

const normalizeMigrationText = (value) =>
  normalizeText(String(value || "").replace(/\b(\d)rth\b/g, "$1th"));

const inferGradeOrder = (value) => {
  const text = normalizeMigrationText(value);
  if (!text) return null;

  const patterns = [
    [/\b(?:1st|first|one|grade\s*1|grade\s*one|1)\b|الأول|الاول/, 1],
    [/\b(?:2nd|second|two|grade\s*2|grade\s*two|2)\b|الثاني|الثانى/, 2],
    [/\b(?:3rd|third|three|grade\s*3|grade\s*three|3)\b|الثالث/, 3],
    [/\b(?:4th|4rth|fourth|four|grade\s*4|grade\s*four|4)\b|الرابع|الرابعه|الرابعة/, 4],
    [/\b(?:5th|fifth|five|grade\s*5|grade\s*five|5)\b|الخامس/, 5],
    [/\b(?:6th|sixth|six|grade\s*6|grade\s*six|6)\b|السادس/, 6],
  ];

  for (const [pattern, order] of patterns) {
    if (pattern.test(text)) {
      return order;
    }
  }

  return null;
};

const detectConcept = (value) => {
  const text = normalizeMigrationText(value);
  if (!text) return null;

  const stageKey = inferStageKeyFromName(text, text);
  const order = inferGradeOrder(text);

  if (stageKey && order) {
    return { kind: "grade", key: `${stageKey}:${order}` };
  }

  if (stageKey) {
    return { kind: "stage", key: stageKey };
  }

  if (order) {
    return { kind: "grade", key: `primary:${order}` };
  }

  return null;
};

const toIdString = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value._id) return String(value._id);
  return String(value);
};

const buildLevelLookups = (levels) => {
  const byId = new Map();
  const byExactText = new Map();

  for (const level of levels) {
    const id = toIdString(level._id);
    if (id) {
      byId.set(id, level);
    }

    for (const candidate of [level.name, level.nameAr]) {
      const text = normalizeMigrationText(candidate);
      if (text && !byExactText.has(text)) {
        byExactText.set(text, level);
      }
    }
  }

  return { byId, byExactText };
};

const findConceptMatch = (levels, concept) =>
  levels.find((level) => {
    const levelConcept = detectConcept(level.name) || detectConcept(level.nameAr);
    if (!levelConcept) return false;
    return levelConcept.kind === concept.kind && levelConcept.key === concept.key;
  }) || null;

const resolveLevelFromValue = (value, lookups, levels, canonicalByConcept) => {
  if (!value) return null;

  const id = toIdString(value);
  if (id && lookups.byId.has(id)) {
    return lookups.byId.get(id);
  }

  const normalized = normalizeMigrationText(typeof value === "object" ? value.name || value.nameAr : value);
  if (normalized && lookups.byExactText.has(normalized)) {
    return lookups.byExactText.get(normalized);
  }

  const concept = detectConcept(value);
  if (concept && canonicalByConcept.has(concept.key)) {
    return canonicalByConcept.get(concept.key);
  }

  if (concept) {
    const matchedLevel = findConceptMatch(levels, concept);
    if (matchedLevel) {
      return matchedLevel;
    }
  }

  return null;
};

const createOrUpdateLevel = async (existingLevel, payload) => {
  if (!shouldApply) {
    return {
      action: existingLevel ? "would-update" : "would-create",
      level:
        existingLevel ||
        {
          ...payload,
          _id: new mongoose.Types.ObjectId(),
        },
    };
  }

  if (existingLevel) {
    const updated = await Level.findByIdAndUpdate(
      existingLevel._id,
      {
        ...payload,
        isActive:
          existingLevel.isActive === false ? false : payload.isActive !== false,
      },
      { new: true, runValidators: true }
    ).lean();

    return { action: "updated", level: updated };
  }

  const created = await Level.create({
    ...payload,
    isActive: payload.isActive !== false,
  });

  return { action: "created", level: created.toObject() };
};

const resolveStageDefinition = (levels, definition) => {
  const concept = { kind: "stage", key: definition.key };
  const direct = levels.find((level) => {
    const exact = normalizeMigrationText(level.name);
    const exactAr = normalizeMigrationText(level.nameAr);
    return (
      exact === normalizeMigrationText(definition.name) ||
      exactAr === normalizeMigrationText(definition.nameAr)
    );
  });

  if (direct) return direct;

  return findConceptMatch(levels, concept);
};

const resolveGradeDefinition = (levels, definition) => {
  const concept = { kind: "grade", key: `${definition.stageKey}:${definition.order}` };
  const direct = levels.find((level) => {
    const exact = normalizeMigrationText(level.name);
    const exactAr = normalizeMigrationText(level.nameAr);
    return (
      exact === normalizeMigrationText(definition.name) ||
      exactAr === normalizeMigrationText(definition.nameAr)
    );
  });

  if (direct) return direct;

  return findConceptMatch(levels, concept);
};

const run = async () => {
  if (!process.env.DATABASE_URI) {
    throw new Error("DATABASE_URI is required");
  }

  await mongoose.connect(process.env.DATABASE_URI);

  const initialLevels = await Level.find().lean();
  const stageResults = new Map();
  const gradeResults = new Map();
  const summary = {
    stagesCreated: 0,
    stagesUpdated: 0,
    gradesCreated: 0,
    gradesUpdated: 0,
    studentRowsUpdated: 0,
    teacherRowsUpdated: 0,
    parentRowsUpdated: 0,
    studentFallbackRows: 0,
  };

  let workingLevels = [...initialLevels];

  for (const definition of STAGE_DEFINITIONS) {
    const existingLevel = resolveStageDefinition(workingLevels, definition);
    const payload = {
      name: existingLevel ? existingLevel.name : definition.name,
      nameAr: existingLevel ? existingLevel.nameAr : definition.nameAr,
      kind: "stage",
      parentLevel: null,
      sortOrder: definition.sortOrder,
      isActive: existingLevel ? existingLevel.isActive !== false : true,
    };

    const result = await createOrUpdateLevel(existingLevel, payload);
    if (result.action === "created") summary.stagesCreated += 1;
    if (result.action === "updated") summary.stagesUpdated += 1;

    const stored = result.level;
    stageResults.set(definition.key, stored);
    workingLevels = workingLevels.filter((level) => toIdString(level._id) !== toIdString(stored._id));
    workingLevels.push(stored);
  }

  for (const definition of GRADE_DEFINITIONS) {
    const stageLevel = stageResults.get(definition.stageKey);
    if (!stageLevel) {
      throw new Error(`Missing stage for grade definition ${definition.stageKey}:${definition.order}`);
    }

    const existingLevel = resolveGradeDefinition(workingLevels, definition);
    const payload = {
      name: existingLevel ? existingLevel.name : definition.name,
      nameAr: existingLevel ? existingLevel.nameAr : definition.nameAr,
      kind: "grade",
      parentLevel: stageLevel._id,
      sortOrder: definition.sortOrder,
      isActive: existingLevel ? existingLevel.isActive !== false : true,
    };

    const result = await createOrUpdateLevel(existingLevel, payload);
    if (result.action === "created") summary.gradesCreated += 1;
    if (result.action === "updated") summary.gradesUpdated += 1;

    const stored = result.level;
    gradeResults.set(`${definition.stageKey}:${definition.order}`, stored);
    workingLevels = workingLevels.filter((level) => toIdString(level._id) !== toIdString(stored._id));
    workingLevels.push(stored);
  }

  const refreshedLevels = await Level.find().lean();
  const lookups = buildLevelLookups(refreshedLevels);
  const canonicalByConcept = new Map();

  for (const stage of stageResults.values()) {
    const concept = detectConcept(stage.name) || detectConcept(stage.nameAr);
    if (concept) {
      canonicalByConcept.set(concept.key, stage);
    }
  }

  for (const grade of gradeResults.values()) {
    const concept = detectConcept(grade.name) || detectConcept(grade.nameAr);
    if (concept) {
      canonicalByConcept.set(concept.key, grade);
    }
  }

  const students = await Student.find().select("_id stage level").lean();
  for (const student of students) {
    const currentStage = resolveLevelFromValue(student.stage, lookups, refreshedLevels, canonicalByConcept);
    const currentLevel = resolveLevelFromValue(student.level, lookups, refreshedLevels, canonicalByConcept);
    const nextUpdate = {};

    if (currentLevel && currentLevel.kind === "grade") {
      nextUpdate.level = currentLevel._id;
      nextUpdate.stage = currentLevel.parentLevel || nextUpdate.stage || currentStage?._id || null;
    } else if (currentLevel && currentLevel.kind === "stage") {
      nextUpdate.stage = currentLevel._id;
      const fallbackGrade = gradeResults.get(`${currentLevel.stageKey || detectConcept(currentLevel.name)?.key}:${1}`);
      if (fallbackGrade) {
        nextUpdate.level = fallbackGrade._id;
      }
    } else if (currentStage && currentStage.kind === "stage") {
      nextUpdate.stage = currentStage._id;
      const fallbackGrade = gradeResults.get(`${currentStage.stageKey || detectConcept(currentStage.name)?.key}:${1}`);
      if (fallbackGrade) {
        nextUpdate.level = fallbackGrade._id;
        summary.studentFallbackRows += 1;
      }
    }

    if (!nextUpdate.stage && currentStage) {
      nextUpdate.stage = currentStage._id;
    }

    if (!nextUpdate.level && currentLevel && currentLevel.kind === "grade") {
      nextUpdate.level = currentLevel._id;
    }

    if (nextUpdate.stage || nextUpdate.level) {
      summary.studentRowsUpdated += 1;
      if (shouldApply) {
        await Student.updateOne(
          { _id: student._id },
          { $set: nextUpdate }
        );
      }
    }
  }

  const teachers = await Teacher.find().select("_id level").lean();
  for (const teacher of teachers) {
    const values = Array.isArray(teacher.level) ? teacher.level : teacher.level ? [teacher.level] : [];
    const stageIds = [];

    for (const value of values) {
      const levelDoc = resolveLevelFromValue(value, lookups, refreshedLevels, canonicalByConcept);
      if (!levelDoc) {
        continue;
      }

      const resolvedStageId =
        levelDoc.kind === "stage"
          ? levelDoc._id
          : levelDoc.parentLevel || null;

      if (resolvedStageId) {
        const resolvedStageIdStr = toIdString(resolvedStageId);
        if (!stageIds.includes(resolvedStageIdStr)) {
          stageIds.push(resolvedStageIdStr);
        }
      }
    }

    if (stageIds.length > 0) {
      summary.teacherRowsUpdated += 1;
      if (shouldApply) {
        await Teacher.updateOne(
          { _id: teacher._id },
          { $set: { level: stageIds } }
        );
      }
    }
  }

  const parents = await Parent.find().select("_id level").lean();
  for (const parent of parents) {
    const levelDoc = resolveLevelFromValue(parent.level, lookups, refreshedLevels, canonicalByConcept);
    if (!levelDoc) {
      continue;
    }

    summary.parentRowsUpdated += 1;
    if (shouldApply) {
      await Parent.updateOne(
        { _id: parent._id },
        { $set: { level: levelDoc._id } }
      );
    }
  }

  if (!shouldApply) {
    console.log("Dry run only. Re-run with --apply to persist the migration.");
  }

  console.log(
    JSON.stringify(
      {
        mode: shouldApply ? "apply" : "dry-run",
        summary,
      },
      null,
      2
    )
  );

  await mongoose.connection.close();
};

run().catch(async (error) => {
  console.error("Level hierarchy migration failed:", error);
  try {
    await mongoose.connection.close();
  } catch (closeError) {
    console.error("Failed to close MongoDB connection:", closeError);
  }
  process.exit(1);
});
