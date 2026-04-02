import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { applySeo, clearStructuredData } from "./useSeo";
import { DEFAULT_DESCRIPTION_AR } from "./site.mjs";

const AUTH_ROUTES = new Set([
  "/login",
  "/register",
  "/signup",
  "/forgot-password",
  "/verify-otp",
  "/reset-password",
]);

export default function AuthNoindexController() {
  const location = useLocation();
  const { i18n } = useTranslation();

  useEffect(() => {
    const pathname = location.pathname || "/";
    const isNoindexRoute =
      AUTH_ROUTES.has(pathname) || pathname.startsWith("/dashboard/");

    if (!isNoindexRoute) {
      return;
    }

    applySeo({
      title: document.title,
      description: DEFAULT_DESCRIPTION_AR,
      canonicalPath: pathname,
      robots: "noindex, nofollow",
      lang: i18n.language?.startsWith("en") ? "en" : "ar",
      dir: i18n.dir(),
      schema: null,
    });

    clearStructuredData();
  }, [i18n, location.pathname]);

  return null;
}
