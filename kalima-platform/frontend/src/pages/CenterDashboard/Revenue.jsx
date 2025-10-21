import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getRevenueSummary, getRevenueBreakdown } from "../../routes/revenue";

export default function Revenue() {
  const { t, i18n } = useTranslation("centerDashboard");
  const isRTL = i18n.language === "ar";
  const [summary, setSummary] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [sumData, breakdownData] = await Promise.all([
          getRevenueSummary(),
          getRevenueBreakdown()
        ]);
        setSummary(sumData);
        setBreakdown(breakdownData);
      } catch {
        setError(t("revenue.error"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-64" dir={isRTL ? "rtl" : "ltr"}>
      <button className="btn btn-primary loading">{t("revenue.loading")}</button>
    </div>
  );

  if (error) return (
    <div className="alert alert-error shadow-lg" dir={isRTL ? "rtl" : "ltr"}>
      <div><span>{error}</span></div>
    </div>
  );

  return (
    <div className="space-y-8" dir={isRTL ? "rtl" : "ltr"}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { key: "totalRevenue", value: summary.totalRevenue },
          { key: "lessonRevenue", value: summary.totalLessonRevenue },
          { key: "bookletRevenue", value: summary.totalBookletRevenue },
          { key: "attendancesPaid", value: summary.totalAttendancesPaid }
        ].map((item, idx) => (
          <div key={idx} className="card bg-base-100 shadow-sm hover:shadow-md transition-all duration-300 shadow-primary">
            <div className="card-body">
              <h2 className="card-title">{t(`revenue.summary.${item.key}`)}</h2>
              <p className="text-3xl font-semibold">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {breakdown.map((row, idx) => (
          <div key={idx} className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h3 className="card-title">
                {t(`revenue.paymentTypes.${row.paymentType}`)}
                {row.bookletPurchased && t("revenue.withBookletSuffix")}
              </h3>
              <div className="mt-2 space-y-1">
                <p><span className="font-semibold">{t("revenue.labels.count")}:</span> {row.count}</p>
                <p><span className="font-semibold">{t("revenue.labels.lessonRev")}:</span> {row.totalLessonRevenue}</p>
                <p><span className="font-semibold">{t("revenue.labels.bookletRev")}:</span> {row.totalBookletRevenue}</p>
                <p><span className="font-semibold">{t("revenue.labels.totalRev")}:</span> {row.totalRevenue}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}