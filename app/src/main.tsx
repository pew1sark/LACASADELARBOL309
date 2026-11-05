import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { initAnalytics } from './lib/analytics'
import { captureAttribution } from './lib/attribution'
import { iniciarMedicionAnima } from './lib/anima'

captureAttribution()
initAnalytics()
iniciarMedicionAnima()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
