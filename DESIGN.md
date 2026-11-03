# Design System & UI Architecture (DESIGN.md)
## Dealer Order Platform — Nissan Used Vehicle Programme

**Document Version:** 1.0  
**Effective Date:** November 2026  

---

## 1. UI Principles & Brand Identity

The Dealer Order Platform interface bridges **Nissan's contemporary Japanese automotive design language** with **enterprise B2B logistics precision**. 

1. **Clutter-Free Minimalism:** Every screen surfaces only decision-critical information. Secondary details (complex tax calculations, defect history, chassis numbers) are neatly structured in collapsible cards or modals.
2. **Predictable Commercial Clarity:** Dealers must immediately understand the price composition (FOB, shipping, GST, compliance, delivery movements) and how their geographic zone affects the landed figure.
3. **High-Intent Feedback:** Destructive or high-commercial-value actions (vehicle reservation, cost variation approval) utilize prominent Crimson Rose primary CTAs with double-confirmation dialogs.
4. **Instant Responsiveness:** Snappy transitions powered by spring cubic-bezier easing and native Web Audio API micro-feedback.

---

## 2. Color Palette System

```
Primary Brand (Crimson Rose)
├── 50:  #FFF1F2   (Light badge backgrounds)
├── 100: #FFE4E6   (Subtle borders)
├── 500: #F43F5E   (Gradients & active indicators)
├── 600: #E11D48   ★ DEFAULT PRIMARY CTA & LOGO
├── 700: #BE123C   ★ HOVER STATE
└── 900: #881337   (Deep accents)

Dark Canvas (Deep Navy)
├── 950: #070D18   (Footer & dark base)
├── 900: #0A1322   ★ PRIMARY SIDEBAR & BRAND HALF
├── 850: #0F1B2E   (Hover cards & popups)
├── 800: #142239   (Elevated dark surfaces)
└── 700: #1B2A42   ★ DARK CANVASES BORDERS

Light Canvas & Cards
├── Page Background: #F8FAFC
├── Cards & Modals:  #FFFFFF
├── Borders Normal:  #E2E8F0
└── Borders Subtle: #CBD5E1

Functional Semantics
├── 🟢 Emerald (#10B981): Available stock, confirmed milestones, dealer view
├── 🔵 Blue (#3B82F6):    Vessel RoRo transit, admin view, batch uploads
├── 🟡 Amber (#F59E0B):   Pending authorizations, additional cost alerts
└── 🔴 Rose (#E11D48):    Cancellations, errors, rejected applications
```

---

## 3. Typography & Monospace Rules

- **Primary Typeface:** `Inter`, `-apple-system`, `BlinkMacSystemFont` (crisp legibility, balanced weights from 400 to 800).
- **Monospace Elements:** Used strictly for VIN / Chassis numbers, Stock IDs (`#NIS-9402`), NZBNs, currency figures (`$34,850 NZD`), and ISO timestamps (`2026-11-02 09:30 UTC`).
- **Hierarchy:**
  - Page Titles: `text-2xl font-extrabold text-slate-900 tracking-tight`
  - Section Headers: `text-sm font-bold uppercase tracking-wider text-slate-500`
  - Body Text: `text-sm text-slate-600 leading-relaxed`
  - Captions / Metadata: `text-xs text-slate-400 font-medium`

---

## 4. Elevation, Radii & Shadows

### Border Radii (4-Tier Standard)
- `rounded-lg` (8px): Inputs, table rows, inner badges, tooltips.
- `rounded-xl` (12px): Standard buttons, dropdown menus, quick-switch cards.
- `rounded-2xl` (16px): Main vehicle cards, modal containers, dashboard stat blocks.
- `rounded-3xl` (24px): Prominent hero callouts, split-screen containers.

### Layered Shadows
- `shadow-soft`: `0 1px 3px 0 rgba(10, 19, 34, 0.04), 0 1px 2px -1px rgba(10, 19, 34, 0.04)`
- `shadow-soft-md`: `0 4px 8px -2px rgba(10, 19, 34, 0.06), 0 2px 4px -2px rgba(10, 19, 34, 0.04)`
- `shadow-soft-lg`: `0 12px 20px -4px rgba(10, 19, 34, 0.08), 0 4px 6px -2px rgba(10, 19, 34, 0.03)`
- `shadow-hover`: `0 20px 25px -5px rgba(10, 19, 34, 0.1), 0 8px 10px -6px rgba(10, 19, 34, 0.05)`

---

## 5. Layout Shell Architecture

```
+-----------------------------------------------------------------------------------------+
| Top Header Bar: 68px height (White #FFFFFF, Border #E2E8F0)                             |
| [Search bar with '/' shortcut]                  [Sound] [Notifications] [RoleSwitcher]  |
+---------------------+-------------------------------------------------------------------+
| Sidebar:            | Main Scrollable View Area (#F8FAFC)                               |
| 240px full          |                                                                   |
| (or 76px mini)      | [Dynamic Page Content]                                            |
| Deep Navy #0A1322   | - Stock Catalogue Grid / Order Stepper / Admin Console            |
| Active glow lines   |                                                                   |
| Tooltips in mini    |                                                                   |
+---------------------+-------------------------------------------------------------------+
```

1. **Top Header Bar (Aligned 68px):**
   - Quick search input with keyboard shortcut `<kbd>/</kbd>` pill.
   - Interactive notification popover with real-time badges.
   - Sound toggle button (`Sound On` / `Sound Off`).
   - `RoleSwitcher.tsx` component allowing instantaneous persona switching.
2. **Responsive Collapsible Sidebar (240px $\leftrightarrow$ 76px):**
   - Smooth cubic-bezier width collapse toggle (`[<]` / `[>]`).
   - Floating animated tooltips when in 76px mini mode.
   - Active glow line (`.nav-active-glow`) with Crimson Rose `#E11D48` vertical accent.
3. **Accessibility (WCAG AAA Standards):**
   - High-contrast text on all interactive surfaces.
   - Dual-ring focus outlines on all buttons and inputs: `focus-visible:ring-2 focus-visible:ring-crimson-500`.

---

## 6. Micro-Interactions & Web Audio API

To provide tactile, polished feedback without heavy media asset downloads, the platform leverages the native **Web Audio API**:

- **Subtle Tick (`audio.playSubtleClick()`):** Short 40ms sine chirp (440Hz $\rightarrow$ 620Hz, 3% gain) on buttons, filters, and tab changes.
- **Harmonic Chime (`audio.playSoftChime()`):** Two-tone chord (D5 587Hz + A5 880Hz, 4% gain) on role switches and status confirmations.
- **Success Arpeggio (`audio.playSuccessChime()`):** Three ascending notes (C5, E5, G5) on reservation confirmation and order submission.
- **Mute Control:** Integrated header toggle that remembers the user's preference in localStorage.

---

## 7. Core Component Patterns

### 7.1 Vehicle Inventory Card
- **Aspect Ratio:** 16:10 vehicle photography header with zoom-on-hover.
- **Top Badges:** Condition Grade (e.g. `Grade 4.5 / B`) and Fuel/Drive pill (`e-Power AWD`).
- **Data Matrix:** Year, Odometer (km), Transmission, Stock ID.
- **Landed Pricing Section:** Prominent Total Buy Price with clear Zone indicator (`Zone 1 Auckland Landed`).
- **CTA:** Primary Crimson Rose "Reserve Vehicle" button with atomic lock indicator.

### 7.2 9-Stage Milestone Progress Stepper
- Horizontal scrollable or stacked responsive stepper.
- Completed stages: Solid Emerald checkmark with completion timestamp.
- Current active stage: Pulsing Crimson/Blue badge with live status notes.
- Pending stages: Subtle muted slate circles with estimated timeline.

### 7.3 Commercial Boundary Card
- Two-column comparative breakdown:
  - Column 1 (Emerald): **Included in Total Buy Price** (FOB, RoRo, GST, MR2A, 2 Deliveries).
  - Column 2 (Amber): **Potential Separately Chargeable Items** (Repairs, Certifications, Border Flags).

