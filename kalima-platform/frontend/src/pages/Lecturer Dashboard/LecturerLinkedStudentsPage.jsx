import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, ArrowLeft, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { getLecturerAnalytics } from "../../routes/lectures";
import { designTokens } from "../../constants/designTokens";
import { translateErrorMessage } from "../../utils/errorTranslator";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

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
        setError(translateErrorMessage(res.message || "Failed to load linked students"));
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
          <section className="rounded-[1.5rem] bg-white p-5 md:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-primary">
                  {t("linkedStudentsFullPageTitle", { defaultValue: isRTL ? "كل الطلاب المرتبطين" : "All Linked Students" })}
                </h1>
          <p className="mt-1 text-sm text-slate-700">
                  {t("linkedStudentsFullPageHint", {
                    defaultValue: isRTL ? "قائمة كاملة بالطلاب المرتبطين والمحاضرات وعدد المشاهدات المتبقية." : "Full list of linked students, lectures, and remaining views.",
                  })}
                </p>
              </div>
              <Button as={Link} to="/dashboard/lecturer-dashboard" variant="outline" className="rounded-xl">
                <ArrowLeft className="w-4 h-4" />
                {t("backToDashboard", { defaultValue: isRTL ? "العودة للوحة التحكم" : "Back to dashboard" })}
              </Button>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
               <Input
                 type="text"
                 value={query}
                 onChange={(event) => setQuery(event.target.value)}
                 placeholder={t("searchLinkedStudents", { defaultValue: isRTL ? "ابحث باسم الطالب أو المحاضرة..." : "Search student or lecture..." })}
                 className="w-full sm:max-w-sm"
               />
               <label className="flex items-center gap-3 cursor-pointer">
                 <input
                   type="checkbox"
                   className="w-4 h-4 accent-warning"
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
             <div className="flex items-center gap-3 p-4 mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl">
               <AlertCircle className="w-5 h-5" />
               <span>{error}</span>
             </div>
           ) : null}


           <section className="rounded-[1.5rem] bg-white overflow-hidden">
             {usesPlaceholder ? (
               <div className="px-4 py-2 text-xs font-semibold text-warning border-b border-slate-200 bg-white">
                 {t("sampleDataNotice", {
                   defaultValue: isRTL ? "بيانات تجريبية للعرض فقط حتى تتوفر بيانات حقيقية." : "Sample data for preview only until real analytics are available.",
                 })}
               </div>
             ) : null}
                         
             {loading ? (
               <div className="p-6 flex justify-center">
                 <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
               </div>
             ) : paginatedAccessRecords.length ? (

               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="border-b border-slate-200 bg-slate-50">
                       <th className="p-3 font-semibold text-slate-700">{t("studentName", { defaultValue: isRTL ? "الطالب" : "Student" })}</th>
                       <th className="p-3 font-semibold text-slate-700">{t("lecture", { defaultValue: isRTL ? "المحاضرة" : "Lecture" })}</th>
                       <th className="p-3 font-semibold text-slate-700">{t("remainingViews", { defaultValue: isRTL ? "المشاهدات المتبقية" : "Remaining Views" })}</th>
                       <th className="p-3 font-semibold text-slate-700">{t("lastAccessed", { defaultValue: isRTL ? "آخر مشاهدة" : "Last accessed" })}</th>
                     </tr>
                   </thead>
                   <tbody>
                     {paginatedAccessRecords.map((record, index) => (
                       <tr key={`${record.studentId || "student"}-${record.lectureId || "lecture"}-${index}`} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                         <td className="p-3 font-semibold">
                           <div className="flex items-center gap-2">
                             <Users className="w-4 h-4 text-primary" />
                             {record.studentName || t("unknown", { defaultValue: isRTL ? "غير معروف" : "Unknown" })}
                           </div>
                         </td>
                         <td className="p-3">{record.lectureName || t("noSubject", { defaultValue: isRTL ? "بدون مادة" : "No subject" })}</td>
                         <td className="p-3">{record.remainingViews ?? 0}</td>
                         <td className="p-3">{record.lastAccessed ? new Date(record.lastAccessed).toLocaleDateString(i18n.language) : "-"}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>

            ) : (
              <div className="p-6 text-sm text-slate-600">
                {t("noLinkedStudents", { defaultValue: isRTL ? "لا توجد بيانات ربط بعد." : "No linked students yet." })}
              </div>
            )}

             {filteredAccessRecords.length > PAGE_SIZE ? (
               <div className="border-t border-slate-200 px-4 py-3 flex items-center justify-between gap-3">
                 <Button
                   type="button"
                   variant="outline"
                   size="sm"
                   className="rounded-lg"
                   onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                   disabled={page === 1}
                 >
                   {t("previous", { defaultValue: isRTL ? "السابق" : "Previous" })}
                 </Button>
                <span className="text-xs text-slate-600">
                   {t("pageOf", {
                     current: page,
                     total: totalPages,
                     defaultValue: isRTL ? "صفحة {{current}} من {{total}}" : "Page {{current}} of {{total}}",
                   })}
                 </span>
                 <Button
                   type="button"
                   variant="outline"
                   size="sm"
                   className="rounded-lg"
                   onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                   disabled={page === totalPages}
                 >
                   {t("next", { defaultValue: isRTL ? "التالي" : "Next" })}
                 </Button>
               </div>
             ) : null}

          </section>
        </div>
      </div>
    </div>
  );
}
