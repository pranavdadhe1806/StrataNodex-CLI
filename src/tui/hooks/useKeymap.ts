// Keymap hook
import { useInput } from 'ink'
import type { ActionHandlers } from '../types.js'

export type KeymapMode = 'nav' | 'edit'

export function useKeymap(mode: KeymapMode, handlers: ActionHandlers): void {
  useInput((input, key) => {
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
