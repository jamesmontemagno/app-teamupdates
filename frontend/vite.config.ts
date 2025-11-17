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
  console.log('[vite] OTEL_EXPORTER_OTLP_ENDPOINT:', env.OTEL_EXPORTER_OTLP_ENDPOINT);
  console.log('[vite] ASPIRE_DASHBOARD_OTLP_HTTP_ENDPOINT_URL:', env.ASPIRE_DASHBOARD_OTLP_HTTP_ENDPOINT_URL);
  console.log('[vite] VITE_OTEL_EXPORTER_OTLP_ENDPOINT:', env.VITE_OTEL_EXPORTER_OTLP_ENDPOINT);
  
  // Determine the correct OTLP endpoint for browser telemetry
  const otlpEndpoint = env.ASPIRE_DASHBOARD_OTLP_HTTP_ENDPOINT_URL || env.VITE_OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';
  console.log('[vite] ✅ Using OTLP endpoint for browser:', otlpEndpoint);

  return {
    plugins: [react()],
    base: '/app-teamupdates/',
    define: {
      // Make Aspire OTLP environment variables available to the browser
      // These are set by Aspire AppHost in launchSettings.json
      // IMPORTANT: Browsers need HTTP endpoint (4318), not gRPC (21224)
      // Aspire sets OTEL_EXPORTER_OTLP_ENDPOINT to gRPC, so we must use HTTP variant
      'import.meta.env.VITE_OTEL_EXPORTER_OTLP_ENDPOINT': JSON.stringify(otlpEndpoint),
      'import.meta.env.VITE_OTEL_EXPORTER_OTLP_HEADERS': JSON.stringify(
        env.OTEL_EXPORTER_OTLP_HEADERS || env.VITE_OTEL_EXPORTER_OTLP_HEADERS || ''
      ),
      'import.meta.env.VITE_OTEL_RESOURCE_ATTRIBUTES': JSON.stringify(
        env.OTEL_RESOURCE_ATTRIBUTES || env.VITE_OTEL_RESOURCE_ATTRIBUTES || ''
      ),
    },
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
