# OpenTelemetry Browser Telemetry Debugging Guide

## Quick Start Debugging

### 1. Access the Debug Console
Navigate to: `http://localhost:5173/app-teamupdates/debug/telemetry`

This page provides:
- Environment variable inspection
- Manual span/metric creation
- Fetch instrumentation testing
- Real-time console output

### 2. Check Browser Console
Open DevTools Console and look for:
```
[Telemetry] Environment variables: {...}
[Telemetry] Parsed OTLP headers: ...
[Telemetry] ✅ Initialized successfully
[Telemetry] Test span created and sent
```

### 3. Check Network Tab
Filter by `/v1/traces` or `/v1/metrics` to see OTLP exports:
- Should see POST requests to OTLP endpoint
- Check response status (200 = success, 401/403 = auth issue, CORS error = CORS issue)

### 4. Check Aspire Dashboard
1. Open dashboard (usually http://localhost:15204 or https://localhost:17261)
2. Navigate to **Traces** tab
3. Filter by service name: `frontend`
4. Look for traces within last few minutes

## Common Issues & Solutions

### Issue 1: No telemetry data appearing in dashboard

**Symptoms:**
- Console shows "Initialized successfully"
- No errors in Network tab
- But no data in Aspire dashboard

**Debug steps:**
1. Check if OTLP endpoint is correct:
   ```javascript
   console.log(import.meta.env.VITE_OTEL_EXPORTER_OTLP_ENDPOINT)
   // Should be http://localhost:4318 or Aspire-provided endpoint
   ```

2. Verify sample rate isn't too low:
   ```javascript
   console.log(import.meta.env.VITE_OTEL_TRACE_SAMPLE_RATE)
   // 0.1 = 10% sampling. Try setting to 1.0 for 100% during debugging
   ```

3. Check if spans are being created:
   - Use debug page to manually create test spans
   - Check browser console for "Test span created and sent"

4. Verify Aspire is receiving data:
   - Check Aspire dashboard logs
   - Look for OTLP ingestion messages

**Solution:**
Update `.env.development`:
```env
VITE_OTEL_TRACE_SAMPLE_RATE=1.0  # 100% sampling for debugging
```

---

### Issue 2: CORS errors in console

**Symptoms:**
```
Access to fetch at 'http://localhost:4318/v1/traces' from origin 
'http://localhost:5173' has been blocked by CORS policy
```

**Cause:**
Dashboard CORS not configured for browser app origin

**Solution:**
When using Aspire AppHost (default), CORS should be auto-configured. If you see this:
1. Verify you're running through `aspire run` (not standalone Vite)
2. Check `apphost.cs` has `.WithOtlpExporter()` on frontend resource
3. Restart Aspire AppHost

For standalone dashboard (not using AppHost):
```bash
docker run --rm -it -d \
    -p 18888:18888 \
    -p 4318:18890 \
    -e DASHBOARD__OTLP__CORS__ALLOWEDORIGINS=http://localhost:5173 \
    --name aspire-dashboard \
    mcr.microsoft.com/dotnet/aspire-dashboard:latest
```

---

### Issue 3: 401 Unauthorized errors

**Symptoms:**
```
POST http://localhost:4318/v1/traces 401 (Unauthorized)
```

**Cause:**
Missing or incorrect OTLP API key header

**Debug steps:**
1. Check if headers are being set:
   ```javascript
   console.log('[Telemetry] Parsed OTLP headers:', ...)
   // Should show ['x-otlp-api-key'] or similar
   ```

2. Verify Aspire is passing headers:
   ```javascript
   console.log(import.meta.env.VITE_OTEL_EXPORTER_OTLP_HEADERS)
   // Should show "x-otlp-api-key=..." when running through Aspire
   ```

**Solutions:**

**Option A: Disable auth for development** (in `apphost.run.json`):
```json
{
  "environmentVariables": {
    "ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS": "true"
  }
}
```

**Option B: Verify WithOtlpExporter()** is in `apphost.cs`:
```csharp
var frontend = builder.AddViteApp("frontend", "./frontend")
    .WithReference(backend)
    .WithOtlpExporter(); // This passes OTLP headers automatically
```

---

### Issue 4: Environment variables not available

**Symptoms:**
```javascript
[Telemetry] Environment variables: {
  OTLP_ENDPOINT: "http://localhost:4318",
  OTLP_HEADERS: "NOT SET",  // ❌ Should be set by Aspire
  RESOURCE_ATTRIBUTES: "NOT SET"
}
```

**Cause:**
Vite not injecting Aspire environment variables

**Solution:**
Verify `vite.config.ts` has the `define` section:
```typescript
export default defineConfig({
  define: {
    'import.meta.env.VITE_OTEL_EXPORTER_OTLP_ENDPOINT': JSON.stringify(
      env.OTEL_EXPORTER_OTLP_ENDPOINT || env.VITE_OTEL_EXPORTER_OTLP_ENDPOINT
    ),
    'import.meta.env.VITE_OTEL_EXPORTER_OTLP_HEADERS': JSON.stringify(
      env.OTEL_EXPORTER_OTLP_HEADERS || env.VITE_OTEL_EXPORTER_OTLP_HEADERS || ''
    ),
    // ...
  }
})
```

Then restart Vite dev server.

---

### Issue 5: Telemetry disabled

**Symptoms:**
```
[Telemetry] Disabled via VITE_ENABLE_TELEMETRY flag
```

**Solution:**
Check `.env.development`:
```env
VITE_ENABLE_TELEMETRY=true  # Must be exactly "true"
```

---

### Issue 6: High sampling dropping traces

**Symptoms:**
- Some traces appear, but many are missing
- Inconsistent telemetry

**Cause:**
Sample rate too low (default 0.1 = 10%)

**Solution:**
For debugging, set to 100%:
```env
VITE_OTEL_TRACE_SAMPLE_RATE=1.0
```

For production, adjust based on traffic volume.

---

## Verification Checklist

Run through this checklist to verify telemetry is working:

- [ ] Navigate to `/debug/telemetry` page
- [ ] Click "Check Config" - verify all env vars are set
- [ ] Open browser DevTools Console
- [ ] Click "Create Test Span" - should see success message
- [ ] Check Network tab for POST to `/v1/traces` (status 200)
- [ ] Open Aspire Dashboard → Traces
- [ ] Filter by `frontend` service
- [ ] See test span within 10 seconds
- [ ] Click "Test Fetch Instrumentation" - should auto-create span
- [ ] Verify fetch span appears in dashboard

## Manual Testing Commands

### Test OTLP endpoint is reachable:
```bash
curl -X POST http://localhost:4318/v1/traces \
  -H "Content-Type: application/json" \
  -d '{"resourceSpans":[]}'
```

Expected: 200 OK (or 401 if auth required)

### Check Aspire dashboard is running:
```bash
curl http://localhost:15204
```

Expected: HTML response

### Verify frontend is serving:
```bash
curl http://localhost:5173/app-teamupdates/
```

Expected: HTML with `<meta name="traceparent">`

## Key Files to Check

1. **frontend/src/telemetry/config.ts** - Initialization logic
2. **frontend/vite.config.ts** - Environment variable injection
3. **frontend/.env.development** - Default config values
4. **apphost.cs** - Aspire resource configuration
5. **apphost.run.json** - Dashboard OTLP endpoint URLs

## Advanced Debugging

### Enable verbose OTLP logging:
Add to `config.ts`:
```typescript
import { DiagConsoleLogger, DiagLogLevel, diag } from '@opentelemetry/api';

// In initializeTelemetry():
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
```

This will log all OTLP export attempts to console.

### Inspect resource attributes:
```javascript
const tracer = trace.getTracer('test');
const span = tracer.startSpan('test');
console.log('Resource:', span.resource.attributes);
span.end();
```

### Monitor BatchSpanProcessor:
The processor batches spans and exports every 500ms. If you create a span and immediately check the dashboard, it might not appear yet. Wait at least 1 second.

## Success Indicators

✅ **Telemetry is working when you see:**
1. Console: `[Telemetry] ✅ Initialized successfully`
2. Console: `[Telemetry] Test span created and sent`
3. Network: POST to `/v1/traces` returns 200 OK
4. Dashboard: Traces appear in "Traces" tab
5. Dashboard: Service name shows as `frontend`
6. Dashboard: Fetch requests create automatic spans

## Still Having Issues?

1. **Restart everything:**
   ```bash
   # Stop Aspire
   # In frontend terminal: Ctrl+C
   cd frontend && npm run dev
   # In root: dotnet run --project apphost.cs
   ```

2. **Check Aspire logs** for OTLP ingestion errors

3. **Clear browser cache** and hard reload (Cmd+Shift+R on Mac)

4. **Try the example from Aspire docs:**
   https://github.com/dotnet/aspire/tree/main/playground/BrowserTelemetry

5. **Open an issue** with:
   - Browser console output
   - Network tab screenshot
   - Environment variable dump from debug page
