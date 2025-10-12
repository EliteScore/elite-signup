# Frontend Integration Tutorial

**Complete Guide for Integrating Your App with the Chat Server**

This tutorial walks you through connecting your frontend application to the chat server, authenticating users, sending messages, and implementing all chat features.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Basic Connection Setup](#basic-connection-setup)
3. [Authentication Flow](#authentication-flow)
4. [Sending & Receiving Direct Messages](#sending--receiving-direct-messages)
5. [Group Chat Integration](#group-chat-integration)
6. [User Blocking](#user-blocking)
7. [Reactions & Mentions](#reactions--mentions)
8. [Error Handling](#error-handling)
9. [Complete Implementation Examples](#complete-implementation-examples)
10. [Production Considerations](#production-considerations)

---

## Prerequisites

### What You Need

1. **WebSocket Support**: Your browser/app must support native WebSocket API
2. **JWT Token**: Your main backend must issue JWT tokens with:
   - `userId` - User's unique ID
   - `jti` - Token ID for revocation checking
   - `exp` - Expiration timestamp
3. **Chat Server URL**: 
   - Development: `ws://localhost:3001`
   - Production: `wss://your-domain.com` (secure WebSocket)

### Server Status Check

Before connecting, verify the server is ready:

**Check Server Health:**
```
GET http://localhost:3001/health
```

**Check Server Readiness:**
```
GET http://localhost:3001/ready
```

If `/ready` returns `{"ready": true}`, you can proceed with WebSocket connection.

---

## Basic Connection Setup

### Step 1: Establish WebSocket Connection

The first step is to create a WebSocket connection to the chat server.

**Key Points:**
- Use `ws://` for development (localhost)
- Use `wss://` for production (secure)
- Connection must be established before authentication
- Server will close connection if not authenticated within 30 seconds

**What Happens:**
1. Client opens WebSocket connection
2. Server accepts connection
3. Client must send authentication message
4. Server validates JWT token
5. Server responds with success or error

**Connection States:**
- `CONNECTING (0)` - Connection is being established
- `OPEN (1)` - Connection is ready to communicate
- `CLOSING (2)` - Connection is closing
- `CLOSED (3)` - Connection is closed

---

### Step 2: Authenticate the Connection

Immediately after connection opens, send authentication message.

**Authentication Message Format:**
```json
{
  "type": "authenticate",
  "token": "your-jwt-token-here"
}
```

**What the Server Does:**
1. Extracts JWT token from message
2. Verifies token signature using `JWT_SECRET`
3. Checks token expiration
4. Extracts `jti` (token ID) from token
5. Checks if token is revoked in database
6. Looks up user in database using token's `userId`
7. Responds with success or error

**Success Response:**
```json
{
  "type": "auth_success",
  "userId": "123",
  "username": "john_doe",
  "email": "john@example.com",
  "displayName": "John Doe",
  "profileImage": "https://...",
  "bio": "Hello world"
}
```

**Error Responses:**
```json
// Invalid token
{"type": "auth_error", "error": "Invalid token signature or expired"}

// User not found
{"type": "auth_error", "error": "User not found in database"}

// Missing token
{"type": "auth_error", "error": "No token provided"}
```

**Important:**
- You MUST authenticate before sending any other messages
- Unauthenticated connections are closed after 30 seconds
- Save the user details from `auth_success` for later use

---

## Sending & Receiving Direct Messages

### Step 1: Get Online Users

Before starting a conversation, you'll want to show available users.

**Send This:**
```json
{
  "type": "get_online_users"
}
```

**Receive This:**
```json
{
  "type": "online_users",
  "users": [
    {
      "userId": "456",
      "username": "jane_doe",
      "displayName": "Jane Doe",
      "profileImage": "https://...",
      "lastSeen": "2025-10-12T15:30:00.000Z"
    }
  ]
}
```

**Key Points:**
- Only shows users who are NOT blocking you
- Only shows users you have NOT blocked
- Updates in real-time as users connect/disconnect
- Call this periodically to refresh the list

---

### Step 2: Start a Conversation

To send a message to someone, first start a conversation.

**Send This:**
```json
{
  "type": "start_conversation",
  "recipientId": "456"
}
```

**Receive This (Success):**
```json
{
  "type": "conversation_started",
  "conversationId": "conv_123_456",
  "recipient": {
    "userId": "456",
    "username": "jane_doe",
    "displayName": "Jane Doe",
    "profileImage": "https://..."
  },
  "messages": [
    {
      "messageId": "msg_001",
      "conversationId": "conv_123_456",
      "senderId": "123",
      "senderUsername": "john_doe",
      "recipientId": "456",
      "content": "Hey, how are you?",
      "createdAt": "2025-10-12T15:25:00.000Z",
      "isEncrypted": true,
      "isEdited": false,
      "isDeleted": false
    }
  ]
}
```

**Receive This (Error - Blocked):**
```json
{
  "type": "error",
  "error": "Cannot start conversation - blocking relationship exists"
}
```

**What This Does:**
- Creates or retrieves existing conversation
- Returns recent messages (last 50)
- Returns recipient details
- Checks for blocking relationships

**When to Use:**
- Before sending first message to someone
- When user clicks on a contact to open chat
- When reopening app to load existing conversations

---

### Step 3: Send a Direct Message

Now you can send messages in the conversation.

**Send This:**
```json
{
  "type": "send_private_message",
  "recipientId": "456",
  "content": "Hello! How are you doing?"
}
```

**Optional Fields:**
```json
{
  "type": "send_private_message",
  "recipientId": "456",
  "content": "That's a great point!",
  "replyToMessageId": "msg_001"
}
```

**You Receive (Confirmation):**
```json
{
  "type": "new_message",
  "messageId": "msg_002",
  "conversationId": "conv_123_456",
  "senderId": "123",
  "senderUsername": "john_doe",
  "recipientId": "456",
  "content": "Hello! How are you doing?",
  "isEncrypted": true,
  "createdAt": "2025-10-12T15:30:00.000Z",
  "isEdited": false,
  "isDeleted": false
}
```

**Recipient Receives (Same Message):**
```json
{
  "type": "new_message",
  "messageId": "msg_002",
  "conversationId": "conv_123_456",
  "senderId": "123",
  "senderUsername": "john_doe",
  "recipientId": "456",
  "content": "Hello! How are you doing?",
  "isEncrypted": true,
  "createdAt": "2025-10-12T15:30:00.000Z",
  "isEdited": false,
  "isDeleted": false
}
```

**Rate Limiting:**
- 30 messages per 60 seconds per user
- If exceeded: `{"type": "error", "error": "Rate limit exceeded. Please slow down."}`
- Show visual feedback to user when approaching limit

---

### Step 4: Show Typing Indicator

Let the other person know you're typing.

**When User Starts Typing:**
```json
{
  "type": "typing",
  "recipientId": "456",
  "isTyping": true
}
```

**When User Stops Typing:**
```json
{
  "type": "typing",
  "recipientId": "456",
  "isTyping": false
}
```

**Recipient Receives:**
```json
{
  "type": "user_typing",
  "userId": "123",
  "isTyping": true
}
```

**Best Practices:**
- Send `isTyping: true` when user starts typing
- Send `isTyping: false` after 3 seconds of no typing
- Send `isTyping: false` when message is sent
- Debounce typing events (don't send every keystroke)

---

### Step 5: Load Message History

Load older messages for infinite scroll.

**Send This:**
```json
{
  "type": "load_private_messages",
  "recipientId": "456",
  "limit": 50,
  "offset": 0
}
```

**Receive This:**
```json
{
  "type": "message_history",
  "conversationId": "conv_123_456",
  "messages": [
    {
      "messageId": "msg_001",
      "senderId": "123",
      "content": "...",
      "createdAt": "..."
    }
  ],
  "hasMore": true
}
```

**Pagination:**
- `offset: 0` - Most recent messages
- `offset: 50` - Next 50 messages
- `offset: 100` - Next 50 after that
- `hasMore: true` - More messages available
- `hasMore: false` - No more messages

---

### Step 6: Edit a Message

Only your own messages can be edited.

**Send This:**
```json
{
  "type": "edit_private_message",
  "messageId": "msg_002",
  "newContent": "Hello! How have you been?"
}
```

**Both Users Receive:**
```json
{
  "type": "message_edited",
  "messageId": "msg_002",
  "conversationId": "conv_123_456",
  "newContent": "Hello! How have you been?",
  "editedAt": "2025-10-12T15:35:00.000Z"
}
```

**Error Response:**
```json
{
  "type": "error",
  "error": "Cannot edit message you didn't send"
}
```

---

### Step 7: Delete a Message

Only your own messages can be deleted.

**Send This:**
```json
{
  "type": "delete_private_message",
  "messageId": "msg_002"
}
```

**Both Users Receive:**
```json
{
  "type": "message_deleted",
  "messageId": "msg_002",
  "conversationId": "conv_123_456"
}
```

**What Happens:**
- Message is marked as deleted in database
- Message content is removed from display
- Can show "Message deleted" placeholder

---

## Group Chat Integration

### Step 1: Create a Group

**Send This:**
```json
{
  "type": "create_group",
  "groupName": "Project Team",
  "memberUserIds": ["456", "789", "012"],
  "maxMembers": 100
}
```

**Receive This (Success):**
```json
{
  "type": "group_created",
  "groupId": "group_abc123",
  "groupName": "Project Team",
  "createdBy": "123",
  "maxMembers": 100,
  "members": [
    {
      "userId": "123",
      "username": "john_doe",
      "displayName": "John Doe",
      "role": "owner",
      "joinedAt": "2025-10-12T15:40:00.000Z"
    },
    {
      "userId": "456",
      "username": "jane_doe",
      "displayName": "Jane Doe",
      "role": "member",
      "joinedAt": "2025-10-12T15:40:00.000Z"
    }
  ]
}
```

**Receive This (Error - Blocked User):**
```json
{
  "type": "error",
  "error": "Cannot add users due to blocking: jane_doe, bob_smith"
}
```

**Key Points:**
- Cannot add users who block you or you block
- You automatically become group owner
- All members receive `group_created` event
- Group ID is generated by server

---

### Step 2: Send Group Message

**Send This:**
```json
{
  "type": "send_group_message",
  "groupId": "group_abc123",
  "content": "Hey everyone! Welcome to the team."
}
```

**With @Mentions:**
```json
{
  "type": "send_group_message",
  "groupId": "group_abc123",
  "content": "Hey @jane_doe, can you check this? @everyone please review."
}
```

**All Members Receive:**
```json
{
  "type": "new_group_message",
  "messageId": "gmsg_001",
  "groupId": "group_abc123",
  "senderId": "123",
  "senderUsername": "john_doe",
  "content": "Hey @jane_doe, can you check this? @everyone please review.",
  "isGroupMessage": true,
  "mentions": [
    {
      "type": "user",
      "userId": "456",
      "username": "jane_doe"
    },
    {
      "type": "everyone"
    }
  ],
  "createdAt": "2025-10-12T15:45:00.000Z"
}
```

**Mention Types:**
- `@username` - Mentions specific user (must be in group)
- `@everyone` or `@all` - Mentions all group members
- Mentions are automatically parsed by server
- Frontend should highlight mentioned users

---

### Step 3: React to Group Message

**Add Reaction:**
```json
{
  "type": "add_group_reaction",
  "messageId": "gmsg_001",
  "emoji": "👍"
}
```

**All Members Receive:**
```json
{
  "type": "reaction_added",
  "messageId": "gmsg_001",
  "groupId": "group_abc123",
  "userId": "456",
  "username": "jane_doe",
  "emoji": "👍",
  "timestamp": "2025-10-12T15:46:00.000Z"
}
```

**Remove Reaction:**
```json
{
  "type": "remove_group_reaction",
  "messageId": "gmsg_001",
  "emoji": "👍"
}
```

**All Members Receive:**
```json
{
  "type": "reaction_removed",
  "messageId": "gmsg_001",
  "groupId": "group_abc123",
  "userId": "456",
  "emoji": "👍"
}
```

**Reaction Rules:**
- One emoji per user per message
- Adding same emoji again has no effect
- Can only remove your own reactions
- Any emoji is supported

---

### Step 4: Add/Remove Group Members

**Add Member (Owner/Admin Only):**
```json
{
  "type": "add_group_member",
  "groupId": "group_abc123",
  "userId": "345"
}
```

**All Members Receive:**
```json
{
  "type": "member_added",
  "groupId": "group_abc123",
  "userId": "345",
  "username": "bob_smith",
  "addedBy": "123"
}
```

**Remove Member (Owner/Admin Only):**
```json
{
  "type": "remove_group_member",
  "groupId": "group_abc123",
  "userId": "345"
}
```

**All Members Receive:**
```json
{
  "type": "member_removed",
  "groupId": "group_abc123",
  "userId": "345",
  "username": "bob_smith",
  "removedBy": "123"
}
```

**Permission Rules:**
- Only owners and admins can add/remove members
- Cannot remove group owner
- Admins cannot remove other admins
- Cannot add blocked users

---

### Step 5: Leave Group

**Send This:**
```json
{
  "type": "leave_group",
  "groupId": "group_abc123"
}
```

**All Remaining Members Receive:**
```json
{
  "type": "member_left",
  "groupId": "group_abc123",
  "userId": "456",
  "username": "jane_doe"
}
```

**Special Cases:**
- If owner leaves: ownership transfers to oldest admin
- If no admins: ownership transfers to oldest member
- If last member leaves: group is deleted

---

### Step 6: Update Group Info

**Send This (Owner/Admin Only):**
```json
{
  "type": "update_group_info",
  "groupId": "group_abc123",
  "groupName": "Project Team - Q4",
  "maxMembers": 150
}
```

**All Members Receive:**
```json
{
  "type": "group_info_updated",
  "groupId": "group_abc123",
  "groupName": "Project Team - Q4",
  "maxMembers": 150,
  "updatedBy": "123"
}
```

---

### Step 7: Get Group Info

**Send This:**
```json
{
  "type": "get_group_info",
  "groupId": "group_abc123"
}
```

**Receive This:**
```json
{
  "type": "group_info",
  "groupId": "group_abc123",
  "groupName": "Project Team",
  "createdBy": "123",
  "maxMembers": 100,
  "memberCount": 4,
  "createdAt": "2025-10-12T15:40:00.000Z"
}
```

---

### Step 8: Load Group Messages

**Send This:**
```json
{
  "type": "get_group_messages",
  "groupId": "group_abc123",
  "limit": 50,
  "offset": 0
}
```

**Receive This:**
```json
{
  "type": "group_message_history",
  "groupId": "group_abc123",
  "messages": [
    {
      "messageId": "gmsg_001",
      "senderId": "123",
      "content": "...",
      "mentions": [],
      "reactions": [
        {"userId": "456", "emoji": "👍"}
      ],
      "createdAt": "..."
    }
  ],
  "hasMore": true
}
```

---

## User Blocking

### How Blocking Works

**Server-Side Enforcement:**
- Blocking is bidirectional (both users cannot interact)
- Blocked users are hidden from online users list
- Cannot send/receive DMs from blocked users
- Cannot add blocked users to groups
- Cannot be added to groups by blocked users

**Frontend Responsibilities:**
- Show appropriate UI (disabled message button)
- Display error messages to user
- Filter blocked users from contact lists

**Database Table:**
The server checks the `blocked_relationships` table:
- `blocker_user_id` - User who initiated the block
- `blocked_user_id` - User who was blocked
- `blocked_at` - Timestamp

**Note:** You don't need to implement blocking logic - the server handles it. Just handle the error responses.

---

## Reactions & Mentions

### Reactions

**How They Work:**
1. User clicks reaction emoji on message
2. Frontend sends `add_group_reaction`
3. Server broadcasts to all group members
4. All clients update message to show reaction

**Display Logic:**
- Group reactions by emoji type
- Show count for each emoji
- Highlight user's own reactions
- Show tooltip with usernames who reacted

**Example Display:**
```
👍 5  ❤️ 3  😂 2
```

---

### Mentions

**How They Work:**
1. User types `@username` in message
2. Frontend can show autocomplete (optional)
3. Send message with `@username` in content
4. Server automatically parses mentions
5. Server returns `mentions` array with message
6. Frontend highlights mentioned users

**Mention Detection:**
- `@username` - User mention (must be group member)
- `@everyone` or `@all` - Mention all members
- Server validates mentions exist
- Invalid mentions are ignored

**Frontend Display:**
- Highlight `@username` in different color
- Show notification badge for messages where user is mentioned
- Optionally send push notification for mentions

**Example:**
```
Message: "Hey @john_doe, can you help? @everyone please review."

Parsed mentions:
[
  {type: "user", userId: "123", username: "john_doe"},
  {type: "everyone"}
]

Display:
"Hey @john_doe, can you help? @everyone please review."
      ^^^^^^^^^                  ^^^^^^^^^
      (highlighted)              (highlighted)
```

---

## Error Handling

### Connection Errors

**Connection Failed:**
```javascript
// Retry with exponential backoff
// 1st retry: 1 second
// 2nd retry: 2 seconds
// 3rd retry: 4 seconds
// Max retry: 30 seconds
```

**Connection Closed:**
```javascript
// Server closes connection with reason code
// 1000 = Normal closure
// 1001 = Going away
// 1011 = Server error
```

**What to Do:**
- Show "Connecting..." message
- Retry connection automatically
- Don't spam user with error messages
- After 3 failed attempts, show "Cannot connect" error

---

### Authentication Errors

**Invalid Token:**
```json
{"type": "auth_error", "error": "Invalid token signature or expired"}
```

**What to Do:**
- Clear stored JWT token
- Redirect user to login page
- Refresh token from main backend
- Retry authentication

**User Not Found:**
```json
{"type": "auth_error", "error": "User not found in database"}
```

**What to Do:**
- This means user exists in main backend but not in chat database
- Contact support or retry
- User may need to be synced to chat database

---

### Message Errors

**Rate Limit Exceeded:**
```json
{"type": "error", "error": "Rate limit exceeded. Please slow down."}
```

**What to Do:**
- Show message to user: "You're sending messages too quickly"
- Disable send button for 10 seconds
- Show countdown timer

**Blocking Relationship:**
```json
{"type": "error", "error": "Cannot send message - blocking relationship exists"}
```

**What to Do:**
- Show message: "Unable to send message to this user"
- Disable message input
- Explain blocking status if appropriate

**Validation Errors:**
```json
{"type": "error", "error": "Message content is required"}
{"type": "error", "error": "Message too long (max 5000 characters)"}
{"type": "error", "error": "Recipient ID must be a string"}
```

**What to Do:**
- Validate input on frontend before sending
- Show inline error messages
- Don't let user submit invalid data

---

### Group Errors

**Not a Member:**
```json
{"type": "error", "error": "You are not a member of this group"}
```

**Insufficient Permission:**
```json
{"type": "error", "error": "Only admins and owners can add members"}
```

**Blocked User:**
```json
{"type": "error", "error": "Cannot add users due to blocking: username1, username2"}
```

**What to Do:**
- Show appropriate error message
- Hide features user doesn't have permission for
- For blocked users, show which users couldn't be added

---

## Complete Implementation Examples

### Example 1: React Chat Component

**Initial Setup:**

```
Component Mount:
1. Check if server is ready (GET /ready)
2. Create WebSocket connection
3. Set up event listeners
4. Authenticate with JWT

On Auth Success:
1. Load user's groups (get_user_groups)
2. Load recent conversations (load_private_messages)
3. Subscribe to real-time events

On Message Received:
1. Update UI immediately
2. Show notification if window not focused
3. Play sound if enabled
4. Update unread count
```

---

### Example 2: Message Flow

**Sending a Message:**

```
User Action:
1. User types message in input
2. User clicks send button

Frontend:
1. Validate message (not empty, not too long)
2. Show message in UI immediately (optimistic update)
3. Add "sending..." indicator
4. Send WebSocket message

Server:
1. Validates message
2. Saves to database
3. Broadcasts to recipient
4. Sends confirmation back

Frontend:
1. Receives confirmation
2. Updates message with server ID
3. Removes "sending..." indicator
4. If error, show error and remove message
```

---

### Example 3: Group Chat Flow

**Creating a Group:**

```
User Action:
1. Clicks "New Group"
2. Enters group name
3. Selects members from list
4. Clicks "Create"

Frontend:
1. Validate group name (not empty)
2. Validate at least 1 member selected
3. Show loading indicator
4. Send create_group message

Server:
1. Validates all members
2. Checks for blocking relationships
3. Creates group in database
4. Broadcasts to all members

Frontend:
1. Receives group_created event
2. Adds group to UI
3. Opens group chat
4. Shows success message
5. If error, shows which users couldn't be added
```

---

### Example 4: Reconnection Flow

**Connection Lost:**

```
Event: WebSocket closed unexpectedly

Frontend:
1. Show "Reconnecting..." banner
2. Wait 1 second
3. Attempt reconnection

If Reconnection Succeeds:
1. Re-authenticate with JWT
2. Reload recent messages (last 5 minutes)
3. Hide "Reconnecting..." banner
4. Show "Back online" message briefly

If Reconnection Fails:
1. Wait 2 seconds (exponential backoff)
2. Retry up to 5 times
3. If all fail, show "Connection lost" error
4. Show "Retry" button
```

---

### Example 5: Real-Time Updates

**Events to Listen For:**

```
new_message:
- Add message to conversation
- Show notification if not current conversation
- Update unread count
- Play sound

new_group_message:
- Add message to group chat
- Check if mentioned (@username or @all)
- Show special notification if mentioned
- Update unread count

user_typing:
- Show "User is typing..." indicator
- Hide after 3 seconds if no new typing event

message_edited:
- Update message content in UI
- Show "(edited)" label
- Maintain scroll position

message_deleted:
- Replace message with "Message deleted"
- Keep message in list with deleted state

reaction_added:
- Add reaction to message
- Animate emoji appearing
- Update reaction count

member_added:
- Add member to group member list
- Show system message "X joined the group"

group_info_updated:
- Update group name in UI
- Show system message "Group name changed to X"
```

---

## Production Considerations

### Performance Optimization

**Message Caching:**
- Cache last 100 messages per conversation in memory
- Load older messages on scroll (pagination)
- Clear cache when app goes to background

**Connection Management:**
- Keep single WebSocket connection for all chats
- Don't open new connection for each conversation
- Reuse connection across app navigation

**Network Efficiency:**
- Batch read receipts (if implemented)
- Debounce typing indicators (send max once per second)
- Compress large payloads

---

### Security Best Practices

**Token Management:**
- Store JWT in secure storage (not localStorage)
- Refresh token before expiry
- Clear token on logout
- Never log token in console

**Input Sanitization:**
- Validate all user input before sending
- Escape HTML in messages to prevent XSS
- Limit message length on frontend
- Don't trust server responses blindly

**User Privacy:**
- Don't show typing indicator to blocked users
- Filter blocked users from all lists
- Respect user's online status preferences

---

### Error Recovery

**Automatic Recovery:**
- Reconnect on connection loss
- Re-authenticate after reconnection
- Resend failed messages
- Sync messages after reconnection

**User Feedback:**
- Show connection status in UI
- Display error messages clearly
- Provide retry options
- Don't crash on errors

---

### Testing Checklist

**Connection:**
- [ ] Connect with valid token
- [ ] Handle invalid token
- [ ] Handle expired token
- [ ] Reconnect after disconnect
- [ ] Handle network interruption

**Direct Messages:**
- [ ] Send message
- [ ] Receive message
- [ ] Edit own message
- [ ] Delete own message
- [ ] Load message history
- [ ] Typing indicator works
- [ ] Can't message blocked user

**Group Chat:**
- [ ] Create group
- [ ] Send group message
- [ ] @mentions work
- [ ] Reactions work
- [ ] Add/remove members
- [ ] Leave group
- [ ] Update group info
- [ ] Can't add blocked users

**Edge Cases:**
- [ ] Multiple tabs open
- [ ] Slow network
- [ ] Server restart
- [ ] Rate limiting
- [ ] Very long messages
- [ ] Special characters in messages
- [ ] Emoji support

---

## Quick Start Checklist

### Before You Start:
- [ ] Server is running on port 3001
- [ ] Database is connected
- [ ] You have a valid JWT token from your backend
- [ ] JWT includes `userId`, `jti`, and `exp`

### Implementation Steps:
1. [ ] Create WebSocket connection
2. [ ] Send authentication message
3. [ ] Handle auth success/error
4. [ ] Set up message listeners
5. [ ] Implement send message
6. [ ] Implement receive message
7. [ ] Add typing indicators
8. [ ] Implement group chat
9. [ ] Add error handling
10. [ ] Test reconnection

### Testing Steps:
1. [ ] Open app in browser
2. [ ] Check console for successful connection
3. [ ] Verify authentication succeeds
4. [ ] Send a test message
5. [ ] Open app in second browser/tab
6. [ ] Verify messages appear in both
7. [ ] Test blocking
8. [ ] Test group chat
9. [ ] Test reconnection (turn off/on WiFi)
10. [ ] Check error handling

---

## Support & Resources

### Server Endpoints:
- WebSocket: `ws://localhost:3001`
- Health: `http://localhost:3001/health`
- Ready: `http://localhost:3001/ready`
- Metrics: `http://localhost:3001/metrics`

### Documentation Files:
- `FRONTEND_INTEGRATION_GUIDE.md` - Complete API reference
- `GROUP_CHAT_COMPLETE.md` - Detailed group chat features
- `REACTIONS_AND_MENTIONS.md` - Reactions and mentions guide
- `ENDPOINT_TEST_RESULTS.md` - HTTP endpoint test results

### Common Issues:

**Connection Timeout:**
- Check server is running
- Verify WebSocket URL
- Check firewall/proxy settings

**Auth Fails:**
- Verify JWT token is valid
- Check JWT_SECRET matches server
- Ensure user exists in database

**Messages Not Sending:**
- Check rate limiting
- Verify authentication succeeded
- Check for blocking relationships

---

## Summary

### What You Learned:

1. ✅ How to connect to WebSocket server
2. ✅ How to authenticate with JWT
3. ✅ How to send/receive direct messages
4. ✅ How to implement group chats
5. ✅ How to handle mentions and reactions
6. ✅ How to handle errors and reconnection
7. ✅ How to optimize for production

### Next Steps:

1. Implement basic connection and authentication
2. Add direct messaging
3. Add group chat support
4. Implement reactions and mentions
5. Add error handling and reconnection
6. Optimize and test thoroughly
7. Deploy to production

### Key Takeaways:

- **One WebSocket** connection handles everything
- **Authenticate first** before any other actions
- **Handle errors gracefully** with user feedback
- **Reconnect automatically** on connection loss
- **Validate input** before sending to server
- **Respect blocking** relationships
- **Test thoroughly** before production

---

**You're Ready!** You now have everything needed to integrate the chat server into your frontend application. Start with basic connection and authentication, then gradually add more features. Good luck! 🚀

