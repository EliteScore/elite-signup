# Quick Start Guide - Frontend Integration

**Get started with the chat server in 5 minutes**

---

## 1. Connect to WebSocket

```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.onopen = () => {
  console.log('Connected to chat server');
  // Immediately authenticate
  ws.send(JSON.stringify({
    type: 'authenticate',
    token: 'your-jwt-token-here'
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
  handleMessage(message);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected from chat server');
  // Implement reconnection logic here
};
```

---

## 2. Handle Authentication Response

```javascript
function handleMessage(message) {
  switch(message.type) {
    case 'auth_success':
      console.log('Authenticated as:', message.username);
      // Save user details
      currentUser = {
        userId: message.userId,
        username: message.username,
        displayName: message.displayName
      };
      // Now you can start using chat features
      getOnlineUsers();
      break;
      
    case 'auth_error':
      console.error('Authentication failed:', message.error);
      // Handle error - redirect to login, etc.
      break;
  }
}
```

---

## 3. Send a Direct Message

```javascript
// Step 1: Start conversation (do this once)
ws.send(JSON.stringify({
  type: 'start_conversation',
  recipientId: '456'  // The user you want to message
}));

// Step 2: Send message
ws.send(JSON.stringify({
  type: 'send_private_message',
  recipientId: '456',
  content: 'Hello! How are you?'
}));
```

---

## 4. Receive Messages

```javascript
function handleMessage(message) {
  switch(message.type) {
    case 'new_message':
      // Display the message in your UI
      displayMessage({
        from: message.senderUsername,
        content: message.content,
        time: message.createdAt
      });
      break;
      
    case 'conversation_started':
      // Load existing messages
      console.log('Conversation started with:', message.recipient.username);
      displayMessages(message.messages);
      break;
  }
}
```

---

## 5. Create a Group Chat

```javascript
ws.send(JSON.stringify({
  type: 'create_group',
  groupName: 'My Team',
  memberUserIds: ['456', '789', '012']  // Array of user IDs
}));

// Listen for response
case 'group_created':
  console.log('Group created:', message.groupName);
  console.log('Members:', message.members);
  break;
```

---

## 6. Send Group Message

```javascript
ws.send(JSON.stringify({
  type: 'send_group_message',
  groupId: 'group_abc123',
  content: 'Hey @john_doe, check this out! @everyone please review.'
}));

// Everyone in the group receives:
case 'new_group_message':
  displayGroupMessage({
    from: message.senderUsername,
    content: message.content,
    mentions: message.mentions,  // Who was mentioned
    time: message.createdAt
  });
  break;
```

---

## 7. Add Reaction to Message

```javascript
// Add reaction
ws.send(JSON.stringify({
  type: 'add_group_reaction',
  messageId: 'gmsg_001',
  emoji: '👍'
}));

// Everyone receives:
case 'reaction_added':
  addReactionToMessage(message.messageId, message.emoji, message.username);
  break;
```

---

## 8. Show Typing Indicator

```javascript
// When user starts typing
ws.send(JSON.stringify({
  type: 'typing',
  recipientId: '456',
  isTyping: true
}));

// When user stops typing (after 3 seconds)
ws.send(JSON.stringify({
  type: 'typing',
  recipientId: '456',
  isTyping: false
}));

// Recipient receives:
case 'user_typing':
  if (message.isTyping) {
    showTypingIndicator(message.userId);
  } else {
    hideTypingIndicator(message.userId);
  }
  break;
```

---

## 9. Handle Errors

```javascript
case 'error':
  console.error('Error:', message.error);
  
  // Common errors and how to handle them:
  if (message.error.includes('Rate limit')) {
    showNotification('Sending too fast! Please wait a moment.');
    disableSendButton(10); // Disable for 10 seconds
  } 
  else if (message.error.includes('blocking relationship')) {
    showNotification('Cannot send message to this user.');
  }
  else {
    showNotification('An error occurred: ' + message.error);
  }
  break;
```

---

## 10. Get Online Users

```javascript
// Request online users
ws.send(JSON.stringify({
  type: 'get_online_users'
}));

// Receive list
case 'online_users':
  console.log('Online users:', message.users);
  displayOnlineUsers(message.users);
  break;
```

---

## Complete Message Handler

```javascript
function handleMessage(message) {
  switch(message.type) {
    // Authentication
    case 'auth_success':
      onAuthSuccess(message);
      break;
    case 'auth_error':
      onAuthError(message.error);
      break;
      
    // Direct Messages
    case 'new_message':
      onNewMessage(message);
      break;
    case 'conversation_started':
      onConversationStarted(message);
      break;
    case 'message_edited':
      onMessageEdited(message);
      break;
    case 'message_deleted':
      onMessageDeleted(message);
      break;
    case 'message_history':
      onMessageHistory(message);
      break;
      
    // Group Chat
    case 'group_created':
      onGroupCreated(message);
      break;
    case 'new_group_message':
      onNewGroupMessage(message);
      break;
    case 'group_message_history':
      onGroupMessageHistory(message);
      break;
    case 'member_added':
      onMemberAdded(message);
      break;
    case 'member_removed':
      onMemberRemoved(message);
      break;
    case 'member_left':
      onMemberLeft(message);
      break;
    case 'group_info_updated':
      onGroupInfoUpdated(message);
      break;
      
    // Reactions
    case 'reaction_added':
      onReactionAdded(message);
      break;
    case 'reaction_removed':
      onReactionRemoved(message);
      break;
      
    // User Status
    case 'online_users':
      onOnlineUsers(message);
      break;
    case 'user_typing':
      onUserTyping(message);
      break;
      
    // Errors
    case 'error':
      onError(message);
      break;
      
    default:
      console.log('Unknown message type:', message.type);
  }
}
```

---

## Common Patterns

### Pattern 1: Optimistic UI Updates

```javascript
function sendMessage(content, recipientId) {
  // 1. Show message immediately (optimistic)
  const tempId = 'temp_' + Date.now();
  displayMessage({
    id: tempId,
    content: content,
    status: 'sending'
  });
  
  // 2. Send to server
  ws.send(JSON.stringify({
    type: 'send_private_message',
    recipientId: recipientId,
    content: content
  }));
  
  // 3. Update when confirmed
  // (in message handler)
  case 'new_message':
    if (message.senderId === currentUser.userId) {
      updateMessageStatus(tempId, message.messageId, 'sent');
    }
    break;
}
```

---

### Pattern 2: Reconnection Logic

```javascript
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

function connect() {
  const ws = new WebSocket('ws://localhost:3001');
  
  ws.onopen = () => {
    console.log('Connected');
    reconnectAttempts = 0;
    authenticate();
  };
  
  ws.onclose = () => {
    console.log('Disconnected');
    attemptReconnect();
  };
}

function attemptReconnect() {
  if (reconnectAttempts >= maxReconnectAttempts) {
    showError('Cannot connect to chat server');
    return;
  }
  
  reconnectAttempts++;
  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
  console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`);
  
  setTimeout(() => {
    connect();
  }, delay);
}
```

---

### Pattern 3: Debounced Typing Indicator

```javascript
let typingTimeout;

function onUserTyping() {
  // Clear previous timeout
  if (typingTimeout) {
    clearTimeout(typingTimeout);
  }
  
  // Send "typing: true" immediately
  ws.send(JSON.stringify({
    type: 'typing',
    recipientId: currentRecipient,
    isTyping: true
  }));
  
  // Auto-send "typing: false" after 3 seconds
  typingTimeout = setTimeout(() => {
    ws.send(JSON.stringify({
      type: 'typing',
      recipientId: currentRecipient,
      isTyping: false
    }));
  }, 3000);
}

function onMessageSent() {
  // Stop typing indicator when message is sent
  clearTimeout(typingTimeout);
  ws.send(JSON.stringify({
    type: 'typing',
    recipientId: currentRecipient,
    isTyping: false
  }));
}
```

---

### Pattern 4: Message Pagination

```javascript
let currentOffset = 0;
const messagesPerPage = 50;

function loadMoreMessages(recipientId) {
  ws.send(JSON.stringify({
    type: 'load_private_messages',
    recipientId: recipientId,
    limit: messagesPerPage,
    offset: currentOffset
  }));
}

// In message handler
case 'message_history':
  displayMessages(message.messages);
  currentOffset += messagesPerPage;
  
  // Show/hide "load more" button
  if (message.hasMore) {
    showLoadMoreButton();
  } else {
    hideLoadMoreButton();
  }
  break;
```

---

## Validation Rules

### Before Sending Messages:

```javascript
function validateMessage(content) {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }
  
  if (content.length > 5000) {
    return { valid: false, error: 'Message too long (max 5000 characters)' };
  }
  
  return { valid: true };
}

// Use it
const validation = validateMessage(userInput);
if (!validation.valid) {
  showError(validation.error);
  return;
}

// Send message
ws.send(JSON.stringify({
  type: 'send_private_message',
  recipientId: recipientId,
  content: userInput
}));
```

---

## Testing Your Integration

### Checklist:

```javascript
// 1. Connection
✓ Can connect to ws://localhost:3001
✓ Receives connection confirmation
✓ Handles connection errors

// 2. Authentication
✓ Sends auth message immediately
✓ Receives auth_success
✓ Handles auth_error

// 3. Direct Messages
✓ Can send message
✓ Receives own message back
✓ Can receive messages from others
✓ Typing indicator works

// 4. Group Chat
✓ Can create group
✓ Can send group message
✓ Mentions are parsed correctly
✓ Reactions work

// 5. Error Handling
✓ Handles rate limiting
✓ Handles blocking errors
✓ Handles invalid input
✓ Reconnects on disconnect

// 6. Edge Cases
✓ Multiple tabs open
✓ Slow network
✓ Server restart
✓ Very long messages
```

---

## Common Issues & Solutions

### Issue 1: Connection Timeout

**Problem:** Connection times out after 30 seconds

**Solution:** Make sure you're sending authentication immediately after connection opens

```javascript
ws.onopen = () => {
  // Send auth IMMEDIATELY
  ws.send(JSON.stringify({
    type: 'authenticate',
    token: yourToken
  }));
};
```

---

### Issue 2: Messages Not Appearing

**Problem:** Send message but nothing happens

**Solution:** Check you started the conversation first

```javascript
// WRONG - just sending message
ws.send(JSON.stringify({
  type: 'send_private_message',
  recipientId: '456',
  content: 'Hello'
}));

// RIGHT - start conversation first
ws.send(JSON.stringify({
  type: 'start_conversation',
  recipientId: '456'
}));

// Then send messages
```

---

### Issue 3: Can't Send to User

**Problem:** Error "Cannot send message - blocking relationship exists"

**Solution:** Check if user is blocked

```javascript
// Get online users (excludes blocked users)
ws.send(JSON.stringify({
  type: 'get_online_users'
}));

// Only show message option for users in online list
// Server automatically filters blocked users
```

---

### Issue 4: Rate Limit Hit

**Problem:** "Rate limit exceeded" error

**Solution:** Implement rate limit UI

```javascript
let messagesSent = 0;
let rateLimitReset = Date.now() + 60000;

function canSendMessage() {
  if (Date.now() > rateLimitReset) {
    messagesSent = 0;
    rateLimitReset = Date.now() + 60000;
  }
  
  if (messagesSent >= 30) {
    const waitTime = Math.ceil((rateLimitReset - Date.now()) / 1000);
    showError(`Please wait ${waitTime} seconds before sending more messages`);
    return false;
  }
  
  return true;
}

function sendMessage(content, recipientId) {
  if (!canSendMessage()) {
    return;
  }
  
  ws.send(JSON.stringify({
    type: 'send_private_message',
    recipientId: recipientId,
    content: content
  }));
  
  messagesSent++;
}
```

---

## Next Steps

1. **Read Full Tutorial**: See `FRONTEND_INTEGRATION_TUTORIAL.md` for complete guide
2. **Check API Reference**: See `FRONTEND_INTEGRATION_GUIDE.md` for all endpoints
3. **Review Examples**: See tutorial for React/Vue/Angular examples
4. **Test Endpoints**: Use `ENDPOINT_TEST_RESULTS.md` to verify server health

---

## Quick Reference

| Action | Type | Required Fields |
|--------|------|----------------|
| Connect | - | WebSocket URL |
| Authenticate | `authenticate` | `token` |
| Get Users | `get_online_users` | - |
| Start Chat | `start_conversation` | `recipientId` |
| Send DM | `send_private_message` | `recipientId`, `content` |
| Create Group | `create_group` | `groupName`, `memberUserIds` |
| Send to Group | `send_group_message` | `groupId`, `content` |
| React | `add_group_reaction` | `messageId`, `emoji` |
| Edit Message | `edit_private_message` | `messageId`, `newContent` |
| Delete Message | `delete_private_message` | `messageId` |

---

**That's it!** You now have everything you need to get started. Open your browser console, establish a WebSocket connection, and start chatting! 🚀

For more detailed information, see the complete tutorial and API reference documents.

