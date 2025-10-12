# Frontend Integration Guide

## Overview

This guide provides all the information needed to integrate your frontend application with the chat server. The chat system supports real-time messaging via WebSockets, including private messages, group chats, reactions, mentions, and user blocking.

---

## Connection Details

### WebSocket Server
- **URL**: `ws://your-server-domain:port` or `wss://your-server-domain:port` (production)
- **Default Port**: 3001
- **Protocol**: WebSocket (ws/wss)
- **Authentication**: JWT token required

### Connection Flow
1. Establish WebSocket connection
2. Send authentication message with JWT token
3. Wait for `auth_success` response
4. Begin sending/receiving messages

---

## Authentication

### Initial Authentication Message

**Type**: `authenticate`

**Required Fields**:
- `token`: JWT token from your main backend

**Success Response**:
- Type: `auth_success`
- Contains: `userId`, `username`, `email`, `displayName`, `profileImage`, `bio`

**Error Response**:
- Type: `auth_error`
- Contains: `error` message

**Important Notes**:
- JWT must be valid and not expired
- JWT must include `jti` (token ID) for revocation checking
- User must exist in the database
- Each microservice verifies tokens independently

---

## Private Messaging (DMs)

### Get Online Users

**Type**: `get_online_users`

**Parameters**: None

**Response**:
- Type: `online_users`
- Contains: Array of user objects (excludes blocked users bidirectionally)
- Fields per user: `userId`, `username`, `displayName`, `profileImage`, `lastSeen`

---

### Start Conversation

**Type**: `start_conversation`

**Required Fields**:
- `recipientId`: Target user ID (string or number)

**Success Response**:
- Type: `conversation_started`
- Contains: `conversationId`, `recipient` object, `messages` array

**Blocked Response**:
- Type: `error`
- Message: "Cannot start conversation - blocking relationship exists"

---

### Send Private Message

**Type**: `send_private_message`

**Required Fields**:
- `recipientId`: Target user ID
- `content`: Message text (1-5000 characters)

**Optional Fields**:
- `replyToMessageId`: ID of message being replied to

**Success Response**:
- Type: `new_message`
- Contains: Full message object with `messageId`, `senderId`, `recipientId`, `content`, `createdAt`, `isEncrypted`, etc.

**Recipient Receives**:
- Type: `new_message`
- Same message object

**Blocked Response**:
- Type: `error`
- Message: "Cannot send message - blocking relationship exists"

---

### Load Private Messages

**Type**: `load_private_messages`

**Required Fields**:
- `recipientId`: Other user's ID
- `limit`: Number of messages (max 100)
- `offset`: Pagination offset

**Response**:
- Type: `message_history`
- Contains: Array of messages, `hasMore` boolean

---

### Edit Private Message

**Type**: `edit_private_message`

**Required Fields**:
- `messageId`: ID of message to edit
- `newContent`: New message text (1-5000 characters)

**Success Response**:
- Type: `message_edited`
- Both sender and recipient receive this

**Restrictions**:
- Can only edit own messages
- Cannot edit if deleted

---

### Delete Private Message

**Type**: `delete_private_message`

**Required Fields**:
- `messageId`: ID of message to delete

**Success Response**:
- Type: `message_deleted`
- Both sender and recipient receive this

**Restrictions**:
- Can only delete own messages

---

### Typing Indicator

**Type**: `typing`

**Required Fields**:
- `recipientId`: User being messaged
- `isTyping`: Boolean (true/false)

**Recipient Receives**:
- Type: `user_typing`
- Contains: `userId`, `isTyping`

---

## Group Chats

### Create Group

**Type**: `create_group`

**Required Fields**:
- `groupName`: Name of group (1-255 characters)
- `memberUserIds`: Array of user IDs to add

**Optional Fields**:
- `maxMembers`: Maximum members (default: 50)

**Restrictions**:
- Can only add users you follow
- Cannot add blocked users
- Max total members (including creator): 50 (or custom maxMembers)

**Success Response**:
- Type: `group_created`
- Contains: Full group object with `groupId`, `groupName`, `createdBy`, `members`, etc.

**Blocked User Response**:
- Type: `error`
- Message: Lists which users cannot be added due to blocking

---

### Send Group Message

**Type**: `send_group_message`

**Required Fields**:
- `groupId`: Target group ID
- `content`: Message text (1-5000 characters)

**Optional Fields**:
- `replyToMessageId`: ID of message being replied to

**Success Response**:
- Type: `new_group_message`
- All group members receive this
- Message includes parsed `mentions` array if @username or @everyone/@all used

**Restrictions**:
- Must be a member of the group

---

### Load Group Messages

**Type**: `get_group_messages`

**Required Fields**:
- `groupId`: Group ID
- `limit`: Number of messages (max 100)
- `offset`: Pagination offset

**Response**:
- Type: `group_message_history`
- Contains: Array of messages, `hasMore` boolean

---

### Get User's Groups

**Type**: `get_user_groups`

**Parameters**: None

**Response**:
- Type: `user_groups`
- Contains: Array of all groups user is a member of

---

### Get Group Members

**Type**: `get_group_members`

**Required Fields**:
- `groupId`: Group ID

**Response**:
- Type: `group_members`
- Contains: Array of member objects with roles (owner/admin/member)

---

### Get Group Info

**Type**: `get_group_info`

**Required Fields**:
- `groupId`: Group ID

**Response**:
- Type: `group_info`
- Contains: Full group details including name, created date, member count, max members

---

### Add Member to Group

**Type**: `add_group_member`

**Required Fields**:
- `groupId`: Group ID
- `userId`: User ID to add

**Success Response**:
- Type: `member_added`
- All group members receive this

**Restrictions**:
- Must be owner or admin
- Cannot add blocked users (bidirectionally)
- Cannot exceed max members

---

### Remove Member from Group

**Type**: `remove_group_member`

**Required Fields**:
- `groupId`: Group ID
- `userId`: User ID to remove

**Success Response**:
- Type: `member_removed`
- All group members receive this

**Restrictions**:
- Must be owner or admin
- Cannot remove owner
- Admins cannot remove other admins

---

### Leave Group

**Type**: `leave_group`

**Required Fields**:
- `groupId`: Group ID

**Success Response**:
- Type: `member_left`
- All remaining members receive this

**Special Cases**:
- If owner leaves, ownership transfers to oldest admin (or oldest member if no admins)
- If last member leaves, group is deleted

---

### Update Group Info

**Type**: `update_group_info`

**Required Fields**:
- `groupId`: Group ID

**Optional Fields** (at least one required):
- `groupName`: New group name
- `maxMembers`: New max member limit

**Success Response**:
- Type: `group_info_updated`
- All group members receive this

**Restrictions**:
- Must be owner or admin

---

### Edit Group Message

**Type**: `edit_group_message`

**Required Fields**:
- `messageId`: ID of message to edit
- `newContent`: New message text (1-5000 characters)

**Success Response**:
- Type: `group_message_edited`
- All group members receive this

**Restrictions**:
- Can only edit own messages
- Cannot edit if deleted

---

### Delete Group Message

**Type**: `delete_group_message`

**Required Fields**:
- `messageId`: ID of message to delete

**Success Response**:
- Type: `group_message_deleted`
- All group members receive this

**Restrictions**:
- Can only delete own messages

---

## Reactions

### Add Reaction (Group Message)

**Type**: `add_group_reaction`

**Required Fields**:
- `messageId`: Message ID
- `emoji`: Single emoji character

**Success Response**:
- Type: `reaction_added`
- All group members receive this
- Contains: `messageId`, `userId`, `emoji`, `timestamp`

**Restrictions**:
- Must be a group member
- One emoji per user per message
- Adding same emoji again has no effect

---

### Remove Reaction (Group Message)

**Type**: `remove_group_reaction`

**Required Fields**:
- `messageId`: Message ID
- `emoji`: Emoji to remove

**Success Response**:
- Type: `reaction_removed`
- All group members receive this

**Restrictions**:
- Can only remove own reactions

---

### Promote Member to Admin

**Type**: `promote_member`

**Required Fields**:
- `groupId`: Group ID
- `userId`: User ID to promote

**Success Response**:
- Type: `member_promoted`
- All group members receive this
- Contains: `groupId`, `userId`, `newRole`, `promotedBy`

**Restrictions**:
- Only group owner can promote
- Can only promote members (not admins or owner)
- Promoted user becomes admin with add/remove member permissions

---

### Demote Admin to Member

**Type**: `demote_member`

**Required Fields**:
- `groupId`: Group ID
- `userId`: User ID to demote

**Success Response**:
- Type: `member_demoted`
- All group members receive this
- Contains: `groupId`, `userId`, `newRole`, `demotedBy`

**Restrictions**:
- Only group owner can demote
- Can only demote admins (not members or owner)
- Demoted user loses admin permissions

---

### Delete Group

**Type**: `delete_group`

**Required Fields**:
- `groupId`: Group ID

**Optional Fields**:
- `permanent`: Boolean (default: false)

**Success Response**:
- Type: `group_deleted`
- All group members receive this
- Contains: `groupId`, `deletedBy`, `permanent`, `message`

**Restrictions**:
- Only group owner can delete
- `permanent: false` - Soft delete (30-day grace period, can restore)
- `permanent: true` - Hard delete (immediate, cannot undo)

**Important Notes**:
- Soft-deleted groups auto-deleted after 30 days
- Hard delete removes all messages permanently
- Owner cannot leave group, must delete it

---

## Mentions

### How Mentions Work

**Supported Formats**:
- `@username` - Mentions specific user
- `@everyone` or `@all` - Mentions all group members

**Automatic Detection**:
- Mentions are automatically parsed from message content
- Server returns `mentions` array with message
- No special formatting required in content

**Mention Object Structure**:
- `type`: "user" or "everyone"
- `userId`: Target user ID (for user mentions)
- `username`: Username that was mentioned

**Frontend Responsibilities**:
- Highlight mentioned users in UI
- Show notification badge for messages where user is mentioned
- Optionally send push notification for @mentions

---

## User Blocking

### Block Relationship Rules

**Bidirectional Blocking Effects**:
1. Cannot send/receive DMs
2. Cannot start new conversations
3. Blocked users hidden from online users list
4. Cannot add blocked users to groups
5. Cannot be added to groups by blocked users

**Database Table**: `blocked_relationships`
- Contains: `blocker_user_id`, `blocked_user_id`, `blocked_at`

**Frontend Actions Needed**:
- Check blocking before showing "Message" button
- Filter blocked users from contact lists
- Show appropriate error messages when blocked

**Note**: Blocking logic is handled server-side. Frontend receives error messages when actions are blocked.

---

## Follow Relationships

### Follow Relationship Rules

**Follow-Based Messaging** (NEW):
1. Can only send DMs to users you follow
2. Can only add users you follow to groups
3. Can only create groups with users you follow
4. Follow relationship is unidirectional (A follows B doesn't mean B follows A)

**Database Table**: `user_follows`
- Contains: `follower_id`, `followee_id`, `created_at`

**Priority Order**:
1. Authentication check (must be logged in)
2. Blocking check (bidirectional block)
3. **Following check** (sender must follow recipient)
4. Proceed with action

**Error Code**: `NOT_FOLLOWING`

**Error Message**: "You can only message users you follow" or "You can only add users you follow to groups"

**Frontend Actions Needed**:
- Only show "Message" button for users you follow
- Filter group member selection to users you follow
- Show "Follow to message" button for non-followed users
- Handle NOT_FOLLOWING error code

**Note**: Following is managed by your main application. Chat server reads from existing `user_follows` table.

---

## Rate Limiting

### Current Limits

**Message Rate Limit**:
- 30 messages per 60 seconds per user
- Applies to both DMs and group messages

**Response When Rate Limited**:
- Type: `error`
- Message: "Rate limit exceeded. Please slow down."

**Frontend Recommendations**:
- Show visual feedback when approaching limit
- Disable send button when rate limited
- Display countdown timer for when limit resets

---

## Error Handling

### Error Message Format

**Type**: `error`

**Contains**:
- `error`: Error message string

### Common Error Scenarios

1. **Authentication Errors**
   - Invalid token
   - Expired token
   - User not found
   - Missing token

2. **Permission Errors**
   - Not a group member
   - Insufficient role (not admin/owner)
   - Cannot edit/delete others' messages

3. **Blocking Errors**
   - Blocked user relationship exists
   - Cannot add blocked users to groups

4. **Validation Errors**
   - Message too long/short
   - Invalid user ID
   - Invalid group ID
   - Missing required fields

5. **Database Errors**
   - Connection timeout
   - Query failed
   - Record not found

### Recommended Error Display
- Show toast/snackbar notification
- Log errors to console for debugging
- Provide user-friendly error messages
- Retry logic for connection errors

---

## Message Encryption

### Encryption Status

**All Messages Are Encrypted**:
- Encryption: AES-256-CBC
- Automatic on server side
- Transparent to frontend

**Message Object Fields**:
- `isEncrypted`: Always `true`
- `content`: Server returns decrypted content
- Frontend displays content as-is

**Note**: Frontend does not need to handle encryption/decryption

---

## Real-Time Event Broadcasting

### Events You'll Receive

1. **User Status Changes**
   - `user_online`: When user comes online
   - `user_offline`: When user disconnects

2. **New Messages**
   - `new_message`: New DM received
   - `new_group_message`: New group message

3. **Message Updates**
   - `message_edited`: DM edited
   - `group_message_edited`: Group message edited
   - `message_deleted`: DM deleted
   - `group_message_deleted`: Group message deleted

4. **Typing Indicators**
   - `user_typing`: Someone is typing in DM

5. **Group Events**
   - `group_created`: New group created
   - `member_added`: Someone joined group
   - `member_removed`: Someone removed from group
   - `member_left`: Someone left group
   - `group_info_updated`: Group name/settings changed

6. **Reactions**
   - `reaction_added`: Someone reacted to message
   - `reaction_removed`: Someone removed their reaction

### Frontend State Management
- Update local message cache when receiving events
- Update group member lists
- Update online user lists
- Show real-time notifications

---

## Database Schema Reference

### Required Tables (Already Set Up)

1. **users_auth**: User authentication data
2. **user_profile_info**: User profile details
3. **private_messages**: All messages (DM and group)
4. **conversations**: DM conversation tracking
5. **blocked_relationships**: User blocking data
6. **group_chats**: Group metadata
7. **group_members**: Group membership and roles

**Note**: Server automatically initializes all tables on startup

---

## Connection Management

### Reconnection Strategy

**When Connection Drops**:
1. Attempt immediate reconnection
2. If fails, retry with exponential backoff
3. Max retry interval: 30 seconds
4. Re-authenticate on successful reconnection
5. Reload recent messages to catch up

### Heartbeat/Ping

**Server Sends**: Automatic WebSocket pings
**Client Should**: Respond to pings (handled by WebSocket client)
**Timeout**: 30 seconds of inactivity triggers disconnect

---

## Message Object Structure

### Private Message Object

**Fields**:
- `messageId`: Unique message ID
- `conversationId`: Conversation ID
- `senderId`: Sender user ID
- `senderUsername`: Sender username
- `recipientId`: Recipient user ID
- `content`: Message text (decrypted)
- `isEncrypted`: true
- `createdAt`: ISO timestamp
- `editedAt`: ISO timestamp (if edited)
- `isEdited`: Boolean
- `isDeleted`: Boolean
- `replyToMessageId`: Parent message ID (if reply)

### Group Message Object

**Additional Fields**:
- `groupId`: Group ID
- `isGroupMessage`: true
- `mentions`: Array of mention objects
- `reactions`: Array of reaction objects

### Reaction Object

**Fields**:
- `userId`: User who reacted
- `username`: Username
- `emoji`: Emoji character
- `timestamp`: ISO timestamp

### Mention Object

**Fields**:
- `type`: "user" or "everyone"
- `userId`: Target user ID (for user mentions)
- `username`: Username mentioned

---

## Best Practices

### Performance Optimization

1. **Message Pagination**
   - Load 50 messages initially
   - Use offset for infinite scroll
   - Cache loaded messages locally

2. **Online User Updates**
   - Refresh every 30-60 seconds
   - Update on visibility change
   - Cache user presence data

3. **Group Data**
   - Cache group member lists
   - Only reload on member_added/removed events
   - Lazy load group messages

### Security Considerations

1. **Token Management**
   - Store JWT securely (httpOnly cookies recommended)
   - Refresh token before expiry
   - Clear token on logout
   - Never expose JWT in URL/logs

2. **Input Validation**
   - Sanitize message content on frontend
   - Validate user inputs before sending
   - Check message length limits
   - Prevent XSS attacks in displayed content

3. **User Privacy**
   - Respect blocking relationships
   - Don't show typing indicators to blocked users
   - Filter sensitive user data

### User Experience

1. **Loading States**
   - Show skeleton screens while loading
   - Display "Sending..." state for messages
   - Indicate when connection is lost

2. **Optimistic Updates**
   - Show sent messages immediately
   - Add temporary ID until server confirms
   - Roll back if send fails

3. **Notifications**
   - Desktop notifications for new messages
   - Badge counts for unread messages
   - Sound alerts (user-configurable)
   - Special highlight for @mentions

4. **Accessibility**
   - Keyboard navigation support
   - Screen reader compatibility
   - High contrast mode support
   - Focus management

---

## Testing Checklist

### Authentication
- [ ] Connect with valid token
- [ ] Handle invalid token error
- [ ] Handle expired token error
- [ ] Reconnection after disconnect

### Private Messaging
- [ ] Send and receive DMs
- [ ] Load message history
- [ ] Edit own messages
- [ ] Delete own messages
- [ ] Reply to messages
- [ ] Typing indicators
- [ ] Block user prevents messaging

### Group Chats
- [ ] Create group
- [ ] Send group messages
- [ ] Load group history
- [ ] Add/remove members
- [ ] Leave group
- [ ] Update group info
- [ ] Edit/delete group messages
- [ ] @mentions work correctly
- [ ] @everyone/@all mentions work
- [ ] Reactions add/remove
- [ ] Cannot add blocked users

### Edge Cases
- [ ] Rate limiting triggers
- [ ] Connection drops and reconnects
- [ ] Multiple tabs/windows
- [ ] Large message handling
- [ ] Empty group handling
- [ ] Last member leaves group
- [ ] Owner leaves group (transfer)

---

## Support & Troubleshooting

### Common Issues

**Connection Timeout**
- Check server is running
- Verify WebSocket URL is correct
- Check firewall/proxy settings
- Ensure JWT token is valid

**Messages Not Sending**
- Check rate limiting
- Verify user is authenticated
- Check blocking relationships
- Verify group membership

**Authentication Fails**
- Token expired - refresh token
- User not in database - check user creation
- Database connection error - check server logs
- JWT secret mismatch - verify environment variables

### Server Logs

**Enable Debug Mode**: Set `DEBUG=true` in environment variables

**Log Locations**:
- Server startup: Console
- WebSocket connections: Console
- Database queries: Console (if debug enabled)
- Errors: Console + error logs

---

## Production Deployment

### Environment Variables Required

- `JWT_SECRET`: Secret for JWT verification
- `DATABASE_URL` or individual DB credentials
- `REDIS_URL` or `REDIS_HOST`/`REDIS_PORT`
- `PORT`: Server port (default 3001)
- `NODE_ENV`: Set to "production"

### Scaling Considerations

1. **Redis Required for Multiple Instances**
   - Enables cross-instance messaging
   - Shared session store
   - Rate limiting coordination

2. **Database Connection Pooling**
   - Max connections: 200 per instance
   - Min connections: 10
   - Adjust based on load

3. **WebSocket Sticky Sessions**
   - Enable sticky sessions in load balancer
   - Route same user to same server instance
   - Fallback to Redis pub/sub for cross-instance

### Monitoring Recommendations

1. **Metrics to Track**
   - Active WebSocket connections
   - Messages per second
   - Database query latency
   - Redis latency
   - Error rates
   - Memory usage

2. **Alerts to Set Up**
   - Connection failures
   - Database timeout errors
   - High error rates
   - Memory/CPU thresholds exceeded

---

## API Quick Reference

### Authentication
- `authenticate` → `auth_success` or `auth_error`

### Private Messages
- `get_online_users` → `online_users`
- `start_conversation` → `conversation_started`
- `send_private_message` → `new_message`
- `load_private_messages` → `message_history`
- `edit_private_message` → `message_edited`
- `delete_private_message` → `message_deleted`
- `typing` → `user_typing`

### Group Chats
- `create_group` → `group_created`
- `send_group_message` → `new_group_message`
- `get_group_messages` → `group_message_history`
- `get_user_groups` → `user_groups`
- `get_group_members` → `group_members`
- `get_group_info` → `group_info`
- `add_group_member` → `member_added`
- `remove_group_member` → `member_removed`
- `leave_group` → `member_left`
- `update_group_info` → `group_info_updated`
- `edit_group_message` → `group_message_edited`
- `delete_group_message` → `group_message_deleted`
- `delete_group` → `group_deleted` (NEW)
- `promote_member` → `member_promoted` (NEW)
- `demote_member` → `member_demoted` (NEW)

### Reactions
- `add_group_reaction` → `reaction_added`
- `remove_group_reaction` → `reaction_removed`

---

## Version Information

- **Server Version**: 1.0.0
- **WebSocket Protocol**: ws/wss
- **Supported Clients**: Browser WebSocket API, Socket.io-client not required
- **Minimum Node.js**: 14.x

---

## Questions or Issues?

Refer to the following documentation:
- `README.md` - General server overview
- `GROUP_CHAT_COMPLETE.md` - Detailed group chat documentation
- `REACTIONS_AND_MENTIONS.md` - Reactions and mentions details
- `REQUIRED_TABLES.md` - Database schema details

For backend setup:
- `TESTING_SETUP_GUIDE.md` - Test environment setup
- `FINAL_TEST_INSTRUCTIONS.md` - Running comprehensive tests

