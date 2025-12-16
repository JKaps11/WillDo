import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import netlify from '@netlify/vite-plugin-tanstack-start'
import neon from './neon-vite-plugin.ts'

const config = defineConfig({
  server: {
    port: 3000,
    allowedHosts: ['localhost', 'lupita-cathedrallike-angla.ngrok-free.dev'],
  },
  plugins: [
    devtools(),
    netlify(),
    neon,
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart({
      srcDirectory: 'src',
    }),
    react(),
  ],
})

export default config
