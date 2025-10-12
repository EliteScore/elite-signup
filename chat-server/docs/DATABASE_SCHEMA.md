# Database Schema

**PostgreSQL tables for the chat server.**

---

## Overview

The chat server uses **12 PostgreSQL tables** that are **auto-created on server startup**.

All tables are shared with your main Java backend application.

---

## Tables Summary

1. `users_auth` - User authentication
2. `user_profile_info` - User profiles
3. `jwt_revocation` - Token revocation
4. `private_messages` - All messages (DM + group)
5. `conversations` - DM metadata
6. `user_status` - Online/offline status
7. `message_reactions` - Reactions
8. `message_deletions` - Per-user deletions
9. `blocked_relationships` - User blocking
10. `user_follows` - Follow relationships
11. `group_chats` - Group metadata
12. `group_members` - Group membership

---

## Auto-Initialization

**The server creates all tables automatically!**

On startup, the server checks if tables exist and creates missing ones.

**No manual setup required** in most cases.

---

## Manual Setup (Optional)

If you need to create tables manually:

```bash
# Private messaging tables
psql -U your_user -d your_database -f docs/private_messaging_tables.sql

# Group chat tables
psql -U your_user -d your_database -f docs/group_chat_tables.sql
```

---

## Table Details

### users_auth
User authentication data (managed by main backend).

```sql
CREATE TABLE users_auth (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### user_profile_info
User profile information (managed by main backend).

```sql
CREATE TABLE user_profile_info (
  user_id INTEGER PRIMARY KEY REFERENCES users_auth(user_id),
  display_name VARCHAR(100),
  profile_image VARCHAR(500),
  bio TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### jwt_revocation
Revoked JWT tokens (shared between services).

```sql
CREATE TABLE jwt_revocation (
  jti VARCHAR(255) PRIMARY KEY,
  user_id INTEGER REFERENCES users_auth(user_id),
  revoked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Usage:** Chat server checks this table to verify token validity.

---

### private_messages
All messages - both direct and group messages.

```sql
CREATE TABLE private_messages (
  message_id SERIAL PRIMARY KEY,
  conversation_id VARCHAR(255),
  group_id VARCHAR(255),
  sender_id INTEGER REFERENCES users_auth(user_id),
  recipient_id INTEGER REFERENCES users_auth(user_id),
  content TEXT NOT NULL,
  is_encrypted BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  edited_at TIMESTAMP,
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP,
  reply_to_message_id INTEGER,
  is_group_message BOOLEAN DEFAULT false
);

CREATE INDEX idx_conversation_messages ON private_messages(conversation_id, created_at DESC);
CREATE INDEX idx_group_messages ON private_messages(group_id, created_at DESC);
CREATE INDEX idx_sender_messages ON private_messages(sender_id);
```

---

### conversations
Direct message conversation metadata.

```sql
CREATE TABLE conversations (
  conversation_id VARCHAR(255) PRIMARY KEY,
  user1_id INTEGER REFERENCES users_auth(user_id),
  user2_id INTEGER REFERENCES users_auth(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_message_at TIMESTAMP,
  deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_user_conversations ON conversations(user1_id, user2_id);
```

---

### user_status
User online/offline status.

```sql
CREATE TABLE user_status (
  user_id INTEGER PRIMARY KEY REFERENCES users_auth(user_id),
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status_message VARCHAR(255)
);
```

---

### message_reactions
Emoji reactions on group messages.

```sql
CREATE TABLE message_reactions (
  reaction_id SERIAL PRIMARY KEY,
  message_id INTEGER REFERENCES private_messages(message_id),
  user_id INTEGER REFERENCES users_auth(user_id),
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX idx_message_reactions ON message_reactions(message_id);
```

---

### message_deletions
Per-user message deletions.

```sql
CREATE TABLE message_deletions (
  message_id INTEGER REFERENCES private_messages(message_id),
  user_id INTEGER REFERENCES users_auth(user_id),
  deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (message_id, user_id)
);
```

---

### blocked_relationships
User blocking relationships.

```sql
CREATE TABLE blocked_relationships (
  blocker_user_id INTEGER REFERENCES users_auth(user_id),
  blocked_user_id INTEGER REFERENCES users_auth(user_id),
  blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (blocker_user_id, blocked_user_id)
);

CREATE INDEX idx_blocked_relationships ON blocked_relationships(blocker_user_id, blocked_user_id);
```

**Note:** Blocking is bidirectional - if A blocks B, neither can message each other.

---

### user_follows
Follow relationships (unidirectional).

```sql
CREATE TABLE user_follows (
  follower_id INTEGER REFERENCES users_auth(user_id),
  followee_id INTEGER REFERENCES users_auth(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_id, followee_id)
);

CREATE INDEX idx_user_follows ON user_follows(follower_id, followee_id);
```

**Note:** Following is unidirectional - A follows B doesn't mean B follows A.

---

### group_chats
Group chat metadata.

```sql
CREATE TABLE group_chats (
  group_id VARCHAR(255) PRIMARY KEY,
  group_name VARCHAR(255) NOT NULL,
  created_by INTEGER REFERENCES users_auth(user_id),
  max_members INTEGER DEFAULT 50,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP,
  deleted_by INTEGER REFERENCES users_auth(user_id)
);

CREATE INDEX idx_group_creator ON group_chats(created_by);
```

---

### group_members
Group membership and roles.

```sql
CREATE TABLE group_members (
  group_id VARCHAR(255) REFERENCES group_chats(group_id),
  user_id INTEGER REFERENCES users_auth(user_id),
  role VARCHAR(20) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (group_id, user_id)
);

CREATE INDEX idx_user_groups ON group_members(user_id);
CREATE INDEX idx_group_members_list ON group_members(group_id);
```

**Roles:**
- `owner` - Full control
- `admin` - Can add/remove members, update settings
- `member` - Can send messages, leave group

---

## Indexes

All critical queries are indexed for performance:

- Message lookups by conversation/group
- User relationships (blocking, following)
- Group membership lookups
- Reaction lookups by message

**Query Performance:** 2-5ms average

---

## Data Relationships

```
users_auth
  ├── user_profile_info (1:1)
  ├── jwt_revocation (1:many)
  ├── user_status (1:1)
  ├── private_messages (sender) (1:many)
  ├── conversations (user1/user2) (1:many)
  ├── blocked_relationships (blocker) (1:many)
  ├── user_follows (follower/followee) (1:many)
  ├── group_chats (created_by) (1:many)
  └── group_members (user_id) (1:many)

group_chats
  ├── group_members (many)
  └── private_messages (group messages) (many)

private_messages
  ├── message_reactions (many)
  └── message_deletions (many)
```

---

## Database Configuration

**Environment Variables:**

```env
# Individual settings
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database
DB_USER=your_user
DB_PASS=your_password

# Or single URL
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Connection pool
DB_MAX_CONNECTIONS=200
DB_MIN_CONNECTIONS=10
```

---

## Backup & Maintenance

### Backup

```bash
# Backup all tables
pg_dump -U your_user your_database > backup.sql

# Backup specific table
pg_dump -U your_user -t private_messages your_database > messages_backup.sql
```

### Cleanup Old Data

```bash
# Delete messages older than 1 year
DELETE FROM private_messages 
WHERE created_at < NOW() - INTERVAL '1 year' 
AND is_deleted = true;

# Delete revoked tokens older than 30 days
DELETE FROM jwt_revocation 
WHERE revoked_at < NOW() - INTERVAL '30 days';
```

### Vacuum

```bash
# Optimize tables
VACUUM ANALYZE private_messages;
VACUUM ANALYZE group_chats;
```

---

## Complete SQL Files

Full table creation scripts are available:

- `docs/private_messaging_tables.sql` - DM tables
- `docs/group_chat_tables.sql` - Group tables

---

**Tables are auto-created on server startup!** 🚀

