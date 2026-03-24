"use client"

import { useState, useEffect } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { useTranslation } from 'react-i18next';
import { getContainerById, createContainer, createLecture, createLectureAttachment } from "../../../routes/lectures"
import { getUserDashboard } from "../../../routes/auth-services"
import { FiBook, FiFolder, FiArrowLeft, FiArrowRight, FiPlus } from "react-icons/fi"
import LectureCreationModal from "../../../components/LectureCreationModal"
import ContainerCreationModal from "../../../components/ContainerCreationModal"

const ContainerDetailsPage = () => {
  const { t, i18n } = useTranslation('lecturesPage');
  const isRTL = i18n.language === "ar";
  const { containerId } = useParams()
  const navigate = useNavigate()
  const [container, setContainer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [userId, setUserId] = useState(null)

  // Creation modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creationLoading, setCreationLoading] = useState(false)
  const [creationError, setCreationError] = useState("")

  // Fetch container data
  const fetchContainer = async () => {
    try {
      const response = await getContainerById(containerId)
      if (response.status === "success") {
        setContainer(response.data)
      } else {
        setError("Failed to load container details")
      }
    } catch (err) {
      setError(err.message || "Failed to load data. Please try again later.")
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const dashRes = await getUserDashboard()
        if (!dashRes.success) {
          setError("Failed to load user info")
          return
        }

        const { userInfo } = dashRes.data.data
        setUserRole(userInfo.role)
        setUserId(userInfo._id)
        await fetchContainer()
      } catch (err) {
        setError(err.message || "Failed to load data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [containerId])

  const getAllowedChildType = () => {
    if (!container) return null
    switch (container.type.toLowerCase()) {
      case "course":
        return "year"
      case "year":
        return "term"
      case "term":
        return "month"
      case "month":
        return "lecture"
      default:
        return null
    }
  }

  const handleCreateLecture = async (
    lectureData,
    _unused,
    _unused2,
    thumbnailFile,
    attachmentFilesByCategory,
    attachmentLinksByCategory,
  ) => {
    setCreationLoading(true)
    setCreationError("")

    try {
      let response
      if (thumbnailFile) {
        const formData = new FormData()
        Object.keys(lectureData).forEach((key) => {
          if (lectureData[key] !== null && lectureData[key] !== undefined) {
            formData.append(key, lectureData[key])
          }
        })
        formData.append("thumbnail", thumbnailFile)
        response = await createLecture(formData)
      } else {
        response = await createLecture(lectureData)
      }

      if (response.status !== "success" && response.success !== true) {
        throw new Error(response.message || "Failed to create lecture")
      }

      // Handle attachments after successful lecture creation
      let lectureId = null
      if (response.data && response.data.lecture && response.data.lecture._id) {
        lectureId = response.data.lecture._id
      } else if (response.data && response.data._id) {
        lectureId = response.data._id
      } else if (response.data && response.data.lecture && response.data.lecture.id) {
        lectureId = response.data.lecture.id
      } else if (response.data && response.data.id) {
        lectureId = response.data.id
      }

      if (lectureId) {
        try {
          const formData = new FormData()
          const categories = ["pdfsandimages", "booklets", "homeworks", "exams"]

          categories.forEach((category) => {
            if (
              attachmentFilesByCategory &&
              attachmentFilesByCategory[category] &&
              attachmentFilesByCategory[category].length > 0
            ) {
              attachmentFilesByCategory[category].forEach((file) => {
                formData.append(category, file)
              })
            }
          })

          if (attachmentLinksByCategory) {
            if (attachmentLinksByCategory.homeworks && attachmentLinksByCategory.homeworks.trim() !== "") {
              formData.append("homeworks", attachmentLinksByCategory.homeworks)
            }
            if (attachmentLinksByCategory.exams && attachmentLinksByCategory.exams.trim() !== "") {
              formData.append("exams", attachmentLinksByCategory.exams)
            }
          }

          if (
            formData.has("pdfsandimages") ||
            formData.has("booklets") ||
            formData.has("homeworks") ||
            formData.has("exams")
          ) {
            await createLectureAttachment(lectureId, formData, true)
          }
        } catch (attachmentError) {
          console.error("Error uploading attachments:", attachmentError)
          setCreationError(`Lecture created but failed to upload attachments: ${attachmentError.message}`)
        }
      }

      await fetchContainer()
      return true
    } catch (err) {
      setCreationError(err.message)
      console.error("Creation error:", err)
      return false
    } finally {
      setCreationLoading(false)
    }
  }

  const handleCreateContainer = async (containerData) => {
    setCreationLoading(true)
    setCreationError("")

    try {

      const response = await createContainer(containerData)
      if (response.status !== "success" && response.success !== true) {
        throw new Error(response.message || `Failed to create ${containerData.type}`)
      }

      await fetchContainer()
      return true
    } catch (err) {
      setCreationError(err.message)
      console.error("Creation error:", err)
      return false
    } finally {
      setCreationLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6 p-8">
        <div className="h-8 bg-base-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-base-200 rounded-lg p-6 shadow-sm">
              <div className="h-6 bg-base-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-base-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-base-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

   if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">{t('containerDetails.error.title')}</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to={userRole === "Lecturer" ? "/dashboard/lecturer-dashboard" : "/dashboard/student-dashboard/promo-codes"}
            className="btn btn-outline px-6 py-2 rounded-full flex items-center gap-2 mx-auto"
          >
            {isRTL ? <FiArrowRight /> : <FiArrowLeft />} {t('containerDetails.buttons.backToDashboard')}
          </Link>
        </div>
      </div>
    )
  }


  const childType = getAllowedChildType()
  const creationLabel =
    childType === "lecture" ? "Lecture" : `${childType?.charAt(0).toUpperCase() + childType?.slice(1)}`
  const isLectureCreation = childType === "lecture"

    return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className={`mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between ${isRTL ? "sm:flex-row-reverse" : ""}`}>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
          >
            {isRTL ? <FiArrowRight className="text-lg" /> : <FiArrowLeft className="text-lg" />}
            <span className="font-medium">{t('containerDetails.buttons.backToDashboard')}</span>
          </button>
          <div className={`flex items-center gap-4 ${isRTL ? "sm:justify-start" : "sm:justify-end"}`}>
            {container.points > 0 && (
              <div className="bg-primary/30 px-4 py-2 rounded-full flex items-center gap-2">
                <span className="text-lg">🏅</span>
                <span className="font-medium">{container.points} {t('containerDetails.labels.points')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="mb-8 rounded-2xl p-4 shadow-sm sm:p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl">{container.name}</h1>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <span className="flex items-center gap-2">
                <FiFolder className="text-lg" />
                {t(`types.${container.type.toLowerCase()}`)}
              </span>
              <span className="flex items-center gap-2">
                <FiBook className="text-lg" />
                {container.subject?.name}
              </span>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {container.children?.map((child) => (
              <div
                key={child._id}
                className="group relative rounded-xl border border-base-300 hover:border-primary transition-all duration-300"
              >
                <div className="p-5 sm:p-6">
                  <div className="mb-4 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      {childType === "lecture" ? (
                        <FiBook className="text-primary text-xl" />
                      ) : (
                        <FiFolder className="text-primary text-xl" />
                      )}
                    </div>
                    <h3 className="font-medium">{child.name}</h3>
                  </div>

                  <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${isRTL ? "sm:flex-row-reverse" : ""}`}>
                    <span className="text-sm">{t(`types.${childType?.toLowerCase()}`) || container.type}</span>
                    <Link
                      to={
                        userRole === "Lecturer"
                          ? `/dashboard/lecturer-dashboard/${childType === "lecture" ? "lecture-display" : "container-details"}/${child._id}`
                          : `/dashboard/student-dashboard/${childType === "lecture" ? "lecture-display" : "container-details"}/${child._id}`
                      }
                      className={`inline-flex w-full items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-[1px] sm:w-auto ${isRTL ? "flex-row-reverse" : ""}`}
                      style={{
                        background: "var(--color-primary)",
                        color: "var(--color-primary-content)",
                        borderColor: "transparent",
                      }}
                    >
                      {t('containerDetails.buttons.viewDetails')}
                      {isRTL ? <FiArrowLeft className="h-4 w-4" /> : <FiArrowRight className="h-4 w-4" />}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {container.children?.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📭</div>
              <p className="">{t('containerDetails.emptyState.noContent')}</p>
            </div>
          )}
        </div>

        {/* Lecturer Actions */}
        {userRole === "Lecturer" && childType && (
          <div className={`flex gap-4 ${isRTL ? "justify-start" : "justify-end"}`}>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 sm:w-auto"
            >
              <FiPlus className="text-lg" />
              {t('containerDetails.buttons.add')} {t(`types.${creationLabel.toLowerCase()}`)}
            </button>
          </div>
        )}
      </div>

      {/* Lecture Creation Modal */}
      {isLectureCreation ? (
        <LectureCreationModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateLecture}
          containerId={containerId}
          userId={userId}
          containerLevel={container?.level?._id}
          containerSubject={container?.subject?._id}
          containerType={container?.type}
        />
      ) : (
        <ContainerCreationModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateContainer}
          containerId={containerId}
          userId={userId}
          containerLevel={container?.level?._id}
          containerSubject={container?.subject?._id}
          containerType={container?.type}
        />
      )}
    </div>
  )
}

export default ContainerDetailsPage
