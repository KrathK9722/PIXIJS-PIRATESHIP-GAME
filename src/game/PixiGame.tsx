import { useEffect, useRef } from 'react'
import { Application } from 'pixi.js'
import './PixiGame.css'

function PixiGame() {
  const hostRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let disposed = false
    let app: Application | null = null
                                                                                                                                                                                                                                                                                                                                                                               
    async function initializePixi() {
      const host = hostRef.current

      if (host === null) {
        return
      }

      const newApp = new Application()

      await newApp.init({
        background: 0x176b87,
        resizeTo: host,
        antialias: true,
      })

      if (disposed) {
        newApp.destroy({ removeView: true }, { children: true })
        return
      }

      app = newApp
      host.appendChild(newApp.canvas)
    }

    void initializePixi().catch((error: unknown) => {
      console.error('PixiJS initialization failed:', error)
    })

    return () => {
      disposed = true
      app?.destroy({ removeView: true }, { children: true })
    }
  }, [])

  return <div ref={hostRef} className="pixi-host" />
}

export default PixiGame