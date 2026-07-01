"use client"

import { useEffect, useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { useTranslation } from "react-i18next"
import { getAllSubjects } from "../../routes/courses"
import DSSelect from "../../components/DSSelect"
import Button from "../../components/ui/Button"
import Input from "../../components/ui/Input"


export default function StepTeacher({ formData, handleInputChange, t, errors, levelHierarchy, levelsLoading }) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [subjects, setSubjects] = useState([])
  const { i18n } = useTranslation()
  const isRTL = i18n.language === "ar"
  const stageOptions = levelHierarchy?.stageOptions || []
  const fieldClass = "h-11 min-h-11 w-full rounded-xl text-sm sm:h-12 sm:min-h-12 sm:text-base"
  const inputClass = `border border-slate-200 ${fieldClass}`
  const selectClass = `border border-slate-200 ${fieldClass} ps-4 pe-10`
  const fieldWrapperClass = "flex min-w-0 flex-col gap-1"
  const labelClass = "text-sm font-semibold text-slate-900"
  const actionButtonClass = "border border-slate-200 h-11 min-h-11 w-11 shrink-0 rounded-xl p-0 text-lg leading-none flex items-center justify-center bg-white hover:bg-slate-50 sm:h-12 sm:min-h-12 sm:w-12"
  
  useEffect(() => {
    const fetchSubjects = async () => {
      const response = await getAllSubjects()
      if (response.success) {
        setSubjects(response.data)
      } else {
        console.error(response.error)
      }
    }

    fetchSubjects()
  }, [])

  const handleSelectChange = (e) => {
    const { name, value } = e.target
    handleInputChange({ target: { name, value } })
  }

  return (
    <div className="space-y-4">
      <p className="text-lg font-bold text-slate-900 sm:text-xl">
        {t("form.accountDetails", { defaultValue: isRTL ? "تفاصيل الحساب" : "Account Details" })}
      </p>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
      <div className="min-w-0 sm:col-span-2">
        <div className={fieldWrapperClass}>
          <label>
            <span className={labelClass}>{t("form.email")}</span>
          </label>
          <Input
            type="email"
            name="email"
            className={`${inputClass} ${errors.email ? "border-red-500 animate-shake" : ""}`}
            value={formData.email}
            onChange={handleInputChange}
            required
          />
          {errors.email && <span className="text-red-500 text-sm mt-1">{t(`validation.${errors.email}`)}</span>}
        </div>
      </div>
      <div className="grid min-w-0 grid-cols-2 gap-3 sm:col-span-2 sm:gap-4">
        <div className={fieldWrapperClass}>
          <div className={fieldWrapperClass}>
            <label>
              <span className={labelClass}>{t("form.password")}</span>
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                className={`${inputClass} ${i18n.language === "ar" ? "pr-12" : "pl-12"} ${errors.password ? "border-red-500 animate-shake" : ""}`}
                value={formData.password || ""}
                onChange={handleInputChange}
                required
              />
              <button
                type="button"
                  className={`absolute top-1/2 ${i18n.language === "ar" ? "right-3" : "left-3"} z-10 min-h-10 min-w-10 -translate-y-1/2 text-slate-600`}
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <span className="text-red-500 text-sm mt-1">{t("validation.passwordRequirements")}</span>}
          </div>
        </div>
  
        <div className={`${fieldWrapperClass} relative`}>
          <div className={fieldWrapperClass}>
            <label>
              <span className={labelClass}>{t("form.confirmPassword")}</span>
            </label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                className={`${inputClass} ${i18n.language === "ar" ? "pr-12" : "pl-12"} ${errors.confirmPassword ? "border-red-500 animate-shake" : ""}`}
                value={formData.confirmPassword || ""}
                onChange={handleInputChange}
                required
              />
              <button
                type="button"
                  className={`absolute top-1/2 ${i18n.language === "ar" ? "right-3" : "left-3"} z-10 min-h-10 min-w-10 -translate-y-1/2 text-slate-600`}
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="text-red-500 text-sm mt-1">{t(`validation.${errors.confirmPassword}`)}</span>
            )}
          </div>
        </div>
      </div>
      {/* Level Selection */}
      <div className="min-w-0 sm:col-span-2">
        <div className={fieldWrapperClass}>
          <label>
            <span className={labelClass}>
              {t("form.stage", {
                defaultValue: t("form.level", { defaultValue: isRTL ? "المرحلة" : "Stage" }),
              })}
            </span>
          </label>
          {levelsLoading ? (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900/70">
              {t("form.loadingStages", { defaultValue: isRTL ? "جاري تحميل المراحل..." : "Loading stages..." })}
            </div>
          ) : stageOptions.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900/70">
              {t("form.noStagesAvailable", {
                defaultValue: isRTL ? "لا توجد مراحل متاحة" : "No stages available",
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {stageOptions.map((levelOption) => (
                <label key={levelOption.value} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300"
                    name="level"
                    value={levelOption.value}
                    checked={Array.isArray(formData.level) ? formData.level.includes(levelOption.value) : false}
                    onChange={(e) => {
                      const value = e.target.value
                      const isChecked = e.target.checked
                      const currentLevels = Array.isArray(formData.level)
                        ? formData.level
                        : formData.level
                          ? [formData.level]
                          : []
                      const updatedLevels = isChecked
                        ? [...currentLevels, value]
                        : currentLevels.filter((level) => level !== value)
                      handleInputChange({ target: { name: "level", value: updatedLevels } })
                    }}
                  />
                  <span className="text-sm font-semibold text-slate-900">{levelOption.label}</span>
                </label>
              ))}
            </div>
          )}
          {errors.level && <span className="text-red-500 text-sm mt-1">{t(`validation.${errors.level}`)}</span>}
        </div>
      </div>

      {/* Teaches At Type */}
      <div className={fieldWrapperClass}>
        <div className={fieldWrapperClass}>
          <label>
            <span className={labelClass}>
              {t("form.teachesAtType", { defaultValue: isRTL ? "أين تدرس؟" : "Teaches At" })}
            </span>
          </label>
          <DSSelect
            name="teachesAtType"
            className={`${selectClass} ${errors.teachesAtType ? "border-red-500 animate-shake" : ""}`}
            value={formData.teachesAtType || ""}
            onChange={handleInputChange}
            required
          >
            <option value="">
              {t("form.selectTeachesAt", {
                defaultValue: isRTL ? "اختر مكان التدريس" : "Select where you teach",
              })}
            </option>
            <option value="Center">{t("center", { defaultValue: isRTL ? "مركز" : "Center" })}</option>
            <option value="School">{t("school", { defaultValue: isRTL ? "مدرسة" : "School" })}</option>
            <option value="Both">{t("both", { defaultValue: isRTL ? "كلاهما" : "Both" })}</option>
          </DSSelect>
          {errors.teachesAtType && (
            <span className="text-red-500 text-sm mt-1">
              {t(`validation.${errors.teachesAtType}`, {
                defaultValue: isRTL ? "هذا الحقل مطلوب" : "This field is required",
              })}
            </span>
          )}
        </div>
      </div>
  
      {/* Centers - Show if teachesAtType is Center or Both */}
      {(formData.teachesAtType === "Center" || formData.teachesAtType === "Both") && (
        <div className={fieldWrapperClass}>
          <div className={fieldWrapperClass}>
            <label>
              <span className={labelClass}>
                {t("form.centers", { defaultValue: isRTL ? "المراكز" : "Centers" })}
              </span>
            </label>
            <div className="flex flex-col gap-2">
              {(formData.centers || [""]).map((center, index) => (
                <div key={index} className="flex w-full min-w-0 gap-2">
                  <Input
                    type="text"
                    className={`${inputClass} flex-1 ${errors.centers?.[index] ? "border-red-500 animate-shake" : ""}`}
                    value={center}
                    onChange={(e) => {
                      const newCenters = [...(formData.centers || [""])]
                      newCenters[index] = e.target.value
                      handleInputChange({ target: { name: "centers", value: newCenters } })
                    }}
                    placeholder={t("form.centerName", {
                      defaultValue: isRTL ? "اسم المركز" : "Center name",
                    })}
                  />
                  {index === (formData.centers || [""]).length - 1 ? (
                    <button
                      type="button"
                      className={actionButtonClass}
                      onClick={() => {
                        const newCenters = [...(formData.centers || [""]), ""]
                        handleInputChange({ target: { name: "centers", value: newCenters } })
                      }}
                    >
                      +
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`${actionButtonClass} text-red-500`}
                      onClick={() => {
                        const newCenters = (formData.centers || [""]).filter((_, i) => i !== index)
                        handleInputChange({ target: { name: "centers", value: newCenters } })
                      }}
                    >
                      -
                    </button>
                  )}
                </div>
              ))}
            </div>
            {errors.centers && (
              <span className="text-red-500 text-sm mt-1">
                {t(`validation.${errors.centers}`, {
                  defaultValue: isRTL ? "الرجاء إضافة مركز واحد على الأقل" : "Please add at least one center",
                })}
              </span>
            )}
          </div>
        </div>
      )}
  
      {/* School - Show if teachesAtType is School or Both */}
      {(formData.teachesAtType === "School" || formData.teachesAtType === "Both") && (
        <div className={fieldWrapperClass}>
          <div className={fieldWrapperClass}>
            <label>
              <span className={labelClass}>
                {t("form.school", { defaultValue: isRTL ? "المدرسة" : "School" })}
              </span>
            </label>
            <Input
              type="text"
              name="school"
              className={`${inputClass} ${errors.school ? "border-red-500 animate-shake" : ""}`}
              value={formData.school || ""}
              onChange={handleInputChange}
              placeholder={t("form.schoolName", { defaultValue: isRTL ? "اسم المدرسة" : "School name" })}
              required
            />
            {errors.school && (
              <span className="text-red-500 text-sm mt-1">
                {t(`validation.${errors.school}`, {
                  defaultValue: isRTL ? "اسم المدرسة مطلوب" : "School name is required",
                })}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Social Media */}
        <div className="min-w-0 sm:col-span-2">
          <div className={fieldWrapperClass}>
            <label>
            <span className={labelClass}>
              {t("form.socialMedia", { defaultValue: isRTL ? "وسائل التواصل الاجتماعي" : "Social Media" })}
            </span>
          </label>
          <div className="flex flex-col gap-2">
            {(formData.socialMedia || [{ platform: "", account: "" }]).map((social, index) => (
              <div
                key={index}
                className="grid min-w-0 grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)_2.75rem] gap-2 sm:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)_3rem] sm:items-center"
              >
                <DSSelect
                  className={`${selectClass} ${errors.socialMedia?.[index]?.platform ? "border-red-500 animate-shake" : ""}`}
                  value={social.platform || ""}
                  onChange={(e) => {
                    const newSocialMedia = [...(formData.socialMedia || [{ platform: "", account: "" }])]
                    newSocialMedia[index] = { ...newSocialMedia[index], platform: e.target.value }
                    handleInputChange({ target: { name: "socialMedia", value: newSocialMedia } })
                  }}
                >
                  <option value="">
                    {t("form.selectPlatform", {
                      defaultValue: isRTL ? "اختر المنصة" : "Select platform",
                    })}
                  </option>
                   {[
                     { value: "Facebook", label: t("form.facebook", { defaultValue: "Facebook" }) },
                     { value: "Instagram", label: t("form.instagram", { defaultValue: "Instagram" }) },
                     { value: "Twitter", label: t("form.twitter", { defaultValue: "Twitter" }) },
                     { value: "LinkedIn", label: t("form.linkedin", { defaultValue: "LinkedIn" }) },
                     { value: "TikTok", label: t("form.tikTok", { defaultValue: "TikTok" }) },
                     { value: "YouTube", label: t("form.youtube", { defaultValue: "YouTube" }) },
                     { value: "WhatsApp", label: t("form.whatsApp", { defaultValue: "WhatsApp" }) },
                     { value: "Telegram", label: t("form.telegram", { defaultValue: "Telegram" }) }
                   ].map((platform) => (
                     <option key={platform.value} value={platform.value}>
                       {platform.label}
                     </option>
                   ))}
                </DSSelect>
                <Input
                  type="text"
                  className={`${inputClass} min-w-0 placeholder:text-slate-900/65 ${errors.socialMedia?.[index]?.account ? "border-red-500 animate-shake" : ""}`}
                  value={social.account || ""}
                  onChange={(e) => {
                    const newSocialMedia = [...(formData.socialMedia || [{ platform: "", account: "" }])]
                    newSocialMedia[index] = { ...newSocialMedia[index], account: e.target.value }
                    handleInputChange({ target: { name: "socialMedia", value: newSocialMedia } })
                  }}
                  placeholder={t("form.accountName", {
                    defaultValue: isRTL ? "رابط الحساب" : "Account name/handle",
                  })}
                />
                {index === (formData.socialMedia || [{ platform: "", account: "" }]).length - 1 ? (
                  <button
                    type="button"
                    className={actionButtonClass}
                    onClick={() => {
                      const newSocialMedia = [
                        ...(formData.socialMedia || [{ platform: "", account: "" }]),
                        { platform: "", account: "" },
                      ]
                      handleInputChange({ target: { name: "socialMedia", value: newSocialMedia } })
                    }}
                  >
                    +
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`${actionButtonClass} text-red-500`}
                    onClick={() => {
                      const newSocialMedia = (formData.socialMedia || [{ platform: "", account: "" }]).filter(
                        (_, i) => i !== index,
                      )
                      handleInputChange({ target: { name: "socialMedia", value: newSocialMedia } })
                    }}
                  >
                    -
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Subject Input */}
        <div className="min-w-0 sm:col-span-2">
          <div className={fieldWrapperClass}>
            <label>
            <span className={labelClass}>
              {t("form.subject", { defaultValue: isRTL ? "المادة" : "Subject" })}
            </span>
          </label>
          <DSSelect
            name="subject"
            className={`${selectClass} ${errors.subject ? "border-red-500 animate-shake" : ""}`}
            value={formData.subject}
            onChange={handleSelectChange}
            required
          >
            <option value="">
              {t("form.selectSubject", { defaultValue: isRTL ? "اختر المادة" : "Select subject" })}
            </option>
            {subjects.map((subject) => (
              <option key={subject._id || subject.id || subject.name} value={subject._id || subject.id || subject.name}>
                {subject.name}
              </option>
            ))}
          </DSSelect>
          {errors.subject && <span className="text-red-500 text-sm mt-1">{t(`validation.${errors.subject}`)}</span>}
        </div>
      </div>

      
    
      </div>
    </div>
  )
}
