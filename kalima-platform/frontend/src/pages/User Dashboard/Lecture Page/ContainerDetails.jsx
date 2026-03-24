"use client"

import { useState, useEffect } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { useTranslation } from 'react-i18next';
import { getContainerById, createContainer, createLecture, createLectureAttachment } from "../../../routes/lectures"
import { getUserDashboard } from "../../../routes/auth-services"
import { FiBook, FiFolder, FiArrowLeft, FiArrowRight, FiPlus } from "react-icons/fi"
import LectureCreationModal from "../../../components/LectureCreationModal"
import ContainerCreationModal from "../../../components/ContainerCreationModal"
import { designTokens } from "../../../constants/designTokens"

const ContainerDetailsPage = () => {
  const { t, i18n } = useTranslation('lecturesPage');
  const isRTL = i18n.language === "ar";
  const TOKENS = designTokens.colors
  const SHADOWS = designTokens.shadows
  const GRADIENTS = designTokens.gradients
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
      <div
        className="min-h-screen p-4 sm:p-6 lg:p-8"
        style={{ background: `${GRADIENTS.pageAtmosphere}, ${TOKENS.creamSurface}` }}
      >
        <div className="mx-auto max-w-7xl animate-pulse space-y-6">
          <div className="h-8 w-1/4 rounded-xl" style={{ background: "rgba(17,24,39,0.1)" }}></div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border p-6"
                style={{
                  background: TOKENS.neutralCloud,
                  borderColor: "rgba(17,24,39,0.08)",
                  boxShadow: SHADOWS.level1,
                }}
              >
                <div className="mb-4 h-6 w-3/4 rounded-lg" style={{ background: "rgba(17,24,39,0.1)" }}></div>
                <div className="mb-2 h-4 w-1/2 rounded-lg" style={{ background: "rgba(17,24,39,0.08)" }}></div>
                <div className="h-4 w-1/3 rounded-lg" style={{ background: "rgba(17,24,39,0.08)" }}></div>
              </div>
          ))}
        </div>
      </div>
      </div>
    )
  }

   if (error) {
    return (
      <div
        className="flex min-h-screen items-center justify-center p-4"
        style={{ background: `${GRADIENTS.pageAtmosphere}, ${TOKENS.creamSurface}` }}
      >
        <div
          className="w-full max-w-md rounded-2xl border p-6 text-center"
          style={{
            background: "#FFF1F2",
            borderColor: "#FCA5A5",
            boxShadow: SHADOWS.level1,
          }}
        >
          <div className="mb-4 text-4xl text-red-500">⚠️</div>
          <h2 className="mb-2 text-2xl font-semibold" style={{ color: TOKENS.inkText }}>{t('containerDetails.error.title')}</h2>
          <p className="mb-6" style={{ color: TOKENS.slateText }}>{error}</p>
          <Link
            to={userRole === "Lecturer" ? "/dashboard/lecturer-dashboard" : "/dashboard/student-dashboard/promo-codes"}
            className={`inline-flex items-center gap-2 rounded-full border px-6 py-2 font-semibold ${isRTL ? "flex-row-reverse" : ""}`}
            style={{
              background: "#FFFFFF",
              color: TOKENS.inkText,
              borderColor: "rgba(17,24,39,0.16)",
            }}
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
    <div
      className="min-h-screen p-4 sm:p-6 lg:p-8"
      dir={isRTL ? "rtl" : "ltr"}
      style={{ background: `${GRADIENTS.pageAtmosphere}, ${TOKENS.creamSurface}` }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className={`mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between ${isRTL ? "sm:flex-row-reverse" : ""}`}>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors sm:text-base"
            style={{
              color: TOKENS.slateText,
              borderColor: "rgba(17,24,39,0.12)",
              background: "#FFFFFF",
            }}
          >
            {isRTL ? <FiArrowRight className="text-lg" /> : <FiArrowLeft className="text-lg" />}
            <span className="font-medium">{t('containerDetails.buttons.backToDashboard')}</span>
          </button>
          <div className={`flex items-center gap-4 ${isRTL ? "sm:justify-start" : "sm:justify-end"}`}>
            {container.points > 0 && (
              <div
                className="flex items-center gap-2 rounded-full border px-4 py-2"
                style={{
                  background: TOKENS.lightAquaMist,
                  borderColor: "rgba(15,118,110,0.22)",
                  color: TOKENS.deepTeal,
                }}
              >
                <span className="text-lg">🏅</span>
                <span className="font-medium">{container.points} {t('containerDetails.labels.points')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div
          className="mb-8 rounded-[2rem] border p-4 sm:p-6 lg:p-8"
          style={{
            background: TOKENS.neutralCloud,
            borderColor: "rgba(17,24,39,0.08)",
            boxShadow: SHADOWS.level1,
          }}
        >
          <div className="mb-8">
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl" style={{ color: TOKENS.inkText }}>{container.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm sm:gap-4 sm:text-base" style={{ color: TOKENS.slateText }}>
              <span className="flex items-center gap-2 rounded-full border px-3 py-1.5" style={{ borderColor: "rgba(17,24,39,0.12)", background: "#FFFFFF" }}>
                <FiFolder className="text-lg" />
                {t(`types.${container.type.toLowerCase()}`)}
              </span>
              <span className="flex items-center gap-2 rounded-full border px-3 py-1.5" style={{ borderColor: "rgba(17,24,39,0.12)", background: "#FFFFFF" }}>
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
                className="group relative rounded-2xl border transition-all duration-300 hover:-translate-y-[2px]"
                style={{
                  background: "#FFFFFF",
                  borderColor: "rgba(17,24,39,0.08)",
                  boxShadow: SHADOWS.level1,
                }}
              >
                <div className="p-5 sm:p-6">
                  <div className="mb-4 flex items-start gap-4">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl"
                      style={{ background: TOKENS.lightAquaMist, color: TOKENS.deepTeal }}
                    >
                      {childType === "lecture" ? (
                        <FiBook className="text-xl" />
                      ) : (
                        <FiFolder className="text-xl" />
                      )}
                    </div>
                    <h3 className="font-semibold" style={{ color: TOKENS.inkText }}>{child.name}</h3>
                  </div>

                  <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${isRTL ? "sm:flex-row-reverse" : ""}`}>
                    <span className="text-sm" style={{ color: TOKENS.slateText }}>{t(`types.${childType?.toLowerCase()}`) || container.type}</span>
                    <Link
                      to={
                        userRole === "Lecturer"
                          ? `/dashboard/lecturer-dashboard/${childType === "lecture" ? "lecture-display" : "container-details"}/${child._id}`
                          : `/dashboard/student-dashboard/${childType === "lecture" ? "lecture-display" : "container-details"}/${child._id}`
                      }
                      className={`inline-flex w-full items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-[1px] sm:w-auto ${isRTL ? "flex-row-reverse" : ""}`}
                      style={{
                        background: TOKENS.deepTeal,
                        color: "#F8FCFF",
                        borderColor: TOKENS.deepTeal,
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
            <div
              className="rounded-2xl border py-12 text-center"
              style={{
                background: "#ECFEFF",
                borderColor: "rgba(8,145,178,0.25)",
                color: TOKENS.slateText,
              }}
            >
              <div className="text-4xl mb-4">📭</div>
              <p>{t('containerDetails.emptyState.noContent')}</p>
            </div>
          )}
        </div>

        {/* Lecturer Actions */}
        {userRole === "Lecturer" && childType && (
          <div className={`flex gap-4 ${isRTL ? "justify-start" : "justify-end"}`}>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border px-6 py-3 font-semibold transition-all duration-200 hover:-translate-y-[1px] sm:w-auto"
              style={{
                background: TOKENS.deepTeal,
                color: "#F8FCFF",
                borderColor: TOKENS.deepTeal,
                boxShadow: SHADOWS.level2,
              }}
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
