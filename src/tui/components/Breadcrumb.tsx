import React from 'react'
import { Text } from 'ink'

interface Props {
  parts: string[]
}

export function Breadcrumb({ parts }: Props) {
  return <Text dimColor>{parts.join(' › ')}</Text>
}
