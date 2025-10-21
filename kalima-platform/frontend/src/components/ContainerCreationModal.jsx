"use client"

import { useState, useEffect } from "react"
import { FiX } from "react-icons/fi"
import { getAllLevels } from "../routes/levels"
import { getAllSubjects } from "../routes/courses"

const ContainerCreationModal = ({
  isOpen,
  onClose,
  onSubmit,
  containerId,
  userId,
  containerLevel,
  containerSubject,
  containerType,
}) => {
  // Form state
  const [newItemName, setNewItemName] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newGoal, setNewGoal] = useState("")
  const [newPrice, setNewPrice] = useState(0)
  const [creationLoading, setCreationLoading] = useState(false)
  const [creationError, setCreationError] = useState("")

  // Levels and subjects state
  const [levels, setLevels] = useState([])
  const [subjects, setSubjects] = useState([])
  const [levelsLoading, setLevelsLoading] = useState(false)
  const [subjectsLoading, setSubjectsLoading] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")

  // Fetch levels and subjects when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchLevels()
      fetchSubjects()

      // Set default values from container if available
      if (containerLevel) {
        setSelectedLevel(containerLevel)
      }
      if (containerSubject) {
        setSelectedSubject(containerSubject)
      }
    }
  }, [isOpen, containerLevel, containerSubject])

  // Functions to fetch levels and subjects
  const fetchLevels = async () => {
    try {
      setLevelsLoading(true)
      const response = await getAllLevels()
      if (response.success) {
        setLevels(response.data)
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
    setSelectedLevel(containerLevel || "")
    setSelectedSubject(containerSubject || "")
    setCreationError("")
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCreationLoading(true)
    setCreationError("")

    try {
      const childType = getChildType()
      if (!childType) throw new Error("Invalid container type for creation")
      if (!newItemName) throw new Error("Name is required")
      if (!newDescription) throw new Error("Description is required")
      if (!newGoal) throw new Error("Goal is required")
      if (!selectedLevel) throw new Error("Level is required")
      if (!selectedSubject) throw new Error("Subject is required")

      // Prepare container data
      const containerData = {
        name: newItemName,
        type: childType,
        createdBy: userId,
        level: selectedLevel,
        subject: selectedSubject,
        parent: containerId,
        price: Number(newPrice) || 0,
        description: newDescription,
        goal: newGoal,
        teacherAllowed: true,
      }

      // Call the onSubmit callback with the container data
      await onSubmit(containerData)

      // Reset form and close modal on success
      resetForm()
      onClose()
    } catch (err) {
      setCreationError(err.message)
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
  const creationLabel = childType ? `${childType.charAt(0).toUpperCase() + childType.slice(1)}` : "Container"

  return (
    <div className={`modal ${isOpen && "modal-open"}`}>
      <div className="modal-box max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Create New {creationLabel}</h3>
          <button onClick={handleClose} className="btn btn-sm btn-circle btn-ghost">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-control w-full mb-4">
            <label className="label">
              <span className="label-text">Name</span>
            </label>
            <input
              type="text"
              placeholder={`Enter ${creationLabel} name`}
              className="input input-bordered w-full"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              required
            />
          </div>

          {/* Level dropdown */}
          <div className="form-control w-full mb-4">
            <label className="label">
              <span className="label-text">Level</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              required
            >
              <option value="">Select a level</option>
              {levels.map((level) => (
                <option key={level._id} value={level._id}>
                  {level.name}
                </option>
              ))}
            </select>
            {levelsLoading && <span className="loading loading-spinner mt-2"></span>}
          </div>

          {/* Subject dropdown */}
          <div className="form-control w-full mb-4">
            <label className="label">
              <span className="label-text">Subject</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              required
            >
              <option value="">Select a subject</option>
              {subjects.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.name}
                </option>
              ))}
            </select>
            {subjectsLoading && <span className="loading loading-spinner mt-2"></span>}
          </div>

          <div className="form-control w-full mb-4">
            <label className="label">
              <span className="label-text">Description</span>
            </label>
            <textarea
              placeholder={`Enter ${creationLabel} description`}
              className="textarea textarea-bordered w-full"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              required
            />
          </div>

          <div className="form-control w-full mb-4">
            <label className="label">
              <span className="label-text">Goal</span>
            </label>
            <textarea
              placeholder={`Enter ${creationLabel} goal`}
              className="textarea textarea-bordered w-full"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              required
            />
          </div>

          <div className="form-control w-full mb-4">
            <label className="label">
              <span className="label-text">Price</span>
            </label>
            <input
              type="number"
              placeholder="Enter price"
              className="input input-bordered w-full"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              min="0"
              required
            />
          </div>

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
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={creationLoading}>
              {creationLoading ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ContainerCreationModal
