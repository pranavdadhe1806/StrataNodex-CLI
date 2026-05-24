// resolver.ts — Parses the current input string and returns stage + suggestions.
// This is the core brain of the autocomplete system.

import { COMMAND_REGISTRY, getCommandsForScreen } from './registry.js'
import type { Screen, CommandDefinition } from './registry.js'
import type { Node } from '../types/index.js'
import { assignNumbers } from '../utils/numbering.js'

/** DFS flatten for suggestions — walks the full nested tree. */
function flattenForSuggestions(nodes: Node[]): Node[] {
  const result: Node[] = []
  function dfs(children: Node[]): void {
    const sorted = [...children].sort((a, b) => a.position - b.position)
    for (const node of sorted) {
      result.push(node)
      if ((node.children ?? []).length > 0) dfs(node.children)
    }
  }
  dfs(nodes)
  return result
}

export type Stage = 'command' | 'node-ref' | 'property' | 'value-hint'

export interface Suggestion {
  label: string
  fillValue: string
  hint?: string
  isNoMatch?: boolean
}

export interface ResolveResult {
  stage: Stage
  suggestions: Suggestion[]
  filledTokens: string[]
}

// The ordered list of sub-properties for "/edit node ..." style commands.
const NODE_PROPERTIES = [
  'title',
  'start-date',
  'start-time',
  'end-date',
  'end-time',
  'tag',
  'note',
  'status',
  'priority',
  'position',
]

const STATUS_VALUES = ['NOT-DONE', 'IN-PROGRESS', 'DONE']
const PRIORITY_VALUES = ['LOW', 'MEDIUM', 'HIGH']

/** Fuzzy prefix match — input must be a prefix of label (case-insensitive). */
function prefixMatch(input: string, label: string): boolean {
  return label.toLowerCase().startsWith(input.toLowerCase())
}

/** Find which registered command best matches a fully-typed command prefix. */
function matchingCommands(input: string, screen: Screen): CommandDefinition[] {
  const all = getCommandsForScreen(screen)
  return all.filter((c) => prefixMatch(input, c.command))
}

export function resolve(
  input: string,
  screen: Screen,
  currentNodes: Node[],
  selectedNodeRef?: string
): ResolveResult {
  // ── Stage 0: no slash, no overlay ─────────────────────────────────────────
  if (!input.startsWith('/')) {
    return { stage: 'command', suggestions: [], filledTokens: [] }
  }

  const trimmed = input.trimEnd()

  // ─── Stage 1: command selection ───────────────────────────────────────────
  // We're still typing the command name — no trailing space yet after the
  // command, or no command matched yet.
  const allForScreen = getCommandsForScreen(screen)

  // Check if the current input has moved past Stage 1 by seeing if the input
  // exactly matches a registered command prefix + a space.
  const matchedCmd = COMMAND_REGISTRY.find(
    (c) =>
      trimmed.toLowerCase().startsWith(c.command.toLowerCase()) && input.length > c.command.length
  )

  if (!matchedCmd) {
    // Still typing the command — show matching commands as suggestions.
    const matches = allForScreen.filter((c) =>
      c.command.toLowerCase().startsWith(trimmed.toLowerCase())
    )
    return {
      stage: 'command',
      filledTokens: [],
      suggestions: matches.map((c) => {
        // If a node is selected, substitute '...' with its hierarchical index.
        // This makes suggestions read as e.g. "/edit node 1.3 title:" instead of "/edit node ... title:"
        const label = selectedNodeRef ? c.command.replace('...', selectedNodeRef) : c.command
        const fillValue = selectedNodeRef
          ? c.command.replace('...', selectedNodeRef) + ' '
          : c.command + ' '
        return { label, fillValue, hint: c.description }
      }),
    }
  }

  // ─── We have a matched command. Now determine which arg we're filling. ────
  // Strip the command prefix + trailing space.
  const afterCmd = input.slice(matchedCmd.command.length + 1)
  const args = matchedCmd.args

  // ─── Commands that need a node-ref as first arg ──────────────────────────
  const needsNodeRef = args.length > 0 && args[0]!.type === 'index-or-title'

  if (needsNodeRef) {
    // Stage 2: node-ref input
    const nodeRefInput = afterCmd
    const propertyStart = nodeRefInput.indexOf(' ')

    if (propertyStart === -1) {
      // User is still typing the node ref
      const query = nodeRefInput.toLowerCase()

      // Build hierarchical number map and flatten the tree for display
      const numberMap = assignNumbers(currentNodes)
      const flatNodes = flattenForSuggestions(currentNodes)

      const matchedNodes = flatNodes.filter((n) => {
        if (!nodeRefInput) return true
        const num = numberMap.get(n.id) ?? ''
        return n.title.toLowerCase().includes(query) || num.startsWith(query)
      })

      if (nodeRefInput.length > 0 && matchedNodes.length === 0) {
        return {
          stage: 'node-ref',
          filledTokens: [matchedCmd.command],
          suggestions: [{ label: '✕ No match found', fillValue: '', isNoMatch: true }],
        }
      }

      return {
        stage: 'node-ref',
        filledTokens: [matchedCmd.command],
        suggestions: matchedNodes.map((n) => {
          const num = numberMap.get(n.id) ?? '?'
          return {
            label: `${num}. ${n.title}`,
            fillValue: num + ' ',
            hint: n.status,
          }
        }),
      }
    }

    // Node ref is filled. Now figure out which property arg we're on.
    const nodeRef = nodeRefInput.slice(0, propertyStart)
    const afterNodeRef = nodeRefInput.slice(propertyStart + 1)
    const filledTokens = [matchedCmd.command, nodeRef]

    // If the command has exactly 2 args (node-ref + value), go to value-hint
    if (args.length === 2) {
      const valueArg = args[1]!
      const valueInput = afterNodeRef

      // Stage 3 for value typing
      if (valueArg.type === 'status') {
        const matches = STATUS_VALUES.filter((v) => prefixMatch(valueInput, v))
        return {
          stage: 'value-hint',
          filledTokens,
          suggestions: matches.map((v) => ({
            label: v,
            fillValue: v + ' ',
            hint: valueArg.placeholder,
          })),
        }
      }
      if (valueArg.type === 'priority') {
        const matches = PRIORITY_VALUES.filter((v) => prefixMatch(valueInput, v))
        return {
          stage: 'value-hint',
          filledTokens,
          suggestions: matches.map((v) => ({
            label: v,
            fillValue: v + ' ',
            hint: valueArg.placeholder,
          })),
        }
      }
      // Date / time / text / number — just show format hint
      return {
        stage: 'value-hint',
        filledTokens,
        suggestions: [{ label: valueArg.placeholder, fillValue: '', hint: valueArg.placeholder }],
      }
    }

    // Command has only 1 arg (just node-ref, no further arg) — nothing more to suggest
    return { stage: 'value-hint', filledTokens, suggestions: [] }
  }

  // ─── Commands without node-ref (folder/list commands + global) ───────────
  // If command has args and no node-ref, show property suggestions.
  if (args.length > 0) {
    const firstArg = args[0]!
    const valueInput = afterCmd

    if (firstArg.type === 'status') {
      const matches = STATUS_VALUES.filter((v) => prefixMatch(valueInput, v))
      return {
        stage: 'value-hint',
        filledTokens: [matchedCmd.command],
        suggestions: matches.map((v) => ({ label: v, fillValue: v, hint: firstArg.placeholder })),
      }
    }
    if (firstArg.type === 'priority') {
      const matches = PRIORITY_VALUES.filter((v) => prefixMatch(valueInput, v))
      return {
        stage: 'value-hint',
        filledTokens: [matchedCmd.command],
        suggestions: matches.map((v) => ({ label: v, fillValue: v, hint: firstArg.placeholder })),
      }
    }
    // text / number — show format hint
    return {
      stage: 'value-hint',
      filledTokens: [matchedCmd.command],
      suggestions: [{ label: firstArg.placeholder, fillValue: '', hint: firstArg.placeholder }],
    }
  }

  // No args needed — command is complete.
  return { stage: 'command', filledTokens: [matchedCmd.command], suggestions: [] }
}
