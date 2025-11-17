# Search Production Debugging Guide

## Problem
Search works on **localhost** but fails on **production** (`https://elitescore-99036167858c.herokuapp.com/search`)

## Most Likely Cause: CORS

Your frontend is deployed at:
- `https://elitescore-99036167858c.herokuapp.com`

Your backend API is at:
- `https://elitescore-auth-fafc42d40d58.herokuapp.com`

These are **different origins**, so the browser enforces CORS policy.

## How to Verify It's CORS

1. Open the deployed app: `https://elitescore-99036167858c.herokuapp.com/search`
2. Open browser DevTools (F12) → Console tab
3. Type something in search and look for error like:

```
Access to fetch at 'https://elitescore-auth-fafc42d40d58.herokuapp.com/v1/users/search/...' 
from origin 'https://elitescore-99036167858c.herokuapp.com' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

If you see this, it's CORS.

## Solution: Fix Backend CORS Configuration

The backend API at `elitescore-auth-fafc42d40d58.herokuapp.com` needs to allow requests from `elitescore-99036167858c.herokuapp.com`.

### Backend Fix (Java/Spring Boot)

Add or update your CORS configuration:

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(
                    "http://localhost:3000",
                    "https://elitescore-99036167858c.herokuapp.com"
                )
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
```

Or if you're using a filter:

```java
@Component
public class CorsFilter implements Filter {
    
    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        HttpServletResponse response = (HttpServletResponse) res;
        HttpServletRequest request = (HttpServletRequest) req;
        
        String origin = request.getHeader("Origin");
        
        // Allow localhost and production frontend
        if (origin != null && 
            (origin.equals("http://localhost:3000") || 
             origin.equals("https://elitescore-99036167858c.herokuapp.com"))) {
            response.setHeader("Access-Control-Allow-Origin", origin);
            response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
            response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept");
            response.setHeader("Access-Control-Allow-Credentials", "true");
            response.setHeader("Access-Control-Max-Age", "3600");
        }
        
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_OK);
        } else {
            chain.doFilter(req, res);
        }
    }
}
```

## Alternative: Use a Proxy (Frontend Fix)

If you can't change the backend immediately, add a Next.js API route as a proxy:

Create `app/api/search/[...params]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = "https://elitescore-auth-fafc42d40d58.herokuapp.com"

export async function GET(
  request: NextRequest,
  { params }: { params: { params: string[] } }
) {
  const searchTerm = params.params.join('/')
  const url = `${API_BASE_URL}/v1/users/search/${searchTerm}`
  
  const token = request.headers.get('authorization')
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (token) {
    headers['Authorization'] = token
  }
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
    })
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Search failed' },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

Then update `search-implementation.tsx`:

```typescript
const getSearchUrl = (input: string) => {
  const trimmed = input.trim()
  const encoded = encodeURIComponent(trimmed)
  // Use the proxy API route instead of direct backend call
  const url = `/api/search/${encoded}`
  console.log("[Search] Constructed URL:", url)
  return url
}
```

## Debugging Steps

1. Open production site console
2. Search for something
3. Look for these logs:

```
[Search] API Base URL: https://elitescore-auth-fafc42d40d58.herokuapp.com
[Search] Constructed URL: https://elitescore-auth-fafc42d40d58.herokuapp.com/v1/users/search/...
[Search] Making request to: ...
[Search] Network/CORS error detected: TypeError: Failed to fetch
```

4. Check Network tab:
   - Look for the request to the search API
   - If it shows "CORS error" or "blocked", it's CORS
   - If it shows 401/403/404, it's an API issue
   - If it shows 500, backend is crashing

## Expected Console Output

### If CORS is the issue:
```
[Search] Network/CORS error detected: TypeError: Failed to fetch
Cannot connect to search API. This may be a CORS or network issue.
```

### If API returns error:
```
[Search] Response status: 400 Bad Request
[Search] Error response text: {...}
Search failed with status 400
```

### If working correctly:
```
[Search] Response status: 200 OK
[Search] Parsed payload: { success: true, hasData: true, dataLength: 5 }
[Search] Mapped results: 5
[Search] Search completed successfully: 5 results
```

## Quick Test Commands

Open browser console on production and run:

```javascript
// Test if CORS is configured
fetch('https://elitescore-auth-fafc42d40d58.herokuapp.com/v1/users/search/test', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN_HERE'
  }
}).then(r => console.log('Success:', r.status)).catch(e => console.error('Error:', e))
```

If you get `TypeError: Failed to fetch` or CORS error, the backend needs CORS configuration.

## Recommended Action

**Backend team must add CORS configuration** to allow requests from:
- `https://elitescore-99036167858c.herokuapp.com`
- `http://localhost:3000` (for development)

Without this, the frontend cannot communicate with the backend in production.

