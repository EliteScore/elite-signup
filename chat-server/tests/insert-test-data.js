require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const dbPool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  ssl: { rejectUnauthorized: false }
});

async function insertTestData() {
  console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                   ║');
  console.log('║           INSERTING TEST DATA FOR FOLLOW & BLOCKING              ║');
  console.log('║                                                                   ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  try {
    // First, check if users exist
    console.log('🔍 Checking test users...\n');
    const usersCheck = await dbPool.query(`
      SELECT user_id, username FROM users_auth WHERE user_id IN ('1', '2', '3', '4', '5')
    `);
    
    console.log(`Found ${usersCheck.rows.length} test users:`);
    usersCheck.rows.forEach(user => {
      console.log(`   • User ${user.user_id}: ${user.username}`);
    });
    console.log('');

    // Insert follow relationships (disable trigger temporarily if needed)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 INSERTING FOLLOW RELATIONSHIPS:\n');
    
    // Drop all problematic triggers that reference user_id_serial
    try {
      await dbPool.query(`DROP TRIGGER IF EXISTS trg_user_follows_count ON user_follows`);
      await dbPool.query(`DROP TRIGGER IF EXISTS trg_user_follows_counts ON user_follows`);
      console.log('✅ Dropped problematic triggers\n');
    } catch (e) {
      console.log('⚠️  Could not drop triggers:', e.message, '\n');
    }
    
    // Insert follow relationships
    const followInserts = [
      { follower: 1, followee: 2, desc: 'User 1 follows User 2' },
      { follower: 2, followee: 1, desc: 'User 2 follows User 1 (mutual)' },
      { follower: 1, followee: 3, desc: 'User 1 follows User 3' },
      { follower: 1, followee: 4, desc: 'User 1 follows User 4' },
      { follower: 2, followee: 3, desc: 'User 2 follows User 3' },
      { follower: 3, followee: 2, desc: 'User 3 follows User 2' },
      // User 3 does NOT follow User 1 (for testing NOT_FOLLOWING)
      // User 4 does NOT follow anyone (for testing)
    ];

    for (const follow of followInserts) {
      try {
        await dbPool.query(`
          INSERT INTO user_follows (follower_id, followee_id, created_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (follower_id, followee_id) DO NOTHING
        `, [follow.follower, follow.followee]);
        console.log(`✅ ${follow.desc}`);
      } catch (error) {
        console.log(`⚠️  ${follow.desc} - ${error.message}`);
      }
    }
    
    console.log('');

    // First, clean up old blocking data between test users 1, 2, 3
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧹 CLEANING OLD BLOCKING DATA:\n');
    
    await dbPool.query(`
      DELETE FROM blocked_relationships
      WHERE (blocker_id IN (1, 2, 3) AND blocked_id IN (1, 2, 3))
    `);
    console.log('✅ Cleared old blocking between Users 1, 2, 3\n');
    
    // Insert blocking relationships
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 INSERTING BLOCKING RELATIONSHIPS:\n');
    
    const blockInserts = [
      { blocker: 4, blocked: 5, desc: 'User 4 blocks User 5' },
      { blocker: 5, blocked: 4, desc: 'User 5 blocks User 4 (mutual block)' }
    ];

    for (const block of blockInserts) {
      try {
        await dbPool.query(`
          INSERT INTO blocked_relationships (blocker_id, blocked_id, created_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (blocker_id, blocked_id) DO NOTHING
        `, [block.blocker, block.blocked]);
        console.log(`✅ ${block.desc}`);
      } catch (error) {
        console.log(`⚠️  ${block.desc} - ${error.message}`);
      }
    }

    // Verify data
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ VERIFICATION:\n');
    
    const followCount = await dbPool.query(`
      SELECT COUNT(*) as count FROM user_follows
      WHERE follower_id IN (1, 2, 3, 4) AND followee_id IN (1, 2, 3, 4, 5)
    `);
    console.log(`✅ Follow relationships: ${followCount.rows[0].count} records`);
    
    const blockCount = await dbPool.query(`
      SELECT COUNT(*) as count FROM blocked_relationships
      WHERE blocker_id IN (4, 5) AND blocked_id IN (4, 5)
    `);
    console.log(`✅ Blocking relationships: ${blockCount.rows[0].count} records`);
    
    // Show detailed follow data
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 FOLLOW RELATIONSHIPS MATRIX:\n');
    
    const allFollows = await dbPool.query(`
      SELECT follower_id, followee_id FROM user_follows
      WHERE follower_id IN (1, 2, 3, 4) AND followee_id IN (1, 2, 3, 4)
      ORDER BY follower_id, followee_id
    `);
    
    console.log('   User 1 follows: ', allFollows.rows.filter(r => r.follower_id == 1).map(r => r.followee_id).join(', '));
    console.log('   User 2 follows: ', allFollows.rows.filter(r => r.follower_id == 2).map(r => r.followee_id).join(', '));
    console.log('   User 3 follows: ', allFollows.rows.filter(r => r.follower_id == 3).map(r => r.followee_id).join(', '));
    console.log('   User 4 follows: ', allFollows.rows.filter(r => r.follower_id == 4).map(r => r.followee_id).join(', ') || 'nobody');
    
    console.log('\n📋 KEY TEST SCENARIOS:\n');
    console.log('   ✅ User 1 can message User 2 (mutual following)');
    console.log('   ✅ User 1 can message User 3 (User 1 follows User 3)');
    console.log('   ❌ User 3 cannot message User 1 (User 3 does NOT follow User 1)');
    console.log('   ❌ User 4 cannot message anyone (User 4 follows nobody)');
    console.log('   ❌ User 4 and User 5 cannot interact (blocked)');
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Test data inserted successfully!\n');
    console.log('You can now run: node tests/test-new-features.js\n');

  } catch (error) {
    console.error('\n❌ Error inserting test data:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await dbPool.end();
  }
}

insertTestData();

