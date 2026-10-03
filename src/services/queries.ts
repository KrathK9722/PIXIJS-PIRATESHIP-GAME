import { keepPreviousData, QueryClient, useMutation, useQuery } from '@tanstack/react-query'
import { fetchMatchHistory, fetchRanking, isRetryableError, submitMatch } from './api'
import type { RankingConfiguration } from './api'
import { removePendingMatch } from './pendingMatches'
import type { SubmitMatchRequest, SubmitMatchResponse } from '../types/types'

// =========================================================
// TANSTACK QUERY: CACHE, RETRIES AND REFETCH FOR THE API
// =========================================================

const MAX_RETRIES = 2

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => failureCount < MAX_RETRIES && isRetryableError(error),
      // DATA IS CONSIDERED FRESH FOR 30 s AFTER THAT IT IS REFETCHED IN THE BACKGROUND
      staleTime: 30_000,
    },
  },
})

export const queryKeys = {
  ranking: ['ranking'] as const,
  rankingPage: (configuration: RankingConfiguration, page: number) =>
    ['ranking', configuration.matchDurationSeconds, configuration.spawnIntervalSeconds, page] as const,
  matchHistory: ['match-history'] as const,
  matchHistoryPage: (page: number) => ['match-history', page] as const,
}

export function useRanking(configuration: RankingConfiguration, page: number) {
  return useQuery({
    queryKey: queryKeys.rankingPage(configuration, page),
    // EACH PAGE HAS ITS OWN KEY SO A LATE ANSWER FOR AN OLD PAGE NEVER REPLACES THE CURRENT ONE
    queryFn: ({ signal }) => fetchRanking(configuration, page, signal),
    // KEEP SHOWING THE PREVIOUS PAGE WHILE THE NEXT ONE LOADS
    placeholderData: keepPreviousData,
    // REFETCH EVERY TIME THE SCREEN OPENS
    refetchOnMount: 'always',
  })
}

export function useMatchHistory(page: number) {
  return useQuery({
    queryKey: queryKeys.matchHistoryPage(page),
    queryFn: ({ signal }) => fetchMatchHistory(page, signal),
    placeholderData: keepPreviousData,
    refetchOnMount: 'always',
  })
}

// ====================================
// REGISTERING A FINISHED MATCH
// ====================================
const requestsInFlight = new Map<string, Promise<SubmitMatchResponse>>()

function registerMatch(match: SubmitMatchRequest): Promise<SubmitMatchResponse> {
  const running = requestsInFlight.get(match.matchId)
  if (running) return running

  const request = submitMatch(match)
    .then((response) => {
      removePendingMatch(match.matchId)
      void queryClient.invalidateQueries({ queryKey: queryKeys.ranking })
      void queryClient.invalidateQueries({ queryKey: queryKeys.matchHistory })
      return response
    })
    .catch((error: unknown) => {
      if (!isRetryableError(error)) removePendingMatch(match.matchId)
      throw error
    })
    .finally(() => requestsInFlight.delete(match.matchId))

  requestsInFlight.set(match.matchId, request)
  return request
}

export function useSubmitMatch() {
  return useMutation({
    mutationKey: ['submit-match'],
    mutationFn: registerMatch,
    retry: (failureCount, error) => failureCount < MAX_RETRIES && isRetryableError(error),
  })
}
