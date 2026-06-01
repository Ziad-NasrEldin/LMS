import { BACKEND_BASE_URL } from "./apiBase";
export const resolveProfileImageUrl = (profilePic) => {
  if (!profilePic) {
    return "/person.png";
  }

  if (/^https?:\/\//i.test(profilePic)) {
    return profilePic;
  }

  const normalized = String(profilePic).replace(/\\/g, "/").replace(/^\/+/, "");
  const uploadPath = normalized.includes("uploads/")
    ? normalized.slice(normalized.indexOf("uploads/"))
    : normalized;

  return `${BACKEND_BASE_URL}/${uploadPath}`;
};
