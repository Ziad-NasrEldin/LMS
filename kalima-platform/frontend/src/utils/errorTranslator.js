import axios from "axios";
import i18n from "../components/i18n";

const COMMON_NS = "common";
const t = (key, options = {}) => i18n.t(key, { ns: COMMON_NS, ...options });

const exactMessages = new Map([
  ["Unauthorized", () => t("errors.unauthorized")],
  ["Forbidden", () => t("errors.forbidden")],
  ["Access token expired", () => t("errors.sessionExpired")],
  ["Authentication required", () => t("errors.authenticationRequired")],
  ["User not authenticated", () => t("errors.authenticationRequired")],
  ["Not authenticated", () => t("errors.authenticationRequired")],
  ["Invalid or missing role", () => t("errors.invalidRole")],
  ["Invalid role", () => t("errors.invalidRole")],
  ["Passwords do not match", () => t("errors.passwordMismatch")],
  ["Password and password confirmation don't match.", () => t("errors.passwordMismatch")],
  ["Request failed", () => t("errors.requestFailed")],
  ["Registration failed", () => t("errors.registrationFailed")],
  ["Login failed", () => t("errors.loginFailed")],
  ["Login failed: No access token received", () => t("errors.loginNoToken")],
  ["Logout failed on server, but local session was cleared", () => t("errors.logoutLocalSessionCleared")],
  ["Nested impersonation is not allowed. Exit current view first.", () => t("errors.nestedImpersonationNotAllowed")],
  ["No active impersonation session", () => t("errors.noActiveImpersonationSession")],
  ["Failed to start impersonation", () => t("errors.startImpersonationFailed")],
  ["Failed to stop impersonation", () => t("errors.stopImpersonationFailed")],
  ["Token refresh failed", () => t("errors.tokenRefreshFailed")],
  ["No response from server. Please check your internet connection.", () => t("errors.network")],
  ["An error occurred while fetching dashboard data.", () => t("errors.fetchFailed", { entity: t("entities.dashboardData") })],
  ["Failed to fetch purchased course containers", () => t("errors.fetchFailed", { entity: t("entities.purchasedCourseContainers") })],
  ["SubSection is required. Please select a subsection before creating the product.", () => t("errors.fieldRequired", { field: t("fields.subSection") })],
  ["SubSection is required. Please select a subsection before creating the book.", () => t("errors.fieldRequired", { field: t("fields.subSection") })],
  ["Unexpected response format", () => t("errors.unexpectedResponseFormat")],
  ["No file uploaded", () => t("errors.fileRequired")],
  ["No files or links uploaded", () => t("errors.fileRequired")],
  ["Not an image! Please upload only images.", () => t("errors.imageOnly")],
  ["Image upload failed", () => t("errors.imageUploadFailed")],
  ["Image upload failed:", () => t("errors.imageUploadFailed")],
  ["Invalid Lecturer ID", () => t("errors.invalidInput")],
  ["Invalid file type", () => t("errors.invalidInput")],
  ["Invalid Schema ID", () => t("errors.invalidInput")],
  ["File is required", () => t("errors.fileRequired")],
  ["Missing lecture id for edit", () => t("errors.missingLectureId")],
  ["No file path available", () => t("errors.filePathUnavailable")],
  ["Invalid container type for creation", () => t("errors.invalidContainerType")],
  ["Failed to fetch user info", () => t("errors.fetchFailed", { entity: t("entities.userInfo") })],
  ["Invalid role selected", () => t("errors.invalidRole")],
  ["User ID is missing", () => t("errors.missingUserId")],
  ["User not found", () => t("errors.userNotFound")],
  ["Invalid input data", () => t("errors.invalidInput")],
  ["Something went wrong!", () => t("errors.unexpected")],
  ["Something went wrong", () => t("errors.unexpected")],
  ["Unknown error occurred", () => t("errors.unknown")],
  ["An unexpected error occurred", () => t("errors.unexpected")],
  ["Network Error", () => t("errors.network")],
]);

const fieldLabels = {
  hobby: () => t("fields.hobby"),
  level: () => t("fields.level"),
  parentPhoneNumber: () => t("fields.parentPhoneNumber"),
  phoneNumber: () => t("fields.phoneNumber"),
  government: () => t("fields.government"),
  administrationZone: () => t("fields.administrationZone"),
  school: () => t("fields.school"),
  name: () => t("fields.name"),
  email: () => t("fields.email"),
  password: () => t("fields.password"),
  confirmPassword: () => t("fields.confirmPassword"),
  assignedLecturer: () => t("fields.assignedLecturer"),
  lecturer: () => t("fields.lecturer"),
  student: () => t("fields.student"),
  parent: () => t("fields.parent"),
  assistant: () => t("fields.assistant"),
  teacher: () => t("fields.teacher"),
  subject: () => t("fields.subject"),
  code: () => t("fields.code"),
  image: () => t("fields.image"),
  file: () => t("fields.file"),
  container: () => t("fields.container"),
  lecture: () => t("fields.lecture"),
  user: () => t("fields.user"),
  role: () => t("fields.role"),
  title: () => t("fields.title"),
  description: () => t("fields.description"),
  goal: () => t("fields.goal"),
  videoLink: () => t("fields.videoLink"),
  attachment: () => t("fields.attachment"),
  accessId: () => t("fields.accessId"),
  studentId: () => t("fields.studentId"),
  purchaseId: () => t("fields.purchaseId"),
  eventId: () => t("fields.eventId"),
};

const entityLabels = {
  users: () => t("entities.users"),
  user: () => t("entities.user"),
  students: () => t("entities.students"),
  student: () => t("entities.student"),
  parents: () => t("entities.parents"),
  parent: () => t("entities.parent"),
  lecturers: () => t("entities.lecturers"),
  lecturer: () => t("entities.lecturer"),
  teachers: () => t("entities.teachers"),
  teacher: () => t("entities.teacher"),
  assistants: () => t("entities.assistants"),
  assistant: () => t("entities.assistant"),
  subjects: () => t("entities.subjects"),
  subject: () => t("entities.subject"),
  levels: () => t("entities.levels"),
  level: () => t("entities.level"),
  containers: () => t("entities.containers"),
  container: () => t("entities.container"),
  lectures: () => t("entities.lectures"),
  lecture: () => t("entities.lecture"),
  courses: () => t("entities.courses"),
  course: () => t("entities.course"),
  logs: () => t("entities.logs"),
  log: () => t("entities.log"),
  files: () => t("entities.files"),
  file: () => t("entities.file"),
  attachments: () => t("entities.attachments"),
  attachment: () => t("entities.attachment"),
  access: () => t("entities.access"),
  attendance: () => t("entities.attendance"),
  data: () => t("entities.data"),
  info: () => t("entities.info"),
  details: () => t("entities.details"),
  orders: () => t("entities.orders"),
  coupons: () => t("entities.coupons"),
  promoCodes: () => t("entities.promoCodes"),
};

const humanize = (value) =>
  String(value || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase();

const labelForField = (field) => fieldLabels[field]?.() || humanize(field);
const labelForEntity = (entity) => entityLabels[entity]?.() || humanize(entity);

const translateExact = (message) => exactMessages.get(message)?.();

const translatePattern = (message) => {
  const patterns = [
    {
      regex: /^([A-Za-z0-9_ ]+?) validation failed: (.+)$/i,
      run: (match) => {
        const details = match[2]
          .split(/,\s*/)
          .map((part) => translatePattern(part.trim()) || part.trim())
          .join("، ");
        return details || t("errors.invalidInput");
      },
    },
    {
      regex: /^([^:]+):\s*Path `([^`]+)` is required\.?$/i,
      run: (match) => t("errors.fieldRequired", { field: labelForField(match[1].trim() || match[2]) }),
    },
    {
      regex: /^([^:]+):\s*Path `([^`]+)` is invalid\.?$/i,
      run: (match) => t("errors.fieldInvalid", { field: labelForField(match[1].trim() || match[2]) }),
    },
    {
      regex: /^Validation failed: (.+)$/i,
      run: (match) => translatePattern(match[1]) || t("errors.invalidInput"),
    },
    {
      regex: /^Invalid input data\.\s*(.+)$/i,
      run: (match) => translatePattern(match[1]) || t("errors.invalidInput"),
    },
    {
      regex: /^Duplicate field value:\s*(.+?)\.?\s*Please use another value!?$/i,
      run: (match) => t("errors.alreadyExists", { field: humanize(match[1]) }),
    },
    {
      regex: /^Invalid ([^:]+): (.+)\.?$/i,
      run: (match) => t("errors.fieldInvalid", { field: labelForField(match[1]) }),
    },
    {
      regex: /^Path `([^`]+)` is required\.?$/i,
      run: (match) => t("errors.fieldRequired", { field: labelForField(match[1]) }),
    },
    {
      regex: /^Path `([^`]+)` is invalid\.?$/i,
      run: (match) => t("errors.fieldInvalid", { field: labelForField(match[1]) }),
    },
    {
      regex: /^(.+?) is required(?: for .+)?\.?$/i,
      run: (match) => t("errors.fieldRequired", { field: labelForField(match[1]) }),
    },
    {
      regex: /^(.+?) must be a valid (.+)\.?$/i,
      run: (match) => t("errors.fieldInvalid", { field: labelForField(match[1]) }),
    },
    {
      regex: /^(.+?) must be one of .+$/i,
      run: (match) => t("errors.fieldInvalid", { field: labelForField(match[1]) }),
    },
    {
      regex: /^(.+?) must be different from (.+)\.?$/i,
      run: (match) => t("errors.fieldMustBeDifferent", { field: labelForField(match[1]) }),
    },
    {
      regex: /^(.+?) cannot exceed (\d+) characters\.?$/i,
      run: (match) => t("errors.maxLengthExceeded", { field: labelForField(match[1]), max: match[2] }),
    },
    {
      regex: /^(.+?) must be at least (\d+) characters\.?$/i,
      run: (match) => t("errors.minLengthRequired", { field: labelForField(match[1]), min: match[2] }),
    },
    {
      regex: /^(?:No|Couldn't find|Could not find|Can'?t find) (.+?)(?: found)?(?: with that ID)?\.?$/i,
      run: (match) => t("errors.notFound", { entity: labelForEntity(match[1]) }),
    },
    {
      regex: /not found(?: with ID| with id|)?(?:[: ]+(.+))?$/i,
      run: (match) => t("errors.notFound", { entity: labelForEntity(match[1] || "item") }),
    },
    {
      regex: /(?:You are not allowed|You do not have permission|Forbidden, you don't have access|Unauthorized)/i,
      run: () => t("errors.permissionDenied"),
    },
    {
      regex: /(?:Authentication required|User not authenticated|Not authenticated|Access token required|Access token expired|Refresh token is expired|Refresh token not found)/i,
      run: () => t("errors.authenticationRequired"),
    },
    {
      regex: /Password(?: and password confirmation don't match|s do not match)/i,
      run: () => t("errors.passwordMismatch"),
    },
    {
      regex: /(?:Not enough balance|insufficient balance)/i,
      run: () => t("errors.insufficientBalance"),
    },
    {
      regex: /(?:Not an image|Please upload only images)/i,
      run: () => t("errors.imageOnly"),
    },
    {
      regex: /(?:No file uploaded|File is required|A file is required)/i,
      run: () => t("errors.fileRequired"),
    },
    {
      regex: /(?:Invalid role selected|Invalid role|Invalid or missing role)/i,
      run: () => t("errors.invalidRole"),
    },
    {
      regex: /(?:Failed to|Error (?:fetching|loading|creating|updating|deleting|saving|recording|purchasing|uploading|calculating|checking|generating|submitting)) (.+)/i,
      run: (match) => t("errors.operationFailed", { entity: humanize(match[1]) }),
    },
    {
      regex: /^(Failed to|Error) (fetch|load|create|update|delete|save|record|purchase|upload|calculate|check|generate|submit) (.+)$/i,
      run: (match) => {
        const verb = match[2].toLowerCase();
        const entity = humanize(match[3]);
        return t(`errors.${verb}Failed`, { entity });
      },
    },
    {
      regex: /^(Failed to|Error) .*$/i,
      run: () => t("errors.operationFailed"),
    },
  ];

  for (const { regex, run } of patterns) {
    const match = message.match(regex);
    if (match) return run(match);
  }

  return null;
};

const normalizeMessageInput = (input) => {
  if (Array.isArray(input)) {
    return input
      .flatMap((item) => {
        const translated = translateErrorMessage(item);
        return translated ? [translated] : [];
      })
      .filter(Boolean)
      .join("، ");
  }

  if (input && typeof input === "object") {
    if (Array.isArray(input.message)) return normalizeMessageInput(input.message);
    if (typeof input.message === "string") return input.message;
    if (typeof input.error === "string") return input.error;
  }

  return typeof input === "string" ? input.trim() : "";
};

export const translateErrorMessage = (input, fallback = "") => {
  const message = normalizeMessageInput(input);
  if (message) {
    const exact = translateExact(message);
    if (exact) return exact;

    const patternResult = translatePattern(message);
    if (patternResult) return patternResult;

    if (message === i18n.t(message, { ns: COMMON_NS, defaultValue: message })) {
      // If the string already looks localized, keep it as-is.
      const hasArabic = /[\u0600-\u06FF]/.test(message);
      if (hasArabic) return message;
    }
  }

  const fallbackMessage = normalizeMessageInput(fallback);
  if (fallbackMessage) {
    const exactFallback = translateExact(fallbackMessage);
    if (exactFallback) return exactFallback;

    const fallbackPattern = translatePattern(fallbackMessage);
    if (fallbackPattern) return fallbackPattern;
  }

  return t("errors.unexpected");
};

export const installAxiosErrorTranslation = () => {
  if (axios.__fekraErrorTranslationInstalled) return;
  axios.__fekraErrorTranslationInstalled = true;

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      const translated = translateErrorMessage(
        error?.response?.data?.message || error?.response?.data?.error || error?.message,
        error?.message
      );

      if (error?.response?.data && typeof error.response.data === "object") {
        error.response.data.message = translated;
        error.response.data.error = translated;
      }

      error.message = translated;
      error.error = translated;
      return Promise.reject(error);
    }
  );
};
