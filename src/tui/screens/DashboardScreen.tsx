// DashboardScreen.tsx — Score, streak, and 7-day ASCII bar chart.
import React, { useEffect, useState } from 'react'
import { Box, Text } from 'ink'
import { getDailyScore, getStreak, getScores } from '../../api/client.js'
import type { DailyScore } from '../../types/index.js'
import type { ScreenProps } from '../types.js'

const BAR_CHAR = '█'
const MAX_BAR_HEIGHT = 8

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function last7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
}

function buildBars(scores: DailyScore[], days: string[]): { date: string; points: number }[] {
  return days.map((date) => {
    const s = scores.find((sc) => sc.date.slice(0, 10) === date)
    return { date, points: s?.points ?? 0 }
  })
}

function formatDate(iso: string): string {
  const [, mm, dd] = iso.split('-')
  return `${dd}/${mm}`
}

export function DashboardScreen({ pop, registerActions }: ScreenProps) {
  const [streak, setStreak] = useState<number | null>(null)
  const [todayScore, setTodayScore] = useState<DailyScore | null>(null)
  const [bars, setBars] = useState<{ date: string; points: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    registerActions({
      onBack: () => pop(),
      onCommand: (cmd) => {
        if (cmd === '/back') pop()
      },
    })
  }, [registerActions, pop])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const days = last7Days()
        const [streakData, scoresData] = await Promise.all([getStreak(), getScores(30)])

        let todayData: DailyScore | null = null
        try {
          todayData = await getDailyScore(todayISO())
        } catch {
          // 404 means no score yet today
        }

        if (!cancelled) {
          setStreak(streakData.streak)
          setTodayScore(todayData)
          setBars(buildBars(scoresData, days))
          setLoading(false)
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError((e as Error).message)
          setLoading(false)
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <Box paddingX={2}>
        <Text dimColor>Loading dashboard...</Text>
      </Box>
    )
  }

  if (error) {
    return (
      <Box paddingX={2}>
        <Text color="red">✗ {error}</Text>
      </Box>
    )
  }

  const maxPoints = Math.max(...bars.map((b) => b.points), 1)

  return (
    <Box flexDirection="column" paddingX={2} gap={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color="#00bfff">
          📊 Dashboard
        </Text>
      </Box>

      {/* Streak */}
      <Box>
        <Text color="#00c896">🔥 Streak: </Text>
        <Text bold>{streak ?? 0} days</Text>
      </Box>

      {/* Today's score */}
      <Box>
        <Text color="#00c896">Today: </Text>
        {todayScore ? (
          <Text bold>
            {todayScore.doneNodes}/{todayScore.totalNodes} tasks · {todayScore.points} pts
          </Text>
        ) : (
          <Text dimColor>No score yet today</Text>
        )}
      </Box>

      {/* 7-day bar chart */}
      <Box flexDirection="column" marginTop={1}>
        <Text color="#8b949e">Last 7 days</Text>
        <Box flexDirection="row" gap={2} marginTop={1} alignItems="flex-end">
          {bars.map(({ date, points }) => {
            const barHeight = Math.max(1, Math.round((points / maxPoints) * MAX_BAR_HEIGHT))
            const isEmpty = points === 0
            return (
              <Box key={date} flexDirection="column" alignItems="center">
                {/* Bar — build from top down */}
                {Array.from({ length: MAX_BAR_HEIGHT }, (_, rowIdx) => {
                  const filled = rowIdx >= MAX_BAR_HEIGHT - barHeight
                  return (
                    <Text key={rowIdx} color={isEmpty ? '#1a1a2e' : '#00bfff'}>
                      {filled ? BAR_CHAR : ' '}
                    </Text>
                  )
                })}
                {/* Points label */}
                <Text color="#8b949e" dimColor>
                  {points > 0 ? String(points) : '-'}
                </Text>
                {/* Date label */}
                <Text color="#8b949e" dimColor>
                  {formatDate(date)}
                </Text>
              </Box>
            )
          })}
        </Box>
      </Box>

      {/* Footer hint */}
      <Box marginTop={1}>
        <Text dimColor color="#8b949e">
          /back to return
        </Text>
      </Box>
    </Box>
  )
}
