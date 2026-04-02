const mongoose = require("mongoose");
const AppError = require("./appError");

const LEVEL_KINDS = {
  STAGE: "stage",
  GRADE: "grade",
};

const STAGE_KEYS = ["primary", "preparatory", "secondary"];

const STAGE_DISPLAY_NAMES = {
  primary: { en: "Primary", ar: "الابتدائي" },
  preparatory: { en: "Preparatory", ar: "الإعدادي" },
  secondary: { en: "Secondary", ar: "الثانوي" },
};

const LEGACY_GRADE_DISPLAY_NAMES = {
  "grade 1": { en: "1st Primary", ar: "الصف الأول الابتدائي" },
  "grade 2": { en: "2nd Primary", ar: "الصف الثاني الابتدائي" },
  "grade 3": { en: "3rd Primary", ar: "الصف الثالث الابتدائي" },
  "grade 4": { en: "4th Primary", ar: "الصف الرابع الابتدائي" },
  "grade 5": { en: "5th Primary", ar: "الصف الخامس الابتدائي" },
  "grade 6": { en: "6th Primary", ar: "الصف السادس الابتدائي" },
  "first primary": { en: "1st Primary", ar: "الصف الأول الابتدائي" },
  "second primary": { en: "2nd Primary", ar: "الصف الثاني الابتدائي" },
  "third primary": { en: "3rd Primary", ar: "الصف الثالث الابتدائي" },
  "fourth primary": { en: "4th Primary", ar: "الصف الرابع الابتدائي" },
  "fifth primary": { en: "5th Primary", ar: "الصف الخامس الابتدائي" },
  "sixth primary": { en: "6th Primary", ar: "الصف السادس الابتدائي" },
  "first elementary": { en: "1st Primary", ar: "الصف الأول الابتدائي" },
  "second elementary": { en: "2nd Primary", ar: "الصف الثاني الابتدائي" },
  "third elementary": { en: "3rd Primary", ar: "الصف الثالث الابتدائي" },
  "fourth elementary": { en: "4th Primary", ar: "الصف الرابع الابتدائي" },
  "fifth elementary": { en: "5th Primary", ar: "الصف الخامس الابتدائي" },
  "sixth elementary": { en: "6th Primary", ar: "الصف السادس الابتدائي" },
  "first preparatory": { en: "1st Preparatory", ar: "الصف الأول الإعدادي" },
  "second preparatory": { en: "2nd Preparatory", ar: "الصف الثاني الإعدادي" },
  "third preparatory": { en: "3rd Preparatory", ar: "الصف الثالث الإعدادي" },
  "first secondary": { en: "1st Secondary", ar: "الصف الأول الثانوي" },
  "second secondary": { en: "2nd Secondary", ar: "الصف الثاني الثانوي" },
  "third secondary": { en: "3rd Secondary", ar: "الصف الثالث الثانوي" },
  "primary stage": { en: "Primary", ar: "الابتدائي" },
  "preparatory stage": { en: "Preparatory", ar: "الإعدادي" },
  "secondary stage": { en: "Secondary", ar: "الثانوي" },
};

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const normalizeLocale = (locale) =>
  String(locale || "en").toLowerCase().startsWith("ar") ? "ar" : "en";

const formatTitleCase = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b([a-z])/g, (match) => match.toUpperCase());

const getStageDisplayName = (stageLike, locale = "en") => {
  const lang = normalizeLocale(locale);
  const rawName = normalizeText(
    typeof stageLike === "object" ? stageLike?.name : stageLike
  );
  const legacy = STAGE_DISPLAY_NAMES[rawName];

  if (legacy) {
    return legacy[lang];
  }

  if (typeof stageLike === "object") {
    const directNameAr = String(stageLike?.nameAr || "").trim();
    const directName = String(stageLike?.name || "").trim();

    if (lang === "ar" && directNameAr && normalizeText(directNameAr) !== normalizeText(directName)) {
      return directNameAr;
    }

    if (directName) {
      return formatTitleCase(directName);
    }
  }

  return formatTitleCase(rawName);
};

const resolveLegacyGradeDisplayName = (gradeLike, locale = "en") => {
  const lang = normalizeLocale(locale);
  const rawName = normalizeText(
    typeof gradeLike === "object" ? gradeLike?.name : gradeLike
  );
  const legacy = LEGACY_GRADE_DISPLAY_NAMES[rawName];

  if (legacy) {
    return legacy[lang];
  }

  if (typeof gradeLike === "object") {
    const directNameAr = String(gradeLike?.nameAr || "").trim();
    const directName = String(gradeLike?.name || "").trim();

    if (lang === "ar" && directNameAr && normalizeText(directNameAr) !== normalizeText(directName)) {
      return directNameAr;
    }

    if (directName) {
      return formatTitleCase(directName);
    }
  }

  return formatTitleCase(rawName);
};

const resolveLevelDisplayName = (levelLike, locale = "en") => {
  if (!levelLike) {
    return "-";
  }

  if (typeof levelLike === "string") {
    const normalized = normalizeText(levelLike);
    if (STAGE_KEYS.includes(normalized)) {
      return getStageDisplayName(normalized, locale);
    }
    return resolveLegacyGradeDisplayName(normalized, locale);
  }

  if (levelLike.displayName) {
    return levelLike.displayName;
  }

  if (levelLike.kind === LEVEL_KINDS.STAGE) {
    return getStageDisplayName(levelLike, locale);
  }

  return resolveLegacyGradeDisplayName(levelLike, locale);
};

const inferStageKeyFromName = (name, nameAr) => {
  const candidates = [normalizeText(name), normalizeText(nameAr)];

  const matches = {
    primary: [
      "primary",
      "elementary",
      "ابتدائي",
      "الابتدائي",
      "المرحلة الابتدائية",
      "primary stage",
    ],
    preparatory: [
      "preparatory",
      "prep",
      "إعدادي",
      "الإعدادي",
      "المرحلة الاعدادية",
      "preparatory stage",
    ],
    secondary: [
      "secondary",
      "ثانوي",
      "الثانوي",
      "المرحلة الثانوية",
      "secondary stage",
    ],
  };

  for (const candidate of candidates) {
    for (const [stageKey, values] of Object.entries(matches)) {
      if (values.includes(candidate)) {
        return stageKey;
      }
    }
  }

  return null;
};

const inferLevelKind = ({ kind, name, nameAr, parentLevel }) => {
  const normalizedKind = normalizeText(kind);
  if (normalizedKind === LEVEL_KINDS.STAGE || normalizedKind === LEVEL_KINDS.GRADE) {
    return normalizedKind;
  }

  if (parentLevel) {
    return LEVEL_KINDS.GRADE;
  }

  const stageKey = inferStageKeyFromName(name, nameAr);
  if (stageKey && normalizeText(name) === stageKey) {
    return LEVEL_KINDS.STAGE;
  }

  if (stageKey && !/^\s*(?:\d+(?:st|nd|rd|th)?|first|second|third|fourth|fifth|sixth|grade\s*\d+)\b/i.test(String(name || ""))) {
    return LEVEL_KINDS.STAGE;
  }

  return LEVEL_KINDS.GRADE;
};

const inferGradeSortOrder = ({ name, nameAr }) => {
  const combined = `${normalizeText(name)} ${normalizeText(nameAr)}`;
  const matchers = [
    [/(?:^|\s)(?:grade\s*)?1(?:st)?(?:\s|$)|first(?:\s|$)/, 1],
    [/(?:^|\s)(?:grade\s*)?2(?:nd)?(?:\s|$)|second(?:\s|$)/, 2],
    [/(?:^|\s)(?:grade\s*)?3(?:rd)?(?:\s|$)|third(?:\s|$)/, 3],
    [/(?:^|\s)(?:grade\s*)?4(?:th)?(?:\s|$)|fourth(?:\s|$)/, 4],
    [/(?:^|\s)(?:grade\s*)?5(?:th)?(?:\s|$)|fifth(?:\s|$)/, 5],
    [/(?:^|\s)(?:grade\s*)?6(?:th)?(?:\s|$)|sixth(?:\s|$)/, 6],
  ];

  for (const [regex, order] of matchers) {
    if (regex.test(combined)) {
      return order;
    }
  }

  return 0;
};

const inferLevelMetadata = (levelLike = {}) => {
  const name = String(levelLike.name || "").trim();
  const nameAr = String(levelLike.nameAr || "").trim();
  const kind = inferLevelKind({
    kind: levelLike.kind,
    name,
    nameAr,
    parentLevel: levelLike.parentLevel,
  });
  const stageKey = inferStageKeyFromName(name, nameAr);

  return {
    kind,
    stageKey,
    sortOrder:
      levelLike.sortOrder !== undefined && levelLike.sortOrder !== null && levelLike.sortOrder !== ""
        ? Number(levelLike.sortOrder)
        : kind === LEVEL_KINDS.STAGE
          ? STAGE_KEYS.indexOf(stageKey) + 1 || 0
          : inferGradeSortOrder({ name, nameAr }),
  };
};

const normalizeLevelDoc = (levelDoc, locale = "en") => {
  if (!levelDoc) {
    return null;
  }

  const plain = typeof levelDoc.toObject === "function" ? levelDoc.toObject() : { ...levelDoc };
  const metadata = inferLevelMetadata(plain);
  const normalized = {
    ...plain,
    kind: plain.kind || metadata.kind,
    stageKey: metadata.stageKey,
    sortOrder: metadata.sortOrder,
    displayName: resolveLevelDisplayName(
      {
        ...plain,
        kind: plain.kind || metadata.kind,
      },
      locale
    ),
    isActive: plain.isActive !== false,
  };

  if (normalized.parentLevel && typeof normalized.parentLevel === "object" && normalized.parentLevel._id) {
    normalized.parentLevelId = normalized.parentLevel._id.toString();
  } else if (normalized.parentLevel) {
    normalized.parentLevelId = normalized.parentLevel.toString();
  } else {
    normalized.parentLevelId = null;
  }

  return normalized;
};

const buildLevelHierarchy = (levels = [], locale = "en") => {
  const normalizedLevels = levels.map((level) => normalizeLevelDoc(level, locale)).filter(Boolean);
  const activeLevels = normalizedLevels.filter((level) => level.isActive !== false);

  const stageLevels = activeLevels
    .filter((level) => level.kind === LEVEL_KINDS.STAGE)
    .sort((left, right) => {
      const leftSort = Number.isFinite(left.sortOrder) ? left.sortOrder : 0;
      const rightSort = Number.isFinite(right.sortOrder) ? right.sortOrder : 0;
      if (leftSort !== rightSort) return leftSort - rightSort;
      return left.displayName.localeCompare(right.displayName);
    });

  const stageIndexById = new Map(
    stageLevels.map((stageLevel, index) => [stageLevel._id.toString(), index])
  );

  const gradeLevels = activeLevels
    .filter((level) => level.kind !== LEVEL_KINDS.STAGE)
    .sort((left, right) => {
      const leftStageIndex = stageIndexById.get(left.parentLevelId) ?? Number.MAX_SAFE_INTEGER;
      const rightStageIndex = stageIndexById.get(right.parentLevelId) ?? Number.MAX_SAFE_INTEGER;
      if (leftStageIndex !== rightStageIndex) return leftStageIndex - rightStageIndex;

      const leftSort = Number.isFinite(left.sortOrder) ? left.sortOrder : 0;
      const rightSort = Number.isFinite(right.sortOrder) ? right.sortOrder : 0;
      if (leftSort !== rightSort) return leftSort - rightSort;

      return left.displayName.localeCompare(right.displayName);
    });

  const gradesByStageId = stageLevels.reduce((acc, stageLevel) => {
    acc[stageLevel._id.toString()] = gradeLevels.filter(
      (gradeLevel) => gradeLevel.parentLevelId === stageLevel._id.toString()
    );
    return acc;
  }, {});

  return {
    levels: normalizedLevels,
    activeLevels,
    stageLevels,
    gradeLevels,
    gradesByStageId,
    stageIndexById,
  };
};

const normalizeLevelInput = (input = {}) => {
  const payload = {
    name: String(input.name || "").trim(),
    nameAr: String(input.nameAr || "").trim(),
  };

  if (!payload.name || !payload.nameAr) {
    throw new AppError("Both English and Arabic level names are required", 400);
  }

  const kind = inferLevelKind({
    kind: input.kind,
    name: payload.name,
    nameAr: payload.nameAr,
    parentLevel: input.parentLevel,
  });

  payload.kind = kind;
  payload.isActive = input.isActive === undefined ? undefined : input.isActive !== false && input.isActive !== "false";

  if (input.parentLevel !== undefined) {
    payload.parentLevel = input.parentLevel || null;
  }

  if (input.sortOrder !== undefined && input.sortOrder !== null && input.sortOrder !== "") {
    const sortOrder = Number(input.sortOrder);
    if (!Number.isFinite(sortOrder)) {
      throw new AppError("sortOrder must be a number", 400);
    }
    payload.sortOrder = sortOrder;
  }

  return payload;
};

const validateLevelReference = async (levelId, { expectedKind = null, allowInactive = false } = {}) => {
  if (!mongoose.Types.ObjectId.isValid(levelId)) {
    throw new AppError("Invalid level id", 400);
  }

  const levelDoc = await require("../models/levelModel")
    .findById(levelId)
    .populate("parentLevel", "name nameAr kind sortOrder isActive")
    .lean();

  if (!levelDoc) {
    throw new AppError("There is no level with this id", 404);
  }

  if (!allowInactive && levelDoc.isActive === false) {
    throw new AppError("The selected level is inactive", 400);
  }

  const kind = inferLevelKind(levelDoc);
  if (expectedKind && kind !== expectedKind) {
    throw new AppError(`The selected level must be a ${expectedKind}`, 400);
  }

  return normalizeLevelDoc(levelDoc);
};

const validateStudentLevelSelection = async ({ stageId, levelId }) => {
  const [stageDoc, gradeDoc] = await Promise.all([
    validateLevelReference(stageId, { expectedKind: LEVEL_KINDS.STAGE }),
    validateLevelReference(levelId, { expectedKind: LEVEL_KINDS.GRADE }),
  ]);

  if (String(gradeDoc.parentLevelId) !== String(stageDoc._id)) {
    throw new AppError("Selected grade does not belong to the selected stage", 400);
  }

  return { stage: stageDoc, level: gradeDoc };
};

const validateTeacherLevels = async (levelIds = []) => {
  const normalizedLevelIds = Array.isArray(levelIds)
    ? levelIds
    : levelIds
      ? [levelIds]
      : [];

  const uniqueLevelIds = Array.from(
    new Set(
      normalizedLevelIds
        .map((levelId) => String(levelId || "").trim())
        .filter(Boolean)
    )
  );

  if (uniqueLevelIds.length === 0) {
    throw new AppError("Level is required for teacher role and must be a non-empty array", 400);
  }

  const resolved = [];
  for (const levelId of uniqueLevelIds) {
    const levelDoc = await validateLevelReference(levelId, { expectedKind: LEVEL_KINDS.STAGE });
    resolved.push(levelDoc);
  }

  return resolved;
};

const validateOptionalLevel = async (levelId) => {
  if (!levelId) {
    return null;
  }

  return validateLevelReference(levelId, { allowInactive: false });
};

module.exports = {
  LEVEL_KINDS,
  STAGE_KEYS,
  STAGE_DISPLAY_NAMES,
  LEGACY_GRADE_DISPLAY_NAMES,
  buildLevelHierarchy,
  formatTitleCase,
  inferLevelKind,
  inferLevelMetadata,
  inferStageKeyFromName,
  normalizeLocale,
  normalizeLevelDoc,
  normalizeLevelInput,
  normalizeText,
  resolveLevelDisplayName,
  resolveLegacyGradeDisplayName,
  getStageDisplayName,
  validateLevelReference,
  validateOptionalLevel,
  validateStudentLevelSelection,
  validateTeacherLevels,
};
