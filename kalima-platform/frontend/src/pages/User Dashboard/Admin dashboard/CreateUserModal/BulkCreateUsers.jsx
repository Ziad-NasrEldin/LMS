"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Download } from "lucide-react"
import { bulkCreateUsers } from "../../../../routes/fetch-users"
import DSSelect from "../../../../components/DSSelect"

const BulkCreateUsers = () => {
  const { t, i18n } = useTranslation("createUser")
  const isRTL = i18n.language === "ar"

  const [accountType, setAccountType] = useState("student")
  const [file, setFile] = useState(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const generateCSVTemplate = () => {
    const headers = {
      student: ["name", "phoneNumber", "parentPhoneNumber", "parentPhoneRelation", "stage", "level", "government", "administrationZone", "hobby", "gender", "email", "password"],
      parent: ["name", "phoneNumber", "profession", "government", "administrationZone", "gender", "email", "password"],
      teacher: ["name", "phoneNumber", "phoneNumber2", "subject", "level", "teachesAtType", "school", "government", "administrationZone", "gender", "email", "password"],
    }

    const sampleData = {
      student: [
        ["أحمد محمد", "01012345678", "01112345678", "father", "Primary", "Grade 1", "Cairo", "Nasr City", "football", "male", "ahmed@example.com", "password123"],
        ["فاطمة علي", "01212345678", "01312345678", "mother", "Primary", "Grade 2", "Giza", "Dokki", "reading", "female", "fatima@example.com", "password123"],
      ],
      parent: [
        ["محمد أحمد", "01012345678", "Engineer", "Cairo", "Nasr City", "male", "mohamed@example.com", "password123"],
        ["سارة علي", "01212345678", "Doctor", "Giza", "Dokki", "female", "sara@example.com", "password123"],
      ],
      teacher: [
        ["أحمد محمود", "01012345678", "01112345678", "Math", "Primary,Secondary", "Both", "El-Nasr School", "Cairo", "Nasr City", "male", "teacher@example.com", "password123"],
        ["فاطمة أحمد", "01212345678", "", "Science", "Secondary", "Center", "", "Giza", "Dokki", "female", "teacher2@example.com", "password123"],
      ],
    }

    const csvHeaders = headers[accountType].join(",")
    const csvRows = sampleData[accountType].map((row) => row.join(","))
    const csvContent = [csvHeaders, ...csvRows].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute("download", `template_${accountType}_users.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

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
              <label className="label py-0">
                <span className="label-text font-medium">{t("fields.accountType")}</span>
              </label>
              <DSSelect
                name="accountType"
                className="select w-full rounded-xl"
              style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
                value={accountType}
                onChange={handleAccountTypeChange}
                required
              >
                <option value="student">{t("roles.student")}</option>
                <option value="parent">{t("roles.parent")}</option>
                <option value="teacher">{t("roles.teacher")}</option>
              </DSSelect>
              <label className="label py-0">
                <span className="label-text-alt text-info">{t("help.selectAccountType")}</span>
              </label>
            </div>

            <div className="form-control">
              <button
                type="button"
                onClick={generateCSVTemplate}
                className="btn btn-outline w-full gap-2"
              >
                <Download size={18} />
                {t("buttons.downloadTemplate")}
              </button>
              <label className="label py-0">
                <span className="label-text-alt text-info">{t("help.downloadTemplate")}</span>
              </label>
            </div>

            <div className="form-control">
              <label className="label py-0">
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
              <label className="label py-0">
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
