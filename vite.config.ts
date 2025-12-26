import { defineConfig, type Plugin, type ResolveIdResult } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import netlify from '@netlify/vite-plugin-tanstack-start'
import neon from './neon-vite-plugin.ts'

/**
 * Plugin to handle .server.ts files - provides no-op stubs for client builds.
 * This prevents Node.js-only code from leaking into the client bundle.
 */
function serverOnlyPlugin(): Plugin {
    return {
        name: 'server-only',
        enforce: 'pre',
        resolveId(
            id: string,
            _importer: string | undefined,
            options?: { ssr?: boolean }
        ): ResolveIdResult {
            // Only apply to client builds
            if (options?.ssr) return null

            // Handle .server.ts/.server.js modules
            if (id.includes('.server')) {
                return { id: `\0virtual:server-stub:${id}`, moduleSideEffects: false }
            }
            return null
        },
        load(id: string): string | null {
            // Provide empty stubs for server modules in client build
            if (id.startsWith('\0virtual:server-stub:')) {
                return `
          // Server-only module stub for client build
          export const runWithWideEvent = (_initial, fn) => fn();
          export const getWideEvent = () => undefined;
          export const addWide = () => {};
          export const addWideUser = () => {};
          export const addWideRpc = () => {};
          export const addWideError = () => {};
          export const getRequestId = () => undefined;
          export const shouldLog = () => false;
          export const emitWideEvent = () => {};
          export const finalizeAndEmit = () => {};
          export const withLogging = (_name, fn) => fn;
          export const withLoggingInput = (_name, fn) => fn;
        `
            }
            return null
        },
    }
}

const config = defineConfig({
    server: {
        port: 3000,
        allowedHosts: ['localhost', 'lupita-cathedrallike-angla.ngrok-free.dev'],
    },
    plugins: [
        serverOnlyPlugin(),
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
