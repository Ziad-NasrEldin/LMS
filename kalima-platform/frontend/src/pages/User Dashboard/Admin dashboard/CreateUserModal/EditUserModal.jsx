"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Eye, EyeOff, X, Trash2 } from "lucide-react"
import { updateUser } from "../../../../routes/update-user"
import { getAllLevels } from "../../../../routes/levels"
import { getAllSubjects } from "../../../../routes/courses"
import { getAllGovernments, getGovernmentZones } from "../../../../routes/governments"
import { getAllLecturers } from "../../../../routes/fetch-users"
import { getUserFromToken } from "../../../../routes/auth-services"
import { translateErrorMessage } from "../../../../utils/errorTranslator"
import { buildLevelHierarchy, STAGE_KEYS, getGradeOptionsForStage, getStageDisplayName } from "../../../../utils/levelHierarchy"
import { STUDENT_HOBBIES } from "../../../../constants/studentHobbies"
import { designTokens } from "../../../../constants/designTokens"
import DSSelect from "../../../../components/DSSelect"
import Button from "../../../../components/ui/Button"
import Input from "../../../../components/ui/Input"

const PARENT_RELATIONS = ["mother", "father", "other"]

const EditUserModal = ({ isOpen, onClose, user, onUserUpdated }) => {
  const { t: baseT, i18n } = useTranslation("admin")
  const t = (key, options) => {
    const translated = baseT(key, options)

    if (translated !== key || !String(key).startsWith("admin.")) {
      return translated
    }

    const fallbackKey = String(key).slice("admin.".length)
    const fallback = baseT(fallbackKey, options)

    if (fallback !== fallbackKey) {
      return fallback
    }

    return options?.defaultValue ?? translated
  }
  const isRTL = i18n.language === "ar"
  const dir = isRTL ? "rtl" : "ltr"
  const TOKENS = designTokens.colors

  const currentUser = getUserFromToken() || {}
  const currentUserId = currentUser?.id || currentUser?._id || currentUser?.UserInfo?.id || currentUser?.sub
  const userId = user?._id || user?.id
  
  const normalizedCurrentRole = String(currentUser?.role || "").toLowerCase()
  const normalizedUserRole = String(user?.role || "").toLowerCase()
  const isCurrentUserAdmin = Boolean(
    user &&
    currentUserId && 
    userId &&
    currentUserId === userId &&
    ["admin", "subadmin"].includes(normalizedCurrentRole) &&
    normalizedCurrentRole === normalizedUserRole
  )

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  
  const [levels, setLevels] = useState([])
  const [subjects, setSubjects] = useState([])
  const [governments, setGovernments] = useState([])
  const [administrationZones, setAdministrationZones] = useState([])
  const [loadingZones, setLoadingZones] = useState(false)
  const [lecturers, setLecturers] = useState([])
  const [levelHierarchy, setLevelHierarchy] = useState(null)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    gender: "male",
    role: "",
    stage: "",
    level: "",
    parentPhoneNumber: "",
    parentPhoneRelation: "",
    parentPhoneNumber2: "",
    parentPhoneRelation2: "",
    hasAdditionalParentPhone: false,
    hobby: "",
    government: "",
    administrationZone: "",
    sequencedId: "",
    faction: "",
    school: "",
    bio: "",
    expertise: "",
    assignedLecturer: "",
    subject: [],
    views: "",
    children: [],
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [levelsRes, subjectsRes, governmentsRes, lecturersRes] = await Promise.all([
          getAllLevels(),
          getAllSubjects(),
          getAllGovernments(),
          getAllLecturers()
        ])
        
        if (levelsRes?.success && levelsRes?.data) {
          setLevels(levelsRes.data)
          const hierarchy = buildLevelHierarchy(levelsRes.data)
          setLevelHierarchy(hierarchy)
        }
        if (subjectsRes?.success && subjectsRes?.data) setSubjects(subjectsRes.data)
        if (governmentsRes?.success && Array.isArray(governmentsRes?.data)) setGovernments(governmentsRes.data)
        if (lecturersRes?.success && lecturersRes?.data) setLecturers(lecturersRes.data)
      } catch (err) {
        console.error("Error fetching data:", err)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (user) {
      const userRole = user.role || ""
      
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        password: "",
        gender: user.gender || "male",
        role: userRole,
        stage: user.stage || "",
        level: user.level?._id || user.level || "",
        parentPhoneNumber: user.parentPhoneNumber || "",
        parentPhoneRelation: user.parentPhoneRelation || "",
        parentPhoneNumber2: user.parentPhoneNumber2 || "",
        parentPhoneRelation2: user.parentPhoneRelation2 || "",
        hasAdditionalParentPhone: !!(user.parentPhoneNumber2 || user.parentPhoneRelation2),
        hobby: user.hobby || "",
        government: user.government || "",
        administrationZone: user.administrationZone || "",
        sequencedId: user.sequencedId || "",
        faction: user.faction || "",
        school: user.school || "",
        bio: user.bio || "",
        expertise: user.expertise || "",
        assignedLecturer: user.assignedLecturer?._id || user.assignedLecturer || "",
        subject: user.subject || [],
        views: user.views || "",
        children: user.children || [],
      })

      if (user.government) {
        fetchZones(user.government)
      }
    }
  }, [user])

  const fetchZones = async (government) => {
    if (!government) {
      setAdministrationZones([])
      return
    }
    setLoadingZones(true)
    try {
      const response = await getGovernmentZones(government)
      if (response?.success && response?.data) {
        setAdministrationZones(response.data)
      } else {
        setAdministrationZones([])
      }
    } catch (err) {
      console.error("Error fetching zones:", err)
      setAdministrationZones([])
    } finally {
      setLoadingZones(false)
    }
  }

  const handleGovernmentChange = (value) => {
    setFormData(prev => ({
      ...prev,
      government: value,
      administrationZone: ""
    }))
    setAdministrationZones([])
    if (value) {
      fetchZones(value)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleStageChange = (e) => {
    const stage = e.target.value
    setFormData(prev => ({
      ...prev,
      stage,
      level: ""
    }))
  }

  const handleAddAdditionalParentPhone = () => {
    setFormData(prev => ({
      ...prev,
      hasAdditionalParentPhone: true
    }))
  }

  const handleRemoveAdditionalParentPhone = () => {
    setFormData(prev => ({
      ...prev,
      hasAdditionalParentPhone: false,
      parentPhoneNumber2: "",
      parentPhoneRelation2: ""
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (isCurrentUserAdmin) {
      setError(t("admin.editUser.cannotEditOwnCredentials") || "Admin cannot edit their own credentials.")
      setLoading(false)
      return
    }

    const updateData = {
      name: formData.name,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      role: formData.role,
      gender: formData.gender,
    }

    if (formData.password) {
      updateData.password = formData.password
    }

    const role = formData.role?.toLowerCase()
    
    if (role === "student") {
      updateData.stage = formData.stage
      updateData.level = formData.level
      updateData.parentPhoneNumber = formData.parentPhoneNumber
      updateData.parentPhoneRelation = formData.parentPhoneRelation
      updateData.parentPhoneNumber2 = formData.parentPhoneNumber2
      updateData.parentPhoneRelation2 = formData.parentPhoneRelation2
      updateData.hobby = formData.hobby
      updateData.government = formData.government
      updateData.administrationZone = formData.administrationZone
      updateData.sequencedId = formData.sequencedId
      updateData.faction = formData.faction
      updateData.school = formData.school
    } else if (role === "parent") {
      updateData.children = formData.children
      updateData.views = formData.views
    } else if (role === "teacher") {
      updateData.subject = formData.subject
      updateData.level = formData.level
      updateData.government = formData.government
      updateData.administrationZone = formData.administrationZone
    } else if (role === "lecturer") {
      updateData.bio = formData.bio
      updateData.expertise = formData.expertise
      updateData.subject = formData.subject
    } else if (role === "assistant") {
      updateData.assignedLecturer = formData.assignedLecturer
      updateData.government = formData.government
      updateData.administrationZone = formData.administrationZone
    }

    try {
      if (!user?._id) {
        throw new Error(translateErrorMessage("User ID is missing"))
      }
      const result = await updateUser(user._id, updateData)

      if (result.success) {
        const { password, ...dataToUpdate } = updateData
        onUserUpdated(user._id, dataToUpdate)
        onClose()
      } else {
        setError(translateErrorMessage(result.error))
      }
    } catch (err) {
      setError(translateErrorMessage(err.message || "An error occurred while updating the user"))
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const role = formData.role?.toLowerCase() || ""
  
  const stageOptions = levelHierarchy?.stageOptions?.length
    ? levelHierarchy.stageOptions
    : STAGE_KEYS.map((stageKey) => ({
        value: stageKey,
        label: stageKey,
      })).map(stage => ({
        ...stage,
        label: getStageDisplayName(stage.value, isRTL ? "ar" : "en"),
      }))

  const gradeOptions = formData.stage
    ? getGradeOptionsForStage(levelHierarchy, formData.stage)
    : levelHierarchy?.gradeOptions?.length
      ? levelHierarchy.gradeOptions
      : levels || []

  const hasAdditionalParentContact = Boolean(
    formData.hasAdditionalParentPhone ||
      String(formData.parentPhoneNumber2 || "").trim() ||
      String(formData.parentPhoneRelation2 || "").trim(),
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl" dir={dir}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`font-bold text-lg ${isRTL ? "text-right" : "text-left"}`}>
            {t("admin.editUser.title", { name: user?.name })}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full">
            <X />
          </Button>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm flex items-center gap-3 mb-4">
            <span>{error}</span>
          </div>
        )}

        {isCurrentUserAdmin && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm flex items-center gap-3 mb-4">
            <span>{t("admin.editUser.passwordLocked") || "Admin credentials are locked."}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="form-control">
              <label className="label flex flex-col items-start">
                <span className="label-text mb-1 font-bold">{t("admin.editUser.name")}</span>
              </label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-xl"
                style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
                required
                disabled={isCurrentUserAdmin}
              />
            </div>

            <div className="form-control">
              <label className="label flex flex-col items-start">
                <span className="label-text mb-1 font-bold">{t("admin.editUser.email")}</span>
              </label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-xl"
                style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
                required
                disabled={isCurrentUserAdmin}
              />
            </div>

            <div className="form-control">
              <label className="label flex flex-col items-start">
                <span className="label-text mb-1 font-bold">{t("admin.editUser.phone")}</span>
              </label>
              <Input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full rounded-xl"
                style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
                disabled={isCurrentUserAdmin}
              />
            </div>

            <div className="form-control">
              <label className="label flex flex-col items-start">
                <span className="label-text mb-1 font-bold">{t("admin.userDetails.gender")}</span>
              </label>
              <DSSelect
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full rounded-xl"
                style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
                disabled={isCurrentUserAdmin}
              >
                <option value="male">{isRTL ? "ذكر" : "Male"}</option>
                <option value="female">{isRTL ? "أنثى" : "Female"}</option>
              </DSSelect>
            </div>
          </div>

          <div className="form-control mb-4">
            <label className="label flex flex-col items-start">
              <span className="label-text mb-1 font-bold">{t("admin.editUser.password")}</span>
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full"
                placeholder={isCurrentUserAdmin ? t("admin.editUser.passwordDisabled") : t("admin.editUser.passwordPlaceholder")}
                disabled={isCurrentUserAdmin}
              />
              {!isCurrentUserAdmin && (
                <button
                  type="button"
                  className={`absolute inset-y-0 ${isRTL ? "left-0 pl-3" : "right-0 pr-3"} flex items-center`}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <Eye /> : <EyeOff />}
                </button>
              )}
            </div>
            <label className="label py-0">
              <span className="label-text-alt">
                {isCurrentUserAdmin 
                  ? (t("admin.editUser.passwordLocked") || "Admin credentials are locked")
                  : (t("admin.editUser.passwordHint") || "Leave blank to keep current")
                }
              </span>
            </label>
          </div>

          {role === "student" && (
            <div className="border-t pt-4 mb-4">
              <h4 className="font-bold text-md mb-3 text-blue-600">{isRTL ? "معلومات الطالب" : "Student Information"}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label py-0">
                    <span className="label-text font-bold" style={{ color: "#1F2937" }}>{t("fields.stage") || t("fields.level")}</span>
                  </label>
                  <DSSelect
                    name="stage"
                    className="w-full rounded-xl"
                    style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
                    value={formData.stage || ""}
                    onChange={handleStageChange}
                  >
                    <option value="">{t("placeholders.selectStage")}</option>
                    {stageOptions.map((stage) => (
                      <option key={stage.value} value={stage.value}>{stage.label}</option>
                    ))}
                  </DSSelect>
                </div>

                <div className="form-control">
                  <label className="label py-0">
                    <span className="label-text font-bold" style={{ color: "#1F2937" }}>{t("fields.level")}</span>
                  </label>
                  <DSSelect
                    name="level"
                    className="w-full rounded-xl"
                    style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
                    value={formData.level || ""}
                    onChange={handleChange}
                    disabled={!formData.stage}
                  >
                    <option value="">{!formData.stage ? t("placeholders.selectStageFirst") : t("placeholders.selectGradeLevel")}</option>
                    {Array.isArray(gradeOptions) && gradeOptions.map((level) => (
                      <option key={level.value || level._id} value={level.value || level._id}>{level.label || level.displayName || level.name}</option>
                    ))}
                  </DSSelect>
                </div>

                <div className="form-control">
                  <label className="label py-0">
                    <span className="label-text font-bold" style={{ color: "#1F2937" }}>{t("fields.sequencedIdOptional")}</span>
                  </label>
                  <Input type="text" name="sequencedId" className="w-full rounded-xl" style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }} value={formData.sequencedId || ""} onChange={handleChange} />
                </div>

                <div className="form-control">
                  <label className="label py-0">
                    <span className="label-text font-bold" style={{ color: "#1F2937" }}>{t("fields.hobby")}</span>
                  </label>
                  <DSSelect name="hobby" className="w-full rounded-xl" style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }} value={formData.hobby || ""} onChange={handleChange}>
                    <option value="">{t("placeholders.selectHobby")}</option>
                    {STUDENT_HOBBIES.map((hobby) => (
                      <option key={hobby.id} value={hobby.id}>{isRTL ? hobby.labelAr : hobby.labelEn}</option>
                    ))}
                  </DSSelect>
                </div>

                <div className="form-control">
                  <label className="label py-0"><span className="label-text font-bold" style={{ color: "#1F2937" }}>{t("fields.faction")}</span></label>
                  <Input type="text" name="faction" className="w-full rounded-xl" style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }} value={formData.faction || ""} onChange={handleChange} />
                </div>

                <div className="form-control">
                  <label className="label py-0"><span className="label-text font-bold" style={{ color: "#1F2937" }}>{t("fields.school")}</span></label>
                  <Input type="text" name="school" className="w-full rounded-xl" style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }} value={formData.school || ""} onChange={handleChange} />
                </div>
              </div>

              <div className="mt-4">
                <div className="form-control">
                  <label className="label py-0"><span className="label-text font-bold" style={{ color: "#1F2937" }}>{t("fields.parentPhoneNumber")}</span></label>
                  <Input type="text" inputMode="numeric" name="parentPhoneNumber" className="w-full rounded-xl" style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }} value={formData.parentPhoneNumber || ""} onChange={handleChange} />
                </div>
                {formData.parentPhoneNumber && (
                  <div className="mt-2">
                    <DSSelect name="parentPhoneRelation" className="w-full rounded-xl" style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }} value={formData.parentPhoneRelation || ""} onChange={handleChange}>
                      <option value="">{t("placeholders.selectParentRelation")}</option>
                      {PARENT_RELATIONS.map((relation) => (
                        <option key={relation} value={relation}>{t(`parentRelations.${relation}`)}</option>
                      ))}
                    </DSSelect>
                  </div>
                )}
              </div>

              {!hasAdditionalParentContact ? (
                <Button type="button" variant="outline" size="sm" className="mt-4" onClick={handleAddAdditionalParentPhone}>{t("buttons.addAnotherParentPhone")}</Button>
              ) : (
                <div className="mt-4 p-4 rounded-2xl border border-gray-200 bg-white/70">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-bold" style={{ color: "#1F2937" }}>{t("fields.parentPhoneNumber2")}</p>
                    <Button type="button" variant="ghost" size="xs" className="gap-2 text-red-600" onClick={handleRemoveAdditionalParentPhone}><Trash2 size={14} />{t("buttons.removeParentPhone")}</Button>
                  </div>
                  <Input type="text" inputMode="numeric" name="parentPhoneNumber2" className="w-full rounded-xl mb-2" style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }} value={formData.parentPhoneNumber2 || ""} onChange={handleChange} />
                  <DSSelect name="parentPhoneRelation2" className="w-full rounded-xl" style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }} value={formData.parentPhoneRelation2 || ""} onChange={handleChange}>
                    <option value="">{t("placeholders.selectParentRelation") || "Select relation"}</option>
                    {PARENT_RELATIONS.map((relation) => (
                      <option key={relation} value={relation}>{t(`parentRelations.${relation}`)}</option>
                    ))}
                  </DSSelect>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="form-control">
                  <label className="label py-0"><span className="label-text font-bold" style={{ color: "#1F2937" }}>{t("fields.government")}</span></label>
                  <DSSelect name="government" className="w-full rounded-xl" style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }} value={formData.government || ""} onChange={(e) => handleGovernmentChange(e.target.value)}>
                    <option value="">{t("fields.selectGovernment")}</option>
                    {governments.map((government) => (
                      <option key={government._id} value={government.name}>{government.name}</option>
                    ))}
                  </DSSelect>
                </div>
                <div className="form-control">
                  <label className="label py-0"><span className="label-text font-bold" style={{ color: "#1F2937" }}>{t("fields.administrationZone")}</span></label>
                  <DSSelect disabled={!formData.government || loadingZones} name="administrationZone" className="w-full rounded-xl" style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }} value={formData.administrationZone || ""} onChange={handleChange}>
                    <option value="">{loadingZones ? t("fields.loadingZones") : t("fields.selectAdministrationZone")}</option>
                    {Array.isArray(administrationZones) && administrationZones.map((zone, index) => (
                      <option key={index} value={zone}>{zone}</option>
                    ))}
                  </DSSelect>
                </div>
              </div>
            </div>
          )}

          {role === "parent" && (
            <div className="border-t pt-4 mb-4">
              <h4 className="font-bold text-md mb-3 text-green-600">{isRTL ? "معلومات ولي الأمر" : "Parent Information"}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label py-0"><span className="label-text font-bold" style={{ color: "#1F2937" }}>{t("fields.views")}</span></label>
                  <Input type="number" name="views" className="w-full rounded-xl" style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }} value={formData.views || ""} onChange={handleChange} />
                </div>
              </div>
            </div>
          )}

          {role === "teacher" && (
            <div className="border-t pt-4 mb-4">
              <h4 className="font-bold text-md mb-3 text-purple-600">{isRTL ? "معلومات المعلم" : "Teacher Information"}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label py-0"><span className="label-text font-bold" style={{ color: "#1F2937" }}>{t("fields.subject")}</span></label>
                  <DSSelect multiple name="subject" className="w-full rounded-xl" style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }} value={formData.subject || []} onChange={(e) => setFormData(prev => ({ ...prev, subject: Array.from(e.target.selectedOptions, option => option.value) }))}>
                    {Array.isArray(subjects) && subjects.map((subject) => (
                      <option key={subject._id} value={subject._id}>{subject.name}</option>
                    ))}
                  </DSSelect>
                </div>
                <div className="form-control">
                  <label className="label py-0"><span className="label-text font-bold" style={{ color: "#1F2937" }}>{t("fields.level")}</span></label>
                  <Input type="text" name="level" className="w-full rounded-xl" style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }} value={formData.level || ""} onChange={handleChange} />
                </div>
                <div className="form-control">
                  <label className="label py-0"><span className="label-text font-bold" style={{ color: "#1F2937" }}>{t("fields.government")}</span></label>
                  <DSSelect name="government" className="w-full rounded-xl" style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }} value={formData.government || ""} onChange={(e) => handleGovernmentChange(e.target.value)}>
                    <option value="">{t("fields.selectGovernment")}</option>
                    {governments.map((government) => (
                      <option key={government._id} value={government.name}>{government.name}</option>
                    ))}
                  </DSSelect>
                </div>
                <div className="form-control">
                  <label className="label py-0"><span className="label-text font-bold" style={{ color: "#1F2937" }}>{t("fields.administrationZone")}</span></label>
                  <DSSelect disabled={!formData.government || loadingZones} name="administrationZone" className="w-full rounded-xl" style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }} value={formData.administrationZone || ""} onChange={handleChange}>
                    <option value="">{loadingZones ? t("fields.loadingZones") : t("fields.selectAdministrationZone")}</option>
                    {Array.isArray(administrationZones) && administrationZones.map((zone, index) => (
                      <option key={index} value={zone}>{zone}</option>
                    ))}
                  </DSSelect>
                </div>
              </div>
            </div>
          )}

          {role === "lecturer" && (
            <div className="border-t pt-4 mb-4">
              <h4 className="font-bold text-md mb-3 text-orange-600">{isRTL ? "معلومات المحاضر" : "Lecturer Information"}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label py-0"><span className="label-text font-bold" style={{ color: "#1F2937" }}>{t("fields.expertise")}</span></label>
                  <Input type="text" name="expertise" className="w-full rounded-xl" style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }} value={formData.expertise || ""} onChange={handleChange} />
                </div>
                <div className="form-control">
                  <label className="label py-0"><span className="label-text font-bold" style={{ color: "#1F2937" }}>{t("fields.subject")}</span></label>
                  <DSSelect multiple name="subject" className="w-full rounded-xl" style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }} value={formData.subject || []} onChange={(e) => setFormData(prev => ({ ...prev, subject: Array.from(e.target.selectedOptions, option => option.value) }))}>
                    {Array.isArray(subjects) && subjects.map((subject) => (
                      <option key={subject._id} value={subject._id}>{subject.name}</option>
                    ))}
                  </DSSelect>
                </div>
                <div className="form-control md:col-span-2">
                  <label className="label py-0"><span className="label-text font-bold" style={{ color: "#1F2937" }}>{t("fields.bio")}</span></label>
                  <textarea name="bio" className="w-full rounded-xl p-3" style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }} value={formData.bio || ""} onChange={handleChange} rows={3} />
                </div>
              </div>
            </div>
          )}

          {role === "assistant" && (
            <div className="border-t pt-4 mb-4">
              <h4 className="font-bold text-md mb-3 text-teal-600">{isRTL ? "معلومات المساعد" : "Assistant Information"}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label py-0"><span className="label-text font-bold" style={{ color: "#1F2937" }}>{t("fields.assignedLecturer")}</span></label>
                  <DSSelect name="assignedLecturer" className="w-full rounded-xl" style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }} value={formData.assignedLecturer || ""} onChange={handleChange}>
                    <option value="">{isRTL ? "اختر المحاضر" : "Select Lecturer"}</option>
                    {Array.isArray(lecturers) && lecturers.map((lecturer) => (
                      <option key={lecturer._id} value={lecturer._id}>{lecturer.name}</option>
                    ))}
                  </DSSelect>
                </div>
                <div className="form-control">
                  <label className="label py-0"><span className="label-text font-bold" style={{ color: "#1F2937" }}>{t("fields.government")}</span></label>
                  <DSSelect name="government" className="w-full rounded-xl" style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }} value={formData.government || ""} onChange={(e) => handleGovernmentChange(e.target.value)}>
                    <option value="">{t("fields.selectGovernment")}</option>
                    {governments.map((government) => (
                      <option key={government._id} value={government.name}>{government.name}</option>
                    ))}
                  </DSSelect>
                </div>
                <div className="form-control">
                  <label className="label py-0"><span className="label-text font-bold" style={{ color: "#1F2937" }}>{t("fields.administrationZone")}</span></label>
                  <DSSelect disabled={!formData.government || loadingZones} name="administrationZone" className="w-full rounded-xl" style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }} value={formData.administrationZone || ""} onChange={handleChange}>
                    <option value="">{loadingZones ? t("fields.loadingZones") : t("fields.selectAdministrationZone")}</option>
                    {Array.isArray(administrationZones) && administrationZones.map((zone, index) => (
                      <option key={index} value={zone}>{zone}</option>
                    ))}
                  </DSSelect>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="ghost" onClick={onClose}>{t("admin.editUser.cancel")}</Button>
            <Button type="submit" variant="primary" disabled={loading} isLoading={loading}>{t("admin.editUser.save")}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditUserModal
