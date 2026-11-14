# ECLSS Flight Deck Design System

## Purpose and authority

Use this guide for new interface work and visual revisions in the ECLSS Flight Deck. The source addenda in this folder provide supporting detail. Where a component-specific rule differs from a general rule, follow the component rule while preserving the system's high-contrast, instrument-first character. Treat all example readings and qualification statements as illustrative UI content, not verified engineering conclusions.

## Visual direction

Build a mission-control instrument surface: dense, legible, quiet, and designed for rapid scanning. Use flat matte surfaces, exposed structural lines, aligned columns, restrained status color, and concise operational labels. Avoid decoration that competes with telemetry.

### Avoid

- Neon gradients, blurred color fields, glass effects, translucent glossy cards, and decorative reflections.
- Consumer-style rounded cards and large soft shadows. Use square corners; radius must not exceed 2px.
- Generic SaaS chrome such as avatars, notification bells, chat widgets, and decorative icons beside every heading.
- Bouncy or decorative animation. State changes are immediate or linearly eased in under 120ms.
- Sliders for numeric controls. Prefer explicit step buttons, keyboard input, or wheel/arrow interaction with a clear armed state.

## Color tokens

| Role | Token | Use |
| --- | --- | --- |
| Chassis void | `#07090D` | Root background and deep visualization wells |
| Instrument surface 01 | `#0D1017` | Primary panels and inspection drawer |
| Instrument surface 02 | `#131822` | Active rows, secondary headers, and instrument tracks |
| Hairline grid | `#1E2430` | Structural 1px boundaries and separators |
| Muted fiducial | `#2E3748` | Passive ticks, chart grids, inactive borders |
| Primary readout | `#F0F4F8` | Main values and active entity titles |
| Secondary label | `#8A99AD` | Labels, units, and explanatory copy |
| Muted metadata | `#526075` | Reference bounds, axis labels, metadata |
| Nominal cyan | `#00E5FF` | Nominal telemetry and pass status |
| Elevated amber | `#FFB000` | Drift, override, and elevated risk |
| Critical crimson | `#FF2A4B` | Critical alerts and armed controls |
| Muted crimson fill | `#3B0A14` | Critical badge/banner background |

Use color with labels or symbols so state is not communicated by color alone. Keep the palette flat and matte.

## Typography and numeric layout

Matches the typography stack used on the **NASA Space Apps Challenge** platform:

- **Headings (h1 through h6)**: Use **Fira Sans** (ont-heading), set to bold (700) or black (900) weights with tight letter-spacing.
- **Body copy & UI labels**: Use **Overpass** (ont-sans), set to regular (400) and medium (500) weights for high legibility across dense mission-control layouts.
- Use a monospace face for telemetry, identifiers, and tabular data. Prefer JetBrains Mono or IBM Plex Mono when available, with platform monospace fallback.
- Use tabular numerals for changing values to prevent width jitter.
- Section labels are compact, uppercase, and letter-spaced; typical desktop size is 10–11px. Primary gauge values are about 24px; table values are about 12px. Scale these values appropriately on native display densities.
- Maintain clear hierarchy: primary value/title, secondary label, then muted metadata. Do not use tiny text for essential operational content.

## Layout and structure

- Construct panels with 1px hairline boundaries and a tight 8px spacing rhythm. Adjacent panels should align and share edges where practical.
- Use square corners and compact spacing. Reserve corner ticks/brackets for framing primary instrument canvases; they are not general decoration.
- Keep data columns aligned and preserve stable widths for numeric fields.
- On narrower viewports, reflow or stack content while preserving reading order, labels, and access to controls. Fixed desktop dimensions are reference values, not permission to clip content.

## Component patterns

### Rotary telemetry instruments

Use a 270-degree open-bottom sweep for a dual-arc gauge where space allows. Show actual telemetry on a cyan inner arc and a simulated/target value on an outer amber or crimson arc. Use subdued ticks when idle and brighter ticks when armed. The central value uses tabular numerals, with a concise unit and an optional target delta. Arming is explicit and visibly marked; support accessible keyboard operation as well as pointer interaction.

### Thermal stack

Represent temperature with ten discrete rectangular segments, not a smooth tube. Map nominal segments to cyan, elevated load to amber, and the highest threshold to crimson. Show the current value and provide explicit one-degree target adjustment. Pair color with readable values and state labels.

### Gravity regime selector

Use a sharp segmented control for Earth 1g, lunar 0.16g, and microgravity 0g. Show the active regime and the corresponding transport explanation directly below it. Keep the selector operable by keyboard and assistive technology.

### Material risk table

Use a strict aligned grid for rank, material/location, segmented probability meter, probability value, and status. Include a threshold marker when threshold data is available. Status badges are flat outlined labels: cyan for safe/nominal, amber for elevated, crimson for critical. Make each row's selected state visible and expose row activation accessibly.

### Inspection drawer

Open a docked, right-edge inspection panel when a material row is activated. On wide layouts, target a 340px width and full available height, overlaying or pinning beside the ranking table without covering top-level telemetry or primary instruments. On narrow layouts, use an available-width panel that preserves content and a clear dismissal path.

- Default closed; open for the selected material. Activating the selected row again closes it.
- Provide a top-right `[X]` dismissal control and Escape-key dismissal where supported.
- Use `#0D1017`, a 1px `#1E2430` left boundary, square corners, and continuous hairline separators between content zones. Corner ticks may frame the chassis corners.
- Keep motion immediate or linearly eased under 120ms. Do not use spring motion, backdrop dimming, or background blur.
- Header hierarchy: section identifier, material title, and muted location metadata.
- Qualification matrix: show test context, an explicit PASS/FAIL badge, and the measured/detail text. Use cyan outline for pass and crimson with muted fill for critical fail.
- Follow with concise `WHAT HAPPENED`, `THE CAUSE`, and `HOW TO FIX` sections. Use readable body copy and compact directives.
- Drawer values and recommendations are content, not universal template facts. Populate them from the selected material's record and distinguish unknown data from a failure.

## Motion and interaction

Transitions communicate state only. Keep them under 120ms and linear or ease-out; avoid spring physics, pulsing ornaments, and fake loading indicators. Controls must show focus, selected, and armed states. Provide keyboard equivalents for pointer interactions and do not rely on hover as the only way to expose an action.

## Vite and React implementation notes

This project is a Vite-powered React web app. Build the interface with semantic HTML, React components, Tailwind CSS utilities, and Recharts for the 2D airflow paradox curve. Use native buttons and keyboard-operable controls; avoid HTML range sliders. Keep layouts responsive to browser width and define shared tokens in the Tailwind `@theme` block. Use Lucide React for interface icons. Do not introduce blur, glass, gradients, or animation that conflicts with the instrument-first visual direction.

## Content and data integrity

The repository describes its readings and risk data as illustrative local UI state. Preserve that distinction in labels and copy. Do not present example qualification outcomes, safety waivers, or engineering recommendations as verified mission guidance without a trusted project data source and review.
