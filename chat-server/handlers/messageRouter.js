const {
  handleAuthentication,
  handleGetOnlineUsers,
  handleStartConversation,
  handleSendPrivateMessage,
  handleMarkMessageRead,
  handleTyping,
  handleAddReaction,
  handleRemoveReaction,
  handleEditMessage,
  handleDeleteMessage,
  handleDeleteConversation,
  handleGetPrivateMessages,
  handleGetUserCommunities,
  handleGetCommunityMembersList,
  handleGetCommunityProgress
} = require('./messageHandlers');

const {
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
  handleGetPinnedMessages
} = require('./groupHandlers');

async function handleMessage(ws, message, clientId, clients, userConnections, conversations, sessions, metrics, groups) {
  const { type, ...data } = message;
  
  
  switch (type) {
    case 'authenticate':
    case 'auth': // Alias for authenticate
      await handleAuthentication(ws, data, clientId, clients, userConnections, sessions, metrics);
      break;
      
    case 'get_online_users':
      await handleGetOnlineUsers(ws, data, clientId, clients, userConnections);
      break;
      
    case 'start_conversation':
      await handleStartConversation(ws, data, clientId, clients, userConnections, conversations, metrics);
      break;
      
    case 'send_private_message':
      await handleSendPrivateMessage(ws, data, clientId, clients, userConnections, conversations, metrics);
      break;
      
    case 'mark_message_read':
      await handleMarkMessageRead(ws, data, clientId, clients, userConnections, conversations);
      break;
      
    case 'typing':
      await handleTyping(ws, data, clientId, clients, userConnections);
      break;
      
    case 'add_reaction':
      await handleAddReaction(ws, data, clientId, clients, userConnections, conversations);
      break;
      
    case 'remove_reaction':
      await handleRemoveReaction(ws, data, clientId, clients, userConnections, conversations);
      break;
      
    case 'edit_message':
      await handleEditMessage(ws, data, clientId, clients, userConnections, conversations);
      break;
      
    case 'delete_message':
      await handleDeleteMessage(ws, data, clientId, clients, userConnections, conversations);
      break;
      
    case 'delete_conversation':
      await handleDeleteConversation(ws, data, clientId, clients, userConnections, conversations);
      break;
      
    case 'get_private_messages':
      await handleGetPrivateMessages(ws, data, clientId, clients, userConnections, conversations);
      break;
    
    case 'get_communities':
      await handleGetUserCommunities(ws, data, clientId, clients);
      break;

    case 'get_community_members':
      await handleGetCommunityMembersList(ws, data, clientId, clients);
      break;

    case 'get_community_progress':
      await handleGetCommunityProgress(ws, data, clientId, clients);
      break;
      
    // Group chat handlers
    case 'create_group':
      await handleCreateGroup(ws, data, clientId, clients, groups, metrics);
      break;
      
    case 'send_group_message':
      await handleSendGroupMessage(ws, data, clientId, clients, userConnections, groups, metrics);
      break;
      
    case 'get_group_messages':
      await handleGetGroupMessages(ws, data, clientId, clients, groups);
      break;
      
    case 'get_user_groups':
      await handleGetUserGroups(ws, data, clientId, clients);
      break;
      
    case 'get_group_members':
      await handleGetGroupMembers(ws, data, clientId, clients);
      break;
      
    case 'add_group_member':
      await handleAddGroupMember(ws, data, clientId, clients, userConnections, groups);
      break;
      
    case 'remove_group_member':
      await handleRemoveGroupMember(ws, data, clientId, clients, userConnections, groups);
      break;
      
    case 'leave_group':
      await handleLeaveGroup(ws, data, clientId, clients, userConnections, groups);
      break;
      
    case 'update_group_info':
      await handleUpdateGroupInfo(ws, data, clientId, clients, userConnections, groups);
      break;
      
    case 'get_group_info':
      await handleGetGroupInfo(ws, data, clientId, clients);
      break;
      
    case 'edit_group_message':
      await handleEditGroupMessage(ws, data, clientId, clients, userConnections, groups);
      break;
      
    case 'delete_group_message':
      await handleDeleteGroupMessage(ws, data, clientId, clients, userConnections, groups);
      break;
      
    case 'add_group_reaction':
      await handleAddGroupReaction(ws, data, clientId, clients, userConnections);
      break;
      
    case 'remove_group_reaction':
      await handleRemoveGroupReaction(ws, data, clientId, clients, userConnections);
      break;
      
    case 'delete_group':
      await handleDeleteGroup(ws, data, clientId, clients, userConnections, groups);
      break;
      
    case 'promote_member':
      await handlePromoteMember(ws, data, clientId, clients, userConnections);
      break;
      
    case 'demote_member':
      await handleDemoteMember(ws, data, clientId, clients, userConnections);
      break;
      
    case 'send_announcement':
      await handleSendAnnouncement(ws, data, clientId, clients, userConnections, groups);
      break;
      
    case 'pin_message':
      await handlePinMessage(ws, data, clientId, clients, userConnections);
      break;
      
    case 'unpin_message':
      await handleUnpinMessage(ws, data, clientId, clients, userConnections);
      break;
      
    case 'get_pinned_messages':
      await handleGetPinnedMessages(ws, data, clientId, clients);
      break;
      
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      break;
      
    case 'test':
      ws.send(JSON.stringify({ 
        type: 'test_response', 
        message: 'Server is responding to test messages',
        timestamp: Date.now() 
      }));
      break;
      
    default:
      console.warn(`Unknown message type: ${type}`);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Unknown message type',
        details: `The message type '${type}' is not supported. Supported types: authenticate, auth, get_online_users, start_conversation, send_private_message, mark_message_read, typing, add_reaction, remove_reaction, edit_message, delete_message, delete_conversation, get_private_messages, get_communities, get_community_members, get_community_progress, create_group, send_group_message, get_group_messages, get_user_groups, get_group_members, add_group_member, remove_group_member, leave_group, update_group_info, get_group_info, edit_group_message, delete_group_message, add_group_reaction, remove_group_reaction, ping, test`
      }));
  }
}

module.exports = {
  handleMessage
};
