# Code Examples & Working Chat App

Complete, copy-paste ready examples.

---

## Table of Contents

1. [Complete HTML Chat App](#complete-html-chat-app)
2. [React Component Example](#react-component-example)
3. [Connection Management](#connection-management)
4. [Message Handler](#message-handler)

---

## Complete HTML Chat App

Save as `chat.html` and open in browser:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Chat App</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    #connection-status {
      padding: 10px;
      margin-bottom: 20px;
      border-radius: 4px;
      text-align: center;
    }
    
    #connection-status.connected {
      background: #d4edda;
      color: #155724;
    }
    
    #connection-status.disconnected {
      background: #f8d7da;
      color: #721c24;
    }
    
    #online-users {
      background: #f8f9fa;
      padding: 15px;
      margin-bottom: 20px;
      border-radius: 4px;
    }
    
    .user-item {
      padding: 5px;
      cursor: pointer;
      border-bottom: 1px solid #dee2e6;
    }
    
    .user-item:hover {
      background: #e9ecef;
    }
    
    #chat-area {
      border: 1px solid #dee2e6;
      height: 400px;
      overflow-y: scroll;
      padding: 15px;
      margin-bottom: 10px;
      background: white;
    }
    
    .message {
      margin-bottom: 15px;
      padding: 10px;
      border-radius: 4px;
    }
    
    .message.own {
      background: #007bff;
      color: white;
      margin-left: 50px;
      text-align: right;
    }
    
    .message.other {
      background: #f8f9fa;
      margin-right: 50px;
    }
    
    .message-meta {
      font-size: 0.8em;
      opacity: 0.7;
      margin-bottom: 5px;
    }
    
    #message-input {
      width: calc(100% - 80px);
      padding: 10px;
      border: 1px solid #dee2e6;
      border-radius: 4px;
    }
    
    #send-button {
      width: 70px;
      padding: 10px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    #send-button:hover {
      background: #0056b3;
    }
  </style>
</head>
<body>
  <h1>💬 Chat App</h1>
  
  <div id="connection-status" class="disconnected">
    🔴 Disconnected
  </div>
  
  <div id="user-info" style="display: none;">
    <strong>Logged in as:</strong> <span id="current-user-name"></span>
  </div>
  
  <div id="online-users">
    <h3>👥 Online Users</h3>
    <div id="online-users-list">
      <em>Not connected</em>
    </div>
  </div>
  
  <div id="current-chat-title">
    <h3>Select a user to start chatting</h3>
  </div>
  
  <div id="chat-area"></div>
  
  <div>
    <input type="text" id="message-input" placeholder="Type a message..." disabled>
    <button id="send-button" onclick="sendCurrentMessage()" disabled>Send</button>
  </div>
  
  <script>
    let ws = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    let currentUser = null;
    let jwtToken = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual token
    let currentRecipient = null;
    
    function connect() {
      console.log('🔌 Connecting...');
      updateStatus('Connecting...', 'disconnected');
      
      ws = new WebSocket('ws://localhost:3001');
      
      ws.onopen = () => {
        console.log('✅ Connected!');
        updateStatus('Connected', 'connected');
        reconnectAttempts = 0;
        authenticate();
      };
      
      ws.onclose = () => {
        console.log('❌ Disconnected');
        updateStatus('Disconnected', 'disconnected');
        currentUser = null;
        document.getElementById('user-info').style.display = 'none';
        disableMessageInput();
        reconnect();
      };
      
      ws.onerror = (error) => {
        console.error('❌ Error:', error);
      };
      
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleMessage(message);
      };
    }
    
    function reconnect() {
      if (reconnectAttempts >= maxReconnectAttempts) {
        updateStatus('Connection failed. Refresh page.', 'disconnected');
        return;
      }
      
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
      reconnectAttempts++;
      
      setTimeout(() => {
        console.log(`🔄 Reconnecting (${reconnectAttempts}/${maxReconnectAttempts})...`);
        connect();
      }, delay);
    }
    
    function authenticate() {
      ws.send(JSON.stringify({
        type: 'authenticate',
        token: jwtToken
      }));
    }
    
    function handleMessage(message) {
      console.log('📨 Received:', message.type);
      
      switch (message.type) {
        case 'auth_success':
          currentUser = message;
          document.getElementById('current-user-name').textContent = message.displayName;
          document.getElementById('user-info').style.display = 'block';
          updateStatus(`Connected as ${message.displayName}`, 'connected');
          loadOnlineUsers();
          break;
          
        case 'auth_error':
          updateStatus('Authentication failed!', 'disconnected');
          alert('Authentication failed: ' + message.error);
          break;
          
        case 'online_users':
          displayOnlineUsers(message.users);
          break;
          
        case 'conversation_started':
          displayMessages(message.messages);
          enableMessageInput();
          break;
          
        case 'new_message':
          displayMessage(message);
          break;
          
        case 'error':
          alert('Error: ' + message.error);
          break;
      }
    }
    
    function updateStatus(text, className) {
      const statusEl = document.getElementById('connection-status');
      statusEl.textContent = text;
      statusEl.className = className;
    }
    
    function displayOnlineUsers(users) {
      const listEl = document.getElementById('online-users-list');
      
      if (users.length === 0) {
        listEl.innerHTML = '<em>No other users online</em>';
        return;
      }
      
      listEl.innerHTML = users.map(user => `
        <div class="user-item" onclick="startChat('${user.userId}', '${user.username}')">
          👤 ${user.displayName || user.username}
        </div>
      `).join('');
    }
    
    function displayMessages(messages) {
      const chatArea = document.getElementById('chat-area');
      chatArea.innerHTML = '';
      messages.forEach(msg => displayMessage(msg));
      chatArea.scrollTop = chatArea.scrollHeight;
    }
    
    function displayMessage(message) {
      const chatArea = document.getElementById('chat-area');
      const isOwn = message.senderId === currentUser.userId;
      
      const msgEl = document.createElement('div');
      msgEl.className = `message ${isOwn ? 'own' : 'other'}`;
      msgEl.innerHTML = `
        <div class="message-meta">
          ${message.senderUsername} • ${formatTime(message.createdAt)}
        </div>
        <div>${escapeHtml(message.content)}</div>
      `;
      
      chatArea.appendChild(msgEl);
      chatArea.scrollTop = chatArea.scrollHeight;
    }
    
    function formatTime(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleTimeString();
    }
    
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
    
    function enableMessageInput() {
      document.getElementById('message-input').disabled = false;
      document.getElementById('send-button').disabled = false;
    }
    
    function disableMessageInput() {
      document.getElementById('message-input').disabled = true;
      document.getElementById('send-button').disabled = true;
    }
    
    function loadOnlineUsers() {
      ws.send(JSON.stringify({
        type: 'get_online_users'
      }));
    }
    
    function startChat(userId, username) {
      console.log('💬 Starting chat with:', username);
      currentRecipient = { userId, username };
      
      document.getElementById('current-chat-title').innerHTML = 
        `<h3>Chat with ${username}</h3>`;
      
      ws.send(JSON.stringify({
        type: 'start_conversation',
        recipientId: userId
      }));
    }
    
    function sendCurrentMessage() {
      const input = document.getElementById('message-input');
      const content = input.value.trim();
      
      if (!content || !currentRecipient) return;
      
      ws.send(JSON.stringify({
        type: 'send_private_message',
        recipientId: currentRecipient.userId,
        content: content
      }));
      
      input.value = '';
    }
    
    document.getElementById('message-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendCurrentMessage();
      }
    });
    
    window.onload = () => {
      console.log('🚀 Starting chat...');
      connect();
    };
  </script>
</body>
</html>
```

**Usage:**
1. Replace `YOUR_JWT_TOKEN_HERE` with actual JWT token
2. Save as `chat.html`
3. Open in browser
4. Open in multiple tabs to test

---

## React Component Example

```javascript
import { useEffect, useState, useRef } from 'react';

function ChatComponent({ jwtToken }) {
  const [ws, setWs] = useState(null);
  const [connected, setConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [currentRecipient, setCurrentRecipient] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  
  useEffect(() => {
    // Connect to WebSocket
    const websocket = new WebSocket('ws://localhost:3001');
    
    websocket.onopen = () => {
      console.log('✅ Connected');
      setConnected(true);
      
      // Authenticate
      websocket.send(JSON.stringify({
        type: 'authenticate',
        token: jwtToken
      }));
    };
    
    websocket.onclose = () => {
      console.log('❌ Disconnected');
      setConnected(false);
      setCurrentUser(null);
    };
    
    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleMessage(message);
    };
    
    setWs(websocket);
    
    // Cleanup on unmount
    return () => {
      if (websocket) websocket.close();
    };
  }, [jwtToken]);
  
  const handleMessage = (message) => {
    switch (message.type) {
      case 'auth_success':
        setCurrentUser(message);
        loadOnlineUsers();
        break;
        
      case 'online_users':
        setOnlineUsers(message.users);
        break;
        
      case 'conversation_started':
        setMessages(message.messages);
        break;
        
      case 'new_message':
        setMessages(prev => [...prev, message]);
        break;
        
      case 'error':
        alert('Error: ' + message.error);
        break;
    }
  };
  
  const loadOnlineUsers = () => {
    if (ws) {
      ws.send(JSON.stringify({ type: 'get_online_users' }));
    }
  };
  
  const startChat = (user) => {
    setCurrentRecipient(user);
    if (ws) {
      ws.send(JSON.stringify({
        type: 'start_conversation',
        recipientId: user.userId
      }));
    }
  };
  
  const sendMessage = () => {
    if (!messageInput.trim() || !currentRecipient || !ws) return;
    
    ws.send(JSON.stringify({
      type: 'send_private_message',
      recipientId: currentRecipient.userId,
      content: messageInput
    }));
    
    setMessageInput('');
  };
  
  return (
    <div>
      <div style={{ padding: 10, background: connected ? '#d4edda' : '#f8d7da' }}>
        {connected ? '✅ Connected' : '❌ Disconnected'}
        {currentUser && ` as ${currentUser.displayName}`}
      </div>
      
      <div style={{ display: 'flex', marginTop: 20 }}>
        <div style={{ width: 200, marginRight: 20 }}>
          <h3>Online Users</h3>
          {onlineUsers.map(user => (
            <div
              key={user.userId}
              onClick={() => startChat(user)}
              style={{ padding: 10, cursor: 'pointer', borderBottom: '1px solid #ddd' }}
            >
              {user.displayName}
            </div>
          ))}
        </div>
        
        <div style={{ flex: 1 }}>
          <h3>
            {currentRecipient ? `Chat with ${currentRecipient.username}` : 'Select a user'}
          </h3>
          
          <div style={{ height: 400, overflowY: 'scroll', border: '1px solid #ddd', padding: 10 }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                marginBottom: 10,
                padding: 10,
                background: msg.senderId === currentUser?.userId ? '#007bff' : '#f0f0f0',
                color: msg.senderId === currentUser?.userId ? 'white' : 'black',
                borderRadius: 4
              }}>
                <small>{msg.senderUsername}</small>
                <div>{msg.content}</div>
              </div>
            ))}
          </div>
          
          <div style={{ marginTop: 10 }}>
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              style={{ width: 'calc(100% - 80px)', padding: 10 }}
            />
            <button onClick={sendMessage} style={{ width: 70, padding: 10 }}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatComponent;
```

---

## Connection Management

```javascript
let ws;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
let currentUser = null;
let jwtToken = null;

function connect() {
  console.log('🔌 Connecting...');
  ws = new WebSocket('ws://localhost:3001');
  
  ws.onopen = () => {
    console.log('✅ Connected!');
    reconnectAttempts = 0;
    authenticate();
  };
  
  ws.onclose = () => {
    console.log('❌ Disconnected');
    currentUser = null;
    reconnect();
  };
  
  ws.onerror = (error) => {
    console.error('❌ Error:', error);
  };
  
  ws.onmessage = handleMessage;
}

function reconnect() {
  if (reconnectAttempts >= maxReconnectAttempts) {
    console.error('❌ Max reconnect attempts reached');
    return;
  }
  
  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
  reconnectAttempts++;
  
  setTimeout(() => {
    console.log(`🔄 Reconnecting (${reconnectAttempts}/${maxReconnectAttempts})...`);
    connect();
  }, delay);
}

function authenticate() {
  if (!jwtToken) {
    console.error('❌ No JWT token');
    return;
  }
  
  ws.send(JSON.stringify({
    type: 'authenticate',
    token: jwtToken
  }));
}

function initializeChat(token) {
  jwtToken = token;
  connect();
}
```

---

## Message Handler

```javascript
function handleMessage(event) {
  const message = JSON.parse(event.data);
  console.log('📨', message.type);
  
  switch (message.type) {
    // Authentication
    case 'auth_success':
      currentUser = message;
      console.log('✅ Logged in as:', message.displayName);
      loadOnlineUsers();
      loadUserGroups();
      break;
      
    case 'auth_error':
      console.error('❌ Auth failed:', message.error);
      break;
    
    // Direct Messages
    case 'online_users':
      displayOnlineUsers(message.users);
      break;
      
    case 'conversation_started':
      displayConversation(message.conversationId, message.recipient, message.messages);
      break;
      
    case 'new_message':
      addMessageToUI(message);
      if (currentConversationId !== message.conversationId) {
        showNotification(`New message from ${message.senderUsername}`);
      }
      break;
      
    case 'message_edited':
      updateMessageInUI(message.messageId, { content: message.newContent, isEdited: true });
      break;
      
    case 'message_deleted':
      removeMessageFromUI(message.messageId);
      break;
      
    case 'conversation_deleted':
      if (message.deleteForEveryone) {
        removeConversationFromUI(message.conversationId);
      }
      break;
      
    case 'user_typing':
      showTypingIndicator(message.userId, message.isTyping);
      break;
    
    // Group Chats
    case 'group_created':
      addGroupToUI(message);
      break;
      
    case 'new_group_message':
      addGroupMessageToUI(message);
      
      // Check if mentioned
      if (message.mentions) {
        const mentioned = message.mentions.some(m => 
          m.type === 'everyone' || m.userId === currentUser.userId
        );
        if (mentioned) {
          showNotification(`${message.senderUsername} mentioned you!`);
        }
      }
      break;
      
    case 'member_added':
      updateGroupMembers(message.groupId);
      break;
      
    case 'member_removed':
    case 'member_left':
      updateGroupMembers(message.groupId);
      break;
      
    case 'group_deleted':
      removeGroupFromUI(message.groupId);
      break;
    
    // Reactions
    case 'reaction_added':
      addReactionToMessage(message.messageId, message.userId, message.emoji);
      break;
      
    case 'reaction_removed':
      removeReactionFromMessage(message.messageId, message.userId, message.emoji);
      break;
    
    // Errors
    case 'error':
      handleError(message);
      break;
      
    default:
      console.warn('⚠️ Unknown message type:', message.type);
  }
}

function handleError(message) {
  console.error('❌ Error:', message.error);
  
  if (message.code === 'USER_BLOCKED') {
    alert('Cannot message this user');
  } else if (message.code === 'NOT_FOLLOWING') {
    alert('You must follow this user to message them');
  } else if (message.error.includes('Rate limit')) {
    alert('Slow down! Too many messages');
  } else {
    alert('Error: ' + message.error);
  }
}

// Placeholder UI functions (implement based on your UI framework)
function displayOnlineUsers(users) { /* your implementation */ }
function displayConversation(id, recipient, messages) { /* your implementation */ }
function addMessageToUI(message) { /* your implementation */ }
function updateMessageInUI(id, updates) { /* your implementation */ }
function removeMessageFromUI(id) { /* your implementation */ }
function removeConversationFromUI(id) { /* your implementation */ }
function showTypingIndicator(userId, isTyping) { /* your implementation */ }
function addGroupToUI(group) { /* your implementation */ }
function addGroupMessageToUI(message) { /* your implementation */ }
function updateGroupMembers(groupId) { /* your implementation */ }
function removeGroupFromUI(groupId) { /* your implementation */ }
function addReactionToMessage(messageId, userId, emoji) { /* your implementation */ }
function removeReactionFromMessage(messageId, userId, emoji) { /* your implementation */ }
function showNotification(text) { /* your implementation */ }
function loadOnlineUsers() { ws.send(JSON.stringify({ type: 'get_online_users' })); }
function loadUserGroups() { ws.send(JSON.stringify({ type: 'get_user_groups' })); }
```

---

**Need more examples?** Check out the test files in `chat-server/tests/` for comprehensive usage examples.

