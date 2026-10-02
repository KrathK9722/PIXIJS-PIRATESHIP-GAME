import './MainMenu.css'

type MainMenuProps = {
  onStartGame: () => void
  onOpenOptions: () => void
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
      </div>
    </section>
  )
}

export default MainMenu