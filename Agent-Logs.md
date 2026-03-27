## 2026-03-27 - Translation implementation batch 2 (frontend locale parity complete) - GPT-5.3-Codex
- Added targeted EN/AR locale aliases and missing keys across lecturesPage, admin, createUser, createAdmin, common, home, lecturerDashboard, centerDashboard, and Kalima Store namespaces to match existing `t(...)` usages without changing runtime behavior.
- Filled exam-config and lecture-creation key paths in `lecturesPage` plus missing table/filter/export aliases used by admin and store dashboards.
- Re-ran i18n audit and reached full used-key parity in frontend locales (`missingUsedKeysInEnCount: 0`, `missingUsedKeysInArCount: 0`).

## 2026-03-27 - Lecture edit entry points - GPT-5.4 mini
- Added lecture edit buttons on the lecturer-facing lecture detail and playback screens, reusing the existing My Lectures edit modal flow through navigation state.
- Updated the shared lecture list page to auto-open the edit modal when it receives a lecture target from those detail screens.

## 2026-03-27 - Lecturer My Lectures crash fix - GPT-5.4 mini
- Reworked the lecturer My Lectures page to use the edit-aware lecture modal state cleanly and removed the render-time fallback that was causing the production crash.
- Added lecture edit entry points in the list UI so existing lectures can be opened for updates directly from the lecturer dashboard.

## 2026-03-27 - Translation implementation batch 1 (frontend) - GPT-5.3-Codex
- Started the platform translation revision by removing hardcoded UI copy and fallback literals in high-traffic surfaces: teachers, lectures, lecture card, verify OTP, market labels, assistant management, and upload progress.
- Added and aligned EN/AR locale keys for the new UI strings (filters/pagination labels, lecture fallbacks, OTP prompts, upload statuses/errors, market NEW badge, and assistant section hint).
- Kept existing behavior and routes intact while shifting rendering to translation keys so future locale updates can be handled in locale JSON files only.



## 2026-03-27 - Lecturer course and container edit support - GPT-5.4 mini
- Added lecturer-owned edit flows for course containers and child containers by reusing the existing course form and container modal in edit mode.
- Hardened the backend update handlers with ownership checks for lecturers and exposed a frontend `updateContainer` helper for PATCH-based saves.
- Wired lecturer dashboard edit entry points from course cards and container details so lecturers can open existing containers directly for updates.

## 2026-03-27 - Lecture view consume accounting hardening - GPT-5.3-Codex
- Added idempotent lecture-view consumption fields and index in `kalima-platform/backend/models/studentLectureAccessModel.js`, plus a dedicated atomic consume endpoint in `kalima-platform/backend/controllers/studentLectureAccessController.js`.
- Locked down lecture-access routes by role in `kalima-platform/backend/routes/studentLectureAccessRoutes.js` and exposed `POST /student-lecture-access/:id/consume-view` for student playback accounting.
- Updated student playback accounting client flow in `kalima-platform/frontend/src/routes/student-lecture-access.js` and `kalima-platform/frontend/src/pages/User Dashboard/Lecture Page/LectureDisplay.jsx` to use consume-view with bounded soft retries.
- Added migration/backfill tooling in `kalima-platform/backend/scripts/reconcileStudentLectureAccess.js` and npm scripts in `kalima-platform/backend/package.json` for dry-run/apply reconciliation.
## 2026-03-27 - Student lecture access 404 regression coverage - GPT-5.3-Codex
- Added a backend regression case to [kalima-platform/backend/tests/regression/studentLectureAccessController.test.js](kalima-platform/backend/tests/regression/studentLectureAccessController.test.js) for the lecture-not-found path so the access controller’s error handling is covered too.

## 2026-03-27 - Student lecture access controller regression coverage - GPT-5.3-Codex
- Added backend regression tests for lecture access outcomes in [kalima-platform/backend/tests/regression/studentLectureAccessController.test.js](kalima-platform/backend/tests/regression/studentLectureAccessController.test.js), covering restricted exam, restricted homework, full-pass success, and no-requirements success scenarios.

## 2026-03-27 - Purchase access utility extraction + regression tests - GPT-5.3-Codex
- Extracted purchase lecture-access detection into `backend/utils/purchaseHistoryUtils.js` and wired `userController` to use the shared helper.
- Added focused backend regression coverage in `backend/tests/regression/purchaseHistoryUtils.test.js` for direct lecture purchases, lecture-container purchases, hierarchical container lectures, and non-access cases.

## 2026-03-27 - Lecture remaining-views preload fix - GPT-5.4 mini
- Preloaded the lecture access row from the dashboard response so the remaining views badge can render without waiting for the heavier purchase-based fallback.
- Kept the fallback access check for missing rows, and fixed the zero-views guard to block access consistently when the count reaches 0.

## 2026-03-27 - Purchase enrichment flow refactor - GPT-5.3-Codex
- Refactored dashboard purchase enrichment into shared helpers in `userController` to centralize lecture-access detection and lecture hydration logic.
- Improved purchased-features detection by replacing the invalid `container.type` fallback query with an enrichment-based check over real container purchases.
- Applied the same enrichment pipeline to parent-child purchase history responses so course-included lectures are resolved consistently across student and parent dashboards.

## 2026-03-27 - Student My Lectures include course lectures - GPT-5.3-Codex
- Extended dashboard purchase-history enrichment so purchased course/month/term/year containers now include their descendant lectures in `container.lectures`.
- Updated student My Lectures mapping to flatten direct purchases + purchased-container lectures and de-duplicate repeated lecture ownership entries.
- Fixed student lecture access check flow for container purchases to validate access against the target lecture ID, enabling lecture viewing from purchased full courses.
- Switched student purchase date rendering on My Lectures to respect the active i18n language instead of a hardcoded locale.

## 2026-03-26 - Lecture access gating + regression coverage + UX polish - GPT-5.3-Codex
- Added server-side student lecture-content gating in lecture-by-id with a backward-compatible `restricted` payload contract that includes safe lecture snapshot and requirement details.
- Introduced shared lecture access utility functions, added backend regression tests for threshold resolution and URL/link hardening, and wired `npm run test:regression` in backend scripts.
- Redesigned the student exam/homework requirement cards in lecture view to show clear per-requirement status, thresholds, action links, and a recheck-access workflow.




## 2026-03-27 - Teacher details course link fix - GPT-5.4 mini
- Wired the teacher-details page course cards to the public course details route so the Show Details button opens the specific course instead of doing nothing.
- Kept the change scoped to the button/link layer; the course data and rendering flow remain unchanged.

## 2026-03-27 - Signup phone restrictions unification - GPT-5.4 mini
- Applied the same Egyptian phone rules to the public signup flow for student, parent, and teacher phone fields.
- Added shared phone sanitization/normalization helpers so client-side input, server-side validation, and registration persistence all follow the same format.

## 2026-03-27 - Lecture page pagination refresh - GPT-5.4 mini
- Reworked the lecture list page pagination into the new token-based button style and aligned the surrounding filter, table, and detail-button surfaces with the updated design language.
- Fixed a nearby lecture-details modal branch that was breaking the frontend build, so the page changes could be verified cleanly.

## 2026-03-26 - Promo code admin card refresh - GPT-5.4 mini
- Refreshed the promo code management surface to use the newer token-based panel styling, including softer surfaces, rounded section cards, and stronger section hierarchy.
- Updated the filter block, table chrome, action buttons, and delete confirmation dialogs to match the current admin design language.

## 2026-03-26 - Lecturer course card expressive pass - GPT-5.3-Codex
- Reworked lecturer course cards into a more deliberate media-led layout with gradient overlay, tokenized type/price pills, and denser metadata chips.
- Tightened the action row and stats block so the cards feel closer to a designed product surface than a generic list item.
- Kept the redesign within the existing token palette and radius/shadow system, preserving behavior and routes.

## 2026-03-26 - Lecturer dashboard rhythm pass - GPT-5.3-Codex
- Refined the lecturer dashboard shell to use a tokenized page atmosphere, softer section frames, and stronger heading hierarchy.
- Updated dashboard stat cards to use token-based surfaces, icon chips, spacing, and typography that better match the newer course detail rhythm.
- Tightened spacing and section subtitles in course and assistants lists so the page feels more cohesive with the current design system.

## 2026-03-26 - Lecturer dashboard card token refresh - GPT-5.3-Codex
- Restyled lecturer course cards in `CourseGrid` to use design tokens for color, radius, shadows, and action chip treatment.
- Updated assistants section cards and empty state in `InstructorsList` to the same tokenized card language (surface, border, CTA, edit/delete controls).
- Kept existing behavior intact while modernizing visuals to match the current design system.

## 2026-03-26 - Parent phone 10-digit + RTL-safe sanitization - GPT-5.3-Codex
- Hardened student signup parent phone validation/normalization to accept `XXXXXXXXXX`, `0XXXXXXXXXX`, and `+20XXXXXXXXXX` consistently.
- Added Arabic numeral normalization and invisible RTL character stripping in both frontend and backend phone sanitizers to prevent false invalid-format errors.
- Updated parent phone input UX with `inputMode="tel"` and LTR direction to reduce entry issues on Arabic keyboards.

## 2026-03-26 - Course breakdown compact layout - GPT-5.3-Codex
- Compacted nested course breakdown cards in `CourseDetails` by reducing inner spacing, badge density, and button height/width so mobile layouts are less bulky.
- Reworked action buttons to avoid full-width stacking on mobile and keep controls readable without consuming excessive vertical space.
- Added viewport-bounded scroll behavior for expanded top-level breakdown content to keep the opened tree within screen-height constraints while preserving full visibility via scroll.

## 2026-03-26 - Accept flat 10-digit parent phone input - GPT-5.3-Codex
- Updated student parent phone validation to also accept `XXXXXXXXXX` (10 digits without a leading zero), in addition to `+20XXXXXXXXXX` and `0XXXXXXXXXX`.
- Updated frontend and backend normalization so both local formats (`0XXXXXXXXXX` and `XXXXXXXXXX`) are converted to canonical `+20XXXXXXXXXX` before save.

## 2026-03-26 - Egyptian parent phone format enforcement - GPT-5.3-Codex
- Enforced student `parentPhoneNumber` validation to accept only `+20` plus exactly 10 digits, with an allowed local-input exception of `0` plus 10 digits.
- Added frontend normalization so `0XXXXXXXXXX` is converted to `+20XXXXXXXXXX` before submit.
- Added backend normalization/guard to store student parent phone in canonical `+20XXXXXXXXXX` format and reject invalid shapes.

## 2026-03-26 - Student parent phone required on signup - GPT-5.3-Codex
- Made `parentPhoneNumber` mandatory in student Joi validation (`trim().required()`) so empty or whitespace values are rejected.
- Added a student registration controller guard that returns a clear 400 error when parent phone is missing.
- Enforced `parentPhoneNumber` as required in the Student mongoose schema for persistence-level validation.

## 2026-03-25 - Translation follow-up pass - GPT-5.4-mini
- Added missing lecture feedback keys, center dashboard course-card fallbacks, and lecturer assistant error strings to remove remaining live Arabic/English fallbacks.
- Updated the i18n audit flattening logic so object-valued locale paths are counted correctly when source code uses `returnObjects` lookups.
- Reran the frontend translation audit to refresh the missing-key baseline after the remediation pass.

## 2026-03-25 - Translation audit runner implementation - GPT-5.4-mini
- Added a repeatable frontend i18n audit script that scans source translation usage, compares EN/AR locale namespaces, and writes the machine-readable coverage report.
- Exposed the audit through an npm script so the audit baseline can be regenerated from the frontend package on demand.
- Regenerated the translation audit report with the new runner to refresh the current namespace and missing-key baseline.

## 2026-03-25 - Translation hotspot remediation pass - GPT-5.3-Codex
- Implemented a focused EN/AR translation fix pass for the highest-impact audit hotspots: admin, promoCodes, lectureDisplay, centerDashboard, and common direction handling.
- Added missing keys used by user management exports, promo child/account flows, lecture exit/homework gating dialogs, and center dashboard compatibility aliases.
- Revalidated targeted hotspot coverage with an automated key-presence check showing zero remaining missing keys in the remediated set.

## 2026-03-25 - Translation coverage audit - GPT-5.3-Codex
- Ran a full EN/AR i18n audit across all frontend locale namespaces and source key usage references.
- Generated a machine-readable report at kalima-platform/frontend/translation-audit-report.json with namespace parity, missing used keys, and suspicious untranslated-value candidates.
- Identified highest-impact gap clusters in admin, promoCodes, centerDashboard, lectureDisplay, and common namespaces for prioritized remediation.

## 2026-03-26 - Lecturer sidebar label correction - GPT-5.3-Codex
- Renamed the lecturer dashboard sidebar item from "Lectures" to "My Courses" using the existing common translation key so the label matches the intended meaning.

## 2026-03-25 - Signup RTL and privacy localization - GPT-5.3-Codex
- Localized the Step 4 privacy agreement sentence using register locale keys (EN/AR) instead of hardcoded English.
- Updated signup navigation button rendering to invert action order in Arabic RTL so the primary submit/next action appears on the expected side.

## 2026-03-25 - Login localization and hero refresh - GPT-5.3-Codex
- Added missing login locale keys (EN/AR) for hero heading/subtext, helper tip, social-login labels, and field placeholders to prevent Arabic fallback to English.
- Updated the login hero image source to a local education-themed asset with a reliable local fallback.

## 2026-03-25 - Frontend cleanup - GPT-5.4-mini Medium Reasoning
- Normalized Tailwind `calc()` utility classes to avoid invalid spacing output.
- Fixed the broken JSX closing tag in the lecture container loading state.
- Verified the frontend production build completes successfully. ##DONT INCLUDE VERIFIED FRONTEND PRODUCTION LINE AGAIN

## 2026-03-25 - Logging workflow update - GPT-5.3-Codex
- Added a standing workflow to append concise release/update notes to Agent-Logs.md after each finished prompt.
- Excluded non-useful bullets such as build verification lines from future log entries.

## 2026-03-25 - Route scroll reset - GPT-5
- Added automatic scroll-to-top on route changes so new pages open at the top.

## 2026-03-25 - Container line alignment - GPT-5
- Aligned the nested container accent line to sit flush with the container edge.

## 2026-03-25 - Stitch MCP setup - GPT-5
- Added the Stitch MCP server config to VS Code with the provided API token.

## 2026-03-25 - Login hero revamp - GPT-5
- Replaced the login page raster image with a branded, high-quality vector illustration and subtle motion.

## 2026-03-25 - Courses form compaction - GPT-5
- Removed the redundant total course price block from basic info.
- Tightened spacing in the basic information section to reduce vertical bloat.

## 2026-03-25 - Container connector cleanup - GPT-5
- Removed the unstable nested connector lines from the course container/lecture tree to eliminate visual misalignment.

## 2026-03-25 - Course actions localization - GPT-5
- Localized the container tree toggle button labels by adding dedicated `actions.show` and `actions.hide` keys in `courseDetails` EN/AR locales.

## 2026-03-25 - CoursesForm UX redesign - GPT-5
- Applied the new theme styling to the `CoursesForm` page with a focused hero header and clear 3-step guidance.
- Compacted core form controls and spacing in both basic info and content creation sections to reduce wasted space.
- Reorganized lecture creation inputs into denser two-column groups for faster data entry.

## 2026-03-25 - Ambient animation removal - GPT-5
- Removed decorative floating/zigzag/spin utility animations globally so dotted/ring/wave ornaments no longer drift.
- Removed remaining infinite decorative motion loops from login and services visuals.

## 2026-03-25 - CoursesForm onboarding checklist - GPT-5
- Added a sticky side checklist with live progress to guide first-time course creation step by step.
- Linked checklist completion states to real form/structure data (basic info, parent, container, lecture, review).

## 2026-03-25 - Sidebar link for CoursesForm - GPT-5
- Added `CoursesForm` as a lecturer sidebar item with localized EN/AR label (`createCourse`).

### March 26, 2026
- **Refactor:** Completely restructured the Teacher/Lecturer Details page (Teacher-details.jsx) to leverage the latest Fekra design system tokens (e.g., bg-primary, bg-base-100, accent highlights, organic layered background blobs). Organized component layout by extracting logical pieces into smaller functional components, improving UI scale, RTL text alignment, readability, and modern card styling.


## 2026-03-26 - Admin table filters & pagination redesign - Copilot
- Updated standard DaisyUI `<input>` and `<select>` filter elements across `userManageTable.jsx` and `LecturesPage.jsx` to use the custom design tokens (soft borders, cream surface active states, teal accents).
- Rewrote the `Pagination.jsx` component to override rigid joining classes with separated, pill-shaped pagination numeric buttons using `TOKENS` colors (`warmMango` for active page, `deepTeal` for inactive text).

- **Dashboard UI Update**: Refactored \CourseGrid.jsx\ and \InstructorsList.jsx\ to match the new Fekra design tokens. Applied soft shadows (\shadow-[0_6px_16px_...]\), high radii (\
ounded-[2rem]\), removed hard \shadow-sm\ defaults from DaisyUI, updated primary buttons to large pill shapes, and fine-tuned content paddings for Arabic-first Dashboard.


- Update: Refactored mobile breakdown container in `CourseDetails.jsx` (lines 80-210) to a highly compact horizontal flex view. Dropped buttons and badges down to 10px-11px ranges, reduced generic paddings from massive tailwind defaults to fixed micro-values, keeping depth nesting free of clutter.

- Update: Added a success modal popup to the Course Details page upon successful purchase, prompting the user to view the course in their dashboard with 'Yes' and 'Later' options styled according to the Fekra design system.

- Update: Renamed the student promo-codes page hero to a generic account dashboard title/subtitle in both English and Arabic so the top banner matches the actual profile/referral/children content below it.

- Update: Removed leftover temporary helper scripts from the repo and added `kalima-platform/frontend/temp-scripts/` to `.gitignore` so future scratch code stays out of deployed builds.

- Update: Restored missing src/routes/packages.jsx API module to fix Vite build resolution failure from AddNewStuff.jsx (unresolved import ../../../routes/packages).

- Update: Removed package feature code from admin account creation and purchase/audit flows so the system now only manages subjects and levels; also removed stale package-named icon usage and refreshed admin subtitle wording to exclude packages.

- Update: Redesigned the lecture creation popup into a wider two-column workspace with a thumbnail preview, publish summary sidebar, and sticky action footer for better UX on the admin lecture screens.

## 2026-03-26 - Exam/homework config hardening phase 1 - GPT-5.3-Codex
- Fixed lecture exam/homework persistence flow to save threshold fields, validate config ownership/type, and keep update behavior consistent when toggling requirements.
- Corrected homework config model reference and unified threshold precedence across access-check and verification endpoints (lecture override first, config default fallback).
- Hardened config/link inputs by validating public HTTP/HTTPS URLs, blocked server-side download proxying for link attachments, and added role/ownership checks for lecture attachment uploads.
- Tightened student lecture gating in the frontend by removing the permissive fallback that previously granted access when verification checks failed.



## 2026-03-27 - Logging rule reminder - GPT-5.4 mini
- Keep appending concise release/update notes to Agent-Logs.md after each finished task.
- Skip low-value verification bullets so the log stays focused on shipped changes.

## 2026-03-27 - Courses page newest-first default - GPT-5.4 mini
- Updated the public courses page to sort course containers by newest createdAt first before pagination.
- Made the request explicit with sort: "-createdAt" and added a local fallback sort so the default remains newest-first even if upstream ordering changes.

## 2026-03-27 - Public courses search field - GPT-5.4 mini
- Added a client-side search field to the public courses page so users can filter courses by title, subject, or teacher.
- Kept the newest-first ordering as the default by searching within the already sorted course list.
- Added EN/AR search labels and placeholders while preserving pagination and reset behavior.

## 2026-03-27 - Lecture play-start accounting endpoint - GPT-5.4 mini
- Added a dedicated atomic play-start endpoint for student lecture access accounting and kept the legacy consume-view route as a compatibility alias.
- Swapped the lecture player to the new play-start helper and surfaced visible retry status during soft fallback attempts.
- Locked the lecture access flow to the student owner path while preserving the existing entitlement and idempotency checks.

## 2026-03-27 - Lecturer sidebar label correction - GPT-5.4 mini
- Renamed the lecturer sidebar item from Lectures to My Courses by reusing the shared courses translation key.
- Kept the route unchanged so the label now matches the actual courses management page.

