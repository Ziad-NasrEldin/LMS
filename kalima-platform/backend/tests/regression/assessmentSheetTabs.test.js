const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildAssessmentTabBase,
  ensureAssessmentSheetTab,
} = require("../../utils/assessmentSheetTabs");

test("buildAssessmentTabBase preserves Arabic lecture names instead of falling back to lecture-exam", () => {
  assert.equal(buildAssessmentTabBase("سس", "exam"), "سس-exam");
  assert.equal(buildAssessmentTabBase("محاضرة", "homework"), "محاضرة-homework");
});

test("buildAssessmentTabBase keeps Google Sheets-safe characters out while preserving Unicode letters", () => {
  assert.equal(buildAssessmentTabBase("  سس / اختبار [1]  ", "exam"), "سس-اختبار-1-exam");
});

test("ensureAssessmentSheetTab renames the current linked tab to the desired lecture tab", async () => {
  const requests = [];
  const sheets = {
    spreadsheets: {
      get: async () => ({
        data: {
          sheets: [
            { properties: { sheetId: 1, title: "Form Responses 12", index: 0 } },
          ],
        },
      }),
      batchUpdate: async ({ requestBody }) => {
        requests.push(requestBody.requests);
        return {};
      },
    },
  };

  const result = await ensureAssessmentSheetTab({
    sheets,
    sheetId: "sheet-1",
    desiredTabName: "biology-exam",
    currentTabName: "Form Responses 12",
    claimedTabNames: [],
  });

  assert.equal(result.title, "biology-exam");
  assert.equal(result.action, "renamed-current");
  assert.equal(requests.length, 1);
  assert.equal(
    requests[0][0].updateSheetProperties.properties.title,
    "biology-exam"
  );
});

test("ensureAssessmentSheetTab can claim newest unclaimed Form Responses tab", async () => {
  const requests = [];
  const sheets = {
    spreadsheets: {
      get: async () => ({
        data: {
          sheets: [
            { properties: { sheetId: 2, title: "Form Responses 9", index: 0 } },
            { properties: { sheetId: 1, title: "Form Responses 3", index: 1 } },
            { properties: { sheetId: 3, title: "physics-exam", index: 2 } },
          ],
        },
      }),
      batchUpdate: async ({ requestBody }) => {
        requests.push(requestBody.requests);
        return {};
      },
    },
  };

  const result = await ensureAssessmentSheetTab({
    sheets,
    sheetId: "sheet-1",
    desiredTabName: "chemistry-exam",
    currentTabName: null,
    claimedTabNames: ["physics-exam", "Form Responses 3"],
    preferNewestUnclaimed: true,
  });

  assert.equal(result.title, "chemistry-exam");
  assert.equal(result.action, "renamed-fallback");
  assert.equal(result.previousTitle, "Form Responses 9");
  assert.equal(requests.length, 1);
  assert.equal(
    requests[0][0].updateSheetProperties.properties.sheetId,
    2
  );
});

test("ensureAssessmentSheetTab surfaces readable sheet access errors", async () => {
  const sheets = {
    spreadsheets: {
      get: async () => {
        const error = new Error("The caller does not have permission");
        error.response = { data: { error: { message: "The caller does not have permission" } } };
        throw error;
      },
    },
  };

  await assert.rejects(
    ensureAssessmentSheetTab({
      sheets,
      sheetId: "sheet-1",
      desiredTabName: "biology-exam",
      currentTabName: null,
      claimedTabNames: [],
    }),
    /Unable to read tabs from the master assessment sheet\. Verify the configured spreadsheet ID and service-account access: The caller does not have permission/
  );
});
