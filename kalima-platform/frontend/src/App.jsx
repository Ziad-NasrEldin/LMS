"use client";

import { Suspense, lazy, useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import NavBar from "./components/navbar";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { isMobile } from "./utils/isMobile";
import UnifiedSidebar from "./components/UnifiedSidebar";
import { useTranslation } from "react-i18next";

// Lazy load components
const AuditLog = lazy(() => import("./pages/User Dashboard/Admin dashboard/auditLog"))
const AdminDashboard = lazy(() => import("./pages/User Dashboard/Admin dashboard/home/adminDashboard"))
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
const PackagesPage = lazy(() => import("./pages/Packages Page/packagesPage"))
const PackageDetails = lazy(() => import("./pages/Packages Page/packageDetails"))
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
const AdminPanel = lazy(() => import("./pages/KalimaStore/AdminPanel/AdminPanel"));
const SignedLecturers = lazy(() => import("./pages/User Dashboard/Admin dashboard/signed-lecturers"));
const StoreAnalytics = lazy(() => import("./pages/KalimaStore/storeAnalytics"));

function App() {
  const location = useLocation();
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className={`App ${isRTL ? "rtl" : "ltr"}`}>
      <NavBar
        showSidebarToggle={showSidebar}
        onSidebarToggle={toggleSidebar}
        isSidebarOpen={sidebarOpen}
      />
      {showSidebar && (
        <>
          <UnifiedSidebar
            isOpen={sidebarOpen}
            toggleSidebar={toggleSidebar}
            isRTL={isRTL}
          />

          {/* Unified Toggle Button for all devices */}
          <button
            id="sidebar-toggle"
            className={`fixed top-20 ${
              isRTL ? "right-0" : "left-0"
            } z-40 bg-primary text-base-content p-2 ${
              isRTL ? "rounded-r-md" : "rounded-l-md"
            } shadow-md transition-transform duration-300 ease-in-out ${
              sidebarOpen ? "md:block" : "block"
            }`}
            style={{
              transform: sidebarOpen
                ? `translateX(${isRTL ? "-13rem" : "13rem"})`
                : "translateX(0)",
            }}
            onClick={toggleSidebar}
            aria-label="Toggle Sidebar"
          >
            {sidebarOpen ? (
              <FaChevronRight className={`w-4 h-4 ${!isRTL && "rotate-180"}`} />
            ) : (
              <FaChevronLeft className={`w-4 h-4 ${!isRTL && "rotate-180"}`} />
            )}
          </button>
        </>
      )}
      <div
        className={`transition-all duration-300 ${
          showSidebar && sidebarOpen
            ? isRTL
              ? "md:mr-52"
              : "md:ml-52"
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
            <Route path="/register" element={<RegisterStudent />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Content Routes */}
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/courses/:courseId" element={<CourseDetails />} />
            <Route path="/lectures" element={<LecturesPage />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route
              path="/teacher-details/:userId"
              element={<TeacherDetails />}
            />
            <Route
              path="package-details/:packageId"
              element={<PackageDetails />}
            />
            <Route path="/packages" element={<PackagesPage />} />
            <Route
              path="/package-details/:packageId"
              element={<PackageDetails />}
            />
            <Route
              path="/dashboard/center-dashboard/lesson-details/:id"
              element={<LessonDetailsSection />}
            />

            {/* User Dashboard Routes */}
            <Route
              path="/dashboard/student-dashboard/lecture-page"
              element={<ContainersPage />}
            />
            <Route
              path="/dashboard/student-dashboard/promo-codes"
              element={<PromoCodes />}
            />
            <Route
              path="/dashboard/student-dashboard/container-details/:containerId"
              element={<ContainerDetails />}
            />
            <Route
              path="/dashboard/student-dashboard/lecture-display/:lectureId"
              element={<LectureDisplay />}
            />
            <Route
              path="/dashboard/student-dashboard/lectures-page"
              element={<MyLecturesPage />}
            />
            <Route path="/dashboard/settings" element={<SettingsPage />} />

            {/* Assistant Routes */}
            <Route path="/dashboard/assistant-page" element={<AssistantPage />} />
            <Route path="/dashboard/assistant-page/lectures-page" element={<MyLecturesPage />} />
            <Route path="/dashboard/assistant-page/detailed-lecture-view/:lectureId" element={<DetailedLectureView />} />
            <Route path="/dashboard/assistant-page/lecture-display/:lectureId" element={<LectureDisplay />} />
            
            {/* Admin Routes */}
            <Route
              path="/dashboard/admin-dashboard"
              element={<AdminDashboard />}
            />
            <Route
              path="/dashboard/admin-dashboard/audit-log"
              element={<AuditLog />}
            />
            <Route
              path="/dashboard/admin-dashboard/create"
              element={<AdminCreate />}
            />
            <Route
              path="/dashboard/admin-dashboard/lectures-page"
              element={<MyLecturesPage />}
            />
            <Route
              path="/dashboard/admin-dashboard/store-dashboard"
              element={<AdminPanel />}
            />
            <Route
              path="/dashboard/admin-dashboard/signed-lecturers"
              element={<SignedLecturers />}
            />
            <Route
              path="/dashboard/admin-dashboard/store-analytics"
              element={<StoreAnalytics />}
            />
            {/* Lecturer Routes */}
            <Route
              path="/dashboard/lecturer-dashboard"
              element={<DashboardPage />}
            />
            <Route
              path="/dashboard/lecturer-dashboard/lecture-page"
              element={<ContainersPage />}
            />
            <Route
              path="/dashboard/lecturer-dashboard/CoursesForm"
              element={<CoursesForm />}
            />
            <Route
              path="/dashboard/lecturer-dashboard/container-details/:containerId"
              element={<ContainerDetails />}
            />
            <Route
              path="/dashboard/lecturer-dashboard/lecture-display/:lectureId"
              element={<LectureDisplay />}
            />
            <Route
              path="/dashboard/lecturer-dashboard/lectures-page"
              element={<MyLecturesPage />}
            />
            <Route
              path="/dashboard/lecturer-dashboard/detailed-lecture-view/:lectureId"
              element={<DetailedLectureView />}
            />

            {/* Center Dashboard Routes */}
            <Route
              path="/dashboard/courses-dashboard"
              element={<CoursesDashboard />}
            />
            <Route
              path="/dashboard/center-dashboard"
              element={<CenterDashboard />}
            />
          </Routes>
        </Suspense>
      </div>
      {/* Only show footer on public routes */}
      {!showSidebar && (
        <footer className="bg-base-200 p-4">
          {" "}
          <Footer />{" "}
        </footer>
      )}{" "}
    </div>
  );
}

export default App;
