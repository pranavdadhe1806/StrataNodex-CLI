// CommandInput.tsx — Bottom input bar with integrated token-aware autocomplete.
// Replaces BottomBar for screens that have full command support.

import React, { useState, useCallback } from 'react'
import { Box, Text, useInput } from 'ink'
import TextInput from 'ink-text-input'
import chalk from 'chalk'
import { resolve } from '../../commands/resolver.js'
import { AutocompleteOverlay } from './AutocompleteOverlay.js'
import type { Screen } from '../../commands/registry.js'
import type { Node } from '../../types/index.js'

interface Props {
  screen: Screen
  currentNodes?: Node[]
  width: number
  onSubmit: (value: string) => void
  /** Called when the executor returns a result message to display. */
  onResult?: (message: string) => void
}

export const CommandInput: React.FC<Props> = ({ screen, currentNodes = [], width, onSubmit }) => {
  const [inputValue, setInputValue] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [overlayVisible, setOverlayVisible] = useState(false)

  const resolved = resolve(inputValue, screen, currentNodes)
  const suggestions = resolved.suggestions
  const showOverlay = overlayVisible && inputValue.startsWith('/') && suggestions.length > 0

  const handleChange = useCallback((val: string) => {
    setInputValue(val)
    setSelectedIndex(0)
    setOverlayVisible(val.startsWith('/'))
  }, [])

  const fillToken = useCallback(
    (idx: number) => {
      const suggestion = suggestions[idx]
      if (!suggestion || suggestion.isNoMatch) return
      // Replace only the unconfirmed tail of the input with the suggestion's fillValue.
      // Find the last "confirmed" prefix (filledTokens joined) and append fillValue.
      const filled = resolved.filledTokens.join(' ')
      const base = filled.length > 0 ? filled + ' ' : ''
      setInputValue(base + suggestion.fillValue)
      setSelectedIndex(0)
    },
    [suggestions, resolved.filledTokens]
  )

  const handleSubmit = useCallback(
    (val: string) => {
      if (!val.trim()) return
      setInputValue('')
      setOverlayVisible(false)
      setSelectedIndex(0)
      onSubmit(val.trim())
    },
    [onSubmit]
  )

  useInput((input, key) => {
    // Tab — fill selected suggestion
    if (key.tab) {
      if (showOverlay) {
        fillToken(selectedIndex)
      }
      return
    }
    // Arrow up / down — navigate suggestions
    if (key.upArrow) {
      if (showOverlay) {
        setSelectedIndex((i) => Math.max(0, i - 1))
      }
      return
    }
    if (key.downArrow) {
      if (showOverlay) {
        setSelectedIndex((i) => Math.min(suggestions.length - 1, i + 1))
      }
      return
    }
    // Escape — close overlay, keep input
    if (key.escape) {
      setOverlayVisible(false)
      return
    }
  })

  const borderLine = chalk.hex('#0a2a33')('─'.repeat(width))

  return (
    <Box flexDirection="column" width={width}>
      {/* Autocomplete overlay rendered ABOVE the input bar */}
      {showOverlay && (
        <AutocompleteOverlay
          suggestions={suggestions}
          selectedIndex={selectedIndex}
          visible={showOverlay}
          width={width}
        />
      )}

      {/* Separator */}
      <Box width={width}>
        <Text>{borderLine}</Text>
      </Box>

      {/* Prompt + input */}
      <Box width={width} paddingX={2}>
        <Text>{chalk.hex('#00bfff')('> ')}</Text>
        <Box>
          <Text color="#e6edf3">
            <TextInput
              value={inputValue}
              onChange={handleChange}
              onSubmit={handleSubmit}
              placeholder="type / for commands"
            />
          </Text>
        </Box>
      </Box>

      {/* Hint row */}
      <Box width={width} paddingX={2}>
        <Text>
          {chalk.hex('#3a6a7a')(
            '/ for commands  ↑↓ navigate  TAB complete  ESC close  Enter execute'
          )}
        </Text>
      </Box>
    </Box>
  )
}
