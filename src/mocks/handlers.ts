import { http, HttpResponse } from 'msw'
import type { DefaultBodyType, PathParams } from 'msw'
import type {
  ApiError,
  MatchRecord,
  Page,
  RankingEntry,
  SubmitMatchRequest,
  SubmitMatchResponse,
} from '../types/types'
import { FIXTURE_MATCHES } from './fixtures'

// =====================================================================
// MOCKED REST API FOR RANKING AND MATCH HISTORY
// =====================================================================

const MOCK_DATABASE_KEY = 'pirate-battle.mock-db.v1'
const DEFAULT_PAGE_SIZE = 10
const MAX_PAGE_SIZE = 50

// ===================
// MOCK FAKE DATABASE
// ===================
function loadStoredMatches(): MatchRecord[] {
  try {
    const stored = localStorage.getItem(MOCK_DATABASE_KEY)
    if (stored === null) return []
    const parsed: unknown = JSON.parse(stored)
    return Array.isArray(parsed) ? (parsed as MatchRecord[]) : []
  } catch {
    return []
  }
}

function saveStoredMatches(matches: MatchRecord[]): void {
  localStorage.setItem(MOCK_DATABASE_KEY, JSON.stringify(matches))
}

function getAllMatches(): MatchRecord[] {
  return [...FIXTURE_MATCHES, ...loadStoredMatches()]
}

// REMOVES EVERY MATCH THE PLAYER REGISTERED (USED TO RESTORE THE INITIAL STATE)
export function resetMockDatabase(): void {
  localStorage.removeItem(MOCK_DATABASE_KEY)
}

// ================
// HELPERS
// ================
function readPositiveInteger(value: string | null, fallback: number): number | null {
  if (value === null) return fallback
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function paginate<T>(items: T[], page: number, pageSize: number): Page<T> {
  const start = (page - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    totalItems: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
  }
}

function badRequest(message: string) {
  return HttpResponse.json<ApiError>({ message }, { status: 400 })
}

// RANKING ORDER (DETERMINISTIC, SO TIES ALWAYS END UP IN THE SAME ORDER):
// 1. HIGHER SCORE  2. SHORTER DURATION  3. EARLIER DATE  4. MATCH ID
function compareForRanking(a: MatchRecord, b: MatchRecord): number {
  return b.score - a.score
    || a.durationSeconds - b.durationSeconds
    || a.completedAt.localeCompare(b.completedAt)
    || a.matchId.localeCompare(b.matchId)
}

function isValidSubmission(body: unknown): body is SubmitMatchRequest {
  if (typeof body !== 'object' || body === null) return false
  const match = body as Partial<SubmitMatchRequest>
  return typeof match.matchId === 'string' && match.matchId.length > 0
    && typeof match.playerId === 'string'
    && typeof match.playerName === 'string'
    && typeof match.completedAt === 'string'
    && typeof match.score === 'number' && match.score >= 0
    && typeof match.durationSeconds === 'number' && match.durationSeconds >= 0
    && (match.finishReason === 'time' || match.finishReason === 'player_destroyed')
    && typeof match.configuration === 'object' && match.configuration !== null
    && typeof match.configuration.matchDurationSeconds === 'number'
    && typeof match.configuration.spawnIntervalSeconds === 'number'
}

// ================
// HANDLERS
// ================
export const handlers = [
  // GET /api/ranking?durationSeconds=120&spawnIntervalSeconds=4&page=1&pageSize=10
  // ONLY MATCHES PLAYED WITH THE SAME CONFIGURATION ARE COMPARED
  http.get<PathParams, DefaultBodyType, Page<RankingEntry> | ApiError>('/api/ranking', ({ request }) => {
    const url = new URL(request.url)
    const durationSeconds = Number(url.searchParams.get('durationSeconds'))
    const spawnIntervalSeconds = Number(url.searchParams.get('spawnIntervalSeconds'))
    const page = readPositiveInteger(url.searchParams.get('page'), 1)
    const pageSize = readPositiveInteger(url.searchParams.get('pageSize'), DEFAULT_PAGE_SIZE)

    if (!durationSeconds || !spawnIntervalSeconds) {
      return badRequest('durationSeconds and spawnIntervalSeconds are required.')
    }
    if (page === null || pageSize === null || pageSize > MAX_PAGE_SIZE) {
      return badRequest(`page must be a positive integer and pageSize between 1 and ${MAX_PAGE_SIZE}.`)
    }

    const ranking: RankingEntry[] = getAllMatches()
      .filter((match) =>
        match.configuration.matchDurationSeconds === durationSeconds
        && match.configuration.spawnIntervalSeconds === spawnIntervalSeconds)
      .sort(compareForRanking)
      .map((match, index) => ({
        rank: index + 1,
        matchId: match.matchId,
        playerId: match.playerId,
        playerName: match.playerName,
        score: match.score,
        durationSeconds: match.durationSeconds,
        completedAt: match.completedAt,
      }))

    return HttpResponse.json<Page<RankingEntry>>(paginate(ranking, page, pageSize))
  }),

  // GET /api/players/local-player/matches?page=1&pageSize=10  (NEWEST FIRST)
  http.get<{ playerId: string }, DefaultBodyType, Page<MatchRecord> | ApiError>(
    '/api/players/:playerId/matches', ({ request, params }) => {
    const url = new URL(request.url)
    const page = readPositiveInteger(url.searchParams.get('page'), 1)
    const pageSize = readPositiveInteger(url.searchParams.get('pageSize'), DEFAULT_PAGE_SIZE)

    if (page === null || pageSize === null || pageSize > MAX_PAGE_SIZE) {
      return badRequest(`page must be a positive integer and pageSize between 1 and ${MAX_PAGE_SIZE}.`)
    }

    const history = getAllMatches()
      .filter((match) => match.playerId === params.playerId)
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt) || a.matchId.localeCompare(b.matchId))

    return HttpResponse.json<Page<MatchRecord>>(paginate(history, page, pageSize))
  }),

  // POST /api/matches  (IDEMPOTENT: THE SAME matchId NEVER CREATES A SECOND RECORD)
  http.post<PathParams, DefaultBodyType, SubmitMatchResponse | ApiError>('/api/matches', async ({ request }) => {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return badRequest('Request body must be valid JSON.')
    }
    if (!isValidSubmission(body)) {
      return badRequest('Invalid match record.')
    }

    const storedMatches = loadStoredMatches()
    const existing = storedMatches.find((match) => match.matchId === body.matchId)
    if (existing) {
      return HttpResponse.json<SubmitMatchResponse>({ record: existing, created: false }, { status: 200 })
    }

    const record: MatchRecord = { ...body }
    saveStoredMatches([...storedMatches, record])
    return HttpResponse.json<SubmitMatchResponse>({ record, created: true }, { status: 201 })
  }),
]
