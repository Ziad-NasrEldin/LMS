const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");

const { verifyExamSyncWebhook } = require("../../utils/examSubmissionSync");

test("verifyExamSyncWebhook accepts a correctly signed payload", () => {
  const secret = "test-secret";
  const timestamp = new Date().toISOString();
  const rawBody = JSON.stringify({
    configId: "config-1",
    assessmentType: "exam",
    studentIdentifier: "student@example.com",
    score: 9,
  });
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("base64");

  assert.equal(
    verifyExamSyncWebhook({
      rawBody,
      timestamp,
      signature,
      secret,
      maxSkewMs: 10000,
    }),
    true
  );
});

test("verifyExamSyncWebhook rejects an invalid signature", () => {
  assert.throws(
    () =>
      verifyExamSyncWebhook({
        rawBody: "{}",
        timestamp: new Date().toISOString(),
        signature: "invalid-signature",
        secret: "test-secret",
        maxSkewMs: 10000,
      }),
    (error) => {
      assert.equal(error.statusCode, 401);
      assert.equal(error.message, "Exam sync signature is invalid");
      return true;
    }
  );
});
