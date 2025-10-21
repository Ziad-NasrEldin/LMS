"use client"

import { useState } from "react"

const LecturerForm = ({ userData, handleChange, subjects, t }) => {
  const [selectedSubjects, setSelectedSubjects] = useState(userData.subject || [])

  const handleSubjectSelect = (e) => {
    const subjectId = e.target.value
    if (!subjectId) return

    if (!selectedSubjects.includes(subjectId)) {
      const newSubjects = [...selectedSubjects, subjectId]
      setSelectedSubjects(newSubjects)

      // Always update as array
      handleChange({ target: { name: "subject", value: newSubjects } })
    }
  }

  const removeSubject = (subjectId) => {
    const newSubjects = selectedSubjects.filter((id) => id !== subjectId)
    setSelectedSubjects(newSubjects)

    // Always update as array
    handleChange({ target: { name: "subject", value: newSubjects } })
  }

  const getSubjectNameById = (id) => {
    const subject = subjects.find((s) => s._id === id)
    return subject ? subject.name : id
  }

  return (
    <>
      {/* Subjects Selection */}
      <div className="form-control">
        <div className="flex flex-col gap-4">
          <label className="label">
            <span className="label-text">{t("fields.subjects")}</span>
          </label>
          <div className="flex gap-2">
            <select
              className="select select-bordered flex-1"
              onChange={handleSubjectSelect}
              value=""
            >
              <option value="">{t("placeholders.selectSubject")}</option>
              {subjects.map((subject) => (
                <option
                  key={subject._id}
                  value={subject._id}
                  disabled={selectedSubjects.includes(subject._id)}
                >
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedSubjects.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedSubjects.map((subjectId) => (
              <div key={subjectId} className="badge badge-secondary gap-1">
                {getSubjectNameById(subjectId)}
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => removeSubject(subjectId)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile Picture Upload */}
      <div className="form-control">
        <div className="flex flex-col gap-4">
          <label className="label">
            <span className="label-text">{t("fields.profilePicture")}</span>
          </label>
          <input
            type="file"
            accept="image/*"
            className="file-input file-input-bordered"
            onChange={(e) => {
              const file = e.target.files[0]
              if (file) {
                handleChange({ target: { name: "profilePic", value: file } })
              }
            }}
          />
        </div>

        {userData.profilePic && (
          <div className="mt-2">
            <img
              src={URL.createObjectURL(userData.profilePic) || "/placeholder.svg"}
              alt="Profile Preview"
              className="w-24 h-24 object-cover rounded-full border"
            />
          </div>
        )}
      </div>

      {/* Bio */}
      <div className="form-control">
        <div className="flex flex-col gap-4">
          <label className="label">
            <span className="label-text">{t("fields.bio")}</span>
          </label>
          <textarea
            name="bio"
            className="textarea textarea-bordered"
            value={userData.bio || ""}
            onChange={handleChange}
            rows="3"
            placeholder={t("placeholders.bio")}
          ></textarea>
        </div>
      </div>

      {/* Expertise */}
      <div className="form-control">
        <div className="flex flex-col gap-4">
          <label className="label">
            <span className="label-text">{t("fields.expertise")}</span>
          </label>
          <input
            type="text"
            name="expertise"
            className="input input-bordered"
            value={userData.expertise || ""}
            onChange={handleChange}
            placeholder={t("placeholders.expertise")}
          />
        </div>
      </div>
    </>
  )
}

export default LecturerForm
