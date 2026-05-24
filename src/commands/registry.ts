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
    command: '/add node:',
    args: [{ name: 'node-title', type: 'text', placeholder: 'node title' }],
    screens: ['nodes'],
    description: 'Create a new root node  →  /add node: My Task',
  },
  {
    command: '/add sub-node',
    args: [{ name: 'node-title', type: 'text', placeholder: '[parent-index] sub-node title' }],
    screens: ['nodes'],
    description: 'Add sub-node under selected node (or specify parent index)',
  },
  {
    command: '/done',
    args: [{ name: 'index-or-title', type: 'index-or-title', placeholder: '1  or  task title' }],
    screens: ['nodes'],
    description: 'Shorthand: set node status to DONE',
  },
  {
    command: '/delete node:',
    args: [{ name: 'index-or-title', type: 'index-or-title', placeholder: '1  or  task title' }],
    screens: ['nodes'],
    description: 'Delete a node  →  /delete node: 1',
  },
  {
    command: '/move node',
    args: [
      { name: 'index-or-title', type: 'index-or-title', placeholder: '1  or  task title' },
      { name: 'list-name', type: 'text', placeholder: 'destination list name' },
    ],
    screens: ['nodes'],
    description: 'Move node to another list',
  },

  // ── /edit node REF PROPERTY: VALUE  (use ... for currently selected node) ──
  {
    command: '/edit node ... title:',
    args: [{ name: 'new-title', type: 'text', placeholder: 'new title' }],
    screens: ['nodes'],
    description: 'Rename node  →  /edit node 1 title: New Name  (or ... for selected)',
  },
  {
    command: '/edit node ... position:',
    args: [{ name: 'new-index', type: 'number', placeholder: '2' }],
    screens: ['nodes'],
    description: 'Reorder node  →  /edit node 1 position: 3',
  },
  {
    command: '/edit node ... status:',
    args: [{ name: 'status', type: 'status', placeholder: 'NOT-DONE | IN-PROGRESS | DONE' }],
    screens: ['nodes'],
    description: 'Change status  →  /edit node 1 status: DONE',
  },
  {
    command: '/edit node ... priority:',
    args: [{ name: 'priority', type: 'priority', placeholder: 'LOW | MEDIUM | HIGH' }],
    screens: ['nodes'],
    description: 'Change priority  →  /edit node 1 priority: HIGH',
  },
  {
    command: '/edit node ... start-date:',
    args: [{ name: 'start-date', type: 'date', placeholder: 'DD-MM-YYYY' }],
    screens: ['nodes'],
    description: 'Edit start date  →  /edit node 1 start-date: 24-05-2026',
  },
  {
    command: '/edit node ... start-time:',
    args: [{ name: 'start-time', type: 'time', placeholder: 'HH:MM AM/PM' }],
    screens: ['nodes'],
    description: 'Edit start time  →  /edit node 1 start-time: 09:00 AM',
  },
  {
    command: '/edit node ... end-date:',
    args: [{ name: 'end-date', type: 'date', placeholder: 'DD-MM-YYYY' }],
    screens: ['nodes'],
    description: 'Edit end date  →  /edit node 1 end-date: 25-05-2026',
  },
  {
    command: '/edit node ... end-time:',
    args: [{ name: 'end-time', type: 'time', placeholder: 'HH:MM AM/PM' }],
    screens: ['nodes'],
    description: 'Edit end time  →  /edit node 1 end-time: 05:00 PM',
  },
  {
    command: '/edit node ... note:',
    args: [{ name: 'new-note', type: 'text', placeholder: 'note text' }],
    screens: ['nodes'],
    description: 'Edit note  →  /edit node 1 note: My note here',
  },

  // ── /add node REF PROPERTY: VALUE ──────────────────────────────────────────
  {
    command: '/add node ... start-date:',
    args: [{ name: 'start-date', type: 'date', placeholder: 'DD-MM-YYYY' }],
    screens: ['nodes'],
    description: 'Add start date  →  /add node 1 start-date: 24-05-2026',
  },
  {
    command: '/add node ... start-time:',
    args: [{ name: 'start-time', type: 'time', placeholder: 'HH:MM AM/PM' }],
    screens: ['nodes'],
    description: 'Add start time  →  /add node 1 start-time: 09:00 AM',
  },
  {
    command: '/add node ... end-date:',
    args: [{ name: 'end-date', type: 'date', placeholder: 'DD-MM-YYYY' }],
    screens: ['nodes'],
    description: 'Add end date  →  /add node 1 end-date: 25-05-2026',
  },
  {
    command: '/add node ... end-time:',
    args: [{ name: 'end-time', type: 'time', placeholder: 'HH:MM AM/PM' }],
    screens: ['nodes'],
    description: 'Add end time  →  /add node 1 end-time: 05:00 PM',
  },
  {
    command: '/add node ... note:',
    args: [{ name: 'note-text', type: 'text', placeholder: 'note text' }],
    screens: ['nodes'],
    description: 'Add note  →  /add node 1 note: My note here',
  },
  {
    command: '/add node ... status:',
    args: [{ name: 'status', type: 'status', placeholder: 'NOT-DONE | IN-PROGRESS | DONE' }],
    screens: ['nodes'],
    description: 'Set status  →  /add node 1 status: IN-PROGRESS',
  },
  {
    command: '/add node ... priority:',
    args: [{ name: 'priority', type: 'priority', placeholder: 'LOW | MEDIUM | HIGH' }],
    screens: ['nodes'],
    description: 'Set priority  →  /add node 1 priority: HIGH',
  },

  // ── /delete node REF PROPERTY ──────────────────────────────────────────────
  {
    command: '/delete node ... start-date',
    args: [{ name: 'index-or-title', type: 'index-or-title', placeholder: '1  or  task title' }],
    screens: ['nodes'],
    description: 'Remove start date  →  /delete node 1 start-date',
  },
  {
    command: '/delete node ... start-time',
    args: [{ name: 'index-or-title', type: 'index-or-title', placeholder: '1  or  task title' }],
    screens: ['nodes'],
    description: 'Remove start time  →  /delete node 1 start-time',
  },
  {
    command: '/delete node ... end-date',
    args: [{ name: 'index-or-title', type: 'index-or-title', placeholder: '1  or  task title' }],
    screens: ['nodes'],
    description: 'Remove end date  →  /delete node 1 end-date',
  },
  {
    command: '/delete node ... end-time',
    args: [{ name: 'index-or-title', type: 'index-or-title', placeholder: '1  or  task title' }],
    screens: ['nodes'],
    description: 'Remove end time  →  /delete node 1 end-time',
  },
  {
    command: '/delete node ... note',
    args: [{ name: 'index-or-title', type: 'index-or-title', placeholder: '1  or  task title' }],
    screens: ['nodes'],
    description: 'Remove note  →  /delete node 1 note',
  },
  {
    command: '/delete node ... status',
    args: [{ name: 'index-or-title', type: 'index-or-title', placeholder: '1  or  task title' }],
    screens: ['nodes'],
    description: 'Remove status  →  /delete node 1 status',
  },
  {
    command: '/delete node ... priority',
    args: [{ name: 'index-or-title', type: 'index-or-title', placeholder: '1  or  task title' }],
    screens: ['nodes'],
    description: 'Remove priority  →  /delete node 1 priority',
  },
]

/** Returns commands valid for a given screen (global always included). */
export function getCommandsForScreen(screen: Screen): CommandDefinition[] {
  return COMMAND_REGISTRY.filter((c) => c.screens.includes('global') || c.screens.includes(screen))
}
