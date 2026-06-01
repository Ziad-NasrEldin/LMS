const rawApiUrl = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export const API_BASE_URL = /\/api\/v1$/i.test(rawApiUrl)
  ? rawApiUrl
  : `${rawApiUrl || ""}/api/v1`;

export const BACKEND_BASE_URL = /^https?:\/\//i.test(API_BASE_URL)
  ? API_BASE_URL.replace(/\/api\/v1\/?$/i, "").replace(/\/+$/, "")
  : (typeof window !== "undefined" ? window.location.origin : "");
