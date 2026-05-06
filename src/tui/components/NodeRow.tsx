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
  /** Which ancestor levels should draw a continuing vertical line */
  parentLines: boolean[]
}

const STATUS_ICON: Record<string, { icon: string; color: string }> = {
  TODO: { icon: '○', color: '#8b949e' },
  IN_PROGRESS: { icon: '◑', color: '#00bfff' },
  DONE: { icon: '●', color: '#00c896' },
}

export function NodeRow({ node, number, depth, isSelected, isLast, parentLines }: Props) {
  const title = node.title.length > 50 ? node.title.slice(0, 47) + '...' : node.title
  const statusInfo = STATUS_ICON[node.status] ?? STATUS_ICON['TODO']!

  return (
    <Box flexDirection="column">
      {/* Vertical connector line between siblings */}
      {depth > 0 && (
        <Box>
          <Text color="#3a6a7a">
            {(() => {
              const parts: string[] = []
              for (let i = 0; i < depth - 1; i++) {
                parts.push(parentLines[i] ? '│     ' : '      ')
              }
              parts.push('│')
              return parts.join('')
            })()}
          </Text>
        </Box>
      )}

      {/* Node row — plain text, no borders */}
      <Box>
        <TreeConnector depth={depth} parentLines={parentLines} isLast={isLast} />
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
    </Box>
  )
}
