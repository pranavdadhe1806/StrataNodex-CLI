import React from 'react'
import { Box, Text } from 'ink'

interface Props {
  depth: number
  /** Which ancestor levels should draw a continuing vertical line */
  parentLines: boolean[]
  isLast: boolean
}

/**
 * Draws the Figma-style arrow connectors for tree nodes.
 *
 * Root nodes (depth 0): no connector
 * Children: ├──→ or └──→ with vertical lines from ancestors
 */
export function TreeConnector({ depth, parentLines, isLast }: Props) {
  if (depth === 0) return null

  const parts: string[] = []

  // Draw vertical continuation lines for each ancestor level
  for (let i = 0; i < depth - 1; i++) {
    if (parentLines[i]) {
      parts.push('│     ')
    } else {
      parts.push('      ')
    }
  }

  // Draw the branch for this node
  if (isLast) {
    parts.push('└──→ ')
  } else {
    parts.push('├──→ ')
  }

  return <Text color="#3a6a7a">{parts.join('')}</Text>
}
