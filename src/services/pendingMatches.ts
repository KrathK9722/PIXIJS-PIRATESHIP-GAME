import type { MatchResult, SubmitMatchRequest } from '../types/types'
import { LOCAL_PLAYER_NAME } from './player'

// ====================================================================
// MATCHES WAITING TO BE REGISTERED ON THE SERVER
// ====================================================================

const STORAGE_KEY = 'pirate-battle.pending-matches.v1'

export function toSubmitRequest(result: MatchResult): SubmitMatchRequest {
  return { ...result, playerName: LOCAL_PLAYER_NAME }
}

export function loadPendingMatches(): SubmitMatchRequest[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === null) return []
    const parsed: unknown = JSON.parse(stored)
    return Array.isArray(parsed) ? (parsed as SubmitMatchRequest[]) : []
  } catch {
    return []
  }
}

function savePendingMatches(matches: SubmitMatchRequest[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(matches))
  } catch {
    // STORAGE FULL OR BLOCKED: THE MATCH CAN STILL BE SENT WHILE THE PAGE IS OPEN
  }
}

export function addPendingMatch(match: SubmitMatchRequest): void {
  const pending = loadPendingMatches()
  // THE SAME MATCH IS NEVER QUEUED TWICE
  if (pending.some((item) => item.matchId === match.matchId)) return
  savePendingMatches([...pending, match])
}

export function removePendingMatch(matchId: string): void {
  savePendingMatches(loadPendingMatches().filter((item) => item.matchId !== matchId))
}
