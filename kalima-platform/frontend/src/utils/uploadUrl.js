export const resolveBackendBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "";

  if (/^https?:\/\//i.test(apiUrl)) {
    return apiUrl.replace(/\/api\/v1\/?$/i, "").replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "";
};

export const resolveUploadUrl = (filePath, fallbackFolder = "product_thumbnails") => {
  if (!filePath) return null;
  if (/^https?:\/\//i.test(filePath)) return filePath;

  const normalizedPath = String(filePath).replace(/\\/g, "/").replace(/^\/+/, "");
  const backendBase = resolveBackendBaseUrl();

  const uploadPath = normalizedPath.includes("uploads/")
    ? normalizedPath.slice(normalizedPath.indexOf("uploads/"))
    : `uploads/${fallbackFolder}/${normalizedPath.split("/").pop()}`;

  return `${backendBase}/${uploadPath}`;
};