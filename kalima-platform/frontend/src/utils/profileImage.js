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

  const apiBase = import.meta.env.VITE_API_URL || "";
  const backendBase = /^https?:\/\//i.test(apiBase)
    ? apiBase.replace(/\/api\/v1\/?$/, "").replace(/\/+$/, "")
    : (typeof window !== "undefined" ? window.location.origin : "");

  return `${backendBase}/${uploadPath}`;
};
