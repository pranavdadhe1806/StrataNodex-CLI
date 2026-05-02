import { useState, useCallback } from 'react'

interface CommandInputOptions {
  onExit: () => void
  onNavigate: (screen: string, params?: Record<string, string>) => void
  onScreenCommand: (raw: string) => void
}

export function useCommandInput({ onExit, onNavigate, onScreenCommand }: CommandInputOptions) {
  const [inputValue, setInputValue] = useState('')

  const handleSubmit = useCallback(
    (value: string) => {
      const trimmed = value.trim()
      setInputValue('')

      if (!trimmed) return

      if (!trimmed.startsWith('/')) {
        onScreenCommand(trimmed)
        return
      }

      const [cmd, ...args] = trimmed.slice(1).split(' ')
      const _argStr = args.join(' ')

      switch (cmd!.toLowerCase()) {
        case 'exit':
        case 'quit':
          onExit()
          break
        case 'help':
          onNavigate('help')
          break
        case 'list':
          onNavigate('home')
          break
        case 'daily':
          onNavigate('daily')
          break
        default:
          onScreenCommand(trimmed)
          break
      }
    },
    [onExit, onNavigate, onScreenCommand]
  )

  return { inputValue, setInputValue, handleSubmit }
}
