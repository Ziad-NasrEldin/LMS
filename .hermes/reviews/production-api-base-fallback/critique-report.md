# Production API Base Fallback Critique

Verdict: APPROVED

## Summary

The staged frontend hotfix is scoped correctly and addresses the production API routing fallback issue. The submitted staged change set centralizes `VITE_API_URL` handling in `frontend/src/utils/apiBase.js`, falls back missing/empty production configuration to `/api/v1`, and updates the affected frontend API wrappers/pages/utils to use `API_BASE_URL` or `BACKEND_BASE_URL` instead of direct `import.meta.env.VITE_API_URL` references.

The previous blocker was scope hygiene, not implementation correctness. Re-reviewing only the staged change set confirms that unrelated `AGENTS.md`, `.codex/`, and review artifacts are not staged for the production hotfix commit.

## Blocking findings

None.

## Review notes

- `git diff --cached --name-only` contains only the frontend hotfix files under `kalima-platform/frontend/src/...`.
- `git status --short` still shows unstaged/untracked `AGENTS.md`, `.codex/`, and `.hermes/`, but these are not part of the staged change set and therefore are not a blocker for the hotfix commit as currently staged.
- `frontend/src/utils/apiBase.js` normalization behavior is correct for the key deployment cases reviewed:
  - missing/empty `VITE_API_URL` => `/api/v1`
  - `/api/v1` or `/api/v1/` => `/api/v1`
  - `https://example.com` or `https://example.com/` => `https://example.com/api/v1`
  - `https://example.com/api/v1` or trailing slash variant => unchanged normalized API base
- `BACKEND_BASE_URL` correctly strips `/api/v1` for absolute API bases and falls back to `window.location.origin` for relative API bases, preserving upload/profile image URL behavior for same-origin proxy deployments.
- The admin dashboard subject flow now goes through `API_URL = API_BASE_URL` in `frontend/src/routes/courses.jsx`, so subject calls target `/api/v1/subjects/...` when the env is absent instead of same-origin `/subjects/...`.
- Relative import paths for the new helper are correct across the staged routes, pages, service, and utils.
- No backend or database code is staged. The fix remains frontend URL construction only and does not introduce a data deletion path.

## Verification performed

- Read the updated handoff at `.hermes/reviews/production-api-base-fallback/handoff.md`.
- Inspected the staged file list with `git diff --cached --name-only`.
- Inspected the staged patch with `git diff --cached`.
- Checked worktree/staging scope with `git status --short`; unrelated tooling/review files remain unstaged.
- Searched frontend source for `import.meta.env.VITE_API_URL`; the only remaining live source reference is in `frontend/src/utils/apiBase.js`.
- Ran frontend production build from `kalima-platform/frontend`:
  - Command: `npm run build`
  - Result: PASS. Vite build and SEO prerender completed successfully.
- Ran a Node normalization check for representative API base values; outputs matched the expected fallback/normalization behavior.
- Inspected built output for the previous failed subject-route pattern; the rebuilt courses chunk uses the shared API base and did not contain the prior `undefined/subjects` pattern.

## Files reviewed

- `kalima-platform/frontend/src/utils/apiBase.js`
- `kalima-platform/frontend/src/routes/assistants-services.jsx`
- `kalima-platform/frontend/src/routes/auth-services.jsx`
- `kalima-platform/frontend/src/routes/codes.jsx`
- `kalima-platform/frontend/src/routes/courses.jsx`
- `kalima-platform/frontend/src/routes/examConfigs.js`
- `kalima-platform/frontend/src/routes/examsAndHomeworks.js`
- `kalima-platform/frontend/src/routes/fetch-users.jsx`
- `kalima-platform/frontend/src/routes/governments.js`
- `kalima-platform/frontend/src/routes/homeworks.js`
- `kalima-platform/frontend/src/routes/lectures.jsx`
- `kalima-platform/frontend/src/routes/levels.jsx`
- `kalima-platform/frontend/src/routes/market.jsx`
- `kalima-platform/frontend/src/routes/parents.jsx`
- `kalima-platform/frontend/src/routes/revenue.jsx`
- `kalima-platform/frontend/src/routes/reviews.jsx`
- `kalima-platform/frontend/src/routes/student-lecture-access.js`
- `kalima-platform/frontend/src/routes/tokenRefreshServices.jsx`
- `kalima-platform/frontend/src/routes/update-user.jsx`
- `kalima-platform/frontend/src/services/errorHandling.js`
- `kalima-platform/frontend/src/pages/CourseDetails.jsx`
- `kalima-platform/frontend/src/pages/signup/StudentRegistration.jsx`
- `kalima-platform/frontend/src/utils/profileImage.js`
- `kalima-platform/frontend/src/utils/uploadUrl.js`

## Data-loss assessment

No evidence of data deletion is present in the staged frontend-only fix. The reported production symptom is consistent with requests being sent to the wrong frontend/static path and receiving an Nginx 405 before reaching backend/database routes. This change corrects URL construction and does not modify backend persistence or database write/delete behavior.
