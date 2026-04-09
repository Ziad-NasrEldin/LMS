"use client"

import { useTranslation } from "react-i18next"
import { useEffect, useState } from "react"
import { getAllLecturers } from "../../../../routes/fetch-users"
import { getLecturerMonthlyRevenue } from "../../../../routes/revenue"
import { BookOpen, Trophy } from "lucide-react"
import { designTokens } from "../../../../constants/designTokens"
import { translateErrorMessage } from "../../../../utils/errorTranslator"
import DSSelect from "../../../../components/DSSelect"

export default function LecturerRevenue() {
  const { t, i18n } = useTranslation("admin")
  const isRTL = i18n.language === "ar"
  const [lecturers, setLecturers] = useState([])
  const [selectedLecturer, setSelectedLecturer] = useState("")
  const [revenueData, setRevenueData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const TOKENS = designTokens.colors;
  const SHADOWS = designTokens.shadows;
  const GRADIENTS = designTokens.gradients;

  // Fetch lecturers on mount
  useEffect(() => {
    const fetchLecturers = async () => {
      setLoading(true)
      try {
        const result = await getAllLecturers()
        if (result.success) {
          setLecturers(result.data || [])
          if (result.data && result.data.length > 0) {
            setSelectedLecturer(result.data[0]._id)
          }
        } else {
          throw new Error(translateErrorMessage(result))
        }
      } catch (err) {
        setError(translateErrorMessage(err.message))
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
        setError(translateErrorMessage(err.message))
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
        <div className="w-10 h-10 border-4 border-slate-200 border-t-teal-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center">
          <BookOpen className="h-12 w-12 text-primary" />
        </div>
        <h3 className="text-xl font-bold">{t("revenue.errorLoadingRevenue")}</h3>
        <p className="text-slate-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 md:space-y-8" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold md:text-3xl" style={{ color: TOKENS.deepTeal }}>{t("revenue.lecturerRevenue")}</h2>
        <DSSelect
          className="w-full sm:w-64 font-bold bg-white"
          style={{ 
            color: TOKENS.inkText,
            borderColor: "rgba(17,24,39,0.1)",
            boxShadow: SHADOWS.level1, 
          }}
          value={selectedLecturer}
          onChange={handleLecturerChange}
        >
          {lecturers.map((lecturer) => (
            <option key={lecturer._id} value={lecturer._id}>
              {lecturer.name}
            </option>
          ))}
        </DSSelect>
      </div>

      {revenueData && (
        <div className="space-y-6">
          {/* Summary Card */}
          <div 
            className="p-8 rounded-[2rem] text-white shadow-lg border relative overflow-hidden"
            style={{ 
              background: GRADIENTS.hero, 
              borderColor: "rgba(255,255,255,0.15)",
              boxShadow: SHADOWS.level2 
            }}
          >
            <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full opacity-60 mix-blend-overlay" style={{ background: "rgba(77,179,194,0.4)" }} />
            <div className="flex items-center gap-6 relative z-10">
              <div className="flex items-center justify-center p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                <Trophy className="h-10 w-10 text-white drop-shadow-sm" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-[#F8FCFF]">{t("revenue.revenueSummary")}</h3>
                <p className="text-lg font-bold mt-2 text-[#DDF6FB]">
                  {t("revenue.totalRevenue")}: <span className="text-white drop-shadow-md">{revenueData.summary?.totalRevenue || 0} {t("revenue.currency")}</span>
                </p>
                <div className="flex flex-wrap gap-4 mt-2">
                  <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-sm font-semibold border border-white/20">
                    {t("revenue.totalPurchases")}: {revenueData.summary?.totalPurchases || 0}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-sm font-semibold border border-white/20">
                    {t("revenue.monthsWithRevenue")}: {revenueData.summary?.monthsWithRevenue || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Revenue Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {revenueData.monthlyRevenue?.map((month) => (
              <div
                key={`${month.year}-${month.month}`}
                className="rounded-[1.4rem] border transition-transform duration-300 hover:-translate-y-1"
                style={{ background: TOKENS.neutralCloud, borderColor: "rgba(17,24,39,0.08)", boxShadow: SHADOWS.level1 }}
              >
                <div className="p-6">
                  <h3 className="text-xl font-extrabold" style={{ color: TOKENS.deepTeal }}>
                    {month.monthName} {month.year}
                  </h3>
                  <div className="space-y-3 mt-4">
                    <p className="text-lg font-bold" style={{ color: TOKENS.slateText }}>
                      {t("revenue.totalRevenue")}:{" "}
                      <span className="font-extrabold" style={{ color: TOKENS.richTeal }}>
                        {month.totalRevenue} {t("revenue.currency")}
                      </span>
                    </p>
                    <p className="text-lg font-bold" style={{ color: TOKENS.slateText }}>
                      {t("revenue.purchaseCount")}:{" "}
                      <span className="font-extrabold" style={{ color: TOKENS.warmMango }}>{month.purchaseCount}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {revenueData && (!revenueData.monthlyRevenue || revenueData.monthlyRevenue.length === 0) && (
        <div className="text-center py-12 rounded-[2rem] border" style={{ background: TOKENS.neutralCloud, borderColor: "rgba(17,24,39,0.08)" }}>
          <p className="text-lg font-bold" style={{ color: TOKENS.slateText }}>{t("revenue.noRevenueData")}</p>
        </div>
      )}
    </div>
  )
}
