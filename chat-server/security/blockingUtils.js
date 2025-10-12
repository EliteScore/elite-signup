// Blocking utilities for checking user blocks
const { dbPool } = require('../config/database');

/**
 * Check if user1 has blocked user2 OR if user2 has blocked user1
 * @param {string|number} userId1 - First user ID
 * @param {string|number} userId2 - Second user ID
 * @returns {Promise<{isBlocked: boolean, blockerUserId: string|null, reason: string|null}>}
 */
async function checkIfBlocked(userId1, userId2) {
  try {
    // Convert user IDs to numbers if they're strings (the DB uses bigint)
    const user1Id = typeof userId1 === 'string' ? parseInt(userId1, 10) : userId1;
    const user2Id = typeof userId2 === 'string' ? parseInt(userId2, 10) : userId2;

    // Check if either user has blocked the other
    const result = await dbPool.query(`
      SELECT blocker_id, blocked_id 
      FROM blocked_relationships 
      WHERE (blocker_id = $1 AND blocked_id = $2)
         OR (blocker_id = $2 AND blocked_id = $1)
      LIMIT 1
    `, [user1Id, user2Id]);

    if (result.rows.length > 0) {
      const block = result.rows[0];
      return {
        isBlocked: true,
        blockerUserId: block.blocker_id.toString(),
        blockedUserId: block.blocked_id.toString(),
        reason: 'User is blocked'
      };
    }

    return {
      isBlocked: false,
      blockerUserId: null,
      blockedUserId: null,
      reason: null
    };
  } catch (error) {
    console.error('Error checking if users are blocked:', error);
    // On error, default to not blocked (fail open to not break functionality)
    return {
      isBlocked: false,
      blockerUserId: null,
      blockedUserId: null,
      reason: null
    };
  }
}

/**
 * Check if userId1 has blocked userId2 (one-way check)
 * @param {string|number} blockerUserId - User who may have blocked
 * @param {string|number} blockedUserId - User who may be blocked
 * @returns {Promise<boolean>}
 */
async function hasUserBlocked(blockerUserId, blockedUserId) {
  try {
    const blockerId = typeof blockerUserId === 'string' ? parseInt(blockerUserId, 10) : blockerUserId;
    const blockedId = typeof blockedUserId === 'string' ? parseInt(blockedUserId, 10) : blockedUserId;

    const result = await dbPool.query(`
      SELECT 1 
      FROM blocked_relationships 
      WHERE blocker_id = $1 AND blocked_id = $2
      LIMIT 1
    `, [blockerId, blockedId]);

    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking if user has blocked:', error);
    return false;
  }
}

/**
 * Get list of all users blocked by a specific user
 * @param {string|number} userId - User ID
 * @returns {Promise<Array<string>>}
 */
async function getBlockedUsers(userId) {
  try {
    const id = typeof userId === 'string' ? parseInt(userId, 10) : userId;

    const result = await dbPool.query(`
      SELECT blocked_id 
      FROM blocked_relationships 
      WHERE blocker_id = $1
    `, [id]);

    return result.rows.map(row => row.blocked_id.toString());
  } catch (error) {
    console.error('Error getting blocked users:', error);
    return [];
  }
}

/**
 * Get list of all users who have blocked a specific user
 * @param {string|number} userId - User ID
 * @returns {Promise<Array<string>>}
 */
async function getUsersWhoBlockedMe(userId) {
  try {
    const id = typeof userId === 'string' ? parseInt(userId, 10) : userId;

    const result = await dbPool.query(`
      SELECT blocker_id 
      FROM blocked_relationships 
      WHERE blocked_id = $1
    `, [id]);

    return result.rows.map(row => row.blocker_id.toString());
  } catch (error) {
    console.error('Error getting users who blocked me:', error);
    return [];
  }
}

module.exports = {
  checkIfBlocked,
  hasUserBlocked,
  getBlockedUsers,
  getUsersWhoBlockedMe
};

