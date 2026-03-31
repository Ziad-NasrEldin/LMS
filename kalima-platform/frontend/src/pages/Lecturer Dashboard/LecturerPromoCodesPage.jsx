import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, ArrowLeft, Ticket } from "lucide-react";
import { Link } from "react-router-dom";
import { getLecturerAnalytics } from "../../routes/lectures";
import { designTokens } from "../../constants/designTokens";

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
        setError(res.message || (isRTL ? "تعذر تحميل أكواد الشحن." : "Failed to load promo codes."));
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
          <section className="rounded-[1.5rem] border border-base-300 bg-base-100 p-5 md:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-primary">
                  {t("promoCodesFullPageTitle", { defaultValue: isRTL ? "كل أكواد الشحن" : "All Promo Codes" })}
                </h1>
                <p className="text-sm opacity-70 mt-1">
                  {t("promoCodesFullPageHint", {
                    defaultValue: isRTL ? "قائمة كاملة بكل أكواد الشحن وتفاصيل الحالة." : "Full list of promo codes with status details.",
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
                placeholder={t("searchPromoCodes", { defaultValue: isRTL ? "ابحث بالكود..." : "Search by code..." })}
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
            ) : paginatedCodes.length ? (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t("promoCodes", { defaultValue: isRTL ? "أكواد الشحن" : "Promo Codes" })}</th>
                      <th>{t("amount", { defaultValue: isRTL ? "القيمة" : "Amount" })}</th>
                      <th>{t("status", { defaultValue: isRTL ? "الحالة" : "Status" })}</th>
                      <th>{t("createdAt", { defaultValue: isRTL ? "تاريخ الإنشاء" : "Created at" })}</th>
                      <th>{t("redeemedAt", { defaultValue: isRTL ? "تاريخ الاستخدام" : "Redeemed at" })}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCodes.map((code) => (
                      <tr key={code.id}>
                        <td className="font-semibold tracking-widest">
                          <div className="flex items-center gap-2">
                            <Ticket className="w-4 h-4 text-primary" />
                            {code.code}
                          </div>
                        </td>
                        <td>
                          {formatNumber(code.pointsAmount, i18n.language)} {t("currency", { defaultValue: isRTL ? "جنيه" : "EGP" })}
                        </td>
                        <td>
                          {code.isRedeemed
                            ? t("redeemed", { defaultValue: isRTL ? "مستخدم" : "Redeemed" })
                            : t("available", { defaultValue: isRTL ? "متاح" : "Available" })}
                        </td>
                        <td>{new Date(code.createdAt || Date.now()).toLocaleDateString(i18n.language)}</td>
                        <td>{code.redeemedAt ? new Date(code.redeemedAt).toLocaleDateString(i18n.language) : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-sm opacity-70">
                {t("noPromoCodes", { defaultValue: isRTL ? "لا توجد أكواد شحن بعد." : "No promo codes yet." })}
              </div>
            )}

            {filteredCodes.length > PAGE_SIZE ? (
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
