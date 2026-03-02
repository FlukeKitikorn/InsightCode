import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LoadingProvider } from './contexts/LoadingContext'
import { Toaster } from 'react-hot-toast'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LoadingProvider>
      <>
        <App />
        <Toaster position="top-right" />
      </>
    </LoadingProvider>
  </StrictMode>,
)
