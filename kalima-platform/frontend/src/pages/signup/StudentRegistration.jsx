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
import { designTokens } from "../../constants/designTokens"
import { translateErrorMessage } from "../../utils/errorTranslator"
import { mapSignupApiError } from "./signupApiError"
import {
  isValidEgyptianPhoneNumber,
  normalizeEgyptianPhoneNumber,
  sanitizeEgyptianPhoneInput,
} from "../../utils/phoneNumber"
const apiUrl = import.meta.env.VITE_API_URL
const TOKENS = designTokens.colors
const SHADOWS = designTokens.shadows
const GRADIENTS = designTokens.gradients
const hobbiesList = [
  { id: "math", key: "math", value: "Math" },
  { id: "programming", key: "programming", value: "Programming" },
  { id: "art", key: "art", value: "Handicrafts" },
  { id: "languages", key: "languages", value: "Languages" },
  { id: "photography", key: "photography", value: "Photography" },
  { id: "montage", key: "montage", value: "Montage" },
  { id: "designIllustrating", key: "designIllustrating", value: "Graphic Design" },
  { id: "marketing", key: "marketing", value: "Marketing" },
  { id: "other", key: "other", value: "Other" },
]

const PARENT_RELATIONS = ["mother", "father", "other"]

const normalizeParentRelation = (value) => String(value || "").trim().toLowerCase()

const validateParentContact = ({
  phoneValue,
  relationValue,
  phoneErrorKey,
  relationErrorKey,
  phoneRequiredError,
  relationRequiredError,
  relationInvalidError,
  required,
  errors,
}) => {
  const phone = String(phoneValue || "").trim()
  const relation = normalizeParentRelation(relationValue)
  const hasPhone = phone.length > 0
  const hasRelation = relation.length > 0

  if (!hasPhone) {
    if (required || hasRelation) {
      errors[phoneErrorKey] = phoneRequiredError
    }
    return
  }

  if (!isValidEgyptianPhoneNumber(phoneValue)) {
    errors[phoneErrorKey] = "phoneInvalid"
  }

  if (!hasRelation) {
    errors[relationErrorKey] = relationRequiredError
    return
  }

  if (!PARENT_RELATIONS.includes(relation)) {
    errors[relationErrorKey] = relationInvalidError
  }
}

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
    level: "",
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
  })
  const [errors, setErrors] = useState({})
  const [apiErrors, setApiErrors] = useState([])
  const [levelHierarchy, setLevelHierarchy] = useState({
    levels: [],
    stages: [],
    grades: [],
    gradesByStageId: {},
    stageOptions: [],
    gradeOptions: [],
  })

  useEffect(() => {
    setErrors({})
    setApiErrors([])
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

      if (role === "student" && !formData.level) {
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

      if (role === "teacher" && formData.phoneNumber2 && !isValidEgyptianPhoneNumber(formData.phoneNumber2)) {
        errors.phoneNumber2 = "phoneInvalid"
      }

      if (role === "parent" && !formData.profession?.trim()) {
        errors.profession = "professionRequired"
      }

      if (role === "student") {
        validateParentContact({
          phoneValue: formData.parentPhoneNumber,
          relationValue: formData.parentPhoneRelation,
          phoneErrorKey: "parentPhoneNumber",
          relationErrorKey: "parentPhoneRelation",
          phoneRequiredError: "parentPhoneRequired",
          relationRequiredError: "parentRelationRequired",
          relationInvalidError: "parentRelationInvalid",
          required: true,
          errors,
        })

        const hasSecondaryParentContact =
          formData.hasAdditionalParentPhone ||
          Boolean(String(formData.parentPhoneNumber2 || "").trim()) ||
          Boolean(String(formData.parentPhoneRelation2 || "").trim())

        if (hasSecondaryParentContact) {
          validateParentContact({
            phoneValue: formData.parentPhoneNumber2,
            relationValue: formData.parentPhoneRelation2,
            phoneErrorKey: "parentPhoneNumber2",
            relationErrorKey: "parentPhoneRelation2",
            phoneRequiredError: "additionalParentPhoneRequired",
            relationRequiredError: "additionalParentRelationRequired",
            relationInvalidError: "additionalParentRelationInvalid",
            required: true,
            errors,
          })
        }
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
          setLevelHierarchy(response.hierarchy || {
            levels: response.data || [],
            stages: [],
            grades: [],
            gradesByStageId: {},
            stageOptions: [],
            gradeOptions: [],
          })
        }
      } catch (error) {
        console.error("Error fetching levels:", error)
      }
    }

    fetchLevels()
  }, [])

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
      setApiErrors([translateErrorMessage("Failed to update hobby selection")])
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
      setApiErrors([t("validation.submissionError")])
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
      const { name, value, type, files } = e.target;
      const nextValue = ["phoneNumber", "phoneNumber2", "parentPhoneNumber", "parentPhoneNumber2"].includes(name)
        ? sanitizeEgyptianPhoneInput(value)
        : value;

      setFormData((prev) => ({
        ...prev,
        [name]:
          type === "file"
            ? files[0]
            : nextValue,
        ...(name === "parentPhoneNumber" && !String(nextValue || "").trim()
          ? { parentPhoneRelation: "" }
          : {}),
        ...(name === "parentPhoneNumber2" && !String(nextValue || "").trim()
          ? { parentPhoneRelation2: "" }
          : {}),
      }));

      setErrors((prev) => ({ ...prev, [name]: undefined }));
    } catch (error) {
      console.error("Error handling input change:", error);
      setApiErrors([translateErrorMessage("Failed to process input")]);
    }
  };

  const handleAddAdditionalParentPhone = () => {
    setFormData((prev) => ({ ...prev, hasAdditionalParentPhone: true }))
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
      setApiErrors([translateErrorMessage("Failed to update child sequence ID")])
    }
  }

  const handleSubmit = async () => {
    try {
      setApiErrors([]);
      setErrors({});

      const data = new FormData();

      // Common fields across all roles
      data.append("role", formData.role);
      data.append("name", formData.fullName.trim());
      data.append("email", formData.email.toLowerCase().trim());
      data.append("password", formData.password);
      data.append("confirmPassword", formData.confirmPassword);
      data.append("gender", formData.gender);
      const normalizedPhoneNumber = normalizeEgyptianPhoneNumber(formData.phoneNumber)
      if (normalizedPhoneNumber) {
        data.append("phoneNumber", normalizedPhoneNumber)
      }
      data.append("government", formData.government);
      data.append("administrationZone", formData.administrationZone);

      // Role-specific fields
      switch (formData.role) {
        case "student":
          data.append("stage", formData.stage);
          data.append("level", formData.level);
          data.append("faction", formData.faction || "Alpha");
          const normalizedParentPhoneNumber = normalizeEgyptianPhoneNumber(formData.parentPhoneNumber)
          if (normalizedParentPhoneNumber) {
            data.append("parentPhoneNumber", normalizedParentPhoneNumber)
          }
          if (formData.parentPhoneRelation) {
            data.append("parentPhoneRelation", normalizeParentRelation(formData.parentPhoneRelation))
          }

          const normalizedParentPhoneNumber2 = normalizeEgyptianPhoneNumber(formData.parentPhoneNumber2)
          if (normalizedParentPhoneNumber2) {
            data.append("parentPhoneNumber2", normalizedParentPhoneNumber2)
            if (formData.parentPhoneRelation2) {
              data.append("parentPhoneRelation2", normalizeParentRelation(formData.parentPhoneRelation2))
            }
          }

          const selectedHobbies = formData.hobbies
            .map((id) => {
              const hobby = hobbiesList.find((h) => h.id === id)
              if (!hobby) return null
              if (hobby.id === "other") return "other"
              return String(hobby.id).trim().toLowerCase()
            })
            .filter(Boolean)

          if (selectedHobbies.length > 0) {
            data.append("hobby", selectedHobbies[0])
          }
          break;

        case "parent":
          data.append("profession", formData.profession.trim());
          if (formData.level) {
            data.append("level", formData.level);
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
        state: { message: "Registration successful" },
      });

    } catch (error) {
      const { summaryMessages, fieldErrors, requestId } = mapSignupApiError({
        error,
        role: formData.role,
        t,
      });
      const uiSummary = requestId
        ? [...summaryMessages, `${t("errors.requestId")}: ${requestId}`]
        : summaryMessages;
      console.error("Signup API error payload:", error.response?.data || error.message);
      setApiErrors(uiSummary);
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
                <Step1 formData={formData} handleInputChange={handleInputChange} t={t} errors={errors} role={role} />
              )
            case 2:
              return (
                <StepParent
                  formData={formData}
                  handleChildrenChange={handleChildrenChange}
                  handleInputChange={handleInputChange}
                  t={t}
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
                <Step1 formData={formData} handleInputChange={handleInputChange} t={t} errors={errors} role={role} />
              )
            case 2:
              return (
                <StepTeacher
                  formData={formData}
                  handleInputChange={handleInputChange}
                  t={t}
                  errors={errors}
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
      setApiErrors([translateErrorMessage("Failed to render form content")])
      return null
    }
  }

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole)
    setCurrentStep(1)
    setErrors({})
    setApiErrors([])
    setFormData((prev) => ({
      ...prev,
      role: selectedRole,
      stage: "",
      level: selectedRole === "teacher" ? [] : "",
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
    }))
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
        <div className="grid min-h-[auto] lg:min-h-[760px] lg:grid-cols-[1.1fr_1fr]">
          <section className="relative hidden overflow-hidden p-10 lg:block" style={{ background: GRADIENTS.appPanel }}>
            <div className="absolute -left-12 top-6 h-48 w-48 rounded-full bg-secondary/20 blur-3xl" />
            <div className="absolute bottom-12 right-8 h-44 w-44 rounded-full bg-primary/15 blur-3xl" />

            <div className="relative z-10 mt-10 max-w-xl">
              <h2 className="text-5xl font-black leading-[1.04] text-base-content xl:text-6xl">
                {t("signupHeroStart", "Start your")}
                <br />
                <span style={{ color: TOKENS.deepTeal }}>{t("signupHeroMiddle", "learning")}</span>{" "}
                {t("signupHeroEnd", "journey today.")}
              </h2>
              <p className="mt-6 text-lg xl:text-xl" style={{ color: TOKENS.slateText }}>
                {t(
                  "signupHeroSub",
                  "Join thousands of students and educators in a playful, structured learning environment designed for growth.",
                )}
              </p>

              <div className="mt-12 w-full max-w-md rounded-[1.75rem] border border-base-300 bg-base-100 p-6 shadow-xl">
                  <p className="text-base font-semibold text-base-content">{t("interactiveLessons", "Interactive Lessons")}</p>
                  <div className="mt-4 h-3 rounded-full bg-base-200">
                    <div className="h-full w-3/4 rounded-full bg-primary" />
                  </div>
                  <p className="mt-3 text-sm text-base-content/60">{t("progress", "Progress")}</p>
                </div>

                <div
                  className={`mt-4 hidden w-fit rounded-3xl px-6 py-4 text-base font-bold text-info-content shadow-lg xl:inline-flex ${isRTL ? "me-4" : "ms-4"}`}
                  style={{ background: TOKENS.softCyanTeal }}
                >
                  {t("earnBadges", "Earn badges while you learn!")}
                </div>
            </div>
          </section>

          <section className="flex items-center justify-center p-3 sm:p-6 lg:p-10">
            <div className="w-full max-w-xl rounded-[1.25rem] border bg-base-100 p-4 shadow-xl sm:rounded-[1.75rem] sm:p-8" style={{ borderColor: "rgba(17,24,39,0.08)" }}>
              <h3 className="text-2xl font-extrabold text-base-content sm:text-4xl">
                {t("createAccount", "Create Account")}
              </h3>
              <p className="mt-2 text-base-content/65">
                {t("createAccountSub", "Choose your role and fill in your details.")}
              </p>

              <div className="mt-6 space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-base-content/60">
                  {t("iAmA", "I am a")}
                </p>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {["student", "parent", "teacher"].map((itemRole) => (
                    <button
                      key={itemRole}
                      type="button"
                      onClick={() => handleRoleSelect(itemRole)}
                      className={`btn h-14 rounded-xl border text-xs transition-all sm:h-16 sm:rounded-2xl sm:text-sm ${
                        formData.role === itemRole
                          ? "text-primary-content"
                          : "btn-ghost border-base-300 text-base-content/70"
                      }`}
                      style={
                        formData.role === itemRole
                          ? { background: TOKENS.deepTeal, borderColor: TOKENS.deepTeal }
                          : undefined
                      }
                    >
                      {t(`role.${itemRole}`, itemRole)}
                    </button>
                  ))}
                </div>
              </div>

              {apiErrors.length > 0 && (
                <div className="alert alert-error mt-5 animate-fade-in" dir={isRTL ? "rtl" : "ltr"}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      <div>
                        <h3 className="font-bold">{t("errors.errorTitle")}</h3>
                        <p className="text-sm">{apiErrors[0]}</p>
                        {apiErrors.length > 1 && (
                          <ul className="mt-2 list-disc space-y-1 ps-5 text-sm">
                            {apiErrors.slice(1).map((message) => (
                              <li key={message}>{message}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    {Object.keys(errors).length > 0 && (
                      <div className="mt-4">
                        <ul className="list-disc space-y-1 ps-5">
                          {Object.entries(errors).map(
                            ([field, message]) =>
                              typeof message === "string" && (
                                <li key={field} className="text-sm">
                                  <span className="font-medium">{t(`form.${field}`)}:</span>{" "}
                                  <span className="text-opacity-80">{t(`validation.${message}`)}</span>
                                </li>
                              ),
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-5 max-h-none overflow-visible pe-0 lg:mt-6 lg:max-h-[46vh] lg:overflow-y-auto lg:pe-1 scrollbar-hide">
                {renderStepContent()}
              </div>

              <div className="mt-6">
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

              <div className="mt-4">
                <StepsIndicator currentStep={currentStep} t={t} role={formData.role} />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
