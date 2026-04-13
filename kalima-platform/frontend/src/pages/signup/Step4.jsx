"use client"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { resolveLevelDisplayName } from "../../utils/levelHierarchy"

const ReviewItem = ({ label, value }) => (
  <div>
      <p className="text-sm text-slate-600">{label}</p>
    <p className="font-medium">{value || "-"}</p>
  </div>
)

export default function Step4({ formData, t, hobbiesList = [], levelHierarchy }) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === "ar"

  const getLevelName = (levelId) => {
    if (!levelId) return "-"
    const level = levelHierarchy?.levels?.find((item) => String(item._id) === String(levelId))
    return resolveLevelDisplayName(level || levelId, i18n.language)
  }

  const formatTeacherLevels = (levels) => {
    if (!Array.isArray(levels) || levels.length === 0) return "-"
    return levels.map((levelId) => getLevelName(levelId)).join(", ")
  }

  const formatSocialMedia = (socialMedia) => {
    if (!socialMedia || !Array.isArray(socialMedia) || socialMedia.length === 0) return "-"
    return socialMedia
      .filter((item) => item.platform && item.account)
      .map((item) => `${item.platform}: ${item.account}`)
      .join(", ")
  }

  const formatParentRelation = (relation) => {
    if (!relation) return "-"
    const translatedRelation = t(`parentRelations.${relation}`)
    return translatedRelation !== `parentRelations.${relation}` ? translatedRelation : relation
  }

  const hasAdditionalParentContact = Boolean(
    formData.hasAdditionalParentPhone ||
      String(formData.parentPhoneNumber2 || "").trim() ||
      String(formData.parentPhoneRelation2 || "").trim(),
  )

  const formatCenters = (centers) => {
    if (!centers || !Array.isArray(centers) || centers.length === 0) return "-"
    return centers.filter((center) => center.trim()).join(", ")
  }

  const formatStudentHobbies = () => {
    if (Array.isArray(formData.hobbies) && formData.hobbies.length > 0) {
      const hobbies = formData.hobbies
        .map((id) => {
          const hobby = hobbiesList.find((item) => item.id === id)
          if (!hobby) return null
          if (hobby.id === "other") return formData.otherHobbyText?.trim() || null
          return t(`hobbies.${hobby.key}`)
        })
        .filter(Boolean)

      return hobbies.length > 0 ? hobbies.join(", ") : "-"
    }

    if (formData.hobby) {
      const translated = t(`hobbies.${formData.hobby}`)
      return translated !== `hobbies.${formData.hobby}` ? translated : formData.hobby
    }

    return "-"
  }

  const parentChildProfiles = Array.isArray(formData.childProfiles) ? formData.childProfiles : []

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-slate-100 p-6">
        <h3 className="mb-4 text-lg font-semibold">{t("review.title")}</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ReviewItem label={t("form.role")} value={t(`role.${formData.role}`)} />
          <ReviewItem label={t("form.fullName")} value={formData.fullName} />
          <ReviewItem label={t("form.gender")} value={t(`gender.${formData.gender}`)} />
          <ReviewItem label={t("form.phoneNumber")} value={formData.phoneNumber} />
          <ReviewItem
            label={t("form.government", { defaultValue: isRTL ? "المحافظة" : "Government" })}
            value={formData.government || "-"}
          />
          <ReviewItem
            label={t("form.administrationZone", {
              defaultValue: isRTL ? "الإدارة التعليمية" : "Administration Zone",
            })}
            value={formData.administrationZone || "-"}
          />

          {formData.role === "student" && (
            <>
              <ReviewItem
                label={t("form.stage", { defaultValue: isRTL ? "المرحلة" : "Stage" })}
                value={getLevelName(formData.stage)}
              />
              <ReviewItem
                label={t("form.level", {
                  defaultValue: isRTL ? "المستوى التعليمي" : "Learning Level",
                })}
                value={getLevelName(formData.level)}
              />
              <ReviewItem label={t("form.parentPhone")} value={formData.parentPhoneNumber} />
              <ReviewItem label={t("form.parentPhoneRelation")} value={formatParentRelation(formData.parentPhoneRelation)} />
              {hasAdditionalParentContact && (
                <>
                  <ReviewItem label={t("form.additionalParentPhone")} value={formData.parentPhoneNumber2} />
                  <ReviewItem
                    label={t("form.additionalParentRelation")}
                    value={formatParentRelation(formData.parentPhoneRelation2)}
                  />
                </>
              )}
              <ReviewItem label={t("form.hobbies")} value={formatStudentHobbies()} />
            </>
          )}

          {formData.role === "teacher" && (
            <>
              <ReviewItem label={t("form.phoneNumber2")} value={formData.phoneNumber2} />
              <ReviewItem
                label={t("form.stage", {
                  defaultValue: t("form.level", { defaultValue: isRTL ? "المرحلة" : "Stage" }),
                })}
                value={formatTeacherLevels(formData.level)}
              />
              <ReviewItem label={t("form.subject")} value={formData.subject} />
              <ReviewItem
                label={t("form.teachesAtType", { defaultValue: isRTL ? "أين تدرس؟" : "Teaches At" })}
                value={t(formData.teachesAtType?.toLowerCase(), { defaultValue: formData.teachesAtType || "-" })}
              />

              {(formData.teachesAtType === "Center" || formData.teachesAtType === "Both") && (
                <ReviewItem
                  label={t("form.centers", { defaultValue: isRTL ? "المراكز" : "Centers" })}
                  value={formatCenters(formData.centers)}
                />
              )}

              {(formData.teachesAtType === "School" || formData.teachesAtType === "Both") && (
                <ReviewItem label={t("form.school", { defaultValue: isRTL ? "المدرسة" : "School" })} value={formData.school || "-"} />
              )}

              <div className="col-span-2">
                <ReviewItem
                  label={t("form.socialMedia", { defaultValue: isRTL ? "وسائل التواصل الاجتماعي" : "Social Media" })}
                  value={formatSocialMedia(formData.socialMedia)}
                />
              </div>
            </>
          )}

          {formData.role === "parent" && (
            <>
              <ReviewItem label={t("form.profession")} value={formData.profession} />
              <ReviewItem
                label={t("form.childCount", {
                  defaultValue: isRTL ? "عدد الأبناء" : "Number of children",
                })}
                value={String(formData.childCount || parentChildProfiles.length || 0)}
              />
              <div className="col-span-2">
                <p className="text-sm text-slate-600">
                  {t("form.childrenEducationDetails", {
                    defaultValue: isRTL ? "بيانات الأبناء الدراسية" : "Children education details",
                  })}
                </p>
                <div className="mt-2 space-y-3">
                  {parentChildProfiles.length > 0 ? (
                    parentChildProfiles.map((profile, index) => (
                      <div key={`review-child-${index}`} className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="font-medium">
                          {t("form.childCardTitle", {
                            count: index + 1,
                            defaultValue: isRTL ? `الابن ${index + 1}` : `Child ${index + 1}`,
                          })}
                        </p>
                        <p className="text-sm text-slate-600">
                          {t("form.stage", { defaultValue: isRTL ? "المرحلة" : "Stage" })}: {getLevelName(profile.stage)}
                        </p>
                        <p className="text-sm text-slate-600">
                          {t("form.level", { defaultValue: isRTL ? "الصف الدراسي" : "Grade level" })}: {getLevelName(profile.level)}
                        </p>
                        {profile.sequenceId && (
                          <p className="text-sm text-slate-600">
                            {t("form.childSequenceId", {
                              defaultValue: isRTL ? "رقم تسلسل الابن" : "Child sequence ID",
                            })}: {profile.sequenceId}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="font-medium">-</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <p className="mt-10 font-bold">
          {t("review.privacyAgreementPrefix", "By signing up, you agree to our")}{" "}
          <span className="text-blue-600 underline">
            <Link to="/privacy-policy">{t("review.privacyPolicy", "Privacy Policy")}</Link>
          </span>
        </p>
      </div>
    </div>
  )
}
