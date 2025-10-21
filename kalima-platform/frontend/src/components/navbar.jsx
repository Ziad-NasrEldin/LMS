import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import LanguageSwitcher from "./LanguageSwitcher";
import NotificationCenter from "./NotificationCenter";
import {
  isLoggedIn,
  getUserDashboard,
  logoutUser,
} from "../routes/auth-services";
import { FaCartPlus, FaHome, FaBook, FaChalkboardTeacher, FaBox, FaVideo } from "react-icons/fa";
import { Layout } from "lucide-react";

const NavBar = () => {
  const { t, i18n } = useTranslation("common");
  const [menuOpen, setMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const isAr = i18n.language === "ar";
  const navbarRef = useRef(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const fetchUserRole = async () => {
    if (isLoggedIn()) {
      try {
        const result = await getUserDashboard();
        if (result.success) {
          setUserRole(result.data.data.userInfo.role);
          setUserId(result.data.data.userInfo.id);
        } else {
          setUserRole(null);
          setUserId(null);
        }
      } catch (err) {
        setUserRole(null);
        setUserId(null);
        console.error(err);
      }
    } else {
      setUserRole(null);
      setUserId(null);
    }
  };

  useEffect(() => {
    fetchUserRole();

    const handleStorageChange = () => {
      fetchUserRole();
    };

    const handleCustomAuthChange = () => {
      fetchUserRole();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("user-auth-changed", handleCustomAuthChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("user-auth-changed", handleCustomAuthChange);
    };
  }, []);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuOpen &&
        !navbarRef.current?.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [menuOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "auto";
  }, [menuOpen]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      setUserRole(null);
      setUserId(null);
      setMenuOpen(false);
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const getDashboardPath = (role) => {
    switch (role) {
      case "Student":
      case "Parent" :
      case "Teacher" :
        return "/dashboard/student-dashboard/promo-codes";
      case "Lecturer":
        return "/dashboard/lecturer-dashboard";
      case "Admin":
      case "Moderator":
      case "Subadmin":
        return "/dashboard/admin-dashboard";
      case "Assistant":
        return "/dashboard/assistant-dashboard";
      default:
        return "/";
    }
  };

  const navItems = [
    { key: "homepage", path: "/", icon: FaHome },
    { key: "educationalCourses", path: "/courses", icon: FaBook },
    { key: "teachers", path: "/teachers", icon: FaChalkboardTeacher },
    { key: "lectures", path: "/lectures", icon: FaVideo },
    { key: "market", path: "/market", icon: FaCartPlus },
  ];

  const authItems = [
    { key: "signup", path: "/register" },
    { key: "signin", path: "/login" },
  ];

  return (
    <div
      className="navbar top-0 left-0 right-0 z-50 bg-base-100 shadow-xl px-4 py-1 sticky"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div ref={navbarRef} className="flex-1 flex justify-between items-center">
        {/* Left side - Logo and navigation items */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <div></div>
          <button
            className="btn btn-ghost lg:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h7"
              />
            </svg>
          </button>

          {/* Logo */}
          <Link to="/" className="btn btn-ghost px-2 rounded-2xl">
            <img
              src="/Kalima.png"
              alt="Logo"
              className="w-10 h-10 rounded-full"
            />
            <span className="text-xl font-bold text-primary ml-2">
              {t("logoText")}
            </span>
          </Link>

          {/* Desktop Navigation Items */}
          <div className="hidden lg:flex xl:gap-4 ml-4 rounded-2xl">
            {navItems.map((item) => (
              <Link
                key={item.key}
                to={item.path}
                icon={item.icon}
                className={`btn btn-ghost font-medium rounded-2xl transition-colors ${item.key === "market" ? "bg-primary/70" : ""}`}
              >
                {t(item.key)}
                {item.icon && <item.icon className="inline-block ml-1" />}
              </Link>
            ))}
            {userRole && (
              <Link
                to={getDashboardPath(userRole)}
                className="btn btn-ghost rounded-2xl"
              >
                {t("dashboard")}
                <Layout className="inline-block mr-1" />
              </Link>
            )}
            <LanguageSwitcher />
          </div>
        </div>

        {/* Auth buttons - Desktop */}
        <div className="flex-none hidden lg:flex items-center gap-2 ml-4">
          {userId && <NotificationCenter userId={userId} />}
          {userRole ? (
            <button
              onClick={handleLogout}
              className="btn btn-outline rounded-2xl"
            >
              {t("logout")}
            </button>
          ) : (
            authItems.map((item) => (
              <Link
                key={item.key}
                to={item.path}
                className={`btn ${
                  item.key === "signup" ? "btn-primary" : "btn-outline"
                } rounded-2xl`}
              >
                {t(item.key)}
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Mobile menu - Drawer style */}
      {menuOpen && (
        <>
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setMenuOpen(false)}
          ></div>

          {/* Drawer */}
          <div
            ref={menuRef}
            className={`lg:hidden w-1/2 sm:w-1/3 fixed ${
              isAr ? "right-0" : "left-0"
            } top-0 h-full bg-base-100 z-50 overflow-y-auto transition-transform duration-300 ease-in-out`}
            dir={isAr ? "rtl" : "ltr"}
          >
            <div className="p-4 space-y-4 h-full">
              {/* Mobile menu header */}
              <div className="flex items-center justify-around mb-6">
                <Link
                  to="/"
                  className="flex items-center gap-2"
                  onClick={() => setMenuOpen(false)}
                >
                  <img
                    src="/Kalima.png"
                    alt="Logo"
                    className="w-10 h-10 rounded-full"
                  />
                  <span className="text-xl font-bold text-primary">
                    {t("logoText")}
                  </span>
                </Link>
                <button
                  className="btn btn-ghost btn-sm btn-circle"
                  onClick={() => setMenuOpen(false)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Mobile menu items */}
              <ul className="menu menu-lg p-0 [&_li>*]:rounded-lg">
                {navItems.map((item) => (
                  <li key={item.key}>
                    <Link to={item.path} onClick={() => setMenuOpen(false)}>
                      {t(item.key)}
                    </Link>
                  </li>
                ))}

                {userRole && (
                  <li>
                    <Link
                      to={getDashboardPath(userRole)}
                      onClick={() => setMenuOpen(false)}
                    >
                      {t("dashboard")}
                    </Link>
                  </li>
                )}
              </ul>

              <div className="divider"></div>

              <div className="flex flex-col gap-2">
                <div className="mb-4">
                  <LanguageSwitcher />
                </div>

                {userId && (
                  <div className="flex py-2">
                    <NotificationCenter userId={userId} />
                    <span className="ml-2">{t("notifications")}</span>
                  </div>
                )}

                {userRole ? (
                  <button
                    onClick={handleLogout}
                    className="btn btn-outline w-full justify-start"
                  >
                    {t("logout")}
                  </button>
                ) : (
                  authItems.map((item) => (
                    <Link
                      key={item.key}
                      to={item.path}
                      className={`btn ${
                        item.key === "signup" ? "btn-primary" : "btn-outline"
                      } w-full justify-start`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {t(item.key)}
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NavBar;
