"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import Step1 from "./step1"
import Step2 from "./Step2"
import Step3 from "./Step3"
import StepParent from "./StepParent"
import StepTeacher from "./StepTeacher"
import Step4 from "./Step4"
import StepsIndicator from "./StepsIndicator"
import NavigationButtons from "./NavigationButtons"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import { getAllLevels } from "../../routes/levels"
import { buildLevelHierarchy } from "../../utils/levelHierarchy"
import { designTokens } from "../../constants/designTokens"
import { translateErrorMessage } from "../../utils/errorTranslator"
import {
  isValidEgyptianPhoneNumber,
  normalizeEgyptianPhoneNumber,
  sanitizeEgyptianPhoneInput,
} from "../../utils/phoneNumber"
import { STUDENT_HOBBIES, normalizeStudentHobby } from "../../constants/studentHobbies"
import { mapSignupApiError } from "./signupApiError"
const apiUrl = import.meta.env.VITE_API_URL
const TOKENS = designTokens.colors
const SHADOWS = designTokens.shadows
const GRADIENTS = designTokens.gradients
const hobbiesList = STUDENT_HOBBIES
const PARENT_RELATIONS = ["mother", "father", "other"]

const totalSteps = {
  student: 4,
  parent: 3,
  teacher: 3,
}

export default function StudentRegistration() {
  const { t, i18n } = useTranslation("register")
  const isRTL = i18n.language === "ar"
  const [currentStep, setCurrentStep] = useState(1)
  const navigate = useNavigate()
  const [role, setRole] = useState("student")
  const [formData, setFormData] = useState({
    role: "student",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    phoneNumber2: "",
    gender: "",
    faction: "Alpha",
    stage: "",
    stages: [],
    level: [],
    hobbies: [],
    otherHobbyText: "",
    parentPhoneNumber: "",
    parentPhoneRelation: "",
    parentPhoneNumber2: "",
    parentPhoneRelation2: "",
    hasAdditionalParentPhone: false,
    profession: "",
    children: [""],
    subject: "",
    teachesAtType: "",
    centers: [""],
    school: "",
    socialMedia: [{ platform: "", account: "" }],
    government: "",
    administrationZone: "",
    referralSerial: null,
    profilePic: null,
  })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [gradeLevels, setGradeLevels] = useState([])
  const [levelHierarchy, setLevelHierarchy] = useState({
    levels: [],
    activeLevels: [],
    stages: [],
    grades: [],
    stagesById: {},
    gradesByStageId: {},
    stageOptions: [],
    gradeOptions: [],
  })

  useEffect(() => {
    setErrors({})
    setApiError(null)
  }, [currentStep])

  const getStepErrors = (step) => {
    const errors = {}
    const { role } = formData
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
    const passwordRegex = /^.{8,}$/

    if (step === 1) {
      if (!formData.fullName?.trim()) errors.fullName = "required"
      if (!formData.gender) errors.gender = "required"
      if (!formData.government) errors.government = "required"
      if (!formData.administrationZone) errors.administrationZone = "required"
      if (!formData.phoneNumber) {
        errors.phoneNumber = "required"
      } else if (!isValidEgyptianPhoneNumber(formData.phoneNumber)) {
        errors.phoneNumber = "phoneInvalid"
      }

      if (role === "student" && !formData.stage) {
        errors.stage = "required"
      }

      if (role === "student" && (!formData.level || (Array.isArray(formData.level) && formData.level.length === 0))) {
        errors.level = "required"
      }
    }

    if (step === 2) {
      if (!formData.email) {
        errors.email = "required"
      } else if (!emailRegex.test(formData.email)) {
        errors.email = "emailInvalid"
      }

      if (!formData.password) {
        errors.password = "required"
      } else if (!passwordRegex.test(formData.password)) {
        errors.password = "passwordRequirements"
      }

      if (!formData.confirmPassword) {
        errors.confirmPassword = "required"
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = "passwordsMismatch"
      }

      if (role === "student" && (formData.parentPhoneNumber === null || formData.parentPhoneNumber === "")) {
        errors.parentPhoneNumber = "parentPhoneRequired"
      } else if (role === "student" && !isValidEgyptianPhoneNumber(formData.parentPhoneNumber)) {
        errors.parentPhoneNumber = "phoneInvalid"
      }

      const hasPrimaryParentPhone = Boolean(String(formData.parentPhoneNumber || "").trim())

      if (role === "student" && hasPrimaryParentPhone && !formData.parentPhoneRelation) {
        errors.parentPhoneRelation = "parentRelationRequired"
      } else if (
        role === "student" &&
        hasPrimaryParentPhone &&
        !PARENT_RELATIONS.includes(String(formData.parentPhoneRelation || "").trim().toLowerCase())
      ) {
        errors.parentPhoneRelation = "parentRelationInvalid"
      }

      const hasAdditionalParentPhoneValue = Boolean(String(formData.parentPhoneNumber2 || "").trim())
      const hasAdditionalParentRelationValue = Boolean(String(formData.parentPhoneRelation2 || "").trim())
      const hasAdditionalParentContact =
        role === "student" &&
        Boolean(
          formData.hasAdditionalParentPhone ||
            hasAdditionalParentPhoneValue ||
            hasAdditionalParentRelationValue,
        )

      if (hasAdditionalParentContact) {
        if (!hasAdditionalParentPhoneValue) {
          errors.parentPhoneNumber2 = "additionalParentPhoneRequired"
        } else if (!isValidEgyptianPhoneNumber(formData.parentPhoneNumber2)) {
          errors.parentPhoneNumber2 = "phoneInvalid"
        }

        if (hasAdditionalParentPhoneValue && !formData.parentPhoneRelation2) {
          errors.parentPhoneRelation2 = "additionalParentRelationRequired"
        } else if (
          hasAdditionalParentPhoneValue &&
          !PARENT_RELATIONS.includes(String(formData.parentPhoneRelation2 || "").trim().toLowerCase())
        ) {
          errors.parentPhoneRelation2 = "additionalParentRelationInvalid"
        }
      }

      if (role === "teacher" && formData.phoneNumber2 && !isValidEgyptianPhoneNumber(formData.phoneNumber2)) {
        errors.phoneNumber2 = "phoneInvalid"
      }

      if (role === "parent" && !formData.profession?.trim()) {
        errors.profession = "professionRequired"
      }

      if (role === "parent" && (!formData.stages || formData.stages.length === 0)) {
        errors.stages = "required"
      }


      if (role === "teacher") {
        if (!formData.subject?.trim()) {
          errors.subject = "subjectRequired"
        }

        if (!formData.level || (Array.isArray(formData.level) && formData.level.length === 0)) {
          errors.level = "required"
        }

        if (!formData.teachesAtType) {
          errors.teachesAtType = "required"
        } else {
          if (
            (formData.teachesAtType === "Center" || formData.teachesAtType === "Both") &&
            (!formData.centers || formData.centers.length === 0 || !formData.centers.some((c) => c.trim()))
          ) {
            errors.centers = "required"
          }

          if (
            (formData.teachesAtType === "School" || formData.teachesAtType === "Both") &&
            (!formData.school || !formData.school.trim())
          ) {
            errors.school = "required"
          }
        }

        // Validate social media entries if any are provided
        if (formData.socialMedia && formData.socialMedia.some((s) => s.platform || s.account)) {
          formData.socialMedia.forEach((social, index) => {
            if ((social.platform && !social.account) || (!social.platform && social.account)) {
              errors.socialMedia = {
                ...(errors.socialMedia || {}),
                [index]: {
                  ...(errors.socialMedia?.[index] || {}),
                  platform: !social.platform ? "required" : undefined,
                  account: !social.account ? "required" : undefined,
                },
              }
            }
          })
        }
      }
    }

    if (step === 3 && role === "student" && formData.hobbies.length === 0) {
      errors.hobbies = "hobbiesRequired"
    }

    if (step === 3 && role === "student" && formData.hobbies.includes("other") && !formData.otherHobbyText?.trim()) {
      errors.otherHobbyText = "otherHobbyRequired"
    }
    return errors
  }

  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const response = await getAllLevels()
        if (response.success) {
          const hierarchy = response.hierarchy || buildLevelHierarchy(response.data || [], i18n.language)
          setLevelHierarchy(hierarchy)
          setGradeLevels(hierarchy.gradeOptions || [])
        }
      } catch (error) {
        console.error("Error fetching levels:", error)
      }
    }

    fetchLevels()
  }, [i18n.language])

  const toggleHobby = (hobbyId) => {
    try {
      setFormData((prev) => {
        const isSelected = prev.hobbies.includes(hobbyId)
        const updatedHobbies = isSelected
          ? prev.hobbies.filter((id) => id !== hobbyId)
          : [...prev.hobbies, hobbyId]

        return {
          ...prev,
          hobbies: updatedHobbies,
          otherHobbyText: hobbyId === "other" && isSelected ? "" : prev.otherHobbyText,
        }
      })
      setErrors((prev) => ({ ...prev, hobbies: undefined, otherHobbyText: undefined }))
    } catch (error) {
      console.error("Error toggling hobby:", error)
      setApiError(translateErrorMessage("Failed to update hobby selection"))
    }
  }

  const handleOtherHobbyChange = (value) => {
    setFormData((prev) => ({ ...prev, otherHobbyText: value }))
    setErrors((prev) => ({ ...prev, otherHobbyText: undefined }))
  }
  const handleNext = () => {
    const stepErrors = getStepErrors(currentStep)

    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      setApiError(t("validation.submissionError"))
      return
    }

    if (currentStep < totalSteps[formData.role]) {
      setCurrentStep((prev) => prev + 1)
    } else {
      handleSubmit()
    }
  }

  const handleInputChange = (e) => {
    try {
      const { name, value, type, files } = e.target
      const nextValue = ["phoneNumber", "phoneNumber2", "parentPhoneNumber", "parentPhoneNumber2"].includes(name)
        ? sanitizeEgyptianPhoneInput(value)
        : value

      setFormData((prev) => {
        const resolvedValue = type === "file" ? files[0] : nextValue
        const next = {
          ...prev,
          [name]: resolvedValue,
        }

        if (name === "parentPhoneNumber" && !String(resolvedValue || "").trim()) {
          next.parentPhoneRelation = ""
        }

        if (name === "parentPhoneNumber2" && !String(resolvedValue || "").trim()) {
          next.parentPhoneRelation2 = ""
        }

        return next
      })

      setErrors((prev) => ({ ...prev, [name]: undefined }))
    } catch (error) {
      console.error("Error handling input change:", error)
      setApiError(translateErrorMessage("Failed to process input"));
    }
  }

  const handleAddAdditionalParentPhone = () => {
    setFormData((prev) => ({
      ...prev,
      hasAdditionalParentPhone: true,
    }))
    setErrors((prev) => ({
      ...prev,
      parentPhoneNumber2: undefined,
      parentPhoneRelation2: undefined,
    }))
  }

  const handleRemoveAdditionalParentPhone = () => {
    setFormData((prev) => ({
      ...prev,
      hasAdditionalParentPhone: false,
      parentPhoneNumber2: "",
      parentPhoneRelation2: "",
    }))
    setErrors((prev) => ({
      ...prev,
      parentPhoneNumber2: undefined,
      parentPhoneRelation2: undefined,
    }))
  }


  const handleChildrenChange = (index, value) => {
    try {
      const newChildren = [...formData.children]
      newChildren[index] = value
      setFormData((prev) => ({ ...prev, children: newChildren }))
      setErrors((prev) => ({
        ...prev,
        children: { ...prev.children, [index]: undefined },
      }))
    } catch (error) {
      console.error("Error handling children change:", error)
      setApiError(translateErrorMessage("Failed to update child sequence ID"))
    }
  }

  const handleSubmit = async () => {
    try {
      setApiError(null);
      setErrors({});

      const data = new FormData();

      // Common fields across all roles
      data.append("role", formData.role);
      data.append("name", formData.fullName.trim());
      data.append("email", formData.email.toLowerCase().trim());
      if (formData.referralSerial) {
        data.append("referralSerial", formData.referralSerial)
      }
      data.append("password", formData.password);
      data.append("confirmPassword", formData.confirmPassword);
      data.append("gender", formData.gender);
      const normalizedPhoneNumber = normalizeEgyptianPhoneNumber(formData.phoneNumber)
      if (normalizedPhoneNumber) {
        data.append("phoneNumber", normalizedPhoneNumber)
      }
      data.append("government", formData.government);
      data.append("administrationZone", formData.administrationZone);

      if (formData.profilePic) {
        data.append("profilePic", formData.profilePic);
      }

      // Role-specific fields
      switch (formData.role) {
        case "student":
          if (formData.stage) {
            data.append("stage", formData.stage)
          }

          // Handle level as single value for students
          if (formData.level) {
            if (Array.isArray(formData.level)) {
              formData.level.forEach((levelValue, index) => {
                data.append(`level[${index}]`, levelValue);
              });
            } else {
              data.append("level", formData.level);
            }
          }
          data.append("faction", formData.faction || "Alpha");
          const normalizedParentPhoneNumber = normalizeEgyptianPhoneNumber(formData.parentPhoneNumber)
          if (normalizedParentPhoneNumber) {
            data.append("parentPhoneNumber", normalizedParentPhoneNumber)
          }
          const normalizedParentRelation = String(formData.parentPhoneRelation || "").trim().toLowerCase()
          if (normalizedParentRelation) {
            data.append("parentPhoneRelation", normalizedParentRelation)
          }

          const hasAdditionalParentContact = Boolean(
            formData.hasAdditionalParentPhone ||
              String(formData.parentPhoneNumber2 || "").trim() ||
              String(formData.parentPhoneRelation2 || "").trim(),
          )
          if (hasAdditionalParentContact) {
            const normalizedParentPhoneNumber2 = normalizeEgyptianPhoneNumber(formData.parentPhoneNumber2)
            if (normalizedParentPhoneNumber2) {
              data.append("parentPhoneNumber2", normalizedParentPhoneNumber2)
            }

            const normalizedParentRelation2 = String(formData.parentPhoneRelation2 || "").trim().toLowerCase()
            if (normalizedParentRelation2) {
              data.append("parentPhoneRelation2", normalizedParentRelation2)
            }
          }

          const selectedHobbies = formData.hobbies
            .map((id) => {
              const hobby = hobbiesList.find((h) => h.id === id)
              if (!hobby) return null
              if (hobby.id === "other") return "other"
              return normalizeStudentHobby(hobby.id)
            })
            .filter(Boolean)

          if (selectedHobbies.length > 0) {
            data.append("hobby", selectedHobbies[0])
          }
          break;

        case "parent":
          data.append("profession", formData.profession.trim());
          // Handle stages as array for parents
          if (formData.stages && Array.isArray(formData.stages)) {
            formData.stages.forEach((stageValue, index) => {
              data.append(`stages[${index}]`, stageValue);
            });
          }
          formData.children
            .filter((c) => c.trim() !== "")
            .forEach((child, index) => {
              data.append(`children[${index}]`, child.trim());
            });
          break;

        case "teacher":
          if (formData.phoneNumber2) {
            const normalizedPhoneNumber2 = normalizeEgyptianPhoneNumber(formData.phoneNumber2)
            if (normalizedPhoneNumber2) {
              data.append("phoneNumber2", normalizedPhoneNumber2)
            }
          }
          data.append("subject", formData.subject.trim());
          data.append("teachesAtType", formData.teachesAtType);

          // Handle level as array for teachers
          if (formData.level && Array.isArray(formData.level)) {
            formData.level.forEach((levelValue, index) => {
              data.append(`level[${index}]`, levelValue);
            });
          }

          if (["Center", "Both"].includes(formData.teachesAtType)) {
            formData.centers
              .filter((c) => c.trim() !== "")
              .forEach((center, index) => {
                data.append(`centers[${index}]`, center.trim());
              });
          }

          if (["School", "Both"].includes(formData.teachesAtType)) {
            data.append("school", formData.school.trim());
          }

          formData.socialMedia
            .filter((s) => s.platform && s.account)
            .forEach((social, index) => {
              data.append(`socialMedia[${index}][platform]`, social.platform);
              data.append(`socialMedia[${index}][account]`, social.account.trim());
            });
          break;

        default:
          throw new Error(translateErrorMessage("Invalid role selected"));
      }

      const url = `${apiUrl}/register`;
      const response = await axios.post(url, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      navigate("/login", {
        state: { message: t("registrationSuccess", "Registration successful") },
      });

    } catch (error) {
      const { summaryMessages, fieldErrors } = mapSignupApiError({
        error,
        role: formData.role,
        t,
      })
      const errorMessage = summaryMessages[0] || t("errors.unexpectedError")

      console.error("Full error response:", error.response?.data || error.message);
      setApiError(errorMessage);
      setErrors(fieldErrors);
    }
  };



  const renderStepContent = () => {
    try {
      const { role } = formData

      switch (role) {
        case "student":
          switch (currentStep) {
            case 1:
              return (
                <Step1
                  formData={formData}
                  handleInputChange={handleInputChange}
                  t={t}
                  errors={errors}
                  role={role}
                  levelHierarchy={levelHierarchy}
                />
              )
            case 2:
              return (
                <Step2
                  formData={formData}
                  handleInputChange={handleInputChange}
                  handleAddAdditionalParentPhone={handleAddAdditionalParentPhone}
                  handleRemoveAdditionalParentPhone={handleRemoveAdditionalParentPhone}
                  t={t}
                  errors={errors}
                />
              )
            case 3:
              return (
                <Step3
                  formData={formData}
                  toggleHobby={toggleHobby}
                  handleOtherHobbyChange={handleOtherHobbyChange}
                  t={t}
                  hobbiesList={hobbiesList}
                  errors={errors}
                />
              )
            case 4:
              return <Step4 formData={formData} t={t} hobbiesList={hobbiesList} levelHierarchy={levelHierarchy} />
            default:
              return null
          }
        case "parent":
          switch (currentStep) {
            case 1:
              return (
                <Step1
                  formData={formData}
                  handleInputChange={handleInputChange}
                  t={t}
                  errors={errors}
                  role={role}
                  levelHierarchy={levelHierarchy}
                />
              )
            case 2:
              return (
                <StepParent
                  formData={formData}
                  handleChildrenChange={handleChildrenChange}
                  handleInputChange={handleInputChange}
                  t={t}
                  gradeLevels={gradeLevels}
                  levelHierarchy={levelHierarchy}
                  errors={errors}
                />
              )
            case 3:
              return <Step4 formData={formData} t={t} hobbiesList={hobbiesList} levelHierarchy={levelHierarchy} />
            default:
              return null
          }
        case "teacher":
          switch (currentStep) {
            case 1:
              return (
                <Step1
                  formData={formData}
                  handleInputChange={handleInputChange}
                  t={t}
                  errors={errors}
                  role={role}
                  levelHierarchy={levelHierarchy}
                />
              )
            case 2:
              return (
                <StepTeacher
                  formData={formData}
                  handleInputChange={handleInputChange}
                  t={t}
                  errors={errors}
                  gradeLevels={gradeLevels}
                  levelHierarchy={levelHierarchy}
                />
              )
            case 3:
              return <Step4 formData={formData} t={t} hobbiesList={hobbiesList} levelHierarchy={levelHierarchy} />
            default:
              return null
          }
        default:
          return null
      }
    } catch (error) {
      console.error("Error rendering step content:", error)
      setApiError(translateErrorMessage("Failed to render form content"))
      return null
    }
  }

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole)
    setCurrentStep(1)
    setErrors({})
    setApiError(null)
    setFormData((prev) => ({ ...prev, role: selectedRole }))
  }

  return (
    <div
      className="min-h-screen pt-24 px-3 pb-8 sm:px-6 lg:px-8"
      dir={isRTL ? "rtl" : "ltr"}
      style={{ background: TOKENS.creamSurface }}
    >
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-45" style={{ background: GRADIENTS.pageAtmosphere }} />
      <div className="mx-auto mb-6 flex w-full max-w-6xl items-center justify-between">
        <h1 className="text-xl font-extrabold sm:text-2xl" style={{ color: TOKENS.deepTeal }}>Fekra</h1>
        <p className="text-sm text-base-content/70">
          {t("alreadyHaveAccount", "Already have an account?")} {" "}
          <Link to="/login" className="btn btn-sm btn-ghost rounded-full font-bold text-primary">
            {t("login", "Login")}
          </Link>
        </p>
      </div>

      <div
        className="mx-auto w-full max-w-6xl overflow-hidden rounded-[1.5rem] border bg-base-100"
        style={{
          borderColor: "rgba(17,24,39,0.08)",
          boxShadow: SHADOWS.level2,
        }}
      >
        <div className="grid min-h-[auto] lg:min-h-[760px] lg:grid-cols-[1fr_1.2fr]">
          {/* Left Side - Dynamic: Hero on step 1, Form fields on other steps */}
          <section className="relative overflow-hidden p-6 lg:p-8" style={{ background: GRADIENTS.appPanel }}>
            <div className="absolute -left-12 top-6 h-48 w-48 rounded-full bg-secondary/20 blur-3xl" />
            <div className="absolute bottom-12 right-8 h-44 w-44 rounded-full bg-primary/15 blur-3xl" />

            <div className="relative z-10 h-full flex flex-col">
              {currentStep === 1 ? (
                /* Hero content on first step */
                <>
                  <h2 className="text-4xl font-black leading-[1.04] text-base-content xl:text-5xl">
                    {t("signupHeroStart", "Start your")}
                    <br />
                    <span style={{ color: TOKENS.deepTeal }}>{t("signupHeroMiddle", "learning")}</span>{" "}
                    {t("signupHeroEnd", "journey today.")}
                  </h2>
                  <p className="mt-4 text-base xl:text-lg" style={{ color: TOKENS.slateText }}>
                    {t(
                      "signupHeroSub",
                      "Join thousands of students and educators in a playful, structured learning environment designed for growth.",
                    )}
                  </p>
                </>
              ) : (
                /* Form summary/progress on other steps */
                <div className="flex flex-col h-full">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-base-content">
                      {t("signupProgressTitle", "Creating your account")}
                    </h3>
                    <p className="text-sm mt-2" style={{ color: TOKENS.slateText }}>
                      {t("signupProgressSubtitle", "You're almost there! Complete the remaining steps.")}
                    </p>
                  </div>

                  {/* Step summary cards */}
                  <div className="space-y-3 flex-1">
                    {formData.fullName && (
                      <div className="rounded-xl bg-white/60 p-3 border border-white/40">
                        <p className="text-xs text-slate-500 uppercase tracking-wider">{t("form.fullName")}</p>
                        <p className="text-sm font-semibold text-slate-800">{formData.fullName}</p>
                      </div>
                    )}
                    {formData.email && (
                      <div className="rounded-xl bg-white/60 p-3 border border-white/40">
                        <p className="text-xs text-slate-500 uppercase tracking-wider">{t("form.email")}</p>
                        <p className="text-sm font-semibold text-slate-800">{formData.email}</p>
                      </div>
                    )}
                    {formData.parentPhoneNumber && (
                      <div className="rounded-xl bg-white/60 p-3 border border-white/40">
                        <p className="text-xs text-slate-500 uppercase tracking-wider">{t("form.parentPhone")}</p>
                        <p className="text-sm font-semibold text-slate-800">{formData.parentPhoneNumber}</p>
                      </div>
                    )}
                  </div>

                  {/* Benefits list */}
                  <div className="mt-auto pt-6">
                    <div className="rounded-xl bg-white/40 p-4 border border-white/30">
                      <p className="text-sm font-semibold text-slate-700 mb-3">{t("whyJoin", "Why join Fekra?")}</p>
                      <ul className="space-y-2 text-sm text-slate-600">
                        <li className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-[#0E5563]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {t("benefit1", "Expert-led courses")}
                        </li>
                        <li className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-[#0E5563]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {t("benefit2", "Interactive learning")}
                        </li>
                        <li className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-[#0E5563]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {t("benefit3", "Track your progress")}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Right Side - Form */}
          <section className="flex flex-col p-4 sm:p-6 lg:p-8 bg-base-100">
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Header */}
              <div className="mb-4">
                <h3 className="text-xl font-extrabold text-base-content sm:text-2xl">
                  {currentStep === 1 ? t("createAccount", "Create Account") : t("stepTitle", { step: currentStep })}
                </h3>
                <p className="mt-1 text-sm text-base-content/65">
                  {currentStep === 1 
                    ? t("createAccountSub", "Choose your role and fill in your details.")
                    : t("stepSubtitle", { step: currentStep, total: totalSteps[formData.role] })
                  }
                </p>
              </div>

              {/* Role Selector - Only on step 1 */}
              {currentStep === 1 && (
                <div className="mb-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-base-content/60 mb-2">
                    {t("iAmA", "I am a")}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {["student", "parent", "teacher"].map((itemRole) => (
                      <button
                        key={itemRole}
                        type="button"
                        onClick={() => handleRoleSelect(itemRole)}
                        className={`btn h-11 rounded-xl border-2 text-xs transition-all sm:h-12 sm:text-sm ${
                          formData.role === itemRole
                            ? "btn-primary border-transparent"
                            : "bg-white border-[#0E5563]/30 text-[#0E5563] hover:bg-[#0E5563]/5"
                        }`}
                      >
                        {t(`role.${itemRole}`, itemRole)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {apiError && (
                <div className="alert alert-error mb-4 animate-fade-in" dir={isRTL ? "rtl" : "ltr"}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <h3 className="font-bold text-sm">{t("errors.errorTitle")}</h3>
                        <p className="text-xs">{apiError}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Content - Full height scrollable */}
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {renderStepContent()}
              </div>

              {/* Navigation */}
              <div className="mt-4 pt-4 border-t border-base-200">
                <NavigationButtons
                  currentStep={currentStep}
                  handlePrev={() => setCurrentStep((prev) => prev - 1)}
                  handleNext={handleNext}
                  t={t}
                  isRTL={isRTL}
                  totalSteps={totalSteps}
                  role={formData.role}
                />
              </div>

              <div className="mt-3">
                <StepsIndicator currentStep={currentStep} t={t} role={formData.role} />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
