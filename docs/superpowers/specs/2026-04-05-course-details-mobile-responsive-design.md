# Course Details Page — Mobile Responsiveness Design

**Date:** 2026-04-05
**File:** `kalima-platform/frontend/src/pages/CourseDetails.jsx`

---

## Goal

Make the Course Details page fully responsive across all screen sizes (mobile, tablet, desktop) without altering layout structure or functionality.

---

## Issues & Fixes

### 1. Tabs → Dropdown on Mobile (`< sm` / 640px)

**Problem:** 5 tab buttons × `min-w-[120px]` = ~620px minimum width — overflows any phone screen.

**Fix:** Conditionally render:
- `< sm`: a styled native `<select>` that calls `setActiveTab` on change, showing the current tab label.
- `sm+`: existing pill button row, unchanged.

Use Tailwind's `sm:hidden` / `hidden sm:flex` to switch between the two.

### 2. Hero Section

**Problem:**
- `h1` is `text-4xl` on mobile with no `sm:` breakpoint — very large on small screens.
- Padding is `p-8` with no mobile reduction.
- Action buttons have `px-8` — can push layout on very small screens.

**Fix:**
- Title: `text-2xl sm:text-4xl lg:text-6xl`
- Hero padding: `p-5 sm:p-8 lg:p-12`
- Action buttons: `px-5 sm:px-8`

### 3. Quick Stats Negative Margin Overlap

**Problem:** `-mt-16` overlaps the hero section. On mobile the hero stacks into two rows (image below text), making it ~2× taller — the overlap visually breaks the layout.

**Fix:** `-mt-6 sm:-mt-16`

### 4. Tab Content Area Padding

**Problem:** `p-8` on all sizes — cramped on narrow screens.

**Fix:** `p-4 sm:p-8`

### 5. Right Sidebar Padding

**Problem:** `p-8` padding inside the sticky sidebar card.

**Fix:** `p-5 sm:p-8`

---

## Breakpoints Used

| Breakpoint | Width   | Behaviour                          |
|------------|---------|------------------------------------|
| default    | < 640px | Dropdown tab, reduced padding      |
| `sm`       | 640px+  | Pill tabs, full padding            |
| `lg`       | 1024px+ | 3-column grid, largest hero title  |

---

## Out of Scope

- No structural layout changes
- No new components or files
- No changes to functionality, data fetching, or translations
