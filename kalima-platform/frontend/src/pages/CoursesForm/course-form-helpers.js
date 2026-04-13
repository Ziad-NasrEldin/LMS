export const CONTAINER_TYPES = {
  COURSE: "course",
  YEAR: "year",
  TERM: "term",
  MONTH: "month",
  LECTURE: "lecture",
}

export const DEFAULT_LECTURE_ATTACHMENT_TYPE = "pdfsandimages"

export const EMPTY_LEVEL_HIERARCHY = {
  levels: [],
  stages: [],
  grades: [],
  gradesByStageId: {},
  stageOptions: [],
  gradeOptions: [],
}

export const INITIAL_COURSE_FORM_DATA = {
  courseName: "",
  teacherName: "",
  stage: "",
  gradeLevel: "",
  subject: "",
  duration: "",
  description: "",
  goal: "",
  courseType: "paid",
  priceFull: "",
  priceMonthly: "",
  priceSession: "",
  privacy: "student",
  sameGradeOnly: false,
}

export const INITIAL_COURSE_STRUCTURE = {
  parent: null,
  containers: [],
  lectures: [],
}

export const INITIAL_CREATION_PANEL_STATE = {
  containerName: "",
  containerType: CONTAINER_TYPES.YEAR,
  selectedParentId: "",
  lectureLink: "",
  attachmentFile: null,
  numberOfViews: 0,
  lecturePrice: 0,
  limitedAvailabilityEnabled: false,
  limitedAvailabilityDurationHours: 24,
  requiresExam: false,
  examFormUrl: "",
  passingThreshold: 60,
  requiresHomework: false,
  homeworkFormUrl: "",
  homeworkPassingThreshold: 60,
  containerPrice: 0,
  description: "",
  goal: "",
  imageFile: null,
  attachmentType: DEFAULT_LECTURE_ATTACHMENT_TYPE,
}

export const normalizeStructureId = (value) => value?._id || value?.id || value || null

export const resetCreationPanelState = (setters) => {
  setters.setContainerName(INITIAL_CREATION_PANEL_STATE.containerName)
  setters.setLectureLink(INITIAL_CREATION_PANEL_STATE.lectureLink)
  setters.setAttachmentFile(INITIAL_CREATION_PANEL_STATE.attachmentFile)
  setters.setNumberOfViews(INITIAL_CREATION_PANEL_STATE.numberOfViews)
  setters.setLecturePrice(INITIAL_CREATION_PANEL_STATE.lecturePrice)
  setters.setLimitedAvailabilityEnabled(INITIAL_CREATION_PANEL_STATE.limitedAvailabilityEnabled)
  setters.setLimitedAvailabilityDurationHours(INITIAL_CREATION_PANEL_STATE.limitedAvailabilityDurationHours)
  setters.setRequiresExam(INITIAL_CREATION_PANEL_STATE.requiresExam)
  setters.setExamFormUrl(INITIAL_CREATION_PANEL_STATE.examFormUrl)
  setters.setPassingThreshold(INITIAL_CREATION_PANEL_STATE.passingThreshold)
  setters.setRequiresHomework(INITIAL_CREATION_PANEL_STATE.requiresHomework)
  setters.setHomeworkFormUrl(INITIAL_CREATION_PANEL_STATE.homeworkFormUrl)
  setters.setHomeworkPassingThreshold(INITIAL_CREATION_PANEL_STATE.homeworkPassingThreshold)
  setters.setContainerPrice(INITIAL_CREATION_PANEL_STATE.containerPrice)
  setters.setDescription(INITIAL_CREATION_PANEL_STATE.description)
  setters.setGoal(INITIAL_CREATION_PANEL_STATE.goal)
  setters.setImageFile(INITIAL_CREATION_PANEL_STATE.imageFile)
  setters.setAttachmentType?.(INITIAL_CREATION_PANEL_STATE.attachmentType)
}

export const getNextChildType = (parentType) => {
  switch (String(parentType || "").toLowerCase()) {
    case CONTAINER_TYPES.COURSE:
      return CONTAINER_TYPES.YEAR
    case CONTAINER_TYPES.YEAR:
      return CONTAINER_TYPES.TERM
    case CONTAINER_TYPES.TERM:
      return CONTAINER_TYPES.MONTH
    case CONTAINER_TYPES.MONTH:
      return CONTAINER_TYPES.LECTURE
    default:
      return null
  }
}

const getLatestContainerByType = (courseStructure, type) =>
  [...(courseStructure?.containers || [])].filter((container) => container.type === type).slice(-1)[0]

export const getSuggestedParentIdForType = (courseStructure, nextType) => {
  switch (nextType) {
    case CONTAINER_TYPES.YEAR:
      return normalizeStructureId(courseStructure?.parent)
    case CONTAINER_TYPES.TERM:
      return normalizeStructureId(getLatestContainerByType(courseStructure, CONTAINER_TYPES.YEAR))
    case CONTAINER_TYPES.MONTH:
      return normalizeStructureId(getLatestContainerByType(courseStructure, CONTAINER_TYPES.TERM))
    case CONTAINER_TYPES.LECTURE:
      return normalizeStructureId(getLatestContainerByType(courseStructure, CONTAINER_TYPES.MONTH))
    case CONTAINER_TYPES.COURSE:
    default:
      return normalizeStructureId(courseStructure?.parent)
  }
}

export const getAvailableParentsForType = (courseStructure, containerType) => {
  switch (containerType) {
    case CONTAINER_TYPES.YEAR:
      return [courseStructure.parent].filter(Boolean)
    case CONTAINER_TYPES.TERM:
      return courseStructure.containers.filter((container) => container.type === CONTAINER_TYPES.YEAR)
    case CONTAINER_TYPES.MONTH:
      return courseStructure.containers.filter((container) => container.type === CONTAINER_TYPES.TERM)
    case CONTAINER_TYPES.LECTURE:
      return courseStructure.containers.filter((container) => container.type === CONTAINER_TYPES.MONTH)
    default:
      return [courseStructure.parent].filter(Boolean)
  }
}

export const buildChecklistItems = ({ formData, courseStructure, isRTL }) => [
  {
    id: "basic",
    label: isRTL ? "أدخل البيانات الأساسية" : "Fill basic information",
    hint: isRTL ? "اسم الكورس + المرحلة + الصف + المادة" : "Course name + stage + grade + subject",
    done: Boolean(formData.courseName && formData.stage && formData.gradeLevel && formData.subject),
  },
  {
    id: "parent",
    label: isRTL ? "أنشئ الحاوية الرئيسية" : "Create parent container",
    hint: isRTL ? "اضغط زر إنشاء الحاوية الرئيسية" : "Use the create parent container button",
    done: Boolean(courseStructure.parent),
  },
  {
    id: "container",
    label: isRTL ? "أضف أول حاوية فرعية" : "Add first sub-container",
    hint: isRTL ? "مثل سنة أو فصل أو شهر" : "Example: year, term, or month",
    done: courseStructure.containers.length > 0,
  },
  {
    id: "lecture",
    label: isRTL ? "أضف أول محاضرة" : "Add first lecture",
    hint: isRTL ? "أدخل رابط المحاضرة وتفاصيلها" : "Set lecture link and details",
    done: courseStructure.lectures.length > 0,
  },
  {
    id: "review",
    label: isRTL ? "راجع الهيكل قبل المغادرة" : "Review your structure",
    hint: isRTL ? "تأكد من التسلسل قبل النشر" : "Check sequence before publishing",
    done: Boolean(
      courseStructure.parent &&
        (courseStructure.containers.length > 0 || courseStructure.lectures.length > 0),
    ),
  },
]

export const buildCourseSnapshot = ({ formData, levels, subjects, isRTL }) => {
  const selectedLevel = levels.find((level) => level._id === formData.gradeLevel)
  const selectedSubject = subjects.find((subject) => subject._id === formData.subject)

  return {
    title: formData.courseName?.trim() || (isRTL ? "اسم الكورس سيظهر هنا" : "Course title will appear here"),
    level: selectedLevel?.displayName || selectedLevel?.name || (isRTL ? "لم يتم الاختيار" : "Not selected"),
    subject: selectedSubject?.name || (isRTL ? "لم يتم الاختيار" : "Not selected"),
    pricing: formData.courseType === "free"
      ? (isRTL ? "مجاني" : "Free")
      : `${formData.priceFull || 0} ${isRTL ? "جنيه" : "EGP"}`,
    privacy: formData.privacy === "teacher"
      ? (isRTL ? "المعلم فقط" : "Teacher only")
      : (isRTL ? "الطلاب / أولياء الأمور" : "Students / guardians"),
  }
}

export const sortByNewest = (list = []) =>
  [...list].sort((left, right) => {
    const leftDate = new Date(left.createdAt || left._id || 0).getTime()
    const rightDate = new Date(right.createdAt || right._id || 0).getTime()
    return rightDate - leftDate
  })

export const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")

export const normalizeEntityId = (value) => {
  if (!value) return ""
  if (typeof value === "string") return value
  if (typeof value === "object") {
    return value._id || value.id || ""
  }
  return String(value)
}

export const findLevelRecord = ({ levels, levelLike, language, resolveLevelDisplayName }) => {
  if (!levelLike) return null

  const targetId = normalizeEntityId(levelLike)
  if (targetId) {
    const matchedById = levels.find((level) => normalizeEntityId(level._id) === targetId)
    if (matchedById) return matchedById
  }

  const targetName = normalizeText(typeof levelLike === "object" ? levelLike?.name : levelLike)
  if (!targetName) return null

  return (
    levels.find((level) => {
      const displayName = normalizeText(resolveLevelDisplayName(level, language))
      return normalizeText(level.name) === targetName || displayName === targetName
    }) || null
  )
}

export const filterCourseContainers = ({
  containers,
  lecturers,
  levels,
  searchQuery,
  selectedSubject,
  selectedCourseType,
  selectedCourseStatus,
  selectedPrice,
  language,
  t,
  resolveLevelDisplayName,
}) => {
  let filtered = sortByNewest(containers.filter((container) => container.type === "course"))

  if (selectedSubject) {
    filtered = filtered.filter((container) => container.subject?.name === selectedSubject)
  }

  if (selectedCourseType) {
    let apiType = "course"
    switch (selectedCourseType) {
      case t("types.course"):
        apiType = "course"
        break
      case t("types.year"):
        apiType = "year"
        break
      case t("types.term"):
        apiType = "term"
        break
      case t("types.month"):
        apiType = "month"
        break
      default:
        apiType = selectedCourseType
    }
    filtered = filtered.filter((container) => container.type === apiType)
  }

  if (selectedCourseStatus) {
    filtered = filtered.filter((container) => {
      const price = container.price || 0
      return selectedCourseStatus === t("status.free") ? price === 0 : price > 0
    })
  }

  if (selectedPrice) {
    const [min, max] = selectedPrice.split("-").map(Number)
    filtered = filtered.filter((container) => {
      const price = container.price || 0
      return price >= min && (max === 0 || price <= max)
    })
  }

  const normalizedSearch = searchQuery.trim().toLowerCase()
  if (!normalizedSearch) {
    return filtered
  }

  return filtered.filter((container) => {
    const teacherId = container.createdBy?._id || container.createdBy
    const matchedLecturer = lecturers.find((lecturer) => lecturer._id === teacherId)
    const levelRecord = findLevelRecord({
      levels,
      levelLike: container.level,
      language,
      resolveLevelDisplayName,
    })
    const stageRecord =
      levelRecord?.kind === "stage"
        ? levelRecord
        : findLevelRecord({
            levels,
            levelLike: levelRecord?.parentLevelId || levelRecord?.parentLevel,
            language,
            resolveLevelDisplayName,
          })
    const gradeName = resolveLevelDisplayName(levelRecord || container.level, language)
    const stageName = stageRecord ? resolveLevelDisplayName(stageRecord, language) : ""

    const searchableText = [
      container.name,
      container.subject?.name,
      gradeName,
      stageName,
      matchedLecturer?.name,
      matchedLecturer?.role,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()

    return searchableText.includes(normalizedSearch)
  })
}

export const mapCoursesToCardData = ({
  containers,
  lecturers,
  levels,
  language,
  isRTL,
  t,
  resolveLevelDisplayName,
}) =>
  containers.map((container, index) => {
    const levelRecord = findLevelRecord({
      levels,
      levelLike: container.level,
      language,
      resolveLevelDisplayName,
    })
    const stageRecord =
      levelRecord?.kind === "stage"
        ? levelRecord
        : findLevelRecord({
            levels,
            levelLike: levelRecord?.parentLevelId || levelRecord?.parentLevel,
            language,
            resolveLevelDisplayName,
          })
    const grade = resolveLevelDisplayName(levelRecord || container.level, language)
    const stage = stageRecord ? resolveLevelDisplayName(stageRecord, language) : ""

    const isFree = container.price === 0
    const status = isFree ? t("status.free") : t("status.paid")

    let type = t("types.course")
    switch (container.type) {
      case "course":
        type = t("types.course")
        break
      case "year":
        type = t("types.year")
        break
      case "term":
        type = t("types.term")
        break
      case "month":
        type = t("types.month")
        break
      default:
        type = container.type || t("types.course")
    }

    const teacherId = container.createdBy?._id || container.createdBy
    const matchedLecturer = lecturers.find((lecturer) => lecturer._id === teacherId)
    const containerImageUrl = container.containerImage?.url || container.image?.url || null

    return {
      id: container._id,
      image: `/course-${(index % 6) + 1}.png`,
      containerImage: containerImageUrl,
      title: container.name,
      subject: container.subject?.name || "",
      teacher: matchedLecturer?.name || t("unknownTeacher"),
      teacherRole: matchedLecturer?.role || t("lecturer"),
      grade,
      rating: 4 + (index % 2) * 0.5,
      stage,
      type,
      status,
      price: container.price || 0,
      childrenCount: container.children?.length || 0,
      containerType: container.type || "lecture",
      isRTL,
    }
  })
