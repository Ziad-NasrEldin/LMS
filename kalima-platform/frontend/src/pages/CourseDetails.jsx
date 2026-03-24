"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { getContainerById, purchaseContainer } from "../routes/lectures"
import { getUserDashboard } from "../routes/auth-services"
import { LoadingSpinner } from "../components/LoadingSpinner"
import { ErrorAlert } from "../components/ErrorAlert"
import { FaChalkboardTeacher, FaBook, FaGraduationCap, FaMoneyBillWave, FaUnlock, FaPlayCircle, FaChevronDown } from "react-icons/fa"

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

const DetailItem = ({ label, value, icon }) => (
  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 py-3 border-b border-base-200 last:border-b-0">
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </div>
    <span className="text-sm font-semibold text-right">{value}</span>
  </div>
)

const ContainerItem = ({ container, isPurchased, onPurchase, purchaseInProgress, parentPurchased = false, t }) => {
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
      className={`card mb-3 transition-all duration-300 ${isExpanded ? "shadow-xl ring-1 ring-primary/20" : "bg-base-100 shadow-sm"}`}
      style={
        isExpanded
          ? {
              backgroundImage: "linear-gradient(135deg, rgba(14,85,99,0.06) 0%, rgba(243,154,63,0.10) 100%)",
            }
          : undefined
      }
    >
      <div className="card-body p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {container.type === "lecture" ? (
              <FaPlayCircle className="text-primary" />
            ) : (
              <FaBook className="text-primary" />
            )}
            <div>
              <h3 className="font-medium">{container.name}</h3>
              <div className="flex gap-2 mt-1">
                <span className="badge badge-accent">{containerTypeLabel}</span>
                {container.price > 0 ? (
                  <span className="badge badge-neutral">{container.price} {t("pricing.points")}</span>
                ) : (
                  <span className="badge badge-success">{t("pricing.free")}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {containerIsPurchased ? (
              <span className="badge badge-success gap-1">
                <FaUnlock size={12} />
                {parentPurchased ? t("purchase.availableInCourse") : t("purchase.purchased")}
              </span>
            ) : (
              <button
                className={`btn btn-sm btn-primary ${purchaseInProgress === containerId ? "loading" : ""}`}
                onClick={() => onPurchase(containerId)}
                disabled={purchaseInProgress !== null}
              >
                {container.price > 0 ? t("purchase.buy") : t("purchase.getFree")}
              </button>
            )}

            {hasChildren && (
              <button
                className="btn btn-sm border-0 text-primary-content rounded-full px-3 min-h-0 h-9 transition-all duration-300 hover:scale-[1.03] active:scale-100"
                style={{
                  backgroundImage: "linear-gradient(120deg, #0E5563 0%, #146A78 52%, #F39A3F 100%)",
                  boxShadow: "0 8px 22px rgba(20, 106, 120, 0.32)",
                }}
                onClick={fetchChildren}
                disabled={loading}
                aria-expanded={isExpanded}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <span className="text-xs font-semibold tracking-wide">{isExpanded ? t("actions.collapse", { defaultValue: "Hide" }) : t("actions.expand", { defaultValue: "Explore" })}</span>
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
            className={`mt-4 overflow-hidden transition-all duration-500 ease-out ${isExpanded ? "max-h-[2200px] opacity-100" : "max-h-0 opacity-0"}`}
          >
            <div className="pl-6 border-r-2 border-primary/30">
            {childContainers.map((child) => (
              <ContainerItem
                key={child._id}
                container={child}
                isPurchased={isPurchased}
                onPurchase={onPurchase}
                purchaseInProgress={purchaseInProgress}
                parentPurchased={containerIsPurchased} // Pass down purchase status
                t={t}
              />
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
  const { t } = useTranslation("courseDetails")
  const { t: tCommon } = useTranslation("common")
  const [courseData, setCourseData] = useState(null)
  const [purchaseHistory, setPurchaseHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [purchaseInProgress, setPurchaseInProgress] = useState(null)
  const [purchaseError, setPurchaseError] = useState("")
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)
  const [remainingPoints, setRemainingPoints] = useState(null)

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

          // Store user points if available
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

        // Update remaining points if available in the response
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

        // Update remaining points if available
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
    <div className="min-h-screen bg-base-100">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar with Course Details */}
          <div className="lg:w-1/3 order-1 lg:order-none">
            <div className="card bg-base-100 shadow-xl sticky top-6">
              <div className="card-body">
                <h2 className="card-title justify-center text-2xl mb-4">{t("details.title")}</h2>
                <div className="space-y-2">
                  <DetailItem
                    icon={<FaMoneyBillWave className="text-accent" />}
                    label={t("courseInfo.price")}
                    value={courseData?.price > 0 ? `${courseData.price} ${t("pricing.points")}` : t("pricing.free")}
                  />
                  <DetailItem
                    icon={<FaGraduationCap className="text-primary" />}
                    label={t("courseInfo.level")}
                    value={courseData?.level?.name ? tCommon(`gradeLevels.${courseData.level.name}`) : t("purchase.notDetermined")}
                  />
                  <DetailItem
                    icon={<FaBook className="text-secondary" />}
                    label={t("courseInfo.subject")}
                    value={courseData?.subject?.name || t("purchase.notDetermined")}
                  />
                  <DetailItem
                    icon={<FaChalkboardTeacher className="text-accent" />}
                    label={t("purchase.purchaseStatus")}
                    value={isContainerPurchased(courseId) ? t("purchase.purchased") : t("purchase.notPurchased")}
                  />
                </div>

                <div className="card-actions mt-6">
                  {isContainerPurchased(courseId) ? (
                    <button className="btn btn-success w-full" disabled>
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
                        className={`btn btn-primary w-full ${purchaseInProgress === courseId ? "loading" : ""}`}
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
          <div className="lg:w-2/3 space-y-8">
            {/* Course Header */}
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <div className="flex justify-between items-start">
                  <h1 className="card-title text-2xl md:text-3xl mb-4">{courseData?.name}</h1>
                  {isContainerPurchased(courseId) && <span className="badge badge-success badge-lg">{t("purchase.purchased")}</span>}
                </div>
                {courseData?.description && <p className="text-base-content/80">{courseData.description}</p>}
              </div>
            </div>

            {/* Objectives Section */}
            {courseData?.goal?.length > 0 && (
              <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                  <h2 className="card-title text-xl mb-4">{t("courseInfo.courseObjectives")}</h2>
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
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-xl mb-4">{t("courseInfo.courseContents")}</h2>

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
  )
}
