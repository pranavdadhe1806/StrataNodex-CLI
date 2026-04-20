# StrataNodex CLI — Execution Plan

> **For AI agents**: Read this file top-to-bottom. Complete one unchecked `- [ ]` task at a time. Tick it when done. Move to the next. Do not skip ahead. Do not hallucinate.

---

## How To Use This File

1. **Find the next unchecked task** — scan for `- [ ]`
2. **Read the task goal + files + acceptance criteria**
3. **Complete the task** — write code, run tests, verify
4. **Tick the checkbox** — change `- [ ]` to `- [x]`
5. **Move to the next task**

If a task is blocked (e.g., waiting for backend endpoint), mark it `- [⏸]` and document why in a comment. Resume when unblocked.

---

## Global Invariants (The Rules)

These apply to **every** task. Never violate them.

1. **No DB calls ever** — CLI only talks to backend API via `src/api/client.ts`. Never import Prisma.
2. **Types live in `src/types/`** — import from `./types`. Never redefine `Node`, `Folder`, `List` elsewhere.
3. **All API calls in one file** — `src/api/client.ts` is the only place using axios.
4. **Numbering is never stored** — `1.2.1` is computed at render time. Never send to backend.
5. **Canvas X/Y is never sent** — CLI never reads/writes `canvasX`/`canvasY` (web-only).
6. **Two modes are separate** — `src/commands/` vs `src/tui/`. Both use `src/api/client.ts`.
7. **useKeymap is the single keyboard handler** — no scattered `useInput` calls.
8. **No `console.log` in production** — use logger. Console only for dev debugging.
9. **Every API call wrapped in `ApiError`** — no raw axios errors leak to UI.
10. **Every feature ships with tests** — utils get unit tests, screens get component tests.

---

## Glossary

- **Node**: A task/work item. Has title, status, priority, notes, dates, tags, parent.
- **List**: A collection of nodes (e.g., "Project A"). Lives inside a Folder.
- **Folder**: Top-level container (e.g., "Work", "Personal"). Contains Lists.
- **Tree**: Hierarchical view of nodes with parent-child relationships.
- **Tree number**: Dynamic numbering like `1`, `1.2`, `1.2.1` — computed at render, never stored.

---

## Phase 0 — Repo Bootstrap

**Goal**: Set up project structure, tooling, and CI so development can begin.

### Task 0.1 — Init package.json

- [x] Create `package.json` with:
  - `"type": "module"` (ESM)
  - `"engines": { "node": ">=20.0.0" }`
  - `"bin": { "stratanodex": "./dist/index.js" }`
  - Scripts: `dev`, `build`, `start`, `test`, `test:watch`, `lint`, `format`, `typecheck`, `prepare`
  - Dependencies: `ink@^4.4.1`, `ink-text-input@^5.0.1`, `ink-select-input@^5.0.0`, `@inkjs/ui@^1.0.0`, `chalk@^5.3.0`, `commander@^11.0.0`, `axios@^1.6.0`, `conf@^12.0.0`, `dotenv@^16.3.0`, `pino@^8.16.0`, `react@^18.2.0`
  - DevDependencies: `typescript@^5.3.0`, `tsx@^4.7.0`, `vitest@^1.0.0`, `ink-testing-library@^3.0.0`, `eslint@^8.55.0`, `prettier@^3.1.0`, `husky@^8.0.0`, `lint-staged@^15.2.0`, `@types/node@^20.10.0`, `@types/react@^18.2.0`

**Acceptance**: `npm install` succeeds, no errors.

### Task 0.2 — Create tsconfig.json

- [x] Create `tsconfig.json` with:
  - `"target": "ES2022"`, `"module": "NodeNext"`, `"moduleResolution": "NodeNext"`
  - `"jsx": "react-jsx"`, `"resolveJsonModule": true`, `"declaration": false`
  - `"outDir": "./dist"`, `"rootDir": "./src"`
  - `"strict": true`, `"esModuleInterop": true`, `"skipLibCheck": true`
  - `"include": ["src/**/*"]`, `"exclude": ["node_modules", "dist"]`

**Acceptance**: `npm run typecheck` runs (even if no src/ yet).

### Task 0.3 — ESLint + Prettier + .editorconfig

- [x] Create `eslint.config.js` (flat config) with TypeScript + React rules
- [x] Create `.prettierrc.json` with: `{ "semi": false, "singleQuote": true, "printWidth": 100 }`
- [x] Create `.editorconfig` with: `indent_style = space`, `indent_size = 2`, `end_of_line = lf`
- [x] Add `.prettierignore` and `.eslintignore` (ignore `dist/`, `node_modules/`)

**Acceptance**: `npm run lint` and `npm run format` run without errors.

### Task 0.4 — Husky + lint-staged

- [x] Run `npm run prepare` to init Husky
- [x] Create `.husky/pre-commit` hook that runs `npx lint-staged`
- [x] Create `.lintstagedrc.json`:
  ```json
  {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
  ```
- [x] Add pre-commit check: `npm run typecheck && npm run test --run`

**Acceptance**: Making a commit runs lint + typecheck + tests.

### Task 0.5 — Vitest config + sample test

- [x] Create `vitest.config.ts`:
  ```ts
  import { defineConfig } from 'vitest/config'
  export default defineConfig({
    test: {
      globals: true,
      environment: 'node',
    },
  })
  ```
- [x] Create `src/utils/sample.test.ts`:
  ```ts
  import { describe, it, expect } from 'vitest'
  describe('sample', () => {
    it('should pass', () => {
      expect(1 + 1).toBe(2)
    })
  })
  ```

**Acceptance**: `npm run test` passes.

### Task 0.6 — GitHub Actions CI

- [x] Create `.github/workflows/ci.yml`:
  - Trigger on push + PR
  - Job: `node 20`, `npm ci`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`

**Acceptance**: Push to GitHub triggers CI and it passes.

### Task 0.7 — src/index.ts smoke test

- [x] Create `src/index.ts`:
  ```ts
  #!/usr/bin/env node
  console.log('StrataNodex CLI v0.1.0')
  ```
- [x] Make it executable: `chmod +x src/index.ts` (if on Unix)
- [x] Run `npm run dev` — should print version

**Acceptance**: `npm run dev` prints "StrataNodex CLI v0.1.0".

---

## Phase 1 — Foundations

**Goal**: Build core utilities, API client, types, and logging infrastructure.

### Task 1.1 — src/config.ts

- [ ] Create `src/config.ts`:
  - Export `getConfig()` function
  - Resolution order: CLI flag > env var (`STRATANODEX_API_URL`) > conf store > `.env` > default
  - Default API URL: `https://stratanodex-backend.onrender.com`
  - Support `--api-url` flag, `--verbose` flag

**Files**: `src/config.ts`

**Acceptance**: `getConfig()` returns correct API URL based on env.

### Task 1.2 — src/utils/logger.ts

- [ ] Create `src/utils/logger.ts`:
  - Use `pino` to write to `<confDir>/log.txt`
  - Rotate log file when > 10MB
  - If `--verbose`, also output to stderr
  - Export `logger.info()`, `logger.error()`, `logger.debug()`

**Files**: `src/utils/logger.ts`

**Acceptance**: Calling `logger.info('test')` writes to log file.

### Task 1.3 — src/utils/auth.ts

- [ ] Create `src/utils/auth.ts`:
  - Use `conf` to store/retrieve JWT
  - Export `saveToken(token: string)`, `getToken(): string | undefined`, `clearToken()`
  - Store in OS config dir via `new Conf({ projectName: 'stratanodex' })`

**Files**: `src/utils/auth.ts`

**Acceptance**: `saveToken('abc')` then `getToken()` returns `'abc'`.

### Task 1.4 — src/api/client.ts (part 1: setup)

- [ ] Create `src/api/client.ts`:
  - Create axios instance with `baseURL` from config
  - Add request interceptor: attach JWT from `getToken()` as `Authorization: Bearer <token>`
  - Add response interceptor: wrap errors in `ApiError` class
  - **Error format from API**: `{ "error": "Human-readable message" }` — extract `error` field (NOT `message`)
  - Handle `401`: auto-clear token + throw `ApiError` with message "Session expired. Please log in again."
  - Handle `429`: throw `ApiError` with message "Too many requests, please wait a moment."
  - Handle `5xx`: throw `ApiError` with generic message (backend returns generic string in production)

**Files**: `src/api/client.ts`, `src/api/ApiError.ts`

**Acceptance**: Axios instance created, interceptors registered.

### Task 1.5 — src/types/index.ts

- [ ] Create `src/types/index.ts`:
  - Define enums: `NodeStatus` (`TODO` | `IN_PROGRESS` | `DONE`), `Priority` (`LOW` | `MEDIUM` | `HIGH`)
  - Define `User`: `{ id, email, phone, name, isEmailVerified, isPhoneVerified, twoFactorEnabled, twoFactorMethod, dayStartTime, dayEndTime, createdAt }`
  - Define `Folder`: `{ id, name, position, userId, createdAt, updatedAt }`
  - Define `List`: `{ id, name, position, folderId, userId, createdAt, updatedAt }`
  - Define `Tag`: `{ id, name, color, listId, userId, createdAt, updatedAt }`
  - Define `Node`: `{ id, title, status: NodeStatus, priority: Priority | null, notes, startAt, endAt, reminderAt, canvasX, canvasY, position, parentId, listId, userId, createdAt, updatedAt, children: Node[], tags: Array<{ tag: Tag }> }` — **children are nested inline by the API**
  - Define `DailyScore`: `{ id, userId, listId, date, totalNodes, doneNodes, points, createdAt }`
  - Define `LoginResponse`: `{ user: User, token: string } | { requiresTwoFactor: true, userId: string }`
  - Define `ApiErrorResponse`: `{ error: string }`

**Files**: `src/types/index.ts`

**Acceptance**: Types importable from `./types`.

### Task 1.6 — src/utils/numbering.ts + tests

- [ ] Create `src/utils/numbering.ts`:
  - Function `assignNumbers(nodes: Node[]): Map<string, string>`
  - **API returns nodes pre-nested** (`children` array embedded). Takes nested `Node[]` (root nodes with children), returns map of `nodeId -> number` (e.g., `"1.2.1"`)
  - Algorithm: DFS traversal over `children` arrays, track depth + sibling index
  - Also export `flattenTree(nodes: Node[]): Node[]` here (DFS flatten of nested tree) — used by `done` command to resolve number → id
- [ ] Create `src/utils/numbering.test.ts`:
  - Test flat list → correct numbering
  - Test nested 3 levels deep
  - Test reordering siblings changes numbers

**Files**: `src/utils/numbering.ts`, `src/utils/numbering.test.ts`

**Acceptance**: Tests pass, coverage ≥80%.

### Task 1.7 — src/utils/tree.ts + tests

- [ ] Create `src/utils/tree.ts`:
  - `flattenTree(nodes: Node[]): Node[]` — DFS flatten
  - `findNode(nodes: Node[], id: string): Node | undefined`
  - `moveNode(nodes: Node[], nodeId: string, newParentId: string | null): Node[]`
  - `indentNode(nodes: Node[], nodeId: string): Node[]` — make child of previous sibling
  - `outdentNode(nodes: Node[], nodeId: string): Node[]` — promote to parent level
  - `reorderSiblings(nodes: Node[], nodeId: string, direction: 'up' | 'down'): Node[]`
- [ ] Create `src/utils/tree.test.ts`:
  - Test each function with sample tree

**Files**: `src/utils/tree.ts`, `src/utils/tree.test.ts`

**Acceptance**: Tests pass, coverage ≥80%.

### Task 1.8 — src/utils/scoring.ts + tests

- [ ] Create `src/utils/scoring.ts`:
  - Function `calculatePoints(done: number, total: number): number`
  - Buckets: ≥90% → +3 | 60–89% → +2 | 30–59% → +1 | 1–29% → 0 | 0% → -1
  - Must match backend scoring logic exactly
- [ ] Create `src/utils/scoring.test.ts`:
  - Test each bucket

**Files**: `src/utils/scoring.ts`, `src/utils/scoring.test.ts`

**Acceptance**: Tests pass, coverage 100%.

---

## Phase 2 — Command Mode

**Goal**: Build non-interactive CLI commands (`login`, `logout`, `config`, `list`, `add`, `done`).

### Task 2.1 — src/commands/login.ts

- [ ] Create `src/commands/login.ts`:
  - Use `@inkjs/ui` to prompt for email + password
  - POST to `POST /api/auth/login` with `{ email, password }`
  - **Handle two response shapes**:
    - Normal: `{ user, token }` → call `saveToken(token)`, print "Logged in as <email>"
    - 2FA required: `{ requiresTwoFactor: true, userId }` → prompt for 6-digit OTP code → POST to `POST /api/auth/2fa/verify` with `{ userId, code }` → on success save token
  - On error: print `err.message` from `ApiError` (which wraps `response.data.error`)
  - Rate limit (429): print "Too many login attempts. Wait a moment."

**Files**: `src/commands/login.ts`

**Acceptance**: `npm run dev -- login` prompts and saves token.

### Task 2.2 — src/commands/logout.ts

- [ ] Create `src/commands/logout.ts`:
  - Call `clearToken()`
  - Print "Logged out"

**Files**: `src/commands/logout.ts`

**Acceptance**: `npm run dev -- logout` clears token.

### Task 2.3 — src/commands/config.ts

- [ ] Create `src/commands/config.ts`:
  - Subcommands: `list`, `get <key>`, `set <key> <value>`
  - Use `conf` to store/retrieve config
  - Keys: `apiUrl`, others as needed

**Files**: `src/commands/config.ts`

**Acceptance**: `npm run dev -- config set apiUrl http://localhost:3000` works.

### Task 2.4 — src/api/client.ts (part 2: endpoints)

- [ ] Add API functions to `src/api/client.ts`:

  **Auth**
  - `login(email: string, password: string): Promise<LoginResponse>` → POST `/api/auth/login`
  - `verify2FA(userId: string, code: string): Promise<{ user: User; token: string }>` → POST `/api/auth/2fa/verify`
  - `getMe(): Promise<User>` → GET `/api/auth/me` (use to validate stored token on startup)
  - `healthCheck(): Promise<{ status: string }>` → GET `/health`

  **Folders** (full CRUD)
  - `getFolders(): Promise<Folder[]>` → GET `/api/folders`
  - `createFolder(name: string, position?: number): Promise<Folder>` → POST `/api/folders`
  - `updateFolder(id: string, data: { name?: string; position?: number }): Promise<Folder>` → PATCH `/api/folders/:id`
  - `deleteFolder(id: string): Promise<void>` → DELETE `/api/folders/:id` _(cascades to lists + nodes)_

  **Lists** (full CRUD)
  - `getLists(folderId: string): Promise<List[]>` → GET `/api/folders/:folderId/lists`
  - `createList(name: string, folderId: string, position?: number): Promise<List>` → POST `/api/lists`
  - `updateList(id: string, data: { name?: string; position?: number }): Promise<List>` → PATCH `/api/lists/:id`
  - `deleteList(id: string): Promise<void>` → DELETE `/api/lists/:id` _(cascades to nodes)_

  **Nodes**
  - `getNodes(listId: string): Promise<Node[]>` → GET `/api/lists/:listId/nodes` — **returns nested tree** (root nodes with `children[]` embedded)
  - `getNode(id: string): Promise<Node>` → GET `/api/nodes/:id`
  - `createRootNode(listId: string, data: Partial<Node>): Promise<Node>` → POST `/api/lists/:listId/nodes` _(requires `listId` in body too)_
  - `createChildNode(parentId: string, data: Partial<Node>): Promise<Node>` → POST `/api/nodes/:parentId/children` _(listId inherited from parent)_
  - `updateNode(id: string, data: Partial<Node>): Promise<Node>` → PATCH `/api/nodes/:id`
  - `moveNode(id: string, parentId: string | null, position: number): Promise<Node>` → PATCH `/api/nodes/:id/move` — **use this for indent/outdent/reorder, NOT updateNode**
  - `deleteNode(id: string): Promise<void>` → DELETE `/api/nodes/:id` _(cascades to all children)_

  **Tags**
  - `getTags(listId?: string): Promise<Tag[]>` → GET `/api/tags?listId=...`
  - `createTag(name: string, color?: string, listId?: string): Promise<Tag>` → POST `/api/tags`
  - `updateTag(id: string, data: { name?: string; color?: string }): Promise<Tag>` → PATCH `/api/tags/:id`
  - `deleteTag(id: string): Promise<void>` → DELETE `/api/tags/:id`
  - `attachTag(nodeId: string, tagId: string): Promise<void>` → POST `/api/nodes/:id/tags/:tagId`
  - `detachTag(nodeId: string, tagId: string): Promise<void>` → DELETE `/api/nodes/:id/tags/:tagId`

  **Daily**
  - `getDailyToday(): Promise<Node[]>` → GET `/api/daily/today`
  - `getDailyOverdue(): Promise<Node[]>` → GET `/api/daily/overdue`
  - `getDailyScore(date: string): Promise<DailyScore>` → GET `/api/daily/:date` (format: `YYYY-MM-DD`)

  **Scores**
  - `getScores(limit?: number, listId?: string): Promise<DailyScore[]>` → GET `/api/scores`
  - `getStreak(): Promise<{ streak: number }>` → GET `/api/scores/streak`

**Files**: `src/api/client.ts`

**Acceptance**: All functions defined, typed correctly. No calls to `updateNode()` for positional moves — use `moveNode()` instead.

### Task 2.5 — src/commands/list.ts

- [ ] Create `src/commands/list.ts`:
  - Fetch folders via `getFolders()`
  - For each folder, fetch lists via `getLists(folderId)`
  - For each list, fetch top-level nodes via `getNodes(listId)` (optional `-d` depth flag)
  - Print in tree format with chalk colors

**Files**: `src/commands/list.ts`

**Acceptance**: `npm run dev -- list` prints folders/lists/nodes.

### Task 2.6 — src/commands/add.ts

- [ ] Create `src/commands/add.ts`:
  - Syntax: `add "Task title" [--list <listId>] [--parent <number>]`
  - If **no `--parent`**: call `createRootNode(listId, { title })` → POST `/api/lists/:listId/nodes`
  - If **`--parent` given**: resolve number → nodeId via `flattenTree(getNodes()) + assignNumbers()`, then call `createChildNode(parentId, { title })` → POST `/api/nodes/:parentId/children`
  - Print "Added: <title>"

**Files**: `src/commands/add.ts`

**Acceptance**: `npm run dev -- add "Test task" --list <id>` creates node.

### Task 2.7 — src/commands/done.ts

- [ ] Create `src/commands/done.ts`:
  - Syntax: `done <number>`
  - Resolve number to node ID via cached tree (fetch nodes, assign numbers, lookup)
  - Call `updateNode(nodeId, { status: 'DONE' })`
  - Print "Marked as done: <title>"

**Files**: `src/commands/done.ts`

**Acceptance**: `npm run dev -- done 1.2` marks node as done.

### Task 2.8 — src/index.ts (commander wiring)

- [ ] Update `src/index.ts`:
  - Use `commander` to parse args
  - Register commands: `login`, `logout`, `config`, `list`, `add`, `done`
  - If no args: launch TUI (placeholder for now: print "TUI coming soon")
  - Support global flags: `--api-url`, `--verbose`

**Files**: `src/index.ts`

**Acceptance**: `npm run dev -- --help` shows all commands.

### Task 2.9 — Integration tests for commands

- [ ] Create `src/commands/__tests__/login.test.ts`:
  - Mock axios adapter
  - Test successful login saves token
  - Test failed login shows error
- [ ] Repeat for `logout`, `config`, `list`, `add`, `done`

**Files**: `src/commands/__tests__/*.test.ts`

**Acceptance**: All command tests pass.

---

## Phase 3 — TUI Shell + Screens

**Goal**: Build the Ink TUI with screen navigation, hooks, and basic components.

### Task 3.0 — src/tui/screens/WelcomeScreen.tsx

- [x] Create `src/tui/screens/WelcomeScreen.tsx`:
  - Show ASCII art logo of `StrataNodex` using chalk (box-drawn characters or figlet-style)
  - Below ASCII art, show a short welcome message: `"Your keyboard-driven task manager"`
  - Show version number from `package.json`
  - After 1.5s (or on any keypress), transition to next screen:
    - If logged in → push `HomeScreen`
    - If not logged in → push `LoginScreen`
  - This is always the **first screen** rendered by `App.tsx`

> **Guest mode (for testing)**: If `STRATANODEX_GUEST=true` env var is set, skip auth check and push `HomeScreen` directly with mock data. Comment this block clearly with `// GUEST MODE — remove before production`.

**Files**: `src/tui/screens/WelcomeScreen.tsx`

**Acceptance**: `npm run dev` shows ASCII art → transitions to HomeScreen (guest) or LoginScreen.

### Task 3.1 — src/tui/App.tsx

> **UI Reference**: Re-attach the layout reference image here when implementing. The image shows the exact 3-zone shell: fixed header top, scrollable output middle, fixed input bar bottom.

- [x] Create `src/tui/App.tsx` as the **persistent 3-zone shell** — this is NOT a screen, it is the frame all screens render inside:

  **Zone 1 — Header (fixed top)**
  - Outer `Box` with `borderStyle="round"` wrapping the entire app
  - Large bold title: `StrataNodex - CLI`
  - Version pulled from `package.json`
  - Greeting: `Welcome Back, <user.name>` (fallback to `Guest`)
  - `flexShrink={0}` — never shrinks

  **Zone 2 — Output Section (scrollable middle)**
  - Inner `Box` with `borderStyle="single"` and title `Output Section`
  - `flexGrow={1}` — fills all remaining vertical space
  - Wrap content in `<ScrollArea height={dynamicHeight}>` from `@inkjs/ui`
  - `dynamicHeight = process.stdout.rows - HEADER_ROWS - FOOTER_ROWS`
  - Renders the current screen component here (HomeScreen, ListsScreen, TreeScreen, etc.)
  - Listen to `process.stdout` `resize` event to recalculate height dynamically

  **Zone 3 — Input Bar (fixed bottom)**
  - `Box` with `borderStyle="single"`, `flexShrink={0}`
  - `<TextInput>` from `ink-text-input` for slash-command entry
  - Placeholder text changes per screen: e.g. `/search  /add  /delete  /done <n>  /back`
  - `Enter` dispatches command string to the active screen's command handler
  - `Esc` clears input without dispatching

  **General**
  - Manage screen stack (array of screen names): `pushScreen(name)`, `popScreen()`
  - Global error boundary: catch render errors, show friendly message in output zone
  - Respect `NO_COLOR` env var: if set, omit chalk colors and use plain borders

**Files**: `src/tui/App.tsx`

**Acceptance**: `npm run dev` opens TUI showing the 3-zone layout — fixed header with title+version+greeting, scrollable output section in the middle with its own border, fixed command input bar at the bottom.

### Task 3.2 — src/tui/hooks/useAuth.ts

- [x] Create `src/tui/hooks/useAuth.ts`:
  - Check if token exists via `getToken()`
  - If no token, return `isLoggedIn: false`
  - Export `isLoggedIn: boolean`, `user: string | null`
  - **Guest mode**: if `STRATANODEX_GUEST=true`, always return `isLoggedIn: true` with `user: 'guest'`
    - Comment block: `// GUEST MODE — for local testing only, remove before production`

**Files**: `src/tui/hooks/useAuth.ts`

**Acceptance**: Returns `isLoggedIn: true` in guest mode, `false` with no token in normal mode.

### Task 3.2a — src/tui/screens/LoginScreen.tsx

> **Note**: This screen is referenced in `useAuth.ts` and `WelcomeScreen.tsx` but was previously undefined. Build it here.

- [x] Create `src/tui/screens/LoginScreen.tsx`:
  - Show a message: `"Login required — open the link below in your browser:"`
  - Show the account/login URL: `https://stratanodex.com/login` (or from config)
  - Instruct the user to run `stratanodex login` (command mode) to authenticate
  - While waiting, poll `getToken()` every 2s — if token appears, push `HomeScreen`
  - `q` → quit app

> **Why this design**: The CLI login command (`src/commands/login.ts`) handles the actual credential flow. The TUI `LoginScreen` just informs the user and waits for the token to appear.

**Files**: `src/tui/screens/LoginScreen.tsx`

**Acceptance**: Screen renders, polling detects token and transitions to HomeScreen.

### Task 3.3 — src/tui/hooks/useNavigation.ts

- [x] Create `src/tui/hooks/useNavigation.ts`:
  - Manage screen stack: `pushScreen(name)`, `popScreen()`
  - Export `currentScreen`, `pushScreen`, `popScreen`

**Files**: `src/tui/hooks/useNavigation.ts`

**Acceptance**: Pushing/popping screens updates state.

### Task 3.4 — src/tui/hooks/useKeymap.ts

- [x] Create `src/tui/hooks/useKeymap.ts`:
  - Single keyboard event handler using `useInput` from Ink
  - Support modes: `nav` (navigation) vs `edit` (typing)
  - Register keybindings: `↑`, `↓`, `→`, `←`, `Enter`, `b`, `q`, `Esc`, `e`, `o`, `a`, `d`, `Space`, `Tab`, `Shift+Tab`, `Shift+↑`, `Shift+↓`, `/`, `f`, `:`
  - Dispatch actions based on current screen + mode

**Files**: `src/tui/hooks/useKeymap.ts`

**Acceptance**: Pressing a key triggers correct action.

### Task 3.5 — src/tui/components/ (basic components)

- [x] Create `src/tui/components/Header.tsx`:
  - Show app name + logged-in user
- [x] Create `src/tui/components/Breadcrumb.tsx`:
  - Show navigation path (e.g., "Work › Project A › Fix auth bug")
- [x] Create `src/tui/components/Keybindings.tsx`:
  - Bottom bar showing available keys for current screen
- [x] Create `src/tui/components/StatusBadge.tsx`:
  - Colored badge: `[TODO]`, `[IN PROGRESS]`, `[DONE]`
- [x] Create `src/tui/components/PriorityBadge.tsx`:
  - Colored badge: `[HIGH]`, `[MED]`, `[LOW]`
- [x] Create `src/tui/components/TreeConnector.tsx`:
  - Right-angled connectors: `└─`, `│`
- [x] Create `src/tui/components/NodeRow.tsx`:
  - Single node row with indentation + connectors + status + priority
- [x] Create `src/tui/components/FolderItem.tsx`:
  - Single folder row
- [x] Create `src/tui/components/ListItem.tsx`:
  - Single list row

**Files**: `src/tui/components/*.tsx`

**Acceptance**: Components render correctly in isolation.

### Task 3.6 — src/tui/hooks/useFolders.ts

- [x] Create `src/tui/hooks/useFolders.ts`:
  - Fetch folders via `getFolders()`
  - Manage loading + error state
  - Export `folders`, `loading`, `error`, `refetch`

**Files**: `src/tui/hooks/useFolders.ts`

**Acceptance**: Hook fetches and returns folders.

### Task 3.7 — src/tui/screens/HomeScreen.tsx

- [x] Create `src/tui/screens/HomeScreen.tsx`:
  - Use `useFolders` hook
  - Render list of folders with `FolderItem`
  - Cursor navigation (↑↓)
  - Enter → push `ListsScreen` with selected folder ID
  - `n` → create new folder (prompt)
  - `e` → edit folder name
  - `d` → delete folder (confirm)
  - `/` → search overlay
  - `q` → quit

**Files**: `src/tui/screens/HomeScreen.tsx`

**Acceptance**: Screen renders, navigation works.

### Task 3.8 — src/tui/hooks/useLists.ts

- [x] Create `src/tui/hooks/useLists.ts`:
  - Fetch lists for a folder via `getLists(folderId)`
  - Manage loading + error state
  - Export `lists`, `loading`, `error`, `refetch`

**Files**: `src/tui/hooks/useLists.ts`

**Acceptance**: Hook fetches and returns lists.

### Task 3.9 — src/tui/screens/ListsScreen.tsx

- [x] Create `src/tui/screens/ListsScreen.tsx`:
  - Use `useLists` hook
  - Render list of lists with `ListItem`
  - Cursor navigation (↑↓)
  - Enter → push `TreeScreen` with selected list ID
  - `b` → pop screen (back to HomeScreen)
  - `n` → create new list
  - `e` → edit list name
  - `d` → delete list

**Files**: `src/tui/screens/ListsScreen.tsx`

**Acceptance**: Screen renders, navigation works.

### Task 3.10 — src/tui/hooks/useTree.ts

- [x] Create `src/tui/hooks/useTree.ts`:
  - Fetch nodes via `getNodes(listId)` — **API returns pre-nested tree** (root nodes with `children[]` embedded, no client-side tree building needed)
  - Manage expand/collapse state per node (start with all roots expanded, children collapsed)
  - Assign dynamic display numbers via `assignNumbers(nestedNodes)` from `src/utils/numbering.ts`
  - Export `nodes` (nested), `flatNodes` (DFS-flattened for cursor nav), `expandedIds`, `toggleExpand`, `numberMap`, `loading`, `error`, `refetch`
  - `flatNodes` is re-computed from `nodes` + `expandedIds` on every change (only include nodes whose ancestors are all expanded)

**Files**: `src/tui/hooks/useTree.ts`

**Acceptance**: Hook fetches nodes, manages expand/collapse.

### Task 3.11 — src/tui/screens/TreeScreen.tsx

- [x] Create `src/tui/screens/TreeScreen.tsx`:
  - Use `useTree` hook
  - Render tree with `NodeRow` + `TreeConnector`
  - Cursor navigation (↑↓)
  - `→` expand, `←` collapse
  - `b` → pop screen (back to ListsScreen)
  - Show breadcrumb at top
  - Show keybindings at bottom

**Files**: `src/tui/screens/TreeScreen.tsx`

**Acceptance**: Tree renders, expand/collapse works.

### Task 3.12 — src/tui/screens/DailyScreen.tsx

- [x] Create `src/tui/screens/DailyScreen.tsx`:
  - Call `getDailyToday()` → GET `/api/daily/today` (non-DONE nodes whose date range overlaps today)
  - Call `getDailyOverdue()` → GET `/api/daily/overdue` (non-DONE nodes whose `endAt` < today)
  - **Do NOT filter client-side** — server already filters correctly
  - Group into two sections: "Today" and "Overdue"
  - Render each group with `NodeRow`

**Files**: `src/tui/screens/DailyScreen.tsx`

**Acceptance**: Daily tasks view shows correct nodes.

### Task 3.13 — Component tests for screens

- [x] Create `src/tui/screens/__tests__/HomeScreen.test.tsx`:
  - Use `ink-testing-library`
  - Test initial render (snapshot)
  - Test pressing `↓` moves cursor
- [x] Repeat for `ListsScreen`, `TreeScreen`, `DailyScreen`

**Files**: `src/tui/screens/__tests__/*.test.tsx`

**Acceptance**: All screen tests pass.

### Task 3.14 — Wire TUI into src/index.ts

- [x] Update `src/index.ts`:
  - If no args, render `<App />` via `ink.render()`
  - Pass global flags to App as props

**Files**: `src/index.ts`

**Acceptance**: `npm run dev` opens TUI.

---

## Phase 4 — TUI Editing + Structure Ops

**Goal**: Enable inline editing, adding/deleting nodes, status cycling, indent/outdent, reordering.

### Task 4.1 — Edit mode (inline text input)

- [ ] Update `src/tui/screens/TreeScreen.tsx`:
  - When `e` pressed, switch to edit mode for selected node
  - Show `ink-text-input` inline
  - Enter → save via `updateNode()`, exit edit mode
  - Esc → cancel, exit edit mode

**Files**: `src/tui/screens/TreeScreen.tsx`

**Acceptance**: Pressing `e` allows editing node title.

### Task 4.2 — Add node below/above

- [ ] Update `src/tui/screens/TreeScreen.tsx`:
  - `o` → add node below current (same parent)
  - `a` → add node above current (same parent)
  - Call `createNode()` with correct `parentId` and `order`

**Files**: `src/tui/screens/TreeScreen.tsx`

**Acceptance**: Pressing `o`/`a` adds node in correct position.

### Task 4.3 — Delete node

- [ ] Update `src/tui/screens/TreeScreen.tsx`:
  - `d` → show confirm dialog (use `@inkjs/ui`)
  - If confirmed, call `deleteNode()`
  - Refetch tree

**Files**: `src/tui/screens/TreeScreen.tsx`

**Acceptance**: Pressing `d` deletes node after confirm.

### Task 4.4 — Status cycle (Space key)

- [ ] Update `src/tui/screens/TreeScreen.tsx`:
  - `Space` → cycle status: TODO → IN_PROGRESS → DONE → TODO
  - Optimistic UI update (change local state immediately)
  - Call `updateNode()` in background
  - On error, rollback + show toast

**Files**: `src/tui/screens/TreeScreen.tsx`

**Acceptance**: Pressing `Space` cycles status with optimistic UI.

### Task 4.5 — Indent/outdent (Tab/Shift+Tab)

- [ ] Update `src/tui/screens/TreeScreen.tsx`:
  - `Tab` → indent node (make child of previous sibling)
  - `Shift+Tab` → outdent node (promote to parent level)
  - Use `indentNode()` / `outdentNode()` from `src/utils/tree.ts` to compute new `parentId` + `position`
  - Call `moveNode(id, newParentId, newPosition)` → PATCH `/api/nodes/:id/move` — **NOT `updateNode()`**

**Files**: `src/tui/screens/TreeScreen.tsx`

**Acceptance**: Tab/Shift+Tab changes node hierarchy.

### Task 4.6 — Reorder siblings (Shift+↑/↓)

- [ ] Update `src/tui/screens/TreeScreen.tsx`:
  - `Shift+↑` → move node up among siblings
  - `Shift+↓` → move node down among siblings
  - Use `reorderSiblings()` from `src/utils/tree.ts` to compute new `position`
  - Call `moveNode(id, sameParentId, newPosition)` → PATCH `/api/nodes/:id/move` — **NOT `updateNode()`**

**Files**: `src/tui/screens/TreeScreen.tsx`

**Acceptance**: Shift+↑/↓ reorders siblings.

### Task 4.7 — Optimistic updates + rollback

- [ ] Create `src/tui/hooks/useOptimistic.ts`:
  - Generic hook for optimistic updates
  - On error, rollback + show toast (use `@inkjs/ui`)

**Files**: `src/tui/hooks/useOptimistic.ts`

**Acceptance**: Failed API calls rollback UI changes.

---

## Phase 5 — Polish

**Goal**: Add focus mode, command palette, search, error boundaries, accessibility.

### Task 5.1 — Focus mode

- [ ] Create `src/tui/components/FocusMode.tsx`:
  - Overlay that shows only current node + its children
  - Triggered by `f` key in TreeScreen
  - Esc → exit focus mode

**Files**: `src/tui/components/FocusMode.tsx`

**Acceptance**: Pressing `f` enters focus mode.

### Task 5.2 — Command palette

- [ ] Create `src/tui/components/CommandPalette.tsx`:
  - Triggered by `:` key in TreeScreen
  - Text input for commands
  - Supported commands: `move <number> under <number>`, `delete node`, `go <number>`, `set priority <high|med|low>`, `set status <todo|in_progress|done>`
  - Parse and execute commands

**Files**: `src/tui/components/CommandPalette.tsx`

**Acceptance**: Typing `:move 1.2 under 3` moves node.

### Task 5.3 — Search overlay

- [ ] Create `src/tui/components/SearchOverlay.tsx`:
  - Triggered by `/` key in TreeScreen
  - Fuzzy search over current list's nodes (client-side)
  - Show matching nodes, Enter → jump to selected node

**Files**: `src/tui/components/SearchOverlay.tsx`

**Acceptance**: Typing `/test` shows matching nodes.

### Task 5.4 — Error boundary + empty/loading states

- [ ] Update `src/tui/App.tsx`:
  - Wrap screens in error boundary
  - Show friendly error message on crash
- [ ] Add loading spinners to all screens (use `@inkjs/ui`)
- [ ] Add empty states (e.g., "No folders yet. Press 'n' to create one.")

**Files**: `src/tui/App.tsx`, `src/tui/screens/*.tsx`

**Acceptance**: Errors don't crash app, loading/empty states shown.

### Task 5.5 — Daily Tasks view enhancements

- [ ] Update `src/tui/screens/DailyScreen.tsx`:
  - Group nodes: "Today" vs "Overdue" (already from separate API calls)
  - Show completion % for today: `doneNodes / totalNodes * 100` from `getDailyScore(today)`
  - Show streak via `getStreak()` → GET `/api/scores/streak` — **confirmed live endpoint**
  - Display format: `Streak: 5 days • Today: 7/10 (70%)`

**Files**: `src/tui/screens/DailyScreen.tsx`

**Acceptance**: Daily view shows grouped tasks + stats.

### Task 5.6 — Accessibility (NO_COLOR, narrow terminal)

- [ ] Respect `NO_COLOR` env var (disable chalk colors)
- [ ] Detect terminal width < 80 cols → use compact layout
- [ ] Test on narrow terminal (e.g., 60 cols)

**Files**: `src/tui/components/*.tsx`

**Acceptance**: Works in narrow terminal, respects NO_COLOR.

---

## Phase 6 — Publish

**Goal**: Prepare for npm publish, test global install, write README.

### Task 6.1 — Build script + shebang

- [ ] Ensure `dist/index.js` has shebang: `#!/usr/bin/env node`
- [ ] Test `npm run build` → outputs ESM to `dist/`
- [ ] Verify `node dist/index.js` runs

**Files**: `src/index.ts`, `package.json`

**Acceptance**: `npm run build` succeeds, `node dist/index.js` works.

### Task 6.2 — package.json files field + prepublishOnly

- [ ] Add `"files": ["dist"]` to package.json
- [ ] Add `"prepublishOnly": "npm run lint && npm run test && npm run build"` script

**Files**: `package.json`

**Acceptance**: `npm pack` only includes `dist/`.

### Task 6.3 — Smoke test global install

- [ ] Run `npm pack` → creates tarball
- [ ] Install globally: `npm i -g ./stratanodex-0.1.0.tgz`
- [ ] Run `stratanodex` → should work
- [ ] Uninstall: `npm uninstall -g stratanodex`

**Acceptance**: Global install works on fresh machine.

### Task 6.4 — README.md

- [ ] Create `README.md`:
  - Project description
  - Installation: `npm i -g stratanodex`
  - Quickstart: `stratanodex login`, `stratanodex`, etc.
  - Screenshots (ASCII art or actual screenshots)
  - Keyboard shortcuts table
  - Link to PLAN.md for architecture

**Files**: `README.md`

**Acceptance**: README is clear and helpful.

### Task 6.5 — npm publish

- [ ] Run `npm publish` (requires npm account + permissions)
- [ ] Verify package on npmjs.com

**Acceptance**: Package published, installable via `npm i -g stratanodex`.

---

## Appendix A — API Contract Reference

> **Base URL**: `https://stratanodex-backend.onrender.com`
> **Auth header**: `Authorization: Bearer <token>` (JWT, expires in 7 days)
> **Error format**: `{ "error": "Human-readable message" }` — always extract `.error`, never `.message`
> **Rate limits**: 100 req/15min (general) · 10 req/15min (auth) · 3 req/10min (OTP)

### Health

| Method | Endpoint  | Auth | Request | Response                      |
| ------ | --------- | ---- | ------- | ----------------------------- |
| GET    | `/health` | 🔓   | —       | `{ status: "ok", timestamp }` |

### Auth

| Method | Endpoint                       | Auth | Request                                  | Response                                                   |
| ------ | ------------------------------ | ---- | ---------------------------------------- | ---------------------------------------------------------- |
| POST   | `/api/auth/register`           | 🔓   | `{ email, password, name? }`             | `{ user, message: "Check your email for OTP" }`            |
| POST   | `/api/auth/login`              | 🔓   | `{ email, password }`                    | `{ user, token }` OR `{ requiresTwoFactor: true, userId }` |
| POST   | `/api/auth/2fa/verify`         | 🔓   | `{ userId, code }`                       | `{ user, token }`                                          |
| POST   | `/api/auth/phone-login`        | 🔓   | `{ phone }`                              | `{ message }`                                              |
| POST   | `/api/auth/phone-login/verify` | 🔓   | `{ phone, code }`                        | `{ user, token }`                                          |
| POST   | `/api/auth/forgot-password`    | 🔓   | `{ email }`                              | `{ message }`                                              |
| POST   | `/api/auth/reset-password`     | 🔓   | `{ email, code, newPassword }`           | `{ message }`                                              |
| GET    | `/api/auth/me`                 | 🔐   | —                                        | `User` object                                              |
| POST   | `/api/auth/verify-email`       | 🔐   | `{ code }`                               | `{ message }`                                              |
| POST   | `/api/auth/verify-phone`       | 🔐   | `{ code }`                               | `{ message }`                                              |
| POST   | `/api/auth/resend-otp`         | 🔐   | `{ type: OtpType, channel: OtpChannel }` | `{ message }`                                              |
| POST   | `/api/auth/2fa/enable`         | 🔐   | `{ method: "EMAIL"\|"SMS"\|"TOTP" }`     | `User` object                                              |
| POST   | `/api/auth/2fa/disable`        | 🔐   | —                                        | `User` object                                              |

### Folders (all 🔐)

| Method | Endpoint           | Request                | Response   | Notes                         |
| ------ | ------------------ | ---------------------- | ---------- | ----------------------------- |
| GET    | `/api/folders`     | —                      | `Folder[]` |                               |
| POST   | `/api/folders`     | `{ name, position? }`  | `Folder`   |                               |
| PATCH  | `/api/folders/:id` | `{ name?, position? }` | `Folder`   |                               |
| DELETE | `/api/folders/:id` | —                      | `204`      | Cascades to all lists + nodes |

### Lists (all 🔐)

| Method | Endpoint                       | Request                         | Response | Notes                 |
| ------ | ------------------------------ | ------------------------------- | -------- | --------------------- |
| GET    | `/api/folders/:folderId/lists` | —                               | `List[]` |                       |
| POST   | `/api/lists`                   | `{ name, folderId, position? }` | `List`   |                       |
| PATCH  | `/api/lists/:id`               | `{ name?, position? }`          | `List`   |                       |
| DELETE | `/api/lists/:id`               | —                               | `204`    | Cascades to all nodes |

### Nodes (all 🔐)

| Method | Endpoint                        | Request                                                                                                     | Response | Notes                                                           |
| ------ | ------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------- |
| GET    | `/api/lists/:listId/nodes`      | —                                                                                                           | `Node[]` | **Returns nested tree** — root nodes with `children[]` embedded |
| GET    | `/api/nodes/:id`                | —                                                                                                           | `Node`   | Includes `children` + `tags`                                    |
| POST   | `/api/lists/:listId/nodes`      | `{ title, listId (required), parentId?, status?, priority?, notes?, startAt?, endAt?, position?, tagIds? }` | `Node`   | Create **root** node — `listId` required in body too            |
| POST   | `/api/nodes/:parentId/children` | `{ title, status?, priority?, notes?, startAt?, endAt?, position?, tagIds? }`                               | `Node`   | Create **child** node — `listId` inherited from parent          |
| PATCH  | `/api/nodes/:id`                | `{ title?, status?, priority?, notes?, startAt?, endAt?, parentId?, position?, tagIds? }`                   | `Node`   | General update — **do not use for moving**                      |
| PATCH  | `/api/nodes/:id/move`           | `{ parentId: string\|null, position: number }`                                                              | `Node`   | **Move/reorder** — use for indent, outdent, Shift+↑/↓           |
| DELETE | `/api/nodes/:id`                | —                                                                                                           | `204`    | Cascades to all children                                        |

### Tags (all 🔐)

| Method | Endpoint                     | Request                     | Response            | Notes                        |
| ------ | ---------------------------- | --------------------------- | ------------------- | ---------------------------- |
| GET    | `/api/tags`                  | `?listId=` (optional)       | `Tag[]`             | Returns global + list-scoped |
| POST   | `/api/tags`                  | `{ name, color?, listId? }` | `Tag`               |                              |
| PATCH  | `/api/tags/:id`              | `{ name?, color? }`         | `Tag`               |                              |
| DELETE | `/api/tags/:id`              | —                           | `204`               | Auto-detaches from all nodes |
| POST   | `/api/nodes/:id/tags/:tagId` | —                           | `{ nodeId, tagId }` | Attach tag to node           |
| DELETE | `/api/nodes/:id/tags/:tagId` | —                           | `204`               | Detach tag from node         |

### Daily (all 🔐)

| Method | Endpoint             | Request                           | Response             | Notes                                      |
| ------ | -------------------- | --------------------------------- | -------------------- | ------------------------------------------ |
| GET    | `/api/daily/today`   | —                                 | `Node[]`             | Non-DONE nodes overlapping today           |
| GET    | `/api/daily/overdue` | —                                 | `Node[]`             | Non-DONE nodes with `endAt` before today   |
| GET    | `/api/daily/:date`   | —                                 | `DailyScore`         | Date format: `YYYY-MM-DD`; 404 if no score |
| POST   | `/api/daily/compute` | `{ date: "YYYY-MM-DD", listId? }` | `{ message, jobId }` | Async — queues score computation           |

### Scores (all 🔐)

| Method | Endpoint             | Request                    | Response             | Notes                            |
| ------ | -------------------- | -------------------------- | -------------------- | -------------------------------- |
| GET    | `/api/scores`        | `?limit=30&listId=` (opt.) | `DailyScore[]`       | Ordered by date desc             |
| GET    | `/api/scores/streak` | —                          | `{ streak: number }` | Consecutive days with points > 0 |

> **CLI uses**: `login`, `2fa/verify`, `getMe`, `folders CRUD`, `lists CRUD`, `nodes CRUD + move`, `daily/today`, `daily/overdue`, `scores/streak`. Tags, OTP, 2FA enable/disable, phone-login, password-reset are not needed for CLI v1 but types should be defined.

---

## Appendix B — Keymap Matrix

| Key         | Screen     | Mode | Action             |
| ----------- | ---------- | ---- | ------------------ |
| `↑`         | All        | nav  | Move cursor up     |
| `↓`         | All        | nav  | Move cursor down   |
| `→`         | Tree       | nav  | Expand node        |
| `←`         | Tree       | nav  | Collapse node      |
| `Enter`     | Home       | nav  | Open folder        |
| `Enter`     | Lists      | nav  | Open list          |
| `Enter`     | Tree       | edit | Save + create next |
| `b`         | Lists/Tree | nav  | Go back            |
| `q`         | Home       | nav  | Quit               |
| `Esc`       | All        | edit | Exit edit mode     |
| `e`         | All        | nav  | Edit selected item |
| `o`         | Tree       | nav  | Add node below     |
| `a`         | Tree       | nav  | Add node above     |
| `d`         | All        | nav  | Delete (confirm)   |
| `Space`     | Tree       | nav  | Cycle status       |
| `Tab`       | Tree       | nav  | Indent node        |
| `Shift+Tab` | Tree       | nav  | Outdent node       |
| `Shift+↑`   | Tree       | nav  | Move node up       |
| `Shift+↓`   | Tree       | nav  | Move node down     |
| `/`         | All        | nav  | Search overlay     |
| `f`         | Tree       | nav  | Focus mode         |
| `:`         | Tree       | nav  | Command palette    |

---

## Appendix C — Pitfalls / "Do Not Hallucinate" Notes

### ESM Gotchas

- No `require()` — use `import`
- No `__dirname` — use `import.meta.url` + `fileURLToPath` if needed
- All imports must have file extensions in source (`.js` for compiled `.ts` files) — or use `moduleResolution: NodeNext` which handles this

### React + Ink

- Do not import from `react-dom` — Ink uses React but renders to terminal
- Use `jsx: react-jsx` in tsconfig (not `react`)

### Tree Numbers

- `1.2.1` is computed at render time from tree structure
- Never stored in DB, never sent to API
- Reordering nodes changes their numbers

### Canvas X/Y

- Web-only fields
- CLI must never read or write `canvasX` / `canvasY`

### CI Must Stay Green

- Every PR must pass: `lint`, `typecheck`, `test`, `build`
- Pre-commit hook enforces this locally
- GitHub Actions enforces on push

---

## End of Execution Plan

When all tasks are `[x]`, the CLI is complete and ready to publish. Good luck! 🚀
