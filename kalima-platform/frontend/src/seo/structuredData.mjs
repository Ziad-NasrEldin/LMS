import {
  DEFAULT_SOCIAL_IMAGE,
  SITE_NAME_AR,
  SITE_URL,
  buildAbsoluteUrl,
} from "./site.mjs";

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME_AR,
    url: SITE_URL,
    logo: buildAbsoluteUrl(DEFAULT_SOCIAL_IMAGE),
  };
}

export function buildWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME_AR,
    url: SITE_URL,
    inLanguage: "ar",
  };
}

export function buildBreadcrumbSchema(items = []) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: buildAbsoluteUrl(item.path),
    })),
  };
}

export function buildCourseSchema({
  name,
  description,
  path,
  image,
  subject,
  instructor,
  level,
  price,
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Course",
    name,
    description,
    url: buildAbsoluteUrl(path),
    provider: {
      "@type": "Organization",
      name: SITE_NAME_AR,
      url: SITE_URL,
    },
  };

  if (image) {
    schema.image = buildAbsoluteUrl(image);
  }

  if (subject) {
    schema.about = subject;
  }

  if (level) {
    schema.educationalLevel = level;
  }

  if (instructor) {
    schema.instructor = {
      "@type": "Person",
      name: instructor,
    };
  }

  if (typeof price === "number") {
    schema.offers = {
      "@type": "Offer",
      price,
      priceCurrency: "EGP",
      availability: "https://schema.org/InStock",
      category: price > 0 ? "Paid" : "Free",
    };
  }

  return schema;
}

export function buildPersonSchema({
  name,
  description,
  path,
  image,
  expertise,
  sameAs,
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    description,
    url: buildAbsoluteUrl(path),
  };

  if (image) {
    schema.image = buildAbsoluteUrl(image);
  }

  if (expertise) {
    schema.knowsAbout = Array.isArray(expertise) ? expertise : [expertise];
  }

  if (Array.isArray(sameAs) && sameAs.length > 0) {
    schema.sameAs = sameAs;
  }

  return schema;
}
