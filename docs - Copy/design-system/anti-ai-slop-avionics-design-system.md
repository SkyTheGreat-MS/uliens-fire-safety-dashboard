# Source Addendum: Anti-“AI Slop” Avionics Design System

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
- Surface architecture: exposed 1px `#1E2430` hairline grid construction, with panels butting together or using a tight 8px technical chassis grid.
- Corner brackets and fiducials: subtle 4px technical ticks (`+` or L-brackets in `#333C4D`) on primary instrument viewports when framing an SVG canvas.

## 2. Color Palette & Surface Tokens

Flat, high-contrast, matte hex values for low-ambient-light Mission Control rooms.

| Token role | Hex | Usage |
| --- | --- | --- |
| Chassis Void (Background) | `#07090D` | Root viewport background and deep SVG canvas wells |
| Instrument Surface 01 | `#0D1017` | Primary panel background (gauges, risk ranking, simulator) |
| Instrument Surface 02 | `#131822` | Active row highlight, armed gauge well, secondary header bar |
| Hairline Grid Border | `#1E2430` | Default structural border between zones |
| Muted Fiducial / Tick | `#2E3748` | Unlit gauge ticks, chart gridlines, inactive borders |
| Text Primary (Readout) | `#F0F4F8` | Primary numerical readouts, active material titles |
| Text Secondary (Labels) | `#8A99AD` | Parameter titles, engineering units |
| Text Muted (Metadata) | `#526075` | Reference bounds, axis labels, inactive sector tags |
| Nominal Telemetry Cyan | `#00E5FF` | Live sensor baseline arc, nominal status badge |
| GP Drift / Override Amber | `#FFB000` | Simulated target delta arc, elevated risk, GP 2σ warning |
| Ignition Critical Crimson | `#FF2A4B` | Fire/smolder alert, critical status, armed control ring |
| Crimson Muted Fill | `#3B0A14` | Critical alert banners or armed badges |

## 3. Typography & Numerical Discipline

- UI and structural labels: Inter, IBM Plex Sans, or system sans. Section headers: 11px, semibold, uppercase, 0.12em letter spacing, `#8A99AD`.
- Telemetry and mathematical readouts: JetBrains Mono, IBM Plex Mono, or monospace fallback with tabular numerals.
- Primary gauge value: 24px, semibold, `#F0F4F8`.
- Delta/override value: 12px, medium, `#FFB000`.
- Table and axis readouts: 12px, regular, tabular numerals.

## 4. Component Specifications

### 4.1 Circular Dual-Arc Rotary Encoders (`O2%`, `Air Flow`, `Pressure`)

- 156px square SVG viewport with a 270° open-bottom sweep (135° to 405°).
- Outer ring: 36 radial ticks (`#2E3748` passive, `#8A99AD` armed) and segmented amber/crimson target arc.
- Inner ring: 6px track in `#131822` and cyan `#00E5FF` actual telemetry arc.
- Center: large tabular value, engineering unit, and conditional target/delta line.
- Armed state: 1px `#FF2A4B` border and top-right `ARMED [SCROLL / ↑↓]` micro-tag on `#3B0A14`.

### 4.2 Vertical Segmented Thermal Stack (`TEMP °C`)

- Ten rectangular LED-style segments, 44px wide × 8px high, with 3px vertical gaps.
- Segments 1–5 (`15–35°C`): cyan; 6–8 (`36–65°C`): amber; 9–10 (`>65°C`): crimson.
- Clicking arms the stack; scrolling or Up/Down changes the target in 1°C steps.

### 4.3 Gravity & Convection Regime Switcher

- Sharp rectangular segmented switch for Earth 1g, Lunar 0.16g, and 0g, with left/right step buttons.
- Show the active transport mechanism below the switch (for example, forced ventilation and spherical diffusion with no buoyancy).

### 4.4 Material Risk Ranking Rows

- Four-column strict tabular grid: rank; material and location; segmented 20-block ignition probability meter with threshold marker; status badge.
- Include material and muted ULOI/ignition reference metadata.
- Status labels: SAFE in cyan, ELEVATED in amber, CRITICAL in crimson.
