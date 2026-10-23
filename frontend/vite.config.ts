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

const chapterResearchImages: Record<string, { directory: string; files: Record<string, string> }> = {
  battery: { directory: '电池盒', files: {
    radio: '17-王诤1955年中将肖像.jpg',
    generator: '01-手摇发电机原件-军事博物馆-国防报配图.jpg',
    memory: '09-云鉴馆藏手摇发电机海报-中国文明网.jpg',
  } },
  shoes: { directory: '草鞋', files: {
    display: '01-绣球草鞋展柜-中央红军长征出发纪念馆-央视.jpg',
    detail: '02-绣球草鞋黑白特写-中国军网.jpg',
    portrait: '10-谢志坚肖像与草鞋-央视2026.jpg',
    label: '04-绣球草鞋与说明牌-中青在线.jpg',
  } },
  bowl: { directory: '饭碗', files: {
    street: '03-城口镇红军街-新华社.jpg',
    detail: '01-红军碗实物特写-南方+.jpg',
    display: '02-红军碗展柜-红军长征粤北纪念馆-新华社.jpg',
  } },
}

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'local-research-images',
      apply: 'serve',
      configureServer(server) {
        for (const chapter of Object.keys(chapterResearchImages)) {
          const entry = chapterResearchImages[chapter]!
          const directory = fileURLToPath(new URL(`../stuffs/${entry.directory}/史实材料/images/`, import.meta.url))
          server.middlewares.use(`/__research/${chapter}-history`, (request, response, next) => {
            const key = (request as { url?: string }).url?.split('?')[0]?.replace(/^\//, '') ?? ''
            const filename = entry.files[key]
            if (!filename) return next()
            try {
              response.setHeader('Content-Type', 'image/jpeg')
              response.setHeader('Cache-Control', 'no-store')
              response.end(readFileSync(join(directory, filename)))
            } catch {
              response.statusCode = 404
              response.end('Research image not available')
            }
          })
        }
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
    port: 5173,
    proxy: { '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true } },
  },
  preview: {
    port: 5173,
    proxy: { '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true } },
  },
})
