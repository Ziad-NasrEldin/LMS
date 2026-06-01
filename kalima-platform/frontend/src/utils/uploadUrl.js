import { BACKEND_BASE_URL } from "./apiBase";
export const resolveBackendBaseUrl = () => {
  return BACKEND_BASE_URL;
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