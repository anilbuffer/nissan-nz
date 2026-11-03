const fs = require('fs');
const path = require('path');

const designPath = path.join(__dirname, '..', 'DESIGN.md');
let content = fs.readFileSync(designPath, 'utf8');

const oldPalette = `## 2. Color Palette System

\`\`\`
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
\`\`\``;

const newPalette = `## 2. Color Palette System (Nissan Corporate Brand Standard)

\`\`\`
Pure & Corporate White (Light Canvas & Cards)
├── Background: #F8FAFC / #FFFFFF (Uncluttered, airy, high-contrast)
├── Cards & Modals: #FFFFFF
├── Hairline Borders: #E5E7EB / #E2E8F0
└── Subtle Separators: #CBD5E1

Corporate Obsidian Black (Surfaces & Contrast)
├── Base Dark Canvas: #000000 ★ PRIMARY SIDEBAR & LOGIN HALF
├── Elevated Surfaces: #0A0A0A ★ ACTIVE CONTAINERS & HEADINGS
├── Card Surfaces: #121212 ★ DROPDOWNS & POPOVERS
├── Hover Dark: #18181B
└── Dark Hairlines: #27272A

Nissan Signature Red (Restrained Brand Accent: "A Little Red")
├── 50:  #FFF5F5   (Light badge/pill backgrounds)
├── 100: #FFE3E3   (Subtle focus rings & borders)
├── 500: #E60037   (Gradients & active indicators)
├── 600: #C3002F   ★ OFFICIAL NISSAN BRAND RED (Primary CTA Buttons & Active Pips)
├── 700: #A10026   ★ HOVER STATE
└── 900: #680018   (Deep accents)
\`\`\``;

const normContent = content.replace(/\r\n/g, '\n');
const normOld = oldPalette.replace(/\r\n/g, '\n');
const normNew = newPalette.replace(/\r\n/g, '\n');

if (normContent.includes(normOld)) {
  fs.writeFileSync(designPath, normContent.replace(normOld, normNew), 'utf8');
  console.log('DESIGN.md updated with Nissan Corporate palette!');
} else {
  console.log('Could not find oldPalette in DESIGN.md');
}

