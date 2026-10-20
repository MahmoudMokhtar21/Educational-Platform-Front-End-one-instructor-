import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App'
document.body.classList.add('floating-sections-enabled')
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
