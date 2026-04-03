import { translateErrorMessage } from "../../utils/errorTranslator";

const CODE_TO_FIELD_VALIDATION_KEY = {
  SIGNUP_EMAIL_REQUIRED: "required",
  SIGNUP_EMAIL_ALREADY_EXISTS: "emailExists",
  SIGNUP_PASSWORD_TOO_SHORT: "passwordRequirements",
  SIGNUP_PASSWORD_MISMATCH: "passwordsMismatch",
  SIGNUP_PHONE_REQUIRED: "required",
  SIGNUP_PHONE_INVALID: "phoneInvalid",
  SIGNUP_PHONE_ALREADY_EXISTS: "phoneExists",
  SIGNUP_PHONE2_INVALID: "phoneInvalid",
  SIGNUP_PHONE2_DUPLICATE: "phoneExists",
  SIGNUP_GOVERNMENT_REQUIRED: "required",
  SIGNUP_GOVERNMENT_INVALID: "governmentInvalid",
  SIGNUP_ADMIN_ZONE_REQUIRED: "required",
  SIGNUP_ADMIN_ZONE_INVALID: "administrationZoneInvalid",
  SIGNUP_TEACHER_SUBJECT_REQUIRED: "subjectRequired",
  SIGNUP_TEACHER_LEVEL_REQUIRED: "required",
  SIGNUP_TEACHER_LEVEL_INVALID: "levelInvalid",
  SIGNUP_TEACHER_LEVEL_INACTIVE: "levelInvalid",
  SIGNUP_TEACHER_LEVEL_KIND_INVALID: "levelInvalid",
  SIGNUP_TEACHER_TEACHES_AT_TYPE_REQUIRED: "teachesAtType",
  SIGNUP_TEACHER_CENTERS_REQUIRED: "centers",
  SIGNUP_TEACHER_SCHOOL_REQUIRED: "school",
  SIGNUP_TEACHER_SOCIAL_MEDIA_PLATFORM_INVALID: "socialMediaPlatform",
  SIGNUP_TEACHER_SOCIAL_MEDIA_NOT_ARRAY: "socialMediaPlatform",
  SIGNUP_TEACHER_PHONE2_SAME_AS_PHONE1: "phoneMustDiffer",
  SIGNUP_PARENT_PROFESSION_REQUIRED: "professionRequired",
  SIGNUP_PARENT_LEVEL_INVALID: "levelInvalid",
  SIGNUP_PARENT_LEVEL_INACTIVE: "levelInvalid",
  SIGNUP_STUDENT_STAGE_REQUIRED: "required",
  SIGNUP_STUDENT_STAGE_INVALID: "stageInvalid",
  SIGNUP_STUDENT_LEVEL_REQUIRED: "required",
  SIGNUP_STUDENT_LEVEL_INVALID: "levelInvalid",
  SIGNUP_STUDENT_LEVEL_STAGE_MISMATCH: "levelStageMismatch",
  SIGNUP_STUDENT_HOBBY_REQUIRED: "hobbiesRequired",
  SIGNUP_STUDENT_HOBBY_INVALID: "hobbyInvalid",
  SIGNUP_STUDENT_PARENT_PHONE_REQUIRED: "parentPhoneRequired",
  SIGNUP_STUDENT_PARENT_PHONE_INVALID: "phoneInvalid",
  SIGNUP_STUDENT_PARENT_RELATION_REQUIRED: "parentRelationRequired",
  SIGNUP_STUDENT_PARENT_RELATION_INVALID: "parentRelationInvalid",
  SIGNUP_STUDENT_PARENT2_PHONE_REQUIRED: "additionalParentPhoneRequired",
  SIGNUP_STUDENT_PARENT2_PHONE_INVALID: "phoneInvalid",
  SIGNUP_STUDENT_PARENT2_RELATION_REQUIRED: "additionalParentRelationRequired",
  SIGNUP_STUDENT_PARENT2_RELATION_INVALID: "additionalParentRelationInvalid",
  SIGNUP_PROFILE_PIC_INVALID_TYPE: "profilePicInvalidType",
  SIGNUP_PROFILE_PIC_TOO_LARGE: "profilePicTooLarge",
  SIGNUP_CHILD_REFERENCE_INVALID: "children",
  SIGNUP_INVALID_ROLE: "invalidRole",
};

const codeToValidationKey = (code) => CODE_TO_FIELD_VALIDATION_KEY[code] || "invalidData";

const LEGACY_ERROR_KEY_TO_VALIDATION_KEY = {
  required: "required",
  invalid: "invalidInput",
  invalidInput: "invalidInput",
  duplicate: "duplicate",
  emailExists: "emailExists",
  phoneExists: "phoneExists",
};

const FIELD_ALIASES = {
  name: "fullName",
  zone: "administrationZone",
};

const toFieldName = (field) => {
  const value = String(field || "").trim();
  if (!value) return "";
  const topLevelField = value.split(".")[0];
  return FIELD_ALIASES[topLevelField] || topLevelField;
};

const translateSignupCode = ({ code, role, message, t }) => {
  const roleKey = `apiErrors.${code}.${role}`;
  const roleText = t(roleKey);
  if (roleText !== roleKey) return roleText;

  const defaultKey = `apiErrors.${code}.default`;
  const defaultText = t(defaultKey);
  if (defaultText !== defaultKey) return defaultText;

  if (typeof message === "string" && message.trim()) return message;
  return t("errors.unexpectedError");
};

const toLegacyValidationKey = (errorKey, field) => {
  const normalized = String(errorKey || "").trim().replace(/^validation\./i, "");
  if (!normalized) return "";

  if (normalized === "duplicate") {
    if (field === "email") return "emailExists";
    if (["phoneNumber", "phoneNumber2", "parentPhoneNumber", "parentPhoneNumber2"].includes(field)) {
      return "phoneExists";
    }
  }

  return LEGACY_ERROR_KEY_TO_VALIDATION_KEY[normalized] || normalized;
};

export const mapSignupApiError = ({ error, role, t }) => {
  const normalizedRole = String(role || "").trim().toLowerCase();
  const responseData = error?.response?.data || {};
  const fallbackMessage =
    responseData?.translatedMessage ||
    responseData?.rawMessage ||
    responseData?.message ||
    error?.translatedMessage ||
    error?.rawMessage ||
    error?.message ||
    "";

  const explicitIssues = Array.isArray(responseData?.errors) ? responseData.errors : [];
  const fallbackIssue = responseData?.code || responseData?.field || responseData?.errorKey
    ? [
        {
          code: responseData.code,
          field: responseData.field,
          errorKey: responseData.errorKey,
          message: fallbackMessage,
        },
      ]
    : [];

  const issues = explicitIssues.length > 0 ? explicitIssues : fallbackIssue;

  const fieldErrors = {};
  const summaryMessages = [];

  if (issues.length > 0) {
    for (const issue of issues) {
      const code = String(issue?.code || responseData?.code || "").trim();
      const field = toFieldName(issue?.field || responseData?.field);
      const legacyValidationKey = toLegacyValidationKey(issue?.errorKey || responseData?.errorKey, field);

      let summaryMessage = "";
      if (code) {
        summaryMessage = translateSignupCode({
          code,
          role: normalizedRole,
          message: issue?.message || fallbackMessage,
          t,
        });
      } else if (legacyValidationKey) {
        summaryMessage = t(`validation.${legacyValidationKey}`);
      } else {
        summaryMessage = translateErrorMessage(issue?.message || fallbackMessage, t("errors.unexpectedError"));
      }

      if (summaryMessage && !summaryMessages.includes(summaryMessage)) {
        summaryMessages.push(summaryMessage);
      }

      if (field) {
        if (code) {
          fieldErrors[field] = codeToValidationKey(code);
        } else if (legacyValidationKey) {
          fieldErrors[field] = legacyValidationKey;
        } else {
          fieldErrors[field] = "invalidInput";
        }
      }
    }
  } else {
    const summaryMessage =
      fallbackMessage && fallbackMessage !== "Network Error"
        ? translateErrorMessage(fallbackMessage, t("errors.unexpectedError"))
        : t("errors.networkError");
    summaryMessages.push(summaryMessage);
  }

  if (summaryMessages.length === 0) {
    summaryMessages.push(t("errors.unexpectedError"));
  }

  return {
    summaryMessages,
    fieldErrors,
    requestId: responseData?.requestId,
    httpStatus: error?.response?.status || responseData?.statusCode,
  };
};
