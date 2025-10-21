"use client"
import { useState, useEffect } from "react"

const FileUploadProgress = ({ file, onUploadComplete, onUploadError, uploadEndpoint, fieldName, accept = "*/*" }) => {
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    if (file && !uploading && !completed) {
      uploadFile()
    }
  }, [file])

  const uploadFile = async () => {
    if (!file) return

    setUploading(true)
    setError(null)
    setProgress(0)

    const formData = new FormData()
    formData.append(fieldName, file)

    try {
      const xhr = new XMLHttpRequest()

      // Track upload progress
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100)
          setProgress(percentComplete)
        }
      })

      // Handle completion
      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          setCompleted(true)
          setUploading(false)
          try {
            const response = JSON.parse(xhr.responseText)
            onUploadComplete?.(response, fieldName)
          } catch (e) {
            onUploadComplete?.(xhr.responseText, fieldName)
          }
        } else {
          throw new Error(`Upload failed with status: ${xhr.status}`)
        }
      })

      // Handle errors
      xhr.addEventListener("error", () => {
        const errorMsg = "Upload failed due to network error"
        setError(errorMsg)
        setUploading(false)
        onUploadError?.(errorMsg, fieldName)
      })

      // Handle abort
      xhr.addEventListener("abort", () => {
        const errorMsg = "Upload was cancelled"
        setError(errorMsg)
        setUploading(false)
        onUploadError?.(errorMsg, fieldName)
      })

      // Start upload
      xhr.open("POST", uploadEndpoint)

      // Add auth headers if needed
      const token = localStorage.getItem("token") // Adjust based on your auth implementation
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`)
      }

      xhr.send(formData)
    } catch (err) {
      setError(err.message)
      setUploading(false)
      onUploadError?.(err.message, fieldName)
    }
  }

  const resetUpload = () => {
    setProgress(0)
    setUploading(false)
    setError(null)
    setCompleted(false)
  }

  if (!file) return null

  return (
    <div className="mt-3 p-3 bg-base-200 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium truncate max-w-48">{file.name}</div>
          <div className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</div>
        </div>

        {completed && (
          <div className="flex items-center gap-1 text-success">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs">Complete</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-1 text-error">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs">Failed</span>
          </div>
        )}

        {uploading && (
          <div className="flex items-center gap-1 text-info">
            <span className="loading loading-spinner loading-xs"></span>
            <span className="text-xs">{progress}%</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            error ? "bg-error" : completed ? "bg-success" : "bg-primary"
          }`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 text-xs text-error">
          {error}
          <button onClick={resetUpload} className="ml-2 underline hover:no-underline">
            Retry
          </button>
        </div>
      )}

      {/* File Type Validation */}
      {file && accept !== "*/*" && <div className="mt-1 text-xs text-gray-500">Accepted: {accept}</div>}
    </div>
  )
}

export default FileUploadProgress
