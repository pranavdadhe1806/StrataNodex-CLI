import React from 'react'
import { Box, Text } from 'ink'
import type { Suggestion } from '../../commands/resolver.js'

interface Props {
  suggestion: Suggestion
  isSelected: boolean
  /** Pad label to this width so all hints start in the same column. */
  labelWidth: number
  /** Max chars for the hint before truncation. */
  hintMaxWidth: number
}

export const SuggestionItem: React.FC<Props> = ({
  suggestion,
  isSelected,
  labelWidth,
  hintMaxWidth,
}) => {
  if (suggestion.isNoMatch) {
    return (
      <Box paddingX={1}>
        <Text color="#ff6b6b">✕ No match found</Text>
      </Box>
    )
  }

  const label = suggestion.label.padEnd(labelWidth)
  const hint =
    suggestion.hint && suggestion.hint.length > hintMaxWidth
      ? suggestion.hint.slice(0, hintMaxWidth - 1) + '…'
      : (suggestion.hint ?? '')

  return (
    <Box paddingX={1}>
      {/* cursor marker */}
      <Text color={isSelected ? '#00bfff' : '#8b949e'}>{isSelected ? '>' : ' '} </Text>
      {/* command — fixed-width column */}
      <Text color={isSelected ? '#00bfff' : '#8b949e'}>{label}</Text>
      {/* hint — starts at same column for every row */}
      {hint.length > 0 && (
        <Text color="#00c896" dimColor>
          {'  '}
          {hint}
        </Text>
      )}
    </Box>
  )
}
