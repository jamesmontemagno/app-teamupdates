# User Flow Telemetry - Profile Creation, Team Joining, and Update Posting

This document details the comprehensive telemetry instrumentation for key user flows: profile creation, team joining, and update posting.

## Overview

All critical user operations now have detailed logging with performance tracking, success/failure metrics, and contextual attributes for debugging and monitoring.

## 1. Profile Creation Flow

**Component:** `ProfileSetupPage.tsx`

### Photo Upload
**When:** User selects profile photo
**Success logging:**
```typescript
logInfo('Profile photo uploaded', {
  'photo.size': file.size,
  'component': 'ProfileSetupPage'
});
```

**Error logging:**
```typescript
logWarn('Profile photo exceeds size limit', {
  'photo.size': file.size,
  'photo.limit': 1024 * 1024,  // 1MB
  'component': 'ProfileSetupPage'
});
```

### Profile Creation Submission
**When:** User submits profile form
**Before API call:**
```typescript
logInfo('Creating new profile', {
  'profile.has_photo': !!photoPreview,
  'profile.emoji': emoji,
  'profile.randomization_radius': randomizationRadius,
  'component': 'ProfileSetupPage'
});
```

**Success logging:**
```typescript
logInfo('Profile created successfully', {
  'profile.id': profile.id,
  'profile.display_name': displayName.trim(),
  'profile.has_photo': !!photoPreview,
  'latency.ms': latency,
  'component': 'ProfileSetupPage'
});
```

**Error logging:**
```typescript
logError('Failed to create profile', err as Error, {
  'latency.ms': latency,
  'component': 'ProfileSetupPage'
});
```

### Tracked Attributes
- `profile.id` - Generated user ID
- `profile.display_name` - User's chosen display name
- `profile.has_photo` - Whether user uploaded photo
- `profile.emoji` - Selected emoji
- `profile.randomization_radius` - Privacy setting (50-500m)
- `photo.size` - Photo file size in bytes
- `latency.ms` - Time to create profile

### Use Cases
1. **Onboarding analytics** - Track what percentage of users upload photos
2. **Performance monitoring** - Alert if profile creation >2s
3. **Error debugging** - Identify photo upload vs API failures
4. **Privacy insights** - Understand distribution of randomization radius preferences

---

## 2. Team Browsing & Joining Flow

**Component:** `TeamBrowserPage.tsx`

### Teams Loading
**When:** Page loads, fetches public teams and user's teams
**Success logging:**
```typescript
logInfo('Teams loaded', {
  'teams.public_count': allPublicTeams.length,
  'teams.user_count': userTeamsList.length,
  'user.has_profile': !!currentUserId,
  'component': 'TeamBrowserPage'
});
```

**Error logging:**
```typescript
logError('Failed to load teams', err as Error, {
  'user.id': currentUserId || 'none',
  'component': 'TeamBrowserPage'
});
```

### Team Join Attempt (No Profile)
**When:** User tries to join without creating profile
**Logging:**
```typescript
logInfo('User attempted to join team without profile', {
  'team.id': teamId,
  'component': 'TeamBrowserPage'
});
```

### Team Join Success
**When:** User successfully joins team
**Before API call:**
```typescript
logInfo('User joining team', {
  'team.id': teamId,
  'team.name': team?.name || 'unknown',
  'user.id': userId,
  'component': 'TeamBrowserPage'
});
```

**After successful join:**
```typescript
recordTeamOperation('join', true);  // Metric
logInfo('Successfully joined team', {
  'team.id': teamId,
  'team.name': team?.name || 'unknown',
  'user.id': userId,
  'latency.ms': latency,
  'component': 'TeamBrowserPage'
});
```

### Team Join Failure
**When:** Join operation fails
**Logging:**
```typescript
recordTeamOperation('join', false);  // Metric
logError('Failed to join team', err as Error, {
  'team.id': teamId,
  'team.name': team?.name || 'unknown',
  'user.id': userId,
  'latency.ms': latency,
  'component': 'TeamBrowserPage'
});
```

### Tracked Attributes
- `teams.public_count` - Number of public teams available
- `teams.user_count` - Number of teams user is member of
- `team.id` - Team identifier
- `team.name` - Human-readable team name
- `user.id` - User identifier
- `user.has_profile` - Whether user completed onboarding
- `latency.ms` - Time to join team

### Metrics
- `recordTeamOperation('join', true)` - Successful join counter
- `recordTeamOperation('join', false)` - Failed join counter

### Use Cases
1. **Funnel analysis** - Track conversion from browse → join → post
2. **Team popularity** - Identify which teams users join most
3. **Error monitoring** - Alert on high join failure rate
4. **Onboarding friction** - Track how often users try to join without profile
5. **Performance** - Monitor join latency across different team sizes

---

## 3. Update Creation Flow

**Component:** `UpdatesContext.tsx`

### Update Creation Start
**When:** User submits update via UpdateComposer
**Before API call:**
```typescript
logInfo('Creating new update', {
  'team.id': teamId,
  'user.id': payload.userId,
  'update.category': payload.category,
  'update.has_media': !!payload.media,
  'update.media_type': payload.media?.type || 'none',
  'update.has_location': !!payload.location,
  'update.text_length': payload.text.length,
  'component': 'UpdatesContext'
});
```

### Update Creation Success
**When:** Update successfully posted
**Logging:**
```typescript
recordUpdateCreated(payload.category, !!payload.media);  // Metric
recordUpdateCreationLatency(latencyMs, payload.category);  // Metric

logInfo('Update created successfully', {
  'team.id': teamId,
  'update.id': createdUpdate.id,
  'update.category': payload.category,
  'latency.ms': latencyMs,
  'component': 'UpdatesContext'
});
```

### Update Creation Failure
**When:** Post fails
**Logging:**
```typescript
logError('Failed to create update', err as Error, {
  'team.id': teamId,
  'update.category': payload.category,
  'latency.ms': latencyMs,
  'component': 'UpdatesContext'
});
```

### Tracked Attributes
- `team.id` - Team where update is posted
- `user.id` - User posting the update
- `update.id` - Generated update ID
- `update.category` - Type: team, life, win, blocker
- `update.has_media` - Whether update has media
- `update.media_type` - Specific type: audio, video, image, none
- `update.has_location` - Whether geotagged
- `update.text_length` - Length of update text
- `latency.ms` - Time to create update

### Metrics
- `recordUpdateCreated(category, hasMedia)` - Update creation counter by category/media
- `recordUpdateCreationLatency(ms, category)` - Latency histogram by category

### Distributed Tracing
- **Span:** `update.create` - Parent span for entire operation
- **Attributes:** team.id, user.id, category, has_media, has_location
- **Child spans:** API fetch (from FetchInstrumentation)

### Use Cases
1. **Content analytics** - Track what types of updates users post most
2. **Media adoption** - Measure audio vs video vs photo usage
3. **Performance SLOs** - Alert if p95 latency >1s
4. **Error patterns** - Identify if failures correlate with media type
5. **Engagement tracking** - Monitor update frequency per team/user

---

## Common Patterns Across All Flows

### Performance Tracking Pattern
```typescript
const startTime = performance.now();
try {
  await operation();
  const latency = performance.now() - startTime;
  logInfo('Success', { 'latency.ms': latency });
} catch (err) {
  const latency = performance.now() - startTime;
  logError('Failed', err, { 'latency.ms': latency });
}
```

### Contextual Logging Pattern
All logs include:
- **Operation context** - What the user was doing
- **Resource identifiers** - team.id, user.id, update.id
- **Metadata flags** - has_photo, has_media, has_location
- **Component name** - For log aggregation/filtering
- **Performance data** - Latency in milliseconds

### Metrics + Logs Pattern
Critical operations emit both:
- **Metrics** - For aggregation, alerting, dashboards
- **Logs** - For debugging individual failures

---

## Aspire Dashboard Queries

### Profile Creation Funnel
1. Count: "Creating new profile"
2. Count: "Profile created successfully"  
3. Conversion rate = (2) / (1)

### Team Join Success Rate
1. Count: `recordTeamOperation('join', true)`
2. Count: `recordTeamOperation('join', false)`
3. Success rate = (1) / (1 + 2)

### Update Posting Performance
1. Histogram: `update.create` span duration
2. p50, p95, p99 latencies by category
3. Alert if p95 > 1000ms

### Media Type Distribution
1. Count logs: `update.media_type=audio`
2. Count logs: `update.media_type=video`
3. Count logs: `update.media_type=image`
4. Count logs: `update.media_type=none`

### Error Debugging
Filter logs by:
- `SeverityText=ERROR`
- `component=ProfileSetupPage|TeamBrowserPage|UpdatesContext`
- Group by error message
- Drill into individual traces

---

## Alerts & SLOs

### Recommended Alerts

**Profile Creation:**
- Error rate >5% in 5min window
- Latency p95 >2s
- Photo upload failures >10% of attempts

**Team Joining:**
- Join failure rate >10%
- Latency p95 >1s
- "No profile" attempts >20% (indicates onboarding issue)

**Update Posting:**
- Error rate >5% in 5min window
- Latency p95 >1s
- Media upload failures >15%

### Service Level Objectives (SLOs)

**Availability:**
- Profile creation: 99.5% success rate
- Team join: 99.0% success rate
- Update posting: 99.5% success rate

**Performance:**
- Profile creation p95 <2s
- Team join p95 <1s
- Update posting p95 <1s

---

## Testing Checklist

### Profile Creation
- ✅ Log "Creating new profile" before API call
- ✅ Log success with profile.id and latency
- ✅ Log errors with latency
- ✅ Log photo upload with size
- ✅ Warn on oversized photo

### Team Joining
- ✅ Log teams loaded with counts
- ✅ Log join attempt with team name
- ✅ Record success/failure metrics
- ✅ Log success with latency
- ✅ Log errors with team context
- ✅ Log "no profile" attempts

### Update Posting
- ✅ Log creation start with category/media type
- ✅ Create span: `update.create`
- ✅ Record creation metrics
- ✅ Log success with update.id
- ✅ Log errors with category
- ✅ Track latency on both paths

---

## Next Steps

1. **Create Aspire dashboard views** for these flows
2. **Set up alerts** based on error rates and latencies
3. **Build funnel dashboards** to track conversion rates
4. **Export metrics** to long-term storage for trend analysis
5. **A/B test optimizations** using telemetry data
