type ChatEventHandler<T = unknown> = (payload: T) => void

export type ChatMessage = {
  type: string
  [key: string]: unknown
}

export interface ChatClientOptions {
  /**
   * Full WebSocket URL (e.g. ws://localhost:3001)
   */
  url: string
  /**
   * Function that returns the JWT token used during authentication.
   * Accepts sync or async functions; should resolve to a valid string token.
   */
  getToken: () => string | null | Promise<string | null>
  /**
   * Enable verbose logging.
   */
  
  debug?: boolean
  /**
   * Maximum number of reconnection attempts before giving up.
   * Default: 5
   */
  maxReconnectAttempts?: number
  /**
   * Initial reconnect delay in milliseconds (exponential backoff).
   * Default: 1000
   */
  reconnectBackoffMs?: number
  /**
   * Maximum reconnect delay.
   * Default: 30000
   */
  maxReconnectBackoffMs?: number
}

/**
 * Lightweight event-driven WebSocket client that handles authentication,
 * reconnection, message routing, and message queuing for the Elite chat server.
 */
export class ChatClient {
  private options: Required<ChatClientOptions>
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private isManuallyClosed = false
  private pendingMessages: ChatMessage[] = []
  private eventHandlers = new Map<string, Set<ChatEventHandler>>()

  constructor(options: ChatClientOptions) {
    this.options = {
      maxReconnectAttempts: options.maxReconnectAttempts ?? 5,
      reconnectBackoffMs: options.reconnectBackoffMs ?? 1000,
      maxReconnectBackoffMs: options.maxReconnectBackoffMs ?? 30000,
      debug: options.debug ?? false,
      ...options,
    }
  }

  /**
   * Establish the WebSocket connection (no-op on server).
   */
  connect(): void {
    if (typeof window === "undefined") {
      return
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      this.log("connect() called but socket already open/connecting")
      return
    }

    this.isManuallyClosed = false
    this.log("Connecting to chat server", this.options.url)
    this.ws = new WebSocket(this.options.url)

    this.ws.onopen = () => {
      this.log("WebSocket connected")
      this.reconnectAttempts = 0
      this.emit("connected")
      this.authenticate()
      this.flushPendingMessages()
    }

    this.ws.onmessage = (event) => {
      this.handleIncomingMessage(event.data)
    }

    this.ws.onerror = (error) => {
      this.log("WebSocket error", error)
      this.emit("error", error)
    }

    this.ws.onclose = (event) => {
      this.log("WebSocket closed", event.code, event.reason)
      this.emit("disconnected", event)
      this.ws = null

      if (!this.isManuallyClosed) {
        this.scheduleReconnect()
      }
    }
  }

  /**
   * Close the socket and prevent automatic reconnection.
   */
  disconnect(code?: number, reason?: string): void {
    this.isManuallyClosed = true
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close(code, reason)
    } else if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
      this.ws.close()
    }
    this.ws = null
  }

  /**
   * Send a message to the server. Messages are queued until the connection is open.
   */
  send(message: ChatMessage): void {
    if (!message || typeof message.type !== "string") {
      throw new Error("ChatClient.send requires a message object with a 'type' field.")
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const payload = JSON.stringify(message)
      this.ws.send(payload)
      this.log("Sent", payload)
    } else {
      this.pendingMessages.push(message)
      if (!this.ws) {
        this.connect()
      }
    }
  }

  /**
   * Convenience wrappers for common operations
   */
  getOnlineUsers(): void {
    this.send({ type: "get_online_users" })
  }

  getUserGroups(): void {
    this.send({ type: "get_user_groups" })
  }

  getGroupMembers(groupId: string): void {
    this.send({ type: "get_group_members", groupId })
  }

  startConversation(recipientId: string): void {
    this.send({ type: "start_conversation", recipientId })
  }

  getPrivateMessages(recipientId: string, limit = 50, offset = 0): void {
    this.send({ type: "get_private_messages", recipientId, limit, offset })
  }

  deleteConversation(conversationId: string, deleteForEveryone = false): void {
    this.send({
      type: "delete_conversation",
      conversationId,
      deleteForEveryone,
    })
  }

  deleteGroup(groupId: string, permanent = false): void {
    this.send({
      type: "delete_group",
      groupId,
      ...(permanent ? { permanent } : {}),
    })
  }

  getGroupMessages(groupId: string, limit = 50): void {
    this.send({ type: "get_group_messages", groupId, limit })
  }

  editPrivateMessage(messageId: string, newContent: string): void {
    this.send({ type: "edit_private_message", messageId, newContent })
  }

  deletePrivateMessage(messageId: string): void {
    this.send({ type: "delete_private_message", messageId })
  }

  sendPrivateMessage(recipientId: string, content: string, replyTo?: string): void {
    this.send({
      type: "send_private_message",
      recipientId,
      content,
      ...(replyTo ? { replyTo } : {}),
    })
  }

  editGroupMessage(messageId: string, newContent: string): void {
    this.send({
      type: "edit_group_message",
      messageId,
      newContent,
    })
  }

  deleteGroupMessage(messageId: string): void {
    this.send({
      type: "delete_group_message",
      messageId,
    })
  }

  sendGroupMessage(groupId: string, content: string, replyTo?: string): void {
    this.send({
      type: "send_group_message",
      groupId,
      content,
      ...(replyTo ? { replyTo } : {}),
    })
  }

  createGroup(
    groupName: string,
    memberUserIds: string[],
    options?: { description?: string; maxMembers?: number },
  ): void {
    const payload: ChatMessage = {
      type: "create_group",
      groupName,
      initialMembers: memberUserIds,
    }

    if (options?.description != null) {
      payload.groupDescription = options.description
    }

    if (typeof options?.maxMembers === "number") {
      payload.maxMembers = options.maxMembers
    }

    this.send(payload)
  }

  addGroupMember(groupId: string, userId: string): void {
    this.send({
      type: "add_group_member",
      groupId,
      userId,
    })
  }

  addReaction(messageId: string, emoji: string, conversationId?: string): void {
    this.send({
      type: "add_reaction",
      messageId,
      reaction: emoji,
      ...(conversationId ? { conversationId } : {}),
    })
  }

  removeReaction(messageId: string, emoji: string, conversationId?: string): void {
    this.send({
      type: "remove_reaction",
      messageId,
      reaction: emoji,
      ...(conversationId ? { conversationId } : {}),
    })
  }

  addGroupReaction(messageId: string, emoji: string): void {
    this.send({
      type: "add_group_reaction",
      messageId,
      reaction: emoji,
    })
  }

  removeGroupReaction(messageId: string, emoji: string): void {
    this.send({
      type: "remove_group_reaction",
      messageId,
      reaction: emoji,
    })
  }

  promoteGroupMember(groupId: string, userId: string): void {
    this.send({
      type: "promote_member",
      groupId,
      userId,
    })
  }

  demoteGroupMember(groupId: string, userId: string): void {
    this.send({
      type: "demote_member",
      groupId,
      userId,
    })
  }

  leaveGroup(groupId: string): void {
    this.send({
      type: "leave_group",
      groupId,
    })
  }

  sendAnnouncement(groupId: string, content: string): void {
    this.send({
      type: "send_announcement",
      groupId,
      content,
    })
  }

  pinMessage(groupId: string, messageId: string): void {
    this.send({
      type: "pin_message",
      groupId,
      messageId,
    })
  }

  unpinMessage(groupId: string, messageId: string): void {
    this.send({
      type: "unpin_message",
      groupId,
      messageId,
    })
  }

  getPinnedMessage(groupId: string): void {
    this.send({
      type: "get_pinned_messages",
      groupId,
    })
  }

  markMessageRead(messageId: string, conversationId?: string): void {
    this.send({
      type: "mark_message_read",
      messageId,
      ...(conversationId ? { conversationId } : {}),
    })
  }

  sendTypingIndicator(recipientId: string, isTyping: boolean): void {
    this.send({
      type: "typing",
      recipientId,
      isTyping,
    })
  }

  getCommunities(): void {
    this.send({ type: "get_communities" })
  }

  getCommunityMembers(communityId: string): void {
    this.send({ type: "get_community_members", communityId })
  }

  getCommunityProgress(communityId: string): void {
    this.send({ type: "get_community_progress", communityId })
  }

  /**
   * Register an event handler for a specific event type.
   */
  on<T = unknown>(eventType: string, handler: ChatEventHandler<T>): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set())
    }
    this.eventHandlers.get(eventType)?.add(handler as ChatEventHandler)
    return () => this.off(eventType, handler)
  }

  /**
   * Remove a previously registered handler.
   */
  off<T = unknown>(eventType: string, handler: ChatEventHandler<T>): void {
    this.eventHandlers.get(eventType)?.delete(handler as ChatEventHandler)
  }

  /**
   * Whether there is currently an authenticated, open WebSocket connection.
   */
  isConnected(): boolean {
    return Boolean(this.ws && this.ws.readyState === WebSocket.OPEN)
  }

  /**
   * Attempt to re-authenticate with a fresh token.
   */
  async refreshToken(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      await this.authenticate()
    }
  }

  private async authenticate(): Promise<void> {
    try {
      const token = await this.options.getToken()
      if (!token) {
        this.log("No JWT token available; authentication skipped")
        this.emit("auth_missing")
        return
      }

      this.send({ type: "authenticate", token })
    } catch (error) {
      this.log("Failed to retrieve JWT token", error)
      this.emit("auth_error", error)
    }
  }

  private flushPendingMessages(): void {
    if (!this.pendingMessages.length) return

    this.log(`Flushing ${this.pendingMessages.length} pending messages`)
    const queue = [...this.pendingMessages]
    this.pendingMessages.length = 0
    queue.forEach((message) => this.send(message))
  }

  private async handleIncomingMessage(rawData: string | ArrayBuffer | ArrayBufferView | Blob): Promise<void> {
    try {
      let textPayload: string

      if (typeof rawData === "string") {
        textPayload = rawData
      } else if (rawData instanceof Blob) {
        textPayload = await rawData.text()
      } else if (rawData instanceof ArrayBuffer) {
        textPayload = new TextDecoder().decode(rawData)
      } else if (ArrayBuffer.isView(rawData)) {
        textPayload = new TextDecoder().decode(rawData)
      } else if ((rawData as { buffer?: unknown })?.buffer instanceof ArrayBuffer) {
        textPayload = new TextDecoder().decode(new Uint8Array((rawData as { buffer: ArrayBuffer }).buffer))
      } else {
        this.log("Unsupported message payload", rawData)
        return
      }

      const message = JSON.parse(textPayload) as ChatMessage
      this.log("Received", message)
      this.emit(message.type, message)
    } catch (error) {
      this.log("Failed to parse incoming message", error)
      this.emit("error", error)
    }
  }

  private scheduleReconnect(): void {
    if (this.isManuallyClosed) {
      return
    }

    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      this.log("Max reconnect attempts reached; giving up")
      this.emit("reconnect_failed")
      return
    }

    const delay = Math.min(
      this.options.reconnectBackoffMs * Math.pow(2, this.reconnectAttempts),
      this.options.maxReconnectBackoffMs,
    )

    this.reconnectAttempts += 1
    this.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.options.maxReconnectAttempts})`)

    setTimeout(() => {
      if (!this.isManuallyClosed) {
        this.connect()
      }
    }, delay)
  }

  private emit<T = unknown>(eventType: string, payload?: T): void {
    this.eventHandlers.get(eventType)?.forEach((handler) => {
      try {
        handler(payload)
      } catch (error) {
        this.log("Error in event handler", error)
      }
    })
  }

  private log(...args: unknown[]): void {
    if (this.options.debug) {
      console.debug("[ChatClient]", ...args)
    }
  }
}

export default ChatClient

