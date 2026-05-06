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

const PRIORITY_COLOR: Record<string, string> = {
  HIGH: '#ff6b6b',
  MEDIUM: '#f0ad4e',
  LOW: '#8b949e',
}

export function NodeRow({ node, number, depth, isSelected, isLast, parentLines }: Props) {
  const maxTitleLen = Math.max(20, 50 - depth * 6)
  const title =
    node.title.length > maxTitleLen ? node.title.slice(0, maxTitleLen - 3) + '...' : node.title
  const statusInfo = STATUS_ICON[node.status] ?? STATUS_ICON['TODO']!
  const priorityColor = node.priority ? (PRIORITY_COLOR[node.priority] ?? '#8b949e') : null

  // Selected node styling
  const bgColor = isSelected ? '#1a3a4a' : undefined
  const borderColor = isSelected ? '#00bfff' : '#30363d'

  return (
    <Box flexDirection="column">
      {/* Vertical connector line between siblings */}
      {depth > 0 && (
        <Box>
          {(() => {
            const parts: string[] = []
            for (let i = 0; i < depth - 1; i++) {
              parts.push(parentLines[i] ? '│     ' : '      ')
            }
            parts.push('│')
            return <Text color="#3a6a7a">{parts.join('')}</Text>
          })()}
        </Box>
      )}

      {/* Node row */}
      <Box>
        <TreeConnector depth={depth} parentLines={parentLines} isLast={isLast} />
        <Box borderStyle="round" borderColor={borderColor} paddingX={1}>
          {/* Status circle */}
          <Text color={statusInfo.color}>{statusInfo.icon}</Text>
          <Text> </Text>

          {/* Title */}
          {isSelected ? (
            <Text bold color="#e6edf3">
              {title}
            </Text>
          ) : (
            <Text color="#c9d1d9">{title}</Text>
          )}

          {/* Priority indicator */}
          {priorityColor && (
            <>
              <Text> </Text>
              <Text color={priorityColor}>
                {node.priority === 'HIGH' ? '▲' : node.priority === 'LOW' ? '▽' : '◆'}
              </Text>
            </>
          )}
        </Box>

        {/* Number hint (dim, after the box) */}
        <Text color="#3a6a7a" dimColor>
          {' '}
          {number}
        </Text>
      </Box>
    </Box>
  )
}
