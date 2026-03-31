import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
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
} from "react-icons/fa";
import { Edit, Lightbulb } from "lucide-react";
import { getAllUsers } from "../routes/fetch-users";
import {
  getImpersonationSession,
  getUserDashboard,
  logoutUser,
  startImpersonation,
  stopImpersonation,
} from "../routes/auth-services";
import { resolveProfileImageUrl } from "../utils/profileImage";

const NAVBAR_HEIGHT = 92;

const normalizeRole = (role) => String(role || "").trim().toLowerCase();

const normalizePolicyRole = (role) => {
  const normalized = normalizeRole(role);
  if (normalized === "subadmin") return "admin";
  return normalized;
};

const ALLOWED_IMPERSONATION_TARGETS = {
  admin: ["lecturer", "student", "parent"],
  lecturer: ["student", "parent"],
  assistant: ["student"],
};

const getDashboardPathByRole = (role) => {
  const normalized = normalizeRole(role);
  if (normalized === "admin" || normalized === "subadmin") return "/dashboard/admin-dashboard";
  if (normalized === "lecturer") return "/dashboard/lecturer-dashboard";
  if (normalized === "assistant") return "/dashboard/assistant-page";
  if (normalized === "student" || normalized === "parent" || normalized === "teacher") {
    return "/dashboard/student-dashboard/promo-codes";
  }
  return "/";
};

const UnifiedSidebar = ({ isOpen, toggleSidebar }) => {
  const { t, i18n } = useTranslation("common");
  const isRTL = i18n.dir() === "rtl";
  const location = useLocation();
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [viewActionError, setViewActionError] = useState("");

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
      const result = await getUserDashboard();
      if (result.success) {
        setUserData(result.data.data.userInfo);
        setError(null);
      } else {
        setError(result.error || "Failed to fetch user data");
      }
    } catch (fetchError) {
      setError("Failed to fetch user data");
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
      const result = await getAllUsers();
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

      const normalizedTargetRole = normalizeRole(targetRole);
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
        setTargetsError(
          translateImpersonationError(
            result.error,
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
        setViewActionError(
          translateImpersonationError(
            result.error,
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
        path: "/dashboard/student-dashboard/promo-codes",
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
        path: "/dashboard/student-dashboard/promo-codes",
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
        className={`fixed z-40 flex w-[17.5rem] flex-col overflow-hidden rounded-[1.75rem] border border-white/50 text-base-content shadow-[0_24px_55px_rgba(14,33,38,0.20)] backdrop-blur-xl transition-all duration-300 ease-out ${isOpen
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

        <div className="relative flex items-center justify-between border-b border-base-300/70 p-4">
          <div className={`mx-auto flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
            <span className="font-extrabold tracking-tight text-primary">
              {t("dashboardTitle") || "Dashboard"}
            </span>
            <div className="rounded-full bg-primary p-2 text-primary-content shadow-md shadow-primary/25">
              <FaUser className="h-2 w-2" />
            </div>
          </div>
        </div>

        {userData && (
          <div className="relative mx-3 mt-3 rounded-2xl border border-white/70 bg-white/65 px-3 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="avatar">
                <div className="h-11 w-11 rounded-full ring ring-primary/70 ring-offset-2 ring-offset-base-100">
                  <img
                    src={resolveProfileImageUrl(userData?.profilePic)}
                    alt={userData?.name || "User Avatar"}
                    className="object-cover"
                    onError={(event) => {
                      event.currentTarget.src = "/person.png";
                    }}
                  />
                </div>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-5">{userData.name}</p>
                <p className="truncate text-xs text-base-content/70">{userData.role}</p>
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
            <div className="loading loading-spinner loading-md text-primary" />
          </div>
        )}

        {error && !loading && (
          <div className="p-4 text-sm text-error">
            <p>{error}</p>
            <button
              className="btn btn-sm btn-outline btn-error mt-2"
              onClick={() => window.location.reload()}
            >
              {t("retry", { defaultValue: "Retry" })}
            </button>
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
                  <p className="mb-2 text-xs font-bold tracking-wide text-primary">
                    {t("viewModes", { defaultValue: "View Modes" })}
                  </p>
                  <div className="space-y-2">
                    {allowedTargetRoles.map((role) => (
                      <button
                        key={role}
                        type="button"
                        className="btn btn-sm w-full justify-start rounded-xl border-primary/25 bg-white text-primary hover:bg-primary hover:text-primary-content"
                        onClick={() => openRolePicker(role)}
                      >
                        <FaEye className="h-4 w-4" />
                        {getRoleLabel(role)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {menuItems.map((item) => (
                <React.Fragment key={item.id}>
                  <Link
                    to={item.path}
                    className={`group mb-1 flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${location.pathname === item.path
                      ? "bg-primary text-primary-content shadow-[0_10px_25px_rgba(14,85,99,0.22)]"
                      : "text-base-content hover:bg-white/70 hover:text-primary"
                      }`}
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
                      className={`grid h-8 w-8 place-items-center rounded-lg transition-colors ${location.pathname === item.path
                        ? "bg-primary-content/15 text-primary-content"
                        : "bg-primary/10 text-primary group-hover:bg-primary/15"
                        } ${isRTL ? "ml-1" : "mr-1"}`}
                    >
                      {item.icon}
                    </div>
                    <span className="mx-auto font-semibold tracking-tight">
                      {item.title}
                    </span>
                  </Link>
                  {item.divider && <div className="my-2 border-t border-base-300/70" />}
                </React.Fragment>
              ))}
            </div>

            {impersonationSession?.isActive && (
              <div className="relative border-t border-base-300/70 p-3">
                <button
                  type="button"
                  className="btn w-full rounded-xl border-0 bg-[linear-gradient(140deg,#0E5563_0%,#146A78_100%)] text-primary-content"
                  onClick={handleExitView}
                  disabled={isExitingView}
                >
                  {isExitingView ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <FaTimes className="h-4 w-4" />
                  )}
                  {t("exitView", { defaultValue: "Exit View" })}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <button
        id="sidebar-toggle"
        onClick={toggleSidebar}
        className={`fixed z-50 -translate-y-1/2 rounded-2xl border border-white/60 bg-[linear-gradient(140deg,#0E5563_0%,#146A78_100%)] p-2 text-primary-content shadow-[0_12px_28px_rgba(14,85,99,0.35)] transition-all duration-300 hover:scale-105 ${isRTL ? "right-1" : "left-1"
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
            className={`w-full max-w-2xl rounded-2xl border border-white/70 bg-base-100 p-4 shadow-2xl ${isRTL ? "text-right" : "text-left"
              }`}
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-primary">
                  {t("chooseUser", { defaultValue: "Choose User" })}
                </h3>
                <p className="text-sm text-base-content/70">
                  {getRoleLabel(selectedTargetRole)}
                </p>
              </div>
              <button type="button" className="btn btn-sm btn-ghost" onClick={closeModal}>
                <FaTimes className="h-4 w-4" />
              </button>
            </div>

            <input
              type="text"
              value={targetSearch}
              onChange={(event) => setTargetSearch(event.target.value)}
              placeholder={t("searchUsers", { defaultValue: "Search by name, email, or phone" })}
              className="input input-bordered w-full"
            />

            {targetsError && (
              <div className="mt-3 rounded-xl border border-error/30 bg-error/10 px-3 py-2 text-sm font-semibold text-error">
                {targetsError}
              </div>
            )}

            <div className="mt-4 max-h-[320px] overflow-y-auto rounded-xl border border-base-300">
              {targetsLoading ? (
                <div className="flex items-center justify-center p-6">
                  <span className="loading loading-spinner loading-md text-primary"></span>
                </div>
              ) : filteredTargets.length === 0 ? (
                <div className="p-6 text-center text-sm font-semibold text-base-content/70">
                  {t("noMatchingUsers", { defaultValue: "No matching users found" })}
                </div>
              ) : (
                filteredTargets.map((target) => (
                  <button
                    key={target._id}
                    type="button"
                    className="flex w-full items-center justify-between border-b border-base-300/70 px-4 py-3 text-sm hover:bg-base-200/40 last:border-b-0"
                    onClick={() => handleStartImpersonation(target)}
                    disabled={switchingTargetId === target._id}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-bold">{target.name || t("unknownUser", { defaultValue: "Unknown User" })}</p>
                      <p className="truncate text-xs text-base-content/70">{target.email || target.phoneNumber || "-"}</p>
                    </div>
                    {switchingTargetId === target._id ? (
                      <span className="loading loading-spinner loading-sm text-primary"></span>
                    ) : (
                      <span className="badge badge-outline">{t("switchView", { defaultValue: "Switch" })}</span>
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
