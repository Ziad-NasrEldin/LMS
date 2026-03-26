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
