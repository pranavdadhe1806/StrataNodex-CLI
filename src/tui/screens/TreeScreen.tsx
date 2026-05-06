// Tree screen - core screen
import React, { useState, useEffect, useCallback } from 'react'
import { Box, Text } from 'ink'
import { useTree } from '../hooks/useTree.js'
import { NodeRow } from '../components/NodeRow.js'
import { Breadcrumb } from '../components/Breadcrumb.js'
import { Keybindings } from '../components/Keybindings.js'
import { Spinner } from '../components/Spinner.js'
import { createRootNode, createChildNode, updateNode } from '../../api/client.js'
import type { ScreenProps } from '../types.js'
import type { Node } from '../../types/index.js'

const BINDINGS = '[↑↓] navigate  [→←] expand/collapse  [b] back  [/] command'

interface Props extends ScreenProps {
  listId: string
  listName?: string
  folderName?: string
  /** Called with the current flat node list so App can pass them to CommandInput. */
  onNodesLoaded?: (nodes: ReturnType<typeof useTree>['nodes']) => void
}

// ── Tree metadata helpers ─────────────────────────────────────────────────────

interface FlatEntry {
  node: Node
  depth: number
  isLast: boolean
  /** For each ancestor depth, whether a vertical line should continue */
  parentLines: boolean[]
}

/**
 * Flatten the nested tree into a display list with depth, isLast, and parentLines
 * metadata needed for rendering Figma-style connectors.
 */
function flattenForDisplay(
  roots: Node[],
  expandedIds: Set<string>,
  numberMap: Map<string, string>
): FlatEntry[] {
  const result: FlatEntry[] = []

  function walk(children: Node[], depth: number, parentLines: boolean[]): void {
    const sorted = [...children].sort((a, b) => a.position - b.position)
    sorted.forEach((node, index) => {
      const isLast = index === sorted.length - 1
      const entry: FlatEntry = {
        node,
        depth,
        isLast,
        parentLines: [...parentLines],
      }
      result.push(entry)

      if (expandedIds.has(node.id) && (node.children ?? []).length > 0) {
        // For children, pass whether this parent's level should draw a continuation line
        const nextParentLines = [...parentLines, !isLast]
        walk(node.children ?? [], depth + 1, nextParentLines)
      }
    })
  }

  walk(roots, 0, [])
  return result
}

export function TreeScreen({
  pop,
  registerActions,
  listId,
  listName,
  folderName,
  onNodesLoaded,
}: Props) {
  const { nodes, flatNodes, expandedIds, toggleExpand, numberMap, loading, error, refetch } =
    useTree(listId)
  const [cursor, setCursor] = useState(0)
  const [status, setStatus] = useState<string | null>(null)

  // Build display entries with tree metadata
  const displayEntries = flattenForDisplay(nodes, expandedIds, numberMap)

  // Bubble flat nodes up so CommandInput can resolve node refs for autocomplete
  useEffect(() => {
    if (onNodesLoaded) onNodesLoaded(nodes)
  }, [nodes, onNodesLoaded])

  const handleCommand = useCallback(
    async (cmd: string) => {
      const parts = cmd.trim().split(/\s+/)

      // ── /add node <title> ────────────────────────────────────────────────
      if (parts[0] === '/add' && parts[1] === 'node' && parts.length > 2) {
        const title = parts.slice(2).join(' ')
        setStatus('Adding node...')
        createRootNode(listId, { title })
          .then(() => {
            setStatus(`✓ Added "${title}"`)
            refetch()
          })
          .catch((e: Error) => setStatus(`✗ ${e.message}`))
        return
      }

      // ── /add sub-node [index] <title> ────────────────────────────────────
      if (parts[0] === '/add' && parts[1] === 'sub-node' && parts.length > 2) {
        const afterCmd = parts.slice(2)
        // Check if first arg looks like an index (e.g. "1", "1.2", "1.2.1")
        const indexPattern = /^\d+(\.\d+)*$/
        let parentId: string | null = null
        let title: string

        if (indexPattern.test(afterCmd[0]!)) {
          // /add sub-node <index> <title>
          const idx = afterCmd[0]!
          title = afterCmd.slice(1).join(' ')
          // Find node by its number
          for (const [nodeId, num] of numberMap.entries()) {
            if (num === idx) {
              parentId = nodeId
              break
            }
          }
          if (!parentId) {
            setStatus(`✗ Node "${idx}" not found.`)
            return
          }
          if (!title) {
            setStatus('✗ Please provide a title for the sub-node.')
            return
          }
        } else {
          // /add sub-node <title> — use currently selected node
          title = afterCmd.join(' ')
          const entry = displayEntries[cursor]
          if (!entry) {
            setStatus('✗ No node selected. Navigate to a node first.')
            return
          }
          parentId = entry.node.id
        }

        setStatus('Adding sub-node...')
        createChildNode(parentId, { title })
          .then(() => {
            setStatus(`✓ Added sub-node "${title}"`)
            refetch()
          })
          .catch((e: Error) => setStatus(`✗ ${e.message}`))
        return
      }

      // ── /done <index> ────────────────────────────────────────────────────
      if (parts[0] === '/done' && parts[1]) {
        const arg = parts.slice(1).join(' ')
        const node = flatNodes.find((n) => numberMap.get(n.id) === arg)
        if (!node) {
          setStatus(`✗ Node "${arg}" not found.`)
          return
        }
        setStatus('Marking done...')
        updateNode(node.id, { status: 'DONE' })
          .then(() => {
            setStatus(`✓ Done: ${node.title}`)
            refetch()
          })
          .catch((e: Error) => setStatus(`✗ ${e.message}`))
        return
      }

      // ── /back ────────────────────────────────────────────────────────────
      if (parts[0] === '/back') {
        pop()
      }
    },
    [flatNodes, displayEntries, cursor, numberMap, listId, refetch, pop]
  )

  useEffect(() => {
    const len = displayEntries.length
    registerActions({
      onUp: () => setCursor((c) => Math.max(0, c - 1)),
      onDown: () => setCursor((c) => Math.min(len - 1, c + 1)),
      onRight: () => {
        const entry = displayEntries[cursor]
        if (entry) toggleExpand(entry.node.id)
      },
      onLeft: () => {
        const entry = displayEntries[cursor]
        if (entry) toggleExpand(entry.node.id)
      },
      onBack: () => pop(),
      onCommand: handleCommand,
    })
  }, [displayEntries, cursor, toggleExpand, pop, registerActions, handleCommand])

  const breadcrumbParts = [folderName, listName].filter(Boolean) as string[]

  if (loading)
    return (
      <Box paddingX={2}>
        <Spinner label="Loading tree..." />
      </Box>
    )
  if (error)
    return (
      <Box paddingX={2}>
        <Text color="red">✗ {error}</Text>
      </Box>
    )
  if (displayEntries.length === 0) {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        {breadcrumbParts.length > 0 && <Breadcrumb parts={breadcrumbParts} />}
        <Box marginTop={1}>
          <Text color="#8b949e" dimColor>
            No tasks yet. Type{' '}
          </Text>
          <Text color="#00bfff">/add node {'<title>'}</Text>
          <Text color="#8b949e" dimColor>
            {' '}
            to create one.
          </Text>
        </Box>
      </Box>
    )
  }

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      {breadcrumbParts.length > 0 && <Breadcrumb parts={breadcrumbParts} />}
      <Box flexDirection="column" marginTop={1}>
        {displayEntries.map((entry, i) => {
          const num = numberMap.get(entry.node.id) ?? ''
          return (
            <NodeRow
              key={entry.node.id}
              node={entry.node}
              number={num}
              depth={entry.depth}
              isSelected={i === cursor}
              isLast={entry.isLast}
              parentLines={entry.parentLines}
            />
          )
        })}
      </Box>
      {status && (
        <Box marginTop={1}>
          <Text dimColor>{status}</Text>
        </Box>
      )}
      <Box marginTop={1}>
        <Keybindings bindings={BINDINGS} />
      </Box>
    </Box>
  )
}
