import React from 'react'
import { Text } from 'ink'

interface Props {
  bindings: string
}

export function Keybindings({ bindings }: Props) {
  return <Text dimColor>{bindings}</Text>
}
