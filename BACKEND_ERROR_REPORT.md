# Leaderboard API Error Report

## Issue Summary
The frontend is receiving a **500 Internal Server Error** when calling the global leaderboard endpoint.

## Frontend Implementation Details

### Endpoint Being Called
- **URL**: `GET https://elitescore-social-4046880acb02.herokuapp.com/v1/leaderboard/global?limit=100`
- **Method**: GET
- **Headers**: 
  - `Content-Type: application/json`
  - `Accept: application/json`
  - `Authorization: Bearer <token>` (optional, as per API docs)

### Error Response Received
```json
{
  "servlet": "org.glassfish.jersey.servlet.ServletContainer-3c0ecd4b",
  "message": "Request failed.",
  "url": "/v1/leaderboard/global",
  "status": "500"
}
```

### Frontend Flow
1. User navigates to `/leaderboard` page
2. Frontend calls Next.js API route: `/api/leaderboard/global?limit=100`
3. Next.js API route proxies request to: `https://elitescore-social-4046880acb02.herokuapp.com/v1/leaderboard/global?limit=100`
4. Backend returns 500 error with the above JSON response
5. Frontend displays error message to user

### Expected Response Format (per API docs)
```json
{
  "success": true,
  "message": "Global leaderboard",
  "data": [
    {
      "rank": 1,
      "userId": 123,
      "username": "alice",
      "xp": 5400
    }
  ]
}
```

## What the Frontend is Doing

### Request Construction
- Base URL: `https://elitescore-social-4046880acb02.herokuapp.com/`
- Endpoint: `v1/leaderboard/global`
- Query Parameter: `limit=100` (default as per API docs)
- No authentication required (per API docs: "Auth: None")

### Error Handling
- Frontend catches the 500 error
- Logs full error details to console for debugging
- Displays user-friendly error message: "The leaderboard service is currently unavailable. Please try again later."

## Questions for Backend Team

1. **Is the endpoint `/v1/leaderboard/global` correctly deployed?**
   - The 500 error suggests the endpoint exists but is failing during execution

2. **What could cause a 500 error on this endpoint?**
   - Database connection issues?
   - Missing data/empty tables?
   - Internal server exception?
   - Configuration issues?

3. **Are there any required parameters or headers we're missing?**
   - The API docs say "Auth: None" but should we be sending something else?

4. **Is there a specific error log on the backend we can check?**
   - The generic "Request failed." message doesn't give us details about the root cause

5. **Should we be using a different base path?**
   - Currently using: `/v1/leaderboard/global`
   - Is this the correct path structure?

## Additional Context

- The same pattern works for other endpoints (communities, user profiles, etc.)
- Only the leaderboard endpoints are failing with 500
- Friends leaderboard endpoint (`/v1/leaderboard/friends`) would likely have the same issue

## Request Details for Backend Debugging

**Full Request URL:**
```
https://elitescore-social-4046880acb02.herokuapp.com/v1/leaderboard/global?limit=100
```

**Request Headers:**
```
Content-Type: application/json
Accept: application/json
```

**cURL Equivalent:**
```bash
curl -X GET "https://elitescore-social-4046880acb02.herokuapp.com/v1/leaderboard/global?limit=100" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json"
```

## Next Steps

Please check:
1. Backend server logs for the exact exception/error
2. Database connectivity and data availability
3. Endpoint configuration and routing
4. Any dependencies or services the leaderboard endpoint relies on

Once the backend issue is resolved, the frontend should work correctly as it's properly handling the API response format.

