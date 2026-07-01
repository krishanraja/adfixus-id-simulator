import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initAdfixusEmbed } from '@/core/embed/embed'

// Report height to the parent page so this tool embeds cleanly in adfixus.com.
initAdfixusEmbed({ appName: 'AdFixus-ID-Simulator' })

createRoot(document.getElementById("root")!).render(<App />);
