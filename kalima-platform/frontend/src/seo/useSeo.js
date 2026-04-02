import { useEffect } from "react";
import {
  DEFAULT_DESCRIPTION_AR,
  DEFAULT_SOCIAL_IMAGE,
  SITE_NAME_AR,
  buildAbsoluteUrl,
} from "./site.mjs";

const STRUCTURED_DATA_SCRIPT_ID = "route-structured-data";

function ensureMeta(selector, attrs) {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement("meta");
    Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
    document.head.appendChild(element);
  }

  return element;
}

function ensureLink(selector, attrs) {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement("link");
    Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
    document.head.appendChild(element);
  }

  return element;
}

function setStructuredData(schema) {
  const existing = document.getElementById(STRUCTURED_DATA_SCRIPT_ID);
  if (existing) existing.remove();

  if (!schema || (Array.isArray(schema) && schema.length === 0)) {
    return;
  }

  const payload = Array.isArray(schema) ? schema : [schema];
  const script = document.createElement("script");
  script.id = STRUCTURED_DATA_SCRIPT_ID;
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(payload);
  document.head.appendChild(script);
}

export function clearStructuredData() {
  document.getElementById(STRUCTURED_DATA_SCRIPT_ID)?.remove();
}

export function applySeo({
  title,
  description = DEFAULT_DESCRIPTION_AR,
  canonicalPath,
  image = DEFAULT_SOCIAL_IMAGE,
  robots = "index, follow",
  lang = "ar",
  dir = "rtl",
  type = "website",
  schema,
}) {
  if (typeof document === "undefined") return;

  const normalizedTitle = title || SITE_NAME_AR;
  const canonicalUrl = buildAbsoluteUrl(
    canonicalPath || window.location.pathname || "/",
  );
  const imageUrl = buildAbsoluteUrl(image);

  document.documentElement.lang = lang;
  document.documentElement.dir = dir;
  document.title = normalizedTitle;

  ensureMeta('meta[name="description"]', { name: "description" }).setAttribute(
    "content",
    description,
  );
  ensureMeta('meta[name="robots"]', { name: "robots" }).setAttribute(
    "content",
    robots,
  );
  ensureMeta('meta[property="og:site_name"]', { property: "og:site_name" }).setAttribute(
    "content",
    SITE_NAME_AR,
  );
  ensureMeta('meta[property="og:type"]', { property: "og:type" }).setAttribute(
    "content",
    type,
  );
  ensureMeta('meta[property="og:title"]', { property: "og:title" }).setAttribute(
    "content",
    normalizedTitle,
  );
  ensureMeta('meta[property="og:description"]', { property: "og:description" }).setAttribute(
    "content",
    description,
  );
  ensureMeta('meta[property="og:url"]', { property: "og:url" }).setAttribute(
    "content",
    canonicalUrl,
  );
  ensureMeta('meta[property="og:image"]', { property: "og:image" }).setAttribute(
    "content",
    imageUrl,
  );
  ensureMeta('meta[property="og:locale"]', { property: "og:locale" }).setAttribute(
    "content",
    lang === "ar" ? "ar_EG" : "en_US",
  );
  ensureMeta('meta[name="twitter:card"]', { name: "twitter:card" }).setAttribute(
    "content",
    "summary_large_image",
  );
  ensureMeta('meta[name="twitter:title"]', { name: "twitter:title" }).setAttribute(
    "content",
    normalizedTitle,
  );
  ensureMeta('meta[name="twitter:description"]', { name: "twitter:description" }).setAttribute(
    "content",
    description,
  );
  ensureMeta('meta[name="twitter:image"]', { name: "twitter:image" }).setAttribute(
    "content",
    imageUrl,
  );
  ensureLink('link[rel="canonical"]', { rel: "canonical" }).setAttribute(
    "href",
    canonicalUrl,
  );

  setStructuredData(schema);
}

export function useSeo(config) {
  const schemaKey = JSON.stringify(config?.schema || null);

  useEffect(() => {
    applySeo(config || {});
  }, [
    config?.title,
    config?.description,
    config?.canonicalPath,
    config?.image,
    config?.robots,
    config?.lang,
    config?.dir,
    config?.type,
    schemaKey,
  ]);
}
