const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./encryption');

// Note: Server-side caching removed for better consistency and security
// Each request now hits the database for fresh data

// JWT verification for chat server - microservice approach without caching
// Each service verifies JWT tokens independently using fresh database data
async function verifyJWTWithBackend(token, clientIp, dbPool) {
  try {
    // 1. Validate JWT signature and expiration (same as Java backend)
    if (!validateToken(token)) {
      return { valid: false, error: 'Invalid token signature or expired' };
    }

    // 2. Extract user ID and JTI (same as Java backend)
    const userId = extractUserId(token);
    const jti = extractJti(token);

    // 3. Check if JTI is revoked - always check database for fresh data
    const isRevoked = await checkJTIRevoked(jti, dbPool);
    if (isRevoked) {
      return { valid: false, error: 'Token has been revoked' };
    }

    // 4. Get user details - always get fresh data from database
    const userDetails = await getUserDetails(userId, dbPool);
    if (!userDetails) {
      return { valid: false, error: 'User not found in database' };
    }

    // 5. For microservice approach - no verification code check needed
    // Users are already logged in and have valid JWT tokens
    // This is like Instagram where logged-in users can access chat immediately

    return {
      valid: true,
      user: userDetails
    };

  } catch (error) {
    console.error('JWT verification error:', error.message);
    return { valid: false, error: 'Token validation failed' };
  }
}

// JWT validation functions - microservice approach (same logic as Java backend)
function validateToken(token) {
  try {
    // Use decoded base64 JWT_SECRET (same as Java backend's Keys.hmacShaKeyFor(Decoders.BASE64.decode(base64Key)))
    jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    return true;
  } catch (error) {
    return false;
  }
}

function extractUserId(token) {
  try {
    // Use decoded base64 JWT_SECRET (same as Java backend)
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    return decoded.sub; // subject contains user ID (same as Java backend)
  } catch (error) {
    throw new Error('Failed to extract user ID from token');
  }
}

function extractJti(token) {
  try {
    // Use decoded base64 JWT_SECRET (same as Java backend)
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    return decoded.jti; // JWT ID (same as Java backend)
  } catch (error) {
    throw new Error('Failed to extract JTI from token');
  }
}

// Check if JTI is revoked in database - microservice approach
// Search jwt_revocation table for JTI
// If JTI is found in table = revoked (return true)
// If JTI is NOT found in table = valid/not revoked (return false)
// This matches the Java backend TokenRevocationHandler logic
async function checkJTIRevoked(jti, dbPool) {
  try {
    const result = await dbPool.query(
      'SELECT 1 FROM jwt_revocation WHERE jti = $1 LIMIT 1',
      [jti]
    );
    // If JTI is found in revocation table = revoked (return true)
    // If JTI is NOT found = valid/not revoked (return false)
    return result.rows.length > 0;
  } catch (error) {
    // If table doesn't exist or other database error, assume not revoked
    if (error.code === '42P01') { // relation does not exist
      console.warn('JWT revocation table does not exist, assuming token not revoked');
      return false;
    }
    console.error('Error checking JTI revocation:', error);
    return false; // If we can't check, assume not revoked
  }
}

// Fetch user details from database - same logic as Java backend
async function getUserDetails(userId, dbPool) {
  try {
    // First try to get user from main user tables (Java backend tables)
    let query = `
      SELECT ua.user_id, ua.username, ua.email, upi.first_name, upi.last_name
      FROM users_auth ua
      LEFT JOIN user_profile_info upi ON ua.user_id = upi.user_id
      WHERE ua.user_id = $1
    `;
    let result = await dbPool.query(query, [userId]);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      return {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        displayName: user.first_name && user.last_name ? 
          `${user.first_name} ${user.last_name}` : user.username
      };
    }
    
    // If not found in main tables, try chat_users table (fallback)
    query = `
      SELECT user_id, username, email, first_name, last_name, display_name
      FROM chat_users
      WHERE user_id = $1
    `;
    result = await dbPool.query(query, [userId]);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      return {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        displayName: user.display_name || user.username
      };
    }
    
    return null;
  } catch (error) {
    // If tables don't exist, use fallback user details
    if (error.code === '42P01') { // relation does not exist
      console.warn('User tables do not exist, using fallback user details');
      return {
        userId: userId,
        username: userId,
        email: `${userId}@example.com`,
        firstName: 'User',
        lastName: userId,
        displayName: `User ${userId}`
      };
    }
    // If there's a type conversion error (string to int), use fallback
    if (error.code === '22P02') { // invalid input syntax for type
      console.warn(`User ID type conversion error for ${userId}, using fallback user details`);
      return {
        userId: userId,
        username: userId,
        email: `${userId}@example.com`,
        firstName: 'User',
        lastName: userId,
        displayName: `User ${userId}`
      };
    }
    console.error('Error fetching user details:', error);
    return null;
  }
}

// Cache management functions removed - no longer needed without server-side caching

module.exports = {
  verifyJWTWithBackend,
  validateToken,
  extractUserId,
  extractJti,
  checkJTIRevoked,
  getUserDetails
};
