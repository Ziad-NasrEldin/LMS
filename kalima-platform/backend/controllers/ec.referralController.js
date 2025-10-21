const User = require("../models/userModel");
const ECPurchase = require("../models/ec.purchaseModel");
const mongoose = require("mongoose");
const Student = require("../models/studentModel");
const Parent = require("../models/parentModel");
const Teacher = require("../models/teacherModel");

// Get EC referral stats: for each inviter, how many of their invitees (student, parent, teacher) made an e-commerce purchase
exports.getECReferralStats = async (req, res, next) => {
    try {
        const invitedWithECPurchase = await User.aggregate([
            { $match: { referredBy: { $ne: null } } },
            {
                $lookup: {
                    from: "ecpurchases",
                    localField: "_id",
                    foreignField: "createdBy",
                    as: "ecPurchases"
                }
            },
            { $match: { "ecPurchases.0": { $exists: true } } },
            { $group: { _id: "$referredBy", count: { $sum: 1 } } },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "inviter"
                }
            },
            { $unwind: "$inviter" },
            {
                $project: {
                    _id: 0,
                    inviterId: "$inviter._id",
                    inviterName: "$inviter.name", // Show name instead of email
                    inviterEmail: "$inviter.email", // Show email instead of name
                    inviterSerial: "$inviter.userSerial",
                    inviteCount: "$count"
                }
            },
            { $sort: { inviteCount: -1 } }
        ]);
        res.status(200).json({ status: "success", data: invitedWithECPurchase });
    } catch (err) {
        next(err);
    }
};

// Recalculate all users' successfulInvites counters for consistency
exports.recalculateAllSuccessfulInvites = async (req, res, next) => {
    try {
        // Find all users who were referred
        const referredUsers = await User.find({ referredBy: { $ne: null } }, '_id referredBy');

        // Map: inviterId => Set of inviteeIds who made a purchase
        const inviterToInvitees = {};

        for (const user of referredUsers) {
            // Check if this user made at least one e-commerce purchase
            const purchaseCount = await ECPurchase.countDocuments({ createdBy: user._id });
            if (purchaseCount > 0) {
                const inviterId = user.referredBy.toString();
                if (!inviterToInvitees[inviterId]) inviterToInvitees[inviterId] = new Set();
                inviterToInvitees[inviterId].add(user._id.toString());
            }
        }

        // For each inviter, update their successfulInvites field
        const allUpdates = [];
        for (const inviterId in inviterToInvitees) {
            const inviteCount = inviterToInvitees[inviterId].size;
            // Find inviter's role
            const inviter = await User.findById(inviterId);
            let Model;
            switch (inviter.role) {
                case "Student":
                    Model = Student;
                    break;
                case "Parent":
                    Model = Parent;
                    break;
                case "Teacher":
                    Model = Teacher;
                    break;
                default:
                    Model = null;
            }
            if (Model) {
                allUpdates.push(Model.findByIdAndUpdate(inviterId, { successfulInvites: inviteCount }));
            }
        }
        await Promise.all(allUpdates);
        res.status(200).json({ status: "success", message: "All successfulInvites counters recalculated." });
    } catch (err) {
        next(err);
    }
};

// Get EC referral stats for a specific inviter by their user ID
exports.getECReferralStatsByUser = async (req, res, next) => {
    try {
        const inviterId = req.params.userId;
        const invitedWithECPurchase = await User.aggregate([
            { $match: { referredBy: { $ne: null } } },
            {
                $lookup: {
                    from: "ecpurchases",
                    localField: "_id",
                    foreignField: "createdBy",
                    as: "ecPurchases"
                }
            },
            { $match: { "ecPurchases.0": { $exists: true } } },
            { $group: { _id: "$referredBy", count: { $sum: 1 } } },
            { $match: { _id: new mongoose.Types.ObjectId(inviterId) } },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "inviter"
                }
            },
            { $unwind: "$inviter" },
            {
                $project: {
                    _id: 0,
                    inviterId: "$inviter._id",
                    inviterName: "$inviter.name",
                    inviterEmail: "$inviter.email",
                    inviterSerial: "$inviter.userSerial",
                    inviteCount: "$count"
                }
            }
        ]);
        res.status(200).json({ status: "success", data: invitedWithECPurchase[0] || null });
    } catch (err) {
        next(err);
    }
};

// Helper: Recalculate successfulInvites for a single inviter
exports.recalculateInviterSuccessfulInvites = async (inviterId) => {
    // Find all users referred by this inviter
    const referredUsers = await User.find({ referredBy: inviterId }, '_id');
    let inviteCount = 0;
    for (const user of referredUsers) {
        const purchaseCount = await ECPurchase.countDocuments({ createdBy: user._id });
        if (purchaseCount > 0) inviteCount++;
    }
    // Find inviter's role
    const inviter = await User.findById(inviterId);
    let Model;
    switch (inviter.role) {
        case "Student": Model = Student; break;
        case "Parent": Model = Parent; break;
        case "Teacher": Model = Teacher; break;
        default: Model = null;
    }
    if (Model) {
        await Model.findByIdAndUpdate(inviterId, { successfulInvites: inviteCount });
    }
};
