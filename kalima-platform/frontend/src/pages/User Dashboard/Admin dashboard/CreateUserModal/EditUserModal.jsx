"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { updateUser } from "../../../../routes/update-user"
import { Eye, EyeOff } from "lucide-react"
import { translateErrorMessage } from "../../../../utils/errorTranslator"
import Button from "../../../../components/ui/Button"
import Input from "../../../../components/ui/Input"

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
      if (!user?._id) {
        throw new Error(translateErrorMessage("User ID is missing"))
      }
      const result = await updateUser(user._id, updateData)

      if (result.success) {
        // Remove password from the data we pass back to the parent component
        const { password, ...dataToUpdate } = updateData
        onUserUpdated(user._id, dataToUpdate)
        onClose()
      } else {
        setError(translateErrorMessage(result.error))
      }
    } catch (err) {
      setError(translateErrorMessage(err.message || "An error occurred while updating the user"))
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

   return (
     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
       <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl" dir={isRTL ? "rtl" : "ltr"}>
        <h3 className={`font-bold text-lg mb-4 ${isRTL ? "text-right" : "text-left"}`}>
          {t("admin.editUser.title", { name: user?.name })}
        </h3>

         {error && (
           <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm flex items-center gap-3 mb-4">
             <span>{error}</span>
           </div>
         )}

        <form onSubmit={handleSubmit}>
          <div className="form-control mb-4">
            <label className="label flex flex-col items-start">
              <span className="label-text mb-1">
                {t("admin.editUser.name")}</span>
            </label>
               <Input
                 type="text"
                 name="name"
                 value={formData.name}
                 onChange={handleChange}
                 className="w-full rounded-xl"
                 style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
                 placeholder={t("admin.editUser.namePlaceholder")}
               />
          </div>

          <div className="form-control mb-4">
            <label className="label flex flex-col items-start">
              <span className="label-text mb-1">{t("admin.editUser.email")}</span>
            </label>
               <Input
                 type="email"
                 name="email"
                 value={formData.email}
                 onChange={handleChange}
                 className="w-full rounded-xl"
                 style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
                 placeholder={t("admin.editUser.emailPlaceholder")}
               />
          </div>

          <div className="form-control mb-4">
            <label className="label flex flex-col items-start">
              <span className="label-text mb-1">{t("admin.editUser.phone")}</span>
            </label>
               <Input
                 type="text"
                 name="phoneNumber"
                 value={formData.phoneNumber}
                 onChange={handleChange}
                 className="w-full rounded-xl"
                 style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
                 placeholder={t("admin.editUser.phonePlaceholder")}
               />
          </div>

          <div className="form-control mb-6">
            <label className="label flex flex-col items-start">
              <span className="label-text mb-1">{t("admin.editUser.password")}</span>
            </label>
            <div className="relative">
               <Input
                 type={showPassword ? "text" : "password"}
                 name="password"
                 value={formData.password}
                 onChange={handleChange}
                 className="w-full"
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
            <label className="label py-0">
              <span className="label-text-alt">{t("admin.editUser.passwordHint")}</span>
            </label>
          </div>

           <div className="flex justify-end gap-3 mt-6">
             <Button type="button" variant="ghost" onClick={onClose}>
               {t("admin.editUser.cancel")}
             </Button>
             <Button type="submit" variant="primary" disabled={loading} isLoading={loading}>
               {t("admin.editUser.save")}
             </Button>
           </div>
        </form>
      </div>
    </div>
  )
}

export default EditUserModal
