const jwt = require("jsonwebtoken");

const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { UserInfo: { id: userId, role: role } },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "30m",
    }
  );
};

const generateRefreshToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
};

module.exports = { generateAccessToken, generateRefreshToken };
