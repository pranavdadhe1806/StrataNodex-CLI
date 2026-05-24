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
  /** Report current screen nodes so the command input can resolve node refs. */
  onNodesLoaded?: (nodes: import('../types/index.js').Node[]) => void
  /** Report the currently-focused node id for autocomplete substitution. */
  onSelectedNodeChanged?: (nodeId: string | undefined) => void
}
