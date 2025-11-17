# Telemetry Implementation Summary

This document summarizes the comprehensive OpenTelemetry instrumentation implemented across the Pulseboard frontend application.

## Overview

All instrumentation follows the best practices outlined in `TELEMETRY_BEST_PRACTICES.md`. The implementation includes:
- **Distributed tracing** with parent-child span relationships
- **Business metrics** for user actions and performance
- **Structured logging** for debugging and error tracking
- **Debug mode** with `VITE_OTEL_DEBUG` flag for conditional logging

## Infrastructure Components

### 1. Telemetry SDK Configuration (`src/telemetry/config.ts`)
- **OpenTelemetry SDK 2.2.0** with breaking API changes
- **Protobuf OTLP Exporters** for traces, metrics, and logs
- **Batch processors** with 5s export interval, 30 span batch size
- **Filtering** to exclude noise:
  - Vite HMR requests (`/vite/`, `/@vite/`, etc.)
  - SignalR endpoints (`/hubs/`, `negotiate`)
  - OTLP self-traces (`/v1/traces`, `/v1/metrics`)
- **Auto-instrumentation**: FetchInstrumentation, DocumentLoadInstrumentation

### 2. Metrics Functions (`src/telemetry/metrics.ts`)
New business metrics added:
- `recordMediaCaptured(type, durationMs?)` - Tracks photo/video/audio captures
- `recordGeolocationRequest(success, latency?, errorCode?)` - Tracks geolocation API usage
- `recordSignalRUpdateReceived(teamId)` - Tracks real-time updates
- `recordPageView(pageName)` - Tracks page navigation
- `recordTeamOperation(operation, success)` - Tracks team join/leave
- `recordProfileUpdate(latencyMs)` - Tracks profile save performance

### 3. Logging Utilities (`src/telemetry/logger.ts`)
Structured logging functions:
- `logInfo(message, attributes?)` - Informational logs
- `logWarn(message, attributes?)` - Warning logs
- `logError(message, error?, attributes?)` - Error logs with stack traces
- `logFatal(message, error?, attributes?)` - Fatal errors

All functions accept:
- `message`: string - Human-readable message
- `error?`: Error - Optional error object (for logError/logFatal)
- `attributes?`: Record<string, unknown> - Additional context

## Context Providers

### TeamContext (`src/contexts/TeamContext.tsx`)
**Instrumentation added:**
- ✅ **Span**: `team.fetch` wraps team data fetch
  - Attributes: `team.id`, `team.name`, `component='TeamContext'`
- ✅ **Logs**: 
  - `logInfo` on successful team load (with team details)
  - `logError` on fetch failure (with team ID)

### UpdatesContext (`src/contexts/UpdatesContext.tsx`)
**Instrumentation added:**
- ✅ **Metric**: `recordSignalRUpdateReceived(teamId)` when real-time update arrives
- ✅ **Logs**:
  - `logError` on updates fetch failure (with team ID)

**Pre-existing instrumentation:**
- Spans: `updates.fetch`, `update.create`
- Metrics: `recordUpdateCreated()`, `recordUpdateCreationLatency()`

### UserProfileContext (`src/contexts/UserProfileContext.tsx`)
**Instrumentation added:**
- ✅ **Metric**: `recordProfileUpdate(latency)` tracks save performance
- ✅ **Logs**:
  - `logInfo` on successful profile update (with latency)
  - `logError` on profile update failure (with user ID)

**Pre-existing instrumentation:**
- Spans: `profile.update`, `geocode.location`

## Custom Hooks

### useGeolocation (`src/hooks/useGeolocation.ts`)
**Comprehensive instrumentation:**
- ✅ **Metrics**:
  - `recordGeolocationRequest(true, latency)` on success
  - `recordGeolocationRequest(false, undefined, errorCode)` on failure
- ✅ **Logs**:
  - `logWarn` when geolocation API not supported
  - `logInfo` on successful location capture (with latency and accuracy)
  - `logError` on permission denial or timeout (with error code)

**Tracked attributes:**
- `geo.latency.ms` - Time to get location
- `geo.accuracy.meters` - GPS accuracy
- `geo.error.code` - GeolocationPositionError code (1=permission denied, 2=unavailable, 3=timeout)

### useVoiceRecorder (`src/hooks/useVoiceRecorder.ts`)
**Comprehensive instrumentation:**
- ✅ **Metrics**:
  - `recordMediaCaptured('audio', durationMs)` on recording completion
- ✅ **Logs**:
  - `logWarn` when MediaRecorder API not supported
  - `logInfo` on mic access granted
  - `logInfo` on recording completed (with duration)
  - `logError` on mic access denied

**Implementation note:** Added `elapsedRef` to accurately track duration in async closure.

## Components

### UpdateComposer (`src/components/UpdateComposer.tsx`)
**Complex component with 7 instrumentation points:**

1. ✅ **Geolocation fallback** (useEffect)
   - `logWarn` when using default location due to geo error

2. ✅ **Manual geocoding** (handleManualGeocode)
   - `logError` when geocoding API fails (with location input)

3. ✅ **Camera access** (startCaptureStream)
   - `logWarn` when MediaDevices API not supported
   - `logError` when camera permission denied

4. ✅ **Photo capture** (handleCapturePhoto)
   - `recordMediaCaptured('photo')`

5. ✅ **Video capture** (recorder.onstop)
   - `recordMediaCaptured('video', durationMs)`

6. ✅ **File upload** (handleFileSelection)
   - `logWarn` when file exceeds 6MB size limit (with size details)
   - `recordMediaCaptured(type)` on successful file selection

7. ✅ **Voice recording** (implicit via useVoiceRecorder hook)
   - Automatically tracked by hook instrumentation

## Pages

### ProfilePage (`src/pages/ProfilePage.tsx`)
**Instrumentation added:**

1. ✅ **Profile save** (handleSave)
   - `logInfo` before saving (with profile metadata)
   - Latency tracking handled by `UserProfileContext.updateProfile()`

2. ✅ **Camera operations** (handleCameraCapture)
   - `logWarn` when camera API not supported
   - `logInfo` on camera start/stop
   - `logError` on camera access denied

3. ✅ **Photo capture** (handleTakePhoto)
   - `recordMediaCaptured('photo')`
   - `logInfo` on successful capture

## Testing & Validation

### Debug Page (`src/pages/TelemetryDebugPage.tsx`)
Test interface with buttons to:
- Create test spans (single and nested)
- Create test logs (all severity levels)
- Trigger metric recording
- Force flush exporters
- Check configuration

### Validation Checklist
- ✅ All TypeScript compilation errors resolved
- ✅ No unused imports
- ✅ All metrics functions exported from `telemetry/index.ts`
- ✅ All instrumentation follows consistent patterns
- ✅ Error paths have structured logging
- ✅ Success paths have metrics
- ✅ Critical flows have distributed tracing

## Key Patterns

### Error Logging Pattern
```typescript
try {
  await riskyOperation();
  logInfo('Operation succeeded', { 'operation.id': id });
} catch (err) {
  logError('Operation failed', err as Error, { 'operation.id': id });
  showError(err, 'User-friendly message');
}
```

### Metrics Pattern
```typescript
const startTime = performance.now();
try {
  await operation();
  const latency = performance.now() - startTime;
  recordOperationLatency(latency);
} catch (err) {
  recordOperationFailure();
}
```

### Distributed Tracing Pattern
```typescript
await withSpan(
  'operation.name',
  { 'attribute.key': 'value' },
  async () => {
    // Async work here
  }
);
```

## Next Steps

### Phase 2 (Future Enhancements)
1. Add `recordPageView()` to all page components
2. Add `recordTeamOperation()` to TeamBrowserPage join flow
3. Instrument navigation timing with custom metrics
4. Add user journey tracking (onboarding completion, first update, etc.)
5. Create custom Aspire dashboard views for business metrics

### Monitoring & Alerts
1. Set up alerting for:
   - High error rates in camera/geo/voice APIs
   - Slow profile update latency (>2s)
   - Failed geocoding requests (rate limiting)
   - SignalR connection failures
2. Create SLOs for:
   - Update creation latency (p95 < 1s)
   - Profile save latency (p95 < 500ms)
   - Page load time (p95 < 2s)

## References
- Best practices: `TELEMETRY_BEST_PRACTICES.md`
- Debugging guide: `TELEMETRY_DEBUGGING.md`
- OpenTelemetry SDK docs: https://opentelemetry.io/docs/languages/js/
- Aspire dashboard: https://learn.microsoft.com/en-us/dotnet/aspire/fundamentals/dashboard/overview
