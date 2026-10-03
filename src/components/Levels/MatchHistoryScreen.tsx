import { useState } from 'react'
import { useMatchHistory } from '../../services/queries'
import { formatMatchDate, formatTime } from '../Experience/config/time'
import { Pagination, QueryState } from './LeaderboardParts'
import './OptionsScreen.css'
import './LeaderboardScreen.css'

type MatchHistoryScreenProps = {
  onComeBack: () => void
}

function MatchHistoryScreen(props: MatchHistoryScreenProps) {
  const [page, setPage] = useState(1)
  const history = useMatchHistory(page)
  const data = history.data

  return (
    <section className="options-screen">
      <img
        src="/assets/jungleGaming/png/default/ui/menu/title_pirate_battle.png"
        alt="Pirate Battle"
      />

      <div className="options-menu leaderboard-panel">
        <h1>Match History</h1>

        <QueryState
          isPending={history.isPending}
          isError={history.isError && data === undefined}
          isEmpty={data !== undefined && data.items.length === 0}
          error={history.error}
          emptyMessage="No matches yet. Play one!"
          onRetry={() => history.refetch()}
        />

        {data !== undefined && data.items.length > 0 && (
          <>
            <table className="leaderboard-table">
              <caption className="visually-hidden">Your match history, newest first</caption>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Score</th>
                  <th scope="col">Time</th>
                  <th scope="col">Ended</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((match) => (
                  <tr key={match.matchId}>
                    <td>{formatMatchDate(match.completedAt)}</td>
                    <td>{match.score}</td>
                    <td>{formatTime(Math.round(match.durationSeconds))}</td>
                    <td>{match.finishReason === 'time' ? 'Time up' : 'Sunk'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              isLoadingPage={history.isPlaceholderData}
              onChangePage={setPage}
            />
          </>
        )}

        <p className="leaderboard-updating" role="status">
          {history.isFetching && !history.isPending ? 'Updating…' : ''}
          {history.isError && data !== undefined ? 'Could not refresh. Showing saved data.' : ''}
        </p>

        <button type="button" className="options-menu-secondary-button" onClick={props.onComeBack}>
          Back to Menu
        </button>
      </div>
    </section>
  )
}

export default MatchHistoryScreen
