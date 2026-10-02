import type { MovementInput } from './types'

export function createKeyboardInput() {
  const pressedKeys = new Set<string>()

  function handleKeyDown(event: KeyboardEvent) {
    const key = event.key.toLowerCase()

    if (key.startsWith('arrow')) {
      event.preventDefault()
    }

    pressedKeys.add(key)
  }

  function handleKeyUp(event: KeyboardEvent) {
    pressedKeys.delete(event.key.toLowerCase())
  }

  function clearPressedKeys() {
    pressedKeys.clear()
  }

  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  window.addEventListener('blur', clearPressedKeys)

  return {
    read(): MovementInput {
      return {
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