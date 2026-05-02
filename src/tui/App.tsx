import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Box, Text, useApp, useStdout } from 'ink'
import { useNavigation } from './hooks/useNavigation.js'
import { useAuth } from './hooks/useAuth.js'
import { useKeymap } from './hooks/useKeymap.js'
import { useCommandInput } from './hooks/useCommandInput.js'
import { TopBar } from './components/TopBar.js'
import { BottomBar } from './components/BottomBar.js'
import { WelcomeScreen } from './screens/WelcomeScreen.js'
import { LoginScreen } from './screens/LoginScreen.js'
import { HomeScreen } from './screens/HomeScreen.js'
import { ListsScreen } from './screens/ListsScreen.js'
import { TreeScreen } from './screens/TreeScreen.js'
import { DailyScreen } from './screens/DailyScreen.js'
import type { ActionHandlers } from './types.js'

const TOP_HEIGHT = 5
const BOTTOM_HEIGHT = 3

const SCREEN_HINTS: Record<string, string[]> = {
  welcome: [],
  login: ['<email>', '<password>', '<2fa-code>', '/exit'],
  home: ['/add', '/exit', '/help', '/daily'],
  lists: ['/add', '/delete', '/back', '/exit', '/help'],
  tree: ['/add', '/done', '/delete', '/daily', '/exit', '/help'],
  daily: ['/done', '/list', '/exit', '/help'],
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

  const registerActions = useCallback((handlers: Partial<ActionHandlers>) => {
    activeHandlers.current = handlers
  }, [])

  useEffect(() => {
    activeHandlers.current = {}
  }, [currentScreen.name])

  const onScreenCommand = useCallback((raw: string) => {
    activeHandlers.current.onCommand?.(raw)
  }, [])

  const { inputValue, setInputValue, handleSubmit } = useCommandInput({
    onExit: () => exit(),
    onNavigate: (screen, params) => push(screen, params),
    onScreenCommand,
  })

  const onInputSubmit = useCallback(
    (val: string) => {
      handleSubmit(val)
      setMode('nav')
    },
    [handleSubmit]
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
        setInputValue('')
        return
      }
      activeHandlers.current.onBack?.()
    },
    onEsc: () => {
      setMode('nav')
      setInputValue('')
    },
    onQuit: () => {
      if (mode === 'nav') {
        const h = activeHandlers.current.onQuit
        if (h) h()
        else exit()
      }
    },
  })

  const middleHeight = Math.max(3, terminalHeight - TOP_HEIGHT - BOTTOM_HEIGHT)
  const screenProps = { push, pop, replaceScreen, registerActions, height: middleHeight, width: terminalWidth }

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

  const hints = SCREEN_HINTS[currentScreen.name] ?? []

  return (
    <Box flexDirection="column" width={terminalWidth} height={terminalHeight}>

      {/* TOP — fixed, never scrolls */}
      <Box height={TOP_HEIGHT} flexShrink={0}>
        <TopBar width={terminalWidth} hasToken={isLoggedIn} />
      </Box>

      {/* MIDDLE — scrollable, changes per screen */}
      <Box
        height={middleHeight}
        flexShrink={0}
        flexGrow={0}
        overflow="hidden"
        flexDirection="column"
      >
        {renderScreen()}
      </Box>

      {/* BOTTOM — fixed, always typeable */}
      <Box height={BOTTOM_HEIGHT} flexShrink={0}>
        <BottomBar
          value={inputValue}
          onChange={(v) => {
            setInputValue(v)
            if (v.length > 0) setMode('edit')
          }}
          onSubmit={onInputSubmit}
          width={terminalWidth}
          hints={hints}
        />
      </Box>

    </Box>
  )
}
