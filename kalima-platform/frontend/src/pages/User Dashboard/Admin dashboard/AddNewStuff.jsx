"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { getUserDashboard } from "../../../routes/auth-services"
import { createSubject, getAllSubjects, deleteSubject } from "../../../routes/courses"
import { createPackage, fetchPackages, deletePackage } from "../../../routes/packages"
import { getAllLecturers } from "../../../routes/fetch-users"
import { getAllLevels, createLevel, deleteLevel } from "../../../routes/levels"

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
  const [levelData, setLevelData] = useState({ name: "" })

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const result = await getUserDashboard()
        if (result.success) {
          setUserRole(result.data.data.userInfo.role)
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
          setLecturers(response.data)
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
          setSubjects(response.data)
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
          setPackages(response.data)
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
          setLevels(response.data)
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
          setSubjects(updatedSubjects.data)
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
          setPackages(updatedPackages.data)
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
        setLevelData({ name: "" })
        const updatedLevels = await getAllLevels()
        if (updatedLevels.success) {
          setLevels(updatedLevels.data)
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
            setSubjects(updatedSubjects.data)
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
            setPackages(updatedPackages.data)
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
            setLevels(updatedLevels.data)
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
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  return (
    <div
      className={`container mx-auto p-4 sm:p-6 max-w-4xl `}
      dir={isRTL ? "rtl" : "ltr"}>
      <h1 className="text-3xl font-bold mb-6">
        {t("createNew")} {t(`forms.${activeForm}.title`)}
      </h1>

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
          <button className="btn btn-sm btn-ghost" onClick={() => setError(null)}>
            {t("actions.dismiss")}
          </button>
        </div>
      )}

      {success && (
        <div className="alert alert-success mb-4">
          <span>{success}</span>
          <button className="btn btn-sm btn-ghost" onClick={() => setSuccess(null)}>
            {t("actions.dismiss")}
          </button>
        </div>
      )}

      {/* Form Selector */}
      <div className="tabs tabs-border mb-6">
        <button
          className={`tab ${activeForm === "subject" ? "tab-active" : ""}`}
          onClick={() => setActiveForm("subject")}
        >
          {t("forms.subject.createNew")}
        </button>
        <button
          className={`tab tab-lifted ${activeForm === "package" ? "tab-active" : ""}`}
          onClick={() => setActiveForm("package")}
        >
          {t("forms.package.createNew")}
        </button>
        <button
          className={`tab tab-lifted ${activeForm === "level" ? "tab-active" : ""}`}
          onClick={() => setActiveForm("level")}
        >
          {t("forms.level.createNew")}
        </button>
      </div>

      {/* Subject Creation Form */}
      {activeForm === "subject" && (
        <>
          <form onSubmit={handleSubjectSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">{t("forms.subject.name")}</span>
              </label>
              <input
                type="text"
                value={subjectData.name}
                onChange={(e) => setSubjectData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t("forms.subject.namePlaceholder")}
                className="input input-bordered w-full"
                required
              />

              <input
                type="text"
                value={subjectData.nameAR}
                onChange={(e) => setSubjectData(prev => ({ ...prev, nameAR: e.target.value }))}
                placeholder={t("forms.subject.namePlaceholder")}
                className="input input-bordered w-full"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">
              {t("forms.subject.create")}
            </button>
          </form>

          {/* Subject Table */}
          <div className="mt-6">
            <h2 className="text-2xl font-semibold mb-4">{t("forms.subject.existing")}</h2>
            {subjects.length > 0 ? (
              <div className="overflow-x-auto">
                <div className="bg-base-100 shadow-md rounded-lg">
                  <div className="grid grid-cols-3 gap-4 p-4 bg-base-200 rounded-t-lg font-semibold text-sm">
                    <div>{t("forms.subject.nameColumn")}</div>
                    <div>{t("common.createdOn")}</div>
                    <div>{t("common.actions")}</div>
                  </div>
                  {subjects.map((subject) => (
                    <div
                      key={subject._id}
                      className="grid grid-cols-3 gap-4 p-4 border-b border-base-200 hover:bg-base-200/50 transition-colors"
                    >
                      <div className="text-sm font-medium">{subject.name}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(subject.createdAt).toLocaleDateString(i18n.language)}
                      </div>
                      <div>
                        {userRole !== "moderator" && (
                          <button className="btn btn-error btn-sm" onClick={() => handleDeleteSubject(subject._id)}>
                            {t("actions.delete")}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center py-4">{t("forms.subject.noSubjects")}</p>
            )}
          </div>
        </>
      )}

      {/* Package Creation Form */}
      {activeForm === "package" && (
        <>
          <form onSubmit={handlePackageSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">{t("forms.package.name")}</span>
              </label>
              <input
                type="text"
                value={packageData.name}
                onChange={(e) => setPackageData({ ...packageData, name: e.target.value })}
                placeholder={t("forms.package.namePlaceholder")}
                className="input input-bordered w-full"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">{t("forms.package.price")}</span>
              </label>
              <input
                type="number"
                value={packageData.price}
                onChange={(e) => setPackageData({ ...packageData, price: e.target.value })}
                placeholder={t("forms.package.pricePlaceholder")}
                className="input input-bordered w-full"
                min={0}
                step="0.01"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">{t("forms.package.type")}</span>
              </label>
              <select
                value={packageData.type}
                onChange={(e) => setPackageData({ ...packageData, type: e.target.value })}
                className="select select-bordered w-full"
                disabled
              >
                <option value="month">{t("forms.package.monthly")}</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">{t("forms.package.points")}</span>
              </label>
              {packageData.points.map((point, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-2 mb-2">
                  <select
                    value={point.lecturer}
                    onChange={(e) => updatePoint(index, "lecturer", e.target.value)}
                    className="select select-bordered w-full sm:w-1/2"
                    required
                  >
                    <option value="">{t("forms.package.selectLecturer")}</option>
                    {lecturers.map((lecturer) => (
                      <option key={lecturer._id} value={lecturer._id}>
                        {lecturer.name} ({lecturer.expertise})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={point.points}
                    onChange={(e) => updatePoint(index, "points", e.target.value)}
                    placeholder={t("forms.package.pointsPlaceholder")}
                    className="input input-bordered w-full sm:w-1/3"
                    min="0"
                    required
                  />
                  {packageData.points.length > 1 && (
                    <button type="button" className="btn btn-error btn-sm" onClick={() => removePoint(index)}>
                      {t("actions.remove")}
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className="btn btn-outline btn-sm mt-2" onClick={addPoint}>
                {t("forms.package.addPoints")}
              </button>
            </div>

            <button type="submit" className="btn btn-primary">
              {t("forms.package.create")}
            </button>
          </form>

          {/* Package List */}
          <div className="mt-6">
            <h2 className="text-2xl font-semibold mb-4">{t("forms.package.existing")}</h2>
            {packages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {packages.map((pkg) => (
                  <div key={pkg._id} className="card bg-base-100 shadow-md p-4">
                    <div className="card-body">
                      <h3 className="card-title">{pkg.name}</h3>
                      <p className="text-sm text-gray-600">
                        {t("forms.package.priceLabel")}: ${pkg.price}
                      </p>
                      <p className="text-sm text-gray-600">
                        {t("forms.package.typeLabel")}: {t(`forms.package.${pkg.type}`)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {t("common.created")}: {new Date(pkg.createdAt).toLocaleDateString(i18n.language)}
                      </p>
                      <div className="mt-2">
                        <h4 className="text-sm font-medium">{t("forms.package.pointsDistribution")}:</h4>
                        <ul className="list-disc list-inside text-sm text-gray-600">
                          {pkg.points.map((point, index) => (
                            <li key={index}>
                              {point.lecturer?.name}: {point.points} {t("forms.package.pointsUnit")}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {userRole !== "moderator" && (
                        <button className="btn btn-error btn-sm mt-2" onClick={() => handleDeletePackage(pkg._id)}>
                          {t("actions.delete")}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>{t("forms.package.noPackages")}</p>
            )}
          </div>
        </>
      )}

      {/* Level Creation Form */}
      {activeForm === "level" && (
        <>
          <form onSubmit={handleLevelSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">{t("forms.level.name")}</span>
              </label>
              <input
                type="text"
                value={levelData.name}
                onChange={(e) => setLevelData({ name: e.target.value })}
                placeholder={t("forms.level.namePlaceholder")}
                className="input input-bordered w-full"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">
              {t("forms.level.create")}
            </button>
          </form>

          {/* Level Table */}
          <div className="mt-6">
            <h2 className="text-2xl font-semibold mb-4">{t("forms.level.existing")}</h2>
            {levels.length > 0 ? (
              <div className="overflow-x-auto">
                <div className="bg-base-100 shadow-md rounded-lg">
                  <div className="grid grid-cols-3 gap-4 p-4 bg-base-200 rounded-t-lg font-semibold text-sm">
                    <div>{t("forms.level.nameColumn")}</div>
                    <div>{t("common.createdOn")}</div>
                    <div>{t("common.actions")}</div>
                  </div>
                  {levels.map((level) => (
                    <div
                      key={level._id}
                      className="grid grid-cols-3 gap-4 p-4 border-b border-base-200 hover:bg-base-200/50 transition-colors"
                    >
                      <div className="text-sm font-medium">{level.name}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(level.createdAt).toLocaleDateString(i18n.language)}
                      </div>
                      <div>
                        {userRole !== "moderator" && (
                          <button className="btn btn-error btn-sm" onClick={() => handleDeleteLevel(level._id)}>
                            {t("actions.delete")}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center py-4">{t("forms.level.noLevels")}</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
