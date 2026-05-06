export interface ActionHandlers {
  onUp?: () => void
  onDown?: () => void
  onLeft?: () => void
  onRight?: () => void
  onEnter?: () => void
  onEsc?: () => void
  onBack?: () => void
  onQuit?: () => void
  onCommand?: (cmd: string) => void
  /** Called by the executor after any mutation to trigger a live data refresh */
  onRefetch?: () => void
}

export interface ScreenProps {
  push: (screen: string, params?: Record<string, string>) => void
  pop: () => void
  replaceScreen: (screen: string, params?: Record<string, string>) => void
  registerActions: (handlers: Partial<ActionHandlers>) => void
  height?: number
  width?: number
}
