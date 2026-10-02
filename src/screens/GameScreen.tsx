import PixiGame from '../game/PixiGame'
import './GameScreen.css'

function GameScreen() {
  return (
    <section className="game-screen">
      <img src="/assets/png/default/ui/menu/title_pirate_battle.png" alt="Pirate Battle" />
      <div className="game-frame">
        <PixiGame />
      </div>
    </section>
  )
}

export default GameScreen