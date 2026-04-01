const appendField = (formData, key, value) => {
  if (value === undefined || value === null || value === "") {
    return
  }

  if (Array.isArray(value)) {
    value.forEach((item) => {
      if (item !== undefined && item !== null && item !== "") {
        formData.append(key, item)
      }
    })
    return
  }

  formData.append(key, value)
}

const normalizeGoal = (goal) => {
  if (goal === undefined || goal === null) {
    return undefined
  }

  if (Array.isArray(goal)) {
    const normalizedGoal = goal
      .map((item) => String(item).trim())
      .filter(Boolean)

    return normalizedGoal.length > 0 ? normalizedGoal : undefined
  }

  const normalizedGoal = String(goal)
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)

  return normalizedGoal.length > 0 ? normalizedGoal : undefined
}

export const buildContainerPayloadObject = ({
  name,
  type,
  price = 0,
  level,
  subject,
  teacherAllowed = true,
  createdBy,
  parent,
  description,
  goal,
}) => {
  const payload = {
    name,
    type,
    price: Number(price) || 0,
    level,
    subject,
    teacherAllowed: Boolean(teacherAllowed),
  }

  if (createdBy) {
    payload.createdBy = createdBy
  }

  if (parent) {
    payload.parent = parent
  }

  if (type === "course") {
    if (description !== undefined && description !== null) {
      payload.description = description
    }

    const normalizedGoal = normalizeGoal(goal)
    if (normalizedGoal) {
      payload.goal = normalizedGoal
    }
  }

  return payload
}

export const buildLecturePayloadObject = ({
  name,
  price = 0,
  level,
  subject,
  parent,
  teacherAllowed = true,
  createdBy,
  videoLink,
  description,
  numberOfViews = 0,
  lectureType = "Revision",
  requiresExam = false,
  examFormUrl,
  examConfig,
  passingThreshold,
  requiresHomework = false,
  homeworkFormUrl,
  homeworkConfig,
  homeworkPassingThreshold,
}) => {
  const payload = {
    name,
    type: "lecture",
    price: Number(price) || 0,
    level,
    subject,
    teacherAllowed: Boolean(teacherAllowed),
    videoLink,
    description,
    numberOfViews: Number(numberOfViews) || 0,
    lecture_type: lectureType,
    requiresExam: Boolean(requiresExam),
    requiresHomework: Boolean(requiresHomework),
  }

  if (parent) {
    payload.parent = parent
  }

  if (createdBy) {
    payload.createdBy = createdBy
  }

  if (payload.requiresExam) {
    if (examFormUrl !== undefined && examFormUrl !== null && examFormUrl !== "") {
      payload.examFormUrl = examFormUrl
    }

    if (examConfig !== undefined && examConfig !== null && examConfig !== "") {
      payload.examConfig = examConfig
    }

    if (passingThreshold !== undefined && passingThreshold !== null && passingThreshold !== "") {
      payload.passingThreshold = Number(passingThreshold)
    }
  }

  if (payload.requiresHomework) {
    if (homeworkFormUrl !== undefined && homeworkFormUrl !== null && homeworkFormUrl !== "") {
      payload.homeworkFormUrl = homeworkFormUrl
    }

    if (homeworkConfig !== undefined && homeworkConfig !== null && homeworkConfig !== "") {
      payload.homeworkConfig = homeworkConfig
    }

    if (homeworkPassingThreshold !== undefined && homeworkPassingThreshold !== null && homeworkPassingThreshold !== "") {
      payload.homeworkPassingThreshold = Number(homeworkPassingThreshold)
    }
  }

  return payload
}

export const objectToFormData = (payload, fileEntries = []) => {
  const formData = new FormData()

  Object.entries(payload || {}).forEach(([key, value]) => {
    appendField(formData, key, value)
  })

  fileEntries.forEach(({ key, file }) => {
    if (file) {
      formData.append(key, file)
    }
  })

  return formData
}
