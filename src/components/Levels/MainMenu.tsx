import './MainMenu.css'
import './OptionsScreen.css'

type MainMenuProps = {
  onStartGame: () => void
  onOpenOptions: () => void
  onOpenRanking: () => void
  onOpenMatchHistory: () => void
}

function MainMenu(props: MainMenuProps) {
  return (
    <section className="main-menu">
      <img
        src="/assets/jungleGaming/png/default/ui/menu/title_pirate_battle.png"
        alt="Pirate Battle"
      />
      <div className="menu-options">
          <button className="menu-button" onClick={props.onStartGame}>Play</button>
          <button className="menu-button"onClick={props.onOpenOptions}>Options</button>
          <div className="options-secondary-menu">
            <button type="button" className="options-menu-secondary-button" onClick={props.onOpenRanking}>
              Ranking
            </button>
            <button type="button" className="options-menu-secondary-button" onClick={props.onOpenMatchHistory}>
              Match History
            </button>
          </div>
      </div>
    </section>
  )
}

export default MainMenu
