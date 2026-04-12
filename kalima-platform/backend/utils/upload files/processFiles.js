const AppError = require("../appError");
const bcrypt = require("bcrypt");
const User = require("../../models/userModel");
const Level = require("../../models/levelModel");

const resolveLevelId = async (levelName) => {
  if (!levelName) return null;
  
  // Try exact match first
  let level = await Level.findOne({ name: { $regex: new RegExp(`^${levelName}$`, "i") } });
  if (level) return level._id;
  
  // Try matching against nameAr (Arabic name)
  level = await Level.findOne({ nameAr: { $regex: new RegExp(`^${levelName}$`, "i") } });
  if (level) return level._id;
  
  // Try partial match on name
  level = await Level.findOne({ name: { $regex: new RegExp(levelName, "i") } });
  if (level) return level._id;
  
  return null;
};

const processAndInsertUsers = async (results, accountType, res, next) => {
  if (results.length === 0) {
    return next(new AppError("No valid data found in the uploaded file", 400));
  }

  try {
    const existingUsers = await User.find({
      email: { $in: results.map((user) => user.email) },
    });

    const existingEmails = new Set(existingUsers.map((user) => user.email));
    const newUsersData = [];
    const duplicates = [];

    results.forEach((user) => {
      if (existingEmails.has(user.email)) {
        duplicates.push({
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
        });
      } else {
        newUsersData.push(user);
      }
    });

    const createdUsers = [];
    const failedUsers = [];

    for (const userData of newUsersData) {
      try {
        const { res: _, next: __, ...cleanData } = userData;
        
        // Role-based enrichment
        if (accountType === "student") {
          cleanData.hobby = cleanData.hobby || "other"; // Required by model
          const resolvedLevel = await resolveLevelId(cleanData.level || cleanData.stage);
          if (!resolvedLevel) {
            failedUsers.push({
              name: userData.name,
              email: userData.email,
              error: `Invalid level or stage: ${cleanData.level || cleanData.stage}. Please use a valid grade level name.`,
            });
            continue;
          }
          cleanData.level = resolvedLevel;
        } else if (accountType === "parent") {
          const resolvedLevel = await resolveLevelId(cleanData.level);
          if (cleanData.level && !resolvedLevel) {
            failedUsers.push({
              name: userData.name,
              email: userData.email,
              error: `Invalid level: ${cleanData.level}. Please use a valid grade level name.`,
            });
            continue;
          }
          cleanData.level = resolvedLevel;
        } else if (accountType === "teacher") {
          // Teachers have an array of levels
          const levelName = cleanData.level || cleanData.stage;
          const levelId = await resolveLevelId(levelName);
          if (!levelId) {
            failedUsers.push({
              name: userData.name,
              email: userData.email,
              error: `Invalid level or stage: ${levelName}. Please use a valid stage name.`,
            });
            continue;
          }
          cleanData.level = [levelId];
          
          // Validate subject is provided for teacher
          if (!cleanData.subject) {
            failedUsers.push({
              name: userData.name,
              email: userData.email,
              error: "Subject is required for teacher accounts.",
            });
            continue;
          }
          
          // Validate teachesAtType is provided for teacher
          if (!cleanData.teachesAtType) {
            failedUsers.push({
              name: userData.name,
              email: userData.email,
              error: "Teaching location (teachesAtType) is required for teacher accounts.",
            });
            continue;
          }
        }

        // Hash password
        if (cleanData.password) {
          cleanData.password = await bcrypt.hash(cleanData.password, 12);
        } else {
          // Fallback to phoneNumber as password if not provided
          cleanData.password = await bcrypt.hash(cleanData.phoneNumber || "Default123!", 12);
        }

        const user = new User(cleanData);
        const savedUser = await user.save();
        createdUsers.push(savedUser);
      } catch (err) {
        const errorMessage = err.message || "Unknown error";
        failedUsers.push({
          name: userData.name,
          email: userData.email,
          error: errorMessage,
        });
      }
    }

    const responseObj = {
      status: "success",
      message: `${createdUsers.length} ${accountType}(s) added successfully. ${duplicates.length} already exist. ${failedUsers.length} failed.`,
      createdUsers: {
        count: createdUsers.length,
        users: createdUsers.map((user) => ({
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
        })),
      },
      duplicatedUsers: {
        count: duplicates.length,
        users: duplicates,
      },
      failedUsers: {
        count: failedUsers.length,
        users: failedUsers,
      },
    };
    res.status(201).json(responseObj);
  } catch (err) {
    return next(new AppError("Creation failed: " + err.message, 500));
  }
};

module.exports = processAndInsertUsers;
