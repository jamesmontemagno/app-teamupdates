import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:5000';
  const useMockApi = env.VITE_USE_MOCK_API === 'true';
  
  console.log('[vite] Backend URL:', backendUrl);
  console.log('[vite] Mock API:', useMockApi);

  return {
    plugins: [react()],
    base: '/app-teamupdates/',
    server: {
      allowedHosts: ['host.docker.internal'],
      // Only enable proxy if NOT in mock mode
      proxy: useMockApi ? undefined : {
        // Proxy API requests to backend when running standalone
        // In Aspire mode, YARP handles this routing
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false, // Accept self-signed certificates
          rewrite: undefined, // Don't rewrite path
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.log('[vite] proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req) => {
              console.log('[vite] Sending Request to the Target:', req.method, req.url, '→', proxyReq.protocol + '//' + proxyReq.host + proxyReq.path);
            });
            proxy.on('proxyRes', (proxyRes, req) => {
              console.log('[vite] Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
        },
        '/hubs': {
          target: backendUrl,
          changeOrigin: true,
          secure: false, // Accept self-signed certificates
          ws: true, // Enable WebSocket proxying for SignalR
          rewrite: undefined, // Don't rewrite path
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.log('[vite] proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req) => {
              console.log('[vite] Sending Request to the Target:', req.method, req.url, '→', proxyReq.protocol + '//' + proxyReq.host + proxyReq.path);
            });
            proxy.on('proxyRes', (proxyRes, req) => {
              console.log('[vite] Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
        },
      }
    }
  };
});
