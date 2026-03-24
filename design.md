# Design System: Fekra Main Home Screen
**Project ID:** N/A (derived from provided screenshot)

## 1. Visual Theme & Atmosphere

The home screen uses a playful educational visual language that balances trust and energy. The atmosphere is bright, friendly, and family-safe, with rounded geometry and soft depth that reduce visual harshness. The experience feels story-like through layered wave backgrounds, floating organic shapes, and warm accent highlights.

Design character:
- Youthful and optimistic, suitable for school-age learners and parents.
- High readability with clear sectioning and strong hierarchy.
- Soft, tactile UI through pill shapes, rounded cards, and diffused shadows.
- Decorative but controlled, where illustrations and color fields support navigation rather than distract.

## 2. Color Palette & Roles

Core semantic palette (estimated from screenshot):

- Deep Ocean Teal (#0E5563): Hero background anchor, strongest brand depth.
- Rich Teal (#146A78): Secondary hero surfaces and dark gradient stops.
- Soft Cyan Teal (#4DB3C2): Highlight waves and decorative transitions.
- Light Aqua Mist (#BCE7EC): Light overlays, separators, and soft atmospheric fill.
- Warm Mango Orange (#F39A3F): Primary action emphasis and key accent blobs.
- Golden Sand (#EBC468): CTA family and warm educational highlights.
- Cream Surface (#F8F3E9): Cards, nav pill, and footer panel backgrounds.
- Neutral Cloud Gray (#F1F3F6): Mid-page neutral section background.
- Lavender Tint (#C8A7E8): Left split background behind course cards.
- Mint Tint (#A9E9C0): Right split background behind course cards.
- Ink Text (#111827): Primary headings and important labels.
- Slate Text (#374151): Supporting body copy and metadata.

Functional role mapping:
- Primary CTA: Golden Sand (#EBC468) with dark text.
- Primary brand field: Deep Ocean Teal (#0E5563).
- Section contrast fields: Neutral Cloud Gray (#F1F3F6), Lavender Tint (#C8A7E8), Mint Tint (#A9E9C0).
- Content surfaces: Cream Surface (#F8F3E9) and white.

## 3. Typography Rules

Language and direction:
- Arabic-first typography with RTL layout.
- Headlines are bold, rounded, and compact to preserve impact in Arabic script.
- Body text remains clean and moderately weighted for readability at smaller sizes.

Recommended hierarchy:
- Hero headline: 56-68px, weight 700-800, line-height 1.1-1.2.
- Section heading: 42-50px, weight 700.
- Card title: 34-40px, weight 600-700.
- Body copy: 16-20px, weight 400-500, line-height 1.5-1.7.
- Meta/caption: 12-14px, weight 400.

Usage principles:
- Keep short hero lines with strong contrast over dark teal backgrounds.
- Use larger, heavier titles on cards and sections to improve quick scanning.
- Maintain clear spacing between title and body text for Arabic legibility.

## 4. Component Stylings

- Buttons:
  - Pill-shaped, high roundness.
  - Primary uses warm gold/orange with soft depth shadow.
  - Hover intent: slight lift and saturation increase (subtle, 150-220ms).

- Navigation bar:
  - Full-width capsule container with cream surface.
  - Logo at right, links centered, auth action at left (RTL aware).
  - Minimal visual noise, strong clarity.

- Feature cards:
  - Rounded rectangular cream cards with soft drop shadow.
  - Floating circular icon badge crossing top edge.
  - Short title plus concise explanatory copy.

- Course cards:
  - Compact rounded cards with image at top and content below.
  - Category-specific color backplates to differentiate subjects.
  - Clear action button with strong contrast.

- QR/app promo panel:
  - Large rounded container with gradient interior field.
  - QR block and device mockup on one side, explanatory text on the other.
  - High prominence mid-page conversion component.

- Footer panel:
  - Rounded cream container with multi-column link and contact groups.
  - Dense but clean information architecture.

Depth and elevation:
- Favor soft, diffused shadows over sharp hard shadows.
- Typical shadow family:
  - Level 1: 0 6px 16px rgba(0, 0, 0, 0.10)
  - Level 2: 0 12px 28px rgba(0, 0, 0, 0.14)

## 5. Layout Principles

Grid and flow:
- Desktop-first hero split: visual cluster on one side, headline/CTA on the other.
- Strong section segmentation via curved wave dividers and color-field transitions.
- Repeating card grids for features and courses with consistent spacing rhythm.

Spacing system:
- Base scale: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Section vertical spacing: 72-120px.
- Card padding: 20-28px.
- Desktop container width target: 1200-1320px.

Shape system:
- Pill elements: fully rounded.
- Large containers: 24-32px radius.
- Standard cards: 18-24px radius.
- Badges/chips: 12-16px radius.

Responsive behavior:
- Tablet: reduce hero complexity and maintain headline prominence.
- Mobile: single-column stacking, preserved roundness, and large touch targets.
- Keep RTL reading order and action placement consistent across breakpoints.

## 6. Stitch Prompting Notes

When generating new screens in this style, describe the atmosphere with terms like:
- "Playful educational landing page"
- "Rounded friendly geometry"
- "Layered organic wave backgrounds"
- "Cream cards over vibrant pastel fields"
- "Arabic RTL, high-contrast bold headlines"

Prompt-safe system summary:
- Primary brand field: Deep Ocean Teal (#0E5563).
- CTA accent: Golden Sand (#EBC468) / Warm Mango Orange (#F39A3F).
- Surface base: Cream Surface (#F8F3E9).
- Visual depth: soft diffused elevation, no harsh glass effects.
- Shape language: pill buttons, rounded containers, floating icon badges.
