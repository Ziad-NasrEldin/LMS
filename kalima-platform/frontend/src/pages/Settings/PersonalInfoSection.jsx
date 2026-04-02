"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Camera, Check, Upload, X } from "lucide-react"
import SectionHeader from "./SectionHeader"
import { getUserDashboard } from "../../routes/auth-services"
import { updateCurrentUser } from "../../routes/update-user"
import { resolveProfileImageUrl } from "../../utils/profileImage"
import { designTokens } from "../../constants/designTokens"

const COLORS = designTokens.colors
const SHADOWS = designTokens.shadows

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

const isEmptyValue = (value) =>
  value === null || value === undefined || (typeof value === "string" && value.trim() === "")

const getObjectLabel = (value, isRTL) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return ""
  }

  if (isRTL) {
    return value.nameAr || value.name || value.title || value.label || ""
  }

  return value.name || value.nameAr || value.title || value.label || ""
}

const formatLevelValue = (value, isRTL, t) => {
  if (isEmptyValue(value)) {
    return ""
  }

  if (typeof value === "object") {
    return getObjectLabel(value, isRTL)
  }

  const raw = String(value).trim()
  if (!raw) {
    return ""
  }

  const normalized = raw.replace(/\s+level$/i, "").replace(/\s+/g, " ").trim()
  const translated = t(`gradeLevels.${normalized}`, { ns: "common", defaultValue: "" })
  if (translated) {
    return translated
  }

  const lowerTranslated = t(`gradeLevels.${normalized.toLowerCase()}`, { ns: "common", defaultValue: "" })
  return lowerTranslated || raw
}

const formatHobbyValue = (value, t) => {
  if (isEmptyValue(value)) {
    return ""
  }

  const raw = String(value).trim()
  if (!raw) {
    return ""
  }

  const normalized = normalizeHobbyValue(raw)
  const translated = t(`personalInfo.hobbyOptions.${normalized}`, { defaultValue: "" })
  return translated || raw
}

const formatChildrenValue = (children, isRTL) => {
  if (!Array.isArray(children) || children.length === 0) {
    return ""
  }

  return children
    .map((child) => {
      if (!child) return ""
      if (typeof child === "string") return child
      if (typeof child !== "object") return String(child)

      const childName = isRTL ? child.nameAr || child.name : child.name || child.nameAr
      const childId = child.sequencedId ? `#${child.sequencedId}` : ""
      const childLevel = child.level
        ? `(${
            typeof child.level === "object"
              ? isRTL
                ? child.level.nameAr || child.level.name || ""
                : child.level.name || child.level.nameAr || ""
              : child.level
          })`
        : ""

      return [childName || childId, childId && childName ? childId : "", childLevel]
        .filter(Boolean)
        .join(" ")
        .trim()
    })
    .filter(Boolean)
    .join("\n")
}

const formatNumberValue = (value, locale) => {
  if (isEmptyValue(value)) {
    return ""
  }

  const numberValue = Number(value)
  if (Number.isNaN(numberValue)) {
    return String(value)
  }

  return new Intl.NumberFormat(locale).format(numberValue)
}

function ProfileField({ label, value, isRTL, multiline = false, className = "" }) {
  const hasValue = !isEmptyValue(value)

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="text-sm font-medium" style={{ color: COLORS.slateText }}>
        {label}
      </div>
      <div
        className="rounded-2xl border px-4 py-3"
        style={{
          background: "rgba(248,243,233,0.82)",
          borderColor: "rgba(17,24,39,0.10)",
        }}
      >
        <p
          className={[
            "text-sm md:text-base leading-6 break-words",
            isRTL ? "text-right" : "text-left",
            multiline ? "whitespace-pre-wrap" : "whitespace-normal",
          ].join(" ")}
          style={{ color: COLORS.inkText }}
        >
          {hasValue ? value : "-"}
        </p>
      </div>
    </div>
  )
}

function PersonalInfoSection() {
  const { t, i18n } = useTranslation("settings")
  const isRTL = i18n.language === "ar"
  const numberLocale = isRTL ? "ar-EG" : "en-US"

  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedProfilePic, setSelectedProfilePic] = useState(null)
  const [profilePicPreview, setProfilePicPreview] = useState(null)
  const [profilePicUploading, setProfilePicUploading] = useState(false)
  const [profilePicStatus, setProfilePicStatus] = useState({ type: null, message: "" })

  const fileInputRef = useRef(null)
  const successTimerRef = useRef(null)
  const mountedRef = useRef(true)

  const clearSuccessTimer = () => {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current)
      successTimerRef.current = null
    }
  }

  const queueSuccessMessage = (message) => {
    clearSuccessTimer()
    setProfilePicStatus({ type: "success", message })
    successTimerRef.current = setTimeout(() => {
      setProfilePicStatus((current) =>
        current.type === "success" ? { type: null, message: "" } : current
      )
    }, 3000)
  }

  const loadUserData = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await getUserDashboard()
      if (!mountedRef.current) return

      if (result.success) {
        setUserData(result.data?.data?.userInfo || null)
      } else {
        setError(result.error || "Failed to fetch user data")
      }
    } catch (fetchError) {
      console.error("Error fetching user data:", fetchError)
      if (mountedRef.current) {
        setError("An error occurred while fetching your information")
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    mountedRef.current = true
    void loadUserData()

    return () => {
      mountedRef.current = false
      clearSuccessTimer()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => {
      if (profilePicPreview) {
        URL.revokeObjectURL(profilePicPreview)
      }
    }
  }, [profilePicPreview])

  const role = String(userData?.role || "").trim().toLowerCase()
  const isStudentRole = role === "student"
  const isParentRole = role === "parent"
  const isTeacherRole = role === "teacher"
  const isLecturerRole = role === "lecturer"
  const roleLabel = t(`role.${role}`, {
    ns: "common",
    defaultValue: role ? role.charAt(0).toUpperCase() + role.slice(1) : "",
  })
  const currentProfilePicUrl = resolveProfileImageUrl(userData?.profilePic)

  const formatFieldValue = (fieldName, value) => {
    switch (fieldName) {
      case "level":
        return formatLevelValue(value, isRTL, t)
      case "hobby":
        return formatHobbyValue(value, t)
      case "children":
        return formatChildrenValue(value, isRTL)
      case "generalPoints":
      case "totalPoints":
        return formatNumberValue(value, numberLocale)
      default:
        if (typeof value === "object" && value !== null) {
          return getObjectLabel(value, isRTL)
        }
        if (typeof value === "number" || typeof value === "boolean") {
          return String(value)
        }
        return isEmptyValue(value) ? "" : String(value).trim()
    }
  }

  const handleProfilePicChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      event.target.value = ""
      setProfilePicStatus({
        type: "error",
        message: t("validation.invalidImageType", {
          defaultValue: "Please select a valid image file (JPEG, PNG, GIF).",
        }),
      })
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      event.target.value = ""
      setProfilePicStatus({
        type: "error",
        message: t("validation.fileTooLarge", {
          defaultValue: "File size must be less than 5MB.",
        }),
      })
      return
    }

    setProfilePicStatus({ type: null, message: "" })
    setSelectedProfilePic(file)
    setProfilePicPreview(URL.createObjectURL(file))
  }

  const resetProfilePicSelection = () => {
    setSelectedProfilePic(null)
    setProfilePicPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleProfilePicUpload = async () => {
    if (!selectedProfilePic) return

    setProfilePicUploading(true)
    setProfilePicStatus({ type: null, message: "" })

    try {
      const uploadData = new FormData()
      uploadData.append("profilePic", selectedProfilePic)

      const result = await updateCurrentUser(uploadData)
      if (!mountedRef.current) return

      if (result.success) {
        const updatedProfilePic =
          result.data?.data?.profilePic ||
          result.data?.profilePic ||
          result.data?.data?.userInfo?.profilePic ||
          result.data?.userInfo?.profilePic

        if (updatedProfilePic) {
          setUserData((current) => (current ? { ...current, profilePic: updatedProfilePic } : current))
        }

        resetProfilePicSelection()
        queueSuccessMessage(
          t("personalInfo.profilePicUpdated", {
            defaultValue: "Profile picture updated successfully!",
          }),
        )
      } else {
        setProfilePicStatus({
          type: "error",
          message:
            result.error ||
            t("personalInfo.errors.profilePicUploadFailed", {
              defaultValue: "Failed to upload profile picture.",
            }),
        })
      }
    } catch (uploadError) {
      console.error("Error uploading profile picture:", uploadError)
      if (mountedRef.current) {
        setProfilePicStatus({
          type: "error",
          message: t("personalInfo.errors.profilePicUploadFailed", {
            defaultValue: "An unexpected error occurred while uploading.",
          }),
        })
      }
    } finally {
      if (mountedRef.current) {
        setProfilePicUploading(false)
      }
    }
  }

  const handleCancelProfilePic = () => {
    resetProfilePicSelection()
    setProfilePicStatus({ type: null, message: "" })
  }

  const readOnlyNotice = isRTL
    ? "بيانات التسجيل للقراءة فقط. يمكنك تغيير صورة الملف الشخصي فقط من هنا."
    : "Registration details are read-only. You can only change your profile picture here."

  const baseFields = [
    {
      key: "fullName",
      label: t("personalInfo.labels.fullName", {
        defaultValue: isRTL ? "الاسم الكامل" : "Full Name",
      }),
      value: formatFieldValue("fullName", userData?.name),
      className: "md:col-span-2",
    },
    {
      key: "phoneNumber",
      label: t("personalInfo.labels.phoneNumber", {
        defaultValue: isRTL ? "رقم الجوال" : "Mobile Number",
      }),
      value: formatFieldValue("phoneNumber", userData?.phoneNumber),
    },
    {
      key: "email",
      label: t("personalInfo.labels.email", {
        defaultValue: isRTL ? "البريد الإلكتروني" : "Email Address",
      }),
      value: formatFieldValue("email", userData?.email),
      className: "md:col-span-2",
    },
  ]

  const roleFields = []

  if (isStudentRole) {
    roleFields.push(
      {
        key: "level",
        label: t("personalInfo.labels.level", {
          defaultValue: isRTL ? "المرحلة" : "Level",
        }),
        value: formatFieldValue("level", userData?.level),
      },
      {
        key: "hobby",
        label: t("personalInfo.labels.hobby", {
          defaultValue: isRTL ? "الهواية" : "Hobby",
        }),
        value: formatFieldValue("hobby", userData?.hobby || userData?.hobbies),
      },
      {
        key: "sequencedId",
        label: t("personalInfo.labels.sequencedId", {
          defaultValue: isRTL ? "الرقم التعريفي" : "Student ID",
        }),
        value: formatFieldValue("sequencedId", userData?.sequencedId),
      },
      {
        key: "generalPoints",
        label: t("personalInfo.labels.generalPoints", {
          defaultValue: isRTL ? "النقاط العامة" : "General Points",
        }),
        value: formatFieldValue("generalPoints", userData?.generalPoints),
      },
      {
        key: "totalPoints",
        label: t("personalInfo.labels.totalPoints", {
          defaultValue: isRTL ? "إجمالي النقاط" : "Total Points",
        }),
        value: formatFieldValue("totalPoints", userData?.totalPoints),
      },
    )
  }

  if (isParentRole) {
    roleFields.push(
      {
        key: "profession",
        label: t("personalInfo.labels.profession", {
          defaultValue: isRTL ? "المهنة / العمل" : "Profession / Work",
        }),
        value: formatFieldValue("profession", userData?.profession),
      },
      {
        key: "level",
        label: t("personalInfo.labels.level", {
          defaultValue: isRTL ? "المرحلة" : "Level",
        }),
        value: formatFieldValue("level", userData?.level),
      },
      {
        key: "children",
        label: t("personalInfo.labels.children", {
          defaultValue: isRTL ? "الأبناء" : "Children",
        }),
        value: formatFieldValue("children", userData?.children),
        multiline: true,
        className: "md:col-span-2",
      },
      {
        key: "generalPoints",
        label: t("personalInfo.labels.generalPoints", {
          defaultValue: isRTL ? "النقاط العامة" : "General Points",
        }),
        value: formatFieldValue("generalPoints", userData?.generalPoints),
      },
    )
  }

  if (isTeacherRole) {
    roleFields.push(
      {
        key: "subject",
        label: t("personalInfo.labels.subject", {
          defaultValue: isRTL ? "المادة" : "Subject",
        }),
        value: formatFieldValue("subject", userData?.subject),
      },
      {
        key: "level",
        label: t("personalInfo.labels.level", {
          defaultValue: isRTL ? "المرحلة" : "Level",
        }),
        value: formatFieldValue("level", userData?.level),
      },
      {
        key: "faction",
        label: t("personalInfo.labels.faction", {
          defaultValue: isRTL ? "الفرع" : "Faction",
        }),
        value: formatFieldValue("faction", userData?.faction),
      },
      {
        key: "school",
        label: t("personalInfo.labels.school", {
          defaultValue: isRTL ? "المدرسة" : "School",
        }),
        value: formatFieldValue("school", userData?.school),
        className: "md:col-span-2",
      },
    )
  }

  if (isLecturerRole) {
    roleFields.push(
      {
        key: "bio",
        label: t("personalInfo.labels.bio", {
          defaultValue: isRTL ? "نبذة" : "Bio",
        }),
        value: formatFieldValue("bio", userData?.bio),
        multiline: true,
        className: "md:col-span-2",
      },
      {
        key: "expertise",
        label: t("personalInfo.labels.expertise", {
          defaultValue: isRTL ? "الخبرة" : "Expertise",
        }),
        value: formatFieldValue("expertise", userData?.expertise),
        multiline: true,
        className: "md:col-span-2",
      },
    )
  }

  if (loading) {
    return (
      <section className="space-y-4">
        <SectionHeader title={t("personalInfo.title")} />
        <div
          className="rounded-3xl border p-4 md:p-5"
          style={{
            background: "rgba(255,255,255,0.8)",
            borderColor: "rgba(17,24,39,0.08)",
            boxShadow: SHADOWS.level1,
          }}
        >
          <div className="flex min-h-[280px] items-center justify-center">
            <span className="loading loading-spinner loading-lg" style={{ color: COLORS.deepTeal }} />
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="space-y-4">
        <SectionHeader title={t("personalInfo.title")} />
        <div
          className="rounded-3xl border p-4 md:p-5"
          style={{
            background: "rgba(255,255,255,0.8)",
            borderColor: "rgba(17,24,39,0.08)",
            boxShadow: SHADOWS.level1,
          }}
        >
          <div className="alert alert-error items-start">
            <span>{error}</span>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => void loadUserData()}
            >
              {t("retry")}
            </button>
          </div>
        </div>
      </section>
    )
  }

  const hasProfilePic = Boolean(userData?.profilePic)
  const displayProfilePic = profilePicPreview || currentProfilePicUrl

  return (
    <section className="space-y-4">
      <SectionHeader title={t("personalInfo.title")} />
      <div
        className="rounded-3xl border p-4 md:p-5"
        style={{
          background: "rgba(255,255,255,0.78)",
          borderColor: "rgba(17,24,39,0.08)",
          boxShadow: SHADOWS.level1,
        }}
      >
        <div className="mx-auto max-w-5xl space-y-6">
          <div
            className={`flex flex-col gap-6 lg:flex-row ${isRTL ? "lg:flex-row-reverse" : ""}`}
          >
            <div className={`flex flex-1 flex-col items-center gap-4 ${isRTL ? "lg:items-end" : "lg:items-start"}`}>
              <div className="relative">
                <div className="avatar">
                  <div className="w-28 h-28 rounded-full ring-2 ring-primary/40 ring-offset-2 ring-offset-base-100">
                    <img
                      src={displayProfilePic}
                      alt={userData?.name || "Profile picture"}
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.src = "/person.png"
                      }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-circle btn-sm absolute bottom-0 end-0 shadow-md"
                  style={{
                    background: COLORS.deepTeal,
                    borderColor: COLORS.deepTeal,
                    color: "#fff",
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={profilePicUploading}
                  title={t("personalInfo.uploadProfilePic", {
                    defaultValue: "Upload Profile Picture",
                  })}
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 text-center lg:text-start">
                <div className="inline-flex items-center rounded-full px-4 py-1 text-sm font-semibold text-white shadow-sm" style={{ background: COLORS.deepTeal }}>
                  {roleLabel || "-"}
                </div>
                {userData?.userSerial && (
                  <div className="text-xs text-base-content/60">
                    {t("personalInfo.userSerial", {
                      defaultValue: isRTL ? "الرقم التعريفي" : "User Serial",
                    })}
                    : {userData.userSerial}
                  </div>
                )}
                <p className="max-w-xl text-sm leading-6" style={{ color: COLORS.slateText }}>
                  {readOnlyNotice}
                </p>
              </div>
            </div>

            <div className="flex-1 rounded-[1.5rem] border px-4 py-4 md:px-5 md:py-5" style={{ background: "rgba(241,243,246,0.65)", borderColor: "rgba(17,24,39,0.08)" }}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold md:text-lg" style={{ color: COLORS.deepTeal }}>
                  {t("personalInfo.subtitle")}
                </h3>
                {!hasProfilePic && !profilePicPreview && (
                  <div className="badge badge-outline text-xs">
                    {t("personalInfo.noProfilePicHint", {
                      defaultValue:
                        isRTL
                          ? "اضغط على أيقونة الكاميرا لرفع صورة الملف الشخصي"
                          : "Click the camera icon to upload a profile picture",
                    })}
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                id="profilePicInput"
                type="file"
                accept="image/*"
                onChange={handleProfilePicChange}
                className="hidden"
              />

              {selectedProfilePic && (
                <div
                  className="mb-4 flex flex-col gap-3 rounded-2xl border px-4 py-3 md:flex-row md:items-center md:justify-between"
                  style={{
                    background: "rgba(255,255,255,0.85)",
                    borderColor: "rgba(17,24,39,0.10)",
                  }}
                >
                  <div className="flex items-center gap-2 text-sm" style={{ color: COLORS.slateText }}>
                    <Upload className="h-4 w-4" />
                    <span className="break-all">
                      {t("personalInfo.selectedFile", { defaultValue: "Selected:" })} {selectedProfilePic.name}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={`btn btn-primary btn-sm ${profilePicUploading ? "loading" : ""}`}
                      onClick={handleProfilePicUpload}
                      disabled={profilePicUploading}
                    >
                      {!profilePicUploading && <Check className="h-4 w-4" />}
                      {t("personalInfo.uploadButton", { defaultValue: "Upload" })}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={handleCancelProfilePic}
                      disabled={profilePicUploading}
                    >
                      <X className="h-4 w-4" />
                      {t("personalInfo.cancelButton", { defaultValue: "Cancel" })}
                    </button>
                  </div>
                </div>
              )}

              {profilePicStatus.message && (
                <div
                  className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
                    profilePicStatus.type === "success"
                      ? "border-success/30 bg-success/10 text-success"
                      : "border-error/30 bg-error/10 text-error"
                  }`}
                >
                  {profilePicStatus.type === "success" && (
                    <Check className={`${isRTL ? "ml-2" : "mr-2"} inline-block h-4 w-4`} />
                  )}
                  {profilePicStatus.message}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                {baseFields.map((field) => (
                  <ProfileField
                    key={field.key}
                    label={field.label}
                    value={field.value}
                    isRTL={isRTL}
                    className={field.className}
                  />
                ))}
              </div>

              {roleFields.length > 0 && (
                <div className="mt-6">
                  <div className="mb-3 text-base font-semibold" style={{ color: COLORS.deepTeal }}>
                    {t("personalInfo.subtitle")}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {roleFields.map((field) => (
                      <ProfileField
                        key={field.key}
                        label={field.label}
                        value={field.value}
                        isRTL={isRTL}
                        multiline={Boolean(field.multiline)}
                        className={field.className}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PersonalInfoSection
