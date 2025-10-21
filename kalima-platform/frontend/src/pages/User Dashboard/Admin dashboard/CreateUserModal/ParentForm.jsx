"use client"

const ParentForm = ({
  userData,
  handleChange,
  handleGovernmentChange,
  governments,
  administrationZones,
  loadingZones,
  t,
  isRTL,
}) => {
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
    <div className="space-y-4">
      {/* Phone Number Field */}
      <div className="form-control">
        <div className="flex flex-col gap-2">
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
    </div>
  )
}

export default ParentForm
