import './OptionsScreen.css'
import './LeaderboardScreen.css'

type MatchHistoryScreenProps = {
  onComeBack: () => void
}

function MatchHistoryScreen(props: MatchHistoryScreenProps) {
  return (
    <section className="options-screen">
      <img
        src="/assets/jungleGaming/png/default/ui/menu/title_pirate_battle.png"
        alt="Pirate Battle"
      />

      <div className="options-menu leaderboard-panel">
        <h1>Match History</h1>

        <p className="leaderboard-message">Match history coming soon.</p>

        <button type="button" className="options-menu-secondary-button" onClick={props.onComeBack}>
          Back to Menu
        </button>
      </div>
    </section>
  )
}

export default MatchHistoryScreen
