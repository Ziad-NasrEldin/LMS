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
  Play
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

const SyllabusItem = ({ item, depth = 0, isPurchased, onPurchase, purchaseInProgress, parentPurchased, t }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(false)

  const itemId = item?._id || item?.id
  const hasKids = item?.children?.length > 0 || ['course', 'year', 'term', 'month'].includes(item?.type)
  const isLecture = item?.type === 'lecture'
  const purchased = parentPurchased || isPurchased(itemId)

  const toggle = async () => {
    if (!hasKids) return
    if (isOpen) {
      setIsOpen(false)
      return
    }
    if (children.length > 0) {
      setIsOpen(true)
      return
    }
    // Fetch children if needed
    if (item.children?.length > 0 && typeof item.children[0] === 'object') {
      setChildren(item.children)
      setIsOpen(true)
      return
    }
    // Fetch from API
    setLoading(true)
    try {
      const result = await getContainerById(itemId)
      if (result?.data?.children) {
        const childIds = result.data.children
        const childData = await Promise.all(
          childIds.map(id => getContainerById(typeof id === 'string' ? id : (id._id || id.id)))
        )
        setChildren(childData.filter(r => r?.data).map(r => r.data))
      }
    } catch (e) {
      console.error('Failed to load children:', e)
    }
    setLoading(false)
    setIsOpen(true)
  }

  const formatDuration = (mins) => {
    if (!mins) return ''
    const h = Math.floor(mins / 60)
    const m = mins % 60
    if (h > 0 && m > 0) return `${h}h ${m}m`
    if (h > 0) return `${h}h`
    return `${m}m`
  }

  return (
    <div className={`border-b last:border-b-0 ${depth > 0 ? 'ml-4' : ''}`} style={{ borderColor: 'rgba(17,24,39,0.06)' }}>
      <div className="flex items-center gap-3 p-4 hover:bg-black/[0.02] transition-colors">
        {/* Expand button */}
        {hasKids ? (
          <button onClick={toggle} className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors" style={{ background: designTokens.colors.lightAquaMist }}>
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} style={{ color: designTokens.colors.deepTeal }} />
            )}
          </button>
        ) : (
          <div className="w-8 h-8 flex items-center justify-center">
            <PlayCircle size={16} style={{ color: designTokens.colors.slateText }} />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm" style={{ color: designTokens.colors.inkText }}>{item?.name}</span>
            {item?.type && (
              <span className="text-[10px] uppercase px-2 py-0.5 rounded-full font-semibold" style={{ background: `${designTokens.colors.lightAquaMist}40`, color: designTokens.colors.deepTeal }}>
                {item.type}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: designTokens.colors.slateText }}>
            {item?.duration > 0 && (
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {formatDuration(item.duration)}
              </span>
            )}
            {item?.price > 0 && <span>{item.price} {t('pricing.points')}</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isLecture && purchased && (
            <button className="px-3 py-1.5 rounded-full text-xs font-medium text-white" style={{ background: designTokens.colors.deepTeal }}>
              {t('actions.view') || 'View'}
            </button>
          )}
          {!purchased && item?.price >= 0 && (
            <button
              onClick={() => onPurchase(itemId)}
              disabled={purchaseInProgress}
              className="px-3 py-1.5 rounded-full text-xs font-medium text-white disabled:opacity-50"
              style={{ background: designTokens.colors.warmMango }}
            >
              {purchaseInProgress === itemId ? '...' : item.price > 0 ? t('purchase.buy') : t('purchase.getFree')}
            </button>
          )}
          {purchased && !isLecture && (
            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
              <Unlock size={12} />
            </span>
          )}
        </div>
      </div>

      {/* Children */}
      {isOpen && children.length > 0 && (
        <div className="border-t" style={{ borderColor: 'rgba(17,24,39,0.06)' }}>
          {children.map((child, idx) => (
            <SyllabusItem
              key={child._id || child.id || idx}
              item={child}
              depth={depth + 1}
              isPurchased={isPurchased}
              onPurchase={onPurchase}
              purchaseInProgress={purchaseInProgress}
              parentPurchased={purchased}
              t={t}
            />
          ))}
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
  const [activeTab, setActiveTab] = useState('overview')
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [enrollmentCount, setEnrollmentCount] = useState(0)
  
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
    const shareText = isRTL 
      ? `اطلع على هذا الكورس: ${shareTitle}`
      : `Check out this course: ${shareTitle}`

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

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorAlert message={error} />
  if (!courseData) return <ErrorAlert message={t("errors.courseNotFound")} />

  // Calculate last updated date from course content
  const getLastUpdatedDate = () => {
    // Debug: Log the data structure
    console.log('Course data children:', courseData?.children)
    console.log('Course data lectures:', courseData?.lectures)
    console.log('Course updatedAt:', courseData?.updatedAt)
    console.log('Course createdAt:', courseData?.createdAt)
    
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
      avatar: courseData.createdBy?.profilePic ? resolveProfileImageUrl(courseData.createdBy.profilePic) : "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
    },
    rating: 4.8,
    students: enrollmentCount || 0,
    level: levelName || t("level.beginner", "Beginner"),
    duration: "2.6 Hours",
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
    { id: 'overview', label: t('tabs.overview', 'Overview') },
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
                    e.target.src = "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
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
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className="flex items-center gap-2 rounded-full bg-white/10 px-8 py-3 font-bold backdrop-blur-md transition-all hover:bg-white/20"
                >
                  <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
                  {isWishlisted ? t("wishlisted", "Wishlisted") : t("wishlist", "Wishlist")}
                </button>
                <button 
                  onClick={handleShare}
                  className="flex items-center gap-2 rounded-full border border-white/20 px-8 py-3 font-bold backdrop-blur-md transition-all hover:bg-white/10">
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
              <div className="flex gap-1 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 min-w-[120px] rounded-lg px-6 py-3 text-sm font-bold transition-all whitespace-nowrap ${
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
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h2 className="text-3xl font-black" style={{ color: TOKENS.deepTeal }}>
                      {t("masteringCourse", "Mastering the Course")}
                    </h2>
                    <p className="text-lg leading-relaxed font-medium" style={{ color: TOKENS.slateText }}>
                      {course.description}
                    </p>
                  </div>

                  {/* Did you know callout */}
                  <div className="flex gap-6 rounded-lg border p-6" 
                    style={{ 
                      background: `${TOKENS.lightAquaMist}20`,
                      borderColor: `${TOKENS.lightAquaMist}50`
                    }}
                  >
                    <div 
                      className="rounded-xl p-3 text-white flex-shrink-0"
                      style={{ background: TOKENS.softCyanTeal }}
                    >
                      <Lightbulb className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-lg font-bold" style={{ color: TOKENS.deepTeal }}>
                        {t("didYouKnow", "Did you know?")}
                      </h4>
                      <p className="text-sm font-medium leading-relaxed" style={{ color: TOKENS.slateText }}>
                        {t("courseDescription", "This course is designed to provide comprehensive learning with practical applications and real-world examples.")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'syllabus' && (
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black" style={{ color: TOKENS.deepTeal }}>
                      {t("courseContent", "Course Content")}
                    </h2>
                    <p className="text-sm mt-1" style={{ color: TOKENS.slateText }}>
                      {courseData?.children?.length || 0} {t("modules", "Modules")} • {courseData?.lectures?.length || 0} {t("lectures", "Lectures")}
                    </p>
                  </div>

                  {/* Content List */}
                  <div className="rounded-xl border overflow-hidden" style={{ background: TOKENS.neutralCloud, borderColor: 'rgba(17,24,39,0.08)' }}>
                    {/* Children */}
                    {courseData?.children?.map((child, idx) => (
                      <SyllabusItem
                        key={child._id || child.id || idx}
                        item={child}
                        isPurchased={isContainerPurchased}
                        onPurchase={handlePurchase}
                        purchaseInProgress={purchaseInProgress}
                        parentPurchased={isContainerPurchased(courseId)}
                        t={t}
                      />
                    ))}
                    {/* Lectures */}
                    {courseData?.lectures?.map((lecture, idx) => (
                      <SyllabusItem
                        key={lecture._id || lecture.id || idx}
                        item={lecture}
                        isPurchased={isContainerPurchased}
                        onPurchase={handlePurchase}
                        purchaseInProgress={purchaseInProgress}
                        parentPurchased={isContainerPurchased(courseId)}
                        t={t}
                      />
                    ))}
                    {/* Empty State */}
                    {!courseData?.children?.length && !courseData?.lectures?.length && (
                      <div className="p-8 text-center">
                        <Book className="h-10 w-10 mx-auto mb-3" style={{ color: TOKENS.slateText }} />
                        <p style={{ color: TOKENS.slateText }}>{t('syllabus.empty') || 'No content available yet'}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab !== 'overview' && activeTab !== 'syllabus' && (
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
          {isRTL ? t('linkCopiedAr', 'تم نسخ الرابط!') : t('linkCopied', 'Link copied to clipboard!')}
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
              {isRTL ? t("purchaseSuccessAr", "تم الشراء بنجاح!") : t("purchaseSuccess", "Purchase Successful!")}
            </h3>
            <p className="py-4 text-base font-medium" style={{ color: TOKENS.inkText }}>
              {isRTL 
                ? t("purchaseSuccessDescAr", "تمت عملية الشراء بنجاح، ومحتواك الآن متاح في لوحة التحكم الخاصة بك. هل تود الانتقال إلى لوحة التحكم الآن؟")
                : t("purchaseSuccessDesc", "Your purchase was successful and is now available in your dashboard. Would you like to go to your dashboard now?")
              }
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
