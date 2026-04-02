const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const User = require("../models/userModel.js");
const Parent = require("../models/parentModel.js");
const Lecturer = require("../models/lecturerModel.js");
const Student = require("../models/studentModel.js");
const Teacher = require("../models/teacherModel.js");
const Assistant = require("../models/assistantModel.js");
const Moderator = require("../models/moderatorModel.js");
const SubAdmin = require("../models/subAdminModel.js");
const catchAsync = require("../utils/catchAsync");
const Government = require("../models/governmentModel.js");
const AdministrationZone = require("../models/administrationZonesModel.js");
const { validateOptionalLevel, validateStudentLevelSelection, validateTeacherLevels } = require("../utils/levelHierarchy");
const { normalizeEgyptianPhoneNumber } = require("../utils/phoneNumber.js");
const { createSignupError, mapLevelHierarchyAppError } = require("../utils/signupErrors");

const allowedParentRelations = ["mother", "father", "other"];

const validatePassword = (password) => {
  const value = String(password || "");
  const requiredLength = 8;
  if (value.length < requiredLength) {
    throw createSignupError("SIGNUP_PASSWORD_TOO_SHORT");
  }
};

const isNonEmpty = (value) => String(value || "").trim().length > 0;

const registerNewUser = catchAsync(async (req, res, next) => {
  const {
    role,
    name,
    email,
    phoneNumber,
    confirmPassword,
    password,
    children,
    government,
    administrationZone,
    ...userData
  } = req.body;

  const normalizedRole = String(role || "").trim().toLowerCase();
  const phoneRequiredRoles = ["teacher", "parent", "student"];
  const govAdminRequiredRoles = ["teacher", "parent", "student"];
  const normalizedPhoneNumber = phoneNumber ? normalizeEgyptianPhoneNumber(phoneNumber) : "";
  const normalizedPhoneNumber2 =
    userData.phoneNumber2 !== undefined && userData.phoneNumber2 !== ""
      ? normalizeEgyptianPhoneNumber(userData.phoneNumber2)
      : "";

  if (!normalizedRole) {
    return next(createSignupError("SIGNUP_INVALID_ROLE"));
  }

  if (govAdminRequiredRoles.includes(normalizedRole)) {
    if (!isNonEmpty(government)) {
      return next(createSignupError("SIGNUP_GOVERNMENT_REQUIRED"));
    }
    if (!isNonEmpty(administrationZone)) {
      return next(createSignupError("SIGNUP_ADMIN_ZONE_REQUIRED"));
    }

    try {
      const normalizedGovernment = government.trim();
      const normalizedAdministrationZone = administrationZone.trim();

      const govDoc = await Government.findOne({
        name: { $regex: new RegExp(`^${normalizedGovernment}$`, "i") },
      });

      if (!govDoc) {
        const availableGovs = await Government.find({}, "name").lean();
        const govNames = availableGovs.map((g) => g.name);
        return next(
          createSignupError("SIGNUP_GOVERNMENT_INVALID", {
            details: { providedGovernment: normalizedGovernment, availableGovernments: govNames },
          })
        );
      }

      if (!govDoc.administrationZone || !Array.isArray(govDoc.administrationZone)) {
        return next(createSignupError("SIGNUP_ADMIN_ZONE_INVALID"));
      }

      const zoneExistsInGov = govDoc.administrationZone.some(
        (zone) =>
          zone &&
          zone.toLowerCase().trim() === normalizedAdministrationZone.toLowerCase()
      );

      if (!zoneExistsInGov) {
        const zoneDoc = await AdministrationZone.findOne({
          name: { $regex: new RegExp(`^${normalizedAdministrationZone}$`, "i") },
        });

        if (!zoneDoc) {
          return next(
            createSignupError("SIGNUP_ADMIN_ZONE_INVALID", {
              details: {
                providedAdministrationZone: normalizedAdministrationZone,
                government: normalizedGovernment,
              },
            })
          );
        }
      }
    } catch (error) {
      return next(
        createSignupError("SIGNUP_LOCATION_VALIDATION_FAILED", {
          details: { cause: error.message },
        })
      );
    }
  }

  try {
    validatePassword(password);
  } catch (error) {
    return next(error);
  }

  if (password !== confirmPassword) {
    return next(createSignupError("SIGNUP_PASSWORD_MISMATCH"));
  }
  if (!isNonEmpty(email)) {
    return next(createSignupError("SIGNUP_EMAIL_REQUIRED"));
  }

  const duplicateEmail = await User.findOne({
    email: { $regex: new RegExp(`^${email}$`, "i") },
  });
  if (duplicateEmail) {
    return next(createSignupError("SIGNUP_EMAIL_ALREADY_EXISTS"));
  }

  if (phoneRequiredRoles.includes(normalizedRole) && !normalizedPhoneNumber) {
    return next(createSignupError("SIGNUP_PHONE_INVALID"));
  }

  if (userData.phoneNumber2 !== undefined && userData.phoneNumber2 !== "" && !normalizedPhoneNumber2) {
    return next(createSignupError("SIGNUP_PHONE2_INVALID"));
  }

  const duplicatePhone = normalizedPhoneNumber
    ? await User.findOne({ phoneNumber: normalizedPhoneNumber })
    : null;
  if (phoneRequiredRoles.includes(normalizedRole) && duplicatePhone) {
    return next(createSignupError("SIGNUP_PHONE_ALREADY_EXISTS"));
  }

  const childrenById = [];
  const invalidChildren = [];
  if (children) {
    const requestedChildren = Array.isArray(children) ? children : [children];
    for (const childValue of requestedChildren) {
      const value = String(childValue || "").trim();
      if (!value) continue;
      if (mongoose.Types.ObjectId.isValid(value)) {
        childrenById.push(value);
        continue;
      }

      const student = await Student.findOne({ sequencedId: value }).lean();
      if (student) {
        childrenById.push(student._id);
      } else {
        invalidChildren.push(value);
      }
    }
  }
  if (invalidChildren.length > 0) {
    return next(
      createSignupError("SIGNUP_CHILD_REFERENCE_INVALID", {
        details: { invalidChildren },
      })
    );
  }

  const hashedPwd = await bcrypt.hash(password, 12);

  let profilePicPath = null;
  if (req.file && req.file.fieldname === "profilePic") {
    profilePicPath = req.file.path;
  }

  const newUser = {
    name,
    email: email.toLowerCase().trim(),
    password: hashedPwd,
    children: childrenById,
    isEmailVerified: true,
    ...userData,
  };

  if (govAdminRequiredRoles.includes(normalizedRole)) {
    newUser.government = government;
    newUser.administrationZone = administrationZone;
  }

  if (normalizedPhoneNumber) {
    newUser.phoneNumber = normalizedPhoneNumber;
  }
  if (normalizedPhoneNumber2) {
    newUser.phoneNumber2 = normalizedPhoneNumber2;
  }

  newUser.profilePic = profilePicPath;

  if (req.body.referralSerial !== undefined && req.body.referralSerial !== "") {
    const inviter = await User.findOne({ userSerial: req.body.referralSerial });
    if (inviter) {
      newUser.referredBy = inviter._id;
    }
  }

  let user;
  switch (normalizedRole) {
    case "teacher": {
      if (!newUser.phoneNumber2) {
        delete newUser.phoneNumber2;
      }

      try {
        const resolvedTeacherLevels = await validateTeacherLevels(newUser.level);
        newUser.level = resolvedTeacherLevels.map((levelDoc) => levelDoc._id);
      } catch (error) {
        return next(mapLevelHierarchyAppError(error, "teacher"));
      }

      if (!newUser.teachesAtType || !["Center", "School", "Both"].includes(newUser.teachesAtType)) {
        return next(createSignupError("SIGNUP_TEACHER_TEACHES_AT_TYPE_REQUIRED"));
      }

      if (
        (newUser.teachesAtType === "Center" || newUser.teachesAtType === "Both") &&
        (!Array.isArray(newUser.centers) || newUser.centers.filter((center) => String(center || "").trim()).length === 0)
      ) {
        return next(createSignupError("SIGNUP_TEACHER_CENTERS_REQUIRED"));
      }

      if (
        (newUser.teachesAtType === "School" || newUser.teachesAtType === "Both") &&
        !isNonEmpty(newUser.school)
      ) {
        return next(createSignupError("SIGNUP_TEACHER_SCHOOL_REQUIRED"));
      }

      if (newUser.socialMedia && !Array.isArray(newUser.socialMedia)) {
        return next(createSignupError("SIGNUP_TEACHER_SOCIAL_MEDIA_NOT_ARRAY"));
      }

      if (Array.isArray(newUser.socialMedia)) {
        for (const sm of newUser.socialMedia) {
          if (typeof sm !== "object") continue;
          if (
            sm.platform &&
            ![
              "Facebook",
              "Instagram",
              "Twitter",
              "LinkedIn",
              "TikTok",
              "YouTube",
              "WhatsApp",
              "Telegram",
            ].includes(sm.platform)
          ) {
            return next(
              createSignupError("SIGNUP_TEACHER_SOCIAL_MEDIA_PLATFORM_INVALID", {
                details: { invalidPlatform: sm.platform },
              })
            );
          }
        }
      }

      user = await Teacher.create(newUser);
      break;
    }
    case "student": {
      if (!newUser.stage) {
        return next(createSignupError("SIGNUP_STUDENT_STAGE_REQUIRED"));
      }
      if (!newUser.level) {
        return next(createSignupError("SIGNUP_STUDENT_LEVEL_REQUIRED"));
      }

      if (newUser.hobby) {
        newUser.hobby = String(newUser.hobby).trim().toLowerCase();
      }

      if (!isNonEmpty(newUser.parentPhoneNumber)) {
        return next(createSignupError("SIGNUP_STUDENT_PARENT_PHONE_REQUIRED"));
      }
      newUser.parentPhoneNumber = normalizeEgyptianPhoneNumber(newUser.parentPhoneNumber);
      if (!newUser.parentPhoneNumber) {
        return next(createSignupError("SIGNUP_STUDENT_PARENT_PHONE_INVALID"));
      }

      if (!isNonEmpty(newUser.parentPhoneRelation)) {
        return next(createSignupError("SIGNUP_STUDENT_PARENT_RELATION_REQUIRED"));
      }
      newUser.parentPhoneRelation = String(newUser.parentPhoneRelation).trim().toLowerCase();
      if (!allowedParentRelations.includes(newUser.parentPhoneRelation)) {
        return next(createSignupError("SIGNUP_STUDENT_PARENT_RELATION_INVALID"));
      }

      const hasSecondaryParentPhone =
        newUser.parentPhoneNumber2 !== undefined &&
        String(newUser.parentPhoneNumber2).trim() !== "";
      const hasSecondaryParentRelation =
        newUser.parentPhoneRelation2 !== undefined &&
        String(newUser.parentPhoneRelation2).trim() !== "";

      if (hasSecondaryParentRelation && !hasSecondaryParentPhone) {
        return next(createSignupError("SIGNUP_STUDENT_PARENT2_PHONE_REQUIRED"));
      }

      if (hasSecondaryParentPhone) {
        newUser.parentPhoneNumber2 = normalizeEgyptianPhoneNumber(newUser.parentPhoneNumber2);
        if (!newUser.parentPhoneNumber2) {
          return next(createSignupError("SIGNUP_STUDENT_PARENT2_PHONE_INVALID"));
        }

        if (!hasSecondaryParentRelation) {
          return next(createSignupError("SIGNUP_STUDENT_PARENT2_RELATION_REQUIRED"));
        }

        newUser.parentPhoneRelation2 = String(newUser.parentPhoneRelation2).trim().toLowerCase();
        if (!allowedParentRelations.includes(newUser.parentPhoneRelation2)) {
          return next(createSignupError("SIGNUP_STUDENT_PARENT2_RELATION_INVALID"));
        }
      } else {
        delete newUser.parentPhoneNumber2;
        delete newUser.parentPhoneRelation2;
      }

      try {
        const resolvedStudentSelection = await validateStudentLevelSelection({
          stageId: newUser.stage,
          levelId: newUser.level,
        });
        newUser.stage = resolvedStudentSelection.stage._id;
        newUser.level = resolvedStudentSelection.level._id;
      } catch (error) {
        if (String(error?.message || "").includes("selected stage")) {
          return next(createSignupError("SIGNUP_STUDENT_LEVEL_STAGE_MISMATCH"));
        }
        if (String(error?.message || "").includes("must be a stage")) {
          return next(createSignupError("SIGNUP_STUDENT_STAGE_INVALID"));
        }
        return next(mapLevelHierarchyAppError(error, "student", "level"));
      }

      user = await Student.create(newUser);
      break;
    }
    case "parent": {
      if (newUser.level) {
        try {
          const resolvedParentLevel = await validateOptionalLevel(newUser.level);
          if (resolvedParentLevel) {
            newUser.level = resolvedParentLevel._id;
          }
        } catch (error) {
          return next(mapLevelHierarchyAppError(error, "parent"));
        }
      }
      user = await Parent.create(newUser);
      break;
    }
    case "lecturer":
      user = await Lecturer.create(newUser);
      break;
    case "assistant":
      user = await Assistant.create(newUser);
      break;
    case "moderator":
      user = await Moderator.create(newUser);
      break;
    case "subadmin":
      user = await SubAdmin.create(newUser);
      break;
    default:
      return next(createSignupError("SIGNUP_INVALID_ROLE"));
  }

  if (!user) {
    return next(createSignupError("SIGNUP_VALIDATION_FAILED"));
  }

  return res.status(201).json({
    message: `User created successfully with name ${name}.`,
  });
});

module.exports = { registerNewUser };
