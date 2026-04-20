import { useState, useCallback } from 'react'

export interface ScreenEntry {
  name: string
  params?: Record<string, string>
}

export function useNavigation() {
  const [stack, setStack] = useState<ScreenEntry[]>([{ name: 'welcome' }])

  const currentScreen = stack[stack.length - 1]!

  const push = useCallback((name: string, params?: Record<string, string>) => {
    setStack((s) => [...s, { name, params }])
  }, [])

  const pop = useCallback(() => {
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s))
  }, [])

  return { currentScreen, stack, push, pop }
}
