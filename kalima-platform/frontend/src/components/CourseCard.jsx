import { useTranslation } from "react-i18next"
import { useState } from "react"
import { designTokens } from "../constants/designTokens"
import { resolveLevelDisplayName } from "../utils/levelHierarchy"
import { Star, Clock, BookOpen, GraduationCap, ArrowUpRight } from "lucide-react"

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
  containerImage,
  rating = 4.8,
  duration,
}) => {
  const { t, i18n } = useTranslation("home")
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const TOKENS = designTokens.colors
  const SHADOWS = designTokens.shadows

  const formatPrice = () => {
    if (typeof price !== "number") return t("priceUnavailable")
    if (price === 0) return t("free")
    const formattedNumber = price.toLocaleString(i18n.language === "ar" ? "ar-EG" : "en-US")
    return i18n.language === "ar" ? `${formattedNumber} ${t("currency")}` : `${t("currency")} ${formattedNumber}`
  }

  const getStatusText = () => {
    if (status === "مجاني" || status === "free") return t("free")
    return t("paid")
  }

  const isFree = status === "مجاني" || status === "free" || price === 0

  const imageToDisplay = !imageError && containerImage 
    ? containerImage 
    : !imageError && image 
      ? image 
      : "/course-1.png"

  return (
    <div
      className="group relative h-full overflow-hidden rounded-2xl bg-white transition-all duration-500 ease-out"
      dir={isRTL ? "rtl" : "ltr"}
      style={{ 
        borderColor: "rgba(17,24,39,0.06)",
        boxShadow: isHovered 
          ? "0 25px 50px -12px rgba(14, 85, 99, 0.25), 0 12px 24px -8px rgba(14, 85, 99, 0.15)" 
          : "0 4px 20px rgba(0, 0, 0, 0.08)",
        transform: isHovered ? "translateY(-8px)" : "translateY(0)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Section with Gradient Overlay */}
      <figure className="relative h-52 overflow-hidden">
        <img 
          src={imageToDisplay} 
          alt={title} 
          className="h-full w-full object-cover transition-transform duration-700 ease-out"
          style={{ transform: isHovered ? "scale(1.1)" : "scale(1)" }}
          onError={() => setImageError(true)}
        />
        
        {/* Gradient Overlay */}
        <div 
          className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
        />
        
        {/* Bottom Info Bar on Image */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center justify-end">
            {/* Price Display */}
            <div
              className="rounded-full px-3 py-1 text-sm font-bold"
              style={{
                background: isFree ? "rgba(34, 197, 94, 0.95)" : "rgba(255, 255, 255, 0.95)",
                color: isFree ? "#fff" : TOKENS.deepTeal,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              {isFree ? t("free") : formatPrice()}
            </div>
          </div>
        </div>
      </figure>

      {/* Content Section */}
      <div className="p-5">
        {/* Title */}
        <h2 
          className="mb-3 text-lg font-bold leading-tight transition-colors duration-300 group-hover:text-[#0E5563]"
          style={{ color: TOKENS.inkText }}
        >
          {title || t("titleFallback")}
        </h2>

        {/* Tags Row */}
        <div className="mb-4 flex flex-wrap gap-2">
          {subject && (
            <div 
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{ background: TOKENS.lightAquaMist, color: TOKENS.deepTeal }}
            >
              {subject}
            </div>
          )}
          {grade && (
            <div 
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
              style={{ background: TOKENS.neutralCloud, color: TOKENS.slateText }}
            >
              <GraduationCap className="h-3 w-3" />
              {resolveLevelDisplayName(grade, i18n.language)}
            </div>
          )}
          {duration && (
            <div 
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
              style={{ background: TOKENS.neutralCloud, color: TOKENS.slateText }}
            >
              <Clock className="h-3 w-3" />
              {duration}
            </div>
          )}
        </div>

        {/* Instructor Section */}
        <div 
          className="flex items-center gap-3 rounded-xl p-3 transition-colors duration-300"
          style={{ 
            background: isHovered ? TOKENS.lightAquaMist : TOKENS.neutralCloud,
          }}
        >
          {/* Avatar */}
          <div 
            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
            style={{ background: TOKENS.deepTeal, color: "#fff" }}
          >
            {teacher?.[0]?.toUpperCase() || "?"}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold" style={{ color: TOKENS.inkText }}>
              {teacher || t("teacherFallback")}
            </p>
            <p className="truncate text-xs" style={{ color: TOKENS.slateText }}>
              {teacherRole || t("roleFallback")}
            </p>
          </div>

          {/* Arrow Indicator on Hover */}
          <div 
            className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300"
            style={{ 
              background: isHovered ? TOKENS.deepTeal : "transparent",
              opacity: isHovered ? 1 : 0,
              transform: isHovered ? "translateX(0)" : `translateX(${isRTL ? '-10px' : '10px'})`,
            }}
          >
            <ArrowUpRight 
              className="h-4 w-4 transition-colors duration-300"
              style={{ color: isHovered ? "#fff" : TOKENS.deepTeal }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Accent Line */}
      <div 
        className="absolute bottom-0 left-0 h-1 transition-all duration-500 ease-out"
        style={{ 
          background: `linear-gradient(90deg, ${TOKENS.deepTeal}, ${TOKENS.softCyanTeal})`,
          width: isHovered ? "100%" : "0%",
        }}
      />
    </div>
  )
}
