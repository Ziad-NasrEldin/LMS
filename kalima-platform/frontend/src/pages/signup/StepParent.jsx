"use client"

import { useTranslation } from "react-i18next"
import { getGradeOptionsForStage } from "../../utils/levelHierarchy"
import DSSelect from "../../components/DSSelect"
import Input from "../../components/ui/Input"

const CHILD_COUNT_OPTIONS = Array.from({ length: 9 }, (_, index) => index + 1)

export default function StepParent({
  formData,
  handleInputChange,
  handleParentChildCountChange,
  handleParentChildProfileChange,
  t,
  errors,
  levelHierarchy,
  levelsLoading,
}) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === "ar"
  const stageOptions = levelHierarchy?.stageOptions || []
  const childProfiles = Array.isArray(formData.childProfiles) ? formData.childProfiles : []
  const childCount = formData.childCount || childProfiles.length || 1

  const getChildError = (index, field) => {
    if (!errors?.childProfiles || typeof errors.childProfiles !== "object") return ""
    return errors.childProfiles?.[index]?.[field] || ""
  }

  return (
    <div className="space-y-5">
      <p className="text-lg font-semibold">{t("form.parentDetails")}</p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="block mb-1">
            <span className="text-xs">{t("form.email")}</span>
          </label>
          <Input
            type="email"
            name="email"
            className={`${errors.email ? "border-error animate-shake" : ""}`}
            value={formData.email || ""}
            onChange={handleInputChange}
            placeholder="email@example.com"
            required
          />
          {errors.email && <span className="text-error text-sm mt-1">{t(`validation.${errors.email}`)}</span>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="block mb-1">
            <span className="text-xs">{t("form.profession")}</span>
          </label>
          <Input
            type="text"
            name="profession"
            className={`${errors.profession ? "border-error animate-shake" : ""}`}
            value={formData.profession || ""}
            onChange={handleInputChange}
            required
          />
          {errors.profession && (
            <span className="text-error text-sm mt-1">{t(`validation.${errors.profession}`)}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="block mb-1">
            <span className="text-xs">{t("form.password")}</span>
          </label>
          <Input
            type="password"
            name="password"
            className={`${errors.password ? "border-error animate-shake" : ""}`}
            value={formData.password || ""}
            onChange={handleInputChange}
            required
          />
          {errors.password && (
            <span className="text-error text-sm mt-1">{t("validation.passwordRequirements")}</span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="block mb-1">
            <span className="text-xs">{t("form.confirmPassword")}</span>
          </label>
          <Input
            type="password"
            name="confirmPassword"
            className={`${errors.confirmPassword ? "border-error animate-shake" : ""}`}
            value={formData.confirmPassword || ""}
            onChange={handleInputChange}
            required
          />
          {errors.confirmPassword && (
            <span className="text-error text-sm mt-1">{t(`validation.${errors.confirmPassword}`)}</span>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-lg font-semibold">
              {t("form.childrenEducationDetails", {
                defaultValue: isRTL ? "بيانات الأبناء الدراسية" : "Children education details",
              })}
            </p>
            <p className="text-sm text-slate-600">
              {t("form.childrenEducationDetailsHelp", {
                defaultValue: isRTL
                  ? "حدد المرحلة والصف الدراسي لكل ابن. يمكن إضافة رقم التسلسل إذا كان متاحًا."
                  : "Choose the stage and exact grade level for each child. Add a sequence ID if available.",
              })}
            </p>
          </div>

          <div className="flex flex-col gap-1 md:min-w-[180px]">
            <label className="block mb-1">
              <span className="text-xs">
                {t("form.childCount", {
                  defaultValue: isRTL ? "عدد الأبناء" : "Number of children",
                })}
              </span>
            </label>
            <DSSelect
              value={String(childCount)}
              onChange={(event) => handleParentChildCountChange(event.target.value)}
              className={isRTL ? "text-right" : "text-left"}
            >
              {CHILD_COUNT_OPTIONS.map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </DSSelect>
          </div>
        </div>

        {typeof errors.childProfiles === "string" && (
          <span className="text-error text-sm mt-3 block">{t(`validation.${errors.childProfiles}`)}</span>
        )}

        <div className="mt-4 space-y-4">
          {childProfiles.map((profile, index) => {
            const gradeOptions = profile?.stage
              ? getGradeOptionsForStage(levelHierarchy, profile.stage)
              : []

            return (
              <div
                key={`child-profile-${index}`}
                className="rounded-2xl bg-slate-50/70 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-semibold text-slate-900">
                    {t("form.childCardTitle", {
                      count: index + 1,
                      defaultValue: isRTL ? `الابن ${index + 1}` : `Child ${index + 1}`,
                    })}
                  </h4>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="flex flex-col gap-1">
                    <label className="block mb-1">
                      <span className="text-xs">
                        {t("form.stage", { defaultValue: isRTL ? "المرحلة" : "Stage" })}
                      </span>
                    </label>
                    <DSSelect
                      value={profile?.stage || ""}
                      onChange={(event) =>
                        handleParentChildProfileChange(index, "stage", event.target.value)
                      }
                      className={`${isRTL ? "text-right" : "text-left"} ${
                        getChildError(index, "stage") ? "border-error animate-shake" : ""
                      }`}
                    >
                      <option value="">
                        {t("form.selectStage", { defaultValue: isRTL ? "اختر المرحلة" : "Select stage" })}
                      </option>
                      {levelsLoading ? (
                        <option value="" disabled>
                          {t("form.loadingStages", {
                            defaultValue: isRTL ? "جاري تحميل المراحل..." : "Loading stages...",
                          })}
                        </option>
                      ) : (
                        stageOptions.map((stage) => (
                          <option key={stage.value} value={stage.value}>
                            {stage.label}
                          </option>
                        ))
                      )}
                    </DSSelect>
                    {getChildError(index, "stage") && (
                      <span className="text-error text-sm mt-1">
                        {t(`validation.${getChildError(index, "stage")}`)}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="block mb-1">
                      <span className="text-xs">
                        {t("form.selectGradeLevel", {
                          defaultValue: isRTL ? "الصف الدراسي" : "Grade level",
                        })}
                      </span>
                    </label>
                    <DSSelect
                      value={profile?.level || ""}
                      onChange={(event) =>
                        handleParentChildProfileChange(index, "level", event.target.value)
                      }
                      className={`${isRTL ? "text-right" : "text-left"} ${
                        getChildError(index, "level") ? "border-error animate-shake" : ""
                      }`}
                      disabled={!profile?.stage}
                    >
                      <option value="">
                        {!profile?.stage
                          ? t("form.selectStageFirst", {
                              defaultValue: isRTL ? "اختر المرحلة أولاً" : "Select stage first",
                            })
                          : t("form.selectGradeLevel", {
                              defaultValue: isRTL ? "اختر الصف الدراسي" : "Select grade level",
                            })}
                      </option>
                      {gradeOptions.map((grade) => (
                        <option key={grade.value} value={grade.value}>
                          {grade.label}
                        </option>
                      ))}
                    </DSSelect>
                    {getChildError(index, "level") && (
                      <span className="text-error text-sm mt-1">
                        {t(`validation.${getChildError(index, "level")}`)}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="block mb-1">
                      <span className="text-xs">
                        {t("form.childSequenceId", {
                          defaultValue: isRTL ? "رقم تسلسل الابن" : "Child sequence ID",
                        })}
                      </span>
                    </label>
                    <Input
                      type="text"
                      value={profile?.sequenceId || ""}
                      onChange={(event) =>
                        handleParentChildProfileChange(index, "sequenceId", event.target.value)
                      }
                      placeholder={t("form.childSequenceIdPlaceholder", {
                        defaultValue: isRTL ? "اختياري إذا كان لديك الرقم" : "Optional if you know it",
                      })}
                    />
                    <p className="text-xs text-slate-500">
                      {t("form.optional")}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
