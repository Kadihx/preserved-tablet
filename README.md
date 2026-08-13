# The Preserved Tablet

**Universal Codebase Memory & Diagramming Framework.**
A plug-and-play, local, graph-native memory system for AI coding agents.

Drop it into any project and it keeps a living, structured summary of your
codebase in `.memory/` — so Claude Code (or any other AI coding assistant)
reads a compact, pre-digested context instead of re-scanning your entire
repository on every task. Less token spend, faster answers, and an
architecture diagram that stays in sync with your code.

> **Status: Phase 4 (MVP)** — package scaffold, initialization, AI rulebook,
> chokidar-based watcher, a real AST/graph engine, automatic theme-aware
> SVG/HTML diagrams, a Markdown bridge into a real AFFiNE canvas, and a
> local multi-project dashboard are all working end to end.

## Why

AI coding agents burn a huge amount of context re-reading files just to
rebuild a mental model of the project they're already working in. The
Preserved Tablet keeps that mental model on disk, refreshed incrementally,
so the agent can read one small file (`.memory/context.md`) instead of
grepping the whole tree.

## Install

```bash
npm install preserved-tablet
```

(Or straight from this repo, before an npm registry release:
`npm install github:Kadihx/preserved-tablet`.)

On install, the `postinstall` hook scaffolds these files at your project
root — and **never overwrites ones that already exist**:

```
.memory/context.md                  # primary context for AI agents (commit this)
.memory/ai-rules.md                 # behavior rules for AI agents (commit this)
.memory/graph-map.json              # generated graph data (gitignored)
.claude/rules/preserved-tablet.md   # auto-discovered by Claude Code
```

`postinstall` **only** scaffolds — it never spawns a background process.
That's a deliberate choice: npm now blocks lifecycle scripts by default in
many setups, and security scanners flag postinstall-spawned daemons as a
supply-chain-attack pattern. See [Usage](#usage) for how the watcher
actually starts.

The first `sync`/`watch` run additionally produces:

```
.memory/diagram.svg   # theme-aware (light/dark) architecture diagram (gitignored)
.memory/diagram.html  # browser-friendly wrapper around diagram.svg (gitignored)
.memory/canvas.md     # Markdown importable into a real AFFiNE workspace (gitignored)
```

## Usage

### While vibe-coding (recommended flow)

Just say **"save to memory"** (or "update memory", "sync memory") in your
Claude Code chat. Per `.memory/ai-rules.md`, Claude runs
`npx preserved-tablet sync` itself — one command that refreshes
`graph-map.json` (real AST analysis), the `context.md` summary,
`diagram.svg`/`diagram.html`, and `canvas.md`. No background process to
babysit.

### Viewing the canvas in real AFFiNE

Drag `.memory/canvas.md` into your own installed [AFFiNE](https://affine.pro)
workspace (Import → Markdown). It arrives with the architecture diagram
embedded. Flip the page to **Edgeless** mode (top-right) for the spatial,
whiteboard-style view. See [`canvas-engine/README.md`](canvas-engine/README.md)
for why we bridge into real AFFiNE instead of embedding an editor ourselves.

### The central dashboard

Every project you run `init` (or install into) on registers itself in a
per-user registry at `~/.preserved-tablet/projects.json` — no extra step.
Run this from *any one* of those projects (or from a global install) to see
all of them in one place:

```bash
npx preserved-tablet dashboard
```

This starts a small local web server (plain Node `http`, no framework, no
new dependency) at `http://127.0.0.1:4317` and opens it in your browser.
Each registered project shows up as its own card — folder, name, last-sync
status, a live diagram thumbnail. **It binds to `127.0.0.1` only, never to
your network** — nothing here is reachable by anyone else on your Wi-Fi.

Sharing is a deliberately simple, one-click **file export**: each card has a
"Download" button that hands you that project's self-contained
`diagram.html` (the same file already sitting in `.memory/`) — send it over
Slack, email, whatever. No hosting, no server-side state, no accounts.

### CLI commands

```bash
npx preserved-tablet init      # scaffold .memory/ + rule files (idempotent); registers the project in the dashboard
npx preserved-tablet sync      # full-project AST scan; updates graph, context, diagram, canvas.md
npx preserved-tablet diagram   # re-renders context/diagram/canvas.md from the existing graph, no rescan
npx preserved-tablet watch     # continuous watching (foreground, Ctrl+C to stop)
npx preserved-tablet start     # continuous watching in the background (pid-tracked)
npx preserved-tablet stop      # stop the background watcher
npx preserved-tablet dashboard # local multi-project overview at http://127.0.0.1:4317
```

## Directory structure

```
preserved-tablet/
├── bin/cli.js              # init | sync | diagram | watch | start | stop
├── scripts/postinstall.js  # scaffold only — never starts the watcher
├── lib/                    # shared helpers (paths, scaffold, template render, CI detection)
│   └── graph/                # AST parsing, import resolution, graph building, context.md rendering
├── templates/               # templates copied into the consumer project (ai-rules.md is the source of truth)
├── watcher/                  # chokidar watching + project walk + one-shot sync + optional daemon
├── diagram-engine/           # validated-palette SVG/HTML architecture diagram
├── canvas-engine/            # Markdown bridge into a real AFFiNE workspace
└── dashboard/                # local (127.0.0.1-only) multi-project overview server
```

## Graph schema (`.memory/graph-map.json`)

- **Node types:** `file`, `function`, `class`.
- **Edge types:** `imports` (file → file — only relative/local imports are
  resolved; npm packages are treated as external and never become nodes),
  `contains` (file → function/class).
- The diagram only renders `file` nodes, for readability; fine-grained
  function/class data stays in the graph JSON for Claude to read.
- Call-graph analysis (which function calls which) is out of scope.

## Roadmap

- **Phase 1 (done):** scaffold, initialization, AI rulebook, watcher.
- **Phase 2 (done):** AST/graph engine (`lib/graph/`) — real static analysis
  populates `graph-map.json`'s `nodes`/`edges`; `context.md` auto-summarizes;
  `diagram-engine/` renders an editorial-quality, theme-aware SVG/HTML diagram.
- **Phase 3 (MVP done):** `canvas-engine/` — turns the graph into a
  Markdown note importable into real AFFiNE. Embedding BlockSuite's live
  editor directly (deeper, but far more fragile) was deliberately deferred —
  see [`canvas-engine/README.md`](canvas-engine/README.md).
- **Phase 4 (MVP done):** `dashboard/` — a `127.0.0.1`-only local web server
  that lists every registered project as a card (name, path, sync status,
  diagram thumbnail), with one-click file export for sharing.
- **Future ideas (not started):**
  - Beyond schematics: AI-assisted **detailed blueprint and roadmap
    documents** generated from the graph — not just a visual diagram, but a
    structured written plan of the architecture and where it's headed.
  - Real Semantica-style call-graph analysis (which function calls which).
  - Incremental graph updates instead of a full re-parse on every change.

## Acknowledgements

This project stands on the shoulders of some excellent open-source work:

- **[chokidar](https://github.com/paulmillr/chokidar)** — the file-watching
  engine behind `preserved-tablet watch`/`start`.
- **[Babel](https://github.com/babel/babel)** (`@babel/parser`,
  `@babel/traverse`) — the real AST parsing that powers the graph engine;
  without it this would just be regex guessing at imports.
- **[BlockSuite](https://github.com/toeverything/blocksuite) & [AFFiNE](https://github.com/toeverything/AFFiNE)**
  (by the [toeverything](https://github.com/toeverything) team) — the
  canvas/whiteboard engine this project bridges into via `canvas.md`. Go
  check out [affine.pro](https://affine.pro) — it's a genuinely excellent
  local-first workspace app, and this project is only a small importer into
  it, not a replacement for it.

## License

MIT — see [LICENSE](LICENSE).
