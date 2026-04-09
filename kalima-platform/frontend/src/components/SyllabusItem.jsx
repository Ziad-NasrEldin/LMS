import { useState, memo } from "react"
import { ChevronDown, Book, Clock, DollarSign, Unlock, Play, Eye } from "lucide-react"

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

  const typeConfig = CONTAINER_TYPE_CONFIG[item.type] || {
    bg: `${tokens.lightAquaMist}30`,
    text: tokens.deepTeal,
  }

  const typeLabel = item.type
    ? t(`containerTypes.${item.type}`, item.type.charAt(0).toUpperCase() + item.type.slice(1))
    : t("containerTypes.module", "Module")

  const indentPx = depth * 16

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
      style={{ borderColor: "rgba(17,24,39,0.06)", marginInlineStart: `${indentPx}px` }}
    >
      {/* Item Header */}
      <div
        onClick={handleClick}
        role="button"
        tabIndex={hasChildren || isLecture ? 0 : -1}
        onKeyDown={(e) => e.key === "Enter" && handleClick()}
        className="w-full flex flex-col sm:flex-row sm:items-center gap-3 text-left transition-colors hover:bg-black/[0.02] focus:outline-none cursor-pointer p-3 sm:px-4"
        style={{
          borderInlineStart: depth > 0 ? `3px solid ${accentColor}30` : "none",
        }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Icon */}
          {hasChildren && !isLecture ? (
            <div
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-transform duration-200"
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
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: `${tokens.softCyanTeal}18` }}
            >
              <Play size={12} style={{ color: tokens.softCyanTeal }} />
            </div>
          ) : (
            <div
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: tokens.neutralCloud }}
            >
              <Book size={13} style={{ color: tokens.slateText }} />
            </div>
          )}

          {/* Title & Meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm leading-snug" style={{ color: tokens.inkText }}>
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
            </div>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              {childCount > 0 && !isLecture && (
                <span className="text-[11px]" style={{ color: tokens.slateText }}>
                  {childCount} {t("syllabus.items")}
                </span>
              )}
              {(item.duration > 0 || item.totalDuration > 0) && (
                <span
                  className="text-[11px] flex items-center gap-1"
                  style={{ color: tokens.slateText }}
                >
                  <Clock size={10} /> {formatDuration(item.duration || item.totalDuration)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isLecture && purchased ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onNavigate(`/dashboard/student-dashboard/lecture-display/${item._id}`)
            }}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-sm whitespace-nowrap self-start sm:self-center"
            style={{
              background: `linear-gradient(135deg, ${tokens.deepTeal}, ${tokens.softCyanTeal})`,
            }}
          >
            <Eye size={10} />
            <span className="hidden sm:inline">{t("syllabus.quickView")}</span>
            <span className="sm:hidden">{t("syllabus.watch", "Watch")}</span>
          </button>
        ) : !purchased && typeof item.price === "number" && item.price >= 0 ? (
          <button
            onClick={handlePurchaseClick}
            disabled={purchaseInProgress !== null}
            className="flex-shrink-0 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:transform-none shadow-sm whitespace-nowrap self-start sm:self-center"
            style={{
              background: item.price > 0 ? tokens.warmMango : tokens.softCyanTeal,
            }}
          >
            {purchaseInProgress === item._id ? (
              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : item.price > 0 ? (
              <>
                <DollarSign size={10} /> {item.price}
              </>
            ) : (
              <>
                <Unlock size={10} /> {t("purchase.getFree", "Get")}
              </>
            )}
          </button>
        ) : null}
      </div>

      {/* Children */}
      {isOpen && hasChildren && (
        <div style={{ background: depth === 0 ? "rgba(14,85,99,0.016)" : "transparent" }}>
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
