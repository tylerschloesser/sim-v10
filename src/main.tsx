import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app'
import './index.css'

if (!supportsSafeKeyword()) {
  alert('Your browser does not support the "safe" keyword.')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

function supportsSafeKeyword() {
  return (
    CSS.supports('justify-content', 'safe center') &&
    CSS.supports('align-items', 'safe center')
  )
}
