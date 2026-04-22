"use client"

import { useState } from "react"
import { getLevelOptionLabel, getGradeOptionsForStage, getStageDisplayName, STAGE_KEYS } from "../../../../utils/levelHierarchy"
import DSSelect from "../../../../components/DSSelect"
import Button from "../../../../components/ui/Button"
import { Trash2, Plus } from "lucide-react"

const EMPTY_STAGE_OPTIONS = STAGE_KEYS.map((stageKey) => ({
  value: stageKey,
  label: stageKey,
  raw: { name: stageKey, kind: "stage" },
}))

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

  const stageOptions = levelHierarchy?.stageOptions?.length
    ? levelHierarchy.stageOptions
    : EMPTY_STAGE_OPTIONS.map((stage) => ({
        ...stage,
        label: getStageDisplayName(stage.value, isRTL ? "ar" : "en"),
      }))

  const [childProfiles, setChildProfiles] = useState(
    Array.isArray(userData.childProfiles) && userData.childProfiles.length > 0
      ? userData.childProfiles
      : []
  )

  const addChildProfile = () => {
    setChildProfiles((prev) => [...prev, { stage: "", level: "", sequenceId: "" }])
  }

  const removeChildProfile = (index) => {
    setChildProfiles((prev) => prev.filter((_, i) => i !== index))
    handleChange({ target: { name: "childProfiles", value: childProfiles.filter((_, i) => i !== index) } })
  }

  const handleChildFieldChange = (index, field, value) => {
    setChildProfiles((prev) => {
      const updated = prev.map((profile, i) => {
        if (i !== index) return profile
        const updatedProfile = { ...profile, [field]: value }
        if (field === "stage") {
          updatedProfile.level = ""
        }
        return updatedProfile
      })
      handleChange({ target: { name: "childProfiles", value: updated } })
      return updated
    })
  }

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

      {/* Children Section */}
      <div className="mt-2">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-bold" style={{ color: "#1F2937" }}>
            {t("fields.children") || "Children"}
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={addChildProfile}
          >
            <Plus size={14} />
            {t("buttons.addChild") || "Add Child"}
          </Button>
        </div>

        {childProfiles.length === 0 && (
          <p className="text-xs italic" style={{ color: "rgba(17,24,39,0.5)" }}>
            {t("placeholders.noChildrenAdded") || "No children added yet. Click \"Add Child\" to add a student."}
          </p>
        )}

        {childProfiles.map((child, index) => {
          const childGradeOptions = child.stage
            ? getGradeOptionsForStage(levelHierarchy, child.stage)
            : []

          return (
            <div
              key={index}
              className="rounded-2xl border p-4 mb-3"
              style={{ borderColor: "rgba(17,24,39,0.1)", backgroundColor: "rgba(17,24,39,0.02)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold" style={{ color: "#1F2937" }}>
                  {t("fields.child") || "Child"} {index + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="gap-1 text-red-600"
                  onClick={() => removeChildProfile(index)}
                >
                  <Trash2 size={14} />
                  {t("buttons.remove") || "Remove"}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="form-control">
                  <div className="flex flex-col gap-1">
                    <label className="label py-0">
                      <span className="label-text text-sm font-bold" style={{ color: "#1F2937" }}>
                        {t("fields.stage") || "Stage"}
                      </span>
                    </label>
                    <DSSelect
                      name={`childStage_${index}`}
                      className="select w-full rounded-xl"
                      style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
                      value={child.stage || ""}
                      onChange={(e) => handleChildFieldChange(index, "stage", e.target.value)}
                      required
                    >
                      <option value="">{t("placeholders.selectStage") || "Select stage"}</option>
                      {stageOptions.map((stage) => (
                        <option key={stage.value} value={stage.value}>
                          {stage.label || getStageDisplayName(stage.value, isRTL ? "ar" : "en")}
                        </option>
                      ))}
                    </DSSelect>
                  </div>
                </div>

                <div className="form-control">
                  <div className="flex flex-col gap-1">
                    <label className="label py-0">
                      <span className="label-text text-sm font-bold" style={{ color: "#1F2937" }}>
                        {t("fields.level") || "Level"}
                      </span>
                    </label>
                    <DSSelect
                      name={`childLevel_${index}`}
                      className="select w-full rounded-xl"
                      style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
                      value={child.level || ""}
                      onChange={(e) => handleChildFieldChange(index, "level", e.target.value)}
                      disabled={!child.stage}
                      required
                    >
                      <option value="">
                        {!child.stage
                          ? t("placeholders.selectStageFirst") || "Select stage first"
                          : t("placeholders.selectGradeLevel") || "Select grade"}
                      </option>
                      {childGradeOptions.map((grade) => (
                        <option key={grade.value || grade._id} value={grade.value || grade._id}>
                          {grade.label || grade.displayName || grade.name}
                        </option>
                      ))}
                    </DSSelect>
                  </div>
                </div>
              </div>

              <div className="form-control mt-2">
                <div className="flex flex-col gap-1">
                  <label className="label py-0">
                    <span className="label-text text-sm font-bold" style={{ color: "#1F2937" }}>
                      {t("fields.studentId") || "Student ID (optional)"}
                    </span>
                  </label>
                  <input
                    type="text"
                    name={`childSequenceId_${index}`}
                    className="input w-full rounded-xl"
                    style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
                    value={child.sequenceId || ""}
                    onChange={(e) => handleChildFieldChange(index, "sequenceId", e.target.value)}
                    placeholder={t("placeholders.studentId") || "Enter student ID"}
                  />
                </div>
              </div>
            </div>
          )
        })}

        {fieldErrors.childProfiles && <p className="text-sm text-error">{fieldErrors.childProfiles}</p>}
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
