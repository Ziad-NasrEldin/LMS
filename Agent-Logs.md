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

## 2026-03-25 - Container connector cleanup - GPT-5
- Removed the unstable nested connector lines from the course container/lecture tree to eliminate visual misalignment.

## 2026-03-25 - Course actions localization - GPT-5
- Localized the container tree toggle button labels by adding dedicated `actions.show` and `actions.hide` keys in `courseDetails` EN/AR locales.
