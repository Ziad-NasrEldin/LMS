"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { getUserDashboard } from "../../../routes/auth-services"
import { createSubject, getAllSubjects, deleteSubject } from "../../../routes/courses"
import { getAllLevels, createLevel, deleteLevel } from "../../../routes/levels"
import { designTokens } from "../../../constants/designTokens"

export default function AdminCreate() {
  const { t, i18n } = useTranslation("createAdmin")
  const isRTL = i18n.language === "ar"
  const navigate = useNavigate()
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [levels, setLevels] = useState([])
  const [activeForm, setActiveForm] = useState("subject")

  const TOKENS = designTokens.colors;
  const SHADOWS = designTokens.shadows;

  // Subject form state
  const [subjectData, setSubjectData] = useState({ name: "", nameAR: "" })

  // Level form state
  const [levelData, setLevelData] = useState({ name: "", nameAr: "" })

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
          setError(response.error || t("errors.fetchSubjects"))
        }
      } catch (err) {
        setError(t("errors.fetchSubjects"))
      }
    }

    const fetchAllLevels = async () => {
      try {
        const response = await getAllLevels()
        if (response.success) {
          setLevels(response.data || [])
        } else {
          setError(response.error || t("errors.fetchLevels"))
        }
      } catch (err) {
        setError(t("errors.fetchLevels"))
      }
    }

    fetchUserData()
    fetchSubjects()
    fetchAllLevels()
  }, [navigate, t])

  const handleSubjectSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const response = await createSubject(subjectData)
      if (response.success) {
        setSuccess(t("success.subjectCreated"))
        setSubjectData({ name: "", nameAR: "" })
        const updatedSubjects = await getAllSubjects()
        if (updatedSubjects.success) {
          setSubjects(updatedSubjects.data || [])
        }
      } else {
        setError(response.error)
      }
    } catch (err) {
      setError(t("errors.createSubject"))
    }
  }

  const handleLevelSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const response = await createLevel(levelData)
      if (response.success) {
        setSuccess(t("success.levelCreated"))
        setLevelData({ name: "", nameAr: "" })
        const updatedLevels = await getAllLevels()
        if (updatedLevels.success) {
          setLevels(updatedLevels.data || [])
        }
      } else {
        setError(response.error)
      }
    } catch (err) {
      setError(t("errors.createLevel"))
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
          setError(response.error || t("errors.deleteSubject"))
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
          const updatedLevels = await getAllLevels()
          if (updatedLevels.success) {
            setLevels(updatedLevels.data || [])
          }
        } else {
          setError(response.error || t("errors.deleteLevel"))
        }
      } catch (err) {
        setError(t("errors.deleteLevel"))
      }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="loading loading-spinner loading-lg" style={{ color: TOKENS.deepTeal }}></span>
      </div>
    )
  }

  return (
    <div
      className={`container mx-auto p-4 sm:p-6 max-w-4xl `}
      dir={isRTL ? "rtl" : "ltr"}>

      <div 
        className="rounded-[2rem] border p-6 md:p-8"
        style={{ 
          background: TOKENS.neutralCloud, 
          boxShadow: SHADOWS.level1, 
          borderColor: "rgba(17,24,39,0.05)"
        }}
      >
      <h1 className="text-3xl font-extrabold mb-2" style={{ color: TOKENS.deepTeal }}>
        {t("pageTitle")}
      </h1>
      <p className="mb-8 text-sm md:text-base font-medium" style={{ color: TOKENS.slateText }}>
        {t("pageSubtitle")}
      </p>

      {error && (
        <div className="alert alert-error mb-6 rounded-xl border-none font-medium">
          <span>{error}</span>
          <button className="btn btn-sm btn-ghost" onClick={() => setError(null)}>
            {t("actions.dismiss")}
          </button>
        </div>
      )}

      {success && (
        <div className="alert mb-6 rounded-xl border-none shadow-sm" style={{ backgroundColor: "rgba(77,179,194,0.1)", color: TOKENS.deepTeal }}>
          <span className="font-medium">{success}</span>
          <button className="btn btn-sm btn-ghost" onClick={() => setSuccess(null)}>
            {t("actions.dismiss")}
          </button>
        </div>
      )}

      {/* Form Selector */}
      <div className="flex flex-wrap gap-2 mb-8 bg-white p-2 rounded-2xl border" style={{ borderColor: 'rgba(17,24,39,0.05)' }}>
        <button
          className={`px-6 py-3 rounded-xl font-bold flex-1 transition-all ${activeForm === "subject" ? "shadow-sm" : "hover:bg-gray-50"}`}
          style={{ 
            backgroundColor: activeForm === "subject" ? TOKENS.deepTeal : "transparent",
            color: activeForm === "subject" ? "white" : TOKENS.slateText
          }}
          onClick={() => setActiveForm("subject")}
        >
          {t("forms.subject.createNew")}
        </button>
        <button
          className={`px-6 py-3 rounded-xl font-bold flex-1 transition-all ${activeForm === "level" ? "shadow-sm" : "hover:bg-gray-50"}`}
          style={{ 
            backgroundColor: activeForm === "level" ? TOKENS.deepTeal : "transparent",
            color: activeForm === "level" ? "white" : TOKENS.slateText
          }}
          onClick={() => setActiveForm("level")}
        >
          {t("forms.level.createNew")}
        </button>
      </div>

      {/* Subject Creation Form */}
      {activeForm === "subject" && (
        <>
          <form onSubmit={handleSubjectSubmit} className="space-y-6">
            <div className="form-control gap-4">
              <div>
                <label className="label">
                  <span className="label-text font-bold" style={{ color: TOKENS.spaceDark }}>{t("forms.subject.name")}</span>
                </label>
                <input
                  type="text"
                  value={subjectData.name}
                  onChange={(e) => setSubjectData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t("forms.subject.namePlaceholder")}
                  className="input w-full rounded-xl"
                  style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: TOKENS.spaceDark }}
                  required
                />
              </div>
              
              <div>
                <label className="label">
                  <span className="label-text font-bold" style={{ color: TOKENS.spaceDark }}>{t("forms.subject.nameAR")}</span>
                </label>
                <input
                  type="text"
                  value={subjectData.nameAR}
                  onChange={(e) => setSubjectData(prev => ({ ...prev, nameAR: e.target.value }))}
                  placeholder={t("forms.subject.namePlaceholder")}
                  className="input w-full rounded-xl"
                  style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: TOKENS.spaceDark }}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn rounded-xl font-bold px-8 h-12 w-full sm:w-auto mt-4" style={{ backgroundColor: TOKENS.coralAccent, color: "white", border: "none" }}>
              {t("forms.subject.create")}
            </button>
          </form>

          {/* Subject Table */}
          <div className="mt-10 pt-8 border-t" style={{ borderColor: 'rgba(17,24,39,0.1)' }}>
            <h2 className="text-2xl font-extrabold mb-6" style={{ color: TOKENS.spaceDark }}>{t("forms.subject.existing")}</h2>
            {subjects?.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: 'rgba(17,24,39,0.05)' }}>
                <div className="bg-white">
                  <div className="grid grid-cols-3 gap-4 py-4 px-6 font-bold text-sm tracking-wider uppercase" style={{ backgroundColor: "rgba(17,24,39,0.02)", color: TOKENS.spaceDark, borderBottom: `2px solid rgba(17,24,39,0.05)` }}>
                    <div>{t("forms.subject.nameColumn")}</div>
                    <div>{t("common.createdOn")}</div>
                    <div>{t("common.actions")}</div>
                  </div>
                  {subjects?.map((subject, index) => (
                    <div
                      key={subject._id}
                      className="grid grid-cols-3 items-center gap-4 py-4 px-6 hover:bg-gray-50 transition-colors"
                      style={{ borderBottom: index === subjects.length - 1 ? 'none' : `1px solid rgba(17,24,39,0.05)` }}
                    >
                      <div className="text-sm font-bold" style={{ color: TOKENS.spaceDark }}>{subject.name}</div>
                      <div className="text-sm font-medium" style={{ color: TOKENS.slateText }}>
                        {new Date(subject.createdAt).toLocaleDateString(i18n.language)}
                      </div>
                      <div>
                        {userRole !== "moderator" && (
                          <button className="btn btn-ghost btn-sm rounded-xl" style={{ color: "#E02424", backgroundColor: "rgba(224,36,36,0.1)" }} onClick={() => handleDeleteSubject(subject._id)}>
                            {t("actions.delete")}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 rounded-2xl" style={{ backgroundColor: "rgba(17,24,39,0.02)" }}>
                <p className="font-medium" style={{ color: TOKENS.slateText }}>{t("forms.subject.noSubjects")}</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Level Creation Form */}
      {activeForm === "level" && (
        <>
          <form onSubmit={handleLevelSubmit} className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 form-control">
                <label className="label">
                  <span className="label-text font-bold" style={{ color: TOKENS.spaceDark }}>{t("forms.level.nameEn")}</span>
                </label>
                <input
                  type="text"
                  value={levelData.name}
                  onChange={(e) => setLevelData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={t("forms.level.namePlaceholderEn")}
                  className="input w-full rounded-xl"
                  style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: TOKENS.spaceDark }}
                  required
                />
              </div>

              <div className="flex-1 form-control">
                <label className="label">
                  <span className="label-text font-bold" style={{ color: TOKENS.spaceDark }}>{t("forms.level.nameAr")}</span>
                </label>
                <input
                  type="text"
                  value={levelData.nameAr}
                  onChange={(e) => setLevelData((prev) => ({ ...prev, nameAr: e.target.value }))}
                  placeholder={t("forms.level.namePlaceholderAr")}
                  className="input w-full rounded-xl"
                  style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: TOKENS.spaceDark }}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn rounded-xl font-bold px-8 h-12 w-full sm:w-auto mt-4" style={{ backgroundColor: TOKENS.coralAccent, color: "white", border: "none" }}>
              {t("forms.level.create")}
            </button>
          </form>

          {/* Level Table */}
          <div className="mt-10 pt-8 border-t" style={{ borderColor: 'rgba(17,24,39,0.1)' }}>
            <h2 className="text-2xl font-extrabold mb-6" style={{ color: TOKENS.spaceDark }}>{t("forms.level.existing")}</h2>
            {levels?.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: 'rgba(17,24,39,0.05)' }}>
                <div className="bg-white">
                  <div className="grid grid-cols-3 gap-4 py-4 px-6 font-bold text-sm tracking-wider uppercase" style={{ backgroundColor: "rgba(17,24,39,0.02)", color: TOKENS.spaceDark, borderBottom: `2px solid rgba(17,24,39,0.05)` }}>
                    <div>{t("forms.level.nameColumn")}</div>
                    <div>{t("common.createdOn")}</div>
                    <div>{t("common.actions")}</div>
                  </div>
                  {levels?.map((level, index) => (
                    <div
                      key={level._id}
                      className="grid grid-cols-3 items-center gap-4 py-4 px-6 hover:bg-gray-50 transition-colors"
                      style={{ borderBottom: index === levels.length - 1 ? 'none' : `1px solid rgba(17,24,39,0.05)` }}
                    >
                      <div className="text-sm font-bold" style={{ color: TOKENS.spaceDark }}>{level.displayName || level.name}</div>
                      <div className="text-sm font-medium" style={{ color: TOKENS.slateText }}>
                        {new Date(level.createdAt).toLocaleDateString(i18n.language)}
                      </div>
                      <div>
                        {userRole !== "moderator" && (
                          <button className="btn btn-ghost btn-sm rounded-xl" style={{ color: "#E02424", backgroundColor: "rgba(224,36,36,0.1)" }} onClick={() => handleDeleteLevel(level._id)}>
                            {t("actions.delete")}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 rounded-2xl" style={{ backgroundColor: "rgba(17,24,39,0.02)" }}>
                <p className="font-medium" style={{ color: TOKENS.slateText }}>{t("forms.level.noLevels")}</p>
              </div>
            )}
          </div>
        </>
      )}
      </div>
    </div>
  )
}
