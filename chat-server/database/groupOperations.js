const crypto = require('crypto');
const { dbPool } = require('../config/database');
const { encryptMessage } = require('../security/encryption');
const { getRedisClient, isRedisConnected } = require('../config/redis');

/**
 * Create a new group chat
 */
async function createGroup(groupName, groupDescription, creatorUserId, initialMembers = [], maxMembers = 50) {
  try {
    const groupId = `group_${crypto.randomUUID()}`;
    
    // Create the group
    await dbPool.query(`
      INSERT INTO group_chats (group_id, group_name, group_description, created_by_user_id, max_members)
      VALUES ($1, $2, $3, $4, $5)
    `, [groupId, groupName, groupDescription, creatorUserId, maxMembers]);
    
    // Add creator as admin
    await dbPool.query(`
      INSERT INTO group_members (group_id, user_id, role, can_add_members, added_by_user_id)
      VALUES ($1, $2, $3, $4, $5)
    `, [groupId, creatorUserId, 'admin', true, creatorUserId]);
    
    // Add initial members
    for (const userId of initialMembers) {
      if (userId !== creatorUserId) {
        await dbPool.query(`
          INSERT INTO group_members (group_id, user_id, role, added_by_user_id)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (group_id, user_id) DO NOTHING
        `, [groupId, userId, 'member', creatorUserId]);
      }
    }
    
    console.log(`Group created: ${groupId} by ${creatorUserId}`);
    return { groupId, groupName, groupDescription, creatorUserId, members: [creatorUserId, ...initialMembers] };
  } catch (error) {
    console.error('Error creating group:', error);
    throw error;
  }
}

/**
 * Get group information by ID
 */
async function getGroupById(groupId) {
  try {
    const result = await dbPool.query(`
      SELECT 
        group_id as "groupId",
        group_name as "groupName",
        group_description as "groupDescription",
        created_by_user_id as "createdBy",
        max_members as "maxMembers",
        is_active as "isActive",
        created_at as "createdAt"
      FROM group_chats
      WHERE group_id = $1 AND is_active = true
    `, [groupId]);
    
    if (result.rows.length === 0) return null;
    return result.rows[0];
  } catch (error) {
    console.error('Error getting group by ID:', error);
    throw error;
  }
}

/**
 * Get all groups a user is a member of
 */
async function getUserGroups(userId) {
  try {
    const result = await dbPool.query(`
      SELECT 
        gc.group_id as "groupId",
        gc.group_name as "groupName",
        gc.group_description as "groupDescription",
        gc.created_by_user_id as "createdBy",
        gm.role as "myRole",
        gm.joined_at as "joinedAt",
        (SELECT COUNT(*) FROM group_members WHERE group_id = gc.group_id) as "memberCount"
      FROM group_chats gc
      JOIN group_members gm ON gc.group_id = gm.group_id
      WHERE gm.user_id = $1 AND gc.is_active = true
      ORDER BY gc.created_at DESC
    `, [userId]);
    
    return result.rows;
  } catch (error) {
    console.error('Error getting user groups:', error);
    throw error;
  }
}

/**
 * Get all members of a group
 */
async function getGroupMembers(groupId) {
  try {
    const result = await dbPool.query(`
      SELECT 
        gm.user_id as "userId",
        gm.role,
        gm.can_send_messages as "canSendMessages",
        gm.can_add_members as "canAddMembers",
        gm.joined_at as "joinedAt",
        COALESCE(ua.username, gm.user_id) as username
      FROM group_members gm
      LEFT JOIN users_auth ua ON gm.user_id = ua.user_id::VARCHAR
      WHERE gm.group_id = $1
      ORDER BY 
        CASE gm.role 
          WHEN 'owner' THEN 1 
          WHEN 'admin' THEN 2 
          ELSE 3 
        END,
        gm.joined_at ASC
    `, [groupId]);
    
    return result.rows;
  } catch (error) {
    console.error('Error getting group members:', error);
    throw error;
  }
}

/**
 * Check if user is member of group
 */
async function isUserInGroup(groupId, userId) {
  try {
    const result = await dbPool.query(`
      SELECT 1 FROM group_members
      WHERE group_id = $1 AND user_id = $2
    `, [groupId, userId]);
    
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking if user in group:', error);
    return false;
  }
}

/**
 * Get user's role in a group
 */
async function getUserRoleInGroup(groupId, userId) {
  try {
    const result = await dbPool.query(`
      SELECT role, can_send_messages, can_add_members
      FROM group_members
      WHERE group_id = $1 AND user_id = $2
    `, [groupId, userId]);
    
    if (result.rows.length === 0) return null;
    return result.rows[0];
  } catch (error) {
    console.error('Error getting user role in group:', error);
    return null;
  }
}

/**
 * Add member to group
 */
async function addMemberToGroup(groupId, userId, addedBy, role = 'member') {
  try {
    await dbPool.query(`
      INSERT INTO group_members (group_id, user_id, role, added_by_user_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (group_id, user_id) DO NOTHING
    `, [groupId, userId, role, addedBy]);
    
    console.log(`User ${userId} added to group ${groupId} by ${addedBy}`);
    return true;
  } catch (error) {
    console.error('Error adding member to group:', error);
    throw error;
  }
}

/**
 * Remove member from group
 */
async function removeMemberFromGroup(groupId, userId) {
  try {
    await dbPool.query(`
      DELETE FROM group_members
      WHERE group_id = $1 AND user_id = $2
    `, [groupId, userId]);
    
    console.log(`User ${userId} removed from group ${groupId}`);
    return true;
  } catch (error) {
    console.error('Error removing member from group:', error);
    throw error;
  }
}

/**
 * Update group information
 */
async function updateGroupInfo(groupId, updates) {
  try {
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    if (updates.groupName) {
      fields.push(`group_name = $${paramCount++}`);
      values.push(updates.groupName);
    }
    if (updates.groupDescription !== undefined) {
      fields.push(`group_description = $${paramCount++}`);
      values.push(updates.groupDescription);
    }
    if (updates.maxMembers) {
      fields.push(`max_members = $${paramCount++}`);
      values.push(updates.maxMembers);
    }
    
    if (fields.length === 0) return false;
    
    values.push(groupId);
    
    await dbPool.query(`
      UPDATE group_chats
      SET ${fields.join(', ')}
      WHERE group_id = $${paramCount}
    `, values);
    
    console.log(`Group ${groupId} updated`);
    return true;
  } catch (error) {
    console.error('Error updating group info:', error);
    throw error;
  }
}

/**
 * Delete group - Soft delete by default, or permanent hard delete
 * @param {string} groupId - The group ID
 * @param {boolean} permanent - If true, performs hard delete immediately
 */
async function deleteGroup(groupId, permanent = false) {
  try {
    if (permanent) {
      // Hard delete: Remove all data permanently
      // Delete group members first (foreign key constraint)
      await dbPool.query(`
        DELETE FROM group_members
        WHERE group_id = $1
      `, [groupId]);
      
      // Delete group messages
      await dbPool.query(`
        DELETE FROM private_messages
        WHERE recipient_id = $1 AND is_group_message = true
      `, [groupId]);
      
      // Delete the group
      await dbPool.query(`
        DELETE FROM group_chats
        WHERE group_id = $1
      `, [groupId]);
      
      console.log(`Group ${groupId} permanently deleted (hard delete)`);
    } else {
      // Soft delete: Mark as inactive with timestamp
      await dbPool.query(`
        UPDATE group_chats
        SET is_active = false, deleted_at = NOW()
        WHERE group_id = $1
      `, [groupId]);
      
      console.log(`Group ${groupId} soft deleted (can be restored within 30 days)`);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting group:', error);
    throw error;
  }
}

/**
 * Permanently delete groups that were soft-deleted more than 30 days ago
 * This should be called by a scheduled job (cron/scheduled task)
 */
async function cleanupOldDeletedGroups() {
  try {
    // Find groups deleted more than 30 days ago
    const result = await dbPool.query(`
      SELECT group_id FROM group_chats
      WHERE is_active = false 
      AND deleted_at IS NOT NULL
      AND deleted_at < NOW() - INTERVAL '30 days'
    `);
    
    console.log(`Found ${result.rows.length} groups to permanently delete`);
    
    // Hard delete each group
    for (const row of result.rows) {
      await deleteGroup(row.group_id, true);
    }
    
    return result.rows.length;
  } catch (error) {
    console.error('Error cleaning up old deleted groups:', error);
    throw error;
  }
}

/**
 * Save group message to database
 * Reuses private_messages table with is_group_message = true
 */
async function saveGroupMessage(message) {
  try {
    // Encrypt the message content
    const encryptionResult = encryptMessage(message.content);
    
    if (encryptionResult) {
      await dbPool.query(`
        INSERT INTO private_messages (
          message_id, conversation_id, sender_id, recipient_id, content, 
          encrypted_content, encryption_iv, is_encrypted, 
          is_group_message, reply_to
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        message.id,
        message.groupId,  // Use group_id as conversation_id for groups
        message.senderId,
        message.groupId,  // Store group_id in recipient_id field
        message.content,
        encryptionResult.encrypted,
        encryptionResult.iv,
        true,
        true,  // Mark as group message
        message.replyTo || null
      ]);
      
      console.log(`Group message saved: ${message.id} to group ${message.groupId}`);
    } else {
      // Fallback unencrypted
      await dbPool.query(`
        INSERT INTO private_messages (
          message_id, conversation_id, sender_id, recipient_id, content, 
          is_encrypted, is_group_message, reply_to
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        message.id,
        message.groupId,  // Use group_id as conversation_id for groups
        message.senderId,
        message.groupId,
        message.content,
        false,
        true,
        message.replyTo || null
      ]);
    }
  } catch (error) {
    console.error('Error saving group message:', error);
    throw error;
  }
}

/**
 * Load group messages from database
 */
async function loadGroupMessages(groupId, limit = 50) {
  try {
    const result = await dbPool.query(`
      SELECT 
        pm.message_id as id,
        pm.sender_id as "senderId",
        pm.recipient_id as "groupId",
        COALESCE(ua.username, pm.sender_id) as username,
        pm.content,
        pm.encrypted_content,
        pm.encryption_iv,
        pm.is_encrypted,
        pm.reply_to as "replyTo",
        pm.is_edited as "isEdited",
        pm.edited_at as "editedAt",
        pm.created_at as timestamp
      FROM private_messages pm
      LEFT JOIN users_auth ua ON pm.sender_id = ua.user_id::VARCHAR
      WHERE pm.recipient_id = $1 
        AND pm.is_group_message = true
        AND pm.is_deleted = false
      ORDER BY pm.created_at DESC
      LIMIT $2
    `, [groupId, limit]);
    
    // Decrypt messages if needed
    const { decryptMessage } = require('../security/encryption');
    const messages = result.rows.reverse().map(row => {
      let content = row.content;
      
      if (row.is_encrypted && row.encrypted_content && row.encryption_iv) {
        const decrypted = decryptMessage(row.encrypted_content, row.encryption_iv);
        if (decrypted) {
          content = decrypted;
        }
      }
      
      return {
        id: row.id,
        senderId: row.senderId,
        groupId: row.groupId,
        username: row.username,
        content: content,
        timestamp: row.timestamp,
        replyTo: row.replyTo,
        isEdited: row.isEdited || false,
        editedAt: row.editedAt
      };
    });
    
    console.log(`Loaded ${messages.length} group messages for group ${groupId}`);
    return messages;
  } catch (error) {
    console.error('Error loading group messages:', error);
    return [];
  }
}

/**
 * Promote member to admin
 */
async function promoteMemberToAdmin(groupId, userId) {
  try {
    await dbPool.query(`
      UPDATE group_members
      SET role = 'admin', can_add_members = TRUE
      WHERE group_id = $1 AND user_id = $2 AND role = 'member'
    `, [groupId, userId]);
    
    console.log(`User ${userId} promoted to admin in group ${groupId}`);
    return true;
  } catch (error) {
    console.error('Error promoting member to admin:', error);
    throw error;
  }
}

/**
 * Demote admin to member
 */
async function demoteAdminToMember(groupId, userId) {
  try {
    await dbPool.query(`
      UPDATE group_members
      SET role = 'member', can_add_members = FALSE
      WHERE group_id = $1 AND user_id = $2 AND role = 'admin'
    `, [groupId, userId]);
    
    console.log(`User ${userId} demoted to member in group ${groupId}`);
    return true;
  } catch (error) {
    console.error('Error demoting admin to member:', error);
    throw error;
  }
}

module.exports = {
  createGroup,
  getGroupById,
  getUserGroups,
  getGroupMembers,
  isUserInGroup,
  getUserRoleInGroup,
  addMemberToGroup,
  removeMemberFromGroup,
  updateGroupInfo,
  deleteGroup,
  saveGroupMessage,
  loadGroupMessages,
  promoteMemberToAdmin,
  demoteAdminToMember,
  cleanupOldDeletedGroups
};

