# StrataNodex CLI — Plan & Architecture

> For the AI coding agent (Cursor, Windsurf, etc.) — read this fully before writing a single line of code.

---

## What Is StrataNodex?

StrataNodex is a CLI-first, cross-platform productivity and task management system. It is a **tree-based task manager** — everything is a Node, and Nodes can have infinite sub-nodes.

The full product has 4 clients:

- **CLI** ← you are building this
- Web App (React + Vite)
- Mobile App (React Native)
- Desktop (Electron, future)

All clients talk to the same **Express.js + PostgreSQL backend** via REST API. No client touches the database directly. The backend is the single source of truth.

---

## Data Hierarchy (How The App Works)

```
User Account
 └── Folders          (e.g. "Work", "Personal", "College")
      └── Lists        (e.g. "Maths", "Project A", "Gym")
           └── Nodes   (Tasks — the actual work items)
                └── Sub-nodes
                     └── Sub-sub-nodes (infinite depth, no limit)
```

Each Node has:

- Title
- Status: `TODO` → `IN_PROGRESS` → `DONE`
- Priority: `LOW` / `MEDIUM` / `HIGH`
- Notes (plain text)
- Start datetime + End datetime
- Reminder datetime
- Tags (global to account OR local to a list)
- Canvas X/Y position (web only — CLI ignores this completely)
- Parent reference (enables infinite nesting via self-referential `parentId`)

**Dynamic views (not stored, computed at query time):**

- **Daily Tasks** → nodes whose `startAt–endAt` range includes today
- **Overdue** → nodes where `endAt` < today and status ≠ DONE

**Gamification:**

- At end of each day, a score is computed per list and overall
- Scoring: ≥90% done → +3 | 60–89% → +2 | 30–59% → +1 | 1–29% → 0 | 0% → -1
- Streak is tracked at account level, list level, and folder level (folder = sum of its lists)
- Main graph: line graph of daily points over time (account overall)
- Daily breakdown: per-list completion % for today

---

## CLI Architecture — Two Modes

The CLI works in two distinct modes. Both are part of the same binary.

### Mode 1 — Command Mode (non-interactive)

Quick one-shot commands for power users. No TUI, just instant output.

```bash
stratanodex add "Fix the API bug"
stratanodex list
stratanodex done 1.2.1
stratanodex login
```

These use `commander` for argument parsing and output plain text or a minimal styled response via `chalk`. Think of these as the "quick actions" — no screen rendering, no keyboard navigation.

### Mode 2 — TUI Mode (interactive)

Full terminal UI built with Ink. Launched when the user runs `stratanodex` with no arguments.

```bash
stratanodex
```

This opens the full 3-screen interactive interface.

---

## The 3 TUI Screens

### Screen 1 — Home (Folders)

```
  ╔══════════════════════════════╗
  ║   StrataNodex  👋 Hey, Arya  ║
  ╚══════════════════════════════╝

  📁 Folders

  ❯ Work
    Personal
    College
    📅 Daily Tasks

  [↑↓] navigate  [Enter] open  [n] new  [e] edit  [d] delete  [/] search  [q] quit
```

### Screen 2 — Lists (inside a folder)

```
  📁 Work

  📋 Lists

  ❯ Project A
    Backend Tasks
    Design Review

  [↑↓] navigate  [Enter] open  [b] back  [n] new  [e] edit  [d] delete
```

### Screen 3 — Tree View (core screen)

```
  📋 Project A  ›  Work

  ❯ 1   Fix authentication bug                     [IN PROGRESS] [HIGH]
      └─ 1.1   Write failing test
      └─ 1.2   Update JWT middleware
           └─ 1.2.1   Check token expiry logic      [DONE]
    2   Update Prisma schema
    3   Deploy to Render

  [↑↓] navigate  [→←] expand/collapse  [Space] cycle status  [e] edit
  [o] add below  [a] add above  [Tab] indent  [Shift+Tab] outdent
  [Shift+↑↓] reorder  [f] focus mode  [:] command palette  [b] back
```

### Focus Mode (triggered by `f` in Tree View)

```
  [ Fix authentication bug ]

  ❯ 1.1   Write failing test
    1.2   Update JWT middleware

  [Esc] exit focus
```

### Command Palette (triggered by `:` in Tree View)

```
  > _

  move 1.2 under 3
  delete node
  go 2.1
  set priority high
```

---

## Keyboard Controls Reference

### Navigation Mode (default)

| Key     | Action             |
| ------- | ------------------ |
| `↑` `↓` | Move cursor        |
| `→`     | Expand node        |
| `←`     | Collapse node      |
| `Enter` | Open / confirm     |
| `b`     | Go back one screen |
| `q`     | Quit               |
| `Esc`   | Exit mode / back   |

### Editing

| Key     | Action                                  |
| ------- | --------------------------------------- |
| `e`     | Edit selected node title                |
| `o`     | Add node below current                  |
| `a`     | Add node above current                  |
| `d`     | Delete node (confirm prompt)            |
| `Space` | Cycle status: TODO → IN_PROGRESS → DONE |

### Structure

| Key         | Action                            |
| ----------- | --------------------------------- |
| `Tab`       | Indent (make child of node above) |
| `Shift+Tab` | Outdent (promote to parent level) |
| `Shift+↑`   | Move node up among siblings       |
| `Shift+↓`   | Move node down among siblings     |

### Utility

| Key | Action                                |
| --- | ------------------------------------- |
| `/` | Search                                |
| `f` | Focus mode (show only current branch) |
| `:` | Command palette                       |

### Two Interaction Modes

- **Navigation Mode** (default) — move around, trigger actions
- **Edit Mode** — typing node title. `Enter` saves + creates next node. `Esc` exits.

---

## Visual Design System

```
Node status colors (via chalk):
  TODO        → default white
  IN_PROGRESS → blue
  DONE        → green (dimmed)
  Overdue     → red

Priority indicators:
  HIGH   → [HIGH] in red
  MEDIUM → [MED] in yellow
  LOW    → [LOW] in dim white

Cursor:
  ❯ selected node (highlighted yellow background or bold)
    unselected node

Tree connectors (right-angled, NOT curved):
  └─   child connector
  │    vertical line continuing down

Hierarchical numbering (dynamic, NOT stored in DB):
  1
  1.1
  1.2
  1.2.1
  2
  2.1

Breadcrumb (shown at top of tree view):
  Work  ›  Project A  ›  Fix auth bug
```

---

## Tech Stack

| Concern                                    | Package                                       |
| ------------------------------------------ | --------------------------------------------- |
| Core TUI rendering                         | `ink`                                         |
| Text input fields                          | `ink-text-input`                              |
| Navigable select lists                     | `ink-select-input`                            |
| Pre-built UI components (spinner, confirm) | `@inkjs/ui`                                   |
| Colors and terminal styling                | `chalk`                                       |
| CLI argument parsing (command mode)        | `commander`                                   |
| HTTP requests to backend                   | `axios`                                       |
| Secure token storage                       | `conf` (stores JWT in OS keychain/config dir) |
| Environment variables                      | `dotenv`                                      |
| Logging                                    | `pino`                                        |
| TypeScript                                 | `typescript`                                  |
| Dev runner                                 | `tsx` (ESM-native, faster than ts-node)       |
| Testing framework                          | `vitest`                                      |
| TUI component testing                      | `ink-testing-library`                         |
| Linting                                    | `eslint`                                      |
| Formatting                                 | `prettier`                                    |
| Git hooks                                  | `husky` + `lint-staged`                       |

---

## Repo Position

This CLI is a **standalone repository** — `StrataNodex-CLI`.

```
StrataNodex-CLI/              ← standalone repo root
  src/
    types/                    ← type definitions live here
    ...
  package.json
  tsconfig.json
```

Types are defined locally in `src/types/`:

```ts
import type { Node, Folder, List, Tag, DailyScore } from './types'
```

Types are local for now and structured to be extracted into a shared package (`@stratanodex/shared`) once the web/mobile clients exist. Until then, they live in `src/types/index.ts` and mirror the backend's Prisma schema.

---

## Folder Structure

```
apps/cli/
│
├── src/
│   │
│   ├── index.ts                    # Entry point — parses args, decides TUI or command mode
│   │
│   ├── commands/                   # Command mode (non-interactive)
│   │   ├── add.ts                  # stratanodex add "Task name"
│   │   ├── list.ts                 # stratanodex list
│   │   ├── done.ts                 # stratanodex done <id>
│   │   ├── login.ts                # stratanodex login
│   │   └── logout.ts               # stratanodex logout
│   │
│   ├── tui/                        # TUI mode (Ink components)
│   │   ├── App.tsx                 # Root Ink component — manages which screen is shown
│   │   │
│   │   ├── screens/
│   │   │   ├── HomeScreen.tsx      # Screen 1 — Folders list
│   │   │   ├── ListsScreen.tsx     # Screen 2 — Lists inside a folder
│   │   │   ├── TreeScreen.tsx      # Screen 3 — Node tree (core screen)
│   │   │   └── DailyScreen.tsx     # Daily Tasks view
│   │   │
│   │   ├── components/
│   │   │   ├── Header.tsx          # App name + logged-in user
│   │   │   ├── FolderItem.tsx      # Single folder row
│   │   │   ├── ListItem.tsx        # Single list row
│   │   │   ├── NodeRow.tsx         # Single node row with indentation + connectors
│   │   │   ├── TreeConnector.tsx   # Right-angled └─ connector lines
│   │   │   ├── StatusBadge.tsx     # [TODO] [IN PROGRESS] [DONE] colored badge
│   │   │   ├── PriorityBadge.tsx   # [HIGH] [MED] [LOW] colored badge
│   │   │   ├── Breadcrumb.tsx      # Work › Project A › Fix auth bug
│   │   │   ├── Keybindings.tsx     # Bottom bar showing available keys
│   │   │   ├── FocusMode.tsx       # Focus mode overlay
│   │   │   ├── CommandPalette.tsx  # : command palette overlay
│   │   │   └── SearchOverlay.tsx   # / search overlay
│   │   │
│   │   └── hooks/
│   │       ├── useFolders.ts       # Fetch + manage folders state
│   │       ├── useLists.ts         # Fetch + manage lists state
│   │       ├── useTree.ts          # Fetch + manage node tree, expand/collapse state
│   │       ├── useNavigation.ts    # Cursor position, screen stack
│   │       ├── useKeymap.ts        # Centralised keyboard event handler
│   │       └── useAuth.ts          # Read token from conf, check if logged in
│   │
│   ├── api/
│   │   └── client.ts               # Axios instance — all backend calls live here
│   │                               # Base URL from config, JWT attached automatically
│   │
│   ├── utils/
│   │   ├── auth.ts                 # Save/read/delete JWT via conf
│   │   ├── numbering.ts            # Generate 1, 1.1, 1.2.1 hierarchy numbers dynamically
│   │   ├── tree.ts                 # flattenTree, findNode, moveNode, indentNode helpers
│   │   └── scoring.ts             # calculatePoints(done, total) — same logic as backend
│   │
│   └── config.ts                   # App config — API base URL, app name, version
│
├── package.json
├── tsconfig.json
└── README.md
```

---

## Configuration & Environments

The CLI resolves configuration in this order (highest priority first):

1. **CLI flags** — e.g., `stratanodex --api-url=http://localhost:3000`
2. **Environment variable** — `STRATANODEX_API_URL`
3. **Stored config** — via `conf` (persisted across sessions)
4. **`.env` file** — dev-only, gitignored
5. **Built-in default** — production API URL

### Config Commands

```bash
stratanodex config list
stratanodex config get apiUrl
stratanodex config set apiUrl https://api.stratanodex.com
```

### Logging

- All logs written to `<confDir>/log.txt` (rotated by size, max 10MB)
- `--verbose` flag also outputs logs to stderr
- Request IDs tracked for correlation

---

## Error Handling & Logging

### API Errors

All axios errors are wrapped in a single `ApiError` class:

```ts
class ApiError extends Error {
  constructor(
    public statusCode: number,
    public userMessage: string,
    public originalError?: any
  ) {}
}
```

### Error Mapping

- **Network errors** → "Cannot reach server. Check `stratanodex config get apiUrl`."
- **401 Unauthorized** → Auto-clear token + prompt re-login
- **403 Forbidden** → "You don't have permission to do that."
- **404 Not Found** → "Resource not found."
- **500 Server Error** → "Server error. Try again later."

All errors logged to file with full stack + request context. Only the `userMessage` shown to user unless `--verbose`.

---

## Testing Strategy

### Unit Tests

- `utils/numbering.ts` — hierarchical number generation
- `utils/tree.ts` — flatten, find, move, indent, outdent, reorder
- `utils/scoring.ts` — matches backend scoring buckets
- `api/client.ts` — request/response shaping with mocked axios adapter
- `utils/auth.ts` — token save/get/clear

### Component Tests

- Each Ink screen (`HomeScreen`, `ListsScreen`, `TreeScreen`, `DailyScreen`)
- Key components (`NodeRow`, `TreeConnector`, `StatusBadge`, etc.)
- Uses `ink-testing-library` — snapshot initial render + key-press assertions

### Integration Tests

- Command-mode flows (`login`, `add`, `done`, `list`) end-to-end with mocked axios

### Coverage Targets

- ≥80% on `utils/`
- ≥60% overall by Phase 4 (publish)

---

## API Client Design

All backend communication goes through one file: `src/api/client.ts`

```ts
// Pattern — all API calls live here, nowhere else
import axios from 'axios'
import { getToken } from '../utils/auth'

const client = axios.create({
  baseURL: 'https://api.stratanodex.com', // from config
})

client.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const getFolders = () => client.get('/api/folders')
export const createFolder = (name: string) => client.post('/api/folders', { name })
export const getLists = (folderId: string) => client.get(`/api/folders/${folderId}/lists`)
export const getTree = (listId: string) => client.get(`/api/lists/${listId}/nodes`)
// ... and so on for every endpoint
```

---

## Token Storage

Use the `conf` package — it stores data in the OS-appropriate config directory:

- macOS: `~/Library/Preferences/stratanodex-nodejs/`
- Linux: `~/.config/stratanodex-nodejs/`
- Windows: `%APPDATA%\stratanodex-nodejs\`

```ts
// src/utils/auth.ts
import Conf from 'conf'

const store = new Conf({ projectName: 'stratanodex' })

export const saveToken = (token: string) => store.set('token', token)
export const getToken = (): string | undefined => store.get('token') as string | undefined
export const clearToken = () => store.delete('token')
```

Never store JWT in a plain `.env` or local file. `conf` handles cross-platform safe storage automatically.

---

## Hierarchical Numbering (Important)

Node numbers like `1`, `1.2`, `1.2.1` are **NOT stored in the database**. They are computed dynamically at render time from the tree structure.

```ts
// src/utils/numbering.ts
// Takes the flat list of nodes (with parentId) and assigns numbers
// based on their position in the tree
// e.g. root node at position 0 → "1"
//      its second child → "1.2"
//      that child's first child → "1.2.1"
```

This is important — the CLI uses these numbers for command mode (`stratanodex done 1.2.1`) but they are ephemeral. Reordering nodes changes their numbers.

---

## Development Phases

### Phase 0 — Repo Bootstrap

- [ ] Init `package.json` with ESM + engines + bin
- [ ] `tsconfig.json` with NodeNext + react-jsx
- [ ] Install runtime + dev deps
- [ ] ESLint flat config + Prettier + `.editorconfig`
- [ ] Husky + lint-staged: pre-commit runs `lint` + `typecheck` + `test --run`
- [ ] Vitest config + sample passing test
- [ ] GitHub Actions: `node 20`, `npm ci`, `lint`, `typecheck`, `test`, `build`
- [ ] `src/index.ts` shebang + "hello" smoke output via `npm run dev`

### Phase 1 — Foundations

- [ ] `src/config.ts` — env + conf + flag resolution, default API URL
- [ ] `src/utils/logger.ts` — pino to file + stderr when `--verbose`
- [ ] `src/utils/auth.ts` — `conf` wrapper, `saveToken/getToken/clearToken`
- [ ] `src/api/client.ts` — axios instance, JWT interceptor, `ApiError` mapper, 401 handler
- [ ] `src/types/index.ts` — `Node`, `Folder`, `List`, `Tag`, `DailyScore`, enums (mirror backend Prisma)
- [ ] `src/utils/numbering.ts` + tests (`1`, `1.2`, `1.2.1` from flat list)
- [ ] `src/utils/tree.ts` + tests (`flatten`, `find`, `move`, `indent`, `outdent`, `reorder`)
- [ ] `src/utils/scoring.ts` + tests (matches backend buckets)

### Phase 2 — Command Mode

- [ ] `src/commands/login.ts` — interactive prompt via `@inkjs/ui`, POST `/auth/login`, save JWT
- [ ] `src/commands/logout.ts` — clear token
- [ ] `src/commands/config.ts` — `get|set|list` for `apiUrl` and other keys
- [ ] `src/commands/list.ts` — fetch + print folders → lists → top-level nodes (depth flag `-d`)
- [ ] `src/commands/add.ts` — `add "title" [--list <id>] [--parent <number>]`
- [ ] `src/commands/done.ts` — `done <number>` resolves number → node id via cached tree
- [ ] `src/index.ts` — `commander` wiring; if no args → launch TUI
- [ ] Integration tests for each command with mocked axios

### Phase 3 — TUI Shell + Screens

- [ ] `src/tui/App.tsx` — screen stack, current screen renderer, global error boundary
- [ ] `src/tui/hooks/useAuth.ts` — gate to login screen if no token
- [ ] `src/tui/hooks/useNavigation.ts` — push/pop screen stack
- [ ] `src/tui/hooks/useKeymap.ts` — single keyboard dispatcher with mode (`nav`/`edit`)
- [ ] `src/tui/components/` — Header, Breadcrumb, Keybindings, StatusBadge, PriorityBadge, TreeConnector, NodeRow, FolderItem, ListItem
- [ ] `src/tui/screens/HomeScreen.tsx` + `useFolders` hook
- [ ] `src/tui/screens/ListsScreen.tsx` + `useLists` hook
- [ ] `src/tui/screens/TreeScreen.tsx` + `useTree` hook (expand/collapse, dynamic numbering)
- [ ] `src/tui/screens/DailyScreen.tsx` (today filter computed client-side from cached tree)
- [ ] Component tests for each screen (initial render + 1 keybind path)

### Phase 4 — TUI Editing + Structure Ops

- [ ] Edit mode (inline `ink-text-input` on a node)
- [ ] `o` add below, `a` add above, `d` delete with confirm
- [ ] `Space` cycles status with optimistic UI + rollback on API error
- [ ] `Tab`/`Shift+Tab` indent/outdent (tree util + API call)
- [ ] `Shift+↑`/`Shift+↓` reorder siblings
- [ ] Optimistic updates with toast on rollback

### Phase 5 — Polish

- [ ] `f` Focus mode overlay
- [ ] `:` Command palette (parser + `move`, `delete`, `go`, `set priority`, `set status`)
- [ ] `/` Search overlay (client-side fuzzy over current list)
- [ ] Error boundary + friendly empty/loading states
- [ ] Daily Tasks view enhancements (overdue group)
- [ ] Accessibility: respect `NO_COLOR`, narrow-terminal fallback (≤80 cols)

### Phase 6 — Publish

- [ ] `npm run build` outputs ESM `dist/` with shebang preserved
- [ ] `files` field whitelist; `prepublishOnly` runs `lint`+`test`+`build`
- [ ] Smoke test `npm pack` → install tarball globally → run `stratanodex`
- [ ] `README.md` install + quickstart + screenshots
- [ ] `npm publish` (manual, by owner)

---

## Rules — Do Not Break These

1. **No DB calls ever** — CLI only talks to the backend API via `src/api/client.ts`. Never import Prisma.
2. **Types live in `src/types/`** — import all types from `./types`. Never redefine `Node`, `Folder`, `List` in multiple places. They are structured to be extracted to `@stratanodex/shared` later.
3. **All API calls in one file** — `src/api/client.ts` is the only place that uses axios. Hooks call these functions, they don't call axios directly.
4. **Numbering is never stored** — `1.2.1` is computed at render time in `src/utils/numbering.ts`. Never send it to the backend.
5. **Canvas X/Y is never sent** — the CLI never reads or writes `canvasX`/`canvasY`. Those fields are web-only.
6. **Two modes are separate** — `src/commands/` is command mode, `src/tui/` is TUI mode. They don't import each other. Both go through `src/api/client.ts`.
7. **useKeymap is the single keyboard handler** — all key bindings are registered in `hooks/useKeymap.ts`. Never add `useInput` calls scattered across random components.
8. **No `console.log` in production paths** — use the logger (`src/utils/logger.ts`). Console is only for dev debugging.
9. **Every API call returns through the central `ApiError` mapper** — no raw axios errors leak to the UI. All errors are wrapped and logged.
10. **Every new feature ships with at least one test** — utils get unit tests, screens get a component test. No untested code in main.

---

## package.json Reference

```json
{
  "name": "stratanodex",
  "version": "0.1.0",
  "description": "CLI-first productivity system",
  "type": "module",
  "bin": {
    "stratanodex": "./dist/index.js"
  },
  "engines": {
    "node": ">=20.0.0"
  },
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "lint": "eslint src/",
    "format": "prettier --write src/",
    "typecheck": "tsc --noEmit",
    "prepare": "husky install"
  },
  "dependencies": {
    "ink": "^4.4.1",
    "ink-text-input": "^5.0.1",
    "ink-select-input": "^5.0.0",
    "@inkjs/ui": "^1.0.0",
    "chalk": "^5.3.0",
    "commander": "^11.0.0",
    "axios": "^1.6.0",
    "conf": "^12.0.0",
    "dotenv": "^16.3.0",
    "pino": "^8.16.0",
    "react": "^18.2.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "tsx": "^4.7.0",
    "vitest": "^1.0.0",
    "ink-testing-library": "^3.0.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0",
    "husky": "^8.0.0",
    "lint-staged": "^15.2.0",
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.0"
  }
}
```

---

## tsconfig.json Reference

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "jsx": "react-jsx",
    "resolveJsonModule": true,
    "declaration": false,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

Note:

- `"module": "NodeNext"` + `"type": "module"` in package.json — required for ESM-only deps (`ink@4`, `chalk@5`, `conf@12`)
- `"jsx": "react-jsx"` — Ink uses React JSX even though it renders to the terminal, not the browser

---

## How To Run Locally

```bash
# From monorepo root
cd apps/cli

# Install dependencies
npm install

# Run in dev mode (no build needed)
npm run dev

# Or test a specific command
npm run dev -- add "Test task"
npm run dev -- login
```

---

## What You Are Actually Building

Not a simple CLI tool. Not just a to-do app.

A **terminal-based tree editor + productivity system** — keyboard-driven, infinitely nestable, fast, and developer-native. The same data model that renders as an interactive canvas on the web renders here as a navigable indent tree in the terminal.
