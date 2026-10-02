import type { MovementInput } from '../../../types/types'

export function createKeyboardInput() {
  const pressedKeys = new Set<string>()
  let shootRequested = false

  function handleKeyDown(event: KeyboardEvent) {
    const key = event.key.toLowerCase()

    if (key.startsWith('arrow') || event.code === 'Space') {
      event.preventDefault()
    }

    // Segurar espaço não cria vários tiros.
    if (event.code === 'Space' && !event.repeat && !pressedKeys.has(key)) {
      shootRequested = true
    }

    pressedKeys.add(key)
  }

  function handleKeyUp(event: KeyboardEvent) {
    pressedKeys.delete(event.key.toLowerCase())
  }

  function clearPressedKeys() {
    pressedKeys.clear()
    shootRequested = false
  }

  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  window.addEventListener('blur', clearPressedKeys)

  return {
    read(): MovementInput {
      const shoot = shootRequested
      shootRequested = false
      return {
        shoot,
        forward: pressedKeys.has('w') || pressedKeys.has('arrowup'),
        turnLeft: pressedKeys.has('a') || pressedKeys.has('arrowleft'),
        turnRight: pressedKeys.has('d') || pressedKeys.has('arrowright'),
      }
    },

    destroy() {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', clearPressedKeys)
      pressedKeys.clear()
    },
  }
}
