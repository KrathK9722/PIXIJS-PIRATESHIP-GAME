import { useState } from 'react'
import { loadOptions } from '../../services/optionsStorage'
import { LOCAL_PLAYER_ID } from '../../services/player'
import { useRanking } from '../../services/queries'
import { formatTime } from '../Experience/config/time'
import { Pagination, QueryState } from './LeaderboardParts'
import './OptionsScreen.css'
import './LeaderboardScreen.css'

type RankingScreenProps = {
  onComeBack: () => void
}

function RankingScreen(props: RankingScreenProps) {
  // THE RANKING ONLY COMPARES MATCHES PLAYED WITH THE CURRENT OPTIONS
  const [options] = useState(loadOptions)
  const [page, setPage] = useState(1)
  const ranking = useRanking(options, page)
  const data = ranking.data

  return (
    <section className="options-screen">
      <img
        src="/assets/jungleGaming/png/default/ui/menu/title_pirate_battle.png"
        alt="Pirate Battle"
      />

      <div className="options-menu leaderboard-panel">
        <h1>Ranking</h1>
        <p className="leaderboard-config">
          {options.matchDurationSeconds} s · spawn {options.spawnIntervalSeconds} s
        </p>

        <QueryState
          isPending={ranking.isPending}
          isError={ranking.isError && data === undefined}
          isEmpty={data !== undefined && data.items.length === 0}
          error={ranking.error}
          emptyMessage="No matches with these options yet."
          onRetry={() => ranking.refetch()}
        />

        {data !== undefined && data.items.length > 0 && (
          <>
            <table className="leaderboard-table">
              <caption className="visually-hidden">
                Ranking for {options.matchDurationSeconds} second matches with {options.spawnIntervalSeconds} second spawns
              </caption>
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Player</th>
                  <th scope="col">Score</th>
                  <th scope="col">Time</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((entry) => (
                  <tr
                    key={entry.matchId}
                    className={entry.playerId === LOCAL_PLAYER_ID ? 'leaderboard-own-row' : undefined}
                  >
                    <td>{entry.rank}</td>
                    <td>{entry.playerName}</td>
                    <td>{entry.score}</td>
                    <td>{formatTime(Math.round(entry.durationSeconds))}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              isLoadingPage={ranking.isPlaceholderData}
              onChangePage={setPage}
            />
          </>
        )}

        {/* SMALL NOTICE FOR A BACKGROUND REFETCH OR A FAILED REFRESH OF DATA ALREADY ON SCREEN */}
        <p className="leaderboard-updating" role="status">
          {ranking.isFetching && !ranking.isPending ? 'Updating…' : ''}
          {ranking.isError && data !== undefined ? 'Could not refresh. Showing saved data.' : ''}
        </p>

        <button type="button" className="options-menu-secondary-button" onClick={props.onComeBack}>
          Back to Menu
        </button>
      </div>
    </section>
  )
}

export default RankingScreen
