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

const ROOT_INDENT = '  '

export function NodeRow({
  node,
  number,
  depth,
  isSelected,
  isLast,
  isLastRoot,
  parentLines,
}: Props) {
  const title = node.title.length > 50 ? node.title.slice(0, 47) + '...' : node.title
  const statusInfo = STATUS_ICON[node.status] ?? STATUS_ICON['TODO']!

  return (
    <Box>
      {/* Indent / tree connector */}
      {depth === 0 ? (
        <Text color="#2a5a6a">{ROOT_INDENT}</Text>
      ) : (
        <>
          <Text color="#2a5a6a">{ROOT_INDENT}</Text>
          <TreeConnector depth={depth} parentLines={parentLines} isLast={isLast} />
        </>
      )}

      {/* Status icon */}
      <Text color={statusInfo.color}>{statusInfo.icon}</Text>
      <Text> </Text>

      {/* Hierarchical number */}
      {number && (
        <Text color={isSelected ? '#00bfff' : '#3d6a7a'} dimColor={!isSelected}>
          {number}
        </Text>
      )}
      {number && <Text> </Text>}

      {/* Title */}
      {isSelected ? (
        <Text bold color="#00bfff">
          {title}
        </Text>
      ) : (
        <Text color="#c9d1d9">{title}</Text>
      )}
    </Box>
  )
}
