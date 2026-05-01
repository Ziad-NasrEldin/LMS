const test = require("node:test");
const assert = require("node:assert/strict");

const { normalizeGooglePrivateKey } = require("../../config/googleApiConfig");

test("normalizeGooglePrivateKey removes wrapping quotes and restores newlines", () => {
  const raw = '"-----BEGIN PRIVATE KEY-----\\nabc123\\n-----END PRIVATE KEY-----\\n"';
  const normalized = normalizeGooglePrivateKey(raw);

  assert.equal(normalized.startsWith("-----BEGIN PRIVATE KEY-----\n"), true);
  assert.equal(normalized.endsWith("\n-----END PRIVATE KEY-----"), true);
  assert.equal(normalized.includes('"'), false);
});
