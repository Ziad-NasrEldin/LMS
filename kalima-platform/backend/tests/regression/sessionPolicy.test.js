const test = require("node:test");
const assert = require("node:assert/strict");
const {
  isEndUserRole,
  shouldEnforceSingleSession,
} = require("../../utils/auth/sessionPolicy.js");

test("isEndUserRole recognizes configured end-user roles", () => {
  assert.equal(isEndUserRole("student"), true);
  assert.equal(isEndUserRole("Parent"), true);
  assert.equal(isEndUserRole("teacher"), true);
  assert.equal(isEndUserRole("sub-admin"), false);
  assert.equal(isEndUserRole("lecturer"), false);
});

test("shouldEnforceSingleSession applies only to non-impersonated end-user tokens", () => {
  assert.equal(
    shouldEnforceSingleSession({
      role: "student",
    }),
    true
  );

  assert.equal(
    shouldEnforceSingleSession({
      role: "parent",
      impersonation: { isActive: false },
    }),
    true
  );

  assert.equal(
    shouldEnforceSingleSession({
      role: "teacher",
      impersonation: { isActive: true },
    }),
    false
  );

  assert.equal(
    shouldEnforceSingleSession({
      role: "lecturer",
    }),
    false
  );
});
