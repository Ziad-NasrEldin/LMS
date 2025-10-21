"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Html5Qrcode } from "html5-qrcode"

const BarcodeScanner = ({ onScanSuccess, translations = {} }) => {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // Use refs to maintain scanner instance and state across renders
  const scannerRef = useRef(null)
  const isRunningRef = useRef(false)

  // Clean up scanner on unmount
  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [])

  const startScanner = useCallback(() => {
    setLoading(true)
    setError(null)
    setResult(null)
    setScanning(true)

    try {
      // Create scanner instance
      const scanner = new Html5Qrcode("barcode-scanner-view")
      scannerRef.current = scanner

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      }

      // Start scanner with camera
      scanner
        .start(
          { facingMode: "environment" }, // Use back camera
          config,
          onScanComplete,
          onScanError,
        )
        .then(() => {
          isRunningRef.current = true
          setLoading(false)
        })
        .catch((err) => {
          setError(translations.cameraError || "Could not access camera. Please check permissions.")
          setLoading(false)
          setScanning(false)
          console.error("Error starting scanner:", err)
        })
    } catch (err) {
      setError(translations.initError || "Failed to initialize scanner")
      setLoading(false)
      setScanning(false)
      console.error("Error initializing scanner:", err)
    }
  }, [translations, onScanSuccess])

  const stopScanner = useCallback(() => {
    if (scannerRef.current && isRunningRef.current) {
      try {
        scannerRef.current
          .stop()
          .then(() => {
          })
          .catch((err) => {
            console.warn("Error stopping scanner (handled):", err)
          })
          .finally(() => {
            isRunningRef.current = false
            scannerRef.current = null
            setScanning(false)
          })
      } catch (err) {
        console.warn("Error in stopScanner (handled):", err)
        isRunningRef.current = false
        scannerRef.current = null
        setScanning(false)
      }
    } else {
      isRunningRef.current = false
      scannerRef.current = null
      setScanning(false)
    }
  }, [])

  const onScanComplete = (decodedText, decodedResult) => {
    // Mark scanner as not running to prevent multiple stop attempts
    isRunningRef.current = false

    try {
      // Try to stop scanner
      if (scannerRef.current) {
        scannerRef.current.stop()
      }
    } catch (err) {
      console.warn("Error stopping scanner after scan (handled):", err)
    } finally {
      scannerRef.current = null
      setScanning(false)
    }

    // Process the result
    const resultData = {
      text: decodedText,
      format: decodedResult.result.format?.formatName || "Unknown",
      type: decodedResult.result.format?.formatName || "Unknown",
    }

    setResult(resultData)

    // Provide haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(200)
    }

    // Call the callback if provided
    if (onScanSuccess) {
      onScanSuccess(resultData.text, resultData.format)
    }
  }

  const onScanError = (error) => {
    // Don't show errors for normal scanning attempts
  }

  const resetScanner = () => {
    setResult(null)
    setError(null)
  }

  return (
    <div className="card bg-base-100 shadow-md border border-base-200">
      <div className="card-body">
        <h3 className="card-title flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-barcode"
          >
            <path d="M3 5v14"></path>
            <path d="M8 5v14"></path>
            <path d="M12 5v14"></path>
            <path d="M17 5v14"></path>
            <path d="M21 5v14"></path>
          </svg>
          {translations.title || "Barcode Scanner"}
        </h3>

        <div className="relative w-full max-w-md h-64 border rounded-lg bg-base-200 mx-auto overflow-hidden">
          <div id="barcode-scanner-view" className="absolute inset-0"></div>

          {/* Loading state */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-base-100/80 z-10">
              <div className="flex flex-col items-center">
                <span className="loading loading-spinner loading-lg text-primary"></span>
                <p className="mt-4 font-medium">{translations.initializing || "Initializing camera..."}</p>
              </div>
            </div>
          )}

          {/* Inactive state */}
          {!scanning && !loading && !result && (
            <div className="absolute inset-0 flex items-center justify-center text-base-content/70">
              <div className="text-center p-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mx-auto mb-4 opacity-50"
                >
                  <path d="M3 5v14"></path>
                  <path d="M8 5v14"></path>
                  <path d="M12 5v14"></path>
                  <path d="M17 5v14"></path>
                  <path d="M21 5v14"></path>
                </svg>
                <p>{translations.clickStart || 'Click "Start Scanning" to begin'}</p>
              </div>
            </div>
          )}

          {/* Active scanning state */}
          {scanning && !loading && !result && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-primary rounded-lg"></div>
              <p className="absolute bottom-4 left-0 right-0 text-center text-white bg-black/50 py-2">
                {translations.scanningInstructions || "Align barcode in the frame..."}
              </p>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="alert alert-error mt-4">
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

        {/* Result display */}
        {result && (
          <div className="mt-4 p-4 border border-success bg-success/10 rounded-lg text-center">
            <h4 className="font-bold mb-2 text-success">{translations.resultLabel || "Barcode Detected:"}</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-base-200 p-2 rounded-lg">
                <span className="font-medium block mb-1">Type:</span>
                <span>{result.format}</span>
              </div>
              <div className="bg-base-200 p-2 rounded-lg">
                <span className="font-medium block mb-1">Value:</span>
                <span className="break-all">{result.text}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="card-actions justify-center mt-4">
          {!scanning ? (
            <>
              <button onClick={startScanner} disabled={loading} className="btn btn-primary">
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    {translations.starting || "Starting..."}
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2"
                    >
                      <rect width="20" height="20" x="2" y="2" rx="5"></rect>
                      <path d="M16 8h.01"></path>
                      <path d="M8 16v-4a4 4 0 0 1 8 0v4"></path>
                    </svg>
                    {translations.startButton || "Start Scanning"}
                  </>
                )}
              </button>

              {result && (
                <button onClick={resetScanner} className="btn btn-outline">
                  {translations.resetButton || "Reset"}
                </button>
              )}
            </>
          ) : (
            <button onClick={stopScanner} className="btn btn-error">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                <path d="M9 9h6v6H9z"></path>
              </svg>
              {translations.stopButton || "Stop Scanning"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default BarcodeScanner
