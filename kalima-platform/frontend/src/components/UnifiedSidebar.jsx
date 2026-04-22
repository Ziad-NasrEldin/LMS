import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "./ui/Button";
import Input from "./ui/Input";
import {
  FaChartLine,
  FaChevronLeft,
  FaChevronRight,
  FaCog,
  FaEye,
  FaGraduationCap,
  FaMoneyBillWave,
  FaSignOutAlt,
  FaTimes,
  FaUser,
  FaUserAlt,
  FaUserGraduate,
  FaUserShield,
  FaUserTie,
  FaComment,
} from "react-icons/fa";
import { Edit, Lightbulb } from "lucide-react";
import {
  getAllAssistants,
  getAllLecturers,
  getAllParents,
  getAllStudents,
  getAllTeachers,
  getAllUsers,
} from "../routes/fetch-users";
import {
  getImpersonationSession,
  getCachedUserSummary,
  logoutUser,
  startImpersonation,
  stopImpersonation,
} from "../routes/auth-services";
import { resolveProfileImageUrl } from "../utils/profileImage";
import { translateErrorMessage } from "../utils/errorTranslator";

const NAVBAR_HEIGHT = 92;

const normalizeRole = (role) => String(role || "").trim().toLowerCase();

const normalizePolicyRole = (role) => {
  const normalized = normalizeRole(role);
  if (normalized === "subadmin") return "admin";
  return normalized;
};

const ALLOWED_IMPERSONATION_TARGETS = {
  admin: ["lecturer", "student", "parent", "teacher", "assistant"],
  lecturer: ["student", "parent"],
  assistant: ["student"],
};

const IMPERSONATION_TARGET_FETCHERS = {
  assistant: getAllAssistants,
  lecturer: getAllLecturers,
  parent: getAllParents,
  student: getAllStudents,
  teacher: getAllTeachers,
};

const getDashboardPathByRole = (role) => {
  const normalized = normalizeRole(role);
  if (normalized === "admin" || normalized === "subadmin") return "/dashboard/admin-dashboard";
  if (normalized === "lecturer") return "/dashboard/lecturer-dashboard";
  if (normalized === "assistant") return "/dashboard/assistant-page";
  if (normalized === "parent") {
    return "/dashboard/parent-dashboard/overview";
  }
  if (normalized === "student" || normalized === "teacher") {
    return "/dashboard/student-dashboard/overview";
  }
  return "/";
};

const UnifiedSidebar = ({ isOpen, toggleSidebar }) => {
  const { t, i18n } = useTranslation(["common", "lecturerDashboard"]);
  const isRTL = i18n.dir() === "rtl";
  const location = useLocation();
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [viewActionError, setViewActionError] = useState("");
  const [isViewModesExpanded, setIsViewModesExpanded] = useState(true);

  const [impersonationSession, setImpersonationSession] = useState(getImpersonationSession());
  const [showImpersonationModal, setShowImpersonationModal] = useState(false);
  const [selectedTargetRole, setSelectedTargetRole] = useState("");
  const [targetsLoading, setTargetsLoading] = useState(false);
  const [targetsError, setTargetsError] = useState("");
  const [targets, setTargets] = useState([]);
  const [targetSearch, setTargetSearch] = useState("");
  const [switchingTargetId, setSwitchingTargetId] = useState("");
  const [isExitingView, setIsExitingView] = useState(false);

  const effectiveRole = useMemo(
    () =>
      normalizeRole(
        impersonationSession?.isActive
          ? impersonationSession.targetRole
          : userData?.role || "guest",
      ),
    [impersonationSession?.isActive, impersonationSession?.targetRole, userData?.role],
  );

  const actorRole = normalizeRole(
    impersonationSession?.isActive
      ? impersonationSession.actorRole
      : userData?.role || "guest",
  );
  const policyRole = normalizePolicyRole(actorRole);
  const allowedTargetRoles = ALLOWED_IMPERSONATION_TARGETS[policyRole] || [];

  const getRoleLabel = useCallback(
    (role) => {
      const normalized = normalizeRole(role);
      const labels = {
        lecturer: t("lecturerView", { defaultValue: "Lecturer View" }),
        student: t("studentView", { defaultValue: "Student View" }),
        parent: t("parentView", { defaultValue: "Parent View" }),
        teacher: t("teacherView", { defaultValue: "Teacher View" }),
        assistant: t("assistantView", { defaultValue: "Assistant View" }),
      };
      return labels[normalized] || role;
    },
    [t],
  );

  const translateImpersonationError = useCallback(
    (errorMessage, fallbackKey, fallbackValue) => {
      const rawMessage = String(errorMessage || "");
      const normalizedMessage = rawMessage.toLowerCase();

      if (normalizedMessage.includes("nested impersonation")) {
        return t("impersonationNestedError", {
          defaultValue: "Exit current role view before starting another one",
        });
      }
      if (normalizedMessage.includes("cannot impersonate")) {
        return t("impersonationPermissionError", {
          defaultValue: "You are not allowed to switch to this view",
        });
      }
      if (
        normalizedMessage.includes("forbidden") ||
        normalizedMessage.includes("bidden") ||
        normalizedMessage.includes("permission")
      ) {
        return t("impersonationPermissionError", {
          defaultValue: "You are not allowed to switch to this view",
        });
      }
      if (normalizedMessage.includes("target user not found")) {
        return t("impersonationTargetNotFoundError", {
          defaultValue: "Target user was not found",
        });
      }
      if (normalizedMessage.includes("role mismatch")) {
        return t("impersonationRoleMismatchError", {
          defaultValue: "Selected user role does not match requested view",
        });
      }
      if (normalizedMessage.includes("session mismatch")) {
        return t("impersonationSessionMismatchError", {
          defaultValue: "Session mismatch. Try reloading and start again",
        });
      }
      if (normalizedMessage.includes("no active impersonation session")) {
        return t("impersonationNoActiveError", {
          defaultValue: "No active role view to exit",
        });
      }

      return rawMessage || t(fallbackKey, { defaultValue: fallbackValue });
    },
    [t],
  );

  const fetchUserData = useCallback(async () => {
    setLoading(true);
    try {
      const cachedUser = getCachedUserSummary();
      if (cachedUser?.role || cachedUser?.name || cachedUser?.id) {
        setUserData(cachedUser);
        setError(null);
      } else {
        setError(translateErrorMessage("Failed to fetch user data"));
      }
    } catch (fetchError) {
      setError(translateErrorMessage("Failed to fetch user data"));
      console.error("Error fetching user data:", fetchError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

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

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const sidebar = document.getElementById("user-sidebar");
      const toggleButton = document.getElementById("sidebar-toggle");

      if (
        sidebar &&
        !sidebar.contains(event.target) &&
        toggleButton &&
        !toggleButton.contains(event.target) &&
        isOpen &&
        isMobile
      ) {
        toggleSidebar();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobile, isOpen, toggleSidebar]);

  const closeModal = () => {
    setShowImpersonationModal(false);
    setSelectedTargetRole("");
    setTargetsError("");
    setTargetSearch("");
    setTargets([]);
  };

  const openRolePicker = async (targetRole) => {
    if (impersonationSession?.isActive) return;

    setSelectedTargetRole(targetRole);
    setShowImpersonationModal(true);
    setTargetsLoading(true);
    setTargetsError("");
    setTargets([]);
    setTargetSearch("");

    try {
      const normalizedTargetRole = normalizeRole(targetRole);
      const roleFetcher = IMPERSONATION_TARGET_FETCHERS[normalizedTargetRole];
      const result = roleFetcher ? await roleFetcher() : await getAllUsers();
      if (!result?.success) {
        setTargetsError(
          translateImpersonationError(
            result?.error,
            "impersonationUserFetchError",
            "Failed to load users",
          ),
        );
        return;
      }

      const allUsers = Array.isArray(result.data)
        ? result.data
        : Array.isArray(result.data?.data)
          ? result.data.data
          : [];

      if (roleFetcher) {
        setTargets(allUsers);
        return;
      }

      const roleFiltered = allUsers.filter(
        (user) => normalizeRole(user?.role) === normalizedTargetRole,
      );
      setTargets(roleFiltered);
    } catch (fetchError) {
      console.error("Error loading impersonation targets:", fetchError);
      setTargetsError(t("impersonationUserFetchError", { defaultValue: "Failed to load users" }));
    } finally {
      setTargetsLoading(false);
    }
  };

  const handleStartImpersonation = async (target) => {
    setViewActionError("");
    setTargetsError("");
    setSwitchingTargetId(target._id);

    try {
      const result = await startImpersonation({
        targetUserId: target._id,
        targetRole: selectedTargetRole,
      });

      if (!result.success) {
        const impersonationErrorMessage =
          result?.rawMessage ||
          result?.details?.rawMessage ||
          result?.details?.message ||
          result?.error ||
          result?.message;

        setTargetsError(
          translateImpersonationError(
            impersonationErrorMessage,
            "impersonationStartError",
            "Failed to start role view",
          ),
        );
        return;
      }

      closeModal();
      setImpersonationSession(getImpersonationSession());
      await fetchUserData();
      navigate(getDashboardPathByRole(selectedTargetRole));
    } catch (startError) {
      console.error("Error starting impersonation:", startError);
      setTargetsError(t("impersonationStartError", { defaultValue: "Failed to start role view" }));
    } finally {
      setSwitchingTargetId("");
    }
  };

  const handleExitView = async () => {
    if (!impersonationSession?.isActive) return;

    setViewActionError("");
    setIsExitingView(true);

    try {
      const result = await stopImpersonation();
      if (!result.success) {
        const impersonationErrorMessage =
          result?.rawMessage ||
          result?.details?.rawMessage ||
          result?.details?.message ||
          result?.error ||
          result?.message;

        setViewActionError(
          translateImpersonationError(
            impersonationErrorMessage,
            "impersonationStopError",
            "Failed to exit role view",
          ),
        );
        return;
      }

      const actorRoleFromResponse = normalizeRole(
        result.data?.actor?.role || impersonationSession?.actorRole,
      );
      setImpersonationSession(getImpersonationSession());
      await fetchUserData();
      navigate(getDashboardPathByRole(actorRoleFromResponse));
    } catch (stopError) {
      console.error("Error stopping impersonation:", stopError);
      setViewActionError(t("impersonationStopError", { defaultValue: "Failed to exit role view" }));
    } finally {
      setIsExitingView(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/");
    } catch (logoutError) {
      console.error("Logout error:", logoutError);
    }
  };

  const menuItems = useMemo(() => {
    const adminItems = [
      {
        id: "admin-dashboard",
        title: t("adminDashboard") || "Admin Dashboard",
        icon: <FaUserShield className="h-5 w-5" />,
        path: "/dashboard/admin-dashboard",
      },
      {
        id: "create",
        title: t("courseData") || "Course Data",
        icon: <Edit className="h-5 w-5" />,
        path: "/dashboard/admin-dashboard/create",
      },
      {
        id: "signed-lecturers",
        title: t("manageLecturers") || "Manage Lecturers",
        icon: <Lightbulb className="h-5 w-5" />,
        path: "/dashboard/admin-dashboard/signed-lecturers",
      },
      {
        id: "financial-dashboard",
        title: t("revenueDashboard") || "Revenue Dashboard",
        icon: <FaMoneyBillWave className="h-5 w-5" />,
        path: "/dashboard/admin-dashboard/financial-dashboard",
      },
      {
        id: "promo-codes-management",
        title: t("promoCodesManagement") || "Promo Codes",
        icon: <Edit className="h-5 w-5" />,
        path: "/dashboard/admin-dashboard/promo-codes-management",
      },
    ];

    const lecturerItems = [
      {
        id: "lecturer-dashboard",
        title: t("myDashboard") || "My Dashboard",
        icon: <FaUserTie className="h-5 w-5" />,
        path: "/dashboard/lecturer-dashboard",
      },
      {
        id: "lecturer-analytics",
        title: t("Analytics") || "Analytics",
        icon: <FaChartLine className="h-5 w-5" />,
        path: "/dashboard/lecturer-dashboard/analytics",
      },
      {
        id: "course-builder",
        title: t("createCourse") || "Create Course",
        icon: <Edit className="h-5 w-5" />,
        path: "/dashboard/lecturer-dashboard/CoursesForm",
      },
      {
        id: "lectures",
        title: t("courses") || "My Courses",
        icon: <FaGraduationCap className="h-5 w-5" />,
        path: "/dashboard/lecturer-dashboard/courses-page",
      },
      {
        id: "my-lectures",
        title: t("MyLectures") || "My Lectures",
        icon: <FaGraduationCap className="h-5 w-5" />,
        path: "/dashboard/lecturer-dashboard/lectures-page",
      },
      {
        id: "reviews-management",
        title: t("lecturerDashboard:reviewsManagement") || "Reviews",
        icon: <FaComment className="h-5 w-5" />,
        path: "/dashboard/lecturer-dashboard/reviews",
      },
    ];

    const assistantItems = [
      {
        id: "assistant-dashboard",
        title: t("myDashboard") || "My Dashboard",
        icon: <FaUserAlt className="h-5 w-5" />,
        path: "/dashboard/assistant-page",
      },
    ];

    const studentItems = [
      {
        id: "student-dashboard",
        title: t("myDashboard") || "My Dashboard",
        icon: <FaUserGraduate className="h-5 w-5" />,
        path: "/dashboard/student-dashboard/overview",
      },
      {
        id: "courses",
        title: t("courses") || "Courses",
        icon: <FaGraduationCap className="h-5 w-5" />,
        path: "/dashboard/student-dashboard/courses-page",
      },
      {
        id: "student-lectures",
        title: t("MyLectures") || "My Lectures",
        icon: <FaGraduationCap className="h-5 w-5" />,
        path: "/dashboard/student-dashboard/lectures-page",
      },
    ];

    const parentItems = [
      {
        id: "parent-dashboard",
        title: t("myDashboard") || "My Dashboard",
        icon: <FaUserGraduate className="h-5 w-5" />,
        path: "/dashboard/parent-dashboard/overview",
      },
      {
        id: "parent-courses",
        title: t("courses") || "Courses",
        icon: <FaGraduationCap className="h-5 w-5" />,
        path: "/dashboard/student-dashboard/courses-page",
      },
      {
        id: "parent-lectures",
        title: t("MyLectures") || "My Lectures",
        icon: <FaGraduationCap className="h-5 w-5" />,
        path: "/dashboard/student-dashboard/lectures-page",
      },
    ];

    const commonItems = [
      {
        id: "settings",
        title: t("settings") || "Settings",
        icon: <FaCog className="h-5 w-5" />,
        path: "/dashboard/settings",
        divider: true,
      },
      {
        id: "logout",
        title: t("logout") || "Logout",
        icon: <FaSignOutAlt className="h-5 w-5" />,
        path: "/",
        onClick: handleLogout,
      },
    ];

    if (effectiveRole === "admin" || effectiveRole === "subadmin") {
      return [...adminItems, ...commonItems];
    }
    if (effectiveRole === "lecturer") {
      return [...lecturerItems, ...commonItems];
    }
    if (effectiveRole === "assistant") {
      return [...assistantItems, ...commonItems];
    }
    if (effectiveRole === "student") {
      return [...studentItems, ...commonItems];
    }
    if (effectiveRole === "parent") {
      return [...parentItems, ...commonItems];
    }

    return commonItems;
  }, [effectiveRole, handleLogout, t]);

  const filteredTargets = useMemo(() => {
    const query = targetSearch.trim().toLowerCase();
    if (!query) return targets;
    return targets.filter((target) => {
      const fields = [target?.name, target?.email, target?.phoneNumber]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());
      return fields.some((value) => value.includes(query));
    });
  }, [targetSearch, targets]);

  return (
    <>
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[2px] md:hidden"
          style={{ top: `${NAVBAR_HEIGHT}px` }}
          onClick={toggleSidebar}
        />
      )}

      <div
        id="user-sidebar"
        className={`fixed z-40 flex w-[17.5rem] flex-col overflow-hidden rounded-[1.75rem] border-transparent text-slate-900 shadow-[0_24px_55px_rgba(14,33,38,0.20)] backdrop-blur-xl transition-all duration-300 ease-out ${isOpen
          ? "scale-100 translate-x-0 opacity-100"
          : isRTL
            ? "translate-x-[120%] scale-[0.98] opacity-0"
            : "-translate-x-[120%] scale-[0.98] opacity-0"
          }`}
        style={{
          top: `${NAVBAR_HEIGHT + 14}px`,
          bottom: "14px",
          [isRTL ? "right" : "left"]: "16px",
          background:
            "linear-gradient(168deg, rgba(255,255,255,0.94) 0%, rgba(241,243,246,0.93) 48%, rgba(188,231,236,0.72) 100%)",
        }}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-16 left-8 h-32 w-32 rounded-full bg-primary/15 blur-2xl" />
          <div className="absolute -right-8 bottom-10 h-28 w-28 rounded-full bg-info/25 blur-2xl" />
        </div>

        <div className="relative flex items-center justify-between border-b border-gray-300/70 p-4">
          <div className={`mx-auto flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
            <span className="font-extrabold tracking-tight text-primary">
              {t("dashboardTitle") || "Dashboard"}
            </span>
            <div className="rounded-full bg-[#0E5563] p-2 text-white shadow-md shadow-[rgba(14,85,99,0.25)]">
              <FaUser className="h-2 w-2" />
            </div>
          </div>
        </div>

        {userData && (
          <div className="relative mx-3 mt-3 rounded-2xl border-transparent bg-white/65 px-3 py-3 shadow-sm">
             <div className="flex items-center gap-3">
               <div className="h-11 w-11 rounded-full overflow-hidden border-2 border-white shadow-sm">
                 <img
                   src={resolveProfileImageUrl(userData?.profilePic)}
                   alt={userData?.name || "User Avatar"}
                   className="object-cover w-full h-full"
                   onError={(event) => {
                     event.currentTarget.src = "/person.png";
                   }}
                 />
               </div>
               <div className="min-w-0">
                 <p className="truncate text-sm font-semibold leading-5">{userData.name}</p>
                <p className="truncate text-xs text-slate-600">{userData.role}</p>
                 {impersonationSession?.isActive && (
                   <p className="mt-1 truncate text-[11px] font-semibold text-primary">
                     {t("viewingAs", {
                       defaultValue: "Viewing as: {{role}}",
                       role: impersonationSession.targetRole,
                     })}
                   </p>
                 )}
               </div>
             </div>
          </div>
        )}

        {loading && (
         <div className="flex h-32 items-center justify-center">
           <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
         </div>
        )}

        {error && !loading && (
          <div className="p-4 text-sm text-error">
            <p>{error}</p>
                <Button 
                  variant="error" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => window.location.reload()}
                >
                {t("retry", { defaultValue: "Retry" })}
                  </Button>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="relative mt-3 flex-1 overflow-y-auto px-2 pb-4">
              {viewActionError && (
                <div className="mb-2 rounded-xl border border-error/30 bg-error/10 px-3 py-2 text-xs font-semibold text-error">
                  {viewActionError}
                </div>
              )}

              {allowedTargetRoles.length > 0 && !impersonationSession?.isActive && (
                <div className="mb-3 rounded-xl border border-primary/20 bg-white/70 p-3">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 rounded-lg text-left text-primary transition-colors hover:text-[#0E5563]"
                    onClick={() => setIsViewModesExpanded((current) => !current)}
                    aria-expanded={isViewModesExpanded}
                    aria-label={t("toggleViewModes", { defaultValue: "Toggle view modes" })}
                  >
                    <span className="text-xs font-bold tracking-wide">
                      {t("viewModes", { defaultValue: "View Modes" })}
                    </span>
                    <span className="flex items-center gap-2 text-[11px] font-semibold">
                      {isViewModesExpanded
                        ? t("collapse", { defaultValue: "Collapse" })
                        : t("expand", { defaultValue: "Expand" })}
                      <span
                        className={`transition-transform duration-200 ${
                          isViewModesExpanded ? "rotate-90" : "rotate-0"
                        }`}
                      >
                        {isRTL ? (
                          <FaChevronLeft className="h-3 w-3" />
                        ) : (
                          <FaChevronRight className="h-3 w-3" />
                        )}
                      </span>
                    </span>
                  </button>
                  {isViewModesExpanded && (
                    <div className="mt-2 space-y-2">
                      {allowedTargetRoles.map((role) => (
                        <Button
                          key={role}
                          type="button"
                          variant="outline"
                          className="w-full justify-start rounded-xl border-primary/25 bg-white text-[#0E5563] hover:bg-[#0E5563] hover:text-white"
                          onClick={() => openRolePicker(role)}
                        >
                          <FaEye className="mr-2 h-4 w-4" />
                          {getRoleLabel(role)}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;

                return (
                <React.Fragment key={item.id}>
                  <Link
                    to={item.path}
                    className={`group mb-1 flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
                      isActive
                        ? "shadow-[0_10px_25px_rgba(14,85,99,0.22)]"
                        : "text-gray-800 hover:bg-white/70 hover:text-[#0E5563]"
                    }`}
                    style={
                      isActive
                        ? {
                            background: "linear-gradient(140deg, #0E5563 0%, #146A78 100%)",
                            color: "#FFFFFF",
                          }
                        : undefined
                    }
                    onClick={(event) => {
                      if (item.onClick) {
                        event.preventDefault();
                        item.onClick();
                      }
                      if (isMobile) {
                        toggleSidebar();
                      }
                    }}
                  >
                    <div
                      className={`grid h-8 w-8 place-items-center rounded-lg transition-colors ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-[#0E5563]/10 text-[#0E5563] group-hover:bg-[#0E5563]/15"
                      } ${isRTL ? "ml-1" : "mr-1"}`}
                    >
                      {item.icon}
                    </div>
                    <span className="mx-auto font-semibold tracking-tight">
                      {item.title}
                    </span>
                  </Link>
                  {item.divider && <div className="my-2 border-t border-gray-300/70" />}
                </React.Fragment>
                );
              })}
            </div>

            {impersonationSession?.isActive && (
              <div className="relative border-t border-gray-300/70 p-3">
                 <Button
                   type="button"
                   className="w-full rounded-xl border-0 text-white"
                   style={{ 
                     background: "linear-gradient(140deg, #0E5563 0%, #146A78 100%)",
                     color: "#FFFFFF"
                   }}
                   onClick={handleExitView}
                   disabled={isExitingView}
                 >
                   {isExitingView ? (
                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                   ) : (
                     <FaTimes className="h-4 w-4 mr-2" />
                   )}
                   {t("exitView", { defaultValue: "Exit View" })}
                  </Button>
              </div>
            )}
          </>
        )}
      </div>

      <button
        id="sidebar-toggle"
        onClick={toggleSidebar}
        className={`fixed z-50 -translate-y-1/2 rounded-2xl border border-white/60 bg-[linear-gradient(140deg,#0E5563_0%,#146A78_100%)] p-2 text-white shadow-[0_12px_28px_rgba(14,85,99,0.35)] transition-all duration-300 hover:scale-105 ${isRTL ? "right-1" : "left-1"
          } ${isOpen && isRTL
            ? "-translate-x-[18.5rem]"
            : isOpen && !isRTL
              ? "translate-x-[18.5rem]"
              : ""
          }`}
        style={{
          top: `calc(${NAVBAR_HEIGHT}px + 42%)`,
        }}
      >
        {isRTL ? (
          isOpen ? (
            <FaChevronRight />
          ) : (
            <FaChevronLeft />
          )
        ) : isOpen ? (
          <FaChevronLeft />
        ) : (
          <FaChevronRight />
         )}
                </button>

      {showImpersonationModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div
            className={`w-full max-w-2xl rounded-2xl border-transparent bg-white p-4 shadow-2xl ${isRTL ? "text-right" : "text-left"
              }`}
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-primary">
                  {t("chooseUser", { defaultValue: "Choose User" })}
                </h3>
                <p className="text-sm fekra-text-slate">
                  {getRoleLabel(selectedTargetRole)}
                </p>
              </div>
               <Button variant="ghost" size="sm" onClick={closeModal}>
                  <FaTimes className="h-4 w-4" />
                </Button>
            </div>

             <Input
               type="text"
               value={targetSearch}
               onChange={(event) => setTargetSearch(event.target.value)}
               placeholder={t("searchUsers", { defaultValue: "Search by name, email, or phone" })}
               className="w-full"
             />

            {targetsError && (
              <div className="mt-3 rounded-xl border border-error/30 bg-error/10 px-3 py-2 text-sm font-semibold text-error">
                {targetsError}
              </div>
            )}

            <div className="mt-4 max-h-[320px] overflow-y-auto rounded-xl border border-gray-300">
             {targetsLoading ? (
               <div className="flex items-center justify-center p-6">
                 <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
               </div>
             ) : filteredTargets.length === 0 ? (
              <div className="p-6 text-center text-sm font-semibold text-slate-600">
                 {t("noMatchingUsers", { defaultValue: "No matching users found" })}
               </div>
             ) : (
               filteredTargets.map((target) => (
                 <button
                   key={target._id}
                   type="button"
                   className="flex w-full items-center justify-between border-b border-gray-300/70 px-4 py-3 text-sm hover:bg-gray-100/40 last:border-b-0"
                   onClick={() => handleStartImpersonation(target)}
                   disabled={switchingTargetId === target._id}
                 >
                   <div className="min-w-0">
                     <p className="truncate font-bold">{target.name || t("unknownUser", { defaultValue: "Unknown User" })}</p>
                    <p className="truncate text-xs text-slate-600">{target.email || target.phoneNumber || "-"}</p>
                   </div>
                   {switchingTargetId === target._id ? (
                     <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                   ) : (
                     <span className="px-2 py-1 text-xs font-medium border border-slate-300 rounded-full">{t("switchView", { defaultValue: "Switch" })}</span>
                   )}
                </button>
               ))
             )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UnifiedSidebar;
