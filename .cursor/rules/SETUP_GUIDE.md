# Google OAuth Flow - Updated Behavior

## Backend Changes

### New User Flow
When a Google user signs in for the first time (no EliteScore account with that email):

**Response**: `401 Unauthorized`
```json
{
  "success": false,
  "message": "User not found. Please complete signup.",
  "data": {
    "email": "newuser@gmail.com",
    "sub": "1234567890",
    "needsSignup": true
  }
}
```

### Existing User Flow
When a Google user signs in and their email already has an EliteScore account:

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Google login successful",
  "data": ["FREE", "eyJhbGciOiJIUzI1NiJ9..."]
}
```

## Frontend Integration

### In the Google Callback Handler

```typescript
const response = await fetch(`${API_BASE_URL}/v1/auth/google`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: authorizationCode,
    redirectUri: window.location.origin + '/auth/callback'
  })
});

const result = await response.json();

if (result.success && result.data) {
  // Existing user - login successful
  const [userRole, accessToken] = result.data;
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('userRole', userRole);
  window.location.href = '/home';
  
} else if (result.data && result.data.needsSignup) {
  // New Google user - redirect to signup
  localStorage.setItem('googleEmail', result.data.email);
  localStorage.setItem('googleSub', result.data.sub);
  window.location.href = '/signup?google=true';
  
} else {
  // Other error
  console.error('Google login failed:', result.message);
  alert('Login failed: ' + result.message);
  window.location.href = '/login';
}
```

### In the Signup Page

When `?google=true` is present:

```typescript
const urlParams = new URLSearchParams(window.location.search);
const isGoogleSignup = urlParams.get('google') === 'true';

if (isGoogleSignup) {
  const googleEmail = localStorage.getItem('googleEmail');
  const googleSub = localStorage.getItem('googleSub');
  
  // Pre-fill email field (make it read-only)
  emailInput.value = googleEmail;
  emailInput.readOnly = true;
  
  // Show message: "Complete your profile to continue with Google"
  // Only ask for username (and optionally password as backup)
}

// On submit:
async function handleSignup(username, email, password) {
  const response = await fetch(`${API_BASE_URL}/v1/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });
  
  const result = await response.json();
  
  if (result.success) {
    // After successful signup, if Google signup, link the OAuth account
    if (isGoogleSignup) {
      const googleSub = localStorage.getItem('googleSub');
      // Backend will auto-link on next Google login
      // Or you can call a link endpoint here
      localStorage.removeItem('googleEmail');
      localStorage.removeItem('googleSub');
    }
    
    // Redirect to login or auto-login
    window.location.href = '/login';
  }
}
```

## Complete Flow

### Scenario 1: New Google User
1. User clicks "Sign in with Google" on `/login`
2. Google redirects to `/auth/callback?code=...`
3. Frontend calls `POST /v1/auth/google` with code
4. Backend returns 401 with `needsSignup: true` and email
5. Frontend redirects to `/signup?google=true` with email pre-filled
6. User enters username (email is locked)
7. Frontend calls `POST /v1/auth/signup`
8. User is created; redirect to `/login`
9. User clicks "Sign in with Google" again
10. This time backend finds the account and returns JWT

### Scenario 2: Existing User (First Google Login)
1. User has account with email `user@gmail.com`
2. User clicks "Sign in with Google"
3. Backend finds user by email, creates OAuth link
4. Returns JWT immediately
5. User is logged in

### Scenario 3: Returning Google User
1. OAuth link already exists
2. Backend updates tokens and returns JWT
3. User is logged in immediately

## Security Notes
- Google email must be verified (backend checks `email_verified`)
- Redirect URIs are validated against whitelist
- OAuth tokens are stored securely in database
- JWT is generated only after successful verification

## Testing Checklist
- [ ] New Google user → redirected to signup
- [ ] Existing user (no OAuth link) → logs in and creates link
- [ ] Returning Google user → logs in immediately
- [ ] Invalid/expired code → proper error message
- [ ] Unverified Google email → rejected with 403

