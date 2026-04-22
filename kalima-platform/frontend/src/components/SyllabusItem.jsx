import { useState, memo } from "react"
import { ChevronDown, Book, Clock, DollarSign, Unlock, Play, Eye } from "lucide-react"
import {
  formatLimitedLectureRemaining,
  getLimitedLectureAvailabilityStatus,
} from "../utils/limitedLectureAvailability"

const CONTAINER_TYPE_CONFIG = {
  course: { bg: "#0e556320", text: "#0e5563" },
  year: { bg: "#14b8a620", text: "#0f766e" },
  term: { bg: "#f59e0b20", text: "#b45309" },
  month: { bg: "#8b5cf620", text: "#6d28d9" },
  week: { bg: "#ec489920", text: "#be185d" },
  day: { bg: "#3b82f620", text: "#1d4ed8" },
  lecture: { bg: "#10b98120", text: "#047857" },
  exam: { bg: "#ef444420", text: "#b91c1c" },
  homework: { bg: "#f9731620", text: "#c2410c" },
}

const formatDuration = (minutes) => {
  if (!minutes || minutes <= 0) return null
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return `${hours}h ${mins > 0 ? `${mins}m` : ""}`
  }
  return `${mins}m`
}

const SyllabusItem = memo(function SyllabusItem({
  item,
  depth = 0,
  isPurchased,
  onPurchase,
  purchaseInProgress,
  parentPurchased = false,
  onNavigate,
  t,
  isRTL,
  tokens,
}) {
  const [isOpen, setIsOpen] = useState(false)

  const hasChildren = item.children && item.children.length > 0
  const isLecture = item.type === "lecture" || item.isLecture
  const purchased = parentPurchased || isPurchased(item._id)
  const childCount = item.children?.length || 0
  const limitedAvailability = getLimitedLectureAvailabilityStatus(item)
  const directPurchaseBlocked = isLecture && !purchased && limitedAvailability.isExpired
  const limitedAvailabilityCountdownLabel =
    limitedAvailability.isLimited && !limitedAvailability.isExpired
      ? formatLimitedLectureRemaining(limitedAvailability.remainingMs, { isRTL })
      : null

  const typeConfig = CONTAINER_TYPE_CONFIG[item.type] || {
    bg: `${tokens.lightAquaMist}30`,
    text: tokens.deepTeal,
  }

  const typeLabel = item.type
    ? t(`containerTypes.${item.type}`, item.type.charAt(0).toUpperCase() + item.type.slice(1))
    : t("containerTypes.module", "Module")

  const nestedPaddingPx = depth > 0 ? 10 + depth * 8 : 0

  const borderAccentColors = [
    tokens.deepTeal,
    tokens.softCyanTeal,
    tokens.warmMango,
    tokens.goldenSand,
  ]
  const accentColor = borderAccentColors[depth % borderAccentColors.length]

  const handleClick = () => {
    if (isLecture && purchased) {
      onNavigate(`/dashboard/student-dashboard/lecture-display/${item._id}`)
    } else if (hasChildren) {
      setIsOpen(!isOpen)
    }
  }

  const handlePurchaseClick = (e) => {
    e.stopPropagation()
    onPurchase(item._id)
  }

  return (
    <div
      className="border-b last:border-b-0"
      style={{ borderColor: "transparent" }}
    >
      {/* Item Header */}
      <div
        onClick={handleClick}
        role="button"
        tabIndex={hasChildren || isLecture ? 0 : -1}
        onKeyDown={(e) => e.key === "Enter" && handleClick()}
        className="w-full cursor-pointer rounded-2xl px-3 py-3 text-left transition-colors hover:bg-black/[0.02] focus:outline-none sm:flex sm:items-center sm:gap-3 sm:rounded-none sm:px-4"
        style={{
          paddingInlineStart: depth > 0 ? `${nestedPaddingPx}px` : undefined,
          background: depth > 0 ? `linear-gradient(90deg, ${accentColor}08, transparent 70%)` : "transparent",
          borderInlineStart: depth > 0 ? `2px solid ${accentColor}35` : "none",
        }}
      >
        <div className="flex items-start gap-3 min-w-0 sm:flex-1 sm:items-center">
          {/* Icon */}
          {hasChildren && !isLecture ? (
            <div
              className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-transform duration-200 sm:mt-0 sm:h-7 sm:w-7"
              style={{ background: `${accentColor}18`, border: `1.5px solid ${accentColor}30` }}
            >
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                style={{ color: accentColor }}
              />
            </div>
          ) : isLecture ? (
            <div
              className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full sm:mt-0 sm:h-7 sm:w-7"
              style={{ background: `${tokens.softCyanTeal}18` }}
            >
              <Play size={12} style={{ color: tokens.softCyanTeal }} />
            </div>
          ) : (
            <div
              className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full sm:mt-0 sm:h-7 sm:w-7"
              style={{ background: tokens.neutralCloud }}
            >
              <Book size={13} style={{ color: tokens.slateText }} />
            </div>
          )}

          {/* Title & Meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-[15px] leading-snug sm:text-sm" style={{ color: tokens.inkText }}>
                {item.name}
              </span>
              <span
                className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0"
                style={{ background: typeConfig.bg, color: typeConfig.text }}
              >
                {typeLabel}
              </span>
              {purchased && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: "rgba(22,163,74,0.12)", color: "#15803d" }}
                >
                  {t("syllabus.unlocked")}
                </span>
              )}
              {isLecture && limitedAvailability.isLimited && !purchased && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{
                    background: limitedAvailability.isExpired ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)",
                    color: limitedAvailability.isExpired ? "#b91c1c" : "#b45309",
                  }}
                >
                  {limitedAvailability.isExpired
                    ? (isRTL ? "انتهت الإتاحة" : "Expired")
                    : (isRTL ? "محاضرة محدودة" : "Limited lecture")}
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-3 flex-wrap">
              {childCount > 0 && !isLecture && (
                <span className="text-[12px] sm:text-[11px]" style={{ color: tokens.slateText }}>
                  {childCount} {t("syllabus.items")}
                </span>
              )}
              {(item.duration > 0 || item.totalDuration > 0) && (
                <span
                  className="text-[12px] sm:text-[11px] flex items-center gap-1"
                  style={{ color: tokens.slateText }}
                >
                  <Clock size={10} /> {formatDuration(item.duration || item.totalDuration)}
                </span>
              )}
            </div>

            {isLecture && limitedAvailability.isLimited && !purchased && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {!limitedAvailability.isExpired && limitedAvailabilityCountdownLabel && (
                  <div
                    className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-[13px] font-extrabold shadow-sm"
                    style={{
                      background: "linear-gradient(135deg, rgba(245,158,11,0.16), rgba(251,191,36,0.08))",
                      color: "#92400e",
                      border: "1px solid rgba(245,158,11,0.22)",
                    }}
                  >
                    <Clock size={14} />
                    <span>
                      {isRTL ? `متاح لمدة ${limitedAvailabilityCountdownLabel}` : `${limitedAvailabilityCountdownLabel} left to buy`}
                    </span>
                  </div>
                )}
                {limitedAvailability.endsAt && (
                  <span className="text-[12px] font-medium" style={{ color: tokens.slateText }}>
                    {limitedAvailability.isExpired
                      ? (isRTL ? "أُغلقت هذه المحاضرة للشراء المباشر" : "Direct purchase closed")
                      : `${isRTL ? "تنتهي في" : "Ends"} ${limitedAvailability.endsAt.toLocaleString(isRTL ? "ar-EG" : "en-US")}`}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-3 flex w-full sm:mt-0 sm:w-auto sm:flex-shrink-0 sm:justify-end">
          {purchased && !isLecture ? (
            <div
              className="flex w-full items-center justify-center gap-1.5 rounded-2xl px-3 py-2 text-[12px] font-bold shadow-sm sm:w-auto sm:rounded-full sm:px-3 sm:py-1.5 sm:text-[11px]"
              style={{
                background: "rgba(22,163,74,0.12)",
                color: "#15803d",
                border: "1px solid rgba(22,163,74,0.2)",
              }}
            >
              <Unlock size={11} />
              <span>{t("syllabus.unlocked", "Unlocked")}</span>
            </div>
          ) : isLecture && purchased ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onNavigate(`/dashboard/student-dashboard/lecture-display/${item._id}`)
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-2xl px-3 py-2 text-[12px] font-bold text-white transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm sm:w-auto sm:rounded-full sm:px-3 sm:py-1.5 sm:text-[11px]"
              style={{
                background: `linear-gradient(135deg, ${tokens.deepTeal}, ${tokens.softCyanTeal})`,
              }}
            >
              <Eye size={11} />
              <span className="hidden sm:inline">{t("syllabus.quickView")}</span>
              <span className="sm:hidden">{t("syllabus.watch", "Watch")}</span>
            </button>
          ) : !purchased && typeof item.price === "number" && item.price >= 0 ? (
            <button
              onClick={handlePurchaseClick}
              disabled={purchaseInProgress !== null || directPurchaseBlocked}
              className="flex w-full items-center justify-center gap-1.5 rounded-2xl px-3 py-2 text-[12px] font-bold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:transform-none shadow-sm sm:w-auto sm:rounded-full sm:px-3 sm:py-1.5 sm:text-[11px]"
              style={{
                background: directPurchaseBlocked
                  ? "#94a3b8"
                  : item.price > 0
                    ? tokens.warmMango
                    : tokens.softCyanTeal,
              }}
            >
              {purchaseInProgress === item._id ? (
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : directPurchaseBlocked ? (
                <>{isRTL ? "غير متاح" : "Unavailable"}</>
              ) : item.price > 0 ? (
                <>
                  <DollarSign size={11} /> {item.price}
                </>
              ) : (
                <>
                  <Unlock size={11} /> {t("purchase.getFree", "Get")}
                </>
              )}
            </button>
          ) : null}
        </div>
      </div>

      {/* Children */}
      {isOpen && hasChildren && (
        <div
          className="pb-1"
          style={{
            background: depth === 0 ? "rgba(14,85,99,0.016)" : "transparent",
            paddingInlineStart: depth === 0 ? "6px" : "0px",
          }}
        >
          {item.children.map((child, idx) => (
            <SyllabusItem
              key={child._id || child.id || idx}
              item={child}
              depth={depth + 1}
              isPurchased={isPurchased}
              onPurchase={onPurchase}
              purchaseInProgress={purchaseInProgress}
              parentPurchased={purchased}
              onNavigate={onNavigate}
              t={t}
              isRTL={isRTL}
              tokens={tokens}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export default SyllabusItem
