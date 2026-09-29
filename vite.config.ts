import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * GitHub Pages não sabe que isto é uma SPA: ao recarregar /farlands/arhto-keim
 * ele procura um arquivo com esse caminho e devolve 404.html. Copiar o index.html
 * para 404.html faz o React carregar mesmo assim e o roteador resolve a URL.
 * (Na Vercel o mesmo papel é feito pelo rewrite em vercel.json.)
 */
function spaFallback(): Plugin {
  let outDir = 'dist'
  return {
    name: 'spa-fallback-404',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'))
    },
  }
}

// BASE_PATH permite publicar em subpasta (ex.: GitHub Pages em /velha-era/).
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), spaFallback()],
  build: {
    rolldownOptions: {
      output: {
        // React e o pipeline de Markdown mudam pouco: em chunks separados ficam no
        // cache do navegador quando só o conteúdo (.md) muda.
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/ },
            { name: 'markdown', test: /node_modules[\\/]/ },
          ],
        },
      },
    },
  },
})
