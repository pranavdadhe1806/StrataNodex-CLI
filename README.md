# StrataNodex CLI

> A terminal-based tree editor + productivity system — keyboard-driven, infinitely nestable, fast, and developer-native.

## 🚀 Quick Start

```bash
# Install globally
npm install -g stratanodex

# Login
stratanodex login

# Launch TUI
stratanodex

# Or use command mode
stratanodex add "My first task"
stratanodex list
stratanodex done 1
```

## 📦 Installation

### From npm (once published)

```bash
npm install -g stratanodex
```

### From source

```bash
git clone <repo-url>
cd StrataNodex-CLI
npm install
npm run build
npm link
```

## 🎯 Features

- **Tree-based task management** — infinite nesting, no limits
- **Two modes**: Interactive TUI + quick command mode
- **Keyboard-driven** — no mouse needed
- **Cross-platform** — works on macOS, Linux, Windows
- **Syncs with backend** — same data across CLI, web, mobile

## 🔧 Development

```bash
# Install dependencies
npm install

# Run in dev mode
npm run dev

# Run tests
npm run test

# Lint & format
npm run lint
npm run format

# Type check
npm run typecheck

# Build
npm run build
```

## 📖 Documentation

See [PLAN.md](./PLAN.md) for full architecture and design decisions.

See [EXECUTION_PLAN.md](./EXECUTION_PLAN.md) for phase-by-phase development plan.

## 📝 License

MIT
