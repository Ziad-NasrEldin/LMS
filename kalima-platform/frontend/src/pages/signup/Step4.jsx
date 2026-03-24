"use client"
import { Link } from "react-router-dom"

const ReviewItem = ({ label, value }) => (
  <div>
    <p className="text-sm text-base-content/70">{label}</p>
    <p className="font-medium">{value || "-"}</p>
  </div>
)

export default function Step4({ formData, t, gradeLevels }) {
  const translateGradeLevel = (rawLabel) => {
    if (!rawLabel) return "-"

    const normalized = String(rawLabel).trim()
    const lower = normalized.toLowerCase()
    const levelMap = {
      "first primary": "1st Primary",
      "second primary": "2nd Primary",
      "third primary": "3rd Primary",
      "fourth primary": "4th Primary",
      "fifth primary": "5th Primary",
      "sixth primary": "6th Primary",
      "first preparatory": "1st Preparatory",
      "second preparatory": "2nd Preparatory",
      "third preparatory": "3rd Preparatory",
      "first secondary": "1st Secondary",
      "second secondary": "2nd Secondary",
      "third secondary": "3rd Secondary",
    }

    const candidateKeys = [normalized, levelMap[lower]].filter(Boolean)
    for (const key of candidateKeys) {
      const translated = t(`gradeLevels.${key}`)
      if (translated !== `gradeLevels.${key}`) {
        return translated
      }
    }

    return normalized
  }

  // Function to find and translate level name
  const getLevelName = (levelId) => {
    const level = gradeLevels?.find((level) => level.value === levelId)
    return level ? translateGradeLevel(level.label) : "-"
  }

  // Function to format teacher levels
  const formatTeacherLevels = (levels) => {
    if (!levels || !Array.isArray(levels) || levels.length === 0) return "-"
    return levels.map((level) => translateGradeLevel(level)).join(", ")
  }

  // Function to format social media accounts
  const formatSocialMedia = (socialMedia) => {
    if (!socialMedia || !Array.isArray(socialMedia) || socialMedia.length === 0) return "-"
    return socialMedia
      .filter((item) => item.platform && item.account)
      .map((item) => `${item.platform}: ${item.account}`)
      .join(", ")
  }

  // Function to format centers
  const formatCenters = (centers) => {
    if (!centers || !Array.isArray(centers) || centers.length === 0) return "-"
    return centers.filter((center) => center.trim()).join(", ")
  }

  return (
    <div className="space-y-6">
      <div className="bg-base-200 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">{t("review.title")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ReviewItem label={t("form.role")} value={t(`role.${formData.role}`)} />
          <ReviewItem label={t("form.fullName")} value={formData.fullName} />
          <ReviewItem label={t("form.gender")} value={t(`gender.${formData.gender}`)} />
          <ReviewItem label={t("form.phoneNumber")} value={formData.phoneNumber} />
          <ReviewItem label={t("form.government") || "Government"} value={formData.government || "-"} />
              <ReviewItem
                label={t("form.administrationZone") || "Administration Zone"}
                value={formData.administrationZone || "-"}
              />
          {formData.role === "student" && (
            <>
              <ReviewItem label={t("form.grade")} value={getLevelName(formData.level)} />
              <ReviewItem label={t("form.parentPhone")} value={formData.parentPhoneNumber} />
            </>
          )}

          {formData.role === "teacher" && (
            <>
              <ReviewItem label={t("form.phoneNumber2")} value={formData.phoneNumber2} />
              <ReviewItem label={t("form.level")} value={formatTeacherLevels(formData.level)} />
              <ReviewItem label={t("form.subject")} value={formData.subject} />
              <ReviewItem
                label={t("form.teachesAtType") || "Teaches At"}
                value={t(formData.teachesAtType.toLowerCase()) || "-"}
              />

              {(formData.teachesAtType === "Center" || formData.teachesAtType === "Both") && (
                <ReviewItem label={t("form.centers") || "Centers"} value={formatCenters(formData.centers)} />
              )}

              {(formData.teachesAtType === "School" || formData.teachesAtType === "Both") && (
                <ReviewItem label={t("form.school") || "School"} value={formData.school || "-"} />
              )}

              <div className="col-span-2">
                <ReviewItem
                  label={t("form.socialMedia") || "Social Media"}
                  value={formatSocialMedia(formData.socialMedia)}
                />
              </div>
            </>
          )}

          {formData.role === "parent" && <ReviewItem label={t("form.children")} value={formData.children.join(", ")} />}
        </div>
                  <p className="font-bold mt-10">
                    {t("review.privacyAgreementPrefix", "By signing up, you agree to our")} {" "}
                    <span className="underline text-blue-600">
                      <Link to={"/privacy-policy"}>{t("review.privacyPolicy", "Privacy Policy")}</Link>
                    </span>
                  </p>
      </div>
    </div>
  )
}
