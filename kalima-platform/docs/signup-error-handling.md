# Signup Error Handling Specification

## Scope
- Covered flows: API signup errors for Student, Parent, and Teacher.
- Covered endpoints: `POST /api/v1/register` and `POST /api/v1/users` (shared signup logic).
- Out of scope here: local client-only validation before API submit.

## Backend Contract
- Signup failures now return a structured payload with explicit classification:
  - `status`
  - `message`
  - `code`
  - `field` (optional)
  - `errors` (optional array for multi-field validation failures)
  - `details` (optional metadata)
  - `requestId`
- Status policy:
  - `400` validation / semantic input issues
  - `409` uniqueness conflicts
  - `413` upload size issues
  - `500` internal server failure with explicit signup fallback text and `requestId`

## Error Sources Unified
- Joi validation middleware (`validateUser`) now emits signup codes via structured `errors[]`.
- Register controller emits role-aware signup codes for business rules.
- Error middleware translates:
  - Mongoose validation errors to signup validation items
  - Mongo duplicate-key conflicts to signup conflict codes
  - Multer upload failures to explicit signup upload codes

## Frontend Behavior
- Signup page no longer relies on fragile message-substring switches.
- Signup API errors are mapped by `code` and `field`.
- UI rendering behavior:
  - Top alert shows explicit summary messages (localized by code).
  - Inline field errors are filled when `field` is known.
  - Unknown/internal failures are still explicit and include `requestId`.

## Localization
- Added `apiErrors.<ERROR_CODE>` messages in both:
  - `frontend/public/locales/en/register.json`
  - `frontend/public/locales/ar/register.json`
- Resolution order:
  - `apiErrors.<code>.<role>`
  - `apiErrors.<code>.default`
  - backend message fallback

## Matrix Generation
- Source of truth:
  - Backend catalog: `backend/utils/signupErrors.js`
  - UI messages: `frontend/public/locales/*/register.json`
- Generate matrix:
  - `node scripts/generate-signup-error-matrix.cjs`
- Output:
  - `docs/signup-error-matrix.md`
