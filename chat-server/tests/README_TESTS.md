# Test Suite Documentation

## 📋 Available Tests

### Existing Tests
1. `test-server-startup.js` - Server initialization
2. `test-chat-core-features.js` - Core DM features
3. `test-message-editing-deletion.js` - Message editing/deletion
4. `simple-stress-test.js` - Basic stress testing
5. `stress-test.js` - Comprehensive stress testing
6. `ultimate-comprehensive-test.js` - Full feature test

### New Tests (Just Created)
7. `test-blocking-features.js` - User blocking functionality
8. `test-group-chat-features.js` - Group chat features

---

## 🚀 Running Tests

### Prerequisites
```bash
# Make sure server is running in background
cd chat-server
node server.js &

# Or in separate terminal:
node server.js
```

### Run Individual Tests

**Test Blocking Features:**
```bash
cd tests
node test-blocking-features.js
```

**Test Group Chat:**
```bash
cd tests
node test-group-chat-features.js
```

**Test Core Features:**
```bash
cd tests
node test-chat-core-features.js
```

---

## 🧪 Test: Blocking Features

Tests the user blocking system.

### What It Tests
- ✅ Blocked user cannot send DM
- ✅ Bi-directional blocking (both directions blocked)
- ✅ Non-blocked users can message freely
- ✅ Blocked users hidden from online users list
- ✅ Cannot start conversation with blocked user

### Test Data
- Creates temporary blocking relationship (Alice blocks Bob)
- Cleans up after test
- Uses pre-existing test JWT tokens

### Expected Output
```
✅ Alice received USER_BLOCKED error
✅ Bob received USER_BLOCKED error (bi-directional)
✅ Non-blocked users can message successfully
✅ Bob (blocked) is NOT in Alice's online users list
✅ Cannot start conversation with blocked user

Success Rate: 100%
```

---

## 💬 Test: Group Chat Features

Comprehensive test of all group chat functionality.

### What It Tests
1. ✅ Connect 4 users
2. ✅ Create group with 3 members
3. ✅ Send group message
4. ✅ @Mentions (specific user + @everyone)
5. ✅ Reactions (add/remove)
6. ✅ Add member to group
7. ✅ Get group info
8. ✅ Update group info (name, description)
9. ✅ Edit group message
10. ✅ Leave group
11. ✅ Blocking protection (cannot add blocked user)
12. ✅ Get user's groups
13. ✅ Delete group message

### Test Data
- Creates test group: "Test Team"
- Adds members: Alice (owner), Bob, Charlie
- Sends messages with mentions
- Adds reactions
- Cleans up all test data after

### Expected Output
```
✅ Group created: Test Team
✅ Group message sent and received
✅ Bob received mention notification
✅ Reaction added successfully
✅ Diana added to group
✅ Group info retrieved
✅ Group info updated
✅ Message edited successfully
✅ Diana left the group
✅ Blocked user cannot be added to group
✅ Retrieved user's groups
✅ Message deleted for everyone

Success Rate: 100% (13/13 tests passed)
```

---

## 📊 Test Data Requirements

### JWT Tokens
Tests use `test-jwt-tokens.json` with valid tokens for test users.

### Database Requirements
- Users must exist in `users_auth` table
- Tables must be created:
  - `private_messages`
  - `blocked_relationships`
  - `group_chats`
  - `group_members`
  - `message_reactions`

### Test Cleanup
Both tests automatically clean up:
- ✅ Remove test blocking relationships
- ✅ Delete test groups
- ✅ Delete test messages
- ✅ Close WebSocket connections

---

## 🎯 Quick Test Commands

### Run All Core Tests
```bash
# Terminal 1: Start server
node server.js

# Terminal 2: Run tests
cd tests
node test-chat-core-features.js
node test-blocking-features.js
node test-group-chat-features.js
```

### Run Stress Tests
```bash
cd tests
node simple-stress-test.js
node ultimate-comprehensive-test.js
```

---

## ✅ Expected Results

All tests should pass with 100% success rate if:
- Server is running on port 3001
- Database is accessible
- All tables are created (auto-created on server startup)
- Valid JWT tokens in test-jwt-tokens.json

---

## 🐛 Troubleshooting

**Test fails to connect:**
- Check server is running: `node server.js`
- Check port 3001 is available
- Check firewall settings

**Authentication fails:**
- Check JWT_SECRET in .env matches backend
- Check test-jwt-tokens.json has valid tokens
- Check users exist in database

**Database errors:**
- Check .env has correct database credentials
- Check tables are created (run server once to auto-migrate)
- Check database is accessible

**Blocking test fails:**
- Check `blocked_relationships` table exists
- Check user IDs are valid integers
- Check database permissions

**Group chat test fails:**
- Check `group_chats` and `group_members` tables exist
- Check `is_group_message` column added to `private_messages`
- Run server once to trigger auto-migration

---

## 📝 Creating Custom Tests

Use existing tests as templates:

```javascript
const WebSocket = require('ws');
const testTokens = require('./test-jwt-tokens.json');

async function createConnection(token) {
  const ws = new WebSocket('ws://localhost:3001');
  
  ws.on('open', () => {
    ws.send(JSON.stringify({
      type: 'authenticate',
      token: token
    }));
  });
  
  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    console.log('Received:', msg.type);
  });
}

// Your test logic here
```

---

## 🎊 Summary

- **Total Tests:** 8 test files
- **New Tests:** 2 (blocking + group chat)
- **Coverage:** DMs, Groups, Blocking, Reactions, Mentions
- **Auto-Cleanup:** Yes (removes test data)
- **Real Database:** Tests use actual database
- **WebSocket:** Tests real WebSocket connections

All tests simulate real client behavior! 🚀

