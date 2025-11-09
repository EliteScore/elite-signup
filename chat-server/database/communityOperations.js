const { dbPool } = require('../config/database');

/**
 * Upsert a community from EliteScore dashboard metadata.
 * @param {Object} community
 * @param {string} community.communityId - Stable community identifier.
 * @param {string} [community.externalRef] - Optional upstream reference (e.g. leaderboard id).
 * @param {string} community.name - Display name.
 * @param {string} [community.description] - Description for UI surfaces.
 * @param {string} [community.avatarUrl] - Optional avatar URL.
 * @param {string} [community.defaultGroupId] - Chat group id mapped to this community.
 * @param {string} [community.createdByUserId] - Creator identifier.
 * @param {boolean} [community.isActive=true] - Community active flag.
 * @returns {Promise<Object>} - Persisted community row.
 */
async function upsertCommunity(community) {
  const {
    communityId,
    externalRef = null,
    name,
    description = null,
    avatarUrl = null,
    defaultGroupId = null,
    createdByUserId = null,
    isActive = true
  } = community;

  if (!communityId || !name) {
    throw new Error('communityId and name are required to upsert a community');
  }

  const result = await dbPool.query(
    `
      INSERT INTO communities (
        community_id,
        external_ref,
        name,
        description,
        avatar_url,
        default_group_id,
        created_by_user_id,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (community_id) DO UPDATE SET
        external_ref = EXCLUDED.external_ref,
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        avatar_url = EXCLUDED.avatar_url,
        default_group_id = EXCLUDED.default_group_id,
        created_by_user_id = COALESCE(EXCLUDED.created_by_user_id, communities.created_by_user_id),
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
      RETURNING
        community_id as "communityId",
        external_ref as "externalRef",
        name,
        description,
        avatar_url as "avatarUrl",
        default_group_id as "defaultGroupId",
        created_by_user_id as "createdByUserId",
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `,
    [
      communityId,
      externalRef,
      name,
      description,
      avatarUrl,
      defaultGroupId,
      createdByUserId,
      isActive
    ]
  );

  return result.rows[0];
}

/**
 * Ensure a user is registered as a community member.
 * @param {string} communityId
 * @param {string} userId
 * @param {Object} [options]
 * @param {string} [options.role='member']
 * @param {boolean} [options.isMuted=false]
 * @param {Date|string} [options.joinedAt]
 * @param {Date|string} [options.lastSeenAt]
 * @param {Object} [options.metadata={}]
 * @returns {Promise<Object>}
 */
async function ensureCommunityMembership(communityId, userId, options = {}) {
  if (!communityId || !userId) {
    throw new Error('communityId and userId are required for membership');
  }

  const {
    role = 'member',
    isMuted = false,
    joinedAt = null,
    lastSeenAt = null,
    metadata = {}
  } = options;

  const result = await dbPool.query(
    `
      INSERT INTO community_members (
        community_id,
        user_id,
        role,
        joined_at,
        last_seen_at,
        is_muted,
        metadata
      )
      VALUES ($1, $2, $3, COALESCE($4, NOW()), COALESCE($5, NOW()), $6, $7::jsonb)
      ON CONFLICT (community_id, user_id) DO UPDATE SET
        role = EXCLUDED.role,
        last_seen_at = COALESCE(EXCLUDED.last_seen_at, community_members.last_seen_at),
        is_muted = EXCLUDED.is_muted,
        metadata = COALESCE(community_members.metadata, '{}'::jsonb) || EXCLUDED.metadata
      RETURNING
        community_id as "communityId",
        user_id as "userId",
        role,
        joined_at as "joinedAt",
        last_seen_at as "lastSeenAt",
        is_muted as "isMuted",
        metadata
    `,
    [
      communityId,
      userId,
      role,
      joinedAt,
      lastSeenAt,
      isMuted,
      JSON.stringify(metadata || {})
    ]
  );

  return result.rows[0];
}

/**
 * Remove member from community.
 * @param {string} communityId
 * @param {string} userId
 */
async function removeCommunityMembership(communityId, userId) {
  await dbPool.query(
    `
      DELETE FROM community_members
      WHERE community_id = $1 AND user_id = $2
    `,
    [communityId, userId]
  );
}

/**
 * Get a community row by id.
 * @param {string} communityId
 * @returns {Promise<Object|null>}
 */
async function getCommunityById(communityId) {
  const result = await dbPool.query(
    `
      SELECT
        community_id as "communityId",
        external_ref as "externalRef",
        name,
        description,
        avatar_url as "avatarUrl",
        default_group_id as "defaultGroupId",
        created_by_user_id as "createdByUserId",
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM communities
      WHERE community_id = $1
    `,
    [communityId]
  );

  return result.rows[0] || null;
}

/**
 * List all communities for a given user.
 * @param {string} userId
 * @returns {Promise<Array>}
 */
async function getCommunitiesForUser(userId) {
  const result = await dbPool.query(
    `
      SELECT
        cm.community_id as "communityId",
        cm.role,
        cm.joined_at as "joinedAt",
        cm.last_seen_at as "lastSeenAt",
        cm.is_muted as "isMuted",
        cm.metadata,
        c.name,
        c.description,
        c.avatar_url as "avatarUrl",
        c.default_group_id as "defaultGroupId",
        c.is_active as "isActive"
      FROM community_members cm
      JOIN communities c ON cm.community_id = c.community_id
      WHERE cm.user_id = $1
        AND c.is_active = TRUE
      ORDER BY cm.joined_at ASC
    `,
    [userId]
  );

  return result.rows;
}

/**
 * Get members for a community.
 * @param {string} communityId
 * @returns {Promise<Array>}
 */
async function getCommunityMembers(communityId) {
  const result = await dbPool.query(
    `
      SELECT
        user_id as "userId",
        role,
        joined_at as "joinedAt",
        last_seen_at as "lastSeenAt",
        is_muted as "isMuted",
        metadata
      FROM community_members
      WHERE community_id = $1
      ORDER BY joined_at ASC
    `,
    [communityId]
  );

  return result.rows;
}

/**
 * Upsert user progress snapshot for a community.
 * @param {Object} snapshot
 * @param {string} snapshot.communityId
 * @param {string} snapshot.userId
 * @param {number} [snapshot.totalXp=0]
 * @param {number} [snapshot.dailyStreak=0]
 * @param {number} [snapshot.weeklyStreak=0]
 * @param {string} [snapshot.lastChallengeId]
 * @param {string} [snapshot.lastChallengeType]
 * @param {Date|string} [snapshot.lastCompletedAt]
 * @returns {Promise<Object>}
 */
async function upsertUserCommunityProgress(snapshot) {
  const {
    communityId,
    userId,
    totalXp = 0,
    dailyStreak = 0,
    weeklyStreak = 0,
    lastChallengeId = null,
    lastChallengeType = null,
    lastCompletedAt = null
  } = snapshot;

  if (!communityId || !userId) {
    throw new Error('communityId and userId are required for progress snapshots');
  }

  const result = await dbPool.query(
    `
      INSERT INTO user_community_progress (
        community_id,
        user_id,
        total_xp,
        daily_streak,
        weekly_streak,
        last_challenge_id,
        last_challenge_type,
        last_completed_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (community_id, user_id) DO UPDATE SET
        total_xp = EXCLUDED.total_xp,
        daily_streak = EXCLUDED.daily_streak,
        weekly_streak = EXCLUDED.weekly_streak,
        last_challenge_id = EXCLUDED.last_challenge_id,
        last_challenge_type = EXCLUDED.last_challenge_type,
        last_completed_at = EXCLUDED.last_completed_at,
        updated_at = NOW()
      RETURNING
        community_id as "communityId",
        user_id as "userId",
        total_xp as "totalXp",
        daily_streak as "dailyStreak",
        weekly_streak as "weeklyStreak",
        last_challenge_id as "lastChallengeId",
        last_challenge_type as "lastChallengeType",
        last_completed_at as "lastCompletedAt",
        updated_at as "updatedAt"
    `,
    [
      communityId,
      userId,
      totalXp,
      dailyStreak,
      weeklyStreak,
      lastChallengeId,
      lastChallengeType,
      lastCompletedAt
    ]
  );

  return result.rows[0];
}

/**
 * Record a challenge event and optionally update the progress snapshot atomically.
 * @param {Object} event
 * @param {string} event.eventId
 * @param {string} event.communityId
 * @param {string} event.userId
 * @param {string} [event.challengeId]
 * @param {string} [event.challengeType]
 * @param {number} [event.xpAwarded=0]
 * @param {Object} [event.payload]
 * @param {Date|string} [event.occurredAt=new Date()]
 * @param {Object} [progressSnapshot] - Optional updated snapshot to persist.
 * @returns {Promise<{event:Object, progress:Object|null}>}
 */
async function recordChallengeEvent(event, progressSnapshot = null) {
  const {
    eventId,
    communityId,
    userId,
    challengeId = null,
    challengeType = null,
    xpAwarded = 0,
    payload = null,
    occurredAt = new Date()
  } = event;

  if (!eventId || !communityId || !userId) {
    throw new Error('eventId, communityId, and userId are required for challenge events');
  }

  const client = await dbPool.connect();

  try {
    await client.query('BEGIN');

    const eventResult = await client.query(
      `
        INSERT INTO community_challenge_events (
          event_id,
          community_id,
          user_id,
          challenge_id,
          challenge_type,
          xp_awarded,
          payload,
          occurred_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
        ON CONFLICT (event_id) DO NOTHING
        RETURNING
          event_id as "eventId",
          community_id as "communityId",
          user_id as "userId",
          challenge_id as "challengeId",
          challenge_type as "challengeType",
          xp_awarded as "xpAwarded",
          payload,
          occurred_at as "occurredAt",
          ingested_at as "ingestedAt"
      `,
      [
        eventId,
        communityId,
        userId,
        challengeId,
        challengeType,
        xpAwarded,
        payload ? JSON.stringify(payload) : null,
        occurredAt
      ]
    );

    let progressResult = null;
    if (progressSnapshot) {
      progressResult = await client.query(
        `
          INSERT INTO user_community_progress (
            community_id,
            user_id,
            total_xp,
            daily_streak,
            weekly_streak,
            last_challenge_id,
            last_challenge_type,
            last_completed_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (community_id, user_id) DO UPDATE SET
            total_xp = EXCLUDED.total_xp,
            daily_streak = EXCLUDED.daily_streak,
            weekly_streak = EXCLUDED.weekly_streak,
            last_challenge_id = EXCLUDED.last_challenge_id,
            last_challenge_type = EXCLUDED.last_challenge_type,
            last_completed_at = EXCLUDED.last_completed_at,
            updated_at = NOW()
          RETURNING
            community_id as "communityId",
            user_id as "userId",
            total_xp as "totalXp",
            daily_streak as "dailyStreak",
            weekly_streak as "weeklyStreak",
            last_challenge_id as "lastChallengeId",
            last_challenge_type as "lastChallengeType",
            last_completed_at as "lastCompletedAt",
            updated_at as "updatedAt"
        `,
        [
          communityId,
          userId,
          progressSnapshot.totalXp || 0,
          progressSnapshot.dailyStreak || 0,
          progressSnapshot.weeklyStreak || 0,
          progressSnapshot.lastChallengeId || null,
          progressSnapshot.lastChallengeType || null,
          progressSnapshot.lastCompletedAt || occurredAt
        ]
      );
    }

    await client.query('COMMIT');

    return {
      event: eventResult.rows[0] || null,
      progress: progressResult ? progressResult.rows[0] : null
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Fetch the latest user progress for a community.
 * @param {string} communityId
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
async function getUserCommunityProgress(communityId, userId) {
  const result = await dbPool.query(
    `
      SELECT
        community_id as "communityId",
        user_id as "userId",
        total_xp as "totalXp",
        daily_streak as "dailyStreak",
        weekly_streak as "weeklyStreak",
        last_challenge_id as "lastChallengeId",
        last_challenge_type as "lastChallengeType",
        last_completed_at as "lastCompletedAt",
        updated_at as "updatedAt"
      FROM user_community_progress
      WHERE community_id = $1 AND user_id = $2
    `,
    [communityId, userId]
  );

  return result.rows[0] || null;
}

module.exports = {
  upsertCommunity,
  ensureCommunityMembership,
  removeCommunityMembership,
  getCommunityById,
  getCommunitiesForUser,
  getCommunityMembers,
  upsertUserCommunityProgress,
  getUserCommunityProgress,
  recordChallengeEvent
};

