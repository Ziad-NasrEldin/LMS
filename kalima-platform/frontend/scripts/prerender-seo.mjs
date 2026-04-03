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

function hasArabicCharacters(value) {
  return /[\u0600-\u06FF]/.test(cleanText(value));
}

function hasMultipleWords(value) {
  return cleanText(value).split(/\s+/).filter(Boolean).length >= 2;
}

function isPlaceholderName(value) {
  return /^(test|demo|sample|temp|tmp|null|undefined)(?:[\s-_]*\d+)?$/i.test(cleanText(value));
}

function hasMeaningfulSummary(value) {
  return cleanText(value).length >= 20;
}

function isSeoEligibleCourse(container) {
  const name = cleanText(container?.name);
  if (!name || isPlaceholderName(name)) return false;
  if (hasArabicCharacters(name) || hasMultipleWords(name)) return true;
  return hasMeaningfulSummary(container?.description);
}

function isSeoEligibleTeacher(lecturer) {
  const name = cleanText(lecturer?.name);
  if (!name || isPlaceholderName(name)) return false;
  if (hasArabicCharacters(name) || hasMultipleWords(name)) return true;
  return hasMeaningfulSummary(lecturer?.bio) || hasMeaningfulSummary(lecturer?.expertise);
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

function buildPrerenderBody({ heading, description, links = [], sections = [] }) {
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
      #seo-prerender .seo-links { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-top: 28px; }
      #seo-prerender .seo-link { display: block; padding: 18px; border-radius: 20px; background: rgba(255,255,255,.92); box-shadow: 0 10px 30px rgba(14,85,99,.08); color: #16212b; text-decoration: none; }
      #seo-prerender .seo-link strong { display: block; margin-bottom: 6px; color: #0e5563; font-size: 18px; }
      #seo-prerender .seo-link span { display: block; line-height: 1.8; color: #344255; font-size: 15px; }
    </style>
    <main id="seo-prerender" dir="rtl">
      <div class="seo-shell">
        <span class="seo-badge">منصة فكرة التعليمية</span>
        <h1>${escapeHtml(cleanText(heading))}</h1>
        <p>${escapeHtml(cleanText(description))}</p>
        ${
          links.length > 0
            ? `<nav class="seo-links" aria-label="روابط أساسية">
                ${links
                  .map(
                    (link) => `
                      <a class="seo-link" href="${escapeHtml(link.href)}">
                        <strong>${escapeHtml(cleanText(link.label))}</strong>
                        <span>${escapeHtml(cleanText(link.description || ""))}</span>
                      </a>
                    `,
                  )
                  .join("")}
              </nav>`
            : ""
        }
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
  const title = "فكرة | منصة تعليم إلكتروني عالمية";
  const description = DEFAULT_DESCRIPTION_AR;
  const schema = [buildOrganizationSchema(), buildWebsiteSchema()];

  return {
    routePath: "/",
    seoHead: buildSeoHead({ title, description, canonicalPath: "/", schema }),
    seoBody: buildPrerenderBody({
      heading: "منصة فكرة التعليمية",
      description,
      links: [
        {
          href: "/courses",
          label: "الدورات التعليمية",
          description: "استكشف الدورات المتاحة بحسب مجالات الاهتمام والأهداف التعليمية.",
        },
        {
          href: "/teachers",
          label: "المعلمون",
          description: "تعرّف على المعلمين المتخصصين واختر المعلم المناسب.",
        },
        {
          href: "/privacy-policy",
          label: "سياسة الخصوصية",
          description: "اطّلع على كيفية جمع البيانات واستخدامها وحمايتها.",
        },
      ],
      sections: [
        {
          title: "ما الذي تقدمه فكرة؟",
          items: [
            "دورات تعليمية وموارد عملية للمتعلمين في مختلف المجالات.",
            "مسارات واضحة تساعدك على التقدم بالوتيرة التي تناسبك.",
            "خبراء ومحتوى عالي الجودة وتجربة استخدام بسيطة.",
          ],
        },
      ],
    }),
  };
}

function buildCoursesListing(containers = []) {
  const title = "دورات فكرة التعليمية | اكتشف المسارات التعليمية";
  const description =
    "استكشف الدورات التعليمية على منصة فكرة واختر ما يناسب أهدافك وتعلّمك.";
  const highlightedCourses = containers
    .slice(0, 8)
    .filter((container) => container?._id && container?.name)
    .map((container) => ({
      href: buildCoursePath(container),
      label: cleanText(container.name),
      description:
        cleanText(container.subject?.name) ||
        cleanText(container.level?.nameAr || container.level?.name) ||
        "عرض تفاصيل الدورة",
    }));

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
      links: highlightedCourses,
      sections: [
        {
          title: "أبرز الدورات",
          items:
            highlightedCourses.length > 0
              ? highlightedCourses.map((course) => course.label)
              : ["تتوفر على المنصة دورات تعليمية متنوعة بحسب مجالات متعددة ومسارات تعلم مختلفة."],
        },
      ],
    }),
  };
}

function buildTeachersListing(lecturers = []) {
  const title = "معلمو فكرة التعليمية | اختر الموجّه المناسب";
  const description =
    "تعرّف على معلمي فكرة التعليمية واختر الموجّه المناسب وفق التخصص والخبرة.";
  const highlightedTeachers = lecturers
    .slice(0, 8)
    .filter((lecturer) => lecturer?._id && lecturer?.name)
    .map((lecturer) => ({
      href: buildTeacherPath(lecturer),
      label: cleanText(lecturer.name),
      description: cleanText(lecturer.expertise || "معلم متخصص"),
    }));

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
      links: highlightedTeachers,
      sections: [
        {
          title: "نخبة من المعلمين",
          items:
            highlightedTeachers.length > 0
              ? highlightedTeachers.map((teacher) => teacher.label)
              : ["تضم منصة فكرة التعليمية معلمين متخصصين في مختلف المواد والمراحل الدراسية."],
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
        `اطّلع على تفاصيل دورة ${cleanName} على منصة فكرة التعليمية، بما يشمل المحتوى الدراسي والمعلم والمرحلة التعليمية.`;
      const image =
        container.image?.url ||
        container.containerImage?.url ||
        container.inheritedImage?.image?.url ||
        DEFAULT_SOCIAL_IMAGE;
      const levelName = cleanText(container.level?.nameAr || container.level?.name || "");
      const subjectName = cleanText(container.subject?.name || "");
      const instructorName = cleanText(container.createdBy?.name || "");
      const seoTitle = `${cleanName} | دورات منصة فكرة التعليمية`;

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
        `تعرّف على المعلم ${cleanName} على منصة فكرة التعليمية، واطّلع على تخصصه والدورات المرتبطة به.`;
      const image = lecturer.profilePic || DEFAULT_SOCIAL_IMAGE;
      const expertise = cleanText(lecturer.expertise || "التعليم");
      const seoTitle = `${cleanName} | معلمو منصة فكرة التعليمية`;

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
      const title = `${cleanName} | دورات منصة فكرة التعليمية`;
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
      const title = `${cleanName} | معلمو منصة فكرة التعليمية`;
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
  const seoReadyContainers = containers.filter(isSeoEligibleCourse);
  const seoReadyLecturers = lecturers.filter(isSeoEligibleTeacher);

  const pages = [
    buildHomePage(),
    buildCoursesListing(seoReadyContainers),
    buildTeachersListing(seoReadyLecturers),
    buildPrivacyPage(),
    ...buildCourseDetailPages(seoReadyContainers),
    ...buildTeacherDetailPages(seoReadyLecturers, seoReadyContainers),
    ...buildRedirectPages(seoReadyContainers, seoReadyLecturers),
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
