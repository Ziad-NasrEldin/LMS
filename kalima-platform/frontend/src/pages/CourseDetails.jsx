"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { getContainerById, purchaseContainer } from "../routes/lectures"
import { getUserDashboard } from "../routes/auth-services"
import { LoadingSpinner } from "../components/LoadingSpinner"
import { ErrorAlert } from "../components/ErrorAlert"
import { designTokens } from "../constants/designTokens"
import { resolveLevelDisplayName } from "../utils/levelHierarchy"
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
  Lock
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

const ContainerItem = ({ container, isPurchased, onPurchase, purchaseInProgress, parentPurchased = false, t, depth = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [childContainers, setChildContainers] = useState([])
  const [loading, setLoading] = useState(false)

  const containerId = normalizeId(container?._id || container?.id)
  const hasChildren = Array.isArray(container?.children) && container.children.length > 0

  const fetchChildren = async () => {
    if (!hasChildren) return

    if (isExpanded) {
      setIsExpanded(false)
      return
    }

    if (childContainers.length > 0) {
      setIsExpanded(true)
      return
    }

    setLoading(true)
    try {
      const childrenPromises = container.children.map((child) => getContainerById(child._id || child.id))
      const results = await Promise.all(childrenPromises)
      const validResults = results
        .filter((result) => result?.status === "success" && result.data)
        .map((result) => result.data)

      setChildContainers(validResults)
    } catch (err) {
      console.error("Error fetching child containers:", err)
    } finally {
      setLoading(false)
      setIsExpanded(true)
    }
  }

  const containerIsPurchased = parentPurchased || (containerId ? isPurchased(containerId) : false)
  const containerTypeLabel =
    {
      course: t("containerTypes.course"),
      year: t("containerTypes.year"),
      term: t("containerTypes.term"),
      month: t("containerTypes.month"),
      lecture: t("containerTypes.lecture"),
    }[container.type] || container.type

  return (
    <div
      className={`mb-2 overflow-hidden rounded-xl transition-all duration-300 ${
        isExpanded ? "shadow-lg" : "bg-white shadow-sm"
      }`}
      style={{
        border: "1px solid rgba(17,24,39,0.08)",
        background: isExpanded
          ? "linear-gradient(135deg, rgba(14,85,99,0.06) 0%, rgba(243,154,63,0.10) 100%)"
          : "white"
      }}
    >
      <div className="p-3 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
          <div className="flex min-w-0 items-center gap-3">
            {container.type === "lecture" ? (
              <PlayCircle className="text-primary" style={{ color: designTokens.colors.deepTeal }} />
            ) : (
              <Book className="text-primary" style={{ color: designTokens.colors.deepTeal }} />
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium leading-snug break-words sm:text-base">{container.name}</h3>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <span className="rounded-full px-2 py-1 text-xs font-medium" 
                  style={{ 
                    background: `${designTokens.colors.lightAquaMist}20`,
                    color: designTokens.colors.deepTeal 
                  }}
                >
                  {containerTypeLabel}
                </span>
                {container.price > 0 ? (
                  <span className="rounded-full px-2 py-1 text-xs font-medium" 
                    style={{ 
                      background: `${designTokens.colors.warmMango}20`,
                      color: designTokens.colors.warmMango 
                    }}
                  >
                    {container.price} {t("pricing.points")}
                  </span>
                ) : (
                  <span className="rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-700">
                    {t("pricing.free")}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center justify-start gap-1.5 sm:w-auto">
            {containerIsPurchased ? (
              <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium bg-green-100 text-green-700 whitespace-nowrap">
                <Unlock size={12} />
                {parentPurchased ? t("purchase.availableInCourse") : t("purchase.purchased")}
              </span>
            ) : (
              <button
                className={`rounded-full px-4 py-2 text-sm font-medium text-white transition-all hover:scale-[1.02] ${
                  purchaseInProgress === containerId ? "opacity-50" : ""
                }`}
                style={{
                  background: designTokens.colors.deepTeal,
                  boxShadow: `0 4px 12px ${designTokens.colors.deepTeal}40`
                }}
                onClick={() => onPurchase(containerId)}
                disabled={purchaseInProgress !== null}
              >
                {purchaseInProgress === containerId ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                ) : (
                  container.price > 0 ? t("purchase.buy") : t("purchase.getFree")
                )}
              </button>
            )}

            {hasChildren && (
              <button
                className="rounded-full px-4 py-2 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                style={{
                  background: `linear-gradient(120deg, ${designTokens.colors.deepTeal} 0%, ${designTokens.colors.richTeal} 52%, ${designTokens.colors.warmMango} 100%)`,
                  boxShadow: `0 5px 14px ${designTokens.colors.richTeal}40`,
                }}
                onClick={fetchChildren}
                disabled={loading}
                aria-expanded={isExpanded}
              >
                {loading ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <span className="text-xs font-semibold tracking-wide">
                      {isExpanded ? t("actions.hide") : t("actions.show")}
                    </span>
                    <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${
                      isExpanded ? "rotate-180" : "rotate-0"
                    }`} />
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {(hasChildren || childContainers.length > 0) && (
          <div
            className={`mt-2 overflow-hidden transition-all duration-500 ease-out ${
              isExpanded ? "opacity-100" : "max-h-0 opacity-0"
            }`}
            style={
              isExpanded
                ? {
                    maxHeight: depth === 0 ? "min(68vh, 760px)" : undefined,
                    overflowY: depth === 0 ? "auto" : "visible",
                    paddingRight: depth === 0 ? "0.15rem" : undefined,
                  }
                : undefined
            }
          >
            <div className="pl-2 sm:pl-4">
              {childContainers.map((child, index) => (
                <div
                  key={child._id || child.id || `${containerId}-child-${index}`}
                  className={`transition-all duration-500 ease-out ${
                    isExpanded ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-[0.98]"
                  }`}
                  style={{
                    transitionDelay: isExpanded ? `${Math.min(index * 70, 420)}ms` : "0ms",
                    willChange: "transform, opacity",
                  }}
                >
                  <ContainerItem
                    container={child}
                    isPurchased={isPurchased}
                    onPurchase={onPurchase}
                    purchaseInProgress={purchaseInProgress}
                    parentPurchased={containerIsPurchased}
                    t={t}
                    depth={depth + 1}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
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
  const [remainingPoints, setRemainingPoints] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [isWishlisted, setIsWishlisted] = useState(false)
  
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

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorAlert message={error} />
  if (!courseData) return <ErrorAlert message={t("errors.courseNotFound")} />

  // Sample data for the new design
  const course = {
    id: courseData._id,
    code: courseData.subject?.name || "COURSE",
    category: courseData.type || "Course",
    title: courseData.name,
    description: courseData.description || "",
    instructor: {
      name: courseData.createdBy?.name || "Instructor",
      title: "Instructor",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
    },
    rating: 4.8,
    students: 156,
    level: levelName || "Beginner",
    duration: "2.6 Hours",
    updated: "March 2024",
    language: isRTL ? "Arabic" : "English (UK)",
    certification: true,
    price: courseData.price || 0,
    originalPrice: courseData.price * 2 || 70000,
    discount: courseData.price > 0 ? 50 : 0,
    image: seoImage,
    targetAudience: courseData.subject?.name ? [courseData.subject.name] : ["General"],
    outcomes: courseData.goal || ["Master the course content", "Gain practical skills"]
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'syllabus', label: 'Syllabus' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'instructors', label: 'Instructors' },
    { id: 'faq', label: 'FAQ' }
  ]

  const quickStats = [
    {
      icon: BarChart3,
      label: 'Level',
      value: course.level,
      color: TOKENS.deepTeal
    },
    {
      icon: Users,
      label: 'Students',
      value: `${course.students} Enrolled`,
      color: TOKENS.deepTeal
    },
    {
      icon: Clock,
      label: 'Duration',
      value: course.duration,
      color: TOKENS.deepTeal
    },
    {
      icon: RefreshCw,
      label: 'Updated',
      value: course.updated,
      color: TOKENS.deepTeal
    }
  ]

  const courseDetails = [
    {
      icon: School,
      label: 'Level',
      value: course.level
    },
    {
      icon: Users,
      label: 'Total Enrolled',
      value: `${course.students} Students`
    },
    {
      icon: Globe,
      label: 'Language',
      value: course.language
    },
    {
      icon: Shield,
      label: 'Certification',
      value: course.certification ? 'Yes' : 'No'
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
              {/* Course Code Badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
                <span className="text-xs font-bold tracking-widest uppercase">
                  {course.code} {course.category}
                </span>
              </div>

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
                />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-white/70">
                    Taught by
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
                  {isWishlisted ? 'Wishlisted' : 'Wishlist'}
                </button>
                <button className="flex items-center gap-2 rounded-full border border-white/20 px-8 py-3 font-bold backdrop-blur-md transition-all hover:bg-white/10">
                  <Share2 className="h-5 w-5" />
                  Share
                </button>
              </div>
            </div>

            {/* Right Column - Course Image */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative">
                <img 
                  src={course.image}
                  alt="Course Visual"
                  className="h-auto max-h-[500px] w-full max-w-md rounded-lg object-cover shadow-2xl lg:max-w-none"
                />
                
                {/* Rating Badge */}
                <div className="absolute -bottom-6 -left-6 rounded-lg p-6 shadow-2xl" 
                  style={{ 
                    background: TOKENS.warmMango,
                    color: 'white'
                  }}
                >
                  <div className="text-3xl font-black">{course.rating}</div>
                  <div className="flex gap-0.5 my-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${i < Math.floor(course.rating) ? 'fill-current' : ''}`} 
                      />
                    ))}
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider opacity-90">
                    Global Rating
                  </div>
                </div>
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
            {/* Bento-style Sections */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Who is this course for */}
              <div 
                className="rounded-xl border p-6 shadow-sm"
                style={{ 
                  background: TOKENS.neutralCloud,
                  borderColor: 'rgba(17,24,39,0.08)'
                }}
              >
                <h3 className="mb-4 flex items-center gap-3 text-lg font-black" style={{ color: TOKENS.deepTeal }}>
                  <Brain className="h-5 w-5" />
                  Who is this course for
                </h3>
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
              <div 
                className="rounded-xl border p-6 shadow-sm"
                style={{ 
                  background: TOKENS.neutralCloud,
                  borderColor: 'rgba(17,24,39,0.08)'
                }}
              >
                <h3 className="mb-4 flex items-center gap-3 text-lg font-black" style={{ color: TOKENS.deepTeal }}>
                  <Sparkles className="h-5 w-5" />
                  What you'll get out of this
                </h3>
                <ul className="space-y-3">
                  {course.outcomes.map((outcome, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm font-semibold" style={{ color: TOKENS.slateText }}>
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0" style={{ color: TOKENS.warmMango }} />
                      {outcome}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

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
                      Mastering the Course
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
                        Did you know?
                      </h4>
                      <p className="text-sm font-medium leading-relaxed" style={{ color: TOKENS.slateText }}>
                        This course is designed to provide comprehensive learning with practical applications and real-world examples.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'syllabus' && (
                <div className="space-y-8">
                  {/* Syllabus Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-black" style={{ color: TOKENS.deepTeal }}>
                        Course Syllabus
                      </h2>
                      <p className="text-sm mt-1" style={{ color: TOKENS.slateText }}>
                        12 Weeks • 24 Modules • 3 Major Projects
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        className="p-2 rounded-full border transition-all hover:scale-110"
                        style={{ 
                          borderColor: `${TOKENS.deepTeal}30`,
                          color: TOKENS.deepTeal 
                        }}
                      >
                        <ChevronRight className="h-5 w-5 rotate-90" />
                      </button>
                    </div>
                  </div>

                  {/* Modules Grid */}
                  <div className="space-y-6">
                    {/* Module 1 */}
                    <div 
                      className="rounded-xl p-6 shadow-sm border group transition-all hover:shadow-lg"
                      style={{ 
                        background: TOKENS.neutralCloud,
                        borderColor: 'rgba(17,24,39,0.08)'
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg"
                          style={{ 
                            background: TOKENS.deepTeal,
                            color: 'white'
                          }}
                        >
                          01
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black" style={{ color: TOKENS.inkText }}>
                              Introduction to Modulation Theory
                            </h3>
                            <span 
                              className="text-xs font-semibold px-3 py-1 rounded-full"
                              style={{ 
                                background: `${TOKENS.warmMango}20`,
                                color: TOKENS.warmMango
                              }}
                            >
                              Week 1
                            </span>
                          </div>
                          <p className="text-sm mt-1" style={{ color: TOKENS.slateText }}>
                            Foundational concepts of signal processing and the necessity of frequency translation.
                          </p>
                          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div 
                              className="p-4 rounded-lg"
                              style={{ background: 'white' }}
                            >
                              <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: TOKENS.slateText }}>
                                Key Topics
                              </h4>
                              <ul className="space-y-1 text-sm font-medium" style={{ color: TOKENS.inkText }}>
                                <li>• Signal Spectrum & Bandwidth</li>
                                <li>• The Need for High Frequency</li>
                                <li>• Baseband vs. Passband</li>
                              </ul>
                            </div>
                            <div 
                              className="p-4 rounded-lg"
                              style={{ background: 'white' }}
                            >
                              <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: TOKENS.slateText }}>
                                Duration & Deliverables
                              </h4>
                              <p className="text-sm font-medium" style={{ color: TOKENS.inkText }}>
                                4 Hours Lecture • Intro Quiz
                              </p>
                              <div className="mt-2 h-1 w-full rounded-full overflow-hidden" style={{ background: TOKENS.neutralCloud }}>
                                <div 
                                  className="h-full rounded-full"
                                  style={{ 
                                    width: '100%',
                                    background: TOKENS.warmMango
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Module 2 */}
                    <div 
                      className="rounded-xl p-6 shadow-sm border group transition-all hover:shadow-lg"
                      style={{ 
                        background: TOKENS.neutralCloud,
                        borderColor: 'rgba(17,24,39,0.08)'
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg"
                          style={{ 
                            background: TOKENS.deepTeal,
                            color: 'white'
                          }}
                        >
                          02
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black" style={{ color: TOKENS.inkText }}>
                              Amplitude Modulation (AM) Techniques
                            </h3>
                            <span 
                              className="text-xs font-semibold px-3 py-1 rounded-full"
                              style={{ 
                                background: `${TOKENS.lightAquaMist}30`,
                                color: TOKENS.deepTeal
                              }}
                            >
                              Week 2-3
                            </span>
                          </div>
                          <p className="text-sm mt-1" style={{ color: TOKENS.slateText }}>
                            Deep dive into DSB-SC, SSB, and VSB modulation schemes with mathematical rigor.
                          </p>
                          <div className="mt-6 flex flex-col gap-4">
                            <div 
                              className="flex items-center gap-4 p-4 rounded-lg border"
                              style={{ 
                                background: `${TOKENS.deepTeal}10`,
                                borderColor: `${TOKENS.deepTeal}30`
                              }}
                            >
                              <Brain className="text-primary" style={{ color: TOKENS.deepTeal }} />
                              <div>
                                <h4 className="text-sm font-black" style={{ color: TOKENS.deepTeal }}>
                                  Hands-on Project: Signal Reconstruction
                                </h4>
                                <p className="text-xs" style={{ color: TOKENS.slateText }}>
                                  Design a synchronous detector in MATLAB/Simulink to recover AM signals.
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div 
                                className="px-4 py-2 rounded-full text-center text-xs font-black"
                                style={{ 
                                  background: TOKENS.neutralCloud,
                                  color: TOKENS.slateText
                                }}
                              >
                                DSB-SC ANALYSIS
                              </div>
                              <div 
                                className="px-4 py-2 rounded-full text-center text-xs font-black"
                                style={{ 
                                  background: TOKENS.neutralCloud,
                                  color: TOKENS.slateText
                                }}
                              >
                                HILBERT TRANSFORMS
                              </div>
                              <div 
                                className="px-4 py-2 rounded-full text-center text-xs font-black"
                                style={{ 
                                  background: TOKENS.neutralCloud,
                                  color: TOKENS.slateText
                                }}
                              >
                                POWER EFFICIENCY
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Module 3 */}
                    <div 
                      className="rounded-xl p-6 shadow-sm border group transition-all hover:shadow-lg"
                      style={{ 
                        background: TOKENS.neutralCloud,
                        borderColor: 'rgba(17,24,39,0.08)'
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg"
                          style={{ 
                            background: TOKENS.deepTeal,
                            color: 'white'
                          }}
                        >
                          03
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black" style={{ color: TOKENS.inkText }}>
                              Angle Modulation: FM & PM
                            </h3>
                            <span 
                              className="text-xs font-semibold px-3 py-1 rounded-full"
                              style={{ 
                                background: `${TOKENS.lightAquaMist}30`,
                                color: TOKENS.deepTeal
                              }}
                            >
                              Week 4-5
                            </span>
                          </div>
                          <p className="text-sm mt-1" style={{ color: TOKENS.slateText }}>
                            Frequency and Phase modulation concepts, Carson's Rule, and noise performance.
                          </p>
                          <div className="mt-6 space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-2" style={{ color: TOKENS.slateText }}>
                                <Clock className="h-4 w-4" />
                                8 Total Hours
                              </span>
                              <span className="font-black" style={{ color: TOKENS.deepTeal }}>
                                In-Progress
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: TOKENS.neutralCloud }}>
                              <div 
                                className="h-full rounded-full shadow-sm"
                                style={{ 
                                  width: '35%',
                                  background: TOKENS.deepTeal,
                                  boxShadow: `0 0 8px ${TOKENS.deepTeal}50`
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Module 4 - Locked */}
                    <div 
                      className="rounded-xl p-6 border border-dashed opacity-60"
                      style={{ 
                        background: `${TOKENS.neutralCloud}50`,
                        borderColor: `${TOKENS.deepTeal}30`,
                        borderStyle: 'dashed'
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ background: 'white' }}
                        >
                          <Lock className="h-6 w-6" style={{ color: TOKENS.slateText }} />
                        </div>
                        <div className="flex-grow">
                          <h3 className="text-lg font-black" style={{ color: TOKENS.slateText }}>
                            Digital Pulse Modulation
                          </h3>
                          <p className="text-sm mt-1" style={{ color: TOKENS.slateText }}>
                            Sampling theorem, PCM, DPCM, and Delta Modulation fundamentals.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Course Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                    <div 
                      className="rounded-xl p-6 text-center"
                      style={{ 
                        background: TOKENS.deepTeal,
                        color: 'white'
                      }}
                    >
                      <div className="text-3xl font-black mb-2">12</div>
                      <div className="text-sm font-medium opacity-90">Weeks Duration</div>
                    </div>
                    <div 
                      className="rounded-xl p-6 text-center"
                      style={{ 
                        background: TOKENS.warmMango,
                        color: 'white'
                      }}
                    >
                      <div className="text-3xl font-black mb-2">24</div>
                      <div className="text-sm font-medium opacity-90">Total Modules</div>
                    </div>
                    <div 
                      className="rounded-xl p-6 text-center"
                      style={{ 
                        background: TOKENS.softCyanTeal,
                        color: 'white'
                      }}
                    >
                      <div className="text-3xl font-black mb-2">3</div>
                      <div className="text-sm font-medium opacity-90">Major Projects</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab !== 'overview' && activeTab !== 'syllabus' && (
                <div className="text-center py-12" style={{ color: TOKENS.slateText }}>
                  <p className="text-lg font-medium">
                    {tabs.find(t => t.id === activeTab)?.label} content coming soon...
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
                <div className="flex items-center justify-between">
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-black" style={{ color: TOKENS.deepTeal }}>
                      {course.price > 0 ? `Rp ${course.price.toLocaleString()}` : 'Free'}
                    </span>
                    {course.originalPrice > course.price && (
                      <span className="text-sm font-bold line-through" style={{ color: TOKENS.slateText }}>
                        Rp {course.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                  {course.discount > 0 && (
                    <span 
                      className="rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider border"
                      style={{ 
                        background: `${TOKENS.warmMango}20`,
                        color: TOKENS.warmMango,
                        borderColor: `${TOKENS.warmMango}50`
                      }}
                    >
                      {course.discount}% OFF
                    </span>
                  )}
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
                            Processing...
                          </span>
                        ) : (
                          course.price === 0 ? 'Get Free' : 'Buy Now'
                        )}
                      </button>
                      <button 
                        className="w-full rounded-full border-2 py-4 font-black text-lg transition-all hover:bg-opacity-5"
                        style={{ 
                          borderColor: TOKENS.deepTeal,
                          color: TOKENS.deepTeal
                        }}
                      >
                        Add to Cart
                      </button>
                    </>
                  )}
                </div>

                {/* Course Details */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider border-b pb-3" style={{ color: TOKENS.slateText, borderColor: 'rgba(17,24,39,0.08)' }}>
                    Course Details
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

                {/* Guarantee */}
                <div className="pt-6 border-t" style={{ borderColor: 'rgba(17,24,39,0.08)' }}>
                  <p className="text-center text-xs font-bold uppercase tracking-wider leading-relaxed" style={{ color: TOKENS.slateText }}>
                    30-Day Money-Back Guarantee<br />
                    Lifetime access included
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

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
              {isRTL ? "تم الشراء بنجاح!" : "Purchase Successful!"}
            </h3>
            <p className="py-4 text-base font-medium" style={{ color: TOKENS.inkText }}>
              {isRTL 
                ? "تمت عملية الشراء بنجاح، ومحتواك الآن متاح في لوحة التحكم الخاصة بك. هل تود الانتقال إلى لوحة التحكم الآن؟"
                : "Your purchase was successful and is now available in your dashboard. Would you like to go to your dashboard now?"
              }
            </p>
            <div className="flex gap-3">
              <button 
                className="flex-1 rounded-full px-6 py-3 font-medium transition-all hover:bg-black/5" 
                style={{ color: TOKENS.inkText }}
                onClick={() => setShowSuccessModal(false)}
              >
                {isRTL ? "لاحقاً" : "Later"}
              </button>
              <button 
                className="flex-1 rounded-full px-6 py-3 font-medium text-white transition-all hover:opacity-90 hover:scale-105" 
                style={{ backgroundColor: TOKENS.deepTeal }}
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate("/dashboard/student-dashboard");
                }}
              >
                {isRTL ? "نعم، انتقل للوحة التحكم" : "Yes, go to Dashboard"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
