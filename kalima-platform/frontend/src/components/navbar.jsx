import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import LanguageSwitcher from "./LanguageSwitcher";
import {
  isLoggedIn,
  getUserDashboard,
  logoutUser,
} from "../routes/auth-services";
import { Layout, Menu, X } from "lucide-react";

const NavBar = () => {
  const { t, i18n } = useTranslation("common");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHiddenOnScroll, setIsHiddenOnScroll] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const isAr = i18n.dir() === "rtl";
  const navbarRef = useRef(null);
  const menuRef = useRef(null);
  const lastScrollYRef = useRef(0);
  const navigate = useNavigate();
  const fetchUserRole = async () => {
    const isAuth = await isLoggedIn();
    if (isAuth) {
      try {
        const result = await getUserDashboard();
        if (result.success) {
          const userInfo = result?.data?.data?.userInfo || result?.data?.userInfo;
          setUserRole(userInfo?.role || null);
        } else {
          setUserRole(null);
        }
      } catch (err) {
        setUserRole(null);
        console.error(err);
      }
    } else {
      setUserRole(null);
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

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      const previousY = lastScrollYRef.current;
      const delta = currentY - previousY;

      setIsScrolled(currentY > 14);

      // Keep navbar visible near top and while menu is open.
      if (currentY < 24 || menuOpen) {
        setIsHiddenOnScroll(false);
      } else if (delta > 8) {
        // Hide when user scrolls down with intent.
        setIsHiddenOnScroll(true);
      } else if (delta < -8) {
        // Show when user scrolls up with intent.
        setIsHiddenOnScroll(false);
      }

      lastScrollYRef.current = currentY;
    };

    lastScrollYRef.current = window.scrollY;
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      setUserRole(null);
      setMenuOpen(false);
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const getDashboardPath = (role) => {
    switch (role) {
      case "Student":
      case "Teacher" :
        return "/dashboard/student-dashboard/overview";
      case "Parent":
        return "/dashboard/parent-dashboard/overview";
      case "Lecturer":
        return "/dashboard/lecturer-dashboard";
      case "Admin":
      case "Moderator":
      case "Subadmin":
        return "/dashboard/admin-dashboard";
      case "Assistant":
        return "/dashboard/assistant-page";
      default:
        return "/";
    }
  };

  const navItems = [
    { key: "homepage", path: "/" },
    { key: "educationalCourses", path: "/courses" },
    { key: "teachers", path: "/teachers" },
    
  ];

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 px-3 pt-4 sm:px-6 transition-transform duration-400 ease-out will-change-transform ${
          isHiddenOnScroll ? "-translate-y-[120%]" : "translate-y-0"
        }`}
        dir={isAr ? "rtl" : "ltr"}
      >
        <div
          ref={navbarRef}
          className={`mx-auto flex max-w-[1220px] items-center justify-between gap-3 rounded-[999px] border px-3 py-2 backdrop-blur-xl transition-all duration-300 ${
            isScrolled
              ? "border-[#CFC8B7] bg-[#E7E2D6]/90 shadow-[0_16px_38px_rgba(0,0,0,0.14)]"
              : "border-[#D6D0C4] bg-[#EFEAE0]/82 shadow-[0_10px_24px_rgba(0,0,0,0.10)]"
          }`}
        >
          <div className="flex items-center gap-2 lg:min-w-[220px]">
            <button
              className="btn btn-ghost btn-circle lg:hidden"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <div className="hidden lg:flex items-center gap-2">
              <LanguageSwitcher />
              {userRole ? (
                <>
                  <Link to={getDashboardPath(userRole)} className="btn btn-sm border-none bg-[#CFE8ED] text-[#0F4F5B] hover:bg-[#BFDFE6] rounded-full">
                    {t("dashboard")}
                    <Layout className="h-4 w-4" />
                  </Link>
                  <button onClick={handleLogout} className="btn btn-sm btn-ghost rounded-full text-[#2F2F2F] hover:bg-white/70">
                    {t("logout")}
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="btn btn-sm rounded-full bg-white/70 text-[#2F2F2F] hover:bg-white"
                  >
                    {t("login")}
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-sm rounded-full border-none bg-[linear-gradient(135deg,#E4C65F,#D4AD3F)] px-5 text-[#232323] hover:brightness-95"
                  >
                    {t("startNow", { defaultValue: isAr ? "ابدأ الآن" : "Start Now" })}
                  </Link>
                </div>
              )}
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-[#2E3138]">
            {navItems.map((item) => (
              <Link
                key={item.key}
                to={item.path}
                className="rounded-full px-2 py-1 transition-all hover:bg-white/45 hover:text-[#0E5563]"
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-end lg:min-w-[220px]">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#BFE8EE,#A6DDE7)] px-4 py-2 text-sm font-bold text-[#0E5563] shadow-[0_6px_14px_rgba(14,85,99,0.15)]"
            >
              {t("logoText")}
              <img
                src="/Fekra.png"
                alt="Fekra Logo"
                className="h-4 w-4 shrink-0 scale-[2] object-contain"
              />
            </Link>
          </div>
        </div>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]" onClick={() => setMenuOpen(false)}></div>
            <div
              ref={menuRef}
              className={`fixed top-20 z-50 w-[min(88vw,360px)] rounded-3xl border border-[#D9D2C5] bg-[#F2EEE6]/98 p-5 shadow-[0_24px_48px_rgba(0,0,0,0.2)] ${isAr ? "right-3" : "left-3"}`}
              dir={isAr ? "rtl" : "ltr"}
            >
              <div className="mb-6 flex items-center justify-between">
                <Link to="/" className="text-lg font-bold text-[#1D376A]" onClick={() => setMenuOpen(false)}>
                  {t("logoText")}
                </Link>
                <button className="btn btn-ghost btn-circle" onClick={() => setMenuOpen(false)} aria-label="Close menu">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.key}
                    to={item.path}
                    className="btn btn-ghost w-full justify-start rounded-xl text-base"
                    onClick={() => setMenuOpen(false)}
                  >
                    {t(item.key)}
                  </Link>
                ))}
              </div>

              <div className="my-5">
                <LanguageSwitcher />
              </div>

              {userRole ? (
                <div className="space-y-2">
                  <Link
                    to={getDashboardPath(userRole)}
                    className="btn btn-outline w-full justify-start rounded-xl"
                    onClick={() => setMenuOpen(false)}
                  >
                    {t("dashboard")}
                  </Link>
                  <button onClick={handleLogout} className="btn btn-outline w-full justify-start rounded-xl">
                    {t("logout")}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    to="/login"
                    className="btn btn-outline w-full rounded-xl"
                    onClick={() => setMenuOpen(false)}
                  >
                    {t("login")}
                  </Link>
                  <Link
                    to="/register"
                    className="btn w-full rounded-xl border-none bg-[linear-gradient(135deg,#E4C65F,#D4AD3F)] text-[#232323] hover:brightness-95"
                    onClick={() => setMenuOpen(false)}
                  >
                    {t("startNow", { defaultValue: isAr ? "ابدأ الآن" : "Start Now" })}
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </header>

      <div className="h-[92px]" aria-hidden="true" />
    </>
  );
};

export default NavBar;
