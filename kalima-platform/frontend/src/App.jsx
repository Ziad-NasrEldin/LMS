"use client";

import { Suspense, lazy, useEffect, useState } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { FiX } from "react-icons/fi";
import NavBar from "./components/navbar";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { isMobile } from "./utils/isMobile";
import UnifiedSidebar from "./components/UnifiedSidebar";
import { useTranslation } from "react-i18next";
import AuthNoindexController from "./seo/AuthNoindexController";
import {
  getEffectiveUserRole,
  getImpersonationSession,
  getUserFromToken,
} from "./routes/auth-services";

// Lazy load components
const AdminDashboard = lazy(() => import("./pages/User Dashboard/Admin dashboard/home/adminDashboard.jsx"))
const FinancialDashboard = lazy(() => import("./pages/User Dashboard/Admin dashboard/home/FinancialDashboard.jsx"))
const CourseDetails = lazy(() => import("./pages/CourseDetails.jsx"))
const TeacherLogin = lazy(() => import("./pages/Login/login.jsx"))
const Footer = lazy(() => import("./components/footer.jsx"))
const CoursesPage = lazy(() => import("./pages/courses.jsx"))
const RegisterStudent = lazy(() => import("./pages/signup/StudentRegistration.jsx"))
const Teachers = lazy(() => import("./pages/Teachers.jsx"))
const TeacherDetails = lazy(() => import("./pages/teacher details/Teacher-details.jsx"))
const PromoCodes = lazy(() => import("./pages/User Dashboard/promoCodes.jsx"))
const SettingsPage = lazy(() => import("./pages/Settings/SettingsPage.jsx"))
const Services = lazy(() => import("./pages/Services/Services.jsx"))
const DashboardPage = lazy(() => import("./pages/Lecturer Dashboard/LecturerDashboard.jsx"))
const LecturerAnalyticsPage = lazy(() => import("./pages/Lecturer Dashboard/LecturerAnalyticsPage.jsx"))
const LecturerPromoCodesPage = lazy(() => import("./pages/Lecturer Dashboard/LecturerPromoCodesPage.jsx"))
const LecturerLinkedStudentsPage = lazy(() => import("./pages/Lecturer Dashboard/LecturerLinkedStudentsPage.jsx"))
const ContainersPage = lazy(() => import("./pages/User Dashboard/Lecture Page/ContainerPage.jsx"))
const ContainerDetails = lazy(() => import("./pages/User Dashboard/Lecture Page/ContainerDetails.jsx"))
const LectureDisplay = lazy(() => import("./pages/User Dashboard/Lecture Page/LectureDisplay.jsx"))
const AssistantPage = lazy(() => import("./pages/User Dashboard/assistantPage/assistantPage.jsx"))
const CoursesForm = lazy(() => import("./pages/CoursesForm/CoursesForm.jsx"))
const ForgotPassword = lazy(() => import("./pages/Login/ForgetPassword.jsx"))
const VerifyOtp = lazy(() => import("./pages/Login/VerifyOTP.jsx"))
const ResetPassword = lazy(() => import("./pages/Login/ResetPasswordPage.jsx"))
const AdminCreate = lazy(() => import("./pages/User Dashboard/Admin dashboard/AddNewStuff.jsx"))
const MyLecturesPage = lazy(() => import("./pages/User Dashboard/Lecture Page/LecturesPage.jsx"))
const DetailedLectureView = lazy(() => import ("./pages/User Dashboard/Lecture Page/DetailedLectureViewing.jsx"))
const PrivacyPolicy = lazy(() => import("./pages/privacyPolicy.jsx"));
const SignedLecturers = lazy(() => import("./pages/User Dashboard/Admin dashboard/signed-lecturers.jsx"));
const PromoCodesManagementPage = lazy(() => import("./pages/User Dashboard/Admin dashboard/promo-codes-management.jsx"));

function App() {
  const location = useLocation();
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [impersonationSession, setImpersonationSession] = useState(getImpersonationSession());
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const { t, i18n } = useTranslation("common");
  const isRTL = i18n.dir() === "rtl";
  const authRoutes = [
    "/login",
    "/register",
    "/signup",
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
      const session = getImpersonationSession();
      setImpersonationSession(session);
      // Reset dismissal when impersonation session changes (new session started)
      if (session?.isActive) {
        setIsBannerDismissed(false);
      }
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
      case "teacher":
        return "/dashboard/student-dashboard/overview";
      case "parent":
        return "/dashboard/parent-dashboard/overview";
      default:
        return "/";
    }
  };

  const getOverviewPathByRole = (role) => {
    const normalizedRole = String(role || "")
      .toLowerCase()
      .replace(/[^a-z]/g, "");

    if (normalizedRole === "parent") {
      return "/dashboard/parent-dashboard/overview";
    }

    if (normalizedRole === "student" || normalizedRole === "teacher") {
      return "/dashboard/student-dashboard/overview";
    }

    return getDashboardFallbackByRole(role);
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

  const renderParentRoute = (element) =>
    renderDashboardRoute(element, ["parent"]);

  const RoleAwareOverviewRedirect = () => {
    const user = getUserFromToken();
    if (!user || typeof user !== "object") {
      return <Navigate to="/login" replace />;
    }

    const role = getCurrentUserRole();
    return <Navigate to={getOverviewPathByRole(role)} replace />;
  };

  const TeacherOverviewPlaceholder = () => (
    <div className="mx-auto mt-6 w-full max-w-5xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <p className="text-xl font-semibold text-slate-800">
          {isRTL ? "مزايا أكثر قادمة لك قريبًا" : "More Features Coming For you soon"}
        </p>
      </div>
    </div>
  );

  const StudentDashboardOverviewRoute = () => {
    const role = getCurrentUserRole();
    const normalizedRole = String(role || "")
      .toLowerCase()
      .replace(/[^a-z]/g, "");

    if (normalizedRole === "teacher") {
      return <TeacherOverviewPlaceholder />;
    }

    return <PromoCodes />;
  };

  return (
    <div className={`App ${isRTL ? "rtl" : "ltr"}`}>
      <AuthNoindexController />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          className: "glass glass-text",
          style: {
            borderRadius: "999px",
            padding: "12px 20px",
          },
        }}
      />
      <NavBar />
      {!isAuthRoute && showSidebar && impersonationSession?.isActive && !isBannerDismissed && (
        <div
          className={`glass glass-text fixed top-24 z-[100] rounded-2xl px-4 py-3 text-sm font-semibold shadow-xl ${
            isRTL ? "right-20 md:right-80 text-right" : "left-20 md:left-80 text-left"
          }`}
          dir={isRTL ? "rtl" : "ltr"}
        >
          <div className="flex items-center gap-3">
            <span className="flex-1 drop-shadow-sm">
              {t("impersonationBanner", {
                defaultValue: "You are viewing as {{role}}: {{name}}",
                role: impersonationSession.targetRole,
                name: impersonationSession.targetName,
              })}
            </span>
            <button
              onClick={() => setIsBannerDismissed(true)}
              className="flex-shrink-0 rounded-full p-1 hover:bg-[#0E5563]/20 transition-colors"
              aria-label="Dismiss"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
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
            {/* Authentication Routes */}
            <Route path="/login" element={<TeacherLogin />} />
            <Route path="/register" element={<RegisterStudent />} />
            <Route path="/signup" element={<RegisterStudent />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Content Routes */}
            <Route path="/courses/:courseId/:slug" element={<CourseDetails />} />
            <Route path="/courses/:courseId" element={<CourseDetails />} />
            <Route
              path="/teachers/:userId/:slug"
              element={<TeacherDetails />}
            />
            <Route
              path="/teachers/:userId"
              element={<TeacherDetails />}
            />
            <Route
              path="/teacher-details/:userId"
              element={<TeacherDetails />}
            />

            {/* User Dashboard Routes */}
            <Route
              path="/dashboard/student-dashboard/courses-page"
              element={renderStudentRoute(<ContainersPage />)}
            />
            <Route
              path="/dashboard/student-dashboard/overview"
              element={renderDashboardRoute(<StudentDashboardOverviewRoute />, ["student", "teacher"])}
            />
            <Route
              path="/dashboard/parent-dashboard/overview"
              element={renderParentRoute(<PromoCodes />)}
            />
            <Route
              path="/dashboard/student-dashboard/promo-codes"
              element={<RoleAwareOverviewRedirect />}
            />
            <Route
              path="/dashboard/student-dashboard"
              element={<RoleAwareOverviewRedirect />}
            />
            <Route
              path="/dashboard/parent-dashboard"
              element={renderParentRoute(<Navigate to="/dashboard/parent-dashboard/overview" replace />)}
            />
            <Route
              path="/dashboard/parent-dashboard/promo-codes"
              element={<RoleAwareOverviewRedirect />}
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
            {/* Lecturer Routes */}
            <Route
              path="/dashboard/lecturer-dashboard"
              element={renderLecturerRoute(<DashboardPage />)}
            />
            <Route
              path="/dashboard/lecturer-dashboard/analytics"
              element={renderLecturerRoute(<LecturerAnalyticsPage />)}
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
            <Route
              path="/dashboard/lecturer-dashboard/promo-codes"
              element={renderLecturerRoute(<LecturerPromoCodesPage />)}
            />
            <Route
              path="/dashboard/lecturer-dashboard/linked-students"
              element={renderLecturerRoute(<LecturerLinkedStudentsPage />)}
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
