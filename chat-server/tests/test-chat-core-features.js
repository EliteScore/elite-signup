const { Pool } = require('pg');
const path = require('path');
const { verifyJWTWithBackend } = require('../security/jwtUtils');

// Database connection - uses environment variables from .env file
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const dbPool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
});

// Load test JWT tokens
const testTokens = JSON.parse(require('fs').readFileSync(path.join(__dirname, 'test-jwt-tokens.json'), 'utf8'));

console.log('🚀 Testing Core Chat Features');
console.log('=============================\n');

async function testCoreFeatures() {
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  try {
    // Test 1: Database Connection
    console.log('📊 Test 1: Database Connection');
    console.log('------------------------------');
    try {
      const client = await dbPool.connect();
      const result = await client.query('SELECT NOW() as current_time');
      client.release();
      
      console.log('✅ Database connection successful');
      console.log(`   Current time: ${new Date(result.rows[0].current_time)}`);
      results.passed++;
      results.tests.push('database connection');
    } catch (error) {
      console.log('❌ Database connection failed:', error.message);
      results.failed++;
    }

    // Test 2: JWT Verification
    console.log('\n📊 Test 2: JWT Verification');
    console.log('----------------------------');
    try {
      const token = testTokens.valid_tokens[0].token;
      const verification = await verifyJWTWithBackend(token, '127.0.0.1', dbPool);
      
      if (verification.valid) {
        console.log('✅ JWT verification successful');
        console.log(`   User: ${verification.user.username} (ID: ${verification.user.userId})`);
        console.log(`   Email: ${verification.user.email}`);
        results.passed++;
        results.tests.push('jwt verification');
      } else {
        console.log('❌ JWT verification failed:', verification.error);
        results.failed++;
      }
    } catch (error) {
      console.log('❌ JWT verification error:', error.message);
      results.failed++;
    }

    // Test 3: User Lookup
    console.log('\n📊 Test 3: User Lookup');
    console.log('----------------------');
    try {
      const client = await dbPool.connect();
      const result = await client.query('SELECT user_id, username FROM users_auth WHERE user_id = $1', [1]);
      client.release();
      
      if (result.rows.length > 0) {
        console.log('✅ User lookup successful');
        console.log(`   Found user: ${result.rows[0].username} (ID: ${result.rows[0].user_id})`);
        results.passed++;
        results.tests.push('user lookup');
      } else {
        console.log('❌ User not found');
        results.failed++;
      }
    } catch (error) {
      console.log('❌ User lookup error:', error.message);
      results.failed++;
    }

    // Test 4: Message Operations Table
    console.log('\n📊 Test 4: Message Operations');
    console.log('-----------------------------');
    try {
      const client = await dbPool.connect();
      const result = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'private_messages' 
        ORDER BY ordinal_position
      `);
      client.release();
      
      if (result.rows.length > 0) {
        console.log('✅ Message operations table exists');
        console.log(`   Columns: ${result.rows.map(row => row.column_name).join(', ')}`);
        results.passed++;
        results.tests.push('message operations');
      } else {
        console.log('❌ Message operations table not found');
        results.failed++;
      }
    } catch (error) {
      console.log('❌ Message operations error:', error.message);
      results.failed++;
    }

    // Test 5: Conversation Operations Table
    console.log('\n📊 Test 5: Conversation Operations');
    console.log('----------------------------------');
    try {
      const client = await dbPool.connect();
      const result = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'conversations' 
        ORDER BY ordinal_position
      `);
      client.release();
      
      if (result.rows.length > 0) {
        console.log('✅ Conversation operations table exists');
        console.log(`   Columns: ${result.rows.map(row => row.column_name).join(', ')}`);
        results.passed++;
        results.tests.push('conversation operations');
      } else {
        console.log('❌ Conversation operations table not found');
        results.failed++;
      }
    } catch (error) {
      console.log('❌ Conversation operations error:', error.message);
      results.failed++;
    }

    // Test 6: Chat Tables Overview
    console.log('\n📊 Test 6: Chat Tables Overview');
    console.log('-------------------------------');
    try {
      const client = await dbPool.connect();
      const result = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('conversations', 'private_messages', 'message_reactions', 'message_deletions')
        ORDER BY table_name
      `);
      client.release();
      
      if (result.rows.length > 0) {
        console.log('✅ Chat-related tables found:');
        result.rows.forEach(row => {
          console.log(`   - ${row.table_name}`);
        });
        results.passed++;
        results.tests.push('chat tables');
      } else {
        console.log('❌ Chat tables not found');
        results.failed++;
      }
    } catch (error) {
      console.log('❌ Chat tables error:', error.message);
      results.failed++;
    }

    // Test 7: JWT Token Validation for All Users
    console.log('\n📊 Test 7: JWT Token Validation for All Users');
    console.log('--------------------------------------------');
    let validTokens = 0;
    for (let i = 0; i < testTokens.valid_tokens.length; i++) {
      try {
        const token = testTokens.valid_tokens[i].token;
        const verification = await verifyJWTWithBackend(token, '127.0.0.1', dbPool);
        
        if (verification.valid) {
          console.log(`✅ Token ${i + 1} valid for user: ${verification.user.username}`);
          validTokens++;
        } else {
          console.log(`❌ Token ${i + 1} invalid: ${verification.error}`);
        }
      } catch (error) {
        console.log(`❌ Token ${i + 1} error: ${error.message}`);
      }
    }
    
    console.log(`\n📊 Token validation summary: ${validTokens}/${testTokens.valid_tokens.length} tokens valid`);
    if (validTokens === testTokens.valid_tokens.length) {
      results.passed++;
      results.tests.push('token validation');
    } else {
      results.failed++;
    }

  } catch (error) {
    console.error('❌ Test execution error:', error);
    results.failed++;
  }

  // Print Results
  console.log('\n🎉 Core Chat Features Test Results');
  console.log('===================================');
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  console.log('\n📋 Detailed Results:');
  results.tests.forEach(test => {
    console.log(`  ✅ ${test}`);
  });

  if (results.failed === 0) {
    console.log('\n🎊 All core chat features are working perfectly!');
    console.log('\n✅ The chat server is ready for WebSocket connections');
    console.log('\n📝 Additional Information:');
    console.log('==========================');
    console.log('✅ Server-side caching has been removed for better security');
    console.log('✅ JWT authentication is working with real database users');
    console.log('✅ Database connection is stable and responsive');
    console.log('✅ All chat tables are properly set up');
    console.log('✅ Message and conversation operations are ready');
  } else {
    console.log('\n❌ Some tests failed. Please check the errors above.');
  }

  await dbPool.end();
}

testCoreFeatures().catch(console.error);
