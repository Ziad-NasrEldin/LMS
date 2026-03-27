const test = require("node:test")
const assert = require("node:assert/strict")

const { normalizeExternalUrl } = require("../../utils/urlValidation")

test("normalizeExternalUrl accepts valid public https URLs", () => {
  const input = "  https://docs.google.com/forms/d/e/example/viewform  "
  const normalized = normalizeExternalUrl(input)
  assert.equal(
    normalized,
    "https://docs.google.com/forms/d/e/example/viewform",
  )
})

test("normalizeExternalUrl rejects non-http protocols", () => {
  assert.equal(normalizeExternalUrl("javascript:alert(1)"), null)
  assert.equal(normalizeExternalUrl("ftp://example.com/file"), null)
})

test("normalizeExternalUrl rejects localhost and private IPv4 hosts", () => {
  assert.equal(normalizeExternalUrl("http://localhost:3000/form"), null)
  assert.equal(normalizeExternalUrl("http://127.0.0.1/form"), null)
  assert.equal(normalizeExternalUrl("http://10.0.0.8/form"), null)
  assert.equal(normalizeExternalUrl("http://172.16.10.2/form"), null)
  assert.equal(normalizeExternalUrl("http://192.168.1.15/form"), null)
})

test("normalizeExternalUrl rejects local IPv6 hosts", () => {
  assert.equal(normalizeExternalUrl("http://[::1]/form"), null)
  assert.equal(normalizeExternalUrl("http://[fe80::1]/form"), null)
  assert.equal(normalizeExternalUrl("http://[fd12::1]/form"), null)
})

test("normalizeExternalUrl rejects malformed inputs", () => {
  assert.equal(normalizeExternalUrl("not a url"), null)
  assert.equal(normalizeExternalUrl(""), null)
  assert.equal(normalizeExternalUrl(null), null)
})
