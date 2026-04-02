const allowedOrigins = require("./allowedOrigins");

const corsOptions = {
  origin: (origin, callback) => {
    if (
      allowedOrigins.indexOf(origin) !== -1 ||
      !origin // No origin accepted in case of using local testing software
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },

  credentials: true,
  exposedHeaders: ["Content-Disposition", "X-Download-Filename"],
  optionsSuccessStatus: 200,
};

module.exports = corsOptions;
