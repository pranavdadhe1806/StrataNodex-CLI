import React, { useEffect, useCallback } from 'react'
import { Box, Text } from 'ink'
import { useAuth } from '../hooks/useAuth.js'
import type { ScreenProps } from '../types.js'

export function WelcomeScreen({ push, registerActions }: ScreenProps) {
  const { isLoggedIn, loading } = useAuth()

  const transition = useCallback(() => {
    // GUEST MODE — remove before production
    if (process.env['STRATANODEX_GUEST'] === 'true') {
      push('home')
      return
    }
    if (!loading) {
      push(isLoggedIn ? 'home' : 'login')
    }
  }, [isLoggedIn, loading, push])

  useEffect(() => {
    registerActions({ onEnter: transition, onUp: transition, onDown: transition })
  }, [registerActions, transition])

  useEffect(() => {
    const timer = setTimeout(transition, 1500)
    return () => clearTimeout(timer)
  }, [transition])

  return (
    <Box flexDirection="column" alignItems="center" paddingY={1}>
      <Text color="cyan" bold>
        ╔═══════════════════════════════╗
      </Text>
      <Text color="cyan" bold>
        ║ ║
      </Text>
      <Text color="cyan" bold>
        ║ S t r a t a N o d e x ║
      </Text>
      <Text color="cyan" bold>
        ║ ║
      </Text>
      <Text color="cyan" bold>
        ╚═══════════════════════════════╝
      </Text>
      <Box marginTop={1}>
        <Text dimColor>Your keyboard-driven task manager</Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>{loading ? 'Checking auth...' : 'Press any key to continue'}</Text>
      </Box>
    </Box>
  )
}
