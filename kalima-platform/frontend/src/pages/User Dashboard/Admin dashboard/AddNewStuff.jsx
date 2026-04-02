"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { getUserDashboard } from "../../../routes/auth-services"
import { createSubject, getAllSubjects, deleteSubject } from "../../../routes/courses"
import { getAllLevels, createLevel, updateLevel, deleteLevel } from "../../../routes/levels"
import { designTokens } from "../../../constants/designTokens"
import { translateErrorMessage } from "../../../utils/errorTranslator"
import { buildLevelHierarchy, resolveLevelDisplayName } from "../../../utils/levelHierarchy"

const EMPTY_LEVEL_FORM = {
  name: "",
  nameAr: "",
  kind: "stage",
  parentLevel: "",
  sortOrder: "",
  isActive: true,
}

const sortLevelsForDisplay = (levels = []) =>
  [...levels].sort((left, right) => {
    const leftKindOrder = left.kind === "stage" ? 0 : 1
    const rightKindOrder = right.kind === "stage" ? 0 : 1
    if (leftKindOrder !== rightKindOrder) return leftKindOrder - rightKindOrder

    const leftSort = Number.isFinite(Number(left.sortOrder)) ? Number(left.sortOrder) : 0
    const rightSort = Number.isFinite(Number(right.sortOrder)) ? Number(right.sortOrder) : 0
    if (leftSort !== rightSort) return leftSort - rightSort

    return String(left.displayName || left.name || "").localeCompare(String(right.displayName || right.name || ""))
  })

const normalizeRefId = (value) => {
  if (!value) return ""
  if (typeof value === "string") return value
  if (value._id) return String(value._id)
  if (value.id) return String(value.id)
  return ""
}

const toOptionalNumber = (value) => {
  const trimmed = String(value ?? "").trim()
  if (!trimmed) return undefined

  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : undefined
}

export default function AdminCreate() {
  const { t, i18n } = useTranslation("createAdmin")
  const isRTL = i18n.language === "ar"
  const navigate = useNavigate()
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [levelHierarchy, setLevelHierarchy] = useState({
    levels: [],
    stages: [],
    grades: [],
    activeLevels: [],
    stagesById: {},
    gradesByStageId: {},
    stageOptions: [],
    gradeOptions: [],
  })
  const [activeForm, setActiveForm] = useState("subject")
  const [subjectData, setSubjectData] = useState({ name: "" })
  const [levelData, setLevelData] = useState(EMPTY_LEVEL_FORM)
  const [editingLevelId, setEditingLevelId] = useState(null)

  const TOKENS = designTokens.colors
  const SHADOWS = designTokens.shadows
  const PRIMARY_ACTION_STYLE = {
    background: designTokens.gradients.cta,
    boxShadow: SHADOWS.level1,
  }
  const PRIMARY_ACTION_CLASS =
    "btn h-12 w-full rounded-full border-none px-8 font-bold text-white transition-transform duration-200 hover:-translate-y-[1px] active:scale-[0.98] sm:w-auto"

  const sortedLevels = useMemo(
    () => sortLevelsForDisplay(levelHierarchy.levels || []),
    [levelHierarchy.levels],
  )

  const stageOptions = useMemo(
    () =>
      sortedLevels
        .filter((level) => level.kind === "stage")
        .map((level) => ({
          value: level._id,
          label: `${resolveLevelDisplayName(level, i18n.language)}${
            level.isActive === false ? ` (${t("forms.level.inactive")})` : ""
          }`,
          raw: level,
        })),
    [i18n.language, sortedLevels, t],
  )

  const parentStageOptions = stageOptions

  const loadLevels = async () => {
    const response = await getAllLevels()
    if (response.success) {
      const hierarchy = response.hierarchy || buildLevelHierarchy(response.data || [], i18n.language)
      setLevelHierarchy(hierarchy)
    } else {
      setError(translateErrorMessage(response.error || t("errors.fetchLevels")))
    }
  }

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const result = await getUserDashboard()
        if (result.success) {
          setUserRole(result.data?.data?.userInfo?.role)
        } else {
          navigate("/")
        }
      } catch (err) {
        setError(t("errors.verifyPermissions"))
        navigate("/login")
      } finally {
        setLoading(false)
      }
    }

    const fetchSubjects = async () => {
      try {
        const response = await getAllSubjects()
        if (response.success) {
          setSubjects(response.data || [])
        } else {
          setError(translateErrorMessage(response.error || t("errors.fetchSubjects")))
        }
      } catch (err) {
        setError(t("errors.fetchSubjects"))
      }
    }

    const fetchAllLevels = async () => {
      try {
        await loadLevels()
      } catch (err) {
        setError(t("errors.fetchLevels"))
      }
    }

    fetchUserData()
    fetchSubjects()
    fetchAllLevels()
  }, [navigate, t, i18n.language])

  const resetLevelForm = () => {
    setLevelData(EMPTY_LEVEL_FORM)
    setEditingLevelId(null)
  }

  const handleSubjectSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const response = await createSubject(subjectData)
      if (response.success) {
        setSuccess(t("success.subjectCreated"))
        setSubjectData({ name: "" })
        const updatedSubjects = await getAllSubjects()
        if (updatedSubjects.success) {
          setSubjects(updatedSubjects.data || [])
        }
      } else {
        setError(translateErrorMessage(response.error))
      }
    } catch (err) {
      setError(t("errors.createSubject"))
    }
  }

  const handleLevelFieldChange = (e) => {
    const { name, value, type, checked } = e.target
    setLevelData((prev) => {
      const next = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }

      if (name === "kind" && value === "stage") {
        next.parentLevel = ""
      }

      if (name === "kind" && value === "grade" && !next.parentLevel) {
        next.parentLevel = ""
      }

      return next
    })
  }

  const handleStartEditLevel = (level) => {
    setActiveForm("level")
    setEditingLevelId(level._id)
    setLevelData({
      name: level.name || "",
      nameAr: level.nameAr || "",
      kind: level.kind || (level.parentLevel ? "grade" : "stage"),
      parentLevel: normalizeRefId(level.parentLevelId || level.parentLevel),
      sortOrder: level.sortOrder !== undefined && level.sortOrder !== null ? String(level.sortOrder) : "",
      isActive: level.isActive !== false,
    })
  }

  const handleLevelSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const payload = {
        name: levelData.name.trim(),
        nameAr: levelData.nameAr.trim(),
        kind: levelData.kind,
        sortOrder: toOptionalNumber(levelData.sortOrder),
        isActive: levelData.isActive,
      }

      if (levelData.kind === "grade") {
        payload.parentLevel = levelData.parentLevel || undefined
      }

      const response = editingLevelId
        ? await updateLevel(editingLevelId, payload)
        : await createLevel(payload)

      if (response.success) {
        setSuccess(editingLevelId ? t("success.levelUpdated") : t("success.levelCreated"))
        resetLevelForm()
        await loadLevels()
      } else {
        setError(translateErrorMessage(response.error))
      }
    } catch (err) {
      setError(editingLevelId ? t("errors.updateLevel") : t("errors.createLevel"))
    }
  }

  const handleDeleteLevel = async (levelId) => {
    if (window.confirm(t("confirmations.deleteLevel"))) {
      try {
        const response = await deleteLevel(levelId)
        if (response.success) {
          setSuccess(t("success.levelDeleted"))
          if (editingLevelId === levelId) {
            resetLevelForm()
          }
          await loadLevels()
        } else {
          setError(translateErrorMessage(response.error || t("errors.deleteLevel")))
        }
      } catch (err) {
        setError(t("errors.deleteLevel"))
      }
    }
  }

  const handleCancelLevelEdit = () => {
    resetLevelForm()
  }

  const renderLevelParentLabel = (level) => {
    const parent = sortedLevels.find((candidate) => candidate._id === normalizeRefId(level.parentLevelId || level.parentLevel))
    if (!parent) {
      return t("forms.level.topLevel")
    }

    return resolveLevelDisplayName(parent, i18n.language)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="loading loading-spinner loading-lg" style={{ color: TOKENS.deepTeal }} />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6" dir={isRTL ? "rtl" : "ltr"}>
      <div
        className="rounded-[2rem] border p-6 md:p-8"
        style={{
          background: TOKENS.neutralCloud,
          boxShadow: SHADOWS.level1,
          borderColor: "rgba(17,24,39,0.05)",
        }}
      >
        <h1 className="mb-2 text-3xl font-extrabold" style={{ color: TOKENS.deepTeal }}>
          {t("pageTitle")}
        </h1>
        <p className="mb-8 text-sm font-medium md:text-base" style={{ color: TOKENS.slateText }}>
          {t("pageSubtitle")}
        </p>

        {error && (
          <div className="alert alert-error mb-6 rounded-xl border-none font-medium">
            <span>{error}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setError(null)}>
              {t("actions.dismiss")}
            </button>
          </div>
        )}

        {success && (
          <div
            className="alert mb-6 rounded-xl border-none shadow-sm"
            style={{ backgroundColor: "rgba(77,179,194,0.1)", color: TOKENS.deepTeal }}
          >
            <span className="font-medium">{success}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setSuccess(null)}>
              {t("actions.dismiss")}
            </button>
          </div>
        )}

        <div className="mb-8 flex flex-wrap gap-2 rounded-2xl border bg-white p-2" style={{ borderColor: "rgba(17,24,39,0.05)" }}>
          <button
            className={`flex-1 rounded-xl px-6 py-3 font-bold transition-all ${activeForm === "subject" ? "shadow-sm" : "hover:bg-gray-50"}`}
            style={{
              backgroundColor: activeForm === "subject" ? TOKENS.deepTeal : "transparent",
              color: activeForm === "subject" ? "white" : TOKENS.slateText,
            }}
            onClick={() => setActiveForm("subject")}
          >
            {t("forms.subject.createNew")}
          </button>
          <button
            className={`flex-1 rounded-xl px-6 py-3 font-bold transition-all ${activeForm === "level" ? "shadow-sm" : "hover:bg-gray-50"}`}
            style={{
              backgroundColor: activeForm === "level" ? TOKENS.deepTeal : "transparent",
              color: activeForm === "level" ? "white" : TOKENS.slateText,
            }}
            onClick={() => setActiveForm("level")}
          >
            {editingLevelId ? t("forms.level.editExisting") : t("forms.level.createNew")}
          </button>
        </div>

        {activeForm === "subject" && (
          <>
            <form onSubmit={handleSubjectSubmit} className="space-y-6">
              <div className="form-control gap-4">
                <div>
                  <label className="label">
                    <span className="label-text font-bold" style={{ color: TOKENS.spaceDark }}>
                      {t("forms.subject.name")}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={subjectData.name}
                    onChange={(e) => setSubjectData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder={t("forms.subject.namePlaceholder")}
                    className="input w-full rounded-xl"
                    style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: TOKENS.spaceDark }}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className={`${PRIMARY_ACTION_CLASS} mt-4`}
                style={PRIMARY_ACTION_STYLE}
              >
                {t("forms.subject.create")}
              </button>
            </form>

            <div className="mt-10 border-t pt-8" style={{ borderColor: "rgba(17,24,39,0.1)" }}>
              <h2 className="mb-6 text-2xl font-extrabold" style={{ color: TOKENS.spaceDark }}>
                {t("forms.subject.existing")}
              </h2>
              {subjects?.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: "rgba(17,24,39,0.05)" }}>
                  <div className="bg-white">
                    <div
                      className="grid grid-cols-3 gap-4 px-6 py-4 text-sm font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: "rgba(17,24,39,0.02)",
                        color: TOKENS.spaceDark,
                        borderBottom: "2px solid rgba(17,24,39,0.05)",
                      }}
                    >
                      <div>{t("forms.subject.nameColumn")}</div>
                      <div>{t("common.createdOn")}</div>
                      <div>{t("common.actions")}</div>
                    </div>
                    {subjects?.map((subject, index) => (
                      <div
                        key={subject._id}
                        className="grid grid-cols-3 items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50"
                        style={{ borderBottom: index === subjects.length - 1 ? "none" : "1px solid rgba(17,24,39,0.05)" }}
                      >
                        <div className="text-sm font-bold" style={{ color: TOKENS.spaceDark }}>
                          {subject.name}
                        </div>
                        <div className="text-sm font-medium" style={{ color: TOKENS.slateText }}>
                          {new Date(subject.createdAt).toLocaleDateString(i18n.language)}
                        </div>
                        <div>
                          {userRole !== "moderator" && (
                            <button
                              className="btn btn-ghost btn-sm rounded-xl"
                              style={{ color: "#E02424", backgroundColor: "rgba(224,36,36,0.1)" }}
                              onClick={() => handleDeleteSubject(subject._id)}
                            >
                              {t("actions.delete")}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl py-10 text-center" style={{ backgroundColor: "rgba(17,24,39,0.02)" }}>
                  <p className="font-medium" style={{ color: TOKENS.slateText }}>
                    {t("forms.subject.noSubjects")}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {activeForm === "level" && (
          <>
            <form onSubmit={handleLevelSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-bold" style={{ color: TOKENS.spaceDark }}>
                      {t("forms.level.kind")}
                    </span>
                  </label>
                  <select
                    name="kind"
                    value={levelData.kind}
                    onChange={handleLevelFieldChange}
                    className="select w-full rounded-xl"
                    style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: TOKENS.spaceDark }}
                  >
                    <option value="stage">{t("forms.level.kindStage")}</option>
                    <option value="grade">{t("forms.level.kindGrade")}</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-bold" style={{ color: TOKENS.spaceDark }}>
                      {t("forms.level.sortOrder")}
                    </span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    name="sortOrder"
                    value={levelData.sortOrder}
                    onChange={handleLevelFieldChange}
                    placeholder={t("forms.level.sortOrderPlaceholder")}
                    className="input w-full rounded-xl"
                    style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: TOKENS.spaceDark }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-bold" style={{ color: TOKENS.spaceDark }}>
                      {t("forms.level.nameEn")}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={levelData.name}
                    onChange={(e) => setLevelData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder={levelData.kind === "stage" ? t("forms.level.stageNamePlaceholderEn") : t("forms.level.gradeNamePlaceholderEn")}
                    className="input w-full rounded-xl"
                    style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: TOKENS.spaceDark }}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-bold" style={{ color: TOKENS.spaceDark }}>
                      {t("forms.level.nameAr")}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={levelData.nameAr}
                    onChange={(e) => setLevelData((prev) => ({ ...prev, nameAr: e.target.value }))}
                    placeholder={levelData.kind === "stage" ? t("forms.level.stageNamePlaceholderAr") : t("forms.level.gradeNamePlaceholderAr")}
                    className="input w-full rounded-xl"
                    style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: TOKENS.spaceDark }}
                    required
                  />
                </div>
              </div>

              {levelData.kind === "grade" && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-bold" style={{ color: TOKENS.spaceDark }}>
                        {t("forms.level.parentStage")}
                      </span>
                    </label>
                    <select
                      name="parentLevel"
                      value={levelData.parentLevel}
                      onChange={handleLevelFieldChange}
                      className="select w-full rounded-xl"
                      style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: TOKENS.spaceDark }}
                      required={levelData.kind === "grade"}
                    >
                      <option value="">{t("forms.level.selectParentStage")}</option>
                      {parentStageOptions.map((stage) => (
                        <option key={stage.value} value={stage.value}>
                          {stage.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-bold" style={{ color: TOKENS.spaceDark }}>
                        {t("forms.level.active")}
                      </span>
                    </label>
                    <label className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3" style={{ borderColor: "rgba(17,24,39,0.08)" }}>
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={levelData.isActive}
                        onChange={handleLevelFieldChange}
                        className="checkbox"
                      />
                      <span className="font-medium" style={{ color: TOKENS.slateText }}>
                        {levelData.isActive ? t("forms.level.statusActive") : t("forms.level.statusInactive")}
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {levelData.kind === "stage" && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-bold" style={{ color: TOKENS.spaceDark }}>
                      {t("forms.level.active")}
                    </span>
                  </label>
                  <label className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3" style={{ borderColor: "rgba(17,24,39,0.08)" }}>
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={levelData.isActive}
                      onChange={handleLevelFieldChange}
                      className="checkbox"
                    />
                    <span className="font-medium" style={{ color: TOKENS.slateText }}>
                      {levelData.isActive ? t("forms.level.statusActive") : t("forms.level.statusInactive")}
                    </span>
                  </label>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  className={PRIMARY_ACTION_CLASS}
                  style={PRIMARY_ACTION_STYLE}
                >
                  {editingLevelId ? t("forms.level.update") : t("forms.level.create")}
                </button>
                {editingLevelId && (
                  <button
                    type="button"
                    className="btn h-12 rounded-xl border px-8 font-bold"
                    style={{ backgroundColor: "white", color: TOKENS.slateText, borderColor: "rgba(17,24,39,0.12)" }}
                    onClick={handleCancelLevelEdit}
                  >
                    {t("forms.level.cancelEdit")}
                  </button>
                )}
              </div>
            </form>

            <div className="mt-10 border-t pt-8" style={{ borderColor: "rgba(17,24,39,0.1)" }}>
              <h2 className="mb-6 text-2xl font-extrabold" style={{ color: TOKENS.spaceDark }}>
                {t("forms.level.existing")}
              </h2>
              {sortedLevels?.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: "rgba(17,24,39,0.05)" }}>
                  <div className="bg-white">
                    <div
                      className="grid grid-cols-5 gap-4 px-6 py-4 text-sm font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: "rgba(17,24,39,0.02)",
                        color: TOKENS.spaceDark,
                        borderBottom: "2px solid rgba(17,24,39,0.05)",
                      }}
                    >
                      <div>{t("forms.level.nameColumn")}</div>
                      <div>{t("forms.level.kindColumn")}</div>
                      <div>{t("forms.level.parentColumn")}</div>
                      <div>{t("forms.level.statusColumn")}</div>
                      <div>{t("common.actions")}</div>
                    </div>
                    {sortedLevels.map((level, index) => {
                      const isInactive = level.isActive === false
                      return (
                        <div
                          key={level._id}
                          className="grid grid-cols-5 items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50"
                          style={{ borderBottom: index === sortedLevels.length - 1 ? "none" : "1px solid rgba(17,24,39,0.05)" }}
                        >
                          <div className="text-sm font-bold" style={{ color: TOKENS.spaceDark }}>
                            {level.displayName || resolveLevelDisplayName(level, i18n.language)}
                          </div>
                          <div className="text-sm font-medium capitalize" style={{ color: TOKENS.slateText }}>
                            {level.kind === "stage" ? t("forms.level.kindStage") : t("forms.level.kindGrade")}
                          </div>
                          <div className="text-sm font-medium" style={{ color: TOKENS.slateText }}>
                            {level.kind === "stage" ? t("forms.level.topLevel") : renderLevelParentLabel(level)}
                          </div>
                          <div>
                            <span
                              className={`badge ${isInactive ? "badge-ghost" : "badge-success"} badge-sm`}
                              style={isInactive ? { backgroundColor: "rgba(17,24,39,0.06)", color: TOKENS.slateText } : undefined}
                            >
                              {isInactive ? t("forms.level.statusInactive") : t("forms.level.statusActive")}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {userRole !== "moderator" && (
                              <>
                                <button
                                  className="btn btn-ghost btn-sm rounded-xl"
                                  style={{ color: TOKENS.deepTeal, backgroundColor: "rgba(14,85,99,0.1)" }}
                                  onClick={() => handleStartEditLevel(level)}
                                >
                                  {t("actions.edit")}
                                </button>
                                <button
                                  className="btn btn-ghost btn-sm rounded-xl"
                                  style={{ color: "#E02424", backgroundColor: "rgba(224,36,36,0.1)" }}
                                  onClick={() => handleDeleteLevel(level._id)}
                                >
                                  {t("actions.delete")}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl py-10 text-center" style={{ backgroundColor: "rgba(17,24,39,0.02)" }}>
                  <p className="font-medium" style={{ color: TOKENS.slateText }}>
                    {t("forms.level.noLevels")}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
