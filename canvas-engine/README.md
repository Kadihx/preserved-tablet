# canvas-engine (import-based MVP)

## Design decision

The original vision called for an integration that uses "AFFiNE's canvas
engine." That engine genuinely exists as an open-source, npm-installable
library: **BlockSuite** (`@blocksuite/presets`, `@blocksuite/blocks`,
`@blocksuite/store` — all published by AFFiNE's own GitHub organization,
[`toeverything`](https://github.com/toeverything)).

However, correctly mounting BlockSuite's *live* editor component
(`AffineEditorContainer` / `EdgelessEditor`) means re-wiring a meaningful
slice of AFFiNE's own internal app plumbing — per AFFiNE's official starter
example (`packages/playground/apps/starter`), that includes `SpecProvider`,
the extension/DI system, and mock services for `DocModeProvider`,
`NotificationExtension`, `ParseDocUrlExtension`, plus font/theme extensions.
That's disproportionate effort for an MVP, and fragile across BlockSuite
version bumps.

**Instead:** `generate-markdown.js` turns `graph-map.json` into a Markdown
file (`.memory/canvas.md`) that a **real AFFiNE instance can import
directly** — architecture diagram embedded as a base64 image, plus a
directory/file/function/class breakdown. Drag that file into your own
(already-installed) AFFiNE workspace, then flip the page to AFFiNE's
built-in **Page → Edgeless** mode for the spatial canvas view.

This approach needs no fork and no dependency on an unstable internal API,
and it puts you in your actual AFFiNE app — your workspace, your sync, your
UI.

## Future (optional, out of scope for now)

If a live, embedded editor is genuinely wanted later, that calls for a
separate Vite-based mini app (independent of this package, bootstrapped with
`npm create vite`) that carefully ports the extension chain from AFFiNE's
starter example. That's a distinct, larger undertaking, deliberately
deferred from this MVP.

## Acknowledgements

This module exists thanks to [BlockSuite](https://github.com/toeverything/blocksuite)
and [AFFiNE](https://github.com/toeverything/AFFiNE) — see the root
[README's Acknowledgements](../README.md#acknowledgements) section.
