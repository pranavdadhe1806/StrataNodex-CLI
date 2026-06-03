// AiScreen.tsx — Interactive AI chat screen for the TUI.
// Supports persistent sessions, operation execution, and natural language input.

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Box, Text, useInput } from 'ink'
import TextInput from 'ink-text-input'
import chalk from 'chalk'
import { Spinner } from '../components/Spinner.js'
import { chatWithAi, getAiSessions, getAiSession } from '../../api/ai.js'
import { executeAiOperations } from '../../utils/aiOperationExecutor.js'
import type { ScreenProps } from '../types.js'
import type { AiSession } from '../../api/ai.js'

interface AiScreenProps extends ScreenProps {
  initialMessage?: string
  folderId?: string
  listId?: string
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export const AiScreen: React.FC<AiScreenProps> = ({
  registerActions,
  pop,
  height = 20,
  width = 80,
  initialMessage,
  folderId,
  listId,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [sessionTitle, setSessionTitle] = useState('New Chat')
  const [showSessions, setShowSessions] = useState(false)
  const [sessions, setSessions] = useState<AiSession[]>([])
  const [sessionCursor, setSessionCursor] = useState(0)
  const [scrollOffset, setScrollOffset] = useState(0)
  const initialSent = useRef(false)

  // Register back action
  useEffect(() => {
    registerActions({
      onBack: () => pop(),
    })
  }, [registerActions, pop])

  // Send a message to the AI
  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || isLoading) return

      const userMsg: ChatMessage = { role: 'user', content: message.trim() }
      setMessages((prev) => [...prev, userMsg])
      setIsLoading(true)

      try {
        const currentContext: { folderId?: string; listId?: string } = {}
        if (folderId) currentContext.folderId = folderId
        if (listId) currentContext.listId = listId

        const response = await chatWithAi(message.trim(), activeSessionId, currentContext)

        // Track session
        if (!activeSessionId && response.sessionId) {
          setActiveSessionId(response.sessionId)
          setSessionTitle(message.trim().slice(0, 50))
        }

        // Execute operations
        if (response.operations?.length > 0) {
          const results = await executeAiOperations(response.operations)
          const resultLines = results.map((r) => r.message).join('\n')
          if (resultLines) {
            setMessages((prev) => [...prev, { role: 'system', content: resultLines }])
          }
        }

        // Show assistant response
        const parts: string[] = []
        if (response.clarificationNeeded) {
          parts.push(response.clarificationNeeded)
        } else {
          if (response.confirmation) parts.push(response.confirmation)
          if (response.followUpQuestion) parts.push(response.followUpQuestion)
        }
        if (parts.length > 0) {
          setMessages((prev) => [...prev, { role: 'assistant', content: parts.join('\n\n') }])
        }
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Error: ${(err as Error).message}` },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [activeSessionId, folderId, listId, isLoading]
  )

  // Auto-send initial message (one-shot mode)
  useEffect(() => {
    if (initialMessage && !initialSent.current) {
      initialSent.current = true
      sendMessage(initialMessage)
    }
  }, [initialMessage, sendMessage])

  // Handle special commands within the AI screen
  const handleSubmit = useCallback(
    (value: string) => {
      const trimmed = value.trim()
      if (!trimmed) return

      if (trimmed === '/back') {
        pop()
        return
      }

      if (trimmed === '/new') {
        setMessages([])
        setActiveSessionId(null)
        setSessionTitle('New Chat')
        setScrollOffset(0)
        setInputValue('')
        return
      }

      if (trimmed === '/sessions') {
        getAiSessions()
          .then((s) => {
            setSessions(s)
            setSessionCursor(0)
            setShowSessions(true)
          })
          .catch(() => {
            setMessages((prev) => [
              ...prev,
              { role: 'system', content: '⚠ Failed to load sessions' },
            ])
          })
        setInputValue('')
        return
      }

      setInputValue('')
      sendMessage(trimmed)
    },
    [pop, sendMessage]
  )

  // Load a session from the session list
  const loadSession = useCallback(async (session: AiSession) => {
    try {
      const detail = await getAiSession(session.id)
      setMessages(
        detail.messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }))
      )
      setActiveSessionId(session.id)
      setSessionTitle(session.title)
      setShowSessions(false)
      setScrollOffset(0)
    } catch {
      setMessages((prev) => [...prev, { role: 'system', content: '⚠ Failed to load session' }])
      setShowSessions(false)
    }
  }, [])

  // Handle input for session list navigation
  useInput((input, key) => {
    if (!showSessions) {
      // Scroll messages with arrow keys when not in session picker
      if (key.upArrow) {
        setScrollOffset((prev) => Math.max(0, prev - 1))
        return
      }
      if (key.downArrow) {
        setScrollOffset((prev) => prev + 1)
        return
      }
      return
    }
    if (key.upArrow) {
      setSessionCursor((c) => Math.max(0, c - 1))
    } else if (key.downArrow) {
      setSessionCursor((c) => Math.min(sessions.length - 1, c + 1))
    } else if (key.return) {
      const selected = sessions[sessionCursor]
      if (selected) loadSession(selected)
    } else if (key.escape) {
      setShowSessions(false)
    }
  })

  // ─── Rendering ──────────────────────────────────────────────────────────

  const borderLine = chalk.hex('#0a2a33')('─'.repeat(width))
  const headerHeight = 2
  const inputHeight = 3
  const chatHeight = Math.max(3, (height || 20) - headerHeight - inputHeight)

  // Build message lines for rendering
  const messageLines: { text: string; color: string }[] = []
  for (const msg of messages) {
    if (msg.role === 'user') {
      messageLines.push({ text: `  You: ${msg.content}`, color: '#00bfff' })
    } else if (msg.role === 'assistant') {
      // Wrap long lines
      const lines = msg.content.split('\n')
      for (const line of lines) {
        messageLines.push({ text: `  🤖 ${line}`, color: '#e6edf3' })
      }
    } else {
      // system (operation results)
      const lines = msg.content.split('\n')
      for (const line of lines) {
        messageLines.push({ text: `     ${line}`, color: '#00c896' })
      }
    }
    messageLines.push({ text: '', color: '#555' }) // spacer
  }

  // Auto-scroll to bottom when new messages arrive
  const maxOffset = Math.max(0, messageLines.length - chatHeight)
  const effectiveOffset = Math.min(scrollOffset, maxOffset)

  // Auto-scroll: if user hasn't scrolled up, stick to bottom
  useEffect(() => {
    setScrollOffset(maxOffset)
  }, [messages.length, maxOffset])

  const visibleLines = messageLines.slice(effectiveOffset, effectiveOffset + chatHeight)

  // ─── Session List View ────────────────────────────────────────────────

  if (showSessions) {
    return (
      <Box flexDirection="column" width={width} height={height}>
        <Box paddingX={2}>
          <Text color="#00bfff" bold>
            ✨ Chat History
          </Text>
        </Box>
        <Box width={width}>
          <Text>{borderLine}</Text>
        </Box>
        <Box flexDirection="column" paddingX={2} flexGrow={1} overflow="hidden">
          {sessions.length === 0 ? (
            <Text dimColor>No previous chats</Text>
          ) : (
            sessions.slice(0, Math.max(3, (height || 15) - 4)).map((sess, i) => (
              <Box key={sess.id}>
                <Text color={i === sessionCursor ? '#00bfff' : '#e6edf3'}>
                  {i === sessionCursor ? '▸ ' : '  '}
                  {sess.title.slice(0, width - 10)}
                </Text>
              </Box>
            ))
          )}
        </Box>
        <Box paddingX={2}>
          <Text>{chalk.hex('#3a6a7a')('↑↓ navigate  Enter select  ESC cancel')}</Text>
        </Box>
      </Box>
    )
  }

  // ─── Main Chat View ───────────────────────────────────────────────────

  return (
    <Box flexDirection="column" width={width} height={height}>
      {/* Header */}
      <Box paddingX={2} justifyContent="space-between">
        <Text>
          <Text color="#00bfff" bold>
            ✨ AI Chat
          </Text>
          <Text dimColor> — {sessionTitle.slice(0, width - 25)}</Text>
        </Text>
      </Box>
      <Box width={width}>
        <Text>{borderLine}</Text>
      </Box>

      {/* Messages area */}
      <Box flexDirection="column" height={chatHeight} overflow="hidden" paddingX={1}>
        {visibleLines.length === 0 && !isLoading ? (
          <Box flexDirection="column" justifyContent="center" alignItems="center" flexGrow={1}>
            <Text color="#00bfff">✨</Text>
            <Text color="#e6edf3" bold>
              StrataNodex AI
            </Text>
            <Text dimColor>Type naturally — create tasks, set deadlines, ask questions.</Text>
            <Text dimColor>Type /new for new chat, /sessions for history, /back to exit.</Text>
          </Box>
        ) : (
          <>
            {visibleLines.map((line, i) => (
              <Text key={i} color={line.color} wrap="truncate">
                {line.text}
              </Text>
            ))}
            {isLoading && (
              <Box paddingX={2}>
                <Spinner label="Thinking..." />
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Input */}
      <Box width={width}>
        <Text>{borderLine}</Text>
      </Box>
      <Box width={width} paddingX={2}>
        <Text>{chalk.hex('#00bfff')('❯ ')}</Text>
        <Text color="#e6edf3">
          <TextInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            placeholder="ask AI anything..."
          />
        </Text>
      </Box>
      <Box width={width} paddingX={2}>
        <Text>
          {chalk.hex('#3a6a7a')(
            '↑↓ scroll  /new new chat  /sessions history  /back exit  Enter send'
          )}
        </Text>
      </Box>
    </Box>
  )
}
