"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { bulkCreateUsers } from "../../../../routes/fetch-users"

const BulkCreateUsers = () => {
  const { t, i18n } = useTranslation("createUser")
  const isRTL = i18n.language === "ar"

  const [accountType, setAccountType] = useState("student")
  const [file, setFile] = useState(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const handleAccountTypeChange = (e) => {
    setAccountType(e.target.value)
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && selectedFile.type !== "text/csv") {
      setError(t("validation.invalidFileType"))
      setFile(null)
      return
    }
    setError("")
    setFile(selectedFile)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    if (!file) {
      setError(t("validation.fileRequired"))
      setLoading(false)
      return
    }

    try {
      const formData = new FormData()
      // Make sure this matches exactly what your API expects
      formData.append("accountType", accountType)
      formData.append("file", file)

      const result = await bulkCreateUsers(formData)

      if (result.success) {
        setSuccess(t("success.usersCreated"))
        setFile(null)
        // Reset the file input
        document.getElementById("file-input").value = ""
      } else {
        // Handle error message properly
        const errorMessage = typeof result === "string" ? result : result.error || t("errors.failedToCreateUsers")
        setError(errorMessage)
      }
    } catch (err) {
      console.error("Error in form submission:", err)
      setError(t("errors.unexpectedError"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title mb-4">{t("titles.bulkCreate")}</h2>

          {error && (
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
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success mb-4">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">{t("fields.accountType")}</span>
              </label>
              <select
                name="accountType"
                className="select select-bordered w-full"
                value={accountType}
                onChange={handleAccountTypeChange}
                required
              >
                <option value="student">{t("roles.student")}</option>
                <option value="parent">{t("roles.parent")}</option>
                <option value="lecturer">{t("roles.lecturer")}</option>
                <option value="teacher">{t("roles.teacher")}</option>
                <option value="assistant">{t("roles.assistant")}</option>
                <option value="moderator">{t("roles.moderator")}</option>
                <option value="subadmin">{t("roles.subadmin")}</option>
              </select>
              <label className="label">
                <span className="label-text-alt text-info">{t("help.selectAccountType")}</span>
              </label>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">{t("fields.uploadCSV")}</span>
              </label>
              <input
                id="file-input"
                type="file"
                accept=".csv"
                className="file-input file-input-bordered w-full"
                onChange={handleFileChange}
                required
              />
              <label className="label">
                <span className="label-text-alt text-info">{t("help.csvRequiredFields")}</span>
              </label>
            </div>

            <div className="form-control mt-6">
              <button type="submit" className="btn btn-primary w-full" disabled={loading || !file}>
                {loading ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    {t("buttons.uploading")}
                  </>
                ) : (
                  t("buttons.createUsers")
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 bg-base-200 p-4 rounded-lg">
            <h3 className="font-medium mb-2">{t("titles.csvGuidelines")}</h3>
            <p className="text-sm mb-2">{t("help.csvFormat")}</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>{t("csvFields.name")}</li>
              <li>{t("csvFields.phone")}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BulkCreateUsers
