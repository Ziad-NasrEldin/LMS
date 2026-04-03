"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { getContainerById, purchaseContainer } from "../routes/lectures"
import { getUserDashboard } from "../routes/auth-services"
import { LoadingSpinner } from "../components/LoadingSpinner"
import { ErrorAlert } from "../components/ErrorAlert"
import { FaChalkboardTeacher, FaBook, FaGraduationCap, FaMoneyBillWave, FaUnlock, FaPlayCircle, FaChevronDown } from "react-icons/fa"
import { designTokens } from "../constants/designTokens"
import { resolveLevelDisplayName } from "../utils/levelHierarchy"
import { buildCoursePath } from "../seo/site.mjs"
import { useSeo } from "../seo/useSeo"
import { buildBreadcrumbSchema, buildCourseSchema } from "../seo/structuredData.mjs"

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

    // Allow the dropdown to collapse/expand without re-fetching every time.
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
      // Fetch each child container
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

  // Container is purchased if directly purchased or if parent is purchased
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
      className={`card mb-2 overflow-hidden transition-all duration-300 ${isExpanded ? "shadow-lg ring-1 ring-primary/20" : "bg-base-100 shadow-sm"}`}
      style={
        isExpanded
          ? {
              backgroundImage: "linear-gradient(135deg, rgba(14,85,99,0.06) 0%, rgba(243,154,63,0.10) 100%)",
            }
          : undefined
      }
    >
      <div className="card-body p-2.5 sm:p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
          <div className="flex min-w-0 items-center gap-3">
            {container.type === "lecture" ? (
              <FaPlayCircle className="text-primary" />
            ) : (
              <FaBook className="text-primary" />
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium leading-snug break-words sm:text-base">{container.name}</h3>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <span className="badge badge-sm badge-accent">{containerTypeLabel}</span>
                {container.price > 0 ? (
                  <span className="badge badge-sm badge-neutral">{container.price} {t("pricing.points")}</span>
                ) : (
                  <span className="badge badge-sm badge-success">{t("pricing.free")}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center justify-start gap-1.5 sm:w-auto">
            {containerIsPurchased ? (
              <span className="badge badge-sm badge-success gap-1 whitespace-nowrap">
                <FaUnlock size={12} />
                {parentPurchased ? t("purchase.availableInCourse") : t("purchase.purchased")}
              </span>
            ) : (
              <button
                className={`btn btn-xs sm:btn-sm btn-primary min-h-0 h-8 px-3 ${purchaseInProgress === containerId ? "loading" : ""}`}
                onClick={() => onPurchase(containerId)}
                disabled={purchaseInProgress !== null}
              >
                {container.price > 0 ? t("purchase.buy") : t("purchase.getFree")}
              </button>
            )}

            {hasChildren && (
              <button
                className="btn btn-xs sm:btn-sm border-0 text-primary-content rounded-full px-3 min-h-0 h-8 justify-center transition-all duration-300 hover:scale-[1.02] active:scale-100"
                style={{
                  backgroundImage: "linear-gradient(120deg, #0E5563 0%, #146A78 52%, #F39A3F 100%)",
                  boxShadow: "0 5px 14px rgba(20, 106, 120, 0.25)",
                }}
                onClick={fetchChildren}
                disabled={loading}
                aria-expanded={isExpanded}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <span className="text-xs font-semibold tracking-wide">{isExpanded ? t("actions.hide") : t("actions.show")}</span>
                    <FaChevronDown className={`h-3 w-3 transition-transform duration-300 ${isExpanded ? "rotate-180" : "rotate-0"}`} />
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Child containers */}
        {(hasChildren || childContainers.length > 0) && (
          <div
            className={`mt-2 overflow-hidden transition-all duration-500 ease-out ${isExpanded ? "opacity-100" : "max-h-0 opacity-0"}`}
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
                  className={`transition-all duration-500 ease-out ${isExpanded ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-[0.98]"}`}
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
                    parentPurchased={containerIsPurchased} // Pass down purchase status
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

        // Fetch course data and user dashboard in parallel
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

          // Store user balance if available
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
    // Create a set of all purchased container IDs for faster lookup
    const purchasedIds = new Set(
      purchaseHistory
        .map((purchase) => getPurchaseContainerId(purchase))
        .filter(Boolean),
    )

    // Return a function that checks if a container is purchased
    return (containerId) => {
      const normalizedContainerId = normalizeId(containerId)
      if (!normalizedContainerId) return false

      // Direct purchase check
      if (purchasedIds.has(normalizedContainerId)) {
        return true
      }

      // Check if any parent container is purchased
      if (courseData && courseData._id) {
        // If the course itself is purchased and the container is a child
        if (purchasedIds.has(normalizeId(courseData._id)) && normalizedContainerId !== normalizeId(courseData._id)) {
          return true
        }

        // For nested containers, we need to check the hierarchy
        // This is a simplified approach - for deeply nested structures,
        // you might need a more sophisticated traversal
        const findParentRecursive = (container, targetId) => {
          if (!container || !container.children) return false

          // Check if the target is a direct child
          const isDirectChild = container.children.some((child) => normalizeId(child._id || child.id) === targetId)

          if (isDirectChild && purchasedIds.has(normalizeId(container._id))) {
            return true
          }

          // Check in children recursively
          return container.children.some((child) => {
            // We only have full data for children that have been expanded
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
      // Call the purchase API
      const response = await purchaseContainer(containerId)

      // Check if the purchase was successful
      if (response && response.data && response.data.status === "success") {
        setPurchaseSuccess(true)

        // Update remaining balance if available in the response
        if (response.data.data && response.data.data.remainingLecturerPoints !== undefined) {
          setRemainingPoints(response.data.data.remainingLecturerPoints)
        }

        const purchaseFromResponse = response.data?.data?.purchase
        const purchasedId = getPurchaseContainerId(purchaseFromResponse) || normalizedContainerId

        // Optimistic, normalized update for instant button state reflection.
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

        // Ensure absolute consistency with backend for nested/related purchases.
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

        // Update remaining balance if available
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

  return (
    <div
      className="min-h-screen"
      dir={isRTL ? "rtl" : "ltr"}
      style={{ background: `${GRADIENTS.pageAtmosphere}, ${TOKENS.creamSurface}` }}
    >
      <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-8 sm:px-6 lg:px-8">
        <div
          className="rounded-[2rem] border p-4 sm:p-6 lg:p-8"
          style={{
            background: TOKENS.neutralCloud,
            borderColor: "rgba(17,24,39,0.08)",
            boxShadow: SHADOWS.level1,
          }}
        >
          <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar with Course Details */}
          <div className="order-1 lg:order-none lg:w-1/3">
            <div
              className="card sticky top-6 border"
              style={{
                background: "#FFFFFF",
                borderColor: "rgba(17,24,39,0.08)",
                boxShadow: SHADOWS.level1,
                borderRadius: "1.4rem",
              }}
            >
              <div className="card-body">
                <h2 className="card-title mb-4 justify-center text-2xl" style={{ color: TOKENS.inkText }}>
                  {t("details.title")}
                </h2>
                <div className="space-y-1">
                  <DetailItem
                    icon={<FaMoneyBillWave className="text-accent" />}
                    label={t("courseInfo.price")}
                    value={courseData?.price > 0 ? `${courseData.price} ${t("pricing.points")}` : t("pricing.free")}
                    tokens={TOKENS}
                  />
                  <DetailItem
                    icon={<FaGraduationCap className="text-primary" />}
                    label={t("courseInfo.level")}
                    value={courseData?.level ? resolveLevelDisplayName(courseData.level, i18n.language) : t("purchase.notDetermined")}
                    tokens={TOKENS}
                  />
                  <DetailItem
                    icon={<FaBook className="text-secondary" />}
                    label={t("courseInfo.subject")}
                    value={courseData?.subject?.name || t("purchase.notDetermined")}
                    tokens={TOKENS}
                  />
                  <DetailItem
                    icon={<FaChalkboardTeacher className="text-accent" />}
                    label={t("purchase.purchaseStatus")}
                    value={isContainerPurchased(courseId) ? t("purchase.purchased") : t("purchase.notPurchased")}
                    tokens={TOKENS}
                  />
                </div>

                <div className="card-actions mt-6">
                  {isContainerPurchased(courseId) ? (
                    <button className="btn w-full" style={{ background: "#0E5563", color: "#F8FCFF", borderColor: "#0E5563" }} disabled>
                      ✓ {t("purchase.purchased")}
                    </button>
                  ) : (
                    <>
                      {purchaseError && (
                        <div className="alert alert-error w-full mb-2">
                          <span>{purchaseError}</span>
                        </div>
                      )}
                      {purchaseSuccess && (
                        <div className="alert alert-success w-full mb-2">
                          <span>{t("purchase.purchaseSuccess")}</span>
                        </div>
                      )}
                      <button
                        className={`btn w-full ${purchaseInProgress === courseId ? "loading" : ""}`}
                        style={{ background: TOKENS.deepTeal, color: "#F8FCFF", borderColor: TOKENS.deepTeal }}
                        onClick={() => handlePurchase(courseId)}
                        disabled={purchaseInProgress !== null}
                      >
                        {courseData?.price === 0
                          ? t("purchase.getCourseFree")
                          : purchaseInProgress === courseId
                            ? t("purchase.purchaseInProgress")
                            : t("purchase.buyCourse")}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="space-y-6 lg:w-2/3">
            {/* Course Header */}
            <div
              className="card border"
              style={{
                background: "#FFFFFF",
                borderColor: "rgba(17,24,39,0.08)",
                boxShadow: SHADOWS.level1,
                borderRadius: "1.4rem",
              }}
            >
              <div className="card-body">
                <div className="flex justify-between items-start">
                  <h1 className="card-title text-2xl md:text-3xl mb-4" style={{ color: TOKENS.inkText }}>{courseData?.name}</h1>
                  {isContainerPurchased(courseId) && <span className="badge badge-success badge-lg">{t("purchase.purchased")}</span>}
                </div>
                {courseData?.description && <p className="text-base-content/80" style={{ color: TOKENS.slateText }}>{courseData.description}</p>}
              </div>
            </div>

            {/* Objectives Section */}
            {courseData?.goal?.length > 0 && (
              <div
                className="card border"
                style={{
                  background: "#FFFFFF",
                  borderColor: "rgba(17,24,39,0.08)",
                  boxShadow: SHADOWS.level1,
                  borderRadius: "1.4rem",
                }}
              >
                <div className="card-body">
                  <h2 className="card-title text-xl mb-4" style={{ color: TOKENS.inkText }}>{t("courseInfo.courseObjectives")}</h2>
                  <ul className="space-y-3">
                    {courseData.goal.map((obj, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="text-primary">•</span>
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Course Content Section */}
            <div
              className="card border"
              style={{
                background: "#FFFFFF",
                borderColor: "rgba(17,24,39,0.08)",
                boxShadow: SHADOWS.level1,
                borderRadius: "1.4rem",
              }}
            >
              <div className="card-body">
                <h2 className="card-title text-xl mb-4" style={{ color: TOKENS.inkText }}>{t("courseInfo.courseContents")}</h2>

                {/* Main container */}
                <ContainerItem
                  container={courseData}
                  isPurchased={isContainerPurchased}
                  onPurchase={handlePurchase}
                  purchaseInProgress={purchaseInProgress}
                  t={t}
                />
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal modal-open border-none bg-black/40 backdrop-blur-sm z-50">
          <div className="modal-box rounded-[2rem]" style={{ border: '1px solid rgba(17,24,39,0.08)', boxShadow: '0 12px 28px rgba(0,0,0,0.12)', backgroundColor: TOKENS.creamSurface }}>
            <h3 className="font-bold text-xl" style={{ color: TOKENS.deepTeal }}>{isRTL ? "تم الشراء بنجاح!" : "Purchase Successful!"}</h3>
            <p className="py-4 text-base font-medium" style={{ color: TOKENS.inkText }}>
              {isRTL ? "تمت عملية الشراء بنجاح، ومحتواك الآن متاح في لوحة التحكم الخاصة بك. هل تود الانتقال إلى لوحة التحكم الآن؟" : "Your purchase was successful and is now available in your dashboard. Would you like to go to your dashboard now?"}
            </p>
            <div className="modal-action">
              <button 
                className="btn btn-ghost hover:bg-black/5 rounded-full px-6 border-none" 
                style={{ color: TOKENS.inkText }}
                onClick={() => setShowSuccessModal(false)}
              >
                {isRTL ? "لاحقاً" : "Later"}
              </button>
              <button 
                className="btn text-white border-none hover:opacity-90 hover:scale-105 transition-transform rounded-full px-6" 
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
