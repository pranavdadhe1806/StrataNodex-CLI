import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Box, Text, useApp, useStdout } from 'ink'
import { useNavigation } from './hooks/useNavigation.js'
import { useAuth } from './hooks/useAuth.js'
import { useKeymap } from './hooks/useKeymap.js'
import { TopBar } from './components/TopBar.js'
import { CommandInput } from './components/CommandInput.js'
import { ErrorBoundary } from './components/ErrorBoundary.js'
import { WelcomeScreen } from './screens/WelcomeScreen.js'
import { LoginScreen } from './screens/LoginScreen.js'
import { HomeScreen } from './screens/HomeScreen.js'
import { ListsScreen } from './screens/ListsScreen.js'
import { TreeScreen } from './screens/TreeScreen.js'
import { DailyScreen } from './screens/DailyScreen.js'
import { DashboardScreen } from './screens/DashboardScreen.js'
import { executeCommand } from '../commands/executor.js'
import type { ActionHandlers } from './types.js'
import type { Screen } from '../commands/registry.js'
import type { Node } from '../types/index.js'

const TOP_HEIGHT = 5
const BOTTOM_BASE_ROWS = 3 // separator + prompt + hint

/** Map TUI screen names to the registry Screen type for autocomplete. */
const TUI_TO_REGISTRY: Record<string, Screen> = {
  home: 'folders',
  lists: 'lists',
  tree: 'nodes',
  daily: 'nodes',
  dashboard: 'nodes',
  welcome: 'global',
  login: 'global',
}

export function App() {
  const { exit } = useApp()
  const { stdout } = useStdout()
  const terminalHeight = stdout?.rows ?? 24
  const terminalWidth = stdout?.columns ?? 80

  const { currentScreen, push, pop, replaceScreen } = useNavigation()
  const { isLoggedIn } = useAuth()
  const [mode, setMode] = useState<'nav' | 'edit'>('nav')
  const activeHandlers = useRef<Partial<ActionHandlers>>({})
  const [cmdResult, setCmdResult] = useState<string | null>(null)
  /** Nodes available in the current screen (populated by TreeScreen/DailyScreen). */
  const [screenNodes, setScreenNodes] = useState<Node[]>([])

  const registerActions = useCallback((handlers: Partial<ActionHandlers>) => {
    activeHandlers.current = handlers
  }, [])

  useEffect(() => {
    activeHandlers.current = {}
    setScreenNodes([])
    setCmdResult(null)
  }, [currentScreen.name])

  const handleCommandSubmit = useCallback(
    async (raw: string) => {
      setMode('nav')
      // Let the active screen handle it first (for nav commands like /back)
      if (activeHandlers.current.onCommand) {
        activeHandlers.current.onCommand(raw)
      }

      const registryScreen: Screen = TUI_TO_REGISTRY[currentScreen.name] ?? 'global'
      const p = currentScreen.params ?? {}

      const result = await executeCommand(raw, registryScreen, {
        listId: p['listId'],
        folderId: p['folderId'],
        currentNodes: screenNodes,
        navigate: (screen, params) => {
          if (screen === '__pop__') pop()
          else push(screen, params)
        },
        exit,
        refetch: () => activeHandlers.current.onCommand?.('/refresh'),
      })

      if (result.message) setCmdResult(result.message)
      setTimeout(() => setCmdResult(null), 3000)
    },
    [currentScreen, screenNodes, push, pop, exit]
  )

  useKeymap(mode, {
    onUp: () => activeHandlers.current.onUp?.(),
    onDown: () => activeHandlers.current.onDown?.(),
    onLeft: () => activeHandlers.current.onLeft?.(),
    onRight: () => activeHandlers.current.onRight?.(),
    onEnter: () => activeHandlers.current.onEnter?.(),
    onBack: () => {
      if (mode === 'edit') {
        setMode('nav')
        return
      }
      activeHandlers.current.onBack?.()
    },
    onEsc: () => {
      setMode('nav')
    },
    onQuit: () => {
      if (mode === 'nav') {
        const h = activeHandlers.current.onQuit
        if (h) h()
        else exit()
      }
    },
  })

  const middleHeight = Math.max(3, terminalHeight - TOP_HEIGHT - BOTTOM_BASE_ROWS)
  const screenProps = {
    push,
    pop,
    replaceScreen,
    registerActions,
    height: middleHeight,
    width: terminalWidth,
  }
  const registryScreen: Screen = TUI_TO_REGISTRY[currentScreen.name] ?? 'global'

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
            onNodesLoaded={setScreenNodes}
          />
        )
      case 'daily':
        return <DailyScreen {...screenProps} />
      case 'dashboard':
        return <DashboardScreen {...screenProps} />
      default:
        return <Text color="red">Unknown screen: {name}</Text>
    }
  }

  return (
    <Box flexDirection="column" width={terminalWidth} height={terminalHeight}>
      {/* TOP — fixed, never scrolls */}
      <Box height={TOP_HEIGHT} flexShrink={0}>
        <TopBar width={terminalWidth} hasToken={isLoggedIn} />
      </Box>

      {/* MIDDLE — screen content, shrinks when autocomplete overlay opens */}
      <Box flexGrow={1} flexShrink={1} overflow="hidden" flexDirection="column">
        <ErrorBoundary>{renderScreen()}</ErrorBoundary>
        {cmdResult && (
          <Box paddingX={2} marginTop={1}>
            <Text color={cmdResult.startsWith('✓') ? '#00c896' : 'red'} dimColor>
              {cmdResult}
            </Text>
          </Box>
        )}
      </Box>

      {/* BOTTOM — autocomplete overlay + input (never pushed off-screen) */}
      <Box flexShrink={0} flexDirection="column">
        <CommandInput
          screen={registryScreen}
          currentNodes={screenNodes}
          width={terminalWidth}
          onSubmit={handleCommandSubmit}
        />
      </Box>
    </Box>
  )
}
