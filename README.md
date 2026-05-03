# StrataNodex CLI

> A keyboard-driven, terminal-based task manager for power users.

[![CI](https://github.com/pranavdadhe1806/StrataNodex-CLI/actions/workflows/ci.yml/badge.svg)](https://github.com/pranavdadhe1806/StrataNodex-CLI/actions)
[![npm version](https://img.shields.io/npm/v/stratanodex.svg)](https://www.npmjs.com/package/stratanodex)
[![Node.js >=20](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## What is StrataNodex CLI?

StrataNodex CLI is the terminal-first interface for [StrataNodex](https://stratanodex.com) — a hierarchical task manager built around the idea that tasks live in a **tree**, not a flat list.

```
 ╭──────────────────────────────────────────────────────╮
 │         StrataNodex CLI  v0.1.0  ·  Welcome Back     │
 ╰──────────────────────────────────────────────────────╯
 ╭──────────────────────────────────────────────────────╮
 │  📁 Work                                             │
 │  📁 Personal                                         │
 │  📁 Side Projects                                    │
 │                                                      │
 ╰──────────────────────────────────────────────────────╯
  > /new folder
  / for commands  ↑↓ navigate  TAB complete  Enter exec
```

**3-panel TUI layout:**

- **Top** — fixed header with version and login state
- **Middle** — scrollable content (folders → lists → node tree)
- **Bottom** — smart command bar with live autocomplete

---

## Installation

```bash
npm install -g stratanodex
```

Requires **Node.js ≥ 20**.

---

## Quickstart

### 1. Log in

```bash
stratanodex login
```

This opens a browser-based auth flow. Once complete, your token is saved locally.

### 2. Launch the TUI

```bash
stratanodex
```

Navigate with arrow keys. Type `/` to open the command bar with autocomplete.

### 3. Common commands (non-interactive mode)

```bash
stratanodex list                         # List all folders, lists, and tasks
stratanodex add "Fix login bug" --list <listId>
stratanodex done 1.2 --list <listId>     # Mark node 1.2 as done
stratanodex logout
```

---

## Command Reference (TUI)

Every command starts with `/`. Hit `/` in any screen to activate autocomplete.

### Global (all screens)

| Command      | Description                  |
| ------------ | ---------------------------- |
| `/back`      | Go back to previous screen   |
| `/home`      | Jump to Folders screen       |
| `/folders`   | Navigate to Folders screen   |
| `/dashboard` | Score + streak + 7-day chart |
| `/help`      | Show available commands      |
| `/logout`    | Log out and clear token      |
| `/whoami`    | Show username + streak       |
| `/tags`      | List all tags                |

### Folders screen

| Command          | Args                | Description         |
| ---------------- | ------------------- | ------------------- |
| `/new folder`    | `name`              | Create a new folder |
| `/edit folder`   | `name` → `new-name` | Rename a folder     |
| `/delete folder` | `name`              | Delete a folder     |

### Lists screen

| Command        | Args                | Description       |
| -------------- | ------------------- | ----------------- |
| `/new list`    | `name`              | Create a new list |
| `/edit list`   | `name` → `new-name` | Rename a list     |
| `/delete list` | `name`              | Delete a list     |

### Nodes screen

| Command                     | Args                                  | Description          |
| --------------------------- | ------------------------------------- | -------------------- |
| `/add node`                 | `title`                               | Add a new task       |
| `/done`                     | `index or title`                      | Mark a task as DONE  |
| `/delete node`              | `index or title`                      | Delete a task        |
| `/move node`                | `ref` → `list-name`                   | Move to another list |
| `/edit node ... title`      | `ref` → `new title`                   | Rename a task        |
| `/edit node ... status`     | `ref` → `NOT-DONE\|IN-PROGRESS\|DONE` | Change status        |
| `/edit node ... priority`   | `ref` → `LOW\|MEDIUM\|HIGH`           | Change priority      |
| `/edit node ... start-date` | `ref` → `DD-MM-YYYY`                  | Set start date       |
| `/edit node ... end-date`   | `ref` → `DD-MM-YYYY`                  | Set end date         |
| `/add node ... tag`         | `ref` → `tag-name`                    | Add a tag            |
| `/add node ... note`        | `ref` → `text`                        | Add a note           |
| `/delete node ... note`     | `ref`                                 | Remove note          |

---

## Keyboard Shortcuts

| Key       | Action                              |
| --------- | ----------------------------------- |
| `↑` / `↓` | Move cursor                         |
| `→` / `←` | Expand / collapse node              |
| `Enter`   | Open selected item                  |
| `b`       | Go back                             |
| `q`       | Quit                                |
| `/`       | Open command bar                    |
| `TAB`     | Complete next token in autocomplete |
| `ESC`     | Close autocomplete overlay          |

---

## Autocomplete (4-stage token completion)

Autocomplete is **context-aware** — it knows which screen you're on and which nodes are in the current list.

```
Stage 1  /edit no         → /edit node
Stage 2  /edit node       → 1. Fix login bug  2. Review PR
Stage 3  /edit node 1     → title / status / priority / start-date ...
Stage 4  /edit node 1 sta → start-date (DD-MM-YYYY hint)
```

- Arrow keys navigate the overlay
- TAB fills the selected suggestion
- ESC closes without clearing your input

---

## Environment Variables

| Variable              | Default                                    | Description                      |
| --------------------- | ------------------------------------------ | -------------------------------- |
| `STRATANODEX_API_URL` | `https://stratanodex-backend.onrender.com` | Override API base URL            |
| `STRATANODEX_VERBOSE` | `false`                                    | Enable verbose logging to stderr |
| `NO_COLOR`            | unset                                      | Disable all chalk colors         |

---

## Architecture

See [PLAN/PLAN.md](PLAN/PLAN.md) for the full architecture document.

```
src/
  api/          ← Axios client + ApiError (all HTTP calls here)
  commands/     ← CLI commands (login, list, add, done) + registry/resolver/executor
  tui/          ← Ink React TUI (screens, hooks, components)
  types/        ← Shared TypeScript types
  utils/        ← numbering, tree, scoring, logger, auth
  config.ts     ← Config resolution
  index.ts      ← Entry point (commander wiring + TUI launcher)
```

---

## Development

```bash
git clone https://github.com/pranavdadhe1806/StrataNodex-CLI.git
cd StrataNodex-CLI
npm install
npm run dev          # Run with tsx (no build needed)
npm run test         # Vitest
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
```

---

## License

MIT © 2024 pranavdadhe1806
