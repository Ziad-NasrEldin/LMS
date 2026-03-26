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
