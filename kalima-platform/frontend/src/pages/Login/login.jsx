import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { loginUser, getUserDashboard } from "../../routes/auth-services";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, Phone, Sparkles, UserCircle } from "lucide-react";
import { getAccessToken } from "../../utils/useLocalStroage";
import { designTokens } from "../../constants/designTokens";

const TOKENS = designTokens.colors;
const SHADOWS = designTokens.shadows;
const GRADIENTS = designTokens.gradients;

const TeacherLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation("login");
  const isRTL = i18n.dir() === "rtl";
  const tr = (key, arFallback, enFallback) => {
    const translated = t(key);
    if (translated && translated !== key) return translated;
    return isRTL ? arFallback : enFallback;
  };
  const [activeTab, setActiveTab] = useState("email_tab");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    phoneNumber: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const accessToken = getAccessToken();

  useEffect(() => {
    const checkAuthStatus = async () => {
      if (accessToken) {
        try {
          const dashboardResult = await getUserDashboard();

          if (dashboardResult.success) {
            const userRole = dashboardResult.data.data.userInfo.role;

            if (userRole === "Admin" || userRole === "SubAdmin") {
              navigate("/dashboard/admin-dashboard");
            } else if (userRole === "Lecturer") {
              navigate("/dashboard/lecturer-dashboard");
            } else if (userRole === "Student" || userRole === "Teacher") {
              navigate("/dashboard/student-dashboard/overview");
            } else if (userRole === "Parent") {
              navigate("/dashboard/parent-dashboard/overview");
            } else if (userRole === "Assistant") {
              navigate("/dashboard/assistant-page");
            }
          }
        } catch (authError) {
          console.error("Error checking auth status:", authError);
          navigate("/login");
        }
      }
    };

    checkAuthStatus();
  }, [accessToken, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const credentials = {
        password: formData.password,
      };

      if (activeTab === "email_tab") {
        credentials.email = formData.email;
      } else {
        credentials.phoneNumber = formData.phoneNumber;
      }

      const loginResult = await loginUser(credentials);

      if (!loginResult.success) {
        setError(t("errors.invalidCredentials"));
        return;
      }

      const dashboardResult = await getUserDashboard();

      if (!dashboardResult.success) {
        setError(t("errors.fetchUserDataError"));
        return;
      }

      window.dispatchEvent(new Event("user-auth-changed"));
      const userRole = dashboardResult.data.data.userInfo.role;

      if (userRole === "Admin" || userRole === "SubAdmin") {
        navigate("/dashboard/admin-dashboard");
      } else if (userRole === "Lecturer") {
        navigate("/dashboard/lecturer-dashboard");
      } else if (userRole === "Parent") {
        navigate("/dashboard/parent-dashboard/overview");
      } else if (userRole === "Student" || userRole === "Teacher") {
        navigate("/dashboard/student-dashboard/overview");
      } else if (userRole === "Assistant") {
        navigate("/dashboard/assistant-page");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || err.message || t("errors.generalError");
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  const HeroIllustration = () => (
    <svg
      viewBox="0 0 900 520"
      className="h-72 w-full"
      role="img"
      aria-label={tr("loginHeroImageAlt", "طلاب يتعلمون معًا", "Learning journey with connected ideas and growth")}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="fekra-bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#EAF4F4" />
          <stop offset="55%" stopColor="#CFE7EA" />
          <stop offset="100%" stopColor="#E6F1EA" />
        </linearGradient>
        <linearGradient id="fekra-accent" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#0E5563" />
          <stop offset="100%" stopColor="#F39A3F" />
        </linearGradient>
        <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#0E5563" floodOpacity="0.18" />
        </filter>
      </defs>

      <rect width="900" height="520" rx="40" fill="url(#fekra-bg)" />
      <circle cx="120" cy="90" r="70" fill="#F39A3F" opacity="0.15" />
      <circle cx="780" cy="430" r="90" fill="#0E5563" opacity="0.12" />

      <g filter="url(#soft-shadow)">
        <rect x="110" y="120" width="680" height="310" rx="28" fill="#FFFFFF" opacity="0.9" />
      </g>

      <g>
        <rect x="170" y="180" width="250" height="32" rx="16" fill="#0E5563" opacity="0.12" />
        <rect x="170" y="230" width="320" height="26" rx="13" fill="#0E5563" opacity="0.08" />
        <rect x="170" y="270" width="280" height="26" rx="13" fill="#0E5563" opacity="0.08" />
      </g>

      <g transform="translate(520 170)">
        <rect x="0" y="0" width="220" height="180" rx="20" fill="#F7FBFB" stroke="#CDE4E7" strokeWidth="2" />
        <rect x="26" y="30" width="168" height="10" rx="5" fill="#0E5563" opacity="0.18" />
        <rect x="26" y="55" width="130" height="10" rx="5" fill="#0E5563" opacity="0.12" />
        <rect x="26" y="80" width="150" height="10" rx="5" fill="#0E5563" opacity="0.12" />
        <circle cx="70" cy="135" r="18" fill="#F39A3F" opacity="0.35" />
        <rect x="110" y="125" width="70" height="18" rx="9" fill="url(#fekra-accent)" opacity="0.75" />
      </g>

      <g transform="translate(190 340)">
        <rect x="0" y="0" width="420" height="70" rx="20" fill="#FFFFFF" stroke="#DCE8EA" strokeWidth="2" />
        <rect x="24" y="20" width="120" height="12" rx="6" fill="#0E5563" opacity="0.2" />
        <rect x="24" y="40" width="180" height="10" rx="5" fill="#0E5563" opacity="0.12" />
        <circle cx="360" cy="35" r="20" fill="#0E5563" opacity="0.15" />
      </g>

      <g>
        <circle cx="230" cy="150" r="8" fill="#0E5563" />
        <circle cx="350" cy="120" r="10" fill="#F39A3F" />
        <circle cx="430" cy="160" r="6" fill="#0E5563" />
        <path
          d="M230 150C280 120 320 110 350 120C390 135 410 150 430 160"
          fill="none"
          stroke="url(#fekra-accent)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>

      <g>
        <circle cx="680" cy="95" r="6" fill="#0E5563" opacity="0.5" />
        <circle cx="720" cy="115" r="4" fill="#F39A3F" opacity="0.6" />
        <circle cx="760" cy="95" r="5" fill="#0E5563" opacity="0.4" />
        <path
          d="M680 95C700 85 720 85 760 95"
          fill="none"
          stroke="#0E5563"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.35"
        />
      </g>

      <g>
        <rect x="640" y="350" width="160" height="70" rx="18" fill="#0E5563" opacity="0.12" />
        <rect x="660" y="370" width="120" height="12" rx="6" fill="#0E5563" opacity="0.25" />
        <rect x="660" y="390" width="80" height="10" rx="5" fill="#0E5563" opacity="0.2" />
      </g>
    </svg>
  );

  return (
    <div
      className="min-h-screen pt-24 px-3 pb-8 sm:px-6 lg:px-8"
      style={{
        background: TOKENS.creamSurface,
      }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-45"
        style={{ background: GRADIENTS.pageAtmosphere }}
      />

      <div
        className="mx-auto w-full max-w-6xl overflow-hidden rounded-[1.5rem] border bg-base-100"
        style={{
          borderColor: "rgba(17,24,39,0.08)",
          boxShadow: SHADOWS.level2,
        }}
      >
        <div className="grid min-h-[auto] lg:min-h-[680px] lg:grid-cols-[1.05fr_1fr]">
          <section
            className="relative hidden p-8 lg:flex lg:flex-col lg:justify-between"
            style={{ background: GRADIENTS.appPanel }}
          >
            <div className="absolute -left-20 top-10 h-52 w-52 rounded-full bg-secondary/20 blur-3xl" />
            <div className="absolute -bottom-16 right-4 h-44 w-44 rounded-full bg-primary/15 blur-2xl" />

            <div className="relative z-10">
              <h2
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-lg font-extrabold"
                style={{
                  borderColor: "rgba(14,85,99,0.2)",
                  color: TOKENS.deepTeal,
                  background: "rgba(255,255,255,0.84)",
                }}
              >
                <UserCircle className="h-5 w-5" />
                Fekra
              </h2>
            </div>

            <div className="relative z-10 my-6 overflow-hidden rounded-[1.75rem] border-8 border-base-100 shadow-xl bg-white/70">
              <HeroIllustration />
            </div>

            <div className="relative z-10">
              <h1 className="text-4xl font-extrabold leading-tight" style={{ color: TOKENS.inkText }}>
                {tr("loginHeroTitle", "نمِّ قدراتك", "Grow Your Mind")}
                <br />
                <span style={{ color: TOKENS.deepTeal }}>{tr("loginHeroTitle2", "مع فكرة", "with Fekra")}</span>
              </h1>
              <p className="mt-4 max-w-md text-base" style={{ color: TOKENS.slateText }}>
                {tr(
                  "loginHeroSub",
                  "طريق ممتع لتعلّم المهارات الجديدة للطلاب والمعلمين وأولياء الأمور.",
                  "The playful path to mastering new skills for students, teachers, and parents.",
                )}
              </p>
            </div>
          </section>

          <section className="flex items-center justify-center px-4 py-6 sm:px-6 sm:py-8">
            <div className="w-full max-w-md space-y-5">
              <div className="space-y-1">
                <h2 className="text-3xl font-extrabold sm:text-4xl" style={{ color: TOKENS.inkText }}>
                  {tr("welcomeBack", "مرحبًا بعودتك!", "Welcome Back!")}
                </h2>
                <p style={{ color: TOKENS.slateText }}>
                  {tr("welcomeSubtitle", "جاهز لمواصلة رحلتك التعليمية؟", "Ready to continue your learning journey?")}
                </p>
              </div>

              {location.state?.message && (
                <div className="alert alert-success">
                  <span>{location.state.message}</span>
                </div>
              )}

              <div className="grid grid-cols-2 rounded-box p-1" style={{ background: TOKENS.neutralCloud }}>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={
                    activeTab === "email_tab"
                      ? { background: TOKENS.deepTeal, borderColor: TOKENS.deepTeal, color: "#F8FCFF" }
                      : { background: "transparent", borderColor: "transparent", color: TOKENS.slateText }
                  }
                  onClick={() => setActiveTab("email_tab")}
                >
                  <Mail className="h-4 w-4" />
                  {t("emailTab", "Email")}
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={
                    activeTab === "phone_tab"
                      ? { background: TOKENS.deepTeal, borderColor: TOKENS.deepTeal, color: "#F8FCFF" }
                      : { background: "transparent", borderColor: "transparent", color: TOKENS.slateText }
                  }
                  onClick={() => setActiveTab("phone_tab")}
                >
                  <Phone className="h-4 w-4" />
                  {t("phoneTab", "Phone")}
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-2" dir={isRTL ? "rtl" : "ltr"}>
                {activeTab === "email_tab" ? (
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-semibold">
                        {t("emailLabel", "Username or Email")}
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder={t("emailPlaceholder", "youremail@example.com")}
                        className={`input input-bordered input-md w-full bg-base-200/70 text-base ${
                          isRTL ? "pr-12" : "pl-12"
                        }`}
                        required
                      />
                      <Mail
                        className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/50 ${
                          isRTL ? "right-4" : "left-4"
                        }`}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-semibold">
                        {t("phoneLabel", "Phone Number")}
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        placeholder={t("phonePlaceholder", "01234567890")}
                        className={`input input-bordered input-md w-full bg-base-200/70 text-base ${
                          isRTL ? "pr-12" : "pl-12"
                        }`}
                        required
                      />
                      <Phone
                        className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/50 ${
                          isRTL ? "right-4" : "left-4"
                        }`}
                      />
                    </div>
                  </div>
                )}

                <div className="form-control">
                  <div className="flex items-center justify-between">
                    <label className="label py-1">
                      <span className="label-text font-semibold">
                        {t("passwordLabel", "Password")}
                      </span>
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      {t("forgotPassword", "Forgot Password?")}
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder={t("passwordPlaceholder", "••••••••")}
                      className={`password-toggle-input relative z-0 input input-bordered input-md w-full bg-base-200/70 text-base ${
                        isRTL ? "pr-24" : "pl-12"
                      } ${isRTL ? "pl-12" : "pr-24"}`}
                      required
                    />
                    <Lock
                      className={`pointer-events-none absolute top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-base-content/50 ${
                        isRTL ? "right-4" : "left-4"
                      }`}
                    />
                    <button
                      type="button"
                      className={`password-toggle-button absolute top-1/2 z-20 -translate-y-1/2 rounded-full p-1 text-base-content/60 hover:text-base-content ${
                        isRTL ? "left-4" : "right-4"
                      }`}
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? t("hidePassword", "Hide password") : t("showPassword", "Show password")}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="alert alert-error">
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className={`btn btn-lg w-full rounded-full text-base font-extrabold border-0 ${
                    loading ? "loading" : ""
                  }`}
                  style={{ background: TOKENS.deepTeal, color: "#F8FCFF" }}
                  disabled={loading}
                >
                  {loading ? t("loggingIn", "Logging in...") : t("login", "Log In")}
                </button>

                <p className="pt-1 text-center text-sm text-base-content/70">
                  {t("needAccount", "Don't have an account?")} {" "}
                  <Link to="/register" className="font-bold text-primary hover:underline">
                    {t("register", "Sign Up")}
                  </Link>
                </p>
              </form>

              <div
                className="rounded-box p-4 text-sm"
                style={{ background: TOKENS.lightAquaMist, color: TOKENS.slateText }}
              >
                <p className="inline-flex items-center gap-2 font-semibold" style={{ color: TOKENS.deepTeal }}>
                  <Sparkles className="h-4 w-4" />
                  {tr("tipTitle", "نصيحة اليوم", "Daily Learning Tip")}
                </p>
                <p className="mt-1">
                  {tr(
                    "tipBody",
                    "سجّل دخولك يوميًا للحفاظ على سلسلة الإنجاز وفتح الشارات بشكل أسرع.",
                    "Log in daily to keep your streak and unlock growth badges faster.",
                  )}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TeacherLogin;
