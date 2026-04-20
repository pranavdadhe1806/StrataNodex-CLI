import React from 'react'
import { Text } from 'ink'
import type { NodeStatus } from '../../types/index.js'

interface Props {
  status: NodeStatus
}

export function StatusBadge({ status }: Props) {
  if (status === 'DONE')
    return (
      <Text color="green" dimColor>
        [DONE]
      </Text>
    )
  if (status === 'IN_PROGRESS') return <Text color="blue">[IN_PROG]</Text>
  return <Text>[TODO]</Text>
}
