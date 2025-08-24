import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Import dev utilities for local database demo
import './services/devUtils.ts'

createRoot(document.getElementById("root")!).render(<App />);
