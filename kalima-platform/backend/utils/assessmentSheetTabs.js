const AppError = require("./appError");

const extractGoogleApiMessage = (error) => {
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message ||
    null
  );
};

const wrapSheetApiError = (error, fallbackMessage, statusCode = 500) => {
  if (error?.isOperational) {
    return error;
  }

  const apiMessage = extractGoogleApiMessage(error);
  const message = apiMessage ? `${fallbackMessage}: ${apiMessage}` : fallbackMessage;
  return new AppError(message, statusCode);
};

const FORM_RESPONSES_TAB_PATTERN = /^Form Responses(?: \d+)?$/i;
const FORM_RESPONSES_UNDERSCORE_TAB_PATTERN = /^Form_Responses(?: \d+)?$/i;

const normalizeSheetTabName = (value) => {
  const normalized = String(value ?? "").trim();
  return normalized || null;
};

const isLegacyFormResponsesTab = (value) => {
  const normalized = normalizeSheetTabName(value);
  if (!normalized) return false;

  return (
    FORM_RESPONSES_TAB_PATTERN.test(normalized) ||
    FORM_RESPONSES_UNDERSCORE_TAB_PATTERN.test(normalized)
  );
};

const listSpreadsheetTabs = async ({ sheets, sheetId }) => {
  if (!sheetId || typeof sheets?.spreadsheets?.get !== "function") {
    return [];
  }

  let response;
  try {
    response = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      fields: "sheets(properties(sheetId,title,index))",
    });
  } catch (error) {
    throw wrapSheetApiError(
      error,
      "Unable to read tabs from the master assessment sheet. Verify the configured spreadsheet ID and service-account access"
    );
  }

  return (response?.data?.sheets || [])
    .map((sheetMeta) => {
      const title = normalizeSheetTabName(sheetMeta?.properties?.title);
      const index = Number(sheetMeta?.properties?.index);
      const numericSheetId = Number(sheetMeta?.properties?.sheetId);

      return {
        title,
        index: Number.isFinite(index) ? index : Number.MAX_SAFE_INTEGER,
        sheetId: Number.isFinite(numericSheetId) ? numericSheetId : null,
      };
    })
    .filter((sheetMeta) => Boolean(sheetMeta.title))
    .sort((left, right) => {
      if (left.index !== right.index) {
        return left.index - right.index;
      }

      return left.title.localeCompare(right.title);
    });
};

const getUnclaimedFormResponseTabs = ({ tabs, claimedTabNames = [] }) => {
  const claimed = new Set(
    claimedTabNames.map(normalizeSheetTabName).filter(Boolean)
  );

  return tabs.filter(
    (tab) => isLegacyFormResponsesTab(tab.title) && !claimed.has(tab.title)
  );
};

const renameSpreadsheetTab = async ({ sheets, sheetId, sourceSheetId, nextTitle }) => {
  const normalizedTitle = normalizeSheetTabName(nextTitle);
  if (!normalizedTitle) {
    throw new AppError("Target spreadsheet tab name is required", 400);
  }

  if (!Number.isFinite(Number(sourceSheetId))) {
    throw new AppError("Spreadsheet tab could not be resolved for rename", 500);
  }

  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [
          {
            updateSheetProperties: {
              properties: {
                sheetId: Number(sourceSheetId),
                title: normalizedTitle,
              },
              fields: "title",
            },
          },
        ],
      },
    });
  } catch (error) {
    throw wrapSheetApiError(
      error,
      "Unable to rename the response tab in the master assessment sheet. The service account likely needs Editor access"
    );
  }

  return normalizedTitle;
};

const addSpreadsheetTab = async ({ sheets, sheetId, title }) => {
  const normalizedTitle = normalizeSheetTabName(title);
  if (!normalizedTitle) {
    throw new AppError("Spreadsheet tab name is required", 400);
  }

  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: normalizedTitle,
              },
            },
          },
        ],
      },
    });
  } catch (error) {
    throw wrapSheetApiError(
      error,
      "Unable to create a new response tab in the master assessment sheet. The service account likely needs Editor access"
    );
  }

  return normalizedTitle;
};

const ensureAssessmentSheetTab = async ({
  sheets,
  sheetId,
  desiredTabName,
  currentTabName = null,
  claimedTabNames = [],
  preferredFallbackTitle = null,
  preferNewestUnclaimed = false,
  createIfMissing = false,
}) => {
  const normalizedDesired = normalizeSheetTabName(desiredTabName);
  const normalizedCurrent = normalizeSheetTabName(currentTabName);

  if (!normalizedDesired) {
    throw new AppError("Assessment spreadsheet tab name is required", 400);
  }

  const tabs = await listSpreadsheetTabs({ sheets, sheetId });
  const desiredTab = tabs.find((tab) => tab.title === normalizedDesired);
  if (desiredTab) {
    return {
      title: normalizedDesired,
      action: "exists",
      tabs,
    };
  }

  if (normalizedCurrent) {
    const currentTab = tabs.find((tab) => tab.title === normalizedCurrent);
    if (currentTab) {
      await renameSpreadsheetTab({
        sheets,
        sheetId,
        sourceSheetId: currentTab.sheetId,
        nextTitle: normalizedDesired,
      });

      return {
        title: normalizedDesired,
        previousTitle: normalizedCurrent,
        action: "renamed-current",
        tabs,
      };
    }
  }

  const unclaimedTabs = getUnclaimedFormResponseTabs({ tabs, claimedTabNames });
  const preferredFallback = normalizeSheetTabName(preferredFallbackTitle);
  if (preferredFallback) {
    const preferredTab = unclaimedTabs.find((tab) => tab.title === preferredFallback);
    if (preferredTab) {
      await renameSpreadsheetTab({
        sheets,
        sheetId,
        sourceSheetId: preferredTab.sheetId,
        nextTitle: normalizedDesired,
      });

      return {
        title: normalizedDesired,
        previousTitle: preferredTab.title,
        action: "renamed-preferred-fallback",
        tabs,
      };
    }
  }

  if (unclaimedTabs.length === 1 || (preferNewestUnclaimed && unclaimedTabs.length > 0)) {
    const fallbackTab = preferNewestUnclaimed
      ? unclaimedTabs[0]
      : unclaimedTabs[0];

    await renameSpreadsheetTab({
      sheets,
      sheetId,
      sourceSheetId: fallbackTab.sheetId,
      nextTitle: normalizedDesired,
    });

    return {
      title: normalizedDesired,
      previousTitle: fallbackTab.title,
      action: "renamed-fallback",
      tabs,
    };
  }

  if (createIfMissing) {
    await addSpreadsheetTab({ sheets, sheetId, title: normalizedDesired });
    return {
      title: normalizedDesired,
      action: "created",
      tabs,
    };
  }

  return {
    title: normalizedDesired,
    action: "missing",
    tabs,
    unclaimedTabs,
  };
};

module.exports = {
  FORM_RESPONSES_TAB_PATTERN,
  FORM_RESPONSES_UNDERSCORE_TAB_PATTERN,
  normalizeSheetTabName,
  isLegacyFormResponsesTab,
  listSpreadsheetTabs,
  getUnclaimedFormResponseTabs,
  renameSpreadsheetTab,
  addSpreadsheetTab,
  ensureAssessmentSheetTab,
};
