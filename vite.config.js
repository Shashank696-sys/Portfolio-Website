import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,              // allow external access (0.0.0.0)
    port: 5173,              // or whatever you're using
    cors: true,
    strictPort: true,        // optional, avoids auto port switching
    allowedHosts: ['basis-sec-twin-bibliography.trycloudflare.com'],     // 🔥 allows *any* host, including trycloudflare.com
  }
})
