// Spinner.tsx — A simple terminal spinner using braille frames.
// Respects NO_COLOR: falls back to plain "..." when set.
import React, { useState, useEffect } from 'react'
import { Text } from 'ink'

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
const INTERVAL_MS = 80

interface Props {
  label?: string
}

export const Spinner: React.FC<Props> = ({ label = 'Loading...' }) => {
  const noColor = Boolean(process.env['NO_COLOR'])
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    if (noColor) return
    const timer = setInterval(() => {
      setFrame((f) => (f + 1) % FRAMES.length)
    }, INTERVAL_MS)
    return () => clearInterval(timer)
  }, [noColor])

  if (noColor) {
    return <Text dimColor>... {label}</Text>
  }

  return (
    <Text color="#00bfff">
      {FRAMES[frame]} {label}
    </Text>
  )
}
