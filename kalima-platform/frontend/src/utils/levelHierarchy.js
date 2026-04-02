const STAGE_KEYS = ["primary", "preparatory", "secondary"];

const STAGE_DISPLAY_NAMES = {
  primary: { en: "Primary", ar: "الابتدائي" },
  preparatory: { en: "Preparatory", ar: "الإعدادي" },
  secondary: { en: "Secondary", ar: "الثانوي" },
};

const LEGACY_GRADE_DISPLAY_NAMES = {
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
  "grade 1": { en: "1st Primary", ar: "الصف الأول الابتدائي" },
  "grade 2": { en: "2nd Primary", ar: "الصف الثاني الابتدائي" },
  "grade 3": { en: "3rd Primary", ar: "الصف الثالث الابتدائي" },
  "grade 4": { en: "4th Primary", ar: "الصف الرابع الابتدائي" },
  "grade 5": { en: "5th Primary", ar: "الصف الخامس الابتدائي" },
  "grade 6": { en: "6th Primary", ar: "الصف السادس الابتدائي" },
};

const normalizeLocale = (locale) =>
  String(locale || "en").toLowerCase().startsWith("ar") ? "ar" : "en";

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const formatTitleCase = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b([a-z])/g, (match) => match.toUpperCase());

const toIdString = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value._id) return String(value._id);
  return String(value);
};

const getStageDisplayName = (stageLike, locale = "en") => {
  const lang = normalizeLocale(locale);
  const rawName = normalizeText(typeof stageLike === "object" ? stageLike?.name : stageLike);
  const stageDisplay = STAGE_DISPLAY_NAMES[rawName];

  if (stageDisplay) {
    return stageDisplay[lang];
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
  const rawName = normalizeText(typeof gradeLike === "object" ? gradeLike?.name : gradeLike);
  const gradeDisplay = LEGACY_GRADE_DISPLAY_NAMES[rawName];

  if (gradeDisplay) {
    return gradeDisplay[lang];
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

const inferLevelKind = (levelLike = {}) => {
  const kind = normalizeText(levelLike.kind);
  if (kind === "stage" || kind === "grade") {
    return kind;
  }

  if (levelLike.parentLevel || levelLike.parentLevelId) {
    return "grade";
  }

  const rawName = normalizeText(levelLike.name);
  if (STAGE_KEYS.includes(rawName)) {
    return "stage";
  }

  if (
    rawName.includes("primary") ||
    rawName.includes("preparatory") ||
    rawName.includes("secondary") ||
    rawName.includes("grade") ||
    rawName.includes("stage")
  ) {
    return "grade";
  }

  return "grade";
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

  const kind = inferLevelKind(levelLike);
  if (kind === "stage") {
    return getStageDisplayName(levelLike, locale);
  }

  return resolveLegacyGradeDisplayName(levelLike, locale);
};

const buildLevelHierarchy = (levels = [], locale = "en") => {
  const normalizedLevels = (Array.isArray(levels) ? levels : [])
    .map((level) => {
      if (!level) return null;

      const plain = typeof level.toObject === "function" ? level.toObject() : { ...level };
      const normalized = {
        ...plain,
        kind: inferLevelKind(plain),
        isActive: plain.isActive !== false,
      };

      normalized.displayName = resolveLevelDisplayName(normalized, locale);
      normalized.parentLevelId = toIdString(normalized.parentLevelId || normalized.parentLevel);
      if (!normalized.parentLevelId) {
        normalized.parentLevelId = null;
      }

      return normalized;
    })
    .filter(Boolean);

  const activeLevels = normalizedLevels.filter((level) => level.isActive !== false);

  const stages = activeLevels
    .filter((level) => level.kind === "stage")
    .sort((left, right) => {
      const leftSort = Number.isFinite(left.sortOrder) ? left.sortOrder : 0;
      const rightSort = Number.isFinite(right.sortOrder) ? right.sortOrder : 0;
      if (leftSort !== rightSort) return leftSort - rightSort;
      return left.displayName.localeCompare(right.displayName);
    });

  const stageOrderById = new Map(
    stages.map((stage, index) => [toIdString(stage._id), index])
  );

  const grades = activeLevels
    .filter((level) => level.kind !== "stage")
    .sort((left, right) => {
      const leftStageIndex = stageOrderById.get(left.parentLevelId) ?? Number.MAX_SAFE_INTEGER;
      const rightStageIndex = stageOrderById.get(right.parentLevelId) ?? Number.MAX_SAFE_INTEGER;
      if (leftStageIndex !== rightStageIndex) return leftStageIndex - rightStageIndex;

      const leftSort = Number.isFinite(left.sortOrder) ? left.sortOrder : 0;
      const rightSort = Number.isFinite(right.sortOrder) ? right.sortOrder : 0;
      if (leftSort !== rightSort) return leftSort - rightSort;

      return left.displayName.localeCompare(right.displayName);
    });

  const stagesById = stages.reduce((acc, stage) => {
    acc[toIdString(stage._id)] = stage;
    return acc;
  }, {});

  const gradesByStageId = stages.reduce((acc, stage) => {
    const stageId = toIdString(stage._id);
    acc[stageId] = grades.filter((grade) => grade.parentLevelId === stageId);
    return acc;
  }, {});

  const allGradeOptions = grades.map((grade) => ({
    value: toIdString(grade._id),
    label: grade.displayName,
    raw: grade,
  }));

  const stageOptions = stages.map((stage) => ({
    value: toIdString(stage._id),
    label: stage.displayName,
    raw: stage,
  }));

  return {
    levels: normalizedLevels,
    activeLevels,
    stages,
    grades,
    stagesById,
    gradesByStageId,
    stageOptions,
    gradeOptions: allGradeOptions,
  };
};

const getGradeOptionsForStage = (hierarchy, stageId) => {
  if (!hierarchy || !stageId) return [];
  return (hierarchy.gradesByStageId?.[stageId] || []).map((grade) => ({
    value: toIdString(grade._id),
    label: grade.displayName,
    raw: grade,
  }));
};

const getLevelOptionLabel = (level, locale = "en") => resolveLevelDisplayName(level, locale);

export {
  STAGE_KEYS,
  STAGE_DISPLAY_NAMES,
  LEGACY_GRADE_DISPLAY_NAMES,
  buildLevelHierarchy,
  formatTitleCase,
  getGradeOptionsForStage,
  getLevelOptionLabel,
  getStageDisplayName,
  inferLevelKind,
  normalizeLocale,
  normalizeText,
  resolveLegacyGradeDisplayName,
  resolveLevelDisplayName,
};
