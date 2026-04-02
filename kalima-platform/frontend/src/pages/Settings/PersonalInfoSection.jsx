"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Camera, Upload, X } from "lucide-react"
import SectionHeader from "./SectionHeader"
import { getUserDashboard } from "../../routes/auth-services"
import { updateCurrentUser } from "../../routes/update-user"
import { resolveProfileImageUrl } from "../../utils/profileImage"
import { designTokens } from "../../constants/designTokens"
import { resolveLevelDisplayName } from "../../utils/levelHierarchy"

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

function ProfileField({ label, value, isRTL, type = "text" }) {
  return (
    <div className="form-control mb-4">
      <label className={`label pb-1 ${isRTL ? "justify-end" : "justify-start"}`}>
        <span className="label-text">{label}</span>
      </label>
      <div className="w-full">
        <input
          type={type}
          value={value ?? ""}
          className={`input input-bordered w-full max-w-2xl bg-base-200/40 cursor-default ${isRTL ? "text-right" : "text-left"}`}
          dir={isRTL ? "rtl" : "ltr"}
          readOnly
        />
      </div>
    </div>
  )
}

function PersonalInfoSection() {
  const { t, i18n } = useTranslation("settings")
  const isRTL = i18n.language === "ar"
  const TOKENS = designTokens.colors
  const SHADOWS = designTokens.shadows
  const profilePicInputRef = useRef(null)
  const profilePicSuccessTimerRef = useRef(null)

  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [profilePicFile, setProfilePicFile] = useState(null)
  const [profilePicPreview, setProfilePicPreview] = useState(null)
  const [profilePicUploading, setProfilePicUploading] = useState(false)
  const [profilePicStatus, setProfilePicStatus] = useState({
    success: false,
    error: null,
  })

  const personalInfo = t("personalInfo", { returnObjects: true })
  const normalizedRole = String(userData?.role || "").trim().toLowerCase()
  const isStudentRole = normalizedRole === "student"
  const isParentRole = normalizedRole === "parent"

  const clearProfilePicInput = () => {
    if (profilePicInputRef.current) {
      profilePicInputRef.current.value = ""
    }
  }

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true)
      try {
        const result = await getUserDashboard()
        if (result.success) {
          const userInfo = result.data?.data?.userInfo || result.data?.userInfo
          setUserData(userInfo || null)
        } else {
          setError(result.error || "Failed to fetch user data")
        }
      } catch (err) {
        console.error("Error fetching user data:", err)
        setError("An error occurred while fetching your information")
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  useEffect(() => {
    return () => {
      if (profilePicPreview) {
        URL.revokeObjectURL(profilePicPreview)
      }
    }
  }, [profilePicPreview])

  useEffect(() => {
    return () => {
      if (profilePicSuccessTimerRef.current) {
        clearTimeout(profilePicSuccessTimerRef.current)
      }
    }
  }, [])

  const handleProfilePicChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      clearProfilePicInput()
      setProfilePicStatus({
        success: false,
        error: t("validation.invalidImageType") || "Please select a valid image file (JPEG, PNG, GIF)",
      })
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      clearProfilePicInput()
      setProfilePicStatus({
        success: false,
        error: t("validation.fileTooLarge") || "File size must be less than 5MB",
      })
      return
    }

    if (profilePicSuccessTimerRef.current) {
      clearTimeout(profilePicSuccessTimerRef.current)
      profilePicSuccessTimerRef.current = null
    }

    setProfilePicFile(file)
    setProfilePicStatus({ success: false, error: null })
    setProfilePicPreview(URL.createObjectURL(file))
  }

  const handleProfilePicUpload = async () => {
    if (!profilePicFile) return

    setProfilePicUploading(true)
    setProfilePicStatus({ success: false, error: null })

    try {
      const uploadData = new FormData()
      uploadData.append("profilePic", profilePicFile)

      const result = await updateCurrentUser(uploadData)

      if (result.success) {
        const updatedProfilePic =
          result.data?.data?.user?.profilePic ||
          result.data?.data?.profilePic ||
          result.data?.profilePic ||
          result.data?.user?.profilePic ||
          null

        setUserData((prev) => ({
          ...(prev || {}),
          profilePic: updatedProfilePic || prev?.profilePic || null,
        }))
        setProfilePicFile(null)
        setProfilePicPreview(null)
        clearProfilePicInput()
        setProfilePicStatus({ success: true, error: null })

        if (profilePicSuccessTimerRef.current) {
          clearTimeout(profilePicSuccessTimerRef.current)
        }

        profilePicSuccessTimerRef.current = setTimeout(() => {
          setProfilePicStatus((prev) => ({
            ...prev,
            success: false,
          }))
          profilePicSuccessTimerRef.current = null
        }, 3000)
      } else {
        setProfilePicStatus({
          success: false,
          error: result.error || "Failed to upload profile picture",
        })
      }
    } catch (err) {
      console.error("Error uploading profile picture:", err)
      setProfilePicStatus({
        success: false,
        error: "An unexpected error occurred while uploading",
      })
    } finally {
      setProfilePicUploading(false)
    }
  }

  const cancelProfilePicUpload = () => {
    setProfilePicFile(null)
    setProfilePicPreview(null)
    setProfilePicStatus({ success: false, error: null })
    clearProfilePicInput()

    if (profilePicSuccessTimerRef.current) {
      clearTimeout(profilePicSuccessTimerRef.current)
      profilePicSuccessTimerRef.current = null
    }
  }

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
          <div className="alert alert-error">
            <span>{error}</span>
            <button className="btn btn-sm btn-outline" onClick={() => window.location.reload()}>
              {t("retry")}
            </button>
          </div>
        </div>
      </section>
    )
  }

  const hasProfilePic = Boolean(userData?.profilePic)
  const currentProfilePicUrl = resolveProfileImageUrl(userData?.profilePic)

  const studentLevelLabel = (() => {
    if (!isStudentRole) return ""

    const stageLabel = resolveLevelDisplayName(userData?.stage, i18n.language)
    const levelLabel = resolveLevelDisplayName(userData?.level, i18n.language)

    if (!stageLabel && !levelLabel) {
      return t("gradeLevels.undefined", { ns: "common", defaultValue: "" })
    }

    if (stageLabel && levelLabel) {
      return `${stageLabel} / ${levelLabel}`
    }

    return levelLabel || stageLabel
  })()

  const studentHobbyLabel = (() => {
    if (!isStudentRole) return ""
    const normalizedHobby = extractStudentHobby(userData)
    if (!normalizedHobby) return ""
    return t(`personalInfo.hobbyOptions.${normalizedHobby}`, { defaultValue: normalizedHobby })
  })()

  const roleLabel = t(`role.${normalizedRole}`, {
    ns: "common",
    defaultValue: userData?.role || "",
  })

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
          <h3
            className={`mb-4 text-base font-semibold md:text-lg ${isRTL ? "text-right" : "text-left"}`}
            style={{ color: TOKENS.slateText }}
          >
            {personalInfo.subtitle}
          </h3>

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

              {!profilePicFile && (
                <label
                  htmlFor="profilePicInput"
                  className="absolute bottom-0 right-0 btn btn-circle btn-sm btn-primary cursor-pointer"
                  title={t("personalInfo.uploadProfilePic") || "Upload Profile Picture"}
                >
                  <Camera className="w-4 h-4" />
                </label>
              )}
            </div>

            <input
              ref={profilePicInputRef}
              id="profilePicInput"
              type="file"
              accept="image/*"
              onChange={handleProfilePicChange}
              className="hidden"
            />

            {profilePicFile && (
              <div className="mt-4 flex flex-col items-center gap-2">
                <div className="text-sm text-gray-600">
                  {t("personalInfo.selectedFile") || "Selected:"} {profilePicFile.name}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`btn btn-primary btn-sm ${profilePicUploading ? "loading" : ""}`}
                    onClick={handleProfilePicUpload}
                    disabled={profilePicUploading}
                  >
                    {!profilePicUploading && <Upload className="w-4 h-4" />}
                    {t("personalInfo.uploadButton") || "Upload"}
                  </button>
                  <button
                    type="button"
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

            {profilePicStatus.error && (
              <div className="mt-2 text-error text-sm text-center">{profilePicStatus.error}</div>
            )}
            {profilePicStatus.success && (
              <div className="mt-2 text-success text-sm text-center">
                {t("personalInfo.profilePicUpdated") || "Profile picture updated successfully!"}
              </div>
            )}

            {!hasProfilePic && !profilePicFile && (
              <div className="mt-2 text-sm text-gray-500 text-center">
                {t("personalInfo.noProfilePicHint") || "Click the camera icon to upload a profile picture"}
              </div>
            )}
          </div>

          <div className="mb-4 flex justify-end">
            <div className="badge badge-primary badge-lg">{roleLabel}</div>
          </div>

          <ProfileField
            label={personalInfo.labels.fullName}
            value={userData?.name || ""}
            isRTL={isRTL}
          />
          <ProfileField
            label={personalInfo.labels.phoneNumber}
            value={userData?.phoneNumber || ""}
            isRTL={isRTL}
          />
          <ProfileField
            label={personalInfo.labels.email}
            value={userData?.email || ""}
            isRTL={isRTL}
            type="email"
          />

          {isParentRole && (
            <ProfileField
              label={personalInfo.labels.profession || "Profession"}
              value={userData?.profession || ""}
              isRTL={isRTL}
            />
          )}

          {isStudentRole && (
            <ProfileField
              label={personalInfo.labels.hobby || "Hobby"}
              value={studentHobbyLabel}
              isRTL={isRTL}
            />
          )}

          {isStudentRole && userData?.level && (
            <ProfileField
              label={personalInfo.labels.level || "Level"}
              value={studentLevelLabel}
              isRTL={isRTL}
            />
          )}

          {isStudentRole && (
            <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2">
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
