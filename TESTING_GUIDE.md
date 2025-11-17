# CV Data Flow Testing Guide

## How to Test the Complete Flow

### Test 1: Upload Resume → View Profile
1. Navigate to Profile page
2. Click "Finish Your Setup" button
3. Upload a PDF/DOC resume file
4. Click "Upload & Process"
5. Wait for processing to complete
6. Click "View Profile"
7. **Expected:** Profile displays parsed CV data (experience, education, skills)
8. **Check Console:** Look for `[CV Upload] Dispatching cvUpdated event`

### Test 2: Edit in Settings → Auto-Refresh Profile
1. Open Profile page in browser
2. Open browser DevTools Console
3. Navigate to Settings page
4. Edit "Professional Information" section
5. Make changes to role, company, or skills
6. Click "Save Changes"
7. **Check Console:** Look for:
   - `[Settings] Dispatching cvUpdated event`
   - `[Profile] Received cvUpdated event from: settings`
   - `[Profile] Fetching CV data (trigger: 1)`
8. Navigate back to Profile page
9. **Expected:** Changes are immediately visible without manual refresh

### Test 3: Manual Entry → Display on Profile
1. Navigate to Profile page
2. Click "Finish Your Setup"
3. Click "Fill it out manually"
4. Fill in the manual entry form:
   - Full name
   - Headline
   - At least one experience entry
   - At least one education entry
   - Skills (comma-separated)
5. Click "Save & Process"
6. Click "View Profile"
7. **Expected:** All manually entered data displays correctly
8. **Check Console:** Look for `[CV Upload] Dispatching cvUpdated event`

### Test 4: Settings Edit → Profile Sync (Real-time)
**This tests the event system working across open tabs:**

1. Open Profile page in Tab 1
2. Open Settings page in Tab 2
3. In Tab 2 (Settings):
   - Edit professional information
   - Click "Save Changes"
4. Switch to Tab 1 (Profile)
5. **Expected:** Profile data should refresh automatically
6. **Check Console in Tab 1:** Look for:
   - `[Profile] Received cvUpdated event from: settings`
   - `[Profile] Fetching CV data (trigger: X)`

### Test 5: Search Results Display CV Data
1. Complete Test 1 or Test 3 first (have CV data)
2. Navigate to Search page
3. Search for your own name or other users
4. **Expected:** Search results show:
   - Current job title and company (if available)
   - Or headline from basics (if no job)
   - Profile picture
5. Click on a search result
6. **Expected:** Navigates to correct profile with CV data displayed

### Test 6: LinkedIn-Style Display
1. Ensure you have CV data (Test 1 or Test 3)
2. View your Profile page
3. **Expected in header:**
   - Headline (if available)
   - Current job with "Current" badge (if `is_current: true` or `end_date: null`)
   - Or most recent job (sorted by start_date)
   - Current education with "Current" badge (if `end_date: null`)
   - Or most recent education
4. **Expected in Resume tab:**
   - About section (if summary exists)
   - Experience section (LinkedIn-style cards)
   - Education section (LinkedIn-style cards)
   - Skills section (badges)
   - Projects, Certifications, Languages (if available)

### Test 7: Profile Setup Lock/Unlock
**When CV not uploaded:**
1. Create a new account or clear CV data
2. Navigate to Profile page
3. **Expected:**
   - "Finish Your Setup" button visible
   - Resume tab shows locked state
   - "Setup Profile" button in locked state

**After CV upload:**
1. Upload CV or enter manually
2. Navigate to Profile page
3. **Expected:**
   - "Finish Your Setup" button hidden
   - Resume tab shows CV data
   - No locked state

### Test 8: View Other User's Profile
1. Search for another user who has CV data
2. Click on their profile
3. **Expected:**
   - Their CV data displays (if they have it)
   - No "Finish Your Setup" button
   - No "Edit Profile" button
   - "Follow" and "Block" buttons visible
   - Back button in header (not settings icon)

## Console Debug Messages to Look For

### Successful Upload Flow
```
[CV Upload] Starting file upload to parser API...
[CV Upload] Resume parsed successfully: {...}
[CV Upload] Saving parsed data to user profile...
[CV Upload] Payload being sent to PUT /v1/users/cv: {...}
[CV Upload] PUT response status: 200
[CV Upload] CV saved to profile successfully: {...}
[CV Upload] Dispatching cvUpdated event
```

### Successful Settings Save Flow
```
[Settings] Fetching CV profile data…
[Settings] CV profile fetched {...}
[Settings] Saving CV via settings page... {...}
[Settings] CV updated from settings page: {...}
[Settings] Dispatching cvUpdated event
```

### Successful Profile Refresh Flow
```
[Profile] Listening for cvUpdated events
[Profile] Received cvUpdated event from: settings
[Profile] Fetching CV data (trigger: 1)
[Profile] CV data fetched successfully: {...}
[Profile] Fetching profile data (refreshKey: 1)...
[Profile] Extracted profile: {...}
```

## Common Issues and Solutions

### Issue: Profile doesn't refresh after Settings save
**Check:**
1. Open DevTools Console
2. Look for `[Settings] Dispatching cvUpdated event`
3. Look for `[Profile] Received cvUpdated event from: settings`

**If event is dispatched but not received:**
- Profile page might not be mounted
- Try navigating to Profile page after saving in Settings

### Issue: CV data not displaying
**Check:**
1. Console for `[Profile] CV data fetched successfully: {...}`
2. Verify `hasProfile: true` in the log
3. Check `experienceCount`, `educationCount`, `skillsCount` values

**If all are 0:**
- CV might not have been saved properly
- Check `[CV Upload] PUT response status` (should be 200)

### Issue: "Finish Your Setup" button still shows after upload
**Check:**
1. `isProfileSetup` logic (line 720-721 in profile/page.tsx)
2. Console for `hasCvData` calculation
3. Verify CV data has at least one non-empty section

### Issue: Search results don't show CV data
**Check:**
1. Search results are using `profile.resume` field
2. Console for `mapProfileInfoToResult` output
3. Verify resume data is wrapped correctly: `{ profile: {...} }`

## Performance Notes

- Event listeners are cleaned up on component unmount (no memory leaks)
- CV data is only fetched for own profile (not for viewing others)
- Profile data includes embedded resume for other users
- Search results are enriched with profile pictures via separate API calls

## Browser Compatibility

The `CustomEvent` API is supported in all modern browsers:
- Chrome/Edge: ✅
- Firefox: ✅
- Safari: ✅
- Opera: ✅

## Next Steps After Testing

If all tests pass:
1. ✅ CV upload flow works
2. ✅ Manual entry flow works
3. ✅ Settings editing works
4. ✅ Profile auto-refresh works
5. ✅ Search integration works
6. ✅ LinkedIn-style display works
7. ✅ Profile setup lock/unlock works
8. ✅ View other users works

The implementation is complete and production-ready!

