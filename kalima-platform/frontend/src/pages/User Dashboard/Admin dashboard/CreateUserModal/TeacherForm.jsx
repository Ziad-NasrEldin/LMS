"use client"

import { useState, useEffect } from "react"
import { STAGE_KEYS, getStageDisplayName } from "../../../../utils/levelHierarchy"
import DSSelect from "../../../../components/DSSelect"
import Button from "../../../../components/ui/Button"
import Badge from "../../../../components/ui/Badge"
import Input from "../../../../components/ui/Input"

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
  fieldErrors = {},
}) => {
  const [selectedLevels, setSelectedLevels] = useState(
    Array.isArray(userData.level) ? userData.level : userData.level ? [userData.level] : [],
  )
  const [selectedCenters, setSelectedCenters] = useState(Array.isArray(userData.centers) ? userData.centers : [])

  useEffect(() => {
    const levelsArray = Array.isArray(userData.level) ? userData.level : userData.level ? [userData.level] : []
    setSelectedLevels(levelsArray)
  }, [userData.level])

  useEffect(() => {
    setSelectedCenters(Array.isArray(userData.centers) ? userData.centers : [])
  }, [userData.centers])

  const handlePhoneInputChange = (e) => {
    const { name, value } = e.target
    const cleaned = value.replace(/[^0-9+]/g, "")
    handleChange({
      target: { name, value: cleaned },
    })
  }

  const addLevel = (levelValue) => {
    if (levelValue && !selectedLevels.includes(levelValue)) {
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
      handleChange({
        target: { name: "centers", value: newCenters },
      })
      if (centerInput) {
        centerInput.value = ""
      }
    }
  }

  const removeCenter = (center) => {
    const newCenters = selectedCenters.filter((c) => c !== center)
    setSelectedCenters(newCenters)
    handleChange({
      target: { name: "centers", value: newCenters },
    })
  }

  const shouldShowCenters = userData.teachesAtType === "Both" || userData.teachesAtType === "Center"
  const shouldShowSchool = userData.teachesAtType === "Both" || userData.teachesAtType === "School"

  const getSubjectNameById = (subjectId) => {
    const subject = subjects.find((s) => s._id === subjectId)
    return subject ? (isRTL ? subject.nameAr || subject.name : subject.name) : subjectId
  }

  const flattenLevels = (hierarchy) => {
    if (!hierarchy || !Array.isArray(hierarchy.grades)) return []
    return hierarchy.grades.map((grade) => ({
      value: grade._id || grade.value || grade.name,
      label: grade.displayName || (isRTL ? grade.nameAr || grade.name : grade.name),
      stageKey: grade.parentLevelId,
      raw: grade,
    }))
  }

  const levelOptions = flattenLevels(levelHierarchy)
  const stageOptions = Array.isArray(levelHierarchy?.stageOptions) ? levelHierarchy.stageOptions : EMPTY_STAGE_OPTIONS
  const filteredLevelOptions = userData.stage
    ? levelOptions.filter((level) => level.stageKey === userData.stage)
    : levelOptions

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="mb-4">
          <div className="flex flex-col gap-2">
            <label className="block mb-1">
              <span className="text-sm font-bold" style={{ color: "#1F2937" }}>
                {t("fields.phoneNumber") || "Phone Number"}
              </span>
            </label>
            <Input
              type="text"
              inputMode="numeric"
              name="phoneNumber"
              className="w-full rounded-xl"
              variant={fieldErrors.phoneNumber ? "error" : "default"}
              style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
              value={userData.phoneNumber || ""}
              onChange={handlePhoneInputChange}
              placeholder={t("placeholders.phoneNumber") || "Enter phone number"}
              error={fieldErrors.phoneNumber}
              required
            />
          </div>
        </div>

        <div className="mb-4">
          <div className="flex flex-col gap-2">
            <label className="block mb-1">
              <span className="text-sm font-bold" style={{ color: "#1F2937" }}>
                {t("fields.phoneNumber2") || "Phone Number 2 (Optional)"}
              </span>
            </label>
            <Input
              type="text"
              inputMode="numeric"
              name="phoneNumber2"
              className="w-full rounded-xl"
              variant={fieldErrors.phoneNumber2 ? "error" : "default"}
              style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
              value={userData.phoneNumber2 || ""}
              onChange={handlePhoneInputChange}
              placeholder={t("placeholders.phoneNumber2") || "Enter second phone number"}
              error={fieldErrors.phoneNumber2}
            />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex flex-col gap-2">
          <label className="block mb-1">
            <span className="text-sm font-bold" style={{ color: "#1F2937" }}>
              {t("fields.teachesAtType") || "Teaching Location Type"}
            </span>
          </label>
          <DSSelect
            name="teachesAtType"
            className="select w-full rounded-xl"
            style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: fieldErrors.teachesAtType ? "#DC2626" : "rgba(17,24,39,0.1)", color: "#1F2937" }}
            value={userData.teachesAtType || ""}
            onChange={handleChange}
            required
          >
            <option value="">{t("placeholders.selectTeachingType") || "Select Type"}</option>
            <option value="Center">{t("options.center") || "Center"}</option>
            <option value="School">{t("options.school") || "School"}</option>
            <option value="Both">{t("options.both") || "Both"}</option>
          </DSSelect>
          {fieldErrors.teachesAtType && <p className="text-sm text-error">{fieldErrors.teachesAtType}</p>}
        </div>
      </div>

      {shouldShowCenters && (
        <div className="mb-4">
          <div className="flex flex-col gap-2">
            <label className="block mb-1">
              <span className="text-sm font-bold" style={{ color: "#1F2937" }}>
                {t("fields.center") || "Center"}
              </span>
            </label>
            <div className="flex gap-2">
              <Input
                id="centerInput"
                type="text"
                name="center"
                className="w-full rounded-xl"
                style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
                placeholder={t("placeholders.enterCenterName") || "Enter center name"}
              />
              <Button type="button" variant="secondary" onClick={addCenter}>
                {t("buttons.add") || "Add"}
              </Button>
            </div>
            {fieldErrors.centers && <p className="text-sm text-error">{fieldErrors.centers}</p>}
            {selectedCenters.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedCenters.map((center, index) => (
                  <Badge key={index} variant="secondary" className="gap-2">
                    {center}
                    <Button type="button" variant="ghost" size="xs" className="p-0 h-auto min-w-0" onClick={() => removeCenter(center)}>
                      ×
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {shouldShowSchool && (
        <div className="mb-4">
          <div className="flex flex-col gap-2">
            <label className="block mb-1">
              <span className="text-sm font-bold" style={{ color: "#1F2937" }}>
                {t("fields.school") || "School"}
              </span>
            </label>
            <Input
              type="text"
              name="school"
              className="w-full rounded-xl"
              variant={fieldErrors.school ? "error" : "default"}
              style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
              value={userData.school || ""}
              onChange={handleChange}
              placeholder={t("placeholders.school") || "Enter school name"}
              error={fieldErrors.school}
              required={shouldShowSchool}
            />
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="flex flex-col gap-2">
          <label className="block mb-1">
            <span className="text-sm font-bold" style={{ color: "#1F2937" }}>
              {t("fields.government") || "Government"}
            </span>
          </label>
          <DSSelect
            name="government"
            className="select w-full rounded-xl"
            style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: fieldErrors.government ? "#DC2626" : "rgba(17,24,39,0.1)", color: "#1F2937" }}
            value={userData.government || ""}
            onChange={(e) => handleGovernmentChange(e.target.value)}
            required
          >
            <option value="">{t("fields.selectGovernment") || "Select Government"}</option>
            {governments?.map((gov) => (
              <option key={gov._id} value={gov.name}>
                {isRTL ? gov.nameAr || gov.name : gov.name}
              </option>
            ))}
          </DSSelect>
          {fieldErrors.government && <p className="text-sm text-error">{fieldErrors.government}</p>}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex flex-col gap-2">
          <label className="block mb-1">
            <span className="text-sm font-bold" style={{ color: "#1F2937" }}>
              {t("fields.administrationZone") || "Administration Zone"}
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
                ? t("fields.loadingZones") || (isRTL ? "جاري تحميل الإدارة التعليمية..." : "Loading administration zones...")
                : t("fields.selectAdministrationZone") || (isRTL ? "اختر الإدارة التعليمية" : "Select Administration Zone")}
            </option>
            {administrationZones?.map((zone) => (
              <option key={zone._id} value={zone.name}>
                {isRTL ? zone.nameAr || zone.name : zone.name}
              </option>
            ))}
          </DSSelect>
          {fieldErrors.administrationZone && <p className="text-sm text-error">{fieldErrors.administrationZone}</p>}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex flex-col gap-2">
          <label className="block mb-1">
            <span className="text-sm font-bold" style={{ color: "#1F2937" }}>
              {t("fields.stage") || "Stage"}
            </span>
          </label>
          <DSSelect
            name="stage"
            className="select w-full rounded-xl"
            style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: fieldErrors.stage ? "#DC2626" : "rgba(17,24,39,0.1)", color: "#1F2937" }}
            value={userData.stage || ""}
            onChange={(e) => {
              handleChange(e)
              setSelectedLevels([])
              handleChange({ target: { name: "level", value: [] } })
            }}
            required
          >
            <option value="">{t("placeholders.selectStage") || "Select Stage"}</option>
            {stageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label || getStageDisplayName(option.value, isRTL ? "ar" : "en")}
              </option>
            ))}
          </DSSelect>
          {fieldErrors.stage && <p className="text-sm text-error">{fieldErrors.stage}</p>}
        </div>
      </div>

      {userData.stage && (
        <div className="mb-4">
          <div className="flex flex-col gap-2">
            <label className="block mb-1">
              <span className="text-sm font-bold" style={{ color: "#1F2937" }}>
                {t("fields.levels") || "Levels"}
              </span>
            </label>
            <DSSelect
              name="levelSelect"
              className="select w-full rounded-xl"
              style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: fieldErrors.level ? "#DC2626" : "rgba(17,24,39,0.1)", color: "#1F2937" }}
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  addLevel(e.target.value)
                }
              }}
            >
              <option value="">{t("placeholders.selectLevels") || "Select Level to Add"}</option>
              {filteredLevelOptions
                .filter((level) => !selectedLevels.includes(level.value))
                .map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
            </DSSelect>
            {fieldErrors.level && <p className="text-sm text-error">{fieldErrors.level}</p>}
            {selectedLevels.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedLevels.map((level) => (
                  <Badge key={level} variant="secondary" className="gap-2">
                    {levelOptions.find((option) => option.value === level)?.label || level}
                    <Button type="button" variant="ghost" size="xs" className="p-0 h-auto min-w-0" onClick={() => removeLevel(level)}>
                      ×
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="flex flex-col gap-2">
          <label className="block mb-1">
            <span className="text-sm font-bold" style={{ color: "#1F2937" }}>
              {t("fields.subject") || "Subject"}
            </span>
          </label>
          <DSSelect
            name="subject"
            className="select w-full rounded-xl"
            style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: fieldErrors.subject ? "#DC2626" : "rgba(17,24,39,0.1)", color: "#1F2937" }}
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
          {fieldErrors.subject && <p className="text-sm text-error">{fieldErrors.subject}</p>}
        </div>
      </div>
    </div>
  )
}

export default TeacherForm
