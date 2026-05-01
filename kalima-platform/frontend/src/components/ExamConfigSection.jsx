"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { getExamConfigs, createExamConfig } from "../routes/examConfigs"
import { translateErrorMessage } from "../utils/errorTranslator"
import DSSelect from "./DSSelect"
import Button from "./ui/Button"
import Input from "./ui/Input"
import Textarea from "./ui/Textarea"

const ExamConfigSection = ({
  requiresExam,
  isEnabled,
  selectedExamConfigId,
  setSelectedExamConfigId,
  passingThreshold,
  setPassingThreshold,
  onExamConfigCreated,
  configType = "exam", // Default to "exam", can be "homework"
}) => {
  const { t } = useTranslation("lecturesPage")
  const fixedMasterSheetId = String(
    import.meta.env.VITE_MASTER_ASSESSMENT_SHEET_ID || ""
  ).trim()
  const hasFixedMasterSheetId = Boolean(fixedMasterSheetId)
  const [examConfigs, setExamConfigs] = useState([])
  const [examConfigsLoading, setExamConfigsLoading] = useState(false)
  const [examConfigsError, setExamConfigsError] = useState("")
  const [isCreatingNewExamConfig, setIsCreatingNewExamConfig] = useState(false)
  const [newExamConfig, setNewExamConfig] = useState({
    name: "",
    type: configType, // Set the type based on the prop
    description: "",
    googleSheetId: fixedMasterSheetId,
    googleSheetTabName: "",
    formUrl: "",
    studentIdentifierColumn: "Email Address",
    scoreColumn: "Score",
    defaultPassingThreshold: 60,
  })

  const isSectionEnabled = isEnabled ?? requiresExam

  useEffect(() => {
    if (isSectionEnabled) {
      fetchExamConfigs()
    }
  }, [isSectionEnabled])

  // Update passing threshold when exam config changes
  useEffect(() => {
    if (selectedExamConfigId && !isCreatingNewExamConfig) {
      const selectedConfig = examConfigs.find((c) => c._id === selectedExamConfigId)
      if (selectedConfig && selectedConfig.defaultPassingThreshold !== passingThreshold) {
        setPassingThreshold(selectedConfig.defaultPassingThreshold)
      }
    }
  }, [selectedExamConfigId, examConfigs, isCreatingNewExamConfig])

  const fetchExamConfigs = async () => {
    setExamConfigsLoading(true)
    setExamConfigsError("")
    try {
      const response = await getExamConfigs()

      if (response.success) {
        const configs = Array.isArray(response.data) ? response.data : []
        // Filter configs by type if configType is "homework"
        const filteredConfigs =
          configType === "homework"
            ? configs.filter((config) => config.type === "homework")
            : configs.filter((config) => config.type !== "homework" || !config.type)

        if (Array.isArray(filteredConfigs) && filteredConfigs.length > 0) {
          setExamConfigs(filteredConfigs)
        } else {
          setExamConfigsError(t("examConfig.noConfigs", `No ${configType} configurations found. Please create a new one.`))
          setExamConfigs([])
        }
      } else {
        console.error(`Failed to fetch ${configType} configs:`, response.message)
        setExamConfigsError(translateErrorMessage(response.message || `Failed to fetch ${configType} configs`))
        setExamConfigs([])
      }
    } catch (err) {
      console.error(`Error fetching ${configType} configs:`, err)
      setExamConfigsError(translateErrorMessage(err.message || `Failed to fetch ${configType} configs`))
      setExamConfigs([])
    } finally {
      setExamConfigsLoading(false)
    }
  }

  const handleCreateExamConfig = async () => {
    try {
      const payload = {
        ...newExamConfig,
        googleSheetId: hasFixedMasterSheetId
          ? fixedMasterSheetId
          : newExamConfig.googleSheetId,
      }

      // Validate required fields for new exam config
      if (
        !payload.name ||
        (!hasFixedMasterSheetId && !payload.googleSheetId) ||
        !payload.formUrl
      ) {
        throw new Error(translateErrorMessage(`Please fill in all required ${configType} configuration fields`))
      }
      const createResponse = await createExamConfig(payload)

      if (!createResponse.success || !createResponse.data?._id) {
        throw new Error(translateErrorMessage(createResponse.message || `Failed to create ${configType} config`))
      }
      const examConfigId = createResponse.data._id

      // Refresh the exam configs list
      await fetchExamConfigs()

      // Set the selected exam config to the newly created one
      setSelectedExamConfigId(examConfigId)
      setIsCreatingNewExamConfig(false)

      // Call the callback with the new exam config ID
      if (onExamConfigCreated) {
        onExamConfigCreated(examConfigId)
      }

      return examConfigId
    } catch (err) {
      setExamConfigsError(translateErrorMessage(err.message))
      console.error(`Error creating ${configType} config:`, err)
      throw err
    }
  }

  // Handle input changes for the new exam config form
  const handleInputChange = (field, value) => {
    const updatedConfig = { ...newExamConfig }
    updatedConfig[field] = field === "defaultPassingThreshold" ? Number(value) : value
    setNewExamConfig(updatedConfig)
  }

  if (!isSectionEnabled) return null

  const hasExistingConfigs = Array.isArray(examConfigs) && examConfigs.length > 0

  return (
    <>
      <div className="form-control w-full mb-4">
        <label className="label">
          <span className="label-text">{t("examConfig.configurationLabel", `${configType.charAt(0).toUpperCase() + configType.slice(1)} Configuration`)}</span>
        </label>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <DSSelect
              className="select select-bordered flex-grow"
              value={isCreatingNewExamConfig ? "new" : selectedExamConfigId}
              onChange={(e) => {
                const value = e.target.value
                if (value === "new") {
                  setIsCreatingNewExamConfig(true)
                  setSelectedExamConfigId("")
                } else {
                  setIsCreatingNewExamConfig(false)
                  setSelectedExamConfigId(value)
                }
              }}
              disabled={examConfigsLoading}
            >
              <option value="">{t("examConfig.selectConfig", `Select ${configType.charAt(0).toUpperCase() + configType.slice(1)} Config`)}</option>
              {hasExistingConfigs ? (
                examConfigs.map((config) => (
                  <option key={config._id} value={config._id}>
                    {config.name} ({config.type || "exam"})
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  {t("examConfig.noExistingConfigs", "No existing configs")}
                </option>
              )}
              <option value="new">{t("examConfig.createNew", `Create New ${configType.charAt(0).toUpperCase() + configType.slice(1)} Config`)}</option>
            </DSSelect>
             {examConfigsLoading && <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />}
          </div>
          {examConfigsError && <div className="text-error text-sm">{examConfigsError}</div>}
          {!hasExistingConfigs && !examConfigsError && !examConfigsLoading && (
            <div className="text-info text-sm">
              {t("examConfig.emptyHelp", `No existing ${configType} configurations found. You can create a new one.`)}
            </div>
          )}
        </div>
      </div>

       {isCreatingNewExamConfig ? (
         <div className="space-y-4 mb-4 p-4 rounded-lg">
           <h4 className="font-medium">{t("examConfig.newConfiguration", `New ${configType.charAt(0).toUpperCase() + configType.slice(1)} Configuration`)}</h4>

           <Input 
             label={t("fields.name", "Name")}
             type="text"
             placeholder={`Enter ${configType} config name`}
             value={newExamConfig.name}
             onChange={(e) => handleInputChange("name", e.target.value)}
             key={`name-input-${configType}`}
             required
           />

          {/* Type selection */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">{t("examConfig.type", "Type")}</span>
            </label>
            <DSSelect
              className="select select-bordered w-full"
              value={newExamConfig.type}
              onChange={(e) => handleInputChange("type", e.target.value)}
              key={`type-select-${configType}`}
              required
            >
              <option value="exam">{t("examConfig.exam", "Exam")}</option>
              <option value="homework">{t("examConfig.homework", "Homework")}</option>
            </DSSelect>
            <label className="label">
              <span className="label-text-alt">{t("examConfig.typeHelp", "Select whether this is for an exam or homework")}</span>
            </label>
          </div>

           <Textarea 
             label={t("fields.description", "Description")}
             placeholder="Enter description"
             value={newExamConfig.description}
             onChange={(e) => handleInputChange("description", e.target.value)}
             key={`description-textarea-${configType}`}
             required
           />

           {hasFixedMasterSheetId ? (
             <Input 
               label={t("examConfig.googleSheetId", "Google Sheet ID")}
               type="text"
               value={fixedMasterSheetId}
               disabled
               readOnly
               helperText={t("examConfig.googleSheetFixedHelp", "Organization master sheet is preconfigured and used automatically.")}
             />
           ) : (
             <Input 
               label={t("examConfig.googleSheetId", "Google Sheet ID")}
               type="text"
               placeholder="Eg : 1Iaosq_KHl7w6__oJB9nFnFr9QYiTDmSSKrWADszUcsM"
               value={newExamConfig.googleSheetId}
               onChange={(e) => handleInputChange("googleSheetId", e.target.value)}
               key={`sheet-id-input-${configType}`}
               required
               helperText={t("examConfig.googleSheetHelp", "The ID from your Google Sheet URL")}
             />
          )}

           <Input 
              label={t("examConfig.googleSheetTabName", "Google Sheet Tab Name")}
              type="text"
              placeholder={t("examConfig.googleSheetTabPlaceholder", "Auto-detected from linked Google Form")}
              value={newExamConfig.googleSheetTabName}
              onChange={(e) => handleInputChange("googleSheetTabName", e.target.value)}
              key={`sheet-tab-input-${configType}`}
              helperText={t("examConfig.googleSheetTabHelp", "Optional override. The system now resolves and stores the real linked response tab.")}
            />

           <Input 
             label={t("examConfig.formUrl", "Form URL")}
             type="url"
             placeholder="Enter Google Form URL"
             value={newExamConfig.formUrl}
             onChange={(e) => handleInputChange("formUrl", e.target.value)}
             key={`form-url-input-${configType}`}
             required
           />

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Input 
               label={t("examConfig.studentIdentifierColumn", "Student Identifier Column")}
               type="text"
               placeholder="Column name"
               value={newExamConfig.studentIdentifierColumn}
               onChange={(e) => handleInputChange("studentIdentifierColumn", e.target.value)}
               key={`student-id-input-${configType}`}
               required
             />
             <Input 
               label={t("examConfig.scoreColumn", "Score Column")}
               type="text"
               placeholder="Column name"
               value={newExamConfig.scoreColumn}
               onChange={(e) => handleInputChange("scoreColumn", e.target.value)}
               key={`score-column-input-${configType}`}
               required
             />
           </div>

           <Input 
             label={t("examConfig.defaultPassingThreshold", "Default Passing Threshold (%)")}
             type="number"
             placeholder={t("examConfig.defaultPassingThresholdPlaceholder", "Enter percentage from 0 to 100")}
             value={newExamConfig.defaultPassingThreshold}
             onChange={(e) => handleInputChange("defaultPassingThreshold", Number(e.target.value))}
             key={`threshold-input-${configType}`}
             helperText={t(
               "examConfig.thresholdHelper",
               "Use a percentage, not raw points. Example: 60 means 60%."
             )}
             min="0"
             max="100"
             required
           />

           <div className="flex justify-end mt-4">
             <Button
               type="button"
               variant="primary"
               onClick={handleCreateExamConfig}
               key={`create-button-${configType}`}
             >
               {t("examConfig.createButton", `Create ${configType.charAt(0).toUpperCase() + configType.slice(1)} Config`)}
             </Button>
           </div>
        </div>
      ) : (
         selectedExamConfigId && (
           <Input 
             label={t("examConfig.passingThreshold", "Passing Threshold (%)")}
             type="number"
             placeholder={t("examConfig.passingThresholdPlaceholder", "Enter percentage from 0 to 100")}
             value={passingThreshold}
             onChange={(e) => setPassingThreshold(Number(e.target.value))}
             helperText={t(
               "examConfig.thresholdHelper",
               "Use a percentage, not raw points. Example: 60 means 60%."
             )}
             min="0"
             max="100"
             required
           />
         )
      )}
    </>
  )
}

export default ExamConfigSection
