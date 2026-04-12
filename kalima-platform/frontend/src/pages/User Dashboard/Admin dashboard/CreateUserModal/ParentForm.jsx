"use client"

import { getLevelOptionLabel } from "../../../../utils/levelHierarchy"
import DSSelect from "../../../../components/DSSelect"

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
  fieldErrors = {},
}) => {
  const gradeOptionsFromHierarchy = Array.isArray(levelHierarchy?.gradeOptions) ? levelHierarchy.gradeOptions : []
  const gradeOptionsFromGrades = Array.isArray(levelHierarchy?.grades)
    ? levelHierarchy.grades.map((grade) => ({
        value: grade?._id || grade?.value,
        label: grade?.displayName || getLevelOptionLabel(grade, isRTL ? "ar" : "en"),
        raw: grade,
      })).filter((option) => option.value)
    : []
  const fallbackLevelOptions = Array.isArray(levelHierarchy?.activeLevels)
    ? levelHierarchy.activeLevels
        .filter((level) => level?.kind !== "stage")
        .map((level) => ({
          value: level?._id || level?.value,
          label: level?.displayName || getLevelOptionLabel(level, isRTL ? "ar" : "en"),
          raw: level,
        }))
        .filter((option) => option.value)
    : []

  const gradeOptions = gradeOptionsFromHierarchy.length
    ? gradeOptionsFromHierarchy
    : gradeOptionsFromGrades.length
      ? gradeOptionsFromGrades
      : fallbackLevelOptions

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
          {fieldErrors.phoneNumber && <p className="text-sm text-error">{fieldErrors.phoneNumber}</p>}
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
          {fieldErrors.profession && <p className="text-sm text-error">{fieldErrors.profession}</p>}
        </div>
      </div>

      <div className="form-control">
        <div className="flex flex-col gap-2">
          <label className="label py-0">
            <span className="label-text font-bold" style={{ color: "#1F2937" }}>
              {t("fields.levelOptional") || t("fields.level")}
            </span>
          </label>
          <DSSelect
            name="level"
            className="select w-full rounded-xl"
            style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: fieldErrors.level ? "#DC2626" : "rgba(17,24,39,0.1)", color: "#1F2937" }}
            value={userData.level || ""}
            onChange={handleChange}
          >
            <option value="" disabled={gradeOptions.length === 0}>
              {gradeOptions.length === 0
                ? t("placeholders.noGradesAvailable") || "No grades available"
                : t("placeholders.selectGradeLevel") || t("placeholders.selectLevel") || "Select grade"}
            </option>
            {gradeOptions.map((level) => (
              <option key={level.value || level._id} value={level.value || level._id}>
                {level.label || level.displayName || getLevelOptionLabel(level, isRTL ? "ar" : "en")}
              </option>
            ))}
          </DSSelect>
          {fieldErrors.level && <p className="text-sm text-error">{fieldErrors.level}</p>}
        </div>
      </div>

      <div className="form-control">
        <div className="flex flex-col gap-2">
          <label className="label py-0">
            <span className="label-text font-bold" style={{ color: "#1F2937" }}>{t("fields.government") || "Government"}</span>
          </label>
          <DSSelect
            name="government"
            className="select w-full rounded-xl"
            style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: fieldErrors.government ? "#DC2626" : "rgba(17,24,39,0.1)", color: "#1F2937" }}
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
          {fieldErrors.government && <p className="text-sm text-error">{fieldErrors.government}</p>}
        </div>
      </div>

      <div className="form-control">
        <div className="flex flex-col gap-2">
          <label className="label py-0">
            <span className="label-text font-bold" style={{ color: "#1F2937" }}>
              {t("fields.administrationZone")}
            </span>
          </label>
          <DSSelect
            disabled={!userData.government || loadingZones}
            name="administrationZone"
            className="select w-full rounded-xl"
            style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: fieldErrors.administrationZone ? "#DC2626" : "rgba(17,24,39,0.1)", color: "#1F2937" }}
            value={userData.administrationZone || ""}
            onChange={handleChange}
            required
          >
            <option value="">
              {loadingZones
                ? t("fields.loadingZones")
                : t("fields.selectAdministrationZone")}
            </option>
            {administrationZones.map((zone, index) => (
              <option key={index} value={zone}>
                {zone}
              </option>
            ))}
          </DSSelect>
          {fieldErrors.administrationZone && <p className="text-sm text-error">{fieldErrors.administrationZone}</p>}
          {loadingZones && (
            <div className="flex items-center gap-2 mt-1">
              <span className="loading loading-spinner loading-xs"></span>
                          <span className="text-xs text-slate-600">
                {t("fields.loadingZones")}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ParentForm
