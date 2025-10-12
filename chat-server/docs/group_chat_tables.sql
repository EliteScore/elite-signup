-- Group Chat Tables (Minimal Implementation)
-- This adds group chat functionality with minimal new tables

-- Table 1: Group metadata
CREATE TABLE IF NOT EXISTS group_chats (
    id SERIAL PRIMARY KEY,
    group_id VARCHAR(255) NOT NULL UNIQUE,
    group_name VARCHAR(255) NOT NULL,
    group_description TEXT,
    created_by_user_id VARCHAR(255) NOT NULL,
    max_members INTEGER DEFAULT 50,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2: Group membership (many-to-many relationship)
CREATE TABLE IF NOT EXISTS group_members (
    id SERIAL PRIMARY KEY,
    group_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'member',  -- 'owner', 'admin', 'member'
    can_send_messages BOOLEAN DEFAULT TRUE,
    can_add_members BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by_user_id VARCHAR(255),
    UNIQUE(group_id, user_id)
);

-- Modify existing private_messages table to support group messages
-- This allows us to reuse the existing message infrastructure
ALTER TABLE private_messages 
ADD COLUMN IF NOT EXISTS is_group_message BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_announcement BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS pinned_by_user_id VARCHAR(255);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_group_chats_created_by ON group_chats(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_group_chats_is_active ON group_chats(is_active);

CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_role ON group_members(role);
CREATE INDEX IF NOT EXISTS idx_group_members_both ON group_members(group_id, user_id);

CREATE INDEX IF NOT EXISTS idx_messages_is_group ON private_messages(is_group_message);
CREATE INDEX IF NOT EXISTS idx_messages_group_recipient ON private_messages(recipient_id, is_group_message, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_pinned ON private_messages(is_pinned);
CREATE INDEX IF NOT EXISTS idx_messages_is_announcement ON private_messages(is_announcement);
CREATE INDEX IF NOT EXISTS idx_messages_pinned_group ON private_messages(recipient_id, is_pinned, is_group_message) WHERE is_pinned = true;

-- Add trigger for updated_at on group_chats
CREATE TRIGGER IF NOT EXISTS update_group_chats_updated_at 
    BEFORE UPDATE ON group_chats 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Note: private_messages table structure for group messages:
-- - message_id: Unique message ID
-- - conversation_id: NOT USED for group messages
-- - sender_id: User who sent the message
-- - recipient_id: group_id (e.g., 'group_abc123')
-- - is_group_message: TRUE
-- - content: Message content
-- - is_read: NOT USED for group messages (we skip read receipts for groups)

-- Analyze tables for query optimization
ANALYZE group_chats;
ANALYZE group_members;

