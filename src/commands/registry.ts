// Command Registry — single source of truth for all CLI commands.
// Drives both autocomplete suggestions and executor dispatch.

export type ArgType = 'text' | 'index-or-title' | 'date' | 'time' | 'status' | 'priority' | 'number'

export type Screen = 'folders' | 'lists' | 'nodes' | 'global'

export interface CommandArg {
  name: string
  type: ArgType
  placeholder: string
  optional?: boolean
}

export interface CommandDefinition {
  command: string
  args: CommandArg[]
  screens: Screen[]
  description: string
}

export const COMMAND_REGISTRY: CommandDefinition[] = [
  // ─── GLOBAL ───────────────────────────────────────────────────────────────
  {
    command: '/back',
    args: [],
    screens: ['global'],
    description: 'Go back to previous screen',
  },
  {
    command: '/home',
    args: [],
    screens: ['global'],
    description: 'Jump to Folders screen',
  },
  {
    command: '/folders',
    args: [],
    screens: ['global'],
    description: 'Navigate to Folders screen',
  },
  {
    command: '/dashboard',
    args: [],
    screens: ['global'],
    description: 'Navigate to dashboard (score + streaks + weekly graph)',
  },
  {
    command: '/help',
    args: [],
    screens: ['global'],
    description: 'Show available commands for current screen',
  },
  {
    command: '/logout',
    args: [],
    screens: ['global'],
    description: 'Log out of current CLI session',
  },
  {
    command: '/whoami',
    args: [],
    screens: ['global'],
    description: 'Show logged-in user + current streak info',
  },
  {
    command: '/tags',
    args: [],
    screens: ['global'],
    description: 'List all tags used across all lists',
  },

  // ─── FOLDERS SCREEN ────────────────────────────────────────────────────────
  {
    command: '/new folder',
    args: [{ name: 'folder-name', type: 'text', placeholder: 'folder name' }],
    screens: ['folders'],
    description: 'Create a new folder',
  },
  {
    command: '/edit folder',
    args: [
      { name: 'folder-name', type: 'text', placeholder: 'existing folder name' },
      { name: 'new-folder-name', type: 'text', placeholder: 'new name' },
    ],
    screens: ['folders'],
    description: 'Rename a folder',
  },
  {
    command: '/delete folder',
    args: [{ name: 'folder-name', type: 'text', placeholder: 'folder name' }],
    screens: ['folders'],
    description: 'Delete a folder',
  },

  // ─── LISTS SCREEN ──────────────────────────────────────────────────────────
  {
    command: '/new list',
    args: [{ name: 'list-name', type: 'text', placeholder: 'list name' }],
    screens: ['lists'],
    description: 'Create a new list',
  },
  {
    command: '/edit list',
    args: [
      { name: 'list-name', type: 'text', placeholder: 'existing list name' },
      { name: 'new-list-name', type: 'text', placeholder: 'new name' },
    ],
    screens: ['lists'],
    description: 'Rename a list',
  },
  {
    command: '/delete list',
    args: [{ name: 'list-name', type: 'text', placeholder: 'list name' }],
    screens: ['lists'],
    description: 'Delete a list',
  },

  // ─── NODES SCREEN ─────────────────────────────────────────────────────────
  {
    command: '/add node',
    args: [{ name: 'node-title', type: 'text', placeholder: 'node title' }],
    screens: ['nodes'],
    description: 'Create a new node',
  },
  {
    command: '/done',
    args: [{ name: 'index-or-title', type: 'index-or-title', placeholder: '1 or "task title"' }],
    screens: ['nodes'],
    description: 'Shorthand: set node status to DONE',
  },
  {
    command: '/delete node',
    args: [{ name: 'index-or-title', type: 'index-or-title', placeholder: '1 or "task title"' }],
    screens: ['nodes'],
    description: 'Delete a node',
  },
  {
    command: '/move node',
    args: [
      { name: 'index-or-title', type: 'index-or-title', placeholder: '1 or "task title"' },
      { name: 'list-name', type: 'text', placeholder: 'destination list name' },
    ],
    screens: ['nodes'],
    description: 'Move node to another list',
  },

  // /edit node ... <property>
  {
    command: '/edit node ... title',
    args: [
      { name: 'index-or-title', type: 'index-or-title', placeholder: '1 or "task title"' },
      { name: 'new-title', type: 'text', placeholder: 'new title' },
    ],
    screens: ['nodes'],
    description: 'Edit node title',
  },
  {
    command: '/edit node ... position',
    args: [
      { name: 'index-or-title', type: 'index-or-title', placeholder: '1 or "task title"' },
      { name: 'new-index', type: 'number', placeholder: '2' },
    ],
    screens: ['nodes'],
    description: 'Reorder node',
  },
  {
    command: '/edit node ... status',
    args: [
      { name: 'index-or-title', type: 'index-or-title', placeholder: '1 or "task title"' },
      { name: 'status', type: 'status', placeholder: 'NOT-DONE | IN-PROGRESS | DONE' },
    ],
    screens: ['nodes'],
    description: 'Change node status',
  },
  {
    command: '/edit node ... priority',
    args: [
      { name: 'index-or-title', type: 'index-or-title', placeholder: '1 or "task title"' },
      { name: 'priority', type: 'priority', placeholder: 'LOW | MEDIUM | HIGH' },
    ],
    screens: ['nodes'],
    description: 'Change node priority',
  },
  {
    command: '/edit node ... start-date',
    args: [
      { name: 'index-or-title', type: 'index-or-title', placeholder: '1 or "task title"' },
      { name: 'start-date', type: 'date', placeholder: 'DD-MM-YYYY' },
    ],
    screens: ['nodes'],
    description: 'Edit start date',
  },
  {
    command: '/edit node ... start-time',
    args: [
      { name: 'index-or-title', type: 'index-or-title', placeholder: '1 or "task title"' },
      { name: 'start-time', type: 'time', placeholder: 'HH:MM AM/PM' },
    ],
    screens: ['nodes'],
    description: 'Edit start time',
  },
  {
    command: '/edit node ... end-date',
    args: [
      { name: 'index-or-title', type: 'index-or-title', placeholder: '1 or "task title"' },
      { name: 'end-date', type: 'date', placeholder: 'DD-MM-YYYY' },
    ],
    screens: ['nodes'],
    description: 'Edit end date',
  },
  {
    command: '/edit node ... end-time',
    args: [
      { name: 'index-or-title', type: 'index-or-title', placeholder: '1 or "task title"' },
      { name: 'end-time', type: 'time', placeholder: 'HH:MM AM/PM' },
    ],
    screens: ['nodes'],
    description: 'Edit end time',
  },
  {
    command: '/edit node ... tag',
    args: [
      { name: 'index-or-title', type: 'index-or-title', placeholder: '1 or "task title"' },
      { name: 'tag-name', type: 'text', placeholder: 'tag name' },
    ],
    screens: ['nodes'],
    description: 'Edit node tag',
  },
  {
    command: '/edit node ... note',
    args: [
      { name: 'index-or-title', type: 'index-or-title', placeholder: '1 or "task title"' },
      { name: 'new-note', type: 'text', placeholder: 'note text' },
    ],
    screens: ['nodes'],
    description: 'Edit note',
  },

  // /add node ... <property>
  {
    command: '/add node ... start-date',
    args: [
      { name: 'index-or-title', type: 'index-or-title', placeholder: '1 or "task title"' },
      { name: 'start-date', type: 'date', placeholder: 'DD-MM-YYYY' },
    ],
    screens: ['nodes'],
    description: 'Add start date',
  },
  {
    command: '/add node ... start-time',
    args: [
      { name: 'index-or-title', type: 'index-or-title', placeholder: '1 or "task title"' },
      { name: 'start-time', type: 'time', placeholder: 'HH:MM AM/PM' },
    ],
    screens: ['nodes'],
    description: 'Add start time (default 12:00 AM)',
  },
  {
    command: '/add node ... end-date',
    args: [
      { name: 'index-or-title', type: 'index-or-title', placeholder: '1 or "task title"' },
      { name: 'end-date', type: 'date', placeholder: 'DD-MM-YYYY' },
    ],
    screens: ['nodes'],
    description: 'Add end date',
  },
  {
    command: '/add node ... end-time',
    args: [
      { name: 'index-or-title', type: 'index-or-title', placeholder: '1 or "task title"' },
      { name: 'end-time', type: 'time', placeholder: 'HH:MM AM/PM' },
    ],
    screens: ['nodes'],
    description: 'Add end time (default 12:00 AM)',
  },
  {
    command: '/add node ... tag',
    args: [
      { name: 'index-or-title', type: 'index-or-title', placeholder: '1 or "task title"' },
      { name: 'tag-name', type: 'text', placeholder: 'tag name' },
    ],
    screens: ['nodes'],
    description: 'Add tag to node',
  },
  {
    command: '/add node ... note',
    args: [
      { name: 'index-or-title', type: 'index-or-title', placeholder: '1 or "task title"' },
      { name: 'note-text', type: 'text', placeholder: 'note text' },
    ],
    screens: ['nodes'],
    description: 'Add note',
  },
  {
    command: '/add node ... status',
    args: [
      { name: 'index-or-title', type: 'index-or-title', placeholder: '1 or "task title"' },
      { name: 'status', type: 'status', placeholder: 'NOT-DONE | IN-PROGRESS | DONE' },
    ],
    screens: ['nodes'],
    description: 'Set status',
  },
  {
    command: '/add node ... priority',
    args: [
      { name: 'index-or-title', type: 'index-or-title', placeholder: '1 or "task title"' },
      { name: 'priority', type: 'priority', placeholder: 'LOW | MEDIUM | HIGH' },
    ],
    screens: ['nodes'],
    description: 'Set priority',
  },

  // /delete node ... <property>
  {
    command: '/delete node ... start-date',
    args: [{ name: 'index-or-title', type: 'index-or-title', placeholder: '1 or "task title"' }],
    screens: ['nodes'],
    description: 'Remove start date',
  },
  {
    command: '/delete node ... start-time',
    args: [{ name: 'index-or-title', type: 'index-or-title', placeholder: '1 or "task title"' }],
    screens: ['nodes'],
    description: 'Remove start time',
  },
  {
    command: '/delete node ... end-date',
    args: [{ name: 'index-or-title', type: 'index-or-title', placeholder: '1 or "task title"' }],
    screens: ['nodes'],
    description: 'Remove end date',
  },
  {
    command: '/delete node ... end-time',
    args: [{ name: 'index-or-title', type: 'index-or-title', placeholder: '1 or "task title"' }],
    screens: ['nodes'],
    description: 'Remove end time',
  },
  {
    command: '/delete node ... tag',
    args: [
      { name: 'index-or-title', type: 'index-or-title', placeholder: '1 or "task title"' },
      { name: 'tag-name', type: 'text', placeholder: 'tag name' },
    ],
    screens: ['nodes'],
    description: 'Remove tag from node',
  },
  {
    command: '/delete node ... note',
    args: [{ name: 'index-or-title', type: 'index-or-title', placeholder: '1 or "task title"' }],
    screens: ['nodes'],
    description: 'Remove note',
  },
  {
    command: '/delete node ... status',
    args: [{ name: 'index-or-title', type: 'index-or-title', placeholder: '1 or "task title"' }],
    screens: ['nodes'],
    description: 'Remove status',
  },
  {
    command: '/delete node ... priority',
    args: [{ name: 'index-or-title', type: 'index-or-title', placeholder: '1 or "task title"' }],
    screens: ['nodes'],
    description: 'Remove priority',
  },
]

/** Returns commands valid for a given screen (global always included). */
export function getCommandsForScreen(screen: Screen): CommandDefinition[] {
  return COMMAND_REGISTRY.filter((c) => c.screens.includes('global') || c.screens.includes(screen))
}
