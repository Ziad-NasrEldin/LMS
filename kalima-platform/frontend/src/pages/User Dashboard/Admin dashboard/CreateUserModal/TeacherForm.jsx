"use client"

import { useState } from "react"

const TeacherForm = ({
  userData,
  handleChange,
  handleGovernmentChange,
  subjects,
  levels,
  governments,
  administrationZones,
  loadingZones,
  t,
  isRTL,
}) => {
  const [selectedLevels, setSelectedLevels] = useState(userData.level || [])
  const [selectedCenters, setSelectedCenters] = useState(userData.centers || [])
  const [socialMediaLinks, setSocialMediaLinks] = useState(userData.socialMedia || [])

  // Handle level selection - use level values instead of IDs
  const handleLevelSelect = (e) => {
    const levelValue = e.target.value
    if (!levelValue) return

    if (!selectedLevels.includes(levelValue)) {
      const newLevels = [...selectedLevels, levelValue]
      setSelectedLevels(newLevels)
      const syntheticEvent = {
        target: {
          name: "level",
          value: newLevels,
        },
      }
      handleChange(syntheticEvent)
    }
  }

  const removeLevel = (levelValue) => {
    const newLevels = selectedLevels.filter((level) => level !== levelValue)
    setSelectedLevels(newLevels)
    const syntheticEvent = {
      target: {
        name: "level",
        value: newLevels,
      },
    }
    handleChange(syntheticEvent)
  }

  // Handle centers
  const addCenter = () => {
    const centerInput = document.getElementById("centerInput")
    const centerName = centerInput.value.trim()
    if (centerName && !selectedCenters.includes(centerName)) {
      const newCenters = [...selectedCenters, centerName]
      setSelectedCenters(newCenters)
      centerInput.value = ""
      const syntheticEvent = {
        target: {
          name: "centers",
          value: newCenters,
        },
      }
      handleChange(syntheticEvent)
    }
  }

  const removeCenter = (centerName) => {
    const newCenters = selectedCenters.filter((center) => center !== centerName)
    setSelectedCenters(newCenters)
    const syntheticEvent = {
      target: {
        name: "centers",
        value: newCenters,
      },
    }
    handleChange(syntheticEvent)
  }

  const toEnglishDigits = (str) => str.replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[^\d]/g, "")

  const handlePhoneInputChange = (e) => {
    const { name, value } = e.target
    const cleanedValue = toEnglishDigits(value)
    handleChange({ target: { name, value: cleanedValue } })
  }

  // Handle social media - Fixed to use 'account' instead of 'link'
  const addSocialMedia = () => {
    const platformInput = document.getElementById("socialPlatform")
    const accountInput = document.getElementById("socialAccount")
    const platform = platformInput.value
    const account = accountInput.value.trim()

    if (platform && account) {
      const newSocialMedia = [...socialMediaLinks, { platform, account }]
      setSocialMediaLinks(newSocialMedia)
      platformInput.value = ""
      accountInput.value = ""
      const syntheticEvent = {
        target: {
          name: "socialMedia",
          value: newSocialMedia,
        },
      }
      handleChange(syntheticEvent)
    }
  }

  const removeSocialMedia = (index) => {
    const newSocialMedia = socialMediaLinks.filter((_, i) => i !== index)
    setSocialMediaLinks(newSocialMedia)
    const syntheticEvent = {
      target: {
        name: "socialMedia",
        value: newSocialMedia,
      },
    }
    handleChange(syntheticEvent)
  }

  // Find subject name by ID
  const getSubjectNameById = (id) => {
    const subject = subjects.find((s) => s._id === id)
    return subject ? subject.name : id
  }

  // Get level display name - handle both database objects and simple strings
  const getLevelDisplayName = (levelValue) => {
    // If levels is an array of objects with name/value properties
    if (levels.length > 0 && typeof levels[0] === "object") {
      const level = levels.find((l) => l.value === levelValue || l._id === levelValue)
      return level ? level.name || level.value : levelValue
    }
    // If levels is an array of strings or simple values
    return levelValue
  }

  const handleGovernmentSelect = (e) => {
    const governmentName = e.target.value
    handleGovernmentChange(governmentName)
  }

  const shouldShowCenters = userData.teachesAtType === "Both" || userData.teachesAtType === "Center"
  const shouldShowSchool = userData.teachesAtType === "Both" || userData.teachesAtType === "School"

  // Define the allowed level values
  const allowedLevels = [
    { value: "primary", label: t("levels.primary") || "Primary" },
    { value: "preparatory", label: t("levels.preparatory") || "Preparatory" },
    { value: "secondary", label: t("levels.secondary") || "Secondary" },
  ]

  return (
    <div className="space-y-4">
      {/* Phone Numbers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-control">
          <div className="flex flex-col gap-2">
            <label className="label">
              <span className="label-text">{t("fields.phoneNumber") || "Phone Number"}</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              name="phoneNumber"
              className="input input-bordered"
              value={userData.phoneNumber || ""}
              onChange={handlePhoneInputChange}
              placeholder={t("placeholders.phoneNumber") || "Enter phone number"}
              required
            />
          </div>
        </div>
        <div className="form-control">
          <div className="flex flex-col gap-2">
            <label className="label">
              <span className="label-text">{t("fields.phoneNumber2") || "Phone Number 2 (Optional)"}</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              name="phoneNumber2"
              className="input input-bordered"
              value={userData.phoneNumber2 || ""}
              onChange={handlePhoneInputChange}
              placeholder={t("placeholders.phoneNumber2") || "Enter second phone number"}
            />
          </div>
        </div>
      </div>

      {/* Subject Selection */}
      <div className="form-control">
        <div className="flex flex-col gap-2">
          <label className="label">
            <span className="label-text">{t("fields.subject") || "Subject"}</span>
          </label>
          <select
            name="subject"
            className="select select-bordered"
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
          </select>
        </div>
      </div>

      {/* Level Selection (Multiple) - Use predefined level values */}
      <div className="form-control">
        <div className="flex flex-col gap-2">
          <label className="label">
            <span className="label-text">{t("fields.levels") || "Teaching Levels"}</span>
          </label>
          <select className="select select-bordered" onChange={handleLevelSelect} value="">
            <option value="">{t("placeholders.selectLevel") || "Select Level"}</option>
            {allowedLevels.map((level) => (
              <option key={level.value} value={level.value} disabled={selectedLevels.includes(level.value)}>
                {level.label}
              </option>
            ))}
          </select>
          {selectedLevels.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedLevels.map((levelValue) => (
                <div key={levelValue} className="badge badge-primary gap-2">
                  {getLevelDisplayName(levelValue)}
                  <button type="button" className="btn btn-ghost btn-xs" onClick={() => removeLevel(levelValue)}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Teaches At Type */}
      <div className="form-control">
        <div className="flex flex-col gap-2">
          <label className="label">
            <span className="label-text">{t("fields.teachesAtType") || "Teaches At"}</span>
          </label>
          <select
            name="teachesAtType"
            className="select select-bordered"
            value={userData.teachesAtType || ""}
            onChange={handleChange}
            required
          >
            <option value="">{t("placeholders.selectTeachesAt") || "Select where you teach"}</option>
            <option value="Both">{t("options.both") || "Both Center & School"}</option>
            <option value="Center">{t("options.center") || "Center Only"}</option>
            <option value="School">{t("options.school") || "School Only"}</option>
          </select>
        </div>
      </div>

      {/* Centers - Show if teachesAtType is "Both" or "Center" */}
      {shouldShowCenters && (
        <div className="form-control">
          <div className="flex flex-col gap-2">
            <label className="label">
              <span className="label-text">{t("fields.centers") || "Centers"}</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="centerInput"
                className="input input-bordered flex-1"
                placeholder={t("placeholders.centerName") || "Enter center name"}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCenter())}
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

      {/* School - Show if teachesAtType is "Both" or "School" */}
      {shouldShowSchool && (
        <div className="form-control">
          <div className="flex flex-col gap-2">
            <label className="label">
              <span className="label-text">{t("fields.school") || "School"}</span>
            </label>
            <input
              type="text"
              name="school"
              className="input input-bordered"
              value={userData.school || ""}
              onChange={handleChange}
              placeholder={t("placeholders.school") || "Enter school name"}
              required={shouldShowSchool}
            />
          </div>
        </div>
      )}

      {/* Government Selection */}
      <div className="form-control">
        <div className="flex flex-col gap-2">
          <label className="label">
            <span className="label-text">{t("fields.government") || "Government"}</span>
          </label>
          <select
            name="government"
            className="select select-bordered w-2/3 lg:w-1/2"
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
          </select>
        </div>
      </div>

      {/* Administration Zone Selection */}
      <div className="form-control">
        <div className="flex flex-col gap-2">
          <label className="label">
            <span className="label-text">{t("fields.administrationZone") || "Administration Zone"}</span>
          </label>
          <select
            disabled={!userData.government || loadingZones}
            name="administrationZone"
            className="select select-bordered w-2/3 lg:w-1/2"
            value={userData.administrationZone || ""}
            onChange={handleChange}
            required
          >
            <option value="">
              {loadingZones
                ? t("fields.loadingZones") || "Loading zones..."
                : t("fields.selectAdministrationZone") || "Select Administration Zone"}
            </option>
            {administrationZones.map((zone, index) => (
              <option key={index} value={zone}>
                {zone}
              </option>
            ))}
          </select>
          {loadingZones && (
            <div className="flex items-center gap-2 mt-1">
              <span className="loading loading-spinner loading-xs"></span>
              <span className="text-xs text-gray-500">
                {t("fields.loadingZones") || "Loading administration zones..."}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Social Media (Optional) - Updated to use 'account' */}
      <div className="form-control">
        <div className="flex flex-col gap-2">
          <label className="label">
            <span className="label-text">{t("fields.socialMedia") || "Social Media (Optional)"}</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <select id="socialPlatform" className="select select-bordered">
              <option value="">{t("placeholders.selectPlatform") || "Select Platform"}</option>
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
              <option value="Twitter">Twitter</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="YouTube">YouTube</option>
              <option value="TikTok">TikTok</option>
            </select>
            <input
              type="text"
              id="socialAccount"
              className="input input-bordered"
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
    </div>
  )
}

export default TeacherForm
