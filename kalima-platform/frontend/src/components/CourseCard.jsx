import { useTranslation } from "react-i18next"
import { useState } from "react"

export const CourseCard = ({
  image,
  title,
  subject,
  teacher,
  teacherRole,
  grade,
  stage,
  type,
  status,
  price,
  childrenCount,
  containerType,
  isRTL,
  containerImage, // New prop for container image from API
}) => {
  const { t, i18n } = useTranslation("home")
  const [imageError, setImageError] = useState(false)

  const formatPrice = () => {
    if (typeof price !== "number") return t("priceUnavailable")
    if (price === 0) return t("free")
    const formattedNumber = price.toLocaleString(i18n.language === "ar" ? "ar-EG" : "en-US")
    return i18n.language === "ar" ? `${formattedNumber} ${t("currency")}` : `${t("currency")} ${formattedNumber}`
  }

  // Determine the status badge color based on the status value
  const getStatusBadgeClass = () => {
    if (status === "مجاني" || status === "free") return "badge-success !text-white"
    return "badge-secondary"
  }

  // Determine the display text for the status
  const getStatusText = () => {
    if (status === "مجاني" || status === "free") return t("free")
    return t("paid")
  }

  // Handle image loading error
  const handleImageError = () => {
    setImageError(true)
  }

  // Determine which image to display
  // Priority: 1. containerImage from API, 2. image prop, 3. fallback image
  const imageToDisplay = !imageError && containerImage 
    ? containerImage 
    : !imageError && image 
      ? image 
      : "/course1.png"

  return (
    <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all h-full" dir={isRTL ? "rtl" : "ltr"}>
      <figure className="relative">
        <img 
          src={imageToDisplay || "/placeholder.svg"} 
          alt={title} 
          className="w-full h-48 object-cover" 
          onError={handleImageError}
        />
        {status && (
          <div className="absolute top-2 right-2">
            <div className={`badge ${getStatusBadgeClass()}`}>{getStatusText()}</div>
          </div>
        )}
      </figure>
      <div className="card-body">
        <h2 className="card-title">{title || t("titleFallback")}</h2>
        <div className="flex flex-wrap gap-2 mt-1">
          {subject && <div className="badge badge-primary">{subject}</div>}
          {grade && <div className="badge badge-secondary">{t(`gradeLevels.${grade}` ,{ ns: "common" })}</div>}
            {stage && <div className="badge badge-accent">{stage}</div>}
          {type && <div className="badge badge-outline">{type}</div>}
        </div>

        <div className="flex items-center mt-2">
          <div className="avatar avatar-placeholder">
            <div className="bg-neutral text-neutral-content rounded-full w-8">
              <span>{teacher?.[0] + (teacher?.[1] || "") || "?"}</span>
            </div>
          </div>
          <div className={isRTL ? "mr-2" : "ml-2"}>
            <p className="text-sm font-medium">{teacher || t("teacherFallback")}</p>
            <p className="text-xs text-gray-500">{teacherRole || t("roleFallback")}</p>
          </div>
        </div>

        {childrenCount > 0 && (
          <div className="mt-2 text-sm text-gray-600">{t("lessonsCount", { count: childrenCount })}</div>
        )}

        {containerType && containerType !== "course" && (
          <div className="mt-2 text-xs text-gray-500">
            {t("containerType")}: {containerType}
          </div>
        )}
      </div>
    </div>
  )
}
