import type { MatchResult } from '../types/types'

const STORAGE_KEY = 'pirate-battle.latest-result.v1'

export function loadLatestResult(): MatchResult | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === null) return null

    const parsed: unknown = JSON.parse(stored)
    if (typeof parsed !== 'object' || parsed === null) return null

    const result = parsed as Partial<MatchResult>
    if (
      typeof result.matchId !== 'string' ||
      typeof result.playerId !== 'string' ||
      typeof result.completedAt !== 'string' ||
      typeof result.score !== 'number' ||
      typeof result.durationSeconds !== 'number' ||
      (result.finishReason !== 'time' && result.finishReason !== 'player_destroyed') ||
      typeof result.configuration !== 'object' || result.configuration === null
    ) return null

    return result as MatchResult
  } catch {
    return null
  }
}

export function saveLatestResult(result: MatchResult): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result))
    return true
  } catch {
    return false
  }
}
