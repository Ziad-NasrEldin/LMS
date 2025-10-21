const AppError = require("../appError");
const bcrypt = require("bcrypt");
const User = require("../../models/userModel");

const processAndInsertUsers = async (results, accountType, res, next) => {
  if (results.length === 0) {
    return next(new AppError("No valid data found in the uploaded file", 400));
  }

  try {
    const resultsWithHashedPasswords = await Promise.all(
      results.map(async (user) => {
        if (user.password) {
          const hashedPassword = await bcrypt.hash(user.password, 10);
          return { ...user, password: hashedPassword };
        }
        return user;
      })
    );

    const existingUsers = await User.find({
      email: { $in: resultsWithHashedPasswords.map((user) => user.email) },
    });

    const existingEmails = new Set(existingUsers.map((user) => user.email));

    const newUsers = [];
    const duplicates = [];

    resultsWithHashedPasswords.forEach((user) => {
      if (existingEmails.has(user.email)) {
        duplicates.push({
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
        });
      } else {
        newUsers.push(user);
      }
    });

    let createdUsers = [];
    if (newUsers.length > 0) {
      createdUsers = await User.insertMany(newUsers);
    }

    const responseObj = {
      status: "success",
      message: `${createdUsers.length} ${accountType}(s) added successfully. ${duplicates.length} already exist.`,
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
    };
    res.status(201).json(responseObj);
  } catch (err) {
    return next(new AppError("Creation failed", 500));
  }
};

module.exports = processAndInsertUsers;
