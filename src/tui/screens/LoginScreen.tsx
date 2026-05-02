import React, { useEffect, useCallback } from 'react'
import { Box, Text } from 'ink'
import { useApp } from 'ink'
import { Spinner } from '@inkjs/ui'
import chalk from 'chalk'
import { exec } from 'child_process'
import { getToken } from '../../utils/auth.js'
import { getConfig } from '../../config.js'
import type { ScreenProps } from '../types.js'

const WEB_URL = process.env['STRATANODEX_WEB_URL'] ?? 'https://stratanodex.com/login'

function openBrowser(url: string): void {
  const cmd =
    process.platform === 'win32'
      ? `start "" "${url}"`
      : process.platform === 'darwin'
        ? `open "${url}"`
        : `xdg-open "${url}"`
  exec(cmd)
}

export function LoginScreen({ replaceScreen, registerActions }: ScreenProps) {
  const { exit } = useApp()

  const quit = useCallback(() => exit(), [exit])

  useEffect(() => {
    registerActions({ onQuit: quit, onBack: quit })
  }, [registerActions, quit])

  useEffect(() => {
    if (process.env['STRATANODEX_GUEST'] === 'true') {
      replaceScreen('home')
      return
    }

    openBrowser(WEB_URL)

    const interval = setInterval(() => {
      if (getToken()) {
        clearInterval(interval)
        replaceScreen('home')
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [replaceScreen])

  const ice = chalk.hex('#00bfff')
  const dim = chalk.hex('#004477')
  const apiUrl = getConfig().apiUrl

  return (
    <Box flexDirection="column" paddingX={3} paddingY={2}>

      <Text bold color="yellow">Authentication required</Text>
      <Text> </Text>

      <Text>{ice('→')} Opening browser: {chalk.hex('#007799')(WEB_URL)}</Text>
      <Text> </Text>

      <Spinner label={dim('  Waiting for login...')} />
      <Text> </Text>

      <Text dimColor>API: {apiUrl}</Text>
      <Text> </Text>

      <Text dimColor>Browser didn't open? Run in another terminal:</Text>
      <Text>{chalk.hex('#00bfff').bold('  stratanodex login')}</Text>
      <Text> </Text>

      <Text dimColor>q to quit</Text>

    </Box>
  )
}
