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
})
