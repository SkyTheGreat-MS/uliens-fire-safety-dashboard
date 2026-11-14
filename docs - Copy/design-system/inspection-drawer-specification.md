# Source Addendum: Inspection Drawer Specification

This document preserves the supplied drawer-specific requirements. The integrated, platform-aware guidance is in [design-system.md](./design-system.md).

---

# ECLSS Flight Deck UI — Component Specification Addendum
## Docked Collapsible Inspection Drawer (`INSPECT_DRAWER`)

## 1. Mounting & Dynamic State Behavior

- Mount flush to the right viewport edge; reference footprint is 340px wide and full height. Overlay or pin against the center ranking table without obscuring top-level telemetry tiles or primary rotary instruments.
- Default hidden/collapsed. Activate by selecting any material risk row.
- Dismiss with the `[X]` control, by reselecting the active table row, or with Escape.
- Transition instantly or linearly from the right in under 120ms, ease-out. No spring physics, backdrop, or blur.

## 2. Surface Tokens & Chassis Construction

- Chassis: matte `#0D1017` (Instrument Surface 01).
- Left boundary: 1px `#1E2430`; sharp corners.
- Subtle 4px corner ticks in `#333C4D` at top-left and bottom-left chassis corners.
- Continuous 1px `#1E2430` separators between functional zones.

## 3. Content Layout

### Header well

- Section tag: 11px sans, semibold, 0.12em letter spacing, `#8A99AD`, uppercase; e.g. `SEC 04 // MATERIAL INSPECTION`.
- Dismiss anchor: `[X]`, 11px mono, `#8A99AD`, hover `#F0F4F8`.
- Entity title: 14px sans, semibold, `#F0F4F8`.
- Metadata: 11px mono, `#526075`, uppercase location identifier.

### Qualification audit matrix

- Section label: 10px sans, semibold, 0.10em letter spacing, `#8A99AD`.
- Each metric has a 12px secondary-colored context label, a flat outlined mono status badge, and an 11px mono detail.
- PASS badge: 1px cyan border and cyan text on transparent background.
- CRITICAL FAIL badge: 1px crimson border, crimson text, `#3B0A14` fill; detail text in crimson.

### Operational flow sections

- `WHAT HAPPENED`, `THE CAUSE`, and `HOW TO FIX` headings: 10px semibold sans, 0.10em letter spacing, `#8A99AD`.
- Explanatory body: 12px sans, 400 weight, 1.4 line height, `#F0F4F8`.
- Directives: 11px mono, 1.5 line height, `#8A99AD`.

## 4. Example Content (Illustrative)

The supplied example names PMMA cast acrylic at a viewport assembly, with an Earth 1g pass and a microgravity critical failure, followed by a cause explanation and three proposed mitigations. These statements are example content from the source specification; they are not independently verified material qualification data or operational recommendations. Use them only where the prototype explicitly presents illustrative sample content.
