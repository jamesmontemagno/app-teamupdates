# OpenTelemetry Best Practices for Pulseboard Frontend

## Current Implementation Status

### ✅ Already Implemented
- **Traces**: Core API calls (updates.fetch, update.create, profile.update, geocode.location)
- **Metrics**: Update creation counters and latency histograms
- **Logs**: Infrastructure ready with logger utilities
- **SignalR**: Connection lifecycle instrumentation
- **Auto-instrumentation**: Fetch API calls, document load

---

## Recommended Instrumentation Strategy

### 🎯 **1. Context Providers (High Priority)**

#### UpdatesContext.tsx
**Current**: ✅ Well instrumented
- `updates.fetch` span with team.id
- `update.create` span with detailed attributes
- Metrics: counter + latency histogram

**Recommended additions**:
```typescript
// Add error logging for failed fetches
catch (err) {
  logError('Failed to fetch team updates', err as Error, {
    'team.id': teamId,
    'component': 'UpdatesContext'
  });
  // ... existing error handling
}

// Add metric for SignalR real-time updates received
import { recordSignalRUpdateReceived } from '../telemetry/metrics';

signalR.onUpdateCreated((update: unknown) => {
  recordSignalRUpdateReceived(teamId);
  // ... existing logic
});
```

#### UserProfileContext.tsx  
**Current**: ✅ Good coverage
- `profile.update` span
- `geocode.location` span

**Recommended additions**:
```typescript
// Add error logging
catch (err) {
  logError('Profile update failed', err as Error, {
    'user.id': userId,
    'component': 'UserProfileContext',
    'has_location_update': !!data.defaultLocation
  });
  // ... existing
}

// Add metric for profile operations
import { recordProfileUpdate } from '../telemetry/metrics';

const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
  const startTime = performance.now();
  try {
    await withSpan(/* ... */);
    recordProfileUpdate(performance.now() - startTime);
  } catch (err) {
    // ...
  }
}, []);
```

#### TeamContext.tsx
**Current**: ❌ No instrumentation

**Recommended additions**:
```typescript
import { withSpan, logError, logInfo } from '../telemetry';

const fetchTeam = async () => {
  if (!teamId) return;
  
  setLoading(true);
  setError(null);

  try {
    await withSpan('team.fetch', { 'team.id': teamId }, async () => {
      const fetchedTeam = await api.getTeam(teamId);
      setTeam(fetchedTeam);
      
      logInfo('Team loaded successfully', {
        'team.id': teamId,
        'team.name': fetchedTeam.name,
        'component': 'TeamContext'
      });
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load team';
    setError(message);
    setTeam(null);
    
    logError('Failed to load team', err as Error, {
      'team.id': teamId,
      'component': 'TeamContext'
    });
  } finally {
    setLoading(false);
  }
};
```

---

### 🎯 **2. Component-Level Instrumentation**

#### UpdateComposer.tsx (High Value)
**Current**: ❌ No instrumentation  
**Why important**: Core UX interaction, complex workflow with media/location

**Recommended**:
```typescript
import { withSpan, logWarn, logError, recordMetric } from '../telemetry';

// Track voice recording usage
const voice = useVoiceRecorder(60);

useEffect(() => {
  if (voice.status === 'recording') {
    logInfo('Voice recording started', { 'component': 'UpdateComposer' });
  } else if (voice.status === 'ready') {
    recordMetric('voice_recording_completed', 1, {
      'duration_seconds': voice.elapsed
    });
  }
}, [voice.status]);

// Track geolocation requests
useEffect(() => {
  if (geo.status === 'error') {
    logWarn('Geolocation failed, using default location', {
      'component': 'UpdateComposer',
      'has_default': !!profile.defaultLocation,
      'error': geo.error || 'unknown'
    });
  }
}, [geo.status]);

// Track media capture errors
const handleOpenCaptureModal = (mode: 'photo' | 'video') => {
  withSpanSync('media.capture_start', { 'media.type': mode }, (span) => {
    setCaptureMode(mode);
    setCaptureError(null);
    setShowCaptureModal(true);
  });
};

// Camera access errors
catch (error) {
  logError('Camera access denied', error as Error, {
    'component': 'UpdateComposer',
    'capture_mode': captureMode
  });
  setCaptureError('Unable to access your camera. Please check permissions.');
}

// Manual geocoding
const handleManualGeocode = async () => {
  setGeocoding(true);
  setGeocodeError(null);
  
  try {
    await withSpan('geocode.manual', {
      'location.city': manualCity,
      'location.state': manualState,
      'location.country': manualCountry
    }, async (span) => {
      const result = await geocodeAddress(manualCity, manualState, manualCountry);
      span.setAttribute('geocode.display_name', result.displayName);
      // ... existing logic
    });
  } catch (error) {
    logError('Manual geocoding failed', error as Error, {
      'component': 'UpdateComposer',
      'location_input': `${manualCity}, ${manualState}, ${manualCountry}`
    });
    setGeocodeError(message);
  }
};
```

---

### 🎯 **3. Browser API Hooks**

#### useGeolocation.ts
**Current**: ❌ No instrumentation  
**Why important**: Critical for location features, can fail frequently

**Recommended**:
```typescript
import { logWarn, logInfo, recordMetric } from '../telemetry';

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const { randomizationRadius = 0 } = options;
  const [status, setStatus] = useState<GeolocationStatus>('idle');
  
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      logWarn('Geolocation API not supported', {
        'component': 'useGeolocation',
        'user_agent': navigator.userAgent
      });
      setError('Geolocation is not supported by this browser.');
      setStatus('error');
      return;
    }

    const startTime = performance.now();
    setStatus('pending');
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latency = performance.now() - startTime;
        recordMetric('geolocation_success', 1, {
          'latency_ms': latency,
          'accuracy_meters': pos.coords.accuracy
        });
        
        logInfo('Geolocation acquired', {
          'component': 'useGeolocation',
          'latency_ms': latency.toFixed(0),
          'accuracy': pos.coords.accuracy.toFixed(0),
          'randomization_radius': randomizationRadius
        });
        
        // ... existing logic
      },
      (err) => {
        logError('Geolocation request failed', new Error(err.message), {
          'component': 'useGeolocation',
          'error_code': err.code,
          'error_message': err.message
        });
        setError(err.message || 'Unable to get your location.');
        setStatus('error');
      }
    );
  }, [randomizationRadius]);

  return { status, position, error, requestLocation };
}
```

#### useVoiceRecorder.ts
**Current**: ❌ No instrumentation  
**Why important**: Complex MediaRecorder API, browser compatibility issues

**Recommended**:
```typescript
import { logWarn, logError, logInfo, recordMetric } from '../telemetry';

export function useVoiceRecorder(maxSeconds = 90) {
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      logInfo('Microphone access granted', {
        'component': 'useVoiceRecorder',
        'max_seconds': maxSeconds
      });
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      
      // ... existing logic
      
      recorder.start();
      setStatus('recording');
    } catch (error) {
      logError('Microphone access denied', error as Error, {
        'component': 'useVoiceRecorder'
      });
      setError('Unable to start recording. Please allow microphone access.');
      setStatus('error');
    }
  }, [maxSeconds]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
      
      const duration = elapsedRef.current;
      recordMetric('voice_recording_completed', 1, {
        'duration_seconds': duration,
        'max_seconds': maxSeconds,
        'completion_ratio': duration / maxSeconds
      });
      
      logInfo('Voice recording completed', {
        'component': 'useVoiceRecorder',
        'duration_seconds': duration,
        'max_seconds': maxSeconds
      });
    }
  }, [maxSeconds]);

  return { startRecording, stopRecording, /* ... */ };
}
```

---

### 🎯 **4. Page-Level Instrumentation**

#### ProfilePage.tsx
**Current**: ❌ No instrumentation  
**Why important**: User settings, camera permissions, geocoding

**Recommended**:
```typescript
import { logError, logInfo, withSpan } from '../telemetry';

const handleCameraCapture = async () => {
  if (isCameraActive) {
    // Stop camera
    logInfo('Camera stopped', { 'component': 'ProfilePage' });
    // ... existing
  } else {
    // Start camera
    try {
      await withSpan('camera.request', {}, async (span) => {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' } 
        });
        setStream(mediaStream);
        setIsCameraActive(true);
        span.setAttribute('camera.success', true);
      });
    } catch (error) {
      logError('Camera access denied', error as Error, {
        'component': 'ProfilePage',
        'action': 'profile_photo_capture'
      });
      alert('Unable to access camera. Please check permissions.');
    }
  }
};

const handleSave = async (event: React.FormEvent) => {
  event.preventDefault();
  
  try {
    await withSpan('profile.save', {
      'has_photo_update': photoUrl !== profile.photoUrl,
      'has_location_update': !!city || !!state || !!country
    }, async () => {
      await updateProfile({
        displayName,
        emoji,
        color,
        photoUrl,
        randomizationRadius,
        city,
        state,
        country,
      });
      
      logInfo('Profile saved successfully', {
        'component': 'ProfilePage',
        'user.id': profile.id
      });
      
      navigate(-1);
    });
  } catch (error) {
    logError('Profile save failed', error as Error, {
      'component': 'ProfilePage'
    });
  }
};
```

#### TeamBrowserPage.tsx
**Recommended**:
```typescript
import { withSpan, logInfo, recordMetric } from '../telemetry';

const handleJoinTeam = async (teamId: string) => {
  try {
    await withSpan('team.join', { 'team.id': teamId }, async () => {
      await api.joinTeam(teamId, profile.id);
      
      recordMetric('team_joined', 1, { 'team.id': teamId });
      logInfo('User joined team', {
        'team.id': teamId,
        'user.id': profile.id,
        'component': 'TeamBrowserPage'
      });
      
      navigate(`/teams/${teamId}`);
    });
  } catch (error) {
    logError('Failed to join team', error as Error, {
      'team.id': teamId,
      'component': 'TeamBrowserPage'
    });
  }
};
```

---

### 🎯 **5. Metrics to Add**

Create new metrics in `telemetry/metrics.ts`:

```typescript
// Media usage
export function recordMediaCaptured(type: 'photo' | 'video' | 'audio', durationMs?: number) {
  const meter = getMeter();
  const counter = meter.createCounter('app.media.captured', {
    description: 'Count of media captures by type'
  });
  counter.add(1, { 'media.type': type });
  
  if (durationMs && type !== 'photo') {
    const histogram = meter.createHistogram('app.media.duration_ms', {
      description: 'Duration of audio/video captures'
    });
    histogram.record(durationMs, { 'media.type': type });
  }
}

// Geolocation
export function recordGeolocationRequest(success: boolean, latencyMs: number, errorCode?: number) {
  const meter = getMeter();
  const counter = meter.createCounter('app.geolocation.requests', {
    description: 'Geolocation API requests'
  });
  counter.add(1, { 'success': success, 'error_code': errorCode || 0 });
  
  if (success) {
    const histogram = meter.createHistogram('app.geolocation.latency_ms');
    histogram.record(latencyMs);
  }
}

// SignalR real-time updates
export function recordSignalRUpdateReceived(teamId: string) {
  const meter = getMeter();
  const counter = meter.createCounter('app.signalr.updates_received', {
    description: 'Real-time updates received via SignalR'
  });
  counter.add(1, { 'team.id': teamId });
}

// User interactions
export function recordPageView(pageName: string) {
  const meter = getMeter();
  const counter = meter.createCounter('app.page_views', {
    description: 'Page views by route'
  });
  counter.add(1, { 'page': pageName });
}

// Team operations
export function recordTeamOperation(operation: 'join' | 'leave' | 'create', success: boolean) {
  const meter = getMeter();
  const counter = meter.createCounter('app.team.operations', {
    description: 'Team operations (join/leave/create)'
  });
  counter.add(1, { 'operation': operation, 'success': success });
}
```

---

### 🎯 **6. Structured Logs Strategy**

#### When to use each log level:

**DEBUG** (not currently emitted - console.log only):
- Development debugging
- Not sent to production

**INFO** (`logInfo`):
- ✅ Successful operations (profile saved, team joined, location acquired)
- ✅ User actions with context (recording started, camera enabled)
- ✅ State transitions (team loaded, updates fetched)

**WARN** (`logWarn`):
- ⚠️ Degraded functionality (using default location, geolocation failed)
- ⚠️ Non-blocking errors (rate limit warnings, cache misses)
- ⚠️ Permission denials with fallbacks

**ERROR** (`logError`):
- ❌ API failures (fetch errors, 4xx/5xx responses)
- ❌ Browser API errors (camera denied, geolocation failed)
- ❌ User-impacting errors (update creation failed)

**FATAL** (`logFatal`):
- 💀 App-breaking errors (telemetry init failure, critical context errors)
- Rare - most errors are ERROR level

#### Example log patterns:

```typescript
// SUCCESS - INFO
logInfo('Update created successfully', {
  'update.id': newUpdate.id,
  'update.category': category,
  'team.id': teamId,
  'component': 'UpdateComposer'
});

// DEGRADED - WARN
logWarn('Using default location, geolocation unavailable', {
  'reason': geo.error,
  'has_default': !!profile.defaultLocation,
  'component': 'UpdateComposer'
});

// FAILURE - ERROR
logError('Failed to create update', error, {
  'team.id': teamId,
  'has_media': !!media,
  'has_location': !!location,
  'component': 'UpdateComposer'
});
```

---

## Implementation Priority

### 🔥 Phase 1 (Immediate - High Impact)
1. **TeamContext** - Add spans and error logs
2. **UpdateComposer** - Media capture, geolocation failures
3. **useGeolocation** - Success/failure metrics and logs
4. **ProfilePage** - Camera permissions, save operations

### 🎯 Phase 2 (Next Sprint)
5. **useVoiceRecorder** - Recording metrics
6. **TeamBrowserPage** - Join/leave operations
7. **Additional metrics** - Page views, media usage

### 📊 Phase 3 (Future)
8. **Performance metrics** - Component render times
9. **User behavior metrics** - Feature adoption, usage patterns
10. **Error aggregation dashboard** - Group and alert on errors

---

## Anti-Patterns to Avoid

❌ **Don't instrument**:
- Every `useState` setter
- Pure UI renders (unless performance issue)
- Mouse moves, scroll events
- Trivial utility functions

❌ **Don't log**:
- Sensitive data (passwords, tokens, PII)
- Large payloads (full update objects, base64 images)
- Every array iteration
- Console.log for production logging (use structured logs)

✅ **Do instrument**:
- API boundaries
- User-initiated actions
- Browser API calls (camera, mic, geolocation)
- Error paths
- Performance-critical operations (>100ms)
- Business logic outcomes

---

## Testing Your Instrumentation

1. **Trigger the action** in the UI
2. **Check Aspire dashboard**:
   - Traces tab: See spans with attributes
   - Structured Logs: Filter by component/severity
   - Metrics: View counters and histograms
3. **Verify attributes** are meaningful for debugging
4. **Check parent-child relationships** in distributed traces

### Example: Test Update Creation Flow
1. Create update with photo + location
2. **Expected traces**:
   - `update.create` (parent)
     - `HTTP POST /api/teams/{id}/updates` (child)
   - Attributes: team.id, category, has_media=true, has_location=true
3. **Expected logs**:
   - INFO: "Geolocation acquired" (if geo used)
   - INFO: "Update created successfully"
4. **Expected metrics**:
   - `app.updates.created` +1 (category=team, has_media=true)
   - `app.updates.creation_latency_ms` histogram

---

## Key Attributes to Include

### Traces
- `team.id` - Current team context
- `user.id` - Current user
- `component` - React component name
- `operation` - Specific action (save, delete, join)
- `has_media` / `has_location` - Feature usage flags
- `error.type` / `error.message` - Error details

### Logs
- `component` - Where log originated
- `team.id` / `user.id` - Context
- `duration_ms` - Operation time (for perf logs)
- `error.type` / `error.message` / `error.stack` - Errors

### Metrics
- `category` - Update category (team/life/win/blocker)
- `media.type` - photo/video/audio/none
- `success` - true/false for operations
- `page` - Page name for views
- `operation` - join/leave/create for teams

---

## Maintenance

### Review quarterly:
- **Noisy logs** - Reduce INFO logs that fire too frequently
- **Missing coverage** - Add instrumentation to new features
- **Unused metrics** - Remove counters/histograms not visualized
- **Attribute cardinality** - Limit high-cardinality attributes (IDs)

### Dashboard creation:
- Create saved views in Aspire for common scenarios
- Alert on ERROR logs with specific components
- Track P95 latency for critical operations
- Monitor success rates (updates created, teams joined)
