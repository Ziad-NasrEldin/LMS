"use client"

import { useEffect, useState } from "react"
import { STAGE_KEYS, getStageDisplayName } from "../../../../utils/levelHierarchy"
import DSSelect from "../../../../components/DSSelect"

const EMPTY_STAGE_OPTIONS = STAGE_KEYS.map((stageKey) => ({
  value: stageKey,
  label: stageKey,
  raw: { name: stageKey, kind: "stage" },
}))

const TeacherForm = ({
  userData,
  handleChange,
  handleGovernmentChange,
  subjects,
  levels,
  levelHierarchy,
  governments,
  administrationZones,
  loadingZones,
  t,
  isRTL,
}) => {
  const [selectedLevels, setSelectedLevels] = useState(
    Array.isArray(userData.level) ? userData.level : userData.level ? [userData.level] : [],
  )
  const [selectedCenters, setSelectedCenters] = useState(userData.centers || [])
  const [socialMediaLinks, setSocialMediaLinks] = useState(userData.socialMedia || [])

  const stageOptions = levelHierarchy?.stageOptions?.length
    ? levelHierarchy.stageOptions
    : EMPTY_STAGE_OPTIONS.map((stage) => ({
        ...stage,
        label: getStageDisplayName(stage.value, isRTL ? "ar" : "en"),
      }))

  useEffect(() => {
    setSelectedLevels(Array.isArray(userData.level) ? userData.level : userData.level ? [userData.level] : [])
  }, [userData.level])

  useEffect(() => {
    setSelectedCenters(Array.isArray(userData.centers) ? userData.centers : [])
  }, [userData.centers])

  useEffect(() => {
    setSocialMediaLinks(Array.isArray(userData.socialMedia) ? userData.socialMedia : [])
  }, [userData.socialMedia])

  const handleLevelSelect = (e) => {
    const levelValue = e.target.value
    if (!levelValue) return

    if (!selectedLevels.includes(levelValue)) {
      const newLevels = [...selectedLevels, levelValue]
      setSelectedLevels(newLevels)
      handleChange({
        target: {
          name: "level",
          value: newLevels,
        },
      })
    }
  }

  const removeLevel = (levelValue) => {
    const newLevels = selectedLevels.filter((level) => level !== levelValue)
    setSelectedLevels(newLevels)
    handleChange({
      target: {
        name: "level",
        value: newLevels,
      },
    })
  }

  const addCenter = () => {
    const centerInput = document.getElementById("centerInput")
    const centerName = centerInput?.value?.trim()
    if (centerName && !selectedCenters.includes(centerName)) {
      const newCenters = [...selectedCenters, centerName]
      setSelectedCenters(newCenters)
      if (centerInput) {
        centerInput.value = ""
      }
      handleChange({
        target: {
          name: "centers",
          value: newCenters,
        },
      })
    }
  }

  const removeCenter = (centerName) => {
    const newCenters = selectedCenters.filter((center) => center !== centerName)
    setSelectedCenters(newCenters)
    handleChange({
      target: {
        name: "centers",
        value: newCenters,
      },
    })
  }

  const toEnglishDigits = (str) => String(str || "").replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[^\d]/g, "")

  const handlePhoneInputChange = (e) => {
    const { name, value } = e.target
    const cleanedValue = toEnglishDigits(value)
    handleChange({ target: { name, value: cleanedValue } })
  }

  const addSocialMedia = () => {
    const platformInput = document.getElementById("socialPlatform")
    const accountInput = document.getElementById("socialAccount")
    const platform = platformInput?.value || ""
    const account = accountInput?.value?.trim() || ""

    if (platform && account) {
      const newSocialMedia = [...socialMediaLinks, { platform, account }]
      setSocialMediaLinks(newSocialMedia)
      if (platformInput) platformInput.value = ""
      if (accountInput) accountInput.value = ""
      handleChange({
        target: {
          name: "socialMedia",
          value: newSocialMedia,
        },
      })
    }
  }

  const removeSocialMedia = (index) => {
    const newSocialMedia = socialMediaLinks.filter((_, i) => i !== index)
    setSocialMediaLinks(newSocialMedia)
    handleChange({
      target: {
        name: "socialMedia",
        value: newSocialMedia,
      },
    })
  }

  const getSubjectNameById = (id) => {
    const subject = subjects.find((s) => s._id === id)
    return subject ? subject.name : id
  }

  const handleGovernmentSelect = (e) => {
    handleGovernmentChange(e.target.value)
  }

  const shouldShowCenters = userData.teachesAtType === "Both" || userData.teachesAtType === "Center"
  const shouldShowSchool = userData.teachesAtType === "Both" || userData.teachesAtType === "School"

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-control">
          <div className="flex flex-col gap-2">
            <label className="label py-0">
              <span className="label-text font-bold" style={{ color: "#1F2937" }}>{t("fields.phoneNumber") || "Phone Number"}</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              name="phoneNumber"
              className="input w-full rounded-xl"
              style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
              value={userData.phoneNumber || ""}
              onChange={handlePhoneInputChange}
              placeholder={t("placeholders.phoneNumber") || "Enter phone number"}
              required
            />
          </div>
        </div>

        <div className="form-control">
          <div className="flex flex-col gap-2">
            <label className="label py-0">
              <span className="label-text font-bold" style={{ color: "#1F2937" }}>{t("fields.phoneNumber2") || "Phone Number 2 (Optional)"}</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              name="phoneNumber2"
              className="input w-full rounded-xl"
              style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
              value={userData.phoneNumber2 || ""}
              onChange={handlePhoneInputChange}
              placeholder={t("placeholders.phoneNumber2") || "Enter second phone number"}
            />
          </div>
        </div>
      </div>

      <div className="form-control">
        <div className="flex flex-col gap-2">
          <label className="label py-0">
            <span className="label-text font-bold" style={{ color: "#1F2937" }}>{t("fields.subject") || "Subject"}</span>
          </label>
          <DSSelect
            name="subject"
            className="select w-full rounded-xl"
            style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
            value={userData.subject || ""}
            onChange={handleChange}
            required
          >
            <option value="">{t("placeholders.selectSubject") || "Select Subject"}</option>
            {subjects.map((subject) => (
              <option key={subject._id} value={subject._id}>
                {subject.name}
              </option>
            ))}
          </DSSelect>
        </div>
      </div>

      <div className="form-control">
        <div className="flex flex-col gap-2">
          <label className="label py-0">
            <span className="label-text font-bold" style={{ color: "#1F2937" }}>{t("fields.levels") || "Teaching Levels"}</span>
          </label>
          <DSSelect
            className="select w-full rounded-xl"
            style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
            onChange={handleLevelSelect}
            value=""
          >
            <option value="">{t("placeholders.selectLevel") || "Select Level"}</option>
            {stageOptions.map((level) => (
              <option key={level.value} value={level.value} disabled={selectedLevels.includes(level.value)}>
                {level.label}
              </option>
            ))}
          </DSSelect>
          {selectedLevels.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedLevels.map((levelValue) => {
                const levelLabel =
                  stageOptions.find((option) => option.value === levelValue)?.label ||
                  getStageDisplayName(levelValue, isRTL ? "ar" : "en")

                return (
                  <div key={levelValue} className="badge badge-primary gap-2">
                    {levelLabel}
                    <button type="button" className="btn btn-ghost btn-xs" onClick={() => removeLevel(levelValue)}>
                      ×
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="form-control">
        <div className="flex flex-col gap-2">
          <label className="label py-0">
            <span className="label-text font-bold" style={{ color: "#1F2937" }}>{t("fields.teachesAtType") || "Teaches At"}</span>
          </label>
          <DSSelect
            name="teachesAtType"
            className="select w-full rounded-xl"
            style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
            value={userData.teachesAtType || ""}
            onChange={handleChange}
            required
          >
            <option value="">{t("placeholders.selectTeachesAt") || "Select where you teach"}</option>
            <option value="Both">{t("options.both") || "Both Center & School"}</option>
            <option value="Center">{t("options.center") || "Center Only"}</option>
            <option value="School">{t("options.school") || "School Only"}</option>
          </DSSelect>
        </div>
      </div>

      {shouldShowCenters && (
        <div className="form-control">
          <div className="flex flex-col gap-2">
            <label className="label py-0">
              <span className="label-text font-bold" style={{ color: "#1F2937" }}>{t("fields.centers") || "Centers"}</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="centerInput"
                className="input w-full rounded-xl flex-1"
                style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
                placeholder={t("placeholders.centerName") || "Enter center name"}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addCenter()
                  }
                }}
              />
              <button type="button" className="btn btn-secondary" onClick={addCenter}>
                {t("buttons.add") || "Add"}
              </button>
            </div>
            {selectedCenters.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedCenters.map((center, index) => (
                  <div key={index} className="badge badge-secondary gap-2">
                    {center}
                    <button type="button" className="btn btn-ghost btn-xs" onClick={() => removeCenter(center)}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {shouldShowSchool && (
        <div className="form-control">
          <div className="flex flex-col gap-2">
            <label className="label py-0">
              <span className="label-text font-bold" style={{ color: "#1F2937" }}>{t("fields.school") || "School"}</span>
            </label>
            <input
              type="text"
              name="school"
              className="input w-full rounded-xl"
              style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
              value={userData.school || ""}
              onChange={handleChange}
              placeholder={t("placeholders.school") || "Enter school name"}
              required={shouldShowSchool}
            />
          </div>
        </div>
      )}

      <div className="form-control">
        <div className="flex flex-col gap-2">
          <label className="label py-0">
            <span className="label-text font-bold" style={{ color: "#1F2937" }}>{t("fields.government") || "Government"}</span>
          </label>
          <DSSelect
            name="government"
            className="select w-full rounded-xl"
            style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
            value={userData.government || ""}
            onChange={handleGovernmentSelect}
            required
          >
            <option value="">{t("fields.selectGovernment") || "Select Government"}</option>
            {governments.map((government) => (
              <option key={government._id} value={government.name}>
                {government.name}
              </option>
            ))}
          </DSSelect>
        </div>
      </div>

      <div className="form-control">
        <div className="flex flex-col gap-2">
          <label className="label py-0">
            <span className="label-text font-bold" style={{ color: "#1F2937" }}>
              {t("fields.administrationZone") || (isRTL ? "الإدارة التعليمية" : "Administration Zone")}
            </span>
          </label>
          <DSSelect
            disabled={!userData.government || loadingZones}
            name="administrationZone"
            className="select w-full rounded-xl"
            style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
            value={userData.administrationZone || ""}
            onChange={handleChange}
            required
          >
            <option value="">
              {loadingZones
                ? t("fields.loadingZones") || (isRTL ? "جاري تحميل الإدارة التعليمية..." : "Loading administration zones...")
                : t("fields.selectAdministrationZone") || (isRTL ? "اختر الإدارة التعليمية" : "Select Administration Zone")}
            </option>
            {administrationZones.map((zone, index) => (
              <option key={index} value={zone}>
                {zone}
              </option>
            ))}
          </DSSelect>
          {loadingZones && (
            <div className="flex items-center gap-2 mt-1">
              <span className="loading loading-spinner loading-xs"></span>
              <span className="text-xs text-gray-500">
                {t("fields.loadingZones") || (isRTL ? "جاري تحميل الإدارة التعليمية..." : "Loading administration zones...")}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="form-control">
        <div className="flex flex-col gap-2">
          <label className="label py-0">
            <span className="label-text font-bold" style={{ color: "#1F2937" }}>{t("fields.socialMedia") || "Social Media (Optional)"}</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <DSSelect id="socialPlatform" className="select w-full rounded-xl" style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}>
              <option value="">{t("placeholders.selectPlatform") || "Select Platform"}</option>
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
              <option value="Twitter">Twitter</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="YouTube">YouTube</option>
              <option value="TikTok">TikTok</option>
            </DSSelect>
            <input
              type="text"
              id="socialAccount"
              className="input w-full rounded-xl"
              style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
              placeholder={t("placeholders.socialAccount") || "Enter account/username"}
            />
            <button type="button" className="btn btn-secondary" onClick={addSocialMedia}>
              {t("buttons.add") || "Add"}
            </button>
          </div>
          {socialMediaLinks.length > 0 && (
            <div className="space-y-2 mt-2">
              {socialMediaLinks.map((social, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-base-200 rounded">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-outline">{social.platform}</span>
                    <span className="text-sm truncate">{social.account}</span>
                  </div>
                  <button type="button" className="btn btn-ghost btn-xs" onClick={() => removeSocialMedia(index)}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="form-control">
        <div className="flex flex-col gap-2">
          <label className="label py-0">
            <span className="label-text font-bold" style={{ color: "#1F2937" }}>{t("fields.subject") || "Subject"}</span>
          </label>
          <DSSelect
            name="subject"
            className="select w-full rounded-xl"
            style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
            value={userData.subject || ""}
            onChange={handleChange}
            required
          >
            <option value="">{t("placeholders.selectSubject") || "Select Subject"}</option>
            {subjects.map((subject) => (
              <option key={subject._id} value={subject._id}>
                {getSubjectNameById(subject._id)}
              </option>
            ))}
          </DSSelect>
        </div>
      </div>
    </div>
  )
}

export default TeacherForm
