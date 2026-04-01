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
const centerRouter = require("./routes/centerRoutes");
const messageRouter = require("./routes/messageRoutes");
const adminDashboardRouter = require("./routes/adminDashboardRoutes.js");
const codeRouter = require("./routes/codeRoutes");
const adminRouter = require("./routes/adminRoutes.js");
const subAdminRouter = require("./routes/subAdminRoutes.js");
const moderatorRouter = require("./routes/moderatorRoutes.js");
const lecturerRouter = require("./routes/lecturerRoutes.js");
const assistantRouter = require("./routes/assistantRoutes.js");

const auditLogRouter = require("./routes/auditLogRoutes.js");
const cLecturerRouter = require("./routes/center.lecturerRoutes.js");
const cStudentRouter = require("./routes/center.studentRoutes.js");
const lessonRouter = require("./routes/lessonRoutes.js");
const attendanceRouter = require("./routes/attendanceRoutes");
const revenueRouter = require("./routes/revenueRoutes");
const pricingRuleRouter = require("./routes/pricingRuleRoutes");
const attachmentRouter = require("./routes/attachmentRoutes.js");
const groupedLessonsRouter = require("./routes/groupedLessonsRoutes.js");
const reportRouter = require("./routes/reportRoutes.js");
// Importing e-commerce related routes
const ecSectionRouter = require("./routes/ec.sectionRoutes.js");
const ecProductRouter = require("./routes/ec.productRoutes.js");
const ecBookRouter = require("./routes/ec.bookRoutes.js");
const ecPurchaseRouter = require("./routes/ec.purchaseRoutes.js");
const ecBookPurchaseRouter = require("./routes/ec.bookpurchaseRoutes.js");
const ECSubSectionRouter = require("./routes/ec.subSectionRoutes.js");
// New routes for exam and homework functionality
const ExamConfigRouter = require("./routes/ExamConfigRoutes.js");
const studentExamSubmissionRouter = require("./routes/studentExamSubmissionRoutes.js");
const assistantHomeworkRouter = require("./routes/assistantHomeworkRoutes.js");
const seedInitialAdminDirect = require("./utils/seeds/seedInitialAdminDirect");
const governmentRoutes = require("./routes/governmentRoutes");
const ecCouponRouter = require("./routes/ec.couponRoutes");
const ecReferralRoutes = require("./routes/ec.referralRoutes");


connectDB();

app.use(cors(corsOptions));
const captureRawJsonBody = (req, _res, buf) => {
  if (buf && buf.length > 0) {
    req.rawBody = buf.toString("utf8");
  }
};

app.use(express.json({ limit: "120mb", verify: captureRawJsonBody }));
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
app.use("/api/v1/centers", auditLogger, centerRouter);
app.use("/api/v1/messages", messageRouter);
app.use("/api/v1/dashboard", adminDashboardRouter);
app.use("/api/v1/codes", auditLogger, codeRouter);
app.use("/api/v1/admins", auditLogger, adminRouter);
app.use("/api/v1/sub-admins", auditLogger, subAdminRouter);
app.use("/api/v1/moderators", auditLogger, moderatorRouter);
app.use("/api/v1/lecturers", auditLogger, lecturerRouter);
app.use("/api/v1/assistants", auditLogger, assistantRouter);

app.use("/api/v1/audit-logs", auditLogRouter);
app.use("/api/v1/center-lecturer", cLecturerRouter);
app.use("/api/v1/center-student", cStudentRouter);
app.use("/api/v1/lessons", lessonRouter);
app.use("/api/v1/attendance", attendanceRouter);
app.use("/api/v1/revenue", revenueRouter);
app.use("/api/v1/attachments", attachmentRouter);
app.use("/api/v1/pricing-rules", pricingRuleRouter); // Mount pricing rule router
app.use("/api/v1/parents", parentRoutes);
app.use("/api/v1/groupedLessons", groupedLessonsRouter);
app.use("/api/v1/reports", reportRouter); // Mount report router
// Add new routes for exam and homework functionality
app.use("/api/v1/exam-configs", ExamConfigRouter);
app.use("/api/v1/exam-submissions", studentExamSubmissionRouter);
app.use("/api/v1/assistant-homework", assistantHomeworkRouter);
app.use("/api/v1/governments", governmentRoutes);
// Mount the new e-commerce product and book routes
app.use("/api/v1/ec/sections", auditLogger, ecSectionRouter);
app.use("/api/v1/ec/products", auditLogger, ecProductRouter);
app.use("/api/v1/ec/books", ecBookRouter);
app.use("/api/v1/ec/purchases", auditLogger, ecPurchaseRouter);
app.use("/api/v1/ec/book-purchases", ecBookPurchaseRouter);
app.use("/api/v1/ec/coupons", ecCouponRouter);
app.use("/api/v1/ec/referrals", ecReferralRoutes);
app.use("/api/v1/ec/subsections", auditLogger, ECSubSectionRouter);

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
