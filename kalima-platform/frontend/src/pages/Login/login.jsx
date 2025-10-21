import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import WaveBackground from "./WaveBackground";
import { loginUser, getUserDashboard } from "../../routes/auth-services";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { getAccessToken } from "../../utils/useLocalStroage";
const TeacherLogin = () => {
  const navigate = useNavigate();
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

            // Redirect based on user role
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
        } catch (error) {
          console.error("Error checking auth status:", error);
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
      window.dispatchEvent(new Event('user-auth-changed'));
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
      className="min-h-screen flex flex-col md:flex-row items-center justify-center relative overflow-hidden bg-base-100"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <WaveBackground />

      {/* Right side - Login Form */}
      <div className="w-full md:w-1/2 p-6 flex justify-center items-center z-0">
        <div className="bg-base-100 shadow-xl rounded-lg p-6 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-2">
            {t("loginNow", "Login Now!")}
          </h1>
          <p className="text-center text-base-600 mb-6">
            {/* {t('loginWelcome', 'Welcome! Sign in to access your teacher dashboard and resources')} */}
          </p>

          {/* Tabs */}
          <div className="tabs tabs-border mb-6">
            <button
              className={`tab ${activeTab === "email_tab" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("email_tab")}
            >
              {t("emailTab", "Email")}
            </button>
            <button
              className={`tab ${activeTab === "phone_tab" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("phone_tab")}
            >
              {t("phoneTab", "Phone")}
            </button>
          </div>

          <form onSubmit={handleSubmit} dir={isRTL ? "rtl" : "ltr"}>
            {activeTab === "email_tab" ? (
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text mb-2">
                    {t("emailLabel", "Email Address")}
                  </span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="youremail@example.com"
                  className="input input-bordered w-full"
                  required
                />
              </div>
            ) : (
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text mb-2">
                    {t("phoneLabel", "Phone Number")}
                  </span>
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="01234567890"
                  className="input input-bordered w-full"
                  required
                />
              </div>
            )}

            <div className="form-control mb-6">
              <label className="label">
                <span className="label-text mb-2">
                  {t("passwordLabel", "Password")}
                </span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className={`input input-bordered w-full ${
                    isRTL ? "pr-12" : "pl-12"
                  }`}
                  required
                />
                <button
                  type="button"
                  className={`absolute top-1/2 ${
                    isRTL ? "right-3" : "left-3"
                  } -translate-y-1/2 z-10 text-gray-500`}
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <label className="label">
                <Link
                  to="/forgot-password"
                  className="label-text-alt link link-hover text-primary mt-2"
                >
                  {t("forgotPassword", "Forgot password?")}
                </Link>
              </label>
            </div>

            {error && (
              <div className="alert alert-error mb-4">
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className={`btn btn-primary w-full ${loading ? "loading" : ""}`}
              disabled={loading}
            >
              {loading ? t("loggingIn", "Logging in...") : t("login", "Login")}
            </button>

            <div className="text-center mt-4">
              <p>
                {t("needAccount", "Don't have an account?")}{" "}
                <Link to="/register" className="link link-primary">
                  {t("register", "Register here")}
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* <div className="w-full md:w-1/2 z-10">
        <TeacherReviews />
      </div> */}
    </div>
  );
};

export default TeacherLogin;
