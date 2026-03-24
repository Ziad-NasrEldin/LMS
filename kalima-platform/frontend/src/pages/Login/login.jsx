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
  const isRTL = i18n.language === "ar";
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
              navigate("/dashboard/student-dashboard/promo-codes");
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
      } else if (userRole === "Student" || userRole === "Teacher" || userRole === "Parent") {
        navigate("/dashboard/student-dashboard/promo-codes");
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

            <div className="relative z-10 my-6 overflow-hidden rounded-[1.75rem] border-8 border-base-100 shadow-xl">
              <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1471&q=80"
              />
            </div>

            <div className="relative z-10">
              <h1 className="text-4xl font-extrabold leading-tight" style={{ color: TOKENS.inkText }}>
                {t("loginHeroTitle", "Grow Your Mind")}
                <br />
                <span style={{ color: TOKENS.deepTeal }}>{t("loginHeroTitle2", "with Fekra")}</span>
              </h1>
              <p className="mt-4 max-w-md text-base" style={{ color: TOKENS.slateText }}>
                {t(
                  "loginHeroSub",
                  "The playful path to mastering new skills for students, teachers, and parents.",
                )}
              </p>
            </div>
          </section>

          <section className="flex items-center justify-center px-4 py-6 sm:px-6 sm:py-8">
            <div className="w-full max-w-md space-y-5">
              <div className="space-y-1">
                <h2 className="text-3xl font-extrabold sm:text-4xl" style={{ color: TOKENS.inkText }}>
                  {t("welcomeBack", "Welcome Back!")}
                </h2>
                <p style={{ color: TOKENS.slateText }}>
                  {t("welcomeSubtitle", "Ready to continue your learning journey?")}
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
                        placeholder="youremail@example.com"
                        className={`input input-bordered input-sm w-full bg-base-200/70 ${
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
                        placeholder="01234567890"
                        className={`input input-bordered input-sm w-full bg-base-200/70 ${
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
                      placeholder="••••••••"
                      className={`input input-bordered input-sm w-full bg-base-200/70 ${
                        isRTL ? "pr-24" : "pl-12"
                      } ${isRTL ? "pl-12" : "pr-24"}`}
                      required
                    />
                    <Lock
                      className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/50 ${
                        isRTL ? "right-4" : "left-4"
                      }`}
                    />
                    <button
                      type="button"
                      className={`absolute top-1/2 -translate-y-1/2 text-base-content/60 hover:text-base-content ${
                        isRTL ? "left-4" : "right-4"
                      }`}
                      onClick={() => setShowPassword((prev) => !prev)}
                      tabIndex={-1}
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

                <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-base-content/45">
                  <span className="h-px flex-1 bg-base-300" />
                  {t("continueWith", "Or continue with")}
                  <span className="h-px flex-1 bg-base-300" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button type="button" className="btn btn-outline rounded-full">
                    Google
                  </button>
                  <button type="button" className="btn btn-outline rounded-full">
                    Apple
                  </button>
                </div>

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
                  {t("tipTitle", "Daily Learning Tip")}
                </p>
                <p className="mt-1">
                  {t("tipBody", "Log in daily to keep your streak and unlock growth badges faster.")}
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
