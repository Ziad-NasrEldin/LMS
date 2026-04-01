const test = require("node:test");
const assert = require("node:assert/strict");

const {
  extractGoogleSheetId,
  DEFAULT_IDENTIFIER_COLUMN,
  DEFAULT_SCORE_COLUMN,
} = require("../../config/masterAssessmentConfig");

test("extractGoogleSheetId accepts a plain Google Sheet ID", () => {
  const id = "1l7w6__oJB9nFnFr9QYiiTDmSSKrWADszUcsM";
  assert.equal(extractGoogleSheetId(id), id);
});

test("extractGoogleSheetId extracts ID from standard Google Sheet URL", () => {
  const url =
    "https://docs.google.com/spreadsheets/d/1l7w6__oJB9nFnFr9QYiiTDmSSKrWADszUcsM/edit#gid=0";
  assert.equal(
    extractGoogleSheetId(url),
    "1l7w6__oJB9nFnFr9QYiiTDmSSKrWADszUcsM"
  );
});

test("master assessment defaults keep fixed identifier and score columns", () => {
  assert.equal(DEFAULT_IDENTIFIER_COLUMN, "Email Address");
  assert.equal(DEFAULT_SCORE_COLUMN, "Score");
});
