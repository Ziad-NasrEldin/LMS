import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, PlayCircle, RocketLaunch, Sparkle } from "@phosphor-icons/react";
import { designTokens } from "../../constants/designTokens";
import { useSeo } from "../../seo/useSeo";
import { buildOrganizationSchema, buildWebsiteSchema } from "../../seo/structuredData.mjs";

const TOKENS = designTokens.colors;
const SHADOWS = designTokens.shadows;
const GRADIENTS = designTokens.gradients;

const APP_STORE_URL = "https://apps.apple.com";
const PLAY_STORE_URL = "https://play.google.com/store";

const reveal = {
  hidden: { opacity: 0, y: 12 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      delay,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

const Services = () => {
  const { i18n } = useTranslation("home");
  const isRTL = i18n.language === "ar";

  useSeo({
    title: isRTL
      ? "منصة فكرة التعليمية | تعلّم منظم وتقدّم حقيقي"
      : "Fekra Educational Platform | Structured Learning and Real Progress",
    description: isRTL
      ? "فكرة منصة تعليمية رقمية تساعد الطلاب من الصف الرابع الابتدائي حتى الصف الثالث الثانوي على التعلّم المنظم ومتابعة التقدّم بوضوح."
      : "Fekra is a digital learning platform that helps students learn in a structured way and track progress clearly.",
    canonicalPath: "/",
    lang: i18n.language?.startsWith("en") ? "en" : "ar",
    dir: isRTL ? "rtl" : "ltr",
    schema: [buildOrganizationSchema(), buildWebsiteSchema()],
  });

  const text = useMemo(
    () => ({
      ar: {
        badge: "منصة تعليمية موثوقة",
        title: "تعلّم منظم. تقدّم حقيقي.",
        subtitle: "نساعد الطالب على فهم الدروس بسرعة، والتطبيق مباشرة، ومتابعة تقدّمه بوضوح.",
        primaryCta: "ابدأ الآن",
        secondaryCta: "سجّل الدخول",
        tertiaryCta: "استكشف الدورات",
        proofTitle: "لماذا فكرة؟",
        features: [
          {
            title: "شرح واضح",
            body: "محتوى مبسّط يركّز على الفهم من دون تعقيد.",
          },
          {
            title: "تدريب مباشر",
            body: "تطبيق فوري بعد كل درس لتحويل المعرفة إلى مهارة عملية.",
          },
          {
            title: "نتائج قابلة للقياس",
            body: "متابعة واضحة تساعد الطالب وولي الأمر على رؤية التحسّن.",
          },
        ],
        appTitle: "حمّل تطبيق فكرة",
        appBody: "تعلّم عبر الهاتف في أي وقت من خلال تطبيق سريع وسهل الاستخدام.",
        appScan: "امسح الكود للوصول السريع",
        appIos: "تحميل على App Store",
        appAndroid: "تحميل على Google Play",
        ctaTitle: "هل أنت مستعد للبدء؟",
        ctaBody: "أنشئ حسابك وابدأ مسارًا تعليميًا مناسبًا لمرحلتك.",
        ctaButton: "أنشئ حسابك",
      },
      en: {
        badge: "Trusted learning platform",
        title: "Structured learning. Real progress.",
        subtitle: "Students understand faster, practice immediately, and track progress clearly.",
        primaryCta: "Start now",
        secondaryCta: "Sign in",
        tertiaryCta: "Browse courses",
        proofTitle: "Why Fekra?",
        features: [
          {
            title: "Clear teaching",
            body: "Simple explanations focused on understanding, not complexity.",
          },
          {
            title: "Direct practice",
            body: "Immediate exercises after each lesson to build actual skill.",
          },
          {
            title: "Measurable outcomes",
            body: "Progress visibility for learners and parents at every step.",
          },
        ],
        appTitle: "Download Fekra App",
        appBody: "Learn on the go anytime with a fast and simple mobile experience.",
        appScan: "Scan QR for quick access",
        appIos: "Download on App Store",
        appAndroid: "Get it on Google Play",
        ctaTitle: "Ready to begin?",
        ctaBody: "Create your account and start a plan tailored to your level.",
        ctaButton: "Create account",
      },
    }),
    [],
  )[i18n.language] || {
    badge: "Trusted learning platform",
    title: "Structured learning. Real progress.",
    subtitle: "Students understand faster, practice immediately, and track progress clearly.",
    primaryCta: "Start now",
    secondaryCta: "Sign in",
    tertiaryCta: "Browse courses",
    proofTitle: "Why Fekra?",
    features: [
      {
        title: "Clear teaching",
        body: "Simple explanations focused on understanding, not complexity.",
      },
      {
        title: "Direct practice",
        body: "Immediate exercises after each lesson to build actual skill.",
      },
      {
        title: "Measurable outcomes",
        body: "Progress visibility for learners and parents at every step.",
      },
    ],
    appTitle: "Download Fekra App",
    appBody: "Learn on the go anytime with a fast and simple mobile experience.",
    appScan: "Scan QR for quick access",
    appIos: "Download on App Store",
    appAndroid: "Get it on Google Play",
    ctaTitle: "Ready to begin?",
    ctaBody: "Create your account and start a plan tailored to your level.",
    ctaButton: "Create account",
  };

  return (
    <main
      dir={isRTL ? "rtl" : "ltr"}
      className="relative isolate min-h-[100dvh] overflow-x-clip px-4 py-10 sm:px-6 md:px-8 lg:px-10 lg:py-14"
      style={{
        background: TOKENS.creamSurface,
        color: TOKENS.inkText,
        fontFamily: isRTL
          ? "'Cairo', 'Noto Kufi Arabic', 'Noto Sans Arabic', Tahoma, sans-serif"
          : "'Plus Jakarta Sans', 'Helvetica Neue', sans-serif",
      }}
    >
      <div className={`home-logo-watermark${isRTL ? " home-logo-watermark--rtl" : ""}`} aria-hidden="true">
        <span className="home-logo-watermark__body" />
        <span className="home-logo-watermark__fill" />
        <span className="home-logo-watermark__outline" />
      </div>

      <div
        className="pointer-events-none fixed inset-0 -z-20 opacity-50"
        style={{
          background: GRADIENTS.pageAtmosphere,
        }}
      />

      <div className="mx-auto max-w-[1160px] space-y-10 md:space-y-12">
        <motion.section initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={reveal} custom={0}>
          <article
            className="relative overflow-hidden rounded-[2rem] border p-6 lg:p-12"
            style={{
              borderColor: "rgba(255,255,255,0.22)",
              background: GRADIENTS.hero,
              boxShadow: SHADOWS.level2,
            }}
          >
            <div className="pointer-events-none absolute -left-10 -top-8 h-40 w-40 rounded-full opacity-70" style={{ background: "rgba(77,179,194,0.42)" }} />
            <div className="pointer-events-none absolute -bottom-12 right-6 h-36 w-36 rounded-full opacity-75" style={{ background: "rgba(243,154,63,0.35)" }} />

            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.08em]"
              style={{
                borderColor: "rgba(255,255,255,0.3)",
                background: "rgba(255,255,255,0.14)",
                color: "#ECFDFF",
              }}
            >
              <Sparkle size={14} weight="fill" />
              {text.badge}
            </span>

            <h1 className="mt-5 max-w-[14ch] text-5xl font-extrabold leading-[1.1] tracking-[-0.02em] text-white md:text-7xl">
              {text.title}
            </h1>

            <p className="mt-4 max-w-[64ch] text-base leading-8 text-[#DDF6FB]">{text.subtitle}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-transform duration-200 hover:-translate-y-[1px] active:scale-[0.98]"
                style={{
                  background: TOKENS.goldenSand,
                  color: TOKENS.inkText,
                  boxShadow: SHADOWS.level1,
                }}
              >
                {text.primaryCta}
                <span
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full"
                  style={{ background: "rgba(17,24,39,0.12)" }}
                >
                  <PlayCircle size={16} weight="fill" />
                </span>
              </Link>

              <Link
                to="/login"
                className="inline-flex items-center rounded-full border px-6 py-3 text-sm font-semibold transition-transform duration-200 hover:-translate-y-[1px] active:scale-[0.98]"
                style={{
                  borderColor: "rgba(255,255,255,0.3)",
                  background: "rgba(255,255,255,0.14)",
                  color: "#F8FCFF",
                }}
              >
                {text.secondaryCta}
              </Link>

              <Link
                to="/courses"
                className="inline-flex items-center rounded-full border px-6 py-3 text-sm font-semibold transition-transform duration-200 hover:-translate-y-[1px] active:scale-[0.98]"
                style={{
                  borderColor: "rgba(255,255,255,0.25)",
                  background: "rgba(255,255,255,0.08)",
                  color: "#F8FCFF",
                }}
              >
                {text.tertiaryCta}
              </Link>
            </div>
          </article>
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={reveal}
          custom={0.05}
          className="rounded-[2rem] border p-6 md:p-8"
          style={{
            borderColor: "rgba(17,24,39,0.06)",
            background: GRADIENTS.appPanel,
            boxShadow: SHADOWS.level1,
          }}
        >
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-3xl font-bold md:text-4xl" style={{ color: TOKENS.deepTeal }}>
                {text.appTitle}
              </h2>
              <p className="mt-3 max-w-[64ch] leading-8" style={{ color: TOKENS.slateText }}>
                {text.appBody}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full px-5 py-3 text-sm font-bold transition-transform duration-200 hover:-translate-y-[1px]"
                  style={{ background: TOKENS.deepTeal, color: "#F8FCFF" }}
                >
                  {text.appIos}
                </a>
                <a
                  href={PLAY_STORE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full px-5 py-3 text-sm font-bold transition-transform duration-200 hover:-translate-y-[1px]"
                  style={{ background: TOKENS.goldenSand, color: TOKENS.inkText }}
                >
                  {text.appAndroid}
                </a>
              </div>
            </div>

            <div className="mx-auto w-fit rounded-[1.3rem] border bg-white p-3" style={{ borderColor: "rgba(17,24,39,0.08)", boxShadow: SHADOWS.level1 }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(PLAY_STORE_URL)}`}
                alt={isRTL ? "رمز QR لتطبيق فكرة" : "Fekra app QR code"}
                className="h-40 w-40 rounded-xl"
                loading="lazy"
              />
              <p className="mt-2 text-center text-xs font-semibold" style={{ color: TOKENS.slateText }}>
                {text.appScan}
              </p>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="rounded-[2rem] border p-6 md:p-8"
          style={{ borderColor: "rgba(17,24,39,0.06)", background: TOKENS.neutralCloud }}
        >
          <h2 className="text-3xl font-bold md:text-5xl">{text.proofTitle}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {text.features.map((feature, index) => (
              <article
                key={feature.title}
                className="rounded-[1.4rem] border bg-white p-5"
                style={{ borderColor: "rgba(17,24,39,0.06)", boxShadow: SHADOWS.level1 }}
              >
                <div
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ background: TOKENS.goldenSand }}
                >
                  <CheckCircle size={18} weight="fill" />
                </div>
                <h3 className="mt-3 text-xl font-bold">{feature.title}</h3>
                <p className="mt-1 leading-7" style={{ color: TOKENS.slateText }}>
                  {feature.body}
                </p>
              </article>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={reveal}
          custom={0.06}
          className="rounded-[2rem] border p-6 md:p-7"
          style={{
            borderColor: "rgba(17,24,39,0.06)",
            background: GRADIENTS.cta,
            boxShadow: SHADOWS.level2,
            color: "#F8FCFF",
          }}
        >
          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold md:text-4xl">{text.ctaTitle}</h2>
            <p className="max-w-[64ch] leading-8 text-[#EAFBFF]">{text.ctaBody}</p>
          </div>

          <Link
            to="/register"
            className="mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-transform duration-200 hover:-translate-y-[1px] active:scale-[0.98]"
            style={{
              background: TOKENS.warmMango,
              color: TOKENS.inkText,
              boxShadow: SHADOWS.level1,
            }}
          >
            {text.ctaButton}
            <span
              className="inline-flex h-7 w-7 items-center justify-center rounded-full"
              style={{ background: "rgba(17,24,39,0.12)" }}
            >
              <RocketLaunch size={15} weight="bold" />
            </span>
          </Link>

        </motion.section>
      </div>
    </main>
  );
};

export default Services;
