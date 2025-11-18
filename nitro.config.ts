import { defineLazyEventHandler, defineEventHandler, fromNodeMiddleware } from 'h3'
import { createServer } from 'vite'


export default defineNitroConfig({
  esbuild: {
    options: {
      jsx: 'automatic'
    }
  },
  handlers: [
    {
      route: '/**',
      handler: 'app/server.tsx',
    }
  ],
  devHandlers: [
    {
      route: '/__vite',
      handler: defineLazyEventHandler(async () => {
        const devServer = await createServer({
          base: '/__vite',
          esbuild: {
            jsx: 'automatic'
          },
          appType: 'custom',
          server: { middlewareMode: true }
        })

        return defineEventHandler(fromNodeMiddleware(devServer.middlewares))
      })
    }

  ]
})
