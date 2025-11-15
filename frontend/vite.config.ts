import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/app-teamupdates/',
  server: {
    allowedHosts: ['host.docker.internal'],
    // Only enable proxy if NOT in mock mode
    proxy: process.env.VITE_USE_MOCK_API === 'true' ? undefined : {
      // Proxy API requests to backend when running standalone
      // In Aspire mode, YARP handles this routing
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/hubs': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true, // Enable WebSocket proxying for SignalR
      },
    }
  }
})
