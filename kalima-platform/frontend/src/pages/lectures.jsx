"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Search, Wallet } from 'lucide-react'
import { useTranslation } from "react-i18next"
import { getAllLecturesPublic } from "../routes/lectures"
import { getUserDashboard } from "../routes/auth-services"
import { purchaseContainer } from "../routes/lectures"
import { LoadingSpinner } from "../components/LoadingSpinner"
import { ErrorAlert } from "../components/ErrorAlert"
import { LectureCard } from "../components/lectureCard"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "react-hot-toast"

export default function LecturesPage() {
  const [lectures, setLectures] = useState([])
  const [filteredLectures, setFilteredLectures] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const { t, i18n } = useTranslation("lectures")
  const isRTL = i18n.language === "ar"

  const [selectedStage, setSelectedStage] = useState("")
  const [selectedGrade, setSelectedGrade] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")

  const [currentPage, setCurrentPage] = useState(1)
  const lecturesPerPage = 6

  const [userData, setUserData] = useState(null)
  const [pointsBalances, setPointsBalances] = useState([])
  const [purchasedLectures, setPurchasedLectures] = useState([])

  const convertPathToUrl = (filePath, folder = "product_thumbnails") => {
    if (!filePath) return null
    if (filePath.startsWith("http")) return filePath

    const normalizedPath = filePath.replace(/\\/g, "/")
    const API_URL = import.meta.env.VITE_API_URL || window.location.origin
    const baseUrl = API_URL.replace(/\/$/, "")
    const filename = normalizedPath.split("/").pop()
    return `${baseUrl}/uploads/${folder}/${filename}`
  }

  useEffect(() => {
    fetchLectures()
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const result = await getUserDashboard({
        params: { fields: "userInfo,purchaseHistory,pointsBalances" },
      })

      if (result.success) {
        setUserData(result.data.data.userInfo)
        setPointsBalances(result.data.data.pointsBalances || [])

        const purchasedIds = result.data.data.purchaseHistory
          .filter((purchase) =>
            (purchase.type === "containerPurchase" && purchase.container) ||
            (purchase.type === "lecturePurchase" && purchase.lecture)
          )
          .map((purchase) => {
            if (purchase.type === "containerPurchase" && purchase.container) {
              return purchase.container?._id?.toString();
            } else if (purchase.type === "lecturePurchase" && purchase.lecture) {
              return purchase.lecture?._id?.toString();
            } else if (!purchase.container) {
              const match = purchase.description.match(/Purchased container (.*?) for/);
              return match ? match[1] : null;
            }
            return null;
          })
          .filter((id) => id)

        // Merge backend list with already-purchased, never reset
  setPurchasedLectures((prev) => Array.from(new Set([...prev.map(String), ...purchasedIds.map(String)])))
      } else {
        console.error("Failed to fetch user data:", result.error)
      }
    } catch (err) {
      console.error("Error fetching user data:", err)
    }
  }


  const fetchLectures = async () => {
    setLoading(true)
    setError("")
    try {
      const result = await getAllLecturesPublic({
        limit: 200,
        page: 1,
      })
      if (result.status === "success") {
        setLectures(result.data.containers)
        setFilteredLectures(result.data.containers)
      } else {
        setError(result.message || "Failed to fetch lectures")
      }
    } catch (err) {
      console.error("Error fetching lectures:", err)
      setError("حدث خطأ أثناء تحميل المحاضرات")
    } finally {
      setLoading(false)
    }
  }

  const getTeacherPoints = (teacherId) => {
    if (!pointsBalances || pointsBalances.length === 0) return 0;
    
    const teacherBalance = pointsBalances.find(
      balance => balance.lecturer && balance.lecturer._id === teacherId
    );
    
    return teacherBalance ? teacherBalance.points : 0;
  }

  const handlePurchaseLecture = async (lectureId, teacherId) => {
    if (!userData) {
      toast.error(t("errors.loginRequired"))
      return
    }

    const teacherPoints = getTeacherPoints(teacherId)
    const lecture = lectures.find((lec) => lec._id === lectureId)

    if (!lecture) {
      toast.error(t("errors.lectureNotFound"))
      return
    }

    if (teacherPoints < lecture.price) {
      toast.error(t("errors.insufficientPoints"))
      return
    }

    try {
      const response = await purchaseContainer(lectureId)

      if (response.data && response.data.status === "success") {
        toast.success(t("purchase.success"))

        // Optimistically add to purchased lectures
  setPurchasedLectures((prev) => Array.from(new Set([...prev.map(String), lectureId.toString()])))

        // Refresh points and merge backend purchases, never reset
        fetchUserData()
      } else {
        const errorMessage =
          typeof response === "string"
            ? response
            : response.data?.message || t("purchase.failed")
        toast.error(errorMessage)
      }
    } catch (err) {
      console.error("Error purchasing lecture:", err)
      toast.error(t("purchase.failed"))
    }
  }

  const generateLectureData = (lecturesData) => {
    console.log("Lecture from backend:", lecturesData)
    return lecturesData.map((lecture) => ({
      
      id: lecture._id,
      thumbnail: convertPathToUrl(lecture.thumbnail, "product_thumbnails"),
      title: lecture.name,
      subject: lecture.subject?.name || "غير محدد",
      teacher: lecture.createdBy?.name || "مدرس غير محدد",
      teacherId: lecture.createdBy?._id,
      teacherRole: lecture.createdBy?.role || "محاضر",
      grade: lecture.level?.name || "غير محدد",
      rating: 4,
      stage: lecture.createdBy?.role || "غير محدد",
      type: "محاضرة",
      status: lecture.price > 0 ? "مدفوع" : "مجاني",
      price: lecture.price || 0,
      childrenCount: lecture.attachments
        ? (lecture.attachments.booklets?.length || 0) +
          (lecture.attachments.exams?.length || 0) +
          (lecture.attachments.homeworks?.length || 0) +
          (lecture.attachments.pdfsandimages?.length || 0)
        : 0,
      views: lecture.numberOfViews || 0,
      description: lecture.description || "لا يوجد وصف",
  isPurchased: purchasedLectures.map(String).includes(lecture._id?.toString()),
      teacherPoints: lecture.createdBy?._id ? getTeacherPoints(lecture.createdBy._id) : 0,
    }))
  }

  const applyFilters = useCallback(() => {
    let filtered = lectures

    if (selectedStage) {
      filtered = filtered.filter((lecture) => lecture.createdBy?.role === selectedStage)
    }

    if (selectedGrade) {
      filtered = filtered.filter((lecture) => lecture.level?.name === selectedGrade)
    }

    if (selectedSubject) {
      filtered = filtered.filter((lecture) => lecture.subject?.name === selectedSubject)
    }

    if (selectedStatus) {
      filtered = filtered.filter((lecture) => {
        const status = lecture.price > 0 ? "مدفوع" : "مجاني"
        return status === selectedStatus
      })
    }

    setFilteredLectures(filtered)
    setCurrentPage(1) // Reset to first page when filters are applied
  }, [selectedStage, selectedGrade, selectedSubject, selectedStatus, lectures])

  const resetFilters = useCallback(() => {
    setSelectedStage("")
    setSelectedGrade("")
    setSelectedSubject("")
    setSelectedStatus("")
    setFilteredLectures(lectures)
    setCurrentPage(1) // Reset to first page when filters are reset
  }, [lectures])

  const memoizedFilteredLectures = useMemo(
    () => generateLectureData(filteredLectures),
    [filteredLectures, purchasedLectures, pointsBalances],
  )

  const totalPages = useMemo(() => {
    return Math.ceil(memoizedFilteredLectures.length / lecturesPerPage)
  }, [memoizedFilteredLectures, lecturesPerPage])

  const currentLectures = useMemo(() => {
    const indexOfLastLecture = currentPage * lecturesPerPage
    const indexOfFirstLecture = indexOfLastLecture - lecturesPerPage
    return memoizedFilteredLectures.slice(indexOfFirstLecture, indexOfLastLecture)
  }, [memoizedFilteredLectures, currentPage, lecturesPerPage])

  const subjectOptions = useMemo(() => {
    const uniqueSubjects = new Set()
    lectures.forEach((lecture) => {
      if (lecture.subject?.name) {
        uniqueSubjects.add(lecture.subject.name)
      }
    })
    return Array.from(uniqueSubjects).map((subject) => ({
      label: subject,
      value: subject,
    }))
  }, [lectures])

  const levelOptions = useMemo(() => {
    const uniqueLevels = new Set()
    lectures.forEach((lecture) => {
      if (lecture.level?.name) {
        uniqueLevels.add(lecture.level.name)
      }
    })
    return Array.from(uniqueLevels).map((level) => ({
      label: t(`levels.${level}`), // use i18n key
      value: level,
    }))
  }, [lectures, t])

  const filterOptions = [
    {
      label: t("filters.stage"),
      value: selectedStage,
      options: [
        { label: "filters.stages.lecturer", value: "Lecturer" },
        { label: "filters.stages.professor", value: "Professor" },
      ],
      onSelect: setSelectedStage,
    },
    {
      label: t("filters.grade"),
      value: selectedGrade,
      options: levelOptions,
      onSelect: setSelectedGrade,
    },
    {
      label: t("filters.subject"),
      value: selectedSubject,
      options: subjectOptions,
      onSelect: setSelectedSubject,
    },
    {
      label: t("filters.status"),
      value: selectedStatus,
      options: [
        { label: "filters.statuses.free", value: "مجاني" },
        { label: "filters.statuses.paid", value: "مدفوع" },
      ],
      onSelect: setSelectedStatus,
    },
  ]

  const FilterDropdown = ({ label, options, selectedValue, onSelect, isRTL }) => (
    <div className="w-full">
      <label
        className={`block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200 ${isRTL ? "text-right" : "text-left"}`}
      >
        {label}
      </label>
      <div className="relative">
        <select
          value={selectedValue}
          onChange={(e) => onSelect(e.target.value)}
          className={`w-full appearance-none px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${isRTL ? "text-right" : "text-left"}`}
          dir={isRTL ? "rtl" : "ltr"}
        >
          <option value="">{t("filters.reset")}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label.startsWith("filters.") ? t(option.label) : option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <svg
            className="w-4 h-4 text-gray-500 dark:text-gray-300"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  )

  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    return (
      <div className="flex justify-center mt-8">
        <button
          className="btn btn-outline btn-sm mx-1"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          {t("pagination.previous")}
        </button>
        <span className="mx-2">
          {t("pagination.page")} {currentPage} {t("pagination.of")} {totalPages}
        </span>
        <button
          className="btn btn-outline btn-sm mx-1"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          {t("pagination.next")}
        </button>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen w-full" dir={isRTL ? "rtl" : "ltr"}>
      <div className={`absolute top-0 ${isRTL ? "left-0" : "right-0"} w-2/3 h-screen pointer-events-none z-0`}>
        <div className="relative w-full h-full">
          <img
            src="/background-courses.png"
            alt="background"
            className="absolute top-0 left-0 w-full h-full object-top opacity-50"
            style={{ maxWidth: "600px" }}
          />
        </div>
      </div>

      <div className="relative z-10">
        <div className={`container mx-auto px-4 pt-8 pb-4 ${isRTL ? "text-right" : "text-left"}`}>
          <div className="relative inline-block">
            <p className="text-3xl font-bold text-primary md:mx-40">{t("title")}</p>
            <img src="/underline.png" alt="underline" className="object-contain" />
          </div>

          {userData && (
            <div className="bg-base-200 p-4 rounded-lg shadow-sm mt-4 mb-6">
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="font-medium">
                      {t("welcome")}, {userData.name}
                    </p>
                    <p className="text-sm opacity-80">{t(`role.${userData.role.toLowerCase()}`,{ns:"common"})}</p>
                  </div>
                </div>
                
                {/* Teacher-specific points balances */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
                  {pointsBalances && pointsBalances.length > 0 ? (
                    pointsBalances.map((balance, index) => (
                      <div key={index} className="bg-base-100 rounded-lg p-2 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                            {balance.lecturer ? (
                              <span className="text-primary font-medium">{balance.lecturer.name.charAt(0)}</span>
                            ) : (
                              <Wallet className="w-4 h-4 text-primary" />
                            )}
                          </div>
                          <span className="text-sm font-medium truncate max-w-[100px]">
                            {balance.lecturer ? balance.lecturer.name : t("generalPoints")}
                          </span>
                        </div>
                        <span className="bg-primary text-white px-2 py-1 rounded text-sm font-bold">
                          {balance.points} {t("points")}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-2">
                      <p className="text-sm opacity-70">{t("noPointsBalances")}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-start">
            <button className="btn btn-outline btn-sm rounded-md mx-2" onClick={resetFilters}>
              {t("filters.reset")}
            </button>
            <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
              <button className="btn btn-primary btn-sm rounded-md">{t("search.options")}</button>
              <Search className="h-6 w-6" />
            </div>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl ${isRTL ? "ml-auto" : "mr-auto"}`}>
            {filterOptions.map((filter) => (
              <FilterDropdown
                key={filter.label}
                label={filter.label}
                options={filter.options}
                selectedValue={filter.value}
                onSelect={filter.onSelect}
                isRTL={isRTL}
              />
            ))}
          </div>

          <div className="flex justify-center mt-6">
            <button
              className={`btn btn-accent btn-md rounded-full px-8 ${isRTL ? "flex-row-reverse" : ""}`}
              onClick={applyFilters}
            >
              <Search className="h-5 w-5 ml-2" />
              {t("showLectures")}
            </button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <h2 className={`text-2xl font-bold text-center mb-8 ${isRTL ? "text-right" : "text-left"}`}>
            {t("discover")}
          </h2>

          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <ErrorAlert error={error} onRetry={fetchLectures} />
          ) : currentLectures.length === 0 ? (
            <div className={`text-center py-12 ${isRTL ? "text-right" : "text-left"}`}>
              <p className="text-lg">{t("noLectures")}</p>
              {(selectedStage || selectedGrade || selectedSubject || selectedStatus) && (
                <button className="btn btn-outline btn-sm mt-4" onClick={resetFilters}>
                  {t("filters.reset")}
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {currentLectures.map((lecture) => (
                    <motion.div
                      key={lecture.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                    >
                      <LectureCard
                        {...lecture}
                        isRTL={isRTL}
                        isPurchased={lecture.isPurchased}
                        onPurchase={() => handlePurchaseLecture(lecture.id, lecture.teacherId)}
                        userPoints={lecture.teacherPoints}
                        showTeacherPoints={true}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              {totalPages > 1 && (
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
