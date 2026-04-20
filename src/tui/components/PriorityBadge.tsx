import React from 'react'
import { Text } from 'ink'
import type { Priority } from '../../types/index.js'

interface Props {
  priority: Priority | null
}

export function PriorityBadge({ priority }: Props) {
  if (priority === 'HIGH') return <Text color="red">[HIGH]</Text>
  if (priority === 'LOW') return <Text dimColor>[LOW]</Text>
  return <Text color="yellow">[MED]</Text>
}
