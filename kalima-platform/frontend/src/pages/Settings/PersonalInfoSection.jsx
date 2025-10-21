"use client"

import { useState, useEffect } from "react"
import SectionHeader from "./SectionHeader"
import { useTranslation } from "react-i18next"
import { getUserDashboard } from "../../routes/auth-services"
import { updateCurrentUser } from "../../routes/update-user"
import { Check, X, Camera, Upload } from "lucide-react"

function PersonalInfoSection() {
  const { t, i18n } = useTranslation("settings")
  const isRTL = i18n.language === "ar"

  // State for user data
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // States for editing
  const [isEditing, setIsEditing] = useState({
    fullName: false,
    phoneNumber: false,
    email: false,
  })

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
    field: null,
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
      field: "profilePic",
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
          field: "profilePic",
        })

        // Clear success message after 3 seconds
        setTimeout(() => {
          setUpdateStatus((prev) => ({
            ...prev,
            success: false,
            field: null,
          }))
        }, 3000)
      } else {
        setUpdateStatus({
          loading: false,
          success: false,
          error: result.error || "Failed to upload profile picture",
          field: "profilePic",
        })
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error)
      setUpdateStatus({
        loading: false,
        success: false,
        error: "An unexpected error occurred while uploading",
        field: "profilePic",
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

  // Toggle edit mode for a field
  const toggleEdit = (field) => {
    setIsEditing((prev) => ({
      ...prev,
      [field]: !prev[field],
    }))

    // Reset form data to current user data if canceling edit
    if (isEditing[field]) {
      setFormData((prev) => ({
        ...prev,
        [field === "fullName" ? "fullName" : field]: field === "fullName" ? userData?.name : userData?.[field] || "",
      }))
    }
  }

  // Handle save changes
  const handleSave = async (field) => {
    // Set update status to loading
    setUpdateStatus({
      loading: true,
      success: false,
      error: null,
      field,
    })

    try {
      // Map form field names to API field names
      const fieldMapping = {
        fullName: "name",
        phoneNumber: "phoneNumber",
        email: "email",
      }

      // Create update data object with the correct field name
      const updateData = {
        [fieldMapping[field]]: formData[field],
      }

      // Call the update API using the new service
      const result = await updateCurrentUser(updateData)

      if (result.success) {
        // Update local userData state
        setUserData((prev) => ({
          ...prev,
          [fieldMapping[field]]: formData[field],
        }))

        // Set success status
        setUpdateStatus({
          loading: false,
          success: true,
          error: null,
          field,
        })

        // Exit edit mode
        toggleEdit(field)

        // Clear success message after 3 seconds
        setTimeout(() => {
          setUpdateStatus((prev) => ({
            ...prev,
            success: false,
            field: null,
          }))
        }, 3000)
      } else {
        // Set error status
        setUpdateStatus({
          loading: false,
          success: false,
          error: result.error || "Failed to update",
          field,
        })
      }
    } catch (error) {
      console.error("Error updating user data:", error)
      setUpdateStatus({
        loading: false,
        success: false,
        error: "An unexpected error occurred",
        field,
      })
    }
  }

  // Get all translations under personalInfo namespace
  const personalInfo = t("personalInfo", { returnObjects: true })

  if (loading) {
    return (
      <div className="mb-8">
        <SectionHeader title={personalInfo.title} />
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body flex items-center justify-center p-8">
            <div className="loading loading-spinner loading-lg text-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mb-8">
        <SectionHeader title={personalInfo.title} />
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <div className="alert alert-error">
              <span>{error}</span>
              <button className="btn btn-sm btn-outline" onClick={() => window.location.reload()}>
                {t("retry")}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const hasProfilePic = userData?.profilePic
  const currentProfilePicUrl = hasProfilePic
    ? `${import.meta.env.VITE_API_URL}/${userData.profilePic.replace(/\\/g, "/")}`
    : "/default-avatar.png"

  return (
    <div className="mb-8">
      <SectionHeader title={personalInfo.title} />
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h3 className={`text-lg font-semibold mb-4 ${isRTL ? "text-right" : "text-left"}`}>
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
            {updateStatus.field === "profilePic" && updateStatus.error && (
              <div className="mt-2 text-error text-sm text-center">{updateStatus.error}</div>
            )}
            {updateStatus.field === "profilePic" && updateStatus.success && (
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

          {/* Full Name Field */}
          <div className="form-control mb-4">
            <label className={`label justify-end`}>
              <span className="label-text">
                {personalInfo.labels.fullName}
                <span className="text-error">*</span>
              </span>
            </label>
            <div className={`flex gap-4 ${isRTL ? "flex-row" : "flex-row-reverse"}`}>
              {isEditing.fullName ? (
                <div className={`flex gap-2 ${isRTL ? "" : "order-last"}`}>
                  <button
                    className={`btn btn-sm btn-primary ${updateStatus.loading && updateStatus.field === "fullName" ? "loading" : ""}`}
                    onClick={() => handleSave("fullName")}
                    disabled={updateStatus.loading}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => toggleEdit("fullName")}
                    disabled={updateStatus.loading && updateStatus.field === "fullName"}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button className={`btn btn-sm ${isRTL ? "" : "order-last"}`} onClick={() => toggleEdit("fullName")}>
                  {personalInfo.buttons.edit}
                </button>
              )}
              <input
                type="text"
                name="fullName"
                value={isEditing.fullName ? formData.fullName : userData?.name || ""}
                onChange={handleInputChange}
                placeholder={personalInfo.placeholders.fullName}
                className={`input input-bordered w-full ${isRTL ? "text-right" : "text-left"}`}
                dir={isRTL ? "rtl" : "ltr"}
                readOnly={!isEditing.fullName}
              />
            </div>
            {updateStatus.field === "fullName" && updateStatus.error && (
              <div className="mt-2 text-error text-sm">{updateStatus.error}</div>
            )}
            {updateStatus.field === "fullName" && updateStatus.success && (
              <div className="mt-2 text-success text-sm">
                {personalInfo.messages?.updateSuccess || "Updated successfully"}
              </div>
            )}
          </div>

          {/* Phone Number Field */}
          <div className="form-control mb-4">
            <label className={`label justify-end`}>
              <span className="label-text">
                {personalInfo.labels.phoneNumber}
                <span className="text-error">*</span>
              </span>
            </label>
            <div className={`flex gap-4 ${isRTL ? "flex-row" : "flex-row-reverse"}`}>
              {isEditing.phoneNumber ? (
                <div className={`flex gap-2 ${isRTL ? "" : "order-last"}`}>
                  <button
                    className={`btn btn-sm btn-primary ${updateStatus.loading && updateStatus.field === "phoneNumber" ? "loading" : ""}`}
                    onClick={() => handleSave("phoneNumber")}
                    disabled={updateStatus.loading}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => toggleEdit("phoneNumber")}
                    disabled={updateStatus.loading && updateStatus.field === "phoneNumber"}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button className={`btn btn-sm ${isRTL ? "" : "order-last"}`} onClick={() => toggleEdit("phoneNumber")}>
                  {personalInfo.buttons.edit}
                </button>
              )}
              <input
                type="text"
                name="phoneNumber"
                value={isEditing.phoneNumber ? formData.phoneNumber : userData?.phoneNumber || ""}
                onChange={handleInputChange}
                placeholder={personalInfo.placeholders.phoneNumber}
                className={`input input-bordered w-full ${isRTL ? "text-right" : "text-left"}`}
                dir={isRTL ? "rtl" : "ltr"}
                readOnly={!isEditing.phoneNumber}
              />
            </div>
            {updateStatus.field === "phoneNumber" && updateStatus.error && (
              <div className="mt-2 text-error text-sm">{updateStatus.error}</div>
            )}
            {updateStatus.field === "phoneNumber" && updateStatus.success && (
              <div className="mt-2 text-success text-sm">
                {personalInfo.messages?.updateSuccess || "Updated successfully"}
              </div>
            )}
          </div>

          {/* Email Field */}
          <div className="form-control mb-4">
            <label className={`label justify-end`}>
              <span className="label-text">
                {personalInfo.labels.email}
                <span className="text-error">*</span>
              </span>
            </label>
            <div className={`flex gap-4 ${isRTL ? "flex-row" : "flex-row-reverse"}`}>
              {isEditing.email ? (
                <div className={`flex gap-2 ${isRTL ? "" : "order-last"}`}>
                  <button
                    className={`btn btn-sm btn-primary ${updateStatus.loading && updateStatus.field === "email" ? "loading" : ""}`}
                    onClick={() => handleSave("email")}
                    disabled={updateStatus.loading || !!emailError}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => toggleEdit("email")}
                    disabled={updateStatus.loading && updateStatus.field === "email"}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button className={`btn btn-sm ${isRTL ? "" : "order-last"}`} onClick={() => toggleEdit("email")}>
                  {personalInfo.buttons.edit}
                </button>
              )}
              <input
                type="email"
                name="email"
                value={isEditing.email ? formData.email : userData?.email || ""}
                onChange={handleInputChange}
                placeholder={personalInfo.placeholders.email}
                className={`input input-bordered w-full ${isRTL ? "text-right" : "text-left"} ${emailError && isEditing.email ? "input-error animate-shake" : ""}`}
                dir={isRTL ? "rtl" : "ltr"}
                readOnly={!isEditing.email}
              />
            </div>
            {updateStatus.field === "email" && updateStatus.error && (
              <div className="mt-2 text-error text-sm">{updateStatus.error}</div>
            )}
            {updateStatus.field === "email" && updateStatus.success && (
              <div className="mt-2 text-success text-sm">
                {personalInfo.messages?.updateSuccess || "Updated successfully"}
              </div>
            )}
            {emailError && isEditing.email && <div className="mt-2 text-error text-sm">{emailError}</div>}
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
                className={`input input-bordered w-full ${isRTL ? "text-right" : "text-left"}`}
                dir={isRTL ? "rtl" : "ltr"}
                readOnly
              />
            </div>
          )}

          {/* Points display for students */}
          {userData?.role === "Student" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="stat bg-base-200 rounded-box">
                <div className="stat-title">{personalInfo.labels.generalPoints || t("General Points")}</div>
                <div className="stat-value">{userData.generalPoints || 0}</div>
              </div>
              <div className="stat bg-base-200 rounded-box">
                <div className="stat-title">{personalInfo.labels.totalPoints || t("Total Points")}</div>
                <div className="stat-value">{userData.totalPoints || 0}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PersonalInfoSection
