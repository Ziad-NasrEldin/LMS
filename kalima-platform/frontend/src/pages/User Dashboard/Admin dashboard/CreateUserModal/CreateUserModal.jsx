"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Eye, EyeOff, X } from "lucide-react"
import { getAllLecturers } from "../../../../routes/fetch-users"
import { getAllLevels } from "../../../../routes/levels"
import { getAllSubjects } from "../../../../routes/courses"
import StudentForm from "./StudentForm"
import ParentForm from "./ParentForm"
import LecturerForm from "./LecturerForm"
import AssistantForm from "./AssistantForm"
import BulkCreateUsers from "./BulkCreateUsers"
import TeacherForm from "./TeacherForm"
import { getAllGovernments, getGovernmentZones } from "../../../../routes/governments"
import { designTokens } from "../../../../constants/designTokens"
import { normalizeStudentHobby } from "../../../../constants/studentHobbies"
import { translateErrorMessage } from "../../../../utils/errorTranslator"
import { buildLevelHierarchy } from "../../../../utils/levelHierarchy"
import DSSelect from "../../../../components/DSSelect"
import Button from "../../../../components/ui/Button"
import Input from "../../../../components/ui/Input"

const PARENT_RELATIONS = ["mother", "father", "other"]
const normalizeParentRelation = (value) => String(value || "").trim().toLowerCase()
const FIELD_ALIASES = {
  phone: "phoneNumber",
  phone_number: "phoneNumber",
  parentPhone: "parentPhoneNumber",
  parentPhone1: "parentPhoneNumber",
  parent_relation: "parentPhoneRelation",
  stageId: "stage",
  levelId: "level",
}

const normalizeFieldName = (field) => FIELD_ALIASES[field] || field

const getErrorMessageCandidate = (value) => {
  if (!value) return ""
  if (typeof value === "string") return value.trim()
  if (Array.isArray(value)) {
    return value.map(getErrorMessageCandidate).filter(Boolean).join("، ")
  }
  if (typeof value === "object") {
    return (
      getErrorMessageCandidate(value.translatedMessage) ||
      getErrorMessageCandidate(value.message) ||
      getErrorMessageCandidate(value.error) ||
      getErrorMessageCandidate(value.rawMessage) ||
      getErrorMessageCandidate(value.rawError) ||
      getErrorMessageCandidate(value.stack)
    )
  }

  return ""
}

const collectFieldErrors = (source, bucket, visited = new WeakSet()) => {
  if (!source) return bucket

  if (Array.isArray(source)) {
    source.forEach((item) => collectFieldErrors(item, bucket, visited))
    return bucket
  }

  if (typeof source !== "object") return bucket
  if (visited.has(source)) return bucket
  visited.add(source)

  if (typeof source.field === "string") {
    const fieldName = normalizeFieldName(source.field)
    const fieldMessage =
      getErrorMessageCandidate(source.message) ||
      getErrorMessageCandidate(source.rawMessage) ||
      getErrorMessageCandidate(source.error) ||
      getErrorMessageCandidate(source.code)

    if (fieldName && fieldMessage && !bucket[fieldName]) {
      bucket[fieldName] = translateErrorMessage(fieldMessage, fieldMessage)
    }
  }

  if (source.errors && typeof source.errors === "object" && !Array.isArray(source.errors)) {
    Object.entries(source.errors).forEach(([field, value]) => {
      const fieldName = normalizeFieldName(field)
      const fieldMessage = getErrorMessageCandidate(value)
      if (fieldName && fieldMessage && !bucket[fieldName]) {
        bucket[fieldName] = translateErrorMessage(fieldMessage, fieldMessage)
      }
      collectFieldErrors(value, bucket, visited)
    })
  }

  ;["data", "error", "details", "issues", "validationErrors"].forEach((key) => {
    if (source[key]) {
      collectFieldErrors(source[key], bucket, visited)
    }
  })

  return bucket
}

const isGenericFormError = (message = "") => {
  const normalized = String(message || "").trim().toLowerCase()
  return (
    !normalized ||
    normalized.includes("unexpected error") ||
    normalized.includes("failed to create user") ||
    normalized.includes("unknown error") ||
    normalized.includes("request failed")
  )
}

const CreateUserModal = ({ isOpen, onClose, onCreateUser, error }) => {
  const { t, i18n } = useTranslation("createUser")
  const isRTL = i18n.language === "ar"
  const TOKENS = designTokens.colors;
  const SHADOWS = designTokens.shadows;

  const initialUserState = {
    role: "student",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "male",
    stage: "",
    level: "",
    phoneNumber: "",
    parentPhoneNumber: "",
    parentPhoneRelation: "",
    parentPhoneNumber2: "",
    parentPhoneRelation2: "",
    hasAdditionalParentPhone: false,
    hobby: "",
    profession: "",
    faction: "",
    school: "",
    parent: "",
    subject: [],
    bio: "",
    expertise: "",
    assignedLecturer: "",
    sequencedId: "",
    government: "",
    administrationZone: "",
    // Teacher-specific fields
    phoneNumber2: "",
    teachesAtType: "",
    centers: [],
    socialMedia: [],
    profilePic: null,
    // Parent-specific fields
    childProfiles: [],
  }

  const [userData, setUserData] = useState(initialUserState)
  const [formError, setFormError] = useState("")
  const [fieldErrors, setFieldErrors] = useState({})
  const [isBulkMode, setIsBulkMode] = useState(false)
  const [levels, setLevels] = useState([])
  const [levelHierarchy, setLevelHierarchy] = useState({
    levels: [],
    stages: [],
    grades: [],
    gradesByStageId: {},
    stageOptions: [],
    gradeOptions: [],
  })
  const [subjects, setSubjects] = useState([])
  const [lecturers, setLecturers] = useState([])
  const [loadingDropdowns, setLoadingDropdowns] = useState(false)
  const [governments, setGovernments] = useState([])
  const [administrationZones, setAdministrationZones] = useState([])
  const [loadingZones, setLoadingZones] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setUserData(initialUserState)
      setFormError("")
      setFieldErrors({})
      setIsBulkMode(false)
      setShowPassword(false)
      setShowConfirmPassword(false)
      fetchDropdownData()
    }
  }, [isOpen])

  // Fetch data for dropdowns
  const fetchDropdownData = async () => {
    setLoadingDropdowns(true)
    try {
      // Fetch governments
      const governmentsResult = await getAllGovernments()
      if (governmentsResult.success) {
        setGovernments(governmentsResult.data || [])
      } else {
        console.error("Failed to fetch governments:", governmentsResult.error)
      }

      const levelsResult = await getAllLevels()
      if (levelsResult.success) {
        const hierarchy = levelsResult.hierarchy || buildLevelHierarchy(levelsResult.data || [], i18n.language)
        setLevelHierarchy(hierarchy)
        setLevels(hierarchy.grades || [])
      } else {
        console.error("Failed to fetch levels:", levelsResult.error)
      }

      const subjectsResult = await getAllSubjects()
      if (subjectsResult.success) {
        setSubjects(subjectsResult.data || [])
      } else {
        console.error("Failed to fetch subjects:", subjectsResult.error)
      }

      const lecturersResult = await getAllLecturers()
      if (lecturersResult.success) {
        setLecturers(lecturersResult.data || [])
      } else {
        console.error("Failed to fetch lecturers:", lecturersResult.error)
      }
    } catch (error) {
      setFormError(t("errors.failedToLoadDropdowns"))
      console.error("Error fetching dropdown data:", error)
    } finally {
      setLoadingDropdowns(false)
    }
  }

  // Display error from parent component
  useEffect(() => {
    if (error) {
      const nextFieldErrors = collectFieldErrors(error, {})
      const explicitMessage = getErrorMessageCandidate(error)
      const translatedMessage = translateErrorMessage(explicitMessage, t("errors.failedToCreateUser"))
      const fallbackFieldMessage = Object.values(nextFieldErrors)[0] || ""

      setFieldErrors(nextFieldErrors)
      setFormError(isGenericFormError(translatedMessage) && fallbackFieldMessage ? fallbackFieldMessage : translatedMessage)
    }
  }, [error, t])

  const handleChange = (e) => {
    const { name, value } = e.target
    setUserData((prev) => {
      const next = { ...prev, [name]: value }

      if (name === "parentPhoneNumber" && !String(value || "").trim()) {
        next.parentPhoneRelation = ""
      }

      if (name === "parentPhoneNumber2" && !String(value || "").trim()) {
        next.parentPhoneRelation2 = ""
      }

      if (name === "hasAdditionalParentPhone" && !value) {
        next.parentPhoneNumber2 = ""
        next.parentPhoneRelation2 = ""
      }

      return next
    })

    if (name) {
      setFieldErrors((prev) => {
        if (!prev[name]) return prev
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const handleRoleChange = (e) => {
    const role = e.target.value
    setUserData((prev) => ({
      ...prev,
      role,
      stage: role === "teacher" ? [] : "",
      level: role === "teacher" ? [] : "",
      parentPhoneNumber: "",
      parentPhoneRelation: "",
      parentPhoneNumber2: "",
      parentPhoneRelation2: "",
      hasAdditionalParentPhone: false,
      childProfiles: [],
    }))
  }

  const validateForm = () => {
    // Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(userData.email)) {
      return t("validation.invalidEmail")
    }

    // Password match and length
    if (userData.password !== userData.confirmPassword) {
      return t("validation.passwordsDoNotMatch")
    }

    if (userData.password.length < 8) {
      return t("validation.passwordTooShort")
    }

    // Role-specific validations
    if (userData.role === "student") {
      if (!userData.stage) {
        return t("validation.stageRequired")
      }
      if (!userData.level) {
        return t("validation.levelRequired")
      }
      if (!userData.phoneNumber || !/^\d{10,15}$/.test(userData.phoneNumber)) {
        return t("validation.invalidPhoneNumber")
      }
      if (!userData.parentPhoneNumber || !/^\d{10,15}$/.test(userData.parentPhoneNumber)) {
        return t("validation.invalidParentPhoneNumber")
      }
      if (!userData.parentPhoneRelation) {
        return t("validation.parentRelationRequired")
      }
      if (!PARENT_RELATIONS.includes(normalizeParentRelation(userData.parentPhoneRelation))) {
        return t("validation.parentRelationInvalid")
      }

      const hasAdditionalParentContact =
        userData.hasAdditionalParentPhone ||
        Boolean(String(userData.parentPhoneNumber2 || "").trim()) ||
        Boolean(String(userData.parentPhoneRelation2 || "").trim())

      if (hasAdditionalParentContact) {
        if (!userData.parentPhoneNumber2) {
          return t("validation.additionalParentPhoneRequired")
        }
        if (!/^\d{10,15}$/.test(userData.parentPhoneNumber2)) {
          return t("validation.invalidParentPhoneNumber")
        }
        if (!userData.parentPhoneRelation2) {
          return t("validation.additionalParentRelationRequired")
        }
        if (!PARENT_RELATIONS.includes(normalizeParentRelation(userData.parentPhoneRelation2))) {
          return t("validation.additionalParentRelationInvalid")
        }
      }
      if (!userData.hobby) {
        return t("validation.hobbyRequired")
      }
      if (!userData.government) {
        return t("validation.governmentRequired")
      }
      if (!userData.administrationZone) {
        return t("validation.administrationZoneRequired")
      }
    }

    if (userData.role === "parent") {
      if (!userData.phoneNumber || !/^\d{10,15}$/.test(userData.phoneNumber)) {
        return t("validation.invalidPhoneNumber")
      }
      if (!userData.profession?.trim()) {
        return t("validation.professionRequired")
      }
      if (!userData.government) {
        return t("validation.governmentRequired")
      }
      if (!userData.administrationZone) {
        return t("validation.administrationZoneRequired")
      }
      if (Array.isArray(userData.childProfiles) && userData.childProfiles.length > 0) {
        for (let i = 0; i < userData.childProfiles.length; i++) {
          const child = userData.childProfiles[i]
          if (!child.stage) {
            return t("validation.childStageRequired") || `Child ${i + 1}: Stage is required`
          }
          if (!child.level) {
            return t("validation.childLevelRequired") || `Child ${i + 1}: Level is required`
          }
        }
      }
    }

    if (userData.role === "lecturer") {
      if (!userData.subject || userData.subject.length === 0) {
        return t("validation.subjectsRequired")
      }
      if (!userData.bio?.trim()) {
        return t("validation.bioRequired")
      }
      if (!userData.expertise?.trim()) {
        return t("validation.expertiseRequired")
      }
    }

    if (userData.role === "assistant") {
      if (!userData.assignedLecturer) {
        return t("validation.lecturerRequired")
      }
    }

    if (userData.role === "teacher") {
      if (!userData.phoneNumber || !/^\d{10,15}$/.test(userData.phoneNumber)) {
        return t("validation.invalidPhoneNumber")
      }
      if (!userData.subject) {
        return t("validation.subjectRequired")
      }
      const teacherStages = Array.isArray(userData.stage) ? userData.stage : userData.stage ? [userData.stage] : []
      if (teacherStages.length === 0) {
        return t("validation.stageRequired") || "At least one stage is required"
      }
      if (!Array.isArray(userData.level) || userData.level.length === 0) {
        return t("validation.levelRequired")
      }
      const validStageIds = new Set((levelHierarchy?.stageOptions || []).map((option) => option.value))
      const validGradeIds = new Set((levelHierarchy?.grades || []).map((g) => g._id || g.value))
      const hasInvalidLevel = userData.level.some((value) => !validGradeIds.has(value))
      if (hasInvalidLevel) {
        return t("validation.invalidTeacherLevelSelection")
      }
      if (!userData.teachesAtType) {
        return t("validation.teachesAtTypeRequired")
      }
      if (
        (userData.teachesAtType === "Both" || userData.teachesAtType === "Center") &&
        (!userData.centers || userData.centers.length === 0)
      ) {
        return t("validation.centersRequired")
      }
      if ((userData.teachesAtType === "Both" || userData.teachesAtType === "School") && !userData.school) {
        return t("validation.schoolRequired")
      }
      if (!userData.government) {
        return t("validation.governmentRequired")
      }
      if (!userData.administrationZone) {
        return t("validation.administrationZoneRequired")
      }
    }

    return ""
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setFormError("")

    const validationError = validateForm()
    if (validationError) {
      setFormError(validationError)
      return
    }

    setFieldErrors({})
    const filteredData = filterDataByRole(userData)

    onCreateUser(filteredData)
  }

  const filterDataByRole = (data) => {
    const commonFields = {
      role: data.role,
      name: data.name,
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      gender: data.gender,
    }

    switch (data.role) {
      case "student":
        return {
          ...commonFields,
          stage: data.stage || undefined,
          level: data.level || undefined,
          phoneNumber: data.phoneNumber || undefined,
          sequencedId: data.sequencedId || undefined,
          parentPhoneNumber: data.parentPhoneNumber || undefined,
          parentPhoneRelation: data.parentPhoneRelation || undefined,
          parentPhoneNumber2: data.parentPhoneNumber2 || undefined,
          parentPhoneRelation2: data.parentPhoneRelation2 || undefined,
          hobby: data.hobby ? normalizeStudentHobby(data.hobby) : undefined,
          faction: data.faction || undefined,
          school: data.school || undefined,
          parent: data.parent || undefined,
          government: data.government || undefined,
          administrationZone: data.administrationZone || undefined,
        }

      case "parent":
        return {
          ...commonFields,
          level: data.level || undefined,
          phoneNumber: data.phoneNumber || undefined,
          profession: data.profession?.trim() || undefined,
          government: data.government || undefined,
          administrationZone: data.administrationZone || undefined,
          childProfiles: Array.isArray(data.childProfiles) && data.childProfiles.length > 0
            ? data.childProfiles
                .filter((cp) => cp.stage && cp.level)
                .map((cp) => ({
                  stage: cp.stage,
                  level: cp.level,
                  ...(cp.sequenceId ? { sequenceId: cp.sequenceId } : {}),
                }))
            : undefined,
        }

      case "lecturer":
        return {
          ...commonFields,
          subject: data.subject || [],
          bio: data.bio || undefined,
          expertise: data.expertise || undefined,
          government: data.government || undefined,
          administrationZone: data.administrationZone || undefined,
          profilePic: data.profilePic || undefined,
        }

      case "assistant":
        return {
          ...commonFields,
          assignedLecturer: data.assignedLecturer || undefined,
        }

      case "teacher":
        return {
          ...commonFields,
          phoneNumber: data.phoneNumber || undefined,
          phoneNumber2: data.phoneNumber2 || undefined,
          stage: Array.isArray(data.stage) ? data.stage : data.stage ? [data.stage] : [],
          subject: data.subject || undefined,
          level: Array.isArray(data.level) ? data.level : data.level ? [data.level] : [],
          teachesAtType: data.teachesAtType || undefined,
          centers: Array.isArray(data.centers) ? data.centers : data.centers ? [data.centers] : [],
          school: data.school || undefined,
          government: data.government || undefined,
          administrationZone: data.administrationZone || undefined,
          socialMedia: Array.isArray(data.socialMedia) ? data.socialMedia : [],
        }

      case "subadmin":
      case "moderator":
        return commonFields

      default:
        return commonFields
    }
  }

  const handleGovernmentChange = async (governmentName) => {
    setUserData((prev) => ({
      ...prev,
      government: governmentName,
      administrationZone: "", // Reset zone when government changes
    }))

    if (governmentName) {
      setLoadingZones(true)
      try {
        const zonesResult = await getGovernmentZones(governmentName)
        if (zonesResult.success) {
          setAdministrationZones(zonesResult.data || [])
        } else {
          console.error("Failed to fetch zones:", zonesResult.error)
          setAdministrationZones([])
        }
      } catch (error) {
        console.error("Error fetching zones:", error)
        setAdministrationZones([])
      } finally {
        setLoadingZones(false)
      }
    } else {
      setAdministrationZones([])
    }
  }

  const renderRoleSpecificFields = () => {
    const sharedFormProps = {
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
      fieldErrors,
    }

    switch (userData.role) {
      case "student":
        return <StudentForm {...sharedFormProps} />
      case "parent":
        return <ParentForm {...sharedFormProps} />
      case "lecturer":
        return <LecturerForm userData={userData} handleChange={handleChange} subjects={subjects} t={t} />
      case "assistant":
        return (
          <AssistantForm
            userData={userData}
            handleChange={handleChange}
            lecturers={lecturers}
            t={t}
            isRTL={isRTL}
          />
        )
      case "teacher":
        return <TeacherForm {...sharedFormProps} subjects={subjects} />
      default:
        return null
    }
  }

  if (!isOpen) return null

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir={isRTL ? "rtl" : "ltr"} style={{ backgroundColor: 'rgba(17,24,39,0.4)' }}>
        <div
          className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[2rem] p-0 bg-white"
          style={{
            backgroundColor: TOKENS.neutralCloud,
            boxShadow: SHADOWS.level2
          }}
        >
        {/* Header with close button */}
        <div className="flex items-center justify-between p-6 pb-0 sm:px-8">
          <h3 className="font-extrabold text-2xl" style={{ color: TOKENS.inkText }}>
            {isBulkMode ? t("titles.bulkCreate") : t("titles.createNewUser")}
          </h3>
               <Button
                 type="button"
                 variant="ghost"
                 size="sm"
                 className="rounded-full p-2"
                 onClick={onClose}
                 style={{ color: TOKENS.slateText }}
                 aria-label={t("buttons.close")}
               >
              <X size={20} />
            </Button>
        </div>

        <div className="flex bg-white rounded-xl p-1 mb-6 border px-6 sm:px-8" style={{ borderColor: 'rgba(17,24,39,0.05)' }}>
          <button 
            className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all ${!isBulkMode ? "shadow-sm" : "hover:bg-gray-50"}`} 
            style={{ 
              backgroundColor: !isBulkMode ? TOKENS.deepTeal : "transparent",
              color: !isBulkMode ? "white" : TOKENS.slateText
            }}
            onClick={() => setIsBulkMode(false)}
          >
            {t("tabs.createSingleUser")}
          </button>
          <button 
            className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all ${isBulkMode ? "shadow-sm" : "hover:bg-gray-50"}`} 
            style={{ 
              backgroundColor: isBulkMode ? TOKENS.deepTeal : "transparent",
              color: isBulkMode ? "white" : TOKENS.slateText
            }}
            onClick={() => setIsBulkMode(true)}
          >
            {t("tabs.bulkCreate")}
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 sm:px-8 sm:pb-8">

         {formError && (
      <div className="mb-6 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-[#991B1B] shadow-sm flex items-center gap-3 font-medium">
             <span>{formError}</span>
           </div>
         )}

        {isBulkMode ? (
          <BulkCreateUsers />
        ) : loadingDropdowns ? (
          <div className="flex justify-center my-12">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" style={{ color: TOKENS.deepTeal }}></div>
          </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mb-4">
                <div className="flex flex-col gap-2">
                  <label className="block mb-1">
                    <span className="text-sm font-bold" style={{ color: TOKENS.inkText }}>{t("fields.accountType")}</span>
                  </label>
                  <DSSelect
                    name="role"
                    className="select w-full rounded-xl"
                    style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: TOKENS.inkText }}
                    value={userData.role}
                    onChange={handleRoleChange}
                    required
                  >
                    <option value="" disabled>
                      {t("placeholders.selectAccountType")}
                    </option>
                    <option value="subadmin">{t("roles.subadmin")}</option>
                    <option value="moderator">{t("roles.moderator")}</option>
                    <option value="assistant">{t("roles.assistant")}</option>
                    <option value="student">{t("roles.student")}</option>
                    <option value="parent">{t("roles.parent")}</option>
                    <option value="lecturer">{t("roles.lecturer")}</option>
                    <option value="teacher">{t("roles.teacher")}</option>
                  </DSSelect>
                </div>
              </div>
              <div className="mb-4">
                <div className="flex flex-col gap-2">
                  <label className="block mb-1">
                    <span className="text-sm font-bold" style={{ color: TOKENS.inkText }}>{t("fields.gender")}</span>
                  </label>
                  <DSSelect
                    name="gender"
                    className="select w-full rounded-xl"
                    style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: TOKENS.inkText }}
                    value={userData.gender}
                    onChange={handleChange}
                    required
                  >
                    <option value="male">{t("gender.male")}</option>
                    <option value="female">{t("gender.female")}</option>
                  </DSSelect>
                </div>
              </div>
            </div>

           {renderRoleSpecificFields()}

            <div className="mb-4">
              <div className="flex flex-col gap-2">
                <label className="block mb-1">
                  <span className="text-sm font-bold" style={{ color: TOKENS.inkText }}>{t("fields.name")}</span>
                </label>
                <Input
                  type="text"
                  name="name"
                  className="w-full rounded-xl"
                  variant={fieldErrors.name ? "error" : "default"}
                  style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: TOKENS.inkText }}
                  value={userData.name}
                  onChange={handleChange}
                  error={fieldErrors.name}
                  required
                />
              </div>
            </div>
            <div className="mb-4">
              <div className="flex flex-col gap-2">
                <label className="block mb-1">
                  <span className="text-sm font-bold" style={{ color: TOKENS.inkText }}>{t("fields.email")}</span>
                </label>
                <Input
                  type="email"
                  name="email"
                  className="w-full rounded-xl"
                  variant={fieldErrors.email ? "error" : "default"}
                  style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: TOKENS.inkText }}
                  value={userData.email}
                  onChange={handleChange}
                  error={fieldErrors.email}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mb-4">
                <div className="flex flex-col gap-2">
                  <label className="block mb-1">
                    <span className="text-sm font-bold" style={{ color: TOKENS.inkText }}>{t("fields.password")}</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      className="w-full rounded-xl"
                      variant={fieldErrors.password ? "error" : "default"}
                      style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: TOKENS.inkText }}
                      value={userData.password}
                      onChange={handleChange}
                      error={fieldErrors.password}
                      required
                    />
                    <button
                      type="button"
                      className={`absolute top-1/2 ${isRTL ? "left-3" : "right-3"} -translate-y-1/2 z-10`}
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <div className="flex flex-col gap-2">
                  <label className="block mb-1">
                    <span className="text-sm font-bold" style={{ color: TOKENS.inkText }}>{t("fields.confirmPassword")}</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      className="w-full rounded-xl"
                      variant={fieldErrors.confirmPassword ? "error" : "default"}
                      style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: TOKENS.inkText }}
                      value={userData.confirmPassword}
                      onChange={handleChange}
                      error={fieldErrors.confirmPassword}
                      required
                    />
                    <button
                      type="button"
                      className={`absolute top-1/2 ${isRTL ? "left-3" : "right-3"} -translate-y-1/2 z-10`}
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                {t("buttons.cancel")}
              </Button>
              <Button type="submit" variant="primary" disabled={loadingDropdowns}>
                {t("buttons.create")}
              </Button>
            </div>
          </form>
        )}
        </div>
      </div>
    </div>
  )
}

export default CreateUserModal
