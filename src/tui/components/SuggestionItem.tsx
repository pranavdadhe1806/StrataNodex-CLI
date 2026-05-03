import React from 'react'
import { Box, Text } from 'ink'
import type { Suggestion } from '../../commands/resolver.js'

interface Props {
  suggestion: Suggestion
  isSelected: boolean
}

export const SuggestionItem: React.FC<Props> = ({ suggestion, isSelected }) => {
  if (suggestion.isNoMatch) {
    return (
      <Box paddingX={1}>
        <Text color="#ff6b6b">✕ No match found</Text>
      </Box>
    )
  }

  return (
    <Box paddingX={1} gap={1}>
      <Text color={isSelected ? '#00bfff' : '#8b949e'}>
        {isSelected ? '>' : ' '} {suggestion.label}
      </Text>
      {suggestion.hint && (
        <Text color="#00c896" dimColor>
          {suggestion.hint}
        </Text>
      )}
    </Box>
  )
}
