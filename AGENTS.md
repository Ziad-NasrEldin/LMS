# Agent Instructions

These instructions apply to the whole repository unless a deeper `AGENTS.md` overrides them.

## Context And Tooling

<!-- lean-ctx -->
Prefer lean-ctx MCP tools over native equivalents for token savings.
Full rules: @LEAN-CTX.md
<!-- /lean-ctx -->

- Keep changes surgical. Touch only files required for the request and do not refactor unrelated code.
- Read the relevant implementation before editing. This repo has several legacy patterns and duplicated concepts; follow the local pattern closest to the file you are changing.
- Do not commit secrets, `.env*` files, service account JSON, build output, `node_modules`, `dist`, Android build folders, or generated upload artifacts.
- Treat the existing worktree as user-owned. Do not revert or overwrite unrelated changes.

## Project Shape

- Main app lives in `kalima-platform/`.
- Frontend: `kalima-platform/frontend`, Vite + React + React Router + Tailwind CSS, with Capacitor Android support.
- Backend: `kalima-platform/backend`, Express + Mongoose + CommonJS modules.
- Backend API routes are mounted under `/api/v1` in `backend/server.js`.
- Frontend API wrapper modules live in `frontend/src/routes/` and usually read `import.meta.env.VITE_API_URL`.
- User-facing copy is bilingual. Arabic is the default/fallback language.

## Common Commands

Run commands from the indicated directory.

```bash
# Frontend dev server
cd kalima-platform/frontend
npm start

# Frontend production build
cd kalima-platform/frontend
npm run build

# Frontend i18n audit
cd kalima-platform/frontend
npm run audit:i18n

# Backend dev server
cd kalima-platform/backend
npm run dev

# Backend production start
cd kalima-platform/backend
npm run start:prod

# Backend regression tests
cd kalima-platform/backend
npm run test:regression

# Android web build + Capacitor copy
cd kalima-platform/frontend
npm run build:android
```

Notes:

- The root `kalima-platform/package.json` mostly delegates to the frontend; it does not start the backend.
- Vite proxies `/api/v1` to `http://localhost:5000`, but the backend default port is `3200`. For local full-stack work, either run the backend with `PORT=5000` or set `VITE_API_URL` consistently.
- There is no configured frontend test or lint script. Do not claim one was run unless you add or run a real command.

## Frontend Conventions

- React components are plain JSX. Preserve the existing style in nearby files, including quote style and semicolon usage.
- Prefer existing shared UI in `frontend/src/components/ui/` before adding new primitives.
- Keep route-level/page code under `frontend/src/pages/`; keep API wrappers under `frontend/src/routes/`.
- Use `normalizeApiError` from `frontend/src/utils/apiError.js` for API wrapper error returns when matching existing wrapper patterns.
- Authenticated API calls generally include a bearer `Authorization` header and often `withCredentials: true`; preserve both when extending an authenticated flow.
- Keep layouts RTL-aware. Use `i18n.dir()` or current local patterns where direction matters.
- When adding or changing user-visible copy, update both `frontend/public/locales/ar/*.json` and `frontend/public/locales/en/*.json`.
- Avoid hard-coded English strings in UI components unless the surrounding file is already intentionally not localized.

## Design And Styling

- Follow `design.md` for the main visual language: Arabic-first educational UI, deep teal brand fields, warm orange/gold accents, cream/white surfaces, rounded geometry, and soft elevation.
- Tailwind config extends the core palette in `frontend/tailwind.config.js`; prefer these established colors and nearby utility patterns.
- `frontend/src/index.css` is large and global. Before changing global CSS, search for the selector and verify the impact across pages.
- Prefer compact, production UI over decorative rebuilds. Preserve mobile behavior and large touch targets.
- For new interactive controls, use existing component patterns and accessible labels/states.

## Backend Conventions

- Backend files use CommonJS (`require`, `module.exports`).
- Keep the route/controller/model split:
  - `backend/routes/*Routes.js` wires endpoints and middleware.
  - `backend/controllers/*Controller.js` owns request handling.
  - `backend/models/*Model.js` owns Mongoose schemas.
  - `backend/utils/` holds shared domain helpers.
  - `backend/validations/` holds Joi validation schemas.
- Use `AppError` and `catchAsync` where the surrounding controller uses them.
- Preserve the global error handler flow in `controllers/errorController.js`.
- For multi-document writes, follow existing session/transaction patterns in nearby controllers.
- Validate ObjectIds with Mongoose helpers before querying when accepting IDs from requests.
- Do not bypass access-control helpers such as lecture access, purchase, role, or session utilities. Reuse the relevant utility module.
- Static uploads are served from `/api/v1/uploads` and `/uploads`; avoid changing upload paths without checking frontend consumers.

## Data, Integrations, And Env

- Required backend env commonly includes `DATABASE_URI`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, Cloudinary vars, Resend vars, and Google service account vars for assessment/form flows.
- `PAYMENT_SS_RETENTION_DAYS` controls payment screenshot retention behavior.
- Google Sheets/Form assessment code is spread across `config/googleApiConfig.js`, `utils/assessmentSheetTabs.js`, `utils/formSheetValidation.js`, and related scripts. Treat it as integration-sensitive and add regression coverage for changes.
- Do not print secrets or commit real credential values. Use placeholders in docs/examples.

## Testing And Verification

- For backend utility/controller changes, add or update focused tests in `backend/tests/regression/` using `node:test` and `node:assert/strict`.
- Run `npm run test:regression` from `kalima-platform/backend` after backend changes.
- Run `npm run build` from `kalima-platform/frontend` after frontend changes that affect routing, imports, styling, or build-time SEO.
- Run `npm run audit:i18n` after changing translation keys or localized UI.
- For UI changes, start the Vite dev server and verify the affected page in a browser at desktop and mobile widths.
- Document any verification command that could not be run and why.

## High-Risk Areas

- Auth/session behavior, impersonation, role redirects, and dashboard routing in `frontend/src/App.jsx`.
- Lecture access, purchases, exam/homework submission sync, and restricted lecture snapshots.
- Signup, OTP, password reset, and translated API error handling.
- Google Forms/Sheets assessment integration and migration/repair scripts.
- Global CSS and broad dashboard/sidebar/navigation changes.
