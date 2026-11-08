# Apple Liquid Glass Design System (E-Wardrobe)

A native mobile-first interface inspired by Apple's Human Interface Guidelines (HIG) and Expo Liquid Glass. The UI feels like an installed iOS/iPadOS app, replacing traditional web marketing sections with focused app views, a floating liquid glass dock, tactile micro-interactions, and layered optical depth.

---

## 1. Core Principles

1. **App-First Architecture**: No marketing hero banners, no promotional taglines, no endless web scrolling. The user is immediately in their active workspace.
2. **True View Switching (Tabs)**: Screens for **Closet**, **Stylist**, and **Palette** switch fluidly via the floating Liquid Glass dock and iPad-style segmented control.
3. **Expo Liquid Glass Materiality**:
   - Ultra-dense backdrop blur: `backdrop-filter: blur(32px) saturate(200%)`.
   - Optical specularity: Inset 1px light reflections (`inset 0 1px 1px rgba(255,255,255,0.4)`).
   - Micro-borders: 1px semi-transparent borders defining physical edges.
   - Ambient illumination: Subtle background mesh gradients refract through floating glass surfaces.
4. **Native iOS Proportions & Feedback**:
   - Interactive elements have an active press scale (`transform: scale(0.96)`).
   - Bottom sheets feature an authentic iOS grabber capsule (`38px × 5px`) and spring transitions (`cubic-bezier(0.32, 0.72, 0, 1)`).
   - Touch targets are strictly $\ge 44 \times 44\text{px}$.

---

## 2. Design Tokens

### Color Palette

#### Light Mode (Apple Ceramic & Frosted Glass)
- **Canvas / Background**: `#f2f4f8` with ambient liquid meshes (soft indigo & azure radial highlights)
- **Glass Card Fill**: `rgba(255, 255, 255, 0.72)`
- **Glass Floating Fill**: `rgba(255, 255, 255, 0.82)`
- **Glass Border**: `1px solid rgba(255, 255, 255, 0.65)`
- **Glass Specular Inset**: `inset 0 1px 1px 0 rgba(255, 255, 255, 0.9)`
- **Text Primary (Ink)**: `#1d1d1f`
- **Text Secondary (Muted)**: `#86868b`
- **Text Tertiary (Quiet)**: `#a1a1a6`
- **Action Blue (iOS System)**: `#0071e3`
- **Action Blue Gradient**: `linear-gradient(135deg, #0071e3 0%, #2997ff 100%)`
- **Accent Indigo**: `#6366f1`
- **Danger**: `#ff3b30`

#### Dark Mode (Deep OLED Midnight Glass)
- **Canvas / Background**: `#0a0b10` with deep liquid ambient glows (indigo `#6366f118` & sky `#0ea5e912`)
- **Glass Card Fill**: `rgba(22, 24, 34, 0.68)`
- **Glass Floating Fill**: `rgba(30, 34, 48, 0.78)`
- **Glass Border**: `1px solid rgba(255, 255, 255, 0.12)`
- **Glass Specular Inset**: `inset 0 1px 1px 0 rgba(255, 255, 255, 0.16)`
- **Text Primary (Ink)**: `#f5f5f7`
- **Text Secondary (Muted)**: `#a1a1a6`
- **Text Tertiary (Quiet)**: `#6e6e73`
- **Action Blue (iOS System)**: `#2997ff`
- **Action Blue Gradient**: `linear-gradient(135deg, #0071e3 0%, #0091ff 100%)`

---

## 3. Typography (Apple SF Pro Stack)

```css
--font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", system-ui, sans-serif;
--font-mono: "SF Mono", Menlo, Consolas, Monaco, monospace;
```

- **Large Title**: 32px / 1.15, Weight 700, Tracking `-0.03em`
- **Title 2**: 22px / 1.25, Weight 600, Tracking `-0.02em`
- **Headline**: 17px / 1.3, Weight 600, Tracking `-0.015em`
- **Body**: 15px / 1.45, Weight 400, Tracking `-0.01em`
- **Subheadline**: 13px / 1.4, Weight 500, Tracking `0`
- **Caption**: 11px / 1.3, Weight 600, Tracking `0.02em`

---

## 4. Components

### Floating Liquid Glass Dock
- Capsule geometry (`border-radius: 9999px`) floating `18px` above bottom safe area.
- Multi-layer shadow (`0 20px 48px -12px rgba(0,0,0,0.3)`).
- Center "+" button elevated with subtle pulse and gradient fill.
- Animated active indicator with sliding translucent glass pill.

### Lookbook Photo Cards
- Portrait ratio (3:4 or 4:5), 18px rounded corners.
- Floating liquid glass badge on image top-left (category icon + label).
- Color dot badge and wear count pill on top-right.
- Bottom info banner with item title and quick wear incrementer.

### iOS Sheet Modals
- Slide-up bottom sheet on viewport `< 768px` with top grabber (`38px × 5px`).
- Spring enter/leave transition.
- Centered liquid glass dialog on desktop (`max-width: 500px`, 26px radius).
