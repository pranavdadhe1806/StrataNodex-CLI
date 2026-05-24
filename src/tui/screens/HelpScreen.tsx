// HelpScreen.tsx — Full command reference, grouped by context.
import React, { useEffect } from 'react'
import { Box, Text } from 'ink'
import chalk from 'chalk'
import { COMMAND_REGISTRY } from '../../commands/registry.js'
import { Keybindings } from '../components/Keybindings.js'
import type { ScreenProps } from '../types.js'
import type { Screen } from '../../commands/registry.js'

const SECTIONS: { title: string; screen: Screen; icon: string; color: string }[] = [
  { title: 'GLOBAL', screen: 'global', icon: '◆', color: '#00bfff' },
  { title: 'FOLDERS', screen: 'folders', icon: '▶', color: '#ffa500' },
  { title: 'LISTS', screen: 'lists', icon: '▶', color: '#ffa500' },
  { title: 'NODES', screen: 'nodes', icon: '▶', color: '#ffa500' },
]

const CMD_COL = 32 // fixed width for command column

export function HelpScreen({ pop, registerActions, width = 80 }: ScreenProps) {
  useEffect(() => {
    registerActions({ onBack: pop })
  }, [registerActions, pop])

  const divider = chalk.hex('#0a2a33')('─'.repeat(Math.min(width - 4, 76)))

  return (
    <Box flexDirection="column" paddingX={2} width={width} overflowY="hidden">
      {/* ── Header ───────────────────────────────────────────────── */}
      <Box marginBottom={1}>
        <Text color="#00bfff" bold>
          {'  '}COMMAND REFERENCE
        </Text>
      </Box>
      <Box>
        <Text>{divider}</Text>
      </Box>

      {/* ── Sections ─────────────────────────────────────────────── */}
      {SECTIONS.map(({ title, screen, icon, color }) => {
        const cmds = COMMAND_REGISTRY.filter((c) => c.screens.includes(screen))
        if (cmds.length === 0) return null
        return (
          <Box key={screen} flexDirection="column" marginTop={1}>
            <Box paddingLeft={1}>
              <Text color={color} bold>
                {icon} {title}
              </Text>
            </Box>
            {cmds.map((cmd) => {
              const padded = cmd.command.padEnd(CMD_COL)
              return (
                <Box key={cmd.command} paddingLeft={3}>
                  <Text color="#00bfff">{padded}</Text>
                  <Text color="#8b949e">{cmd.description}</Text>
                </Box>
              )
            })}
          </Box>
        )
      })}

      {/* ── Footer ───────────────────────────────────────────────── */}
      <Box marginTop={1}>
        <Text>{divider}</Text>
      </Box>
      <Box paddingLeft={1}>
        <Keybindings bindings="[b] back  [/] command" />
      </Box>
    </Box>
  )
}
