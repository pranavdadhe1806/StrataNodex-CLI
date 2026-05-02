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
    replaceScreen(loggedIn ? 'home' : 'login')
  }

  useInput(() => {
    if (done.current) return
    transition(!!getToken())
  })

  useEffect(() => {
    // TODO: remove guest bypass when website login flow is ready
    const guestMode = process.env['STRATANODEX_GUEST'] === 'true'
    if (guestMode) {
      transition(true)
      return
    }

    const token = getToken()
    if (!token) {
      const t = setTimeout(() => transition(false), 1200)
      return () => clearTimeout(t)
    }

    getMe()
      .then(() => {
        setStatus('done')
        const t = setTimeout(() => transition(true), 1200)
        return () => clearTimeout(t)
      })
      .catch(() => {
        setStatus('error')
        const t = setTimeout(() => transition(false), 1500)
        return () => clearTimeout(t)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
