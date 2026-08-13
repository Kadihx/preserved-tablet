# diagram-engine

Generates the project's architecture diagram from `.memory/graph-map.json` —
a hand-rolled SVG/HTML renderer (no headless browser, no charting library)
styled with a validated, colorblind-safe categorical palette instead of the
generic Mermaid look.

## What it does

- `generate.js` groups `file` nodes by their top-level directory, lays them
  out in columns, and draws `imports` edges between them as curved connectors.
- `palette.js` holds the categorical color set (one hue per directory group,
  in a fixed, never-cycled order) plus the light/dark ink and surface tokens.
- Output is a single theme-aware `.memory/diagram.svg` (switches with
  `prefers-color-scheme`) and a `.memory/diagram.html` wrapper for convenient
  double-click viewing in a browser.
- Function/class nodes are intentionally **not** drawn individually — they'd
  clutter an architecture-level view. Each file box shows a small counter
  instead (`3 fn · 1 class`); the fine-grained nodes still live in
  `graph-map.json` for Claude to read.

Regenerated automatically on every `sync`/`watch` cycle, or on demand with
`npx preserved-tablet diagram`.
