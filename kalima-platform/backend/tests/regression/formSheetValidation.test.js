const test = require("node:test");
const assert = require("node:assert/strict");

const googleApiConfig = require("../../config/googleApiConfig");
const formSheetValidation = require("../../utils/formSheetValidation");

const originalConfigureGoogleForms = googleApiConfig.configureGoogleForms;
const originalConfigureGoogleSheets = googleApiConfig.configureGoogleSheets;

const restorePatches = () => {
  googleApiConfig.configureGoogleForms = originalConfigureGoogleForms;
  googleApiConfig.configureGoogleSheets = originalConfigureGoogleSheets;
};

test("extractGoogleFormId handles published Google Form URLs", () => {
  const formId = formSheetValidation.extractGoogleFormId(
    "https://docs.google.com/forms/d/e/1FAIpQLSdTxBRapO0hWEhKUdJweaqvUlwYUHRW6T1II9ZKXr8x3oiFxw/viewform?usp=dialog"
  );

  assert.equal(formId, "1FAIpQLSdTxBRapO0hWEhKUdJweaqvUlwYUHRW6T1II9ZKXr8x3oiFxw");
});

test("getPublishedFormDetails validates linked master sheet id", async () => {
  try {
    googleApiConfig.configureGoogleForms = () => ({
      forms: {
        get: async () => ({
          data: {
            linkedSheetId: "master-sheet-id",
            responderUri: "https://docs.google.com/forms/d/e/test/viewform",
          },
        }),
        responses: {
          list: async () => ({ data: { responses: [] } }),
        },
      },
    });

    const result = await formSheetValidation.getPublishedFormDetails({
      formUrl: "https://docs.google.com/forms/d/e/test/viewform",
      expectedSheetId: "master-sheet-id",
    });

    assert.equal(result.linkedSheetId, "master-sheet-id");
  } finally {
    restorePatches();
  }
});

test("getPublishedFormDetails resolves forms.gle links before extracting the form id", async () => {
  const originalFetch = global.fetch;

  try {
    global.fetch = async (url, options) => {
      assert.equal(url, "https://forms.gle/CLZGMqhJgH4L3m7T7");
      assert.equal(options.redirect, "manual");
      return {
        headers: {
          get: (name) =>
            name.toLowerCase() === "location"
              ? "https://docs.google.com/forms/d/e/short-form-id/viewform?usp=sf_link"
              : null,
        },
        url: "https://forms.gle/CLZGMqhJgH4L3m7T7",
      };
    };

    googleApiConfig.configureGoogleForms = () => ({
      forms: {
        get: async ({ formId }) => {
          assert.equal(formId, "short-form-id");
          return {
            data: {
              linkedSheetId: "master-sheet-id",
              responderUri: "https://docs.google.com/forms/d/e/short-form-id/viewform",
            },
          };
        },
        responses: {
          list: async () => ({ data: { responses: [] } }),
        },
      },
    });

    const result = await formSheetValidation.getPublishedFormDetails({
      formUrl: "https://forms.gle/CLZGMqhJgH4L3m7T7",
      expectedSheetId: "master-sheet-id",
    });

    assert.equal(result.formId, "short-form-id");
    assert.equal(result.linkedSheetId, "master-sheet-id");
  } finally {
    global.fetch = originalFetch;
    restorePatches();
  }
});

test("getPublishedFormDetails skips hard failure when form access is unavailable", async () => {
  try {
    googleApiConfig.configureGoogleForms = () => ({
      forms: {
        get: async () => {
          const error = new Error("The caller does not have permission");
          error.code = 403;
          throw error;
        },
        responses: {
          list: async () => ({ data: { responses: [] } }),
        },
      },
    });

    const result = await formSheetValidation.getPublishedFormDetails({
      formUrl: "https://docs.google.com/forms/d/e/test/viewform",
      expectedSheetId: "master-sheet-id",
    });

    assert.equal(result.validationSkipped, true);
    assert.equal(result.linkedSheetId, null);
    assert.deepEqual(result.responseSamples, []);
  } finally {
    restorePatches();
  }
});

test("getPublishedFormDetails skips hard failure when Google Forms client is unavailable", async () => {
  try {
    googleApiConfig.configureGoogleForms = () => {
      throw new Error("Google service account credentials are not configured");
    };

    const result = await formSheetValidation.getPublishedFormDetails({
      formUrl: "https://docs.google.com/forms/d/e/test/viewform",
      expectedSheetId: "master-sheet-id",
    });

    assert.equal(result.validationSkipped, true);
    assert.equal(result.linkedSheetId, null);
  } finally {
    restorePatches();
  }
});

test("assertPublishedFormValidationAvailable allows Sheets-only binding when form validation is skipped", () => {
  const skippedDetails = { validationSkipped: true, linkedSheetId: null };

  assert.equal(
    formSheetValidation.assertPublishedFormValidationAvailable(skippedDetails, "Exam"),
    skippedDetails
  );
});

test("detectMatchingResponseTab matches a form response sample to the correct response tab", async () => {
  try {
    googleApiConfig.configureGoogleSheets = () => ({
      spreadsheets: {
        get: async () => ({
          data: {
            sheets: [
              { properties: { sheetId: 1, title: "Form Responses 2", index: 0 } },
              { properties: { sheetId: 2, title: "Form Responses 1", index: 1 } },
            ],
          },
        }),
        values: {
          get: async ({ range }) => {
            if (range === "Form Responses 2") {
              return {
                data: {
                  values: [
                    ["Timestamp", "Email Address", "Score"],
                    ["2026-05-01T12:30:00.000Z", "other@example.com", "2 / 10"],
                  ],
                },
              };
            }

            return {
              data: {
                values: [
                  ["Timestamp", "Email Address", "Score"],
                  ["2026-05-01T12:34:10.000Z", "student@example.com", "8 / 10"],
                ],
              },
            };
          },
        },
      },
    });

    const result = await formSheetValidation.detectMatchingResponseTab({
      sheetId: "master-sheet-id",
      claimedTabNames: [],
      responseSamples: [
        {
          respondentEmail: "student@example.com",
          lastSubmittedTime: "2026-05-01T12:34:30.000Z",
          totalScore: 8,
        },
      ],
    });

    assert.equal(result, "Form Responses 1");
  } finally {
    restorePatches();
  }
});
