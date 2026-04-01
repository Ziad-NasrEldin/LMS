"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
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
import { translateErrorMessage } from "../../../../utils/errorTranslator"

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
    level: [],
    phoneNumber: "",
    parentPhoneNumber: "",
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
  }

  const [userData, setUserData] = useState(initialUserState)
  const [formError, setFormError] = useState("")
  const [isBulkMode, setIsBulkMode] = useState(false)
  const [levels, setLevels] = useState([])
  const [subjects, setSubjects] = useState([])
  const [lecturers, setLecturers] = useState([])
  const [loadingDropdowns, setLoadingDropdowns] = useState(false)
  const [governments, setGovernments] = useState([])
  const [administrationZones, setAdministrationZones] = useState([])
  const [loadingZones, setLoadingZones] = useState(false)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setUserData(initialUserState)
      setFormError("")
      setIsBulkMode(false)
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
        setLevels(levelsResult.data || [])
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
      setFormError(
        translateErrorMessage(typeof error === "string" ? error : error.message || t("errors.failedToCreateUser"))
      )
    }
  }, [error, t])

  const handleChange = (e) => {
    const { name, value } = e.target
    setUserData((prev) => ({ ...prev, [name]: value }))
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

    if (userData.password.length < 6) {
      return t("validation.passwordTooShort")
    }

    // Role-specific validations
    if (userData.role === "student") {
      if (!userData.level) {
        return t("validation.levelRequired")
      }
      if (!userData.phoneNumber || !/^\d{10,15}$/.test(userData.phoneNumber)) {
        return t("validation.invalidPhoneNumber")
      }
    }

    if (userData.role === "parent") {
      if (!userData.phoneNumber || !/^\d{10,15}$/.test(userData.phoneNumber)) {
        return t("validation.invalidPhoneNumber")
      }
    }

    if (userData.role === "lecturer") {
      if (!userData.subject || userData.subject.length === 0) {
        return t("validation.subjectsRequired")
      }
    }

    if (userData.role === "assistant") {
      if (!userData.assignedLecturer) {
        return t("validation.lecturerRequired")
      }
    }

    if (userData.role === "Teacher") {
      if (!userData.phoneNumber || !/^\d{10,15}$/.test(userData.phoneNumber)) {
        return t("validation.invalidPhoneNumber")
      }
      if (!userData.subject) {
        return t("validation.subjectRequired")
      }
      if (!userData.level || userData.level.length === 0) {
        return t("validation.levelRequired")
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
          level: data.level || undefined,
          phoneNumber: data.phoneNumber || undefined,
          sequencedId: data.sequencedId || undefined,
          parentPhoneNumber: data.parentPhoneNumber || undefined,
          faction: data.faction || undefined,
          school: data.school || undefined,
          parent: data.parent || undefined,
          government: data.government || undefined,
          administrationZone: data.administrationZone || undefined,
        }

      case "parent":
        return {
          ...commonFields,
          phoneNumber: data.phoneNumber || undefined,
          government: data.government || undefined,
          administrationZone: data.administrationZone || undefined,
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

      case "Teacher":
        return {
          ...commonFields,
          phoneNumber: data.phoneNumber || undefined,
          phoneNumber2: data.phoneNumber2 || undefined,
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

  if (!isOpen) return null

  return (
    <div className="modal modal-open" dir={isRTL ? "rtl" : "ltr"} style={{ backgroundColor: 'rgba(17,24,39,0.4)' }}>
      <div 
        className="modal-box max-w-2xl rounded-[2rem] p-6 sm:p-8" 
        style={{ 
          backgroundColor: TOKENS.neutralCloud, 
          boxShadow: SHADOWS.level2 
        }}
      >
        <h3 className="font-extrabold text-2xl mb-6" style={{ color: TOKENS.spaceDark }}>
          {isBulkMode ? t("titles.bulkCreate") : t("titles.createNewUser")}
        </h3>

        <div className="flex bg-white rounded-xl p-1 mb-6 border" style={{ borderColor: 'rgba(17,24,39,0.05)' }}>
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

        {formError && (
          <div className="alert border-none rounded-xl mb-6 font-medium" style={{ backgroundColor: "rgba(224,36,36,0.1)", color: "#E02424" }}>
            <span>{formError}</span>
          </div>
        )}

        {isBulkMode ? (
          <BulkCreateUsers />
        ) : loadingDropdowns ? (
          <div className="flex justify-center my-12">
            <span className="loading loading-spinner loading-lg" style={{ color: TOKENS.deepTeal }}></span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="form-control">
                <div className="flex flex-col gap-2">
                  <label className="label py-0">
                    <span className="label-text font-bold" style={{ color: TOKENS.spaceDark }}>{t("fields.accountType")}</span>
                  </label>
                  <select
                    name="role"
                    className="select w-full rounded-xl"
                    style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: TOKENS.spaceDark }}
                    value={userData.role}
                    onChange={handleChange}
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
                    <option value="Teacher">{t("roles.teacher")}</option>
                  </select>
                </div>
              </div>

              <div className="form-control">
                <div className="flex flex-col gap-2">
                  <label className="label py-0">
                    <span className="label-text font-bold" style={{ color: TOKENS.spaceDark }}>{t("fields.gender")}</span>
                  </label>
                  <select
                    name="gender"
                    className="select w-full rounded-xl"
                    style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: TOKENS.spaceDark }}
                    value={userData.gender}
                    onChange={handleChange}
                    required
                  >
                    <option value="male">{t("gender.male")}</option>
                    <option value="female">{t("gender.female")}</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-control">
              <div className="flex flex-col gap-2">
                <label className="label py-0">
                  <span className="label-text font-bold" style={{ color: TOKENS.spaceDark }}>{t("fields.name")}</span>
                </label>
                <input
                  type="text"
                  name="name"
                  className="input w-full rounded-xl"
                  style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: TOKENS.spaceDark }}
                  value={userData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-control">
              <div className="flex flex-col gap-2">
                <label className="label">
                  <span className="label-text">{t("fields.email")}</span>
                </label>
                <input
                  type="email"
                  name="email"
                  className="input input-bordered"
                  value={userData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <div className="flex flex-col gap-2">
                  <label className="label">
                    <span className="label-text">{t("fields.password")}</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    className="input input-bordered"
                    value={userData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-control">
                <div className="flex flex-col gap-2">
                  <label className="label">
                    <span className="label-text">{t("fields.confirmPassword")}</span>
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    className="input input-bordered"
                    value={userData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {userData.role === "student" && (
              <StudentForm
                userData={userData}
                handleChange={handleChange}
                handleGovernmentChange={handleGovernmentChange}
                levels={levels}
                governments={governments}
                administrationZones={administrationZones}
                loadingZones={loadingZones}
                t={t}
                isRTL={isRTL}
              />
            )}

            {userData.role === "parent" && (
              <ParentForm
                userData={userData}
                handleChange={handleChange}
                handleGovernmentChange={handleGovernmentChange}
                governments={governments}
                administrationZones={administrationZones}
                loadingZones={loadingZones}
                t={t}
                isRTL={isRTL}
              />
            )}

            {userData.role === "lecturer" && (
              <LecturerForm
                userData={userData}
                handleChange={handleChange}
                handleGovernmentChange={handleGovernmentChange}
                subjects={subjects}
                governments={governments}
                administrationZones={administrationZones}
                loadingZones={loadingZones}
                t={t}
                isRTL={isRTL}
              />
            )}

            {userData.role === "assistant" && (
              <AssistantForm
                userData={userData}
                handleChange={handleChange}
                lecturers={lecturers}
                t={t}
                isRTL={isRTL}
              />
            )}

            {userData.role === "Teacher" && (
              <TeacherForm
                userData={userData}
                handleChange={handleChange}
                handleGovernmentChange={handleGovernmentChange}
                subjects={subjects}
                levels={levels}
                governments={governments}
                administrationZones={administrationZones}
                loadingZones={loadingZones}
                t={t}
                isRTL={isRTL}
              />
            )}

            <div className="modal-action">
              <button type="button" className="btn" onClick={onClose}>
                {t("buttons.cancel")}
              </button>
              <button type="submit" className="btn btn-primary" disabled={loadingDropdowns}>
                {t("buttons.create")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default CreateUserModal
