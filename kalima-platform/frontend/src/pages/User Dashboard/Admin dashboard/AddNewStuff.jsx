"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { getUserDashboard } from "../../../routes/auth-services"
import { createSubject, getAllSubjects, deleteSubject } from "../../../routes/courses"
import { createPackage, fetchPackages, deletePackage } from "../../../routes/packages"
import { getAllLecturers } from "../../../routes/fetch-users"
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
  const [lecturers, setLecturers] = useState([])
  const [subjects, setSubjects] = useState([])
  const [packages, setPackages] = useState([])
  const [levels, setLevels] = useState([])
  const [activeForm, setActiveForm] = useState("subject") // 'subject', 'package', or 'level'

  const TOKENS = designTokens.colors;
  const SHADOWS = designTokens.shadows;

  // Subject form state
  const [subjectData, setSubjectData] = useState({ name: "", nameAR: "" })

  // Package form state
  const [packageData, setPackageData] = useState({
    name: "",
    price: "",
    type: "month",
    points: [{ lecturer: "", points: "" }],
  })

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

    const fetchLecturers = async () => {
      try {
        const response = await getAllLecturers()
        if (response.success) {
          setLecturers(response.data || [])
        } else {
          setError(response.error || t("errors.fetchLecturers"))
        }
      } catch (err) {
        setError(t("errors.fetchLecturers"))
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

    const fetchAllPackages = async () => {
      try {
        const response = await fetchPackages()
        if (response.success) {
          setPackages(response.data || [])
        } else {
          setError(response.error || t("errors.fetchPackages"))
        }
      } catch (err) {
        setError(t("errors.fetchPackages"))
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
    fetchLecturers()
    fetchSubjects()
    fetchAllPackages()
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

  const handlePackageSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const formattedPoints = packageData.points.filter((point) => point.lecturer && point.points)
      const response = await createPackage({
        ...packageData,
        price: Number.parseFloat(packageData.price),
        points: formattedPoints,
      })
      if (response.success) {
        setSuccess(t("success.packageCreated"))
        setPackageData({
          name: "",
          price: "",
          type: "month",
          points: [{ lecturer: "", points: "" }],
        })
        const updatedPackages = await fetchPackages()
        if (updatedPackages.success) {
          setPackages(updatedPackages.data || [])
        }
      } else {
        setError(response.error)
      }
    } catch (err) {
      setError(t("errors.createPackage"))
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

  const addPoint = () => {
    setPackageData((prev) => ({
      ...prev,
      points: [...prev.points, { lecturer: "", points: "" }],
    }))
  }

  const updatePoint = (index, field, value) => {
    setPackageData((prev) => {
      const newPoints = [...prev.points]
      newPoints[index] = { ...newPoints[index], [field]: value }
      return { ...prev, points: newPoints }
    })
  }

  const removePoint = (index) => {
    setPackageData((prev) => ({
      ...prev,
      points: prev.points.filter((_, i) => i !== index),
    }))
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

  const handleDeletePackage = async (packageId) => {
    if (window.confirm(t("confirmations.deletePackage"))) {
      try {
        const response = await deletePackage(packageId)
        if (response.success) {
          setSuccess(t("success.packageDeleted"))
          const updatedPackages = await fetchPackages()
          if (updatedPackages.success) {
            setPackages(updatedPackages.data || [])
          }
        } else {
          setError(response.error || t("errors.deletePackage"))
        }
      } catch (err) {
        setError(t("errors.deletePackage"))
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
      <h1 className="text-3xl font-extrabold mb-8" style={{ color: TOKENS.deepTeal }}>
        {t("createNew")} {t(`forms.${activeForm}.title`)}
      </h1>

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
          className={`px-6 py-3 rounded-xl font-bold flex-1 transition-all ${activeForm === "package" ? "shadow-sm" : "hover:bg-gray-50"}`}
          style={{ 
            backgroundColor: activeForm === "package" ? TOKENS.deepTeal : "transparent",
            color: activeForm === "package" ? "white" : TOKENS.slateText
          }}
          onClick={() => setActiveForm("package")}
        >
          {t("forms.package.createNew")}
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

      {/* Package Creation Form */}
      {activeForm === "package" && (
        <>
          <form onSubmit={handlePackageSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold" style={{ color: TOKENS.spaceDark }}>{t("forms.package.name")}</span>
                </label>
                <input
                  type="text"
                  value={packageData.name}
                  onChange={(e) => setPackageData({ ...packageData, name: e.target.value })}
                  placeholder={t("forms.package.namePlaceholder")}
                  className="input w-full rounded-xl"
                  style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: TOKENS.spaceDark }}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold" style={{ color: TOKENS.spaceDark }}>{t("forms.package.price")}</span>
                </label>
                <input
                  type="number"
                  value={packageData.price}
                  onChange={(e) => setPackageData({ ...packageData, price: e.target.value })}
                  placeholder={t("forms.package.pricePlaceholder")}
                  className="input w-full rounded-xl"
                  style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: TOKENS.spaceDark }}
                  min={0}
                  step="0.01"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold" style={{ color: TOKENS.spaceDark }}>{t("forms.package.type")}</span>
                </label>
                <select
                  value={packageData.type}
                  onChange={(e) => setPackageData({ ...packageData, type: e.target.value })}
                  className="select w-full rounded-xl h-12"
                  style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: TOKENS.spaceDark }}
                  disabled
                >
                  <option value="month">{t("forms.package.monthly")}</option>
                </select>
              </div>
            </div>

            <div className="form-control pt-4 border-t" style={{ borderColor: 'rgba(17,24,39,0.1)' }}>
              <label className="label mb-2">
                <span className="label-text font-bold text-lg" style={{ color: TOKENS.spaceDark }}>{t("forms.package.points")}</span>
              </label>
              {packageData.points.map((point, index) => (
                <div key={index} className="flex flex-col sm:flex-row items-center gap-3 mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="w-full sm:w-1/2">
                    <select
                      value={point.lecturer}
                      onChange={(e) => updatePoint(index, "lecturer", e.target.value)}
                      className="select w-full rounded-xl h-12"
                      style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: TOKENS.spaceDark }}
                      required
                    >
                      <option value="">{t("forms.package.selectLecturer")}</option>
                      {lecturers?.map((lecturer) => (
                        <option key={lecturer._id} value={lecturer._id}>
                          {lecturer.name} ({lecturer.expertise})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full sm:w-1/3">
                    <input
                      type="number"
                      value={point.points}
                      onChange={(e) => updatePoint(index, "points", e.target.value)}
                      placeholder={t("forms.package.pointsPlaceholder")}
                      className="input w-full rounded-xl h-12"
                      style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: TOKENS.spaceDark }}
                      min="0"
                      required
                    />
                  </div>
                  {packageData.points.length > 1 && (
                    <button type="button" className="btn btn-ghost btn-sm rounded-xl h-12" style={{ color: "#E02424", backgroundColor: "rgba(224,36,36,0.1)" }} onClick={() => removePoint(index)}>
                      {t("actions.remove")}
                    </button>
                  )}
                </div>
              ))}
              <div className="flex justify-start">
                <button type="button" className="btn btn-outline rounded-xl font-bold px-6 border-dashed border-2 bg-transparent" style={{ borderColor: TOKENS.deepTeal, color: TOKENS.deepTeal }} onClick={addPoint}>
                  + {t("forms.package.addPoints")}
                </button>
              </div>
            </div>

            <button type="submit" className="btn rounded-xl font-bold px-8 h-12 w-full sm:w-auto mt-6" style={{ backgroundColor: TOKENS.coralAccent, color: "white", border: "none" }}>
              {t("forms.package.create")}
            </button>
          </form>

          {/* Package List */}
          <div className="mt-10 pt-8 border-t" style={{ borderColor: 'rgba(17,24,39,0.1)' }}>
            <h2 className="text-2xl font-extrabold mb-6" style={{ color: TOKENS.spaceDark }}>{t("forms.package.existing")}</h2>
            {packages?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages?.map((pkg) => (
                  <div key={pkg._id} className="rounded-2xl border flex flex-col h-full bg-white transition-all hover:shadow-md" style={{ borderColor: "rgba(17,24,39,0.05)" }}>
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold" style={{ color: TOKENS.spaceDark }}>{pkg.name}</h3>
                        <span className="badge font-bold px-3 py-3 rounded-xl" style={{ backgroundColor: "rgba(77,179,194,0.1)", color: TOKENS.deepTeal, border: "none" }}>${pkg.price}</span>
                      </div>
                      <div className="space-y-2 mb-4 font-medium text-sm border-b pb-4" style={{ borderColor: "rgba(17,24,39,0.05)", color: TOKENS.slateText }}>
                        <div className="flex justify-between">
                          <span>{t("forms.package.typeLabel")}:</span>
                          <span className="font-bold" style={{ color: TOKENS.spaceDark }}>{t(`forms.package.${pkg.type}`)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("common.created")}:</span>
                          <span className="font-bold" style={{ color: TOKENS.spaceDark }}>{new Date(pkg.createdAt).toLocaleDateString(i18n.language)}</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: TOKENS.slateText }}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          {t("forms.package.pointsDistribution")}
                        </h4>
                        <ul className="space-y-2 text-sm font-medium" style={{ color: TOKENS.slateText }}>
                          {pkg.points?.map((point, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: TOKENS.deepTeal }}></span>
                              {point.lecturer?.name}: {" "}
                              <span className="font-bold" style={{ color: TOKENS.spaceDark }}>{point.points} {t("forms.package.pointsUnit")}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {userRole !== "moderator" && (
                        <button className="btn btn-ghost btn-sm rounded-xl mt-4 w-full" style={{ color: "#E02424", backgroundColor: "rgba(224,36,36,0.1)" }} onClick={() => handleDeletePackage(pkg._id)}>
                          {t("actions.delete")}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 rounded-2xl" style={{ backgroundColor: "rgba(17,24,39,0.02)" }}>
                <p className="font-medium" style={{ color: TOKENS.slateText }}>{t("forms.package.noPackages")}</p>
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
