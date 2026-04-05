# CourseDetails i18n — Design Spec
Date: 2026-04-05

## Goal
Fully translate `CourseDetails.jsx` so every visible string comes from `courseDetails.json` (EN + AR), replace all hardcoded `isRTL ? '...' : '...'` patterns with `t()` calls, and fix two RTL layout bugs so Arabic layout is pixel-perfect.

## Scope
- `kalima-platform/frontend/src/pages/CourseDetails.jsx`
- `kalima-platform/frontend/public/locales/en/courseDetails.json`
- `kalima-platform/frontend/public/locales/ar/courseDetails.json`

No other files.

---

## 1. JSON Key Structure

Both locale files will be rewritten to share the same key hierarchy. Existing keys are preserved; ~80 new keys are added.

```
courseDetails.json
├── header.title
├── tabs.{overview,syllabus,reviews,instructors,faq}
├── stats.{level,students,duration,updated}
├── details.{level,totalEnrolled,language,certification}
├── hero.{taughtBy,wishlist,wishlisted,share,courseVisual}
├── overview.{masteringCourse,didYouKnow,courseDescription}
├── syllabus.{purchased,paid,free,noContent,modulesLabel,lecturesLabel}
├── reviews.{courseRating,basedOn,breakdown,star,testimonials,helpful,report}
├── reviews.r1.{name,role,date,text}
├── reviews.r2.{name,role,date,text}
├── reviews.r3.{name,role,date,text}
├── faq.{title,subtitle,ctaTitle,ctaDesc,ctaButton}
├── faq.{q1..q6,a1..a6}
├── instructors.{title,subtitle,leadBadge,instructorRole,bio,rating,courseInfo,subject}
├── instructors.{ctaTitle,ctaTitlePurchased,ctaDesc,ctaDescPurchased}
├── sidebar.{courseDetailsTitle,whoIsThisFor,whatYouWillGet,free}
├── modal.{purchaseSuccess,purchaseSuccessDesc}
├── language.{arabic,english}
├── misc.{enrolled,students,yes,no,notAvailable,processing,getFree,buyNow,
│         goToDashboard,later,linkCopied,contentComingSoonSuffix,general,
│         instructor,outcome1,outcome2}
├── pricing.{points,free}          ← existing, kept
├── purchase.{…}                   ← existing, kept
├── errors.{…}                     ← existing, kept
├── containerTypes.{…}             ← existing, kept
├── actions.{show,hide}            ← existing, kept
└── buttons.subscribe              ← existing, kept
```

---

## 2. JSX Changes in CourseDetails.jsx

### 2a. Replace hardcoded isRTL patterns

Every `isRTL ? 'Arabic string' : 'English string'` in JSX is replaced with a `t('key')` call using the new key from the JSON above. Affected locations:

| Line (approx) | Pattern | Replacement key |
|---|---|---|
| LectureRow | `isRTL ? 'عرض سريع' : 'Quick View'` | `t('syllabus.quickView')` |
| ContainerRow | `isRTL ? 'مفتوح' : 'Unlocked'` | `t('syllabus.unlocked')` |
| ContainerRow | `isRTL ? 'عناصر' : 'items'` | `t('syllabus.items')` |
| Syllabus legend | `isRTL ? 'مشتراة' : 'Purchased'` | `t('syllabus.purchased')` |
| Syllabus legend | `isRTL ? 'مدفوعة' : 'Paid'` | `t('syllabus.paid')` |
| Syllabus legend | `isRTL ? 'مجانية' : 'Free'` | `t('syllabus.free')` |
| Syllabus empty | `isRTL ? 'لا يوجد...' : 'No content...'` | `t('syllabus.noContent')` |
| Syllabus header | template-literal with Arabic/English | `t('syllabus.modulesCount', {modules, lectures})` |
| Share text | template-literal `اطلع على هذا الكورس` | `t('hero.shareText', {title})` |
| Share toast | `isRTL ? t('linkCopiedAr') : t('linkCopied')` | single `t('misc.linkCopied')` |
| Success modal | `isRTL ? t('purchaseSuccessAr') : t('purchaseSuccess')` | single `t('modal.purchaseSuccess')` |
| Success modal desc | same pattern | `t('modal.purchaseSuccessDesc')` |
| SEO description | inline Arabic/English template literals | use `isRTL` + locale-specific string (keep as-is — not a UI string) |

### 2b. Wire up already-used-but-missing t() keys

The component already calls `t('tabs.overview')`, `t('faq.title')`, etc. with fallbacks. These will just start resolving from the JSON once the keys are added — no JSX change needed.

---

## 3. RTL Layout Fixes

### Fix 1 — Syllabus indent (LectureRow & ContainerRow)
Current: `padding: \`11px 16px 11px ${indentPx}px\``
Problem: In RTL, indent should be on the right, not left.
Fix: Use `paddingInlineStart` for the depth indent so the browser applies it correctly for both LTR and RTL.

```jsx
// Before
style={{ padding: `11px 16px 11px ${indentPx}px` }}

// After
style={{ paddingTop: '11px', paddingBottom: '11px', paddingInlineEnd: '16px', paddingInlineStart: `${indentPx + 16}px` }}
```

Similarly for `ContainerRow` `marginLeft` → `marginInlineStart`.

### Fix 2 — FAQ answer indent
Current: `paddingLeft: isRTL ? '1.5rem' : 'calc(1.5rem + 2.75rem + 1rem)'`
Problem: Uses `paddingLeft` explicitly instead of logical property.
Fix: Replace with `paddingInlineStart` and remove the `isRTL` branch:

```jsx
style={{ paddingInlineStart: 'calc(1.5rem + 2.75rem + 1rem)', paddingInlineEnd: '1.5rem', paddingBottom: '1.5rem' }}
```

The `dir="rtl"` on the root element makes `paddingInlineStart` automatically apply to the right side in RTL.

---

## 4. AR Translation Content

All Arabic strings will be native Arabic (not transliterations). Sample entries:

- `tabs.overview` → `نظرة عامة`
- `tabs.syllabus` → `المنهج الدراسي`
- `tabs.reviews` → `التقييمات`
- `tabs.instructors` → `المدرسون`
- `tabs.faq` → `الأسئلة الشائعة`
- `faq.title` → `الأسئلة المتكررة`
- `instructors.title` → `تعرف على مدرسك`
- `reviews.testimonials` → `آراء الطلاب`
- `misc.goToDashboard` → `الذهاب إلى لوحة التحكم`
- `modal.purchaseSuccess` → `تم الشراء بنجاح!`
- `syllabus.noContent` → `لا يوجد محتوى متاح بعد`

---

## 5. Files Changed

| File | Change |
|---|---|
| `public/locales/en/courseDetails.json` | Rewrite — preserve existing keys, add ~80 new keys |
| `public/locales/ar/courseDetails.json` | Rewrite — same structure, full Arabic |
| `src/pages/CourseDetails.jsx` | Replace ~15 hardcoded `isRTL ? ...` patterns + 2 layout fixes |

---

## 6. What is NOT changed

- `i18n.js` — `courseDetails` namespace is already loaded dynamically via `i18next-http-backend`
- Other pages (ContainerDetails, ContainerPage)
- Backend, routing, SEO inline strings (they already handle AR/EN via `isRTL`)
