import React from 'react'
import { Box, Text } from 'ink'
import chalk from 'chalk'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const { version } = require('../../../package.json') as { version: string }

interface TopBarProps {
  width: number
  hasToken: boolean
}

const LOGO_LINE_1 = '█▀▀ ▀█▀ █▀█ ▄▀█ ▀█▀ ▄▀█   █▄ █ █▀█ █▀▄ █▀▀ ▀▄▀'
const LOGO_LINE_2 = '▄██  █  █▀▄ █▀█  █  █▀█   █ ▀█ █▄█ █▄▀ ██▄ █ █'

export const TopBar: React.FC<TopBarProps> = ({ width, hasToken }) => {
  return (
    <Box flexDirection="column" width={width}>

      {/* Row 1 — top edge */}
      <Box width={width}>
        <Text>{chalk.hex('#1a4a5a')('▀'.repeat(width))}</Text>
      </Box>

      {/* Row 2 — dim ghost glow (haze above bright logo) */}
      <Box width={width} paddingX={2}>
        <Text>{chalk.hex('#004477')(LOGO_LINE_1)}</Text>
      </Box>

      {/* Row 3 — bright logo line 1 */}
      <Box width={width} paddingX={2}>
        <Text>{chalk.hex('#00bfff').bold(LOGO_LINE_1)}</Text>
      </Box>

      {/* Row 4 — bright logo line 2 + version/status */}
      <Box width={width} justifyContent="space-between" paddingX={2}>
        <Text>{chalk.hex('#00bfff').bold(LOGO_LINE_2)}</Text>
        <Text>
          {chalk.hex('#004455')(`v${version}`)}{' '}
          {hasToken
            ? chalk.hex('#007799')('● connected')
            : chalk.hex('#440000')('● not logged in')}
        </Text>
      </Box>

      {/* Row 5 — separator */}
      <Box width={width}>
        <Text>{chalk.hex('#0a2a33')('─'.repeat(width))}</Text>
      </Box>

    </Box>
  )
}
