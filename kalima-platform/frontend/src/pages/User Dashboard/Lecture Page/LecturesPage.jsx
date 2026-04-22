"use client"



import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from "react"

import { ChevronDown, ChevronUp } from "lucide-react"

import { Link, useLocation, useNavigate } from "react-router-dom"

import { useTranslation } from "react-i18next"

import { getUserDashboard } from "../../../routes/auth-services"

import { getAllSubjects } from "../../../routes/courses"

import { getAllLevels } from "../../../routes/levels"

import { createLecture, updateLecture, createLectureAttachment, getLectureById, getMyContainers, deleteLecture } from "../../../routes/lectures"

import { getAllLectures } from "../../../routes/lectures"

const LectureModalLazy = lazy(() => import("../../../components/LectureCreationModal"))

import { designTokens } from "../../../constants/designTokens"

import { resolveUploadUrl } from "../../../utils/uploadUrl"

import { translateErrorMessage } from "../../../utils/errorTranslator"

import { objectToFormData } from "../../../utils/contentCreationPayloads"

import { useDebounce } from "../../../utils/useDebounce"

import DSSelect from "../../../components/DSSelect";
import Button from "../../../components/ui/Button";
import Badge from "../../../components/ui/Badge";



const normalizeEntityId = (value) => value?._id || value?.id || value || null



const buildLecturerLectureTargets = (containers = []) => {

  const normalizedContainers = containers

    .filter((container) => container && container.type !== "lecture")

    .map((container) => ({

      id: normalizeEntityId(container),

      name: container.name,

      type: container.type,

      parentId: normalizeEntityId(container.parent),

      levelId: normalizeEntityId(container.level),

      subjectId: normalizeEntityId(container.subject),

    }))

    .filter((container) => Boolean(container.id))



  const containersById = new Map(normalizedContainers.map((container) => [String(container.id), container]))

  const courses = normalizedContainers.filter((container) => container.type === "course")



  const getAncestorChain = (containerId) => {

    const chain = []

    let current = containersById.get(String(containerId))



    while (current) {

      chain.unshift(current)

      if (!current.parentId) break

      current = containersById.get(String(current.parentId))

    }



    return chain

  }



  const isDescendantOfCourse = (container, courseId) => {

    let currentParentId = container.parentId



    while (currentParentId) {

      if (String(currentParentId) === String(courseId)) {

        return true

      }



      const parentContainer = containersById.get(String(currentParentId))

      currentParentId = parentContainer?.parentId || null

    }



    return false

  }



  const courseOptions = courses

    .map((course) => ({

      value: course.id,

      label: course.name,

      levelId: course.levelId || "",

      subjectId: course.subjectId || "",

    }))

    .sort((left, right) => left.label.localeCompare(right.label))



  const containerOptionsByCourse = courses.reduce((acc, course) => {

    const descendantOptions = normalizedContainers

      .filter((container) => container.type !== "course" && isDescendantOfCourse(container, course.id))

      .map((container) => {

        const pathParts = getAncestorChain(container.id)

          .filter((entry) => String(entry.id) !== String(course.id))

          .map((entry) => entry.name)



        return {

          value: container.id,

          label: pathParts.join(" / ") || container.name,

          type: container.type,

          levelId: container.levelId || course.levelId || "",

          subjectId: container.subjectId || course.subjectId || "",

        }

      })

      .sort((left, right) => left.label.localeCompare(right.label))



    acc[String(course.id)] = descendantOptions

    return acc

  }, {})



return { courseOptions, containerOptionsByCourse }

  }


const MyLecturesPage = () => {

  const { t, i18n } = useTranslation("lecturesPage")

  const isRTL = i18n.language === "ar"

  const location = useLocation()

  const navigate = useNavigate()

  const TOKENS = designTokens.colors

  const SHADOWS = designTokens.shadows

  const RADIUS = designTokens.radius

  const GRADIENTS = designTokens.gradients

  const pageBackground = `${GRADIENTS.pageAtmosphere}, linear-gradient(180deg, #FCF8F1 0%, #F5F8FB 100%)`

  const shellStyle = {
    background: pageBackground,
    minHeight: "100vh",
  }

const panelStyle = {
    background: "rgba(255,255,255,0.82)",
    border: "1px solid transparent",
    borderRadius: RADIUS.section,
    boxShadow: SHADOWS.level2,
    backdropFilter: "blur(16px)",
  }

const softPanelStyle = {
    background: "rgba(255,255,255,0.88)",
    border: "1px solid transparent",
    borderRadius: RADIUS.card,
    boxShadow: SHADOWS.level1,
    backdropFilter: "blur(10px)",
  }

  const inputSurfaceStyle = {
    backgroundColor: "#FFFFFF",
    border: `1px solid ${TOKENS.borderSubtle}`,
    borderRadius: RADIUS.chip,
    color: TOKENS.deepTeal,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.55)",
  }

  const sortLecturesNewestFirst = (left, right) => {

    const leftTime = new Date(left.sortDate || left.createdAt || 0).getTime()

    const rightTime = new Date(right.sortDate || right.createdAt || 0).getTime()

    return rightTime - leftTime

  }

  const getLecturePricingLabel = (lecture) =>

    Number(lecture?.price || 0) > 0

      ? t("lecturesPage.lectureType.paid")

      : t("lecturesPage.lectureType.free", "Free")

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

  const [lectureCreationTargets, setLectureCreationTargets] = useState({

    courseOptions: [],

    containerOptionsByCourse: {},

  })

  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState("")

  const [selectedLevelFilter, setSelectedLevelFilter] = useState("")

const [searchTerm, setSearchTerm] = useState("")

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const [showFilters, setShowFilters] = useState(false)

const [currentPage, setCurrentPage] = useState(1)

  const [itemsPerPage, setItemsPerPage] = useState(8)

  const [totalPages, setTotalPages] = useState(0)

  const isStudentLikeRole = userRole === "Student" || userRole === "Parent"

  const isAdminLikeRole = ["Admin", "Subadmin", "Moderator"].includes(userRole)

  const activeFiltersCount = [searchTerm.trim(), selectedSubjectFilter, selectedLevelFilter].filter(Boolean).length



  const openCreateLectureModal = useCallback(() => {

    setLectureModalState({ mode: "create", target: null })

  }, [])



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



  const closeLectureModal = useCallback(() => {

    setLectureModalState({ mode: null, target: null })

  }, [])



  const handleDeleteLecture = async (lecture) => {

    const lectureId = lecture?._id || lecture?.id

    if (!lectureId) return

    if (!window.confirm(t("lecturesPage.buttons.confirmDelete", "Are you sure you want to delete this lecture? This action cannot be undone."))) return

    const previousLectures = [...lectures]
    const previousAllLectures = [...allLectures]

    setLectures((prev) => prev.filter((l) => (l._id || l.id) !== lectureId))
    setAllLectures((prev) => prev.filter((l) => (l._id || l.id) !== lectureId))

    try {

      const result = await deleteLecture(lectureId)

      if (!result?.success) {

        setLectures(previousLectures)
        setAllLectures(previousAllLectures)
        setError(translateErrorMessage(result?.message || t("lecturesPage.buttons.deleteError", "Failed to delete lecture")))

      }

    } catch (err) {

      setLectures(previousLectures)
      setAllLectures(previousAllLectures)
      setError(translateErrorMessage(t("lecturesPage.buttons.deleteError", "Failed to delete lecture")))

    }

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

          setLectureCreationTargets({ courseOptions: [], containerOptionsByCourse: {} })

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

          const [result, lecturerContainersResult] = await Promise.all([

            getUserDashboard({

              params: { fields: "userInfo,lectures,containers", limit: 500 },

            }),

            getMyContainers(),

          ])



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

              requiresExam: lecture.requiresExam || false,

              examConfig: lecture.examConfig || null,

              lecturer: result.data.data.userInfo,

              thumbnail: lecture.thumbnail ? resolveUploadUrl(lecture.thumbnail, "lecture_thumbnails") : null,

              createdAt: lecture.createdAt || null,

            })) || [];



            const allLecturesCombined = [...containerLectures, ...standaloneLectures].sort(sortLecturesNewestFirst);

            setAllLectures(allLecturesCombined);

            setLectureCreationTargets(

              buildLecturerLectureTargets(lecturerContainersResult?.data?.containers || []),

            )

          } else {

            throw new Error(translateErrorMessage(result.error || "Failed to fetch lecturer data"));

          }

        } else if (userRole === "Student" || userRole === "Parent") {

          setLectureCreationTargets({ courseOptions: [], containerOptionsByCourse: {} })

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



    if (debouncedSearchTerm.trim()) {

      const normalizedSearch = debouncedSearchTerm.trim().toLowerCase()

      filteredLectures = filteredLectures.filter((lecture) => {

        const name = String(lecture.name || "").toLowerCase()

        const subjectName = String(lecture.subject?.name || "").toLowerCase()

        const lecturerName = String(lecture.lecturer?.name || "").toLowerCase()

        const lectureType = getLecturePricingLabel(lecture).toLowerCase()

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

  }, [allLectures, selectedSubjectFilter, selectedLevelFilter, debouncedSearchTerm, currentPage, itemsPerPage, isAdminLikeRole])



  const handlePageChange = useCallback((newPage) => {

    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage)

  }, [totalPages])



  const handleItemsPerPageChange = useCallback((e) => {

    setItemsPerPage(Number(e.target.value))

    setCurrentPage(1)

  }, [])



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



      let resolvedLectureId = isEditMode ? lectureId : null

      if (!resolvedLectureId) {
        if (response.data && response.data.lecture && response.data.lecture._id) {

          resolvedLectureId = response.data.lecture._id

        } else if (response.data && response.data._id) {

          resolvedLectureId = response.data._id

        } else if (response.data && response.data.lecture && response.data.lecture.id) {

          resolvedLectureId = response.data.lecture.id

        } else if (response.data && response.data.id) {

          resolvedLectureId = response.data.id

        } else if (response.data && response.data.container && response.data.container._id) {

          resolvedLectureId = response.data.container._id

        }
      }



      if (resolvedLectureId) {

        try {

          await uploadLectureAttachments(

            resolvedLectureId,

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



  const pageTitle = ["Lecturer", "Admin", "Subadmin", "Moderator"].includes(userRole)
    ? t("lecturesPage.pageTitle.manage")
    : t("lecturesPage.pageTitle.purchased")

  const pageCountLabel = t("lecturesPage.itemsPerPage", { count: itemsPerPage })

  if (loading)

    return (

      <div className="px-4 py-8 sm:px-6" style={shellStyle}>
        <div className="mx-auto max-w-7xl">
          <div className="flex min-h-[60vh] items-center justify-center rounded-[2rem] px-6 py-16" style={panelStyle}>
            <div className="flex flex-col items-center gap-4 text-center">
              <div
                className="h-14 w-14 animate-spin rounded-full border-4 border-t-transparent"
                style={{ borderColor: TOKENS.lightAquaMist, borderTopColor: "transparent" }}
              />
              <div>
                <p className="text-lg font-semibold" style={{ color: TOKENS.deepTeal }}>
                  {pageTitle}
                </p>
                <p className="text-sm" style={{ color: TOKENS.slateText }}>
                  {t("lecturesPage.pageDescription")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

    )



  return (

    <div className="px-4 py-6 sm:px-6 sm:py-8" style={shellStyle} dir={isRTL ? "rtl" : "ltr"}>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">

        <section className="relative overflow-hidden p-5 sm:p-7 lg:p-8" style={{ ...panelStyle, background: `${GRADIENTS.hero}, rgba(255,255,255,0.12)` }}>
          <div
            className="pointer-events-none absolute -right-12 top-0 h-40 w-40 rounded-full blur-3xl"
            style={{ background: "rgba(243,154,63,0.22)" }}
          />
          <div
            className="pointer-events-none absolute bottom-0 left-0 h-36 w-36 rounded-full blur-3xl"
            style={{ background: "rgba(188,231,236,0.18)" }}
          />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge
                className="mb-4 border-none px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em]"
                style={{ background: "rgba(255,255,255,0.16)", color: "#F8FCFF" }}
              >
                {isStudentLikeRole ? t("lecturesPage.pageTitle.purchased") : t("lecturesPage.pageTitle.manage")}
              </Badge>
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl" style={{ color: "#F8FCFF" }}>
                {pageTitle}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 sm:text-base" style={{ color: "rgba(248,252,255,0.84)" }}>
                {t("lecturesPage.pageDescription")}
              </p>
            </div>

<div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="rounded-[1.4rem] px-2 py-2 sm:px-4 sm:py-3" style={{ background: "rgba(255,255,255,0.12)", borderColor: "transparent" }}>
                <p className="text-[0.6rem] sm:text-xs uppercase tracking-[0.2em]" style={{ color: "rgba(248,252,255,0.68)" }}>
                  {t("lecturesPage.tableHeaders.name")}
                </p>
                <p className="mt-1 text-xl sm:text-2xl font-semibold" style={{ color: "#F8FCFF" }}>
                  {lectures.length}
                </p>
              </div>
              <div className="rounded-[1.4rem] px-2 py-2 sm:px-4 sm:py-3" style={{ background: "rgba(255,255,255,0.12)", borderColor: "transparent" }}>
                <p className="text-[0.6rem] sm:text-xs uppercase tracking-[0.2em]" style={{ color: "rgba(248,252,255,0.68)" }}>
                  {t("lecturesPage.tableHeaders.subject")}
                </p>
                <p className="mt-1 text-xs sm:text-sm font-semibold" style={{ color: "#F8FCFF" }}>
                  {selectedSubjectFilter
                    ? subjects?.find((subject) => subject._id === selectedSubjectFilter)?.name || t("lecturesPage.filters.allSubjects")
                    : t("lecturesPage.filters.allSubjects")}
                </p>
              </div>
              <div className="rounded-[1.4rem] px-2 py-2 sm:px-4 sm:py-3" style={{ background: "rgba(255,255,255,0.12)", borderColor: "transparent" }}>
                <p className="text-[0.6rem] sm:text-xs uppercase tracking-[0.2em]" style={{ color: "rgba(248,252,255,0.68)" }}>
                  {t("lecturesPage.tableHeaders.level")}
                </p>
                <p className="mt-1 text-xs sm:text-sm font-semibold" style={{ color: "#F8FCFF" }}>
                  {selectedLevelFilter
                    ? t(`gradeLevels.${levels?.find((level) => level._id === selectedLevelFilter)?.name}`, { ns: "common" }) ||
                      levels?.find((level) => level._id === selectedLevelFilter)?.name ||
                      t("lecturesPage.filters.allLevels")
                    : t("lecturesPage.filters.allLevels")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {successMessage && (

          <div
            className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            style={{
              ...softPanelStyle,
              background: TOKENS.successLight,
              borderColor: TOKENS.successBorder,
            }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "rgba(22,163,74,0.14)", color: TOKENS.success }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 stroke-current" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium" style={{ color: "#065F46" }}>
                {successMessage}
              </p>
            </div>
            <Button variant="ghost" size="sm" className="border-none" style={{ color: "#065F46", background: "rgba(255,255,255,0.65)" }} onClick={() => setSuccessMessage("")}>
              {t("lecturesPage.buttons.close")}
            </Button>
          </div>

        )}



        {error && (

          <div
            className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            style={{
              ...softPanelStyle,
              background: "rgba(220,38,38,0.08)",
              borderColor: "rgba(220,38,38,0.18)",
            }}
          >
            <p className="text-sm font-medium" style={{ color: "#991B1B" }}>
              {error}
            </p>
            <Button variant="ghost" size="sm" className="border-none" style={{ color: "#991B1B", background: "rgba(255,255,255,0.65)" }} onClick={() => setError(null)}>
              {t("lecturesPage.buttons.close")}
            </Button>
          </div>

        )}



<section className="p-4 sm:p-5" style={softPanelStyle}>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                className="border-none px-5 py-3"
                style={{ background: "#FFFFFF", color: TOKENS.deepTeal, boxShadow: SHADOWS.level1 }}
                onClick={() => setShowFilters((prev) => !prev)}
                aria-expanded={showFilters}
                aria-controls="lectures-filters-panel"
              >
                <span className="inline-flex items-center gap-2">
                  {showFilters
                    ? t("lecturesPage.buttons.hideFilters", "Hide Filters")
                    : t("lecturesPage.buttons.showFilters", "Show Filters")}
                  {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </span>
              </Button>

              {activeFiltersCount > 0 && (
                <Badge
                  className="border-none px-3 py-2 text-xs font-semibold"
                  style={{ background: "rgba(20,106,120,0.12)", color: TOKENS.deepTeal }}
                >
                  {t("lecturesPage.filters.activeFilters", {
                    count: activeFiltersCount,
                    defaultValue: `${activeFiltersCount} active filters`,
                  })}
                </Badge>
              )}
            </div>

            {userRole === "Lecturer" && (
              <Button
                onClick={openCreateLectureModal}
                className="border-none px-5 py-3"
                style={{ background: GRADIENTS.cta, color: "#F8FCFF", boxShadow: SHADOWS.level1 }}
              >
                {t("lecturesPage.buttons.createNewLecture")}
              </Button>
            )}
          </div>

          {showFilters && (
            <div id="lectures-filters-panel" className="mt-4 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">

              <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-3">

                <label className="flex flex-col gap-2 md:col-span-2 xl:col-span-1">
                  <span className="flex min-h-10 items-end text-xs font-semibold uppercase tracking-[0.18em] leading-5" style={{ color: TOKENS.slateText }}>
                    {t("lecturesPage.filters.searchLecture")}
                  </span>
                  <input
                    type="text"
                    className="w-full px-4 py-3 text-sm font-medium outline-none transition-colors"
                    style={inputSurfaceStyle}
                    onFocus={(e) => { e.target.style.borderColor = TOKENS.softCyanTeal; e.target.style.boxShadow = `0 0 0 4px rgba(77,179,194,0.12)` }}
                    onBlur={(e) => { e.target.style.borderColor = TOKENS.borderSubtle; e.target.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.55)" }}
                    value={searchTerm}
                    placeholder={t("lecturesPage.filters.searchLecture")}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setCurrentPage(1)
                    }}
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="flex min-h-10 items-end text-xs font-semibold uppercase tracking-[0.18em] leading-5" style={{ color: TOKENS.slateText }}>
                    {t("lecturesPage.filters.allSubjects")}
                  </span>
                  <DSSelect
                    className="w-full px-4 py-3 text-sm font-medium outline-none transition-colors"
                    style={inputSurfaceStyle}
                    value={selectedSubjectFilter}
                    onFocus={(e) => { e.target.style.borderColor = TOKENS.softCyanTeal; e.target.style.boxShadow = `0 0 0 4px rgba(77,179,194,0.12)` }}
                    onBlur={(e) => { e.target.style.borderColor = TOKENS.borderSubtle; e.target.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.55)" }}
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
                </label>

                <label className="flex flex-col gap-2">
                  <span className="flex min-h-10 items-end text-xs font-semibold uppercase tracking-[0.18em] leading-5" style={{ color: TOKENS.slateText }}>
                    {t("lecturesPage.filters.allLevels")}
                  </span>
                  <DSSelect
                    className="w-full px-4 py-3 text-sm font-medium outline-none transition-colors"
                    style={inputSurfaceStyle}
                    value={selectedLevelFilter}
                    onFocus={(e) => { e.target.style.borderColor = TOKENS.softCyanTeal; e.target.style.boxShadow = `0 0 0 4px rgba(77,179,194,0.12)` }}
                    onBlur={(e) => { e.target.style.borderColor = TOKENS.borderSubtle; e.target.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.55)" }}
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
                </label>

              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="flex min-w-[13rem] flex-col gap-2">
                  <span className="flex min-h-10 items-end text-xs font-semibold uppercase tracking-[0.18em] leading-5" style={{ color: TOKENS.slateText }}>
                    {pageCountLabel}
                  </span>
                  <DSSelect
                    className="w-full px-4 py-3 text-sm font-medium outline-none transition-colors"
                    style={inputSurfaceStyle}
                    value={itemsPerPage}
                    onFocus={(e) => { e.target.style.borderColor = TOKENS.softCyanTeal; e.target.style.boxShadow = `0 0 0 4px rgba(77,179,194,0.12)` }}
                    onBlur={(e) => { e.target.style.borderColor = TOKENS.borderSubtle; e.target.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.55)" }}
                    onChange={handleItemsPerPageChange}
                  >
                    <option value={8}>{t("lecturesPage.itemsPerPage", { count: 8 })}</option>
                  </DSSelect>
                </label>
              </div>

            </div>
          )}

        </section>



        {lectureModalState.mode && (
          <Suspense fallback={null}>
            <LectureModalLazy
              isOpen={Boolean(lectureModalState.mode)}
              onClose={closeLectureModal}
              onSubmit={handleLectureSubmit}
              containerId={null}
              userId={userId}
              containerLevel={null}
              containerSubject={null}
              containerType="month"
              lecturerCourseOptions={lectureCreationTargets.courseOptions}
              lecturerContainerOptionsByCourse={lectureCreationTargets.containerOptionsByCourse}
              mode={lectureModalState.mode || "create"}
              initialData={lectureModalState.target}
              lectureId={lectureModalState.target?.id || lectureModalState.target?._id || null}
            />
          </Suspense>
        )}



        {lectures.length > 0 ? (
          <section className="overflow-hidden" style={softPanelStyle}>
            <div
              className="flex items-center justify-between border-b px-6 py-4"
              style={{ borderColor: TOKENS.borderSubtle, background: "rgba(248,243,233,0.62)" }}
            >
              <div>
                <h2 className="text-lg font-semibold" style={{ color: TOKENS.inkText }}>
                  {pageTitle}
                </h2>
                <p className="text-sm" style={{ color: TOKENS.slateText }}>
                  {lectures.length} {t("lecturesPage.tableHeaders.name").toLowerCase()}
                </p>
              </div>
              <Badge className="border-none px-3 py-1 text-xs" style={{ background: TOKENS.lightAquaMist, color: TOKENS.deepTeal }}>
                {pageCountLabel}
              </Badge>
            </div>

            <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
              {lectures?.map((lecture) => (
                <article
                  key={lecture.id}
                  className="flex h-full flex-col overflow-hidden rounded-[1.35rem] p-4"
                  style={{
                    background: "rgba(255,255,255,0.76)",
                    borderColor: TOKENS.borderSubtle,
                    boxShadow: SHADOWS.level1,
                  }}
                >
                  <div className="flex items-start gap-4">
                    {lecture.thumbnail ? (
                      <div
                        className="h-16 w-16 overflow-hidden rounded-[1.05rem] shrink-0"
                        style={{ borderColor: TOKENS.borderSubtle, boxShadow: SHADOWS.level1 }}
                      >
<img
                          src={resolveUploadUrl(lecture.thumbnail, "lecture_thumbnails") || "/placeholder.svg"}
                          alt={lecture.name}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/registration-image.png"
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.05rem] text-lg font-semibold"
                        style={{ background: TOKENS.lightAquaMist, color: TOKENS.deepTeal }}
                      >
                        {lecture.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/dashboard/${isStudentLikeRole ? "student" : "lecturer"}-dashboard/${isStudentLikeRole ? "lecture-display" : "detailed-lecture-view"}/${lecture?.id}`}
                        className="block"
                        style={{ color: TOKENS.deepTeal }}
                      >
                        <h3 className="text-base font-semibold leading-6 sm:text-lg">{lecture?.name || "-"}</h3>
                      </Link>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge className="border-none px-3 py-1 text-xs" style={{ background: TOKENS.creamSurface, color: TOKENS.deepTeal }}>
                          {lecture?.subject?.name || t("lecturesPage.notSpecified")}
                        </Badge>
                        <Badge className="border-none px-3 py-1 text-xs" style={{ background: TOKENS.lightAquaMist, color: TOKENS.deepTeal }}>
                          {t(`gradeLevels.${lecture?.level?.name}`, { ns: "common" }) || lecture?.level?.name || t("lecturesPage.notSpecified")}
                        </Badge>
                        <Badge className="border-none px-3 py-1 text-xs" style={{ background: "rgba(243,154,63,0.12)", color: TOKENS.deepTeal }}>
                          {getLecturePricingLabel(lecture)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm" style={{ color: TOKENS.slateText }}>
                    {(isStudentLikeRole || isAdminLikeRole) && (
                      <p>
                        <span className="font-semibold" style={{ color: TOKENS.inkText }}>
                          {t("lecturesPage.tableHeaders.lecturer")}:{" "}
                        </span>
                        {lecture?.lecturer?.name || t("lecturesPage.unknown")}
                      </p>
                    )}
                    <p>
                      <span className="font-semibold" style={{ color: TOKENS.inkText }}>
                        {t("lecturesPage.tableHeaders.points")}:{" "}
                      </span>
                      {lecture?.price || 0} {t("lecturesPage.points")}
                    </p>
                    {isStudentLikeRole && (
                      <p>
                        <span className="font-semibold" style={{ color: TOKENS.inkText }}>
                          {t("lecturesPage.tableHeaders.purchaseDate")}:{" "}
                        </span>
                        {lecture?.purchasedAt}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 pt-2">
                    <Link
                      to={`/dashboard/${isStudentLikeRole ? "student" : "lecturer"}-dashboard/${isStudentLikeRole ? "lecture-display" : "detailed-lecture-view"}/${lecture.id}`}
                      className="flex-1 min-w-[10rem]"
                    >
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full border-none"
                        style={{ background: GRADIENTS.cta, color: "#F8FCFF", minWidth: "6rem" }}
                      >
                        {isStudentLikeRole ? t("lecturesPage.buttons.view") : t("lecturesPage.buttons.details")}
                      </Button>
                    </Link>
                    {!isStudentLikeRole && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-none"
                        style={{ background: TOKENS.warmMango, color: "#fff" }}
                        onClick={() => openEditLectureModal(lecture)}
                      >
                        {t("lecturesPage.buttons.edit", "Edit")}
                      </Button>
                    )}
                    {!isStudentLikeRole && (
                      <Button
                        type="button"
                        variant="error"
                        size="sm"
                        className="border-none"
                        style={{ background: TOKENS.error, color: "#fff" }}
                        onClick={() => handleDeleteLecture(lecture)}
                      >
                        {t("lecturesPage.buttons.delete", "Delete")}
                      </Button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <section className="p-6 sm:p-8" style={softPanelStyle}>
            <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: TOKENS.lightAquaMist, color: TOKENS.deepTeal }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 stroke-current" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold" style={{ color: TOKENS.inkText }}>
                {searchTerm.trim()
                  ? t("lecturesPage.emptyStates.noSearchResults")
                  : ["Lecturer", "Admin", "Subadmin", "Moderator"].includes(userRole)
                  ? t("lecturesPage.emptyStates.noLectures")
                  : t("lecturesPage.emptyStates.noPurchases")}
              </h2>
              <p className="mt-3 text-sm leading-6" style={{ color: TOKENS.slateText }}>
                {t("lecturesPage.pageDescription")}
              </p>
            </div>
          </section>
        )}




        {totalPages > 1 && (

          <section className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between" style={softPanelStyle}>

            <div>
              <p className="text-sm font-semibold" style={{ color: TOKENS.inkText }}>
                {pageTitle}
              </p>
              <p className="text-sm" style={{ color: TOKENS.slateText }}>
                {currentPage} / {totalPages}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">

            <Button
              size="sm"
              className="rounded-full border-none px-4"
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
            </Button>



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

                <Button
                  key={pageNum}
                  size="sm"
                  className="min-w-10 rounded-full border-none"
                  style={{
                    background: isActive ? TOKENS.warmMango : "#FFFFFF",
                    color: isActive ? "#fff" : TOKENS.deepTeal,
                    boxShadow: isActive ? "0 10px 24px rgba(243,154,63,0.35)" : SHADOWS.level1,
                  }}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </Button>

              )

            })}



            <Button
              size="sm"
              className="rounded-full border-none px-4"
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
            </Button>

            </div>

          </section>

        )}

      </div>

    </div>

  )

}



export default MyLecturesPage



