import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  Clock3,
  DollarSign,
  Download,
  FileText,
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
  const [forceDemoData, setForceDemoData] = useState(false);
  const [promoCodesPage, setPromoCodesPage] = useState(1);
  const [linkedStudentsPage, setLinkedStudentsPage] = useState(1);

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

        const containersMessage = String(containersRes?.message || "");
        const noContainersMessage =
          containersMessage.toLowerCase().includes("no containers found for this lecturer");

        if (containersRes.status === "success") {
          setContainers(containersRes.data?.containers || []);
        } else if (noContainersMessage) {
          setContainers([]);
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

  const placeholderChartRows = useMemo(
    () => [
      {
        contentId: "sample-course-1",
        contentType: "course",
        contentName: isRTL ? "كورس جبر" : "Algebra Course",
        purchaseCount: 18,
        revenue: 5400,
        uniqueStudents: 14,
        promoPurchases: 3,
      },
      {
        contentId: "sample-course-2",
        contentType: "course",
        contentName: isRTL ? "كورس فيزياء" : "Physics Course",
        purchaseCount: 12,
        revenue: 3600,
        uniqueStudents: 10,
        promoPurchases: 2,
      },
      {
        contentId: "sample-lecture-1",
        contentType: "lecture",
        contentName: isRTL ? "محاضرة مراجعة" : "Revision Lecture",
        purchaseCount: 8,
        revenue: 1600,
        uniqueStudents: 7,
        promoPurchases: 1,
      },
      {
        contentId: "sample-lecture-2",
        contentType: "lecture",
        contentName: isRTL ? "محاضرة مسائل" : "Practice Lecture",
        purchaseCount: 6,
        revenue: 1200,
        uniqueStudents: 5,
        promoPurchases: 1,
      },
    ],
    [isRTL]
  );

  const usesPlaceholderCharts = forceDemoData;
  const effectiveChartRows = usesPlaceholderCharts ? placeholderChartRows : chartRows;

  const placeholderPromoCodes = useMemo(
    () => [
      {
        id: "sample-promo-1",
        code: "WELCOME25",
        pointsAmount: 250,
        isRedeemed: true,
        redeemedAt: new Date().toISOString(),
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "sample-promo-2",
        code: "SPRING10",
        pointsAmount: 100,
        isRedeemed: false,
        redeemedAt: null,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    []
  );

  const usesPlaceholderPromoCodes = forceDemoData;
  const effectivePromoCodes = usesPlaceholderPromoCodes ? placeholderPromoCodes : analytics?.promoCodes || [];

  const placeholderAccessRecords = useMemo(
    () => [
      {
        studentId: "sample-student-1",
        studentName: isRTL ? "محمد أحمد" : "Mohamed Ahmed",
        lectureId: "sample-lecture-1",
        lectureName: isRTL ? "محاضرة مراجعة" : "Revision Lecture",
        remainingViews: 2,
      },
      {
        studentId: "sample-student-2",
        studentName: isRTL ? "سارة علي" : "Sara Ali",
        lectureId: "sample-lecture-2",
        lectureName: isRTL ? "محاضرة مسائل" : "Practice Lecture",
        remainingViews: 1,
      },
    ],
    [isRTL]
  );

  const usesPlaceholderAccessRecords = forceDemoData;
  const effectiveAccessRecords = usesPlaceholderAccessRecords ? placeholderAccessRecords : analytics?.accessRecords || [];

  const PROMO_CODES_PAGE_SIZE = 10;
  const LINKED_STUDENTS_PAGE_SIZE = 10;

  const promoCodesTotalPages = Math.max(1, Math.ceil(effectivePromoCodes.length / PROMO_CODES_PAGE_SIZE));
  const linkedStudentsTotalPages = Math.max(1, Math.ceil(effectiveAccessRecords.length / LINKED_STUDENTS_PAGE_SIZE));

  useEffect(() => {
    setPromoCodesPage(1);
  }, [forceDemoData, effectivePromoCodes.length]);

  useEffect(() => {
    setLinkedStudentsPage(1);
  }, [forceDemoData, effectiveAccessRecords.length]);

  useEffect(() => {
    if (promoCodesPage > promoCodesTotalPages) {
      setPromoCodesPage(promoCodesTotalPages);
    }
  }, [promoCodesPage, promoCodesTotalPages]);

  useEffect(() => {
    if (linkedStudentsPage > linkedStudentsTotalPages) {
      setLinkedStudentsPage(linkedStudentsTotalPages);
    }
  }, [linkedStudentsPage, linkedStudentsTotalPages]);

  const paginatedPromoCodes = useMemo(() => {
    const start = (promoCodesPage - 1) * PROMO_CODES_PAGE_SIZE;
    return effectivePromoCodes.slice(start, start + PROMO_CODES_PAGE_SIZE);
  }, [effectivePromoCodes, promoCodesPage]);

  const paginatedLinkedStudents = useMemo(() => {
    const start = (linkedStudentsPage - 1) * LINKED_STUDENTS_PAGE_SIZE;
    return effectiveAccessRecords.slice(start, start + LINKED_STUDENTS_PAGE_SIZE);
  }, [effectiveAccessRecords, linkedStudentsPage]);

  const revenueChartData = useMemo(() => {
    return {
      labels: effectiveChartRows.map((item) =>
        item.contentName.length > 24 ? `${item.contentName.slice(0, 24)}...` : item.contentName
      ),
      datasets: [
        {
          label: t("revenue", { defaultValue: isRTL ? "الإيراد" : "Revenue" }),
          data: effectiveChartRows.map((item) => Number(item.revenue || 0)),
          backgroundColor: "rgba(14, 116, 144, 0.75)",
          borderColor: "rgba(14, 116, 144, 1)",
          borderWidth: 1,
          borderRadius: 8,
        },
      ],
    };
  }, [effectiveChartRows, i18n.language, isRTL, t]);

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
      labels: effectiveChartRows.map((item) => item.contentName),
      datasets: [
        {
          label: t("purchases", { defaultValue: isRTL ? "المشتريات" : "Purchases" }),
          data: effectiveChartRows.map((item) => Number(item.purchaseCount || 0)),
          backgroundColor: effectiveChartRows.map((_, index) => colors[index % colors.length]),
          borderWidth: 0,
        },
      ],
    };
  }, [effectiveChartRows, i18n.language, isRTL, t]);

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

      <div className="mb-6 rounded-2xl border border-base-300 bg-base-200/50 p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="toggle toggle-warning toggle-sm"
            checked={forceDemoData}
            onChange={(event) => setForceDemoData(event.target.checked)}
          />
          <span className="text-sm font-semibold">
            {t("showDemoData", {
              defaultValue: isRTL ? "عرض بيانات تجريبية" : "Show demo data",
            })}
          </span>
        </label>
        <p className="text-xs opacity-70">
          {forceDemoData
            ? t("demoDataEnabled", {
                defaultValue: isRTL ? "الوضع التجريبي مفعل الآن." : "Demo mode is currently enabled.",
              })
            : t("demoDataDisabled", {
                defaultValue: isRTL ? "سيتم عرض البيانات الحقيقية عند توفرها." : "Real analytics will be shown when available.",
              })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-4">
        <DashboardStatCard
          icon={<BookOpen className="w-5 h-5" />}
          title={t("myCourses", { defaultValue: isRTL ? "المقررات" : "Courses" })}
          value={metrics.totalCourses}
          subtitle={t("myCoursesDesc", {
            defaultValue: isRTL ? "عدد الكورسات المنشورة حالياً." : "Number of published courses.",
          })}
          className="bg-base-200 border-base-300"
        />
        <DashboardStatCard
          icon={<FileText className="w-5 h-5" />}
          title={t("lectures", { defaultValue: isRTL ? "المحاضرات" : "Lectures" })}
          value={metrics.totalLectures}
          subtitle={t("lecturesDesc", {
            defaultValue: isRTL ? "إجمالي المحاضرات داخل كل الكورسات." : "Total lectures across all courses.",
          })}
          className="bg-base-200 border-base-300"
        />
        <DashboardStatCard
          icon={<DollarSign className="w-5 h-5" />}
          title={t("totalRevenue", { defaultValue: isRTL ? "إجمالي الإيراد" : "Total Revenue" })}
          value={`${formatNumber(metrics.totalRevenue, i18n.language)} ${t("currency", { defaultValue: isRTL ? "جنيه" : "EGP" })}`}
          subtitle={t("totalRevenueDesc", {
            defaultValue: isRTL ? "إيرادك الفعلي من المبيعات." : "Your actual earnings from sales.",
          })}
          className="bg-base-200 border-base-300"
        />
        <DashboardStatCard
          icon={<ListOrdered className="w-5 h-5" />}
          title={t("totalPurchases", { defaultValue: isRTL ? "إجمالي المشتريات" : "Total Purchases" })}
          value={metrics.totalPurchases}
          subtitle={t("totalPurchasesDesc", {
            defaultValue: isRTL ? "عدد عمليات الشراء المنفذة." : "Number of completed purchase orders.",
          })}
          className="bg-base-200 border-base-300"
        />
        <DashboardStatCard
          icon={<Users className="w-5 h-5" />}
          title={t("studentsBought", { defaultValue: isRTL ? "الطلاب المشترون" : "Students Bought" })}
          value={metrics.totalStudentsBought}
          subtitle={t("studentsBoughtDesc", {
            defaultValue: isRTL ? "عدد الطلاب المختلفين الذين اشتروا." : "Unique students who purchased your content.",
          })}
          className="bg-base-200 border-base-300"
        />
        <DashboardStatCard
          icon={<UserCog className="w-5 h-5" />}
          title={t("assistants", { defaultValue: isRTL ? "المساعدون" : "Assistants" })}
          value={metrics.assistantsCount}
          subtitle={t("assistantsDesc", {
            defaultValue: isRTL ? "عدد المساعدين المضافين لحسابك." : "Assistants currently linked to your account.",
          })}
          className="bg-base-200 border-base-300"
        />
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
          <p className="text-sm opacity-70 mb-3">
            {t("revenueByContentDesc", {
              defaultValue: isRTL ? "يوضح أي محتوى يحقق أعلى إيراد." : "Shows which content brings the highest revenue.",
            })}
          </p>
          {usesPlaceholderCharts ? (
            <p className="text-xs font-semibold text-warning mb-3">
              {t("sampleDataNotice", {
                defaultValue: isRTL ? "بيانات تجريبية للعرض فقط حتى تتوفر بيانات حقيقية." : "Sample data for preview only until real analytics are available.",
              })}
            </p>
          ) : null}
          {effectiveChartRows.length ? (
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
          <p className="text-sm opacity-70 mb-3">
            {t("purchasesDistributionDesc", {
              defaultValue: isRTL ? "نسبة المشتريات بين الكورسات والمحاضرات." : "Purchase share across your content.",
            })}
          </p>
          {usesPlaceholderCharts ? (
            <p className="text-xs font-semibold text-warning mb-3">
              {t("sampleDataNotice", {
                defaultValue: isRTL ? "بيانات تجريبية للعرض فقط حتى تتوفر بيانات حقيقية." : "Sample data for preview only until real analytics are available.",
              })}
            </p>
          ) : null}
          {effectiveChartRows.length ? (
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
        <div className="px-4 py-2 text-sm opacity-70 border-t border-base-300 bg-base-100">
          {t("purchaseBreakdownDesc", {
            defaultValue: isRTL ? "تفاصيل كل محتوى: عدد المبيعات والإيراد والطلاب." : "Details per content: sales, revenue, and students.",
          })}
        </div>
        {usesPlaceholderCharts ? (
          <div className="px-4 py-2 text-xs font-semibold text-warning border-t border-base-300 bg-base-100">
            {t("sampleDataNotice", {
              defaultValue: isRTL ? "بيانات تجريبية للعرض فقط حتى تتوفر بيانات حقيقية." : "Sample data for preview only until real analytics are available.",
            })}
          </div>
        ) : null}

        {effectiveChartRows.length ? (
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
                {effectiveChartRows.map((item) => (
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
          <div className="px-4 py-2 text-sm opacity-70 border-t border-base-300 bg-base-100">
            {t("recentActivityDesc", {
              defaultValue: isRTL ? "آخر الكورسات أو المحاضرات التي تم تعديلها." : "Latest courses or lectures that were updated.",
            })}
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
          <div className="px-4 py-3 bg-base-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4 text-primary" />
              <h3 className="font-semibold">{t("promoCodes", { defaultValue: isRTL ? "أكواد الشحن" : "Promo Codes" })}</h3>
            </div>
            <Link to="/dashboard/lecturer-dashboard/promo-codes" className="btn btn-xs btn-outline rounded-lg">
              {t("viewFullList", { defaultValue: isRTL ? "عرض القائمة الكاملة" : "View full list" })}
            </Link>
          </div>
          <div className="px-4 py-2 text-sm opacity-70 border-t border-base-300 bg-base-100">
            {t("promoCodesDesc", {
              defaultValue: isRTL ? "كل الأكواد التي أنشأتها وحالتها الحالية." : "All created promo codes and their current status.",
            })}
          </div>

          {usesPlaceholderPromoCodes ? (
            <div className="px-4 py-2 text-xs font-semibold text-warning border-t border-base-300 bg-base-100">
              {t("sampleDataNotice", {
                defaultValue: isRTL ? "بيانات تجريبية للعرض فقط حتى تتوفر بيانات حقيقية." : "Sample data for preview only until real analytics are available.",
              })}
            </div>
          ) : null}
          {effectivePromoCodes.length ? (
            <ul className="divide-y divide-base-300">
              {paginatedPromoCodes.map((code) => (
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
          {effectivePromoCodes.length > PROMO_CODES_PAGE_SIZE ? (
            <div className="border-t border-base-300 px-4 py-3 flex items-center justify-between gap-3">
              <button
                type="button"
                className="btn btn-xs btn-outline rounded-lg"
                onClick={() => setPromoCodesPage((prev) => Math.max(1, prev - 1))}
                disabled={promoCodesPage === 1}
              >
                {t("previous", { defaultValue: isRTL ? "السابق" : "Previous" })}
              </button>
              <span className="text-xs opacity-70">
                {t("pageOf", {
                  current: promoCodesPage,
                  total: promoCodesTotalPages,
                  defaultValue: isRTL ? "صفحة {{current}} من {{total}}" : "Page {{current}} of {{total}}",
                })}
              </span>
              <button
                type="button"
                className="btn btn-xs btn-outline rounded-lg"
                onClick={() => setPromoCodesPage((prev) => Math.min(promoCodesTotalPages, prev + 1))}
                disabled={promoCodesPage === promoCodesTotalPages}
              >
                {t("next", { defaultValue: isRTL ? "التالي" : "Next" })}
              </button>
            </div>
          ) : null}
        </div>
      </div>

        <div className="rounded-2xl border border-base-300 overflow-hidden mt-8">
        <div className="px-4 py-3 bg-base-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h3 className="font-semibold">{t("linkedStudents", { defaultValue: isRTL ? "الطلاب المرتبطون" : "Linked Students" })}</h3>
          </div>
          <Link to="/dashboard/lecturer-dashboard/linked-students" className="btn btn-xs btn-outline rounded-lg">
            {t("viewFullList", { defaultValue: isRTL ? "عرض القائمة الكاملة" : "View full list" })}
          </Link>
        </div>
        <div className="px-4 py-2 text-sm opacity-70 border-t border-base-300 bg-base-100">
          {t("linkedStudentsDesc", {
            defaultValue: isRTL ? "الطلاب المرتبطون بمحاضراتك وعدد المشاهدات المتبقية." : "Students linked to your lectures and their remaining views.",
          })}
        </div>

        {usesPlaceholderAccessRecords ? (
          <div className="px-4 py-2 text-xs font-semibold text-warning border-t border-base-300 bg-base-100">
            {t("sampleDataNotice", {
              defaultValue: isRTL ? "بيانات تجريبية للعرض فقط حتى تتوفر بيانات حقيقية." : "Sample data for preview only until real analytics are available.",
            })}
          </div>
        ) : null}
        {effectiveAccessRecords.length ? (
          <ul className="divide-y divide-base-300">
            {paginatedLinkedStudents.map((record, index) => (
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
        {effectiveAccessRecords.length > LINKED_STUDENTS_PAGE_SIZE ? (
          <div className="border-t border-base-300 px-4 py-3 flex items-center justify-between gap-3">
            <button
              type="button"
              className="btn btn-xs btn-outline rounded-lg"
              onClick={() => setLinkedStudentsPage((prev) => Math.max(1, prev - 1))}
              disabled={linkedStudentsPage === 1}
            >
              {t("previous", { defaultValue: isRTL ? "السابق" : "Previous" })}
            </button>
            <span className="text-xs opacity-70">
              {t("pageOf", {
                current: linkedStudentsPage,
                total: linkedStudentsTotalPages,
                defaultValue: isRTL ? "صفحة {{current}} من {{total}}" : "Page {{current}} of {{total}}",
              })}
            </span>
            <button
              type="button"
              className="btn btn-xs btn-outline rounded-lg"
              onClick={() => setLinkedStudentsPage((prev) => Math.min(linkedStudentsTotalPages, prev + 1))}
              disabled={linkedStudentsPage === linkedStudentsTotalPages}
            >
              {t("next", { defaultValue: isRTL ? "التالي" : "Next" })}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
