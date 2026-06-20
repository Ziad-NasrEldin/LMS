# Kalima Meeting 2026-06-11 Implementation Spec

Source capture: `/Users/ziadnasreldin/brainstorms/2026-06-14-kalima-meeting-2026-06-11.md`

## Final product decisions

### Superseded / do not implement
- Do **not** implement a teacher seat-limit blocker.
- Do **not** block paid e-booklet access when a teacher reaches any capacity.
- Do **not** use the pasted `25 × 70` promo formula.
- Do **not** make motivational messages admin-authored.
- Do **not** copy hotspot position/size when copying configuration.
- Do **not** use student checkout/payment-proof as the milestone trigger for this flow.

### Access and code model
- Paid e-booklets use unique login/access codes.
- A paid code starts unassigned.
- On first successful redemption, the code locks/binds to the redeeming student/user and e-booklet access.
- The first successful paid access increments milestone progress.
- Repeat opens by the same user do not increment progress and should not require entering the code again.
- Same student accessing two different paid e-booklets counts as two milestone progress units.
- Teachers can generate and distribute paid codes themselves.
- Admin can also generate/send paid codes if needed.
- Teacher UI needs two copy actions per teacher e-booklet instance:
  1. Generate fresh unique unredeemed code and copy Arabic WhatsApp-ready message containing the specific e-booklet URL + code.
  2. Generate fresh unique unredeemed code and copy only the code.
- Every click/copy attempt must generate a new unique code. Never reuse/generateduplicate the same paid code.

### Free e-booklets
- Free e-booklets may require codes.
- Free codes exist only to track actual student entry/usage, not to count paid progress.
- Free code entries are excluded from milestone progress and paid usage calculations.
- Free codes are shared/multi-use tracking codes.
- Both admin and teacher can create free e-booklet access codes.
- Every free code redemption should create a usage/access record with student/user, e-booklet, teacher/uploader, code, timestamp, and term if applicable.

### Terms and conditions
- Teachers can view dashboard/e-booklet before accepting terms.
- Before the teacher can generate/copy any access code, require terms acceptance.
- If teacher clicks “copy WhatsApp message” or “copy login code” and has not accepted terms, show terms first.
- After acceptance, allow code generation/copy.
- Milestone reward claim also requires terms acceptance before revealing/issuing reward credit.

### Terms
- Admin manages terms with:
  - name
  - start date
  - end date
  - active/inactive
- Milestone progress is calculated inside the current active term.
- Teacher can earn each milestone once per active term.
- Claimed reward credit does not expire at term end; it remains until spent.

### Milestones
- Final model is unlimited milestone model.
- Admin can create/edit/delete/reorder multiple milestones.
- Each milestone has:
  - name/title
  - required paid access threshold
  - linked e-booklet pricing tier/rule
  - new e-booklet price
  - term applicability
  - active/inactive
  - notification settings/recipients
  - terms & conditions text or linked policy
  - promo reward enabled/disabled
- Motivational teacher messages are backend/system-provided, not admin-authored.
- Milestone pricing scope is admin-controlled per milestone through the linked pricing rule/tier.
- Teacher dashboard should show an active-term milestone timeline:
  - completed milestones marked achieved
  - current milestone highlighted
  - next milestone shows remaining paid accesses needed
  - achieved-but-unclaimed milestones show claim reward button
  - system motivational copy near the timeline
  - dynamic update as students redeem paid access codes

### Promo / wallet reward
- Promo reward value formula:
  - `(previous e-booklet price - new milestone e-booklet price) × (new milestone threshold - previous milestone threshold)`
- Confirmed example:
  - current milestone: 50 students, price 30
  - next milestone: 70 students, price 25
  - reward: `(30 - 25) × (70 - 50) = 100`
- Milestone achievement creates a claimable reward.
- Generate the credit only when the teacher clicks to receive/claim it after reaching the milestone and accepting terms.
- Reward is wallet credit/balance, not a discardable one-time coupon.
- If wallet credit is 100 and order total is 70, remaining 30 stays available.
- Credit is usable by that teacher on future Kalima purchases, including e-booklets and normal Kalima store products.
- Wallet credit cannot stack with another normal promo/coupon on the same order.

### Notifications
- On milestone achievement:
  - create in-app notification for teacher
  - create in-app notification for admins
  - email teacher
  - email admins
- Mobile/desktop push should only be wired if infrastructure already exists.
- If push infra does not exist, store notification records now and leave push delivery as a later integration point.

### Editor improvements
- Image node fit:
  - In e-booklet/hotspot editor, when image node is inserted or replaced, auto-resize node frame to image natural aspect ratio.
  - Preserve aspect ratio; do not stretch/crop into a fixed box.
- Copy/paste hotspot configuration:
  - Copy only internal block configuration.
  - Include content/question text, answers/options, correct answer, explanation/feedback, media/config settings inside the block.
  - Exclude x/y position, width/height, wrapper label/title if separate, page/link identity, unique IDs, analytics, and history.

## Implementation checklist

### 0. Discovery before coding
- [ ] Inspect current e-booklet instance/access/code models.
- [ ] Inspect current teacher e-booklet dashboard/pages.
- [ ] Inspect current admin e-booklet admin pages.
- [ ] Inspect current coupon/cart/order/store product flow.
- [ ] Inspect current notifications/email/push support.
- [ ] Inspect current editor hotspot/block schema.
- [ ] Remove/replace old seat-limit/quota assumptions from plan/tests/UI where this new model applies.

### 1. Data model / backend foundation
- [ ] Add/admin term model if missing.
- [ ] Add milestone model supporting multiple ordered active milestones.
- [ ] Add teacher term progress aggregation from paid first access records.
- [ ] Add paid unique access-code model or extend current invite/passcode model safely.
- [ ] Add free shared tracking-code model or extend current invite/passcode model safely.
- [ ] Add teacher terms-acceptance record.
- [ ] Add wallet credit ledger/balance model for claimed milestone rewards.
- [ ] Add idempotency/uniqueness constraints so duplicate code redemption or duplicate milestone claim cannot double-count.

### 2. Access code APIs
- [ ] Teacher/admin generate paid unique login code for a teacher e-booklet instance.
- [ ] Teacher/admin generate free shared tracking code for a free e-booklet.
- [ ] Redeem paid code: bind to first user, create access, increment progress once.
- [ ] Redeem free code: create tracked usage/access record, no milestone increment.
- [ ] Return enough info for teacher copy buttons: generated code + e-booklet URL.
- [ ] Enforce terms acceptance before teacher code generation/copy APIs.

### 3. Milestone and wallet APIs
- [ ] Admin CRUD/reorder terms.
- [ ] Admin CRUD/reorder milestones.
- [ ] Teacher dashboard milestone summary endpoint.
- [ ] Milestone achievement detector after paid first-access redemption.
- [ ] Claim reward endpoint: verify achieved, unclaimed for active term, terms accepted, calculate reward, add wallet credit.
- [ ] Wallet balance/ledger endpoint for teacher.
- [ ] Apply wallet credit to e-booklet and normal store orders with no coupon stacking.

### 4. Notifications/email
- [ ] Create notification record on milestone achievement for teacher.
- [ ] Create notification record on milestone achievement for admins.
- [ ] Send milestone achievement email to teacher.
- [ ] Send milestone achievement email to admins.
- [ ] Add push delivery only if existing infra supports it; otherwise document stored records only.

### 5. Frontend teacher UX
- [ ] Add early terms modal/page before code generation/copy.
- [ ] Add teacher e-booklet copy buttons:
  - [ ] copy Arabic WhatsApp template with generated code + specific URL
  - [ ] copy generated code only
- [ ] Add teacher dashboard milestone timeline.
- [ ] Add claim reward flow with terms acceptance and wallet-credit result.
- [ ] Add wallet balance display where teacher purchases e-booklets/store products.
- [ ] Ensure Arabic copy is production-ready and RTL-aware.

### 6. Frontend admin UX
- [ ] Add terms management UI.
- [ ] Add milestone CRUD/reorder UI.
- [ ] Add pricing tier/rule linkage UI.
- [ ] Add free code management if admin needs direct generation.
- [ ] Add milestone/reward visibility for admins.

### 7. Editor fixes
- [ ] Image node natural aspect-ratio fit on insert/replace.
- [ ] Copy block config only.
- [ ] Paste block config onto existing hotspot/block without changing position/size/identity.
- [ ] Regression test that copied config excludes IDs/position/size/history.

### 8. Tests / verification gates
- [ ] Backend tests for paid code uniqueness and first-redemption binding.
- [ ] Backend tests for repeat paid access not double-counting progress.
- [ ] Backend tests for free shared code multi-use tracking without milestone increment.
- [ ] Backend tests for milestone reward formula.
- [ ] Backend tests for once-per-teacher-per-term claim.
- [ ] Backend tests for wallet partial spend and remaining balance.
- [ ] Backend tests for no wallet/coupon stacking.
- [ ] Frontend build.
- [ ] i18n audit after copy changes.
- [ ] Browser verification of teacher code copy + terms gate.
- [ ] Browser verification of teacher timeline and claim flow.
- [ ] Browser verification of editor image fit and block-config copy/paste.
- [ ] Mandatory feature critique workflow before considering feature complete.

## Open implementation questions for code inspection only
- Which existing tables/models should be reused vs replaced for invites/passcodes/access?
- Where is the canonical teacher dashboard route/component?
- Does current notification infrastructure include push or only in-app/email?
- Does current cart/coupon system support wallet-like balance, or is a separate ledger required?
- Exact hotspot/block config field names to include/exclude.
