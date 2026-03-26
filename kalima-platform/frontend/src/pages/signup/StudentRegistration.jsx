"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import Step1 from "./step1"
import Step2 from "./Step2"
import StepParent from "./StepParent"
import StepTeacher from "./StepTeacher"
import Step4 from "./Step4"
import StepsIndicator from "./StepsIndicator"
import NavigationButtons from "./NavigationButtons"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import { getAllLevels } from "../../routes/levels"
import { designTokens } from "../../constants/designTokens"
const apiUrl = import.meta.env.VITE_API_URL
const TOKENS = designTokens.colors
const SHADOWS = designTokens.shadows
const GRADIENTS = designTokens.gradients

const totalSteps = {
  student: 3,
  parent: 3,
  teacher: 3,
}

const normalizeDigitsToEnglish = (value) => {
  const input = String(value || "")
  return input
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
}

const sanitizeParentPhone = (value) => {
  const englishDigits = normalizeDigitsToEnglish(value)
  return englishDigits
    .replace(/[\u200E\u200F\u061C\u202A-\u202E]/g, "")
    .replace(/[\s\-()]/g, "")
    .trim()
}

const isValidEgyptParentPhone = (value) => {
  const normalized = sanitizeParentPhone(value)
  return /^\+20\d{10}$/.test(normalized) || /^0\d{10}$/.test(normalized) || /^\d{10}$/.test(normalized)
}

const normalizeEgyptParentPhone = (value) => {
  const normalized = sanitizeParentPhone(value)
  if (/^\+20\d{10}$/.test(normalized)) return normalized
  if (/^0\d{10}$/.test(normalized)) return `+20${normalized.slice(1)}`
  if (/^\d{10}$/.test(normalized)) return `+20${normalized}`
  return normalized
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
    level: [],
    parentPhoneNumber: "",
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

  useEffect(() => {
    setErrors({})
    setApiError(null)
  }, [currentStep])

  const getStepErrors = (step) => {
    const errors = {}
    const { role } = formData
    const phoneRegex = /^\+?[0-9]\d{7,14}$/
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
    const passwordRegex = /^.{8,}$/

    if (step === 1) {
      if (!formData.fullName?.trim()) errors.fullName = "required"
      if (!formData.gender) errors.gender = "required"
      if (!formData.government) errors.government = "required"
      if (!formData.administrationZone) errors.administrationZone = "required"
      if (!formData.phoneNumber) {
        errors.phoneNumber = "required"
      } else if (!phoneRegex.test(formData.phoneNumber)) {
        errors.phoneNumber = "phoneInvalid"
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
      } else if (role === "student" && !isValidEgyptParentPhone(formData.parentPhoneNumber)) {
        errors.parentPhoneNumber = "phoneInvalid"
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

    return errors
  }

  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const response = await getAllLevels()
        if (response.success) {
          const levels = response.data.map((level) => ({
            value: level._id,
            label: level.displayName || level.name
          }));
          setGradeLevels(levels);
        }
      } catch (error) {
        console.error("Error fetching levels:", error)
      }
    }

    fetchLevels()
  }, [])

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
      const { name, value, type, files } = e.target;
      const nextValue = name === "parentPhoneNumber" ? sanitizeParentPhone(value) : value;

      setFormData((prev) => ({
        ...prev,
        [name]:
          type === "file"
            ? files[0]
            : nextValue,
      }));

      setErrors((prev) => ({ ...prev, [name]: undefined }));
    } catch (error) {
      console.error("Error handling input change:", error);
      setApiError("Failed to process input");
    }
  };


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
      setApiError("Failed to update child sequence ID")
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
      data.append("phoneNumber", formData.phoneNumber);
      data.append("government", formData.government);
      data.append("administrationZone", formData.administrationZone);

      if (formData.profilePic) {
        data.append("profilePic", formData.profilePic);
      }

      // Role-specific fields
      switch (formData.role) {
        case "student":
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
          data.append("parentPhoneNumber", normalizeEgyptParentPhone(formData.parentPhoneNumber));
          break;

        case "parent":
          formData.children
            .filter((c) => c.trim() !== "")
            .forEach((child, index) => {
              data.append(`children[${index}]`, child.trim());
            });
          break;

        case "teacher":
          data.append("phoneNumber2", formData.phoneNumber2);
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
          throw new Error("Invalid role selected");
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
      let errorMessage = t("errors.unexpectedError");
      const fieldErrors = {};

      if (error.response) {
        const { status, data: errorData } = error.response;

        switch (status) {
          case 400:
            errorMessage = errorData.message || t("errors.invalidData");

            if (errorData.message?.includes("phone number")) {
              errorMessage = t("errors.phoneExists");
            }

            if (errorData.message?.includes("at least one special character")) {
              errorMessage = t("errors.PasswordSpecialChar");
            }

            if (errorData.message?.includes("at least one uppercase")) {
              errorMessage = t("errors.PasswordCapitalLetter");
            }

            if (errorData.field) {
              fieldErrors[errorData.field] = errorData.errorKey || "invalidInput";
            }
            break;

          case 409:
            errorMessage = errorData.message || t("errors.emailExists");

            if (errorData.field) {
              fieldErrors[errorData.field] = errorData.errorKey || "duplicate";
            }

            if (errorData.message?.includes("E-Mail")) {
              errorMessage = t("errors.emailExists");
            }
            break;

          case 500:
            errorMessage = t("errors.apiError");
            break;
        }
      } else if (error.request) {
        errorMessage = t("errors.networkError");
      }

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
                  gradeLevels={gradeLevels}
                />
              )
            case 2:
              return <Step2 formData={formData} handleInputChange={handleInputChange} t={t} errors={errors} />
            case 3:
              return <Step4 formData={formData} t={t} gradeLevels={gradeLevels} />
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
                  gradeLevels={gradeLevels}
                  errors={errors}
                />
              )
            case 3:
              return <Step4 formData={formData} t={t} />
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
                  gradeLevels={gradeLevels}
                />
              )
            case 3:
              return <Step4 formData={formData} t={t} gradeLevels={gradeLevels} />
            default:
              return null
          }
        default:
          return null
      }
    } catch (error) {
      console.error("Error rendering step content:", error)
      setApiError("Failed to render form content")
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

              {apiError && (
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
                        <p className="text-sm">{t(apiError)}</p>
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
