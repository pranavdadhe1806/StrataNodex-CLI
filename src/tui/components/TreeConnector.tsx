import React from 'react'
import { Text } from 'ink'

interface Props {
  depth: number
  isLast?: boolean
}

export function TreeConnector({ depth, isLast = true }: Props) {
  if (depth === 0) return null
  const indent = '  '.repeat(depth - 1)
  return (
    <Text dimColor>
      {indent}
      {isLast ? '└─ ' : '├─ '}
    </Text>
  )
}
