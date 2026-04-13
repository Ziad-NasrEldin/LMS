"use client"

import { useState, useEffect } from "react"
import SectionHeader from "./SectionHeader"
import { useTranslation } from "react-i18next"
import { getUserDashboard } from "../../routes/auth-services"
import { updateCurrentUser } from "../../routes/update-user"
import { Check, X, Camera, Upload, Pencil } from "lucide-react"
import { resolveProfileImageUrl } from "../../utils/profileImage"
import { translateErrorMessage } from "../../utils/errorTranslator"
import { designTokens } from "../../constants/designTokens"
import { getStageDisplayName, resolveLevelDisplayName } from "../../utils/levelHierarchy"
import DSSelect from "../../components/DSSelect"
import Button from "../../components/ui/Button"
import Input from "../../components/ui/Input"
import Badge from "../../components/ui/Badge"

const SIGNUP_HOBBY_OPTIONS = [
  "math",
  "programming",
  "art",
  "languages",
  "photography",
  "montage",
  "designillustrating",
  "marketing",
  "other",
]

const HOBBY_ALIASES = {
  "design/illustrating": "designillustrating",
  "design-illustrating": "designillustrating",
  "design_illustrating": "designillustrating",
  designillustrating: "designillustrating",
  designillustratings: "designillustrating",
}

const normalizeHobbyValue = (value) => {
  if (!value) return ""
  const raw = String(value).trim().toLowerCase()
  if (!raw) return ""
  return HOBBY_ALIASES[raw] || raw
}

const extractStudentHobby = (source) => {
  if (!source) return ""

  const directHobby = normalizeHobbyValue(source.hobby)
  if (directHobby) return directHobby

  if (Array.isArray(source.hobbies) && source.hobbies.length > 0) {
    const firstHobby = normalizeHobbyValue(source.hobbies[0])
    if (firstHobby) return firstHobby
  }

  if (typeof source.hobbies === "string") {
    return normalizeHobbyValue(source.hobbies)
  }

  return ""
}

const LECTURER_SOCIAL_PLATFORM_OPTIONS = [
  "Facebook",
  "Instagram",
  "Twitter",
  "LinkedIn",
  "TikTok",
  "YouTube",
  "WhatsApp",
  "Telegram",
]

const createEmptySocialMediaEntry = () => ({ platform: "", account: "" })

const normalizeSocialMediaEntries = (socialMedia) => {
  if (!Array.isArray(socialMedia)) return []

  return socialMedia
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null
      return {
        platform: String(entry.platform || "").trim(),
        account: String(entry.account || "").trim(),
      }
    })
    .filter(Boolean)
}

const sanitizeLecturerSocialMediaForSave = (socialMedia) => {
  const normalizedEntries = normalizeSocialMediaEntries(socialMedia)
    .filter((entry) => entry.platform && entry.account)
    .filter((entry) => LECTURER_SOCIAL_PLATFORM_OPTIONS.includes(entry.platform))

  const byPlatform = new Map()
  normalizedEntries.forEach((entry) => {
    byPlatform.set(entry.platform, entry)
  })

  return Array.from(byPlatform.values())
}

const resolveSocialMediaPreviewUrl = (platform, account) => {
  const rawAccount = String(account || "").trim()
  if (!rawAccount) return ""
  if (/^https?:\/\//i.test(rawAccount)) return rawAccount

  const cleanedAccount = rawAccount.replace(/^@/, "")
  if (!cleanedAccount) return ""

  switch (platform) {
    case "Facebook":
      return `https://www.facebook.com/${cleanedAccount}`
    case "Instagram":
      return `https://www.instagram.com/${cleanedAccount}`
    case "Twitter":
      return `https://x.com/${cleanedAccount}`
    case "LinkedIn":
      return cleanedAccount.startsWith("in/") || cleanedAccount.startsWith("company/")
        ? `https://www.linkedin.com/${cleanedAccount}`
        : `https://www.linkedin.com/in/${cleanedAccount}`
    case "TikTok":
      return `https://www.tiktok.com/@${cleanedAccount}`
    case "YouTube":
      return `https://www.youtube.com/${cleanedAccount}`
    case "WhatsApp":
      return `https://wa.me/${cleanedAccount.replace(/\D/g, "")}`
    case "Telegram":
      return `https://t.me/${cleanedAccount}`
    default:
      return ""
  }
}

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
    hobby: "",
    socialMedia: [],
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
          error: translateErrorMessage(result.error || "Failed to upload profile picture"),
        })
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error)
      setUpdateStatus({
        loading: false,
        success: false,
        error: translateErrorMessage("An unexpected error occurred while uploading"),
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
            hobby: extractStudentHobby(userInfo),
            socialMedia: normalizeSocialMediaEntries(userInfo.socialMedia),
            profilePic: null,
          })
        } else {
          setError(translateErrorMessage(result.error || "Failed to fetch user data"))
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        setError(translateErrorMessage("An error occurred while fetching your information"))
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

  const handleSocialMediaChange = (index, field, value) => {
    setFormData((prev) => {
      const currentLinks =
        Array.isArray(prev.socialMedia) && prev.socialMedia.length > 0
          ? [...prev.socialMedia]
          : [createEmptySocialMediaEntry()]

      currentLinks[index] = {
        ...(currentLinks[index] || createEmptySocialMediaEntry()),
        [field]: value,
      }

      return {
        ...prev,
        socialMedia: currentLinks,
      }
    })
  }

  const addSocialMediaEntry = () => {
    setFormData((prev) => ({
      ...prev,
      socialMedia: [...normalizeSocialMediaEntries(prev.socialMedia), createEmptySocialMediaEntry()],
    }))
  }

  const removeSocialMediaEntry = (indexToRemove) => {
    setFormData((prev) => {
      const currentLinks = normalizeSocialMediaEntries(prev.socialMedia)

      if (currentLinks.length <= 1) {
        return {
          ...prev,
          socialMedia: [createEmptySocialMediaEntry()],
        }
      }

      return {
        ...prev,
        socialMedia: currentLinks.filter((_, index) => index !== indexToRemove),
      }
    })
  }

  const startEditing = () => {
    const normalizedRole = String(userData?.role || "").trim().toLowerCase()
    const isRestrictedSettingsRole = ["student", "parent", "teacher"].includes(normalizedRole)
    if (isRestrictedSettingsRole) return

    const isAdminRole = ["admin", "subadmin"].includes(normalizedRole)
    if (isAdminRole) {
      setUpdateStatus({
        loading: false,
        success: false,
        error: i18n.language === "ar" 
          ? "لا يمكن للمشرف تعديل بياناته من هنا. يرجى التواصل مع مسؤول النظام."
          : "Admin cannot edit their credentials from here. Please contact system administrator."
      })
      return
    }

    setFormData((prev) => ({
      ...prev,
      fullName: userData?.name || "",
      phoneNumber: userData?.phoneNumber || "",
      email: userData?.email || "",
      hobby: extractStudentHobby(userData),
      socialMedia: normalizeSocialMediaEntries(userData?.socialMedia),
    }))
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setFormData((prev) => ({
      ...prev,
      fullName: userData?.name || "",
      phoneNumber: userData?.phoneNumber || "",
      email: userData?.email || "",
      hobby: extractStudentHobby(userData),
      socialMedia: normalizeSocialMediaEntries(userData?.socialMedia),
    }))
    setEmailError("")
    setIsEditing(false)
    setUpdateStatus({ loading: false, success: false, error: null })
  }

  const handleSaveAll = async () => {
    const normalizedRole = String(userData?.role || "").trim().toLowerCase()
    const isRestrictedSettingsRole = ["student", "parent", "teacher"].includes(normalizedRole)
    if (isRestrictedSettingsRole) return

    const isAdminRole = ["admin", "subadmin"].includes(normalizedRole)
    if (isAdminRole) {
      setUpdateStatus({
        loading: false,
        success: false,
        error: i18n.language === "ar" 
          ? "لا يمكن للمشرف تعديل بياناته من هنا. يرجى التواصل مع مسؤول النظام."
          : "Admin cannot edit their credentials from here. Please contact system administrator."
      })
      return
    }

    if (emailError) return

    const isStudentRole = normalizedRole === "student"
    const isLecturerRole = normalizedRole === "lecturer"

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

      if (isStudentRole) {
        const nextHobby = extractStudentHobby({ hobby: formData.hobby })
        if (nextHobby) {
          updateData.hobby = nextHobby
        }
      }

      if (isLecturerRole) {
        updateData.socialMedia = sanitizeLecturerSocialMediaForSave(formData.socialMedia)
      }

      const result = await updateCurrentUser(updateData)

      if (result.success) {
        const updatedUserFromPatch = result.data?.data?.user || null
        const updatedHobbyFromPatch = extractStudentHobby(updatedUserFromPatch)

        if (updatedUserFromPatch) {
          setUserData((prev) => ({
            ...(prev || {}),
            ...updatedUserFromPatch,
            hobby: updatedHobbyFromPatch || extractStudentHobby(prev) || extractStudentHobby({ hobby: formData.hobby }),
          }))
        }

        const refreshResult = await getUserDashboard()

        if (refreshResult.success) {
          const refreshedUserInfo = refreshResult.data?.data?.userInfo || null

          if (refreshedUserInfo) {
            const refreshedHobby = extractStudentHobby(refreshedUserInfo)
            const fallbackHobby =
              refreshedHobby ||
              updatedHobbyFromPatch ||
              extractStudentHobby({ hobby: formData.hobby }) ||
              extractStudentHobby(userData)

            setUserData((prev) => ({
              ...(prev || {}),
              ...refreshedUserInfo,
              hobby: fallbackHobby,
            }))
            setFormData((prev) => ({
              ...prev,
              fullName: refreshedUserInfo.name || "",
              phoneNumber: refreshedUserInfo.phoneNumber || "",
              email: refreshedUserInfo.email || "",
              hobby: fallbackHobby,
              socialMedia: normalizeSocialMediaEntries(refreshedUserInfo.socialMedia),
            }))
          }
        } else {
          setUserData((prev) => ({
            ...prev,
            name: formData.fullName,
            phoneNumber: formData.phoneNumber,
            email: formData.email,
            hobby: isStudentRole ? extractStudentHobby({ hobby: formData.hobby }) || extractStudentHobby(prev) : prev.hobby,
            socialMedia: isLecturerRole
              ? sanitizeLecturerSocialMediaForSave(formData.socialMedia)
              : normalizeSocialMediaEntries(prev?.socialMedia),
          }))
        }

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
          error: translateErrorMessage(result.error || "Failed to update"),
        })
      }
    } catch (error) {
      console.error("Error updating user data:", error)
      setUpdateStatus({
        loading: false,
        success: false,
        error: translateErrorMessage("An unexpected error occurred"),
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
             <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm flex items-center gap-3">
               <span>{error}</span>
               <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                 {t("retry")}
               </Button>
             </div>
          </div>
        </div>
      </section>
    )
  }

  const hasProfilePic = userData?.profilePic
  const currentProfilePicUrl = resolveProfileImageUrl(userData?.profilePic)

  const studentLevelLabel = (() => {
    if (String(userData?.role || "").trim().toLowerCase() !== "student") return ""

    const levelValue = userData?.level
    if (!levelValue) {
      return t("gradeLevels.undefined", { ns: "common", defaultValue: "" })
    }

    if (isRTL && typeof levelValue === "object" && levelValue?.nameAr) {
      return String(levelValue.nameAr).trim()
    }

    const rawLevelName = String(typeof levelValue === "string" ? levelValue : levelValue?.name || "").trim()
    if (!rawLevelName) {
      return t("gradeLevels.undefined", { ns: "common", defaultValue: "" })
    }

    const typoAliases = {
      "fiest preparatory": "first preparatory",
      "frist preparatory": "first preparatory",
      "fierst preparatory": "first preparatory",
    }

    const normalizedLevelName = rawLevelName
      .replace(/\s+level$/i, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase()

    const canonicalLevelName = typoAliases[normalizedLevelName] || normalizedLevelName
    return t(`gradeLevels.${canonicalLevelName}`, {
      ns: "common",
      defaultValue: rawLevelName,
    })
  })()

  const studentHobbyLabel = (() => {
    const normalizedHobby = extractStudentHobby(userData) || extractStudentHobby({ hobby: formData.hobby })
    if (!normalizedHobby) return ""
    return t(`personalInfo.hobbyOptions.${normalizedHobby}`, { defaultValue: normalizedHobby })
  })()

  const studentHobbyOptions = (() => {
    const currentHobby = extractStudentHobby({ hobby: formData.hobby }) || extractStudentHobby(userData)
    if (!currentHobby || SIGNUP_HOBBY_OPTIONS.includes(currentHobby)) {
      return SIGNUP_HOBBY_OPTIONS
    }
    return [...SIGNUP_HOBBY_OPTIONS, currentHobby]
  })()

  const normalizedRole = String(userData?.role || "").trim().toLowerCase()
  const isStudentRole = normalizedRole === "student"
  const isParentRole = normalizedRole === "parent"
  const isLecturerRole = normalizedRole === "lecturer"
  const isRestrictedSettingsRole = ["student", "parent", "teacher"].includes(normalizedRole)
  const lecturerSavedSocialMedia = normalizeSocialMediaEntries(userData?.socialMedia)
  const lecturerEditingSocialMedia =
    Array.isArray(formData.socialMedia) && formData.socialMedia.length > 0
      ? formData.socialMedia
      : [createEmptySocialMediaEntry()]
  const parentChildProfiles = Array.isArray(userData?.childProfiles) ? userData.childProfiles : []

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
                   <Button
                     type="button"
                     variant="ghost"
                     size="sm"
                     className="absolute bottom-0 right-0 rounded-full p-2 cursor-pointer"
                     title={t("personalInfo.uploadProfilePic")}
                   >
                     <Camera className="w-4 h-4" />
                   </Button>
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
                  {t("personalInfo.selectedFile")} {formData.profilePic.name}
                </div>
                <div className="flex gap-2">
                      <Button
                        isLoading={profilePicUploading}
                        onClick={handleProfilePicUpload}
                        variant="primary"
                        size="sm"
                      >
                        {!profilePicUploading && <Upload className="w-4 h-4" />}
                        {t("personalInfo.uploadButton")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelProfilePicUpload}
                        isDisabled={profilePicUploading}
                      >
                        <X className="w-4 h-4" />
                        {t("personalInfo.cancelButton")}
                      </Button>

                </div>
              </div>
            )}

            {/* Upload status messages */}
            {updateStatus.error && !isEditing && (
              <div className="mt-2 text-error text-sm text-center">{updateStatus.error}</div>
            )}
            {updateStatus.success && !isEditing && (
              <div className="mt-2 text-success text-sm text-center">
                {t("personalInfo.profilePicUpdated")}
              </div>
            )}

            {/* Upload hint for users without profile picture */}
            {!hasProfilePic && !formData.profilePic && (
              <div className="mt-2 text-center text-sm text-slate-600">
                {t("personalInfo.noProfilePicHint")}
              </div>
            )}
          </div>

          {/* User Role Badge */}
           <div className="mb-4 flex justify-end">
              <Badge variant="primary" size="lg">
                {t(`role.${userData?.role?.toLowerCase()}`, { ns: "common" })}
              </Badge>
           </div>


          {!isRestrictedSettingsRole && (
            <div className={`mb-4 flex gap-2 ${isRTL ? "justify-start" : "justify-end"}`}>
               {!isEditing ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={startEditing}
                  >
                    <Pencil className="h-4 w-4" />
                    {personalInfo.buttons.edit}
                  </Button>
               ) : (
                 <>
                    <Button
                      isLoading={updateStatus.loading}
                      onClick={handleSaveAll}
                      isDisabled={updateStatus.loading || !!emailError}
                      variant="primary"
                      size="sm"
                    >
                      {!updateStatus.loading && <Check className="h-4 w-4" />}
                      {t("save")}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={cancelEditing} 
                      isDisabled={updateStatus.loading}
                    >
                      <X className="h-4 w-4" />
                      {t("cancel")}
                    </Button>
                 </>
               )}

            </div>
          )}

          {updateStatus.error && isEditing && <div className="mb-3 text-sm text-error">{updateStatus.error}</div>}
          {updateStatus.success && isEditing && <div className="mb-3 text-sm text-success">{personalInfo.messages?.updateSuccess}</div>}

          {/* Full Name Field */}
          <div className="form-control mb-4">
            <label className={`label pb-1 ${isRTL ? "justify-end" : "justify-start"}`}>
              <span className={`label-text ${isRTL ? "text-left" : "text-left"}`}>
                {personalInfo.labels.fullName}
                <span className="text-error">*</span>
              </span>
            </label>
            <div className="w-full">
               <Input
                 type="text"
                 name="fullName"
                 value={isEditing ? formData.fullName : userData?.name || ""}
                 onChange={handleInputChange}
                 placeholder={personalInfo.placeholders.fullName}
                 className={`w-full max-w-2xl ${isRTL ? "text-right" : "text-left"}`}
                 dir={isRTL ? "rtl" : "ltr"}
                 readOnly={!isEditing || isRestrictedSettingsRole}
               />
            </div>
          </div>

          {/* Phone Number Field */}
          <div className="form-control mb-4">
            <label className={`label pb-1 ${isRTL ? "justify-end" : "justify-start"}`}>
              <span className={`label-text ${isRTL ? "text-left" : "text-left"}`}>
                {personalInfo.labels.phoneNumber}
                <span className="text-error">*</span>
              </span>
            </label>
            <div className="w-full">
               <Input
                 type="text"
                 name="phoneNumber"
                 value={isEditing ? formData.phoneNumber : userData?.phoneNumber || ""}
                 onChange={handleInputChange}
                 placeholder={personalInfo.placeholders.phoneNumber}
                 className={`w-full max-w-2xl ${isRTL ? "text-right" : "text-left"}`}
                 dir={isRTL ? "rtl" : "ltr"}
                 readOnly={!isEditing || isRestrictedSettingsRole}
               />
            </div>
          </div>

          {/* Email Field */}
          <div className="form-control mb-4">
            <label className={`label pb-1 ${isRTL ? "justify-end" : "justify-start"}`}>
              <span className={`label-text ${isRTL ? "text-left" : "text-left"}`}>
                {personalInfo.labels.email}
                <span className="text-error">*</span>
              </span>
            </label>
            <div className="w-full">
               <Input
                 type="email"
                 name="email"
                 value={isEditing ? formData.email : userData?.email || ""}
                 onChange={handleInputChange}
                 placeholder={personalInfo.placeholders.email}
                 className={`w-full max-w-2xl ${isRTL ? "text-right" : "text-left"} ${emailError && isEditing ? "border-error animate-shake" : ""}`}
                 dir={isRTL ? "rtl" : "ltr"}
                 readOnly={!isEditing || isRestrictedSettingsRole}
               />
            </div>
            {emailError && isEditing && <div className="mt-2 text-error text-sm">{emailError}</div>}
          </div>

          {isLecturerRole && (
            <div className="form-control mb-4">
              <label className={`label pb-1 ${isRTL ? "justify-end" : "justify-start"}`}>
                <span className={`label-text ${isRTL ? "text-left" : "text-left"}`}>
                  {personalInfo.labels.socialMedia}
                </span>
              </label>

              <div className="w-full max-w-2xl">
                {isEditing ? (
                  <div className="space-y-3">
                    {lecturerEditingSocialMedia.map((social, index) => (
                      <div
                        key={`${social.platform}-${index}`}
                        className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)_3rem] sm:items-center"
                      >
                        <DSSelect
                          value={social.platform || ""}
                          onChange={(event) => handleSocialMediaChange(index, "platform", event.target.value)}
                          className={`select select-bordered w-full ${isRTL ? "text-right" : "text-left"}`}
                          dir={isRTL ? "rtl" : "ltr"}
                        >
                          <option value="">
                            {personalInfo.placeholders?.socialPlatform}
                          </option>
                          {LECTURER_SOCIAL_PLATFORM_OPTIONS.map((platform) => (
                            <option key={platform} value={platform}>
                              {platform}
                            </option>
                          ))}
                        </DSSelect>

                        <input
                          type="text"
                          value={social.account || ""}
                          onChange={(event) => handleSocialMediaChange(index, "account", event.target.value)}
                          placeholder={
                            personalInfo.placeholders?.socialLink
                          }
                          className={`input input-bordered w-full ${isRTL ? "text-right" : "text-left"}`}
                          dir={isRTL ? "rtl" : "ltr"}
                        />

                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             className="aspect-square p-0"
                             onClick={removeSocialMediaEntry}
                             title={t("remove")}
                           >
                             <X className="h-4 w-4" />
                           </Button>
                         </div>
                       ))}
 
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={addSocialMediaEntry}
                      >
                        {personalInfo.buttons?.addSocialMedia || personalInfo.buttons?.add}
                      </Button>

                  </div>
                ) : lecturerSavedSocialMedia.length > 0 ? (
                  <div className="space-y-2">
                    {lecturerSavedSocialMedia.map((social, index) => {
                      const href = resolveSocialMediaPreviewUrl(social.platform, social.account)

                       if (!href) {
                         return (
                           <div
                             key={`${social.platform}-${index}`}
                             className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                           >
                             <span className="font-semibold">{social.platform}</span>
                             <span className="truncate text-slate-900/75">{social.account}</span>
                           </div>
                         )
                       }
 
                       return (
                         <a
                           key={`${social.platform}-${index}`}
                           href={href}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
                         >
                           <span className="font-semibold">{social.platform}</span>
                           <span className="truncate text-slate-900/75">{social.account}</span>
                         </a>
                       )

                    })}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={personalInfo.messages?.noSocialMedia}
                    className={`input input-bordered w-full ${isRTL ? "text-right" : "text-left"}`}
                    dir={isRTL ? "rtl" : "ltr"}
                    readOnly
                  />
                )}
              </div>
            </div>
          )}

          {userData?.role === "Parent" && (
            <div className="form-control mb-4">
              <label className={`label pb-1 ${isRTL ? "justify-end" : "justify-start"}`}>
                <span className={`label-text ${isRTL ? "text-left" : "text-left"}`}>{personalInfo.labels.profession}</span>
              </label>
              <div className="w-full">
                <input
                  type="text"
                  value={userData?.profession || ""}
                  className={`input input-bordered w-full max-w-2xl ${isRTL ? "text-right" : "text-left"}`}
                  dir={isRTL ? "rtl" : "ltr"}
                  readOnly
                />
              </div>
            </div>
          )}

          {isParentRole && (
            <div className="form-control mb-4">
              <label className={`label pb-1 ${isRTL ? "justify-end" : "justify-start"}`}>
                <span className={`label-text ${isRTL ? "text-left" : "text-left"}`}>
                  {personalInfo.labels.childCount || (isRTL ? "عدد الأبناء" : "Number of children")}
                </span>
              </label>
              <div className="w-full">
                <input
                  type="text"
                  value={String(userData?.childCount || parentChildProfiles.length || 0)}
                  className={`input input-bordered w-full max-w-2xl ${isRTL ? "text-right" : "text-left"}`}
                  dir={isRTL ? "rtl" : "ltr"}
                  readOnly
                />
              </div>
            </div>
          )}

          {isParentRole && parentChildProfiles.length > 0 && (
            <div className="form-control mb-4">
              <label className={`label pb-1 ${isRTL ? "justify-end" : "justify-start"}`}>
                <span className={`label-text ${isRTL ? "text-left" : "text-left"}`}>
                  {personalInfo.labels.childProfiles || (isRTL ? "بيانات الأبناء الدراسية" : "Children education details")}
                </span>
              </label>
              <div className="w-full max-w-2xl space-y-3">
                {parentChildProfiles.map((profile, index) => {
                  const stageLabel = getStageDisplayName(profile?.stage, i18n.language)
                  const levelLabel = resolveLevelDisplayName(profile?.level, i18n.language)

                  return (
                    <div key={`settings-child-profile-${index}`} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <div className="text-sm font-semibold text-slate-900">
                        {(personalInfo.labels.childProfileItem || (isRTL ? "الابن" : "Child"))} {index + 1}
                      </div>
                      <div className="mt-2 text-sm text-slate-700">
                        {(personalInfo.labels.stage || (isRTL ? "المرحلة" : "Stage"))}: {stageLabel || "-"}
                      </div>
                      <div className="mt-1 text-sm text-slate-700">
                        {(personalInfo.labels.gradeLevel || (isRTL ? "الصف الدراسي" : "Grade level"))}: {levelLabel || "-"}
                      </div>
                      {profile?.sequenceId && (
                        <div className="mt-1 text-sm text-slate-700">
                          {(personalInfo.labels.childSequenceId || (isRTL ? "رقم تسلسل الابن" : "Child sequence ID"))}: {profile.sequenceId}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Student-specific fields */}
          {isStudentRole && (
            <div className="form-control mb-4">
              <label className={`label pb-1 ${isRTL ? "justify-end" : "justify-start"}`}>
                <span className={`label-text ${isRTL ? "text-left" : "text-left"}`}>{personalInfo.labels.hobby}</span>
              </label>

              <div className="w-full">
                {isEditing ? (
                   <DSSelect
                     name="hobby"
                     value={formData.hobby || ""}
                     onChange={handleInputChange}
                     className={`border border-slate-200 w-full max-w-2xl ${isRTL ? "text-right" : "text-left"}`}
                     dir={isRTL ? "rtl" : "ltr"}
                   >
                    <option value="">{personalInfo.placeholders?.hobby}</option>
                    {studentHobbyOptions.map((option) => (
                      <option key={option} value={option}>
                        {t(`personalInfo.hobbyOptions.${option}`, { defaultValue: option })}
                      </option>
                    ))}
                  </DSSelect>
                ) : (
                   <input
                     type="text"
                     value={studentHobbyLabel}
                     className={`border border-slate-200 w-full max-w-2xl ${isRTL ? "text-right" : "text-left"}`}
                     dir={isRTL ? "rtl" : "ltr"}
                     readOnly
                   />
                )}
              </div>
            </div>
          )}

          {isStudentRole && userData?.level && (
            <div className="form-control mb-4">
              <label className={`label pb-1 ${isRTL ? "justify-end" : "justify-start"}`}>
                <span className={`label-text ${isRTL ? "text-left" : "text-left"}`}>{personalInfo.labels.level}</span>
              </label>
              <div className="w-full">
                   <input
                     type="text"
                     value={studentLevelLabel}
                     className={`border border-slate-200 w-full max-w-2xl ${isRTL ? "text-right" : "text-left"}`}
                     dir={isRTL ? "rtl" : "ltr"}
                     readOnly
                   />
              </div>
            </div>
          )}

          {/* Balance display for students */}
          {isStudentRole && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
               <div className="rounded-2xl p-4" style={{ background: TOKENS.neutralCloud }}>
                <div className="text-xs font-semibold text-slate-700">{personalInfo.labels.generalPoints}</div>
                 <div className="text-2xl font-bold">{userData.generalPoints || 0}</div>
               </div>
               <div className="rounded-2xl p-4" style={{ background: TOKENS.neutralCloud }}>
                <div className="text-xs font-semibold text-slate-700">{personalInfo.labels.totalPoints}</div>
                 <div className="text-2xl font-bold">{userData.totalPoints || 0}</div>
               </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default PersonalInfoSection
