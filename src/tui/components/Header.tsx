import React from 'react'
import { Box, Text } from 'ink'

interface Props {
  version: string
  userName: string | null
}

export function Header({ version, userName }: Props) {
  return (
    <Box flexDirection="column" alignItems="center" paddingY={1}>
      <Text bold color="white">
        StrataNodex - CLI
      </Text>
      <Text dimColor>v {version}</Text>
      <Text dimColor>{userName ? `Welcome Back, ${userName}` : 'Welcome, Guest'}</Text>
    </Box>
  )
}
