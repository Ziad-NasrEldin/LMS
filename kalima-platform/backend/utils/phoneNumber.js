const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩"
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹"

const normalizeDigitsToEnglish = (value) =>
  String(value ?? "")
    .replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)))

const sanitizeEgyptianPhoneInput = (value) =>
  normalizeDigitsToEnglish(value)
    .replace(/[\u200E\u200F\u061C\u202A-\u202E]/g, "")
    .replace(/[\s\-()]/g, "")
    .replace(/(?!^)\+/g, "")
    .trim()

const isValidEgyptianPhoneNumber = (value) =>
  /^(\+20\d{10}|0\d{10}|\d{10})$/.test(sanitizeEgyptianPhoneInput(value))

const normalizeEgyptianPhoneNumber = (value) => {
  const sanitized = sanitizeEgyptianPhoneInput(value)

  if (/^\+20\d{10}$/.test(sanitized)) return sanitized
  if (/^0\d{10}$/.test(sanitized)) return `+20${sanitized.slice(1)}`
  if (/^\d{10}$/.test(sanitized)) return `+20${sanitized}`

  return ""
}

module.exports = {
  normalizeDigitsToEnglish,
  sanitizeEgyptianPhoneInput,
  isValidEgyptianPhoneNumber,
  normalizeEgyptianPhoneNumber,
}