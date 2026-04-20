import React from 'react'
import { Box, Text } from 'ink'
import type { Node } from '../../types/index.js'
import { StatusBadge } from './StatusBadge.js'
import { PriorityBadge } from './PriorityBadge.js'
import { TreeConnector } from './TreeConnector.js'

interface Props {
  node: Node
  number: string
  depth: number
  isSelected: boolean
  isLast?: boolean
}

export function NodeRow({ node, number, depth, isSelected, isLast = true }: Props) {
  const title = node.title.length > 34 ? node.title.slice(0, 31) + '...' : node.title
  return (
    <Box>
      <TreeConnector depth={depth} isLast={isLast} />
      <Text dimColor>{number.padEnd(6)} </Text>
      {isSelected ? (
        <Text bold color="yellow" backgroundColor="black">
          {title.padEnd(34)}{' '}
        </Text>
      ) : (
        <Text>{title.padEnd(34)} </Text>
      )}
      <StatusBadge status={node.status} />
      <Text> </Text>
      <PriorityBadge priority={node.priority} />
    </Box>
  )
}
