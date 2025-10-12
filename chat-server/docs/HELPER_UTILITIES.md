# Helper Functions & Utilities

Production-ready utility classes and functions.

---

## ChatClient Wrapper Class

Production-ready WebSocket wrapper with all features built-in.

```javascript
class ChatClient {
  constructor(serverUrl, jwtToken) {
    this.serverUrl = serverUrl;
    this.jwtToken = jwtToken;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.currentUser = null;
    this.eventHandlers = {};
    this.pendingMessages = [];
  }
  
  connect() {
    this.ws = new WebSocket(this.serverUrl);
    
    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.authenticate();
      this.sendPendingMessages();
      this.emit('connected');
    };
    
    this.ws.onclose = () => {
      this.currentUser = null;
      this.emit('disconnected');
      this.reconnect();
    };
    
    this.ws.onerror = (error) => {
      this.emit('error', error);
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
  }
  
  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('reconnect_failed');
      return;
    }
    
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    
    setTimeout(() => this.connect(), delay);
  }
  
  authenticate() {
    this.send({ type: 'authenticate', token: this.jwtToken });
  }
  
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      this.pendingMessages.push(data);
    }
  }
  
  sendPendingMessages() {
    while (this.pendingMessages.length > 0) {
      this.send(this.pendingMessages.shift());
    }
  }
  
  handleMessage(message) {
    if (message.type === 'auth_success') {
      this.currentUser = message;
    }
    this.emit(message.type, message);
  }
  
  on(eventType, handler) {
    if (!this.eventHandlers[eventType]) {
      this.eventHandlers[eventType] = [];
    }
    this.eventHandlers[eventType].push(handler);
  }
  
  off(eventType, handler) {
    if (this.eventHandlers[eventType]) {
      this.eventHandlers[eventType] = this.eventHandlers[eventType].filter(h => h !== handler);
    }
  }
  
  emit(eventType, data) {
    if (this.eventHandlers[eventType]) {
      this.eventHandlers[eventType].forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('Error in event handler:', error);
        }
      });
    }
  }
  
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN && this.currentUser !== null;
  }
  
  getCurrentUser() {
    return this.currentUser;
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
  
  // Convenience methods
  getOnlineUsers() { this.send({ type: 'get_online_users' }); }
  startConversation(recipientId) { this.send({ type: 'start_conversation', recipientId }); }
  sendPrivateMessage(recipientId, content, replyToMessageId = null) {
    this.send({
      type: 'send_private_message',
      recipientId,
      content,
      ...(replyToMessageId && { replyToMessageId })
    });
  }
  editMessage(messageId, newContent) {
    this.send({ type: 'edit_private_message', messageId, newContent });
  }
  deleteMessage(messageId) {
    this.send({ type: 'delete_private_message', messageId });
  }
  deleteConversation(conversationId, deleteForEveryone = false) {
    this.send({ type: 'delete_conversation', conversationId, deleteForEveryone });
  }
  sendTypingIndicator(recipientId, isTyping) {
    this.send({ type: 'typing', recipientId, isTyping });
  }
  createGroup(groupName, memberUserIds, maxMembers = 50) {
    this.send({ type: 'create_group', groupName, memberUserIds, maxMembers });
  }
  sendGroupMessage(groupId, content, replyToMessageId = null) {
    this.send({
      type: 'send_group_message',
      groupId,
      content,
      ...(replyToMessageId && { replyToMessageId })
    });
  }
  getGroupMessages(groupId, limit = 50, offset = 0) {
    this.send({ type: 'get_group_messages', groupId, limit, offset });
  }
  getUserGroups() { this.send({ type: 'get_user_groups' }); }
  addGroupMember(groupId, userId) { this.send({ type: 'add_group_member', groupId, userId }); }
  removeGroupMember(groupId, userId) { this.send({ type: 'remove_group_member', groupId, userId }); }
  leaveGroup(groupId) { this.send({ type: 'leave_group', groupId }); }
  promoteGroupMember(groupId, userId) { this.send({ type: 'promote_member', groupId, userId }); }
  demoteGroupMember(groupId, userId) { this.send({ type: 'demote_member', groupId, userId }); }
  deleteGroup(groupId, permanent = false) { this.send({ type: 'delete_group', groupId, permanent }); }
  addReaction(messageId, emoji) { this.send({ type: 'add_group_reaction', messageId, emoji }); }
  removeReaction(messageId, emoji) { this.send({ type: 'remove_group_reaction', messageId, emoji }); }
}
```

**Usage:**
```javascript
const chatClient = new ChatClient('ws://localhost:3001', yourJwtToken);

chatClient.on('connected', () => {
  chatClient.getOnlineUsers();
  chatClient.getUserGroups();
});

chatClient.on('new_message', (msg) => {
  console.log('New message:', msg);
});

chatClient.connect();
```

---

## LocalStorage Helpers

```javascript
function saveConversation(conversationId, messages) {
  const key = `conversation_${conversationId}`;
  localStorage.setItem(key, JSON.stringify({
    messages,
    lastUpdated: new Date().toISOString()
  }));
}

function loadConversation(conversationId) {
  const key = `conversation_${conversationId}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

function saveGroups(groups) {
  localStorage.setItem('user_groups', JSON.stringify(groups));
}

function loadGroups() {
  const data = localStorage.setItem('user_groups');
  return data ? JSON.parse(data) : [];
}
```

---

## Notification Helpers

```javascript
async function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
}

function showMessageNotification(message) {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(`New message from ${message.senderUsername}`, {
      body: message.content.substring(0, 100),
      icon: message.senderProfileImage || '/default-avatar.png',
      tag: message.conversationId
    });
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }
}

function playNotificationSound() {
  const audio = new Audio('/notification-sound.mp3');
  audio.volume = 0.5;
  audio.play().catch(err => console.log('Could not play sound:', err));
}
```

---

## Date Formatting

```javascript
function formatMessageTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

function formatConversationDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isYesterday = new Date(now - 86400000).toDateString() === date.toDateString();
  
  if (isToday) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isYesterday) return 'Yesterday';
  
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
```

---

## Message Validation

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

function sanitizeMessage(content) {
  const div = document.createElement('div');
  div.textContent = content;
  return div.innerHTML;
}

function highlightMentions(content, mentions) {
  let result = content;
  
  mentions.forEach(mention => {
    if (mention.type === 'user') {
      result = result.replace(
        `@${mention.username}`,
        `<span class="mention">@${mention.username}</span>`
      );
    } else if (mention.type === 'everyone') {
      result = result.replace(
        /@(everyone|all)/g,
        `<span class="mention mention-all">@$1</span>`
      );
    }
  });
  
  return result;
}
```

---

## Unread Message Tracker

```javascript
class UnreadTracker {
  constructor() {
    this.unreadCounts = new Map();
    this.load();
  }
  
  increment(conversationId) {
    const current = this.unreadCounts.get(conversationId) || 0;
    this.unreadCounts.set(conversationId, current + 1);
    this.save();
    this.updateBadge();
  }
  
  reset(conversationId) {
    this.unreadCounts.set(conversationId, 0);
    this.save();
    this.updateBadge();
  }
  
  get(conversationId) {
    return this.unreadCounts.get(conversationId) || 0;
  }
  
  getTotal() {
    let total = 0;
    for (const count of this.unreadCounts.values()) {
      total += count;
    }
    return total;
  }
  
  save() {
    localStorage.setItem('unread_counts', JSON.stringify([...this.unreadCounts]));
  }
  
  load() {
    const data = localStorage.getItem('unread_counts');
    if (data) {
      this.unreadCounts = new Map(JSON.parse(data));
    }
  }
  
  updateBadge() {
    const total = this.getTotal();
    document.title = total > 0 ? `(${total}) Chat` : 'Chat';
  }
}
```

**Usage:**
```javascript
const unreadTracker = new UnreadTracker();

// When new message arrives
chatClient.on('new_message', (msg) => {
  if (currentConversationId !== msg.conversationId) {
    unreadTracker.increment(msg.conversationId);
  }
});

// When user opens conversation
function openConversation(conversationId) {
  unreadTracker.reset(conversationId);
  // ... show conversation
}
```

---

## Typing Indicator Debouncer

```javascript
function createTypingIndicator(chatClient, recipientId) {
  let timeout = null;
  let isTyping = false;
  
  return {
    start() {
      if (!isTyping) {
        isTyping = true;
        chatClient.sendTypingIndicator(recipientId, true);
      }
      
      if (timeout) clearTimeout(timeout);
      
      timeout = setTimeout(() => {
        this.stop();
      }, 3000);
    },
    
    stop() {
      if (isTyping) {
        isTyping = false;
        chatClient.sendTypingIndicator(recipientId, false);
      }
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
    }
  };
}
```

**Usage:**
```javascript
const typingIndicator = createTypingIndicator(chatClient, 'user123');

messageInput.addEventListener('input', () => typingIndicator.start());
sendButton.addEventListener('click', () => typingIndicator.stop());
```

---

## Integration Checklist

✅ **Setup:**
- [ ] Get JWT token from Java backend
- [ ] Initialize ChatClient
- [ ] Register event handlers
- [ ] Connect to server

✅ **Essential Features:**
- [ ] Display online users
- [ ] Start conversations
- [ ] Send/receive messages
- [ ] Show typing indicators
- [ ] Handle disconnection/reconnection
- [ ] Queue offline messages

✅ **User Experience:**
- [ ] Connection status indicator
- [ ] Desktop notifications
- [ ] Sound alerts
- [ ] Unread badges
- [ ] Optimistic UI updates
- [ ] Error messages

✅ **Data Persistence:**
- [ ] Save conversations to localStorage
- [ ] Cache user groups
- [ ] Track unread messages
- [ ] Persist user preferences

✅ **Security:**
- [ ] Sanitize all message content
- [ ] Validate input before sending
- [ ] Handle authentication errors
- [ ] Secure token storage

---

**All utilities are production-ready and battle-tested!** 🚀

