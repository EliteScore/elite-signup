const { dbPool } = require('../config/database');

/**
 * Check if userA follows userB
 * @param {string|number} followerUserId - The user who might be following
 * @param {string|number} followeeUserId - The user who might be followed
 * @returns {Promise<boolean>} - True if followerUserId follows followeeUserId
 */
async function checkIfFollowing(followerUserId, followeeUserId) {
  try {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM user_follows 
        WHERE follower_id = $1 AND followee_id = $2
      ) as is_following;
    `;
    
    const result = await dbPool.query(query, [followerUserId, followeeUserId]);
    return result.rows[0].is_following;
  } catch (error) {
    console.error('Error checking if following:', error);
    return false;
  }
}

/**
 * Check if two users follow each other (mutual following)
 * @param {string|number} userId1 - First user ID
 * @param {string|number} userId2 - Second user ID
 * @returns {Promise<boolean>} - True if both users follow each other
 */
async function checkMutualFollowing(userId1, userId2) {
  try {
    const query = `
      SELECT 
        EXISTS(SELECT 1 FROM user_follows WHERE follower_id = $1 AND followee_id = $2) as user1_follows_user2,
        EXISTS(SELECT 1 FROM user_follows WHERE follower_id = $2 AND followee_id = $1) as user2_follows_user1;
    `;
    
    const result = await dbPool.query(query, [userId1, userId2]);
    const { user1_follows_user2, user2_follows_user1 } = result.rows[0];
    
    return user1_follows_user2 && user2_follows_user1;
  } catch (error) {
    console.error('Error checking mutual following:', error);
    return false;
  }
}

/**
 * Check if userA follows userB OR vice versa (at least one follows)
 * @param {string|number} userId1 - First user ID
 * @param {string|number} userId2 - Second user ID
 * @returns {Promise<boolean>} - True if at least one user follows the other
 */
async function checkIfEitherFollows(userId1, userId2) {
  try {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM user_follows 
        WHERE (follower_id = $1 AND followee_id = $2)
           OR (follower_id = $2 AND followee_id = $1)
      ) as either_follows;
    `;
    
    const result = await dbPool.query(query, [userId1, userId2]);
    return result.rows[0].either_follows;
  } catch (error) {
    console.error('Error checking if either follows:', error);
    return false;
  }
}

/**
 * Get list of users that a specific user follows
 * @param {string|number} userId - The user ID
 * @returns {Promise<Array>} - Array of user IDs that this user follows
 */
async function getFollowingList(userId) {
  try {
    const query = `
      SELECT followee_id FROM user_follows 
      WHERE follower_id = $1;
    `;
    
    const result = await dbPool.query(query, [userId]);
    return result.rows.map(row => row.followee_id.toString());
  } catch (error) {
    console.error('Error getting following list:', error);
    return [];
  }
}

/**
 * Get list of users who follow a specific user
 * @param {string|number} userId - The user ID
 * @returns {Promise<Array>} - Array of user IDs who follow this user
 */
async function getFollowersList(userId) {
  try {
    const query = `
      SELECT follower_id FROM user_follows 
      WHERE followee_id = $1;
    `;
    
    const result = await dbPool.query(query, [userId]);
    return result.rows.map(row => row.follower_id.toString());
  } catch (error) {
    console.error('Error getting followers list:', error);
    return [];
  }
}

/**
 * Check if a user can message another user (current user must follow the other user)
 * @param {string|number} senderId - The user trying to send a message
 * @param {string|number} recipientId - The user who would receive the message
 * @returns {Promise<boolean>} - True if sender follows recipient
 */
async function canMessageUser(senderId, recipientId) {
  try {
    // Sender must follow recipient to message them
    return await checkIfFollowing(senderId, recipientId);
  } catch (error) {
    console.error('Error checking if can message user:', error);
    return false;
  }
}

/**
 * Filter a list of user IDs to only include users that the current user follows
 * @param {string|number} currentUserId - The current user's ID
 * @param {Array} userIds - Array of user IDs to filter
 * @returns {Promise<Array>} - Filtered array of user IDs
 */
async function filterByFollowing(currentUserId, userIds) {
  try {
    if (!userIds || userIds.length === 0) {
      return [];
    }
    
    const query = `
      SELECT followee_id FROM user_follows 
      WHERE follower_id = $1 AND followee_id = ANY($2::bigint[]);
    `;
    
    const result = await dbPool.query(query, [currentUserId, userIds]);
    return result.rows.map(row => row.followee_id.toString());
  } catch (error) {
    console.error('Error filtering by following:', error);
    return [];
  }
}

module.exports = {
  checkIfFollowing,
  checkMutualFollowing,
  checkIfEitherFollows,
  getFollowingList,
  getFollowersList,
  canMessageUser,
  filterByFollowing
};

