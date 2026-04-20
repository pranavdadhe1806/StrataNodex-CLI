// Tree screen - core screen
import React, { useState, useEffect, useCallback } from 'react'
import { Box, Text } from 'ink'
import { useTree } from '../hooks/useTree.js'
import { NodeRow } from '../components/NodeRow.js'
import { Breadcrumb } from '../components/Breadcrumb.js'
import { Keybindings } from '../components/Keybindings.js'
import { createRootNode, updateNode } from '../../api/client.js'
import type { ScreenProps } from '../types.js'

const BINDINGS = '[↑↓] navigate  [→←] expand/collapse  [b] back  [/] command'

interface Props extends ScreenProps {
  listId: string
  listName?: string
  folderName?: string
}

function getDepth(nodes: ReturnType<typeof useTree>['nodes'], nodeId: string, depth = 0): number {
  for (const n of nodes) {
    if (n.id === nodeId) return depth
    const child = getDepth(n.children ?? [], nodeId, depth + 1)
    if (child !== -1) return child
  }
  return -1
}

export function TreeScreen({ pop, registerActions, listId, listName, folderName }: Props) {
  const { nodes, flatNodes, expandedIds, toggleExpand, numberMap, loading, error, refetch } =
    useTree(listId)
  const [cursor, setCursor] = useState(0)
  const [status, setStatus] = useState<string | null>(null)

  const handleCommand = useCallback(
    async (cmd: string) => {
      const parts = cmd.trim().split(/\s+/)
      const verb = parts[0]
      const arg = parts.slice(1).join(' ')
      if (verb === '/add' && arg) {
        setStatus('Adding node...')
        createRootNode(listId, { title: arg })
          .then(() => {
            setStatus(`✓ Added "${arg}"`)
            refetch()
          })
          .catch((e: Error) => setStatus(`✗ ${e.message}`))
      } else if (verb === '/done' && arg) {
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
      } else if (verb === '/back') {
        pop()
      }
    },
    [flatNodes, numberMap, listId, refetch, pop]
  )

  useEffect(() => {
    const len = flatNodes.length
    registerActions({
      onUp: () => setCursor((c) => Math.max(0, c - 1)),
      onDown: () => setCursor((c) => Math.min(len - 1, c + 1)),
      onRight: () => {
        const n = flatNodes[cursor]
        if (n) toggleExpand(n.id)
      },
      onLeft: () => {
        const n = flatNodes[cursor]
        if (n) toggleExpand(n.id)
      },
      onBack: () => pop(),
      onCommand: handleCommand,
    })
  }, [flatNodes, cursor, toggleExpand, pop, registerActions, handleCommand])

  const breadcrumbParts = [folderName, listName].filter(Boolean) as string[]

  if (loading)
    return (
      <Box paddingX={2}>
        <Text dimColor>Loading tree...</Text>
      </Box>
    )
  if (error)
    return (
      <Box paddingX={2}>
        <Text color="red">✗ {error}</Text>
      </Box>
    )
  if (flatNodes.length === 0) {
    return (
      <Box flexDirection="column" paddingX={2}>
        {breadcrumbParts.length > 0 && <Breadcrumb parts={breadcrumbParts} />}
        <Box marginTop={1}>
          <Text dimColor>No tasks yet. Type /add &lt;title&gt; to create one.</Text>
        </Box>
      </Box>
    )
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      {breadcrumbParts.length > 0 && <Breadcrumb parts={breadcrumbParts} />}
      <Box marginTop={1}>
        {flatNodes.map((node, i) => {
          const depth = getDepth(nodes, node.id)
          const num = numberMap.get(node.id) ?? ''
          const hasChildren = (node.children ?? []).length > 0
          const expanded = expandedIds.has(node.id)
          return (
            <Box key={node.id} flexDirection="column">
              <NodeRow
                node={node}
                number={`${hasChildren ? (expanded ? '▼ ' : '▶ ') : '  '}${num}`}
                depth={depth === -1 ? 0 : depth}
                isSelected={i === cursor}
              />
            </Box>
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
