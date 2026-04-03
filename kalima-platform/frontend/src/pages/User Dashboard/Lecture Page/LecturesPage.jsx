"use client"

import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { getUserDashboard } from "../../../routes/auth-services"
import { getAllSubjects } from "../../../routes/courses"
import { getAllLevels } from "../../../routes/levels"
import { createLecture, updateLecture, createLectureAttachment, getLectureById } from "../../../routes/lectures"
import { getAllLectures } from "../../../routes/lectures"
import LectureCreationModal from "../../../components/LectureCreationModal"
import { designTokens } from "../../../constants/designTokens"
import { resolveUploadUrl } from "../../../utils/uploadUrl"
import { translateErrorMessage } from "../../../utils/errorTranslator"
import { objectToFormData } from "../../../utils/contentCreationPayloads"
import DSSelect from "../../../components/DSSelect"

const MyLecturesPage = () => {
  const { t, i18n } = useTranslation("lecturesPage")
  const isRTL = i18n.language === "ar"
  const location = useLocation()
  const navigate = useNavigate()
  const TOKENS = designTokens.colors
  const SHADOWS = designTokens.shadows
  const sortLecturesNewestFirst = (left, right) => {
    const leftTime = new Date(left.sortDate || left.createdAt || 0).getTime()
    const rightTime = new Date(right.sortDate || right.createdAt || 0).getTime()
    return rightTime - leftTime
  }
  const [lectures, setLectures] = useState([])
  const [allLectures, setAllLectures] = useState([]) // Store all lectures before pagination
  const [subjects, setSubjects] = useState([])
  const [levels, setLevels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [userId, setUserId] = useState(null)
  const [lectureModalState, setLectureModalState] = useState({ mode: null, target: null })
  const [creationLoading, setCreationLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState("")
  const [selectedLevelFilter, setSelectedLevelFilter] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(8)
  const [totalPages, setTotalPages] = useState(0)
  const isStudentLikeRole = userRole === "Student" || userRole === "Parent"
  const isAdminLikeRole = ["Admin", "Subadmin", "Moderator"].includes(userRole)

  const openCreateLectureModal = () => {
    setLectureModalState({ mode: "create", target: null })
  }

  const normalizeLectureEditTarget = (lecture) => {
    if (!lecture) return null

    const lectureData = lecture.container || lecture

    return {
      ...lectureData,
      id: lectureData._id || lectureData.id,
      _id: lectureData._id || lectureData.id,
    }
  }

  const openEditLectureModal = async (lecture) => {
    const lectureId = lecture?._id || lecture?.id

    if (!lectureId) {
      setError(translateErrorMessage("Missing lecture id for edit"))
      return
    }

    try {
      const response = await getLectureById(lectureId)
      if (response.success && response.data?.container) {
        setLectureModalState({
          mode: "edit",
          target: normalizeLectureEditTarget(response.data.container),
        })
        return
      }
    } catch (error) {
      console.error("Failed to fetch full lecture data for edit:", error)
    }

    // Fallback to the already available row data if the detail request fails.
    setLectureModalState({
      mode: "edit",
      target: normalizeLectureEditTarget(lecture),
    })
  }

  const closeLectureModal = () => {
    setLectureModalState({ mode: null, target: null })
  }

  useEffect(() => {
    const lectureEditTarget = location.state?.lectureEditTarget

    if (!lectureEditTarget || lectureModalState.mode) {
      return
    }

    const lectureEditTargetId = lectureEditTarget._id || lectureEditTarget.id

    if (!lectureEditTargetId || allLectures.length === 0) {
      return
    }

    const matchedLecture = allLectures.find((lecture) => String(lecture.id) === String(lectureEditTargetId))

    if (!matchedLecture) {
      return
    }

    void openEditLectureModal(matchedLecture)
    navigate(location.pathname, { replace: true, state: null })
  }, [allLectures, lectureModalState.mode, location.pathname, location.state, navigate])

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // First get subjects and levels (common for all roles)
        const subjectsRes = await getAllSubjects();
        const levelsRes = await getAllLevels();

        if (subjectsRes.success) {
          setSubjects(subjectsRes.data || []);
        } else {
          console.error("Failed to fetch subjects:", subjectsRes.error);
          setSubjects([]);
          setError(translateErrorMessage("Failed to load subjects, but you can continue."));
        }

        if (levelsRes.success) {
          setLevels(levelsRes.data || []);
        } else {
          console.error("Failed to fetch levels:", levelsRes.error);
          setLevels([]);
          setError(prev => prev ? `${prev}` : translateErrorMessage("Failed to load levels, but you can continue."));
        }

        // Then determine user role and fetch appropriate data
        const userInfoResult = await getUserDashboard({
          params: { fields: "userInfo", limit: 1 }
        });

        if (!userInfoResult.success) {
          throw new Error(translateErrorMessage("Failed to fetch user info"));
        }

        const userRole = userInfoResult.data.data.userInfo.role;
        setUserRole(userRole);
        setUserId(userInfoResult.data.data.userInfo.id);

        // Role-specific data fetching
        if (["Admin", "Subadmin", "Moderator"].includes(userRole)) {
          // Use getAllLectures for admin roles
          const allLecturesResult = await getAllLectures({ limit: 200 });

          if (allLecturesResult.status === "success") {
            const lecturesData = allLecturesResult.data.containers.map((lecture) => ({
              id: lecture._id,
              name: lecture.name,
              subject: lecture.subject,
              level: lecture.level,
              price: lecture.price,
              videoLink: lecture.videoLink,
              lecture_type: lecture.lecture_type,
              requiresExam: lecture.requiresExam,
              examConfig: lecture.examConfig,
              lecturer: lecture.createdBy,
              thumbnail: lecture.thumbnail,
                createdAt: lecture.createdAt,
              sortDate: lecture.createdAt || null,
            }));
            setAllLectures(lecturesData.sort(sortLecturesNewestFirst));
          } else {
            throw new Error(translateErrorMessage(allLecturesResult.message || "Failed to fetch lectures"));
          }
        } else if (userRole === "Lecturer") {
          // Use getUserDashboard with specific fields for lecturers
          const result = await getUserDashboard({
            params: { fields: "userInfo,lectures,containers", limit: 500 },
          });

          if (result.success) {
            const { containers, lectures } = result.data.data;

            const containerLectures = containers
              ?.filter(c => c.type === "lecture")
              .map(lecture => ({
                id: lecture._id,
                name: lecture.name,
                subject: lecture.subject,
                level: lecture.level,
                price: lecture.price,
                videoLink: lecture.videoLink,
                lecture_type: lecture.lecture_type || "Unknown",
                requiresExam: lecture.requiresExam || false,
                examConfig: lecture.examConfig || null,
                lecturer: result.data.data.userInfo,
                thumbnail: lecture.thumbnail ? resolveUploadUrl(lecture.thumbnail, "lecture_thumbnails") : null,
                  createdAt: lecture.createdAt || null,
                sortDate: lecture.createdAt || null,
              })) || [];

            const standaloneLectures = lectures?.map(lecture => ({
              id: lecture._id,
              name: lecture.name,
              subject: lecture.subject,
              level: lecture.level,
              price: lecture.price,
              lecture_type: lecture.lecture_type,
              requiresExam: lecture.requiresExam || false,
              examConfig: lecture.examConfig || null,
              lecturer: result.data.data.userInfo,
              thumbnail: lecture.thumbnail ? resolveUploadUrl(lecture.thumbnail, "lecture_thumbnails") : null,
              createdAt: lecture.createdAt || null,
            })) || [];

            const allLecturesCombined = [...containerLectures, ...standaloneLectures].sort(sortLecturesNewestFirst);
            setAllLectures(allLecturesCombined);
          } else {
            throw new Error(translateErrorMessage(result.error || "Failed to fetch lecturer data"));
          }
        } else if (userRole === "Student" || userRole === "Parent") {
          // Handle student case
          const result = await getUserDashboard({
            params: { fields: "purchaseHistory", limit: 500 },
          });

          if (result.success) {
            const formatPurchaseDate = (purchaseDate) =>
              new Date(purchaseDate).toLocaleString(i18n.language || "en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              });

            const toLectureCard = (purchase, lectureLike, fallbackName) => ({
              id: lectureLike?._id || purchase._id,
              name:
                lectureLike?.name ||
                fallbackName ||
                purchase.description?.replace("Purchased container ", "").split(" for ")[0] ||
                "Lecture",
              price: lectureLike?.price ?? purchase.points,
              videoLink: lectureLike?.videoLink,
              lecture_type: lectureLike?.lecture_type,
              purchasedAt: formatPurchaseDate(purchase.purchasedAt),
              lecturer: purchase.lecturer,
              subject: lectureLike?.subject,
              level: lectureLike?.level,
              thumbnail: lectureLike?.thumbnail ? resolveUploadUrl(lectureLike.thumbnail, "lecture_thumbnails") : null,
              sortDate: purchase.purchasedAt || null,
            });

            const lecturesData = (result.data.data.purchaseHistory || []).flatMap((purchase) => {
              // Direct lecture purchase
              if (purchase.lecture) {
                return [toLectureCard(purchase, purchase.lecture)];
              }

              // Legacy/standalone lecture purchase represented as a lecture container
              if (purchase.container && purchase.container.type === "lecture") {
                return [
                  toLectureCard(
                    purchase,
                    purchase.container,
                    purchase.container.name
                  ),
                ];
              }

              // Purchased course/month/term/year with preloaded lecture descendants
              if (
                purchase.container &&
                Array.isArray(purchase.container.lectures) &&
                purchase.container.lectures.length > 0
              ) {
                return purchase.container.lectures.map((lecture) =>
                  toLectureCard(purchase, lecture)
                );
              }

              return [];
            });

            // Keep the most recent purchase date for duplicated lectures (e.g. direct + course purchase)
            const uniqueLectures = Array.from(
              lecturesData.reduce((acc, lecture) => {
                const lectureId = lecture.id?.toString();
                if (!lectureId) return acc;

                const existing = acc.get(lectureId);
                if (!existing) {
                  acc.set(lectureId, lecture);
                  return acc;
                }

                const existingTime = new Date(existing.sortDate || 0).getTime();
                const currentTime = new Date(lecture.sortDate || 0).getTime();
                if (currentTime > existingTime) {
                  acc.set(lectureId, lecture);
                }

                return acc;
              }, new Map()).values()
            );

            setAllLectures(uniqueLectures.sort(sortLecturesNewestFirst));
          }
        }
      } catch (err) {
        console.error("Error in fetchInitialData:", err);
        setError(translateErrorMessage(err.message || "Failed to load data, but you can continue."));
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData()
  }, [])

  useEffect(() => {
    let filteredLectures = [...allLectures]

    if (!isAdminLikeRole) {
      if (selectedSubjectFilter) {
        filteredLectures = filteredLectures.filter((l) => l.subject?._id === selectedSubjectFilter)
      }

      if (selectedLevelFilter) {
        filteredLectures = filteredLectures.filter((l) => l.level?._id === selectedLevelFilter)
      }
    }

    if (searchTerm.trim()) {
      const normalizedSearch = searchTerm.trim().toLowerCase()
      filteredLectures = filteredLectures.filter((lecture) => {
        const name = String(lecture.name || "").toLowerCase()
        const subjectName = String(lecture.subject?.name || "").toLowerCase()
        const lecturerName = String(lecture.lecturer?.name || "").toLowerCase()
        const lectureType = String(lecture.lecture_type || "").toLowerCase()
        return (
          name.includes(normalizedSearch) ||
          subjectName.includes(normalizedSearch) ||
          lecturerName.includes(normalizedSearch) ||
          lectureType.includes(normalizedSearch)
        )
      })
    }

    const computedTotalPages = Math.max(1, Math.ceil(filteredLectures.length / itemsPerPage))
    if (currentPage > computedTotalPages) {
      setCurrentPage(computedTotalPages)
      return
    }

    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedLectures = filteredLectures.slice(startIndex, startIndex + itemsPerPage)

    setLectures(paginatedLectures)
    setTotalPages(computedTotalPages)
  }, [allLectures, selectedSubjectFilter, selectedLevelFilter, searchTerm, currentPage, itemsPerPage, isAdminLikeRole])

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage)
  }

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value))
    setCurrentPage(1)
  }

  const uploadLectureAttachments = async (
    lectureId,
    attachmentFilesByCategory,
    attachmentLinksByCategory,
    existingAttachmentLinksByCategory = {},
  ) => {
    const formData = new FormData()
    const categories = ["pdfsandimages", "booklets", "homeworks", "exams"]

    categories.forEach((category) => {
      if (attachmentFilesByCategory && attachmentFilesByCategory[category] && attachmentFilesByCategory[category].length > 0) {
        attachmentFilesByCategory[category].forEach((file) => {
          formData.append(category, file)
        })
      }
    })

    if (attachmentLinksByCategory) {
      const nextHomeworkLink = attachmentLinksByCategory.homeworks?.trim() || ""
      const existingHomeworkLink = existingAttachmentLinksByCategory.homeworks?.trim() || ""
      if (nextHomeworkLink && nextHomeworkLink !== existingHomeworkLink) {
        formData.append("homeworks", nextHomeworkLink)
      }
      const nextExamLink = attachmentLinksByCategory.exams?.trim() || ""
      const existingExamLink = existingAttachmentLinksByCategory.exams?.trim() || ""
      if (nextExamLink && nextExamLink !== existingExamLink) {
        formData.append("exams", nextExamLink)
      }
    }

    if (formData.has("pdfsandimages") || formData.has("booklets") || formData.has("homeworks") || formData.has("exams")) {
      await createLectureAttachment(lectureId, formData, true)
    }
  }

  // Batch upload all attachments and links for all categories in one request
  const handleLectureSubmit = async (
    lectureIdOrData,
    lectureDataOrUnused,
    _unused2,
    thumbnailFile,
    attachmentFilesByCategory,
    attachmentLinksByCategory,
    existingAttachmentLinksByCategory,
  ) => {
    setCreationLoading(true)
    setError(null)
    setSuccessMessage("")

    const isEditMode = typeof lectureIdOrData === "string"
    const lectureId = isEditMode ? lectureIdOrData : null
    const lectureData = isEditMode ? lectureDataOrUnused : lectureIdOrData

    try {
      let response
      if (thumbnailFile) {
        const formData = objectToFormData(lectureData, [{ key: "thumbnail", file: thumbnailFile }])
        response = isEditMode ? await updateLecture(lectureId, formData) : await createLecture(formData)
      } else {
        response = isEditMode ? await updateLecture(lectureId, lectureData) : await createLecture(lectureData)
      }

      if (response.status !== "success" && response.success !== true) {
        throw new Error(
          translateErrorMessage(response.message || (isEditMode ? "Failed to update lecture" : "Failed to create lecture"))
        )
      }

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
          await uploadLectureAttachments(
            lectureId,
            attachmentFilesByCategory,
            attachmentLinksByCategory,
            existingAttachmentLinksByCategory,
          )
        } catch (attachmentError) {
          console.error("Error uploading attachments:", attachmentError)
          setError(isEditMode
            ? `Lecture updated but failed to upload attachments: ${attachmentError.message}`
            : `Lecture created but failed to upload attachments: ${attachmentError.message}`)
        }
      }

      await refetchLectureData()

      setSuccessMessage(
        isEditMode
          ? t("lecturesPage.messages.lectureUpdatedSuccessfully", "Lecture updated successfully!")
          : t("lecturesPage.messages.lectureCreatedSuccessfully", "Lecture created successfully!"),
      )

      setTimeout(() => {
        setSuccessMessage("")
      }, 5000)

      return true
    } catch (err) {
      setError(
        `${translateErrorMessage(isEditMode ? "Failed to update lecture" : "Failed to create lecture")}: ${translateErrorMessage(err.message)}`
      )
      return false
    } finally {
      setCreationLoading(false)
    }
  }

  const refetchLectureData = async () => {
    try {
      if (["Admin", "Subadmin", "Moderator"].includes(userRole)) {
        const allLecturesResult = await getAllLectures({ limit: 200 });

        if (allLecturesResult.status === "success") {
          const lecturesData = allLecturesResult.data.containers.map((lecture) => ({
            id: lecture._id,
            name: lecture.name,
            subject: lecture.subject,
            level: lecture.level,
            price: lecture.price,
            videoLink: lecture.videoLink,
            lecture_type: lecture.lecture_type,
            requiresExam: lecture.requiresExam,
            examConfig: lecture.examConfig,
            lecturer: lecture.createdBy,
            thumbnail: lecture.thumbnail,
            createdAt: lecture.createdAt,
          }));
          setAllLectures(lecturesData);
        }
      } else if (userRole === "Lecturer") {
        const result = await getUserDashboard({
          params: { fields: "lectures,containers", limit: 500 },
        });

        if (result.success) {
          const { containers, lectures } = result.data.data;

          const containerLectures = containers
            ?.filter(c => c.type === "lecture")
            .map(lecture => ({
              id: lecture._id,
              name: lecture.name,
              subject: lecture.subject,
              level: lecture.level,
              price: lecture.price,
              videoLink: lecture.videoLink,
              lecture_type: lecture.lecture_type || "Unknown",
              requiresExam: lecture.requiresExam || false,
              examConfig: lecture.examConfig || null,
              lecturer: { id: userId, name: result.data.data.userInfo?.name },
              thumbnail: lecture.thumbnail ? resolveUploadUrl(lecture.thumbnail, "lecture_thumbnails") : null,
              createdAt: lecture.createdAt || null,
            })) || [];

          const standaloneLectures = lectures?.map(lecture => ({
            id: lecture._id,
            name: lecture.name,
            subject: lecture.subject,
            level: lecture.level,
            price: lecture.price,
            lecture_type: lecture.lecture_type,
            requiresExam: lecture.requiresExam || false,
            examConfig: lecture.examConfig || null,
            lecturer: { id: userId, name: result.data.data.userInfo?.name },
            thumbnail: lecture.thumbnail ? resolveUploadUrl(lecture.thumbnail, "lecture_thumbnails") : null,
            createdAt: lecture.createdAt || null,
          })) || [];

          const allLecturesCombined = [...containerLectures, ...standaloneLectures];
          setAllLectures(allLecturesCombined);
        }
      }
    } catch (error) {
      console.error("Error refetching lecture data:", error);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    )

  return (
      <div className="container mx-auto p-4 sm:p-6" dir={isRTL ? "rtl" : "ltr"}>
        <h1 className="text-2xl font-bold mb-2" style={{ color: TOKENS.inkText }}>
          {["Lecturer", "Admin", "Subadmin", "Moderator"].includes(userRole)
            ? t("lecturesPage.pageTitle.manage")
            : t("lecturesPage.pageTitle.purchased")}
        </h1>
        <p className="text-sm opacity-80 mt-2 mb-5" style={{ color: TOKENS.slateText }}>{t("lecturesPage.pageDescription")}</p>

        {successMessage && (
            <div className="mb-4 rounded-[1.4rem] border p-4" style={{ background: "rgba(20,106,120,0.1)", borderColor: "rgba(20,106,120,0.18)", color: TOKENS.deepTeal }}>
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{successMessage}</span>
            <button className="btn btn-sm btn-ghost" onClick={() => setSuccessMessage("")}>
              {t("lecturesPage.buttons.close")}
            </button>
          </div>
        )}

        {error && (
            <div className="mb-4 rounded-[1.4rem] border p-4" style={{ background: "#FFF1F2", borderColor: "#FECACA", color: TOKENS.inkText }}>
            <span>{error}</span>
            <button className="btn btn-sm btn-ghost" onClick={() => setError(null)}>
              {t("lecturesPage.buttons.close")}
            </button>
          </div>
        )}

        <div className="mb-4 flex flex-col md:flex-row justify-between gap-4 rounded-[1.4rem] border p-4" style={{ background: "rgba(255,255,255,0.78)", borderColor: "rgba(17,24,39,0.08)" }}>
          <div className="flex flex-col md:flex-row gap-4 flex-1">
            <input
              type="text"
              className="input w-full md:w-80 font-medium border-2 focus:outline-none focus:ring-0 rounded-full transition-colors font-sans"
              style={{ backgroundColor: TOKENS.neutralCloud, borderColor: "transparent", color: TOKENS.deepTeal }}
              onFocus={(e) => { e.target.style.borderColor = TOKENS.softCyanTeal; e.target.style.backgroundColor = "#fff"; }}
              onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.backgroundColor = TOKENS.neutralCloud; }}
              value={searchTerm}
              placeholder={t("lecturesPage.filters.searchLecture")}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
            />
            <DSSelect
              className="select w-full md:w-64 font-medium border-2 focus:outline-none focus:ring-0 rounded-full transition-colors font-sans"
              style={{ backgroundColor: TOKENS.neutralCloud, borderColor: "transparent", color: TOKENS.deepTeal }} onFocus={(e) => { e.target.style.borderColor = TOKENS.softCyanTeal; e.target.style.backgroundColor = "#fff"; }} onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.backgroundColor = TOKENS.neutralCloud; }}
              value={selectedSubjectFilter}
              onChange={(e) => {
                setSelectedSubjectFilter(e.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="">{t("lecturesPage.filters.allSubjects")}</option>
              {subjects?.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.name}
                </option>
              ))}
            </DSSelect>

            <DSSelect
              className="select w-full md:w-64 font-medium border-2 focus:outline-none focus:ring-0 rounded-full transition-colors font-sans"
              style={{ backgroundColor: TOKENS.neutralCloud, borderColor: "transparent", color: TOKENS.deepTeal }} onFocus={(e) => { e.target.style.borderColor = TOKENS.softCyanTeal; e.target.style.backgroundColor = "#fff"; }} onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.backgroundColor = TOKENS.neutralCloud; }}
              value={selectedLevelFilter}
              onChange={(e) => {
                setSelectedLevelFilter(e.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="">{t("lecturesPage.filters.allLevels")}</option>
              {levels?.map((level) => (
                <option key={level._id} value={level._id}>
                  {t(`gradeLevels.${level.name}`, { ns: "common" })}
                </option>
              ))}
            </DSSelect>
          </div>
          {["Lecturer", "Admin"].includes(userRole) && (
            <button
              onClick={openCreateLectureModal}
              className="btn border-none"
              style={{ background: TOKENS.deepTeal, color: "#F8FCFF" }}
            >
              {t("lecturesPage.buttons.createNewLecture")}
            </button>
          )}

          <DSSelect
            className="select w-full md:w-48 font-medium border-2 focus:outline-none focus:ring-0 rounded-[1.4rem] transition-colors font-sans"
            style={{ backgroundColor: TOKENS.neutralCloud, borderColor: "transparent", color: TOKENS.deepTeal }} onFocus={(e) => { e.target.style.borderColor = TOKENS.softCyanTeal; e.target.style.backgroundColor = "#fff"; }} onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.backgroundColor = TOKENS.neutralCloud; }}
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
          >
            <option value={8}>{t("lecturesPage.itemsPerPage", { count: 8 })}</option>


          </DSSelect>
        </div>

        <LectureCreationModal
          isOpen={Boolean(lectureModalState.mode)}
          onClose={closeLectureModal}
          onSubmit={handleLectureSubmit}
          containerId={null}
          userId={userId}
          containerLevel={null}
          containerSubject={null}
          containerType="month"
          mode={lectureModalState.mode || "create"}
          initialData={lectureModalState.target}
          lectureId={lectureModalState.target?.id || lectureModalState.target?._id || null}
        />

        <div className="md:hidden space-y-3">
          {lectures?.map((lecture) => (
            <div key={lecture.id} className="rounded-2xl border p-4" style={{ background: "rgba(255,255,255,0.82)", borderColor: "rgba(17,24,39,0.08)", boxShadow: SHADOWS.level1 }}>
              <div className="flex items-start gap-3">
                {lecture.thumbnail ? (
                  <img
                    src={resolveUploadUrl(lecture.thumbnail, "lecture_thumbnails") || "/placeholder.svg"}
                    alt={lecture.name}
                    className="h-14 w-14 rounded-xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-xl bg-base-200 text-xs flex items-center justify-center flex-shrink-0">N/A</div>
                )}

                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold leading-5 break-words">{lecture.name}</h3>
                  <div className="mt-2 text-xs opacity-80 space-y-1">
                    {(isStudentLikeRole || isAdminLikeRole) && (
                      <p className="break-words"><span className="font-medium">{t("lecturesPage.tableHeaders.lecturer")}: </span>{lecture.lecturer?.name || t("lecturesPage.unknown")}</p>
                    )}
                    <p className="break-words"><span className="font-medium">{t("lecturesPage.tableHeaders.subject")}: </span>{lecture.subject?.name || t("lecturesPage.notSpecified")}</p>
                    <p><span className="font-medium">{t("lecturesPage.tableHeaders.level")}: </span>{t(`gradeLevels.${lecture.level?.name}`, { ns: "common" }) || lecture.level?.name || t("lecturesPage.notSpecified")}</p>
                    <p><span className="font-medium">{t("lecturesPage.tableHeaders.price")}: </span>{lecture.price || 0} {t("lecturesPage.points")}</p>
                    {isStudentLikeRole && <p><span className="font-medium">{t("lecturesPage.tableHeaders.purchaseDate")}: </span>{lecture.purchasedAt}</p>}
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex gap-2">
                  <Link
                    to={`/dashboard/${isStudentLikeRole ? "student" : "lecturer"}-dashboard/${isStudentLikeRole ? "lecture-display" : "detailed-lecture-view"}/${lecture.id}`}
                    className="flex-1"
                  >
                    <button className="btn btn-sm w-full border-none text-white" style={{ background: TOKENS.deepTeal }}>{t("lecturesPage.buttons.details")}</button>
                  </Link>
                  {!isStudentLikeRole && (
                    <button
                      type="button"
                      className="btn btn-sm border-none"
                      style={{ background: TOKENS.warmMango, color: "#fff" }}
                      onClick={() => openEditLectureModal(lecture)}
                    >
                      {t("lecturesPage.buttons.edit", "Edit")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          className="hidden md:block overflow-x-auto rounded-[1.6rem] border"
          style={{ background: "rgba(255,255,255,0.82)", borderColor: "rgba(17,24,39,0.08)", boxShadow: SHADOWS.level1 }}
        >
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th className="w-24">{t("lecturesPage.tableHeaders.thumbnail")}</th>
                <th>{t("lecturesPage.tableHeaders.name")}</th>
                {(isStudentLikeRole || isAdminLikeRole) && (
                  <th>{t("lecturesPage.tableHeaders.lecturer")}</th>
                )}
                <th>{t("lecturesPage.tableHeaders.subject")}</th>
                <th>{t("lecturesPage.tableHeaders.level")}</th>
                <th>{t("lecturesPage.tableHeaders.type")}</th>
                <th>{t("lecturesPage.tableHeaders.price")}</th>
                {isStudentLikeRole && <th>{t("lecturesPage.tableHeaders.purchaseDate")}</th>}
                {!isStudentLikeRole && <th>{t("lecturesPage.tableHeaders.actions")}</th>}
              </tr>
            </thead>
            <tbody>
              {lectures?.map((lecture) => (
                <tr key={lecture.id}>
                  <td>
                    {lecture.thumbnail ? (
                      <div className="avatar">
                        <div className="w-12 h-12 rounded-xl overflow-hidden border" style={{ borderColor: "rgba(17,24,39,0.12)" }}>
                          <img
                            src={resolveUploadUrl(lecture.thumbnail, "lecture_thumbnails") || "/placeholder.svg"}
                            alt={lecture.name}
                            className="object-cover w-full h-full"
                            onError={(e) => {
                              e.currentTarget.src = "/registration-image.png"
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="avatar placeholder">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ background: TOKENS.lightAquaMist, color: TOKENS.deepTeal }}
                        >
                          <span className="text-xs font-bold">IMG</span>
                        </div>
                      </div>
                    )}
                  </td>

                  <td>{lecture.name}</td>
                  {(isStudentLikeRole || isAdminLikeRole) && (
                    <td>{lecture.lecturer?.name || t("lecturesPage.unknown")}</td>
                  )}
                  <td>{lecture.subject?.name || t("lecturesPage.notSpecified")}</td>
                  <td>
                    {t(`gradeLevels.${lecture.level?.name}`, { ns: "common" }) ||
                      lecture.level?.name ||
                      t("lecturesPage.notSpecified")}
                  </td>
                  <td>
                    {lecture.lecture_type === "Paid"
                      ? t("lecturesPage.lectureType.paid")
                      : t("lecturesPage.lectureType.review")}
                  </td>
                  <td>
                    {lecture.price || 0} {t("lecturesPage.points")}
                  </td>
                  {isStudentLikeRole && <td>{lecture.purchasedAt}</td>}
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`/dashboard/${isStudentLikeRole ? "student" : "lecturer"}-dashboard/${isStudentLikeRole ? "lecture-display" : "detailed-lecture-view"
                          }/${lecture.id}`}
                      >
                        <button
                          className="btn btn-sm border-none"
                          style={{ background: TOKENS.deepTeal, color: "#F8FCFF" }}
                        >
                          {t("lecturesPage.buttons.details")}
                        </button>
                      </Link>
                      {!isStudentLikeRole && (
                        <button
                          type="button"
                          className="btn btn-sm border-none"
                          style={{ background: TOKENS.warmMango, color: "#fff" }}
                          onClick={() => openEditLectureModal(lecture)}
                        >
                          {t("lecturesPage.buttons.edit", "Edit")}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {lectures.length === 0 && (
          <div className="alert alert-info mt-4">
            <span>
              {searchTerm.trim()
                ? t("lecturesPage.emptyStates.noSearchResults")
                : ["Lecturer", "Admin", "Subadmin", "Moderator"].includes(userRole)
                ? t("lecturesPage.emptyStates.noLectures")
                : t("lecturesPage.emptyStates.noPurchases")}
            </span>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-5 flex flex-col items-center gap-3 rounded-[1.4rem] border p-4 sm:flex-row sm:justify-center" style={{ background: "rgba(255,255,255,0.72)", borderColor: "rgba(17,24,39,0.08)" }}>
            <button
              className="btn btn-sm rounded-[1.4rem] border-none"
              style={{
                background: currentPage === 1 ? TOKENS.neutralCloud : TOKENS.creamSurface,
                color: currentPage === 1 ? TOKENS.slateText : TOKENS.deepTeal,
                boxShadow: currentPage === 1 ? "none" : SHADOWS.level1,
                opacity: currentPage === 1 ? 0.6 : 1,
              }}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              {t("lecturesPage.pagination.previous")}
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }

              const isActive = currentPage === pageNum

              return (
                <button
                  key={i}
                  className="btn btn-sm min-w-10 rounded-full border-none"
                  style={{
                    background: isActive ? TOKENS.warmMango : TOKENS.creamSurface,
                    color: isActive ? "#fff" : TOKENS.deepTeal,
                    boxShadow: isActive ? "0 4px 14px rgba(243,154,63,0.4)" : SHADOWS.level1,
                  }}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </button>
              )
            })}

            <button
              className="btn btn-sm rounded-[1.4rem] border-none"
              style={{
                background: currentPage === totalPages ? TOKENS.neutralCloud : TOKENS.creamSurface,
                color: currentPage === totalPages ? TOKENS.slateText : TOKENS.deepTeal,
                boxShadow: currentPage === totalPages ? "none" : SHADOWS.level1,
                opacity: currentPage === totalPages ? 0.6 : 1,
              }}
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              {t("lecturesPage.pagination.next")}
            </button>
          </div>
        )}
      </div>
    )
}

export default MyLecturesPage

