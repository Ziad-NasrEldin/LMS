"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { updateUser } from "../../../../routes/update-user"
import { Eye, EyeOff } from "lucide-react"

const EditUserModal = ({ isOpen, onClose, user, onUserUpdated }) => {
  const { t, i18n } = useTranslation("admin")
  const isRTL = i18n.language === "ar"
  const dir = isRTL ? "rtl" : "ltr"

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    role: "", // Include role to prevent "invalid or missing role" error
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)

  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        password: "",
        role: user.role || "", // Preserve the user's role
      })
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Create update data object, only including fields that have values
    const updateData = {}
    if (formData.name) updateData.name = formData.name
    if (formData.email) updateData.email = formData.email
    if (formData.phoneNumber) updateData.phoneNumber = formData.phoneNumber
    if (formData.password) updateData.password = formData.password

    // Always include the role to prevent "invalid or missing role" error
    updateData.role = formData.role

    try {
      const result = await updateUser(user._id, updateData)

      if (result.success) {
        // Remove password from the data we pass back to the parent component
        const { password, ...dataToUpdate } = updateData
        onUserUpdated(user._id, dataToUpdate)
        onClose()
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err.message || "An error occurred while updating the user")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal modal-open">
      <div className="modal-box" dir={isRTL ? "rtl" : "ltr"}>
        <h3 className={`font-bold text-lg mb-4 ${isRTL ? "text-right" : "text-left"}`}>
          {t("admin.editUser.title", { name: user?.name })}
        </h3>

        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-control mb-4">
         <label className="label flex flex-col items-start">
        <span className="label-text mb-1">
          {t("admin.editUser.name")}</span>
            </label>  
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input input-bordered"
              placeholder={t("admin.editUser.namePlaceholder")}
            />
          </div>

          <div className="form-control mb-4">
          <label className="label flex flex-col items-start">
        <span className="label-text mb-1">{t("admin.editUser.email")}</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input input-bordered"
              placeholder={t("admin.editUser.emailPlaceholder")}
            />
          </div>

          <div className="form-control mb-4">
             <label className="label flex flex-col items-start">
        <span className="label-text mb-1">{t("admin.editUser.phone")}</span>
            </label>
            <input
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="input input-bordered"
              placeholder={t("admin.editUser.phonePlaceholder")}
            />
          </div>

          <div className="form-control mb-6">
            <label className="label flex flex-col items-start">
        <span className="label-text mb-1">{t("admin.editUser.password")}</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input input-bordered "
                placeholder={t("admin.editUser.passwordPlaceholder")}
              />
              <button
                type="button"
                className={`absolute inset-y-0 ${isRTL ? "left-0 pl-3" : "right-0 pr-3"} flex items-center`}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <Eye /> : <EyeOff />}
              </button>
            </div>
            <label className="label">
              <span className="label-text-alt">{t("admin.editUser.passwordHint")}</span>
            </label>
          </div>

          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              {t("admin.editUser.cancel")}
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-sm"></span> : t("admin.editUser.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditUserModal
