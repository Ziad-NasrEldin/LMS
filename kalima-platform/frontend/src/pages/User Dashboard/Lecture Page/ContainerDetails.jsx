"use client"

import { useState, useEffect } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { useTranslation } from 'react-i18next';
import { getContainerById, createContainer, createLecture, createLectureAttachment } from "../../../routes/lectures"
import { getUserDashboard } from "../../../routes/auth-services"
import { FiBook, FiFolder, FiArrowLeft, FiPlus } from "react-icons/fi"
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

  const handleCreateLecture = async (lectureData, attachmentFile, attachmentType) => {
    setCreationLoading(true)
    setCreationError("")

    try {

      const response = await createLecture(lectureData)

      if (response.status !== "success" && response.success !== true) {
        throw new Error(response.message || "Failed to create lecture")
      }

      // Handle attachment after successful lecture creation
      if (attachmentFile) {
        try {
          // Extract the lecture ID correctly from the response
          let lectureId = null

          // Check different possible locations for the lecture ID
          if (response.data && response.data.lecture && response.data.lecture._id) {
            lectureId = response.data.lecture._id
          } else if (response.data && response.data._id) {
            lectureId = response.data._id
          } else if (response.data && response.data.lecture && response.data.lecture.id) {
            lectureId = response.data.lecture.id
          } else if (response.data && response.data.id) {
            lectureId = response.data.id
          }

          if (!lectureId) {
            console.error("Could not find lecture ID in response:", response)
            throw new Error("Failed to extract lecture ID from response")
          }

          const attachmentData = {
            type: attachmentType,
            attachment: attachmentFile,
          }

          const attachmentResponse = await createLectureAttachment(lectureId, attachmentData)
        } catch (attachmentError) {
          console.error("Error uploading attachment:", attachmentError)
          setCreationError(`Lecture created but failed to upload attachment: ${attachmentError.message}`)
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
            <FiArrowLeft /> {t('containerDetails.buttons.backToDashboard')}
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
    <div className="min-h-screen p-8" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
          >
            <span className="text-lg">←</span>
            <span className="font-medium">{t('containerDetails.buttons.backToDashboard')}</span>
          </button>
          <div className="flex items-center gap-4">
            {container.points > 0 && (
              <div className="bg-primary/30 px-4 py-2 rounded-full flex items-center gap-2">
                <span className="text-lg">🏅</span>
                <span className="font-medium">{container.points} {t('containerDetails.labels.points')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="rounded-2xl shadow-sm p-8 mb-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{container.name}</h1>
            <div className="flex items-center gap-4">
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
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      {childType === "lecture" ? (
                        <FiBook className="text-primary text-xl" />
                      ) : (
                        <FiFolder className="text-primary text-xl" />
                      )}
                    </div>
                    <h3 className="font-medium">{child.name}</h3>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t(`types.${childType?.toLowerCase()}`) || container.type}</span>
                    <Link
                      to={
                        userRole === "Lecturer"
                          ? `/dashboard/lecturer-dashboard/${childType === "lecture" ? "lecture-display" : "container-details"}/${child._id}`
                          : `/dashboard/student-dashboard/${childType === "lecture" ? "lecture-display" : "container-details"}/${child._id}`
                      }
                      className="btn btn-ghost btn-sm text-primary hover:bg-primary/10 rounded-full"
                    >
                      {t('containerDetails.buttons.viewDetails')} →
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
          <div className="flex gap-4 justify-end">
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary px-6 py-3 rounded-full flex items-center gap-2"
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
