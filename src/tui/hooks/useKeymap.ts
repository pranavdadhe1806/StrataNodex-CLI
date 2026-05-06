// Keymap hook
import type React from 'react'
import { useInput } from 'ink'
import type { ActionHandlers } from '../types.js'

export type KeymapMode = 'nav' | 'edit'

export function useKeymap(
  mode: KeymapMode,
  overlayOpen: React.MutableRefObject<boolean>,
  handlers: ActionHandlers
): void {
  useInput((input, key) => {
    // When the autocomplete overlay is open, CommandInput handles all keys.
    // Let it consume them — don't fire any navigation actions here.
    if (overlayOpen.current) return

    if (mode === 'edit') {
      if (key.escape) handlers.onEsc?.()
      return
    }

    if (key.upArrow) handlers.onUp?.()
    else if (key.downArrow) handlers.onDown?.()
    else if (key.leftArrow) handlers.onLeft?.()
    else if (key.rightArrow) handlers.onRight?.()
    else if (key.return) handlers.onEnter?.()
    else if (key.escape) handlers.onEsc?.()
    else if (input === 'b') handlers.onBack?.()
    else if (input === 'q') handlers.onQuit?.()
  })
}
