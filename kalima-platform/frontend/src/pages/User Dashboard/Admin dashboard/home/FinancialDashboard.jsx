import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BarChart3, TrendingUp, ShoppingBag, Users, AlertCircle } from "lucide-react";
import { getRevenueBreakdown, getRevenueSummary } from "../../../../routes/revenue";
import LecturerRevenue from "./LecturerRevenue";
import { designTokens } from "../../../../constants/designTokens";
import DashboardStatCard from "../../../../components/DashboardStatCard";
import { translateErrorMessage } from "../../../../utils/errorTranslator";

const FinancialDashboard = () => {
  const { t, i18n } = useTranslation("admin");
  const isRTL = i18n.language === "ar";
  const dir = isRTL ? "rtl" : "ltr";

  const TOKENS = designTokens.colors;
  const SHADOWS = designTokens.shadows;
  const GRADIENTS = designTokens.gradients;

  const [summary, setSummary] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFinancialData = async () => {
      setLoading(true);
      setError("");

      try {
        const [summaryData, breakdownData] = await Promise.all([
          getRevenueSummary(),
          getRevenueBreakdown(),
        ]);

        setSummary(summaryData || {});
        setBreakdown(Array.isArray(breakdownData) ? breakdownData : []);
      } catch (err) {
        setError(
          translateErrorMessage(err.message || (isRTL ? "تعذر تحميل البيانات المالية" : "Failed to load financial data"))
        );
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, [isRTL]);

  const normalizedSummary = useMemo(() => {
    const totalRevenue = summary?.totalRevenue ?? summary?.overallRevenue ?? summary?.revenue ?? 0;
    const totalPurchases = summary?.totalPurchases ?? summary?.purchaseCount ?? summary?.orders ?? 0;
    const totalLecturers = summary?.totalLecturers ?? summary?.lecturerCount ?? summary?.activeLecturers ?? 0;

    return {
      totalRevenue,
      totalPurchases,
      totalLecturers,
    };
  }, [summary]);

  const topBreakdown = useMemo(() => {
    return [...breakdown]
      .sort((a, b) => (Number(b.totalRevenue || b.revenue || 0) - Number(a.totalRevenue || a.revenue || 0)))
      .slice(0, 8);
  }, [breakdown]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-60">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div
      className="relative mx-auto w-full max-w-full p-6 md:p-10 min-h-screen font-[Cairo]"
      dir={dir}
      style={{ background: TOKENS.creamSurface, color: TOKENS.inkText }}
    >
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-50"
        style={{ background: GRADIENTS.pageAtmosphere }}
      />

      <div className="space-y-8 relative z-10">
        <div
          className="rounded-[2rem] border p-6 md:p-8 text-white"
          style={{
            background: GRADIENTS.hero,
            borderColor: "rgba(255,255,255,0.12)",
            boxShadow: SHADOWS.level2,
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-2xl bg-white/10 border border-white/20">
              <BarChart3 className="w-7 h-7" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold">
              {t("revenue.financialDashboardTitle", {
                defaultValue: isRTL ? "اللوحة المالية" : "Financial Dashboard",
              })}
            </h1>
          </div>
          <p className="text-sm md:text-base text-[#DDF6FB]">
            {t("revenue.financialDashboardSubtitle", {
              defaultValue: isRTL
                ? "نظرة شاملة على الإيرادات والمشتريات والأداء الشهري"
                : "A complete view of revenue, purchases, and monthly performance",
            })}
          </p>
        </div>

        {error && (
          <div className="alert alert-error rounded-2xl shadow-sm">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <DashboardStatCard
            icon={<TrendingUp className="w-5 h-5" style={{ color: TOKENS.deepTeal }} />}
            title={t("revenue.totalRevenue", { defaultValue: isRTL ? "إجمالي الإيرادات" : "Total Revenue" })}
            value={`${normalizedSummary.totalRevenue} ${t("revenue.currency", { defaultValue: isRTL ? "جنيه" : "EGP" })}`}
            className="rounded-[1.4rem]"
            style={{ background: TOKENS.neutralCloud, borderColor: "rgba(17,24,39,0.08)", boxShadow: SHADOWS.level1 }}
          />

          <DashboardStatCard
            icon={<ShoppingBag className="w-5 h-5" style={{ color: TOKENS.deepTeal }} />}
            title={t("revenue.totalPurchases", { defaultValue: isRTL ? "إجمالي المشتريات" : "Total Purchases" })}
            value={normalizedSummary.totalPurchases}
            className="rounded-[1.4rem]"
            style={{ background: TOKENS.neutralCloud, borderColor: "rgba(17,24,39,0.08)", boxShadow: SHADOWS.level1 }}
          />

          <DashboardStatCard
            icon={<Users className="w-5 h-5" style={{ color: TOKENS.deepTeal }} />}
            title={t("revenue.activeLecturers", { defaultValue: isRTL ? "عدد المحاضرين" : "Lecturers" })}
            value={normalizedSummary.totalLecturers}
            className="rounded-[1.4rem]"
            style={{ background: TOKENS.neutralCloud, borderColor: "rgba(17,24,39,0.08)", boxShadow: SHADOWS.level1 }}
          />
        </div>

        <div className="rounded-[2rem] border p-6" style={{ background: TOKENS.neutralCloud, borderColor: "rgba(17,24,39,0.08)", boxShadow: SHADOWS.level1 }}>
          <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: TOKENS.deepTeal }}>
            {t("revenue.breakdownByLesson", {
              defaultValue: isRTL ? "تفصيل الإيرادات حسب المحتوى" : "Revenue Breakdown by Content",
            })}
          </h2>

          {topBreakdown.length === 0 ? (
            <p className="font-medium" style={{ color: TOKENS.slateText }}>
              {t("revenue.noBreakdownData", {
                defaultValue: isRTL ? "لا توجد بيانات تفصيلية حالياً" : "No breakdown data available yet",
              })}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>{isRTL ? "#" : "#"}</th>
                    <th>{isRTL ? "العنصر" : "Item"}</th>
                    <th>{isRTL ? "الإيراد" : "Revenue"}</th>
                    <th>{isRTL ? "المشتريات" : "Purchases"}</th>
                  </tr>
                </thead>
                <tbody>
                  {topBreakdown.map((item, index) => (
                    <tr key={`${item.lessonId || item._id || index}-${index}`}>
                      <td>{index + 1}</td>
                      <td>{item.lessonName || item.name || item.containerName || (isRTL ? "غير محدد" : "Unknown")}</td>
                      <td>{item.totalRevenue || item.revenue || 0}</td>
                      <td>{item.purchaseCount || item.totalPurchases || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <LecturerRevenue />
      </div>
    </div>
  );
};

export default FinancialDashboard;
