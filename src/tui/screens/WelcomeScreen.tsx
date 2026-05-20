import React, { useEffect, useState, useRef } from 'react'
import { Box, Text, useInput } from 'ink'
import { Spinner } from '@inkjs/ui'
import chalk from 'chalk'
import { getToken } from '../../utils/auth.js'
import { getMe } from '../../api/client.js'
import type { ScreenProps } from '../types.js'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const { version } = require('../../../package.json') as { version: string }

const LOGO_LINE_1 = '█▀▀ ▀█▀ █▀█ ▄▀█ ▀█▀ ▄▀█   █▄ █ █▀█ █▀▄ █▀▀ ▀▄▀'
const LOGO_LINE_2 = '▄██  █  █▀▄ █▀█  █  █▀█   █ ▀█ █▄█ █▄▀ ██▄ █ █'

export function WelcomeScreen({ replaceScreen, height, width }: ScreenProps) {
  const [status, setStatus] = useState<'checking' | 'done' | 'error'>('checking')
  const done = useRef(false)

  const transition = (loggedIn: boolean) => {
    if (done.current) return
    done.current = true
    replaceScreen(loggedIn ? 'dashboard' : 'login')
  }

  useInput(() => {
    if (done.current) return
    transition(!!getToken())
  })

  useEffect(() => {
    const guestMode = process.env['STRATANODEX_GUEST'] === 'true'
    if (guestMode) {
      transition(true)
      return
    }

    const token = getToken()
    if (!token) {
      // No token at all — go to login
      const t = setTimeout(() => transition(false), 1200)
      return () => clearTimeout(t)
    }

    // Token exists — validate with the backend.
    // Retry on network/timeout errors (cold start), only go to login on 401.
    let cancelled = false
    const MAX_RETRIES = 3
    const RETRY_DELAY = 5000

    async function validateToken(attempt: number): Promise<void> {
      if (cancelled) return
      try {
        await getMe()
        if (cancelled) return
        setStatus('done')
        setTimeout(() => transition(true), 600)
      } catch (err: unknown) {
        if (cancelled) return
        const statusCode = (err as { response?: { status?: number } })?.response?.status
        if (statusCode === 401) {
          // Token is genuinely invalid/expired — go to login
          setStatus('error')
          setTimeout(() => transition(false), 1000)
          return
        }
        // Network error / timeout (cold start) — retry
        if (attempt < MAX_RETRIES) {
          setStatus('checking')
          setTimeout(() => validateToken(attempt + 1), RETRY_DELAY)
        } else {
          // All retries exhausted but token still exists — go home anyway
          // and let the API interceptor handle 401s later
          setStatus('done')
          setTimeout(() => transition(true), 600)
        }
      }
    }

    validateToken(1)
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Box
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height={height}
      width={width}
    >
      {/* Pixel logo — dim ghost (glow layer) */}
      <Text>{chalk.hex('#003355')(LOGO_LINE_1)}</Text>
      <Text>{chalk.hex('#004477')(LOGO_LINE_1)}</Text>

      {/* Pixel logo — bright core */}
      <Text>{chalk.hex('#00bfff').bold(LOGO_LINE_1)}</Text>
      <Text>{chalk.hex('#00bfff').bold(LOGO_LINE_2)}</Text>

      {/* Pixel logo — dim ghost (glow layer below) */}
      <Text>{chalk.hex('#004477')(LOGO_LINE_2)}</Text>
      <Text>{chalk.hex('#003355')(LOGO_LINE_2)}</Text>

      <Text> </Text>

      {/* Version */}
      <Text>{chalk.hex('#007799')(`CLI  ${version}`)}</Text>

      <Text> </Text>
      <Text> </Text>

      {/* Status */}
      {status === 'checking' && (
        <Spinner label={chalk.hex('#004477')('  checking connection...')} />
      )}
      {status === 'error' && (
        <Text>{chalk.hex('#440000')('connection failed · redirecting to login')}</Text>
      )}
    </Box>
  )
}
