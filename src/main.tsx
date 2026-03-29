import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'react-day-picker/style.css'
import './globals.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
