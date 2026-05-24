import React from 'react'
import { Box, Text } from 'ink'
import { SuggestionItem } from './SuggestionItem.js'
import type { Suggestion } from '../../commands/resolver.js'

const MAX_VISIBLE = 5

interface Props {
  suggestions: Suggestion[]
  selectedIndex: number
  visible: boolean
  width: number
}

export const AutocompleteOverlay: React.FC<Props> = ({
  suggestions,
  selectedIndex,
  visible,
  width,
}) => {
  if (!visible || suggestions.length === 0) return null
  const allPlaceholders = suggestions.every((s) => !s.fillValue || s.isNoMatch)
  if (allPlaceholders) return null

  // Scroll window
  const start = Math.max(
    0,
    Math.min(selectedIndex - Math.floor(MAX_VISIBLE / 2), suggestions.length - MAX_VISIBLE)
  )
  const visible_items = suggestions.slice(start, start + MAX_VISIBLE)

  // ── Column sizing ──────────────────────────────────────────────────────────
  // Wider overlay: up to 90 chars
  const borderWidth = Math.min(width - 2, 90)
  // Inner usable width: subtract border (2) + paddingX (2) + cursor+space (2)
  const innerWidth = borderWidth - 6
  // Fixed label column = widest label among visible items (minimum 20)
  const maxLabelWidth = Math.max(20, ...visible_items.map((s) => s.label.length))
  // Remaining space for the hint (subtract 2 for the "  " gap)
  const hintMaxWidth = Math.max(12, innerWidth - maxLabelWidth - 2)

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="#00bfff"
      width={borderWidth}
      marginLeft={2}
    >
      {/* Header */}
      <Box paddingX={1}>
        <Text color="#00bfff" dimColor>
          suggestions{' '}
          {suggestions.length > MAX_VISIBLE
            ? `(${start + 1}–${start + visible_items.length} of ${suggestions.length})`
            : ''}
        </Text>
      </Box>

      {/* Items */}
      {visible_items.map((s, i) => {
        const absoluteIdx = start + i
        return (
          <SuggestionItem
            key={`${s.label}-${absoluteIdx}`}
            suggestion={s}
            isSelected={absoluteIdx === selectedIndex}
            labelWidth={maxLabelWidth}
            hintMaxWidth={hintMaxWidth}
          />
        )
      })}
    </Box>
  )
}
