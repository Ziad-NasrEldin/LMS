require("dotenv").config();

const parentRoutes = require("./routes/parentRoutes");
const mongoSanitize = require("express-mongo-sanitize");
const express = require("express");
const morgan = require("morgan");
const app = express();
// Trust first proxy hop (nginx) so rate-limit and client IP handling work correctly.
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3200;
const cors = require("cors");
const connectDB = require("./config/dbConn.js");
const mongoose = require("mongoose");
const corsOptions = require("./config/corsOptions.js");
const cookieParser = require("cookie-parser");
const auditLogger = require("./middleware/auditLogger");
const path = require("path");

const containerRouter = require("./routes/containerRoutes");
const lectureRouter = require("./routes/lectureRoutes");
const userRouter = require("./routes/userRoutes");
const purchaseRouter = require("./routes/purchaseRoutes");
const errorHandler = require("./controllers/errorController.js");
const subjectRouter = require("./routes/subjectRoutes.js");
const levelRouter = require("./routes/levelRoutes.js");
const StudentLectureAccessRouter = require("./routes/studentLectureAccessRoutes.js");
const codeRouter = require("./routes/codeRoutes");
const lecturerRouter = require("./routes/lecturerRoutes.js");
const assistantRouter = require("./routes/assistantRoutes.js");
const revenueRouter = require("./routes/revenueRoutes");
const attachmentRouter = require("./routes/attachmentRoutes.js");
// New routes for exam and homework functionality
const ExamConfigRouter = require("./routes/ExamConfigRoutes.js");
const studentExamSubmissionRouter = require("./routes/studentExamSubmissionRoutes.js");
const seedInitialAdminDirect = require("./utils/seeds/seedInitialAdminDirect");
const governmentRoutes = require("./routes/governmentRoutes");
const ecReferralRoutes = require("./routes/ec.referralRoutes");


connectDB();

app.use(cors(corsOptions));
app.use(express.json({ limit: "120mb" }));
app.use(express.urlencoded({ limit: '120mb', extended: true }));

app.use(mongoSanitize());
app.use(cookieParser());
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
app.use("/api/v1/register", require("./routes/registerRoutes.js"));
app.use("/api/v1/auth", require("./routes/authRoutes.js"));
app.use("/api/v1/password-reset", require("./routes/passwordResetRoutes.js"));
app.use("/api/v1/otp", require("./utils/emailVerification/otpRoutes.js"));
app.use("/api/v1/containers", auditLogger, containerRouter);
app.use("/api/v1/lectures", lectureRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/purchases", purchaseRouter);
app.use("/api/v1/levels", levelRouter);
app.use("/api/v1/subjects", subjectRouter);
app.use("/api/v1/student-lecture-access", StudentLectureAccessRouter);
app.use("/api/v1/codes", auditLogger, codeRouter);
app.use("/api/v1/lecturers", auditLogger, lecturerRouter);
app.use("/api/v1/assistants", auditLogger, assistantRouter);

app.use("/api/v1/revenue", revenueRouter);
app.use("/api/v1/attachments", attachmentRouter);
app.use("/api/v1/parents", parentRoutes);
// Add new routes for exam and homework functionality
app.use("/api/v1/exam-configs", ExamConfigRouter);
app.use("/api/v1/exam-submissions", studentExamSubmissionRouter);
app.use("/api/v1/governments", governmentRoutes);
app.use("/api/v1/ec/referrals", ecReferralRoutes);

app.use("/api/v1/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

mongoose.connection.once("open", async () => {
  console.log("Connected to MongoDB.");

  try {
    // Seed required data before handling requests.
    await seedInitialAdminDirect();
    console.log("Initial seed checks completed.");
  } catch (err) {
    console.error("Error during initialization:", err);
  }

  app.listen(PORT, () => {
    console.log(`Server active and listening on port ${PORT}.`);
  });
});

mongoose.connection.on("error", (err) => {
  console.log(err);
});

app.use(errorHandler);
