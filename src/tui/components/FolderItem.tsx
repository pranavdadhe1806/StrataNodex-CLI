import React from 'react'
import { Box, Text } from 'ink'
import type { Folder } from '../../types/index.js'

interface Props {
  folder: Folder
  isSelected: boolean
}

export function FolderItem({ folder, isSelected }: Props) {
  return (
    <Box>
      <Text bold={isSelected} color={isSelected ? 'yellow' : undefined}>
        {isSelected ? `❯ ${folder.name}` : `  ${folder.name}`}
      </Text>
    </Box>
  )
}
