const Level = require("../models/levelModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const {
  LEVEL_KINDS,
  buildLevelHierarchy,
  normalizeLevelDoc,
  normalizeLevelInput,
  validateLevelReference,
} = require("../utils/levelHierarchy");

const populateLevelQuery = (query) =>
  query.populate("parentLevel", "name nameAr kind sortOrder isActive");

const getLevelQueryFilter = (req) => {
  const filter = {};

  if (String(req.query.includeInactive || "").toLowerCase() !== "true" && req.query.includeInactive !== "1") {
    filter.isActive = { $ne: false };
  }

  if (req.query.kind && [LEVEL_KINDS.STAGE, LEVEL_KINDS.GRADE].includes(String(req.query.kind).toLowerCase())) {
    filter.kind = String(req.query.kind).toLowerCase();
  }

  return filter;
};

const resolveNextSortOrder = async ({ kind, parentLevel }) => {
  if (kind === LEVEL_KINDS.STAGE) {
    const count = await Level.countDocuments({
      kind: LEVEL_KINDS.STAGE,
      isActive: { $ne: false },
    });
    return count + 1;
  }

  if (parentLevel) {
    const count = await Level.countDocuments({
      parentLevel,
      kind: LEVEL_KINDS.GRADE,
      isActive: { $ne: false },
    });
    return count + 1;
  }

  return 0;
};

const resolveLevelPayload = async (input, { existingLevel = null, allowPartial = false } = {}) => {
  const source = existingLevel ? existingLevel.toObject() : {};
  const nextName = typeof input.name === "string" ? input.name.trim() : allowPartial ? source.name : "";
  const nextNameAr = typeof input.nameAr === "string" ? input.nameAr.trim() : allowPartial ? source.nameAr : "";
  const nextKind = typeof input.kind === "string" ? input.kind.trim().toLowerCase() : source.kind;
  const nextParentLevel =
    input.parentLevel !== undefined
      ? input.parentLevel || null
      : allowPartial
        ? source.parentLevel || null
        : null;

  if (!nextName || !nextNameAr) {
    throw new AppError("Both English and Arabic level names are required", 400);
  }

  const normalized = normalizeLevelInput({
    name: nextName,
    nameAr: nextNameAr,
    kind: nextKind,
    parentLevel: nextParentLevel,
    sortOrder: input.sortOrder !== undefined ? input.sortOrder : source.sortOrder,
    isActive: input.isActive !== undefined ? input.isActive : source.isActive,
  });

  if (normalized.kind === LEVEL_KINDS.STAGE) {
    normalized.parentLevel = null;
  }

  if (normalized.kind === LEVEL_KINDS.GRADE && !normalized.parentLevel) {
    throw new AppError("Grade levels must belong to a stage", 400);
  }

  if (normalized.parentLevel) {
    const parentLevel = await validateLevelReference(normalized.parentLevel, {
      expectedKind: LEVEL_KINDS.STAGE,
    });

    normalized.parentLevel = parentLevel._id;
  }

  if (normalized.sortOrder === undefined || normalized.sortOrder === null) {
    normalized.sortOrder = await resolveNextSortOrder({
      kind: normalized.kind,
      parentLevel: normalized.parentLevel,
    });
  }

  return normalized;
};

// Create a new level
exports.createLevel = catchAsync(async (req, res, next) => {
  const payload = await resolveLevelPayload(req.body);

  const level = await Level.create(payload);
  const createdLevel = await Level.findById(level._id)
    .populate("parentLevel", "name nameAr kind sortOrder isActive")
    .lean();

  if (!createdLevel) {
    return next(new AppError("Level could not be created", 400));
  }

  res.status(201).json({
    status: "success",
    data: {
      level: normalizeLevelDoc(createdLevel),
    },
  });
});

// Get all levels
exports.getAllLevels = catchAsync(async (req, res) => {
  const filter = getLevelQueryFilter(req);
  const levels = await populateLevelQuery(
    Level.find(filter).sort({ kind: 1, sortOrder: 1, name: 1 })
  ).lean();

  const hierarchy = buildLevelHierarchy(levels, req.query.lang || "en");

  res.status(200).json({
    status: "success",
    data: {
      levels: hierarchy.levels,
      stages: hierarchy.stageLevels,
      grades: hierarchy.gradeLevels,
      groupedLevels: hierarchy.gradesByStageId,
    },
  });
});

// Get a level by ID
exports.getLevelById = catchAsync(async (req, res, next) => {
  const level = await populateLevelQuery(Level.findById(req.params.id)).lean();

  if (!level) {
    return next(new AppError("No level found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      level: normalizeLevelDoc(level),
    },
  });
});

// Update a level by ID
exports.updateLevelById = catchAsync(async (req, res, next) => {
  const existingLevel = await Level.findById(req.params.id);

  if (!existingLevel) {
    return next(new AppError("No level found with that ID", 404));
  }

  const payload = await resolveLevelPayload(req.body, {
    existingLevel,
    allowPartial: true,
  });

  const level = await Level.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true,
  })
    .populate("parentLevel", "name nameAr kind sortOrder isActive")
    .lean();

  if (!level) {
    return next(new AppError("No level found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      level: normalizeLevelDoc(level),
    },
  });
});

// Delete a level by ID
exports.deleteLevelById = catchAsync(async (req, res, next) => {
  const level = await Level.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true, runValidators: true }
  );

  if (!level) {
    return next(new AppError("No level found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});
