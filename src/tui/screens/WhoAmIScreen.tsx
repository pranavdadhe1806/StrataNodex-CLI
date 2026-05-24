// WhoAmIScreen.tsx — Displays full account details for the logged-in user.
import React, { useEffect, useState, useCallback } from 'react'
import { Box, Text } from 'ink'
import chalk from 'chalk'
import { getMe, getStreak } from '../../api/client.js'
import { Spinner } from '../components/Spinner.js'
import { Keybindings } from '../components/Keybindings.js'
import type { User } from '../../types/index.js'
import type { ScreenProps } from '../types.js'

const LABEL_W = 16 // fixed label column width
const NA = '— not added'

function Field({
  label,
  value,
  verified,
}: {
  label: string
  value: string | null
  verified?: boolean
}) {
  const displayValue = value ?? NA
  const isBlank = !value

  return (
    <Box paddingLeft={4} marginBottom={0}>
      <Text color="#8b949e">{label.padEnd(LABEL_W)}</Text>
      <Text color={isBlank ? '#3a6a7a' : 'white'} dimColor={isBlank}>
        {displayValue}
      </Text>
      {verified === true && <Text color="#00c896">{'  '}✓ verified</Text>}
      {verified === false && (
        <Text color="#ff6b6b" dimColor>
          {'  '}✗ unverified
        </Text>
      )}
    </Box>
  )
}

export function WhoAmIScreen({ pop, registerActions, width = 80 }: ScreenProps) {
  const [user, setUser] = useState<User | null>(null)
  const [streak, setStreak] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([getMe(), getStreak()])
      .then(([u, s]) => {
        setUser(u)
        setStreak(s.streak)
      })
      .catch((e: unknown) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    registerActions({ onBack: pop })
    load()
  }, [registerActions, pop, load])

  const divider = chalk.hex('#0a2a33')('─'.repeat(Math.min(width - 4, 76)))

  return (
    <Box flexDirection="column" paddingX={2} width={width}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <Box marginBottom={1}>
        <Text color="#00bfff" bold>
          {'  '}ACCOUNT
        </Text>
      </Box>
      <Box marginBottom={1}>
        <Text>{divider}</Text>
      </Box>

      {/* ── Body ───────────────────────────────────────────────── */}
      {loading ? (
        <Spinner label="Fetching account details..." />
      ) : error ? (
        <Box paddingLeft={4}>
          <Text color="#ff6b6b">✗ {error}</Text>
        </Box>
      ) : user ? (
        <Box flexDirection="column">
          {/* Avatar initial */}
          <Box paddingLeft={4} marginBottom={1}>
            <Text color="#00bfff" bold>
              {user.name
                ? user.name
                    .trim()
                    .split(/\s+/)
                    .map((w) => w[0]?.toUpperCase() ?? '')
                    .join('')
                : (user.email[0]?.toUpperCase() ?? '?')}
            </Text>
            <Text color="#3a6a7a" dimColor>
              {'  '}@stratanodex
            </Text>
          </Box>

          <Box marginBottom={1}>
            <Text>{divider}</Text>
          </Box>

          {/* Fields */}
          <Field label="Name" value={user.name} />
          {/* Username is not yet in the API — shown as not added */}
          <Field label="Username" value={null} />
          <Field label="Email" value={user.email} verified={user.isEmailVerified} />
          <Field
            label="Mobile No."
            value={user.phone}
            verified={user.phone ? user.isPhoneVerified : undefined}
          />

          <Box marginTop={1} marginBottom={1}>
            <Text>{divider}</Text>
          </Box>

          {/* Streak + 2FA */}
          {streak !== null && (
            <Box paddingLeft={4} marginBottom={0}>
              <Text color="#8b949e">{'Current Streak'.padEnd(LABEL_W)}</Text>
              <Text color={streak > 0 ? '#ffa500' : 'white'}>
                {streak} {streak === 1 ? 'day' : 'days'} {streak >= 7 ? '🔥' : ''}
              </Text>
            </Box>
          )}
          <Box paddingLeft={4} marginBottom={0}>
            <Text color="#8b949e">{'2FA'.padEnd(LABEL_W)}</Text>
            <Text color={user.twoFactorEnabled ? '#00c896' : '#8b949e'}>
              {user.twoFactorEnabled ? `enabled (${user.twoFactorMethod ?? 'app'})` : '— disabled'}
            </Text>
          </Box>
        </Box>
      ) : null}

      {/* ── Footer ─────────────────────────────────────────────── */}
      <Box marginTop={1}>
        <Text>{divider}</Text>
      </Box>
      <Box paddingLeft={1}>
        <Keybindings bindings="[b] back  [/] command" />
      </Box>
    </Box>
  )
}
