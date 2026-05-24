// TagsScreen.tsx — Lists all user tags with colour swatches and empty state.
import React, { useEffect, useState, useCallback } from 'react'
import { Box, Text } from 'ink'
import chalk from 'chalk'
import { getTags } from '../../api/client.js'
import { Spinner } from '../components/Spinner.js'
import { Keybindings } from '../components/Keybindings.js'
import type { Tag } from '../../types/index.js'
import type { ScreenProps } from '../types.js'

export function TagsScreen({ pop, registerActions, width = 80 }: ScreenProps) {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    getTags()
      .then(setTags)
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
          {'  '}TAGS
        </Text>
      </Box>
      <Box marginBottom={1}>
        <Text>{divider}</Text>
      </Box>

      {/* ── Body ───────────────────────────────────────────────── */}
      {loading ? (
        <Spinner label="Loading tags..." />
      ) : error ? (
        <Box paddingLeft={2}>
          <Text color="#ff6b6b">✗ {error}</Text>
        </Box>
      ) : tags.length === 0 ? (
        <Box flexDirection="column" alignItems="flex-start" paddingLeft={2} marginTop={1}>
          <Text color="#8b949e">No tags found.</Text>
          <Box marginTop={1}>
            <Text color="#3a6a7a" dimColor>
              {'  '}Create tags from the web app or mobile app to organise your nodes.
            </Text>
          </Box>
          <Box marginTop={1}>
            <Text color="#3a6a7a" dimColor>
              {'  '}Tags will appear here once created.
            </Text>
          </Box>
        </Box>
      ) : (
        <Box flexDirection="column">
          {/* Column headers */}
          <Box paddingLeft={2} marginBottom={1}>
            <Text color="#3a6a7a" dimColor>
              {'  COLOUR   NAME'.padEnd(28)}ID
            </Text>
          </Box>
          {tags.map((tag) => {
            const colour = tag.color && tag.color !== '' ? tag.color : '#8b949e'
            return (
              <Box key={tag.id} paddingLeft={2} marginBottom={0}>
                <Text color={colour}>{'  ●  '}</Text>
                <Text color="white">{tag.name.padEnd(22)}</Text>
                <Text color="#3a6a7a" dimColor>
                  {tag.id}
                </Text>
              </Box>
            )
          })}
        </Box>
      )}

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
