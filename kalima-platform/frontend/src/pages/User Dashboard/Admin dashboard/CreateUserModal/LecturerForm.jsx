"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import DSSelect from "../../../../components/DSSelect"

const LecturerForm = ({ userData, handleChange, subjects, t }) => {
  const [selectedSubjects, setSelectedSubjects] = useState(userData.subject || [])
  const fileInputRef = useRef(null)

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

  const profilePreviewUrl = useMemo(() => {
    if (!userData.profilePic) return ""
    return URL.createObjectURL(userData.profilePic)
  }, [userData.profilePic])

  useEffect(() => {
    return () => {
      if (profilePreviewUrl) {
        URL.revokeObjectURL(profilePreviewUrl)
      }
    }
  }, [profilePreviewUrl])

  return (
    <>
      {/* Subjects Selection */}
      <div className="form-control">
        <div className="flex flex-col gap-2">
          <label className="label py-0">
            <span className="label-text font-bold" style={{ color: "#1F2937" }}>{t("fields.subjects")}</span>
          </label>
          <div className="flex gap-2">
            <DSSelect
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
            </DSSelect>
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
        <div className="flex flex-col gap-2">
          <label className="label py-0">
            <span className="label-text font-bold" style={{ color: "#1F2937" }}>{t("fields.profilePic")}</span>
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                handleChange({ target: { name: "profilePic", value: file } })
              }
            }}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => fileInputRef.current?.click()}
            >
              {t("buttons.chooseFile")}
            </button>
            <span className="text-sm text-gray-600">
              {userData.profilePic?.name || t("placeholders.noFileSelected")}
            </span>
          </div>
          <input
            type="text"
            readOnly
            className="input w-full rounded-xl"
            style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
            value={userData.profilePic?.name || t("placeholders.noFileSelected")}
          />
        </div>

        {userData.profilePic && (
          <div className="mt-2">
            <img
              src={profilePreviewUrl || "/placeholder.svg"}
              alt="Profile Preview"
              className="w-24 h-24 object-cover rounded-full border"
            />
          </div>
        )}
      </div>

      {/* Bio */}
      <div className="form-control">
        <div className="flex flex-col gap-2">
          <label className="label py-0">
            <span className="label-text font-bold" style={{ color: "#1F2937" }}>{t("fields.bio")}</span>
          </label>
          <textarea
            name="bio"
            className="textarea w-full rounded-xl"
              style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
            value={userData.bio || ""}
            onChange={handleChange}
            rows="3"
            placeholder={t("placeholders.bio")}
          ></textarea>
        </div>
      </div>

      {/* Expertise */}
      <div className="form-control">
        <div className="flex flex-col gap-2">
          <label className="label py-0">
            <span className="label-text font-bold" style={{ color: "#1F2937" }}>{t("fields.expertise")}</span>
          </label>
          <input
            type="text"
            name="expertise"
            className="input w-full rounded-xl"
              style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
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
