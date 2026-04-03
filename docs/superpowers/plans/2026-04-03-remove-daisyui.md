# Remove DaisyUI — Custom Design System Migration

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all 2,300+ DaisyUI class references across 73 files with a custom design system CSS file that uses identical class names, backed by the project's own design tokens.

**Architecture:** Create `src/styles/ds.css` that re-implements every DaisyUI component class (btn, input, modal, card, badge, alert, table, tabs, dropdown, toggle, checkbox, loading, avatar, etc.) using the project's `designTokens.js` values. Add DaisyUI's theme color names to Tailwind config so utility classes (`bg-primary`, `text-base-content`, `hover:bg-base-200`, etc.) keep working. Remove the DaisyUI npm package. Because class names stay identical, 53 of 73 affected files need zero JSX changes — only the 20 files using `modal-open` or CSS-only dropdown focus trick need code adjustments, and even these are minimal (the modal pattern works with our CSS as-is).

**Tech Stack:** React, Tailwind CSS v3, custom CSS (no new dependencies)

---

## Design Token Reference

```
deepTeal:       #0E5563   → primary
richTeal:       #146A78   → secondary
softCyanTeal:   #4DB3C2   → info
lightAquaMist:  #BCE7EC   → light accent bg
warmMango:      #F39A3F   → accent / warning
goldenSand:     #EBC468   → base-300
creamSurface:   #F8F3E9   → base-100
neutralCloud:   #F1F3F6   → base-200
inkText:        #111827   → base-content
slateText:      #374151   → neutral
```

---

## File Map

| Action | File |
|--------|------|
| Create | `kalima-platform/frontend/src/styles/ds.css` |
| Modify | `kalima-platform/frontend/src/index.css` |
| Modify | `kalima-platform/frontend/tailwind.config.js` |
| Modify | `kalima-platform/frontend/package.json` |
| No change needed | 53 files — styles auto-update via ds.css |

---

## Task 1: Create the Design System CSS File

**Files:**
- Create: `kalima-platform/frontend/src/styles/ds.css`

- [ ] **Step 1: Create `src/styles/ds.css` with all component styles**

```css
/* ============================================================
   FEKRA DESIGN SYSTEM — ds.css
   Replaces DaisyUI. Class names are kept identical so no JSX
   changes are needed in files that only use styling classes.
   ============================================================ */

/* ── BUTTONS ─────────────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0 1rem;
  height: 3rem;
  min-height: 3rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 0.5rem;
  border: 1px solid transparent;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s, opacity 0.15s, box-shadow 0.15s;
  background: #F1F3F6;
  color: #374151;
  text-decoration: none;
  white-space: nowrap;
}
.btn:hover { filter: brightness(0.95); }
.btn:active { filter: brightness(0.9); }
.btn:disabled,
.btn[disabled] { opacity: 0.45; cursor: not-allowed; pointer-events: none; }

.btn-primary   { background: #0E5563; color: #fff; border-color: #0E5563; }
.btn-secondary { background: #146A78; color: #fff; border-color: #146A78; }
.btn-accent    { background: #F39A3F; color: #fff; border-color: #F39A3F; }
.btn-neutral   { background: #374151; color: #fff; border-color: #374151; }
.btn-info      { background: #4DB3C2; color: #111827; border-color: #4DB3C2; }
.btn-success   { background: #16a34a; color: #fff; border-color: #16a34a; }
.btn-warning   { background: #F39A3F; color: #111827; border-color: #F39A3F; }
.btn-error     { background: #dc2626; color: #fff; border-color: #dc2626; }

.btn-ghost   { background: transparent; border-color: transparent; color: inherit; }
.btn-ghost:hover { background: rgba(17,24,39,0.07); }

.btn-outline { background: transparent; border-color: currentColor; }
.btn-outline.btn-primary { color: #0E5563; border-color: #0E5563; }
.btn-outline.btn-primary:hover { background: #0E5563; color: #fff; }
.btn-outline.btn-secondary { color: #146A78; border-color: #146A78; }
.btn-outline.btn-secondary:hover { background: #146A78; color: #fff; }
.btn-outline:hover { background: currentColor; }

.btn-link { background: transparent; border-color: transparent; text-decoration: underline; color: #0E5563; }
.btn-block { width: 100%; }

.btn-xs  { height: 1.5rem; min-height: 1.5rem; padding: 0 0.5rem;  font-size: 0.6875rem; }
.btn-sm  { height: 2rem;   min-height: 2rem;   padding: 0 0.75rem; font-size: 0.75rem; }
.btn-md  { height: 3rem;   min-height: 3rem;   padding: 0 1rem;    font-size: 0.875rem; }
.btn-lg  { height: 4rem;   min-height: 4rem;   padding: 0 1.5rem;  font-size: 1rem; }

.btn-circle { border-radius: 9999px; padding: 0; width: 3rem; }
.btn-circle.btn-xs { width: 1.5rem; }
.btn-circle.btn-sm { width: 2rem; }
.btn-circle.btn-lg { width: 4rem; }

.btn-square { padding: 0; width: 3rem; }
.btn-square.btn-xs { width: 1.5rem; }
.btn-square.btn-sm { width: 2rem; }
.btn-square.btn-lg { width: 4rem; }

/* ── FORM CONTROL & LABEL ────────────────────────────────── */
.form-control {
  display: flex;
  flex-direction: column;
}
.label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.25rem 0;
  gap: 0.5rem;
}
.label-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}
.label-text-alt {
  font-size: 0.75rem;
  color: #374151;
  opacity: 0.65;
}

/* ── INPUT ───────────────────────────────────────────────── */
.input {
  display: block;
  width: 100%;
  padding: 0 0.75rem;
  height: 3rem;
  min-height: 3rem;
  border: 1px solid rgba(17,24,39,0.15);
  border-radius: 0.5rem;
  background: rgba(17,24,39,0.03);
  font-size: 0.875rem;
  color: #111827;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: inherit;
}
.input::placeholder { color: rgba(17,24,39,0.35); }
.input:focus {
  border-color: rgba(14,85,99,0.46);
  box-shadow: 0 0 0 3px rgba(77,179,194,0.22);
}
.input:disabled { opacity: 0.5; cursor: not-allowed; background: #F1F3F6; }
.input-bordered { border-color: rgba(17,24,39,0.2); }
.input-ghost { border-color: transparent; background: transparent; }
.input-ghost:focus { background: rgba(17,24,39,0.03); }

.input-xs  { height: 1.5rem; min-height: 1.5rem; font-size: 0.6875rem; padding: 0 0.5rem; }
.input-sm  { height: 2rem;   min-height: 2rem;   font-size: 0.75rem;   padding: 0 0.625rem; }
.input-md  { height: 3rem;   min-height: 3rem;   font-size: 0.875rem; }
.input-lg  { height: 4rem;   min-height: 4rem;   font-size: 1rem;      padding: 0 1rem; }

.input-primary:focus   { border-color: #0E5563; box-shadow: 0 0 0 3px rgba(14,85,99,0.2); }
.input-secondary:focus { border-color: #146A78; box-shadow: 0 0 0 3px rgba(20,106,120,0.2); }
.input-error:focus     { border-color: #dc2626; box-shadow: 0 0 0 3px rgba(220,38,38,0.2); }
.input-error           { border-color: #dc2626; }

/* ── INPUT GROUP ─────────────────────────────────────────── */
.input-group {
  display: flex;
  align-items: stretch;
}
.input-group .input { border-radius: 0.5rem 0 0 0.5rem; flex: 1; }
[dir="rtl"] .input-group .input { border-radius: 0 0.5rem 0.5rem 0; }
.input-group > .btn { border-radius: 0 0.5rem 0.5rem 0; flex-shrink: 0; }
[dir="rtl"] .input-group > .btn { border-radius: 0.5rem 0 0 0.5rem; }

/* ── SELECT ──────────────────────────────────────────────── */
.select {
  display: block;
  width: 100%;
  padding: 0 2.25rem 0 0.75rem;
  height: 3rem;
  min-height: 3rem;
  border: 1px solid rgba(17,24,39,0.15);
  border-radius: 0.5rem;
  background-color: rgba(17,24,39,0.03);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23374151' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1rem;
  appearance: none;
  font-size: 0.875rem;
  color: #111827;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: inherit;
}
[dir="rtl"] .select {
  padding: 0 0.75rem 0 2.25rem;
  background-position: left 0.75rem center;
}
.select:focus {
  border-color: rgba(14,85,99,0.46);
  box-shadow: 0 0 0 3px rgba(77,179,194,0.22);
}
.select:disabled { opacity: 0.5; cursor: not-allowed; }
.select-bordered { border-color: rgba(17,24,39,0.2); }
.select-ghost { border-color: transparent; background-color: transparent; }
.select-sm  { height: 2rem; min-height: 2rem; font-size: 0.75rem; padding-right: 2rem; padding-left: 0.625rem; }
.select-lg  { height: 4rem; min-height: 4rem; font-size: 1rem; }

/* ── TEXTAREA ────────────────────────────────────────────── */
.textarea {
  display: block;
  width: 100%;
  padding: 0.625rem 0.75rem;
  min-height: 6rem;
  border: 1px solid rgba(17,24,39,0.15);
  border-radius: 0.5rem;
  background: rgba(17,24,39,0.03);
  font-size: 0.875rem;
  color: #111827;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: inherit;
  line-height: 1.5;
}
.textarea::placeholder { color: rgba(17,24,39,0.35); }
.textarea:focus {
  border-color: rgba(14,85,99,0.46);
  box-shadow: 0 0 0 3px rgba(77,179,194,0.22);
}
.textarea-bordered { border-color: rgba(17,24,39,0.2); }
.textarea-ghost { border-color: transparent; background: transparent; }
.textarea-sm  { min-height: 4rem; font-size: 0.75rem; }
.textarea-lg  { min-height: 8rem; font-size: 1rem; }

/* ── FILE INPUT ──────────────────────────────────────────── */
.file-input {
  display: block;
  width: 100%;
  border: 1px solid rgba(17,24,39,0.15);
  border-radius: 0.5rem;
  background: rgba(17,24,39,0.03);
  font-size: 0.875rem;
  color: #111827;
  cursor: pointer;
  outline: none;
  font-family: inherit;
}
.file-input:focus { border-color: rgba(14,85,99,0.46); box-shadow: 0 0 0 3px rgba(77,179,194,0.22); }
.file-input::file-selector-button {
  padding: 0.5rem 1rem;
  background: #0E5563;
  color: #fff;
  border: none;
  border-radius: 0.375rem 0 0 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  margin-inline-end: 0.75rem;
}
.file-input-bordered { border-color: rgba(17,24,39,0.2); }
.file-input-sm  { font-size: 0.75rem; }
.file-input-lg  { font-size: 1rem; }

/* ── CHECKBOX ────────────────────────────────────────────── */
.checkbox {
  appearance: none;
  width: 1.25rem;
  height: 1.25rem;
  min-width: 1.25rem;
  border: 2px solid rgba(17,24,39,0.3);
  border-radius: 0.25rem;
  cursor: pointer;
  position: relative;
  transition: background 0.15s, border-color 0.15s;
  background: #fff;
  vertical-align: middle;
}
.checkbox:checked {
  background: #0E5563;
  border-color: #0E5563;
}
.checkbox:checked::after {
  content: '';
  position: absolute;
  width: 5px;
  height: 9px;
  border: 2px solid #fff;
  border-top: none;
  border-left: none;
  transform: rotate(45deg);
  top: 1px;
  left: 4px;
}
.checkbox:focus { outline: none; box-shadow: 0 0 0 3px rgba(77,179,194,0.3); }
.checkbox-sm { width: 1rem; height: 1rem; min-width: 1rem; }
.checkbox-lg { width: 1.5rem; height: 1.5rem; min-width: 1.5rem; }
.checkbox-primary:checked { background: #0E5563; border-color: #0E5563; }
.checkbox-secondary:checked { background: #146A78; border-color: #146A78; }

/* ── RADIO ───────────────────────────────────────────────── */
.radio {
  appearance: none;
  width: 1.25rem;
  height: 1.25rem;
  min-width: 1.25rem;
  border: 2px solid rgba(17,24,39,0.3);
  border-radius: 9999px;
  cursor: pointer;
  position: relative;
  transition: all 0.15s;
  background: #fff;
  vertical-align: middle;
}
.radio:checked {
  border-color: #0E5563;
  background: radial-gradient(circle, #0E5563 45%, transparent 45%);
}
.radio:focus { outline: none; box-shadow: 0 0 0 3px rgba(77,179,194,0.3); }
.radio-primary:checked { border-color: #0E5563; background: radial-gradient(circle, #0E5563 45%, transparent 45%); }

/* ── TOGGLE ──────────────────────────────────────────────── */
.toggle {
  appearance: none;
  width: 3rem;
  height: 1.5rem;
  border-radius: 9999px;
  background: #d1d5db;
  cursor: pointer;
  position: relative;
  transition: background 0.2s;
  flex-shrink: 0;
}
.toggle::before {
  content: '';
  position: absolute;
  width: 1.125rem;
  height: 1.125rem;
  border-radius: 9999px;
  background: #fff;
  top: 0.1875rem;
  left: 0.1875rem;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.25);
}
.toggle:checked { background: #0E5563; }
.toggle:checked::before { transform: translateX(1.5rem); }
.toggle:focus { outline: none; box-shadow: 0 0 0 3px rgba(77,179,194,0.3); }
.toggle-sm { width: 2.25rem; height: 1.125rem; }
.toggle-sm::before { width: 0.875rem; height: 0.875rem; top: 0.125rem; left: 0.125rem; }
.toggle-sm:checked::before { transform: translateX(1.125rem); }
.toggle-primary:checked { background: #0E5563; }
.toggle-secondary:checked { background: #146A78; }

/* ── LOADING SPINNER ─────────────────────────────────────── */
@keyframes ds-spin { to { transform: rotate(360deg); } }

.loading {
  display: inline-block;
  vertical-align: middle;
}
.loading-spinner {
  width: 1.5rem;
  height: 1.5rem;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 9999px;
  animation: ds-spin 0.75s linear infinite;
}
.loading-xs.loading-spinner,
.loading-spinner.loading-xs { width: 1rem;    height: 1rem;    border-width: 2px; }
.loading-sm.loading-spinner,
.loading-spinner.loading-sm { width: 1.25rem; height: 1.25rem; border-width: 2px; }
.loading-md.loading-spinner,
.loading-spinner.loading-md { width: 1.5rem;  height: 1.5rem; }
.loading-lg.loading-spinner,
.loading-spinner.loading-lg { width: 2.5rem;  height: 2.5rem; border-width: 3px; }

/* ── BADGE ───────────────────────────────────────────────── */
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.5rem;
  height: 1.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 9999px;
  background: #F1F3F6;
  color: #374151;
  border: 1px solid transparent;
  white-space: nowrap;
}
.badge-primary   { background: #0E5563; color: #fff; }
.badge-secondary { background: #146A78; color: #fff; }
.badge-accent    { background: #F39A3F; color: #fff; }
.badge-neutral   { background: #374151; color: #fff; }
.badge-info      { background: #4DB3C2; color: #111827; }
.badge-success   { background: #16a34a; color: #fff; }
.badge-warning   { background: #F39A3F; color: #111827; }
.badge-error     { background: #dc2626; color: #fff; }
.badge-ghost     { background: transparent; border-color: rgba(17,24,39,0.15); }
.badge-outline   { background: transparent; border-color: currentColor; }
.badge-xs  { height: 1rem;    font-size: 0.625rem; padding: 0 0.375rem; }
.badge-sm  { height: 1.125rem; font-size: 0.6875rem; padding: 0 0.4375rem; }
.badge-lg  { height: 1.75rem; font-size: 0.875rem;  padding: 0 0.625rem; }

/* ── ALERT ───────────────────────────────────────────────── */
.alert {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 0.75rem;
  border: 1px solid transparent;
  background: #F1F3F6;
  color: #111827;
  font-size: 0.875rem;
}
.alert > svg,
.alert > .icon { flex-shrink: 0; width: 1.25rem; height: 1.25rem; margin-top: 0.1rem; }
.alert-error   { background: #fef2f2; border-color: #fca5a5; color: #991b1b; }
.alert-success { background: #f0fdf4; border-color: #86efac; color: #166534; }
.alert-warning { background: #fffbeb; border-color: #fcd34d; color: #92400e; }
.alert-info    { background: #ecfeff; border-color: #a5f3fc; color: #155e75; }
.alert-sm { padding: 0.625rem 0.875rem; font-size: 0.8125rem; }

/* ── CARD ────────────────────────────────────────────────── */
.card {
  border-radius: 1.4rem;
  overflow: hidden;
  background: #F8F3E9;
}
.card-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.card-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}
.card-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: auto;
}
.card-compact .card-body { padding: 0.75rem; }

/* ── TABLE ───────────────────────────────────────────────── */
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  color: #111827;
}
.table thead th {
  padding: 0.75rem 1rem;
  text-align: start;
  font-weight: 600;
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #374151;
  background: #F1F3F6;
  border-bottom: 1px solid rgba(17,24,39,0.1);
  white-space: nowrap;
}
.table tbody td {
  padding: 0.875rem 1rem;
  border-bottom: 1px solid rgba(17,24,39,0.06);
  vertical-align: middle;
}
.table tbody tr:last-child td { border-bottom: none; }
.table tbody tr:hover { background: rgba(17,24,39,0.025); }
.table-compact thead th,
.table-compact tbody td { padding: 0.5rem 0.75rem; }
.table-zebra tbody tr:nth-child(even) { background: rgba(17,24,39,0.025); }
.table-pin-rows thead th { position: sticky; top: 0; z-index: 1; }

/* ── MODAL ───────────────────────────────────────────────── */
.modal {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 1000;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.5);
  padding: 1rem;
  overflow-y: auto;
}
.modal.modal-open {
  display: flex;
}
.modal-box {
  background: #F8F3E9;
  border-radius: 1.25rem;
  padding: 1.5rem;
  width: 100%;
  max-width: 28rem;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 12px 28px rgba(0,0,0,0.18);
  position: relative;
  margin: auto;
}
.modal-action {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
}

/* ── DROPDOWN ────────────────────────────────────────────── */
.dropdown {
  position: relative;
  display: inline-block;
}
.dropdown-content {
  display: none;
  position: absolute;
  top: calc(100% + 0.25rem);
  left: 0;
  z-index: 200;
  min-width: 10rem;
  padding: 0.375rem;
  background: #F8F3E9;
  border-radius: 0.875rem;
  box-shadow: 0 6px 20px rgba(0,0,0,0.12);
  border: 1px solid rgba(17,24,39,0.08);
}
.dropdown:focus-within .dropdown-content { display: block; }
.dropdown-end .dropdown-content { left: auto; right: 0; }
.dropdown-top .dropdown-content { top: auto; bottom: calc(100% + 0.25rem); }

/* ── TABS ────────────────────────────────────────────────── */
.tabs {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-wrap: wrap;
}
.tabs-boxed {
  background: #F1F3F6;
  border-radius: 0.625rem;
  padding: 0.25rem;
}
.tabs-bordered {
  border-bottom: 2px solid rgba(17,24,39,0.1);
  gap: 0;
}
.tab {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  color: #374151;
  border: none;
  background: transparent;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
  outline: none;
}
.tab:hover { background: rgba(17,24,39,0.07); }
.tab.tab-active,
.tab[aria-selected="true"] {
  background: #0E5563;
  color: #fff;
}
.tabs-boxed .tab.tab-active { box-shadow: 0 1px 4px rgba(0,0,0,0.12); }
.tabs-bordered .tab {
  border-radius: 0.25rem 0.25rem 0 0;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}
.tabs-bordered .tab.tab-active {
  border-bottom-color: #0E5563;
  color: #0E5563;
  background: transparent;
}

/* ── MENU ────────────────────────────────────────────────── */
.menu {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  list-style: none;
  padding: 0;
  margin: 0;
}
.menu li > a,
.menu li > button,
.menu li > span {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s;
  border: none;
  background: transparent;
  width: 100%;
  text-align: start;
}
.menu li > a:hover,
.menu li > button:hover { background: rgba(17,24,39,0.07); }
.menu li > a.active,
.menu li > button.active { background: #0E5563; color: #fff; }
.menu-title {
  font-size: 0.6875rem;
  font-weight: 700;
  color: rgba(17,24,39,0.45);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0.5rem 0.75rem 0.25rem;
}

/* ── AVATAR ──────────────────────────────────────────────── */
.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.avatar > div,
.avatar-placeholder > div {
  border-radius: 9999px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}
.avatar img { width: 100%; height: 100%; object-fit: cover; }

/* ── DIVIDER ─────────────────────────────────────────────── */
.divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: rgba(17,24,39,0.3);
  font-size: 0.75rem;
  margin: 0.5rem 0;
}
.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(17,24,39,0.1);
}
.divider-vertical {
  flex-direction: column;
}
.divider-vertical::before,
.divider-vertical::after {
  width: 1px;
  height: auto;
  flex: 1;
}

/* ── NAVBAR ──────────────────────────────────────────────── */
.navbar {
  display: flex;
  align-items: center;
  min-height: 4rem;
  padding: 0 1rem;
  gap: 0.5rem;
  width: 100%;
}
.navbar-start {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 0.5rem;
}
.navbar-center {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.navbar-end {
  display: flex;
  align-items: center;
  flex: 1;
  justify-content: flex-end;
  gap: 0.5rem;
}

/* ── MISC UTILITIES ──────────────────────────────────────── */
.rounded-box { border-radius: 1rem; }

/* Swap (used for theme/icon toggles) */
.swap { display: inline-grid; user-select: none; cursor: pointer; }
.swap > * { grid-column-start: 1; grid-row-start: 1; }
.swap .swap-off,
.swap-indeterminate .swap-on,
.swap:not(.swap-active) .swap-on { opacity: 0; }
.swap-active .swap-on { opacity: 1; }
.swap-active .swap-off { opacity: 0; }

/* Step indicator */
.steps { display: flex; gap: 0; }
.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  flex: 1;
  position: relative;
  font-size: 0.75rem;
  color: #374151;
}
.step::before {
  content: '';
  display: block;
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  border: 2px solid rgba(17,24,39,0.2);
  background: #F8F3E9;
  z-index: 1;
}
.step-primary::before {
  background: #0E5563;
  border-color: #0E5563;
}

/* Collapse */
.collapse { overflow: hidden; }
.collapse-title { cursor: pointer; padding: 0.75rem 1rem; font-weight: 600; }
.collapse-content { padding: 0 1rem 0.75rem; }
```

- [ ] **Step 2: Verify file was created**

```bash
ls kalima-platform/frontend/src/styles/ds.css
```
Expected: file exists

---

## Task 2: Update `index.css` — Replace DaisyUI Theme Plugin with CSS Variables

**Files:**
- Modify: `kalima-platform/frontend/src/index.css`

- [ ] **Step 1: Replace the `@plugin "daisyui/theme"` block with a plain `:root` block**

Find and replace the entire `@plugin "daisyui/theme" { name: "a7a"; ... }` block with:

```css
:root {
  /* Base Colors */
  --color-base-100: #F8F3E9;
  --color-base-200: #F1F3F6;
  --color-base-300: #EBC468;
  --color-base-content: #111827;

  /* Primary */
  --color-primary: #0E5563;
  --color-primary-content: #FFFFFF;

  /* Secondary */
  --color-secondary: #146A78;
  --color-secondary-content: #FFFFFF;

  /* Accent */
  --color-accent: #F39A3F;
  --color-accent-content: #FFFFFF;

  /* Neutral */
  --color-neutral: #374151;
  --color-neutral-content: #FFFFFF;

  /* Info / Success / Warning / Error */
  --color-info: #4DB3C2;
  --color-info-content: #111827;
  --color-success: #16a34a;
  --color-success-content: #f0fdf4;
  --color-warning: #F39A3F;
  --color-warning-content: #111827;
  --color-error: #dc2626;
  --color-error-content: #fef2f2;
}
```

- [ ] **Step 2: Add import of ds.css at the top of index.css**

Add this line at the very top of `src/index.css`:
```css
@import './styles/ds.css';
```

---

## Task 3: Update `tailwind.config.js` — Add Token Colors, Remove DaisyUI

**Files:**
- Modify: `kalima-platform/frontend/tailwind.config.js`

- [ ] **Step 1: Replace tailwind.config.js with this content**

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        // Design token colors — enables bg-primary, text-base-100, etc.
        'base-100': '#F8F3E9',
        'base-200': '#F1F3F6',
        'base-300': '#EBC468',
        'base-content': '#111827',
        'primary': '#0E5563',
        'primary-content': '#FFFFFF',
        'secondary': '#146A78',
        'secondary-content': '#FFFFFF',
        'accent': '#F39A3F',
        'accent-content': '#FFFFFF',
        'neutral': '#374151',
        'neutral-content': '#FFFFFF',
        'info': '#4DB3C2',
        'info-content': '#111827',
        'success': '#16a34a',
        'success-content': '#f0fdf4',
        'warning': '#F39A3F',
        'warning-content': '#111827',
        'error': '#dc2626',
        'error-content': '#fef2f2',
      },
      animation: {
        'bounce-slow': 'bounce-slow 3s ease-in-out infinite',
      },
      keyframes: {
        'bounce-slow': {
          '0%, 100%': {
            transform: 'translateY(-25%)',
            animationTimingFunction: 'cubic-bezier(0.8,0,1,1)',
          },
          '50%': {
            transform: 'translateY(0)',
            animationTimingFunction: 'cubic-bezier(0,0,0.2,1)',
          },
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/postcss"),
  ],
};
```

---

## Task 4: Remove DaisyUI from package.json

**Files:**
- Modify: `kalima-platform/frontend/package.json`

- [ ] **Step 1: Remove daisyui from dependencies**

In `package.json`, find and delete the line:
```json
"daisyui": "^5.0.28",
```
(or whatever version is listed — remove the entire entry from `dependencies` or `devDependencies`)

- [ ] **Step 2: Uninstall daisyui**

```bash
cd kalima-platform/frontend && npm uninstall daisyui
```

Expected output: daisyui removed from node_modules and package.json

---

## Task 5: Start Dev Server and Baseline Check

- [ ] **Step 1: Start the dev server**

```bash
cd kalima-platform/frontend && npm run dev
```

Expected: server starts on http://localhost:5173 with no build errors

- [ ] **Step 2: Open the app and check the console for CSS/import errors**

Navigate to http://localhost:5173 and open DevTools console.
Expected: no errors about missing modules or failed CSS imports.

- [ ] **Step 3: Visit the CoursesForm page and visually verify inputs look styled**

Navigate to: http://localhost:5173/dashboard/lecturer-dashboard/CoursesForm/[any-id]
Expected: inputs, labels, buttons, selects all have visible styling matching the design tokens.

---

## Task 6: Fix Files — Form & Style-Only Files (No JS Changes Needed)

These 53 files get correct styles automatically from ds.css. This task is a **visual audit** — open each page and check nothing is broken.

**Pages to visit and verify:**

| Page | URL path |
|------|----------|
| Login | `/login` |
| Signup Step 1 | `/signup` |
| Forget Password | `/forgot-password` |
| Verify OTP | `/verify-otp` |
| Reset Password | `/reset-password` |
| Courses | `/courses` |
| Teachers | `/teachers` |
| Settings | `/settings` |
| Lecturer Dashboard | `/dashboard/lecturer-dashboard` |
| Admin Dashboard | `/dashboard/admin` |

For each page:
- [ ] Buttons are visible and styled
- [ ] Inputs have borders and padding
- [ ] Labels are above inputs
- [ ] Badges have pill shape
- [ ] Alerts have correct background color (error=red, success=green, etc.)
- [ ] Cards have rounded corners and shadow
- [ ] Tables have header styling

If anything looks wrong, identify which class is missing from ds.css and add it.

---

## Task 7: Fix Modals — All 15 Files Using `modal-open`

The existing `modal ${isOpen && "modal-open"}` pattern works **as-is** with our ds.css because we defined:
```css
.modal { display: none; }
.modal.modal-open { display: flex; }
```

**No code changes needed.** This task is a visual verification only.

Files to verify modals open/close correctly:

- [ ] `components/LectureCreationModal.jsx` — open and close works
- [ ] `components/ContainerCreationModal.jsx` — open and close works
- [ ] `pages/Lecturer Dashboard/LecturerPromoCodesPage.jsx` — open and close works
- [ ] `pages/User Dashboard/Admin dashboard/home/userManageTable.jsx`
- [ ] `pages/User Dashboard/Admin dashboard/home/PromoCodesTable.jsx`
- [ ] `pages/User Dashboard/Admin dashboard/CreateUserModal/CreateUserModal.jsx`
- [ ] `pages/User Dashboard/Admin dashboard/CreateUserModal/EditUserModal.jsx`
- [ ] `pages/User Dashboard/Admin dashboard/AddNewStuff.jsx`
- [ ] `pages/User Dashboard/Admin dashboard/signed-lecturers.jsx`
- [ ] `pages/User Dashboard/Lecture Page/LecturesPage.jsx`
- [ ] `pages/User Dashboard/Lecture Page/LectureDisplay.jsx`
- [ ] `pages/User Dashboard/Lecture Page/DetailedLectureViewing.jsx`
- [ ] `pages/User Dashboard/Lecture Page/ContainerDetails.jsx`
- [ ] `pages/CoursesForm/container-creation-panel.jsx`
- [ ] `pages/CoursesForm/container-list.jsx`
- [ ] `pages/User Dashboard/promoCodes.jsx`

If a modal doesn't open: check that `isOpen` state is correctly toggling the `modal-open` class.
If a modal doesn't close when clicking backdrop: add a backdrop click handler (see below).

**Backdrop click handler pattern (if needed):**
```jsx
// In modal JSX, add onClick on the outer .modal div:
<div
  className={`modal ${isOpen && "modal-open"}`}
  onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
>
  <div className="modal-box" onClick={(e) => e.stopPropagation()}>
    {/* content */}
  </div>
</div>
```

---

## Task 8: Fix Dropdowns — 6 Files Using CSS Focus Trick

The `dropdown:focus-within .dropdown-content { display: block; }` CSS trick is defined in ds.css, so these **should work as-is**. Verify each:

- [ ] `components/LanguageSwitcher.jsx` — dropdown opens on click, closes on blur
- [ ] `components/FilterDropdown.jsx` — dropdown opens and options are selectable
- [ ] `pages/Lecturer Dashboard/InstructorsList.jsx` — any dropdowns open correctly
- [ ] `pages/User Dashboard/Lecture Page/DetailedLectureViewing.jsx` — dropdown works
- [ ] `pages/User Dashboard/Lecture Page/ContainerPage.jsx` — dropdown works
- [ ] `pages/CourseDetails.jsx` — dropdown works

**If a dropdown doesn't close after selecting an option**, it's because `document.activeElement?.blur()` isn't firing. The existing code in `FilterDropdown.jsx` already calls `document.activeElement?.blur()` — no change needed.

---

## Task 9: Final Audit — Check for Remaining DaisyUI Utility Classes

Some files use DaisyUI-generated Tailwind utilities like `bg-base-100`, `text-primary`, `border-base-200`, `hover:bg-base-200`. These now work because we added the colors to `tailwind.config.js` in Task 3.

- [ ] **Step 1: Run a grep to confirm no DaisyUI utility classes are broken**

```bash
cd kalima-platform/frontend
grep -r "bg-base-\|text-base-content\|text-primary\|text-secondary\|border-base-" src/ --include="*.jsx" --include="*.js" -l
```

For each file found, open it in the browser and verify the colors appear correctly (the teal/cream palette should show, not default Tailwind colors).

- [ ] **Step 2: Search for any `@plugin "daisyui"` remnants in CSS**

```bash
grep -r "daisyui" src/ --include="*.css"
```
Expected: no output (all references removed)

- [ ] **Step 3: Search for any remaining daisyui imports**

```bash
grep -r "daisyui" src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx"
```
Expected: no output

---

## Task 10: Commit

- [ ] **Step 1: Stage and commit**

```bash
cd kalima-platform/frontend
git add src/styles/ds.css src/index.css tailwind.config.js package.json package-lock.json
git commit -m "$(cat <<'EOF'
feat: replace DaisyUI with custom design system

- Create src/styles/ds.css with all component classes (btn, input,
  modal, card, badge, alert, table, tabs, dropdown, toggle, checkbox,
  radio, loading, avatar, navbar, menu, divider) using project tokens
- Move DaisyUI theme variables to plain :root CSS variables
- Add design token colors to Tailwind config (bg-primary, text-base-100, etc.)
- Remove daisyui npm dependency entirely
- Zero JSX changes required — identical class names used throughout

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review Checklist

- [x] **Buttons** — all variants covered: primary, secondary, accent, ghost, outline, link, block, sizes (xs/sm/md/lg), circle, square, disabled state
- [x] **Inputs** — all variants: bordered, ghost, sizes, focus styles, error state, disabled state, RTL support
- [x] **Select** — chevron icon, RTL background-position, bordered, ghost, sizes
- [x] **Textarea** — variants and sizes
- [x] **File input** — file-selector-button styled
- [x] **Checkbox** — checkmark via ::after pseudo-element
- [x] **Radio** — radial-gradient checked state
- [x] **Toggle** — sliding knob via ::before + transform
- [x] **Loading spinner** — animation, sizes
- [x] **Badge** — all color variants, outline, sizes
- [x] **Alert** — all color variants (error/success/warning/info)
- [x] **Card** — card-body, card-title, card-actions, compact
- [x] **Table** — thead styling, hover rows, compact, zebra, sticky header
- [x] **Modal** — modal-open toggle, modal-box, modal-action, backdrop
- [x] **Dropdown** — focus-within trick, dropdown-end, dropdown-top
- [x] **Tabs** — tabs-boxed, tabs-bordered, tab-active
- [x] **Menu** — list items, hover, active, menu-title
- [x] **Avatar** — placeholder variant
- [x] **Divider** — horizontal with flex lines
- [x] **Navbar** — start/center/end regions
- [x] **Misc** — rounded-box, swap, collapse, steps
- [x] **CSS variables** — moved to :root, no more @plugin dependency
- [x] **Tailwind colors** — all DaisyUI theme color names added to extend.colors
- [x] **DaisyUI removed** — from tailwind.config.js plugins + package.json
- [x] **RTL support** — select arrow position, input-group border-radius
