"use client"

import { useTranslation } from "react-i18next"
import { useEffect, useState } from "react"
import { AssistantService } from "../../routes/assistants-services"
import { CreateAssistant, deleteAssistant, updateAssistant } from "../../routes/assistants-services"
import { BookOpen, Plus, X, Edit, Trash2 } from "lucide-react"
import { designTokens } from "../../constants/designTokens"

const TOKENS = designTokens.colors
const SHADOWS = designTokens.shadows
const RADIUS = designTokens.radius

export default function InstructorsList() {
  const { t, i18n } = useTranslation("lecturerDashboard")
  const isRTL = i18n.language === "ar"
  const [assistants, setAssistants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [lecturerId, setLecturerId] = useState(null)
  const [editingAssistant, setEditingAssistant] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [assistantToDelete, setAssistantToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    gender: "male",
    password: "",
    role: "Assistant",
  })
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const myData = await AssistantService.getMyData()
        if (!myData.success) throw new Error(myData.error)

        setLecturerId(myData.data.id)
        const assistantsRes = await AssistantService.getAssistantsByLecturer(myData.data.id)

        if (assistantsRes.success) {
          setAssistants(assistantsRes.data || [])
        } else {
          throw new Error(assistantsRes.error)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.name.trim()) errors.name = t("nameIsRequired")
    if (!formData.email.trim()) {
      errors.email = t("emailIsRequired")
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = t("invalidEmailFormat")
    }
    if (!formData.password) {
      errors.password = t("passwordIsRequired")
    } else if (formData.password.length < 6) {
      errors.password = t("passwordMustBe6Chars")
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const payload = {
        ...formData,
        assignedLecturer: lecturerId,
      }

      const result = await CreateAssistant(payload)

      if (result.success) {
        // Refresh the assistant list
        const assistantsRes = await AssistantService.getAssistantsByLecturer(lecturerId)
        if (assistantsRes.success) {
          setAssistants(assistantsRes.data || [])
        }
        setShowAddModal(false)
        resetForm()
      } else {
        throw new Error(result.error || t("createAssistantError"))
      }
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      gender: "male",
      password: "",
      role: "Assistant",
    })
    setFormErrors({})
  }

  const closeModal = () => {
    setShowAddModal(false)
    setEditingAssistant(null)
    resetForm()
    setSubmitError(null)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteAssistant(assistantToDelete)

      if (result.success) {
        // Refresh the assistant list
        const assistantsRes = await AssistantService.getAssistantsByLecturer(lecturerId)
        if (assistantsRes.success) {
          setAssistants(assistantsRes.data || [])
        }
        setShowDeleteModal(false)
      } else {
        throw new Error(result.error || t("deleteAssistantError"))
      }
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        gender: formData.gender,
        // Don't update password unless changed
      }

      const result = await updateAssistant(editingAssistant, payload)

      if (result.success) {
        // Refresh the assistant list
        const assistantsRes = await AssistantService.getAssistantsByLecturer(lecturerId)
        if (assistantsRes.success) {
          setAssistants(assistantsRes.data || [])
        }
        setShowAddModal(false)
        setEditingAssistant(null)
        resetForm()
      } else {
        throw new Error(result.error || t("updateAssistantError"))
      }
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const startEdit = (assistant) => {
    setEditingAssistant(assistant._id)
    setFormData({
      name: assistant.name,
      email: assistant.email,
      gender: assistant.gender,
      password: "", // Don't pre-fill password
      role: "Assistant",
    })
    setShowAddModal(true)
  }

  const confirmDelete = (assistantId) => {
    setAssistantToDelete(assistantId)
    setShowDeleteModal(true)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="mx-auto w-24 h-24 bg-base-200 rounded-full flex items-center justify-center">
          <BookOpen className="h-12 w-12 text-primary" />
        </div>
        <h3 className="text-xl font-bold">{t("noAssistants")}</h3>
        <button onClick={() => window.location.reload()} className="btn btn-primary">
          {t("tryAgain")}
        </button>
      </div>
    )
  }

  return (
    <div className="p-1 md:p-2 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight" style={{ color: TOKENS.deepTeal }}>
            {t("assistants")}
          </h2>
          <p className="mt-2 text-sm md:text-base" style={{ color: TOKENS.slateText }}>
            {t("assistantsHint")}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn border-none hover:scale-105 transition-transform rounded-full px-6 h-11 min-h-11 gap-2 w-full sm:w-auto"
          style={{ background: TOKENS.deepTeal, color: "#F8FCFF" }}
        >
          <Plus size={18} />
          {t("addAssistant")}
        </button>
      </div>

      {assistants?.length === 0 ? (
        <div
          className="card border bg-white"
          style={{
            borderColor: "rgba(17,24,39,0.08)",
            borderRadius: RADIUS.section,
            boxShadow: SHADOWS.level1,
          }}
        >
          <div className="card-body items-center text-center py-16">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mb-4"
              style={{ background: TOKENS.lightAquaMist }}
            >
              <BookOpen className="text-neutral/40" size={48} />
            </div>
            <p className="text-lg" style={{ color: TOKENS.inkText }}>{t("noAssistants")}</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn border-none rounded-full px-6 mt-6 gap-2 w-full sm:w-auto mx-auto"
              style={{ background: TOKENS.deepTeal, color: "#F8FCFF" }}
            >
              <Plus size={18} />
              {t("addYourFirstAssistant")}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6" dir={isRTL ? "rtl" : "ltr"}>
          {assistants?.map((assistant) => (
            <div
              key={assistant._id}
              className="card border bg-white hover:-translate-y-1 transition-all duration-300 rounded-[2rem] relative"
              style={{
                borderColor: "rgba(17,24,39,0.08)",
                borderRadius: RADIUS.section,
                boxShadow: SHADOWS.level1,
              }}
            >
              <div className={`absolute top-2 z-10 flex gap-2 ${isRTL ? "left-2" : "right-2"}`}>
                <button
                  onClick={() => startEdit(assistant)}
                  className="btn btn-sm btn-circle border-none transition-colors"
                  style={{ background: TOKENS.lightAquaMist, color: TOKENS.deepTeal }}
                  title={t("editAssistant")}
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => confirmDelete(assistant._id)}
                  className="btn btn-sm btn-circle border-none transition-colors"
                  style={{ background: "#FDE8EE", color: "#BE123C" }}
                  title={t("delete")}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="card-body items-center text-center p-6 sm:p-8">
                <div className="avatar mb-3">
                  <div
                    className="w-24 h-24 rounded-full ring-[4px] shadow-lg relative z-10"
                    style={{ background: TOKENS.lightAquaMist, border: "4px solid #fff" }}
                  >
                    {assistant.image ? (
                      <img src={assistant.image || "/placeholder.svg"} alt={assistant.name} className="object-cover w-full h-full" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-2xl font-bold" style={{ color: TOKENS.deepTeal }}>
                        {assistant.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                <h3 className="card-title text-xl font-bold mt-2" style={{ color: TOKENS.inkText }}>{assistant.name}</h3>
                <p className="text-sm font-medium" style={{ color: TOKENS.slateText }}>
                  {assistant.assignedLecturer?.expertise || t("assistantSpecialty")}
                </p>
                <div className="mt-2">
                  <span className={`badge ${assistant.gender === "male" ? "badge-info" : "badge-accent"}`}>
                    {assistant.gender === "male" ? t("male") : t("female")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal modal-open">
          <div className="modal-box w-[92vw] max-w-md">
            <h3 className="font-bold text-lg">{t("confirmDeletion")}</h3>
            <p className="py-4">{t("areYouSureDelete")}</p>
            <div className="modal-action flex-col sm:flex-row">
              <button onClick={() => setShowDeleteModal(false)} className="btn btn-ghost w-full sm:w-auto" disabled={isDeleting}>
                {t("cancel")}
              </button>
              <button onClick={handleDelete} className="btn btn-error w-full sm:w-auto" disabled={isDeleting}>
                {isDeleting ? <span className="loading loading-spinner"></span> : t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Assistant Modal */}
      {showAddModal && (
        <div className="modal modal-open">
          <div className="modal-box relative w-[92vw] max-w-md max-h-[88vh] overflow-y-auto">
            <button onClick={closeModal} className={`btn btn-sm btn-circle absolute top-2 ${isRTL ? "left-2" : "right-2"}`}>
              <X size={18} />
            </button>

            <h3 className="font-bold text-lg mb-4">{editingAssistant ? t("editAssistant") : t("createAssistant")}</h3>

            {submitError && (
              <div className="alert alert-error mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current shrink-0 h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={editingAssistant ? handleEditSubmit : handleSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t("fullName")}*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder={t("enterFullName")}
                  className={`input input-bordered w-full ${formErrors.name ? "input-error" : ""}`}
                />
                {formErrors.name && <span className="label-text-alt text-error mt-1">{formErrors.name}</span>}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t("email")}*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder={t("enterEmailAddress")}
                  className={`input input-bordered w-full ${formErrors.email ? "input-error" : ""}`}
                />
                {formErrors.email && <span className="label-text-alt text-error mt-1">{formErrors.email}</span>}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t("gender")}*</span>
                </label>
                <div className="flex gap-4">
                  <label className="label cursor-pointer gap-2">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={formData.gender === "male"}
                      onChange={handleInputChange}
                      className="radio radio-primary"
                    />
                    <span className="label-text">{t("male")}</span>
                  </label>
                  <label className="label cursor-pointer gap-2">
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={formData.gender === "female"}
                      onChange={handleInputChange}
                      className="radio radio-primary"
                    />
                    <span className="label-text">{t("female")}</span>
                  </label>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t("password")}*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={t("atLeast6Characters")}
                  className={`input input-bordered w-full ${formErrors.password ? "input-error" : ""}`}
                />
                {formErrors.password && <span className="label-text-alt text-error mt-1">{formErrors.password}</span>}
              </div>

              <div className="modal-action">
                <button type="button" onClick={closeModal} className="btn btn-ghost" disabled={isSubmitting}>
                  {t("cancel")}
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="loading loading-spinner"></span>
                  ) : editingAssistant ? (
                    t("editAssistant")
                  ) : (
                    t("createAssistant")
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
