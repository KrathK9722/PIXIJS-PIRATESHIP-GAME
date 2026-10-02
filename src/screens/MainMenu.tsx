type MainMenuProps = {
  onStartGame: () => void
  onOpenOptions: () => void
}

function MainMenu(props: MainMenuProps) {
  return (
    <section>
      <h1>Pirate Battle</h1>
        <div className="menu-options">
        <button onClick={props.onStartGame}>Start Game</button>
        <button onClick={props.onOpenOptions}>Options</button>
        </div>
    </section>
  )
}

export default MainMenu