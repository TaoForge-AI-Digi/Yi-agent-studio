import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

function corsProxyPlugin() {
  return {
    name: 'cors-proxy',
    configureServer(server: any) {
      server.middlewares.use('/api/proxy', async (req: any, res: any) => {
        const url = new URL(req.url!, `http://${req.headers.host}`)
        const target = url.searchParams.get('url')
        if (!target) {
          res.writeHead(400)
          res.end('Missing url param')
          return
        }
        try {
          const headers: Record<string, string> = {}
          if (req.headers.authorization) headers['Authorization'] = req.headers.authorization
          const resp = await fetch(target, { headers })
          res.writeHead(resp.status, { 'Content-Type': 'application/json' })
          const body = await resp.text()
          res.end(body)
        } catch (e: any) {
          res.writeHead(502)
          res.end(JSON.stringify({ error: e.message }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [vue(), corsProxyPlugin()],
  define: {
    __APP_VERSION__: JSON.stringify('0.0.1-yi'),
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    minify: 'esbuild',
    sourcemap: false,
    target: 'es2020',
    chunkSizeWarningLimit: 1500,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/monaco-editor')) return 'monaco-editor'
          if (id.includes('node_modules/mermaid')) return 'mermaid'
          if (id.includes('node_modules/@xterm')) return 'xterm'
          if (id.includes('node_modules')) {
            if (id.includes('vue') || id.includes('pinia') || id.includes('vue-router')) return 'vue-vendor'
            if (id.includes('naive-ui')) return 'ui-vendor'
            return 'vendor'
          }
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
  },
  optimizeDeps: {
    include: ['monaco-editor', 'mermaid', 'vue', 'vue-router', 'pinia', 'naive-ui'],
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api/yi': {
        target: 'http://localhost:3001',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
      },
      '/upload': 'http://localhost:3001',
    },
  },
})
