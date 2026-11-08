# E-Wardrobe Design System — Mobile-First Editorial

A photo-first digital wardrobe and AI stylist interface designed from the small mobile screen up, blending the tactile elegance of print fashion magazines with the frictionless speed of modern software.

## 1. Visual Direction & Aesthetic
- **Philosophy**: The garment is the hero. UI chrome recedes into hairline borders, generous negative space, and quiet alabaster surfaces.
- **Inspiration**: High-end fashion editorial lookbooks (SSENSE, The Row, Apple product tiles, Resend typography).
- **Core Voice**: Unhurried, confident, human editorial tone. No artificial buzzwords or generic template styling.

## 2. Design Tokens

### Colors

#### Light Mode (Alabaster Gallery)
```css
--canvas: #faf9f6;          /* Warm alabaster canvas */
--surface: #ffffff;         /* Pure white cards and panels */
--surface-soft: #f3f1e9;    /* Subdued input fields and secondary chips */
--surface-float: rgba(255, 255, 255, 0.88); /* Frosted floating dock & headers */
--ink: #141514;             /* Deep charcoal black for crisp contrast */
--muted: #646660;           /* Secondary copy and subtitles */
--quiet: #989a93;           /* Captions and placeholders */
--line: rgba(20, 21, 20, 0.08); /* Hairline borders */
--line-strong: rgba(20, 21, 20, 0.16); /* Active / hover borders */
--accent: #1e3a2b;          /* Heritage forest green */
--accent-hover: #15291e;    /* Deep forest hover */
--accent-soft: rgba(30, 58, 43, 0.08); /* Selected states & active chips */
--accent-ink: #ffffff;      /* Contrast text on accent */
--danger: #b91c1c;          /* Crimson delete actions */
--danger-soft: #fef2f2;
```

#### Dark Mode (Obsidian Noir)
```css
[data-theme="dark"] {
  --canvas: #0c0e0d;        /* Deep obsidian canvas */
  --surface: #141716;       /* Elevated dark charcoal cards */
  --surface-soft: #1a1e1c;  /* Contrast chips & inputs */
  --surface-float: rgba(20, 23, 22, 0.88); /* Frosted dark headers & docks */
  --ink: #f5f6f5;           /* Off-white crisp text */
  --muted: #959b97;         /* Soft secondary text */
  --quiet: #5e6460;         /* Subdued tertiary metadata */
  --line: rgba(245, 246, 245, 0.08); /* Subtle hairline borders */
  --line-strong: rgba(245, 246, 245, 0.16);
  --accent: #4ade80;        /* Luminous jade accent */
  --accent-hover: #22c55e;
  --accent-soft: rgba(74, 222, 128, 0.12);
  --accent-ink: #0c0e0d;
  --danger: #f87171;
  --danger-soft: rgba(248, 113, 113, 0.12);
}
```

### Typography

- **Display & Headings**: `Instrument Serif`, `Georgia`, serif (italicized, elegant editorial weight).
- **Interface & Body**: `Instrument Sans`, `-apple-system`, `BlinkMacSystemFont`, `Inter`, sans-serif.

| Token | Size (clamp) | Weight | Line Height | Tracking | Use Case |
|---|---|---|---|---|---|
| `display-lg` | `clamp(2rem, 5vw, 3.25rem)` | 400 Italic | 1.08 | `-0.02em` | Page Title / Hero |
| `display-md` | `clamp(1.5rem, 3.5vw, 2.25rem)` | 400 Italic | 1.15 | `-0.015em` | Section Titles |
| `heading-sm` | `1.15rem` | 600 Sans | 1.3 | `-0.01em` | Card Titles / Modals |
| `body-base` | `0.95rem` | 400 Sans | 1.5 | `0` | Descriptions / Notes |
| `caption` | `0.78rem` | 500 Sans | 1.4 | `0.03em` | Badges, Timestamps, Tags |

## 3. Mobile-First Layout & Touch Rules

1. **Default Viewport (320px – 480px)**:
   - **Floating Bottom Action Dock**: Sticky glass dock for immediate thumb reach (Closet, Stylist, Add Piece center button, Palette, Profile).
   - **Safe Area Padding**: `env(safe-area-inset-bottom)` applied to prevent home bar collisions.
   - **2-Column Wardrobe Grid**: `aspect-ratio: 3/4` portrait tiles with rounded corners (`14px`), subtle border, and integrated delete button.
   - **Bottom Sheet Modals**: Slide-up sheet with pill grabber at the top (`border-radius: 24px 24px 0 0`), scrollable body, and sticky action buttons at the base.
   - **Horizontal Inertia Scrolling**: Season & Category filter tracks with hidden scrollbars and smooth touch momentum.

2. **Scaling to Tablet & Desktop**:
   - `481px–767px`: 2-3 column fluid grid.
   - `768px–1023px`: 3 column grid, modals convert to centered dialogs (`max-width: 520px`).
   - `1024px+`: Split layout (60% Wardrobe Grid, 40% Sticky AI Stylist rail), 4 columns grid, floating bottom dock hides cleanly.
   - `1440px+`: Max container `1380px` with generous side margins.

## 4. Components & Micro-Interactions
- **Buttons**: Minimum `44px` touch height on mobile. Subtle active transform `scale(0.98)` for tactile feedback.
- **Badges**: Pill-shaped (`border-radius: 99px`), semibold `11px`, subtle background tint.
- **Card Media**: Edge-to-edge images with `object-fit: cover` or clean centered containment on light surface with image hover micro-scale (`1.02`).
- **Focus Rings**: Clean 2px outline with 2px offset for keyboard accessibility.
