import React from 'react'
import { Box, Text } from 'ink'
import type { Node } from '../../types/index.js'
import { TreeConnector } from './TreeConnector.js'

interface Props {
  node: Node
  number: string
  depth: number
  isSelected: boolean
  isLast: boolean
  isLastRoot: boolean
  /** Which ancestor levels should draw a continuing vertical line */
  parentLines: boolean[]
}

const STATUS_ICON: Record<string, { icon: string; color: string }> = {
  TODO: { icon: '○', color: '#8b949e' },
  IN_PROGRESS: { icon: '◑', color: '#00bfff' },
  DONE: { icon: '●', color: '#00c896' },
}

export function NodeRow({ node, depth, isSelected, isLast, isLastRoot, parentLines }: Props) {
  const title = node.title.length > 50 ? node.title.slice(0, 47) + '...' : node.title
  const statusInfo = STATUS_ICON[node.status] ?? STATUS_ICON['TODO']!

  // Build the vertical spacer line ABOVE this node (between siblings)
  let spacerLine: string | null = null
  if (depth === 0) {
    // Root nodes: no spacer above the very first root
    // (spacer is rendered below each root instead)
    spacerLine = null
  } else {
    // Child nodes: vertical line spacer from parent
    const parts: string[] = []
    for (let i = 0; i < depth - 1; i++) {
      parts.push(parentLines[i] ? '│     ' : '      ')
    }
    parts.push('│')
    spacerLine = parts.join('')
  }

  // Build the vertical spacer line BELOW root nodes
  let rootSpacer: string | null = null
  if (depth === 0 && !isLastRoot) {
    rootSpacer = '  │'
  }

  return (
    <Box flexDirection="column">
      {/* Vertical spacer above child nodes */}
      {spacerLine && (
        <Box>
          <Text color="#3a6a7a">{spacerLine}</Text>
        </Box>
      )}

      {/* The node itself */}
      <Box>
        {depth === 0 ? (
          /* Root node: indented with spaces */
          <Text color="#3a6a7a">{'  '}</Text>
        ) : (
          <TreeConnector depth={depth} parentLines={parentLines} isLast={isLast} />
        )}
        <Text color={statusInfo.color}>{statusInfo.icon}</Text>
        <Text> </Text>
        {isSelected ? (
          <Text bold color="#00bfff">
            {title}
          </Text>
        ) : (
          <Text color="#c9d1d9">{title}</Text>
        )}
      </Box>

      {/* Vertical spacer below root nodes */}
      {rootSpacer && (
        <Box>
          <Text color="#3a6a7a">{rootSpacer}</Text>
        </Box>
      )}
    </Box>
  )
}
