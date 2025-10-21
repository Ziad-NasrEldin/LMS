"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getLectureById, getLectureAttachments, deleteLecture } from "../../../routes/lectures"
import { getAllSubjects } from "../../../routes/courses"
import { getAllLevels } from "../../../routes/levels"
import { getUserDashboard } from "../../../routes/auth-services"
import { getLectureHomeworks } from "../../../routes/homeworks"
import { downloadAttachmentById } from "../../../routes/lectures"
import { useTranslation } from "react-i18next"
import { getAllStudentLectureAccess, updateStudentLectureAccess } from "../../../routes/student-lecture-access"
import {
  FiArrowLeft,
  FiDownload,
  FiEye,
  FiFileText,
  FiDollarSign,
  FiUser,
  FiBook,
  FiLayers,
  FiEyeOff,
  FiCheck,
  FiX,
  FiAlertTriangle,
  FiUpload,
  FiUsers,
  FiFile,
  FiInfo,
  FiEdit,
  FiClock,
  FiSave,
  FiStar,
  FiMessageSquare
} from "react-icons/fi"
// Simple rating component with no external dependencies

const DetailedLectureView = () => {
  const { t, i18n } = useTranslation("lectureDisplay")
  const isRTL = i18n.language === 'ar'
  const { lectureId } = useParams()
  const navigate = useNavigate()
  const [lecture, setLecture] = useState(null)
  const [attachments, setAttachments] = useState({
    booklets: [],
    pdfsandimages: [],
    homeworks: [],
    exams: [],
  })
  const [subjects, setSubjects] = useState([]) // Initialize as empty array
  const [levels, setLevels] = useState([]) // Initialize as empty array
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [userId, setUserId] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [studentSubmissions, setStudentSubmissions] = useState([])
  const [submissionsLoading, setSubmissionsLoading] = useState(false)
  const [submissionsError, setSubmissionsError] = useState(null)
  const [viewingSubmission, setViewingSubmission] = useState(null)
  const [showSubmissionModal, setShowSubmissionModal] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [currentSubmission, setCurrentSubmission] = useState(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)
  const [feedbackError, setFeedbackError] = useState(null)
  const fileViewerRef = useRef(null)

  // Student lecture access states
  const [studentLectureAccesses, setStudentLectureAccesses] = useState([])
  const [accessesLoading, setAccessesLoading] = useState(false)
  const [accessesError, setAccessesError] = useState(null)
  const [editingAccessId, setEditingAccessId] = useState(null)
  const [remainingViews, setRemainingViews] = useState(0)
  const [updateAccessLoading, setUpdateAccessLoading] = useState(false)
  const [updateAccessError, setUpdateAccessError] = useState(null)
  const [updateAccessSuccess, setUpdateAccessSuccess] = useState(false)

  // Check if user has admin-like privileges
  const hasAdminPrivileges = ["Lecturer", "Assistant", "Admin", "SubAdmin", "Moderator"].includes(userRole)

  // Fetch user role and ID first
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const result = await getUserDashboard()
        if (result.success) {
          setUserRole(result.data.data.userInfo.role)
          setUserId(result.data.data.userInfo.id)
        } else {
          console.error("Failed to fetch user data:", result)
        }
      } catch (err) {
        console.error("Error fetching user data:", err)
      }
    }

    fetchUserData()
  }, [])

  // Fetch lecture data, attachments, subjects, and levels
  useEffect(() => {
    const fetchLectureData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch subjects
        const subjectsResult = await getAllSubjects()
        if (subjectsResult.success) {
          setSubjects(subjectsResult.data || [])
        } else {
          console.error("Failed to fetch subjects:", subjectsResult.error)
          setError((prev) =>
            prev ? `${prev}. ${t("failedToLoadSubjects")}` : t("failedToLoadSubjects"),
          )
        }

        // Fetch levels
        const levelsResult = await getAllLevels()
        if (levelsResult.success) {
          setLevels(levelsResult.data || [])
        } else {
          console.error("Failed to fetch levels:", levelsResult.error)
          setError((prev) =>
            prev
              ? `${prev}. ${t("failedToLoadLevels")}`
              : t("failedToLoadLevels"),
          )
        }

        // Fetch lecture details
        const lectureResult = await getLectureById(lectureId)

        if (typeof lectureResult === "string") {
          setError(lectureResult)
          return
        }

        if (lectureResult.success) {
          setLecture(lectureResult.data.container)

          // Fetch lecture attachments
          const attachmentsResult = await getLectureAttachments(lectureId)

          if (typeof attachmentsResult === "string") {
            console.error("Attachment error:", attachmentsResult)
            setError((prev) => (prev ? `${prev}. ${attachmentsResult}` : attachmentsResult))
          } else if (attachmentsResult.status === "success") {
            setAttachments(attachmentsResult.data)
          } else {
            console.error("Failed to fetch attachments:", attachmentsResult)
          }
        } else {
          setError(t("failedToFetchLectureDetails"))
        }
      } catch (err) {
        console.error("Error in fetchLectureData:", err)
        setError(t("failedToLoadLectureData", { error: err.message }))
      } finally {
        setLoading(false)
      }
    }

    if (lectureId) {
      fetchLectureData()
    }
  }, [lectureId, t])

  // Fetch student homework submissions using getLectureHomeworks
  useEffect(() => {
    const fetchHomeworks = async () => {
      if (!lectureId) return;
      setSubmissionsLoading(true);
      setSubmissionsError(null);
      try {
        const res = await getLectureHomeworks(lectureId);
        if (res.success && res.data && Array.isArray(res.data.attachments)) {
          // If admin, show all; if student, show only their own
          if (hasAdminPrivileges) {
            setStudentSubmissions(res.data.attachments);
          } else {
            setStudentSubmissions(res.data.attachments.filter(att => att.studentId?._id === userId));
          }
        } else {
          setStudentSubmissions([]);
          setSubmissionsError(res.error || t("failedToFetchStudentSubmissions"));
        }
      } catch (err) {
        setStudentSubmissions([]);
        setSubmissionsError(t("unexpectedErrorFetchingSubmissions"));
      } finally {
        setSubmissionsLoading(false);
      }
    };
    fetchHomeworks();
  }, [lectureId, userRole, userId, hasAdminPrivileges, t]);

  // Fetch student lecture accesses
  useEffect(() => {
    const fetchStudentLectureAccesses = async () => {
      if (!lectureId || !userRole || !hasAdminPrivileges) {
        return
      }

      try {
        setAccessesLoading(true)
        setAccessesError(null)

        const result = await getAllStudentLectureAccess(lectureId)

        if (result.success) {
          setStudentLectureAccesses(result.data || [])
        } else {
          setAccessesError(result.error || t("failedToFetchStudentAccesses"))
        }
      } catch (err) {
        console.error("Error fetching student lecture accesses:", err)
        setAccessesError(t("unexpectedErrorFetchingAccesses"))
      } finally {
        setAccessesLoading(false)
      }
    }

    fetchStudentLectureAccesses()
  }, [lectureId, userRole, hasAdminPrivileges, t])

  // Helper function to get subject name
  const getSubjectName = () => {
    if (!lecture || !lecture.subject) return t("notSpecified")

    // If subject is an object with name property
    if (lecture.subject.name) return lecture.subject.name

    // If subject is an ID, find it in the subjects array
    const subjectId = typeof lecture.subject === "object" ? lecture.subject._id : lecture.subject
    const foundSubject = subjects.find((s) => s._id === subjectId)

    return foundSubject ? foundSubject.name : t("notSpecified")
  }

  // Helper function to get level name
  const getLevelName = () => {
    if (!lecture || !lecture.level) return t("notSpecified")

    // If level is an object with name property
    if (lecture.level.name) return lecture.level.name

    // If level is an ID, find it in the levels array
    const levelId = typeof lecture.level === "object" ? lecture.level._id : lecture.level
    const foundLevel = levels.find((l) => l._id === levelId)

    return foundLevel ? foundLevel.name : t("notSpecified")
  }

  // Handle viewing a submission
  const handleViewSubmission = (submission) => {
    setViewingSubmission(submission)
    setShowSubmissionModal(true)
  }

  // Handle opening feedback modal
  const handleOpenFeedback = (submission) => {
    setCurrentSubmission(submission)
    setRating(submission.rating || 0)
    setComment(submission.comment || '')
    setShowFeedbackModal(true)
  }

  // Handle submitting feedback
  const handleSubmitFeedback = async () => {
    if (!currentSubmission) return
    
    setIsSubmittingFeedback(true)
    setFeedbackError(null)
    
    try {
      // Here you'll need to implement the actual API call to save the feedback
      // For now, we'll just update the local state
      const updatedSubmissions = studentSubmissions.map(sub => 
        sub._id === currentSubmission._id 
          ? { ...sub, rating, comment, feedbackDate: new Date().toISOString() }
          : sub
      )
      
      setStudentSubmissions(updatedSubmissions)
      setShowFeedbackModal(false)
      
      // Show success message
      // You might want to replace this with a toast notification
      alert('Feedback submitted successfully')
    } catch (error) {
      console.error('Error submitting feedback:', error)
      setFeedbackError('Failed to submit feedback. Please try again.')
    } finally {
      setIsSubmittingFeedback(false)
    }
  }

  // Handle editing student lecture access
  const handleEditAccess = (access) => {
    setEditingAccessId(access._id)
    setRemainingViews(access.remainingViews)
    setUpdateAccessError(null)
    setUpdateAccessSuccess(false)
  }

  // Handle saving updated student lecture access
  const handleSaveAccess = async () => {
    try {
      setUpdateAccessLoading(true)
      setUpdateAccessError(null)
      setUpdateAccessSuccess(false)

      const result = await updateStudentLectureAccess(editingAccessId, {
        remainingViews: remainingViews,
      })

      if (result.success) {
        // Update the local state with the new data
        setStudentLectureAccesses((prevAccesses) =>
          prevAccesses.map((access) =>
            access._id === editingAccessId ? { ...access, remainingViews: remainingViews } : access,
          ),
        )
        setUpdateAccessSuccess(true)

        // Reset editing state after a short delay
        setTimeout(() => {
          setEditingAccessId(null)
          setUpdateAccessSuccess(false)
        }, 2000)
      } else {
        setUpdateAccessError(result.error)
      }
    } catch (err) {
      console.error("Error updating student lecture access:", err)
      setUpdateAccessError(t("unexpectedErrorUpdatingAccess"))
    } finally {
      setUpdateAccessLoading(false)
    }
  }

  // Handle canceling edit
  const handleCancelEdit = () => {
    setEditingAccessId(null)
    setUpdateAccessError(null)
    setUpdateAccessSuccess(false)
  }

  // Get file icon based on file type
  const getFileIcon = (fileType) => {
    if (fileType.includes("pdf")) {
      return "pdf"
    } else if (fileType.includes("word") || fileType.includes("document")) {
      return "doc"
    } else if (fileType.includes("sheet") || fileType.includes("excel")) {
      return "xls"
    } else if (fileType.includes("presentation") || fileType.includes("powerpoint")) {
      return "ppt"
    } else if (fileType.includes("image")) {
      return "img"
    } else {
      return "file"
    }
  }

  // Handle lecture deletion
  const handleDeleteLecture = async () => {
    try {
      setDeleteLoading(true)
      setDeleteError(null)

      const result = await deleteLecture(lectureId)
      if (result.success) {
        // Navigate back to the lectures list page after successful deletion
        navigate("/dashboard/lecturer-dashboard")
      } else {
        setDeleteError(result.message || t("failedToDeleteLecture"))
        setShowDeleteModal(false)
      }
    } catch (err) {
      console.error("Error deleting lecture:", err)
      setDeleteError(t("unexpectedErrorDeletingLecture"))
      setShowDeleteModal(false)
    } finally {
      setDeleteLoading(false)
    }
  }

  // Format date to local string
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString(i18n.language === 'ar' ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      return t("invalidDate")
    }
  }

  // Render attachment list
  const renderAttachments = (attachmentList, title, icon) => {
    if (!attachmentList || attachmentList.length === 0) {
      return null
    }

    const Icon = icon

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Icon className="text-primary" />
          {t(title)}
        </h3>
        <div className="bg-base-200 rounded-lg p-4">
          <ul className="divide-y divide-base-300">
            {attachmentList.map((attachment) => (
              <li key={attachment._id} className="py-3 flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2 mb-2 md:mb-0">
                  <span className="text-base-content/80">{attachment.fileName}</span>
                  <span className="text-xs bg-base-300 px-2 py-1 rounded">
                    {(attachment.fileSize / 1024).toFixed(2)} KB
                  </span>
                </div>
                <div className="flex gap-2">
                  <a
                    href={attachment.filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline"
                  >
                    <FiEye className={isRTL ? "ml-1" : "mr-1"} /> {t("view")}
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-4" dir={isRTL ? "rtl" : "ltr"}>
        <div className="alert alert-error">
          <FiX className="w-6 h-6" />
          <span>{t('errorGeneric')}</span>
        </div>
        <button onClick={() => navigate(-1)} className="btn btn-outline mt-4">
          <FiArrowLeft className={isRTL ? "ml-2" : "mr-2"} />
          {t('back')}
        </button>
      </div>
    )
  }

  // No lecture found
  if (!lecture) {
    return (
      <div className="container mx-auto p-4" dir={isRTL ? "rtl" : "ltr"}>
        <div className="alert alert-warning">
          <span>{t('lectureNotFound')}</span>
        </div>
        <button onClick={() => navigate(-1)} className="btn btn-outline mt-4">
          <FiArrowLeft className={isRTL ? "ml-2" : "mr-2"} />
          {t('back')}
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center gap-2 mb-4 md:mb-0">
          <button onClick={() => navigate(-1)} className="btn btn-circle btn-ghost">
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">{lecture.name}</h1>
          <span className={`badge ${lecture.lecture_type === "Paid" ? "badge-primary" : "badge-secondary"}`}>
            {lecture.lecture_type === "Paid" ? t('paid') : t('review')}
          </span>
        </div>

        {/* Admin/Lecturer Actions */}
        {hasAdminPrivileges && (
          <div className="flex gap-2">
            <button className="btn btn-error btn-sm" onClick={() => setShowDeleteModal(true)}>
              {t('deleteLecture')}
            </button>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <FiAlertTriangle className="text-error" />
              {t('deleteConfirmTitle')}
            </h3>
            <p className="py-4">
              {t('deleteConfirmMessage', { name: lecture.name })}
            </p>
            {deleteError && (
              <div className="alert alert-error mt-2">
                <FiX className="w-5 h-5" />
                <span>{deleteError}</span>
              </div>
            )}
            <div className="modal-action">
              <button className="btn btn-outline" onClick={() => setShowDeleteModal(false)} disabled={deleteLoading}>
                {t('cancel')}
              </button>
              <button className="btn btn-error" onClick={handleDeleteLecture} disabled={deleteLoading}>
                {deleteLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    {t('deleting')}
                  </>
                ) : (
                  t('confirmDelete')
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submission Viewer Modal */}
      {showSubmissionModal && viewingSubmission && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl w-11/12 h-5/6 max-h-screen">
            <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
              <FiFile className="text-primary" />
              {viewingSubmission.fileName}
            </h3>

            <div className="bg-base-200 rounded-lg p-2 mb-4 text-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span>
                  {t('type')}: <span className="font-medium">{viewingSubmission.fileType}</span>
                </span>
                <span>
                  {t('size')}: <span className="font-medium">{(viewingSubmission.fileSize / 1024).toFixed(2)} KB</span>
                </span>
                <span>
                  {t('uploadDate')}:{" "}
                  <span className="font-medium">
                    {new Date(viewingSubmission.uploadedOn).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}
                  </span>
                </span>
              </div>
            </div>

            <div className="bg-base-300 rounded-lg overflow-hidden h-[calc(100%-8rem)] flex items-center justify-center">
              {/* File preview based on file type */}
              {viewingSubmission.fileType.includes("image") ? (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <img
                    src={`data:${viewingSubmission.fileType};base64,${viewingSubmission.fileData}`}
                    alt={viewingSubmission.fileName}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : viewingSubmission.fileType.includes("pdf") ? (
                <div className="w-full h-full p-4">
                  <div className="w-full h-full bg-white rounded shadow-inner flex items-center justify-center">
                    <div className="text-center p-8">
                      <FiFileText className="w-16 h-16 mx-auto text-primary mb-4" />
                      <p className="font-medium mb-2">{t('pdfFile')}</p>
                      <p className="text-sm opacity-70 mb-4">
                      {t('downloadToView')}
                      </p>
                    </div>
                  </div>
                </div>
              ) : viewingSubmission.fileType.includes("word") || viewingSubmission.fileType.includes("document") ? (
                <div className="w-full h-full p-4">
                  <div className="w-full h-full bg-white rounded shadow-inner flex items-center justify-center">
                    <div className="text-center p-8">
                      <FiFileText className="w-16 h-16 mx-auto text-blue-600 mb-4" />
                     <p className="font-medium mb-2">{t('wordDoc')}</p>
                      <p className="text-sm opacity-70 mb-4">
                        {t('downloadToView')}
                      </p>
                    </div>
                  </div>
                </div>
              ) : viewingSubmission.fileType.includes("sheet") || viewingSubmission.fileType.includes("excel") ? (
                <div className="w-full h-full p-4">
                  <div className="w-full h-full bg-white rounded shadow-inner flex items-center justify-center">
                    <div className="text-center p-8">
                      <FiFileText className="w-16 h-16 mx-auto text-green-600 mb-4" />
                      <p className="font-medium mb-2">{t('excelSheet')}</p>
                      <p className="text-sm opacity-70 mb-4">
                       {t('downloadToView')}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full p-4">
                  <div className="w-full h-full bg-white rounded shadow-inner flex items-center justify-center">
                    <div className="text-center p-8">
                      <FiFile className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                      <p className="font-medium mb-2">{t('fileNotSupported')}</p>
                      <p className="text-sm opacity-70 mb-4">
                        {t('downloadToView')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-action">
              <button className="btn btn-outline" onClick={() => setShowSubmissionModal(false)}>
                {t('close')}
              </button>
              <a
                href={`data:${viewingSubmission.fileType};base64,${viewingSubmission.fileData}`}
                download={viewingSubmission.fileName}
                className="btn btn-primary"
              >
                <FiDownload className={isRTL ? "ml-2" : "mr-2"} />
                {t('download')}
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Description */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <FiFileText className="text-primary" />
              {t('description')}
            </h2>
            <div className="bg-base-200 rounded-lg p-4">
              <p className="whitespace-pre-line">{lecture.description || t('noDescription')}</p>
            </div>
          </div>

          {/* Student Lecture Access */}
          {hasAdminPrivileges && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <FiUsers className="text-primary" />
                {t('studentAccess')}
              </h2>

              {accessesLoading ? (
                <div className="flex justify-center py-8 bg-base-200 rounded-lg">
                  <div className="loading loading-spinner loading-md"></div>
                </div>
              ) : accessesError ? (
                <div className="alert alert-error">
                  <FiX className="w-5 h-5" />
                  <span>{accessesError}</span>
                </div>
              ) : studentLectureAccesses.length > 0 ? (
                <div className="bg-base-200 rounded-lg p-4">
                  <div className="overflow-x-auto">
                    <table className="table w-full">
                      <thead>
                        <tr>
                        <th>{t('student')}</th>
                        <th>{t('remainingViews')}</th>
                        <th>{t('lastAccess')}</th>
                        <th>{t('actions')}</th>
                      </tr>
                      </thead>
                      <tbody>
                        {studentLectureAccesses.map((access) => (
                          <tr key={access._id}>
                            <td>
                              <div className="flex items-center gap-2">
                                <div className="avatar avatar-placeholder">
                                  <div className="bg-primary text-primary-content rounded-full w-8">
                                    <span>{access.student.name.charAt(0)}</span>
                                  </div>
                                </div>
                                <div>
                                  <div className="font-bold">{access.student.name}</div>
                                  <div className="text-xs opacity-70">{access.student.role}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              {editingAccessId === access._id ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    className="input input-bordered input-sm w-20"
                                    value={remainingViews}
                                    onChange={(e) => setRemainingViews(Number.parseInt(e.target.value) || 0)}
                                    min="0"
                                  />
                                  {updateAccessError && <span className="text-xs text-error">{updateAccessError}</span>}
                                  {updateAccessSuccess && (
                                    <span className="text-xs text-success">{t('updateSuccess')}</span>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{access.remainingViews}</span>
                                  <span className="text-xs opacity-70">{t('views')}</span>
                                </div>
                              )}
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <FiClock className="text-primary w-4 h-4" />
                                <span>{formatDate(access.lastAccessed)}</span>
                              </div>
                            </td>
                            <td>
                              {editingAccessId === access._id ? (
                                <div className="flex gap-2">
                                  <button
                                    className="btn btn-sm btn-primary"
                                    onClick={handleSaveAccess}
                                    disabled={updateAccessLoading}
                                  >
                                    {updateAccessLoading ? (
                                      <span className="loading loading-spinner loading-xs"></span>
                                    ) : (
                                      <FiSave className="w-4 h-4" />
                                    )}
                                    {t('save')}
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline"
                                    onClick={handleCancelEdit}
                                    disabled={updateAccessLoading}
                                  >
                                    {t('cancel')}
                                  </button>
                                </div>
                              ) : (
                                <button className="btn btn-sm btn-outline" onClick={() => handleEditAccess(access)}>
                                  <FiEdit className="w-4 h-4 ml-1" />
                                  {t('edit')}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="alert alert-info">
                  <FiInfo className="w-5 h-5" />
                <span>{t('noAccess')}</span>
                </div>
              )}
            </div>
          )}

          {/* Student Homeworks */}
          {(hasAdminPrivileges || userRole === "Student") && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <FiUpload className="text-primary" />
                {hasAdminPrivileges ? t('submissions') : t('mySubmissions')}
              </h2>
              {submissionsLoading ? (
                <div className="flex justify-center py-8 bg-base-200 rounded-lg">
                  <div className="loading loading-spinner loading-md"></div>
                </div>
              ) : submissionsError ? (
                <div className="alert alert-error">
                  <FiX className="w-5 h-5" />
                  <span>{submissionsError}</span>
                </div>
              ) : studentSubmissions.length > 0 ? (
                <div className="bg-base-200 rounded-lg p-4">
                  <div className="overflow-x-auto">
                    <table className="table w-full">
                      <thead>
                        <tr>
                          <th>{t('student')}</th>
                          <th>{t('fileName')}</th>
                          <th>{t('uploadDate')}</th>
                          <th>{t('rating')}</th>
                          <th>{t('comment')}</th>
                          <th>{t('actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentSubmissions.map((submission) => (
                          <tr key={submission._id}>
                            <td>
                              <div className="flex items-center gap-2">
                                <div className="avatar avatar-placeholder">
                                  <div className="bg-primary text-primary-content rounded-full w-8">
                                    <span>{submission.studentId?.name?.charAt(0) || '?'}</span>
                                  </div>
                                </div>
                                <div>
                                  <div className="font-bold">{submission.studentId?.name || t('unknown')}</div>
                                  <div className="text-sm opacity-70">{submission.studentId?.email || ''}</div>
                                </div>
                              </div>
                            </td>
                            <td>{submission.fileName}</td>
                            <td>{new Date(submission.uploadedOn).toLocaleDateString()}</td>
                            <td>
                              <div className="rating rating-sm">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <input 
                                    key={star}
                                    type="radio" 
                                    name={`rating-${submission._id}`} 
                                    className="mask mask-star-2 bg-primary" 
                                    checked={submission.rating === star}
                                    readOnly
                                  />
                                ))}
                                {submission.rating && <span className="ml-2 text-sm">({submission.rating}/5)</span>}
                              </div>
                            </td>
                            <td className="max-w-xs truncate">
                              {submission.comment || 'No comment'}
                            </td>
                            <td>
                              <div className="flex gap-2">
                                <a
                                  href={submission.filePath}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-outline"
                                >
                                  <FiEye className={isRTL ? "ml-1" : "mr-1"} /> {t('view')}
                                </a>
                                <div className="flex gap-1">
                                  <button 
                                    className="btn btn-ghost btn-sm" 
                                    onClick={() => handleViewSubmission(submission)}
                                  >
                                    <FiEye className="w-4 h-4" />
                                  </button>
                                  {hasAdminPrivileges && (
                                    <button 
                                      className="btn btn-ghost btn-sm"
                                      onClick={() => handleOpenFeedback(submission)}
                                    >
                                      <FiMessageSquare className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : userRole === "Student" ? (
                <div className="alert alert-info">
                  <FiInfo className="w-5 h-5" />
                  <span>{t('noHomeworkUploaded')}</span>
                </div>
              ) : (
                <div className="alert alert-info">
                  <FiUsers className="w-5 h-5" />
                  <span>{t('noStudentUploads')}</span>
                </div>
              )}

              {/* Upload Homework Button (for students) */}
              {userRole === "Student" && (
                <div className="mt-4">
                  <button className="btn btn-outline btn-primary">
                    <FiUpload className={isRTL ? "ml-2" : "mr-2"} />
                    {t('uploadHomework')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Attachments */}
           <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">{t('attachments')}</h2>
            {renderAttachments(attachments.booklets, 'booklets', FiBook)}
            {renderAttachments(attachments.pdfsandimages, 'filesImages', FiFileText)}
            {renderAttachments(attachments.homeworks, 'homeworks', FiBook)}
            {renderAttachments(attachments.exams, 'exams', FiFileText)}

            {!attachments.booklets?.length &&
              !attachments.pdfsandimages?.length &&
              !attachments.homeworks?.length &&
              !attachments.exams?.length && (
                <div className="alert alert-info">
                  <span>{t('noAttachments')}</span>
                </div>
              )}
          </div>
        </div>


        {/* Sidebar - Lecture Details */}
        <div className="lg:col-span-1">
        <div className="bg-base-200 rounded-lg p-4 sticky top-4">
          <h2 className="text-xl font-semibold mb-4">{t('lectureDetails')}</h2>
          <ul className="space-y-4">
            <li className="flex items-center gap-3">
              <div className="bg-base-300 p-2 rounded-lg">
                <FiDollarSign className="text-primary" />
              </div>
              <div>
                <span className="text-sm text-base-content/70">{t('price')}</span>
                <p className="font-medium">{lecture.price} {t('points')}</p>
              </div>
            </li>

              {/* Created By */}
              <li className="flex items-center gap-3">
                <div className="bg-base-300 p-2 rounded-lg">
                  <FiUser className="text-primary" />
                </div>
                <div>
                   <span className="text-sm text-base-content/70">{t('lecturer')}</span>
                  <p className="font-medium">{lecture.createdBy?.name || t('unknown')}</p>
                </div>
              </li>

              {/* Subject */}
              <li className="flex items-center gap-3">
                <div className="bg-base-300 p-2 rounded-lg">
                  <FiBook className="text-primary" />
                </div>
                <div>
                  <span className="text-sm text-base-content/70">{t('subject')}</span>
                  <p className="font-medium">{getSubjectName()}</p>
                </div>
              </li>

              {/* Level */}
              <li className="flex items-center gap-3">
                <div className="bg-base-300 p-2 rounded-lg">
                  <FiLayers className="text-primary" />
                </div>
                <div>
                <span className="text-sm text-base-content/70">{t('level')}</span>
                  <p className="font-medium">{getLevelName()}</p>
                </div>
              </li>

              {/* Views */}
              <li className="flex items-center gap-3">
                <div className="bg-base-300 p-2 rounded-lg">
                  <FiEye className="text-primary" />
                </div>
                <div>
                   <span className="text-sm text-base-content/70">{t('viewsCount')}</span>
                  <p className="font-medium">{lecture.numberOfViews || 0}</p>
                </div>
              </li>

              {/* Teacher Allowed */}
              <li className="flex items-center gap-3">
                <div className="bg-base-300 p-2 rounded-lg">
                  {lecture.teacherAllowed ? <FiCheck className="text-success" /> : <FiEyeOff className="text-error" />}
                </div>
                <div>
                  <span className="text-sm text-base-content/70">{t('teacherAllowed')}</span>
                  <p className="font-medium">{lecture.teacherAllowed ? t('yes') : t('no')}</p>
                </div>
              </li>

              {/* Requires Exam */}
              <li className="flex items-center gap-3">
                <div className="bg-base-300 p-2 rounded-lg">
                  {lecture.requiresExam ? <FiCheck className="text-success" /> : <FiX className="text-error" />}
                </div>
                <div>
                  <span className="text-sm text-base-content/70">{t('requiresExam')}</span>
                  <p className="font-medium">{lecture.requiresExam ? t('yes') : t('no')}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Feedback Modal */}
      {showFeedbackModal && currentSubmission && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <FiMessageSquare className="text-primary" />
              {t('provideFeedback')}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">{t('rating')} (1-5)</span>
                </label>
                <div className="rating rating-lg">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <input 
                      key={star}
                      type="radio" 
                      name="rating" 
                      className="mask mask-star-2 bg-primary" 
                      checked={rating === star}
                      onChange={() => setRating(star)}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <label className="label">
                  <span className="label-text">{t('comment')}</span>
                </label>
                <textarea 
                  className="textarea textarea-bordered w-full h-32"
                  placeholder={t('enterYourFeedback')}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                ></textarea>
              </div>
              
              {feedbackError && (
                <div className="alert alert-error">
                  <FiX className="w-5 h-5" />
                  <span>{feedbackError}</span>
                </div>
              )}
              
              <div className="modal-action">
                <button 
                  className="btn btn-ghost"
                  onClick={() => setShowFeedbackModal(false)}
                  disabled={isSubmittingFeedback}
                >
                  {t('cancel')}
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handleSubmitFeedback}
                  disabled={isSubmittingFeedback}
                >
                  {isSubmittingFeedback ? (
                    <span className="loading loading-spinner"></span>
                  ) : (
                    t('submitFeedback')
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DetailedLectureView
