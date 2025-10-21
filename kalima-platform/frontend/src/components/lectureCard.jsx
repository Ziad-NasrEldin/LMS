"use client"

import { useState } from "react"
import { Clock, BookOpen, Eye, Star, Wallet } from "lucide-react"
import { useTranslation } from "react-i18next"

export const LectureCard = ({
  id,
  thumbnail,
  title,
  subject,
  teacher,
  teacherId,
  grade,
  price,
  childrenCount,
  views,
  description,
  isRTL,
  isPurchased,
  onPurchase,
  userPoints,
  showTeacherPoints = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const { t } = useTranslation("lectures")

  const hasEnoughPoints = userPoints >= price

  return (
    <div className="card bg-base-100 shadow-xl overflow-hidden h-full">
      <figure className="relative h-48">
        <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full p-4">
          <h2 className="text-white font-bold text-xl">{title}</h2>
          <p className="text-white/80 text-sm">{subject}</p>
        </div>
      </figure>
      <div className="card-body p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="avatar avatar-placeholder">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold">{teacher.charAt(0)}</span>
              </div>
            </div>
            <div className="ml-2">
              <p className="font-medium text-sm">{teacher}</p>
              <p className="text-xs opacity-70">{t(`gradeLevels.${grade}`, { ns: "common" })}</p>
            </div>
          </div>
        </div>

        <div className="divider my-2"></div>

        <div className="mt-3">
          <p className={`text-sm opacity-80 ${isExpanded ? "" : "line-clamp-2"}`}>{description}</p>
          {description && description.length > 100 && (
            <button className="text-xs text-primary mt-1 hover:underline" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? t("showLess") : t("showMore")}
            </button>
          )}
        </div>

        <div className="card-actions justify-between items-center mt-4">
          <div className="flex items-center">
            {price > 0 ? (
              <div className="flex items-center">
                <span className="font-bold text-lg">{price}</span>
                <span className="text-xs ml-1">{t("points")}</span>
              </div>
            ) : (
              <span className="badge badge-success">{t("free")}</span>
            )}

            {/* Show teacher-specific points if enabled */}
            {showTeacherPoints && price > 0 && (
              <div className="flex items-center ml-2 text-xs">
                <Wallet className="w-3 h-3 mr-1" />
                <span className={hasEnoughPoints ? "text-green-600" : "text-red-600"}>
                  {t("available : ")} {userPoints}
                </span>
              </div>
            )}
          </div>

          {isPurchased ? (
            <button className="btn btn-sm btn-success" disabled>{t("purchased")}</button>
          ) : (
            <button
              className="btn btn-sm btn-primary"
              onClick={() => onPurchase(id)}
              disabled={price > 0 && !hasEnoughPoints}
            >
              {price > 0 ? t("purchase") : t("enroll")}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
