# Frontend Quick Start Guide

**Get connected and chatting in 5 minutes!**

---

## What You Need

1. **JWT Token** from your Java backend (includes `userId`, `jti`, `exp`)
2. **Chat Server URL**: 
   - Development: `ws://localhost:3001`
   - Production: `wss://your-chat-server-domain.com`
3. **WebSocket support** in your browser/app

---

## Microservice Architecture

```
Your App Flow:

1. User logs in → Java Backend
2. Java Backend issues JWT token
3. Frontend gets token
4. Frontend connects to Chat Server with token
5. Chat Server validates token independently (same JWT_SECRET)
6. Chat away! 🚀
```

**Key Point:** The chat server validates JWT tokens independently - it does NOT call your Java backend. Both services share:
- Same `JWT_SECRET` environment variable
- Same PostgreSQL database
- Token revocation via `jwt_revocation` table

---

## 5-Minute Setup

```javascript
// STEP 1: Create WebSocket connection
const ws = new WebSocket('ws://localhost:3001');

// STEP 2: Authenticate when connection opens
ws.onopen = () => {
  console.log('✅ Connected!');
  
  // Send JWT token from your Java backend
  ws.send(JSON.stringify({
    type: 'authenticate',
    token: 'your-jwt-token-from-java-backend'
  }));
};

// STEP 3: Handle messages
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === 'auth_success') {
    console.log('✅ Authenticated as:', message.displayName);
    // Now you can send/receive messages!
  }
  
  if (message.type === 'new_message') {
    console.log('💬 New message:', message.content);
    // Display in your UI
  }
  
  if (message.type === 'error') {
    console.error('❌ Error:', message.error);
  }
};

// STEP 4: Send a message
function sendMessage(recipientId, content) {
  ws.send(JSON.stringify({
    type: 'send_private_message',
    recipientId: recipientId,
    content: content
  }));
}
```

---

## Check Server Status

Before connecting, verify the server is ready:

```javascript
// Check if server is ready
fetch('http://localhost:3001/ready')
  .then(res => res.json())
  .then(data => {
    if (data.ready) {
      console.log('✅ Server is ready!');
      // Connect to WebSocket
    }
  });
```

---

## Common Message Types

### Get Online Users
```javascript
ws.send(JSON.stringify({ type: 'get_online_users' }));
```

### Start Conversation
```javascript
ws.send(JSON.stringify({
  type: 'start_conversation',
  recipientId: '456'
}));
```

### Send Message
```javascript
ws.send(JSON.stringify({
  type: 'send_private_message',
  recipientId: '456',
  content: 'Hello!'
}));
```

### Load Older Messages (Pagination)
```javascript
ws.send(JSON.stringify({
  type: 'get_private_messages',
  recipientId: '456',
  limit: 50,
  offset: 50  // Load messages 51-100
}));
```

### Create Group
```javascript
ws.send(JSON.stringify({
  type: 'create_group',
  groupName: 'My Group',
  memberUserIds: ['456', '789']
}));
```

### Send Group Message
```javascript
ws.send(JSON.stringify({
  type: 'send_group_message',
  groupId: 'group123',
  content: 'Hi everyone!'
}));
```

### Send Announcement (Owner/Admin)
```javascript
ws.send(JSON.stringify({
  type: 'send_announcement',
  groupId: 'group123',
  content: 'Important: Meeting at 3 PM!'
}));
```

### Pin Message (Owner/Admin)
```javascript
ws.send(JSON.stringify({
  type: 'pin_message',
  messageId: 'gmsg_001',
  groupId: 'group123'
}));
```

### Get Pinned Messages
```javascript
ws.send(JSON.stringify({
  type: 'get_pinned_messages',
  groupId: 'group123'
}));
```

---

## Next Steps

1. ✅ Read **API_REFERENCE.md** for complete endpoint documentation
2. ✅ Check **CODE_EXAMPLES.md** for full working examples
3. ✅ Use **HELPER_UTILITIES.md** for production-ready helper functions
4. ✅ Review **TROUBLESHOOTING.md** if you run into issues

---

## Need Help?

- **API Reference**: See all 26 message types
- **Code Examples**: Working HTML/JS examples
- **Troubleshooting**: Common issues & solutions

**You're ready to build!** 🚀

