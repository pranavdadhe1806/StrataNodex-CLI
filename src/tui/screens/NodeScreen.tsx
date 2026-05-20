import React, { useState, useEffect } from 'react'
import { Box, Text } from 'ink'
import { getNode } from '../../api/client.js'
import { Spinner } from '../components/Spinner.js'
import { Breadcrumb } from '../components/Breadcrumb.js'
import { Keybindings } from '../components/Keybindings.js'
import type { ScreenProps } from '../types.js'
import type { Node } from '../../types/index.js'

const BINDINGS = '[b] back  [/] command'

interface Props extends ScreenProps {
  nodeId: string
}

export function NodeScreen({ nodeId, pop, registerActions }: Props) {
  const [node, setNode] = useState<Node | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getNode(nodeId)
      .then((data) => setNode(data))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [nodeId])

  useEffect(() => {
    registerActions({
      onBack: () => pop(),
    })
  }, [pop, registerActions])

  if (loading) {
    return (
      <Box paddingX={2}>
        <Spinner label="Loading node details..." />
      </Box>
    )
  }

  if (error) {
    return (
      <Box paddingX={2} flexDirection="column">
        <Text color="red">✗ {error}</Text>
        <Box marginTop={1}>
          <Keybindings bindings={BINDINGS} />
        </Box>
      </Box>
    )
  }

  if (!node) {
    return (
      <Box paddingX={2} flexDirection="column">
        <Text color="red">Node not found.</Text>
        <Box marginTop={1}>
          <Keybindings bindings={BINDINGS} />
        </Box>
      </Box>
    )
  }

  const STATUS_COLORS: Record<string, string> = {
    TODO: '#8b949e',
    IN_PROGRESS: '#00bfff',
    DONE: '#00c896',
  }

  const PRIORITY_COLORS: Record<string, string> = {
    LOW: '#00c896',
    MEDIUM: '#f7b955',
    HIGH: '#f85149',
  }

  const statusColor = STATUS_COLORS[node.status] || '#8b949e'
  const priorityColor = node.priority ? PRIORITY_COLORS[node.priority] : '#4A4F57'

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Breadcrumb parts={['Node Details']} />

      <Box flexDirection="column" marginTop={1} paddingLeft={1}>
        <Text bold color="#EDEFF3" wrap="wrap">
          {node.title}
        </Text>

        <Box marginTop={1} flexDirection="column" gap={1}>
          {/* Status & Priority */}
          <Box gap={4}>
            <Box width={15}>
              <Text color="#7D828B">Status:</Text>
            </Box>
            <Text color={statusColor}>{node.status.replace('_', ' ')}</Text>
          </Box>

          <Box gap={4}>
            <Box width={15}>
              <Text color="#7D828B">Priority:</Text>
            </Box>
            <Text color={priorityColor}>{node.priority || 'None'}</Text>
          </Box>

          {/* Dates */}
          {(node.startAt || node.endAt) && (
            <>
              {node.startAt && (
                <Box gap={4}>
                  <Box width={15}>
                    <Text color="#7D828B">Start Date:</Text>
                  </Box>
                  <Text>{new Date(node.startAt).toLocaleString()}</Text>
                </Box>
              )}
              {node.endAt && (
                <Box gap={4}>
                  <Box width={15}>
                    <Text color="#7D828B">End Date:</Text>
                  </Box>
                  <Text>{new Date(node.endAt).toLocaleString()}</Text>
                </Box>
              )}
            </>
          )}

          {node.reminderAt && (
            <Box gap={4}>
              <Box width={15}>
                <Text color="#7D828B">Reminder:</Text>
              </Box>
              <Text>{new Date(node.reminderAt).toLocaleString()}</Text>
            </Box>
          )}

          {/* Tags */}
          {node.tags && node.tags.length > 0 && (
            <Box gap={4} marginTop={1}>
              <Box width={15}>
                <Text color="#7D828B">Tags:</Text>
              </Box>
              <Box gap={1} flexWrap="wrap">
                {node.tags.map((t) => (
                  <Text key={t.tag.id} color="#00bfff">
                    #{t.tag.name}
                  </Text>
                ))}
              </Box>
            </Box>
          )}

          {/* Notes */}
          {node.notes && (
            <Box flexDirection="column" marginTop={1}>
              <Text color="#7D828B">Notes:</Text>
              <Box
                marginTop={1}
                paddingX={2}
                borderStyle="single"
                borderColor="#30363d"
                flexDirection="column"
              >
                <Text color="#c9d1d9" wrap="wrap">
                  {node.notes}
                </Text>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      <Box marginTop={2}>
        <Keybindings bindings={BINDINGS} />
      </Box>
    </Box>
  )
}
