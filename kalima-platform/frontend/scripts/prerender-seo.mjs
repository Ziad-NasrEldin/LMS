import fs from "node:fs/promises";
import path from "node:path";
import {
  DEFAULT_DESCRIPTION_AR,
  DEFAULT_SOCIAL_IMAGE,
  SITE_NAME_AR,
  SITE_URL,
  buildAbsoluteUrl,
  buildCoursePath,
  buildLegacyCoursePath,
  buildTeacherLegacyPath,
  buildTeacherPath,
  resolveUrl,
} from "../src/seo/site.mjs";
import {
  buildBreadcrumbSchema,
  buildCourseSchema,
  buildOrganizationSchema,
  buildPersonSchema,
  buildWebsiteSchema,
} from "../src/seo/structuredData.mjs";

const DIST_DIR = path.resolve(process.cwd(), "dist");
const INDEX_FILE = path.join(DIST_DIR, "index.html");
const BUILD_DATE = new Date().toISOString();
const API_BASE = resolveUrl(
  process.env.FEKRA_API_URL || process.env.VITE_API_URL || "/api/v1",
  process.env.FEKRA_SITE_URL || process.env.VITE_SITE_URL || SITE_URL,
);

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function isPublishedRecord(record) {
  return record?.isPublished !== false;
}

function buildSeoHead({
  title,
  description,
  canonicalPath,
  image = DEFAULT_SOCIAL_IMAGE,
  robots = "index, follow",
  schema = [],
}) {
  const canonicalUrl = buildAbsoluteUrl(canonicalPath);
  const imageUrl = buildAbsoluteUrl(image);
  const cleanedTitle = cleanText(title);
  const cleanedDescription = cleanText(description);
  const payload = Array.isArray(schema) ? schema : [schema];

  return `
    <title>${escapeHtml(cleanedTitle)}</title>
    <meta name="description" content="${escapeHtml(cleanedDescription)}" />
    <meta name="robots" content="${escapeHtml(robots)}" />
    <meta property="og:site_name" content="${escapeHtml(SITE_NAME_AR)}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(cleanedTitle)}" />
    <meta property="og:description" content="${escapeHtml(cleanedDescription)}" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta property="og:image" content="${escapeHtml(imageUrl)}" />
    <meta property="og:locale" content="ar_EG" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(cleanedTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(cleanedDescription)}" />
    <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <script id="route-structured-data" type="application/ld+json">${JSON.stringify(payload)}</script>
  `.trim();
}

function buildPrerenderBody({ heading, description, sections = [] }) {
  return `
    <style>
      #seo-prerender { font-family: "Cairo", "Noto Sans Arabic", Tahoma, sans-serif; background: #f8f3e9; color: #16212b; min-height: 100vh; }
      #seo-prerender .seo-shell { max-width: 960px; margin: 0 auto; padding: 48px 20px 40px; }
      #seo-prerender .seo-badge { display: inline-block; margin-bottom: 16px; padding: 8px 14px; border-radius: 999px; background: rgba(14,85,99,.12); color: #0e5563; font-weight: 700; font-size: 14px; }
      #seo-prerender h1 { margin: 0 0 16px; font-size: clamp(2rem, 5vw, 3.5rem); line-height: 1.15; }
      #seo-prerender p { margin: 0; line-height: 1.9; font-size: 18px; color: #344255; }
      #seo-prerender section { margin-top: 28px; padding: 22px; border-radius: 24px; background: rgba(255,255,255,.86); box-shadow: 0 10px 30px rgba(14,85,99,.08); }
      #seo-prerender h2 { margin: 0 0 12px; font-size: 24px; color: #0e5563; }
      #seo-prerender ul { margin: 0; padding-right: 18px; }
      #seo-prerender li { margin: 8px 0; line-height: 1.8; }
    </style>
    <main id="seo-prerender" dir="rtl">
      <div class="seo-shell">
        <span class="seo-badge">فكرة التعليمية</span>
        <h1>${escapeHtml(cleanText(heading))}</h1>
        <p>${escapeHtml(cleanText(description))}</p>
        ${sections
          .map(
            (section) => `
              <section>
                <h2>${escapeHtml(cleanText(section.title))}</h2>
                ${
                  section.items?.length
                    ? `<ul>${section.items
                        .map((item) => `<li>${escapeHtml(cleanText(item))}</li>`)
                        .join("")}</ul>`
                    : `<p>${escapeHtml(cleanText(section.body || ""))}</p>`
                }
              </section>
            `,
          )
          .join("")}
      </div>
    </main>
  `.trim();
}

function buildRedirectBody({ title, description, canonicalPath }) {
  const canonicalUrl = buildAbsoluteUrl(canonicalPath);
  return `
    <meta http-equiv="refresh" content="0; url=${escapeHtml(canonicalUrl)}" />
    <script>window.location.replace(${JSON.stringify(canonicalUrl)});</script>
    ${buildPrerenderBody({
      heading: title,
      description,
      sections: [
        {
          title: "إعادة التوجيه",
          body: `يتم تحويلك إلى الرابط المعتمد لهذه الصفحة: ${canonicalUrl}`,
        },
      ],
    })}
  `.trim();
}

async function readTemplate() {
  return fs.readFile(INDEX_FILE, "utf8");
}

async function writeRouteHtml(routePath, html) {
  const normalized = routePath === "/" ? "" : routePath.replace(/^\/+|\/+$/g, "");
  const outputFile = normalized
    ? path.join(DIST_DIR, normalized, "index.html")
    : INDEX_FILE;

  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  await fs.writeFile(outputFile, html, "utf8");
}

function injectTemplate(template, seoHead, seoBody) {
  const cleanedTemplate = template
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta[^>]+name="description"[^>]*>\s*/gi, "")
    .replace(/<meta[^>]+name="robots"[^>]*>\s*/gi, "")
    .replace(/<meta[^>]+property="og:[^"]+"[^>]*>\s*/gi, "")
    .replace(/<meta[^>]+name="twitter:[^"]+"[^>]*>\s*/gi, "")
    .replace(/<link[^>]+rel="canonical"[^>]*>\s*/gi, "");

  return cleanedTemplate
    .replace(/<html[^>]*lang="[^"]*"/i, '<html lang="ar"')
    .replace(/<html([^>]*)dir="[^"]*"/i, '<html$1dir="rtl"')
    .replace("<!--SEO_HEAD-->", seoHead)
    .replace("<!--SEO_BODY-->", seoBody);
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.json();
}

async function loadPublicData() {
  try {
    const [containersResponse, lecturersResponse] = await Promise.all([
      fetchJson(`${API_BASE}/containers?type=course&sort=-createdAt&limit=2000`),
      fetchJson(`${API_BASE}/lecturers`),
    ]);

    return {
      containers: (containersResponse?.data?.containers || []).filter(isPublishedRecord),
      lecturers: (lecturersResponse?.data || lecturersResponse?.data?.data || []).filter(
        isPublishedRecord,
      ),
    };
  } catch (error) {
    console.warn("[seo-prerender] Falling back to static-only prerender:", error.message);
    return { containers: [], lecturers: [] };
  }
}

function buildHomePage() {
  const title = "منصة فكرة التعليمية | تعلّم منظم وتقدّم حقيقي";
  const description = DEFAULT_DESCRIPTION_AR;
  const schema = [buildOrganizationSchema(), buildWebsiteSchema()];

  return {
    routePath: "/",
    seoHead: buildSeoHead({ title, description, canonicalPath: "/", schema }),
    seoBody: buildPrerenderBody({
      heading: "منصة فكرة التعليمية",
      description,
      sections: [
        {
          title: "ما الذي تقدمه فكرة؟",
          items: [
            "دروس منظمة لطلاب الصف الرابع الابتدائي حتى الصف الثالث الثانوي.",
            "تتبع واضح للتقدّم الدراسي ومحتوى مناسب للمراحل المختلفة.",
            "دورات تعليمية ومعلمون متخصصون وتجربة استخدام بسيطة.",
          ],
        },
      ],
    }),
  };
}

function buildCoursesListing(containers = []) {
  const title = "دورات فكرة التعليمية | اكتشف الدورات المناسبة لمرحلتك";
  const description =
    "استكشف الدورات التعليمية على منصة فكرة واختر ما يناسب مرحلتك الدراسية وأهدافك التعليمية.";
  const highlights = containers
    .slice(0, 8)
    .map((container) => cleanText(container.name))
    .filter(Boolean);

  return {
    routePath: "/courses",
    seoHead: buildSeoHead({
      title,
      description,
      canonicalPath: "/courses",
      schema: [
        buildBreadcrumbSchema([
          { name: "الرئيسية", path: "/" },
          { name: "الدورات", path: "/courses" },
        ]),
      ],
    }),
    seoBody: buildPrerenderBody({
      heading: "الدورات التعليمية",
      description,
      sections: [
        {
          title: "أبرز الدورات",
          items:
            highlights.length > 0
              ? highlights
              : ["تتوفر على المنصة دورات تعليمية متنوعة بحسب المرحلة الدراسية والمادة."],
        },
      ],
    }),
  };
}

function buildTeachersListing(lecturers = []) {
  const title = "معلمو فكرة التعليمية | اختر المعلم المناسب";
  const description =
    "تعرّف على معلمي منصة فكرة التعليمية واختر المعلم المناسب وفق التخصص والخبرة والمرحلة الدراسية.";
  const highlights = lecturers
    .slice(0, 8)
    .map((lecturer) => cleanText(lecturer.name))
    .filter(Boolean);

  return {
    routePath: "/teachers",
    seoHead: buildSeoHead({
      title,
      description,
      canonicalPath: "/teachers",
      schema: [
        buildBreadcrumbSchema([
          { name: "الرئيسية", path: "/" },
          { name: "المعلمون", path: "/teachers" },
        ]),
      ],
    }),
    seoBody: buildPrerenderBody({
      heading: "المعلمون",
      description,
      sections: [
        {
          title: "نخبة من المعلمين",
          items:
            highlights.length > 0
              ? highlights
              : ["تضم منصة فكرة معلمين متخصصين في مختلف المواد والمراحل الدراسية."],
        },
      ],
    }),
  };
}

function buildPrivacyPage() {
  const title = "سياسة الخصوصية | منصة فكرة التعليمية";
  const description =
    "اطّلع على سياسة الخصوصية الخاصة بمنصة فكرة التعليمية وكيفية جمع البيانات واستخدامها وحمايتها.";

  return {
    routePath: "/privacy-policy",
    seoHead: buildSeoHead({
      title,
      description,
      canonicalPath: "/privacy-policy",
      schema: [
        buildBreadcrumbSchema([
          { name: "الرئيسية", path: "/" },
          { name: "سياسة الخصوصية", path: "/privacy-policy" },
        ]),
      ],
    }),
    seoBody: buildPrerenderBody({
      heading: "سياسة الخصوصية",
      description,
      sections: [
        {
          title: "ملخص",
          items: [
            "توضح هذه الصفحة البيانات التي تجمعها فكرة وكيفية استخدامها.",
            "تشرح السياسة الجهات التي قد تشارك معها البيانات لأغراض تشغيل الخدمة.",
            "توضح الحقوق والخيارات المتاحة للمستخدمين فيما يتعلق بالبيانات الشخصية.",
          ],
        },
      ],
    }),
  };
}

function buildCourseDetailPages(containers = []) {
  return containers
    .filter((container) => container?._id && container?.name)
    .map((container) => {
      const canonicalPath = buildCoursePath(container);
      const cleanName = cleanText(container.name);
      const description =
        cleanText(container.description) ||
        `اكتشف دورة ${cleanName} على منصة فكرة التعليمية وتعرّف على محتواها الدراسي ومتطلباتها.`;
      const image =
        container.image?.url ||
        container.containerImage?.url ||
        container.inheritedImage?.image?.url ||
        DEFAULT_SOCIAL_IMAGE;
      const levelName = cleanText(container.level?.nameAr || container.level?.name || "");
      const subjectName = cleanText(container.subject?.name || "");
      const instructorName = cleanText(container.createdBy?.name || "");
      const seoTitle = `${cleanName} | دورات فكرة التعليمية`;

      const schema = [
        buildBreadcrumbSchema([
          { name: "الرئيسية", path: "/" },
          { name: "الدورات", path: "/courses" },
          { name: cleanName, path: canonicalPath },
        ]),
        buildCourseSchema({
          name: cleanName,
          description,
          path: canonicalPath,
          image,
          subject: subjectName,
          instructor: instructorName,
          level: levelName,
          price: typeof container.price === "number" ? container.price : 0,
        }),
      ];

      return {
        routePath: canonicalPath,
        seoHead: buildSeoHead({
          title: seoTitle,
          description,
          canonicalPath,
          image,
          schema,
        }),
        seoBody: buildPrerenderBody({
          heading: cleanName,
          description,
          sections: [
            {
              title: "معلومات الدورة",
              items: [
                subjectName ? `المادة: ${subjectName}` : "المادة: غير محددة",
                levelName ? `المرحلة أو الصف: ${levelName}` : "المرحلة أو الصف: غير محدد",
                instructorName ? `المعلم: ${instructorName}` : "المعلم: غير محدد",
              ],
            },
          ],
        }),
      };
    });
}

function buildTeacherDetailPages(lecturers = [], containers = []) {
  const containersByTeacherId = new Map();

  containers.forEach((container) => {
    const teacherId =
      container.createdBy?._id || container.createdBy?.id || container.createdBy || "";
    if (!teacherId) return;

    if (!containersByTeacherId.has(teacherId)) {
      containersByTeacherId.set(teacherId, []);
    }

    containersByTeacherId.get(teacherId).push(container.name);
  });

  return lecturers
    .filter((lecturer) => lecturer?._id && lecturer?.name)
    .map((lecturer) => {
      const canonicalPath = buildTeacherPath(lecturer);
      const cleanName = cleanText(lecturer.name);
      const courseNames = (containersByTeacherId.get(lecturer._id) || []).map(cleanText);
      const description =
        cleanText(lecturer.bio) ||
        `تعرّف على المعلم ${cleanName} على منصة فكرة التعليمية واكتشف تخصصه والدورات المرتبطة به.`;
      const image = lecturer.profilePic || DEFAULT_SOCIAL_IMAGE;
      const expertise = cleanText(lecturer.expertise || "التعليم");
      const seoTitle = `${cleanName} | معلمو فكرة التعليمية`;

      const schema = [
        buildBreadcrumbSchema([
          { name: "الرئيسية", path: "/" },
          { name: "المعلمون", path: "/teachers" },
          { name: cleanName, path: canonicalPath },
        ]),
        buildPersonSchema({
          name: cleanName,
          description,
          path: canonicalPath,
          image,
          expertise,
        }),
      ];

      return {
        routePath: canonicalPath,
        seoHead: buildSeoHead({
          title: seoTitle,
          description,
          canonicalPath,
          image,
          schema,
        }),
        seoBody: buildPrerenderBody({
          heading: cleanName,
          description,
          sections: [
            {
              title: "الملف التعريفي",
              items: [
                `التخصص: ${expertise}`,
                ...(courseNames.length > 0
                  ? courseNames.slice(0, 6).map((name) => `دورة مرتبطة: ${name}`)
                  : ["لا توجد دورات عامة مرتبطة بهذا المعلم حالياً."]),
              ],
            },
          ],
        }),
      };
    });
}

function buildRedirectPages(containers = [], lecturers = []) {
  const pages = [];

  containers.forEach((container) => {
    if (!container?._id || !container?.name) return;

    const canonicalPath = buildCoursePath(container);
      const cleanName = cleanText(container.name);
      const title = `${cleanName} | دورات فكرة التعليمية`;
      const description =
        cleanText(container.description) ||
        `يتم تحويلك إلى الرابط المعتمد للدورة ${cleanName} على منصة فكرة التعليمية.`;

    pages.push({
      routePath: buildLegacyCoursePath(container),
      seoHead: buildSeoHead({
        title,
        description,
        canonicalPath,
        robots: "noindex, follow",
      }),
      seoBody: buildRedirectBody({ title, description, canonicalPath }),
    });
  });

  lecturers.forEach((lecturer) => {
    if (!lecturer?._id || !lecturer?.name) return;

    const canonicalPath = buildTeacherPath(lecturer);
      const cleanName = cleanText(lecturer.name);
      const title = `${cleanName} | معلمو فكرة التعليمية`;
      const description =
        cleanText(lecturer.bio) ||
        `يتم تحويلك إلى الرابط المعتمد للملف التعريفي للمعلم ${cleanName}.`;

    pages.push({
      routePath: buildTeacherLegacyPath(lecturer),
      seoHead: buildSeoHead({
        title,
        description,
        canonicalPath,
        robots: "noindex, follow",
      }),
      seoBody: buildRedirectBody({ title, description, canonicalPath }),
    });

    pages.push({
      routePath: `/teachers/${lecturer._id}`,
      seoHead: buildSeoHead({
        title,
        description,
        canonicalPath,
        robots: "noindex, follow",
      }),
      seoBody: buildRedirectBody({ title, description, canonicalPath }),
    });
  });

  return pages;
}

async function writeSitemap(pages) {
  const uniquePages = [...new Set(pages)];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniquePages
  .map(
    (routePath) => `  <url>
    <loc>${buildAbsoluteUrl(routePath)}</loc>
    <lastmod>${BUILD_DATE}</lastmod>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

  await fs.writeFile(path.join(DIST_DIR, "sitemap.xml"), sitemap, "utf8");
}

async function main() {
  const template = await readTemplate();
  const { containers, lecturers } = await loadPublicData();

  const pages = [
    buildHomePage(),
    buildCoursesListing(containers),
    buildTeachersListing(lecturers),
    buildPrivacyPage(),
    ...buildCourseDetailPages(containers),
    ...buildTeacherDetailPages(lecturers, containers),
    ...buildRedirectPages(containers, lecturers),
  ];

  for (const page of pages) {
    const html = injectTemplate(template, page.seoHead, page.seoBody);
    await writeRouteHtml(page.routePath, html);
  }

  await writeSitemap(
    pages
      .filter((page) => !page.seoHead.includes('content="noindex, follow"'))
      .map((page) => page.routePath),
  );
}

main().catch((error) => {
  console.error("[seo-prerender] Failed:", error);
  process.exitCode = 1;
});
