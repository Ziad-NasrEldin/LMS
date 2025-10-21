"use client"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import SectionHeader from "./SectionHeader"
import { updateUserPassword } from "../../routes/update-user"

function SecuritySection() {
  const { t, i18n } = useTranslation("settings")
  const isRTL = i18n.language === 'ar'
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [updateStatus, setUpdateStatus] = useState({
    success: false,
    error: null
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Calculate password strength when new password changes
    if (name === "newPassword") {
      let strength = 0
      if (value.length >= 8) strength += 1
      if (/[A-Z]/.test(value)) strength += 1
      if (/\d/.test(value)) strength += 1
      if (/[^A-Za-z0-9]/.test(value)) strength += 1
      setPasswordStrength(Math.min(2, Math.floor(strength / 2)))
    }
  }

  const updatePassword = async () => {
    // Reset status
    setUpdateStatus({ success: false, error: null })

    // Validation
    if (formData.newPassword !== formData.confirmPassword) {
      setUpdateStatus({ error: t('security.errors.mismatch') })
      return
    }

    if (formData.newPassword.length < 8) {
      setUpdateStatus({ error: t('security.errors.length') })
      return
    }

    setLoading(true)
    try {
      const result = await updateUserPassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      })

      if (result.success) {
        setUpdateStatus({ success: true, error: null })
        // Clear form
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        })
      } else {
        setUpdateStatus({ error: result.error })
      }
    } catch (error) {
      console.error("Error updating password:", error)
      setUpdateStatus({ error: t('security.errors.general') })
    } finally {
      setLoading(false)
    }
  }

  const lockIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
      />
    </svg>
  )

  return (
    <div className="mb-8">
      <SectionHeader title={t('security.title')} icon={lockIcon} />
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h3 className={`text-lg font-semibold mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('security.changePassword')}
          </h3>

          {updateStatus.success && (
            <div className="alert alert-success mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{t('security.success')}</span>
            </div>
          )}

          {updateStatus.error && (
            <div className="alert alert-error mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{updateStatus.error}</span>
            </div>
          )}

          {/* Current Password Field */}
          <div className="form-control mb-4">
            <label className={`label justify-end`}>
              <span className="label-text">{t('security.labels.currentPassword')}</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                className={`input input-bordered w-full ${isRTL ? 'text-right' : 'text-left'}`}
                placeholder={t('security.placeholders.currentPassword')}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
              <button
                type="button"
                className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 transform -translate-y-1/2`}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? t('security.hidePassword') : t('security.showPassword')}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* New Password Field */}
          <div className="form-control mb-4">
            <label className={`label justify-end`}>
              <span className="label-text">{t('security.labels.newPassword')}</span>
            </label>
            <input
              type={showPassword ? "text" : "password"}
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              className={`input input-bordered w-full ${isRTL ? 'text-right' : 'text-left'}`}
              placeholder={t('security.placeholders.newPassword')}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
            <PasswordStrengthIndicator strength={passwordStrength} />
          </div>

          {/* Confirm Password Field */}
          <div className="form-control mb-4">
            <label className={`label justify-end`}>
              <span className="label-text">{t('security.labels.confirmPassword')}</span>
            </label>
            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`input input-bordered w-full ${isRTL ? 'text-right' : 'text-left'}`}
              placeholder={t('security.placeholders.confirmPassword')}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
            <div className={`text-xs mt-1 text-gray-500 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('security.passwordRequirement')}
            </div>
          </div>

          <div className="flex justify-center mt-6">
            <button
              className={`btn btn-primary ${loading ? "loading" : ""}`}
              onClick={updatePassword}
              disabled={loading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
            >
              {t('security.updateButton')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function PasswordStrengthIndicator({ strength }) {
  const { t } = useTranslation("common");
  const colors  = ["bg-error", "bg-warning", "bg-success"];
  const widths  = ["w-1/3",  "w-2/3",    "w-full"];
  const labels  = [
    t("passwordStrength.weak"),
    t("passwordStrength.medium"),
    t("passwordStrength.strong"),
  ];

  return (
    <div className="mt-2" dir={t("dir")}>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${colors[strength]} ${widths[strength]} h-2 rounded-full transition-all duration-300`}
        />
      </div>

      <div className="text-xs mt-1 text-gray-500">
        {t("passwordStrength.label")}&nbsp;
        <span className={`font-medium ${colors[strength].replace("bg", "text")}`}>
          {labels[strength]}
        </span>
      </div>
    </div>
  );
}

export default SecuritySection