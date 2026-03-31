"use client";

import { Suspense, lazy, useEffect, useState } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import NavBar from "./components/navbar";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { isMobile } from "./utils/isMobile";
import UnifiedSidebar from "./components/UnifiedSidebar";
import { useTranslation } from "react-i18next";
import {
  getEffectiveUserRole,
  getImpersonationSession,
  getUserFromToken,
} from "./routes/auth-services";

// Lazy load components
const AuditLog = lazy(() => import("./pages/User Dashboard/Admin dashboard/auditLog"))
const AdminDashboard = lazy(() => import("./pages/User Dashboard/Admin dashboard/home/adminDashboard"))
const FinancialDashboard = lazy(() => import("./pages/User Dashboard/Admin dashboard/home/FinancialDashboard"))
const CourseDetails = lazy(() => import("./pages/CourseDetails"))
const LecturesPage = lazy(() => import("./pages/lectures"))
const TeacherLogin = lazy(() => import("./pages/Login/login"))
const Footer = lazy(() => import("./components/footer"))
const CoursesPage = lazy(() => import("./pages/courses"))
const RegisterStudent = lazy(() => import("./pages/signup/StudentRegistration"))
const Teachers = lazy(() => import("./pages/Teachers"))
const TeacherDetails = lazy(() => import("./pages/teacher details/Teacher-details"))
const PromoCodes = lazy(() => import("./pages/User Dashboard/promoCodes"))
const SettingsPage = lazy(() => import("./pages/Settings/SettingsPage"))
const Services = lazy(() => import("./pages/Services/Services"))
const DashboardPage = lazy(() => import("./pages/Lecturer Dashboard/LecturerDashboard"))
const ContainersPage = lazy(() => import("./pages/User Dashboard/Lecture Page/ContainerPage"))
const ContainerDetails = lazy(() => import("./pages/User Dashboard/Lecture Page/ContainerDetails"))
const LectureDisplay = lazy(() => import("./pages/User Dashboard/Lecture Page/LectureDisplay"))
const AssistantPage = lazy(() => import("./pages/User Dashboard/assistantPage/assistantPage"))
const CoursesDashboard = lazy(() => import("./pages/CoursesDashboard/CoursesDashboard"))
const CenterDashboard = lazy(() => import("./pages/CenterDashboard/CenterDashboard"))


const CoursesForm = lazy(() => import("./pages/CoursesForm/CoursesForm"))
const ForgotPassword = lazy(() => import("./pages/Login/ForgetPassword"))
const VerifyOtp = lazy(() => import("./pages/Login/VerifyOTP"))
const ResetPassword = lazy(() => import("./pages/Login/ResetPasswordPage"))
const LessonDetailsSection = lazy(() => import("./pages/CenterDashboard/LessonDetails"))
const AdminCreate = lazy(() => import("./pages/User Dashboard/Admin dashboard/AddNewStuff"))
const MyLecturesPage = lazy(() => import("./pages/User Dashboard/Lecture Page/LecturesPage"))
const DetailedLectureView = lazy(() => import ("./pages/User Dashboard/Lecture Page/DetailedLectureViewing"))
const PrivacyPolicy = lazy(() => import("./pages/privacyPolicy"));
const Market = lazy(() => import("./pages/KalimaStore/Market"));
const ProductDetails = lazy(() => import("./pages/KalimaStore/ProductDetails"));
const SignedLecturers = lazy(() => import("./pages/User Dashboard/Admin dashboard/signed-lecturers"));
const PromoCodesManagementPage = lazy(() => import("./pages/User Dashboard/Admin dashboard/promo-codes-management"));

function App() {
  const location = useLocation();
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [impersonationSession, setImpersonationSession] = useState(getImpersonationSession());
  const { t, i18n } = useTranslation("common");
  const isRTL = i18n.dir() === "rtl";
  const authRoutes = [
    "/login",
    "/signin",
    "/register",
    "/signup",
    "/sign-in",
    "/sign-up",
    "/forgot-password",
    "/verify-otp",
    "/reset-password",
  ];
  const isAuthRoute = authRoutes.includes(location.pathname);

  // useEffect(() => {
  //   const handleContextMenu = (e) => e.preventDefault();
  //   const disableDrag = () => {
  //     document.querySelectorAll("img").forEach((img) => {
  //       img.setAttribute("draggable", "false");
  //     });
  //   };

  //   document.addEventListener("contextmenu", handleContextMenu);
  //   disableDrag(); // On mount

  //   return () => {
  //     document.removeEventListener("contextmenu", handleContextMenu);
  //   };
  // }, []);

  useEffect(() => {
    const isDashboardRoute = location.pathname.startsWith("/dashboard/");
    setShowSidebar(isDashboardRoute);

    // Set initial sidebar state based on device
    if (isMobile()) {
      setSidebarOpen(false); // Start closed on mobile
    } else {
      setSidebarOpen(true); // Start open on desktop
    }
  }, [location.pathname]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location.pathname]);

  useEffect(() => {
    const syncImpersonationSession = () => {
      setImpersonationSession(getImpersonationSession());
    };

    syncImpersonationSession();
    window.addEventListener("impersonation-changed", syncImpersonationSession);
    window.addEventListener("storage", syncImpersonationSession);

    return () => {
      window.removeEventListener("impersonation-changed", syncImpersonationSession);
      window.removeEventListener("storage", syncImpersonationSession);
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const getDashboardFallbackByRole = (role) => {
    const normalizedRole = String(role || "")
      .toLowerCase()
      .replace(/[^a-z]/g, "");

    switch (normalizedRole) {
      case "admin":
      case "subadmin":
        return "/dashboard/admin-dashboard";
      case "lecturer":
        return "/dashboard/lecturer-dashboard";
      case "assistant":
        return "/dashboard/assistant-page";
      case "student":
      case "parent":
      case "teacher":
        return "/dashboard/student-dashboard/promo-codes";
      default:
        return "/";
    }
  };

  const normalizeRoleForMatch = (role) => {
    const normalizedRole = String(role || "")
      .toLowerCase()
      .replace(/[^a-z]/g, "");

    return normalizedRole === "subadmin" ? "admin" : normalizedRole;
  };

  const getCurrentUserRole = () => {
    const effectiveRole = getEffectiveUserRole();
    if (effectiveRole) return effectiveRole;

    const tokenUser = getUserFromToken();

    if (tokenUser && typeof tokenUser === "object") {
      const tokenRole = tokenUser.role || tokenUser?.UserInfo?.role;
      if (tokenRole) {
        return String(tokenRole)
          .toLowerCase()
          .replace(/[^a-z]/g, "");
      }
    }

    try {
      const localUserRaw = localStorage.getItem("user");
      if (!localUserRaw) return "";

      const localUser = JSON.parse(localUserRaw);
      return String(localUser?.role || "")
        .toLowerCase()
        .replace(/[^a-z]/g, "");
    } catch (_error) {
      return "";
    }
  };

  const renderDashboardRoute = (element, allowedRoles = []) => {
    const user = getUserFromToken();
    const role = getCurrentUserRole();

    if (!user || typeof user !== "object") {
      return <Navigate to="/login" replace />;
    }

    if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
      return element;
    }

    const normalizedRole = normalizeRoleForMatch(role);
    const allowedRoleSet = new Set(
      allowedRoles.map((allowedRole) => normalizeRoleForMatch(allowedRole)),
    );

    if (!allowedRoleSet.has(normalizedRole)) {
      return <Navigate to={getDashboardFallbackByRole(role)} replace />;
    }

    return element;
  };

  const renderAdminRoute = (element) =>
    renderDashboardRoute(element, ["admin", "subadmin"]);

  const renderLecturerRoute = (element) =>
    renderDashboardRoute(element, ["lecturer"]);

  const renderAssistantRoute = (element) =>
    renderDashboardRoute(element, ["assistant"]);

  const renderStudentRoute = (element) =>
    renderDashboardRoute(element, ["student", "parent", "teacher"]);

  return (
    <div className={`App ${isRTL ? "rtl" : "ltr"}`}>
      <NavBar />
      {!isAuthRoute && showSidebar && impersonationSession?.isActive && (
        <div
          className={`mx-auto mt-2 max-w-[1220px] rounded-2xl border px-4 py-3 text-sm font-semibold ${
            isRTL ? "text-right" : "text-left"
          }`}
          style={{
            background: "rgba(14,85,99,0.08)",
            borderColor: "rgba(14,85,99,0.24)",
            color: "#0E5563",
          }}
          dir={isRTL ? "rtl" : "ltr"}
        >
          {t("impersonationBanner", {
            defaultValue: "You are viewing as {{role}}: {{name}}",
            role: impersonationSession.targetRole,
            name: impersonationSession.targetName,
          })}
        </div>
      )}
      {!isAuthRoute && showSidebar && (
        <>
          <UnifiedSidebar
            isOpen={sidebarOpen}
            toggleSidebar={toggleSidebar}
            isRTL={isRTL}
          />


        </>
      )}
      <div
        className={`transition-all duration-300 ${
          !isAuthRoute && showSidebar && sidebarOpen
            ? isRTL
              ? "md:mr-[20rem]"
              : "md:ml-[20rem]"
            : "ml-0"
        }`}
      >
        <Suspense fallback={<LoadingSpinner fullScreen />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Services />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/market" element={<Market />} />
            <Route path="/market/product-details/:type/:id" element={<ProductDetails />} />

            {/* Authentication Routes */}
            <Route path="/login" element={<TeacherLogin />} />
            <Route path="/signin" element={<TeacherLogin />} />
            <Route path="/sign-in" element={<TeacherLogin />} />
            <Route path="/register" element={<RegisterStudent />} />
            <Route path="/signup" element={<RegisterStudent />} />
            <Route path="/sign-up" element={<RegisterStudent />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Content Routes */}
            <Route path="/courses/:courseId" element={<CourseDetails />} />
            <Route path="/lectures" element={<LecturesPage />} />
            <Route
              path="/teacher-details/:userId"
              element={<TeacherDetails />}
            />

            <Route
              path="/dashboard/center-dashboard/lesson-details/:id"
              element={<LessonDetailsSection />}
            />

            {/* User Dashboard Routes */}
            <Route
              path="/dashboard/student-dashboard/courses-page"
              element={renderStudentRoute(<ContainersPage />)}
            />
            <Route
              path="/dashboard/student-dashboard/promo-codes"
              element={renderStudentRoute(<PromoCodes />)}
            />
            <Route
              path="/dashboard/student-dashboard/container-details/:containerId"
              element={renderStudentRoute(<ContainerDetails />)}
            />
            <Route
              path="/dashboard/student-dashboard/lecture-display/:lectureId"
              element={renderStudentRoute(<LectureDisplay />)}
            />
            <Route
              path="/dashboard/student-dashboard/lectures-page"
              element={renderStudentRoute(<MyLecturesPage />)}
            />
            <Route
              path="/dashboard/settings"
              element={renderDashboardRoute(<SettingsPage />)}
            />

            {/* Assistant Routes */}
            <Route
              path="/dashboard/assistant-page"
              element={renderAssistantRoute(<AssistantPage />)}
            />
            <Route
              path="/dashboard/assistant-page/lectures-page"
              element={renderAssistantRoute(<MyLecturesPage />)}
            />
            <Route
              path="/dashboard/assistant-page/detailed-lecture-view/:lectureId"
              element={renderAssistantRoute(<DetailedLectureView />)}
            />
            <Route
              path="/dashboard/assistant-page/lecture-display/:lectureId"
              element={renderAssistantRoute(<LectureDisplay />)}
            />
            
            {/* Admin Routes */}
            <Route
              path="/dashboard/admin-dashboard"
              element={renderAdminRoute(<AdminDashboard />)}
            />
            <Route
              path="/dashboard/admin-dashboard/audit-log"
              element={renderAdminRoute(<AuditLog />)}
            />
            <Route
              path="/dashboard/admin-dashboard/create"
              element={renderAdminRoute(<AdminCreate />)}
            />
            <Route
              path="/dashboard/admin-dashboard/lectures-page"
              element={renderAdminRoute(<MyLecturesPage />)}
            />
            <Route
              path="/dashboard/admin-dashboard/signed-lecturers"
              element={renderAdminRoute(<SignedLecturers />)}
            />
            <Route
              path="/dashboard/admin-dashboard/financial-dashboard"
              element={renderAdminRoute(<FinancialDashboard />)}
            />
            <Route
              path="/dashboard/admin-dashboard/promo-codes-management"
              element={renderAdminRoute(<PromoCodesManagementPage />)}
            />
              <Route
                path="/dashboard/admin-dashboard/store-dashboard"
                element={<Navigate to="/dashboard/admin-dashboard" replace />}
              />
              <Route
                path="/dashboard/admin-dashboard/store-analytics"
                element={<Navigate to="/dashboard/admin-dashboard" replace />}
              />
            {/* Lecturer Routes */}
            <Route
              path="/dashboard/lecturer-dashboard"
              element={renderLecturerRoute(<DashboardPage />)}
            />
            <Route
              path="/dashboard/lecturer-dashboard/courses-page"
              element={renderLecturerRoute(<ContainersPage />)}
            />
            <Route
              path="/dashboard/lecturer-dashboard/CoursesForm"
              element={renderLecturerRoute(<CoursesForm />)}
            />
            <Route
              path="/dashboard/lecturer-dashboard/CoursesForm/:containerId"
              element={renderLecturerRoute(<CoursesForm />)}
            />
            <Route
              path="/dashboard/lecturer-dashboard/container-details/:containerId"
              element={renderLecturerRoute(<ContainerDetails />)}
            />
            <Route
              path="/dashboard/lecturer-dashboard/lecture-display/:lectureId"
              element={renderLecturerRoute(<LectureDisplay />)}
            />
            <Route
              path="/dashboard/lecturer-dashboard/lectures-page"
              element={renderLecturerRoute(<MyLecturesPage />)}
            />
            <Route
              path="/dashboard/lecturer-dashboard/detailed-lecture-view/:lectureId"
              element={renderLecturerRoute(<DetailedLectureView />)}
            />

            {/* Center Dashboard Routes */}
            <Route
              path="/dashboard/courses-dashboard"
              element={renderAdminRoute(<CoursesDashboard />)}
            />
            <Route
              path="/dashboard/center-dashboard"
              element={renderAdminRoute(<CenterDashboard />)}
            />
          </Routes>
        </Suspense>
      </div>
      {/* Only show footer on public routes */}
      {!showSidebar && (
        <div className="px-4 pb-6 sm:px-6 lg:px-8">
          <Footer />
        </div>
      )}{" "}
    </div>
  );
}

export default App;
