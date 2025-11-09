require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../security/encryption');
const { Pool } = require('pg');

// Database connection - uses environment variables from .env file
const dbPool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
});

async function generateTokens() {
  try {
    console.log('🔑 Generating Valid Test JWT Tokens...\n');
    
    // Get real users from database
    const usersResult = await dbPool.query(`
      SELECT user_id, username, email
      FROM users_auth
      ORDER BY user_id
      LIMIT 5
    `);
    
    if (usersResult.rows.length === 0) {
      console.log('❌ No users found in database');
      await dbPool.end();
      process.exit(1);
    }
    
    console.log(`Found ${usersResult.rows.length} users in database\n`);
    
    const validTokens = [];
    
    for (const user of usersResult.rows) {
      const jti = `test-jwt-${user.user_id}-${Date.now()}`;
      
      // Generate token with same structure as Java backend
      const token = jwt.sign(
        {
          sub: user.user_id.toString(),  // User ID as string
          jti: jti                        // Unique JWT ID
        },
        JWT_SECRET,
        {
          algorithm: 'HS256',
          expiresIn: '24h'
        }
      );
      
      validTokens.push({
        token: token,
        user: {
          userId: user.user_id,
          username: user.username,
          email: user.email
        },
        jti: jti
      });
      
      console.log(`✅ Generated token for user ${user.user_id} (${user.username})`);
    }
    
    // Create test tokens object
    const testTokensData = {
      valid_tokens: validTokens,
      generated_at: new Date().toISOString(),
      note: "These tokens are valid for 24 hours and use the current JWT_SECRET"
    };
    
    // Save to file
    const fs = require('fs');
    fs.writeFileSync(
      './test-jwt-tokens.json',
      JSON.stringify(testTokensData, null, 2)
    );
    
    console.log('\n✅ Test tokens saved to test-jwt-tokens.json');
    console.log(`\n📊 Summary:`);
    console.log(`   Total tokens generated: ${validTokens.length}`);
    console.log(`   Expiration: 24 hours`);
    console.log(`   Users: ${validTokens.map(t => t.user.username).join(', ')}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await dbPool.end();
  }
}

generateTokens();

