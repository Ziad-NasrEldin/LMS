# Fekra Design System Migration Process

## Overview
This document outlines the systematic process for migrating from Daisy UI to a custom design system using Fekra's design tokens.

## Process Steps

### Phase 1: Analysis
1. **Identify Daisy UI Dependencies**
   - Search for all Daisy UI classes in the codebase
   - Categorize by component type (buttons, forms, alerts, etc.)
   - List files with highest usage counts

2. **Extract Design Tokens**
   - Review `designTokens.js` for available tokens
   - Map tokens to component categories:
     - Colors: deepTeal, richTeal, softCyanTeal, warmMango, creamSurface, etc.
     - Radius: section (2rem), card (1.4rem), chip (9999px)
     - Shadows: level1, level2
     - Gradients: hero, cta, appPanel

### Phase 2: Create CSS Foundation
1. **Add CSS to `index.css`**
   - Place new styles after existing custom CSS
   - Use CSS custom properties for maintainability
   - Follow BEM-like naming for clarity

2. **Base Component Structure**
   ```css
   /* Base styles */
   .component {
     /* Layout */
     /* Typography */
     /* Colors from design tokens */
     /* Effects (shadow, border) */
     /* Transitions */
   }
   
   /* Variants */
   .component-variant {
     /* Override colors */
   }
   
   /* States */
   .component:hover:not(:disabled) { }
   .component:disabled { }
   .component.loading { }
   ```

### Phase 3: Component Migration
1. **Maintain Class Name Compatibility**
   - Use same class names as Daisy UI (`.btn`, `.btn-primary`, etc.)
   - This ensures automatic override without JSX changes

2. **Style Implementation Pattern**
   - **Base**: Layout, spacing, typography
   - **Variants**: Background gradients using design tokens
   - **States**: Hover effects with shadows and transforms
   - **Sizes**: Consistent padding/scale ratio

3. **Key Design Decisions**
   - All buttons: `rounded-full` (pill shape)
   - Gradients: 135° angle for premium feel
   - Shadows: Subtle teal-tinted shadows
   - Hover: -1px lift with enhanced shadow

### Phase 4: Verification
1. **Check Usage Coverage**
   - Confirm all variant classes are implemented
   - Verify state styles (hover, active, disabled, loading)
   - Test responsive behavior

## Migration Status

### ✅ Completed Components
- **Buttons**: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-accent`, `.btn-ghost`, `.btn-outline`, `.btn-error`, `.btn-success`, `.btn-neutral`, `.btn-sm`, `.btn-square`, `.btn-circle`
- **Forms**: `.form-control`, `.input`, `.input-bordered`, `.select`, `.textarea`, `.label`, `.label-text`, `.file-input`, `.checkbox`, `.radio`, `.toggle`, `.input-group`
- **Alerts**: `.alert`, `.alert-info`, `.alert-success`, `.alert-warning`, `.alert-error`
- **Loading**: `.loading`, `.loading-spinner` (xs, sm, md, lg sizes)
- **Badges**: `.badge`, `.badge-primary`, `.badge-secondary`, `.badge-accent`, `.badge-success`, `.badge-error`, `.badge-neutral`, `.badge-outline`
- **Cards**: `.card`, `.card-body`, `.card-title`, `.card-actions`
- **Modals**: `.modal`, `.modal-open`, `.modal-box`, `.modal-action`, `.modal-backdrop`, `.modal-bottom`, `.modal-middle`, `.modal-lg`, `.modal-xl`, `.modal-full`, `.modal-success`, `.modal-error`, `.modal-info`
- **Tables**: `.table`, `.table-zebra`
- **Tabs**: `.tabs`, `.tabs-boxed`, `.tab`, `.tab-active`
- **Join**: `.join`, `.join-item`
- **Avatar**: `.avatar`, `.avatar-placeholder`
- **Base Colors**: `.bg-base-100`, `.bg-base-200`, `.border-base-200`, `.text-base-content`, `.text-primary-content`, `.text-secondary-content`, `.bg-secondary`
- **Layout**: `.navbar`, `.navbar-start`, `.navbar-center`, `.navbar-end`, `.footer`, `.footer-title`, `.hero`, `.hero-content`
- **Data Display**: `.stat`, `.stat-title`, `.stat-value`, `.skeleton`, `.divider`, `.menu`, `.menu-item`
- **Chat**: `.chat`, `.chat-bubble`, `.chat-start`, `.chat-end`

### Migration Complete ✅

All Daisy UI components have been migrated to custom Fekra CSS. The following files were updated:
- `index.css` - Added comprehensive CSS for all components
- `assistantPage.jsx` - Uses table, tabs, badge, btn, avatar, alert, loading
- `promoCodes.jsx` - Uses table, tabs, join, btn, alert, loading
- `LectureDisplay.jsx` - Uses alert, badge, btn, tabs, card
- `LecturesPage.jsx` - Uses table, table-zebra, avatar
- `PromoCodesTable.jsx` - Uses table, btn, alert, select, checkbox

### Daisy UI Dependency
The project still imports Daisy UI in `index.css`:
```css
@plugin "daisyui" {
  themes: all;
}
```

To fully remove Daisy UI, this import should be removed after verifying all components work correctly with the custom CSS.

### Design Token Mapping
| Element | Primary Color | Border | Background |
|---------|--------------|--------|------------|
| Input | deepTeal | rgba(14,85,99,0.2) | creamSurface |
| Select | deepTeal | rgba(14,85,99,0.2) | creamSurface |
| Textarea | deepTeal | rgba(14,85,99,0.2) | creamSurface |
| Label | inkText | - | - |
| Alert Error | error red | rgba(220,38,38,0.3) | rgba(220,38,38,0.1) |
| Alert Success | success green | rgba(22,163,74,0.3) | rgba(22,163,74,0.1) |

### Target Classes to Replace
- `drawer`, `drawer-content`, `drawer-side` (UnifiedSidebar)
- `navbar` (navbar.jsx)
- `footer`, `footer-title` (footer.jsx)
- `hero`, `hero-content`
- `chat`, `chat-bubble`
The UnifiedSidebar component is being migrated from Daisy UI to Fekra custom classes:
- ✅ `avatar` → `fekra-avatar`
- ✅ `ring` → `fekra-avatar-ring`
- ✅ `text-base-content` → `fekra-text-slate`
- ✅ `text-primary` → `fekra-text-primary`
- 🔄 `bg-base-*` → Custom backgrounds
- 🔄 `border-base-*` → Custom borders
- 🔄 `text-primary-content` → `fekra-text-white`

### Design Token Mapping
| Element | Primary Color | Border | Background |
|---------|--------------|--------|------------|
| Input | deepTeal | rgba(14,85,99,0.2) | creamSurface |
| Select | deepTeal | rgba(14,85,99,0.2) | creamSurface |
| Textarea | deepTeal | rgba(14,85,99,0.2) | creamSurface |
| Label | inkText | - | - |
| Alert Error | error red | rgba(220,38,38,0.3) | rgba(220,38,38,0.1) |
| Alert Success | success green | rgba(22,163,74,0.3) | rgba(22,163,74,0.1) |

