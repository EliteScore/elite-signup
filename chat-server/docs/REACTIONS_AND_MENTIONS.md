# Group Chat Reactions & Mentions

## 🎉 Reactions

React to messages with emojis for quick feedback.

### Add Reaction

**Client Request:**
```javascript
{
  type: 'add_group_reaction',
  messageId: 'msg_abc123',
  reaction: '👍'  // Any emoji (max 10 chars)
}
```

**Response to user who reacted:**
```javascript
{
  type: 'group_reaction_added',
  messageId: 'msg_abc123',
  groupId: 'group_xyz',
  reaction: {
    userId: 'user1',
    username: 'alice',
    reaction: '👍',
    timestamp: '2024-01-01T10:00:00Z'
  },
  timestamp: '2024-01-01T10:00:00Z'
}
```

**All group members receive:**
```javascript
{
  type: 'group_reaction_added',
  messageId: 'msg_abc123',
  groupId: 'group_xyz',
  reaction: {
    userId: 'user1',
    username: 'alice',
    reaction: '👍',
    timestamp: '2024-01-01T10:00:00Z'
  },
  timestamp: '2024-01-01T10:00:00Z'
}
```

---

### Remove Reaction

**Client Request:**
```javascript
{
  type: 'remove_group_reaction',
  messageId: 'msg_abc123',
  reaction: '👍'
}
```

**Response:**
```javascript
{
  type: 'group_reaction_removed',
  messageId: 'msg_abc123',
  groupId: 'group_xyz',
  reaction: {
    userId: 'user1',
    username: 'alice',
    reaction: '👍',
    timestamp: '2024-01-01T10:05:00Z'
  },
  timestamp: '2024-01-01T10:05:00Z'
}
```

**All group members receive the same notification**

---

### Reaction Rules

- ✅ Any group member can react to any message
- ✅ Max 10 characters per reaction (supports all emojis)
- ✅ Same user can't add same reaction twice (database constraint)
- ✅ Can only remove reactions you added
- ✅ Works on non-deleted messages only
- ✅ Uses existing `message_reactions` table (same as DMs)

---

## 💬 Mentions

Tag specific users or everyone in a group message.

### Mention Syntax

**Mention specific user:**
```
"@alice can you review this?"
"Hey @bob and @charlie, check this out"
```

**Mention everyone:**
```
"@everyone meeting in 5 minutes"
"@all please read this"
```

---

### How Mentions Work

#### 1. **Send Message with Mentions**

**Client Request:**
```javascript
{
  type: 'send_group_message',
  groupId: 'group_abc123',
  content: 'Hey @alice and @bob, can you help? @everyone should see this'
}
```

#### 2. **Server Processing**

Server automatically:
1. Parses `@alice`, `@bob`, `@everyone`
2. Validates users exist in the group
3. Resolves to user IDs
4. Includes mention data in message

**Response (with mentions):**
```javascript
{
  type: 'group_message_sent',
  message: {
    id: 'msg_123',
    groupId: 'group_abc123',
    senderId: 'user1',
    username: 'sender',
    content: 'Hey @alice and @bob, can you help? @everyone should see this',
    timestamp: '2024-01-01T10:00:00Z',
    mentions: [
      { type: 'user', userId: 'user2', username: 'alice' },
      { type: 'user', userId: 'user3', username: 'bob' },
      { type: 'everyone', userIds: ['user2', 'user3', 'user4', 'user5'] }
    ]
  }
}
```

#### 3. **All Members Receive**

```javascript
{
  type: 'new_group_message',
  message: {
    // ... same message with mentions array
  }
}
```

#### 4. **Mentioned Users Get Extra Notification**

**Only users who were @mentioned receive this:**

```javascript
{
  type: 'mentioned_in_group',
  messageId: 'msg_123',
  groupId: 'group_abc123',
  message: {
    id: 'msg_123',
    content: 'Hey @alice and @bob...',
    // ... full message
  },
  mentionedBy: 'user1',
  mentionedByUsername: 'sender',
  timestamp: '2024-01-01T10:00:00Z'
}
```

This allows the frontend to:
- Show a badge/notification
- Play a sound
- Highlight the message
- Show "You were mentioned" indicator

---

### Mention Rules

- ✅ `@username` - Mention specific user (case-insensitive)
- ✅ `@everyone` - Mention all group members
- ✅ `@all` - Same as @everyone
- ✅ Only valid group members can be mentioned
- ✅ Can't mention yourself (excluded automatically)
- ✅ Invalid usernames ignored (no error, just skipped)
- ✅ Duplicate mentions deduplicated
- ✅ Username pattern: letters, numbers, underscores, hyphens

### Mention Pattern

```regex
/@(\w+)/g
```

Matches:
- `@alice` ✅
- `@bob123` ✅
- `@user_name` ✅
- `@test-user` ✅
- `@everyone` ✅
- `@all` ✅

Doesn't match:
- `@ alice` ❌ (space after @)
- `@alice!` ❌ (special char)
- `email@test.com` ❌ (not at start of word)

---

## 📊 Message Flow

### Example: "@alice can you help?"

```
1. User sends message with @alice
   ↓
2. Server parses: finds "@alice"
   ↓
3. Server validates: alice is in group ✅
   ↓
4. Server resolves: alice = user_id "2"
   ↓
5. Server broadcasts to ALL members:
   type: 'new_group_message'
   ↓
6. Server sends to ALICE only:
   type: 'mentioned_in_group'
   ↓
7. Alice's client shows special notification 🔔
```

---

## 💡 Frontend Usage Examples

### Reactions

```javascript
// Add reaction
ws.send(JSON.stringify({
  type: 'add_group_reaction',
  messageId: 'msg_123',
  reaction: '👍'
}));

// Remove reaction
ws.send(JSON.stringify({
  type: 'remove_group_reaction',
  messageId: 'msg_123',
  reaction: '👍'
}));

// Listen for reactions
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'group_reaction_added') {
    // Update UI: show reaction on message
    console.log(`${data.reaction.username} reacted with ${data.reaction.reaction}`);
  }
  
  if (data.type === 'group_reaction_removed') {
    // Update UI: remove reaction from message
  }
};
```

---

### Mentions

```javascript
// Send message with mentions
ws.send(JSON.stringify({
  type: 'send_group_message',
  groupId: 'group_123',
  content: '@alice can you review? @everyone FYI'
}));

// Listen for mentions
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  // Regular message (everyone receives)
  if (data.type === 'new_group_message') {
    console.log('New message:', data.message.content);
    
    // Check if you were mentioned
    if (data.message.mentions) {
      const myUserId = getCurrentUserId();
      const wasMentioned = data.message.mentions.some(m => 
        m.type === 'everyone' || 
        m.userId === myUserId
      );
      
      if (wasMentioned) {
        // Highlight this message
        showNotificationBadge();
      }
    }
  }
  
  // Special notification (only mentioned users receive)
  if (data.type === 'mentioned_in_group') {
    // Play notification sound
    playSound();
    // Show alert
    showAlert(`${data.mentionedByUsername} mentioned you in ${data.groupId}`);
    // Jump to message
    scrollToMessage(data.messageId);
  }
};
```

---

## 📱 UI/UX Recommendations

### Reactions
- Show reaction counts below message (👍 5, ❤️ 3)
- Highlight user's own reactions
- Click to add/remove reaction
- Show list of who reacted on hover

### Mentions
- Highlight @mentions in blue/clickable
- Bold mentioned usernames
- Show "You were mentioned" badge
- Different notification sound for mentions
- Jump to message when clicking mention notification
- Show unread mentions count

---

## 🔔 Notification Types

| Event | Notification Type | Who Receives |
|-------|------------------|--------------|
| New message | `new_group_message` | All members |
| Message with mention | `new_group_message` + `mentioned_in_group` | All + mentioned users |
| Reaction added | `group_reaction_added` | All members |
| Reaction removed | `group_reaction_removed` | All members |

---

## ✅ Features Complete

- [x] Add reaction to group message
- [x] Remove reaction from group message
- [x] Parse @username mentions
- [x] Parse @everyone/@all mentions
- [x] Validate mentioned users exist in group
- [x] Send special notifications to mentioned users
- [x] Include mention data in message object
- [x] Support multiple mentions in one message
- [x] Deduplicate mentions
- [x] Case-insensitive username matching

---

## 🎯 Example Scenarios

### Scenario 1: Quick Approval
```
Alice: "Should we deploy?"
Bob: [clicks 👍 reaction]
Charlie: [clicks 👍 reaction]
Diana: [clicks 👍 reaction]

Result: ✅ Clean, no spam
Without reactions: 3 separate "yes" messages
```

### Scenario 2: Team Coordination
```
Alice: "@bob can you handle the frontend? @charlie backend? @everyone deadline is Friday"

Bob receives:
- Regular message ✓
- Special mention notification 🔔

Charlie receives:
- Regular message ✓
- Special mention notification 🔔

Everyone else receives:
- Regular message ✓
- Special mention notification 🔔 (from @everyone)
```

### Scenario 3: Code Review
```
Dev: "@alice I fixed the bug you mentioned 👍"

Alice receives:
- Regular message
- Mention notification (different sound/badge)
- Can quickly react with ✅ when reviewed
```

---

## 🚀 Production Ready

Both features are fully functional and ready to use!

