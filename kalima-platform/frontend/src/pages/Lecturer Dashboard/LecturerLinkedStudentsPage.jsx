import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, ArrowLeft, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { getLecturerAnalytics } from "../../routes/lectures";
import { designTokens } from "../../constants/designTokens";

const placeholderAccessRecordsByLanguage = (isRTL) => [
  {
    studentId: "sample-student-1",
    studentName: isRTL ? "محمد أحمد" : "Mohamed Ahmed",
    lectureId: "sample-lecture-1",
    lectureName: isRTL ? "محاضرة مراجعة" : "Revision Lecture",
    remainingViews: 2,
    lastAccessed: new Date().toISOString(),
  },
  {
    studentId: "sample-student-2",
    studentName: isRTL ? "سارة علي" : "Sara Ali",
    lectureId: "sample-lecture-2",
    lectureName: isRTL ? "محاضرة مسائل" : "Practice Lecture",
    remainingViews: 1,
    lastAccessed: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

export default function LecturerLinkedStudentsPage() {
  const { t, i18n } = useTranslation("lecturerDashboard");
  const isRTL = i18n.language === "ar";
  const TOKENS = designTokens.colors;
  const GRADIENTS = designTokens.gradients;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [forceDemoData, setForceDemoData] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      const res = await getLecturerAnalytics();
      if (res.success) {
        setAnalytics(res.data || null);
      } else {
        setError(res.message || (isRTL ? "تعذر تحميل بيانات الطلاب المرتبطين." : "Failed to load linked students."));
      }
      setLoading(false);
    };
    fetchData();
  }, [isRTL]);

  const placeholderAccessRecords = useMemo(() => placeholderAccessRecordsByLanguage(isRTL), [isRTL]);
  const usesPlaceholder = forceDemoData;
  const sourceAccessRecords = usesPlaceholder ? placeholderAccessRecords : analytics?.accessRecords || [];

  const filteredAccessRecords = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return sourceAccessRecords;
    return sourceAccessRecords.filter((record) => {
      const studentName = String(record.studentName || "").toLowerCase();
      const lectureName = String(record.lectureName || "").toLowerCase();
      return studentName.includes(normalized) || lectureName.includes(normalized);
    });
  }, [sourceAccessRecords, query]);

  const totalPages = Math.max(1, Math.ceil(filteredAccessRecords.length / PAGE_SIZE));
  const paginatedAccessRecords = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredAccessRecords.slice(start, start + PAGE_SIZE);
  }, [filteredAccessRecords, page]);

  useEffect(() => {
    setPage(1);
  }, [forceDemoData, query, filteredAccessRecords.length]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div
      className="flex min-h-screen flex-col"
      dir={isRTL ? "rtl" : "ltr"}
      style={{ background: `${GRADIENTS.pageAtmosphere}, ${TOKENS.creamSurface}` }}
    >
      <div className="transition-all duration-300 ease-in-out pt-14">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 md:px-8 lg:px-10 space-y-6">
          <section className="rounded-[1.5rem] border border-base-300 bg-base-100 p-5 md:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-primary">
                  {t("linkedStudentsFullPageTitle", { defaultValue: isRTL ? "كل الطلاب المرتبطين" : "All Linked Students" })}
                </h1>
                <p className="text-sm opacity-70 mt-1">
                  {t("linkedStudentsFullPageHint", {
                    defaultValue: isRTL ? "قائمة كاملة بالطلاب المرتبطين والمحاضرات وعدد المشاهدات المتبقية." : "Full list of linked students, lectures, and remaining views.",
                  })}
                </p>
              </div>
              <Link to="/dashboard/lecturer-dashboard" className="btn btn-outline rounded-xl">
                <ArrowLeft className="w-4 h-4" />
                {t("backToDashboard", { defaultValue: isRTL ? "العودة للوحة التحكم" : "Back to dashboard" })}
              </Link>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("searchLinkedStudents", { defaultValue: isRTL ? "ابحث باسم الطالب أو المحاضرة..." : "Search student or lecture..." })}
                className="input input-bordered w-full sm:max-w-sm"
              />
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="toggle toggle-warning toggle-sm"
                  checked={forceDemoData}
                  onChange={(event) => setForceDemoData(event.target.checked)}
                />
                <span className="text-sm font-semibold">
                  {t("showDemoData", { defaultValue: isRTL ? "عرض بيانات تجريبية" : "Show demo data" })}
                </span>
              </label>
            </div>
          </section>

          {error ? (
            <div className="alert alert-warning rounded-xl">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          ) : null}

          <section className="rounded-[1.5rem] border border-base-300 bg-base-100 overflow-hidden">
            {usesPlaceholder ? (
              <div className="px-4 py-2 text-xs font-semibold text-warning border-b border-base-300 bg-base-100">
                {t("sampleDataNotice", {
                  defaultValue: isRTL ? "بيانات تجريبية للعرض فقط حتى تتوفر بيانات حقيقية." : "Sample data for preview only until real analytics are available.",
                })}
              </div>
            ) : null}

            {loading ? (
              <div className="p-6 flex justify-center">
                <span className="loading loading-spinner loading-lg text-primary"></span>
              </div>
            ) : paginatedAccessRecords.length ? (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t("studentName", { defaultValue: isRTL ? "الطالب" : "Student" })}</th>
                      <th>{t("lecture", { defaultValue: isRTL ? "المحاضرة" : "Lecture" })}</th>
                      <th>{t("remainingViews", { defaultValue: isRTL ? "المشاهدات المتبقية" : "Remaining Views" })}</th>
                      <th>{t("lastAccessed", { defaultValue: isRTL ? "آخر مشاهدة" : "Last accessed" })}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAccessRecords.map((record, index) => (
                      <tr key={`${record.studentId || "student"}-${record.lectureId || "lecture"}-${index}`}>
                        <td className="font-semibold">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-primary" />
                            {record.studentName || t("unknown", { defaultValue: isRTL ? "غير معروف" : "Unknown" })}
                          </div>
                        </td>
                        <td>{record.lectureName || t("noSubject", { defaultValue: isRTL ? "بدون مادة" : "No subject" })}</td>
                        <td>{record.remainingViews ?? 0}</td>
                        <td>{record.lastAccessed ? new Date(record.lastAccessed).toLocaleDateString(i18n.language) : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-sm opacity-70">
                {t("noLinkedStudents", { defaultValue: isRTL ? "لا توجد بيانات ربط بعد." : "No linked students yet." })}
              </div>
            )}

            {filteredAccessRecords.length > PAGE_SIZE ? (
              <div className="border-t border-base-300 px-4 py-3 flex items-center justify-between gap-3">
                <button
                  type="button"
                  className="btn btn-sm btn-outline rounded-lg"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                >
                  {t("previous", { defaultValue: isRTL ? "السابق" : "Previous" })}
                </button>
                <span className="text-xs opacity-70">
                  {t("pageOf", {
                    current: page,
                    total: totalPages,
                    defaultValue: isRTL ? "صفحة {{current}} من {{total}}" : "Page {{current}} of {{total}}",
                  })}
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline rounded-lg"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                >
                  {t("next", { defaultValue: isRTL ? "التالي" : "Next" })}
                </button>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
