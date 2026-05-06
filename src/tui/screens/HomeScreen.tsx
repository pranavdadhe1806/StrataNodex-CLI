// Home screen - folders list
import React, { useState, useEffect, useCallback } from 'react'
import { Box, Text } from 'ink'
import { useApp } from 'ink'
import { useFolders } from '../hooks/useFolders.js'
import { FolderItem } from '../components/FolderItem.js'
import { Keybindings } from '../components/Keybindings.js'
import { Spinner } from '../components/Spinner.js'
import { createFolder, deleteFolder } from '../../api/client.js'
import type { ScreenProps } from '../types.js'

const BINDINGS = '[↑↓] navigate  [Enter] open  [n] new  [e] edit  [d] delete  [q] quit'

export function HomeScreen({ push, registerActions }: ScreenProps) {
  const { folders, loading, error, refetch } = useFolders()
  const [cursor, setCursor] = useState(0)
  const [status, setStatus] = useState<string | null>(null)
  const { exit } = useApp()

  const handleCommand = useCallback(
    async (cmd: string) => {
      const parts = cmd.trim().split(/\s+/)
      const verb = parts[0]
      const arg = parts.slice(1).join(' ')
      if (verb === '/retry') {
        refetch()
        return
      }
      if (verb === '/add' && arg) {
        setStatus('Creating folder...')
        createFolder(arg)
          .then(() => {
            setStatus(`✓ Created "${arg}"`)
            refetch()
          })
          .catch((e: Error) => setStatus(`✗ ${e.message}`))
      } else if (verb === '/delete') {
        const folder = folders[cursor]
        if (!folder) return
        setStatus('Deleting...')
        deleteFolder(folder.id)
          .then(() => {
            setStatus(`✓ Deleted "${folder.name}"`)
            setCursor(0)
            refetch()
          })
          .catch((e: Error) => setStatus(`✗ ${e.message}`))
      } else if (verb === '/quit' || verb === 'q') {
        exit()
      }
    },
    [folders, cursor, refetch, exit]
  )

  useEffect(() => {
    const len = folders.length
    registerActions({
      onUp: () => setCursor((c) => (c > 0 ? c - 1 : len - 1)),
      onDown: () => setCursor((c) => (c < len - 1 ? c + 1 : 0)),
      onEnter: () => {
        const folder = folders[cursor]
        if (folder) push('lists', { folderId: folder.id, folderName: folder.name })
      },
      onBack: () => {},
      onQuit: () => exit(),
      onCommand: handleCommand,
    })
  }, [folders, cursor, push, exit, registerActions, handleCommand])

  if (loading)
    return (
      <Box paddingX={2}>
        <Spinner label="Loading folders..." />
      </Box>
    )

  if (error)
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Text dimColor>Server offline or unreachable</Text>
        <Text dimColor>{error}</Text>
        <Text> </Text>
        <Text dimColor>Type /retry to try again · /add &lt;name&gt; to work offline</Text>
      </Box>
    )

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      {/* Title — always visible */}
      <Box marginBottom={1}>
        <Text bold color="#00bfff">
          📁 Your Folders
        </Text>
      </Box>

      {/* Empty state or folder list */}
      {folders.length === 0 ? (
        <Box>
          <Text color="#8b949e" dimColor>
            No folders yet. Type{' '}
          </Text>
          <Text color="#00bfff">/new folder {'<name>'}</Text>
          <Text color="#8b949e" dimColor>
            {' '}
            to create one.
          </Text>
        </Box>
      ) : (
        folders.map((folder, i) => (
          <FolderItem key={folder.id} folder={folder} isSelected={i === cursor} />
        ))
      )}

      {/* Status message (create/delete feedback) */}
      {status && (
        <Box marginTop={1}>
          <Text dimColor>{status}</Text>
        </Box>
      )}

      {/* Keybindings hint */}
      <Box marginTop={1}>
        <Keybindings bindings={BINDINGS} />
      </Box>
    </Box>
  )
}
