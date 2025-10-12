const crypto = require('crypto');
const {
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
  demoteAdminToMember
} = require('../database/groupOperations');
const { checkIfBlocked } = require('../security/blockingUtils');
const { canMessageUser } = require('../security/followingUtils');

/**
 * Handle create group request
 */
async function handleCreateGroup(ws, data, clientId, clients, groups, metrics) {
  const client = clients.get(clientId);
  if (!client || !client.user) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required'
    }));
    return;
  }

  const { groupName, groupDescription, initialMembers = [] } = data;

  if (!groupName || groupName.trim().length === 0) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Group name is required'
    }));
    return;
  }

  try {
    // Check if creator has blocked any of the initial members (or vice versa)
    const blockedMembers = [];
    for (const memberId of initialMembers) {
      const blockCheck = await checkIfBlocked(client.user.userId, memberId);
      if (blockCheck.isBlocked) {
        blockedMembers.push(memberId);
      }
    }

    // Filter out blocked members
    const allowedMembers = initialMembers.filter(id => !blockedMembers.includes(id));
    
    if (blockedMembers.length > 0) {
      console.log(`Group creation: Excluded ${blockedMembers.length} blocked users from initial members`);
    }
    
    // Check if creator follows all allowed members
    const notFollowingMembers = [];
    for (const memberId of allowedMembers) {
      const follows = await canMessageUser(client.user.userId, memberId);
      if (!follows) {
        notFollowingMembers.push(memberId);
      }
    }
    
    // Filter out members not followed
    const finalMembers = allowedMembers.filter(id => !notFollowingMembers.includes(id));
    
    if (notFollowingMembers.length > 0) {
      console.log(`Group creation: Excluded ${notFollowingMembers.length} users not followed by creator`);
    }
    
    // Check max members limit (creator + initial members)
    const maxMembers = data.maxMembers || 15;
    const totalMembers = finalMembers.length + 1; // +1 for creator
    
    if (totalMembers > maxMembers) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Too many members',
        details: `Cannot create group with ${totalMembers} members. Maximum is ${maxMembers}.`,
        code: 'TOO_MANY_MEMBERS'
      }));
      return;
    }

    const group = await createGroup(
      groupName.trim(),
      groupDescription?.trim() || '',
      client.user.userId,
      finalMembers,
      maxMembers
    );

    // Store group in memory
    groups.set(group.groupId, {
      name: group.groupName,
      members: new Set(group.members),
      messages: []
    });

    // Send success to creator
    ws.send(JSON.stringify({
      type: 'group_created',
      groupId: group.groupId,
      groupName: group.groupName,
      groupDescription: group.groupDescription,
      createdBy: group.creatorUserId,
      members: group.members,
      maxMembers: maxMembers,
      timestamp: new Date().toISOString()
    }));

    console.log(`Group created: ${group.groupId} by ${client.user.username}`);
  } catch (error) {
    console.error('Error creating group:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to create group'
    }));
  }
}

/**
 * Handle send group message
 */
async function handleSendGroupMessage(ws, data, clientId, clients, userConnections, groups, metrics) {
  const client = clients.get(clientId);
  if (!client || !client.user) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required'
    }));
    return;
  }

  const { groupId, content, replyTo } = data;

  if (!groupId || !content) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Group ID and content are required'
    }));
    return;
  }

  try {
    // Check if user is member of group
    const isMember = await isUserInGroup(groupId, client.user.userId);
    if (!isMember) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'You are not a member of this group'
      }));
      return;
    }

    // Check user permissions
    const userRole = await getUserRoleInGroup(groupId, client.user.userId);
    if (!userRole.can_send_messages) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'You do not have permission to send messages in this group'
      }));
      return;
    }

    // Parse mentions from message content
    const mentions = parseMentions(content);
    const members = await getGroupMembers(groupId);
    
    // Validate and resolve mentions
    const resolvedMentions = [];
    const mentionedUserIds = new Set();
    
    for (const mention of mentions) {
      if (mention === 'everyone' || mention === 'all') {
        // @everyone or @all - notify all members
        members.forEach(member => {
          if (member.userId !== client.user.userId) {
            mentionedUserIds.add(member.userId);
          }
        });
        resolvedMentions.push({ type: 'everyone', userIds: Array.from(mentionedUserIds) });
      } else {
        // @username - find specific user
        const mentionedMember = members.find(m => 
          m.username.toLowerCase() === mention.toLowerCase()
        );
        
        if (mentionedMember && mentionedMember.userId !== client.user.userId) {
          mentionedUserIds.add(mentionedMember.userId);
          resolvedMentions.push({ 
            type: 'user', 
            userId: mentionedMember.userId,
            username: mentionedMember.username 
          });
        }
      }
    }

    // Create message
    const messageId = crypto.randomUUID();
    const message = {
      id: messageId,
      groupId: groupId,
      senderId: client.user.userId,
      username: client.user.username,
      content: content,
      timestamp: new Date().toISOString(),
      replyTo: replyTo || null,
      mentions: resolvedMentions.length > 0 ? resolvedMentions : undefined
    };

    // Save to database
    await saveGroupMessage(message);

    // Store in memory
    const group = groups.get(groupId);
    if (group) {
      group.messages.push(message);
      if (group.messages.length > 1000) {
        group.messages = group.messages.slice(-500);
      }
    }

    metrics.messagesSent++;

    // Send confirmation to sender
    ws.send(JSON.stringify({
      type: 'group_message_sent',
      message: message,
      timestamp: new Date().toISOString()
    }));

    // Broadcast to all group members
    await broadcastToGroup(groupId, {
      type: 'new_group_message',
      message: message,
      timestamp: new Date().toISOString()
    }, client.user.userId, clients, userConnections);

    // Send special mention notifications to mentioned users
    if (mentionedUserIds.size > 0) {
      for (const mentionedUserId of mentionedUserIds) {
        const mentionedClientId = userConnections.get(mentionedUserId);
        if (mentionedClientId) {
          const mentionedClient = clients.get(mentionedClientId);
          if (mentionedClient && mentionedClient.ws.readyState === require('ws').OPEN) {
            mentionedClient.ws.send(JSON.stringify({
              type: 'mentioned_in_group',
              messageId: messageId,
              groupId: groupId,
              message: message,
              mentionedBy: client.user.userId,
              mentionedByUsername: client.user.username,
              timestamp: new Date().toISOString()
            }));
          }
        }
      }
    }

    console.log(`Group message sent by ${client.user.username} to group ${groupId}${mentionedUserIds.size > 0 ? ` with ${mentionedUserIds.size} mentions` : ''}`);
  } catch (error) {
    console.error('Error sending group message:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to send message'
    }));
  }
}

/**
 * Handle get group messages
 */
async function handleGetGroupMessages(ws, data, clientId, clients, groups) {
  const client = clients.get(clientId);
  if (!client || !client.user) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required'
    }));
    return;
  }

  const { groupId, limit = 50 } = data;

  if (!groupId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Group ID is required'
    }));
    return;
  }

  try {
    // Check if user is member
    const isMember = await isUserInGroup(groupId, client.user.userId);
    if (!isMember) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'You are not a member of this group'
      }));
      return;
    }

    // Load messages
    const messages = await loadGroupMessages(groupId, limit);

    // Filter blocked users' messages
    const { getBlockedUsers, getUsersWhoBlockedMe } = require('../security/blockingUtils');
    const blockedByMe = await getBlockedUsers(client.user.userId);
    const blockedMe = await getUsersWhoBlockedMe(client.user.userId);
    const allBlocked = new Set([...blockedByMe, ...blockedMe]);

    const filteredMessages = messages.filter(msg => !allBlocked.has(msg.senderId));

    ws.send(JSON.stringify({
      type: 'group_messages',
      groupId: groupId,
      messages: filteredMessages,
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error getting group messages:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to load messages'
    }));
  }
}

/**
 * Handle get user groups
 */
async function handleGetUserGroups(ws, data, clientId, clients) {
  const client = clients.get(clientId);
  if (!client || !client.user) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required'
    }));
    return;
  }

  try {
    const userGroups = await getUserGroups(client.user.userId);

    ws.send(JSON.stringify({
      type: 'user_groups',
      groups: userGroups,
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error getting user groups:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to load groups'
    }));
  }
}

/**
 * Handle get group members
 */
async function handleGetGroupMembers(ws, data, clientId, clients) {
  const client = clients.get(clientId);
  if (!client || !client.user) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required'
    }));
    return;
  }

  const { groupId } = data;

  if (!groupId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Group ID is required'
    }));
    return;
  }

  try {
    // Check if user is member
    const isMember = await isUserInGroup(groupId, client.user.userId);
    if (!isMember) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'You are not a member of this group'
      }));
      return;
    }

    const members = await getGroupMembers(groupId);

    ws.send(JSON.stringify({
      type: 'group_members',
      groupId: groupId,
      members: members,
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error getting group members:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to load members'
    }));
  }
}

/**
 * Handle add member to group
 */
async function handleAddGroupMember(ws, data, clientId, clients, userConnections, groups) {
  const client = clients.get(clientId);
  if (!client || !client.user) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required'
    }));
    return;
  }

  const { groupId, userId } = data;

  if (!groupId || !userId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Group ID and user ID are required'
    }));
    return;
  }

  try {
    // Check permissions (only admins can add members)
    const userRole = await getUserRoleInGroup(groupId, client.user.userId);
    if (!userRole || userRole.role !== 'admin') {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Only admins can add members'
      }));
      return;
    }

    // Check if the person adding and the user being added have blocked each other
    const blockCheck = await checkIfBlocked(client.user.userId, userId);
    if (blockCheck.isBlocked) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Cannot add user to group',
        details: 'You cannot add this user to the group.',
        code: 'USER_BLOCKED'
      }));
      console.log(`Cannot add user ${userId} to group ${groupId} - blocked by/blocking ${client.user.userId}`);
      return;
    }

    // Check if any existing group member has blocked the new user (or vice versa)
    const members = await getGroupMembers(groupId);
    for (const member of members) {
      const memberBlockCheck = await checkIfBlocked(member.userId, userId);
      if (memberBlockCheck.isBlocked) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Cannot add user to group',
          details: 'This user has a blocking relationship with an existing group member.',
          code: 'USER_BLOCKED'
        }));
        console.log(`Cannot add user ${userId} to group ${groupId} - blocked relationship with member ${member.userId}`);
        return;
      }
    }
    
    // Check if the person adding follows the user being added
    const follows = await canMessageUser(client.user.userId, userId);
    if (!follows) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Cannot add user to group',
        details: 'You can only add users you follow to groups.',
        code: 'NOT_FOLLOWING'
      }));
      console.log(`Cannot add user ${userId} to group ${groupId} - ${client.user.userId} does not follow them`);
      return;
    }
    
    // Check if group has reached max members
    const groupInfo = await getGroupById(groupId);
    const currentMembers = await getGroupMembers(groupId);
    
    if (currentMembers.length >= (groupInfo.maxMembers || 50)) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Cannot add user to group',
        details: `Group is full (max ${groupInfo.maxMembers || 50} members)`,
        code: 'GROUP_FULL'
      }));
      console.log(`Cannot add user ${userId} to group ${groupId} - group is full (${currentMembers.length}/${groupInfo.maxMembers})`);
      return;
    }

    // Add member
    await addMemberToGroup(groupId, userId, client.user.userId);

    // Update memory
    const group = groups.get(groupId);
    if (group) {
      group.members.add(userId);
    }

    // Notify sender
    ws.send(JSON.stringify({
      type: 'member_added',
      groupId: groupId,
      userId: userId,
      timestamp: new Date().toISOString()
    }));

    // Notify all group members
    await broadcastToGroup(groupId, {
      type: 'member_added',
      groupId: groupId,
      userId: userId,
      addedBy: client.user.userId,
      timestamp: new Date().toISOString()
    }, null, clients, userConnections);

    console.log(`User ${userId} added to group ${groupId} by ${client.user.username}`);
  } catch (error) {
    console.error('Error adding group member:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to add member'
    }));
  }
}

/**
 * Handle remove member from group
 */
async function handleRemoveGroupMember(ws, data, clientId, clients, userConnections, groups) {
  const client = clients.get(clientId);
  if (!client || !client.user) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required'
    }));
    return;
  }

  const { groupId, userId } = data;

  if (!groupId || !userId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Group ID and user ID are required'
    }));
    return;
  }

  try {
    const userRole = await getUserRoleInGroup(groupId, client.user.userId);
    
    // Check if removing self (leaving group)
    const isSelf = userId === client.user.userId;
    
    if (!isSelf) {
      // Check permissions to remove others (only admins can remove)
      if (!userRole || userRole.role !== 'admin') {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Only admins can remove members'
        }));
        return;
      }
    }

    // Remove member
    await removeMemberFromGroup(groupId, userId);

    // Update memory
    const group = groups.get(groupId);
    if (group) {
      group.members.delete(userId);
    }

    // Notify sender
    ws.send(JSON.stringify({
      type: 'member_removed',
      groupId: groupId,
      userId: userId,
      timestamp: new Date().toISOString()
    }));

    // Notify all group members
    await broadcastToGroup(groupId, {
      type: 'member_removed',
      groupId: groupId,
      userId: userId,
      removedBy: client.user.userId,
      timestamp: new Date().toISOString()
    }, null, clients, userConnections);

    console.log(`User ${userId} removed from group ${groupId}`);
  } catch (error) {
    console.error('Error removing group member:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to remove member'
    }));
  }
}

/**
 * Handle leave group (user leaves voluntarily)
 */
async function handleLeaveGroup(ws, data, clientId, clients, userConnections, groups) {
  const client = clients.get(clientId);
  if (!client || !client.user) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required'
    }));
    return;
  }

  const { groupId } = data;

  if (!groupId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Group ID is required'
    }));
    return;
  }

  try {
    // Check if user is actually in the group
    const isMember = await isUserInGroup(groupId, client.user.userId);
    if (!isMember) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'You are not a member of this group'
      }));
      return;
    }

    // Check if user is an admin
    const userRole = await getUserRoleInGroup(groupId, client.user.userId);
    const isAdmin = userRole && userRole.role === 'admin';
    
    // If user is an admin, check if they're the last admin
    if (isAdmin) {
      const allMembers = await getGroupMembers(groupId);
      const adminCount = allMembers.filter(m => m.role === 'admin').length;
      
      if (adminCount === 1) {
        // This is the last admin - delete the group instead
        console.log(`Last admin leaving group ${groupId} - auto-deleting group`);
        
        // Notify all members that group is being deleted
        await broadcastToGroup(groupId, {
          type: 'group_deleted',
          groupId: groupId,
          deletedBy: client.user.userId,
          permanent: true,
          message: 'Group deleted because last admin left',
          timestamp: new Date().toISOString()
        }, null, clients, userConnections);
        
        // Delete the group (hard delete)
        await deleteGroup(groupId, true);
        
        // Remove from memory
        groups.delete(groupId);
        
        // Notify the user
        ws.send(JSON.stringify({
          type: 'group_deleted',
          groupId: groupId,
          message: 'Group deleted because you were the last admin',
          timestamp: new Date().toISOString()
        }));
        
        return;
      }
    }

    // Normal leave (not last admin)
    await removeMemberFromGroup(groupId, client.user.userId);

    // Update memory
    const group = groups.get(groupId);
    if (group) {
      group.members.delete(client.user.userId);
    }

    // Notify the user who left
    ws.send(JSON.stringify({
      type: 'left_group',
      groupId: groupId,
      timestamp: new Date().toISOString()
    }));

    // Notify remaining group members
    await broadcastToGroup(groupId, {
      type: 'member_left',
      groupId: groupId,
      userId: client.user.userId,
      username: client.user.username,
      timestamp: new Date().toISOString()
    }, null, clients, userConnections);

    console.log(`User ${client.user.username} left group ${groupId}`);
  } catch (error) {
    console.error('Error leaving group:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to leave group'
    }));
  }
}

/**
 * Handle update group info
 */
async function handleUpdateGroupInfo(ws, data, clientId, clients, userConnections, groups) {
  const client = clients.get(clientId);
  if (!client || !client.user) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required'
    }));
    return;
  }

  const { groupId, groupName, groupDescription, maxMembers } = data;

  if (!groupId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Group ID is required'
    }));
    return;
  }

  // At least one field to update must be provided
  if (!groupName && groupDescription === undefined && !maxMembers) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'At least one field to update is required',
      details: 'Provide groupName, groupDescription, or maxMembers'
    }));
    return;
  }

  try {
    // Check if user has permission (must be admin)
    const userRole = await getUserRoleInGroup(groupId, client.user.userId);
    if (!userRole || userRole.role !== 'admin') {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Only admins can update group info'
      }));
      return;
    }

    // Prepare updates object
    const updates = {};
    if (groupName) updates.groupName = groupName.trim();
    if (groupDescription !== undefined) updates.groupDescription = groupDescription.trim();
    if (maxMembers) updates.maxMembers = parseInt(maxMembers, 10);

    // Update in database
    await updateGroupInfo(groupId, updates);

    // Update memory if group name changed
    const group = groups.get(groupId);
    if (group && updates.groupName) {
      group.name = updates.groupName;
    }

    // Get updated group info
    const updatedGroup = await getGroupById(groupId);

    // Notify the updater
    ws.send(JSON.stringify({
      type: 'group_updated',
      groupId: groupId,
      updates: updatedGroup,
      timestamp: new Date().toISOString()
    }));

    // Notify all group members
    await broadcastToGroup(groupId, {
      type: 'group_info_updated',
      groupId: groupId,
      updates: updatedGroup,
      updatedBy: client.user.userId,
      updatedByUsername: client.user.username,
      timestamp: new Date().toISOString()
    }, client.user.userId, clients, userConnections);

    console.log(`Group ${groupId} updated by ${client.user.username}`);
  } catch (error) {
    console.error('Error updating group info:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to update group info'
    }));
  }
}

/**
 * Handle get group info
 */
async function handleGetGroupInfo(ws, data, clientId, clients) {
  const client = clients.get(clientId);
  if (!client || !client.user) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required'
    }));
    return;
  }

  const { groupId } = data;

  if (!groupId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Group ID is required'
    }));
    return;
  }

  try {
    // Check if user is a member
    const isMember = await isUserInGroup(groupId, client.user.userId);
    if (!isMember) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'You are not a member of this group'
      }));
      return;
    }

    // Get group info
    const groupInfo = await getGroupById(groupId);
    
    if (!groupInfo) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Group not found'
      }));
      return;
    }

    // Get member count
    const members = await getGroupMembers(groupId);

    ws.send(JSON.stringify({
      type: 'group_info',
      group: {
        ...groupInfo,
        memberCount: members.length,
        members: members
      },
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error getting group info:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to get group info'
    }));
  }
}


/**
 * Handle edit group message
 */
async function handleEditGroupMessage(ws, data, clientId, clients, userConnections, groups) {
  const client = clients.get(clientId);
  if (!client || !client.user) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required'
    }));
    return;
  }

  const { messageId, newContent, groupId } = data;

  if (!messageId || !newContent) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Message ID and new content are required'
    }));
    return;
  }

  try {
    // If groupId not provided, try to find it from the message
    let actualGroupId = groupId;
    
    if (!actualGroupId) {
      // Query database to find which group this message belongs to
      const { dbPool } = require('../config/database');
      const result = await dbPool.query(`
        SELECT recipient_id as group_id, sender_id
        FROM private_messages
        WHERE message_id = $1 AND is_group_message = true
      `, [messageId]);
      
      if (result.rows.length === 0) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Message not found'
        }));
        return;
      }
      
      actualGroupId = result.rows[0].group_id;
      const messageSenderId = result.rows[0].sender_id;
      
      // Check if user is the sender
      if (messageSenderId !== client.user.userId) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Permission denied',
          details: 'You can only edit your own messages'
        }));
        return;
      }
    }

    // Check if user is member of the group
    const isMember = await isUserInGroup(actualGroupId, client.user.userId);
    if (!isMember) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'You are not a member of this group'
      }));
      return;
    }

    // Update message in database
    const { dbPool } = require('../config/database');
    const result = await dbPool.query(`
      UPDATE private_messages 
      SET content = $1, is_edited = true, edited_at = $2
      WHERE message_id = $3 
        AND sender_id = $4 
        AND is_group_message = true 
        AND is_deleted = false
      RETURNING *
    `, [newContent, new Date().toISOString(), messageId, client.user.userId]);

    if (result.rows.length === 0) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Message not found or you do not have permission to edit it'
      }));
      return;
    }

    // Send confirmation to sender
    ws.send(JSON.stringify({
      type: 'group_message_edited',
      messageId: messageId,
      groupId: actualGroupId,
      newContent: newContent,
      timestamp: new Date().toISOString()
    }));

    // Broadcast to all group members
    await broadcastToGroup(actualGroupId, {
      type: 'group_message_edited',
      messageId: messageId,
      groupId: actualGroupId,
      newContent: newContent,
      editedBy: client.user.userId,
      editedByUsername: client.user.username,
      timestamp: new Date().toISOString()
    }, client.user.userId, clients, userConnections);

    console.log(`Group message ${messageId} edited by ${client.user.username}`);
  } catch (error) {
    console.error('Error editing group message:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to edit message'
    }));
  }
}

/**
 * Handle delete group message
 */
async function handleDeleteGroupMessage(ws, data, clientId, clients, userConnections, groups) {
  const client = clients.get(clientId);
  if (!client || !client.user) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required'
    }));
    return;
  }

  const { messageId, groupId, deleteForEveryone = false } = data;

  if (!messageId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Message ID is required'
    }));
    return;
  }

  try {
    const { dbPool } = require('../config/database');
    
    // Get message details
    let actualGroupId = groupId;
    const messageResult = await dbPool.query(`
      SELECT recipient_id as group_id, sender_id
      FROM private_messages
      WHERE message_id = $1 AND is_group_message = true
    `, [messageId]);
    
    if (messageResult.rows.length === 0) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Message not found'
      }));
      return;
    }
    
    actualGroupId = messageResult.rows[0].group_id;
    const messageSenderId = messageResult.rows[0].sender_id;

    // Check if user is member of the group
    const isMember = await isUserInGroup(actualGroupId, client.user.userId);
    if (!isMember) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'You are not a member of this group'
      }));
      return;
    }

    if (deleteForEveryone) {
      // Only message sender or admins can delete for everyone
      const userRole = await getUserRoleInGroup(actualGroupId, client.user.userId);
      const isMessageSender = messageSenderId === client.user.userId;
      const isAdmin = userRole && (userRole.role === 'owner' || userRole.role === 'admin');

      if (!isMessageSender && !isAdmin) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Permission denied',
          details: 'Only message sender or group admins can delete messages for everyone'
        }));
        return;
      }

      // Delete for everyone
      await dbPool.query(`
        UPDATE private_messages 
        SET is_deleted = true, deleted_at = $1, deleted_for_everyone = true
        WHERE message_id = $2
      `, [new Date().toISOString(), messageId]);

      // Send confirmation
      ws.send(JSON.stringify({
        type: 'group_message_deleted',
        messageId: messageId,
        groupId: actualGroupId,
        deleteForEveryone: true,
        timestamp: new Date().toISOString()
      }));

      // Broadcast to all group members
      await broadcastToGroup(actualGroupId, {
        type: 'group_message_deleted',
        messageId: messageId,
        groupId: actualGroupId,
        deleteForEveryone: true,
        deletedBy: client.user.userId,
        deletedByUsername: client.user.username,
        timestamp: new Date().toISOString()
      }, client.user.userId, clients, userConnections);

      console.log(`Group message ${messageId} deleted for everyone by ${client.user.username}`);
    } else {
      // Delete for self only
      await dbPool.query(`
        INSERT INTO message_deletions (message_id, user_id, deleted_at)
        VALUES ($1, $2, $3)
        ON CONFLICT (message_id, user_id) DO UPDATE SET deleted_at = $3
      `, [messageId, client.user.userId, new Date().toISOString()]);

      // Send confirmation
      ws.send(JSON.stringify({
        type: 'group_message_deleted',
        messageId: messageId,
        groupId: actualGroupId,
        deleteForEveryone: false,
        timestamp: new Date().toISOString()
      }));

      console.log(`Group message ${messageId} deleted for user ${client.user.username}`);
    }
  } catch (error) {
    console.error('Error deleting group message:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to delete message'
    }));
  }
}

/**
 * Parse mentions from message content
 * Extracts @username patterns
 */
function parseMentions(content) {
  const mentions = [];
  
  // Match @username at word boundaries (not in middle of email addresses)
  // Requires @ to be preceded by start of string or whitespace
  // Username can contain letters, numbers, underscores
  const mentionPattern = /(?:^|\s)@(\w+)/g;
  let match;
  
  while ((match = mentionPattern.exec(content)) !== null) {
    const mention = match[1];
    if (!mentions.includes(mention)) {
      mentions.push(mention);
    }
  }
  
  return mentions;
}

/**
 * Handle add reaction to group message
 */
async function handleAddGroupReaction(ws, data, clientId, clients, userConnections) {
  const client = clients.get(clientId);
  if (!client || !client.user) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required'
    }));
    return;
  }

  const { messageId, reaction } = data;

  if (!messageId || !reaction) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Message ID and reaction are required'
    }));
    return;
  }

  // Validate reaction (emoji or short text)
  if (reaction.length > 10) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Reaction must be 10 characters or less'
    }));
    return;
  }

  try {
    const { dbPool } = require('../config/database');
    
    // Get message and verify it's a group message
    const messageResult = await dbPool.query(`
      SELECT recipient_id as group_id, sender_id
      FROM private_messages
      WHERE message_id = $1 AND is_group_message = true AND is_deleted = false
    `, [messageId]);

    if (messageResult.rows.length === 0) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Message not found'
      }));
      return;
    }

    const groupId = messageResult.rows[0].group_id;

    // Check if user is member of the group
    const isMember = await isUserInGroup(groupId, client.user.userId);
    if (!isMember) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'You are not a member of this group'
      }));
      return;
    }

    // Add reaction to database
    await dbPool.query(`
      INSERT INTO message_reactions (message_id, user_id, reaction)
      VALUES ($1, $2, $3)
      ON CONFLICT (message_id, user_id, reaction) DO NOTHING
    `, [messageId, client.user.userId, reaction]);

    const reactionData = {
      userId: client.user.userId,
      username: client.user.username,
      reaction: reaction,
      timestamp: new Date().toISOString()
    };

    // Send confirmation
    ws.send(JSON.stringify({
      type: 'group_reaction_added',
      messageId: messageId,
      groupId: groupId,
      reaction: reactionData,
      timestamp: new Date().toISOString()
    }));

    // Broadcast to all group members
    await broadcastToGroup(groupId, {
      type: 'group_reaction_added',
      messageId: messageId,
      groupId: groupId,
      reaction: reactionData,
      timestamp: new Date().toISOString()
    }, client.user.userId, clients, userConnections);

    console.log(`Reaction ${reaction} added to group message ${messageId} by ${client.user.username}`);
  } catch (error) {
    console.error('Error adding group reaction:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to add reaction'
    }));
  }
}

/**
 * Handle remove reaction from group message
 */
async function handleRemoveGroupReaction(ws, data, clientId, clients, userConnections) {
  const client = clients.get(clientId);
  if (!client || !client.user) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required'
    }));
    return;
  }

  const { messageId, reaction } = data;

  if (!messageId || !reaction) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Message ID and reaction are required'
    }));
    return;
  }

  try {
    const { dbPool } = require('../config/database');
    
    // Get message and verify it's a group message
    const messageResult = await dbPool.query(`
      SELECT recipient_id as group_id
      FROM private_messages
      WHERE message_id = $1 AND is_group_message = true
    `, [messageId]);

    if (messageResult.rows.length === 0) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Message not found'
      }));
      return;
    }

    const groupId = messageResult.rows[0].group_id;

    // Check if user is member
    const isMember = await isUserInGroup(groupId, client.user.userId);
    if (!isMember) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'You are not a member of this group'
      }));
      return;
    }

    // Remove reaction from database
    const result = await dbPool.query(`
      DELETE FROM message_reactions
      WHERE message_id = $1 AND user_id = $2 AND reaction = $3
      RETURNING *
    `, [messageId, client.user.userId, reaction]);

    if (result.rows.length === 0) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Reaction not found'
      }));
      return;
    }

    const reactionData = {
      userId: client.user.userId,
      username: client.user.username,
      reaction: reaction,
      timestamp: new Date().toISOString()
    };

    // Send confirmation
    ws.send(JSON.stringify({
      type: 'group_reaction_removed',
      messageId: messageId,
      groupId: groupId,
      reaction: reactionData,
      timestamp: new Date().toISOString()
    }));

    // Broadcast to all group members
    await broadcastToGroup(groupId, {
      type: 'group_reaction_removed',
      messageId: messageId,
      groupId: groupId,
      reaction: reactionData,
      timestamp: new Date().toISOString()
    }, client.user.userId, clients, userConnections);

    console.log(`Reaction ${reaction} removed from group message ${messageId} by ${client.user.username}`);
  } catch (error) {
    console.error('Error removing group reaction:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to remove reaction'
    }));
  }
}

/**
 * Handle delete entire group
 */
async function handleDeleteGroup(ws, data, clientId, clients, userConnections, groups) {
  const client = clients.get(clientId);
  if (!client || !client.user) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required'
    }));
    return;
  }

  const { groupId, permanent = false } = data;

  if (!groupId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Group ID is required'
    }));
    return;
  }

  try {
    // Check if user is an admin
    const userRole = await getUserRoleInGroup(groupId, client.user.userId);
    if (!userRole || userRole.role !== 'admin') {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Only admins can delete the group',
        code: 'INSUFFICIENT_PERMISSIONS'
      }));
      return;
    }

    // Get all members before deletion for notification
    const members = await getGroupMembers(groupId);

    // Delete the group (soft or hard based on permanent flag)
    await deleteGroup(groupId, permanent);

    // Remove from memory
    groups.delete(groupId);

    // Notify all members
    const deleteType = permanent ? 'permanently' : 'temporarily (30-day grace period)';
    await broadcastToGroup(groupId, {
      type: 'group_deleted',
      groupId: groupId,
      deletedBy: client.user.userId,
      permanent: permanent,
      message: `Group ${deleteType} deleted by owner`,
      timestamp: new Date().toISOString()
    }, null, clients, userConnections);

    // Confirm to owner
    ws.send(JSON.stringify({
      type: 'group_deleted',
      groupId: groupId,
      permanent: permanent,
      message: permanent ? 'Group permanently deleted' : 'Group deleted (can be restored within 30 days)'
    }));

    console.log(`Group ${groupId} ${deleteType} deleted by ${client.user.userId}`);
  } catch (error) {
    console.error('Error deleting group:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to delete group'
    }));
  }
}

/**
 * Handle send announcement (admin-only, auto-pinned)
 */
async function handleSendAnnouncement(ws, data, clientId, clients, userConnections, groups) {
  const client = clients.get(clientId);
  if (!client || !client.user) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required'
    }));
    return;
  }

  const { groupId, content } = data;

  if (!groupId || !content) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Group ID and content are required'
    }));
    return;
  }

  try {
    // Check if user is an admin
    const userRole = await getUserRoleInGroup(groupId, client.user.userId);
    if (!userRole || userRole.role !== 'admin') {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Only admins can send announcements',
        code: 'INSUFFICIENT_PERMISSIONS'
      }));
      return;
    }

    // Create announcement message
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const message = {
      messageId: messageId,
      groupId: groupId,
      senderId: client.user.userId,
      senderUsername: client.user.username,
      content: content,
      isGroupMessage: true,
      isAnnouncement: true,
      isPinned: true,  // Auto-pin announcements
      pinnedBy: client.user.userId,
      timestamp: new Date().toISOString()
    };

    // Save to database
    const { dbPool } = require('../config/database');
    const { encryptMessage } = require('../security/encryption');
    const encryptionResult = encryptMessage(content);

    // Unpin any currently pinned message first (only 1 pinned at a time)
    await dbPool.query(`
      UPDATE private_messages
      SET is_pinned = false, pinned_at = NULL, pinned_by_user_id = NULL
      WHERE recipient_id = $1 AND is_group_message = true AND is_pinned = true
    `, [groupId]);

    if (encryptionResult) {
      await dbPool.query(`
        INSERT INTO private_messages (
          message_id, sender_id, recipient_id, content, 
          encrypted_content, encryption_iv, is_encrypted, 
          is_group_message, is_announcement, is_pinned, 
          pinned_at, pinned_by_user_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        messageId, client.user.userId, groupId, content,
        encryptionResult.encrypted, encryptionResult.iv, true,
        true, true, true, new Date(), client.user.userId
      ]);
    }

    // Broadcast to all group members
    await broadcastToGroup(groupId, {
      type: 'new_announcement',
      ...message,
      pinnedAt: new Date().toISOString()
    }, null, clients, userConnections);

    // Confirm to sender
    ws.send(JSON.stringify({
      type: 'announcement_sent',
      ...message
    }));

    console.log(`Admin ${client.user.username} sent announcement in group ${groupId}`);
  } catch (error) {
    console.error('Error sending announcement:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to send announcement'
    }));
  }
}

/**
 * Handle pin message
 */
async function handlePinMessage(ws, data, clientId, clients, userConnections) {
  const client = clients.get(clientId);
  if (!client || !client.user) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required'
    }));
    return;
  }

  const { messageId, groupId } = data;

  if (!messageId || !groupId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Message ID and Group ID are required'
    }));
    return;
  }

  try {
    // Check if user is an admin
    const userRole = await getUserRoleInGroup(groupId, client.user.userId);
    if (!userRole || userRole.role !== 'admin') {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Only admins can pin messages',
        code: 'INSUFFICIENT_PERMISSIONS'
      }));
      return;
    }

    // Unpin any currently pinned message first (only 1 pinned at a time)
    const { dbPool } = require('../config/database');
    await dbPool.query(`
      UPDATE private_messages
      SET is_pinned = false, pinned_at = NULL, pinned_by_user_id = NULL
      WHERE recipient_id = $1 AND is_group_message = true AND is_pinned = true
    `, [groupId]);
    
    // Pin the new message
    await dbPool.query(`
      UPDATE private_messages
      SET is_pinned = true, pinned_at = NOW(), pinned_by_user_id = $1
      WHERE message_id = $2 AND recipient_id = $3 AND is_group_message = true
    `, [client.user.userId, messageId, groupId]);

    // Broadcast to all group members
    await broadcastToGroup(groupId, {
      type: 'message_pinned',
      messageId: messageId,
      groupId: groupId,
      pinnedBy: client.user.userId,
      timestamp: new Date().toISOString()
    }, null, clients, userConnections);

    // Confirm to sender
    ws.send(JSON.stringify({
      type: 'message_pinned',
      messageId: messageId,
      groupId: groupId
    }));

    console.log(`Message ${messageId} pinned in group ${groupId} by ${client.user.username}`);
  } catch (error) {
    console.error('Error pinning message:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to pin message'
    }));
  }
}

/**
 * Handle unpin message
 */
async function handleUnpinMessage(ws, data, clientId, clients, userConnections) {
  const client = clients.get(clientId);
  if (!client || !client.user) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required'
    }));
    return;
  }

  const { messageId, groupId } = data;

  if (!messageId || !groupId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Message ID and Group ID are required'
    }));
    return;
  }

  try {
    // Check if user is an admin
    const userRole = await getUserRoleInGroup(groupId, client.user.userId);
    if (!userRole || userRole.role !== 'admin') {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Only admins can unpin messages',
        code: 'INSUFFICIENT_PERMISSIONS'
      }));
      return;
    }

    // Unpin the message
    const { dbPool } = require('../config/database');
    await dbPool.query(`
      UPDATE private_messages
      SET is_pinned = false, pinned_at = NULL, pinned_by_user_id = NULL
      WHERE message_id = $1 AND recipient_id = $2 AND is_group_message = true
    `, [messageId, groupId]);

    // Broadcast to all group members
    await broadcastToGroup(groupId, {
      type: 'message_unpinned',
      messageId: messageId,
      groupId: groupId,
      unpinnedBy: client.user.userId,
      timestamp: new Date().toISOString()
    }, null, clients, userConnections);

    // Confirm to sender
    ws.send(JSON.stringify({
      type: 'message_unpinned',
      messageId: messageId,
      groupId: groupId
    }));

    console.log(`Message ${messageId} unpinned in group ${groupId} by ${client.user.username}`);
  } catch (error) {
    console.error('Error unpinning message:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to unpin message'
    }));
  }
}

/**
 * Handle get pinned messages
 */
async function handleGetPinnedMessages(ws, data, clientId, clients) {
  const client = clients.get(clientId);
  if (!client || !client.user) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required'
    }));
    return;
  }

  const { groupId } = data;

  if (!groupId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Group ID is required'
    }));
    return;
  }

  try {
    // Check if user is a member
    const isMember = await isUserInGroup(groupId, client.user.userId);
    if (!isMember) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'You are not a member of this group'
      }));
      return;
    }

    // Get the single pinned message (only 1 at a time)
    const { dbPool } = require('../config/database');
    const { decryptMessage } = require('../security/encryption');
    
    const result = await dbPool.query(`
      SELECT 
        message_id, sender_id, content, encrypted_content, encryption_iv,
        is_announcement, pinned_at, pinned_by_user_id, created_at
      FROM private_messages
      WHERE recipient_id = $1 AND is_group_message = true AND is_pinned = true AND is_deleted = false
      ORDER BY pinned_at DESC
      LIMIT 1
    `, [groupId]);

    let pinnedMessage = null;
    
    if (result.rows.length > 0) {
      const row = result.rows[0];
      let content = row.content;
      if (row.encrypted_content && row.encryption_iv) {
        const decrypted = decryptMessage(row.encrypted_content, row.encryption_iv);
        if (decrypted) content = decrypted;
      }

      pinnedMessage = {
        messageId: row.message_id,
        senderId: row.sender_id,
        content: content,
        isAnnouncement: row.is_announcement,
        isPinned: true,
        pinnedAt: row.pinned_at,
        pinnedBy: row.pinned_by_user_id,
        createdAt: row.created_at
      };
    }

    ws.send(JSON.stringify({
      type: 'pinned_message',
      groupId: groupId,
      message: pinnedMessage  // Single message or null
    }));

  } catch (error) {
    console.error('Error getting pinned messages:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to get pinned messages'
    }));
  }
}

/**
 * Handle promote member to admin
 */
async function handlePromoteMember(ws, data, clientId, clients, userConnections) {
  const client = clients.get(clientId);
  if (!client || !client.user) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required'
    }));
    return;
  }

  const { groupId, userId } = data;

  if (!groupId || !userId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Group ID and user ID are required'
    }));
    return;
  }

  try {
    // Check if current user is an admin
    const currentUserRole = await getUserRoleInGroup(groupId, client.user.userId);
    if (!currentUserRole || currentUserRole.role !== 'admin') {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Only admins can promote members',
        code: 'INSUFFICIENT_PERMISSIONS'
      }));
      return;
    }

    // Check if target user is a member (not already admin)
    const targetUserRole = await getUserRoleInGroup(groupId, userId);
    if (!targetUserRole) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'User is not a member of this group'
      }));
      return;
    }

    if (targetUserRole.role === 'admin') {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'User is already an admin'
      }));
      return;
    }

    // Promote member to admin
    await promoteMemberToAdmin(groupId, userId);

    // Send confirmation to requester
    ws.send(JSON.stringify({
      type: 'member_promoted',
      groupId: groupId,
      userId: userId,
      newRole: 'admin',
      promotedBy: client.user.userId
    }));

    // Broadcast to all group members
    await broadcastToGroup(groupId, {
      type: 'member_promoted',
      groupId: groupId,
      userId: userId,
      newRole: 'admin',
      promotedBy: client.user.userId,
      timestamp: new Date().toISOString()
    }, null, clients, userConnections);

    console.log(`User ${userId} promoted to admin in group ${groupId} by ${client.user.userId}`);
  } catch (error) {
    console.error('Error promoting member:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to promote member'
    }));
  }
}

/**
 * Handle demote admin to member
 */
async function handleDemoteMember(ws, data, clientId, clients, userConnections) {
  const client = clients.get(clientId);
  if (!client || !client.user) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required'
    }));
    return;
  }

  const { groupId, userId } = data;

  if (!groupId || !userId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Group ID and user ID are required'
    }));
    return;
  }

  try {
    // Check if current user is an admin
    const currentUserRole = await getUserRoleInGroup(groupId, client.user.userId);
    if (!currentUserRole || currentUserRole.role !== 'admin') {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Only admins can demote other admins',
        code: 'INSUFFICIENT_PERMISSIONS'
      }));
      return;
    }

    // Check if target user is an admin
    const targetUserRole = await getUserRoleInGroup(groupId, userId);
    if (!targetUserRole) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'User is not a member of this group'
      }));
      return;
    }

    if (targetUserRole.role !== 'admin') {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'User is not an admin'
      }));
      return;
    }
    
    // Check if trying to demote self
    if (userId === client.user.userId) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Cannot demote yourself',
        code: 'CANNOT_DEMOTE_SELF'
      }));
      return;
    }

    // Demote admin to member
    await demoteAdminToMember(groupId, userId);

    // Send confirmation to requester
    ws.send(JSON.stringify({
      type: 'member_demoted',
      groupId: groupId,
      userId: userId,
      newRole: 'member',
      demotedBy: client.user.userId
    }));

    // Broadcast to all group members
    await broadcastToGroup(groupId, {
      type: 'member_demoted',
      groupId: groupId,
      userId: userId,
      newRole: 'member',
      demotedBy: client.user.userId,
      timestamp: new Date().toISOString()
    }, null, clients, userConnections);

    console.log(`User ${userId} demoted to member in group ${groupId} by ${client.user.userId}`);
  } catch (error) {
    console.error('Error demoting member:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to demote member'
    }));
  }
}

/**
 * Broadcast message to all group members
 */
async function broadcastToGroup(groupId, message, excludeUserId, clients, userConnections) {
  try {
    const members = await getGroupMembers(groupId);
    const messageStr = JSON.stringify(message);

    for (const member of members) {
      if (member.userId === excludeUserId) continue;

      const memberClientId = userConnections.get(member.userId);
      if (memberClientId) {
        const memberClient = clients.get(memberClientId);
        if (memberClient && memberClient.ws.readyState === require('ws').OPEN) {
          memberClient.ws.send(messageStr);
        }
      }
    }
  } catch (error) {
    console.error('Error broadcasting to group:', error);
  }
}

module.exports = {
  handleCreateGroup,
  handleSendGroupMessage,
  handleGetGroupMessages,
  handleGetUserGroups,
  handleGetGroupMembers,
  handleAddGroupMember,
  handleRemoveGroupMember,
  handleLeaveGroup,
  handleUpdateGroupInfo,
  handleGetGroupInfo,
  handleEditGroupMessage,
  handleDeleteGroupMessage,
  handleAddGroupReaction,
  handleRemoveGroupReaction,
  handleDeleteGroup,
  handlePromoteMember,
  handleDemoteMember,
  handleSendAnnouncement,
  handlePinMessage,
  handleUnpinMessage,
  handleGetPinnedMessages,
  broadcastToGroup
};

