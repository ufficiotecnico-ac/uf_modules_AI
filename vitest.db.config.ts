import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

/** Test di integrazione sul database reale (progetto OutingModules): `bun run test:db`. */
export default defineConfig(({ mode }) => ({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.db.test.ts'],
    env: loadEnv(mode, process.cwd(), ''),
  },
}))
