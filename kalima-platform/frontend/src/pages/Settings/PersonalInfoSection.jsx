"use client"

import { useState, useEffect } from "react"
import SectionHeader from "./SectionHeader"
import { useTranslation } from "react-i18next"
import { getUserDashboard } from "../../routes/auth-services"
import { updateCurrentUser } from "../../routes/update-user"
import { Check, X, Camera, Upload, Pencil } from "lucide-react"
import { resolveProfileImageUrl } from "../../utils/profileImage"
import { designTokens } from "../../constants/designTokens"

function PersonalInfoSection() {
  const { t, i18n } = useTranslation("settings")
  const isRTL = i18n.language === "ar"
  const TOKENS = designTokens.colors
  const SHADOWS = designTokens.shadows

  // State for user data
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Single edit mode for compact UX
  const [isEditing, setIsEditing] = useState(false)

  // Form data for editing
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    profilePic: null,
  })

  // Profile picture upload states
  const [profilePicPreview, setProfilePicPreview] = useState(null)
  const [profilePicUploading, setProfilePicUploading] = useState(false)

  // Email validation state
  const [emailError, setEmailError] = useState("")

  // State for update status
  const [updateStatus, setUpdateStatus] = useState({
    loading: false,
    success: false,
    error: null,
  })

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"]
      if (!allowedTypes.includes(file.type)) {
        alert(t("validation.invalidImageType") || "Please select a valid image file (JPEG, PNG, GIF)")
        return
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024 // 5MB in bytes
      if (file.size > maxSize) {
        alert(t("validation.fileTooLarge") || "File size must be less than 5MB")
        return
      }

      setFormData((prev) => ({ ...prev, profilePic: file }))

      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setProfilePicPreview(previewUrl)
    }
  }

  const handleProfilePicUpload = async () => {
    if (!formData.profilePic) return

    setProfilePicUploading(true)
    setUpdateStatus({
      loading: true,
      success: false,
      error: null,
    })

    try {
      // Create FormData for file upload
      const uploadData = new FormData()
      uploadData.append("profilePic", formData.profilePic)

      const result = await updateCurrentUser(uploadData)

      if (result.success) {
        // Update local userData state with new profile picture
        setUserData((prev) => ({
          ...prev,
          profilePic: result.data.data?.profilePic || result.data.profilePic,
        }))

        // Clear the form data and preview
        setFormData((prev) => ({ ...prev, profilePic: null }))
        setProfilePicPreview(null)

        // Set success status
        setUpdateStatus({
          loading: false,
          success: true,
          error: null,
        })

        // Clear success message after 3 seconds
        setTimeout(() => {
          setUpdateStatus((prev) => ({
            ...prev,
            success: false,
          }))
        }, 3000)
      } else {
        setUpdateStatus({
          loading: false,
          success: false,
          error: result.error || "Failed to upload profile picture",
        })
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error)
      setUpdateStatus({
        loading: false,
        success: false,
        error: "An unexpected error occurred while uploading",
      })
    } finally {
      setProfilePicUploading(false)
    }
  }

  const cancelProfilePicUpload = () => {
    setFormData((prev) => ({ ...prev, profilePic: null }))
    if (profilePicPreview) {
      URL.revokeObjectURL(profilePicPreview)
      setProfilePicPreview(null)
    }
  }

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true)
      try {
        const result = await getUserDashboard()
        if (result.success) {
          const userInfo = result.data.data.userInfo
          setUserData(userInfo)
          // Initialize form data with user info
          setFormData({
            fullName: userInfo.name || "",
            phoneNumber: userInfo.phoneNumber || "",
            email: userInfo.email || "",
            profilePic: null,
          })
        } else {
          setError(result.error || "Failed to fetch user data")
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        setError("An error occurred while fetching your information")
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (profilePicPreview) {
        URL.revokeObjectURL(profilePicPreview)
      }
    }
  }, [profilePicPreview])

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target

    // Email validation
    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        setEmailError(t("validation.invalidEmail") || "Invalid email address")
      } else {
        setEmailError("")
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const startEditing = () => {
    setFormData((prev) => ({
      ...prev,
      fullName: userData?.name || "",
      phoneNumber: userData?.phoneNumber || "",
      email: userData?.email || "",
    }))
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setFormData((prev) => ({
      ...prev,
      fullName: userData?.name || "",
      phoneNumber: userData?.phoneNumber || "",
      email: userData?.email || "",
    }))
    setEmailError("")
    setIsEditing(false)
    setUpdateStatus({ loading: false, success: false, error: null })
  }

  const handleSaveAll = async () => {
    if (emailError) return

    // Set update status to loading
    setUpdateStatus({
      loading: true,
      success: false,
      error: null,
    })

    try {
      const updateData = {
        name: formData.fullName,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
      }

      const result = await updateCurrentUser(updateData)

      if (result.success) {
        setUserData((prev) => ({
          ...prev,
          name: formData.fullName,
          phoneNumber: formData.phoneNumber,
          email: formData.email,
        }))

        setUpdateStatus({
          loading: false,
          success: true,
          error: null,
        })
        setIsEditing(false)

        setTimeout(() => {
          setUpdateStatus((prev) => ({
            ...prev,
            success: false,
          }))
        }, 3000)
      } else {
        setUpdateStatus({
          loading: false,
          success: false,
          error: result.error || "Failed to update",
        })
      }
    } catch (error) {
      console.error("Error updating user data:", error)
      setUpdateStatus({
        loading: false,
        success: false,
        error: "An unexpected error occurred",
      })
    }
  }

  // Get all translations under personalInfo namespace
  const personalInfo = t("personalInfo", { returnObjects: true })

  if (loading) {
    return (
      <section>
        <SectionHeader title={personalInfo.title} />
        <div
          className="rounded-3xl border p-4 md:p-5"
          style={{
            background: "rgba(255,255,255,0.75)",
            borderColor: "rgba(17,24,39,0.08)",
            boxShadow: SHADOWS.level1,
          }}
        >
          <div className="flex items-center justify-center p-8">
            <div className="loading loading-spinner loading-lg text-primary"></div>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section>
        <SectionHeader title={personalInfo.title} />
        <div
          className="rounded-3xl border p-4 md:p-5"
          style={{
            background: "rgba(255,255,255,0.75)",
            borderColor: "rgba(17,24,39,0.08)",
            boxShadow: SHADOWS.level1,
          }}
        >
          <div>
            <div className="alert alert-error">
              <span>{error}</span>
              <button className="btn btn-sm btn-outline" onClick={() => window.location.reload()}>
                {t("retry")}
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  const hasProfilePic = userData?.profilePic
  const currentProfilePicUrl = resolveProfileImageUrl(userData?.profilePic)

  return (
    <section>
      <SectionHeader title={personalInfo.title} />
      <div
        className="rounded-3xl border p-4 md:p-5"
        style={{
          background: "rgba(255,255,255,0.75)",
          borderColor: "rgba(17,24,39,0.08)",
          boxShadow: SHADOWS.level1,
        }}
      >
        <div className="mx-auto max-w-4xl">
          <h3 className={`mb-4 text-base font-semibold md:text-lg ${isRTL ? "text-right" : "text-left"}`} style={{ color: TOKENS.slateText }}>
            {personalInfo.subtitle}
          </h3>

          {/* User Avatar with Upload Functionality */}
          <div className="mb-6 flex flex-col items-center">
            <div className="relative">
              <div className="avatar">
                <div className="w-24 h-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                  <img
                    src={profilePicPreview || currentProfilePicUrl}
                    alt={userData?.name || "User Avatar"}
                    className="object-cover"
                    style={{ objectFit: "cover" }}
                    onError={(event) => {
                      event.currentTarget.src = "/person.png"
                    }}
                  />
                </div>
              </div>

              {/* Camera icon overlay for upload */}
              {!formData.profilePic && (
                <label
                  htmlFor="profilePicInput"
                  className="absolute bottom-0 right-0 btn btn-circle btn-sm btn-primary cursor-pointer"
                  title={t("personalInfo.uploadProfilePic") || "Upload Profile Picture"}
                >
                  <Camera className="w-4 h-4" />
                </label>
              )}
            </div>

            {/* Hidden file input */}
            <input
              id="profilePicInput"
              type="file"
              accept="image/*"
              onChange={handleProfilePicChange}
              className="hidden"
            />

            {/* Upload controls when file is selected */}
            {formData.profilePic && (
              <div className="mt-4 flex flex-col items-center gap-2">
                <div className="text-sm text-gray-600">
                  {t("personalInfo.selectedFile") || "Selected:"} {formData.profilePic.name}
                </div>
                <div className="flex gap-2">
                  <button
                    className={`btn btn-primary btn-sm ${profilePicUploading ? "loading" : ""}`}
                    onClick={handleProfilePicUpload}
                    disabled={profilePicUploading}
                  >
                    {!profilePicUploading && <Upload className="w-4 h-4" />}
                    {t("personalInfo.uploadButton") || "Upload"}
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={cancelProfilePicUpload}
                    disabled={profilePicUploading}
                  >
                    <X className="w-4 h-4" />
                    {t("personalInfo.cancelButton") || "Cancel"}
                  </button>
                </div>
              </div>
            )}

            {/* Upload status messages */}
            {updateStatus.error && !isEditing && (
              <div className="mt-2 text-error text-sm text-center">{updateStatus.error}</div>
            )}
            {updateStatus.success && !isEditing && (
              <div className="mt-2 text-success text-sm text-center">
                {t("personalInfo.profilePicUpdated") || "Profile picture updated successfully!"}
              </div>
            )}

            {/* Upload hint for users without profile picture */}
            {!hasProfilePic && !formData.profilePic && (
              <div className="mt-2 text-sm text-gray-500 text-center">
                {t("personalInfo.noProfilePicHint") || "Click the camera icon to upload a profile picture"}
              </div>
            )}
          </div>

          {/* User Role Badge */}
          <div className="mb-4 flex justify-end">
            <div className="badge badge-primary badge-lg">
              {t(`role.${userData?.role?.toLowerCase()}`, { ns: "common" })}
            </div>
          </div>

          <div className={`mb-4 flex gap-2 ${isRTL ? "justify-start" : "justify-end"}`}>
            {!isEditing ? (
              <button className="btn btn-sm btn-outline" onClick={startEditing}>
                <Pencil className="h-4 w-4" />
                {personalInfo.buttons.edit}
              </button>
            ) : (
              <>
                <button
                  className={`btn btn-sm btn-primary ${updateStatus.loading ? "loading" : ""}`}
                  onClick={handleSaveAll}
                  disabled={updateStatus.loading || !!emailError}
                >
                  {!updateStatus.loading && <Check className="h-4 w-4" />}
                  {t("save") || "Save"}
                </button>
                <button className="btn btn-sm btn-outline" onClick={cancelEditing} disabled={updateStatus.loading}>
                  <X className="h-4 w-4" />
                  {t("cancel") || "Cancel"}
                </button>
              </>
            )}
          </div>

          {updateStatus.error && isEditing && <div className="mb-3 text-sm text-error">{updateStatus.error}</div>}
          {updateStatus.success && <div className="mb-3 text-sm text-success">{personalInfo.messages?.updateSuccess || "Updated successfully"}</div>}

          {/* Full Name Field */}
          <div className="form-control mb-4">
            <label className={`label pb-1 ${isRTL ? "justify-end" : "justify-start"}`}>
              <span className="label-text">
                {personalInfo.labels.fullName}
                <span className="text-error">*</span>
              </span>
            </label>
            <div className="w-full">
              <input
                type="text"
                name="fullName"
                value={isEditing ? formData.fullName : userData?.name || ""}
                onChange={handleInputChange}
                placeholder={personalInfo.placeholders.fullName}
                className={`input input-bordered w-full max-w-2xl ${isRTL ? "text-right" : "text-left"}`}
                dir={isRTL ? "rtl" : "ltr"}
                readOnly={!isEditing}
              />
            </div>
          </div>

          {/* Phone Number Field */}
          <div className="form-control mb-4">
            <label className={`label pb-1 ${isRTL ? "justify-end" : "justify-start"}`}>
              <span className="label-text">
                {personalInfo.labels.phoneNumber}
                <span className="text-error">*</span>
              </span>
            </label>
            <div className="w-full">
              <input
                type="text"
                name="phoneNumber"
                value={isEditing ? formData.phoneNumber : userData?.phoneNumber || ""}
                onChange={handleInputChange}
                placeholder={personalInfo.placeholders.phoneNumber}
                className={`input input-bordered w-full max-w-2xl ${isRTL ? "text-right" : "text-left"}`}
                dir={isRTL ? "rtl" : "ltr"}
                readOnly={!isEditing}
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="form-control mb-4">
            <label className={`label pb-1 ${isRTL ? "justify-end" : "justify-start"}`}>
              <span className="label-text">
                {personalInfo.labels.email}
                <span className="text-error">*</span>
              </span>
            </label>
            <div className="w-full">
              <input
                type="email"
                name="email"
                value={isEditing ? formData.email : userData?.email || ""}
                onChange={handleInputChange}
                placeholder={personalInfo.placeholders.email}
                className={`input input-bordered w-full max-w-2xl ${isRTL ? "text-right" : "text-left"} ${emailError && isEditing ? "input-error animate-shake" : ""}`}
                dir={isRTL ? "rtl" : "ltr"}
                readOnly={!isEditing}
              />
            </div>
            {emailError && isEditing && <div className="mt-2 text-error text-sm">{emailError}</div>}
          </div>

          {/* Student-specific fields */}
          {userData?.role === "Student" && userData?.level && (
            <div className="form-control mb-4">
              <label className={`label justify-end`}>
                <span className="label-text">{personalInfo.labels.level || "Level"}</span>
              </label>
              <input
                type="text"
                value={userData.level.name || ""}
                className={`input input-bordered w-full max-w-2xl ${isRTL ? "text-right" : "text-left"}`}
                dir={isRTL ? "rtl" : "ltr"}
                readOnly
              />
            </div>
          )}

          {/* Points display for students */}
          {userData?.role === "Student" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="stat rounded-box" style={{ background: TOKENS.neutralCloud }}>
                <div className="stat-title">{personalInfo.labels.generalPoints || t("General Points")}</div>
                <div className="stat-value">{userData.generalPoints || 0}</div>
              </div>
              <div className="stat rounded-box" style={{ background: TOKENS.neutralCloud }}>
                <div className="stat-title">{personalInfo.labels.totalPoints || t("Total Points")}</div>
                <div className="stat-value">{userData.totalPoints || 0}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default PersonalInfoSection
