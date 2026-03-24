import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BookOpen, FileText, Users, UserCog, AlertCircle, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import { getMyContainers } from "../../routes/lectures";
import { AssistantService } from "../../routes/assistants-services";
import DashboardStatCard from "../../components/DashboardStatCard";

const safeDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export default function LecturerOverviewPanel() {
  const { t, i18n } = useTranslation("lecturerDashboard");
  const isRTL = i18n.language === "ar";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [containers, setContainers] = useState([]);
  const [assistantsCount, setAssistantsCount] = useState(0);

  useEffect(() => {
    const fetchOverview = async () => {
      setLoading(true);
      setError("");

      try {
        const [containersRes, myDataRes] = await Promise.all([
          getMyContainers(),
          AssistantService.getMyData(),
        ]);

        if (containersRes.status === "success") {
          setContainers(containersRes.data?.containers || []);
        } else {
          throw new Error(containersRes.message || "Failed to fetch containers");
        }

        if (myDataRes.success && myDataRes.data?.id) {
          const assistantsRes = await AssistantService.getAssistantsByLecturer(myDataRes.data.id);
          if (assistantsRes.success) {
            setAssistantsCount((assistantsRes.data || []).length);
          } else {
            setAssistantsCount(0);
          }
        } else {
          setAssistantsCount(0);
        }
      } catch (err) {
        setError(err.message || (isRTL ? "تعذر تحميل بيانات الملخص" : "Failed to load overview data"));
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, [isRTL]);

  const metrics = useMemo(() => {
    const topLevelContainers = containers.filter((item) => !item.parent);
    const totalCourses = topLevelContainers.length;
    const totalLectures = topLevelContainers.reduce(
      (sum, item) => sum + (Array.isArray(item.children) ? item.children.length : 0),
      0,
    );
    const totalViews = topLevelContainers.reduce((sum, item) => sum + (item.numberOfViews || 0), 0);

    return {
      totalCourses,
      totalLectures,
      totalViews,
      assistantsCount,
    };
  }, [containers, assistantsCount]);

  const recentItems = useMemo(() => {
    return [...containers]
      .sort((a, b) => {
        const aDate = safeDate(a.updatedAt) || safeDate(a.createdAt) || new Date(0);
        const bDate = safeDate(b.updatedAt) || safeDate(b.createdAt) || new Date(0);
        return bDate.getTime() - aDate.getTime();
      })
      .slice(0, 5);
  }, [containers]);

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
                ? "ملخص سريع للمقررات والمحاضرات والمساعدين"
                : "A quick summary of your courses, lectures, and assistants",
            })}
          </p>
        </div>

        <Link to="/dashboard/lecturer-dashboard/CoursesForm" className="btn btn-primary rounded-xl w-full md:w-auto">
          {t("addNewCourse")}
        </Link>
      </div>

      {error && (
        <div className="alert alert-warning mb-6 rounded-xl">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
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
          icon={<Users className="w-5 h-5" />}
          title={t("studentViews", { defaultValue: isRTL ? "إجمالي المشاهدات" : "Total Views" })}
          value={metrics.totalViews}
          className="bg-base-200 border-base-300"
        />

        <DashboardStatCard
          icon={<UserCog className="w-5 h-5" />}
          title={t("assistants", { defaultValue: isRTL ? "المساعدون" : "Assistants" })}
          value={metrics.assistantsCount}
          className="bg-base-200 border-base-300"
        />
      </div>

      <div className="rounded-xl border border-base-300 overflow-hidden">
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
    </section>
  );
}
