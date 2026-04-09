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
import DSSelect from "../../../components/DSSelect"
import Button from "../../../components/ui/Button"
import Input from "../../../components/ui/Input"
import Badge from "../../../components/ui/Badge"

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
  // PRIMARY_ACTION_CLASS removed in favor of Button primitive

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
  const stageLevels = useMemo(
    () => sortedLevels.filter((level) => level.kind === "stage"),
    [sortedLevels],
  )
  const gradeLevels = useMemo(
    () => sortedLevels.filter((level) => level.kind === "grade"),
    [sortedLevels],
  )
  const gradesByStageId = useMemo(() => {
    const grouped = {}
    gradeLevels.forEach((grade) => {
      const parentId = normalizeRefId(grade.parentLevelId || grade.parentLevel)
      if (!parentId) return
      if (!grouped[parentId]) grouped[parentId] = []
      grouped[parentId].push(grade)
    })
    return grouped
  }, [gradeLevels])
  const orphanGradeLevels = useMemo(() => {
    const stageIdSet = new Set(stageLevels.map((stage) => stage._id))
    return gradeLevels.filter((grade) => {
      const parentId = normalizeRefId(grade.parentLevelId || grade.parentLevel)
      return !parentId || !stageIdSet.has(parentId)
    })
  }, [gradeLevels, stageLevels])

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

  const handleLevelKindSelect = (kind) => {
    setLevelData((prev) => ({
      ...prev,
      kind,
      parentLevel: kind === "stage" ? "" : prev.parentLevel,
    }))
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

  const handleDeleteSubject = async (subjectId) => {
    if (window.confirm(t("confirmations.deleteSubject"))) {
      try {
        const response = await deleteSubject(subjectId)
        if (response.success) {
          setSuccess(t("success.subjectDeleted"))
          const updatedSubjects = await getAllSubjects()
          if (updatedSubjects.success) {
            setSubjects(updatedSubjects.data || [])
          }
        } else {
          setError(translateErrorMessage(response.error || t("errors.deleteSubject")))
        }
      } catch (err) {
        setError(t("errors.deleteSubject"))
      }
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

  const isEditingLevel = Boolean(editingLevelId)
  const isGradeLevel = levelData.kind === "grade"
  const selectedParentStage = parentStageOptions.find((stage) => stage.value === levelData.parentLevel)
  const levelPreviewName =
    (isRTL ? levelData.nameAr : levelData.name).trim() ||
    t(isGradeLevel ? "forms.level.previewFallbackGrade" : "forms.level.previewFallbackStage")
  const levelPreviewParent = isGradeLevel
    ? selectedParentStage?.label || t("forms.level.selectParentStage")
    : t("forms.level.topLevel")
  const disableLevelSubmit = isGradeLevel && (!levelData.parentLevel || parentStageOptions.length === 0)
  const canManageLevels = userRole !== "moderator"

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin" style={{ borderColor: TOKENS.deepTeal }}></div>
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
           <div className="flex items-center justify-between gap-3 p-4 mb-6 bg-red-50 border border-red-200 text-red-800 rounded-xl font-medium">
             <span>{error}</span>
             <Button variant="ghost" size="sm" onClick={() => setError(null)}>
               {t("actions.dismiss")}
             </Button>
           </div>
         )}


         {success && (
           <div
             className="flex items-center justify-between gap-3 p-4 mb-6 rounded-xl border shadow-sm"
             style={{ backgroundColor: "rgba(77,179,194,0.1)", color: TOKENS.deepTeal, borderColor: "rgba(77,179,194,0.2)" }}
           >
             <span className="font-medium">{success}</span>
             <Button variant="ghost" size="sm" onClick={() => setSuccess(null)}>
               {t("actions.dismiss")}
             </Button>
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
                   <Input
                     type="text"
                     value={subjectData.name}
                     onChange={(e) => setSubjectData((prev) => ({ ...prev, name: e.target.value }))}
                     placeholder={t("forms.subject.namePlaceholder")}
                     className="w-full rounded-xl"
                     style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: TOKENS.spaceDark }}
                     required
                   />

                </div>
              </div>
               <Button
                 type="submit"
                 variant="primary"
                 className={`mt-4 h-12 w-full rounded-full px-8 font-bold text-white transition-transform duration-200 hover:-translate-y-[1px] active:scale-[0.98] sm:w-auto`}
                 style={PRIMARY_ACTION_STYLE}
               >
                 {t("forms.subject.create")}
               </Button>

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
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 className="rounded-xl"
                                 style={{ color: "#E02424", backgroundColor: "rgba(224,36,36,0.1)" }}
                                 onClick={() => handleDeleteSubject(subject._id)}
                               >
                                 {t("actions.delete")}
                               </Button>
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
            <div className="mb-6 rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: "rgba(17,24,39,0.08)" }}>
              <h2 className="text-xl font-extrabold" style={{ color: TOKENS.spaceDark }}>
                {isEditingLevel ? t("forms.level.guideTitleEdit") : t("forms.level.guideTitleCreate")}
              </h2>
              <p className="mt-2 text-sm font-medium leading-6" style={{ color: TOKENS.slateText }}>
                {isEditingLevel ? t("forms.level.guideDescriptionEdit") : t("forms.level.guideDescriptionCreate")}
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-wide" style={{ borderColor: "rgba(17,24,39,0.1)", color: TOKENS.slateText }}>
                  {t("forms.level.stepOne")}
                </div>
                <div className="rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-wide" style={{ borderColor: "rgba(17,24,39,0.1)", color: TOKENS.slateText }}>
                  {t("forms.level.stepTwo")}
                </div>
                <div className="rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-wide" style={{ borderColor: "rgba(17,24,39,0.1)", color: TOKENS.slateText }}>
                  {t("forms.level.stepThree")}
                </div>
              </div>
            </div>

            <form onSubmit={handleLevelSubmit} className="space-y-6">
              <div className="rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: "rgba(17,24,39,0.08)" }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-extrabold" style={{ color: TOKENS.spaceDark }}>
                      {t("forms.level.stepOneHeading")}
                    </h3>
                    <p className="mt-1 text-sm font-medium" style={{ color: TOKENS.slateText }}>
                      {t("forms.level.stepOneHelp")}
                    </p>
                  </div>
                  <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: "rgba(14,85,99,0.12)", color: TOKENS.deepTeal }}>
                    {isGradeLevel ? t("forms.level.kindGrade") : t("forms.level.kindStage")}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    className="rounded-xl border px-4 py-3 text-left transition-all"
                    style={{
                      borderColor: levelData.kind === "stage" ? "rgba(14,85,99,0.45)" : "rgba(17,24,39,0.1)",
                      backgroundColor: levelData.kind === "stage" ? "rgba(14,85,99,0.08)" : "white",
                    }}
                    onClick={() => handleLevelKindSelect("stage")}
                  >
                    <p className="text-sm font-extrabold" style={{ color: TOKENS.spaceDark }}>
                      {t("forms.level.kindStage")}
                    </p>
                    <p className="mt-1 text-xs font-medium" style={{ color: TOKENS.slateText }}>
                      {t("forms.level.kindStageHelp")}
                    </p>
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border px-4 py-3 text-left transition-all"
                    style={{
                      borderColor: levelData.kind === "grade" ? "rgba(14,85,99,0.45)" : "rgba(17,24,39,0.1)",
                      backgroundColor: levelData.kind === "grade" ? "rgba(14,85,99,0.08)" : "white",
                    }}
                    onClick={() => handleLevelKindSelect("grade")}
                  >
                    <p className="text-sm font-extrabold" style={{ color: TOKENS.spaceDark }}>
                      {t("forms.level.kindGrade")}
                    </p>
                    <p className="mt-1 text-xs font-medium" style={{ color: TOKENS.slateText }}>
                      {t("forms.level.kindGradeHelp")}
                    </p>
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: "rgba(17,24,39,0.08)" }}>
                <h3 className="text-base font-extrabold" style={{ color: TOKENS.spaceDark }}>
                  {t("forms.level.stepTwoHeading")}
                </h3>
                <p className="mt-1 text-sm font-medium" style={{ color: TOKENS.slateText }}>
                  {t("forms.level.stepTwoHelp")}
                </p>
                <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="form-control">
                    <label className="label pb-1">
                      <span className="label-text font-bold" style={{ color: TOKENS.spaceDark }}>
                        {t("forms.level.nameEn")}
                      </span>
                    </label>
                     <Input
                       type="text"
                       value={levelData.name}
                       onChange={(e) => setLevelData((prev) => ({ ...prev, name: e.target.value }))}
                       placeholder={isGradeLevel ? t("forms.level.gradeNamePlaceholderEn") : t("forms.level.stageNamePlaceholderEn")}
                       className="w-full rounded-xl"
                       style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: TOKENS.spaceDark }}
                       required
                     />

                    <p className="mt-2 text-xs font-medium" style={{ color: TOKENS.slateText }}>
                      {t("forms.level.nameEnHelp")}
                    </p>
                  </div>

                  <div className="form-control">
                    <label className="label pb-1">
                      <span className="label-text font-bold" style={{ color: TOKENS.spaceDark }}>
                        {t("forms.level.nameAr")}
                      </span>
                    </label>
                     <Input
                       type="text"
                       value={levelData.nameAr}
                       onChange={(e) => setLevelData((prev) => ({ ...prev, nameAr: e.target.value }))}
                       placeholder={isGradeLevel ? t("forms.level.gradeNamePlaceholderAr") : t("forms.level.stageNamePlaceholderAr")}
                       className="w-full rounded-xl"
                       style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: TOKENS.spaceDark }}
                       required
                     />

                    <p className="mt-2 text-xs font-medium" style={{ color: TOKENS.slateText }}>
                      {t("forms.level.nameArHelp")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: "rgba(17,24,39,0.08)" }}>
                <h3 className="text-base font-extrabold" style={{ color: TOKENS.spaceDark }}>
                  {t("forms.level.stepThreeHeading")}
                </h3>
                <p className="mt-1 text-sm font-medium" style={{ color: TOKENS.slateText }}>
                  {t("forms.level.stepThreeHelp")}
                </p>
                <div className={`mt-4 grid grid-cols-1 gap-6 ${isGradeLevel ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
                  {isGradeLevel && (
                    <div className="form-control">
                      <label className="label pb-1">
                        <span className="label-text font-bold" style={{ color: TOKENS.spaceDark }}>
                          {t("forms.level.parentStage")}
                        </span>
                      </label>
                       <DSSelect
                         name="parentLevel"
                         value={levelData.parentLevel}
                         onChange={handleLevelFieldChange}
                         className="w-full rounded-xl"
                         style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: TOKENS.spaceDark }}
                         required={isGradeLevel}
                         disabled={parentStageOptions.length === 0}
                       >

                        <option value="">{t("forms.level.selectParentStage")}</option>
                        {parentStageOptions.map((stage) => (
                          <option key={stage.value} value={stage.value}>
                            {stage.label}
                          </option>
                        ))}
                      </DSSelect>
                      <p className="mt-2 text-xs font-medium" style={{ color: TOKENS.slateText }}>
                        {t("forms.level.parentStageHelp")}
                      </p>
                      {parentStageOptions.length === 0 && (
                        <p className="mt-2 text-xs font-semibold" style={{ color: "#B45309" }}>
                          {t("forms.level.noParentStagesHint")}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="form-control">
                    <label className="label pb-1">
                      <span className="label-text font-bold" style={{ color: TOKENS.spaceDark }}>
                        {t("forms.level.sortOrder")}
                      </span>
                    </label>
                     <Input
                       type="number"
                       min="0"
                       step="1"
                       name="sortOrder"
                       value={levelData.sortOrder}
                       onChange={handleLevelFieldChange}
                       placeholder={t("forms.level.sortOrderPlaceholder")}
                       className="w-full rounded-xl"
                       style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: TOKENS.spaceDark }}
                     />

                    <p className="mt-2 text-xs font-medium" style={{ color: TOKENS.slateText }}>
                      {t("forms.level.sortOrderHelp")}
                    </p>
                  </div>

                  <div className="form-control">
                    <label className="label pb-1">
                      <span className="label-text font-bold" style={{ color: TOKENS.spaceDark }}>
                        {t("forms.level.active")}
                      </span>
                    </label>
                    <label className="flex h-12 items-center gap-3 rounded-xl border bg-white px-4" style={{ borderColor: "rgba(17,24,39,0.08)" }}>
                       <input
                         type="checkbox"
                         name="isActive"
                         checked={levelData.isActive}
                         onChange={handleLevelFieldChange}
                         className="w-4 h-4 accent-primary"
                       />

                      <span className="font-medium" style={{ color: TOKENS.slateText }}>
                        {levelData.isActive ? t("forms.level.statusActive") : t("forms.level.statusInactive")}
                      </span>
                    </label>
                    <p className="mt-2 text-xs font-medium" style={{ color: TOKENS.slateText }}>
                      {t("forms.level.activeHelp")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: "rgba(17,24,39,0.08)" }}>
                <h3 className="text-base font-extrabold" style={{ color: TOKENS.spaceDark }}>
                  {t("forms.level.previewTitle")}
                </h3>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-xl px-4 py-3" style={{ backgroundColor: "rgba(14,85,99,0.08)" }}>
                    <p className="text-xs font-bold uppercase tracking-wide" style={{ color: TOKENS.slateText }}>
                      {t("forms.level.kind")}
                    </p>
                    <p className="mt-1 text-sm font-extrabold" style={{ color: TOKENS.spaceDark }}>
                      {isGradeLevel ? t("forms.level.kindGrade") : t("forms.level.kindStage")}
                    </p>
                  </div>
                  <div className="rounded-xl px-4 py-3" style={{ backgroundColor: "rgba(14,85,99,0.08)" }}>
                    <p className="text-xs font-bold uppercase tracking-wide" style={{ color: TOKENS.slateText }}>
                      {t("forms.level.nameColumn")}
                    </p>
                    <p className="mt-1 text-sm font-extrabold" style={{ color: TOKENS.spaceDark }}>
                      {levelPreviewName}
                    </p>
                  </div>
                  <div className="rounded-xl px-4 py-3 md:col-span-2" style={{ backgroundColor: "rgba(14,85,99,0.08)" }}>
                    <p className="text-xs font-bold uppercase tracking-wide" style={{ color: TOKENS.slateText }}>
                      {t("forms.level.parentColumn")}
                    </p>
                    <p className="mt-1 text-sm font-extrabold" style={{ color: TOKENS.spaceDark }}>
                      {levelPreviewParent}
                    </p>
                  </div>
                </div>
              </div>

                 <div className="flex flex-wrap gap-3">
                   <Button
                     type="submit"
                     disabled={disableLevelSubmit}
                     variant="primary"
                     className="h-12 w-full rounded-full px-8 font-bold text-white transition-transform duration-200 hover:-translate-y-[1px] active:scale-[0.98] sm:w-auto"
                     style={disableLevelSubmit ? { ...PRIMARY_ACTION_STYLE, opacity: 0.6, cursor: "not-allowed" } : PRIMARY_ACTION_STYLE}
                   >
                     {isEditingLevel ? t("forms.level.update") : t("forms.level.create")}
                   </Button>
                   {isEditingLevel && (
                     <Button
                       type="button"
                       variant="outline"
                       size="md"
                       className="h-12 rounded-xl border px-8 font-bold"
                       style={{ backgroundColor: "white", color: TOKENS.slateText, borderColor: "rgba(17,24,39,0.12)" }}
                       onClick={handleCancelLevelEdit}
                     >
                       {t("forms.level.cancelEdit")}
                     </Button>
                   )}
                 </div>

            </form>

            <div className="mt-10 border-t pt-8" style={{ borderColor: "rgba(17,24,39,0.1)" }}>
              <h2 className="mb-6 text-2xl font-extrabold" style={{ color: TOKENS.spaceDark }}>
                {t("forms.level.existing")}
              </h2>
              {sortedLevels?.length > 0 ? (
                <div className="rounded-2xl border bg-white p-4 sm:p-5" style={{ borderColor: "rgba(17,24,39,0.05)" }}>
                  <p className="mb-4 text-sm font-medium" style={{ color: TOKENS.slateText }}>
                    {t("forms.level.treeViewHint")}
                  </p>

                  <div className="space-y-3">
                    {stageLevels.map((stage, index) => {
                      const stageGrades = gradesByStageId[stage._id] || []
                      const isInactive = stage.isActive === false
                      return (
                        <details
                          key={stage._id}
                          className="group rounded-xl border"
                          style={{ borderColor: "rgba(17,24,39,0.08)" }}
                          open={index === 0}
                        >
                          <summary
                            className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-4 py-3"
                            style={{ backgroundColor: "rgba(17,24,39,0.02)" }}
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-extrabold" style={{ color: TOKENS.spaceDark }}>
                                {stage.displayName || resolveLevelDisplayName(stage, i18n.language)}
                              </p>
                              <p className="mt-1 text-xs font-medium" style={{ color: TOKENS.slateText }}>
                                {t("forms.level.treeGradesCount", { count: stageGrades.length })}
                              </p>
                            </div>
                               <div className="flex items-center gap-2">
                                 <Badge variant={isInactive ? "ghost" : "success"} size="sm">
                                   {isInactive ? t("forms.level.statusInactive") : t("forms.level.statusActive")}
                                 </Badge>
                                 <span
                                   className="text-lg font-bold leading-none transition-transform group-open:rotate-90"
                                   style={{ color: TOKENS.slateText }}
                                 >
                                   ›
                                 </span>
                               </div>

                          </summary>

                          <div className="space-y-3 px-4 pb-4 pt-3">
                            <div className="rounded-lg border px-3 py-2" style={{ borderColor: "rgba(17,24,39,0.08)" }}>
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: TOKENS.slateText }}>
                                    {t("forms.level.kindStage")}
                                  </p>
                                  <p className="text-sm font-semibold" style={{ color: TOKENS.spaceDark }}>
                                    {stage.displayName || resolveLevelDisplayName(stage, i18n.language)}
                                  </p>
                                </div>
                                 {canManageLevels && (
                                   <div className="flex flex-wrap gap-2">
                                     <Button
                                       type="button"
                                       variant="ghost"
                                       size="sm"
                                       className="rounded-xl"
                                       style={{ color: TOKENS.deepTeal, backgroundColor: "rgba(14,85,99,0.1)" }}
                                       onClick={() => handleStartEditLevel(stage)}
                                     >
                                       {t("actions.edit")}
                                     </Button>
                                     <Button
                                       type="button"
                                       variant="ghost"
                                       size="sm"
                                       className="rounded-xl"
                                       style={{ color: "#E02424", backgroundColor: "rgba(224,36,36,0.1)" }}
                                       onClick={() => handleDeleteLevel(stage._id)}
                                     >
                                       {t("actions.delete")}
                                     </Button>
                                   </div>
                                 )}

                              </div>
                            </div>

                            {stageGrades.length > 0 ? (
                              <div className="space-y-2">
                                {stageGrades.map((grade) => {
                                  const gradeIsInactive = grade.isActive === false
                                  return (
                                    <div
                                      key={grade._id}
                                      className="ml-0 rounded-lg border px-3 py-3 sm:ml-4"
                                      style={{ borderColor: "rgba(17,24,39,0.08)", backgroundColor: "rgba(17,24,39,0.01)" }}
                                    >
                                      <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: TOKENS.slateText }}>
                                            {t("forms.level.kindGrade")}
                                          </p>
                                          <p className="text-sm font-semibold" style={{ color: TOKENS.spaceDark }}>
                                            {grade.displayName || resolveLevelDisplayName(grade, i18n.language)}
                                          </p>
                                        </div>
                                   <div className="flex items-center gap-2">
                                     <Badge variant={gradeIsInactive ? "ghost" : "success"} size="sm">
                                       {gradeIsInactive ? t("forms.level.statusInactive") : t("forms.level.statusActive")}
                                     </Badge>
                                     {canManageLevels && (
                                       <>
                                         <Button
                                           type="button"
                                           variant="ghost"
                                           size="sm"
                                           className="rounded-xl"
                                           style={{ color: TOKENS.deepTeal, backgroundColor: "rgba(14,85,99,0.1)" }}
                                           onClick={() => handleStartEditLevel(grade)}
                                         >
                                           {t("actions.edit")}
                                         </Button>
                                         <Button
                                           type="button"
                                           variant="ghost"
                                           size="sm"
                                           className="rounded-xl"
                                           style={{ color: "#E02424", backgroundColor: "rgba(224,36,36,0.1)" }}
                                           onClick={() => handleDeleteLevel(grade._id)}
                                         >
                                           {t("actions.delete")}
                                         </Button>
                                       </>
                                     )}
                                   </div>

                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              <p className="ml-0 text-sm font-medium sm:ml-4" style={{ color: TOKENS.slateText }}>
                                {t("forms.level.treeNoGrades")}
                              </p>
                            )}
                          </div>
                        </details>
                      )
                    })}

                    {orphanGradeLevels.length > 0 && (
                      <details className="group rounded-xl border" style={{ borderColor: "rgba(17,24,39,0.08)" }}>
                        <summary
                          className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-4 py-3"
                          style={{ backgroundColor: "rgba(224,36,36,0.06)" }}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-extrabold" style={{ color: TOKENS.spaceDark }}>
                              {t("forms.level.treeOrphanGrades")}
                            </p>
                            <p className="mt-1 text-xs font-medium" style={{ color: TOKENS.slateText }}>
                              {t("forms.level.treeGradesCount", { count: orphanGradeLevels.length })}
                            </p>
                          </div>
                          <span
                            className="text-lg font-bold leading-none transition-transform group-open:rotate-90"
                            style={{ color: TOKENS.slateText }}
                          >
                            ›
                          </span>
                        </summary>
                        <div className="space-y-2 px-4 pb-4 pt-3">
                          <p className="text-xs font-medium" style={{ color: TOKENS.slateText }}>
                            {t("forms.level.treeOrphanHint")}
                          </p>
                          {orphanGradeLevels.map((grade) => {
                            const gradeIsInactive = grade.isActive === false
                            return (
                              <div
                                key={grade._id}
                                className="rounded-lg border px-3 py-3"
                                style={{ borderColor: "rgba(17,24,39,0.08)", backgroundColor: "rgba(17,24,39,0.01)" }}
                              >
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <p className="text-sm font-semibold" style={{ color: TOKENS.spaceDark }}>
                                    {grade.displayName || resolveLevelDisplayName(grade, i18n.language)}
                                  </p>
                                   <div className="flex items-center gap-2">
                                     <Badge variant={gradeIsInactive ? "ghost" : "success"} size="sm">
                                       {gradeIsInactive ? t("forms.level.statusInactive") : t("forms.level.statusActive")}
                                     </Badge>
                                     {canManageLevels && (
                                       <>
                                         <Button
                                           type="button"
                                           variant="ghost"
                                           size="sm"
                                           className="rounded-xl"
                                           style={{ color: TOKENS.deepTeal, backgroundColor: "rgba(14,85,99,0.1)" }}
                                           onClick={() => handleStartEditLevel(grade)}
                                         >
                                           {t("actions.edit")}
                                         </Button>
                                         <Button
                                           type="button"
                                           variant="ghost"
                                           size="sm"
                                           className="rounded-xl"
                                           style={{ color: "#E02424", backgroundColor: "rgba(224,36,36,0.1)" }}
                                           onClick={() => handleDeleteLevel(grade._id)}
                                         >
                                           {t("actions.delete")}
                                         </Button>
                                       </>
                                     )}
                                   </div>

                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </details>
                    )}
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
