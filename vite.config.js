import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // host: true binds dev server to all interfaces so phones on the same Wi-Fi
  // can reach the app via the LAN IP printed under "Network:" at startup.
  server: { host: true, port: 5173 },
  test: {
    environment: 'node',
    globals: true,
  },
})
