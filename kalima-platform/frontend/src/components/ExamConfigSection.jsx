"use client"

import { useState, useEffect } from "react"
import { getExamConfigs, createExamConfig } from "../routes/examConfigs"

const ExamConfigSection = ({
  requiresExam,
  selectedExamConfigId,
  setSelectedExamConfigId,
  passingThreshold,
  setPassingThreshold,
  onExamConfigCreated,
  configType = "exam", // Default to "exam", can be "homework"
}) => {
  const [examConfigs, setExamConfigs] = useState([])
  const [examConfigsLoading, setExamConfigsLoading] = useState(false)
  const [examConfigsError, setExamConfigsError] = useState("")
  const [isCreatingNewExamConfig, setIsCreatingNewExamConfig] = useState(false)
  const [newExamConfig, setNewExamConfig] = useState({
    name: "",
    type: configType, // Set the type based on the prop
    description: "",
    googleSheetId: "",
    formUrl: "",
    studentIdentifierColumn: "Email Address",
    scoreColumn: "Score",
    defaultPassingThreshold: 5,
  })

  useEffect(() => {
    if (requiresExam) {
      fetchExamConfigs()
    }
  }, [requiresExam])

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

      if (response.success && response.data) {
        // Try to extract exam configs from different possible response structures
        const configs =
          (response.data.data && response.data.data.examConfigs) || // Format: { data: { data: { examConfigs: [...] } } }
          response.data.examConfigs || // Format: { data: { examConfigs: [...] } }
          (Array.isArray(response.data) ? response.data : []) // Format: { data: [...] }

        // Filter configs by type if configType is "homework"
        const filteredConfigs =
          configType === "homework"
            ? configs.filter((config) => config.type === "homework")
            : configs.filter((config) => config.type !== "homework" || !config.type)

        if (Array.isArray(filteredConfigs) && filteredConfigs.length > 0) {
          setExamConfigs(filteredConfigs)
        } else {
          setExamConfigsError(`No ${configType} configurations found. Please create a new one.`)
          setExamConfigs([])
        }
      } else {
        console.error(`Failed to fetch ${configType} configs:`, response.message)
        setExamConfigsError(response.message || `Failed to fetch ${configType} configs`)
        setExamConfigs([])
      }
    } catch (err) {
      console.error(`Error fetching ${configType} configs:`, err)
      setExamConfigsError(err.message || `Failed to fetch ${configType} configs`)
      setExamConfigs([])
    } finally {
      setExamConfigsLoading(false)
    }
  }

  const handleCreateExamConfig = async () => {
    try {
      // Validate required fields for new exam config
      if (!newExamConfig.name || !newExamConfig.googleSheetId || !newExamConfig.formUrl) {
        throw new Error(`Please fill in all required ${configType} configuration fields`)
      }
      const createResponse = await createExamConfig(newExamConfig)

      // Extract the exam config ID from different response formats
      let examConfigId = null
      if (createResponse.success === true && createResponse.data) {
        if (createResponse.data._id) {
          examConfigId = createResponse.data._id
        } else if (
          createResponse.data.data &&
          createResponse.data.data.examConfig &&
          createResponse.data.data.examConfig._id
        ) {
          examConfigId = createResponse.data.data.examConfig._id
        } else if (createResponse.data.examConfig && createResponse.data.examConfig._id) {
          examConfigId = createResponse.data.examConfig._id
        } else {
          throw new Error("Failed to extract exam config ID from response")
        }
      } else if (createResponse.status === "success" && createResponse.data && createResponse.data._id) {
        examConfigId = createResponse.data._id
      } else {
        throw new Error(createResponse.message || `Failed to create ${configType} config`)
      }

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
      setExamConfigsError(err.message)
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

  if (!requiresExam) return null

  const hasExistingConfigs = Array.isArray(examConfigs) && examConfigs.length > 0

  return (
    <>
      <div className="form-control w-full mb-4">
        <label className="label">
          <span className="label-text">{configType.charAt(0).toUpperCase() + configType.slice(1)} Configuration</span>
        </label>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <select
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
              <option value="">Select {configType.charAt(0).toUpperCase() + configType.slice(1)} Config</option>
              {hasExistingConfigs ? (
                examConfigs.map((config) => (
                  <option key={config._id} value={config._id}>
                    {config.name} ({config.type || "exam"})
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  No existing configs
                </option>
              )}
              <option value="new">Create New {configType.charAt(0).toUpperCase() + configType.slice(1)} Config</option>
            </select>
            {examConfigsLoading && <span className="loading loading-spinner"></span>}
          </div>
          {examConfigsError && <div className="text-error text-sm">{examConfigsError}</div>}
          {!hasExistingConfigs && !examConfigsError && !examConfigsLoading && (
            <div className="text-info text-sm">
              No existing {configType} configurations found. You can create a new one.
            </div>
          )}
        </div>
      </div>

      {isCreatingNewExamConfig ? (
        <div className="space-y-4 mb-4 p-4 border border-base-300 rounded-lg">
          <h4 className="font-medium">New {configType.charAt(0).toUpperCase() + configType.slice(1)} Configuration</h4>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Name</span>
            </label>
            <input
              type="text"
              placeholder={`Enter ${configType} config name`}
              className="input input-bordered w-full"
              value={newExamConfig.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              key={`name-input-${configType}`}
              required
            />
          </div>

          {/* Type selection */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Type</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={newExamConfig.type}
              onChange={(e) => handleInputChange("type", e.target.value)}
              key={`type-select-${configType}`}
              required
            >
              <option value="exam">Exam</option>
              <option value="homework">Homework</option>
            </select>
            <label className="label">
              <span className="label-text-alt">Select whether this is for an exam or homework</span>
            </label>
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Description</span>
            </label>
            <textarea
              placeholder="Enter description"
              className="textarea textarea-bordered w-full"
              value={newExamConfig.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              key={`description-textarea-${configType}`}
              required
            />
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Google Sheet ID</span>
            </label>
            <input
              type="text"
              placeholder="Eg : 1Iaosq_KHl7w6__oJB9nFnFr9QYiTDmSSKrWADszUcsM"
              className="input input-bordered w-full"
              value={newExamConfig.googleSheetId}
              onChange={(e) => handleInputChange("googleSheetId", e.target.value)}
              key={`sheet-id-input-${configType}`}
              required
            />
            <label className="label">
              <span className="label-text-alt">The ID from your Google Sheet URL</span>
            </label>
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Form URL</span>
            </label>
            <input
              type="url"
              placeholder="Enter Google Form URL"
              className="input input-bordered w-full"
              value={newExamConfig.formUrl}
              onChange={(e) => handleInputChange("formUrl", e.target.value)}
              key={`form-url-input-${configType}`}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Student Identifier Column</span>
              </label>
              <input
                type="text"
                placeholder="Column name"
                className="input input-bordered w-full"
                value={newExamConfig.studentIdentifierColumn}
                onChange={(e) => handleInputChange("studentIdentifierColumn", e.target.value)}
                key={`student-id-input-${configType}`}
                required
              />
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Score Column</span>
              </label>
              <input
                type="text"
                placeholder="Column name"
                className="input input-bordered w-full"
                value={newExamConfig.scoreColumn}
                onChange={(e) => handleInputChange("scoreColumn", e.target.value)}
                key={`score-column-input-${configType}`}
                required
              />
            </div>
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Default Passing Threshold (%)</span>
            </label>
            <input
              type="number"
              placeholder="Enter threshold"
              className="input input-bordered w-full"
              value={newExamConfig.defaultPassingThreshold}
              onChange={(e) => handleInputChange("defaultPassingThreshold", Number(e.target.value))}
              key={`threshold-input-${configType}`}
              min="0"
              max="100"
              required
            />
          </div>

          <div className="flex justify-end mt-4">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCreateExamConfig}
              key={`create-button-${configType}`}
            >
              Create {configType.charAt(0).toUpperCase() + configType.slice(1)} Config
            </button>
          </div>
        </div>
      ) : (
        selectedExamConfigId && (
          <div className="form-control w-full mb-4">
            <label className="label">
              <span className="label-text">Passing Threshold</span>
            </label>
            <input
              type="number"
              placeholder="Enter passing threshold"
              className="input input-bordered w-full"
              value={passingThreshold}
              onChange={(e) => setPassingThreshold(Number(e.target.value))}
              min="0"
              max="100"
              required
            />
          </div>
        )
      )}
    </>
  )
}

export default ExamConfigSection
