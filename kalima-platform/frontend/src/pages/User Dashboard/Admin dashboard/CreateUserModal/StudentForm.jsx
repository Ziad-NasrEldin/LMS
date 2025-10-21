"use client"

import { useState } from "react"

const StudentForm = ({
  userData,
  handleChange,
  handleGovernmentChange,
  levels,
  governments,
  administrationZones,
  loadingZones,
  t,
  isRTL,
}) => {
  const [hobby, setHobby] = useState("")

  const addHobby = () => {
    if (hobby.trim()) {
      userData.hobbies = [...(userData.hobbies || []), hobby.trim()]
      setHobby("")
    }
  }

  const removeHobby = (index) => {
    userData.hobbies = userData.hobbies.filter((_, i) => i !== index)
  }

  const toEnglishDigits = (str) => str.replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[^\d]/g, "")

  const handlePhoneInputChange = (e) => {
    const { name, value } = e.target
    const cleanedValue = toEnglishDigits(value)
    handleChange({ target: { name, value: cleanedValue } })
  }

  const handleGovernmentSelect = (e) => {
    const governmentName = e.target.value
    handleGovernmentChange(governmentName)
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-control">
          <div className="flex flex-col gap-4">
            <label className="label">
              <span className="label-text">{t("fields.level")}</span>
            </label>
            <select
              name="level"
              className="select select-bordered"
              value={userData.level || ""}
              onChange={handleChange}
              required
            >
              <option value="">{t("placeholders.selectLevel")}</option>
              {levels.map((level) => (
                <option key={level._id} value={level._id}>
                  {level.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-control">
          <div className="flex flex-col gap-4">
            <label className="label">
              <span className="label-text">{t("fields.phoneNumber")}</span>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-control">
          <div className="flex flex-col gap-4">
            <label className="label">
              <span className="label-text">{t("fields.sequencedIdOptional")}</span>
            </label>
            <input
              type="text"
              name="sequencedId"
              className="input input-bordered"
              value={userData.sequencedId || ""}
              onChange={handleChange}
              placeholder={t("placeholders.sequencedId")}
            />
          </div>
        </div>
        <div className="form-control">
          <div className="flex flex-col gap-4">
            <label className="label">
              <span className="label-text">{t("fields.parentPhoneNumberOptional")}</span>
            </label>
            <input
              type="text"
              name="parentPhoneNumber"
              className="input input-bordered"
              value={userData.parentPhoneNumber || ""}
              onChange={handleChange}
              placeholder={t("placeholders.parentPhoneNumber")}
            />
          </div>
        </div>
      </div>

      {/* Government Selection */}
      <div className="form-control relative pb-5">
        <div className="flex flex-col gap-2">
          <label className="label">
            <span className="label-text">{t("fields.government") || "Government"}</span>
          </label>
          <select
            name="government"
            className="select select-bordered w-2/3 lg:w-1/2"
            value={userData.government || ""}
            onChange={handleGovernmentSelect}
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

      {/* Administration Zone Selection - Only show if government is selected */}
      <div className="form-control relative pb-5">
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

      <div className="form-control">
        <label className="label">
          <span className="label-text">{t("fields.hobbiesOptional")}</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            className="input input-bordered flex-1"
            value={hobby}
            onChange={(e) => setHobby(e.target.value)}
            placeholder={t("placeholders.addHobby")}
          />
          <button type="button" className="btn btn-secondary" onClick={addHobby}>
            {t("buttons.add")}
          </button>
        </div>
        {userData.hobbies && userData.hobbies.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {userData.hobbies.map((h, index) => (
              <div key={index} className="badge badge-secondary gap-1">
                {h}
                <button type="button" className="btn btn-ghost btn-xs" onClick={() => removeHobby(index)}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default StudentForm
