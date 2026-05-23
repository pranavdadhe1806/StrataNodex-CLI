# StrataNodex CLI

> A keyboard-driven, terminal-based task manager for power users.

[![npm version](https://img.shields.io/npm/v/stratanodex)](https://www.npmjs.com/package/stratanodex)
[![Node.js >=20](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## What is StrataNodex CLI?

StrataNodex CLI is the terminal-first interface for **StrataNodex** — a hierarchical task manager built around the idea that tasks live in a **tree**, not a flat list.

```
  ██▀▀ ▀█▀ █▀█ ▄▀█ ▀█▀ ▄▀█   █▄ █ █▀█ █▀▄ █▀▀ ▀▄▀
  ▄██  █  █▀▄ █▀█  █  █▀█   █ ▀█ █▄█ █▄▀ ██▄ █ █       v0.1.0 ● connected
  ──────────────────────────────────────────────────────
  📁 Folders

  › my project
  › side hustle

  [↑↓] navigate  [Enter] open  [n] new  [e] edit  [d] delete  [q] quit
  ──────────────────────────────────────────────────────
  > type / for commands
  / for commands  ↑↓ navigate  TAB complete  ESC close  Enter execute
```

**3-panel TUI layout:**

- **Top** — fixed header with version and login state
- **Middle** — scrollable content (folders → lists → nodes)
- **Bottom** — smart command bar with live autocomplete

---

## Quick Setup

> **Prerequisites:** [Node.js ≥20](https://nodejs.org) must be installed.

### Install from npm (recommended)

```bash
npm install -g stratanodex
stratanodex
```

### Run from source

```bash
# 1. Clone the repo
git clone https://github.com/pranavdadhe1806/StrataNodex-CLI.git
cd StrataNodex-CLI

# 2. Install dependencies
npm install

# 3. Run the CLI
npm run dev
```

On first launch you'll see the login screen. It opens your browser to [stratanodex.online](https://stratanodex.online) for authentication, and once you log in, the CLI picks it up automatically and drops you into the home screen.

---

## How It Works

```
┌─────────────┐        ┌──────────────────────┐        ┌────────────────────────┐
│  CLI (you)  │───────▶│  Backend (Render)     │◀───────│  Landing Page (Vercel) │
│  npm run dev│  API   │  REST API + Auth      │  Auth  │  Browser-based login   │
└─────────────┘        └──────────────────────┘        └────────────────────────┘
```

1. You run `npm run dev` — the CLI starts in your terminal
2. On first use, it opens your browser to the StrataNodex landing page
3. You log in (email + password) — the CLI detects the login automatically
4. You're now authenticated and can manage folders, lists, and tasks

**The backend and landing page are already deployed.** You only need this CLI repo.

---

## Usage

### Navigation

| Key       | Action                     |
| --------- | -------------------------- |
| `↑` / `↓` | Move cursor                |
| `Enter`   | Open selected item         |
| `b`       | Go back                    |
| `q`       | Quit                       |
| `/`       | Open command bar           |
| `TAB`     | Complete autocomplete      |
| `ESC`     | Close autocomplete overlay |

### Commands

Every command starts with `/`. Type `/` in the command bar to see suggestions.

#### Global (available on all screens)

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

#### Folders screen

| Command          | Args                | Description         |
| ---------------- | ------------------- | ------------------- |
| `/new folder`    | `name`              | Create a new folder |
| `/edit folder`   | `name` → `new-name` | Rename a folder     |
| `/delete folder` | `name`              | Delete a folder     |

#### Lists screen (inside a folder)

| Command        | Args                | Description       |
| -------------- | ------------------- | ----------------- |
| `/new list`    | `name`              | Create a new list |
| `/edit list`   | `name` → `new-name` | Rename a list     |
| `/delete list` | `name`              | Delete a list     |

#### Nodes screen (inside a list)

| Command                     | Args                                  | Description                            |
| --------------------------- | ------------------------------------- | -------------------------------------- |
| `/add node`                 | `title`                               | Add a new root task                    |
| `/add sub-node`             | `title`                               | Add sub-task under selected node       |
| `/add sub-node`             | `index title`                         | Add sub-task under node at index (1.2) |
| `/done`                     | `index or title`                      | Mark a task as DONE                    |
| `/delete node`              | `index or title`                      | Delete a task                          |
| `/move node`                | `ref` → `list-name`                   | Move to another list                   |
| `/edit node ... title`      | `ref` → `new title`                   | Rename a task                          |
| `/edit node ... status`     | `ref` → `NOT-DONE\|IN-PROGRESS\|DONE` | Change status                          |
| `/edit node ... priority`   | `ref` → `LOW\|MEDIUM\|HIGH`           | Change priority                        |
| `/edit node ... start-date` | `ref` → `DD-MM-YYYY`                  | Set start date                         |
| `/edit node ... end-date`   | `ref` → `DD-MM-YYYY`                  | Set end date                           |
| `/add node ... tag`         | `ref` → `tag-name`                    | Add a tag                              |
| `/add node ... note`        | `ref` → `text`                        | Add a note                             |
| `/delete node ... note`     | `ref`                                 | Remove note                            |

---

## Autocomplete

Autocomplete is **context-aware** — it knows which screen you're on and which nodes are in the current list.

```
Stage 1  /edit no         → /edit node
Stage 2  /edit node       → 1. Fix login bug  2. Review PR
Stage 3  /edit node 1     → title / status / priority / start-date ...
Stage 4  /edit node 1 sta → start-date (DD-MM-YYYY hint)
```

- `↑`/`↓` to navigate suggestions
- `TAB` fills the selected suggestion
- `ESC` closes without clearing input

---

## Example Workflow

```bash
npm run dev                        # Launch the CLI

# After logging in:
/new folder Work                   # Create a folder
# Press Enter on "Work" to open it
/new list Sprint 1                 # Create a list
# Press Enter on "Sprint 1"
/add node Fix login bug            # Add tasks
/add node Review PR
/add node Write docs
/done 1                            # Mark "Fix login bug" as done
/edit node 2 priority HIGH         # Set priority
/add node 1 tag frontend           # Tag a task
/dashboard                         # View your score + streaks
```

---

## Environment Variables (optional)

These are only needed if you want to override defaults. For normal use, **you don't need any env file.**

| Variable              | Default                          | Description            |
| --------------------- | -------------------------------- | ---------------------- |
| `STRATANODEX_API_URL` | `https://api.stratanodex.online` | Override API base URL  |
| `STRATANODEX_VERBOSE` | `false`                          | Enable verbose logging |
| `NO_COLOR`            | unset                            | Disable all colors     |

To use local overrides, copy the example file:

```bash
cp .env.example .env
# Edit .env with your values
```

---

## Project Structure

```
src/
  api/          ← Axios client + ApiError (all HTTP calls)
  commands/     ← Command registry, resolver, executor + individual commands
  tui/          ← Ink React TUI (screens, hooks, components)
  types/        ← Shared TypeScript types
  utils/        ← Numbering, tree, scoring, logger, auth helpers
  config.ts     ← Config resolution (env → store → defaults)
  index.ts      ← Entry point
```

---

## Development Scripts

```bash
npm run dev          # Run with tsx (no build step)
npm run build        # Compile TypeScript to dist/
npm run test         # Run tests (Vitest)
npm run typecheck    # Type-check without emitting
npm run lint         # ESLint
npm run format       # Prettier
```

---

## Tech Stack

- **Runtime:** Node.js ≥ 20
- **Language:** TypeScript (ESM)
- **TUI Framework:** [Ink](https://github.com/vadimdemedes/ink) (React for terminals)
- **HTTP Client:** Axios
- **Config:** [Conf](https://github.com/sindresorhus/conf) (persistent local config)
- **Testing:** Vitest

---

## License

MIT © 2024 pranavdadhe1806
