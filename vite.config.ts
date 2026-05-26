import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import vike from 'vike/plugin'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['babel-plugin-macros', 'babel-plugin-styled-components'],
      },
    }),
    vike(),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true,
    },
  },
  ssr: {
    noExternal: ['react-router', 'react-router-dom', 'styled-components'],
    resolve: {
      conditions: ['module-sync', 'module', 'node'],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/react-router') || id.includes('/react-router-dom/')) return 'react'
          if (id.includes('/@reduxjs/toolkit/') || id.includes('/react-redux/')) return 'redux'
          if (id.includes('/i18next/') || id.includes('/react-i18next/')) return 'i18n'
          if (id.includes('/@react-three/') || id.includes('/three/')) return 'three'
          if (id.includes('/styled-components/')) return 'styled'
          return 'vendor'
        },
      },
    },
  },
})
