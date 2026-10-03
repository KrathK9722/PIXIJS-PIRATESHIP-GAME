import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { queryClient } from './services/queries'

// START THE MOCKED RANKING/HISTORY API BEFORE THE APP
// IF IT FAILS (E.G. NO SERVICE WORKER SUPPORT), THE GAME STILL OPENS; ONLY RANKING/HISTORY FAIL
async function enableMocking(): Promise<void> {
  try {
    const { worker } = await import('./mocks/browser')
    await worker.start({
      onUnhandledFrame: 'bypass',
      quiet: true,
    })
  } catch (error) {
    console.warn('Mock API could not start. Ranking and match history are unavailable.', error)
  }
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>,
  )
})
