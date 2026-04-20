import React from 'react'
import { Box, Text } from 'ink'
import type { List } from '../../types/index.js'

interface Props {
  list: List
  isSelected: boolean
}

export function ListItem({ list, isSelected }: Props) {
  return (
    <Box>
      <Text bold={isSelected} color={isSelected ? 'yellow' : undefined}>
        {isSelected ? `❯ ${list.name}` : `  ${list.name}`}
      </Text>
    </Box>
  )
}
