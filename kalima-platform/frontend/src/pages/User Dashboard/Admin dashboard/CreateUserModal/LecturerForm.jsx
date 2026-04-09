"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import DSSelect from "../../../../components/DSSelect"
import Button from "../../../../components/ui/Button"
import Badge from "../../../../components/ui/Badge"
import Input from "../../../../components/ui/Input"
import Textarea from "../../../../components/ui/Textarea"

const LecturerForm = ({ userData, handleChange, subjects, t, fieldErrors = {} }) => {
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
      <div className="mb-4">
        <div className="flex flex-col gap-2">
          <label className="block mb-1">
            <span className="text-sm font-bold" style={{ color: "#1F2937" }}>{t("fields.subjects")}</span>
          </label>
          <div className="flex gap-2">
            <DSSelect
              className="border border-slate-200 w-full rounded-xl"
              style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: fieldErrors.subject ? "#DC2626" : "rgba(17,24,39,0.1)", color: "#1F2937" }}
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
        {fieldErrors.subject && <p className="text-sm text-error mt-2">{fieldErrors.subject}</p>}
        {selectedSubjects.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedSubjects.map((subjectId) => (
              <Badge key={subjectId} variant="secondary" className="gap-1">
                {getSubjectNameById(subjectId)}
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="p-0 h-auto min-w-0"
                  onClick={() => removeSubject(subjectId)}
                >
                  ×
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Profile Picture Upload */}
      <div className="mb-4">
        <div className="flex flex-col gap-2">
          <label className="block mb-1">
            <span className="text-sm font-bold" style={{ color: "#1F2937" }}>{t("fields.profilePic")}</span>
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
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              {t("buttons.chooseFile")}
            </Button>
            <span className="text-sm text-gray-600">
              {userData.profilePic?.name || t("placeholders.noFileSelected")}
            </span>
          </div>
          <Input
            type="text"
            readOnly
            className="w-full rounded-xl"
            variant={fieldErrors.profilePic ? "error" : "default"}
            style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
            value={userData.profilePic?.name || t("placeholders.noFileSelected")}
            error={fieldErrors.profilePic}
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
      <div className="mb-4">
        <div className="flex flex-col gap-2">
          <label className="block mb-1">
            <span className="text-sm font-bold" style={{ color: "#1F2937" }}>{t("fields.bio")}</span>
          </label>
          <Textarea
            name="bio"
            className="w-full rounded-xl"
            style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
            value={userData.bio || ""}
            onChange={handleChange}
            rows="3"
            placeholder={t("placeholders.bio")}
          />
          {fieldErrors.bio && <p className="text-sm text-error">{fieldErrors.bio}</p>}
        </div>
      </div>
      <div className="mb-4">
        <div className="flex flex-col gap-2">
          <label className="block mb-1">
            <span className="text-sm font-bold" style={{ color: "#1F2937" }}>{t("fields.expertise")}</span>
          </label>
          <Input
            type="text"
            name="expertise"
            className="w-full rounded-xl"
            variant={fieldErrors.expertise ? "error" : "default"}
            style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
            value={userData.expertise || ""}
            onChange={handleChange}
            placeholder={t("placeholders.expertise")}
            error={fieldErrors.expertise}
          />
        </div>
      </div>
    </>
  )
}

export default LecturerForm
