"use client"

import { getLevelOptionLabel } from "../../../../utils/levelHierarchy"

const ParentForm = ({
  userData,
  handleChange,
  handleGovernmentChange,
  levelHierarchy,
  governments,
  administrationZones,
  loadingZones,
  t,
  isRTL,
}) => {
  const gradeOptions = levelHierarchy?.gradeOptions || []

  const toEnglishDigits = (str) => String(str || "").replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[^\d]/g, "")

  const handlePhoneInputChange = (e) => {
    const { name, value } = e.target
    const cleanedValue = toEnglishDigits(value)
    handleChange({ target: { name, value: cleanedValue } })
  }

  const handleGovernmentSelect = (e) => {
    handleGovernmentChange(e.target.value)
  }

  return (
    <div className="space-y-4">
      <div className="form-control">
        <div className="flex flex-col gap-2">
          <label className="label py-0">
            <span className="label-text font-bold" style={{ color: "#1F2937" }}>{t("fields.phoneNumber")}</span>
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
            <span className="label-text font-bold" style={{ color: "#1F2937" }}>
              {t("fields.profession") || "Profession"}
            </span>
          </label>
          <input
            type="text"
            name="profession"
            className="input w-full rounded-xl"
            style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
            value={userData.profession || ""}
            onChange={handleChange}
            placeholder={t("placeholders.profession") || "Enter profession"}
            required
          />
        </div>
      </div>

      <div className="form-control">
        <div className="flex flex-col gap-2">
          <label className="label py-0">
            <span className="label-text font-bold" style={{ color: "#1F2937" }}>{t("fields.level")}</span>
          </label>
          <select
            name="level"
            className="select w-full rounded-xl"
            style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
            value={userData.level || ""}
            onChange={handleChange}
          >
            <option value="">{t("placeholders.selectGradeLevel") || t("placeholders.selectLevel") || "Select grade"}</option>
            {gradeOptions.map((level) => (
              <option key={level.value || level._id} value={level.value || level._id}>
                {level.label || level.displayName || getLevelOptionLabel(level, isRTL ? "ar" : "en")}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-control">
        <div className="flex flex-col gap-2">
          <label className="label py-0">
            <span className="label-text font-bold" style={{ color: "#1F2937" }}>{t("fields.government") || "Government"}</span>
          </label>
          <select
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
          </select>
        </div>
      </div>

      <div className="form-control">
        <div className="flex flex-col gap-2">
          <label className="label py-0">
            <span className="label-text font-bold" style={{ color: "#1F2937" }}>
              {t("fields.administrationZone") || (isRTL ? "الإدارة التعليمية" : "Administration Zone")}
            </span>
          </label>
          <select
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
          </select>
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
    </div>
  )
}

export default ParentForm
