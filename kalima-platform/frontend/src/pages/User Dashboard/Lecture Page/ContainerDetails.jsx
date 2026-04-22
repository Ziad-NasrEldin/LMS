"use client"

import { useState, useEffect } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { useTranslation } from 'react-i18next';
import { getContainerById, createContainer, updateContainer, createLecture, createLectureAttachment, deleteContainerById, updateLecture, updateLectureAttachment } from "../../../routes/lectures"
import { getCachedUserSummary } from "../../../routes/auth-services"
import { FiBook, FiFolder, FiArrowLeft, FiArrowRight, FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi"
import LectureCreationModal from "../../../components/LectureCreationModal"
import ContainerCreationModal from "../../../components/ContainerCreationModal"
import { designTokens } from "../../../constants/designTokens"
import { translateErrorMessage } from "../../../utils/errorTranslator"
import { objectToFormData } from "../../../utils/contentCreationPayloads"
import toast from "react-hot-toast"

const ContainerDetailsPage = () => {
  const { t, i18n } = useTranslation('lecturesPage');
  const isRTL = i18n.language === "ar";
  const TOKENS = designTokens.colors
  const SHADOWS = designTokens.shadows
  const GRADIENTS = designTokens.gradients
  const { containerId } = useParams()
  const navigate = useNavigate()
  const [container, setContainer] = useState(null)
  const [breadcrumbTrail, setBreadcrumbTrail] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [userId, setUserId] = useState(null)

  // Modal state
  const [modalState, setModalState] = useState({ mode: null, target: null })
  const [creationLoading, setCreationLoading] = useState(false)
  const [creationError, setCreationError] = useState("")
  const [deletingContainerId, setDeletingContainerId] = useState(null)

  const openCreateModal = () => {
    setModalState({ mode: "create", target: null })
    setCreationError("")
  }

  const openEditModal = (targetContainer) => {
    setModalState({ mode: "edit", target: targetContainer })
    setCreationError("")
  }

  const closeModal = () => {
    setModalState({ mode: null, target: null })
    setCreationError("")
  }

    // Fetch container data
  const normalizeContainerData = (response) => {
    const payload = response?.data ?? response

    if (!payload) return null
    if (payload.name && payload.type) return payload
    if (payload.container && payload.container.name && payload.container.type) return payload.container
    if (payload.data?.container && payload.data.container.name && payload.data.container.type) {
      return payload.data.container
    }
    if (payload.data && payload.data.name && payload.data.type) return payload.data

    return payload
  }

  const getContainerRoute = (id) => {
    let basePath
    if (userRole === "Lecturer") {
      basePath = "/dashboard/lecturer-dashboard"
    } else if (userRole === "Assistant") {
      basePath = "/dashboard/assistant-page"
    } else {
      basePath = "/dashboard/student-dashboard"
    }
    return basePath + "/container-details/" + id
  }

  const fetchContainer = async () => {
    try {
      const response = await getContainerById(containerId)
      if (response.status === "success") {
        const containerData = normalizeContainerData(response)
        setContainer(containerData)

        if (containerData) {
          const ancestors = Array.isArray(containerData.ancestors) ? containerData.ancestors : []
          setBreadcrumbTrail([...ancestors, containerData])
        } else {
          setBreadcrumbTrail([])
        }
      } else {
        setError(translateErrorMessage("Failed to load container details"))
      }
    } catch (err) {
      setError(translateErrorMessage(err.message || "Failed to load data. Please try again later."))
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const cachedUser = getCachedUserSummary()
        if (!cachedUser?.role) {
          setError(translateErrorMessage("Failed to load user info"))
          return
        }

        setUserRole(cachedUser.role)
        setUserId(cachedUser.id)
        await fetchContainer()
      } catch (err) {
        setError(translateErrorMessage(err.message || "Failed to load data. Please try again later."))
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
        const formData = objectToFormData(lectureData, [{ key: "thumbnail", file: thumbnailFile }])
        response = await createLecture(formData)
      } else {
        response = await createLecture(lectureData)
      }

      if (response.status !== "success" && response.success !== true) {
        throw new Error(translateErrorMessage(response.message || "Failed to create lecture"))
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
          setCreationError(
            `${translateErrorMessage("Lecture created but failed to upload attachments")}: ${translateErrorMessage(attachmentError.message)}`
          )
        }
      }

      await fetchContainer()
      return true
    } catch (err) {
      setCreationError(translateErrorMessage(err.message))
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
        throw new Error(translateErrorMessage(response.message || `Failed to create ${containerData.type}`))
      }

      await fetchContainer()
      return true
    } catch (err) {
      setCreationError(translateErrorMessage(err.message))
      console.error("Creation error:", err)
      return false
    } finally {
      setCreationLoading(false)
    }
  }

  const handleUpdateLecture = async (
    lectureId,
    lectureData,
    _unused,
    _unused2,
    thumbnailFile,
    attachmentFilesByCategory,
    attachmentLinksByCategory,
    existingAttachmentLinksByCategory,
  ) => {
    setCreationLoading(true)
    setCreationError("")

    try {
      let response
      if (thumbnailFile) {
        const formData = objectToFormData(lectureData, [{ key: "thumbnail", file: thumbnailFile }])
        response = await updateLecture(lectureId, formData)
      } else {
        response = await updateLecture(lectureId, lectureData)
      }

      if (response.status !== "success" && response.success !== true) {
        throw new Error(translateErrorMessage(response.message || "Failed to update lecture"))
      }

      // Handle attachments after successful lecture update
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
            await updateLectureAttachment(lectureId, formData, true)
          }
        } catch (attachmentError) {
          console.error("Error uploading attachments:", attachmentError)
          setCreationError(
            `${translateErrorMessage("Lecture updated but failed to upload attachments")}: ${translateErrorMessage(attachmentError.message)}`
          )
        }
      }

      await fetchContainer()
      return true
    } catch (err) {
      setCreationError(translateErrorMessage(err.message))
      console.error("Update error:", err)
      return false
    } finally {
      setCreationLoading(false)
    }
  }

  const handleUpdateContainer = async (containerIdToUpdate, containerData) => {
    setCreationLoading(true)
    setCreationError("")

    try {
      const response = await updateContainer(containerIdToUpdate, containerData)
      if (response.status !== "success" && response.success !== true) {
        throw new Error(translateErrorMessage(response.message || "Failed to update container"))
      }

      await fetchContainer()
      return true
    } catch (err) {
      setCreationError(translateErrorMessage(err.message))
      console.error("Update error:", err)
      return false
    } finally {
      setCreationLoading(false)
    }
  }

  const handleDeleteContainer = async (targetContainer, { isCurrent = false } = {}) => {
    const targetId = targetContainer?._id || targetContainer?.id
    if (!targetId || deletingContainerId) return

    const targetName = targetContainer?.name || "container"
    if (!window.confirm(t('containerDetails.confirmDelete', { name: targetName }))) return

    try {
      setDeletingContainerId(targetId)

      const result = await deleteContainerById(targetId)
      const isDeleteSuccess = result?.status === "success" || result?.success === true

      if (!isDeleteSuccess) {
        throw new Error(result?.message || t('containerDetails.messages.deleteError'))
      }

      toast.success(t('containerDetails.messages.deleteSuccess'))

      if (isCurrent) {
        const parentId = container?.parent?._id || container?.parent?.id || container?.parent
        if (parentId) {
          navigate(getContainerRoute(parentId))
        } else {
          // Navigate to the appropriate dashboard based on user role
          if (userRole === "Lecturer") {
            navigate("/dashboard/lecturer-dashboard")
          } else if (userRole === "Assistant") {
            navigate("/dashboard/assistant-page")
          } else {
            navigate("/dashboard/student-dashboard")
          }
        }
        return
      }

      await fetchContainer()
    } catch (err) {
      const message = translateErrorMessage(err.message || t('containerDetails.messages.deleteError'))
      toast.error(message)
      setCreationError(message)
    } finally {
      setDeletingContainerId(null)
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
            to={
              userRole === "Lecturer"
                ? "/dashboard/lecturer-dashboard"
                : userRole === "Assistant"
                ? "/dashboard/assistant-page"
                : userRole === "Parent"
                  ? "/dashboard/parent-dashboard/overview"
                  : "/dashboard/student-dashboard/overview"
            }
            className={`inline-flex items-center gap-2 rounded-full border px-6 py-2 font-semibold ${isRTL ? "flex-row-reverse" : ""}`}
            style={{
              background: "#FFFFFF",
              color: TOKENS.inkText,
              borderColor: "rgba(17,24,39,0.16)",
            }}
          >
            {isRTL ? <FiArrowRight /> : <FiArrowLeft />} {t('containerDetails.buttons.goBack')}
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
        <div className={`mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between ${isRTL ? "sm:flex-row-reverse" : ""}`}>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors w-full sm:w-auto"
            style={{
              color: TOKENS.slateText,
              borderColor: "rgba(17,24,39,0.12)",
              background: "#FFFFFF",
            }}
          >
            {isRTL ? <FiArrowRight className="text-lg flex-shrink-0" /> : <FiArrowLeft className="text-lg flex-shrink-0" />}
            <span className="font-medium whitespace-nowrap">{t('containerDetails.buttons.goBack')}</span>
          </button>
          <div className={`flex flex-wrap items-center gap-3 ${isRTL ? "justify-start" : "justify-end"}`}>
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
                <span className="font-medium text-sm sm:text-base">{container.points} {t('containerDetails.labels.points')}</span>
              </div>
            )}
            {(userRole === "Lecturer" || userRole === "Assistant") && container.type !== "lecture" && (
              <>
                <button
                  onClick={() => openEditModal(container)}
                  className="inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 font-semibold transition-all duration-200 hover:-translate-y-[1px] text-sm sm:text-base"
                  style={{
                    background: "#E0F2FE",
                    color: "#075985",
                    borderColor: "rgba(7,89,133,0.18)",
                  }}
                >
                  <FiEdit2 className="text-base flex-shrink-0" />
                  <span className="whitespace-nowrap">{isRTL ? "تعديل" : "Edit"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteContainer(container, { isCurrent: true })}
                  disabled={deletingContainerId !== null}
                  className="inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 text-sm sm:text-base"
                  style={{
                    background: "#FFF1F2",
                    color: "#BE123C",
                    borderColor: "rgba(190,24,93,0.18)",
                  }}
                >
                  <FiTrash2 className="text-base flex-shrink-0" />
                  <span className="whitespace-nowrap">{t('containerDetails.buttons.delete')}</span>
                </button>
              </>
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
          {breadcrumbTrail.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border px-3 py-3" style={{ background: "rgba(255,255,255,0.8)", borderColor: "rgba(17,24,39,0.08)" }}>
              {breadcrumbTrail.map((node, index) => {
                const nodeId = node._id || node.id
                const isCurrentNode = index === breadcrumbTrail.length - 1

                return (
                  <div key={nodeId} className="flex items-center gap-2">
                    {index > 0 && <span className="text-slate-900/30 px-1">/</span>}
                    <Link
                      to={getContainerRoute(nodeId)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-[1px] max-w-[200px] sm:max-w-[280px] ${isCurrentNode ? "shadow-sm" : "hover:bg-slate-100"}`}
                      style={{ background: isCurrentNode ? TOKENS.lightAquaMist : "#FFFFFF", color: TOKENS.inkText, borderColor: isCurrentNode ? "rgba(15,118,110,0.18)" : "rgba(17,24,39,0.12)" }}
                    >
                      <FiFolder className="text-base flex-shrink-0" />
                      <span className="truncate">{node.name}</span>
                    </Link>
                  </div>
                )
              })}
            </div>
          )}

          <div className="mb-8">
            <h1 className="mb-2 text-2xl font-bold break-words sm:text-3xl" style={{ color: TOKENS.inkText }}>{container.name}</h1>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {container.children?.map((child) => (
              <div
                key={child._id}
                className="group relative rounded-2xl border transition-all duration-300 hover:-translate-y-[2px] flex flex-col"
                style={{
                  background: "#FFFFFF",
                  borderColor: "rgba(17,24,39,0.08)",
                  boxShadow: SHADOWS.level1,
                }}
              >
                <div className="p-4 sm:p-5 flex flex-col flex-grow">
                  <div className="mb-4 flex items-start gap-3">
                    <div
                      className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl flex-shrink-0"
                      style={{ background: TOKENS.lightAquaMist, color: TOKENS.deepTeal }}
                    >
                      {childType === "lecture" ? (
                        <FiBook className="text-lg sm:text-xl" />
                      ) : (
                        <FiFolder className="text-lg sm:text-xl" />
                      )}
                    </div>
                    <h3 className="font-semibold text-base sm:text-lg leading-tight" style={{ color: TOKENS.inkText }}>{child.name}</h3>
                  </div>

                  <div className={`mt-auto flex flex-col gap-3 ${isRTL ? "items-start" : "items-end"}`}>
                    <span className="text-xs sm:text-sm px-2 py-1 rounded-full" style={{ color: TOKENS.slateText, background: "rgba(17,24,39,0.04)" }}>{t(`types.${childType?.toLowerCase()}`) || container.type}</span>
                    <div className={`flex flex-wrap gap-2 w-full ${isRTL ? "justify-start" : "justify-end"}`}>
                      {childType !== "lecture" && (userRole === "Lecturer" || userRole === "Assistant") && (
                        <>
                          <button
                            type="button"
                            onClick={() => openEditModal(child)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all duration-200 hover:-translate-y-[1px] flex-1 sm:flex-none min-w-[80px]"
                            style={{
                              background: "#E0F2FE",
                              color: "#075985",
                              borderColor: "rgba(7,89,133,0.18)",
                            }}
                          >
                            <FiEdit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span>{isRTL ? "تعديل" : "Edit"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteContainer(child)}
                            disabled={deletingContainerId !== null}
                            className="inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all duration-200 hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60 flex-1 sm:flex-none min-w-[80px]"
                            style={{
                              background: "#FFF1F2",
                              color: "#BE123C",
                              borderColor: "rgba(190,24,93,0.18)",
                            }}
                          >
                            <FiTrash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span>{t('containerDetails.buttons.delete')}</span>
                          </button>
                        </>
                      )}
                      <Link
                        to={
                          userRole === "Lecturer"
                            ? `/dashboard/lecturer-dashboard/${childType === "lecture" ? "lecture-display" : "container-details"}/${child._id}`
                            : userRole === "Assistant"
                            ? `/dashboard/assistant-page/${childType === "lecture" ? "lecture-display" : "container-details"}/${child._id}`
                            : `/dashboard/student-dashboard/${childType === "lecture" ? "lecture-display" : "container-details"}/${child._id}`
                        }
                        className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all duration-200 hover:-translate-y-[1px] flex-1 sm:flex-none min-w-[100px] ${isRTL ? "flex-row-reverse" : ""}`}
                        style={{
                          background: TOKENS.deepTeal,
                          color: "#F8FCFF",
                          borderColor: TOKENS.deepTeal,
                        }}
                      >
                        <span>{t('containerDetails.buttons.viewDetails')}</span>
                        {isRTL ? <FiArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" /> : <FiArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />}
                      </Link>
                    </div>
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

        {/* Lecturer and Assistant Actions */}
        {(userRole === "Lecturer" || userRole === "Assistant") && childType && (
          <div className={`flex gap-3 ${isRTL ? "justify-start" : "justify-end"} mt-6`}>
            <button
              onClick={openCreateModal}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border px-5 py-2.5 font-semibold transition-all duration-200 hover:-translate-y-[1px] text-sm sm:text-base"
              style={{
                background: TOKENS.deepTeal,
                color: "#F8FCFF",
                borderColor: TOKENS.deepTeal,
                boxShadow: SHADOWS.level2,
              }}
            >
              <FiPlus className="text-lg flex-shrink-0" />
              <span className="whitespace-nowrap">{t('containerDetails.buttons.add')} {t(`types.${creationLabel.toLowerCase()}`)}</span>
            </button>
          </div>
        )}
      </div>

      {/* Lecture Creation Modal */}
      {(() => {
        if (modalState.mode === "create" && isLectureCreation) {
          return (
            <LectureCreationModal
              isOpen={modalState.mode === "create"}
              onClose={closeModal}
              onSubmit={handleCreateLecture}
              containerId={containerId}
              userId={userId}
              containerLevel={container?.level?._id}
              containerSubject={container?.subject?._id}
              containerType={container?.type}
            />
          )
        }

        if (modalState.mode === "create") {
          return (
            <ContainerCreationModal
              isOpen={modalState.mode === "create"}
              onClose={closeModal}
              onSubmit={handleCreateContainer}
              containerId={containerId}
              userId={userId}
              containerLevel={container?.level?._id}
              containerSubject={container?.subject?._id}
              containerType={container?.type}
              mode="create"
            />
          )
        }

        if (modalState.mode === "edit" && modalState.target?.type === "lecture") {
          return (
            <LectureCreationModal
              isOpen={modalState.mode === "edit"}
              onClose={closeModal}
              onSubmit={handleUpdateLecture}
              containerId={containerId}
              userId={userId}
              containerLevel={modalState.target?.level?._id || modalState.target?.level}
              containerSubject={modalState.target?.subject?._id || modalState.target?.subject}
              containerType={modalState.target?.type}
              mode="edit"
              initialData={modalState.target}
              lectureId={modalState.target?._id || modalState.target?.id}
            />
          )
        }

        if (modalState.mode === "edit") {
          return (
            <ContainerCreationModal
              isOpen={modalState.mode === "edit"}
              onClose={closeModal}
              onSubmit={handleUpdateContainer}
              containerId={modalState.target?._id || modalState.target?.id}
              userId={userId}
              containerLevel={modalState.target?.level?._id || modalState.target?.level}
              containerSubject={modalState.target?.subject?._id || modalState.target?.subject}
              containerType={modalState.target?.type}
              mode="edit"
              initialData={modalState.target}
            />
          )
        }

        return null
      })()}
    </div>
  )
}

export default ContainerDetailsPage

