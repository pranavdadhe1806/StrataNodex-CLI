import React, { useEffect, useCallback } from 'react'
import { Box, Text } from 'ink'
import { useApp } from 'ink'
import { getToken } from '../../utils/auth.js'
import type { ScreenProps } from '../types.js'

export function LoginScreen({ push, registerActions }: ScreenProps) {
  const { exit } = useApp()

  const quit = useCallback(() => exit(), [exit])

  useEffect(() => {
    registerActions({ onQuit: quit, onBack: quit })
  }, [registerActions, quit])

  useEffect(() => {
    const interval = setInterval(() => {
      if (getToken()) {
        clearInterval(interval)
        push('home')
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [push])

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Text bold color="yellow">
        Login required
      </Text>
      <Box marginTop={1}>
        <Text>Run this command in another terminal to authenticate:</Text>
      </Box>
      <Box marginTop={1}>
        <Text color="cyan" bold>
          {' '}
          stratanodex login
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Waiting for login... (checking every 2s)</Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Press q to quit</Text>
      </Box>
    </Box>
  )
}
