import { renderToString } from 'react-dom/server'
import { App } from './app'

export default defineEventHandler(async event => {
  const storage = useStorage('templates')
  const template = await storage.getItem<string>('index.html')

  const html = renderToString(<App />)

  return template!.replace(
    '<main id="root" class="container"></main>',
    `<main id="root" class="container">${html}</main>`
  )
})
