# ECLSS Flight Deck Design System
## Emerald × Industrial Safety Visual Identity

## 1. Purpose and Authority

Use this guide for interface development, component styling, and visual governance across the **ECLSS Flight Deck (Flame Safety Dashboard)**. Where a component-specific rule differs from a general rule, follow the component rule while preserving the system's high-contrast, instrument-first, and safety-critical character. Treat all example readings and qualification statements as illustrative UI content, not verified engineering conclusions.

## 2. Visual Direction

The dashboard implements the **Emerald × Industrial Safety** visual identity: a professional, modern industrial monitoring and control interface using emerald green as the primary brand color, complemented by an unmistakable red, orange, and yellow safety-alert system over a deep charcoal matte foundation.

- **Atmosphere:** Mission-control operational surface: dense, legible, quiet, high contrast, and optimized for rapid scanning under varying ambient lighting.
- **Surfaces:** Flat, matte charcoal panels with exposed structural hairlines (1px), aligned columns, and square corners (0–2px radius).
- **Restraint:** No neon gradients, no glassmorphism or translucent blurry cards, no consumer rounded card aesthetics, no bouncing decorative animations.

## 3. Core Color Palette & Design Tokens

### 3.1 Structural Foundation

| Token | CSS Variable | Hex | Purpose |
|---|---|---|---|
| Background / Void | `--color-void` | `#111827` | Main application background and deep visualization wells |
| Surface | `--color-surface` | `#1F2937` | Dashboard cards, panels, and drawer containers |
| Elevated Surface | `--color-raised` | `#374151` | Nested surfaces, active rows, and elevated elements |
| Hairline Border | `--color-line` | `#374151` | 1px structural boundaries, dividers, and panel outlines |
| Muted Fiducial / Tick | `--color-tick` | `#4B5563` | Passive gauge ticks, chart grids, inactive segment outlines |
| Primary Readout / Ink | `--color-ink` | `#F9FAFB` | Primary numerical readouts, titles, and high-contrast text |
| Secondary Label | `--color-secondary` | `#9CA3AF` | Parameter labels, units, and secondary descriptions |
| Muted Metadata | `--color-muted` | `#6B7280` | Passive IDs, reference bounds, and tertiary metadata |

### 3.2 Primary Brand & Interactive Elements

| Token | CSS Variable | Hex | Purpose |
|---|---|---|---|
| Primary Brand | `--color-primary` | `#34D399` | Primary interactive elements, active navigation, key highlights |
| Primary Highlight | `--color-highlight` | `#6EE7B7` | Hover states and interactive focal points |
| Primary Fill | `--color-primary-fill` | `rgba(52, 211, 153, 0.12)` | Subtle emerald background tint for badges and active pills |

### 3.3 Semantic Industrial Safety Status Hierarchy

All status indications are centralized into five distinct operational levels:

| Token | CSS Variable | Hex | Fill Variant | Semantic Meaning |
|---|---|---|---|---|
| **Success / Normal** | `--color-success` | `#22C55E` | `rgba(34, 197, 94, 0.15)` | System operating normally within nominal boundaries |
| **Information** | `--color-info` | `#3B82F6` | `rgba(59, 130, 246, 0.15)` | Informational telemetry, flight reference notes |
| **Caution** | `--color-caution` | `#FACC15` | `rgba(250, 204, 21, 0.15)` | Attention required; sensor drift, approaching threshold |
| **Warning** | `--color-warning` | `#F97316` | `rgba(249, 115, 22, 0.15)` | Abnormal condition, elevated risk, target override |
| **Critical / Fire** | `--color-critical` | `#EF4444` | `rgba(239, 68, 68, 0.18)` | Critical safety condition, armed controls, ignition hazard |

> [!IMPORTANT]
> **Safety Rule:** Never communicate safety status through color alone. Always accompany color with explicit text labels (e.g., `NOMINAL`, `DRIFT`, `ELEVATED`, `ARMED`), numeric values, or structured icons.

## 4. Typography & Numeric Discipline

Matches the NASA Space Apps Challenge typography stack:

- **Headings (h1 through h6):** **Fira Sans** (`font-heading`), set to bold (700) or black (900) weights with tight letter-spacing.
- **Body Copy & UI Labels:** **Overpass** (`font-sans`), set to regular (400) or medium (500) weights for optimal legibility across dense mission-control layouts.
- **Telemetry & Tabular Numerals:** **Geist Mono** (`font-mono`) with monospace fallbacks (`SFMono-Regular`, `Consolas`). Always use `tabular-nums` to eliminate numeric width jitter during live updates.
- **Hierarchy:** Primary value/heading $\rightarrow$ Secondary label/unit $\rightarrow$ Muted metadata. Essential operational data must never use unreadable, sub-10px fonts.

## 5. Component Patterns

### 5.1 Rotary Telemetry Encoders (`O₂`, `Airflow`, `Cabin Pressure`)
- 270-degree open-bottom sweep dual-arc gauge.
- Actual telemetry baseline displayed with Primary Emerald (`#34D399`) / Success (`#22C55E`).
- Target / simulated value shown with Caution/Warning arc (`#FACC15` / `#F97316`).
- Unarmed state uses `#4B5563` tick lines on `#111827` void background.
- Armed state triggers a 1px `#EF4444` critical border, an `ARMED` badge on `#EF4444` fill, and enables keyboard/wheel adjustments.

### 5.2 Vertical Thermal Stack (`TEMP °C`)
- Ten discrete rectangular LED-style segments:
  - Segments 1–5 (`15–35°C`): Normal operating range $\rightarrow$ Success Green (`#22C55E`).
  - Segments 6–7 (`36–55°C`): Caution range $\rightarrow$ Caution Yellow (`#FACC15`).
  - Segment 8 (`56–65°C`): Warning threshold $\rightarrow$ Warning Orange (`#F97316`).
  - Segments 9–10 (`>65°C`): Critical heat range $\rightarrow$ Critical Red (`#EF4444`).
  - Inactive segments: Structural line outline (`#374151`) on raised surface (`#374151`).

### 5.3 Gravity Regime Switcher
- Segmented control for Earth 1.00g, Lunar 0.16g, and Micro-G 0.00g.
- Active regime badge highlighted in Primary Emerald (`#34D399`).
- Navigation arrows styled with hover transitions to Highlight (`#6EE7B7`).

### 5.4 Material Risk Ranking & Inspection Drawer
- Strict aligned tabular grid with rank, material name, location, 20-segment visual meter, demo value, and semantic status badge.
- Status badges:
  - Nominal: `border-success/60 bg-success/10 text-success` (`#22C55E`).
  - Elevated / Warning: `border-warning/60 bg-warning/10 text-warning` (`#F97316`).
  - Critical / Fire: `border-critical/60 bg-critical/10 text-critical` (`#EF4444`).
- Inspection Drawer:
  - Fixed right-docked drawer with `#1F2937` surface, `#374151` boundary, and chassis corner fiducials.
  - Qualification matrix displaying explicit `PASS` (Success green) or `FAIL` (Critical red) badges.
  - Explanatory sections (`WHAT HAPPENED`, `THE CAUSE`, `HOW TO FIX`) with clear font hierarchy.

### 5.5 Airflow Paradox Simulation Chart
- Recharts ComposedChart with dark void background (`#111827`) and elevated grid lines (`#374151`).
- Danger/caution airflow window (6–18 cm/s) highlighted with Caution Yellow ReferenceArea (`#FACC15`, `fillOpacity={0.06}`).
- Risk uncertainty band displayed with Warning Orange Area (`#F97316`, `fillOpacity={0.12}`).
- Visual risk curve rendered in Warning Orange (`#F97316`, 2.5px width).
- Current operating point marker highlighted in Primary Emerald (`#34D399`).
- Axis tick labels rendered in secondary gray (`#9CA3AF`) using Geist Mono.

### 5.6 RAG Flight Reference Copilot Floater
- Anchored header popover with `#1F2937` surface and `#374151` boundary.
- Header badge highlighted in Primary Emerald (`#34D399`).
- Query prompt labeled with `Q:` in Primary Emerald (`#34D399`), response labeled with `A:` in Warning Orange (`#F97316`).
- Interactive inputs focus-ringed with Primary Emerald (`#34D399`).

## 6. Motion, Accessibility & Performance

- **Transitions:** State transitions are linear or ease-out under 120ms. Avoid bouncy springs or excessive glowing effects.
- **Contrast & Legibility:** All text tokens meet WCAG 2.1 AA contrast requirements against their respective surface backgrounds (`#111827`, `#1F2937`, `#374151`).
- **Keyboard Navigation:** Full slider and dial interaction support via Home, End, Arrow Keys, and Escape to disarm.
