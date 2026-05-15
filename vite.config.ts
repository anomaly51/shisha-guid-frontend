import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['babel-plugin-macros', 'babel-plugin-styled-components'],
      },
    }),
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
})
