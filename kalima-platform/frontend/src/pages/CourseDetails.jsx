"use client"

import { useState, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import toast from "react-hot-toast"
import { getContainerById, purchaseContainer, getEnrollmentCount } from "../routes/lectures"
import { getUserDashboard, isLoggedIn } from "../routes/auth-services"
import { LoadingSpinner } from "../components/LoadingSpinner"
import { ErrorAlert } from "../components/ErrorAlert"
import LoginPromptModal from "../components/LoginPromptModal"
import Syllabus from "../components/Syllabus"
import { designTokens } from "../constants/designTokens"
import { resolveLevelDisplayName } from "../utils/levelHierarchy"
import { resolveProfileImageUrl } from "../utils/profileImage"
import { getCourseReviews, getMyReview, createReview, updateMyReview, deleteMyReview } from "../routes/reviews"
import { buildCoursePath } from "../seo/site.mjs"
import { useSeo } from "../seo/useSeo"
import { buildBreadcrumbSchema, buildCourseSchema } from "../seo/structuredData.mjs"
import { translateErrorMessage } from "../utils/errorTranslator"
import { 
  Star, 
  Users, 
  Clock, 
  RefreshCw, 
  BarChart3, 
  Brain, 
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
  Play,
  ThumbsUp,
  Flag,
  Sparkles
} from "lucide-react"
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Card from "../components/ui/Card";
import Modal from "../components/ui/Modal";
import Tabs from "../components/ui/Tabs";

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
// DEPRECATED: Replaced by Syllabus component with SyllabusItem
// Kept temporarily for reference - will be removed in future cleanup
// eslint-disable-next-line no-unused-vars
const LectureRow_DEPRECATED = ({ item }) => null

// ─── ContainerRow ─────────────────────────────────────────────────────────────
// DEPRECATED: Replaced by Syllabus component with SyllabusItem
// Kept temporarily for reference - will be removed in future cleanup
// eslint-disable-next-line no-unused-vars
const ContainerRow_DEPRECATED = ({ item }) => null

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
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

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

        const isAuth = await isLoggedIn()
        
        const requests = [
          getContainerById(courseId),
          getUserDashboard({
            params: {
              fields: "userInfo,purchaseHistory",
            },
          }),
          getEnrollmentCount(courseId),
          getCourseReviews(courseId),
        ]

        // Only fetch user's review if logged in
        if (isAuth) {
          requests.push(getMyReview(courseId))
        }

        const [courseResult, dashboardResult, enrollmentResult, reviewsResult, myReviewResult] = await Promise.all(requests)

        if (courseResult?.status === "success" && courseResult.data) {
          setCourseData(courseResult.data)
        } else {
          setError(translateErrorMessage(courseResult?.message || courseResult?.error || t("errors.fetchError")))
        }

        if (dashboardResult?.success) {
          setPurchaseHistory(dashboardResult.data.data.purchaseHistory || [])
          if (dashboardResult.data.data.userInfo) {
            setRemainingPoints(dashboardResult.data.data.userInfo.generalPoints)
          }
        }

        if (enrollmentResult?.success) {
          setEnrollmentCount(enrollmentResult.count)
        }

        if (reviewsResult?.status === 'success') {
          setReviews(reviewsResult.data.reviews || [])
          setReviewStats(reviewsResult.data.stats || { average: 0, total: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } })
        }

        // Set user's own review if exists
        if (myReviewResult?.status === 'success' && myReviewResult.data) {
          setMyReview(myReviewResult.data)
          setReviewForm({ rating: myReviewResult.data.rating || 5, comment: myReviewResult.data.comment || '' })
        }
      } catch (err) {
        console.error("Error fetching data:", err)
        setError(translateErrorMessage(err?.message || t("errors.unexpected")))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
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

    // Helper to check if any child of a container is purchased
    const hasPurchasedChild = (container) => {
      if (!container || !container.children) return false
      
      for (const child of container.children) {
        const childId = normalizeId(child._id || child.id)
        if (purchasedIds.has(childId)) return true
        // Recursively check grandchildren
        if (child.children && hasPurchasedChild(child)) return true
      }
      return false
    }

    return (containerId) => {
      const normalizedContainerId = normalizeId(containerId)
      if (!normalizedContainerId) return false

      if (purchasedIds.has(normalizedContainerId)) {
        return true
      }

      if (courseData && courseData._id) {
        // If checking the root course, also check if any child is purchased
        if (normalizedContainerId === normalizeId(courseData._id)) {
          if (hasPurchasedChild(courseData)) return true
        }

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
    // Check if user is logged in
    const loggedIn = await isLoggedIn()
    if (!loggedIn) {
      setShowLoginPrompt(true)
      return
    }

    const normalizedContainerId = normalizeId(containerId)
    setPurchaseInProgress(containerId)
    setPurchaseError("")
    setPurchaseSuccess(false)

    try {
      const response = await purchaseContainer(containerId)

      if (response && response.data && response.data.status === "success") {
        setPurchaseSuccess(true)
        toast.success(tCommon("purchase.purchaseSuccess", "Purchase successful!"))

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
        const errorMsg = response?.error || response?.data?.message || tCommon("errors.purchaseFailed", { entity: tCommon("entities.course") })
        setPurchaseError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (err) {
      console.error("Purchase error:", err)
      const errorMessage = err.response?.data?.message || err.message || tCommon("errors.purchaseProcessError")
      setPurchaseError(errorMessage)
      toast.error(errorMessage)
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
        setReviewSuccess(myReview ? t('reviews.updatedSuccess') : t('reviews.submittedSuccess'))
        setMyReview(result.data)
        // Refresh reviews list
        const reviewsResult = await getCourseReviews(courseId)
        if (reviewsResult.status === 'success') {
          setReviews(reviewsResult.data.reviews || [])
          setReviewStats(reviewsResult.data.stats || { average: 0, total: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } })
        }
        setTimeout(() => setReviewSuccess(''), 3000)
      } else {
        // Use rawMessage to get the original error, then translate it
        const errorMsg = result.rawMessage || result.message || t('reviews.submitError')
        setReviewError(translateErrorMessage(errorMsg, t('reviews.submitError')))
      }
    } catch (err) {
      setReviewError(translateErrorMessage(err, t('reviews.unexpectedError')))
    } finally {
      setReviewLoading(false)
    }
  }

  // Handle review deletion
  const handleDeleteReview = async () => {
    if (!confirm(t('reviews.confirmDelete'))) return

    setReviewLoading(true)
    const result = await deleteMyReview(courseId)
    if (result.status === 'success') {
      setMyReview(null)
      setReviewForm({ rating: 5, comment: '' })
      setReviewSuccess(t('reviews.deletedSuccess'))
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

  const handleLoginRedirect = () => {
    setShowLoginPrompt(false)
    navigate('/login', { state: { from: location.pathname } })
  }

  const handleRegisterRedirect = () => {
    setShowLoginPrompt(false)
    navigate('/register', { state: { from: location.pathname } })
  }
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
                  loading="lazy"
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
                 <Button
                   variant="ghost"
                   className="flex items-center gap-2 rounded-full border border-white/20 px-5 py-2 sm:px-8 sm:py-3 text-sm sm:text-base font-bold backdrop-blur-md transition-all hover:bg-white/10 text-white"
                   onClick={handleShare}
                 >
                   <Share2 className="h-5 w-5" />
                   {t("share", "Share")}
                 </Button>
               </div>

            </div>

            {/* Right Column - Course Image */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative">
                <img 
                  src={course.image}
                  alt={t("courseVisual", "Course Visual")}
                  fetchpriority="high"
                  className="h-auto max-h-[500px] w-full max-w-md rounded-lg object-cover shadow-2xl lg:max-w-none"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Quick Stats Grid */}
         <div className="relative z-30 -mt-16 grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-0">
           {quickStats.map((stat, index) => (
             <Card 
               key={index}
               className="flex items-center gap-4 p-6"
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
             </Card>
           ))}
         </div>


        {/* Main Content Grid */}
        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Content Tabs */}
             <Tabs 
               tabs={tabs} 
               activeIndex={tabs.findIndex(t => t.id === activeTab)} 
               onChange={(index) => setActiveTab(tabs[index].id)} 
             />


            {/* Tab Content */}
            <div className="rounded-xl bg-white p-8 shadow-sm" style={{ borderColor: 'rgba(17,24,39,0.08)' }}>
              {activeTab === 'syllabus' && (
                <Syllabus
                  courseId={courseId}
                  isPurchased={isContainerPurchased}
                  onPurchase={handlePurchase}
                  purchaseInProgress={purchaseInProgress}
                  onNavigate={navigate}
                  tokens={TOKENS}
                  purchaseHistory={purchaseHistory}
                />
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
                             <Button
                               type="submit"
                               isDisabled={reviewLoading || !reviewForm.comment.trim()}
                               variant="primary"
                               className="flex-1 py-3 rounded-full font-bold text-white transition-all hover:scale-105"
                               style={{ background: TOKENS.deepTeal }}
                             >
                               {reviewLoading 
                                 ? t('processing', 'Processing...') 
                                 : myReview 
                                   ? t('reviews.updateReview', 'Update Review')
                                   : t('reviews.submitReview', 'Submit Review')
                               }
                             </Button>
                             {myReview && (
                               <Button
                                 type="button"
                                 isDisabled={reviewLoading}
                                 variant="outline"
                                 className="px-6 py-3 rounded-full font-bold text-red-600 border-red-200 transition-all hover:bg-red-50"
                                 onClick={handleDeleteReview}
                               >
                                 {t('delete', 'Delete')}
                               </Button>
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
                      href="https://wa.me/201027314148"
                      target="_blank"
                      rel="noopener noreferrer"
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
                             <Button 
                               variant="neutral" 
                               className="w-full py-4 font-black text-lg shadow-lg transition-all"
                               isDisabled
                             >
                               ✓ {t("purchase.purchased")}
                             </Button>
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
<Button 
                                  variant={course.price === 0 ? "success" : "primary"} 
                                  className="w-full py-4 font-black text-lg shadow-lg transition-all hover:scale-[1.02]"
                                  onClick={() => handlePurchase(courseId)}
                                  isLoading={purchaseInProgress === courseId}
                                >
                                  {purchaseInProgress === courseId 
                                    ? t('processing', 'Processing...') 
                                    : course.price === 0 
                                      ? t("getFree", "Get Free") 
                                      : t("buyNow", "Buy Now")
                                  }
                                </Button>
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
       <Modal 
         isOpen={showSuccessModal} 
         onClose={() => setShowSuccessModal(false)} 
         title={t("purchaseSuccess")}
         footer={
           <div className="flex gap-3">
             <Button 
               variant="ghost" 
               className="flex-1 rounded-full px-6 py-3 font-medium transition-all hover:bg-black/5" 
               onClick={() => setShowSuccessModal(false)}
             >
               {t("later", "Later")}
             </Button>
             <Button 
               variant="primary" 
               className="flex-1 rounded-full px-6 py-3 font-medium text-white transition-all hover:opacity-90 hover:scale-105" 
               onClick={() => {
                 setShowSuccessModal(false);
                 navigate("/dashboard/student-dashboard");
               }}
             >
               {t("goToDashboard", "Yes, go to Dashboard")}
             </Button>
           </div>
         }
       >
         <p className="py-4 text-base font-medium" style={{ color: TOKENS.inkText }}>
           {t("purchaseSuccessDesc")}
         </p>
       </Modal>


      {/* Login Prompt Modal for Guest Users */}
      <LoginPromptModal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        onLogin={handleLoginRedirect}
        onRegister={handleRegisterRedirect}
        isRTL={isRTL}
      />
    </div>
  )
}
