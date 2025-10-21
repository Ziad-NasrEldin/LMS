"use client"

import { CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { useTranslation } from "react-i18next"

const EnhancedProgressBar = ({
  isVisible,
  title,
  steps,
  currentStep,
  progress,
  error,
  onCancel,
  showCancel = true,
}) => {
  const { t } = useTranslation("kalimaStore-admin")
  
  if (!isVisible) return null

  const getStepStatus = (stepIndex) => {
    if (error && stepIndex === currentStep) return "error"
    if (stepIndex < currentStep) return "completed"
    if (stepIndex === currentStep) return "active"
    return "pending"
  }

  const getStepIcon = (stepIndex) => {
    const status = getStepStatus(stepIndex)

    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-success" />
      case "error":
        return <XCircle className="w-5 h-5 text-error" />
      case "active":
        return <div className="loading loading-spinner loading-sm text-primary"></div>
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-base-300"></div>
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-lg shadow-xl max-w-lg w-full p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">{title}</h3>
          {showCancel && onCancel && (
            <button
              onClick={onCancel}
              className="btn btn-sm btn-circle btn-ghost"
              disabled={currentStep >= steps.length && !error}
            >
              ✕
            </button>
          )}
        </div>

        {/* Overall Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>{t("progressBar.overallProgress")}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <progress
            className={`progress w-full ${error ? "progress-error" : "progress-primary"}`}
            value={progress}
            max="100"
          ></progress>
        </div>

        {/* Steps */}
        <div className="space-y-4 max-h-64 overflow-y-auto">
          {steps.map((step, index) => {
            const status = getStepStatus(index)
            return (
              <div
                key={index}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                  status === "active"
                    ? "bg-primary/10 border border-primary/20"
                    : status === "completed"
                      ? "bg-success/10"
                      : status === "error"
                        ? "bg-error/10 border border-error/20"
                        : "bg-base-200/50"
                }`}
              >
                {getStepIcon(index)}
                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      status === "completed"
                        ? "text-success"
                        : status === "error"
                          ? "text-error"
                          : status === "active"
                            ? "text-primary"
                            : "text-base-content/60"
                    }`}
                  >
                    {step.title}
                  </p>
                  {step.description && <p className="text-sm text-base-content/60 mt-1">{step.description}</p>}
                  {step.fileInfo && status === "active" && (
                    <div className="text-xs text-base-content/50 mt-1">{step.fileInfo}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-error/10 border border-error/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-error" />
              <p className="text-sm text-error font-medium">{t("progressBar.uploadFailed")}</p>
            </div>
            <p className="text-sm text-error/80 mt-1">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {currentStep >= steps.length && !error && (
          <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <p className="text-sm text-success font-medium">{t("progressBar.uploadCompletedSuccessfully")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EnhancedProgressBar
