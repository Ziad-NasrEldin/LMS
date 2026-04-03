export const STUDENT_HOBBIES = [
  {
    id: "math",
    key: "math",
    value: "Math",
    labelEn: "Math",
    labelAr: "رياضيات",
  },
  {
    id: "programming",
    key: "programming",
    value: "Programming",
    labelEn: "Programming",
    labelAr: "برمجة",
  },
  {
    id: "art",
    key: "art",
    value: "Art",
    labelEn: "Art",
    labelAr: "فن",
  },
  {
    id: "languages",
    key: "languages",
    value: "Languages",
    labelEn: "Languages",
    labelAr: "لغات",
  },
  {
    id: "photography",
    key: "photography",
    value: "Photography",
    labelEn: "Photography",
    labelAr: "تصوير",
  },
  {
    id: "montage",
    key: "montage",
    value: "Montage",
    labelEn: "Montage",
    labelAr: "مونتاج",
  },
  {
    id: "designillustrating",
    key: "designIllustrating",
    value: "Design/Illustrating",
    labelEn: "Design/Illustrating",
    labelAr: "تصميم ورسوم",
  },
  {
    id: "marketing",
    key: "marketing",
    value: "Marketing",
    labelEn: "Marketing",
    labelAr: "تسويق",
  },
  {
    id: "other",
    key: "other",
    value: "Other",
    labelEn: "Other",
    labelAr: "أخرى",
  },
]

export const normalizeStudentHobby = (value) => String(value || "").trim().toLowerCase()
