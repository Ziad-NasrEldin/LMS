"use client"

import { useState, useEffect } from "react"
import { useParams, useLocation } from "react-router-dom"
import ActivityTracker from "./ActivityTracker"
import Reports from "./Reports"
import { getCenterDataByType, recordAttendance } from "../../routes/center"
import BarcodeScanner from "./QrScannerCard"
import { useTranslation } from "react-i18next"
import {
  CalendarDays,
  CreditCard,
  Book,
  User,
  DollarSign,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react"

export default function LessonDetailsSection() {
  const { id } = useParams() // Extract lesson ID from URL
  const { state } = useLocation() // Access lesson data from navigation state
  const lesson = state?.lesson || {}
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [attendanceResult, setAttendanceResult] = useState(null) // State for attendance result
  const [paymentType, setPaymentType] = useState("daily") // State for payment type
  const [studentSequencedId, setStudentSequencedId] = useState("") // State for student sequential ID
  const [amountPaid, setAmountPaid] = useState(200) // State for payment amount
  const [attendanceDate, setAttendanceDate] = useState("") // State for attendance date (optional)
  const [isBookletPurchased, setIsBookletPurchased] = useState(true) // State for booklet purchased
  const [showScanner, setShowScanner] = useState(false) // State to toggle scanner visibility
  const { t } = useTranslation("lectures")

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true)
      try {
        const response = await getCenterDataByType(lesson.center?._id, "students")
        if (response.status === "success") {
          setStudents(response.data)
        } else {
          throw new Error(response.message || t("errors.fetchStudents", "Failed to fetch students"))
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (lesson.center?._id) {
      fetchStudents()
    }
  }, [lesson.center?._id, t])

  // Handler for when a barcode is scanned successfully
  const handleBarcodeScanned = async (barcodeText, barcodeFormat) => {
    try {
      // Set the scanned ID in the form
      setStudentSequencedId(barcodeText)

      const apiPaymentType = paymentType === "multi-session" ? "multi-session" : paymentType
      const effectiveAmountPaid = paymentType === "unpaid" || paymentType === "multi-session" ? 0 : amountPaid

      const attendanceData = {
        studentSequencedId: barcodeText,
        lessonId: id,
        paymentType: apiPaymentType,
        amountPaid: effectiveAmountPaid,
        isBookletPurchased,
        ...(attendanceDate && { attendanceDate }),
      }

      const result = await recordAttendance(attendanceData)

      setAttendanceResult({
        success: result.success,
        message: result.success
          ? t("attendance.success", "Attendance recorded successfully")
          : result.error || t("attendance.error", "Failed to record attendance"),
        studentId: barcodeText,
      })

      // Hide scanner after successful scan
      setShowScanner(false)

      // Clear result after 5 seconds
      setTimeout(() => {
        setAttendanceResult(null)
      }, 5000)
    } catch (err) {
      setAttendanceResult({
        success: false,
        message: err.message || t("attendance.error", "Failed to record attendance"),
        studentId: barcodeText,
      })
    }
  }

  // Handler for form submission
  const handleFormSubmit = async (e) => {
    e.preventDefault()
    try {
      const apiPaymentType = paymentType === "multi-session" ? "multi-session" : paymentType
      const effectiveAmountPaid = paymentType === "unpaid" || paymentType === "multi-session" ? 0 : amountPaid

      const attendanceData = {
        studentSequencedId,
        lessonId: id,
        paymentType: apiPaymentType,
        amountPaid: effectiveAmountPaid,
        isBookletPurchased,
        ...(attendanceDate && { attendanceDate }),
      }

      const result = await recordAttendance(attendanceData)

      setAttendanceResult({
        success: result.success,
        message: result.success
          ? t("attendance.success", "Attendance recorded successfully")
          : result.error || t("attendance.error", "Failed to record attendance"),
        studentId: studentSequencedId,
      })

      // Clear form after successful submission
      if (result.success) {
        setStudentSequencedId("")
      }

      // Clear result after 5 seconds
      setTimeout(() => {
        setAttendanceResult(null)
      }, 5000)
    } catch (err) {
      setAttendanceResult({
        success: false,
        message: err.message || t("attendance.error", "Failed to record attendance"),
        studentId: studentSequencedId,
      })
    }
  }

  // Handler for payment type change
  const handlePaymentTypeChange = (e) => {
    const newPaymentType = e.target.value
    setPaymentType(newPaymentType)
    if (newPaymentType === "unpaid" || newPaymentType === "multi-session") {
      setAmountPaid(0)
    } else {
      setAmountPaid(200)
    }
  }

  if (loading)
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">{t("common.loading", "Loading...")}</span>
      </div>
    )
  if (error)
    return (
      <div className="alert alert-error max-w-md mx-auto my-8">
        <AlertCircle className="w-6 h-6" />
        <span>{error}</span>
      </div>
    )

  // Translations for barcode scanner
  const scannerTranslations = {
    title: t("barCodeScanner.title", "Student ID Scanner"),
    initializing: t("barCodeScanner.initializing", "Initializing camera..."),
    clickStart: t("barCodeScanner.clickStart", "Click 'Start Scanning' to begin"),
    scanningInstructions: t("barCodeScanner.scanInstructions", "Align student ID barcode in the frame..."),
    resultLabel: t("barCodeScanner.resultLabel", "Student ID Detected:"),
    startButton: t("barCodeScanner.startButton", "Start Scanning"),
    stopButton: t("barCodeScanner.stopButton", "Stop Scanning"),
    resetButton: t("barCodeScanner.resetButton", "Reset"),
    cameraError: t("barCodeScanner.permissionWarning", "Could not access camera. Please check permissions."),
    initError: t("barCodeScanner.scanError", "Failed to initialize scanner"),
  }

  return (
    <div className="space-y-8 p-4 max-w-6xl mx-auto">
      {/* Lesson Header */}
      <div className="bg-base-100 shadow-sm rounded-lg p-6 border border-base-200">
        <h1 className="text-2xl font-bold mb-2">{lesson.title || t("lesson.detailsTitle", "Lesson Details")}</h1>
        <div className="flex flex-wrap gap-4 text-sm">
          {lesson.center && (
            <div className="badge badge-outline p-3">
              {lesson.center.name || t("lesson.centerUnknown", "Unknown Center")}
            </div>
          )}
          {lesson.date && (
            <div className="badge badge-outline p-3">
              <CalendarDays className="w-4 h-4 mr-1" />
              {new Date(lesson.date).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {/* Activity Tracker and Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityTracker lessonId={id} students={students} />
        <Reports selectedCenter={lesson.center} lessonId={id} />
      </div>

      {/* Display attendance result if available */}
      {attendanceResult && (
        <div
          className={`alert ${
            attendanceResult.success ? "alert-success" : "alert-error"
          } shadow-lg transition-all duration-300 ease-in-out`}
        >
          <div className="flex items-center">
            {attendanceResult.success ? (
              <CheckCircle className="w-6 h-6 flex-shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 flex-shrink-0" />
            )}
            <div>
              <h3 className="font-bold">
                {attendanceResult.success
                  ? t("attendance.successTitle", "Success!")
                  : t("attendance.errorTitle", "Error!")}
              </h3>
              <div className="text-xs">{attendanceResult.message}</div>
              {attendanceResult.studentId && (
                <div className="text-xs mt-1">
                  {t("attendance.studentId", "Student ID")}: {attendanceResult.studentId}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Attendance Form */}
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body">
            <h2 className="card-title flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              {t("attendance.formTitle", "Record Attendance")}
            </h2>

            <form onSubmit={handleFormSubmit} className="space-y-4 mt-4">
              {/* Student Sequential ID */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    {t("attendance.studentIdLabel", "Student Sequential ID")}
                  </span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={studentSequencedId}
                    onChange={(e) => setStudentSequencedId(e.target.value)}
                    placeholder={t("attendance.studentIdPlaceholder", "Enter student ID")}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline btn-square"
                    onClick={() => setShowScanner(!showScanner)}
                    title={t("attendance.scanButton", "Scan ID")}
                  >
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
                    >
                      <path d="M3 5v14"></path>
                      <path d="M8 5v14"></path>
                      <path d="M12 5v14"></path>
                      <path d="M17 5v14"></path>
                      <path d="M21 5v14"></path>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Payment Type Dropdown */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    {t("attendance.paymentTypeLabel", "Select Payment Type")}
                  </span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={paymentType}
                  onChange={handlePaymentTypeChange}
                >
                  <option value="daily">{t("attendance.paymentType.daily", "Daily")}</option>
                  <option value="lesson">{t("attendance.paymentType.lesson", "Lesson")}</option>
                  <option value="month">{t("attendance.paymentType.month", "Month")}</option>
                  <option value="year">{t("attendance.paymentType.year", "Year")}</option>
                  <option value="multi-session">{t("attendance.paymentType.multiSession", "Multi Session")}</option>
                  <option value="unpaid">{t("attendance.paymentType.unpaid", "Unpaid")}</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Payment Amount */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">{t("attendance.amountPaidLabel", "Amount Paid")}</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <DollarSign className="w-4 h-4 text-base-content/60" />
                    </span>
                    <input
                      type="number"
                      className="input input-bordered w-full pl-10"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(Number(e.target.value))}
                      disabled={paymentType === "unpaid" || paymentType === "multi-session"}
                      placeholder={t("attendance.amountPaidPlaceholder", "Enter amount")}
                      min="0"
                    />
                  </div>
                </div>

                {/* Attendance Date (Optional) */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      {t("attendance.dateLabel", "Attendance Date (Optional)")}
                    </span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered w-full"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Is Booklet Purchased */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">{t("attendance.bookletLabel", "Booklet Purchased")}</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isBookletPurchased"
                      value="true"
                      checked={isBookletPurchased === true}
                      onChange={() => setIsBookletPurchased(true)}
                      className="radio radio-primary"
                    />
                    <span>{t("attendance.bookletYes", "Yes")}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isBookletPurchased"
                      value="false"
                      checked={isBookletPurchased === false}
                      onChange={() => setIsBookletPurchased(false)}
                      className="radio radio-primary"
                    />
                    <span>{t("attendance.bookletNo", "No")}</span>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button type="submit" className="btn btn-primary w-full">
                <CreditCard className="w-4 h-4 mr-2" />
                {t("attendance.submitButton", "Record Attendance")}
              </button>
            </form>
          </div>
        </div>

        {/* Barcode Scanner */}
        {showScanner && (
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-0">
              <BarcodeScanner onScanSuccess={handleBarcodeScanned} translations={scannerTranslations} />
            </div>
          </div>
        )}

        {/* Student List Preview (when scanner is not shown) */}
        {!showScanner && (
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body">
              <h2 className="card-title flex items-center gap-2">
                <Book className="w-5 h-5 text-primary" />
                {t("attendance.studentListTitle", "Student List")}
              </h2>

              <div className="overflow-x-auto mt-4">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>{t("attendance.studentTable.id", "ID")}</th>
                      <th>{t("attendance.studentTable.name", "Name")}</th>
                      <th>{t("attendance.studentTable.status", "Status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.length > 0 ? (
                      students.slice(0, 5).map((student) => (
                        <tr key={student._id}>
                          <td className="font-mono text-sm">{student.sequencedId || student._id}</td>
                          <td>{student.name}</td>
                          <td>
                            <span className="badge badge-outline badge-sm">
                              {student.status || t("attendance.studentTable.active", "Active")}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center py-4 text-base-content/60">
                          {t("attendance.noStudents", "No students found")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {students.length > 5 && (
                  <div className="text-center text-sm text-base-content/60 mt-2">
                    {t("attendance.moreStudents", "Showing 5 of {{count}} students", { count: students.length })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
