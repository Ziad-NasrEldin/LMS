"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { fetchPackages, purchasePackage } from "../../routes/packages"
import { getUserDashboard } from "../../routes/auth-services"
import { toast } from "react-hot-toast"
import { Wallet, Search, Filter, Package, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useTranslation } from "react-i18next"

const PackagesPage = () => {
  const navigate = useNavigate()
  const [packages, setPackages] = useState([])
  const [filteredPackages, setFilteredPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [priceFilter, setPriceFilter] = useState("")
  const [teacherFilter, setTeacherFilter] = useState("")
  const [userData, setUserData] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [purchaseLoading, setPurchaseLoading] = useState(false)
  // Add state for purchased packages
  const [purchasedPackages, setPurchasedPackages] = useState([])
  const itemsPerPage = 6
  const { t,i18n } = useTranslation("packages")
  const isRtl = i18n.language === "ar";
  // Fetch packages and user data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch packages
        const packagesResponse = await fetchPackages()
        setPackages(packagesResponse.data.packages)
        setFilteredPackages(packagesResponse.data.packages)

        // Fetch user data
        try {
          const userResponse = await getUserDashboard()
          if (userResponse.success) {
            setUserData(userResponse.data.data.userInfo)
            
            // Extract purchased package IDs from purchase history
            const purchasedPackageIds = userResponse.data.data.purchaseHistory
              .filter(purchase => purchase.type === "packagePurchase")
              .map(purchase => purchase.package?._id)
              .filter(Boolean)
            
            setPurchasedPackages(purchasedPackageIds)
          }
        } catch (userErr) {
          console.error("Failed to load user data:", userErr)
          // Don't set error state here, as we still want to show packages
        }

        setLoading(false)
      } catch (err) {
        setError(t("common.error"))
        setLoading(false)
      }
    }
    loadData()
  }, [t])

  // Apply filters
  useEffect(() => {
    let filtered = packages

    // Apply price filter
    if (priceFilter) {
      const [min, max] = priceFilter.split("-").map(Number)
      filtered = filtered.filter((pkg) => pkg.price >= min && (max ? pkg.price <= max : true))
    }

    // Apply teacher filter
    if (teacherFilter) {
      filtered = filtered.filter((pkg) =>
        pkg.points.some((point) => point.lecturer.name.toLowerCase() === teacherFilter.toLowerCase()),
      )
    }

    setFilteredPackages(filtered)
    setCurrentPage(1) // Reset to first page on filter change
  }, [priceFilter, teacherFilter, packages])

  // Get unique lecturer names for teacher filter
  const uniqueTeachers = Array.from(
    new Set(packages.flatMap((pkg) => pkg.points.map((point) => point.lecturer.name))),
  ).sort()

  // Handle package purchase
  const handlePurchase = async (pkg) => {
    if (!userData) {
      toast.error(t("packageDetails.loginToPurchase"))
      return
    }

    if (userData.generalPoints < pkg.price) {
      toast.error(t("purchaseModal.insufficientPoints"))
      return
    }

    setSelectedPackage(pkg)
    setIsModalOpen(true)
  }

  // Confirm purchase
  const confirmPurchase = async () => {
    if (!selectedPackage) return

    setPurchaseLoading(true)
    try {
      const response = await purchasePackage(selectedPackage._id)
      if (response.success) {
        // Add the package to purchased packages
        setPurchasedPackages((prev) => [...prev, selectedPackage._id])

        // Update user data with new point balance
        if (userData && response.remainingPoints !== undefined) {
          setUserData({
            ...userData,
            generalPoints: response.remainingPoints,
          })
        }

        toast.success(
          <div>
            <p>{t("purchaseModal.successMessage")}</p>
            <p className="text-sm mt-1">
              {t("purchaseModal.remainingPoints", { points: response.remainingPoints })}
            </p>
          </div>,
        )

        setIsModalOpen(false)
      } else {
        toast.error(response.message || t("purchaseModal.failureMessage"))
      }
    } catch (err) {
      toast.error(t("purchaseModal.errorMessage"))
      console.error(err)
    } finally {
      setPurchaseLoading(false)
    }
  }

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredPackages.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredPackages.length / itemsPerPage)

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    )

  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <div className="text-error mb-4 text-xl">{error}</div>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          {t("common.tryAgain")}
        </button>
      </div>
    )

  return (
    <div className="container mx-auto px-4 py-8"
    dir={isRtl ? "rtl" : "ltr"}>
      {/* Header with User Info */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">{t("packageList.title")}</h1>
        <p className="text-center mb-6">{t("packageList.subtitle")}</p>

        {userData && (
          <div className="bg-base-200 p-4 rounded-lg shadow-sm flex justify-between items-center max-w-md mx-auto">
            <div>
              <p className="font-medium">{t("packageList.welcome")}, {userData.name}</p>
              <p className="text-sm opacity-80">{userData.role}</p>
            </div>
            <div className="flex items-center bg-primary px-4 py-2 rounded-lg">
              <Wallet className="w-5 h-5 mr-2" />
              <p className="font-bold">{userData.generalPoints} {t("common.points")}</p>
            </div>
          </div>
        )}
      </div>

      {/* Search Filters */}
      <div className="mb-8 bg-base-100 p-6 rounded-xl shadow-sm">
        <div className="flex items-center mb-4">
          <Filter className="w-5 h-5 mr-2 text-primary" />
          <h2 className="text-xl font-semibold">{t("packageList.filterTitle")}</h2>
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          <div className="form-control w-full max-w-xs">
            <label className="label">
              <span className="label-text">{t("packageList.priceRange")}</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
            >
              <option value="">{t("packageList.allPrices")}</option>
              <option value="0-200">{t("packageList.priceRanges.0-200")}</option>
              <option value="200-500">{t("packageList.priceRanges.200-500")}</option>
              <option value="500-1000">{t("packageList.priceRanges.500-1000")}</option>
              <option value="1000-">{t("packageList.priceRanges.1000+")}</option>
            </select>
          </div>

          <div className="form-control w-full max-w-xs">
            <label className="label">
              <span className="label-text">{t("packageList.teacher")}</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value)}
            >
              <option value="">{t("packageList.allTeachers")}</option>
              {uniqueTeachers.map((teacher) => (
                <option key={teacher} value={teacher}>
                  {teacher}
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn btn-outline"
            onClick={() => {
              setPriceFilter("")
              setTeacherFilter("")
            }}
          >
            {t("packageList.resetFilters")}
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mb-6 flex justify-between items-center">
        <p className="text-sm ">
          {t("packageList.showing", { current: currentItems.length, total: filteredPackages.length })}
        </p>
      </div>

      {/* Packages Grid */}
      {currentItems.length === 0 ? (
        <div className="text-center py-16 bg-base-200 rounded-xl">
          <Package className="w-16 h-16 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">{t("packageList.noPackagesFound")}</h3>
          <p className=" mb-4">{t("packageList.adjustFilters")}</p>
          <button
            className="btn btn-primary"
            onClick={() => {
              setPriceFilter("")
              setTeacherFilter("")
            }}
          >
            {t("packageList.resetFilters")}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {currentItems.map((pkg) => {
            const isPurchased = purchasedPackages.includes(pkg._id)

            return (
              <div
                key={pkg._id}
                className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow rounded-xl overflow-hidden"
              >
                <figure className="relative h-48">
                  <img
                    src={`https://picsum.photos/seed/${pkg._id}/600/400`}
                    alt={pkg.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute top-4 right-4 badge badge-primary">
                    {pkg.type === "month" ? t("packageList.packageCard.monthly") : pkg.type}
                  </div>
                  {isPurchased && <div className="absolute bottom-4 right-4 badge badge-success">{t("common.purchased")}</div>}
                </figure>

                <div className="card-body">
                  <h3 className="card-title text-xl">{pkg.name}</h3>

                  <div className="my-2">
                    <div className="flex items-center mb-1">
                      <div className="w-3 h-3 rounded-full bg-primary mr-2"></div>
                      <p className="text-sm">
                        <span className="font-medium">{t("packageList.packageCard.teachers")}:</span> {pkg.points.length}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-secondary mr-2"></div>
                      <p className="text-sm truncate">
                        <span className="font-medium">{t("packageList.packageCard.includes")}:</span>{" "}
                        {pkg.points.map((point) => point.lecturer.name).join(", ")}
                      </p>
                    </div>
                  </div>

                  <div className="card-actions justify-between items-center mt-4">
              <div className="flex flex-col">
                <span className="text-2xl font-bold">
                  {pkg.price} {t("common.points")}
                </span>
                {userData && !isPurchased && (
                  <span
                    className={`text-xs ${userData.generalPoints >= pkg.price ? "text-success" : "text-error"}`}
                  >
                    {userData.generalPoints >= pkg.price 
                      ? t("packageList.packageCard.enoughPoints") 
                      : t("packageList.packageCard.notEnoughPoints")}
                  </span>
                )}
                {isPurchased && (
                  <span className="text-xs text-success">
                    {t("packageList.packageCard.alreadyPurchased")}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => navigate(`/package-details/${pkg._id}`, { state: { package: pkg } })}
                >
                  {t("common.details")}
                </button>
                {userData && !isPurchased ? (
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={userData.generalPoints < pkg.price}
                    onClick={() => handlePurchase(pkg)}
                  >
                    {t("common.purchase")}
                  </button>
                ) : userData && isPurchased ? (
                  <button className="btn btn-success btn-sm" disabled>
                    {t("common.purchased")}
                  </button>
                ) : null}
              </div>
            </div>
            </div>
            </div>
            )
            })}
            </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mb-8">
                <button
                  className="btn btn-circle btn-sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      // Show first page, last page, current page, and pages around current page
                      return page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)
                    })
                    .map((page, index, array) => (
                      <div key={page} className="flex items-center">
                        {index > 0 && array[index - 1] !== page - 1 && <span className="mx-1">...</span>}
                        <button
                          className={`btn btn-sm ${currentPage === page ? "btn-primary" : "btn-ghost"}`}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      </div>
                    ))}
                </div>

                <button
                  className="btn btn-circle btn-sm"
                  onClick={() => setCurrentPage((p) => (p >= totalPages ? p : p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Purchase Confirmation Modal */}
            {isModalOpen && selectedPackage && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-base-100 p-6 rounded-xl max-w-md w-full">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">{t("purchaseModal.title")}</h3>
                    <button className="btn btn-sm btn-circle btn-ghost" onClick={() => setIsModalOpen(false)}>
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mb-6">
                    <p className="mb-4">{t("purchaseModal.confirmMessage")}</p>

                    <div className="bg-base-200 p-4 rounded-lg mb-4">
                      <h4 className="font-semibold mb-2">{selectedPackage.name}</h4>
                      <p className="text-sm mb-1">
                        <span className="font-medium">{t("purchaseModal.type")}:</span>{" "}
                        {selectedPackage.type === "month" ? t("packageList.packageCard.monthly") : selectedPackage.type}
                      </p>
                      <p className="text-sm mb-1">
                        <span className="font-medium">{t("purchaseModal.price")}:</span> {selectedPackage.price} {t("common.points")}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">{t("purchaseModal.teachers")}:</span>{" "}
                        {selectedPackage.points.map((point) => point.lecturer.name).join(", ")}
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{t("purchaseModal.yourBalance")}</p>
                        <p className="text-lg font-bold">{userData?.generalPoints || 0} {t("common.points")}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{t("purchaseModal.afterPurchase")}</p>
                        <p className="text-lg font-bold">{(userData?.generalPoints || 0) - selectedPackage.price} {t("common.points")}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button className="btn btn-outline" onClick={() => setIsModalOpen(false)} disabled={purchaseLoading}>
                      {t("common.cancel")}
                    </button>
                    <button className="btn btn-primary" onClick={confirmPurchase} disabled={purchaseLoading}>
                      {purchaseLoading ? <span className="loading loading-spinner loading-sm"></span> : t("purchaseModal.confirmButton")}
                    </button>
                  </div>
                </div>
              </div>
            )}
            </div>
            )
            }

            export default PackagesPage