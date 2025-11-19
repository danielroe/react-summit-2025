#!/usr/bin/env node

import process from 'node:process'
import { defineCommand, runMain } from 'citty'
import { createNitro, createDevServer, prepare, build, copyPublicAssets, prerender, type NitroConfig } from 'nitropack'
import { loadConfig } from 'c12'
import { createServer, build as buildVite, type UserConfig } from 'vite'
import { defineLazyEventHandler, defineEventHandler, fromNodeMiddleware } from 'h3'
import { writeTypes } from 'nitropack'

const { config } = await loadConfig<{ nitro?: NitroConfig, vite?: UserConfig }>({
  configFile: 'summit.config.ts',
  defaultConfig: {
    nitro: {
      compatibilityDate: 'latest',
      esbuild: {
        options: {
          jsx: 'automatic',
          loaders: {
            '.tsx': 'tsx',
          },
        },
      },
      handlers: [
        {
          handler: './app/server.tsx',
          route: '/**',
        },
      ],
      bundledStorage: ['templates'],
      devStorage: {
        templates: {
          driver: 'fs',
          base: '.nitro/templates',
        },
      },
      publicAssets: [
        {
          dir: './.nitro/client/assets',
          baseURL: '/assets',
          maxAge: 31536000,
        },
      ],
      devHandlers: [
        {
          route: '/__vite',
          handler: defineLazyEventHandler(async () => {
            const viteDevServer = await createServer({
              base: '/__vite/',
              appType: 'custom',
              server: { middlewareMode: true },
              esbuild: {
                jsx: 'automatic',
              },
            })

            return defineEventHandler(fromNodeMiddleware(viteDevServer.middlewares))
          }),
        },
      ],
    },
  },
})

const rootDir = process.cwd()

runMain({
  subCommands: {
    dev: defineCommand({
      async run () {
        const nitro = await createNitro({
          rootDir,
          dev: true,
          preset: 'nitro-dev',
          ...(config.nitro ?? {}),
        })

        const template = await nitro.storage.getItem('root:index.html')
        await nitro.storage.setItem(
          'templates:index.html',
          template.replace(
            '<script type="module" src="./app/client"></script>',
            `<script type="module" src="/__vite/app/client"></script>
        <script type="module" src="/__vite/@vite/client"></script>`
          )
        )
        const server = createDevServer(nitro)
        await server.listen({})
        await prepare(nitro)
        await build(nitro)
      }
    }),
    build: defineCommand({
      async run () {
        const nitro = await createNitro({
          rootDir,
          dev: false,
          ...(config.nitro ?? {}),
        })
        await prepare(nitro)
        await writeTypes(nitro)

        await buildVite({
          build: {
            outDir: '.nitro/client',
          },
          esbuild: {
            jsx: 'automatic',
          },
          ...(config.vite ?? {}),
        })

        const template = await nitro.storage.getItem('build:client:index.html')
        await nitro.storage.setItem('templates:index.html', template)
        await copyPublicAssets(nitro)

        await prerender(nitro)
        await build(nitro)
        await nitro.close()
        process.exit(0)
      }
    })
  }
})
