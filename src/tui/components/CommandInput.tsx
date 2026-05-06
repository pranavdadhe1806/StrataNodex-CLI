// CommandInput.tsx — Bottom input bar with integrated token-aware autocomplete.
// Replaces BottomBar for screens that have full command support.

import React, { useState, useCallback, useRef } from 'react'
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
  /** Called with true when overlay opens, false when it closes */
  onOverlayChange?: (open: boolean) => void
}

export const CommandInput: React.FC<Props> = ({
  screen,
  currentNodes = [],
  width,
  onSubmit,
  onOverlayChange,
}) => {
  const [inputValue, setInputValue] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [overlayVisible, setOverlayVisible] = useState(false)
  /** Guard: when true, handleChange ignores calls (fillToken is setting the value) */
  const fillingRef = useRef(false)

  const setOverlay = useCallback(
    (open: boolean) => {
      setOverlayVisible(open)
      if (open) {
        onOverlayChange?.(true)
      } else {
        setTimeout(() => onOverlayChange?.(false), 0)
      }
    },
    [onOverlayChange]
  )

  const resolved = resolve(inputValue, screen, currentNodes)
  const suggestions = resolved.suggestions
  // Don't show overlay if all suggestions are just placeholder hints (e.g. "folder name")
  const hasActionableSuggestions =
    suggestions.length > 0 && suggestions.some((s) => s.fillValue && !s.isNoMatch)
  const showOverlay = overlayVisible && inputValue.startsWith('/') && hasActionableSuggestions

  const handleChange = useCallback(
    (val: string) => {
      // Skip if fillToken is active (ink-text-input fires onChange for TAB too)
      if (fillingRef.current) return
      // Strip any tab characters that ink-text-input might inject
      const cleaned = val.replace(/\t/g, '')
      setInputValue(cleaned)
      setSelectedIndex(0)
      setOverlay(cleaned.startsWith('/'))
    },
    [setOverlay]
  )

  const fillToken = useCallback(
    (idx: number) => {
      const suggestion = suggestions[idx]
      if (!suggestion || suggestion.isNoMatch) return

      // Block handleChange for this tick — ink-text-input will also fire onChange for TAB
      fillingRef.current = true
      setTimeout(() => {
        fillingRef.current = false
      }, 0)

      const filled = resolved.filledTokens.join(' ')
      const base = filled.length > 0 ? filled + ' ' : ''

      if (!suggestion.fillValue) {
        setInputValue(base)
        setOverlay(false)
      } else {
        const newValue = base + suggestion.fillValue
        setInputValue(newValue)
        setSelectedIndex(0)

        // Check if the next stage only has placeholder hints
        const nextResolved = resolve(newValue, screen, currentNodes)
        const allPlaceholders =
          nextResolved.suggestions.length > 0 &&
          nextResolved.suggestions.every((s) => !s.fillValue || s.isNoMatch)
        if (allPlaceholders || nextResolved.suggestions.length === 0) {
          setOverlay(false)
        }
      }
    },
    [suggestions, resolved.filledTokens, setOverlay, screen, currentNodes]
  )

  const handleSubmit = useCallback(
    (val: string) => {
      if (!val.trim()) return
      setInputValue('')
      setOverlay(false)
      setSelectedIndex(0)
      onSubmit(val.trim())
    },
    [onSubmit, setOverlay]
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
    // Escape — close overlay (event is consumed here, keymap won't see it)
    if (key.escape) {
      if (overlayVisible) {
        setOverlay(false)
      } else {
        // Overlay already closed — clear input
        setInputValue('')
      }
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
