# Source Addendum: Anti-“AI Slop” Avionics Design System
## Emerald × Industrial Safety Telemetry Edition

This document preserves the supplied visual and engineering guardrails. The integrated, platform-aware guidance is in [design-system.md](./design-system.md).

---

# ECLSS Flight Deck UI — Anti-“AI Slop” Design System
## Visual & Engineering Specification for Mission-Critical Telemetry

## 1. Strict Anti-“AI Slop” Guardrails

### 1.1 Banned Visual Tropes

- No neon cyberpunk gradients, purple/pink/blue gradients, glowing aurora backgrounds, or blurred floating blobs.
- No glassmorphism, translucent milky cards, or glossy diagonal reflections.
- No rounded consumer cards or large drop shadows. Maximum radius is 2px or sharp corners.
- No generic SaaS chrome such as marketing navbars, avatar circles, notification bells, settings gears, chat widgets, or decorative icons beside every heading.
- No bouncy consumer animations, pulsing decorative rings, or fake “AI thinking” spinners. Telemetry transitions are instantaneous or linearly damped under 120ms.
- No HTML range sliders; use platform-appropriate alternatives in the native app.

### 1.2 Mandatory Aerospace Avionics Aesthetic

- Inspiration: SpaceX Crew Dragon Flight Display, NASA MCC OpenMCT, Honeywell Primus Epic Avionics.
- Surface architecture: exposed 1px `#374151` hairline grid construction, with panels butting together or using a tight 8px technical chassis grid.
- Corner brackets and fiducials: subtle 4px technical ticks (`+` or L-brackets in `#4B5563`) on primary instrument viewports when framing an SVG canvas.

## 2. Color Palette & Surface Tokens (Emerald × Industrial Safety)

Flat, high-contrast, matte hex values for low-ambient-light Mission Control rooms.

| Token role | Hex | Usage |
| --- | --- | --- |
| Chassis Void (Background) | `#111827` | Root viewport background and deep SVG canvas wells |
| Instrument Surface 01 | `#1F2937` | Primary panel background (gauges, risk ranking, simulator) |
| Instrument Surface 02 | `#374151` | Active row highlight, armed gauge well, secondary header bar |
| Hairline Grid Border | `#374151` | Default structural border between zones |
| Muted Fiducial / Tick | `#4B5563` | Unlit gauge ticks, chart gridlines, inactive borders |
| Text Primary (Readout) | `#F9FAFB` | Primary numerical readouts, active material titles |
| Text Secondary (Labels) | `#9CA3AF` | Parameter titles, engineering units |
| Text Muted (Metadata) | `#6B7280` | Reference bounds, axis labels, inactive sector tags |
| Primary Brand & Highlights | `#34D399` | Primary interactive controls, flight reference badges, operating point |
| Nominal Telemetry Success | `#22C55E` | Live sensor baseline, normal status badge, pass state |
| Informational Telemetry | `#3B82F6` | General notices and telemetry information |
| Caution Yellow | `#FACC15` | Drift warning, caution airflow window |
| Warning Orange | `#F97316` | Simulated target delta arc, elevated risk, warning bands |
| Ignition Critical Red | `#EF4444` | Fire/smolder alert, critical status, armed control ring |
| Critical Muted Fill | `rgba(239, 68, 68, 0.18)` | Critical alert banners or armed badges |

## 3. Typography & Numerical Discipline

- Headings (h1–h6): Fira Sans (`font-heading`), bold (700) or black (900) weights (NASA Space Apps Challenge stack).
- Body copy and UI labels: Overpass (`font-sans`), regular (400) or medium (500) weights.
- Section headers: 11px, bold, uppercase, 0.12em letter spacing, `#9CA3AF`.
- Telemetry and mathematical readouts: Geist Mono or monospace fallback with tabular numerals.
- Primary gauge value: 22–24px, bold, `#F9FAFB`.
- Target delta value: 12px, bold, `#F97316`.
- Table and axis readouts: 12px, regular, tabular numerals.

## 4. Component Specifications

### 4.1 Circular Dual-Arc Rotary Encoders (`O2%`, `Air Flow`, `Pressure`)

- 156px square SVG viewport with a 270° open-bottom sweep (135° to 405°).
- Outer ring: 36 radial ticks (`#4B5563` passive, `#9CA3AF` armed) and segmented caution/warning target arc.
- Inner ring: 6px track in `#374151` and primary/success actual telemetry arc.
- Center: large tabular value, engineering unit, and conditional target/delta line.
- Armed state: 1px `#EF4444` border and top-right `ARMED` micro-chip.

### 4.2 Vertical Segmented Thermal Stack (`TEMP °C`)

- Ten rectangular LED-style segments, 44px wide × 8px high, with 3px vertical gaps.
- Segments 1–5 (`15–35°C`): Success Green `#22C55E`; 6–7 (`36–55°C`): Caution Yellow `#FACC15`; 8 (`56–65°C`): Warning Orange `#F97316`; 9–10 (`>65°C`): Critical Red `#EF4444`.
- Clicking arms the stack; scrolling or Up/Down changes the target in 1°C steps.

### 4.3 Gravity & Convection Regime Switcher

- Sharp rectangular segmented switch for Earth 1.00g, Lunar 0.16g, and Micro-G 0.00g, with left/right step buttons.
- Show the active transport mechanism below the switch (for example, forced ventilation and spherical diffusion with no buoyancy).

### 4.4 Material Risk Ranking Rows

- Strict tabular grid: rank; material and location; segmented 20-block ignition probability meter with threshold marker; status badge.
- Status badges: Nominal `#22C55E`, Elevated `#F97316`, Critical `#EF4444`.
