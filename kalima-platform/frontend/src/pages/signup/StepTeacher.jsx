"use client"

import { useEffect, useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { useTranslation } from "react-i18next"
import { getAllSubjects } from "../../routes/courses"


export default function StepTeacher({ formData, handleInputChange, t, errors, gradeLevels }) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [subjects, setSubjects] = useState([])
  const { i18n } = useTranslation()

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
    <div className="space-y-3">
      <p className="text-xl sm:text-2xl font-semibold mb-2">{t('form.accountDetails') || 'Account Details'}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
      <div className="form-control">
        <div className="flex flex-col gap-1">
          <label className="label py-1">
            <span className="label-text text-xs">{t("form.email")}</span>
          </label>
          <input
            type="email"
            name="email"
            className={`input input-bordered input-sm ${errors.email ? "input-error animate-shake" : ""}`}
            value={formData.email}
            onChange={handleInputChange}
            required
          />
          {errors.email && <span className="text-error text-sm mt-1">{t("validation.email")}</span>}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
        <div className="form-control">
          <div className="flex flex-col gap-1">
            <label className="label py-1">
              <span className="label-text text-xs">{t("form.password")}</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className={`input input-bordered input-sm ${i18n.language === "ar" ? "pr-12" : "pl-12"} ${errors.password ? "input-error animate-shake" : ""}`}
                value={formData.password || ""}
                onChange={handleInputChange}
                required
              />
              <button
                type="button"
                className={`absolute top-1/2 ${i18n.language === "ar" ? "right-3" : "left-3"} -translate-y-1/2 z-10 text-gray-500`}
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <span className="text-error text-sm mt-1">{t("validation.passwordRequirements")}</span>}
          </div>
        </div>

        <div className="form-control relative">
          <div className="flex flex-col gap-1">
            <label className="label py-1">
              <span className="label-text text-xs">{t("form.confirmPassword")}</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                className={`input input-bordered input-sm ${i18n.language === "ar" ? "pr-12" : "pl-12"} ${errors.confirmPassword ? "input-error animate-shake" : ""}`}
                value={formData.confirmPassword || ""}
                onChange={handleInputChange}
                required
              />
              <button
                type="button"
                className={`absolute top-1/2 ${i18n.language === "ar" ? "right-3" : "left-3"} -translate-y-1/2 z-10 text-gray-500`}
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="text-error text-sm mt-1">{t(`validation.${errors.confirmPassword}`)}</span>
            )}
          </div>
        </div>
      </div>
      {/* Level Selection */}
      <div className="form-control sm:col-span-2">
        <div className="flex flex-col gap-1">
          <label className="label py-1">
            <span className="label-text text-xs">{t("form.level")}</span>
          </label>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {["primary", "preparatory", "secondary"].map((levelOption) => (
              <label key={levelOption} className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  className="checkbox"
                  name="level"
                  value={levelOption}
                  checked={formData.level?.includes(levelOption) || false}
                  onChange={(e) => {
                    const value = e.target.value
                    const isChecked = e.target.checked
                    const updatedLevels = isChecked
                      ? [...(formData.level || []), value]
                      : (formData.level || []).filter((level) => level !== value)
                    handleInputChange({ target: { name: "level", value: updatedLevels } })
                  }}
                />
                <span>{t(`gradeLevels.${levelOption}`)}</span>
              </label>
            ))}
          </div>
          {errors.level && <span className="text-error text-sm mt-1">{t(`validation.${errors.level}`)}</span>}
        </div>
      </div>

      {/* Teaches At Type */}
      <div className="form-control">
        <div className="flex flex-col gap-1">
          <label className="label py-1">
            <span className="label-text text-xs">{t("form.teachesAtType") || "Teaches At"}</span>
          </label>
          <select
            name="teachesAtType"
            className={`select select-bordered select-sm ${errors.teachesAtType ? "select-error animate-shake" : ""}`}
            value={formData.teachesAtType || ""}
            onChange={handleInputChange}
            required
          >
            <option value="">{t("form.selectTeachesAt") || "Select where you teach"}</option>
            <option value="Center">{t("center")}</option>
            <option value="School">{t("school")}</option>
            <option value="Both">{t("both")}</option>
          </select>
          {errors.teachesAtType && (
            <span className="text-error text-sm mt-1">
              {t(`validation.${errors.teachesAtType}`) || "This field is required"}
            </span>
          )}
        </div>
      </div>

      {/* Centers - Show if teachesAtType is Center or Both */}
      {(formData.teachesAtType === "Center" || formData.teachesAtType === "Both") && (
        <div className="form-control">
          <div className="flex flex-col gap-1">
            <label className="label py-1">
              <span className="label-text text-xs">{t("form.centers") || "Centers"}</span>
            </label>
            <div className="flex flex-col gap-1">
              {(formData.centers || [""]).map((center, index) => (
                <div key={index} className="flex w-full gap-2 sm:w-2/3 lg:w-1/2">
                  <input
                    type="text"
                    className={`input input-bordered input-sm flex-1 ${errors.centers?.[index] ? "input-error animate-shake" : ""}`}
                    value={center}
                    onChange={(e) => {
                      const newCenters = [...(formData.centers || [""])]
                      newCenters[index] = e.target.value
                      handleInputChange({ target: { name: "centers", value: newCenters } })
                    }}
                    placeholder={`${t("form.centerName") || "Center name"}`}
                  />
                  {index === (formData.centers || [""]).length - 1 ? (
                    <button
                      type="button"
                      className="btn btn-square btn-outline"
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
                      className="btn btn-square btn-outline btn-error"
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
              <span className="text-error text-sm mt-1">
                {t(`validation.${errors.centers}`) || "Please add at least one center"}
              </span>
            )}
          </div>
        </div>
      )}

      {/* School - Show if teachesAtType is School or Both */}
      {(formData.teachesAtType === "School" || formData.teachesAtType === "Both") && (
        <div className="form-control">
          <div className="flex flex-col gap-1">
            <label className="label py-1">
              <span className="label-text text-xs">{t("form.school") || "School"}</span>
            </label>
            <input
              type="text"
              name="school"
              className={`input input-bordered input-sm ${errors.school ? "input-error animate-shake" : ""}`}
              value={formData.school || ""}
              onChange={handleInputChange}
              placeholder={`${t("form.schoolName") || "School name"}`}
              required
            />
            {errors.school && (
              <span className="text-error text-sm mt-1">
                {t(`validation.${errors.school}`) || "School name is required"}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Social Media */}
      <div className="form-control sm:col-span-2">
        <div className="flex flex-col gap-1">
          <label className="label py-1">
            <span className="label-text text-xs">{t("form.socialMedia") || "Social Media"}</span>
          </label>
          <div className="flex flex-col gap-1">
            {(formData.socialMedia || [{ platform: "", account: "" }]).map((social, index) => (
              <div
                key={index}
                className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)_2.25rem] sm:items-center"
              >
                <select
                  className={`select select-bordered select-sm w-full ${errors.socialMedia?.[index]?.platform ? "select-error animate-shake" : ""}`}
                  value={social.platform || ""}
                  onChange={(e) => {
                    const newSocialMedia = [...(formData.socialMedia || [{ platform: "", account: "" }])]
                    newSocialMedia[index] = { ...newSocialMedia[index], platform: e.target.value }
                    handleInputChange({ target: { name: "socialMedia", value: newSocialMedia } })
                  }}
                >
                 <option value="">{t("form.selectPlatform") || "Select platform"}</option>
                  {[
                    { value: "Facebook", label: t("form.facebook") || "Facebook" },
                    { value: "Instagram", label: t("form.instagram") || "Instagram" },
                    { value: "Twitter", label: t("form.twitter") || "Twitter" },
                    { value: "LinkedIn", label: t("form.linkedin") || "LinkedIn" },
                    { value: "TikTok", label: t("form.tikTok") || "TikTok" },
                    { value: "YouTube", label: t("form.youtube") || "YouTube" },
                    { value: "WhatsApp", label: t("form.whatsApp") || "WhatsApp" },
                    { value: "Telegram", label: t("form.telegram") || "Telegram" }
                  ].map((platform) => (
                    <option key={platform.value} value={platform.value}>
                      {platform.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  className={`input input-bordered input-sm w-full placeholder:text-base-content/65 ${errors.socialMedia?.[index]?.account ? "input-error animate-shake" : ""}`}
                  value={social.account || ""}
                  onChange={(e) => {
                    const newSocialMedia = [...(formData.socialMedia || [{ platform: "", account: "" }])]
                    newSocialMedia[index] = { ...newSocialMedia[index], account: e.target.value }
                    handleInputChange({ target: { name: "socialMedia", value: newSocialMedia } })
                  }}
                  placeholder={`${t("form.accountName") || "Account name/handle"}`}
                />
                {index === (formData.socialMedia || [{ platform: "", account: "" }]).length - 1 ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline h-8 min-h-8 w-9 p-0"
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
                    className="btn btn-sm btn-outline btn-error h-8 min-h-8 w-9 p-0"
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
      <div className="form-control">
        <div className="flex flex-col gap-1">
          <label className="label py-1">
            <span className="label-text text-xs">{t("form.subject")}</span>
          </label>
          <select
            name="subject"
            className={`select select-bordered select-sm ${errors.subject ? "select-error animate-shake" : ""}`}
            value={formData.subject}
            onChange={handleSelectChange}
            required
          >
            <option value="">{t("form.selectSubject")}</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {t(`${subject.name}`)}
              </option>
            ))}
          </select>
          {errors.subject && <span className="text-error text-sm mt-1">{t(`validation.${errors.subject}`)}</span>}
        </div>
      </div>

      
    
      </div>
    </div>
  )
}
