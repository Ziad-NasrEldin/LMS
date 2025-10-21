"use client"

import { useTranslation } from "react-i18next"
import { useEffect, useState } from "react"
import { getAllLecturers } from "../../../../routes/fetch-users"
import { getLecturerMonthlyRevenue } from "../../../../routes/revenue"
import { BookOpen, Trophy } from "lucide-react"

export default function LecturerRevenue() {
  const { t, i18n } = useTranslation("admin")
  const isRTL = i18n.language === "ar"
  const [lecturers, setLecturers] = useState([])
  const [selectedLecturer, setSelectedLecturer] = useState("")
  const [revenueData, setRevenueData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch lecturers on mount
  useEffect(() => {
    const fetchLecturers = async () => {
      setLoading(true)
      try {
        const result = await getAllLecturers()
        if (result.success) {
          setLecturers(result.data)
          if (result.data.length > 0) {
            setSelectedLecturer(result.data[0]._id)
          }
        } else {
          throw new Error(result)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchLecturers()
  }, [])

  // Fetch revenue when selected lecturer changes
  useEffect(() => {
    if (!selectedLecturer) return

    const fetchRevenue = async () => {
      setLoading(true)
      try {
        const result = await getLecturerMonthlyRevenue(selectedLecturer)
        setRevenueData(result)
        setError(null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchRevenue()
  }, [selectedLecturer])

  const handleLecturerChange = (e) => {
    setSelectedLecturer(e.target.value)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="loading loading-spinner loading-lg text-teal-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="mx-auto w-24 h-24 bg-base-200 rounded-full flex items-center justify-center">
          <BookOpen className="h-12 w-12 text-primary" />
        </div>
        <h3 className="text-xl font-bold">{t("revenue.errorLoadingRevenue")}</h3>
        <p className="text-gray-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-extrabold text-primary">{t("revenue.lecturerRevenue")}</h2>
        <select
          className="select select-bordered select-primary w-full sm:w-64 font-bold"
          value={selectedLecturer}
          onChange={handleLecturerChange}
        >
          {lecturers.map((lecturer) => (
            <option key={lecturer._id} value={lecturer._id}>
              {lecturer.name}
            </option>
          ))}
        </select>
      </div>

      {revenueData && (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="card bg-gradient-to-r from-primary to-secondary text-white shadow-2xl p-8 rounded-xl">
            <div className="flex items-center gap-6">
              <Trophy className="h-12 w-12" />
              <div>
                <h3 className="text-2xl font-extrabold">{t("revenue.revenueSummary")}</h3>
                <p className="text-lg font-bold mt-2">
                  {t("revenue.totalRevenue")}: {revenueData.summary.totalRevenue} {t("revenue.currency")}
                </p>
                <p className="text-lg font-bold">
                  {t("revenue.totalPurchases")}: {revenueData.summary.totalPurchases}
                </p>
                <p className="text-lg font-bold">
                  {t("revenue.monthsWithRevenue")}: {revenueData.summary.monthsWithRevenue}
                </p>
              </div>
            </div>
          </div>

          {/* Monthly Revenue Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {revenueData.monthlyRevenue.map((month) => (
              <div
                key={`${month.year}-${month.month}`}
                className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300 border border-primary"
              >
                <div className="card-body p-6">
                  <h3 className="text-xl font-extrabold text-primary">
                    {month.monthName} {month.year}
                  </h3>
                  <div className="space-y-3 mt-4">
                    <p className="text-lg font-bold">
                      {t("revenue.totalRevenue")}:{" "}
                      <span className="text-success">
                        {month.totalRevenue} {t("revenue.currency")}
                      </span>
                    </p>
                    <p className="text-lg font-bold">
                      {t("revenue.purchaseCount")}:{" "}
                      <span className="text-accent">{month.purchaseCount}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {revenueData && revenueData.monthlyRevenue.length === 0 && (
        <div className="text-center py-12">
          <p className="text-lg font-bold text-gray-500">{t("revenue.noRevenueData")}</p>
        </div>
      )}
    </div>
  )
}