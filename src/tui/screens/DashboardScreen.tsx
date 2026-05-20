// DashboardScreen.tsx — CLI Dashboard matching the web app design.
// Shows: Welcome header, streak, today's score, multi-range ASCII chart, and recents.
import React, { useEffect, useState, useCallback } from 'react'
import { Box, Text } from 'ink'
import { getDailyScore, getStreak, getScores, getFolders } from '../../api/client.js'
import { Spinner } from '../components/Spinner.js'
import { Keybindings } from '../components/Keybindings.js'
import type { DailyScore } from '../../types/index.js'
import type { ScreenProps } from '../types.js'
import { getRecents } from '../../utils/recents.js'

// ── Chart constants ──────────────────────────────────────────────────────────
const FILL = '█'
const SHADE = '▓'
const LIGHT = '░'
const EMPTY_CHAR = ' '
const CHART_HEIGHT = 8

type TimeRange = '1W' | '1M' | '3M' | '1Y'

const RANGES: TimeRange[] = ['1W', '1M', '3M', '1Y']
const RANGE_LABEL: Record<TimeRange, string> = {
  '1W': 'Weekly',
  '1M': 'Monthly',
  '3M': 'Quarterly',
  '1Y': 'Yearly',
}
const RANGE_DAYS: Record<TimeRange, number> = {
  '1W': 7,
  '1M': 30,
  '3M': 90,
  '1Y': 365,
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// ── Helpers ──────────────────────────────────────────────────────────────────
function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function getStreakMessage(streak: number): string {
  if (streak === 0) return "Let's get started — build your first streak!"
  if (streak === 1) return 'Good start! Keep it going tomorrow.'
  if (streak <= 3) return "You're building momentum!"
  if (streak <= 6) return "You're on a roll! Don't break it. 🔥"
  if (streak <= 13) return 'You have been on fire lately. 🔥'
  if (streak <= 29) return "Incredible consistency! You're unstoppable. 🔥🔥"
  return "Legendary streak. You're a machine. 🔥🔥🔥"
}

function formatDateLabel(iso: string, range: TimeRange): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (range === '1Y') return `${MONTHS[m! - 1]} '${String(y).slice(2)}`
  return `${MONTHS[m! - 1]} ${d}`
}

interface DayPoint {
  label: string
  points: number | null
}

function buildChartData(scores: DailyScore[], days: number, range: TimeRange): DayPoint[] {
  const scoreMap = new Map(scores.map((s) => [s.date.slice(0, 10), s.points]))
  const result: DayPoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const iso = d.toISOString().slice(0, 10)
    result.push({ label: formatDateLabel(iso, range), points: scoreMap.get(iso) ?? null })
  }
  return result
}

/** Downsample data to fit the terminal width. */
function downsample(data: DayPoint[], maxColumns: number): DayPoint[] {
  if (data.length <= maxColumns) return data
  const step = data.length / maxColumns
  const result: DayPoint[] = []
  for (let i = 0; i < maxColumns; i++) {
    const start = Math.floor(i * step)
    const end = Math.floor((i + 1) * step)
    const slice = data.slice(start, end)
    const nonNull = slice.filter((d) => d.points !== null)
    const avg =
      nonNull.length > 0 ? nonNull.reduce((a, b) => a + b.points!, 0) / nonNull.length : null
    result.push({
      label: slice[Math.floor(slice.length / 2)]?.label ?? '',
      points: avg !== null ? Math.round(avg * 10) / 10 : null,
    })
  }
  return result
}

// ── Component ────────────────────────────────────────────────────────────────

const BINDINGS = '[←→] range  [↑↓] recents  [Enter] open  [/folders] your folders'

interface Props extends ScreenProps {
  /** User already resolved by useAuth in App — avoids an extra getMe() call. */
  authUser: { name: string | null; email: string } | null
}

export function DashboardScreen({ push, pop, registerActions, width, authUser }: Props) {
  const [streak, setStreak] = useState<number>(0)
  const [todayScore, setTodayScore] = useState<DailyScore | null>(null)
  const [allScores, setAllScores] = useState<DailyScore[]>([])
  const [range, setRange] = useState<TimeRange>('1W')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Recents
  interface RecentItem {
    id: string
    name: string
    type: 'folder' | 'list'
    folderId?: string
    folderName?: string
  }
  const [recents, setRecents] = useState<RecentItem[]>([])
  const [recentCursor, setRecentCursor] = useState(0)

  const termWidth = width ?? 80

  // ── Load data ────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        // Don't call getMe() — user is passed from App via useAuth (already resolved)
        const [streakData, scoresData] = await Promise.all([getStreak(), getScores(365)])

        let todayData: DailyScore | null = null
        try {
          todayData = await getDailyScore(todayISO())
        } catch {
          // 404 = no score yet today
        }

        // Build recents from persisted store + live folder/list data
        const recentEntries = getRecents()
        const recentItems: RecentItem[] = []

        if (recentEntries.length > 0) {
          // Fetch all folders to resolve names and list folder associations
          try {
            const folders = await getFolders()
            const folderMap = new Map(folders.map((f) => [f.id, f]))

            for (const entry of recentEntries.slice(0, 10)) {
              if (entry.type === 'folder') {
                const folder = folderMap.get(entry.id)
                recentItems.push({
                  id: entry.id,
                  name: folder?.name ?? entry.name,
                  type: 'folder',
                })
              } else {
                // List — try to find its folder
                recentItems.push({
                  id: entry.id,
                  name: entry.name,
                  type: 'list',
                  folderId: entry.folderId,
                  folderName: entry.folderName,
                })
              }
            }
          } catch {
            // If folders API fails, still show entries with stored names
            for (const entry of recentEntries.slice(0, 10)) {
              recentItems.push({
                id: entry.id,
                name: entry.name,
                type: entry.type,
                folderId: entry.folderId,
                folderName: entry.folderName,
              })
            }
          }
        }

        if (!cancelled) {
          setStreak(streakData.streak)
          setTodayScore(todayData)
          setAllScores(scoresData)
          setRecents(recentItems)
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

  // ── Key bindings ─────────────────────────────────────────────────────────
  const openRecent = useCallback(() => {
    const item = recents[recentCursor]
    if (!item) return
    if (item.type === 'folder') {
      push('lists', { folderId: item.id, folderName: item.name })
    } else {
      push('tree', {
        listId: item.id,
        listName: item.name,
        ...(item.folderId ? { folderId: item.folderId } : {}),
        ...(item.folderName ? { folderName: item.folderName } : {}),
      })
    }
  }, [recents, recentCursor, push])

  useEffect(() => {
    registerActions({
      onLeft: () => setRange((r) => RANGES[Math.max(0, RANGES.indexOf(r) - 1)]!),
      onRight: () => setRange((r) => RANGES[Math.min(RANGES.length - 1, RANGES.indexOf(r) + 1)]!),
      onUp: () => setRecentCursor((c) => (c > 0 ? c - 1 : recents.length - 1)),
      onDown: () => setRecentCursor((c) => (c < recents.length - 1 ? c + 1 : 0)),
      onEnter: openRecent,
      onBack: () => pop(),
      onCommand: (cmd) => {
        if (cmd === '/back') pop()
      },
    })
  }, [registerActions, pop, recents, openRecent])

  // ── Render ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box paddingX={2}>
        <Spinner label="Loading dashboard..." />
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

  // Chart data
  const days = RANGE_DAYS[range]
  const rawData = buildChartData(allScores, days, range)
  // Reserve space: 2 padding + some chars for labels. Each column = 4 chars wide
  const maxCols = Math.min(rawData.length, Math.floor((termWidth - 8) / 4))
  const chartData = downsample(rawData, maxCols)

  const allPoints = chartData.map((d) => d.points).filter((p): p is number => p !== null)
  const maxPts = allPoints.length > 0 ? Math.max(...allPoints) : 1
  const minPts = allPoints.length > 0 ? Math.min(...allPoints, 0) : 0
  const pointRange = Math.max(maxPts - minPts, 1)

  // ── Sub-renders ──────────────────────────────────────────────────────────

  const renderChart = () => {
    // Build rows from top to bottom
    const rows: React.ReactNode[] = []
    for (let row = CHART_HEIGHT - 1; row >= 0; row--) {
      const threshold = minPts + (row / CHART_HEIGHT) * pointRange
      const cells: React.ReactNode[] = []
      for (let col = 0; col < chartData.length; col++) {
        const p = chartData[col]!.points
        if (p === null || p < threshold) {
          cells.push(
            <Text key={col} color="#1a1a2e">
              {'   '}
            </Text>
          )
        } else {
          // Determine intensity
          const intensity = (p - minPts) / pointRange
          const char = intensity > 0.7 ? FILL : intensity > 0.35 ? SHADE : LIGHT
          cells.push(
            <Text key={col} color="#00bfff">
              {` ${char} `}
            </Text>
          )
        }
      }
      rows.push(
        <Box key={row} flexDirection="row">
          {cells}
        </Box>
      )
    }
    return rows
  }

  const renderLabels = () => {
    // Show a subset of date labels
    const labelInterval = Math.max(1, Math.floor(chartData.length / 6))
    const labels = chartData.map((d, i) => {
      if (i % labelInterval === 0 || i === chartData.length - 1) {
        return d.label.padStart(3).padEnd(4).slice(0, 4)
      }
      return '    '
    })
    return (
      <Box flexDirection="row">
        {labels.map((l, i) => (
          <Text key={i} color="#8b949e" dimColor>
            {l}
          </Text>
        ))}
      </Box>
    )
  }

  const userName = authUser?.name ?? authUser?.email ?? 'User'

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      {/* ── Welcome Header ────────────────────────────────────────────────── */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="#EDEFF3">
          Welcome Back, {userName}
        </Text>
        <Text color="#8b949e">{getStreakMessage(streak)}</Text>
      </Box>

      {/* ── Stats Row ─────────────────────────────────────────────────────── */}
      <Box gap={4} marginBottom={1}>
        <Box>
          <Text color="#00c896">🔥 Streak: </Text>
          <Text bold>{streak} days</Text>
        </Box>
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
      </Box>

      {/* ── Performance Chart ─────────────────────────────────────────────── */}
      <Box flexDirection="column" marginBottom={1}>
        {/* Chart header with range toggles */}
        <Box justifyContent="space-between" marginBottom={1}>
          <Text color="#8b949e">Account Performance</Text>
          <Box gap={1}>
            {RANGES.map((r) => (
              <Text
                key={r}
                color={r === range ? '#00bfff' : '#8b949e'}
                bold={r === range}
                dimColor={r !== range}
              >
                {r === range ? `[${RANGE_LABEL[r]}]` : ` ${RANGE_LABEL[r]} `}
              </Text>
            ))}
          </Box>
        </Box>

        {/* ASCII chart */}
        <Box flexDirection="column" borderStyle="round" borderColor="#32363C" paddingX={1}>
          {allPoints.length === 0 ? (
            <Box height={CHART_HEIGHT} alignItems="center" justifyContent="center">
              <Text color="#8b949e" dimColor>
                No data yet — complete some tasks to see your graph!
              </Text>
            </Box>
          ) : (
            <>
              {renderChart()}
              {renderLabels()}
            </>
          )}
        </Box>
      </Box>

      {/* ── Recents ───────────────────────────────────────────────────────── */}
      <Box flexDirection="column">
        <Text bold color="#EDEFF3">
          Recents
        </Text>
        {recents.length === 0 ? (
          <Box marginTop={1}>
            <Text color="#8b949e" dimColor>
              Open a folder or list to see it here.
            </Text>
          </Box>
        ) : (
          <Box flexDirection="column" marginTop={1}>
            {recents.map((item, i) => {
              const isSelected = i === recentCursor
              const icon = item.type === 'folder' ? '📁' : '📋'
              const suffix = item.type === 'list' && item.folderName ? ` (${item.folderName})` : ''
              return (
                <Box key={`${item.type}-${item.id}`}>
                  <Text color={isSelected ? '#00bfff' : '#8b949e'} bold={isSelected}>
                    {isSelected ? '❯ ' : '  '}
                    {icon} {item.name}
                  </Text>
                  {suffix && (
                    <Text color="#8b949e" dimColor>
                      {suffix}
                    </Text>
                  )}
                </Box>
              )
            })}
          </Box>
        )}
      </Box>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <Box marginTop={1}>
        <Keybindings bindings={BINDINGS} />
      </Box>
    </Box>
  )
}
