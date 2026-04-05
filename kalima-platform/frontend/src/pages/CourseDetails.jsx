"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { getContainerById, purchaseContainer, getEnrollmentCount } from "../routes/lectures"
import { getUserDashboard } from "../routes/auth-services"
import { LoadingSpinner } from "../components/LoadingSpinner"
import { ErrorAlert } from "../components/ErrorAlert"
import { designTokens } from "../constants/designTokens"
import { resolveLevelDisplayName } from "../utils/levelHierarchy"
import { resolveProfileImageUrl } from "../utils/profileImage"
import { getCourseReviews, getMyReview, createReview, updateMyReview, deleteMyReview } from "../routes/reviews"
import { buildCoursePath } from "../seo/site.mjs"
import { useSeo } from "../seo/useSeo"
import { buildBreadcrumbSchema, buildCourseSchema } from "../seo/structuredData.mjs"
import { 
  Star, 
  Users, 
  Clock, 
  RefreshCw, 
  BarChart3, 
  Brain, 
  Sparkles, 
  CheckCircle2,
  Lightbulb,
  ShoppingCart,
  Heart,
  Share2,
  School,
  Globe,
  Shield,
  ChevronRight,
  PlayCircle,
  Book,
  GraduationCap,
  DollarSign,
  Unlock,
  ChevronDown,
  Lock,
  Play,
  ThumbsUp,
  Flag
} from "lucide-react"

const normalizeId = (value) => {
  if (!value) return null
  if (typeof value === "string") return value
  if (typeof value === "object") {
    if (value._id) return normalizeId(value._id)
    if (value.id) return normalizeId(value.id)
  }

  const asString = typeof value?.toString === "function" ? value.toString() : null
  return asString && asString !== "[object Object]" ? asString : null
}

const getPurchaseContainerId = (purchase) => normalizeId(purchase?.container) || normalizeId(purchase?.lecture)

const DetailItem = ({ label, value, icon, tokens }) => (
  <div
    className="flex flex-col gap-2 border-b py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
    style={{ borderColor: "rgba(17,24,39,0.08)" }}
  >
    <div className="flex items-center gap-2" style={{ color: tokens.slateText }}>
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </div>
    <span className="text-sm font-semibold text-right" style={{ color: tokens.inkText }}>{value}</span>
  </div>
)

// ─── Syllabus Helpers ─────────────────────────────────────────────────────────

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY

function formatISODuration(iso) {
  if (!iso) return null
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return null
  const h = parseInt(m[1] || 0), min = parseInt(m[2] || 0), s = parseInt(m[3] || 0)
  if (h > 0) return `${h}h${min > 0 ? ` ${min}m` : ''}`
  if (min > 0) return `${min}m${s > 0 ? ` ${s}s` : ''}`
  return `${s}s`
}

async function fetchYTDuration(videoId) {
  if (!videoId || !YOUTUBE_API_KEY) return null
  try {
    const r = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${YOUTUBE_API_KEY}&part=contentDetails`
    )
    const d = await r.json()
    return formatISODuration(d?.items?.[0]?.contentDetails?.duration)
  } catch { return null }
}

function formatMins(mins) {
  if (!mins) return null
  const h = Math.floor(mins / 60), m = mins % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

// ─── Duration Calculation ─────────────────────────────────────────────────────

// Parse ISO 8601 duration (PT1H30M45S) to minutes
function parseISODuration(iso) {
  const m = iso?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return 0
  const h = parseInt(m[1] || 0)
  const min = parseInt(m[2] || 0)
  const s = parseInt(m[3] || 0)
  return h * 60 + min + (s > 30 ? 1 : 0)
}

// Extract YouTube video ID from various URL formats
function extractYouTubeId(url) {
  if (!url) return null
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

// Recursively fetch all nested containers and collect video IDs from lectures
async function collectAllVideoIds(containerIds, collected = new Set()) {
  if (!containerIds?.length) return collected
  
  const idsToFetch = containerIds.filter(id => !collected.has(id))
  if (!idsToFetch.length) return collected
  
  const results = await Promise.all(
    idsToFetch.map(id => 
      fetch(`${import.meta.env.VITE_API_URL}/containers/${id}`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(r => r?.data || null)
        .catch(() => null)
    )
  )
  
  const childIdsToFetch = []
  
  for (const item of results.filter(Boolean)) {
    if (item.type === 'lecture') {
      // Check all possible video URL fields
      const videoUrl = item.videoLink || item.videoURL || item.youtubeUrl || item.url || item.video
      const vid = extractYouTubeId(videoUrl)
      if (vid) collected.add(vid)
    } else if (item.children?.length) {
      childIdsToFetch.push(...item.children.map(c => typeof c === 'string' ? c : (c._id || c.id)))
    }
  }
  
  if (childIdsToFetch.length) {
    await collectAllVideoIds(childIdsToFetch, collected)
  }
  
  return collected
}

// Fetch total duration from YouTube API (batch requests, 50 max per call)
async function fetchTotalDurationFromYouTube(videoIds) {
  if (!videoIds?.length || !YOUTUBE_API_KEY) return 0
  
  const ids = [...videoIds]
  let totalMinutes = 0
  
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50).join(',')
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${batch}&key=${YOUTUBE_API_KEY}`
      )
      const data = await res.json()
      data.items?.forEach(item => {
        totalMinutes += parseISODuration(item.contentDetails?.duration)
      })
    } catch (e) {
      console.error('YouTube API error:', e)
    }
  }
  
  return totalMinutes
}

// Cache duration in localStorage
const getCachedDuration = (courseId) => {
  try {
    const cached = localStorage.getItem(`course_duration_${courseId}`)
    if (cached) {
      const { duration, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < 24 * 60 * 60 * 1000) return duration
    }
  } catch {}
  return null
}

const setCachedDuration = (courseId, duration) => {
  try {
    localStorage.setItem(`course_duration_${courseId}`, JSON.stringify({
      duration,
      timestamp: Date.now()
    }))
  } catch {}
}


const CONTAINER_TYPE_CONFIG = {
  course:  { bg: 'rgba(14,85,99,0.12)',   text: '#0E5563' },
  year:    { bg: 'rgba(20,106,120,0.12)',  text: '#146A78' },
  term:    { bg: 'rgba(77,179,194,0.15)',  text: '#0E5563' },
  month:   { bg: 'rgba(243,154,63,0.15)', text: '#b5721a' },
}

// ─── LectureRow ────────────────────────────────────────────────────────────────

const LectureRow = ({ item, depth, isPurchased, onPurchase, purchaseInProgress, onNavigate, t, isRTL }) => {
  const tokens = designTokens.colors
  const [ytDuration, setYtDuration] = useState(null)

  const lectureId = item?._id || item?.id
  const purchased = isPurchased(lectureId)
  const isPending = purchaseInProgress === lectureId

  useEffect(() => {
    if (!item?.videoLink) return
    const vid = extractYouTubeId(item.videoLink)
    if (vid) fetchYTDuration(vid).then(d => { if (d) setYtDuration(d) })
  }, [item?.videoLink])

  const duration = item?.duration > 0 ? formatMins(item.duration) : ytDuration
  const indentPx = 8 + depth * 12

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center gap-3 border-b last:border-b-0 transition-colors hover:bg-black/[0.018] group py-3 px-4"
      style={{ borderColor: 'rgba(17,24,39,0.05)', paddingInlineStart: `${indentPx}px` }}
    >
      {/* Icon */}
      <div
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
        style={{
          background: purchased ? `${tokens.deepTeal}18` : tokens.neutralCloud,
          border: `1.5px solid ${purchased ? tokens.deepTeal + '30' : 'rgba(17,24,39,0.08)'}`,
        }}
      >
        {purchased
          ? <Play size={13} style={{ color: tokens.deepTeal }} />
          : <Lock size={13} style={{ color: tokens.slateText }} />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-snug" style={{ color: tokens.inkText }}>{item?.name}</p>
        {duration && (
          <span className="inline-flex items-center gap-1 mt-0.5 text-[11px]" style={{ color: tokens.slateText }}>
            <Clock size={10} /> {duration}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0 sm:self-center">
        {purchased ? (
          <button
            onClick={() => onNavigate(`/dashboard/student-dashboard/lecture-display/${lectureId}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-sm whitespace-nowrap"
            style={{ background: `linear-gradient(135deg, ${tokens.deepTeal}, ${tokens.softCyanTeal})` }}
          >
            <Play size={10} />
            <span className="hidden sm:inline">{t('syllabus.quickView')}</span>
            <span className="sm:hidden">{t('syllabus.watch', 'Watch')}</span>
          </button>
        ) : typeof item?.price === 'number' ? (
          <button
            onClick={() => onPurchase(lectureId)}
            disabled={isPending || purchaseInProgress !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none whitespace-nowrap"
            style={{ background: item.price > 0 ? tokens.warmMango : tokens.softCyanTeal }}
          >
            {isPending ? (
              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : item.price > 0 ? (
              <><ShoppingCart size={10} /> {item.price}</>
            ) : (
              <><Unlock size={10} /> {t('purchase.getFree', 'Get')}</>
            )}
          </button>
        ) : null}
      </div>
    </div>
  )
}

// ─── ContainerRow ─────────────────────────────────────────────────────────────

const ContainerRow = ({ item, depth, isPurchased, onPurchase, purchaseInProgress, parentPurchased, onNavigate, t, isRTL }) => {
  const tokens = designTokens.colors
  const hasKids = (item?.children?.length > 0) || ['course', 'year', 'term', 'month'].includes(item?.type)
  const [isOpen, setIsOpen] = useState(depth === 0)
  const [children, setChildren] = useState(
    item?.children?.length > 0 && typeof item.children[0] === 'object' ? item.children : []
  )
  const [childrenLoaded, setChildrenLoaded] = useState(
    item?.children?.length > 0 && typeof item.children[0] === 'object'
  )
  const [loading, setLoading] = useState(false)

  const itemId = item?._id || item?.id
  const purchased = parentPurchased || isPurchased(itemId)
  const childCount = item?.children?.length || 0
  const typeConfig = CONTAINER_TYPE_CONFIG[item?.type] || { bg: `${tokens.lightAquaMist}30`, text: tokens.deepTeal }
  const typeLabel = item?.type ? t(`containerTypes.${item.type}`, item.type.charAt(0).toUpperCase() + item.type.slice(1)) : t('containerTypes.module', 'Module')
  const indentPx = depth * 12

  const toggle = async () => {
    if (!hasKids) return
    if (isOpen) { setIsOpen(false); return }
    if (childrenLoaded) { setIsOpen(true); return }
    setLoading(true)
    try {
      if (item?.children?.length > 0 && typeof item.children[0] === 'object') {
        setChildren(item.children)
        setChildrenLoaded(true)
      } else if (item?.children?.length > 0) {
        const results = await Promise.all(
          item.children.map(id => getContainerById(typeof id === 'string' ? id : (id._id || id.id)))
        )
        setChildren(results.filter(r => r?.data).map(r => r.data))
        setChildrenLoaded(true)
      } else {
        const result = await getContainerById(itemId)
        if (result?.data?.children?.length > 0) {
          const cids = result.data.children
          const results = await Promise.all(
            cids.map(id => getContainerById(typeof id === 'string' ? id : (id._id || id.id)))
          )
          setChildren(results.filter(r => r?.data).map(r => r.data))
          setChildrenLoaded(true)
        }
      }
    } catch (e) { console.error('Syllabus load error:', e) }
    setLoading(false)
    setIsOpen(true)
  }

  // Depth-based left border accent color
  const borderAccentColors = [tokens.deepTeal, tokens.softCyanTeal, tokens.warmMango, tokens.goldenSand]
  const accentColor = borderAccentColors[depth % borderAccentColors.length]

  return (
    <div
      className="border-b last:border-b-0"
      style={{ borderColor: 'rgba(17,24,39,0.06)', marginInlineStart: `${indentPx}px` }}
    >
      {/* Accordion Header */}
      <div
        onClick={toggle}
        role="button"
        tabIndex={hasKids ? 0 : -1}
        onKeyDown={(e) => e.key === 'Enter' && toggle()}
        className="w-full flex flex-col sm:flex-row sm:items-center gap-3 text-left transition-colors hover:bg-black/[0.02] focus:outline-none cursor-pointer p-3 sm:px-4"
        style={{
          borderInlineStart: depth > 0 ? `3px solid ${accentColor}30` : 'none',
        }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Expand icon */}
          {hasKids ? (
            <div
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: `${accentColor}18`, border: `1.5px solid ${accentColor}30` }}
            >
              {loading ? (
                <span className="w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${accentColor}80`, borderTopColor: 'transparent' }} />
              ) : (
                <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} style={{ color: accentColor }} />
              )}
            </div>
          ) : (
            <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: tokens.neutralCloud }}>
              <Book size={13} style={{ color: tokens.slateText }} />
            </div>
          )}

          {/* Title & meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm leading-snug" style={{ color: tokens.inkText }}>{item?.name}</span>
              <span
                className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0"
                style={{ background: typeConfig.bg, color: typeConfig.text }}
              >
                {typeLabel}
              </span>
              {purchased && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: 'rgba(22,163,74,0.12)', color: '#15803d' }}>
                  {t('syllabus.unlocked')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              {childCount > 0 && (
                <span className="text-[11px]" style={{ color: tokens.slateText }}>
                  {childCount} {t('syllabus.items')}
                </span>
              )}
              {item?.duration > 0 && (
                <span className="text-[11px] flex items-center gap-1" style={{ color: tokens.slateText }}>
                  <Clock size={10} /> {formatMins(item.duration)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Buy button */}
        {!purchased && typeof item?.price === 'number' && (
          <button
            onClick={(e) => { e.stopPropagation(); onPurchase(itemId) }}
            disabled={purchaseInProgress !== null}
            className="flex-shrink-0 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:transform-none shadow-sm whitespace-nowrap self-start sm:self-center"
            style={{ background: item.price > 0 ? tokens.warmMango : tokens.softCyanTeal }}
          >
            {purchaseInProgress === itemId ? (
              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : item.price > 0 ? (
              <><DollarSign size={10} /> {item.price}</>
            ) : (
              <><Unlock size={10} /> {t('purchase.getFree', 'Get')}</>
            )}
          </button>
        )}
      </div>

      {/* Children */}
      {isOpen && children.length > 0 && (
        <div style={{ background: depth === 0 ? 'rgba(14,85,99,0.016)' : 'transparent' }}>
          {children.map((child, idx) => {
            const key = child?._id || child?.id || idx
            if (child?.type === 'lecture') {
              return (
                <LectureRow
                  key={key}
                  item={child}
                  depth={depth + 1}
                  isPurchased={isPurchased}
                  onPurchase={onPurchase}
                  purchaseInProgress={purchaseInProgress}
                  onNavigate={onNavigate}
                  t={t}
                  isRTL={isRTL}
                />
              )
            }
            return (
              <ContainerRow
                key={key}
                item={child}
                depth={depth + 1}
                isPurchased={isPurchased}
                onPurchase={onPurchase}
                purchaseInProgress={purchaseInProgress}
                parentPurchased={purchased}
                onNavigate={onNavigate}
                t={t}
                isRTL={isRTL}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function CourseDetails() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { t, i18n } = useTranslation("courseDetails")
  const { t: tCommon } = useTranslation("common")
  const isRTL = i18n.language === "ar"
  const TOKENS = designTokens.colors
  const SHADOWS = designTokens.shadows
  const RADIUS = designTokens.radius
  const GRADIENTS = designTokens.gradients

  const [courseData, setCourseData] = useState(null)
  const [purchaseHistory, setPurchaseHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [purchaseInProgress, setPurchaseInProgress] = useState(null)
  const [purchaseError, setPurchaseError] = useState("")
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showShareToast, setShowShareToast] = useState(false)
  const [remainingPoints, setRemainingPoints] = useState(null)
  const [activeTab, setActiveTab] = useState('syllabus')
  const [enrollmentCount, setEnrollmentCount] = useState(0)
  const [openFaqIndex, setOpenFaqIndex] = useState(null)
  const [computedDuration, setComputedDuration] = useState(null)
  const [reviews, setReviews] = useState([])
  const [reviewStats, setReviewStats] = useState({
    average: 0,
    total: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  })
  const [myReview, setMyReview] = useState(null)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState('')

  // Recursive function to count all containers and lectures
  const countCourseContent = useMemo(() => {
    const countRecursive = (items) => {
      let containers = 0
      let lectures = 0

      if (!items?.length) return { containers, lectures }

      for (const item of items) {
        if (item?.type === 'lecture') {
          lectures++
        } else {
          containers++
          // Recursively count children
          if (item?.children?.length) {
            const childCounts = countRecursive(item.children)
            containers += childCounts.containers
            lectures += childCounts.lectures
          }
          // Also check lectures array on containers
          if (item?.lectures?.length) {
            lectures += item.lectures.length
          }
        }
      }

      return { containers, lectures }
    }

    return () => {
      const topLevel = courseData?.children || []
      const directLectures = courseData?.lectures || []
      const result = countRecursive(topLevel)
      result.lectures += directLectures.length
      return result
    }
  }, [courseData])

  const courseName = String(courseData?.name || "").trim()
  const canonicalPath = courseData ? buildCoursePath(courseData) : null
  const seoDescription =
    String(courseData?.description || "").trim() ||
    (courseData?.subject?.name
      ? isRTL
        ? `اطّلع على تفاصيل دورة ${courseName} في مادة ${courseData.subject.name} على منصة فكرة التعليمية، بما يشمل المحتوى الدراسي والمعلم والمرحلة التعليمية.`
        : `Discover the ${courseName} course in ${courseData.subject.name} on Fekra.`
      : isRTL
        ? `اطّلع على تفاصيل دورة ${courseName} على منصة فكرة التعليمية، بما يشمل المحتوى الدراسي والمعلم والمرحلة التعليمية.`
        : `Discover ${courseData?.name || "this course"} on Fekra.`)
  const seoImage =
    courseData?.image?.url ||
    courseData?.containerImage?.url ||
    courseData?.inheritedImage?.image?.url ||
    "/Fekra.png"
  const levelName = courseData?.level
    ? resolveLevelDisplayName(courseData.level, i18n.language)
    : ""

  useSeo(
    courseData
      ? {
          title: isRTL
            ? `${courseName} | دورات منصة فكرة التعليمية`
            : `${courseName} | Fekra Courses`,
          description: seoDescription,
          canonicalPath,
          image: seoImage,
          lang: i18n.language?.startsWith("en") ? "en" : "ar",
          dir: isRTL ? "rtl" : "ltr",
          schema: [
            buildBreadcrumbSchema([
              { name: isRTL ? "الرئيسية" : "Home", path: "/" },
              { name: isRTL ? "الدورات" : "Courses", path: "/courses" },
              { name: courseName, path: canonicalPath },
            ]),
            buildCourseSchema({
              name: courseName,
              description: seoDescription,
              path: canonicalPath,
              image: seoImage,
              subject: courseData?.subject?.name,
              instructor: courseData?.createdBy?.name,
              level: levelName,
              price: typeof courseData?.price === "number" ? courseData.price : 0,
            }),
          ],
        }
      : {
          title: isRTL ? "تفاصيل الدورة | منصة فكرة التعليمية" : "Course Details | Fekra",
          description: isRTL
            ? "اطّلع على تفاصيل الدورات التعليمية المتاحة على منصة فكرة التعليمية."
            : "View course details on Fekra.",
          canonicalPath: location.pathname,
          lang: i18n.language?.startsWith("en") ? "en" : "ar",
          dir: isRTL ? "rtl" : "ltr",
        },
  )

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        const [courseResult, dashboardResult] = await Promise.all([
          getContainerById(courseId),
          getUserDashboard({
            params: {
              fields: "userInfo,purchaseHistory",
            },
          }),
        ])

        if (courseResult?.status === "success" && courseResult.data) {
          setCourseData(courseResult.data)
        } else {
          setError(t("errors.fetchError"))
        }

        if (dashboardResult?.success) {
          setPurchaseHistory(dashboardResult.data.data.purchaseHistory || [])
          if (dashboardResult.data.data.userInfo) {
            setRemainingPoints(dashboardResult.data.data.userInfo.generalPoints)
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err)
        setError(t("errors.unexpected"))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [courseId])

  // Fetch enrollment count
  useEffect(() => {
    const fetchEnrollmentCount = async () => {
      if (!courseId) return
      
      try {
        const result = await getEnrollmentCount(courseId)
        if (result.success) {
          setEnrollmentCount(result.count)
        }
      } catch (err) {
        console.error("Error fetching enrollment count:", err)
      }
    }

    fetchEnrollmentCount()
  }, [courseId])

  // Calculate total course duration from YouTube videos
  useEffect(() => {
    if (!courseData) return
    
    // Check cache first
    const cached = getCachedDuration(courseData._id)
    if (cached) {
      setComputedDuration(cached)
      return
    }
    
    // If backend already has totalDuration, use it
    if (courseData.totalDuration > 0) {
      setComputedDuration(courseData.totalDuration)
      setCachedDuration(courseData._id, courseData.totalDuration)
      return
    }
    
    // Otherwise, fetch from YouTube API
    const calculateDuration = async () => {
      try {
        // Get all child IDs to fetch
        const childIds = courseData.children?.map(c => typeof c === 'string' ? c : (c._id || c.id)) || []
        if (!childIds.length) return
        
        // Collect all video IDs recursively
        const videoIds = await collectAllVideoIds(childIds)
        if (!videoIds.size) return
        
        // Fetch durations from YouTube API
        const totalMinutes = await fetchTotalDurationFromYouTube([...videoIds])
        if (totalMinutes > 0) {
          setComputedDuration(totalMinutes)
          setCachedDuration(courseData._id, totalMinutes)
        }
      } catch (err) {
        console.error('Failed to calculate duration:', err)
      }
    }
    
    calculateDuration()
  }, [courseData])

  // Handle canonical path redirect
  useEffect(() => {
    if (!courseData || !canonicalPath) return

    const normalizedCurrentPath = (location.pathname || "").replace(/\/+$/, "")
    const normalizedCanonicalPath = canonicalPath.replace(/\/+$/, "")

    if (normalizedCurrentPath !== normalizedCanonicalPath) {
      navigate(canonicalPath, { replace: true })
    }
  }, [canonicalPath, courseData, location.pathname, navigate])

  // Check if a container is purchased
  const isContainerPurchased = useMemo(() => {
    const purchasedIds = new Set(
      purchaseHistory
        .map((purchase) => getPurchaseContainerId(purchase))
        .filter(Boolean),
    )

    return (containerId) => {
      const normalizedContainerId = normalizeId(containerId)
      if (!normalizedContainerId) return false

      if (purchasedIds.has(normalizedContainerId)) {
        return true
      }

      if (courseData && courseData._id) {
        if (purchasedIds.has(normalizeId(courseData._id)) && normalizedContainerId !== normalizeId(courseData._id)) {
          return true
        }

        const findParentRecursive = (container, targetId) => {
          if (!container || !container.children) return false

          const isDirectChild = container.children.some((child) => normalizeId(child._id || child.id) === targetId)

          if (isDirectChild && purchasedIds.has(normalizeId(container._id))) {
            return true
          }

          return container.children.some((child) => {
            if (typeof child === "object" && child !== null && child.children) {
              return findParentRecursive(child, targetId)
            }
            return false
          })
        }

        return findParentRecursive(courseData, normalizedContainerId)
      }

      return false
    }
  }, [purchaseHistory, courseData])

  // Handle container purchase
  const handlePurchase = async (containerId) => {
    const normalizedContainerId = normalizeId(containerId)
    setPurchaseInProgress(containerId)
    setPurchaseError("")
    setPurchaseSuccess(false)

    try {
      const response = await purchaseContainer(containerId)

      if (response && response.data && response.data.status === "success") {
        setPurchaseSuccess(true)

        if (response.data.data && response.data.data.remainingLecturerPoints !== undefined) {
          setRemainingPoints(response.data.data.remainingLecturerPoints)
        }

        const purchaseFromResponse = response.data?.data?.purchase
        const purchasedId = getPurchaseContainerId(purchaseFromResponse) || normalizedContainerId

        if (purchasedId) {
          setPurchaseHistory((prevHistory) => {
            const alreadyRecorded = prevHistory.some((purchase) => getPurchaseContainerId(purchase) === purchasedId)
            if (alreadyRecorded) return prevHistory

            return [
              ...prevHistory,
              {
                ...(purchaseFromResponse || {}),
                type: purchaseFromResponse?.type || "containerPurchase",
                container: { _id: purchasedId },
              },
            ]
          })
        }

        refreshPurchaseHistory()
        
        // Refresh enrollment count to show updated number immediately
        refreshEnrollmentCount()
      } else {
        setPurchaseError(response?.error || response?.data?.message || t("purchase.purchaseError"))
      }
    } catch (err) {
      console.error("Purchase error:", err)
      setPurchaseError(err.response?.data?.message || t("errors.purchaseProcessError"))
    } finally {
      setPurchaseInProgress(null)
    }
  }

  // Refresh purchase history from API
  const refreshPurchaseHistory = async () => {
    try {
      const dashboardResult = await getUserDashboard({
        params: {
          fields: "userInfo,purchaseHistory",
        },
      })

      if (dashboardResult?.success) {
        setPurchaseHistory(dashboardResult.data.data.purchaseHistory || [])
        if (dashboardResult.data.data.userInfo) {
          setRemainingPoints(dashboardResult.data.data.userInfo.generalPoints || 0)
        }
      }
    } catch (err) {
      console.error("Error refreshing purchase history:", err)
    }
  }

  // Refresh enrollment count from API
  const refreshEnrollmentCount = async () => {
    if (!courseId) return
    
    try {
      const result = await getEnrollmentCount(courseId)
      if (result.success) {
        setEnrollmentCount(result.count)
      }
    } catch (err) {
      console.error("Error refreshing enrollment count:", err)
    }
  }

  const handleShare = async () => {
    const shareUrl = window.location.href
    const shareTitle = courseData?.name || "Course"
    const shareText = t('hero.shareText', { title: shareTitle })

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        })
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err)
          fallbackShare(shareUrl)
        }
      }
    } else {
      fallbackShare(shareUrl)
    }
  }

  const fallbackShare = async (url) => {
    try {
      await navigator.clipboard.writeText(url)
      setShowShareToast(true)
      setTimeout(() => setShowShareToast(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      if (!courseId) return
      
      const result = await getCourseReviews(courseId)
      if (result.status === 'success') {
        setReviews(result.data.reviews || [])
        setReviewStats(result.data.stats || { average: 0, total: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } })
      }
    }
    
    fetchReviews()
  }, [courseId])

  // Fetch student's own review
  useEffect(() => {
    const fetchMyReview = async () => {
      if (!courseId || !purchaseHistory.length) return
      
      const result = await getMyReview(courseId)
      if (result.status === 'success' && result.data) {
        setMyReview(result.data)
        setReviewForm({ rating: result.data.rating, comment: result.data.comment })
      }
    }
    
    fetchMyReview()
  }, [courseId, purchaseHistory.length])

  // Handle review submission
  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setReviewError('')
    setReviewSuccess('')
    setReviewLoading(true)
    
    try {
      let result
      if (myReview) {
        result = await updateMyReview(courseId, reviewForm)
      } else {
        result = await createReview({ ...reviewForm, containerId: courseId })
      }
      
      if (result.status === 'success') {
        setReviewSuccess(myReview ? 'Review updated successfully!' : 'Review submitted successfully!')
        setMyReview(result.data)
        // Refresh reviews list
        const reviewsResult = await getCourseReviews(courseId)
        if (reviewsResult.status === 'success') {
          setReviews(reviewsResult.data.reviews || [])
          setReviewStats(reviewsResult.data.stats || { average: 0, total: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } })
        }
        setTimeout(() => setReviewSuccess(''), 3000)
      } else {
        setReviewError(result.message || 'Failed to submit review')
      }
    } catch (err) {
      setReviewError('An error occurred. Please try again.')
    } finally {
      setReviewLoading(false)
    }
  }

  // Handle review deletion
  const handleDeleteReview = async () => {
    if (!confirm('Are you sure you want to delete your review?')) return
    
    setReviewLoading(true)
    const result = await deleteMyReview(courseId)
    if (result.status === 'success') {
      setMyReview(null)
      setReviewForm({ rating: 5, comment: '' })
      setReviewSuccess('Review deleted successfully')
      // Refresh reviews list
      const reviewsResult = await getCourseReviews(courseId)
      if (reviewsResult.status === 'success') {
        setReviews(reviewsResult.data.reviews || [])
        setReviewStats(reviewsResult.data.stats || { average: 0, total: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } })
      }
      setTimeout(() => setReviewSuccess(''), 3000)
    }
    setReviewLoading(false)
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorAlert message={error} />
  if (!courseData) return <ErrorAlert message={t("errors.courseNotFound")} />

  // Calculate last updated date from course content
  const getLastUpdatedDate = () => {
    // First, check if the course itself has an updatedAt
    const courseUpdatedAt = courseData?.updatedAt || courseData?.updated_at || courseData?.createdAt || courseData?.created_at
    
    // Collect all content items
    const allContent = [
      ...(courseData?.children || []),
      ...(courseData?.lectures || [])
    ]
    
    // Extract all possible date fields from content
    const allDates = []
    
    // Add course-level date if exists
    if (courseUpdatedAt) {
      allDates.push(new Date(courseUpdatedAt))
    }
    
    // Check each content item for dates
    allContent.forEach(item => {
      const dateFields = [
        item?.updatedAt,
        item?.updated_at,
        item?.createdAt,
        item?.created_at,
        item?.date,
        item?.timestamp,
        item?.addedAt
      ]
      
      dateFields.forEach(dateStr => {
        if (dateStr) {
          const date = new Date(dateStr)
          if (!isNaN(date)) {
            allDates.push(date)
          }
        }
      })
    })
    
    if (allDates.length === 0) return null
    
    // Find the most recent date
    const latestDate = new Date(Math.max(...allDates))
    
    // Format as "Month Year" (e.g., "March 2024")
    return latestDate.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
      month: 'long',
      year: 'numeric'
    })
  }

  // Sample data for the new design
  const course = {
    id: courseData._id,
    code: courseData.subject?.name || "COURSE",
    category: courseData.type || "Course",
    title: courseData.name,
    description: courseData.description || "",
    instructor: {
      name: courseData.createdBy?.name || t("instructor", "Instructor"),
      title: t("instructor", "Instructor"),
      avatar: resolveProfileImageUrl(courseData.createdBy?.profilePic || courseData.createdBy?.profilePicture?.url || courseData.createdBy?.profilePicture || null)
    },
    rating: 4.8,
    students: enrollmentCount || 0,
    level: levelName || t("level.beginner", "Beginner"),
    duration: typeof computedDuration === 'string' ? computedDuration : (formatMins(computedDuration) || "—"),
    updated: getLastUpdatedDate() || t("notAvailable", "Not available"),
    language: isRTL ? t("language.arabic", "Arabic") : t("language.english", "English (UK)"),
    certification: true,
    price: courseData.price || 0,
    originalPrice: courseData.price * 2 || 70000,
    discount: courseData.price > 0 ? 50 : 0,
    image: seoImage,
    targetAudience: courseData.subject?.name ? [courseData.subject.name] : [t("general", "General")],
    outcomes: courseData.goal || [t("outcome1", "Master the course content"), t("outcome2", "Gain practical skills")]
  }

  const tabs = [
    { id: 'syllabus', label: t('tabs.syllabus', 'Syllabus') },
    { id: 'reviews', label: t('tabs.reviews', 'Reviews') },
    { id: 'instructors', label: t('tabs.instructors', 'Instructors') },
    { id: 'faq', label: t('tabs.faq', 'FAQ') }
  ]

  const quickStats = [
    {
      icon: BarChart3,
      label: t('stats.level', 'Level'),
      value: course.level,
      color: TOKENS.deepTeal
    },
    {
      icon: Users,
      label: t('stats.students', 'Students'),
      value: `${course.students} ${t('enrolled', 'Enrolled')}`,
      color: TOKENS.deepTeal
    },
    {
      icon: Clock,
      label: t('stats.duration', 'Duration'),
      value: course.duration,
      color: TOKENS.deepTeal
    },
    {
      icon: RefreshCw,
      label: t('stats.updated', 'Updated'),
      value: course.updated,
      color: TOKENS.deepTeal
    }
  ]

  const courseDetails = [
    {
      icon: School,
      label: t('details.level', 'Level'),
      value: course.level
    },
    {
      icon: Users,
      label: t('details.totalEnrolled', 'Total Enrolled'),
      value: `${course.students} ${t('students', 'Students')}`
    },
    {
      icon: Globe,
      label: t('details.language', 'Language'),
      value: course.language
    },
    {
      icon: Shield,
      label: t('details.certification', 'Certification'),
      value: course.certification ? t('yes', 'Yes') : t('no', 'No')
    }
  ]

  const ratingBreakdown = [
    { stars: 5, pct: 82 },
    { stars: 4, pct: 12 },
    { stars: 3, pct: 4 },
    { stars: 2, pct: 1 },
    { stars: 1, pct: 1 },
  ]

  const sampleReviews = [
    {
      id: 1,
      name: t('reviews.r1.name', 'Ahmed Hassan'),
      role: t('reviews.r1.role', 'Engineering Student'),
      initials: 'AH',
      rating: 5,
      date: t('reviews.r1.date', 'October 2023'),
      helpfulCount: 8,
      text: t('reviews.r1.text', 'This course completely changed the way I understand the subject. The instructor explains complex concepts in a clear, structured way. I highly recommend it to anyone looking to deepen their knowledge.')
    },
    {
      id: 2,
      name: t('reviews.r2.name', 'Nour El-Din'),
      role: t('reviews.r2.role', 'MSc. Student'),
      initials: 'NE',
      rating: 4,
      date: t('reviews.r2.date', 'September 2023'),
      helpfulCount: 12,
      text: t('reviews.r2.text', 'Excellent content and a well-organized curriculum. The practical examples helped me connect theory to real applications. I would have appreciated more exercises, but overall a fantastic resource.')
    },
    {
      id: 3,
      name: t('reviews.r3.name', 'Sara Khalil'),
      role: t('reviews.r3.role', 'Undergraduate Student'),
      initials: 'SK',
      rating: 5,
      date: t('reviews.r3.date', 'August 2023'),
      helpfulCount: 4,
      text: t('reviews.r3.text', 'This course was the turning point for my exams. The breakdown of key concepts made the material finally make sense in a real context. Highly recommended for anyone struggling with this subject.')
    }
  ]

  const faqItems = [
    {
      icon: GraduationCap,
      question: t('faq.q1', 'What are the prerequisites for this course?'),
      answer: t('faq.a1', 'No prior experience is required. This course is designed to be accessible to all learners. A basic understanding of the subject area will be helpful but is not mandatory.')
    },
    {
      icon: Shield,
      question: t('faq.q2', 'Will I receive a certificate upon completion?'),
      answer: t('faq.a2', 'Yes! After successfully completing all course content and assessments, you will receive a verified digital certificate that you can share on your LinkedIn profile or include in your CV.')
    },
    {
      icon: Clock,
      question: t('faq.q3', 'How long do I have access to the course?'),
      answer: t('faq.a3', 'Once you purchase the course, you have lifetime access to all materials. You can revisit lectures and resources anytime at your own pace.')
    },
    {
      icon: DollarSign,
      question: t('faq.q4', 'Is there a refund policy?'),
      answer: t('faq.a4', 'We offer a satisfaction guarantee. If you are not happy with the course, please contact our support team within the first week of purchase and we will work with you to find a solution.')
    },
    {
      icon: Globe,
      question: t('faq.q5', 'In what language is the course taught?'),
      answer: t('faq.a5', 'The course content is delivered in Arabic with supporting materials available in both Arabic and English to ensure all learners can follow along comfortably.')
    },
    {
      icon: Brain,
      question: t('faq.q6', 'How is the course structured?'),
      answer: t('faq.a6', 'The course is broken into structured modules, each containing video lectures, practical exercises, and quizzes. You can progress at your own pace and revisit any section as needed.')
    }
  ]

  return (
    <div
      className="min-h-screen"
      style={{ background: GRADIENTS.pageAtmosphere }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section 
          className="relative overflow-hidden rounded-[2rem] p-8 text-white lg:p-12"
          style={{ 
            background: GRADIENTS.hero,
            boxShadow: SHADOWS.level2
          }}
        >
          <div className="relative z-10 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Course Title */}
              <h1 className="text-4xl font-black leading-tight lg:text-6xl">
                {course.title}
              </h1>

              {/* Instructor Info */}
              <div className="flex items-center gap-4">
                <img 
                  src={course.instructor.avatar}
                  alt={course.instructor.name}
                  className="h-14 w-14 rounded-full border-2 border-white/20 object-cover"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = resolveProfileImageUrl(null)
                  }}
                />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-white/70">
                    {t("taughtBy", "Taught by")}
                  </p>
                  <p className="text-xl font-bold">
                    {course.instructor.name}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 rounded-full border border-white/20 px-5 py-2 sm:px-8 sm:py-3 text-sm sm:text-base font-bold backdrop-blur-md transition-all hover:bg-white/10">
                  <Share2 className="h-5 w-5" />
                  {t("share", "Share")}
                </button>
              </div>
            </div>

            {/* Right Column - Course Image */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative">
                <img 
                  src={course.image}
                  alt={t("courseVisual", "Course Visual")}
                  className="h-auto max-h-[500px] w-full max-w-md rounded-lg object-cover shadow-2xl lg:max-w-none"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Quick Stats Grid */}
        <div className="relative z-30 -mt-16 grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-0">
          {quickStats.map((stat, index) => (
            <div 
              key={index}
              className="flex items-center gap-4 rounded-xl border bg-white p-6 shadow-lg"
              style={{ 
                borderColor: 'rgba(17,24,39,0.08)',
                boxShadow: SHADOWS.level1
              }}
            >
              <div 
                className="rounded-xl p-3"
                style={{ background: `${TOKENS.lightAquaMist}20`, color: TOKENS.deepTeal }}
              >
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: TOKENS.slateText }}>
                  {stat.label}
                </p>
                <p className="text-lg font-bold" style={{ color: TOKENS.inkText }}>
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Content Tabs */}
            <div 
              className="rounded-xl p-1.5 shadow-inner"
              style={{ background: TOKENS.neutralCloud }}
            >
              <div className="flex flex-wrap gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 rounded-lg px-4 py-3 text-sm font-bold transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-white shadow-sm'
                        : 'hover:bg-white/50'
                    }`}
                    style={{
                      color: activeTab === tab.id ? TOKENS.deepTeal : TOKENS.slateText
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="rounded-xl bg-white p-8 shadow-sm" style={{ borderColor: 'rgba(17,24,39,0.08)' }}>
              {activeTab === 'syllabus' && (
                <div className="space-y-5">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-black" style={{ color: TOKENS.deepTeal }}>
                        {t("syllabus.courseContent")}
                      </h2>
                      <p className="text-sm mt-0.5" style={{ color: TOKENS.slateText }}>
                        {(() => {
                          const counts = countCourseContent()
                          return t('syllabus.modulesCount', { modules: counts.containers, lectures: counts.lectures })
                        })()}
                      </p>
                    </div>
                    {/* Legend */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(22,163,74,0.1)', color: '#15803d' }}>
                        <Unlock size={11} /> {t('syllabus.purchased')}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: `${TOKENS.warmMango}18`, color: TOKENS.warmMango }}>
                        <Lock size={11} /> {t('syllabus.paid')}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: `${TOKENS.softCyanTeal}15`, color: TOKENS.deepTeal }}>
                        <Sparkles size={11} /> {t('syllabus.free')}
                      </span>
                    </div>
                  </div>

                  {/* Content List */}
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{
                      border: '1.5px solid rgba(17,24,39,0.08)',
                      background: 'white',
                      boxShadow: SHADOWS.level1,
                    }}
                  >
                    {/* Top-level containers */}
                    {courseData?.children?.map((child, idx) => {
                      const key = child._id || child.id || idx
                      if (child?.type === 'lecture') {
                        return (
                          <LectureRow
                            key={key}
                            item={child}
                            depth={0}
                            isPurchased={isContainerPurchased}
                            onPurchase={handlePurchase}
                            purchaseInProgress={purchaseInProgress}
                            onNavigate={navigate}
                            t={t}
                            isRTL={isRTL}
                          />
                        )
                      }
                      return (
                        <ContainerRow
                          key={key}
                          item={child}
                          depth={0}
                          isPurchased={isContainerPurchased}
                          onPurchase={handlePurchase}
                          purchaseInProgress={purchaseInProgress}
                          parentPurchased={isContainerPurchased(courseId)}
                          onNavigate={navigate}
                          t={t}
                          isRTL={isRTL}
                        />
                      )
                    })}

                    {/* Direct lectures (if any) */}
                    {courseData?.lectures?.map((lec, idx) => (
                      <LectureRow
                        key={lec._id || lec.id || idx}
                        item={lec}
                        depth={0}
                        isPurchased={isContainerPurchased}
                        onPurchase={handlePurchase}
                        purchaseInProgress={purchaseInProgress}
                        onNavigate={navigate}
                        t={t}
                        isRTL={isRTL}
                      />
                    ))}

                    {/* Empty State */}
                    {!courseData?.children?.length && !courseData?.lectures?.length && (
                      <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                          style={{ background: `${TOKENS.lightAquaMist}30` }}
                        >
                          <Book className="w-8 h-8" style={{ color: TOKENS.deepTeal }} />
                        </div>
                        <p className="font-semibold text-sm" style={{ color: TOKENS.slateText }}>
                          {t('syllabus.noContent')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-8">
                  {/* Rating Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
                    {/* Big Score */}
                    <div
                      className="sm:col-span-4 rounded-xl p-8 flex flex-col items-center justify-center text-center"
                      style={{ background: 'white', boxShadow: SHADOWS.level1 }}
                    >
                      <div className="text-7xl font-black mb-2 leading-none" style={{ color: TOKENS.warmMango }}>
                        {reviewStats.average.toFixed(1)}
                      </div>
                      <div className="flex gap-1 mb-3">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className="h-5 w-5"
                            style={{
                              color: TOKENS.warmMango,
                              fill: i < Math.round(reviewStats.average) ? TOKENS.warmMango : 'none'
                            }}
                          />
                        ))}
                      </div>
                      <p className="text-xs font-black uppercase tracking-widest" style={{ color: TOKENS.slateText }}>
                        {t('reviews.courseRating', 'Course Rating')}
                      </p>
                      <p className="text-xs mt-3 italic" style={{ color: `${TOKENS.slateText}90` }}>
                        {t('reviews.basedOnCount', 'Based on {{count}} verified students', { count: reviewStats.total })}
                      </p>
                    </div>

                    {/* Breakdown Bars */}
                    <div
                      className="sm:col-span-8 rounded-xl p-8"
                      style={{ background: 'white', boxShadow: SHADOWS.level1 }}
                    >
                      <h3 className="font-bold text-lg mb-6" style={{ color: TOKENS.deepTeal }}>
                        {t('reviews.breakdown', 'Rating Breakdown')}
                      </h3>
                      <div className="space-y-4">
                        {[5, 4, 3, 2, 1].map((stars) => {
                          const count = reviewStats.distribution[stars] || 0
                          const pct = reviewStats.total > 0 ? Math.round((count / reviewStats.total) * 100) : 0
                          return (
                            <div key={stars} className="flex items-center gap-4">
                              <span className="w-12 text-sm font-bold flex-shrink-0" style={{ color: TOKENS.slateText }}>
                                {stars} {t('reviews.star', 'star')}
                              </span>
                              <div
                                className="flex-1 h-2 rounded-full overflow-hidden"
                                style={{ background: TOKENS.neutralCloud }}
                              >
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${pct}%`, background: TOKENS.warmMango }}
                                />
                              </div>
                              <span className="w-16 text-right text-sm font-semibold flex-shrink-0" style={{ color: TOKENS.slateText }}>
                                {count} ({pct}%)
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Write a Review Section (only for students who purchased) */}
                  {isContainerPurchased(courseId) && (
                    <div
                      className="rounded-xl p-6"
                      style={{ background: 'white', boxShadow: SHADOWS.level1 }}
                    >
                      <h3 className="text-xl font-black mb-4" style={{ color: TOKENS.deepTeal }}>
                        {myReview ? t('reviews.updateYourReview', 'Update Your Review') : t('reviews.writeAReview', 'Write a Review')}
                      </h3>

                      {reviewError && (
                        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                          {reviewError}
                        </div>
                      )}

                      {reviewSuccess && (
                        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                          {reviewSuccess}
                        </div>
                      )}

                      <form onSubmit={handleSubmitReview} className="space-y-4">
                        {/* Rating Stars */}
                        <div>
                          <label className="block text-sm font-bold mb-2" style={{ color: TOKENS.slateText }}>
                            {t('reviews.yourRating', 'Your Rating')}
                          </label>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                className="transition-transform hover:scale-110"
                              >
                                <Star
                                  className="h-8 w-8"
                                  style={{
                                    color: TOKENS.warmMango,
                                    fill: star <= reviewForm.rating ? TOKENS.warmMango : 'none'
                                  }}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Review Comment */}
                        <div>
                          <label className="block text-sm font-bold mb-2" style={{ color: TOKENS.slateText }}>
                            {t('reviews.yourReview', 'Your Review')}
                          </label>
                          <textarea
                            value={reviewForm.comment}
                            onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                            placeholder={t('reviews.reviewPlaceholder', 'Share your experience with this course...')}
                            className="w-full rounded-xl border p-4 text-sm resize-none"
                            style={{ 
                              borderColor: 'rgba(17,24,39,0.15)',
                              minHeight: '120px'
                            }}
                            maxLength={1000}
                            required
                          />
                          <p className="text-xs mt-1" style={{ color: TOKENS.slateText }}>
                            {reviewForm.comment.length}/1000
                          </p>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex gap-3">
                          <button
                            type="submit"
                            disabled={reviewLoading || !reviewForm.comment.trim()}
                            className="flex-1 py-3 rounded-full font-bold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background: TOKENS.deepTeal }}
                          >
                            {reviewLoading 
                              ? t('processing', 'Processing...') 
                              : myReview 
                                ? t('reviews.updateReview', 'Update Review')
                                : t('reviews.submitReview', 'Submit Review')
                            }
                          </button>
                          {myReview && (
                            <button
                              type="button"
                              onClick={handleDeleteReview}
                              disabled={reviewLoading}
                              className="px-6 py-3 rounded-full font-bold text-red-600 border border-red-200 transition-all hover:bg-red-50 disabled:opacity-50"
                            >
                              {t('delete', 'Delete')}
                            </button>
                          )}
                        </div>

                        {myReview?.status === 'pending' && (
                          <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                            {t('reviews.pendingApproval', 'Your review is pending approval from an administrator.')}
                          </p>
                        )}
                      </form>
                    </div>
                  )}

                  {/* Testimonials Header */}
                  <h2 className="text-2xl font-black" style={{ color: TOKENS.deepTeal }}>
                    {t('reviews.testimonials', 'Student Testimonials')} ({reviews.length})
                  </h2>

                  {/* Review Cards */}
                  <div className="space-y-5">
                    {reviews.length === 0 ? (
                      <div className="text-center py-12" style={{ color: TOKENS.slateText }}>
                        <p className="text-lg font-medium">
                          {t('reviews.noReviewsYet', 'No reviews yet. Be the first to review this course!')}
                        </p>
                      </div>
                    ) : (
                      reviews.map((review) => (
                        <div
                          key={review._id}
                          className="relative overflow-hidden rounded-xl bg-white p-7"
                          style={{ boxShadow: SHADOWS.level1 }}
                        >
                          {/* Decorative quote watermark */}
                          <div
                            className="absolute top-0 right-0 p-5 pointer-events-none select-none"
                            style={{ opacity: 0.04 }}
                          >
                            <Sparkles className="h-20 w-20" style={{ color: TOKENS.deepTeal }} />
                          </div>

                          <div className="flex flex-col sm:flex-row gap-6">
                            {/* Reviewer info */}
                            <div className="sm:w-1/4 flex flex-col items-center sm:items-start text-center sm:text-left flex-shrink-0">
                              <div
                                className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-black mb-3"
                                style={{ background: GRADIENTS.cta }}
                              >
                                {review.studentName?.charAt(0).toUpperCase() || '?'}
                              </div>
                              <h4 className="font-bold text-sm" style={{ color: TOKENS.deepTeal }}>
                                {review.studentName || t('reviews.anonymous', 'Anonymous')}
                              </h4>
                              <p className="text-xs mb-2" style={{ color: TOKENS.slateText }}>
                                {new Date(review.createdAt).toLocaleDateString()}
                              </p>
                              <div className="flex gap-0.5">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <Star
                                    key={i}
                                    className="h-3.5 w-3.5"
                                    style={{
                                      color: TOKENS.warmMango,
                                      fill: i < review.rating ? TOKENS.warmMango : 'none'
                                    }}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* Review body */}
                            <div className="flex-1">
                              <p
                                className="text-sm leading-relaxed font-medium italic"
                                style={{ color: TOKENS.inkText }}
                              >
                                &ldquo;{review.comment}&rdquo;
                              </p>
                              {review.adminResponse && (
                                <div className="mt-4 p-4 rounded-lg" style={{ background: `${TOKENS.lightAquaMist}20` }}>
                                  <p className="text-xs font-bold mb-1" style={{ color: TOKENS.deepTeal }}>
                                    {t('reviews.adminResponse', 'Admin Response')}:
                                  </p>
                                  <p className="text-sm" style={{ color: TOKENS.slateText }}>
                                    {review.adminResponse}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'faq' && (
                <div className="space-y-6">
                  {/* Section Header */}
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black" style={{ color: TOKENS.deepTeal }}>
                      {t('faq.title', 'Frequently Asked Questions')}
                    </h2>
                    <p className="text-base font-medium" style={{ color: TOKENS.slateText }}>
                      {t('faq.subtitle', 'Everything you need to know about this course.')}
                    </p>
                  </div>

                  {/* FAQ Accordion */}
                  <div className="space-y-3">
                    {faqItems.map((item, index) => {
                      const isOpen = openFaqIndex === index
                      return (
                        <div
                          key={index}
                          className="overflow-hidden rounded-xl border transition-all duration-200"
                          style={{
                            borderColor: isOpen ? `${TOKENS.lightAquaMist}80` : 'rgba(17,24,39,0.08)',
                            boxShadow: isOpen ? SHADOWS.level1 : 'none'
                          }}
                        >
                          <button
                            className="w-full flex items-center justify-between gap-4 p-6 text-left transition-colors duration-200"
                            style={{ background: isOpen ? `${TOKENS.lightAquaMist}18` : 'white' }}
                            onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ background: `${TOKENS.lightAquaMist}35`, color: TOKENS.deepTeal }}
                              >
                                <item.icon className="h-5 w-5" />
                              </div>
                              <span className="font-bold text-base" style={{ color: TOKENS.deepTeal }}>
                                {item.question}
                              </span>
                            </div>
                            <ChevronDown
                              className={`h-5 w-5 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                              style={{ color: TOKENS.slateText }}
                            />
                          </button>

                          {isOpen && (
                            <div
                              className="pb-6"
                              style={{ paddingInlineStart: 'calc(1.5rem + 2.75rem + 1rem)', paddingInlineEnd: '1.5rem' }}
                            >
                              <p className="text-sm leading-relaxed font-medium" style={{ color: TOKENS.slateText }}>
                                {item.answer}
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Still have questions CTA */}
                  <div
                    className="flex flex-col sm:flex-row items-center gap-6 rounded-xl p-8"
                    style={{ background: GRADIENTS.hero }}
                  >
                    <div className="flex-1 text-white">
                      <h3 className="text-xl font-black mb-2">
                        {t('faq.ctaTitle', 'Still have questions?')}
                      </h3>
                      <p className="text-sm font-medium" style={{ opacity: 0.8 }}>
                        {t('faq.ctaDesc', 'Our support team is ready to help you with anything you need.')}
                      </p>
                    </div>
                    <a
                      href="mailto:support@fekra.com"
                      className="whitespace-nowrap rounded-full px-8 py-3 font-bold text-sm text-white transition-all hover:scale-105 active:scale-95"
                      style={{
                        background: TOKENS.warmMango,
                        boxShadow: `0 4px 14px ${TOKENS.warmMango}55`
                      }}
                    >
                      {t('faq.ctaButton', 'Contact Support')}
                    </a>
                  </div>
                </div>
              )}

              {activeTab === 'instructors' && (
                <div className="space-y-8">
                  {/* Section Header */}
                  <div className="space-y-3">
                    <h2 className="text-3xl font-black" style={{ color: TOKENS.deepTeal }}>
                      {t('instructors.title', 'Meet Your Instructor')}
                    </h2>
                    <p className="text-base font-medium max-w-xl" style={{ color: TOKENS.slateText }}>
                      {t('instructors.subtitle', 'Learn directly from an expert who brings both academic knowledge and real-world experience.')}
                    </p>
                  </div>

                  {/* Bento Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Primary Instructor Card */}
                    <div
                      className="lg:col-span-8 rounded-xl overflow-hidden"
                      style={{ background: 'white', boxShadow: SHADOWS.level2 }}
                    >
                      <div className="flex flex-col md:flex-row">
                        {/* Photo */}
                        <div className="md:w-2/5 h-64 md:h-auto relative overflow-hidden flex-shrink-0">
                          <img
                            src={course.instructor.avatar}
                            alt={course.instructor.name}
                            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                            onError={(e) => { e.target.onerror = null; e.target.src = resolveProfileImageUrl(null) }}
                          />
                          <div
                            className="absolute inset-0"
                            style={{ background: `linear-gradient(to top, ${TOKENS.deepTeal}55, transparent)` }}
                          />
                        </div>

                        {/* Details */}
                        <div className="flex-1 p-8 flex flex-col justify-center">
                          <div className="flex items-center gap-3 mb-5">
                            <span
                              className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest"
                              style={{ background: `${TOKENS.warmMango}18`, color: TOKENS.warmMango }}
                            >
                              {t('instructors.leadBadge', 'Lead Instructor')}
                            </span>
                          </div>

                          <h3 className="text-2xl font-black mb-1" style={{ color: TOKENS.deepTeal }}>
                            {course.instructor.name}
                          </h3>
                          <p className="text-base font-bold mb-5" style={{ color: TOKENS.warmMango }}>
                            {t('instructors.instructorRole', 'Course Instructor')}
                          </p>
                          <p className="text-sm leading-relaxed font-medium" style={{ color: TOKENS.slateText }}>
                            {t('instructors.bio', 'An experienced educator dedicated to making complex concepts accessible. This course reflects years of teaching experience and a deep passion for helping students succeed.')}
                          </p>

                          {/* Stats */}
                          <div
                            className="grid grid-cols-2 gap-6 mt-7 pt-6 border-t"
                            style={{ borderColor: 'rgba(17,24,39,0.08)' }}
                          >
                            <div>
                              <p className="text-xs uppercase tracking-widest font-black mb-1" style={{ color: TOKENS.slateText }}>
                                {t('stats.students', 'Students')}
                              </p>
                              <p className="font-black" style={{ color: TOKENS.deepTeal }}>
                                {course.students}+ {t('enrolled', 'Enrolled')}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-widest font-black mb-1" style={{ color: TOKENS.slateText }}>
                                {t('instructors.rating', 'Rating')}
                              </p>
                              <p className="font-black flex items-center gap-1.5" style={{ color: TOKENS.deepTeal }}>
                                <Star
                                  className="h-4 w-4 flex-shrink-0"
                                  style={{ color: TOKENS.warmMango, fill: TOKENS.warmMango }}
                                />
                                {course.rating.toFixed(1)} / 5.0
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-4 flex flex-col gap-5">
                      {/* Course Info Card */}
                      <div
                        className="rounded-xl p-6"
                        style={{ background: 'white', boxShadow: SHADOWS.level1 }}
                      >
                        <h4
                          className="text-xs font-black uppercase tracking-widest mb-4 pb-3 border-b"
                          style={{ color: TOKENS.slateText, borderColor: 'rgba(17,24,39,0.08)' }}
                        >
                          {t('instructors.courseInfo', 'Course Information')}
                        </h4>
                        <div>
                          {[
                            { label: t('details.level', 'Level'), value: course.level },
                            { label: t('stats.students', 'Students'), value: `${course.students} ${t('enrolled', 'Enrolled')}` },
                            { label: t('details.language', 'Language'), value: course.language },
                            { label: t('instructors.subject', 'Subject'), value: courseData?.subject?.name || '-' },
                          ].map(({ label, value }) => (
                            <div
                              key={label}
                              className="flex justify-between items-center text-sm py-3 border-b last:border-b-0"
                              style={{ borderColor: 'rgba(17,24,39,0.07)' }}
                            >
                              <span className="font-semibold" style={{ color: TOKENS.slateText }}>{label}</span>
                              <span className="font-bold text-right" style={{ color: TOKENS.inkText }}>{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* CTA Card */}
                      <div
                        className="rounded-xl p-7 text-white relative overflow-hidden"
                        style={{ background: GRADIENTS.hero }}
                      >
                        <div className="relative z-10">
                          <h4 className="text-lg font-black mb-2">
                            {isContainerPurchased(courseId)
                              ? t('instructors.ctaTitlePurchased', "You're Enrolled!")
                              : t('instructors.ctaTitle', 'Ready to Start?')
                            }
                          </h4>
                          <p className="text-sm mb-5" style={{ opacity: 0.8 }}>
                            {isContainerPurchased(courseId)
                              ? t('instructors.ctaDescPurchased', 'Access all your course content from the dashboard.')
                              : t('instructors.ctaDesc', 'Join hundreds of students learning with this instructor.')
                            }
                          </p>
                          {isContainerPurchased(courseId) ? (
                            <button
                              className="w-full py-3 rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95"
                              style={{ background: TOKENS.warmMango, color: 'white' }}
                              onClick={() => navigate('/dashboard/student-dashboard')}
                            >
                              {t('goToDashboard', 'Go to Dashboard')}
                            </button>
                          ) : (
                            <button
                              className="w-full py-3 rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95"
                              style={{ background: 'white', color: TOKENS.deepTeal }}
                              onClick={() => handlePurchase(courseId)}
                              disabled={purchaseInProgress !== null}
                            >
                              {purchaseInProgress === courseId
                                ? t('processing', 'Processing...')
                                : course.price === 0
                                  ? t('getFree', 'Get Free')
                                  : t('buyNow', 'Buy Now')
                              }
                            </button>
                          )}
                        </div>
                        <div
                          className="absolute -right-4 -bottom-4 pointer-events-none select-none"
                          style={{ opacity: 0.08 }}
                        >
                          <GraduationCap className="h-28 w-28 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab !== 'overview' && activeTab !== 'syllabus' && activeTab !== 'reviews' && activeTab !== 'instructors' && activeTab !== 'faq' && (
                <div className="text-center py-12" style={{ color: TOKENS.slateText }}>
                  <p className="text-lg font-medium">
                    {tabs.find(t => t.id === activeTab)?.label} {t("contentComingSoonSuffix", "content coming soon...")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="lg:col-span-1">
            <div 
              className="sticky top-8 overflow-hidden rounded-xl border shadow-2xl"
              style={{ 
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
                borderColor: 'rgba(17,24,39,0.08)',
                boxShadow: SHADOWS.level2
              }}
            >
              <div className="p-8 space-y-6">
                {/* Pricing */}
                <div className="flex items-center justify-center">
                  <span className="text-4xl font-black" style={{ color: TOKENS.deepTeal }}>
                    {course.price > 0 ? `EGP ${course.price.toLocaleString()}` : t("free", "Free")}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  {isContainerPurchased(courseId) ? (
                    <button 
                      className="w-full rounded-full py-4 font-black text-lg shadow-lg transition-all"
                      style={{ 
                        background: TOKENS.slateText,
                        color: 'white',
                        cursor: 'not-allowed'
                      }}
                      disabled
                    >
                      ✓ {t("purchase.purchased")}
                    </button>
                  ) : (
                    <>
                      {purchaseError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                          {purchaseError}
                        </div>
                      )}
                      {purchaseSuccess && (
                        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                          {t("purchase.purchaseSuccess")}
                        </div>
                      )}
                      <button 
                        className="w-full rounded-full py-4 font-black text-lg text-white shadow-lg transition-all hover:scale-[1.02]"
                        style={{ 
                          background: TOKENS.deepTeal,
                          boxShadow: `0 8px 16px ${TOKENS.deepTeal}40`
                        }}
                        onClick={() => handlePurchase(courseId)}
                        disabled={purchaseInProgress !== null}
                      >
                        {purchaseInProgress === courseId ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                            {t("processing", "Processing...")}
                          </span>
                        ) : (
                          course.price === 0 ? t("getFree", "Get Free") : t("buyNow", "Buy Now")
                        )}
                      </button>
                    </>
                  )}
                </div>

                {/* Course Details */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider border-b pb-3" style={{ color: TOKENS.slateText, borderColor: 'rgba(17,24,39,0.08)' }}>
                    {t("courseDetailsTitle", "Course Details")}
                  </h4>
                  <ul className="space-y-4">
                    {courseDetails.map((detail, index) => (
                      <li key={index} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-3 font-semibold" style={{ color: TOKENS.slateText }}>
                          <detail.icon className="h-5 w-5" />
                          {detail.label}
                        </div>
                        <span className="font-bold" style={{ color: TOKENS.inkText }}>
                          {detail.value}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Who is this course for */}
                <div className="space-y-4 pt-4 border-t" style={{ borderColor: 'rgba(17,24,39,0.08)' }}>
                  <h4 className="text-xs font-black uppercase tracking-wider" style={{ color: TOKENS.slateText }}>
                    {t("whoIsThisFor", "Who is this course for")}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {course.targetAudience.map((audience, index) => (
                      <span 
                        key={index}
                        className="rounded-full px-3 py-1 text-xs font-bold border"
                        style={{ 
                          background: `${TOKENS.lightAquaMist}20`,
                          color: TOKENS.deepTeal,
                          borderColor: `${TOKENS.lightAquaMist}50`
                        }}
                      >
                        {audience}
                      </span>
                    ))}
                  </div>
                </div>

                {/* What you'll get out of this */}
                <div className="space-y-4 pt-4 border-t" style={{ borderColor: 'rgba(17,24,39,0.08)' }}>
                  <h4 className="text-xs font-black uppercase tracking-wider" style={{ color: TOKENS.slateText }}>
                    {t("whatYouWillGet", "What you'll get out of this")}
                  </h4>
                  <ul className="space-y-3">
                    {course.outcomes.map((outcome, index) => (
                      <li key={index} className="flex items-start gap-3 text-sm font-semibold" style={{ color: TOKENS.slateText }}>
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: TOKENS.warmMango }} />
                        {outcome}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Share Toast */}
      {showShareToast && (
        <div className="fixed bottom-4 sm:bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium text-white shadow-lg"
          style={{ background: TOKENS.deepTeal }}
        >
          {t('linkCopied')}
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 max-w-md rounded-[2rem] border p-6" 
            style={{ 
              border: '1px solid rgba(17,24,39,0.08)', 
              boxShadow: SHADOWS.level2, 
              backgroundColor: TOKENS.creamSurface 
            }}
          >
            <h3 className="text-xl font-bold" style={{ color: TOKENS.deepTeal }}>
              {t("purchaseSuccess")}
            </h3>
            <p className="py-4 text-base font-medium" style={{ color: TOKENS.inkText }}>
              {t("purchaseSuccessDesc")}
            </p>
            <div className="flex gap-3">
              <button 
                className="flex-1 rounded-full px-6 py-3 font-medium transition-all hover:bg-black/5" 
                style={{ color: TOKENS.inkText }}
                onClick={() => setShowSuccessModal(false)}
              >
                {t("later", "Later")}
              </button>
              <button 
                className="flex-1 rounded-full px-6 py-3 font-medium text-white transition-all hover:opacity-90 hover:scale-105" 
                style={{ backgroundColor: TOKENS.deepTeal }}
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate("/dashboard/student-dashboard");
                }}
              >
                {t("goToDashboard", "Yes, go to Dashboard")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
