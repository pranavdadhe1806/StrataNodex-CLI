import React from 'react'
import { Text } from 'ink'

interface Props {
  depth: number
  /** Which ancestor levels should draw a continuing vertical line */
  parentLines: boolean[]
  isLast: boolean
}

// Each depth level = 4 chars wide
const CONT = '│   ' // vertical + 3 spaces
const BLANK = '    ' // 4 spaces
const MID = '├── ' // branch mid-sibling
const END = '└── ' // branch last-sibling

export function TreeConnector({ depth, parentLines, isLast }: Props) {
  if (depth === 0) return null

  let prefix = ''
  for (let i = 0; i < depth - 1; i++) {
    prefix += parentLines[i] ? CONT : BLANK
  }
  prefix += isLast ? END : MID

  return <Text color="#2a5a6a">{prefix}</Text>
}
