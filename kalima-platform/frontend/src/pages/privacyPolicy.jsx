import { useTranslation } from "react-i18next";
import { FiMail, FiShield, FiDatabase, FiGlobe, FiLock, FiCamera } from "react-icons/fi";
import { useSeo } from "../seo/useSeo";
import { buildBreadcrumbSchema } from "../seo/structuredData.mjs";

const sectionOrder = [
  { id: "collection", icon: FiDatabase },
  { id: "usage", icon: FiGlobe },
  { id: "sharing", icon: FiShield },
  { id: "storage", icon: FiLock },
  { id: "retention", icon: FiDatabase },
  { id: "children", icon: FiCamera },
  { id: "rights", icon: FiShield },
  { id: "changes", icon: FiGlobe },
];

const InfoCard = ({ label, value, isRTL }) => (
  <div
    className="rounded-3xl border p-4 shadow-sm"
    style={{
      borderColor: "rgba(20,106,120,0.14)",
      background: "rgba(255,255,255,0.78)",
    }}
    dir={isRTL ? "rtl" : "ltr"}
  >
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
      {label}
    </p>
    <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
  </div>
);

const SectionCard = ({ title, icon: Icon, summary, items, isRTL }) => (
  <section
    className="rounded-[2rem] border p-5 shadow-sm md:p-6"
    style={{
      borderColor: "rgba(20,106,120,0.14)",
      background: "rgba(255,255,255,0.84)",
    }}
    dir={isRTL ? "rtl" : "ltr"}
  >
    <div className={`flex items-start gap-3 ${isRTL ? "flex-row-reverse text-right" : "text-left"}`}>
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
        style={{ background: "rgba(14,85,99,0.10)", color: "#0E5563" }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <h2 className="text-lg font-bold text-slate-900 md:text-xl">{title}</h2>
        {summary && <p className="mt-2 text-sm leading-7 text-slate-600">{summary}</p>}
      </div>
    </div>

    <ul className={`mt-4 space-y-3 text-sm leading-7 text-slate-700 ${isRTL ? "pr-1 text-right" : "pl-1 text-left"}`}>
      {(items || []).map((item, index) => (
        <li key={`${title}-${index}`} className={`flex gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <span
            className="mt-2 h-2 w-2 shrink-0 rounded-full"
            style={{ background: "#F39A3F" }}
            aria-hidden="true"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </section>
);

const PrivacyPolicy = () => {
  const { t, i18n } = useTranslation("privacyPolicy");
  const isRTL = i18n.dir() === "rtl";
  const lang = i18n.language?.startsWith("ar") ? "ar" : "en";

  useSeo({
    title: t("meta.title"),
    description: t("meta.intro"),
    canonicalPath: "/privacy-policy",
    lang,
    dir: isRTL ? "rtl" : "ltr",
    schema: [
      buildBreadcrumbSchema([
        { name: isRTL ? "الرئيسية" : "Home", path: "/" },
        { name: t("meta.title"), path: "/privacy-policy" },
      ]),
    ],
  });

  const summaryCards = t("summaryCards", { returnObjects: true }) || [];
  const collectionItems = t("sections.collection.items", { returnObjects: true }) || [];
  const usageItems = t("sections.usage.items", { returnObjects: true }) || [];
  const sharingItems = t("sections.sharing.items", { returnObjects: true }) || [];
  const storageItems = t("sections.storage.items", { returnObjects: true }) || [];
  const retentionItems = t("sections.retention.items", { returnObjects: true }) || [];
  const childrenItems = t("sections.children.items", { returnObjects: true }) || [];
  const rightsItems = t("sections.rights.items", { returnObjects: true }) || [];
  const changesItems = t("sections.changes.items", { returnObjects: true }) || [];

  const sectionItems = {
    collection: collectionItems,
    usage: usageItems,
    sharing: sharingItems,
    storage: storageItems,
    retention: retentionItems,
    children: childrenItems,
    rights: rightsItems,
    changes: changesItems,
  };

  return (
    <main
      className={`min-h-screen overflow-hidden ${isRTL ? "rtl" : "ltr"}`}
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        background:
          "radial-gradient(circle at top left, rgba(243,154,63,0.16), transparent 30%), radial-gradient(circle at top right, rgba(20,106,120,0.14), transparent 28%), linear-gradient(180deg, #f8f3e9 0%, #f7fafc 100%)",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div
          className="overflow-hidden rounded-[2.5rem] border shadow-[0_20px_60px_rgba(14,85,99,0.08)]"
          style={{
            borderColor: "rgba(14,85,99,0.12)",
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(241,243,246,0.92) 100%)",
          }}
        >
          <div className="px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="rounded-full px-4 py-1 text-xs font-bold uppercase tracking-[0.22em]"
                style={{ background: "rgba(14,85,99,0.10)", color: "#0E5563" }}
              >
                {t("meta.badge")}
              </span>
              <span className="text-sm text-slate-500">
                {t("meta.lastUpdatedLabel")}: {t("meta.lastUpdated")}
              </span>
            </div>

            <div className={`mt-6 grid gap-8 lg:grid-cols-[1.25fr_0.75fr] ${isRTL ? "text-right" : "text-left"}`}>
              <div>
                <h1 className="max-w-3xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                  {t("meta.title")}
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
                  {t("meta.intro")}
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <InfoCard label={t("meta.effectiveDateLabel")} value={t("meta.effectiveDate")} isRTL={isRTL} />
                  <InfoCard label={t("meta.contactLabel")} value={t("meta.contactName")} isRTL={isRTL} />
                  <InfoCard label={t("meta.scopeLabel")} value={t("meta.scope")} isRTL={isRTL} />
                  <InfoCard label={t("meta.childrenLabel")} value={t("meta.childrenSummary")} isRTL={isRTL} />
                </div>
              </div>

              <aside
                className="rounded-[2rem] border p-5"
                style={{
                  borderColor: "rgba(20,106,120,0.14)",
                  background: "rgba(14,85,99,0.04)",
                }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0E5563]">
                  {t("highlights.title")}
                </p>
                <div className="mt-4 space-y-4">
                  {(summaryCards || []).map((card) => (
                    <div key={card.title} className="rounded-2xl bg-white/75 p-4 shadow-sm">
                      <p className="text-sm font-bold text-slate-900">{card.title}</p>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{card.text}</p>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {sectionOrder.map(({ id, icon }) => (
            <SectionCard
              key={id}
              title={t(`sections.${id}.title`)}
              icon={icon}
              summary={t(`sections.${id}.summary`)}
              items={sectionItems[id]}
              isRTL={isRTL}
            />
          ))}
        </div>

        <section
          className="mt-8 rounded-[2rem] border p-6 shadow-sm md:p-8"
          style={{
            borderColor: "rgba(14,85,99,0.14)",
            background: "linear-gradient(135deg, rgba(14,85,99,0.08), rgba(243,154,63,0.08))",
          }}
          dir={isRTL ? "rtl" : "ltr"}
        >
          <div className={`flex items-start gap-3 ${isRTL ? "flex-row-reverse text-right" : "text-left"}`}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0E5563] shadow-sm">
              <FiMail className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-black text-slate-950 md:text-2xl">{t("contact.title")}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-700">{t("contact.description")}</p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <a
                  href={`mailto:${t("contact.email")}`}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#0E5563] shadow-sm transition-transform hover:-translate-y-0.5"
                >
                  <FiMail className="h-4 w-4" />
                  <span>{t("contact.email")}</span>
                </a>
                <div className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                  {t("contact.response")}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default PrivacyPolicy;
