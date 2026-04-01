# Repository Audit - Phase 1

Date: 2026-04-01
Scope: Whole repository baseline scan + highest-impact refactor pass.

## Critical Findings

1. Committed service-account private key in backend:
- `kalima-platform/backend/config/kalima-ed9f8-firebase-adminsdk-fbsvc-df8dbf6995.json`
- Risk: credential leakage and account compromise.
- Action taken in this phase: backend now supports loading credentials from env var (`GOOGLE_SERVICE_ACCOUNT_JSON`) in addition to file path fallback.

2. Port collision issues in local dev:
- Frequent `EADDRINUSE` on backend port `5000` due to stale node process.
- Action: operational fix documented in agent responses; no code changes needed.

## Refactors Completed (Behavior Preserving)

### 1) Google sheet tab fallback made future-proof

File:
- `kalima-platform/backend/utils/examSubmissionSync.js`

Changes:
- Added dynamic fallback generation for `Form Responses 1..20` in both `syncCourseSubmissionsFromSheet` and `findLatestMatchingSubmission`.
- Preserved original candidate priority (`RAW_SUBMISSIONS` first).

Why:
- Prevents failures when Google auto-creates `Form Responses 2`, `3`, etc.

Validation:
- Regression test added and passing.

### 2) Duplicate assessment-check calls removed in student details flow

File:
- `kalima-platform/backend/controllers/containerController.js`

Changes:
- Removed duplicate `checkAssessmentCompletion` invocation in `getContainerByIdAndStudentId`.
- Reused first result object and retained all response fields.

Why:
- Eliminates redundant DB/service work and avoids possible divergence.

Validation:
- Backend regression tests passing.

### 3) Service-account credential loading hardened

Files:
- `kalima-platform/backend/server.js`
- `kalima-platform/backend/config/firebase.js`

Changes:
- Added helper to parse service account from `GOOGLE_SERVICE_ACCOUNT_JSON`.
- Initialization now uses env credential first, then falls back to JSON file path.
- Preserves existing behavior if env var is absent.

Why:
- Safer deployment path and easier rotation; reduces dependence on tracked key file.

Validation:
- Backend starts successfully.

### 4) High-noise import cleanup in user controller

File:
- `kalima-platform/backend/controllers/userController.js`

Changes:
- Removed unused imports (`path`, `jwt`, `bcryptjs`, `Firestore`, `axios`, `db`) to reduce clutter.

Why:
- Improves maintainability and static clarity.

Validation:
- Backend tests and startup OK.

## New/Updated Tests

File:
- `kalima-platform/backend/tests/regression/examSubmissionSync.test.js`

Added:
- Test case confirming fallback to `Form Responses 3` works.

Adjusted:
- Existing credential test updated to avoid chained mock incompatibility by using `findOne` mock path.

## Validation Summary

Backend:
- Regression: all tests passing (`36 passed`, `0 failed`).
- Runtime boot: successful (tested on port 5001 and 5000 in separate runs).

Frontend:
- Production build succeeded.

## Remaining High-Priority Audit Work (Next Phases)

1. Security hardening
- Remove tracked service-account JSON from git history/repo (requires key rotation + secret management plan).
- Enforce env-only credentials in production mode.

2. File-size and complexity hotspots
- `kalima-platform/backend/controllers/userController.js` (~1300+ LOC): split auth, profile, admin ops, and integrations into service modules.
- `kalima-platform/backend/controllers/containerController.js` (~1100+ LOC): split teacher/student/read/update concerns.
- `kalima-platform/frontend/src/pages/User Dashboard/Admin dashboard/home/userManageTable.jsx` (~1100+ LOC): extract table state, filters, actions, and modal logic into hooks/components.
- `kalima-platform/frontend/src/pages/User Dashboard/Lecture Page/DetailedLectureViewing.jsx` (~900+ LOC): extract data adapter + action handlers.

3. API consistency
- Standardize list endpoints to return `200` with empty arrays (already patched in key notification-adjacent endpoints; audit all remaining list handlers).

4. Frontend service layer cleanup
- Normalize error handling + return contracts across `src/services/*`.

5. Translation and content integrity
- Re-run translation consistency checks after notification cleanup to ensure no missing keys in UI flows.

## Suggested Execution Plan for Full File-by-File Refactor

Phase 2:
- Backend controller decomposition (`userController`, `containerController`) with characterization tests per extraction.

Phase 3:
- Frontend page decomposition for largest React pages into hooks/components and service adapters.

Phase 4:
- Utility/library cleanup and duplicate logic removal across `src/lib` and `backend/utils`.

Phase 5:
- Cross-cutting pass: lint, type checks, bundle checks, and docs.

## Notes
- All changes in this phase were incremental and tested.
- No intentional behavior changes introduced.
