"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Download } from "lucide-react"
import { bulkCreateUsers } from "../../../../routes/fetch-users"
import { translateErrorMessage } from "../../../../utils/errorTranslator"
import DSSelect from "../../../../components/DSSelect"
import Button from "../../../../components/ui/Button"

const BulkCreateUsers = () => {
  const { t, i18n } = useTranslation("createUser")
  const isRTL = i18n.language === "ar"

  const [accountType, setAccountType] = useState("student")
  const [file, setFile] = useState(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const generateCSVTemplate = () => {
    // Get translated headers with required field indicators
    const headers = {
      student: [
        t("csvHeaders.student.name"),
        t("csvHeaders.student.phoneNumber"),
        t("csvHeaders.student.parentPhoneNumber"),
        t("csvHeaders.student.parentPhoneRelation"),
        t("csvHeaders.student.stage"),
        t("csvHeaders.student.level"),
        t("csvHeaders.student.government"),
        t("csvHeaders.student.administrationZone"),
        t("csvHeaders.student.hobby"),
        t("csvHeaders.student.gender"),
        t("csvHeaders.student.email"),
        t("csvHeaders.student.password"),
      ],
      parent: [
        t("csvHeaders.parent.name"),
        t("csvHeaders.parent.phoneNumber"),
        t("csvHeaders.parent.profession"),
        t("csvHeaders.parent.government"),
        t("csvHeaders.parent.administrationZone"),
        t("csvHeaders.parent.gender"),
        t("csvHeaders.parent.email"),
        t("csvHeaders.parent.password"),
      ],
      teacher: [
        t("csvHeaders.teacher.name"),
        t("csvHeaders.teacher.phoneNumber"),
        t("csvHeaders.teacher.phoneNumber2"),
        t("csvHeaders.teacher.subject"),
        t("csvHeaders.teacher.level"),
        t("csvHeaders.teacher.teachesAtType"),
        t("csvHeaders.teacher.school"),
        t("csvHeaders.teacher.government"),
        t("csvHeaders.teacher.administrationZone"),
        t("csvHeaders.teacher.gender"),
        t("csvHeaders.teacher.email"),
        t("csvHeaders.teacher.password"),
      ],
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

    // Add UTF-8 BOM for proper Arabic text display in Excel
    const BOM = "\uFEFF"
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })
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
      formData.append("accountType", accountType)
      formData.append("file", file)

      const result = await bulkCreateUsers(formData)

      if (result.success && result.data?.status === "success") {
        const data = result.data
        const createdCount = data.data?.createdUsers?.count || 0
        const duplicateCount = data.data?.duplicatedUsers?.count || 0
        const failedCount = data.data?.failedUsers?.count || 0
        const failedUsers = data.data?.failedUsers?.users || []

        if (failedCount > 0) {
          const errorDetails = failedUsers
            .slice(0, 3)
            .map((u) => `${u.name || u.email}: ${u.error}`)
            .join(" | ")
          
          const fullErrorMsg = t("errors.bulkPartialFailure", {
            created: createdCount,
            failed: failedCount,
            details: errorDetails
          })
          setError(fullErrorMsg)
        } else {
          setSuccess(t("success.usersCreated", { count: createdCount }))
        }
        
        setFile(null)
        document.getElementById("file-input").value = ""
      } else {
        const rawMessage = 
          result?.rawMessage ||
          result?.data?.message ||
          result?.data?.error?.message ||
          result?.error ||
          t("errors.failedToCreateUsers")
        setError(translateErrorMessage(rawMessage, t("errors.failedToCreateUsers")))
      }
    } catch (err) {
      console.error("Error in form submission:", err)
      setError(translateErrorMessage(err, t("errors.unexpectedError")))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className="bg-white shadow-xl rounded-2xl border border-slate-200">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">{t("titles.bulkCreate")}</h2>

           {error && (
        <div className="mb-4 rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-[#991B1B] shadow-sm flex items-center gap-3">
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
              <div className="mb-4 rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-[#065F46] shadow-sm flex items-center gap-3">
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
            <div className="mb-4">
              <label className="block mb-1">
                <span className="text-sm font-medium">{t("fields.accountType")}</span>
              </label>
               <DSSelect
                 name="accountType"
                 className="border border-slate-200 w-full rounded-xl"
              style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
                value={accountType}
                onChange={handleAccountTypeChange}
                required
              >
                <option value="student">{t("roles.student")}</option>
                <option value="parent">{t("roles.parent")}</option>
                <option value="teacher">{t("roles.teacher")}</option>
              </DSSelect>
              <label className="block mt-1">
                <span className="text-xs text-sky-700">{t("help.selectAccountType")}</span>
              </label>
            </div>

            <div className="mb-4">
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={generateCSVTemplate}
              >
                <Download size={18} />
                {t("buttons.downloadTemplate")}
              </Button>
              <label className="block mt-1">
                <span className="text-xs text-sky-700">{t("help.downloadTemplate")}</span>
              </label>
            </div>

            <div className="mb-4">
              <label className="block mb-1">
                <span className="text-sm font-medium">{t("fields.uploadCSV")}</span>
              </label>
              <input
                id="file-input"
                type="file"
                accept=".csv"
                  className="w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                onChange={handleFileChange}
                required
              />
              <label className="block mt-1">
                <span className="text-xs text-sky-700">{t("help.csvRequiredFields")}</span>
              </label>
            </div>

            <div className="mt-6">
              <Button type="submit" variant="primary" className="w-full" disabled={loading || !file}>
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {t("buttons.uploading")}
                  </>
                ) : (
                  t("buttons.createUsers")
                )}
              </Button>
            </div>
          </form>

           <div className="mt-6 bg-slate-100 p-4 rounded-lg">
             <h3 className="font-medium mb-2">{t("titles.csvGuidelines")}</h3>
             <p className="text-sm mb-2 text-info">{t("help.requiredFields")}</p>
             <p className="text-sm mb-2">{t("help.csvFormat")}</p>
             <ul className="list-disc list-inside text-sm space-y-1">
              {accountType === "student" && (
                <>
                  <li className="font-semibold">{t("csvHeaders.student.name")}</li>
                  <li className="font-semibold">{t("csvHeaders.student.phoneNumber")}</li>
                  <li className="font-semibold">{t("csvHeaders.student.parentPhoneNumber")}</li>
                  <li className="font-semibold">{t("csvHeaders.student.parentPhoneRelation")}</li>
                  <li className="font-semibold">{t("csvHeaders.student.stage")}</li>
                  <li className="font-semibold">{t("csvHeaders.student.level")}</li>
                  <li className="font-semibold">{t("csvHeaders.student.gender")}</li>
                  <li className="font-semibold">{t("csvHeaders.student.password")}</li>
                  <li>{t("csvHeaders.student.government")}</li>
                  <li>{t("csvHeaders.student.administrationZone")}</li>
                  <li>{t("csvHeaders.student.hobby")}</li>
                  <li>{t("csvHeaders.student.email")}</li>
                </>
              )}
              {accountType === "parent" && (
                <>
                  <li className="font-semibold">{t("csvHeaders.parent.name")}</li>
                  <li className="font-semibold">{t("csvHeaders.parent.phoneNumber")}</li>
                  <li className="font-semibold">{t("csvHeaders.parent.gender")}</li>
                  <li className="font-semibold">{t("csvHeaders.parent.password")}</li>
                  <li>{t("csvHeaders.parent.profession")}</li>
                  <li>{t("csvHeaders.parent.government")}</li>
                  <li>{t("csvHeaders.parent.administrationZone")}</li>
                  <li>{t("csvHeaders.parent.email")}</li>
                </>
              )}
              {accountType === "teacher" && (
                <>
                  <li className="font-semibold">{t("csvHeaders.teacher.name")}</li>
                  <li className="font-semibold">{t("csvHeaders.teacher.phoneNumber")}</li>
                  <li className="font-semibold">{t("csvHeaders.teacher.subject")}</li>
                  <li className="font-semibold">{t("csvHeaders.teacher.level")}</li>
                  <li className="font-semibold">{t("csvHeaders.teacher.teachesAtType")}</li>
                  <li className="font-semibold">{t("csvHeaders.teacher.gender")}</li>
                  <li className="font-semibold">{t("csvHeaders.teacher.password")}</li>
                  <li>{t("csvHeaders.teacher.phoneNumber2")}</li>
                  <li>{t("csvHeaders.teacher.school")}</li>
                  <li>{t("csvHeaders.teacher.government")}</li>
                  <li>{t("csvHeaders.teacher.administrationZone")}</li>
                  <li>{t("csvHeaders.teacher.email")}</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BulkCreateUsers
