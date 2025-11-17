# CV Data Flow Fix Summary

## Problem Identified
The CV data flow was working correctly for initial upload and display, but there was no synchronization mechanism between pages. When a user edited their professional information in Settings, the Profile page would not automatically refresh to show the updated data.

## Solution Implemented

### 1. Custom Event System for Cross-Page Communication
Implemented a browser-native `CustomEvent` system to notify all listening pages when CV data is updated.

**Event Name:** `cvUpdated`
**Event Detail:** `{ source: "settings" | "cv-upload" }`

### 2. Changes to `app/settings/page.tsx`
**Location:** Line 846-850

After successfully saving CV data via `PUT /v1/users/cv`, the settings page now dispatches a `cvUpdated` event:

```typescript
// Trigger CV update event for other pages to refresh
console.log("[Settings] Dispatching cvUpdated event")
if (typeof window !== "undefined") {
  window.dispatchEvent(new CustomEvent("cvUpdated", { detail: { source: "settings" } }))
}
```

### 3. Changes to `app/profile/cv-upload/page.tsx`
**Location:** Line 386-390

After successfully uploading and saving CV data, the CV upload page dispatches the same event:

```typescript
// Trigger CV update event for other pages to refresh
console.log("[CV Upload] Dispatching cvUpdated event")
if (typeof window !== "undefined") {
  window.dispatchEvent(new CustomEvent("cvUpdated", { detail: { source: "cv-upload" } }))
}
```

### 4. Changes to `app/profile/page.tsx`

#### Added CV Refresh Trigger State
**Location:** Line 89
```typescript
const [cvRefreshTrigger, setCvRefreshTrigger] = useState(0)
```

#### Added Event Listener
**Location:** Line 396-414

The profile page now listens for `cvUpdated` events and triggers a refresh when received:

```typescript
// Listen for CV update events from other pages
useEffect(() => {
  if (typeof window === "undefined") return

  const handleCvUpdate = (event: Event) => {
    const customEvent = event as CustomEvent
    console.log("[Profile] Received cvUpdated event from:", customEvent.detail?.source)
    setCvRefreshTrigger(prev => prev + 1)
    setProfileRefreshKey(prev => prev + 1)
  }

  window.addEventListener("cvUpdated", handleCvUpdate)
  console.log("[Profile] Listening for cvUpdated events")

  return () => {
    window.removeEventListener("cvUpdated", handleCvUpdate)
    console.log("[Profile] Stopped listening for cvUpdated events")
  }
}, [])
```

#### Enhanced CV Fetch with Trigger
**Location:** Line 425, 455

The CV fetch now depends on `cvRefreshTrigger`, ensuring it re-fetches when the event is received:

```typescript
console.log("[Profile] Fetching CV data (trigger:", cvRefreshTrigger, ")")
// ... fetch logic ...
}, [isAuthorized, isViewingOwnProfile, profileRefreshKey, cvRefreshTrigger])
```

#### Enhanced Profile Fetch Logging
**Location:** Line 474, 507-516

Added more detailed logging to track profile data fetches and resume data structure:

```typescript
console.log("[Profile] Fetching profile data (refreshKey:", profileRefreshKey, ")...")
// ... later ...
console.log("[Profile] Extracted profile:", {
  userId: possibleProfile?.userId,
  hasResume: !!possibleProfile?.resume,
  resumeType: typeof possibleProfile?.resume,
})
```

## Data Flow Diagram

```
┌─────────────────────┐
│  CV Upload Page     │
│  (upload or manual) │
└──────────┬──────────┘
           │
           │ 1. POST to parser (if upload)
           │ 2. PUT /v1/users/cv
           │ 3. Dispatch "cvUpdated" event
           │
           ▼
┌─────────────────────┐         ┌─────────────────────┐
│  Settings Page      │◄────────┤  Profile Page       │
│  (edit CV data)     │         │  (display CV data)  │
└──────────┬──────────┘         └──────────┬──────────┘
           │                               │
           │ 1. PUT /v1/users/cv           │ 1. Listens for "cvUpdated"
           │ 2. Dispatch "cvUpdated" event │ 2. GET /v1/users/cv (refresh)
           │                               │ 3. GET /v1/users/profile/get_own_profile
           │                               │
           └───────────────────────────────┘
                    Event propagation
```

## Benefits

1. **Real-time Synchronization:** Changes made in Settings immediately reflect on the Profile page without manual refresh
2. **Decoupled Architecture:** Pages don't need direct references to each other
3. **Extensible:** New pages can easily listen for CV updates by adding the same event listener
4. **Debug-Friendly:** Comprehensive logging tracks the entire data flow
5. **No Breaking Changes:** Existing functionality remains intact

## Debug Logging Added

All critical points now have debug logging:

- `[Settings] Dispatching cvUpdated event` - When settings saves CV
- `[CV Upload] Dispatching cvUpdated event` - When upload completes
- `[Profile] Listening for cvUpdated events` - When profile mounts
- `[Profile] Received cvUpdated event from: <source>` - When event is received
- `[Profile] Fetching CV data (trigger: X)` - When CV is being fetched
- `[Profile] CV data fetched successfully: {...}` - With detailed structure info
- `[Profile] Fetching profile data (refreshKey: X)` - When profile is being fetched
- `[Profile] Extracted profile: {...}` - With resume structure info

## Testing Checklist

✅ Upload CV → View Profile (data appears)
✅ Edit in Settings → Profile auto-refreshes
✅ Manual entry → Profile displays correctly
✅ Search results show updated CV data
✅ No linting errors
✅ Event listeners properly cleaned up on unmount

## Files Modified

1. `app/settings/page.tsx` - Added event dispatch after CV save
2. `app/profile/cv-upload/page.tsx` - Added event dispatch after upload
3. `app/profile/page.tsx` - Added event listener and refresh triggers
4. `lib/cv-normalizer.ts` - No changes (already working correctly)
5. `app/search/search-implementation.tsx` - No changes needed (uses profile data which refreshes)

## API Endpoints Used

- `POST /v2/parser/resume/cv` - Parse uploaded resume
- `PUT /v1/users/cv` - Save/update CV data
- `GET /v1/users/cv` - Fetch CV data
- `GET /v1/users/profile/get_own_profile` - Fetch profile with embedded resume
- `GET /v1/users/profile/get_profile/{userId}` - Fetch other user's profile

## Notes

- The event system uses browser-native `CustomEvent` API
- Events are only dispatched in browser context (checked with `typeof window !== "undefined"`)
- Event listeners are properly cleaned up in useEffect return functions
- The `cvRefreshTrigger` state ensures the CV fetch useEffect re-runs when the event is received
- The `profileRefreshKey` ensures the main profile data also refreshes

