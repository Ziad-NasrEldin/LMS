"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { FiX } from "react-icons/fi"
import toast from "react-hot-toast"
import { getAllLevels } from "../routes/levels"
import { getAllSubjects } from "../routes/courses"
import { translateErrorMessage } from "../utils/errorTranslator"
import { buildContainerPayloadObject } from "../utils/contentCreationPayloads"
import { buildLevelHierarchy } from "../utils/levelHierarchy"
import DSSelect from "./DSSelect"

const ContainerCreationModal = ({
  isOpen,
  onClose,
  onSubmit,
  containerId,
  userId,
  containerLevel,
  containerSubject,
  containerType,
  mode = "create",
  initialData = null,
}) => {
  const { t } = useTranslation("common")
  const isEditMode = mode === "edit"

  // Form state
  const [newItemName, setNewItemName] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newGoal, setNewGoal] = useState("")
  const [newPrice, setNewPrice] = useState(0)
  const [sameGradeOnly, setSameGradeOnly] = useState(false)
  const [creationLoading, setCreationLoading] = useState(false)
  const [creationError, setCreationError] = useState("")

  // Levels and subjects state
  const [levels, setLevels] = useState([])
  const [subjects, setSubjects] = useState([])
  const [levelsLoading, setLevelsLoading] = useState(false)
  const [subjectsLoading, setSubjectsLoading] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")

  const populateFromInitialData = () => {
    if (!initialData) {
      return
    }

    setNewItemName(initialData.name || "")
    setNewDescription(initialData.description || "")
    setNewGoal(Array.isArray(initialData.goal) ? initialData.goal.join("\n") : initialData.goal || "")
    setNewPrice(initialData.price ?? 0)
    setSameGradeOnly(initialData.sameGradeOnly ?? false)
    setSelectedLevel(initialData.level?._id || initialData.level || containerLevel || "")
    setSelectedSubject(initialData.subject?._id || initialData.subject || containerSubject || "")
  }

  // Fetch levels and subjects when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchLevels()
      fetchSubjects()

      if (isEditMode) {
        populateFromInitialData()
      } else {
        // Set default values from container if available
        if (containerLevel) {
          setSelectedLevel(containerLevel)
        }
        if (containerSubject) {
          setSelectedSubject(containerSubject)
        }
      }
    }
  }, [isOpen, containerLevel, containerSubject, isEditMode, initialData])

  // Functions to fetch levels and subjects
  const fetchLevels = async () => {
    try {
      setLevelsLoading(true)
      const response = await getAllLevels()
      if (response.success) {
        const locale = (localStorage.getItem("i18nextLng") || "en").toLowerCase()
        const hierarchy = response.hierarchy || buildLevelHierarchy(response.data || [], locale)
        setLevels(hierarchy.gradeOptions || [])
      } else {
        console.error("Failed to fetch levels:", response.error)
      }
    } catch (error) {
      console.error("Error fetching levels:", error)
    } finally {
      setLevelsLoading(false)
    }
  }

  const fetchSubjects = async () => {
    try {
      setSubjectsLoading(true)
      const response = await getAllSubjects()
      if (response.success) {
        setSubjects(response.data)
      } else {
        console.error("Failed to fetch subjects:", response.error)
      }
    } catch (error) {
      console.error("Error fetching subjects:", error)
    } finally {
      setSubjectsLoading(false)
    }
  }

  // Reset form function
  const resetForm = () => {
    setNewItemName("")
    setNewDescription("")
    setNewGoal("")
    setNewPrice(0)
    setSameGradeOnly(false)
    setSelectedLevel(containerLevel || "")
    setSelectedSubject(containerSubject || "")
    setCreationError("")
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCreationLoading(true)
    setCreationError("")

    try {
      const childType = getChildType()
      const nextType = isEditMode ? (initialData?.type || containerType || childType) : childType
      if (!isEditMode && !childType) throw new Error(translateErrorMessage("Invalid container type for creation"))
      if (!newItemName) throw new Error(translateErrorMessage(t("errors.fieldRequired", { field: t("fields.name") })))
      if (!selectedLevel) throw new Error(translateErrorMessage(t("errors.fieldRequired", { field: t("fields.level") })))
      if (!selectedSubject) throw new Error(translateErrorMessage(t("errors.fieldRequired", { field: t("fields.subject") })))

      if (!nextType) throw new Error(translateErrorMessage("Invalid container type for creation"))
      const isCourseType = nextType === "course"

      if (isCourseType && !newDescription) throw new Error(translateErrorMessage(t("errors.fieldRequired", { field: t("fields.description") })))
      if (isCourseType && !newGoal) throw new Error(translateErrorMessage(t("errors.fieldRequired", { field: t("fields.goal") })))

      // Prepare container data
      const containerData = buildContainerPayloadObject({
        name: newItemName,
        type: nextType,
        level: selectedLevel,
        subject: selectedSubject,
        price: Number(newPrice) || 0,
        description: isCourseType ? newDescription : undefined,
        goal: isCourseType ? newGoal : undefined,
        teacherAllowed: initialData?.teacherAllowed ?? true,
        sameGradeOnly: isCourseType ? sameGradeOnly : false,
        createdBy: isEditMode ? undefined : userId,
        parent: isEditMode ? undefined : containerId,
      })

      // Call the onSubmit callback with the container data
      if (isEditMode) {
        await onSubmit(containerId, containerData)
        toast.success(t("containerModal.editSuccess"))
      } else {
        await onSubmit(containerData)
        toast.success(t("containerModal.createSuccess"))
      }

      // Reset form and close modal on success
      resetForm()
      onClose()
    } catch (err) {
      setCreationError(translateErrorMessage(err.message))
      console.error("Creation error:", err)
    } finally {
      setCreationLoading(false)
    }
  }

  // Helper function to determine the child type based on container type
  const getChildType = () => {
    if (!containerType) return null

    switch (containerType.toLowerCase()) {
      case "course":
        return "year"
      case "year":
        return "term"
      case "term":
        return "month"
      default:
        return null
    }
  }

  const childType = getChildType()
  const isCourseType = (isEditMode ? initialData?.type || containerType : childType) === "course"
  const modalLabel = isEditMode
    ? (initialData?.type ? t(`containerModal.types.${initialData.type}`) : t("containerModal.types.container"))
    : (childType ? t(`containerModal.types.${childType}`) : t("containerModal.types.container"))

  return (
    <div className={`modal ${isOpen && "modal-open"}`} onClick={handleBackdropClick}>
      <div className="modal-box max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">{isEditMode ? t("containerModal.editTitle", { type: modalLabel }) : t("containerModal.createTitle", { type: modalLabel })}</h3>
          <button onClick={handleClose} className="btn btn-sm btn-circle btn-ghost">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-control w-full mb-4">
            <label className="label">
              <span className="label-text">{t("fields.name")}</span>
            </label>
            <input
              type="text"
              placeholder={t("containerModal.enterName", { type: modalLabel })}
              className="input input-bordered w-full"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              required
            />
          </div>

          {/* Level dropdown */}
          <div className="form-control w-full mb-4">
            <label className="label">
              <span className="label-text">{t("fields.level")}</span>
            </label>
            <DSSelect
              className="select select-bordered w-full"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              required
            >
              <option value="">{t("containerModal.selectLevel")}</option>
              {levels.map((level) => (
                <option key={level.value || level._id} value={level.value || level._id}>
                  {level.label || level.displayName || level.name}
                </option>
              ))}
            </DSSelect>
            {levelsLoading && <span className="loading loading-spinner mt-2"></span>}
          </div>

          {/* Subject dropdown */}
          <div className="form-control w-full mb-4">
            <label className="label">
              <span className="label-text">{t("fields.subject")}</span>
            </label>
            <DSSelect
              className="select select-bordered w-full"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              required
            >
              <option value="">{t("containerModal.selectSubject")}</option>
              {subjects.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.name}
                </option>
              ))}
            </DSSelect>
            {subjectsLoading && <span className="loading loading-spinner mt-2"></span>}
          </div>

          {isCourseType && (
            <>
              <div className="form-control w-full mb-4">
                <label className="label">
                  <span className="label-text">{t("fields.description")}</span>
                </label>
                <textarea
                  placeholder={t("containerModal.enterDescription", { type: modalLabel })}
                  className="textarea textarea-bordered w-full"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  required
                />
              </div>

              <div className="form-control w-full mb-4">
                <label className="label">
                  <span className="label-text">{t("fields.goal")}</span>
                </label>
                <textarea
                  placeholder={t("containerModal.enterGoal", { type: modalLabel })}
                  className="textarea textarea-bordered w-full"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div className="form-control w-full mb-4">
            <label className="label">
              <span className="label-text">{t("fields.price")}</span>
            </label>
            <input
              type="number"
              placeholder={t("containerModal.enterPrice")}
              className="input input-bordered w-full"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              min="0"
              required
            />
          </div>

          {isCourseType && (
            <div className="form-control w-full mb-4">
              <label className="label cursor-pointer justify-start gap-3 items-start p-0">
                <input
                  type="checkbox"
                  className="toggle toggle-primary mt-0.5"
                  checked={sameGradeOnly}
                  onChange={(e) => setSameGradeOnly(e.target.checked)}
                />
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="label-text font-medium">{t("containerModal.sameGradeOnly")}</span>
                  <span className="label-text-alt text-base-content/60 whitespace-normal">{t("containerModal.sameGradeOnlyHelp")}</span>
                </div>
              </label>
            </div>
          )}

          {creationError && (
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
              <span>{creationError}</span>
            </div>
          )}

          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={handleClose} disabled={creationLoading}>
              {t("containerModal.cancel")}
            </button>
            <button type="submit" className="btn btn-primary" disabled={creationLoading}>
              {creationLoading ? (
                <>
                  <span className="loading loading-spinner"></span>
                  {isEditMode ? t("containerModal.saving") : t("containerModal.creating")}
                </>
              ) : (
                isEditMode ? t("containerModal.saveChanges") : t("containerModal.create")
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ContainerCreationModal
