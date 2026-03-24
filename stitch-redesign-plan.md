# Fekra Stitch Redesign Plan (Step-by-Step)

## Goal
Redesign all frontend pages in kalima-platform/frontend systematically using:
- Existing design system in design.md
- Stitch MCP server
- Stitch skills workflow (text-to-design, edit-design, generate-design-md)

This plan is intentionally incremental. We redesign one batch at a time, validate, then continue.

## Current Status
- Route map source: kalima-platform/frontend/src/App.jsx
- Design source of truth: design.md
- Stitch MCP doctor result: not ready (gcloud missing/auth not configured/project not set)

## Execution Principles
1. Never redesign all pages at once.
2. Lock visual tokens first (from design.md) and reuse across every page.
3. Redesign by route batch, not by random file order.
4. Every batch ends with review + sign-off before next batch starts.
5. Use edit iterations before regenerating from scratch.

## Phase 0: Environment Gate (Must Pass First)
### Tasks
- Install/configure gcloud CLI.
- Run Stitch init and auth flows:
  - npx @_davideast/stitch-mcp init
  - gcloud auth login
  - gcloud auth application-default login
- Set active Google Cloud project.
- Re-run doctor until all checks pass.

### Exit Criteria
- Stitch doctor passes all checks.
- We can list projects/screens from Stitch MCP.

## Phase 1: Design Baseline in Stitch
### Tasks
- Create or select Stitch project for Fekra web redesign.
- Seed Stitch prompts with design.md tokens:
  - Color roles, typography scale, RTL rules, component shape/elevation.
- Generate/update .stitch/DESIGN.md aligned to design.md.
- Create one visual reference screen (home hero) as style anchor.

### Exit Criteria
- .stitch/DESIGN.md exists and matches design.md.
- Approved anchor style screen exists.

## Phase 2: Public-Facing Core (Batch A)
### Routes
- /
- /courses
- /courses/:courseId
- /teachers
- /teacher-details/:userId
- /packages
- /package-details/:packageId
- /privacy-policy

### Tasks per page
1. Generate first draft via text-to-design.
2. Refine with edit-design using specific prompts.
3. Download assets to .stitch/designs.
4. Create implementation handoff notes (layout, components, states).

### Exit Criteria
- All Batch A pages visually consistent with design.md.
- RTL and mobile responsiveness validated.
- You approve batch before Batch B starts.

## Phase 3: Auth Journey (Batch B)
### Routes
- /login
- /register
- /forgot-password
- /verify-otp
- /reset-password

### Focus
- Conversion clarity, trust messaging, error states, input accessibility.

### Exit Criteria
- Complete auth flow is consistent and production-ready.

## Phase 4: Student + Shared Learning Surfaces (Batch C)
### Routes
- /dashboard/student-dashboard/lecture-page
- /dashboard/student-dashboard/promo-codes
- /dashboard/student-dashboard/container-details/:containerId
- /dashboard/student-dashboard/lecture-display/:lectureId
- /dashboard/student-dashboard/lectures-page
- /dashboard/settings
- Shared lecture/container views reused by assistant/lecturer

### Focus
- Information density, legible hierarchy, reusable cards/tables/modals.

### Exit Criteria
- Shared components are standardized and token-aligned.

## Phase 5: Role Dashboards (Batch D)
### Routes
- /dashboard/assistant-page (+ children)
- /dashboard/lecturer-dashboard (+ children)
- /dashboard/courses-dashboard
- /dashboard/center-dashboard

### Focus
- Dashboard IA, side-nav consistency, KPI readability, table/filter ergonomics.

### Exit Criteria
- All non-admin dashboards unified in system language.

## Phase 6: Admin + Store System (Batch E)
### Routes
- /dashboard/admin-dashboard
- /dashboard/admin-dashboard/audit-log
- /dashboard/admin-dashboard/create
- /dashboard/admin-dashboard/lectures-page
- /dashboard/admin-dashboard/store-dashboard
- /dashboard/admin-dashboard/signed-lecturers
- /dashboard/admin-dashboard/store-analytics
- /market
- /market/product-details/:type/:id

### Focus
- Complex workflows, form-heavy pages, analytics readability, operational efficiency.

### Exit Criteria
- Admin/store flows redesigned and validated without breaking usability.

## Per-Page Redesign Workflow (Repeatable)
1. Context capture:
   - Read current page JSX and dependent components.
   - Capture existing states (loading, empty, error, success).
2. Stitch generation:
   - Generate screen from enhanced prompt with design.md tokens.
3. Stitch refinement:
   - 1-3 targeted edit passes.
4. Asset sync:
   - Save screenshot + HTML under .stitch/designs.
5. Handoff:
   - Map design sections to React components/files.
6. Approval:
   - You sign off before implementation or before next page.

## Deliverables Per Batch
- Updated .stitch/designs assets per page.
- Batch summary markdown with:
  - Route covered
  - Design decisions
  - Open questions
  - Reusable component opportunities
- Implementation queue ordered by impact/risk.

## QA Checklist for Every Batch
- RTL correctness (alignment/order/icon mirroring where needed)
- Mobile/tablet/desktop behavior
- Color contrast and readability
- Consistent spacing/radius/shadow tokens
- Form and validation state visuals
- Empty/loading/error states designed (not forgotten)

## Suggested Working Cadence
- Step 1: Finish Phase 0 and Phase 1.
- Step 2: Start Batch A with only two pages first:
  - /
  - /courses
- Step 3: Review together and lock pattern.
- Step 4: Continue remaining Batch A pages.

## Risks and Controls
- Risk: Style drift across batches.
  - Control: Always reference design.md and .stitch/DESIGN.md in prompts.
- Risk: Redesign quality varies by page complexity.
  - Control: Shared per-page workflow and batch sign-off gate.
- Risk: Tool/setup blockers.
  - Control: Do not start redesign generation until Phase 0 passes.

## Immediate Next Action
Execute Phase 0 setup until Stitch doctor passes, then generate the first two pages in Batch A (home and courses) only.
