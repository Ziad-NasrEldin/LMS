const viteSiteUrl =
  typeof import.meta !== "undefined" && import.meta.env
    ? import.meta.env.VITE_SITE_URL
    : undefined;

const processSiteUrl =
  typeof process !== "undefined"
    ? process.env.FEKRA_SITE_URL || process.env.VITE_SITE_URL
    : undefined;

export const SITE_URL = normalizeBaseUrl(
  processSiteUrl || viteSiteUrl || "https://fekra-edu.com",
);

export const SITE_NAME_AR = "منصة فكرة التعليمية";
export const SITE_NAME_EN = "Fekra Educational Platform";
export const SITE_TITLE_AR = "منصة فكرة التعليمية";
export const DEFAULT_SOCIAL_IMAGE = "/Fekra.png";
export const DEFAULT_DESCRIPTION_AR =
  "فكرة منصة تعليم إلكتروني عالمية تقدم دورات وموارد وأدوات تعلم للمتعلمين في مختلف المجالات والمستويات.";
export const DEFAULT_DESCRIPTION_EN =
  "Fekra is a global e-learning platform offering courses, resources, and learning tools for learners across subjects and skill levels.";

export function normalizeBaseUrl(url) {
  return String(url || "").trim().replace(/\/+$/, "");
}

export function resolveUrl(url, base = SITE_URL) {
  const raw = String(url || "").trim();
  if (!raw) return normalizeBaseUrl(base);

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  const normalizedBase = normalizeBaseUrl(base);
  const normalizedPath = raw.startsWith("/") ? raw : `/${raw}`;
  return `${normalizedBase}${normalizedPath}`;
}

export function buildAbsoluteUrl(pathname, base = SITE_URL) {
  return resolveUrl(pathname, base);
}

export function getEntityId(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return value._id || value.id || value.userId || "";
  }
  return String(value);
}

export function slugify(value) {
  const input = String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  const slug = input
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
    .toLowerCase();

  return slug || "item";
}

export function buildCoursePath(courseLike) {
  const id = getEntityId(courseLike);
  const slug = slugify(courseLike?.name || courseLike?.title || id);
  return `/courses/${id}/${slug}`;
}

export function buildLegacyCoursePath(courseLike) {
  const id = getEntityId(courseLike);
  return `/courses/${id}`;
}

export function buildTeacherPath(teacherLike) {
  const id = getEntityId(teacherLike);
  const slug = slugify(teacherLike?.name || teacherLike?.title || id);
  return `/teachers/${id}/${slug}`;
}

export function buildTeacherLegacyPath(teacherLike) {
  const id = getEntityId(teacherLike);
  return `/teacher-details/${id}`;
}
