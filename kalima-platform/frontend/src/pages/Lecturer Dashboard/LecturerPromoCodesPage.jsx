import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, ArrowLeft, Ticket } from "lucide-react";
import { Link } from "react-router-dom";
import { getLecturerAnalytics } from "../../routes/lectures";
import { designTokens } from "../../constants/designTokens";
import { translateErrorMessage } from "../../utils/errorTranslator";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

const formatNumber = (value, locale) => new Intl.NumberFormat(locale || "en").format(Number(value || 0));

const placeholderPromoCodes = [
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
];

export default function LecturerPromoCodesPage() {
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
        setError(translateErrorMessage(res.message || (isRTL ? "تعذر تحميل أكواد الشحن." : "Failed to load promo codes.")));
      }
      setLoading(false);
    };
    fetchData();
  }, [isRTL]);

  const usesPlaceholder = forceDemoData;
  const sourceCodes = usesPlaceholder ? placeholderPromoCodes : analytics?.promoCodes || [];

  const filteredCodes = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return sourceCodes;
    return sourceCodes.filter((code) => String(code.code || "").toLowerCase().includes(normalized));
  }, [sourceCodes, query]);

  const totalPages = Math.max(1, Math.ceil(filteredCodes.length / PAGE_SIZE));
  const paginatedCodes = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredCodes.slice(start, start + PAGE_SIZE);
  }, [filteredCodes, page]);

  useEffect(() => {
    setPage(1);
  }, [forceDemoData, query, filteredCodes.length]);

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
          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 md:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-primary">
                  {t("promoCodesFullPageTitle", { defaultValue: isRTL ? "كل أكواد الشحن" : "All Promo Codes" })}
                </h1>
          <p className="mt-1 text-sm text-slate-700">
                  {t("promoCodesFullPageHint", {
                    defaultValue: isRTL ? "قائمة كاملة بكل أكواد الشحن وتفاصيل الحالة." : "Full list of promo codes with status details.",
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
                 placeholder={t("searchPromoCodes", { defaultValue: isRTL ? "ابحث بالكود..." : "Search by code..." })}
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


           <section className="rounded-[1.5rem] border border-slate-200 bg-white overflow-hidden">
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
             ) : paginatedCodes.length ? (

               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="border-b border-slate-200 bg-slate-50">
                       <th className="p-3 font-semibold text-slate-700">{t("promoCodes", { defaultValue: isRTL ? "أكواد الشحن" : "Promo Codes" })}</th>
                       <th className="p-3 font-semibold text-slate-700">{t("amount", { defaultValue: isRTL ? "القيمة" : "Amount" })}</th>
                       <th className="p-3 font-semibold text-slate-700">{t("status", { defaultValue: isRTL ? "الحالة" : "Status" })}</th>
                       <th className="p-3 font-semibold text-slate-700">{t("createdAt", { defaultValue: isRTL ? "تاريخ الإنشاء" : "Created at" })}</th>
                       <th className="p-3 font-semibold text-slate-700">{t("redeemedAt", { defaultValue: isRTL ? "تاريخ الاستخدام" : "Redeemed at" })}</th>
                     </tr>
                   </thead>
                   <tbody>
                     {paginatedCodes.map((code) => (
                       <tr key={code.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                         <td className="p-3 font-semibold tracking-widest">
                           <div className="flex items-center gap-2">
                             <Ticket className="w-4 h-4 text-primary" />
                             {code.code}
                           </div>
                         </td>
                         <td className="p-3">
                           {formatNumber(code.pointsAmount, i18n.language)} {t("currency", { defaultValue: isRTL ? "جنيه" : "EGP" })}
                         </td>
                         <td className="p-3">
                           {code.isRedeemed
                             ? t("redeemed", { defaultValue: isRTL ? "مستخدم" : "Redeemed" })
                             : t("available", { defaultValue: isRTL ? "متاح" : "Available" })}
                         </td>
                         <td className="p-3">{new Date(code.createdAt || Date.now()).toLocaleDateString(i18n.language)}</td>
                         <td className="p-3">{code.redeemedAt ? new Date(code.redeemedAt).toLocaleDateString(i18n.language) : "-"}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>

            ) : (
              <div className="p-6 text-sm text-slate-600">
                {t("noPromoCodes", { defaultValue: isRTL ? "لا توجد أكواد شحن بعد." : "No promo codes yet." })}
              </div>
            )}

             {filteredCodes.length > PAGE_SIZE ? (
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
