---
name: Ethos Narrative
colors:
  surface: '#fbf9f7'
  surface-dim: '#dbdad8'
  surface-bright: '#fbf9f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f1'
  surface-container: '#efedeb'
  surface-container-high: '#eae8e6'
  surface-container-highest: '#e4e2e0'
  on-surface: '#1b1c1b'
  on-surface-variant: '#4c4546'
  inverse-surface: '#30302f'
  inverse-on-surface: '#f2f0ee'
  outline: '#7e7576'
  outline-variant: '#cfc4c5'
  surface-tint: '#5e5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1b1b1b'
  on-primary-container: '#848484'
  inverse-primary: '#c6c6c6'
  secondary: '#655d55'
  on-secondary: '#ffffff'
  secondary-container: '#ece1d6'
  on-secondary-container: '#6b635b'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1b1b1b'
  on-tertiary-container: '#848484'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c6'
  on-primary-fixed: '#1b1b1b'
  on-primary-fixed-variant: '#474747'
  secondary-fixed: '#ece1d6'
  secondary-fixed-dim: '#cfc5bb'
  on-secondary-fixed: '#201b14'
  on-secondary-fixed-variant: '#4c463e'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c6'
  on-tertiary-fixed: '#1b1b1b'
  on-tertiary-fixed-variant: '#474747'
  background: '#fbf9f7'
  on-background: '#1b1c1b'
  surface-variant: '#e4e2e0'
  surface-alt: '#EEECE7'
  ink-subtle: '#666666'
typography:
  display-xl:
    fontFamily: Epilogue
    fontSize: 80px
    fontWeight: '700'
    lineHeight: 88px
    letterSpacing: -0.04em
  display-xl-mobile:
    fontFamily: Epilogue
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 52px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Epilogue
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Epilogue
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Epilogue
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.1em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
spacing:
  unit: 8px
  margin-edge: 64px
  margin-edge-mobile: 24px
  gutter: 24px
  section-gap: 128px
---

## Brand & Style

The design system is built on a foundation of **Editorial Minimalism**. It targets a professional audience that values clarity, precision, and a high-end aesthetic. The emotional response should be one of "quiet authority"—sophisticated but never loud, leveraging a stark contrast between dense information and expansive whitespace.

The style blends **Modern Corporate** efficiency with **High-Contrast Editorial** flair. It utilizes massive typography and a monochromatic-leaning palette to create a sense of scale. The "REF" aesthetic is channeled through deliberate structural alignment, sharp edges, and a "less but better" philosophy where every pixel serves a functional or navigational purpose.

## Colors

This design system uses a high-contrast, limited palette to maintain an editorial feel. 

- **Primary:** Pure black is used for typography, borders, and high-impact UI elements to ensure maximum legibility and a bold presence.
- **Secondary:** A warm, muted taupe (#C4BAB0) acts as a sophisticated accent color for secondary actions, subtle highlights, or dividers.
- **Neutral/Background:** The primary canvas is an off-white (#F3F1EF), which reduces the harshness of pure white while maintaining a clean, professional atmosphere.
- **Surface Alt:** Used for subtle sectioning or background contrast in complex data views.

## Typography

The typography strategy focuses on the interplay between the geometric character of **Epilogue** (serving as a contemporary proxy for Habitus) and the technical precision of **Hanken Grotesk** (serving as the Aeonik equivalent).

- **Display & Headlines:** Use Epilogue with tight letter-spacing. On desktop, large headlines should dominate the layout, often spanning the width of the container.
- **Body & Data:** Use Hanken Grotesk for all functional text. It provides a clean, neutral balance to the bold headlines.
- **Utility Text:** "Label-caps" should be used for section headers and small navigation cues to reinforce the structured, editorial grid.

## Layout & Spacing

This design system utilizes a **12-column fixed grid** on desktop (1440px max-width) and a **4-column fluid grid** on mobile. 

The layout philosophy is defined by "Generous Breathing Room." 
- **Section Gaps:** Vertical spacing between major sections should be aggressive (128px+) to allow the content to stand alone.
- **Asymmetry:** Use empty columns to create an editorial feel, pushing text to the center or sides rather than filling the entire horizontal span.
- **Alignment:** Elements should align strictly to the grid lines. Use thin 1px horizontal rules (Primary color at 10-20% opacity) to separate content sections visually without adding bulk.

## Elevation & Depth

To maintain the minimalist and editorial aesthetic, this design system avoids shadows entirely. Depth is achieved through **Tonal Layering** and **Stark Outlines**.

- **Surface Tiers:** Use the neutral background for the base layer and `surface-alt` or white for cards and containers to create subtle separation.
- **High-Contrast Borders:** Instead of shadows, use 1px or 2px solid black borders to define interactive elements and containers.
- **Flattened Hierarchy:** Most elements should sit on the same visual plane. Hierarchy is communicated through size, typography weight, and color blocking rather than Z-axis elevation.

## Shapes

The shape language is strictly **Sharp (0px)**. No rounded corners are permitted. This reinforces the architectural, professional, and slightly brutalist nature of the design system. Square edges on buttons, inputs, and card containers ensure a disciplined and modern look.

## Components

- **Buttons:** Large, rectangular, and sharp-edged. Primary buttons are solid black with white text. Secondary buttons are transparent with a 1px black border. Hover states should invert colors (e.g., black becomes white, white becomes black).
- **Input Fields:** Bottom-border only or full 1px black outline. Labels use the `label-caps` style and sit above the field. Error states use a high-saturation red but maintain the 1px border weight.
- **Chips/Tags:** Small rectangular boxes with 1px borders. Use `label-sm` for text. No icons unless strictly necessary for status.
- **Cards:** Simple containers with a 1px border or a slight tonal shift (`surface-alt`). Avoid any padding within cards that feels cramped; maintain the same 8px unit-based breathing room used in the global layout.
- **Lists:** Clean rows separated by 1px horizontal rules. Use `body-md` for primary list items and `label-caps` for list category headers.
- **Tracking Specifics:** For CleanTracking, data visualizations (charts/graphs) should use the Primary and Secondary colors exclusively, avoiding standard "dashboard" palettes to maintain the editorial aesthetic.