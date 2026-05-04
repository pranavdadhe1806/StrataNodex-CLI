import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Box, Text, useInput } from 'ink'
import { Spinner } from '@inkjs/ui'
import open from 'open'
import { createCliSession, pollCliSession } from '../../api/client.js'
import { saveToken } from '../../utils/auth.js'
import { ApiError } from '../../api/ApiError.js'
import chalk from 'chalk'
import type { ScreenProps } from '../types.js'

const AUTH_URL_BASE = 'https://stratanodex-landing-page.vercel.app/#auth'
const POLL_INTERVAL_MS = 2000

type LoginState = 'creating' | 'waiting' | 'success' | 'error'

export function LoginScreen({ replaceScreen, registerActions }: ScreenProps) {
  const [state, setState] = useState<LoginState>('creating')
  const [errorMsg, setErrorMsg] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Use a ref for the attempt counter so re-runs are stable
  const attemptRef = useRef(0)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const startLogin = useCallback(async () => {
    stopPolling()
    setState('creating')
    setErrorMsg('')

    const attempt = ++attemptRef.current

    try {
      // 1. Create CLI session on backend
      const { code } = await createCliSession()

      if (attemptRef.current !== attempt) return // stale attempt

      // 2. Open browser to auth page — hash-routed, ?session= is inside the hash
      await open(`${AUTH_URL_BASE}?session=${code}`)

      setState('waiting')

      // 3. Poll until complete or error
      pollRef.current = setInterval(async () => {
        if (attemptRef.current !== attempt) {
          stopPolling()
          return
        }

        try {
          const result = await pollCliSession(code)

          if (result.status === 'complete' && result.token) {
            stopPolling()
            saveToken(result.token)
            setState('success')
            // Brief flash, then navigate
            setTimeout(() => replaceScreen('home'), 600)
          }
          // status === 'pending' → keep polling, no state change
        } catch (_err: unknown) {
          stopPolling()
          if (attemptRef.current !== attempt) return

          const statusCode = _err instanceof ApiError ? _err.statusCode : 0
          if (statusCode === 410) {
            setErrorMsg('Session expired. Press R to retry.')
          } else if (statusCode === 404) {
            setErrorMsg('Session not found. Press R to retry.')
          } else {
            setErrorMsg('Connection lost. Press R to retry.')
          }
          setState('error')
        }
      }, POLL_INTERVAL_MS)
    } catch (e: unknown) {
      if (attemptRef.current !== attempt) return
      const status = e instanceof ApiError ? e.statusCode : 0
      if (status === 429) {
        setErrorMsg('Too many retries. Wait a moment then press R.')
      } else {
        setErrorMsg('Cannot reach backend. Check your connection and press R.')
      }
      setState('error')
    }
  }, [stopPolling, replaceScreen])

  // Register navigation actions
  useEffect(() => {
    registerActions({
      onBack: () => {
        stopPolling()
        replaceScreen('welcome')
      },
      onQuit: () => {
        stopPolling()
        replaceScreen('welcome')
      },
    })
  }, [registerActions, stopPolling, replaceScreen])

  // Mount-only effect — startLogin and stopPolling are stable refs
  useEffect(() => {
    startLogin()
    return stopPolling
  }, [])

  // Keyboard: R = retry, Q/ESC = cancel
  useInput((input, key) => {
    if (state === 'error' && (input === 'r' || input === 'R')) {
      startLogin()
    }
    if (input === 'q' || input === 'Q' || key.escape) {
      stopPolling()
      replaceScreen('welcome')
    }
  })

  return (
    <Box flexDirection="column" paddingX={3} paddingY={2} gap={1}>
      <Text bold color="#00bfff">
        Authentication
      </Text>

      {state === 'creating' && (
        <Spinner label={chalk.hex('#8b949e')('  Setting up login session...')} />
      )}

      {state === 'waiting' && (
        <Box flexDirection="column" gap={1}>
          <Text color="#00bfff">{'>'} Browser opened — complete login there</Text>
          <Spinner label={chalk.hex('#8b949e')('  Waiting for authentication...')} />
          <Text color="#8b949e" dimColor>
            Q to cancel
          </Text>
        </Box>
      )}

      {state === 'error' && (
        <Box flexDirection="column" gap={1}>
          <Text color="red">✕ {errorMsg}</Text>
          <Text color="#8b949e" dimColor>
            R to retry · Q to quit
          </Text>
        </Box>
      )}

      {state === 'success' && <Text color="#00c896">✓ Logged in successfully</Text>}
    </Box>
  )
}
