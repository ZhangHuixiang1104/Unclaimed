import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Internal research previews are served only by the development server.
// Unlicensed museum/newsroom images must never enter the production bundle.
const researchImageDir = fileURLToPath(new URL('../stuffs/名单/史实资料/images/', import.meta.url))
const mapResearchImageDir = fileURLToPath(new URL('../stuffs/行军图/史实资料/images/', import.meta.url))
const researchImages: Record<string, string> = {
  original: '01-手迹原件-三峡博物馆供图.jpg',
  translation: '02-手迹与整理译文-江津融媒体.jpg',
  bridge: '05-四面山红军桥.jpg',
  collection: '08-吴贞和肖像与三峡博物馆收藏证书.jpg',
  temple: '13-金龙寺疗伤院与石岩寨后门.jpg',
}
const mapResearchImages: Record<string, string> = {
  museumMap: '02-三元宫陈列的十万分之一曲靖军用地图.jpg',
  longjieToday: '27-龙街渡宽阔江面航拍无遮蔽.jpg',
  boatmenDisplay: '19-杉乐纪念馆37名船工名单展板.jpg',
}

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'local-research-images',
      apply: 'serve',
      configureServer(server) {
        server.middlewares.use('/__research/list-history', (request, response, next) => {
          const key = (request as { url?: string }).url?.split('?')[0]?.replace(/^\//, '') ?? ''
          const filename = researchImages[key]
          if (!filename) return next()
          try {
            response.setHeader('Content-Type', 'image/jpeg')
            response.setHeader('Cache-Control', 'no-store')
            response.end(readFileSync(join(researchImageDir, filename)))
          } catch {
            response.statusCode = 404
            response.end('Research image not available')
          }
        })
        server.middlewares.use('/__research/map-history', (request, response, next) => {
          const key = (request as { url?: string }).url?.split('?')[0]?.replace(/^\//, '') ?? ''
          const filename = mapResearchImages[key]
          if (!filename) return next()
          try {
            response.setHeader('Content-Type', 'image/jpeg')
            response.setHeader('Cache-Control', 'no-store')
            response.end(readFileSync(join(mapResearchImageDir, filename)))
          } catch {
            response.statusCode = 404
            response.end('Research image not available')
          }
        })
      },
    },
  ],
  server: {
    port: 4173,
    proxy: { '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true } },
  },
  preview: {
    port: 4173,
    proxy: { '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true } },
  },
})
