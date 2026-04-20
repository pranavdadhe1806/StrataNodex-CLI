// Daily tasks screen
import React, { useState, useEffect, useCallback } from 'react'
import { Box, Text } from 'ink'
import { getDailyToday, getDailyOverdue, updateNode } from '../../api/client.js'
import { NodeRow } from '../components/NodeRow.js'
import { Keybindings } from '../components/Keybindings.js'
import type { Node } from '../../types/index.js'
import type { ScreenProps } from '../types.js'

const BINDINGS = '[↑↓] navigate  [b] back  [/done <n>] mark done'

export function DailyScreen({ pop, registerActions }: ScreenProps) {
  const [todayNodes, setTodayNodes] = useState<Node[]>([])
  const [overdueNodes, setOverdueNodes] = useState<Node[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cursor, setCursor] = useState(0)
  const [status, setStatus] = useState<string | null>(null)

  const allNodes = [...todayNodes, ...overdueNodes]

  const fetchData = useCallback(() => {
    setLoading(true)
    Promise.all([getDailyToday(), getDailyOverdue()])
      .then(([today, overdue]) => {
        setTodayNodes(today)
        setOverdueNodes(overdue)
        setLoading(false)
      })
      .catch((e: Error) => {
        setError(e.message)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCommand = useCallback(
    async (cmd: string) => {
      const parts = cmd.trim().split(/\s+/)
      const verb = parts[0]
      const arg = parts.slice(1).join(' ')
      if (verb === '/done' && arg) {
        const idx = parseInt(arg, 10) - 1
        const node = allNodes[idx]
        if (!node) {
          setStatus(`✗ Node "${arg}" not found.`)
          return
        }
        updateNode(node.id, { status: 'DONE' })
          .then(() => {
            setStatus(`✓ Done: ${node.title}`)
            fetchData()
          })
          .catch((e: Error) => setStatus(`✗ ${e.message}`))
      } else if (verb === '/back') {
        pop()
      }
    },
    [allNodes, fetchData, pop]
  )

  useEffect(() => {
    registerActions({
      onUp: () => setCursor((c) => Math.max(0, c - 1)),
      onDown: () => setCursor((c) => Math.min(allNodes.length - 1, c + 1)),
      onBack: () => pop(),
      onCommand: handleCommand,
    })
  }, [allNodes.length, pop, registerActions, handleCommand])

  if (loading)
    return (
      <Box paddingX={2}>
        <Text dimColor>Loading daily tasks...</Text>
      </Box>
    )
  if (error)
    return (
      <Box paddingX={2}>
        <Text color="red">✗ {error}</Text>
      </Box>
    )

  let idx = 0
  return (
    <Box flexDirection="column" paddingX={2}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          📅 Today
        </Text>
      </Box>
      {todayNodes.length === 0 ? (
        <Text dimColor> No tasks for today.</Text>
      ) : (
        todayNodes.map((node) => (
          <NodeRow
            key={node.id}
            node={node}
            number={String(++idx)}
            depth={0}
            isSelected={idx - 1 === cursor}
          />
        ))
      )}
      <Box marginTop={1} marginBottom={1}>
        <Text bold color="red">
          ⚠ Overdue
        </Text>
      </Box>
      {overdueNodes.length === 0 ? (
        <Text dimColor> No overdue tasks.</Text>
      ) : (
        overdueNodes.map((node) => (
          <NodeRow
            key={node.id}
            node={node}
            number={String(++idx)}
            depth={0}
            isSelected={idx - 1 === cursor}
          />
        ))
      )}
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
