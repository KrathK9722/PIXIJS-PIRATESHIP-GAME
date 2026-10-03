import type { MatchFinishReason, MatchRecord } from '../types/types'
import { getRandomInteger } from '../components/Experience/config/random'

// ==========================================================
// FAKE OTHER PLAYERS FOR THE RANKING
// THE SAME SEED ALWAYS CREATES THE SAME MATCHES
// ==========================================================

const PIRATE_NAMES = [
  'Anne Bonny', 'Blackbeard', 'Calico Jack', 'Captain Kidd', 'Mary Read',
  'Henry Morgan', 'Grace O\'Malley', 'Black Bart', 'Ching Shih', 'Stede Bonnet',
  'Jean Lafitte', 'Barbarossa', 'Edward Low', 'Charles Vane', 'Sam Bellamy',
  'Ned England', 'Olivier Levasseur', 'Howell Davis', 'Thomas Tew', 'Benjamin Hornigold',
  'Jacquotte Delahaye', 'Paulsgrave Williams', 'Rachel Wall', 'Francis Drake', 'Long Ben',
]

// CONFIGURATIONS USED BY THE FAKE MATCHES. THE DEFAULT OPTIONS (120 s / 4 s) COME FIRST
// SO THE RANKING HAS SEVERAL PAGES WITH THE DEFAULT CONFIGURATION
const FIXTURE_CONFIGURATIONS = [
  { matchDurationSeconds: 120, spawnIntervalSeconds: 4 },
  { matchDurationSeconds: 120, spawnIntervalSeconds: 4 },
  { matchDurationSeconds: 60, spawnIntervalSeconds: 4 },
  { matchDurationSeconds: 180, spawnIntervalSeconds: 4 },
  { matchDurationSeconds: 120, spawnIntervalSeconds: 2 },
]

// THE SEED IS DRAWN ONCE PER BROWSER AND SAVED, SO EACH PLAYER SEES DIFFERENT RIVALS BUT THE
// RANKING STAYS THE SAME BETWEEN REFRESHES. TESTS CAN WRITE A KNOWN SEED TO THIS KEY FIRST
export const FIXTURE_SEED_KEY = 'pirate-battle.fixture-seed.v1'

function loadOrCreateFixtureSeed(): number {
  try {
    const stored = Number(localStorage.getItem(FIXTURE_SEED_KEY))
    if (Number.isInteger(stored) && stored > 0) return stored

    const seed = getRandomInteger(1, 1000000)
    localStorage.setItem(FIXTURE_SEED_KEY, String(seed))
    return seed
  } catch {
    // STORAGE BLOCKED: USE A NEW SEED FOR THIS PAGE LOAD ONLY
    return getRandomInteger(1, 1000000)
  }
}

const FIXTURE_SEED = loadOrCreateFixtureSeed()
const FIXTURE_START_DATE = Date.UTC(2026, 8, 1) // 2026-09-01

// SMALL SEEDED RANDOM NUMBER GENERATOR (MULBERRY32)
function createSeededRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let value = Math.imul(state ^ (state >>> 15), 1 | state)
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function createFixtureMatches(): MatchRecord[] {
  const random = createSeededRandom(FIXTURE_SEED)
  const matches: MatchRecord[] = []

  PIRATE_NAMES.forEach((playerName, playerIndex) => {
    FIXTURE_CONFIGURATIONS.forEach((configuration, matchIndex) => {
      const finishReason: MatchFinishReason = random() < 0.6 ? 'time' : 'player_destroyed'
      const durationSeconds = finishReason === 'time'
        ? configuration.matchDurationSeconds
        : Math.round(configuration.matchDurationSeconds * (0.3 + random() * 0.6))
      const enemiesPerSecond = 1 / configuration.spawnIntervalSeconds
      const score = Math.round(durationSeconds * enemiesPerSecond * (0.2 + random() * 0.7))
      const minutesAfterStart = Math.floor(random() * 60 * 24 * 30)

      matches.push({
        matchId: `fixture-${playerIndex + 1}-${matchIndex + 1}`,
        playerId: `fixture-player-${playerIndex + 1}`,
        playerName,
        completedAt: new Date(FIXTURE_START_DATE + minutesAfterStart * 60_000).toISOString(),
        score,
        durationSeconds,
        finishReason,
        configuration: { ...configuration, debugEnabled: false },
      })
    })
  })

  return matches
}

export const FIXTURE_MATCHES: readonly MatchRecord[] = createFixtureMatches()
