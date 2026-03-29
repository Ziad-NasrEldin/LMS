import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  Clock3,
  DollarSign,
  Download,
  Eye,
  FileText,
  Link2,
  ListOrdered,
  PieChart,
  Ticket,
  UserCog,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { getMyContainers, getLecturerAnalytics } from "../../routes/lectures";
import { AssistantService } from "../../routes/assistants-services";
import DashboardStatCard from "../../components/DashboardStatCard";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const safeDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatNumber = (value, locale) =>
  new Intl.NumberFormat(locale || "en").format(Number(value || 0));

const formatCsvCell = (value) => {
  const stringValue = String(value ?? "");
  const escaped = stringValue.replace(/"/g, '""');
  return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
};

export default function LecturerOverviewPanel() {
  const { t, i18n } = useTranslation("lecturerDashboard");
  const isRTL = i18n.language === "ar";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [containers, setContainers] = useState([]);
  const [assistantsCount, setAssistantsCount] = useState(0);
  const [analytics, setAnalytics] = useState(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ dateFrom: "", dateTo: "" });

  useEffect(() => {
    const fetchOverview = async () => {
      setLoading(true);
      setError("");

      try {
        const [containersRes, myDataRes, analyticsRes] = await Promise.all([
          getMyContainers(),
          AssistantService.getMyData(),
          getLecturerAnalytics({
            ...(appliedFilters.dateFrom ? { dateFrom: appliedFilters.dateFrom } : {}),
            ...(appliedFilters.dateTo ? { dateTo: appliedFilters.dateTo } : {}),
          }),
        ]);

        if (containersRes.status === "success") {
          setContainers(containersRes.data?.containers || []);
        } else {
          throw new Error(containersRes.message || "Failed to fetch containers");
        }

        if (myDataRes.success && myDataRes.data?.id) {
          const assistantsRes = await AssistantService.getAssistantsByLecturer(myDataRes.data.id);
          setAssistantsCount(assistantsRes.success ? (assistantsRes.data || []).length : 0);
        } else {
          setAssistantsCount(0);
        }

        if (analyticsRes.success) {
          setAnalytics(analyticsRes.data || null);
        } else {
          throw new Error(analyticsRes.message || "Failed to fetch analytics");
        }
      } catch (err) {
        setError(err.message || (isRTL ? "تعذر تحميل بيانات الملخص" : "Failed to load overview data"));
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, [appliedFilters.dateFrom, appliedFilters.dateTo, isRTL]);

  const metrics = useMemo(() => {
    const summary = analytics?.summary || {};
    const topLevelContainers = containers.filter((item) => !item.parent);

    return {
      totalCourses: summary.totalCourses ?? topLevelContainers.length,
      totalLectures: summary.totalLectures ?? 0,
      totalRevenue: summary.totalRevenue ?? 0,
      totalPurchases: summary.totalPurchases ?? 0,
      totalStudentsBought: summary.totalStudentsBought ?? 0,
      totalStudentsEntered: summary.totalStudentsEntered ?? 0,
      totalLinkedAccessRecords: summary.totalLinkedAccessRecords ?? 0,
      totalViewsConsumed: summary.totalViewsConsumed ?? 0,
      totalPromoCodesSold: summary.totalPromoCodesSold ?? 0,
      promoCodesSoldValue: summary.promoCodesSoldValue ?? 0,
      totalPromoCodesApplied: summary.totalPromoCodesApplied ?? 0,
      promoCodesAppliedValue: summary.promoCodesAppliedValue ?? 0,
      assistantsCount,
    };
  }, [analytics, assistantsCount, containers]);

  const recentItems = useMemo(() => {
    return [...containers]
      .sort((a, b) => {
        const aDate = safeDate(a.updatedAt) || safeDate(a.createdAt) || new Date(0);
        const bDate = safeDate(b.updatedAt) || safeDate(b.createdAt) || new Date(0);
        return bDate.getTime() - aDate.getTime();
      })
      .slice(0, 5);
  }, [containers]);

  const chartRows = useMemo(() => {
    const rows = analytics?.purchasesByContent || [];
    return rows.slice(0, 6);
  }, [analytics]);

  const revenueChartData = useMemo(() => {
    return {
      labels: chartRows.map((item) =>
        item.contentName.length > 24 ? `${item.contentName.slice(0, 24)}...` : item.contentName
      ),
      datasets: [
        {
          label: t("revenue", { defaultValue: isRTL ? "الإيراد" : "Revenue" }),
          data: chartRows.map((item) => Number(item.revenue || 0)),
          backgroundColor: "rgba(14, 116, 144, 0.75)",
          borderColor: "rgba(14, 116, 144, 1)",
          borderWidth: 1,
          borderRadius: 8,
        },
      ],
    };
  }, [chartRows, i18n.language, isRTL, t]);

  const purchasesChartData = useMemo(() => {
    const colors = [
      "rgba(14, 116, 144, 0.85)",
      "rgba(217, 119, 6, 0.85)",
      "rgba(34, 197, 94, 0.85)",
      "rgba(124, 58, 237, 0.85)",
      "rgba(239, 68, 68, 0.85)",
      "rgba(59, 130, 246, 0.85)",
    ];
    return {
      labels: chartRows.map((item) => item.contentName),
      datasets: [
        {
          label: t("purchases", { defaultValue: isRTL ? "المشتريات" : "Purchases" }),
          data: chartRows.map((item) => Number(item.purchaseCount || 0)),
          backgroundColor: chartRows.map((_, index) => colors[index % colors.length]),
          borderWidth: 0,
        },
      ],
    };
  }, [chartRows, i18n.language, isRTL, t]);

  const revenueChartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          ticks: { color: "rgba(71,85,105,0.9)" },
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          ticks: { color: "rgba(71,85,105,0.9)" },
          grid: { color: "rgba(148,163,184,0.2)" },
        },
      },
    };
  }, []);

  const purchasesChartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "rgba(71,85,105,0.9)",
            boxWidth: 12,
          },
        },
      },
    };
  }, []);

  const handleApplyFilters = (event) => {
    event.preventDefault();
    setAppliedFilters({ dateFrom, dateTo });
  };

  const handleResetFilters = () => {
    setDateFrom("");
    setDateTo("");
    setAppliedFilters({ dateFrom: "", dateTo: "" });
  };

  const handleExportCsv = () => {
    try {
      const rows = [];
      const pushRow = (values) => rows.push(values.map(formatCsvCell).join(","));

      pushRow(["Section", "Field", "Value"]);
      pushRow(["Filters", "From date", appliedFilters.dateFrom || "-"]);
      pushRow(["Filters", "To date", appliedFilters.dateTo || "-"]);
      pushRow(["Summary", "Total courses", metrics.totalCourses]);
      pushRow(["Summary", "Total lectures", metrics.totalLectures]);
      pushRow(["Summary", "Total revenue", metrics.totalRevenue]);
      pushRow(["Summary", "Total purchases", metrics.totalPurchases]);
      pushRow(["Summary", "Students bought", metrics.totalStudentsBought]);
      pushRow(["Summary", "Linked students", metrics.totalStudentsEntered]);
      pushRow(["Summary", "Linked access records", metrics.totalLinkedAccessRecords]);
      pushRow(["Summary", "Total views consumed", metrics.totalViewsConsumed]);
      pushRow(["Summary", "Promo codes sold", metrics.totalPromoCodesSold]);
      pushRow(["Summary", "Promo codes sold value", metrics.promoCodesSoldValue]);
      pushRow(["Summary", "Promo codes applied", metrics.totalPromoCodesApplied]);
      pushRow(["Summary", "Promo codes applied value", metrics.promoCodesAppliedValue]);
      pushRow([]);

      pushRow(["PurchasesByContent", "Content", "Type", "Purchases", "Revenue", "Unique students", "Promo purchases"]);
      (analytics?.purchasesByContent || []).forEach((item) => {
        pushRow([
          "PurchasesByContent",
          item.contentName,
          item.contentType,
          item.purchaseCount,
          item.revenue,
          item.uniqueStudents,
          item.promoPurchases,
        ]);
      });
      pushRow([]);

      pushRow(["PromoCodes", "Code", "Points amount", "Redeemed", "Created at", "Redeemed at"]);
      (analytics?.promoCodes || []).forEach((code) => {
        pushRow([
          "PromoCodes",
          code.code,
          code.pointsAmount,
          code.isRedeemed ? "Yes" : "No",
          code.createdAt ? new Date(code.createdAt).toISOString() : "",
          code.redeemedAt ? new Date(code.redeemedAt).toISOString() : "",
        ]);
      });
      pushRow([]);

      pushRow(["LinkedStudents", "Student name", "Lecture name", "Remaining views", "Last accessed"]);
      (analytics?.accessRecords || []).forEach((record) => {
        pushRow([
          "LinkedStudents",
          record.studentName || "",
          record.lectureName || "",
          record.remainingViews ?? "",
          record.lastAccessed ? new Date(record.lastAccessed).toISOString() : "",
        ]);
      });

      const csvContent = rows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `lecturer-analytics-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (csvError) {
      setError(
        t("csvDownloadFailed", {
          defaultValue: isRTL ? "تعذر تنزيل ملف CSV." : "Failed to download CSV file.",
        })
      );
    }
  };

  if (loading) {
    return (
      <section className="rounded-[1.5rem] bg-base-100 border border-base-300 p-6 mb-10">
        <div className="flex items-center justify-center h-36">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[1.5rem] bg-base-100 border border-base-300 p-5 md:p-6 mb-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-primary">
            {t("dashboardOverview", { defaultValue: isRTL ? "ملخص لوحة التحكم" : "Dashboard Overview" })}
          </h2>
          <p className="text-sm opacity-70 mt-1">
            {t("dashboardOverviewHint", {
              defaultValue: isRTL
                ? "ملخص سريع للمقررات والمحاضرات والمساعدين والإيرادات"
                : "A quick summary of your courses, lectures, assistants, and revenue.",
            })}
          </p>
        </div>

        <Link to="/dashboard/lecturer-dashboard/CoursesForm" className="btn btn-primary rounded-xl w-full md:w-auto">
          {t("addNewCourse")}
        </Link>
      </div>

      <form onSubmit={handleApplyFilters} className="mb-6 rounded-2xl border border-base-300 bg-base-200/50 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-lg font-bold">{t("analyticsFilters", { defaultValue: isRTL ? "مرشحات التحليلات" : "Analytics Filters" })}</h3>
            <p className="text-sm opacity-70">
              {t("analyticsFiltersHint", {
                defaultValue: isRTL
                  ? "اختَر تاريخ البداية والنهاية لتحديث الأرقام."
                  : "Choose a start and end date to refresh the analytics numbers.",
              })}
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-3xl">
            <label className="form-control">
              <span className="label-text text-xs font-semibold opacity-70">{t("dateFrom", { defaultValue: isRTL ? "من تاريخ" : "From date" })}</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="input input-bordered input-sm w-full"
              />
            </label>
            <label className="form-control">
              <span className="label-text text-xs font-semibold opacity-70">{t("dateTo", { defaultValue: isRTL ? "إلى تاريخ" : "To date" })}</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="input input-bordered input-sm w-full"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn btn-primary rounded-xl">
              {t("applyFilters", { defaultValue: isRTL ? "تطبيق" : "Apply" })}
            </button>
            <button type="button" onClick={handleResetFilters} className="btn btn-ghost rounded-xl">
              {t("resetFilters", { defaultValue: isRTL ? "إعادة ضبط" : "Reset" })}
            </button>
            <button type="button" onClick={handleExportCsv} className="btn btn-outline rounded-xl">
              <Download className="w-4 h-4" />
              {t("exportCsv", { defaultValue: isRTL ? "تصدير CSV" : "Export CSV" })}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="alert alert-warning mb-6 rounded-xl">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-4">
        <DashboardStatCard
          icon={<BookOpen className="w-5 h-5" />}
          title={t("myCourses", { defaultValue: isRTL ? "المقررات" : "Courses" })}
          value={metrics.totalCourses}
          className="bg-base-200 border-base-300"
        />
        <DashboardStatCard
          icon={<FileText className="w-5 h-5" />}
          title={t("lectures", { defaultValue: isRTL ? "المحاضرات" : "Lectures" })}
          value={metrics.totalLectures}
          className="bg-base-200 border-base-300"
        />
        <DashboardStatCard
          icon={<DollarSign className="w-5 h-5" />}
          title={t("totalRevenue", { defaultValue: isRTL ? "إجمالي الإيراد" : "Total Revenue" })}
          value={`${formatNumber(metrics.totalRevenue, i18n.language)} ${t("currency", { defaultValue: isRTL ? "جنيه" : "EGP" })}`}
          className="bg-base-200 border-base-300"
        />
        <DashboardStatCard
          icon={<ListOrdered className="w-5 h-5" />}
          title={t("totalPurchases", { defaultValue: isRTL ? "إجمالي المشتريات" : "Total Purchases" })}
          value={metrics.totalPurchases}
          className="bg-base-200 border-base-300"
        />
        <DashboardStatCard
          icon={<Users className="w-5 h-5" />}
          title={t("studentsBought", { defaultValue: isRTL ? "الطلاب المشترون" : "Students Bought" })}
          value={metrics.totalStudentsBought}
          className="bg-base-200 border-base-300"
        />
        <DashboardStatCard
          icon={<Eye className="w-5 h-5" />}
          title={t("studentViews", { defaultValue: isRTL ? "إجمالي المشاهدات" : "Total Views" })}
          value={metrics.totalViewsConsumed}
          className="bg-base-200 border-base-300"
        />
        <DashboardStatCard
          icon={<Link2 className="w-5 h-5" />}
          title={t("studentsEntered", { defaultValue: isRTL ? "الطلاب المرتبطون" : "Linked Students" })}
          value={metrics.totalStudentsEntered}
          className="bg-base-200 border-base-300"
        />
        <DashboardStatCard
          icon={<Ticket className="w-5 h-5" />}
          title={t("promoCodesApplied", { defaultValue: isRTL ? "الأكواد المطبقة" : "Promo Codes Applied" })}
          value={metrics.totalPromoCodesApplied}
          className="bg-base-200 border-base-300"
        />
        <DashboardStatCard
          icon={<Ticket className="w-5 h-5" />}
          title={t("promoCodesSold", { defaultValue: isRTL ? "الأكواد المباعة" : "Promo Codes Sold" })}
          value={metrics.totalPromoCodesSold}
          className="bg-base-200 border-base-300"
        />
        <DashboardStatCard
          icon={<UserCog className="w-5 h-5" />}
          title={t("assistants", { defaultValue: isRTL ? "المساعدون" : "Assistants" })}
          value={metrics.assistantsCount}
          className="bg-base-200 border-base-300"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-8">
        <div className="rounded-2xl border border-base-300 bg-base-200/60 p-4">
          <p className="text-sm opacity-70">{t("promoCodesValue", { defaultValue: isRTL ? "قيمة الأكواد" : "Promo Code Value" })}</p>
          <p className="mt-2 text-2xl font-black">
            {formatNumber(metrics.promoCodesSoldValue, i18n.language)} {t("currency", { defaultValue: isRTL ? "جنيه" : "EGP" })}
          </p>
        </div>
        <div className="rounded-2xl border border-base-300 bg-base-200/60 p-4">
          <p className="text-sm opacity-70">{t("linkedAccessRecords", { defaultValue: isRTL ? "سجلات الربط" : "Linked Access Records" })}</p>
          <p className="mt-2 text-2xl font-black">{formatNumber(metrics.totalLinkedAccessRecords, i18n.language)}</p>
        </div>
        <div className="rounded-2xl border border-base-300 bg-base-200/60 p-4">
          <p className="text-sm opacity-70">{t("promoCodesAppliedValue", { defaultValue: isRTL ? "قيمة الأكواد المطبقة" : "Applied Promo Value" })}</p>
          <p className="mt-2 text-2xl font-black">
            {formatNumber(metrics.promoCodesAppliedValue, i18n.language)} {t("currency", { defaultValue: isRTL ? "جنيه" : "EGP" })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 mb-8">
        <div className="rounded-2xl border border-base-300 bg-base-200/50 p-4">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h3 className="font-semibold">
              {t("revenueByContent", {
                defaultValue: isRTL ? "الإيراد حسب المحتوى" : "Revenue by Content",
              })}
            </h3>
          </div>
          {chartRows.length ? (
            <div className="h-72">
              <Bar data={revenueChartData} options={revenueChartOptions} />
            </div>
          ) : (
            <p className="text-sm opacity-70">
              {t("noChartData", {
                defaultValue: isRTL ? "لا توجد بيانات كافية لعرض الرسم." : "Not enough data to render the chart yet.",
              })}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-base-300 bg-base-200/50 p-4">
          <div className="mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-primary" />
            <h3 className="font-semibold">
              {t("purchasesDistribution", {
                defaultValue: isRTL ? "توزيع المشتريات" : "Purchases Distribution",
              })}
            </h3>
          </div>
          {chartRows.length ? (
            <div className="h-72">
              <Doughnut data={purchasesChartData} options={purchasesChartOptions} />
            </div>
          ) : (
            <p className="text-sm opacity-70">
              {t("noChartData", {
                defaultValue: isRTL ? "لا توجد بيانات كافية لعرض الرسم." : "Not enough data to render the chart yet.",
              })}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-base-300 overflow-hidden mb-8">
        <div className="px-4 py-3 bg-base-200 flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">
            {t("purchaseBreakdown", { defaultValue: isRTL ? "تفصيل المشتريات حسب المحتوى" : "Purchase Breakdown by Content" })}
          </h3>
        </div>

        {analytics?.purchasesByContent?.length ? (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("content", { defaultValue: isRTL ? "المحتوى" : "Content" })}</th>
                  <th>{t("type", { defaultValue: isRTL ? "النوع" : "Type" })}</th>
                  <th>{t("purchases", { defaultValue: isRTL ? "المشتريات" : "Purchases" })}</th>
                  <th>{t("revenue", { defaultValue: isRTL ? "الإيراد" : "Revenue" })}</th>
                  <th>{t("uniqueStudents", { defaultValue: isRTL ? "طلاب فريدون" : "Unique Students" })}</th>
                  <th>{t("promoPurchases", { defaultValue: isRTL ? "مشتريات برمز" : "Promo Purchases" })}</th>
                </tr>
              </thead>
              <tbody>
                {analytics.purchasesByContent.map((item) => (
                  <tr key={`${item.contentType}-${item.contentId}`}>
                    <td className="font-semibold">{item.contentName}</td>
                    <td>{item.contentType === "lecture" ? t("lecture", { defaultValue: isRTL ? "محاضرة" : "Lecture" }) : t("containerTypes.course", { defaultValue: isRTL ? "كورس" : "Course" })}</td>
                    <td>{item.purchaseCount}</td>
                    <td>{formatNumber(item.revenue, i18n.language)}</td>
                    <td>{item.uniqueStudents}</td>
                    <td>{item.promoPurchases}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 text-sm opacity-70">
            {t("noPurchases", { defaultValue: isRTL ? "لا توجد مشتريات بعد." : "No purchases yet." })}
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-base-300 overflow-hidden">
          <div className="px-4 py-3 bg-base-200 flex items-center gap-2">
            <Clock3 className="w-4 h-4 text-primary" />
            <h3 className="font-semibold">{t("recentActivity", { defaultValue: isRTL ? "آخر النشاطات" : "Recent Activity" })}</h3>
          </div>

          {recentItems.length === 0 ? (
            <div className="p-4 text-sm opacity-70">
              {t("noCourses", { defaultValue: isRTL ? "لا توجد عناصر بعد" : "No items yet" })}
            </div>
          ) : (
            <ul className="divide-y divide-base-300">
              {recentItems.map((item) => (
                <li key={item._id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm opacity-70">{item.subject?.name || t("noSubject")}</p>
                  </div>
                  <div className="text-sm opacity-70">
                    {(safeDate(item.updatedAt) || safeDate(item.createdAt) || new Date()).toLocaleDateString(i18n.language)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-base-300 overflow-hidden">
          <div className="px-4 py-3 bg-base-200 flex items-center gap-2">
            <Ticket className="w-4 h-4 text-primary" />
            <h3 className="font-semibold">{t("promoCodes", { defaultValue: isRTL ? "أكواد الشحن" : "Promo Codes" })}</h3>
          </div>

          {analytics?.promoCodes?.length ? (
            <ul className="divide-y divide-base-300">
              {analytics.promoCodes.map((code) => (
                <li key={code.id} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold tracking-widest">{code.code}</p>
                    <p className="text-sm opacity-70">
                      {formatNumber(code.pointsAmount, i18n.language)} {t("currency", { defaultValue: isRTL ? "جنيه" : "EGP" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {code.isRedeemed
                        ? t("redeemed", { defaultValue: isRTL ? "مستخدم" : "Redeemed" })
                        : t("available", { defaultValue: isRTL ? "متاح" : "Available" })}
                    </p>
                    <p className="text-xs opacity-70">
                      {code.redeemedAt
                        ? new Date(code.redeemedAt).toLocaleDateString(i18n.language)
                        : new Date(code.createdAt || Date.now()).toLocaleDateString(i18n.language)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-sm opacity-70">
              {t("noPromoCodes", { defaultValue: isRTL ? "لا توجد أكواد شحن بعد." : "No promo codes yet." })}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-base-300 overflow-hidden mt-8">
        <div className="px-4 py-3 bg-base-200 flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">{t("linkedStudents", { defaultValue: isRTL ? "الطلاب المرتبطون" : "Linked Students" })}</h3>
        </div>

        {analytics?.accessRecords?.length ? (
          <ul className="divide-y divide-base-300">
            {analytics.accessRecords.slice(0, 10).map((record, index) => (
              <li key={`${record.studentId || "student"}-${record.lectureId || "lecture"}-${index}`} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <p className="font-semibold">{record.studentName || t("unknown", { defaultValue: isRTL ? "غير معروف" : "Unknown" })}</p>
                  <p className="text-sm opacity-70">{record.lectureName || t("noSubject")}</p>
                </div>
                <div className="text-sm opacity-70">
                  {t("remainingViews", { defaultValue: isRTL ? "المشاهدات المتبقية" : "Remaining Views" })}: {record.remainingViews ?? 0}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-4 text-sm opacity-70">
            {t("noLinkedStudents", { defaultValue: isRTL ? "لا توجد بيانات ربط بعد." : "No linked students yet." })}
          </div>
        )}
      </div>
    </section>
  );
}
