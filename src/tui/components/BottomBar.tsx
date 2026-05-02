import React from 'react'
import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'
import chalk from 'chalk'

interface BottomBarProps {
  value: string
  onChange: (val: string) => void
  onSubmit: (val: string) => void
  width: number
  hints?: string[]
}

const DEFAULT_HINTS = ['/add', '/done', '/delete', '/list', '/daily', '/exit', '/help']

export const BottomBar: React.FC<BottomBarProps> = ({
  value,
  onChange,
  onSubmit,
  width,
  hints = DEFAULT_HINTS,
}) => {
  return (
    <Box flexDirection="column" width={width}>

      {/* Row 1 — separator */}
      <Box width={width}>
        <Text>{chalk.hex('#0a2a33')('─'.repeat(width))}</Text>
      </Box>

      {/* Row 2 — prompt + input */}
      <Box width={width} paddingX={2}>
        <Text>{chalk.hex('#00bfff')('> ')}</Text>
        <TextInput
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          placeholder="type a command"
        />
      </Box>

      {/* Row 3 — hint bar */}
      <Box width={width} paddingX={2} gap={2}>
        {hints.slice(0, 7).map((hint) => (
          <Text key={hint}>{chalk.hex('#003344')(hint)}</Text>
        ))}
      </Box>

    </Box>
  )
}
