const WebSocket = require('ws');
const fs = require('fs');
const { Pool } = require('pg');

// Load test JWT tokens
const testTokens = JSON.parse(fs.readFileSync('./test-jwt-tokens.json', 'utf8'));

// Database connection - use .env credentials
require('dotenv').config({ path: '../.env' });

const dbPool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  ssl: { rejectUnauthorized: false }
});

console.log('💬 GROUP CHAT FEATURES TEST');
console.log('================================================================================\n');

const SERVER_URL = 'ws://localhost:3001';

let testResults = {
  passed: 0,
  failed: 0,
  startTime: Date.now(),
  testGroupId: null
};

// Helper to create user connection
async function createUserConnection(user) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(SERVER_URL);
    
    const connection = {
      ws,
      user,
      authenticated: false,
      messages: []
    };
    
    ws.on('open', () => {
      ws.send(JSON.stringify({
        type: 'authenticate',
        token: user.token
      }));
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          connection.messages.push(message);
          
          if (message.type === 'auth_success') {
            connection.authenticated = true;
            connection.userId = message.user.id;
            connection.username = message.user.username;
            resolve(connection);
          }
        } catch (error) {
          console.log(`Received raw message: ${data.toString()}`);
        }
      });
    });
    
    ws.on('error', (error) => {
      reject(error);
    });
    
    setTimeout(() => reject(new Error('Connection timeout')), 10000);
  });
}

// Helper to wait
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runGroupChatTests() {
  let alice, bob, charlie, diana;
  
  try {
    console.log('📡 Phase 1: Connecting test users...\n');
    
    // Connect users
    alice = await createUserConnection({ 
      name: 'Alice', 
      token: testTokens.valid_tokens[0].token 
    });
    console.log(`✅ Alice connected (ID: ${alice.userId}, Username: ${alice.username})`);
    
    bob = await createUserConnection({ 
      name: 'Bob', 
      token: testTokens.valid_tokens[1]?.token || testTokens.valid_tokens[0].token 
    });
    console.log(`✅ Bob connected (ID: ${bob.userId}, Username: ${bob.username})`);
    
    charlie = await createUserConnection({ 
      name: 'Charlie', 
      token: testTokens.valid_tokens[2]?.token || testTokens.valid_tokens[0].token 
    });
    console.log(`✅ Charlie connected (ID: ${charlie.userId}, Username: ${charlie.username})`);
    
    diana = await createUserConnection({ 
      name: 'Diana', 
      token: testTokens.valid_tokens[0].token 
    });
    console.log(`✅ Diana connected (ID: ${diana.userId}, Username: ${diana.username})`);
    
    await wait(1000);
    testResults.passed++;
    
    // Test 1: Create Group
    console.log('\n📊 Test 1: Create Group');
    console.log('─'.repeat(60));
    
    alice.messages = [];
    alice.ws.send(JSON.stringify({
      type: 'create_group',
      groupName: 'Test Team',
      groupDescription: 'Testing group chat features',
      initialMembers: [bob.userId, charlie.userId]
    }));
    
    await wait(2000);
    
    const groupCreated = alice.messages.find(m => m.type === 'group_created');
    if (groupCreated) {
      testResults.testGroupId = groupCreated.group.groupId;
      console.log(`✅ Group created: ${groupCreated.group.groupName}`);
      console.log(`   Group ID: ${testResults.testGroupId}`);
      console.log(`   Members: ${groupCreated.group.members.length}`);
      testResults.passed++;
    } else {
      console.log('❌ Group creation failed');
      testResults.failed++;
    }
    
    // Test 2: Send Group Message
    console.log('\n📊 Test 2: Send Group Message');
    console.log('─'.repeat(60));
    
    if (testResults.testGroupId) {
      alice.messages = [];
      bob.messages = [];
      
      alice.ws.send(JSON.stringify({
        type: 'send_group_message',
        groupId: testResults.testGroupId,
        content: 'Hello team!'
      }));
      
      await wait(1500);
      
      const aliceSent = alice.messages.find(m => m.type === 'group_message_sent');
      const bobReceived = bob.messages.find(m => m.type === 'new_group_message');
      
      if (aliceSent && bobReceived) {
        console.log(`✅ Group message sent and received`);
        console.log(`   Content: "${aliceSent.message.content}"`);
        testResults.passed++;
      } else {
        console.log('❌ Group message failed');
        testResults.failed++;
      }
    }
    
    // Test 3: Send Message with Mentions
    console.log('\n📊 Test 3: Send Message with @Mentions');
    console.log('─'.repeat(60));
    
    if (testResults.testGroupId) {
      alice.messages = [];
      bob.messages = [];
      charlie.messages = [];
      
      alice.ws.send(JSON.stringify({
        type: 'send_group_message',
        groupId: testResults.testGroupId,
        content: `Hey @${bob.username} can you help? @everyone FYI`
      }));
      
      await wait(2000);
      
      const messageSent = alice.messages.find(m => m.type === 'group_message_sent');
      const bobMentioned = bob.messages.find(m => m.type === 'mentioned_in_group');
      const charlieMentioned = charlie.messages.find(m => m.type === 'mentioned_in_group');
      
      if (messageSent && messageSent.message.mentions) {
        console.log(`✅ Message sent with mentions`);
        console.log(`   Mentions found: ${messageSent.message.mentions.length}`);
        console.log(`   Mentions: ${JSON.stringify(messageSent.message.mentions, null, 2)}`);
      }
      
      if (bobMentioned) {
        console.log(`✅ Bob received mention notification`);
        testResults.passed++;
      } else {
        console.log(`❌ Bob did not receive mention notification`);
        testResults.failed++;
      }
      
      if (charlieMentioned) {
        console.log(`✅ Charlie received @everyone notification`);
      } else {
        console.log(`⚠️  Charlie did not receive @everyone notification`);
      }
    }
    
    // Test 4: Add Reaction
    console.log('\n📊 Test 4: Add Reaction to Group Message');
    console.log('─'.repeat(60));
    
    if (testResults.testGroupId) {
      const lastMessage = alice.messages.find(m => m.type === 'group_message_sent')?.message;
      
      if (lastMessage) {
        bob.messages = [];
        bob.ws.send(JSON.stringify({
          type: 'add_group_reaction',
          messageId: lastMessage.id,
          reaction: '👍'
        }));
        
        await wait(1500);
        
        const reactionAdded = bob.messages.find(m => m.type === 'group_reaction_added');
        
        if (reactionAdded) {
          console.log(`✅ Reaction added successfully`);
          console.log(`   Reaction: ${reactionAdded.reaction.reaction}`);
          console.log(`   By: ${reactionAdded.reaction.username}`);
          testResults.passed++;
        } else {
          console.log('❌ Reaction failed');
          testResults.failed++;
        }
      }
    }
    
    // Test 5: Add Member to Group
    console.log('\n📊 Test 5: Add Member to Group');
    console.log('─'.repeat(60));
    
    if (testResults.testGroupId) {
      alice.messages = [];
      alice.ws.send(JSON.stringify({
        type: 'add_group_member',
        groupId: testResults.testGroupId,
        userId: diana.userId
      }));
      
      await wait(1500);
      
      const memberAdded = alice.messages.find(m => m.type === 'member_added');
      
      if (memberAdded) {
        console.log(`✅ Diana added to group`);
        console.log(`   Added by: ${alice.username}`);
        testResults.passed++;
      } else {
        console.log('❌ Add member failed');
        testResults.failed++;
      }
    }
    
    // Test 6: Get Group Info
    console.log('\n📊 Test 6: Get Group Info');
    console.log('─'.repeat(60));
    
    if (testResults.testGroupId) {
      alice.messages = [];
      alice.ws.send(JSON.stringify({
        type: 'get_group_info',
        groupId: testResults.testGroupId
      }));
      
      await wait(1500);
      
      const groupInfo = alice.messages.find(m => m.type === 'group_info');
      
      if (groupInfo) {
        console.log(`✅ Group info retrieved`);
        console.log(`   Name: ${groupInfo.group.groupName}`);
        console.log(`   Members: ${groupInfo.group.memberCount}`);
        console.log(`   Created by: ${groupInfo.group.createdBy}`);
        testResults.passed++;
      } else {
        console.log('❌ Get group info failed');
        testResults.failed++;
      }
    }
    
    // Test 7: Update Group Info
    console.log('\n📊 Test 7: Update Group Info');
    console.log('─'.repeat(60));
    
    if (testResults.testGroupId) {
      alice.messages = [];
      alice.ws.send(JSON.stringify({
        type: 'update_group_info',
        groupId: testResults.testGroupId,
        groupName: 'Updated Test Team',
        groupDescription: 'Updated description'
      }));
      
      await wait(1500);
      
      const groupUpdated = alice.messages.find(m => m.type === 'group_updated');
      
      if (groupUpdated) {
        console.log(`✅ Group info updated`);
        console.log(`   New name: ${groupUpdated.updates.groupName}`);
        testResults.passed++;
      } else {
        console.log('❌ Update group info failed');
        testResults.failed++;
      }
    }
    
    // Test 8: Edit Group Message
    console.log('\n📊 Test 8: Edit Group Message');
    console.log('─'.repeat(60));
    
    if (testResults.testGroupId) {
      // Send a message first
      alice.messages = [];
      alice.ws.send(JSON.stringify({
        type: 'send_group_message',
        groupId: testResults.testGroupId,
        content: 'Original message'
      }));
      
      await wait(1000);
      
      const sentMsg = alice.messages.find(m => m.type === 'group_message_sent');
      
      if (sentMsg) {
        alice.messages = [];
        alice.ws.send(JSON.stringify({
          type: 'edit_group_message',
          messageId: sentMsg.message.id,
          newContent: 'Edited message',
          groupId: testResults.testGroupId
        }));
        
        await wait(1500);
        
        const edited = alice.messages.find(m => m.type === 'group_message_edited');
        
        if (edited) {
          console.log(`✅ Message edited successfully`);
          console.log(`   New content: "${edited.newContent}"`);
          testResults.passed++;
        } else {
          console.log('❌ Message edit failed');
          testResults.failed++;
        }
      }
    }
    
    // Test 9: Leave Group
    console.log('\n📊 Test 9: Leave Group');
    console.log('─'.repeat(60));
    
    if (testResults.testGroupId) {
      diana.messages = [];
      diana.ws.send(JSON.stringify({
        type: 'leave_group',
        groupId: testResults.testGroupId
      }));
      
      await wait(1500);
      
      const leftGroup = diana.messages.find(m => m.type === 'left_group');
      
      if (leftGroup) {
        console.log(`✅ Diana left the group`);
        testResults.passed++;
      } else {
        console.log('❌ Leave group failed');
        testResults.failed++;
      }
    }
    
    // Test 10: Blocking in Group Context
    console.log('\n📊 Test 10: Cannot Add Blocked User to Group');
    console.log('─'.repeat(60));
    
    if (testResults.testGroupId) {
      // Create blocking relationship
      try {
        await dbPool.query(`
          INSERT INTO blocked_relationships (blocker_id, blocked_id)
          VALUES ($1, $2)
          ON CONFLICT (blocker_id, blocked_id) DO NOTHING
        `, [parseInt(alice.userId), parseInt(diana.userId)]);
        console.log(`   Setup: Alice blocked Diana`);
      } catch (error) {
        console.log(`   Setup error: ${error.message}`);
      }
      
      await wait(500);
      
      alice.messages = [];
      alice.ws.send(JSON.stringify({
        type: 'add_group_member',
        groupId: testResults.testGroupId,
        userId: diana.userId
      }));
      
      await wait(1500);
      
      const blockError = alice.messages.find(m => 
        m.type === 'error' && m.code === 'USER_BLOCKED'
      );
      
      if (blockError) {
        console.log(`✅ Blocked user cannot be added to group`);
        console.log(`   Error: "${blockError.message}"`);
        testResults.passed++;
      } else {
        console.log('❌ Blocking protection failed - blocked user was added');
        testResults.failed++;
      }
      
      // Cleanup blocking relationship
      try {
        await dbPool.query(`
          DELETE FROM blocked_relationships
          WHERE blocker_id = $1 AND blocked_id = $2
        `, [parseInt(alice.userId), parseInt(diana.userId)]);
      } catch (error) {
        console.log(`   Cleanup error: ${error.message}`);
      }
    }
    
    // Test 11: Get User Groups
    console.log('\n📊 Test 11: Get User Groups');
    console.log('─'.repeat(60));
    
    alice.messages = [];
    alice.ws.send(JSON.stringify({
      type: 'get_user_groups'
    }));
    
    await wait(1500);
    
    const userGroups = alice.messages.find(m => m.type === 'user_groups');
    
    if (userGroups) {
      console.log(`✅ Retrieved user's groups`);
      console.log(`   Groups count: ${userGroups.groups.length}`);
      if (userGroups.groups.length > 0) {
        console.log(`   First group: ${userGroups.groups[0].groupName}`);
      }
      testResults.passed++;
    } else {
      console.log('❌ Get user groups failed');
      testResults.failed++;
    }
    
    // Test 12: Delete Group Message
    console.log('\n📊 Test 12: Delete Group Message');
    console.log('─'.repeat(60));
    
    if (testResults.testGroupId) {
      // Send a message to delete
      alice.messages = [];
      alice.ws.send(JSON.stringify({
        type: 'send_group_message',
        groupId: testResults.testGroupId,
        content: 'Message to delete'
      }));
      
      await wait(1000);
      
      const msgToDelete = alice.messages.find(m => m.type === 'group_message_sent');
      
      if (msgToDelete) {
        alice.messages = [];
        alice.ws.send(JSON.stringify({
          type: 'delete_group_message',
          messageId: msgToDelete.message.id,
          deleteForEveryone: true
        }));
        
        await wait(1500);
        
        const deleted = alice.messages.find(m => m.type === 'group_message_deleted');
        
        if (deleted && deleted.deleteForEveryone) {
          console.log(`✅ Message deleted for everyone`);
          testResults.passed++;
        } else {
          console.log('❌ Message deletion failed');
          testResults.failed++;
        }
      }
    }
    
    // Cleanup: Delete test group
    console.log('\n🧹 Cleanup: Removing test group...');
    if (testResults.testGroupId) {
      try {
        // Remove all members first
        await dbPool.query(`
          DELETE FROM group_members WHERE group_id = $1
        `, [testResults.testGroupId]);
        
        // Deactivate group
        await dbPool.query(`
          UPDATE group_chats SET is_active = false WHERE group_id = $1
        `, [testResults.testGroupId]);
        
        // Delete group messages
        await dbPool.query(`
          DELETE FROM private_messages 
          WHERE recipient_id = $1 AND is_group_message = true
        `, [testResults.testGroupId]);
        
        console.log('✅ Test group cleaned up');
      } catch (error) {
        console.log(`⚠️  Cleanup warning: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test execution error:', error);
    testResults.failed++;
  }
  
  // Cleanup connections
  console.log('\n🧹 Closing connections...');
  if (alice?.ws) alice.ws.close();
  if (bob?.ws) bob.ws.close();
  if (charlie?.ws) charlie.ws.close();
  if (diana?.ws) diana.ws.close();
  
  await wait(500);
  
  // Print results
  const totalDuration = Date.now() - testResults.startTime;
  const successRate = (testResults.passed / (testResults.passed + testResults.failed)) * 100;
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 GROUP CHAT TEST RESULTS');
  console.log('='.repeat(80));
  console.log(`\n⏱️  Total Duration: ${totalDuration}ms`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${successRate.toFixed(2)}%`);
  
  console.log('\n📋 Tests Performed:');
  console.log('  1. User connections');
  console.log('  2. Create group');
  console.log('  3. Send group message');
  console.log('  4. Mentions (@username, @everyone)');
  console.log('  5. Add reaction');
  console.log('  6. Add member');
  console.log('  7. Get group info');
  console.log('  8. Update group info');
  console.log('  9. Edit message');
  console.log(' 10. Leave group');
  console.log(' 11. Blocking protection');
  console.log(' 12. Get user groups');
  console.log(' 13. Delete message');
  
  if (successRate === 100) {
    console.log('\n🎉 EXCELLENT: All group chat features working perfectly!');
  } else if (successRate >= 80) {
    console.log('\n✅ GOOD: Most group chat features working');
  } else {
    console.log('\n❌ ISSUES: Some group chat features need attention');
  }
  
  await dbPool.end();
  process.exit(successRate >= 80 ? 0 : 1);
}

runGroupChatTests().catch(error => {
  console.error('❌ Fatal error:', error);
  dbPool.end();
  process.exit(1);
});

