# Complete API Reference

All 26 WebSocket message types and HTTP endpoints.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Direct Messages](#direct-messages)
3. [Group Chats](#group-chats)
4. [Reactions](#reactions)
5. [HTTP Endpoints](#http-endpoints)
6. [Error Codes](#error-codes)

---

## Authentication

### authenticate

Authenticate your WebSocket connection with JWT token.

**Send:**
```json
{
  "type": "authenticate",
  "token": "your-jwt-token"
}
```

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

**Error Response:**
```json
{
  "type": "auth_error",
  "error": "Invalid token signature or expired"
}
```

**Notes:**
- Must authenticate within 30 seconds of connecting
- Token must include `userId`, `jti`, `exp`
- JWT validated independently (same `JWT_SECRET` as Java backend)

---

## Direct Messages

### get_online_users

Get list of online users (excludes blocked users).

**Send:**
```json
{
  "type": "get_online_users"
}
```

**Receive:**
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

---

### start_conversation

Start or retrieve existing conversation (loads last 50 messages).

**Send:**
```json
{
  "type": "start_conversation",
  "recipientId": "456"
}
```

**Success Response:**
```json
{
  "type": "conversation_started",
  "conversationId": "conv_123_456",
  "recipient": {
    "userId": "456",
    "username": "jane_doe",
    "displayName": "Jane Doe"
  },
  "messages": [...]
}
```

**Restrictions:**
- ❌ Cannot start conversation with blocked users
- ❌ Can only message users you follow

---

### send_private_message

Send a direct message.

**Send:**
```json
{
  "type": "send_private_message",
  "recipientId": "456",
  "content": "Hello!",
  "replyToMessageId": "msg_001"  // Optional
}
```

**Both Users Receive:**
```json
{
  "type": "new_message",
  "messageId": "msg_002",
  "conversationId": "conv_123_456",
  "senderId": "123",
  "senderUsername": "john_doe",
  "recipientId": "456",
  "content": "Hello!",
  "createdAt": "2025-10-12T15:30:00.000Z",
  "isEncrypted": true,
  "isEdited": false,
  "isDeleted": false
}
```

**Limits:**
- Message: 1-5000 characters
- Rate limit: 30 messages per 60 seconds

---

### edit_private_message

Edit your own message.

**Send:**
```json
{
  "type": "edit_private_message",
  "messageId": "msg_002",
  "newContent": "Hello! How are you?"
}
```

**Both Users Receive:**
```json
{
  "type": "message_edited",
  "messageId": "msg_002",
  "conversationId": "conv_123_456",
  "newContent": "Hello! How are you?",
  "editedAt": "2025-10-12T15:35:00.000Z"
}
```

---

### delete_private_message

Delete your own message.

**Send:**
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

---

### delete_conversation

Delete entire conversation.

**Send:**
```json
{
  "type": "delete_conversation",
  "conversationId": "conv_123_456",
  "deleteForEveryone": false  // true = delete for all participants
}
```

**Response:**
```json
{
  "type": "conversation_deleted",
  "conversationId": "conv_123_456",
  "deleteForEveryone": false,
  "timestamp": "2025-10-12T15:40:00.000Z"
}
```

---

### typing

Send typing indicator.

**Send:**
```json
{
  "type": "typing",
  "recipientId": "456",
  "isTyping": true  // or false
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

---

## Group Chats

### create_group

Create a new group chat.

**Send:**
```json
{
  "type": "create_group",
  "groupName": "Project Team",
  "memberUserIds": ["456", "789"],
  "maxMembers": 50  // Optional, default 50
}
```

**All Members Receive:**
```json
{
  "type": "group_created",
  "groupId": "group_abc123",
  "groupName": "Project Team",
  "createdBy": "123",
  "maxMembers": 50,
  "members": [
    {
      "userId": "123",
      "username": "john_doe",
      "role": "owner",
      "joinedAt": "2025-10-12T15:40:00.000Z"
    }
  ]
}
```

**Restrictions:**
- ❌ Cannot add blocked users
- ❌ Can only add users you follow
- ⚠️ Max 50 members (default)

---

### send_group_message

Send message to group.

**Send:**
```json
{
  "type": "send_group_message",
  "groupId": "group_abc123",
  "content": "Hey @jane_doe, check this! @everyone review please.",
  "replyToMessageId": "gmsg_001"  // Optional
}
```

**All Members Receive:**
```json
{
  "type": "new_group_message",
  "messageId": "gmsg_002",
  "groupId": "group_abc123",
  "senderId": "123",
  "senderUsername": "john_doe",
  "content": "Hey @jane_doe, check this! @everyone review please.",
  "mentions": [
    { "type": "user", "userId": "456", "username": "jane_doe" },
    { "type": "everyone" }
  ],
  "createdAt": "2025-10-12T15:45:00.000Z"
}
```

**Mention Formats:**
- `@username` - Mention specific user
- `@everyone` or `@all` - Mention all members

---

### get_group_messages

Load group message history.

**Send:**
```json
{
  "type": "get_group_messages",
  "groupId": "group_abc123",
  "limit": 50,
  "offset": 0
}
```

**Receive:**
```json
{
  "type": "group_message_history",
  "groupId": "group_abc123",
  "messages": [...],
  "hasMore": true
}
```

---

### get_user_groups

Get all groups user is member of.

**Send:**
```json
{
  "type": "get_user_groups"
}
```

**Receive:**
```json
{
  "type": "user_groups",
  "groups": [
    {
      "groupId": "group_abc123",
      "groupName": "Project Team",
      "memberCount": 4,
      "role": "owner"
    }
  ]
}
```

---

### get_group_members

Get all members of a group.

**Send:**
```json
{
  "type": "get_group_members",
  "groupId": "group_abc123"
}
```

**Receive:**
```json
{
  "type": "group_members",
  "groupId": "group_abc123",
  "members": [
    {
      "userId": "123",
      "username": "john_doe",
      "role": "owner",
      "joinedAt": "2025-10-12T15:40:00.000Z"
    }
  ]
}
```

**Roles:**
- `owner` - Full control, can delete group
- `admin` - Can add/remove members, update settings
- `member` - Can send messages, leave group

---

### get_group_info

Get group information.

**Send:**
```json
{
  "type": "get_group_info",
  "groupId": "group_abc123"
}
```

**Receive:**
```json
{
  "type": "group_info",
  "groupId": "group_abc123",
  "groupName": "Project Team",
  "createdBy": "123",
  "maxMembers": 50,
  "memberCount": 4,
  "createdAt": "2025-10-12T15:40:00.000Z"
}
```

---

### add_group_member

Add member to group (Owner/Admin only).

**Send:**
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

---

### remove_group_member

Remove member from group (Owner/Admin only).

**Send:**
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

**Restrictions:**
- ❌ Cannot remove owner
- ❌ Admins cannot remove other admins

---

### leave_group

Leave a group.

**Send:**
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
- Owner leaves → ownership transfers to oldest admin
- No admins → ownership transfers to oldest member
- Last member leaves → group deleted
- ❌ Owner cannot leave (must delete group)

---

### update_group_info

Update group settings (Owner/Admin only).

**Send:**
```json
{
  "type": "update_group_info",
  "groupId": "group_abc123",
  "groupName": "Project Team - Q4",
  "maxMembers": 100
}
```

**All Members Receive:**
```json
{
  "type": "group_info_updated",
  "groupId": "group_abc123",
  "groupName": "Project Team - Q4",
  "maxMembers": 100,
  "updatedBy": "123"
}
```

---

### edit_group_message

Edit own group message.

**Send:**
```json
{
  "type": "edit_group_message",
  "messageId": "gmsg_001",
  "newContent": "Updated content"
}
```

**All Members Receive:**
```json
{
  "type": "group_message_edited",
  "messageId": "gmsg_001",
  "groupId": "group_abc123",
  "newContent": "Updated content",
  "editedAt": "2025-10-12T15:50:00.000Z"
}
```

---

### delete_group_message

Delete own group message.

**Send:**
```json
{
  "type": "delete_group_message",
  "messageId": "gmsg_001"
}
```

**All Members Receive:**
```json
{
  "type": "group_message_deleted",
  "messageId": "gmsg_001",
  "groupId": "group_abc123"
}
```

---

### promote_member

Promote member to admin (Owner only).

**Send:**
```json
{
  "type": "promote_member",
  "groupId": "group_abc123",
  "userId": "456"
}
```

**All Members Receive:**
```json
{
  "type": "member_promoted",
  "groupId": "group_abc123",
  "userId": "456",
  "newRole": "admin",
  "promotedBy": "123"
}
```

---

### demote_member

Demote admin to member (Owner only).

**Send:**
```json
{
  "type": "demote_member",
  "groupId": "group_abc123",
  "userId": "456"
}
```

**All Members Receive:**
```json
{
  "type": "member_demoted",
  "groupId": "group_abc123",
  "userId": "456",
  "newRole": "member",
  "demotedBy": "123"
}
```

---

### delete_group

Delete group (Owner only).

**Send:**
```json
{
  "type": "delete_group",
  "groupId": "group_abc123",
  "permanent": false  // false = soft delete (30-day grace), true = hard delete
}
```

**All Members Receive:**
```json
{
  "type": "group_deleted",
  "groupId": "group_abc123",
  "deletedBy": "123",
  "permanent": false,
  "message": "Group will be permanently deleted in 30 days"
}
```

---

## Reactions

### add_group_reaction

Add emoji reaction to group message.

**Send:**
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

**Rules:**
- One emoji per user per message
- Any emoji supported

---

### remove_group_reaction

Remove your own reaction.

**Send:**
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

---

## HTTP Endpoints

### GET /health

Comprehensive health check.

**Response:**
```json
{
  "status": "healthy",
  "uptime": 15.58,
  "connections": 5,
  "database": { "connected": true },
  "memory": { "rss": "98.77 MB" }
}
```

---

### GET /ready

Readiness probe for load balancers.

**Response:**
```json
{
  "ready": true,
  "timestamp": "2025-10-12T15:17:16.766Z",
  "checks": [
    { "name": "database", "status": "healthy" },
    { "name": "websocket", "status": "healthy" }
  ]
}
```

**Status Codes:**
- `200` - Ready
- `503` - Not ready

---

### GET /metrics

Performance metrics.

**Response:**
```json
{
  "connections": 5,
  "messagesSent": 1234,
  "messagesReceived": 1234,
  "activeUsers": 5,
  "system": {
    "uptime": 23.07,
    "memory": {...},
    "cpu": {...}
  }
}
```

---

### GET /live

Liveness probe.

**Response:**
```json
{
  "alive": true,
  "timestamp": "2025-10-12T15:17:27.308Z",
  "uptime": 45.42
}
```

---

## Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| `USER_BLOCKED` | Blocking relationship exists | Cannot be resolved |
| `NOT_FOLLOWING` | Sender doesn't follow recipient | Follow user first |
| `INSUFFICIENT_PERMISSIONS` | Not owner/admin | Need higher role |
| `OWNER_CANNOT_LEAVE` | Owner trying to leave | Delete group instead |
| `GROUP_FULL` | Group at max capacity | Cannot add more |
| `AUTH_REQUIRED` | Not authenticated | Log in first |

---

## Summary

**Total Endpoints:** 26 WebSocket + 4 HTTP

**Categories:**
- 1 Authentication
- 7 Direct Messages  
- 14 Group Chats
- 2 Reactions
- 4 HTTP Monitoring

**All endpoints return JSON and handle errors gracefully.**

