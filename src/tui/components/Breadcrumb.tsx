import React from 'react'
import { Box, Text } from 'ink'

interface Props {
  parts: string[]
}

export function Breadcrumb({ parts }: Props) {
  return (
    <Box>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {i > 0 && <Text color="#3a6a7a"> › </Text>}
          <Text color="#00bfff">{part}</Text>
        </React.Fragment>
      ))}
    </Box>
  )
}
