import { useTranslation } from "react-i18next"
import { useState } from "react"
import { designTokens } from "../constants/designTokens"
import { resolveLevelDisplayName } from "../utils/levelHierarchy"

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
  const TOKENS = designTokens.colors
  const SHADOWS = designTokens.shadows

  const formatPrice = () => {
    if (typeof price !== "number") return t("priceUnavailable")
    if (price === 0) return t("free")
    const formattedNumber = price.toLocaleString(i18n.language === "ar" ? "ar-EG" : "en-US")
    return i18n.language === "ar" ? `${formattedNumber} ${t("currency")}` : `${t("currency")} ${formattedNumber}`
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
      : "/course-1.png"

  return (
    <div
      className="h-full overflow-hidden rounded-[1.4rem] border bg-white transition-all"
      dir={isRTL ? "rtl" : "ltr"}
      style={{ borderColor: "rgba(17,24,39,0.08)", boxShadow: SHADOWS.level1 }}
    >
      <figure className="relative">
        <img 
          src={imageToDisplay || "/placeholder.svg"} 
          alt={title} 
          className="w-full h-48 object-cover" 
          onError={handleImageError}
        />
        {status && (
          <div className="absolute top-2 right-2">
            <div
              className="rounded-full px-3 py-1 text-xs font-bold"
              style={{
                background: status === "مجاني" || status === "free" ? "#22c55e" : TOKENS.goldenSand,
                color: status === "مجاني" || status === "free" ? "#F8FCFF" : TOKENS.inkText,
              }}
            >
              {getStatusText()}
            </div>
          </div>
        )}
      </figure>
      <div className="p-5">
        <h2 className="text-lg font-bold" style={{ color: TOKENS.inkText }}>{title || t("titleFallback")}</h2>
        <div className="flex flex-wrap gap-2 mt-1">
          {subject && <div className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: TOKENS.lightAquaMist, color: TOKENS.deepTeal }}>{subject}</div>}
          {grade && <div className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "#E8EEF7", color: TOKENS.slateText }}>{resolveLevelDisplayName(grade, i18n.language)}</div>}
          {stage && <div className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "#F3F4F6", color: TOKENS.slateText }}>{resolveLevelDisplayName(stage, i18n.language)}</div>}
          {type && <div className="rounded-full px-3 py-1 text-xs font-semibold" style={{ border: "1px solid rgba(17,24,39,0.14)", color: TOKENS.slateText }}>{type}</div>}
        </div>

        <div className="flex items-center mt-2">
          <div className="avatar avatar-placeholder">
            <div className="rounded-full w-8" style={{ background: TOKENS.deepTeal, color: "#F8FCFF" }}>
              <span>{teacher?.[0] + (teacher?.[1] || "") || "?"}</span>
            </div>
          </div>
          <div className={isRTL ? "mr-2" : "ml-2"}>
            <p className="text-sm font-medium">{teacher || t("teacherFallback")}</p>
            <p className="text-xs" style={{ color: TOKENS.slateText }}>{teacherRole || t("roleFallback")}</p>
          </div>
        </div>

        {childrenCount > 0 && (
          <div className="mt-2 text-sm" style={{ color: TOKENS.slateText }}>{t("lessonsCount", { count: childrenCount })}</div>
        )}

        {containerType && containerType !== "course" && (
          <div className="mt-2 text-xs" style={{ color: TOKENS.slateText }}>
            {t("containerType")}: {containerType}
          </div>
        )}
      </div>
    </div>
  )
}
