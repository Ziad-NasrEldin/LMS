const fs = require("fs");
const Lecturer = require("../models/lecturerModel");
const Purchase = require("../models/purchaseModel");
const Code = require("../models/codeModel");
const StudentLectureAccess = require("../models/studentLectureAccessModel");
const Container = require("../models/containerModel");
const Lecture = require("../models/LectureModel");
const cleanupLecturerContent = require("../utils/cleanupLecturerContent");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const bcrypt = require("bcrypt");
const { uploadProfilePicToDisk } = require("./../utils/upload files/uploadFiles");

const SOCIAL_MEDIA_PLATFORMS = new Set([
    "Facebook",
    "Instagram",
    "Twitter",
    "LinkedIn",
    "TikTok",
    "YouTube",
    "WhatsApp",
    "Telegram",
]);

const normalizeSocialMediaInput = (rawValue) => {
    if (rawValue === undefined) return undefined;

    let parsedValue = rawValue;
    if (typeof parsedValue === "string") {
        const trimmedValue = parsedValue.trim();
        if (!trimmedValue) return [];

        try {
            parsedValue = JSON.parse(trimmedValue);
        } catch (_error) {
            return [];
        }
    }

    if (!Array.isArray(parsedValue)) return [];

    return parsedValue
        .map((item) => {
            if (!item || typeof item !== "object") return null;

            const platform = String(item.platform || "").trim();
            const account = String(item.account || "").trim();

            if (!platform && !account) return null;
            if (!platform || !account) return null;
            if (!SOCIAL_MEDIA_PLATFORMS.has(platform)) return null;

            return { platform, account };
        })
        .filter(Boolean);
};

// Upload middleware for lecturer profile picture
exports.uploadLecturerPhoto = uploadProfilePicToDisk;

// Create a new lecturer
exports.createLecturer = catchAsync(async (req, res, next) => {
    const { name, email, password, gender, role, bio, expertise, socialMedia, isPublished } = req.body;

    if (!bio || !expertise) {
        return next(new AppError("Bio and expertise are required.", 400));
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const lecturerData = {
        name,
        email,
        password: hashedPassword,
        gender,
        role,
        bio,
        expertise,
        ...(isPublished !== undefined
            ? { isPublished: isPublished === true || isPublished === "true" }
            : {}),
        socialMedia: normalizeSocialMediaInput(socialMedia) || [],
        profilePic: req.file ? req.file.path : null,
    };

    const lecturer = await Lecturer.create(lecturerData);

    res.status(201).json({
        status: "success",
        data: lecturer,
    });
});

// Get all lecturers
exports.getAllLecturers = catchAsync(async (req, res, next) => {
    const lecturers = await Lecturer.find(
        !req.user ? { isPublished: { $ne: false } } : {}
    );
    res.status(200).json({
        status: "success",
        data: lecturers,
    });
});

// Get a lecturer by ID
exports.getLecturerById = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const lecturer = await Lecturer.findById(id);

    if (!lecturer) {
        return next(new AppError("Lecturer not found.", 404));
    }

    if (!req.user && lecturer.isPublished === false) {
        return next(new AppError("Lecturer not found.", 404));
    }

    res.status(200).json({
        status: "success",
        data: lecturer,
    });
});

// Update a lecturer by ID
exports.updateLecturer = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { name, email, bio, expertise, socialMedia, isPublished } = req.body;

    const lecturer = await Lecturer.findById(id);
    if (!lecturer) {
        return next(new AppError("Lecturer not found.", 404));
    }

    // If a new file is uploaded, delete the old one
    if (req.file) {
        if (lecturer.profilePic && fs.existsSync(lecturer.profilePic)) {
            fs.unlinkSync(lecturer.profilePic);
        }
        lecturer.profilePic = req.file.path;
    }

    lecturer.name = name || lecturer.name;
    lecturer.email = email || lecturer.email;
    lecturer.bio = bio || lecturer.bio;
    lecturer.expertise = expertise || lecturer.expertise;
    if (socialMedia !== undefined) {
        lecturer.socialMedia = normalizeSocialMediaInput(socialMedia);
    }
    if (isPublished !== undefined) {
        lecturer.isPublished = isPublished === true || isPublished === "true";
    }

    await lecturer.save();

    res.status(200).json({
        status: "success",
        data: lecturer,
    });
});

// Delete a lecturer by ID
exports.deleteLecturer = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const lecturer = await Lecturer.findById(id);

    if (!lecturer) {
        return next(new AppError("Lecturer not found.", 404));
    }

    await cleanupLecturerContent(lecturer._id);
    await lecturer.deleteOne();

    // Delete profile picture if exists
    if (lecturer.profilePic && fs.existsSync(lecturer.profilePic)) {
        fs.unlinkSync(lecturer.profilePic);
    }

    res.status(204).json({
        status: "success",
        message: "Lecturer deleted successfully.",
    });
});

const buildDateFilter = ({ dateFrom, dateTo }, field = "purchasedAt") => {
    const filter = {};

    if (dateFrom) {
        filter.$gte = new Date(dateFrom);
    }

    if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        filter.$lte = endOfDay;
    }

    if (Object.keys(filter).length === 0) {
        return {};
    }

    return { [field]: filter };
};

const parseDateInput = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

exports.getMyAnalytics = catchAsync(async (req, res, next) => {
    const lecturerId = req.user?._id;
    if (!lecturerId) {
        return next(new AppError("Lecturer not found.", 404));
    }

    const { dateFrom, dateTo } = req.query;
    const parsedDateFrom = parseDateInput(dateFrom);
    const parsedDateTo = parseDateInput(dateTo);

    if (dateFrom && !parsedDateFrom) {
        return next(new AppError("Invalid dateFrom format. Use YYYY-MM-DD.", 400));
    }

    if (dateTo && !parsedDateTo) {
        return next(new AppError("Invalid dateTo format. Use YYYY-MM-DD.", 400));
    }

    if (parsedDateFrom && parsedDateTo && parsedDateFrom > parsedDateTo) {
        return next(new AppError("dateFrom cannot be after dateTo.", 400));
    }

    const normalizedDateRange = {
        dateFrom: parsedDateFrom,
        dateTo: parsedDateTo,
    };

    const purchaseDateFilter = buildDateFilter(normalizedDateRange, "purchasedAt");
    const accessDateFilter = buildDateFilter(normalizedDateRange, "lastAccessed");
    const codeCreatedFilter = buildDateFilter(normalizedDateRange, "createdAt");
    const codeRedeemedFilter = buildDateFilter(normalizedDateRange, "redeemedAt");

    const [lecturer, containers, lectures, containerLectures, purchases, promoCodes, redeemedPromoCodes] =
        await Promise.all([
            Lecturer.findById(lecturerId).select("name bio expertise profilePic").lean(),
            Container.find({ createdBy: lecturerId })
                .select("name type price subject level parent children numberOfViews createdAt updatedAt")
                .populate("subject", "name")
                .populate("level", "name nameAr kind sortOrder parentLevel isActive")
                .lean(),
            Lecture.find({ createdBy: lecturerId })
                .select("name type price subject level numberOfViews createdAt updatedAt")
                .populate("subject", "name")
                .populate("level", "name nameAr kind sortOrder parentLevel isActive")
                .lean(),
            Container.find({ createdBy: lecturerId, type: "lecture" })
                .select("name type price subject level numberOfViews createdAt updatedAt")
                .populate("subject", "name")
                .populate("level", "name nameAr kind sortOrder parentLevel isActive")
                .lean(),
            Purchase.find({
                lecturer: lecturerId,
                type: { $in: ["containerPurchase", "lecturePurchase", "promoCodePurchase"] },
                ...(Object.keys(purchaseDateFilter).length > 0 ? purchaseDateFilter : {}),
            })
                .select("student lecturer points container lecture type description purchasedAt")
                .populate("student", "name sequencedId")
                .populate("container", "name price type numberOfViews")
                .populate("lecture", "name price type numberOfViews")
                .lean(),
            Code.find({
                lecturerId,
                type: "specific",
                ...(Object.keys(codeCreatedFilter).length > 0 ? codeCreatedFilter : {}),
            })
                .select("code pointsAmount isRedeemed redeemedBy redeemedAt createdAt")
                .populate("redeemedBy", "name sequencedId userSerial role")
                .lean(),
            Code.find({
                lecturerId,
                type: "specific",
                isRedeemed: true,
                ...(Object.keys(codeRedeemedFilter).length > 0 ? codeRedeemedFilter : {}),
            })
                .select("code pointsAmount isRedeemed redeemedBy redeemedAt createdAt")
                .populate("redeemedBy", "name sequencedId userSerial role")
                .lean(),
        ]);

    const lectureIds = [...lectures, ...containerLectures].map((item) => item._id);
    const accessRecords = await StudentLectureAccess.find({
        lecture: {
            $in: lectureIds,
        },
        ...(Object.keys(accessDateFilter).length > 0 ? accessDateFilter : {}),
    })
        .select("student lecture remainingViews lastAccessed lastViewEventAt")
        .populate("student", "name sequencedId")
        .populate("lecture", "name numberOfViews type")
        .lean();

    if (!lecturer && purchases.length === 0 && promoCodes.length === 0 && accessRecords.length === 0) {
        return next(new AppError("Lecturer not found", 404));
    }

    const contentMap = new Map();
    let totalRevenue = 0;
    let totalPurchases = 0;
    const uniquePurchaseStudents = new Set();

    purchases.forEach((purchase) => {
        const studentId = purchase.student?._id ? String(purchase.student._id) : null;
        const isRevenueBearing = purchase.type !== "promoCodePurchase";
        if (isRevenueBearing) {
            totalRevenue += Number(purchase.points || 0);
        }

        totalPurchases += 1;

        if (studentId) {
            uniquePurchaseStudents.add(studentId);
        }

        const contentDoc = purchase.container || purchase.lecture;
        if (!contentDoc) {
            return;
        }

        const contentType = contentDoc.type === "lecture" ? "lecture" : "course";
        const contentId = String(contentDoc._id);
        const contentKey = `${contentType}:${contentId}`;
        const contentName = contentDoc.name || purchase.description || "Untitled";

        if (!contentMap.has(contentKey)) {
            contentMap.set(contentKey, {
                contentId,
                contentType,
                contentName,
                purchaseCount: 0,
                revenue: 0,
                promoPurchases: 0,
                studentIds: new Set(),
            });
        }

        const entry = contentMap.get(contentKey);
        entry.purchaseCount += 1;
        if (studentId) {
            entry.studentIds.add(studentId);
        }
        if (isRevenueBearing) {
            entry.revenue += Number(purchase.points || 0);
        } else {
            entry.promoPurchases += 1;
        }
    });

    const accessStudents = new Set();
    let linkedAccessRecords = 0;
    let totalViewsConsumed = 0;

    accessRecords.forEach((record) => {
        if (record.student?._id) {
            accessStudents.add(String(record.student._id));
        }

        linkedAccessRecords += 1;

        const lectureViews = Number(record.lecture?.numberOfViews ?? 3);
        const consumedViews = Math.max(0, lectureViews - Number(record.remainingViews || 0));
        totalViewsConsumed += consumedViews;
    });

    const totalPromoCodesSold = promoCodes.length;
    const promoCodesSoldValue = promoCodes.reduce((sum, code) => sum + Number(code.pointsAmount || 0), 0);
    const totalPromoCodesApplied = redeemedPromoCodes.length;
    const promoCodesAppliedValue = redeemedPromoCodes.reduce((sum, code) => sum + Number(code.pointsAmount || 0), 0);

    const purchasesByContent = [...contentMap.values()]
        .map((entry) => ({
            contentId: entry.contentId,
            contentType: entry.contentType,
            contentName: entry.contentName,
            purchaseCount: entry.purchaseCount,
            revenue: entry.revenue,
            promoPurchases: entry.promoPurchases,
            uniqueStudents: entry.studentIds.size,
        }))
        .sort((a, b) => {
            if (b.purchaseCount !== a.purchaseCount) return b.purchaseCount - a.purchaseCount;
            if (b.revenue !== a.revenue) return b.revenue - a.revenue;
            return a.contentName.localeCompare(b.contentName);
        });

    const topLevelCourses = containers.filter((item) => !item.parent && item.type === "course");
    const totalLectures = new Set(
        [...lectures, ...containerLectures].map((item) => String(item._id))
    ).size;

    res.status(200).json({
        status: "success",
        data: {
            lecturer: lecturer
                ? {
                    id: lecturerId,
                    name: lecturer.name,
                }
                : null,
            summary: {
                totalCourses: topLevelCourses.length,
                totalLectures,
                totalPurchases,
                totalRevenue,
                totalStudentsBought: uniquePurchaseStudents.size,
                totalStudentsEntered: accessStudents.size,
                totalLinkedAccessRecords: linkedAccessRecords,
                totalViewsConsumed,
                totalPromoCodesSold,
                promoCodesSoldValue,
                totalPromoCodesApplied,
                promoCodesAppliedValue,
            },
            purchasesByContent,
            promoCodes: promoCodes.map((code) => ({
                id: code._id,
                code: code.code,
                pointsAmount: code.pointsAmount,
                isRedeemed: code.isRedeemed,
                redeemedBy: code.redeemedBy
                    ? {
                        id: String(code.redeemedBy._id || code.redeemedBy),
                        name: code.redeemedBy.name || null,
                        sequencedId: code.redeemedBy.sequencedId || null,
                        userSerial: code.redeemedBy.userSerial || null,
                        role: code.redeemedBy.role || null,
                    }
                    : null,
                redeemedAt: code.redeemedAt,
                createdAt: code.createdAt,
            })),
            accessRecords: accessRecords.map((record) => ({
                studentId: record.student?._id || null,
                studentName: record.student?.name || null,
                lectureId: record.lecture?._id || null,
                lectureName: record.lecture?.name || null,
                remainingViews: record.remainingViews,
                lastAccessed: record.lastAccessed,
                lastViewEventAt: record.lastViewEventAt,
            })),
        },
    });
});
