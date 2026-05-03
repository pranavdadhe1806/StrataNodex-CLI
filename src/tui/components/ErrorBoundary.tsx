// ErrorBoundary.tsx — React class component error boundary for the TUI.
// Catches render errors in screen components and shows a friendly recovery message.
import React from 'react'
import { Box, Text } from 'ink'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error: string | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: unknown): State {
    const msg = error instanceof Error ? error.message : String(error)
    return { hasError: true, error: msg }
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo): void {
    const msg = error instanceof Error ? error.message : String(error)
    // Write to stderr so it shows in logs without breaking the TUI render
    process.stderr.write(`[StrataNodex] Render error: ${msg}\n${info.componentStack ?? ''}\n`)
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <Box flexDirection="column" paddingX={2} paddingY={1}>
          <Text color="red" bold>
            ✗ Something went wrong
          </Text>
          <Text dimColor>{this.state.error ?? 'Unknown error'}</Text>
          <Text> </Text>
          <Text dimColor>
            Type /back to go back · /home to return to folders · /logout to reset
          </Text>
        </Box>
      )
    }
    return this.props.children
  }
}
