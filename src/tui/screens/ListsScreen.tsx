// Lists screen
import React, { useState, useEffect, useCallback } from 'react'
import { Box, Text } from 'ink'
import { useLists } from '../hooks/useLists.js'
import { ListItem } from '../components/ListItem.js'
import { Breadcrumb } from '../components/Breadcrumb.js'
import { Keybindings } from '../components/Keybindings.js'
import { createList, deleteList } from '../../api/client.js'
import type { ScreenProps } from '../types.js'

const BINDINGS = '[↑↓] navigate  [Enter] open  [b] back  [n] new  [e] edit  [d] delete'

interface Props extends ScreenProps {
  folderId: string
  folderName?: string
}

export function ListsScreen({ push, pop, registerActions, folderId, folderName }: Props) {
  const { lists, loading, error, refetch } = useLists(folderId)
  const [cursor, setCursor] = useState(0)
  const [status, setStatus] = useState<string | null>(null)

  const handleCommand = useCallback(
    async (cmd: string) => {
      const parts = cmd.trim().split(/\s+/)
      const verb = parts[0]
      const arg = parts.slice(1).join(' ')
      if (verb === '/add' && arg) {
        setStatus('Creating list...')
        createList(arg, folderId)
          .then(() => {
            setStatus(`✓ Created "${arg}"`)
            refetch()
          })
          .catch((e: Error) => setStatus(`✗ ${e.message}`))
      } else if (verb === '/delete') {
        const list = lists[cursor]
        if (!list) return
        setStatus('Deleting...')
        deleteList(list.id)
          .then(() => {
            setStatus(`✓ Deleted "${list.name}"`)
            setCursor(0)
            refetch()
          })
          .catch((e: Error) => setStatus(`✗ ${e.message}`))
      } else if (verb === '/back') {
        pop()
      }
    },
    [lists, cursor, folderId, refetch, pop]
  )

  useEffect(() => {
    const len = lists.length
    registerActions({
      onUp: () => setCursor((c) => (c > 0 ? c - 1 : Math.max(0, len - 1))),
      onDown: () => setCursor((c) => (c < len - 1 ? c + 1 : 0)),
      onEnter: () => {
        const list = lists[cursor]
        if (list)
          push('tree', { listId: list.id, listName: list.name, folderName: folderName ?? '' })
      },
      onBack: () => pop(),
      onCommand: handleCommand,
    })
  }, [lists, cursor, push, pop, folderName, registerActions, handleCommand])

  const breadcrumbParts = folderName ? [folderName, 'Lists'] : ['Lists']

  if (loading)
    return (
      <Box paddingX={2}>
        <Text dimColor>Loading lists...</Text>
      </Box>
    )
  if (error)
    return (
      <Box paddingX={2}>
        <Text color="red">✗ {error}</Text>
      </Box>
    )
  if (lists.length === 0) {
    return (
      <Box flexDirection="column" paddingX={2}>
        <Breadcrumb parts={breadcrumbParts} />
        <Box marginTop={1}>
          <Text dimColor>No lists yet. Type /add &lt;name&gt; to create one.</Text>
        </Box>
      </Box>
    )
  }

  return (
    <Box flexDirection="column" paddingX={2}>
      <Breadcrumb parts={breadcrumbParts} />
      <Box marginTop={1} marginBottom={1}>
        <Text bold>📋 Lists</Text>
      </Box>
      {lists.map((list, i) => (
        <ListItem key={list.id} list={list} isSelected={i === cursor} />
      ))}
      {status && (
        <Box marginTop={1}>
          <Text dimColor>{status}</Text>
        </Box>
      )}
      <Box marginTop={1}>
        <Keybindings bindings={BINDINGS} />
      </Box>
    </Box>
  )
}
