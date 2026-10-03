import { useState } from 'react'
import { loadOptions } from '../../services/optionsStorage'
import './OptionsScreen.css'
import './LeaderboardScreen.css'

type RankingScreenProps = {
  onComeBack: () => void
}

function RankingScreen(props: RankingScreenProps) {
  // THE RANKING ONLY COMPARES MATCHES PLAYED WITH THE CURRENT OPTIONS
  const [options] = useState(loadOptions)

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

        <p className="leaderboard-message">Ranking coming soon.</p>

        <button type="button" className="options-menu-secondary-button" onClick={props.onComeBack}>
          Back to Menu
        </button>
      </div>
    </section>
  )
}

export default RankingScreen
