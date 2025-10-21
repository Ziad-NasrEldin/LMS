require("dotenv").config();

const parentRoutes = require("./routes/parentRoutes");
const mongoSanitize = require("express-mongo-sanitize");
const express = require("express");
const morgan = require("morgan");
const app = express();
const PORT = process.env.PORT || 3200;
const cors = require("cors");
const connectDB = require("./config/dbConn.js");
const mongoose = require("mongoose");
const corsOptions = require("./config/corsOptions.js");
const cookieParser = require("cookie-parser");
const auditLogger = require("./middleware/auditLogger");
const path = require("path");
const multer = require("multer");

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
const { createServer } = require("http");
const { Server } = require("socket.io");
const Notification = require("./models/notification");
const adminDashboardRouter = require("./routes/adminDashboardRoutes.js");
const codeRouter = require("./routes/codeRoutes");
const adminRouter = require("./routes/adminRoutes.js");
const subAdminRouter = require("./routes/subAdminRoutes.js");
const moderatorRouter = require("./routes/moderatorRoutes.js");
const lecturerRouter = require("./routes/lecturerRoutes.js");
const assistantRouter = require("./routes/assistantRoutes.js");
const packegeRouter = require("./routes/packageRoutes.js");
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
const seedNotificationTemplates = require("./utils/seeds/seedNotificationTemplates");
const governmentRoutes = require("./routes/governmentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const ecCouponRouter = require("./routes/ec.couponRoutes");
const ecReferralRoutes = require("./routes/ec.referralRoutes");


connectDB();

// After connecting to the database, check for admin user
mongoose.connection.once("open", async () => {
  console.log("Connected to MongoDB");
  try {
    // Attempt to create an initial admin user if none exists
    // using the direct approach that bypasses validation
    await seedInitialAdminDirect();
    console.log("Admin user check completed");

    // Seed notification templates
    await seedNotificationTemplates();
  } catch (err) {
    console.error("Error during initialization:", err);
  }
});

app.use(cors(corsOptions));
app.use(express.json({ limit: '120mb' }));
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
app.use("/api/v1/packages", auditLogger, packegeRouter);
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
app.use("/api/v1/notifications", notificationRoutes);
// Mount the new e-commerce product and book routes
app.use("/api/v1/ec/sections", auditLogger, ecSectionRouter);
app.use("/api/v1/ec/products", auditLogger, ecProductRouter);
app.use("/api/v1/ec/books", ecBookRouter);
app.use("/api/v1/ec/purchases", auditLogger, ecPurchaseRouter);
app.use("/api/v1/ec/book-purchases", ecBookPurchaseRouter);
app.use("/api/v1/ec/coupons", ecCouponRouter);
app.use("/api/v1/ec/referrals", ecReferralRoutes);
app.use("/api/v1/ec/subsections", auditLogger, ECSubSectionRouter);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

mongoose.connection.once("open", () => {
  console.log("Connected to MongoDB.");

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: corsOptions.origin,
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000, // Increase ping timeout for better connection stability
  });

  // Track connected users
  const connectedUsers = new Map();

  // Add middleware to handle authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    const userId = socket.handshake.query.userId;

    if (!token || !userId) {
      console.log("Socket connection rejected: Missing token or userId");
      return next(new Error("Authentication error"));
    }

    // Here you could verify the token if needed

    // Store user information in socket object
    socket.userId = userId;
    next();
  });

  io.on("connection", (socket) => {
    console.log("A client connected:", socket.id, "User ID:", socket.userId);

    // Handle subscription to notifications
    socket.on("subscribe", async (userId) => {
      if (!userId) {
        console.log("Invalid subscription attempt: No userId provided");
        return;
      }

      console.log(
        `User ${userId} subscribed to notifications with socket ID ${socket.id}`
      );

      // Add user to connected users map
      connectedUsers.set(socket.id, userId);
      socket.join(userId);
      console.log(`Socket ${socket.id} joined room: ${userId}`);

      try {
        // Check if we should send pending notifications
        const pendingNotifications = await Notification.find({
          userId,
          isSent: false,
        })
          .sort({ createdAt: -1 })
          .limit(20);

        console.log(
          `Found ${pendingNotifications.length} pending notifications for user ${userId}`
        );

        if (pendingNotifications.length > 0) {
          // Mark notifications as sent
          await Notification.updateMany(
            { userId, isSent: false },
            { isSent: true }
          );

          // Send each notification to the client
          pendingNotifications.forEach((notification) => {
            // Determine event type based on notification type
            const eventType =
              notification.type === "new_homework"
                ? "newHomework"
                : notification.type === "new_lecture"
                  ? "newLecture"
                  : notification.type === "new_container"
                    ? "newContainer"
                    : notification.type === "new_attachment" ||
                      notification.type === "new_attachment_assignment" ||
                      notification.type === "new_exam"
                      ? "newAttachment"
                      : notification.type === "lecture_updated"
                        ? "lectureUpdate"
                        : "notification";

            console.log(`Sending ${eventType} notification to user ${userId}`);

            socket.emit(eventType, {
              title: notification.title,
              message: notification.message,
              type: notification.type,
              subjectId: notification.relatedId,
              notificationId: notification._id,
              createdAt: notification.createdAt,
            });
          });
        }
      } catch (error) {
        console.error("Error processing notifications:", error);
      }
    });

    // Handle client pings to keep connection alive
    socket.on("ping", () => {
      socket.emit("pong");
    });

    socket.on("disconnect", (reason) => {
      // Remove from connected users map
      const userId = connectedUsers.get(socket.id);
      console.log(
        `User ${userId} disconnected: ${reason}, socket ID ${socket.id}`
      );
      connectedUsers.delete(socket.id);
    });

    // Handle errors
    socket.on("error", (error) => {
      console.error(`Socket error for user ${socket.userId}:`, error);
    });
  });

  // Make io accessible in routes
  app.set("io", io);

  httpServer.listen(PORT, () => {
    console.log(`Server active and listening on port ${PORT}.`);
  });
});

mongoose.connection.on("error", (err) => {
  console.log(err);
});

app.use(errorHandler);
