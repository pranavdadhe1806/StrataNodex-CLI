import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Box, Text, useApp } from 'ink'
import TextInput from 'ink-text-input'
import { createRequire } from 'module'
import { useNavigation } from './hooks/useNavigation.js'
import { useAuth } from './hooks/useAuth.js'
import { useKeymap } from './hooks/useKeymap.js'
import { WelcomeScreen } from './screens/WelcomeScreen.js'
import { LoginScreen } from './screens/LoginScreen.js'
import { HomeScreen } from './screens/HomeScreen.js'
import { ListsScreen } from './screens/ListsScreen.js'
import { TreeScreen } from './screens/TreeScreen.js'
import { DailyScreen } from './screens/DailyScreen.js'
import type { ActionHandlers } from './types.js'

const require = createRequire(import.meta.url)
const pkg = require('../../package.json') as { version: string }

const FIXED_ROWS = 13

function getPlaceholder(screen: string): string {
  switch (screen) {
    case 'home':
      return '/search  /add <folder>  /delete  /quit'
    case 'lists':
      return '/search  /add <list>  /delete  /back'
    case 'tree':
      return '/add <title>  /done <n>  /delete <n>  /back  /search'
    case 'daily':
      return '/done <n>  /back'
    default:
      return 'Type a command...'
  }
}

export function App() {
  const { exit } = useApp()
  const { currentScreen, push, pop } = useNavigation()
  const { user } = useAuth()
  const [mode, setMode] = useState<'nav' | 'edit'>('nav')
  const [input, setInput] = useState('')
  const [termRows, setTermRows] = useState(process.stdout.rows || 24)
  const [scrollOffset, setScrollOffset] = useState(0)
  const activeHandlers = useRef<Partial<ActionHandlers>>({})

  const registerActions = useCallback((handlers: Partial<ActionHandlers>) => {
    activeHandlers.current = handlers
  }, [])

  useEffect(() => {
    activeHandlers.current = {}
    setScrollOffset(0)
  }, [currentScreen.name])

  useEffect(() => {
    const handler = () => setTermRows(process.stdout.rows || 24)
    process.stdout.on('resize', handler)
    return () => {
      process.stdout.off('resize', handler)
    }
  }, [])

  const handleCommand = useCallback((cmd: string) => {
    if (!cmd.trim()) return
    activeHandlers.current.onCommand?.(cmd.trim())
    setInput('')
    setMode('nav')
  }, [])

  useKeymap(mode, {
    onUp: () => {
      if (activeHandlers.current.onUp) activeHandlers.current.onUp()
      else setScrollOffset((o) => Math.max(0, o - 1))
    },
    onDown: () => {
      if (activeHandlers.current.onDown) activeHandlers.current.onDown()
      else setScrollOffset((o) => o + 1)
    },
    onLeft: () => activeHandlers.current.onLeft?.(),
    onRight: () => activeHandlers.current.onRight?.(),
    onEnter: () => activeHandlers.current.onEnter?.(),
    onBack: () => {
      if (mode === 'edit') {
        setMode('nav')
        setInput('')
        return
      }
      activeHandlers.current.onBack?.()
    },
    onEsc: () => {
      setMode('nav')
      setInput('')
    },
    onQuit: () => {
      if (mode === 'nav') {
        const h = activeHandlers.current.onQuit
        if (h) h()
        else exit()
      }
    },
  })

  const dynamicHeight = Math.max(3, termRows - FIXED_ROWS)
  const userName = user?.name ?? user?.email ?? null

  const screenProps = { push, pop, registerActions }

  function renderScreen() {
    const name = currentScreen.name
    const p = currentScreen.params ?? {}
    switch (name) {
      case 'welcome':
        return <WelcomeScreen {...screenProps} />
      case 'login':
        return <LoginScreen {...screenProps} />
      case 'home':
        return <HomeScreen {...screenProps} />
      case 'lists':
        return (
          <ListsScreen
            {...screenProps}
            folderId={p['folderId'] ?? ''}
            folderName={p['folderName']}
          />
        )
      case 'tree':
        return (
          <TreeScreen
            {...screenProps}
            listId={p['listId'] ?? ''}
            listName={p['listName']}
            folderName={p['folderName']}
          />
        )
      case 'daily':
        return <DailyScreen {...screenProps} />
      default:
        return <Text color="red">Unknown screen: {name}</Text>
    }
  }

  const sectionLabel =
    currentScreen.params?.['listName'] ?? currentScreen.params?.['folderName'] ?? 'Output Section'

  return (
    <Box
      borderStyle="round"
      flexDirection="column"
      height={termRows}
      width={process.stdout.columns || 80}
    >
      {/* Zone 1 — Header */}
      <Box flexShrink={0} flexDirection="column" alignItems="center" paddingY={1}>
        <Text bold color="white">
          StrataNodex - CLI
        </Text>
        <Text dimColor>v {pkg.version}</Text>
        <Text dimColor>{userName ? `Welcome Back, ${userName}` : 'Welcome, Guest'}</Text>
      </Box>

      {/* Zone 2 — Output */}
      <Box flexGrow={1} borderStyle="single" flexDirection="column">
        <Text bold> {sectionLabel} </Text>
        <Box height={dynamicHeight} overflow="hidden" flexDirection="column">
          {renderScreen()}
        </Box>
      </Box>

      {/* Zone 3 — Input Bar */}
      <Box borderStyle="single" flexShrink={0} paddingX={2}>
        <TextInput
          value={input}
          onChange={(v) => {
            setInput(v)
            if (v.length > 0) setMode('edit')
          }}
          onSubmit={handleCommand}
          placeholder={getPlaceholder(currentScreen.name)}
        />
      </Box>
    </Box>
  )
}
