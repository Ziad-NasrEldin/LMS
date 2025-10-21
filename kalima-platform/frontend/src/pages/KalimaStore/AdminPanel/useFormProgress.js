"use client"

import { useState, useCallback } from "react"

export const useFormProgress = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [error, setError] = useState(null)
  const [steps, setSteps] = useState([])

  const startProgress = useCallback((progressSteps, title = "Processing...") => {
    setSteps(progressSteps)
    setIsVisible(true)
    setProgress(0)
    setCurrentStep(0)
    setError(null)
  }, [])

  const updateProgress = useCallback((stepIndex, progressValue, stepUpdate = {}) => {
    setCurrentStep(stepIndex)
    setProgress(progressValue)

    // Update step information if provided
    if (stepUpdate && Object.keys(stepUpdate).length > 0) {
      setSteps((prevSteps) => prevSteps.map((step, index) => (index === stepIndex ? { ...step, ...stepUpdate } : step)))
    }
  }, [])

  const setProgressError = useCallback((errorMessage) => {
    setError(errorMessage)
  }, [])

  const completeProgress = useCallback(() => {
    setCurrentStep(steps.length)
    setProgress(100)
  }, [steps.length])

  const hideProgress = useCallback(() => {
    setIsVisible(false)
    setProgress(0)
    setCurrentStep(0)
    setError(null)
    setSteps([])
  }, [])

  const resetProgress = useCallback(() => {
    setProgress(0)
    setCurrentStep(0)
    setError(null)
  }, [])

  return {
    isVisible,
    progress,
    currentStep,
    steps,
    error,
    startProgress,
    updateProgress,
    setProgressError,
    completeProgress,
    hideProgress,
    resetProgress,
  }
}
