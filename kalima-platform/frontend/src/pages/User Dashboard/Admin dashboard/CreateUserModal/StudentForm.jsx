"use client"

import { Trash2 } from "lucide-react"
import { STAGE_KEYS, getGradeOptionsForStage, getStageDisplayName } from "../../../../utils/levelHierarchy"
import { STUDENT_HOBBIES } from "../../../../constants/studentHobbies"
import DSSelect from "../../../../components/DSSelect"

const EMPTY_STAGE_OPTIONS = STAGE_KEYS.map((stageKey) => ({
  value: stageKey,
  label: stageKey,
  raw: { name: stageKey, kind: "stage" },
}))

const PARENT_RELATIONS = ["mother", "father", "other"]

const ParentContactField = ({
  title,
  phoneName,
  relationName,
  phoneValue,
  relationValue,
  phoneError,
  relationError,
  phoneLabel,
  relationLabel,
  phonePlaceholder,
  relationPlaceholder,
  handleChange,
  t,
  showRemove,
  onRemove,
}) => {
  const hasPhone = Boolean(String(phoneValue || "").trim())
  const showPhoneLabel = Boolean(phoneLabel && phoneLabel !== title)

  return (
    <div className="rounded-2xl border border-gray-200 bg-white/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold" style={{ color: "#1F2937" }}>
            {title}
          </p>
        </div>

        {showRemove && (
          <button type="button" className="btn btn-ghost btn-xs gap-2 text-error" onClick={onRemove}>
            <Trash2 size={14} />
            {t("buttons.removeParentPhone")}
          </button>
        )}
      </div>

      <div className="mt-4 space-y-3">
        <div className="form-control">
          <div className="flex flex-col gap-2">
            {showPhoneLabel && (
              <label className="label py-0">
                <span className="label-text font-bold" style={{ color: "#1F2937" }}>
                  {phoneLabel}
                </span>
              </label>
            )}
            <input
              type="text"
              inputMode="numeric"
              name={phoneName}
              className="input w-full rounded-xl"
              style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
              value={phoneValue || ""}
              onChange={handleChange}
              placeholder={phonePlaceholder}
              required
            />
            {phoneError && <p className="text-sm text-error">{t(`validation.${phoneError}`)}</p>}
          </div>
        </div>

        {hasPhone && (
          <div className="form-control">
            <div className="flex flex-col gap-2">
              <label className="label py-0">
                <span className="label-text font-bold" style={{ color: "#1F2937" }}>
                  {relationLabel}
                </span>
              </label>
              <DSSelect
                name={relationName}
                className="select w-full rounded-xl"
                style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
                value={relationValue || ""}
                onChange={handleChange}
                required
              >
                <option value="">{relationPlaceholder}</option>
                {PARENT_RELATIONS.map((relation) => (
                  <option key={relation} value={relation}>
                    {t(`parentRelations.${relation}`)}
                  </option>
                ))}
              </DSSelect>
              {relationError && <p className="text-sm text-error">{t(`validation.${relationError}`)}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const StudentForm = ({
  userData,
  handleChange,
  handleGovernmentChange,
  levels,
  levelHierarchy,
  governments,
  administrationZones,
  loadingZones,
  t,
  isRTL,
}) => {
  const stageOptions = levelHierarchy?.stageOptions?.length
    ? levelHierarchy.stageOptions
    : EMPTY_STAGE_OPTIONS.map((stage) => ({
        ...stage,
        label: getStageDisplayName(stage.value, isRTL ? "ar" : "en"),
      }))

  const gradeOptions = userData.stage
    ? getGradeOptionsForStage(levelHierarchy, userData.stage)
    : levelHierarchy?.gradeOptions?.length
      ? levelHierarchy.gradeOptions
      : levels || []

  const toEnglishDigits = (str) =>
    String(str || "")
      .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
      .replace(/[^\d]/g, "")

  const handlePhoneInputChange = (e) => {
    const { name, value } = e.target
    const cleanedValue = toEnglishDigits(value)
    handleChange({ target: { name, value: cleanedValue } })
  }

  const handleGovernmentSelect = (e) => {
    handleGovernmentChange(e.target.value)
  }

  const handleStageChange = (e) => {
    const stage = e.target.value
    handleChange({ target: { name: "stage", value: stage } })
    handleChange({ target: { name: "level", value: "" } })
  }

  const handleAddAdditionalParentPhone = () => {
    handleChange({ target: { name: "hasAdditionalParentPhone", value: true } })
  }

  const handleRemoveAdditionalParentPhone = () => {
    handleChange({ target: { name: "hasAdditionalParentPhone", value: false } })
    handleChange({ target: { name: "parentPhoneNumber2", value: "" } })
    handleChange({ target: { name: "parentPhoneRelation2", value: "" } })
  }

  const hasAdditionalParentContact = Boolean(
    userData.hasAdditionalParentPhone ||
      String(userData.parentPhoneNumber2 || "").trim() ||
      String(userData.parentPhoneRelation2 || "").trim(),
  )

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-control">
          <div className="flex flex-col gap-2">
            <label className="label py-0">
              <span className="label-text font-bold" style={{ color: "#1F2937" }}>
                {t("fields.stage") || t("fields.level")}
              </span>
            </label>
            <DSSelect
              name="stage"
              className="select w-full rounded-xl"
              style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
              value={userData.stage || ""}
              onChange={handleStageChange}
              required
            >
              <option value="">{t("placeholders.selectStage") || t("placeholders.selectLevel") || "Select stage"}</option>
              {stageOptions.map((stage) => (
                <option key={stage.value} value={stage.value}>
                  {stage.label}
                </option>
              ))}
            </DSSelect>
          </div>
        </div>

        <div className="form-control">
          <div className="flex flex-col gap-2">
            <label className="label py-0">
              <span className="label-text font-bold" style={{ color: "#1F2937" }}>
                {t("fields.level")}
              </span>
            </label>
            <DSSelect
              name="level"
              className="select w-full rounded-xl"
              style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
              value={userData.level || ""}
              onChange={handleChange}
              disabled={!userData.stage}
              required
            >
              <option value="">
                {!userData.stage
                  ? t("placeholders.selectStageFirst") || t("placeholders.selectStage") || "Select stage first"
                  : t("placeholders.selectGradeLevel") || t("placeholders.selectLevel") || "Select grade"}
              </option>
              {gradeOptions.map((level) => (
                <option key={level.value || level._id} value={level.value || level._id}>
                  {level.label || level.displayName || level.name}
                </option>
              ))}
            </DSSelect>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-control">
          <div className="flex flex-col gap-2">
            <label className="label py-0">
              <span className="label-text font-bold" style={{ color: "#1F2937" }}>
                {t("fields.phoneNumber")}
              </span>
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
                {t("fields.sequencedIdOptional")}
              </span>
            </label>
            <input
              type="text"
              name="sequencedId"
              className="input w-full rounded-xl"
              style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
              value={userData.sequencedId || ""}
              onChange={handleChange}
              placeholder={t("placeholders.sequencedId")}
            />
          </div>
        </div>
      </div>

        <ParentContactField
        title={t("fields.parentPhoneNumber")}
        phoneName="parentPhoneNumber"
        relationName="parentPhoneRelation"
        phoneValue={userData.parentPhoneNumber}
        relationValue={userData.parentPhoneRelation}
        phoneError={null}
        relationError={null}
        phoneLabel={t("fields.parentPhoneNumber")}
        relationLabel={t("fields.parentPhoneRelation")}
        phonePlaceholder={t("placeholders.parentPhoneNumber")}
        relationPlaceholder={t("placeholders.selectParentRelation") || t("placeholders.selectLevel") || "Select relation"}
        handleChange={handleChange}
        t={t}
      />

      {!hasAdditionalParentContact ? (
        <button
          type="button"
          className="btn btn-sm btn-outline mt-4"
          onClick={handleAddAdditionalParentPhone}
        >
          {t("buttons.addAnotherParentPhone")}
        </button>
      ) : (
        <div className="mt-4">
          <ParentContactField
        title={t("fields.parentPhoneNumber2")}
        phoneName="parentPhoneNumber2"
        relationName="parentPhoneRelation2"
        phoneValue={userData.parentPhoneNumber2}
        relationValue={userData.parentPhoneRelation2}
            phoneError={null}
            relationError={null}
            phoneLabel={t("fields.parentPhoneNumber2")}
            relationLabel={t("fields.parentPhoneRelation2")}
            phonePlaceholder={t("placeholders.additionalParentPhone") || t("placeholders.parentPhoneNumber")}
            relationPlaceholder={t("placeholders.selectParentRelation") || t("placeholders.selectLevel") || "Select relation"}
            handleChange={handleChange}
            t={t}
            showRemove
            onRemove={handleRemoveAdditionalParentPhone}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="form-control">
          <div className="flex flex-col gap-2">
            <label className="label py-0">
              <span className="label-text font-bold" style={{ color: "#1F2937" }}>
                {t("fields.government") || "Government"}
              </span>
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
      </div>

      <div className="form-control mt-4">
        <div className="flex flex-col gap-2">
          <label className="label py-0">
            <span className="label-text font-bold" style={{ color: "#1F2937" }}>
              {t("fields.hobby") || t("fields.hobbies")}
            </span>
          </label>
          <DSSelect
            name="hobby"
            className="select w-full rounded-xl"
            style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
            value={userData.hobby || ""}
            onChange={handleChange}
            required
          >
            <option value="">{t("placeholders.selectHobby") || "Select hobby"}</option>
            {STUDENT_HOBBIES.map((hobby) => (
              <option key={hobby.id} value={hobby.id}>
                {isRTL ? hobby.labelAr : hobby.labelEn}
              </option>
            ))}
          </DSSelect>
        </div>
      </div>
    </>
  )
}

export default StudentForm
