const rateLimit = require("express-rate-limit");
// Prevents login attempts in a specified period of time.

const loginLimiter = rateLimit({
  windowsMs: 60 * 1000, // 1 minute should be changed for production
  max: 5, // Limit each IP to 5 login attempt per window
  message: {
    message:
      "Too many login attempts from this IP, Please try again after a 60 second pause.",
  },
  handler: (req, res, next, options) => {
    // Could also implement an event logger here.
    res.status(options.statusCode).send(options.message);
  },
  standardHeaders: true,
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
});

module.exports = loginLimiter;
