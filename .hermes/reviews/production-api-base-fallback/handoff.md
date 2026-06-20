# Feature Handoff: production API base fallback

## Original request

"heyo, fekra produciton is not working, you will find the repository in /Users/ziadnasreldin/Documents/GitHub/fekra
/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/TemporaryItems/NSIRD_screencaptureui_SndtFj/Screenshot\ 2026-06-01\ at\ 11.11.31 PM.png
check the screenshot, please there was alot of data already, where did they go"

## Implementation summary

- Investigated screenshot: admin dashboard "بيانات المقررات / حسابات المستخدمين" was trying to create/list subjects while DevTools showed `subjects/` returning Nginx `405 Not Allowed`.
- Root cause: several frontend API wrapper modules compiled `import.meta.env.VITE_API_URL` directly. When the production env is missing/empty, Vite bakes this as an empty/undefined relative base, so calls hit the static frontend origin (`/subjects/`, `/levels/`, etc.) instead of backend `/api/v1/...`.
- Added a single shared API base helper that normalizes `VITE_API_URL` and falls back to `/api/v1`.
- Updated all direct frontend `VITE_API_URL` consumers to use the shared helper.
- This is a routing/config bug, not evidence that database data was deleted. The screenshot's 405 is from Nginx/static frontend rejecting the wrong API URL before it reaches the backend/database.

## Changed files

- `kalima-platform/frontend/src/utils/apiBase.js`: new shared API/back-end base normalization.
- `kalima-platform/frontend/src/routes/*.js(x)`: use `API_BASE_URL` instead of direct `import.meta.env.VITE_API_URL`.
- `kalima-platform/frontend/src/services/errorHandling.js`: use shared API base in axios instance.
- `kalima-platform/frontend/src/pages/CourseDetails.jsx`: use shared API base for container fetch.
- `kalima-platform/frontend/src/pages/signup/StudentRegistration.jsx`: use shared API base for signup/levels flow.
- `kalima-platform/frontend/src/utils/profileImage.js` and `uploadUrl.js`: use shared backend base for upload/profile URLs.

## How to test

- From `kalima-platform/frontend`: run `npm run build`.
- Inspect built chunks with no `VITE_API_URL` set:
  - Direct source refs should only remain in `src/utils/apiBase.js`.
  - Built courses chunk must not contain `const n=void 0`, `undefined/subjects`, or `${void 0}/subjects`.
- Production smoke after deploy:
  - Open admin dashboard > بيانات المقررات.
  - Existing subjects/levels should load.
  - Create a test subject; Network should POST `/api/v1/subjects/`, not `/subjects/`.
  - Delete the test subject if needed.

## Tests run

- `npm run build` from `kalima-platform/frontend`: PASS. Vite build and SEO prerender completed.
- Static API-base scan: PASS. No direct `import.meta.env.VITE_API_URL` refs remain outside `src/utils/apiBase.js`.
- Dist inspection: PASS. The rebuilt courses chunk no longer contains `const n=void 0`, `undefined/subjects`, or `${void 0}/subjects`.

## Git info

- Branch: `production`
- Commit SHA: not committed yet
- Diff base: current `origin/production`

## Frontend/backend/database notes

- Frontend: fixes API URL construction for dashboard/course/signup/payment/review wrappers.
- Backend: no backend code changed. Existing backend mounts subjects at `/api/v1/subjects` in `backend/server.js`.
- Database: no DB write/delete path was touched. Screenshot shows frontend request never reached backend DB path.

## Reviewer focus areas

- Confirm imports are correct for route/page/service/utils relative paths.
- Confirm fallback behavior is correct when `VITE_API_URL` is empty/missing and when it is a backend origin with or without `/api/v1`.
- Confirm upload/profile URL behavior remains correct.
- Confirm no unrelated user-owned files (`AGENTS.md`, `.codex/`) are included in this fix.

## Fix cycle notes

Initial critique returned `REQUEST_CHANGES` only for scope hygiene: unrelated `AGENTS.md`, `.codex/`, and `.hermes/` were visible in the worktree. I did not revert user/tooling-owned files. Instead I staged only the frontend hotfix files listed above and verified with `git diff --cached --name-only` that the submitted change set excludes `AGENTS.md`, `.codex/`, and review artifacts. Those remain unstaged and must not be committed with the production hotfix.
