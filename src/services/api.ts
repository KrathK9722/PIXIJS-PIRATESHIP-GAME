import axios from 'axios'
import type {
  MatchRecord,
  Page,
  RankingEntry,
  SubmitMatchRequest,
  SubmitMatchResponse,
} from '../types/types'
import { LOCAL_PLAYER_ID } from './player'

// ===================================================
// HTTP CLIENT FOR THE RANKING AND MATCH HISTORY API
// ===================================================

export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 8000,
})

export const PAGE_SIZE = 8

export type RankingConfiguration = {
  matchDurationSeconds: number
  spawnIntervalSeconds: number
}

export async function fetchRanking(
  configuration: RankingConfiguration,
  page: number,
  signal?: AbortSignal,
): Promise<Page<RankingEntry>> {
  const response = await apiClient.get<Page<RankingEntry>>('/ranking', {
    params: {
      durationSeconds: configuration.matchDurationSeconds,
      spawnIntervalSeconds: configuration.spawnIntervalSeconds,
      page,
      pageSize: PAGE_SIZE,
    },
    // LETS TANSTACK QUERY CANCEL A REQUEST THAT IS NO LONGER NEEDED
    signal,
  })
  return response.data
}

export async function fetchMatchHistory(
  page: number,
  signal?: AbortSignal,
): Promise<Page<MatchRecord>> {
  const response = await apiClient.get<Page<MatchRecord>>(
    `/players/${LOCAL_PLAYER_ID}/matches`,
    { params: { page, pageSize: PAGE_SIZE }, signal },
  )
  return response.data
}

export async function submitMatch(match: SubmitMatchRequest): Promise<SubmitMatchResponse> {
  const response = await apiClient.post<SubmitMatchResponse>('/matches', match)
  return response.data
}

// TRUE FOR ERRORS WORTH RETRYING: NO RESPONSE (TIMEOUT / CONNECTION)
export function isRetryableError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false
  const status = error.response?.status
  return status === undefined || status >= 500
}

// A SHORT MESSAGE TO SHOW TO THE PLAYER
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') return 'The server took too long to answer.'
    if (error.response === undefined) return 'Could not reach the server.'
    return `The server answered with an error (${error.response.status}).`
  }
  return 'Something went wrong.'
}
