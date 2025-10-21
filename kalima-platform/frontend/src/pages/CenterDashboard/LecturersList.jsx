"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Phone, Book } from "lucide-react"
import { getAllSubjects, createSubject } from "../../routes/courses"
import { createLecturer } from "../../routes/center"

const LecturersList = ({ lecturers, isLoading, error, centerId }) => {
  const { t, i18n } = useTranslation("centerDashboard")
  const isRTL = i18n.language === "ar"
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [subjects, setSubjects] = useState([])
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    subjects: [],
    center: centerId,
  })
  const [newSubjectName, setNewSubjectName] = useState("")
  const [formError, setFormError] = useState(null)
  const [formSuccess, setFormSuccess] = useState(null)
  const [loadingSubjects, setLoadingSubjects] = useState(true)

  // Fetch subjects on component mount
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoadingSubjects(true)
      const response = await getAllSubjects()
      if (response.success) {
        setSubjects(response.data)
      } else {
        setFormError(response.error)
      }
      setLoadingSubjects(false)
    }
    fetchSubjects()
  }, [])

  // Filter lecturers based on search term
  const filteredLecturers = lecturers.filter((lecturer) =>
    lecturer.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Handle input changes for lecturer form
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle subject selection from dropdown
  const handleSubjectSelect = (subjectId) => {
    if (formData.subjects.includes(subjectId)) {
      setFormData((prev) => ({
        ...prev,
        subjects: [...prev.subjects, subjectId],
      }))
    }
  }

  // Handle subject removal
  const handleSubjectRemove = (subjectId) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((id) => id !== subjectId),
    }))
  }

  // Handle lecturer form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(null)
    try {
      const response = await createLecturer(formData)
      if (response.success) {
        setFormSuccess(t("lecturersList.lecturerAddedSuccess", "Lecturer added successfully"))
        setFormData({ name: "", phone: "", subjects: [], center: centerId })
        setIsModalOpen(false)
      } else {
        setFormError(response.error || t("lecturersList.lecturerAddedError", "Failed to add lecturer"))
      }
    } catch (err) {
      setFormError(err.message || t("lecturersList.lecturerAddedError", "Failed to add lecturer"))
    }
  }

  // Handle new subject submission
  const handleNewSubjectSubmit = async (e) => {
    e.preventDefault()
    setFormError(null)
    try {
      const response = await createSubject({ name: newSubjectName })
      if (response.success) {
        // Assuming the createSubject returns the new subject in the same format as getAllSubjects
        setSubjects((prev) => [...prev, response.data])
        setNewSubjectName("")
        setFormSuccess(t("lecturersList.subjectAddedSuccess", "Subject added successfully"))
      } else {
        setFormError(response.error || t("lecturersList.subjectAddedError", "Failed to add subject"))
      }
    } catch (err) {
      setFormError(err.message || t("lecturersList.subjectAddedError", "Failed to add subject"))
    }
  }

  return (
    <div className="bg-base-100 rounded-lg shadow-lg p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold">{t("lecturersList.title")}</h2>

        <div className="flex gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder={t("lecturersList.searchPlaceholder")}
              className="input input-bordered w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span
              className={`absolute top-1/2 transform -translate-y-1/2 ${isRTL ? "left-3" : "right-3"} text-base-content/50`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
          </div>

          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            {t("lecturersList.addLecturer")}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="loading loading-spinner loading-md"></div>
        </div>
      ) : error ? (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      ) : filteredLecturers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLecturers.map((lecturer) => (
            <div key={lecturer._id} className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title">{lecturer.name}</h3>

                <div className="flex items-center gap-2 text-base-content/70">
                  <Phone className="w-4 h-4" />
                  <span>{lecturer.phone}</span>
                </div>

                <div className="mt-2">
                  <div className="text-sm font-medium mb-1">{t("lecturersList.subjects")}:</div>
                  <div className="flex flex-wrap gap-2">
                    {lecturer.subjects && lecturer.subjects.length > 0 ? (
                      lecturer.subjects.map((subjectId) => {
                        const subject = subjects.find((s) => s._id === subjectId)
                        return (
                          <div key={subjectId} className="badge badge-primary gap-1">
                            <Book className="w-3 h-3" />
                            {subject ? subject.name : subjectId.substring(0, 8) + "..."}
                          </div>
                        )
                      })
                    ) : (
                      <span className="text-sm text-base-content/50">{t("lecturersList.noSubjects")}</span>
                    )}
                  </div>
                </div>

                <div className="card-actions justify-end mt-4">
                  <button className="btn btn-sm btn-outline">{t("lecturersList.viewDetails")}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-base-content/70">{t("lecturersList.noLecturers")}</div>
      )}

      {/* Modal for Adding Lecturer */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg">
            <h3 className="font-bold text-lg">{t("lecturersList.addLecturer")}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="label">
                  <span className="label-text">{t("lecturersList.lecturerName", "Lecturer Name")}</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  placeholder={t("lecturersList.lecturerNamePlaceholder", "Enter lecturer name")}
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="label">
                  <span className="label-text">{t("lecturersList.lecturerPhone", "Phone Number")}</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  placeholder={t("lecturersList.lecturerPhonePlaceholder", "Enter phone number")}
                  required
                />
              </div>

              {/* Subjects */}
              <div>
                <label className="label">
                  <span className="label-text">{t("lecturersList.lecturerSubjects", "Subjects")}</span>
                </label>
                {loadingSubjects ? (
                  <div className="flex justify-center">
                    <div className="loading loading-spinner loading-md"></div>
                  </div>
                ) : subjects.length > 0 ? (
                  <div>
                    <div className="dropdown">
                      <label tabIndex={0} className="btn btn-bordered w-full text-left">
                        {t("lecturersList.selectSubject", "Select a subject")}
                      </label>
                      <ul
                        tabIndex={0}
                        className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-full max-h-60 overflow-y-auto"
                      >
                        {subjects.map((subject) => (
                          <li key={subject._id}>
                            <button type="button" onClick={() => handleSubjectSelect(subject._id)}>
                              {subject.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.subjects.map((subjectId) => {
                        const subject = subjects.find((s) => s._id === subjectId)
                        return (
                          <div key={subjectId} className="badge badge-primary badge-lg gap-2">
                            {subject?.name || subjectId}
                            <button
                              type="button"
                              onClick={() => handleSubjectRemove(subjectId)}
                              className="text-white hover:text-red-200"
                            >
                              ✕
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-base-content/70">{t("lecturersList.noSubjects", "No subjects available")}</div>
                )}
              </div>

              {/* Add New Subject */}
              <div className="collapse collapse-arrow">
                <input type="checkbox" className="peer" />
                <div className="collapse-title">{t("lecturersList.addNewSubject", "Add New Subject")}</div>
                <div className="collapse-content">
                  <form onSubmit={handleNewSubjectSubmit} className="space-y-2">
                    <input
                      type="text"
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      className="input input-bordered w-full"
                      placeholder={t("lecturersList.newSubjectPlaceholder", "Enter subject name")}
                      required
                    />
                    <button type="submit" className="btn btn-secondary btn-sm w-full">
                      {t("lecturersList.addSubjectButton", "Add Subject")}
                    </button>
                  </form>
                </div>
              </div>

              {/* Error/Success Messages */}
              {formError && <div className="alert alert-error">{formError}</div>}
              {formSuccess && <div className="alert alert-success">{formSuccess}</div>}

              {/* Form Actions */}
              <div className="modal-action">
                <button type="submit" className="btn btn-primary">
                  {t("lecturersList.submitLecturer", "Add Lecturer")}
                </button>
                <button type="button" className="btn" onClick={() => setIsModalOpen(false)}>
                  {t("lecturersList.cancel", "Cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default LecturersList
