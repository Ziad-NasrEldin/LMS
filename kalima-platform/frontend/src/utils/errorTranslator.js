import axios from "axios";
import i18n from "../components/i18n";

const COMMON_NS = "common";
const t = (key, options = {}) => i18n.t(key, { ns: COMMON_NS, ...options });

const exactMessages = new Map([
  ["Unauthorized", () => t("errors.unauthorized")],
  ["Forbidden", () => t("errors.forbidden")],
  ["Access token expired", () => t("errors.sessionExpired")],
  ["Session has been replaced by a newer login. Please login again.", () => t("errors.sessionExpired")],
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
  ["No active impersonation session found", () => t("errors.noActiveImpersonationSession")],
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
  ["Target user not found", () => t("errors.userNotFound")],
  ["Invalid input data", () => t("errors.invalidInput")],
  ["Something went wrong!", () => t("errors.unexpected")],
  ["Something went wrong", () => t("errors.unexpected")],
  ["Unknown error occurred", () => t("errors.unknown")],
  ["An unexpected error occurred", () => t("errors.unexpected")],
  ["Network Error", () => t("errors.network")],
  ["Refresh token not found, please login again", () => t("errors.refreshTokenNotFound")],
  ["Refresh token is expired, please login again", () => t("errors.refreshTokenExpired")],
  ["Refresh token is expired, plese login again", () => t("errors.refreshTokenExpired")],
  ["Access token required", () => t("errors.accessTokenRequired")],
  ["You should provide one of these account types: parent, teacher, student", () => t("errors.invalidAccountType")],
  ["Unsupported file type. Please upload a CSV or Excel file", () => t("errors.invalidFileTypeCSV")],
  ["Invalid file type. Please upload a CSV or Excel document", () => t("errors.invalidFileTypeCSV")],
  ["No valid data found in the uploaded file", () => t("errors.noValidData")],
  ["Creation failed", () => t("errors.creationFailed")],
  ["Invalid level or stage", () => t("errors.invalidLevel")],
  ["Invalid level", () => t("errors.invalidLevel")],
  ["Subject is required for teacher accounts", () => t("errors.teacherSubjectRequired")],
  ["Teaching location (teachesAtType) is required for teacher accounts", () => t("errors.teacherLocationRequired")],
  ["Only image files are allowed for promo templates", () => t("errors.imageOnly")],
  ["Please upload only images", () => t("errors.imageOnly")],
  ["Invalid image file. Please upload a valid image.", () => t("errors.imageOnly")],
  ["File too large", () => "File size must be less than 5MB"],
  ["Image size must be less than 5MB", () => "Image size must be less than 5MB"],
  ["Link attachments should be opened directly from the stored URL", () => t("errors.directAttachmentLinkOnly")],
  ["Attachment URL is invalid or not publicly reachable", () => t("errors.invalidAttachmentUrl")],
  ["Please provide lectureId and content", () => t("errors.lectureCommentFieldsRequired")],
  ["Reply must belong to the same lecture", () => t("errors.commentLectureMismatch")],
  ["You must purchase the lecture to post a comment", () => t("errors.commentPurchaseRequired")],
  ["Comment content cannot be empty", () => t("errors.commentEmpty")],
  ["You already have an active promo code", () => t("errors.activePromoCodeExists")],
  ["No codes deleted. They may not exist or have been redeemed.", () => t("errors.noCodesDeleted")],
  ["This code is not properly configured", () => t("errors.invalidPromoCodeConfiguration")],
  ["Only students and parents can access purchased course containers", () => t("errors.permissionDenied")],
  ["Only parents can access their children's data", () => t("errors.permissionDenied")],
  ["Purchase does not belong to this student", () => t("errors.permissionDenied")],
  ["Referral code already set and cannot be changed.", () => t("errors.referralAlreadySet")],
  ["OTP expired or not found. Please request a new one", () => t("errors.otpExpired")],
  ["Invalid OTP", () => t("errors.invalidOtp")],
  ["The selected level is inactive", () => t("errors.levelInactive")],
  ["Selected grade does not belong to the selected stage", () => t("errors.gradeStageMismatch")],
  ["Selected grade does not belong to the selected stage.", () => t("errors.gradeStageMismatch")],
  ["Item is not associated with any lecturer", () => t("errors.itemLecturerAssociationMissing")],
  ["You are not allowed to purchase this item", () => t("errors.itemPurchaseNotAllowed")],
  ["This course is restricted to students in the exact same grade level only", () => t("errors.studentSameGradeRestriction")],
  ["This course is restricted to parents with children in the same grade level only", () => t("errors.parentSameGradeRestriction")],
  ["This lecture is no longer available for purchase", () => t("errors.limitedLectureExpired")],
  ["Type must be either 'exam' or 'homework'", () => t("errors.invalidAssessmentType")],
  [
    "Master assessment sheet is not configured on the server. Select an existing exam configuration or configure the master sheet before creating an exam-gated lecture.",
    () => t("errors.masterAssessmentSheetMissingExamCreate"),
  ],
  [
    "Master assessment sheet is not configured on the server. Select an existing homework configuration or configure the master sheet before creating a homework-gated lecture.",
    () => t("errors.masterAssessmentSheetMissingHomeworkCreate"),
  ],
  [
    "Master assessment sheet is not configured on the server. Select an existing exam configuration or configure the master sheet before updating the exam form URL.",
    () => t("errors.masterAssessmentSheetMissingExamUpdate"),
  ],
  [
    "Master assessment sheet is not configured on the server. Select an existing homework configuration or configure the master sheet before updating the homework form URL.",
    () => t("errors.masterAssessmentSheetMissingHomeworkUpdate"),
  ],
  ["Container has no children to calculate duration from.", () => t("errors.containerDurationChildrenMissing")],
  ["Please log in as a lecturer or assistant to access your containers.", () => t("errors.containersAccessRoleRequired")],
  ["Failed to fetch user data", () => t("errors.userDataFetchFailed")],
  ["Failed to upload profile picture", () => t("errors.profileUploadFailed")],
  ["An error occurred while fetching your information", () => t("errors.userInfoFetchFailed")],
  ["An unexpected error occurred while uploading", () => t("errors.uploadUnexpected")],
  ["Failed to update", () => t("errors.updateFailed", { entity: t("entities.data") })],
  ["Failed to load linked students", () => t("errors.linkedStudentsLoadFailed")],
  ["Failed to load linked students.", () => t("errors.linkedStudentsLoadFailed")],
  ["Failed to load overview data", () => t("errors.overviewLoadFailed")],
  ["Failed to load promo codes", () => t("errors.promoCodesLoadFailed")],
  ["Failed to load promo codes.", () => t("errors.promoCodesLoadFailed")],
  ["File size must be less than 1GB", () => t("errors.fileTooLarge1GB")],
  ["Please fill all required fields", () => t("errors.allRequiredFields")],
  ["Please enter a course description", () => t("errors.courseDescriptionRequired")],
  ["Please enter a course goal", () => t("errors.courseGoalRequired")],
  ["Please enter a price greater than zero for the paid course", () => t("errors.paidCoursePriceRequired")],
  ["Please select a parent container", () => t("errors.parentContainerRequired")],
  ["Please enter a container name", () => t("errors.containerNameRequired")],
  ["Please enter a lecture link", () => t("errors.lectureLinkRequired")],
  ["Please provide an exam form URL", () => t("errors.examFormUrlRequired")],
  ["Please provide a homework form URL", () => t("errors.homeworkFormUrlRequired")],
  // Review-specific errors
  ["Please provide containerId, rating, and comment", () => t("errors.reviewMissingFields")],
  ["Rating must be between 1 and 5", () => t("errors.reviewRatingRange")],
  ["Course not found", () => t("errors.reviewCourseNotFound")],
  ["You can only review courses you have purchased", () => t("errors.reviewNotPurchased")],
  ["You have already reviewed this course. Please update your existing review instead.", () => t("errors.reviewAlreadyExists")],
  ["Review submitted successfully and is pending approval", () => t("errors.reviewPendingApproval")],
  ["Unauthorized - User role must be Student", () => t("errors.reviewStudentOnly")],
]);

const fieldLabels = {
  hobby: () => t("fields.hobby"),
  level: () => t("fields.level"),
  parentPhoneNumber: () => t("fields.parentPhoneNumber"),
  parentPhoneRelation: () => t("fields.parentPhoneRelation"),
  parentPhoneNumber2: () => t("fields.additionalParentPhone"),
  parentPhoneRelation2: () => t("fields.additionalParentRelation"),
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
  comment: () => t("fields.comment"),
  rating: () => t("fields.rating"),
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
  const compoundParts = String(message || "")
    .split(/\s*,\s*(?=(?:"[^"]+"|[A-Za-z_][A-Za-z0-9_]*))/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (compoundParts.length > 1) {
    const translatedParts = compoundParts.map((part) => {
      const exact = translateExact(part);
      if (exact) return exact;
      return translatePattern(part) || part;
    });

    if (translatedParts.some((part, index) => part !== compoundParts[index])) {
      return translatedParts.join("، ");
    }
  }

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
      regex: /^Path `(.+?)` \(`.+?`\) is shorter than the minimum allowed length \((\d+)\)\.?$/i,
      run: (match) => t("errors.minLengthRequired", { field: labelForField(match[1]), min: match[2] }),
    },
    {
      regex: /^Path `(.+?)` is shorter than the minimum allowed length \((\d+)\)\.?$/i,
      run: (match) => t("errors.minLengthRequired", { field: labelForField(match[1]), min: match[2] }),
    },
    {
      regex: /^Path `(.+?)` is shorter than the minimum allowed length \((\d+)\)\.?$/i,
      run: (match) => t("errors.minLengthRequired", { field: labelForField(match[1]), min: match[2] }),
    },
    // Review-specific validation errors
    {
      regex: /^Path `rating` is required\.?$/i,
      run: () => t("errors.reviewRatingRequired"),
    },
    {
      regex: /^Path `rating` \(?(\d+)?\) is less than minimum allowed value \((\d+)\)\.?$/i,
      run: (match) => t("errors.reviewRatingMin", { min: match[2] }),
    },
    {
      regex: /^Path `rating` \(?(\d+)?\) is greater than maximum allowed value \((\d+)\)\.?$/i,
      run: (match) => t("errors.reviewRatingMax", { max: match[2] }),
    },
    {
      regex: /^Path `comment` is required\.?$/i,
      run: () => t("errors.reviewCommentRequired"),
    },
    {
      regex: /^Path `comment` \(`.+?`\) is shorter than the minimum allowed length \((\d+)\)\.?$/i,
      run: (match) => t("errors.minLengthRequired", { field: t("fields.comment"), min: match[1] }),
    },
    {
      regex: /^Path `comment` is shorter than the minimum allowed length \((\d+)\)\.?$/i,
      run: (match) => t("errors.minLengthRequired", { field: t("fields.comment"), min: match[1] }),
    },
    {
      regex: /^Path `comment` \(`.+?`\) is longer than the maximum allowed length \((\d+)\)\.?$/i,
      run: (match) => t("errors.maxLengthExceeded", { field: t("fields.comment"), max: match[1] }),
    },
    {
      regex: /^Path `comment` is longer than the maximum allowed length \((\d+)\)\.?$/i,
      run: (match) => t("errors.maxLengthExceeded", { field: t("fields.comment"), max: match[1] }),
    },
    {
      regex: /^Path `container` is required\.?$/i,
      run: () => t("errors.reviewContainerRequired"),
    },
    {
      regex: /^Path `student` is required\.?$/i,
      run: () => t("errors.reviewStudentRequired"),
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
      regex: /^"([^"]+)" is not allowed to be empty\.?$/i,
      run: (match) => t("errors.fieldRequired", { field: labelForField(match[1]) }),
    },
    {
      regex: /^Path `([^`]+)` is invalid\.?$/i,
      run: (match) => t("errors.fieldInvalid", { field: labelForField(match[1]) }),
    },
    {
      regex: /^"([^"]+)" is not allowed\.?$/i,
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
      regex: /^"([^"]+)" must be one of \[(.+)\]\.?$/i,
      run: (match) => t("errors.fieldInvalid", { field: labelForField(match[1]) }),
    },
    {
      regex: /^sortOrder must be a number\.?$/i,
      run: () => t("errors.fieldInvalid", { field: labelForField("sortOrder") }),
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
      regex: /^\[([^\]]+)\](?: must be)? (.+)$/i,
      run: (match) => {
        const fieldName = match[1].replace(/\[\d+\]/g, "");
        return t("errors.fieldInvalid", { field: labelForField(fieldName) });
      },
    },
    {
      regex: /^(.+?)\[(\d+)\](?: must be)? (.+)$/i,
      run: (match) => {
        const fieldName = match[1];
        return t("errors.fieldInvalid", { field: labelForField(fieldName) });
      },
    },
    {
      regex: /^"([^"]+)" must be a string\.?$/i,
      run: (match) => t("errors.fieldMustBeString", { field: labelForField(match[1]) }),
    },
    {
      regex: /^"([^"]+)" must be a number\.?$/i,
      run: (match) => t("errors.fieldMustBeNumber", { field: labelForField(match[1]) }),
    },
    {
      regex: /^"([^"]+)" must be an array\.?$/i,
      run: (match) => t("errors.fieldMustBeArray", { field: labelForField(match[1]) }),
    },
    {
      regex: /^"([^"]+)\[(\d+)\]" must be a string\.?$/i,
      run: (match) => {
        const fieldName = match[1];
        return t("errors.fieldMustBeString", { field: labelForField(fieldName) });
      },
    },
    {
      regex: /^"([^"]+)\[(\d+)\]" must be a number\.?$/i,
      run: (match) => {
        const fieldName = match[1];
        return t("errors.fieldMustBeNumber", { field: labelForField(fieldName) });
      },
    },
    {
      regex: /^"([^"]+)\[(\d+)\]" must be of type (string|number|array|object)\.?$/i,
      run: (match) => t("errors.fieldInvalid", { field: labelForField(match[1]) }),
    },
    {
      regex: /^"([^"]+)" must be of type (string|number|array|object)\.?$/i,
      run: (match) => t("errors.fieldInvalid", { field: labelForField(match[1]) }),
    },
    {
      regex: /^Path `(.+?)` \(`.+?`\) is shorter than the minimum allowed length \((\d+)\)\.?$/i,
      run: (match) => t("errors.minLengthRequired", { field: labelForField(match[1]), min: match[2] }),
    },
    {
      regex: /^Path `(.+?)` is shorter than the minimum allowed length \((\d+)\)\.?$/i,
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
      regex: /Session has been replaced by a newer login/i,
      run: () => t("errors.sessionExpired"),
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
      regex: /Not enough balance\. Required: (\d+), Available lecturer balance: ([\d.]+), Available general balance: ([\d.]+)/i,
      run: (match) => {
        const required = parseInt(match[1]) || 0;
        const lecturerBalance = parseFloat(match[2]) || 0;
        const generalBalance = parseFloat(match[3]) || 0;
        return t("errors.insufficientBalanceDetailed", { required, lecturerBalance, generalBalance });
      },
    },
    {
      regex: /(?:Not an image|Please upload only images)/i,
      run: () => t("errors.imageOnly"),
    },
    {
      regex: /^Item is not associated with any lecturer\.?$/i,
      run: () => t("errors.itemLecturerAssociationMissing"),
    },
    {
      regex: /^You are not allowed to purchase this item\.?$/i,
      run: () => t("errors.itemPurchaseNotAllowed"),
    },
    {
      regex: /^This course is restricted to students in the exact same grade level only\.?$/i,
      run: () => t("errors.studentSameGradeRestriction"),
    },
    {
      regex: /^This course is restricted to parents with children in the same grade level only\.?$/i,
      run: () => t("errors.parentSameGradeRestriction"),
    },
    {
      regex: /^Invalid image type(?: for profile picture)?\.?$/i,
      run: () => t("errors.imageOnly"),
    },
    {
      regex: /^Invalid document type\.?$/i,
      run: () => t("errors.invalidInput"),
    },
    {
      regex: /^Invalid file type for payment screenshot\.?$/i,
      run: () => t("errors.invalidInput"),
    },
    {
      regex: /^Invalid file type for field:\s*(.+)$/i,
      run: (match) => t("errors.fieldInvalid", { field: labelForField(match[1] || "file") }),
    },
    {
      regex: /^Invalid .+ link\. Please provide a valid public HTTP\/HTTPS URL$/i,
      run: () => t("errors.invalidPublicUrl"),
    },
    {
      regex: /^Form URL must be a valid public HTTP\/HTTPS URL$/i,
      run: () => t("errors.invalidPublicUrl"),
    },
    {
      regex: /^Image dimensions must be exactly (.+) px$/i,
      run: (match) => t("errors.imageDimensionsRequired", { dimensions: `${match[1]} px` }),
    },
    {
      regex: /^This route is not for password updates\. Please use \/update\/password$/i,
      run: () => t("errors.passwordChangeRouteHint"),
    },
    {
      regex: /^The selected level must be a (.+)$/i,
      run: (match) => t("errors.fieldInvalid", { field: match[1] }),
    },
    {
      regex: /(?:No file uploaded|File is required|A file is required)/i,
      run: () => t("errors.fileRequired"),
    },
    {
      regex: /Invalid (?:level|stage)(?: or stage)?:?\s*(.+)/i,
      run: (match) => t("errors.invalidLevelWithValue", { value: match[1] || "" }),
    },
    {
      regex: /(?:Invalid role selected|Invalid role|Invalid or missing role)/i,
      run: () => t("errors.invalidRole"),
    },
    {
      regex: /Couldn't find a user with this (email|phone number) and password/i,
      run: () => t("errors.invalidCredentials"),
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
    {
      regex: /Creation failed: (.+)/i,
      run: (match) => t("errors.creationFailedWithDetails", { details: match[1] }),
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

  if (message) {
    return message;
  }

  if (fallbackMessage) {
    return fallbackMessage;
  }

  return t("errors.unexpected");
};

export const installAxiosErrorTranslation = () => {
  if (axios.__fekraErrorTranslationInstalled) return;
  axios.__fekraErrorTranslationInstalled = true;

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      const rawMessage = normalizeMessageInput(
        error?.response?.data?.message || error?.response?.data?.error || error?.message
      );
      const translated = translateErrorMessage(
        rawMessage,
        error?.message
      );

      if (error?.response?.data && typeof error.response.data === "object") {
        if (typeof error.response.data.message === "string") {
          error.response.data.rawMessage = error.response.data.message;
        }
        if (typeof error.response.data.error === "string") {
          error.response.data.rawError = error.response.data.error;
        }
        error.response.data.translatedMessage = translated;
      }

      error.rawMessage = rawMessage;
      error.translatedMessage = translated;
      error.message = translated;
      error.error = translated;
      return Promise.reject(error);
    }
  );
};
