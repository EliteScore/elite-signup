# Frontend Integration - Complete Documentation

**Build a complete chat frontend with this microservice architecture.**

---

## 📚 Documentation Structure

All documentation is organized into focused, readable sections:

### 🚀 [Quick Start Guide](./docs/FRONTEND_QUICK_START.md)
**Get connected and chatting in 5 minutes!**
- Microservice architecture overview
- 5-minute setup with code
- Common message types
- Quick examples

**Start here if:** You want to get up and running fast.

---

### 📖 [Complete API Reference](./docs/API_REFERENCE.md)
**All 26 WebSocket message types + HTTP endpoints**
- Authentication
- Direct Messages (7 endpoints)
- Group Chats (14 endpoints)
- Reactions (2 endpoints)
- HTTP Endpoints (4 endpoints)
- Error codes

**Start here if:** You need detailed API documentation.

---

### 💻 [Code Examples](./docs/CODE_EXAMPLES.md)
**Working, copy-paste ready examples**
- Complete HTML chat app (400+ lines, ready to use!)
- React component example
- Connection management
- Message handler patterns

**Start here if:** You want working code to copy and modify.

---

### 🛠️ [Helper Utilities](./docs/HELPER_UTILITIES.md)
**Production-ready utility classes and functions**
- ChatClient wrapper class
- LocalStorage helpers
- Notification helpers
- Date formatting
- Message validation
- Unread message tracker
- Typing indicator debouncer

**Start here if:** You want battle-tested helper functions.

---

## Quick Overview

### Microservice Architecture

```
Your Application Flow:

1. User logs in → Java Backend
2. Java Backend issues JWT token
3. Frontend gets token
4. Frontend connects to Chat Server with token
5. Chat Server validates token independently
6. Start chatting! 🚀
```

**Key Points:**
- 🔑 Java Backend issues JWT tokens
- 🔒 Chat Server validates JWT independently (same `JWT_SECRET`)
- 🗄️ Both services share the same PostgreSQL database
- 🚫 Token revocation via shared `jwt_revocation` table

---

## What's Included

✅ **26 WebSocket message types**  
✅ **4 HTTP monitoring endpoints**  
✅ **Complete working examples** (HTML + React)  
✅ **Production-ready utilities**  
✅ **Event-driven architecture**  
✅ **Offline message queueing**  
✅ **Auto-reconnection with exponential backoff**  
✅ **Natural language documentation with comments**  

---

## 5-Second Example

```javascript
// 1. Initialize
const chatClient = new ChatClient('ws://localhost:3001', yourJwtToken);

// 2. Listen for messages
chatClient.on('new_message', (msg) => console.log(msg));

// 3. Connect
chatClient.connect();

// 4. Send message
chatClient.sendPrivateMessage('user123', 'Hello!');
```

---

## Features Supported

### ✅ Direct Messaging
- Send/receive messages
- Edit/delete messages
- Delete conversations
- Typing indicators
- Message history
- Reply to messages

### ✅ Group Chats
- Create groups
- Send group messages
- Add/remove members
- Promote/demote members
- Leave/delete groups
- @mentions (@username, @everyone)
- Reactions (any emoji)

### ✅ User Management
- Online users list
- Blocking (server-enforced)
- Following (must follow to message)

### ✅ Real-Time Features
- Instant message delivery
- Typing indicators
- Online/offline status
- Group events (member added/removed/left)
- Reaction notifications

---

## Server Information

**Development:** `ws://localhost:3001`  
**Production:** `wss://your-chat-server-domain.com`

**Health Checks:**
- `/health` - Complete health status
- `/ready` - Readiness probe
- `/metrics` - Performance metrics
- `/live` - Liveness probe

---

## Getting Started

1. **Read the Quick Start** → Get connected in 5 minutes
2. **Check API Reference** → Understand all endpoints
3. **Copy Code Examples** → Get working code
4. **Use Helper Utilities** → Save development time

---

## Support & Troubleshooting

### Common Issues

**Connection timeout:**
- Check server is running: `curl http://localhost:3001/health`
- Verify WebSocket URL is correct
- Check JWT token is valid

**Authentication fails:**
- Ensure `JWT_SECRET` matches between Java backend and chat server
- Verify token includes `userId`, `jti`, `exp`
- Check user exists in database

**Cannot send messages:**
- Check rate limiting (30 messages/60 seconds)
- Verify authentication succeeded
- Check if you follow the recipient
- Check for blocking relationships

---

## Requirements

- **JWT Token** from your Java backend
- **WebSocket support** in browser/app
- **Same `JWT_SECRET`** in Java backend and chat server
- **Shared PostgreSQL database** between services

---

## Documentation Files

- 📄 `FRONTEND_QUICK_START.md` - Quick start guide
- 📄 `API_REFERENCE.md` - Complete API documentation
- 📄 `CODE_EXAMPLES.md` - Working code examples
- 📄 `HELPER_UTILITIES.md` - Utility functions

All in `chat-server/docs/` folder.

---

## Version Information

- **Server Version:** 2.0.0
- **WebSocket Protocol:** ws/wss
- **Node.js Required:** 14.x or higher
- **Status:** ✅ Production Ready

---

## Quick Links

- [Architecture Overview](./docs/FRONTEND_QUICK_START.md#microservice-architecture)
- [Authentication Flow](./docs/API_REFERENCE.md#authentication)
- [Direct Messages](./docs/API_REFERENCE.md#direct-messages)
- [Group Chats](./docs/API_REFERENCE.md#group-chats)
- [Complete HTML Example](./docs/CODE_EXAMPLES.md#complete-html-chat-app)
- [ChatClient Class](./docs/HELPER_UTILITIES.md#chatclient-wrapper-class)

---

**Ready to build? Start with the [Quick Start Guide](./docs/FRONTEND_QUICK_START.md)!** 🚀
