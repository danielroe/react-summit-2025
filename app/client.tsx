/// <reference types="vite/client" />

import { hydrateRoot, Root } from 'react-dom/client'
import { App } from './app'

export { App }

window.$root ||= hydrateRoot(document.getElementById('root')!, <App />)

if (import.meta.hot) {
  import.meta.hot.accept((mod) => {
    if (mod.App) {
      window.$root.render(<mod.App />)
    }
  })
}

declare global {
  interface Window {
    $root: Root
  }
}
