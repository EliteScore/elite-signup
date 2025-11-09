-- Community extension tables
-- These tables support EliteScore community sync and progression events

-- Table: Community metadata
CREATE TABLE IF NOT EXISTS communities (
    id SERIAL PRIMARY KEY,
    community_id VARCHAR(255) NOT NULL UNIQUE,
    external_ref VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    avatar_url TEXT,
    default_group_id VARCHAR(255),
    created_by_user_id VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_communities_external_ref ON communities(external_ref);
CREATE INDEX IF NOT EXISTS idx_communities_is_active ON communities(is_active);

CREATE TRIGGER IF NOT EXISTS update_communities_updated_at
    BEFORE UPDATE ON communities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Table: Community membership
CREATE TABLE IF NOT EXISTS community_members (
    id SERIAL PRIMARY KEY,
    community_id VARCHAR(255) NOT NULL REFERENCES communities(community_id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_muted BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::JSONB,
    UNIQUE(community_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_members_user ON community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_role ON community_members(role);

-- Table: User progression snapshot per community
CREATE TABLE IF NOT EXISTS user_community_progress (
    id SERIAL PRIMARY KEY,
    community_id VARCHAR(255) NOT NULL REFERENCES communities(community_id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    total_xp INTEGER DEFAULT 0,
    daily_streak INTEGER DEFAULT 0,
    weekly_streak INTEGER DEFAULT 0,
    last_challenge_id VARCHAR(255),
    last_challenge_type VARCHAR(100),
    last_completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(community_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_community_progress_user ON user_community_progress(user_id);

CREATE TRIGGER IF NOT EXISTS update_user_community_progress_updated_at
    BEFORE UPDATE ON user_community_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Table: Challenge event log for auditing and replay
CREATE TABLE IF NOT EXISTS community_challenge_events (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(255) NOT NULL UNIQUE,
    community_id VARCHAR(255) NOT NULL REFERENCES communities(community_id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    challenge_id VARCHAR(255),
    challenge_type VARCHAR(100),
    xp_awarded INTEGER DEFAULT 0,
    payload JSONB,
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ingested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_challenge_events_community ON community_challenge_events(community_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenge_events_user ON community_challenge_events(user_id, occurred_at DESC);

-- Optimize planner statistics
ANALYZE communities;
ANALYZE community_members;
ANALYZE user_community_progress;
ANALYZE community_challenge_events;

