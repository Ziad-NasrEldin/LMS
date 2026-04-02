const fs = require("node:fs");
const path = require("node:path");
const { SIGNUP_ERROR_CATALOG } = require("../backend/utils/signupErrors");

const ROOT = path.resolve(__dirname, "..");
const EN_PATH = path.join(ROOT, "frontend", "public", "locales", "en", "register.json");
const AR_PATH = path.join(ROOT, "frontend", "public", "locales", "ar", "register.json");
const OUT_PATH = path.join(ROOT, "docs", "signup-error-matrix.md");

const en = JSON.parse(fs.readFileSync(EN_PATH, "utf8"));
const ar = JSON.parse(fs.readFileSync(AR_PATH, "utf8"));

const roles = ["student", "parent", "teacher"];

const appliesToRole = (code, role) => {
  if (code.includes("_STUDENT_")) return role === "student";
  if (code.includes("_PARENT_")) return role === "parent";
  if (code.includes("_TEACHER_")) return role === "teacher";
  return true;
};

const messageFor = (locale, code, role) => {
  const byCode = locale?.apiErrors?.[code];
  if (!byCode) return "";
  if (byCode[role]) return byCode[role];
  if (byCode.default) return byCode.default;
  return "";
};

const escapePipes = (value) => String(value || "").replace(/\|/g, "\\|");

const lines = [];
lines.push("# Signup Error Matrix");
lines.push("");
lines.push(
  "This matrix is generated from `backend/utils/signupErrors.js` and signup locale mappings in `frontend/public/locales/{en,ar}/register.json`."
);
lines.push("");
lines.push(`Generated at: ${new Date().toISOString()}`);
lines.push("");
lines.push(
  "| Error Code | HTTP | Field | Student (EN/AR) | Parent (EN/AR) | Teacher (EN/AR) |"
);
lines.push("| --- | --- | --- | --- | --- | --- |");

for (const [code, entry] of Object.entries(SIGNUP_ERROR_CATALOG)) {
  const roleCells = roles.map((role) => {
    if (!appliesToRole(code, role)) return "N/A";
    const enMessage = messageFor(en, code, role);
    const arMessage = messageFor(ar, code, role);
    const resolvedEn = enMessage || entry.message || "N/A";
    const resolvedAr = arMessage || "N/A";
    return `${escapePipes(resolvedEn)} / ${escapePipes(resolvedAr)}`;
  });

  lines.push(
    `| ${code} | ${entry.statusCode || ""} | ${entry.field || "-"} | ${roleCells[0]} | ${roleCells[1]} | ${roleCells[2]} |`
  );
}

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, `${lines.join("\n")}\n`, "utf8");
console.log(`Generated signup matrix: ${OUT_PATH}`);
