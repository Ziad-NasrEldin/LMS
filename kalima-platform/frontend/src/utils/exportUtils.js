import * as XLSX from "xlsx";

const CSV_BOM = "\uFEFF";

export const isArabicLanguage = (language) =>
  String(language || "").toLowerCase().startsWith("ar");

export const getExportLocale = (language) =>
  isArabicLanguage(language) ? "ar-EG" : "en-US";

export const formatDateForExport = (value, locale, options = {}) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  const formatter = new Intl.DateTimeFormat(locale || "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...options,
  });
  return formatter.format(parsed);
};

export const formatDateTimeForExport = (value, locale) =>
  formatDateForExport(value, locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

export const normalizeExportValue = (value) => {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeExportValue(item))
      .filter(Boolean)
      .join(" | ");
  }

  if (typeof value === "object") {
    if (value.nameAr) return value.nameAr;
    if (value.name) return value.name;
    if (value.label) return value.label;
    if (value.value !== undefined) return normalizeExportValue(value.value);
    return JSON.stringify(value);
  }

  return value;
};

const sanitizeSheetName = (value, fallback = "Sheet") => {
  const normalized = String(value || fallback)
    .replace(/[\\/*?:[\]]/g, " ")
    .trim();
  if (!normalized) return fallback;
  return normalized.slice(0, 31);
};

const escapeCsvCell = (value) => {
  const normalized = String(normalizeExportValue(value) ?? "");
  const escaped = normalized.replace(/"/g, '""');
  return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
};

const rowsToAoa = ({ rows = [], columns = [] }) => {
  const header = columns.map((column) => column.label);
  const body = rows.map((row) =>
    columns.map((column) => {
      const rawValue = column.value ? column.value(row) : row[column.key];
      return normalizeExportValue(rawValue);
    }),
  );
  return [header, ...body];
};

const downloadBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportCsvFile = ({ rows = [], columns = [], fileName }) => {
  const [header, ...body] = rowsToAoa({ rows, columns });
  const csvRows = [header, ...body].map((row) => row.map(escapeCsvCell).join(","));
  const csvContent = `${CSV_BOM}${csvRows.join("\n")}`;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, fileName);
};

export const exportXlsxFile = ({
  sheets = [],
  fileName,
}) => {
  const workbook = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    const aoa = rowsToAoa({
      rows: sheet.rows || [],
      columns: sheet.columns || [],
    });
    const worksheet = XLSX.utils.aoa_to_sheet(aoa);
    worksheet["!cols"] = (sheet.columns || []).map((column) => ({
      wch: Math.max(14, String(column.label || "").length + 4),
    }));
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      sanitizeSheetName(sheet.name, "Sheet"),
    );
  });

  XLSX.writeFile(workbook, fileName, { compression: true });
};

export const buildExportFileDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
