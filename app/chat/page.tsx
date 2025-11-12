"use client"

import { MutableRefObject, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Search,
  Info,
  Send,
  Plus,
  Check,
  CheckCheck,
  MessageCircle,
  UserPlus,
  Trash2,
  Ban,
  ShieldCheck,
  Loader2,
  LogOut,
  Edit2,
  CornerDownLeft,
  Smile,
  SmilePlus,
  Pin,
  PinOff,
  MoreHorizontal,
} from "lucide-react"
import { motion } from "framer-motion"

import ChatClient from "@/lib/chat-client"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type ConversationType = {
  id: number
  type: "personal" | "group" | "community"
  name: string
  username: string
  avatar: string
  lastMessage: string
  timestamp: string
  unreadCount: number
  isOnline: boolean
  isPinned: boolean
  isMuted: boolean
  members?: number
  isOfficial?: boolean
  participantId?: string
  groupId?: string
  myRole?: string
}

type MessageEntry = {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: string
  type: "text" | "announcement"
  isRead: boolean
  rawTimestamp?: string
  pending?: boolean
  failed?: boolean
  serverId?: string
  edited?: boolean
  editedAt?: string
  deleted?: boolean
  reactions?: ReactionSummary
  isPinned?: boolean
  isAnnouncement?: boolean
  pinnedBy?: string
  pinnedAt?: string
  replyToId?: string
  replyPreview?: string
  replySender?: string
  replyTimestamp?: string
}

type MessageMap = Record<number, MessageEntry[]>

type EditingContext = {
  conversationId: number
  messageId: string
  serverId: string
  originalContent: string
}

type ReplyContext = {
  conversationId: number
  messageId: string
  serverId: string
  senderName: string
  preview: string
}

type ReactionSummary = Record<
  string,
  {
    count: number
    users: string[]
    usernames: string[]
  }
>

type CommunitySummary = {
  communityId: string
  name: string
  description?: string
  avatarUrl?: string
  defaultGroupId?: string
  role?: string
  isMuted?: boolean
}

type CommunityMember = {
  userId: string
  role?: string
  joinedAt?: string
  lastSeenAt?: string
  isMuted?: boolean
}

type CommunityProgress = {
  communityId: string
  userId: string
  totalXp: number
  dailyStreak: number
  weeklyStreak: number
  lastChallengeId?: string
  lastChallengeType?: string
  lastCompletedAt?: string
}

type CommunityProgressEvent = {
  communityId: string
  userId: string
  challengeId?: string
  challengeType?: string
  xpAwarded?: number
  occurredAt?: string
}

type GroupMemberInfo = {
  userId: string
  username?: string
  displayName?: string
  role?: string
}

type FollowerContact = {
  id: string
  username: string
  displayName: string
  avatar: string
}

type ConversationHistoryState = {
  offset: number
  hasMore: boolean
  loading: boolean
  initialLoaded: boolean
}

const PRIMARY_TOKEN_KEYS = ["chat_jwt", "elite_jwt"] as const
const LEGACY_TOKEN_KEYS = ["authToken", "accessToken", "token"] as const
const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=150&h=150&fit=crop&crop=faces"
const CONVERSATIONS_ENDPOINT = process.env.NEXT_PUBLIC_CHAT_CONVERSATIONS_URL || null
const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_BASE_URL || null
const FOLLOWERS_ENDPOINT =
  process.env.NEXT_PUBLIC_CHAT_FOLLOWERS_URL ||
  (AUTH_BASE_URL ? `${AUTH_BASE_URL.replace(/\/$/, "")}/v1/users/get_own_followers` : null)
const MESSAGE_PAGE_SIZE =
  Number.isFinite(Number(process.env.NEXT_PUBLIC_CHAT_PAGE_SIZE))
    ? Math.max(5, Number(process.env.NEXT_PUBLIC_CHAT_PAGE_SIZE))
    : 30
const HISTORY_SCROLL_THRESHOLD = 120
const QUICK_EMOJIS = ["😀", "😂", "😍", "😎", "😭", "😡", "👍", "🔥", "🎉", "💯"]
const REACTION_CHOICES = ["❤️", "👍", "😂", "🎉", "😮", "🔥", "😢"] as const
const CONVERSATION_CACHE_KEY = "elite_chat_conversation_cache_v1"

const getExistingConversationByServerId = (
  serverConversationIdMapRef: MutableRefObject<Map<string, number>>,
  conversationMapRef: MutableRefObject<Map<number, ConversationType>>,
  serverId: string,
): ConversationType | undefined => {
  const existingUiId = serverConversationIdMapRef.current.get(serverId)
  return existingUiId != null ? conversationMapRef.current.get(existingUiId) : undefined
}

const humanizeIdentifier = (value?: string, fallback: string = "Conversation"): string => {
  if (!value) return fallback
  const cleaned = value.replace(/^group[_-]/i, "").replace(/^conv[_-]/i, "")
  const withSpaces = cleaned.replace(/[_-]+/g, " ")
  return withSpaces
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

const deriveGroupDisplayName = (
  serverConversationIdMapRef: MutableRefObject<Map<string, number>>,
  conversationMapRef: MutableRefObject<Map<number, ConversationType>>,
  groupId: string,
  rawName: unknown,
): string => {
  const candidate = typeof rawName === "string" ? rawName.trim() : ""
  if (candidate.length > 0) return rawName as string
  const existing = getExistingConversationByServerId(serverConversationIdMapRef, conversationMapRef, groupId)
  if (existing?.name && existing.name.trim().length > 0) {
    return existing.name
  }
  return `Group ${humanizeIdentifier(groupId, groupId)}`
}

const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/([$?*|{}\]\\^])/g, "\\$1")}=([^;]*)`),
  )
  const value = match?.[1]
  return value ? decodeURIComponent(value) : null
}

const readTokenFromStorage = (keys: readonly string[]): string | null => {
  if (typeof window === "undefined") return null

  for (const key of keys) {
    const fromLocal = window.localStorage?.getItem(key)
    if (fromLocal) return fromLocal

    const fromSession = window.sessionStorage?.getItem(key)
    if (fromSession) return fromSession

    const fromCookie = getCookie(key)
    if (fromCookie) return fromCookie
  }

  return null
}

const clearLegacyTokens = () => {
  if (typeof window === "undefined") return

  LEGACY_TOKEN_KEYS.forEach((key) => {
    try {
      window.localStorage?.removeItem(key)
      window.sessionStorage?.removeItem(key)
      if (typeof document !== "undefined") {
        document.cookie = `${key}=; Path=/; Max-Age=0; SameSite=Lax`
      }
    } catch {
      // ignore storage cleanup errors
    }
  })
}

const resolveStoredToken = async (): Promise<string | null> => {
  const primary = readTokenFromStorage(PRIMARY_TOKEN_KEYS)
  if (primary) {
    clearLegacyTokens()
    return primary
  }

  return readTokenFromStorage(LEGACY_TOKEN_KEYS)
}

const REFRESH_ENDPOINTS = [
  process.env.NEXT_PUBLIC_CHAT_REFRESH_URL,
  process.env.NEXT_PUBLIC_AUTH_REFRESH_URL,
  typeof window !== "undefined" ? "/api/auth/refresh" : undefined,
].filter((value): value is string => Boolean(value && value.trim().length > 0))

const REFRESH_METHOD = (process.env.NEXT_PUBLIC_CHAT_REFRESH_METHOD || "POST").toUpperCase()

const attemptTokenRefresh = async (): Promise<string | null> => {
  if (typeof window === "undefined") return null

  for (const endpoint of REFRESH_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: REFRESH_METHOD === "GET" ? "GET" : "POST",
        credentials: "include",
        headers:
          REFRESH_METHOD === "GET"
            ? {}
            : {
                "Content-Type": "application/json",
              },
        body: REFRESH_METHOD === "GET" ? undefined : JSON.stringify({}),
      })

      if (!response.ok) {
        continue
      }

      let token: string | null = null
      const contentType = response.headers.get("content-type") || ""
      if (contentType.includes("application/json")) {
        const data = await response.json()
        token =
          data?.token ??
          data?.accessToken ??
          data?.access_token ??
          data?.jwt ??
          data?.chatToken ??
          null
      } else {
        const text = (await response.text())?.trim()
        if (text) {
          token = text
        }
      }

      if (token) {
        window.localStorage?.setItem("chat_jwt", token)
        return token
      }
    } catch (error) {
      console.warn("Token refresh attempt failed for endpoint", endpoint, error)
      continue
    }
  }

  return null
}


export default function ChatPage() {
  const router = useRouter()
  const chatClientRef = useRef<ChatClient | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [messageText, setMessageText] = useState("")
  const [showNewChatDialog, setShowNewChatDialog] = useState(false)
  const [activeTab, setActiveTab] = useState<"all" | "followers" | "groups" | "community">("all")
  const [showConversations, setShowConversations] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [newChatSearch, setNewChatSearch] = useState("")
  const [newChatMode, setNewChatMode] = useState<"dm" | "group">("dm")
  const [newGroupName, setNewGroupName] = useState("")
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLInputElement | null>(null)
  const conversationMapRef = useRef<Map<number, ConversationType>>(new Map())
  const messagesRef = useRef<MessageMap>({})
  const [conversationsData, setConversationsData] = useState<ConversationType[]>([])
  const [messagesData, setMessagesData] = useState<MessageMap>({})
  const serverConversationIdMapRef = useRef<Map<string, number>>(new Map())
  const uiToServerConversationIdMapRef = useRef<Map<number, string>>(new Map())
  const skipNextConversationPersistRef = useRef(false)
  const nextConversationIdRef = useRef<number>(1)
  const currentUserIdRef = useRef<string | null>(null)
  const onlineUsersRef = useRef<Record<string, boolean>>({})
  const [onlineUsersList, setOnlineUsersList] = useState<
    { id: string; username: string; displayName: string }[]
  >([])
  const lastMessageTimestampRef = useRef<Map<number, string>>(new Map())
  const selectedConversationRef = useRef<number | null>(null)
  const loadedHistoryRef = useRef<Set<number>>(new Set())
  const [statusBanner, setStatusBanner] = useState<{
    variant: "info" | "warning" | "error"
    message: string
  } | null>(null)
  const [pendingAuth, setPendingAuth] = useState(false)
  const groupMembersRef = useRef<Record<string, GroupMemberInfo[]>>({})
  const loadedGroupMembersRef = useRef<Set<string>>(new Set())
  const [groupMembersVersion, setGroupMembersVersion] = useState(0)
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false)
  const [addMemberSearch, setAddMemberSearch] = useState("")
  const [pendingGroupAction, setPendingGroupAction] = useState(false)
  const communitiesRef = useRef<CommunitySummary[]>([])
  const communityMembersRef = useRef<Record<string, CommunityMember[]>>({})
  const communityProgressRef = useRef<Record<string, CommunityProgress>>({})
  const communityEventsRef = useRef<CommunityProgressEvent[]>([])
  const pinnedMessagesRef = useRef<Record<string, MessageEntry | null>>({})
  const [pinnedMessagesVersion, setPinnedMessagesVersion] = useState(0)
  const [showGroupInfoDialog, setShowGroupInfoDialog] = useState(false)
  const [announcementText, setAnnouncementText] = useState("")
  const [editingContext, setEditingContext] = useState<EditingContext | null>(null)
  const editingContextRef = useRef<EditingContext | null>(null)
  const [replyContext, setReplyContext] = useState<ReplyContext | null>(null)
  const replyContextRef = useRef<ReplyContext | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [hoveredMessageTarget, setHoveredMessageTarget] = useState<{
    conversationId: number
    messageId: string
  } | null>(null)
  const [reactionMenuTarget, setReactionMenuTarget] = useState<{
    conversationId: number
    messageId: string
  } | null>(null)
  const [followers, setFollowers] = useState<FollowerContact[]>([])
  const [followersLoading, setFollowersLoading] = useState(false)
  const historyStateRef = useRef<Map<string, ConversationHistoryState>>(new Map())
  const [historyStateVersion, setHistoryStateVersion] = useState(0)
  const messagesContainerRef = useRef<HTMLDivElement | null>(null)
  const pendingScrollAdjustmentRef = useRef<{
    conversationId: number
    previousHeight: number
    previousScrollTop: number
  } | null>(null)
  const [showInfoDialog, setShowInfoDialog] = useState(false)
  const [infoActionPending, setInfoActionPending] = useState(false)

  const ensureHistoryState = useCallback((serverConversationId: string): ConversationHistoryState => {
    const existing = historyStateRef.current.get(serverConversationId)
    if (existing) return existing
    const initial: ConversationHistoryState = {
      offset: 0,
      hasMore: true,
      loading: false,
      initialLoaded: false,
    }
    historyStateRef.current.set(serverConversationId, initial)
    return initial
  }, [])

  const updateHistoryState = useCallback(
    (
      serverConversationId: string,
      updater: (previous: ConversationHistoryState) => ConversationHistoryState,
    ) => {
      const previous = ensureHistoryState(serverConversationId)
      const next = updater(previous)
      historyStateRef.current.set(serverConversationId, next)
      setHistoryStateVersion((value) => value + 1)
    },
    [ensureHistoryState],
  )

  const getHistoryState = useCallback(
    (serverConversationId: string): ConversationHistoryState | undefined => {
      return historyStateRef.current.get(serverConversationId)
    },
    [],
  )

  const persistConversationCache = useCallback(() => {
    if (typeof window === "undefined") return
    if (skipNextConversationPersistRef.current) {
      skipNextConversationPersistRef.current = false
      return
    }

    const activeUserId = currentUserIdRef.current
    if (!activeUserId) return
    if (conversationMapRef.current.size === 0) return

    try {
      const payload = {
        conversations: Array.from(conversationMapRef.current.entries()),
        serverToUi: Array.from(serverConversationIdMapRef.current.entries()),
        uiToServer: Array.from(uiToServerConversationIdMapRef.current.entries()),
        lastMessageTimestamps: Array.from(lastMessageTimestampRef.current.entries()),
      }

      const existingRaw = window.localStorage.getItem(CONVERSATION_CACHE_KEY)
      const existing =
        existingRaw && existingRaw.trim().length > 0 ? JSON.parse(existingRaw) : {}

      existing[String(activeUserId)] = payload
      window.localStorage.setItem(CONVERSATION_CACHE_KEY, JSON.stringify(existing))
    } catch (error) {
      console.warn("Failed to persist conversation cache", error)
    }
  }, [])

  const refreshConversations = useCallback(() => {
    const conversations = Array.from(conversationMapRef.current.values()).sort((a, b) => {
      const timeA = lastMessageTimestampRef.current.get(a.id)
      const timeB = lastMessageTimestampRef.current.get(b.id)
      if (!timeA && !timeB) return 0
      if (!timeB) return -1
      if (!timeA) return 1
      return new Date(timeB).getTime() - new Date(timeA).getTime()
    })
    setConversationsData(conversations)
    persistConversationCache()
  }, [persistConversationCache])

  const refreshMessages = useCallback(() => {
    const clone: MessageMap = {}
    for (const [key, value] of Object.entries(messagesRef.current)) {
      clone[Number(key)] = value.map((message) => ({ ...message }))
    }
    setMessagesData(clone)
  }, [])

  const restoreConversationsFromCache = useCallback((): boolean => {
    if (typeof window === "undefined") return false

    const activeUserId = currentUserIdRef.current
    if (!activeUserId) return false

    try {
      const existingRaw = window.localStorage.getItem(CONVERSATION_CACHE_KEY)
      if (!existingRaw || existingRaw.trim().length === 0) return false

      const store = JSON.parse(existingRaw)
      const payload = store?.[String(activeUserId)]
      if (!payload) return false

      const conversationEntries = Array.isArray(payload.conversations)
        ? payload.conversations.map(([key, value]: [number, ConversationType]) => [
            Number(key),
            value as ConversationType,
          ])
        : []
      conversationMapRef.current = new Map<number, ConversationType>(conversationEntries)
      serverConversationIdMapRef.current = new Map(
        Array.isArray(payload.serverToUi)
          ? payload.serverToUi.map(([serverId, uiId]: [string, number]) => [
              String(serverId),
              Number(uiId),
            ])
          : [],
      )
      uiToServerConversationIdMapRef.current = new Map(
        Array.isArray(payload.uiToServer)
          ? payload.uiToServer.map(([uiId, serverId]: [number, string]) => [
              Number(uiId),
              String(serverId),
            ])
          : [],
      )
      lastMessageTimestampRef.current = new Map(
        Array.isArray(payload.lastMessageTimestamps)
          ? payload.lastMessageTimestamps.map(([uiId, timestamp]: [number, string]) => [
              Number(uiId),
              String(timestamp),
            ])
          : [],
      )

      if (conversationMapRef.current.size === 0) {
        return false
      }

      const maxId = Math.max(...conversationMapRef.current.keys())
      if (Number.isFinite(maxId)) {
        nextConversationIdRef.current = Math.max(nextConversationIdRef.current, maxId + 1)
      }

      skipNextConversationPersistRef.current = true
      refreshConversations()
      return true
    } catch (error) {
      console.warn("Failed to restore cached conversations", error)
      return false
    }
  }, [refreshConversations])

  const formatRelativeTime = useCallback((iso?: string) => {
    if (!iso) return ""
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return ""
    const diffMs = Date.now() - date.getTime()
    if (diffMs < 60_000) return "Just now"
    if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m`
    if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h`
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
  }, [])

  const formatMessageTime = useCallback((iso?: string) => {
    if (!iso) return ""
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return ""
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
  }, [])

  const resolveParticipantInfo = useCallback((payload: any, fallbackName = "Unknown") => {
    const senderId = payload?.senderId ?? payload?.sender_id
    const senderUsername = payload?.senderUsername ?? payload?.username
    const recipientId = payload?.recipientId ?? payload?.recipient_id
    const recipientUsername = payload?.recipientUsername ?? payload?.recipient_username
    const currentUserId = currentUserIdRef.current

    if (currentUserId && senderId != null && String(senderId) === currentUserId) {
      const id = recipientId != null ? String(recipientId) : undefined
      const username = recipientUsername ?? id ?? fallbackName
      return { id, username, displayName: username }
    }

    const id = senderId != null ? String(senderId) : undefined
    const username = senderUsername ?? id ?? fallbackName
    return { id, username, displayName: username }
  }, [])

  const upsertConversationFromServer = useCallback((
    serverConversationId: string,
    data: Partial<ConversationType> & {
      name?: string
      username?: string
      participantId?: string
      groupId?: string
      displayName?: string
    },
  ) => {
    let uiId = serverConversationIdMapRef.current.get(serverConversationId)
    if (!uiId) {
      uiId = nextConversationIdRef.current++
      serverConversationIdMapRef.current.set(serverConversationId, uiId)
    }
    uiToServerConversationIdMapRef.current.set(uiId, serverConversationId)

    const existing = conversationMapRef.current.get(uiId)
    const preferredName =
      data.displayName ??
      data.name ??
      data.username ??
      existing?.name ??
      humanizeIdentifier(serverConversationId, `Conversation ${uiId}`)

    const preferredUsername =
      data.username ??
      data.displayName ??
      existing?.username ??
      humanizeIdentifier(serverConversationId, `user-${uiId}`)

    const updated: ConversationType = {
      id: uiId,
      type: data.type ?? existing?.type ?? "personal",
      name: preferredName,
      username: preferredUsername,
      avatar: data.avatar ?? existing?.avatar ?? DEFAULT_AVATAR,
      lastMessage: data.lastMessage ?? existing?.lastMessage ?? "",
      timestamp: data.timestamp ?? existing?.timestamp ?? "",
      unreadCount: data.unreadCount ?? existing?.unreadCount ?? 0,
      isOnline: data.isOnline ?? existing?.isOnline ?? false,
      isPinned: data.isPinned ?? existing?.isPinned ?? false,
      isMuted: data.isMuted ?? existing?.isMuted ?? false,
      members: data.members ?? existing?.members,
      isOfficial: data.isOfficial ?? existing?.isOfficial,
      participantId: data.participantId ?? existing?.participantId,
      groupId: data.groupId ?? existing?.groupId,
      myRole: data.myRole ?? existing?.myRole,
    }

    conversationMapRef.current.set(uiId, updated)
    return updated
  }, [])

  const resolveUiConversationId = useCallback(
    (serverConversationId: string): number | null => {
      if (!serverConversationId) return null
      const key = String(serverConversationId)
      const existing = serverConversationIdMapRef.current.get(key)
      if (typeof existing === "number") {
        return existing
      }
      const conversation = upsertConversationFromServer(key, {
        name: `Conversation ${key}`,
        username: `conversation-${key}`,
      })
      return conversation?.id ?? null
    },
    [upsertConversationFromServer],
  )

  const updateConversationPreviewFromMessages = useCallback(
    (conversationId: number) => {
      const conversation = conversationMapRef.current.get(conversationId)
      if (!conversation) return

      const messages = messagesRef.current[conversationId] ?? []
      const lastMessage = messages[messages.length - 1]

      if (lastMessage) {
        let preview: string
        if (lastMessage.deleted) {
          preview =
            lastMessage.senderId === "me"
              ? "You deleted a message"
              : `${lastMessage.senderName ?? "Someone"} deleted a message`
        } else if (lastMessage.senderId === "me") {
          preview = `You: ${lastMessage.content}`
        } else {
          preview = `${lastMessage.senderName}: ${lastMessage.content}`
        }

        conversationMapRef.current.set(conversationId, {
          ...conversation,
          lastMessage: preview,
          timestamp: formatRelativeTime(lastMessage.rawTimestamp),
        })

        if (lastMessage.rawTimestamp) {
          lastMessageTimestampRef.current.set(conversationId, lastMessage.rawTimestamp)
        }
      } else {
        conversationMapRef.current.set(conversationId, {
          ...conversation,
          lastMessage: "",
        })
      }

      refreshConversations()
    },
    [formatRelativeTime, refreshConversations],
  )

  const applyMessageUpdate = useCallback(
    (
      serverConversationId: string,
      messageId: string,
      updater: (message: MessageEntry, messages: MessageEntry[]) => MessageEntry | null,
    ): number | null => {
      if (!serverConversationId || !messageId) return null
      const uiConversationId = resolveUiConversationId(serverConversationId)
      if (uiConversationId == null) return null

      const messages = messagesRef.current[uiConversationId]
      if (!messages || messages.length === 0) return uiConversationId

      const index = messages.findIndex(
        (entry) => entry.id === String(messageId) || entry.serverId === String(messageId),
      )
      if (index === -1) return uiConversationId

      const currentMessage = messages[index]
      if (!currentMessage) return uiConversationId
      const nextMessage = updater(currentMessage, messages)

      if (nextMessage === null) {
        messagesRef.current[uiConversationId] = [
          ...messages.slice(0, index),
          ...messages.slice(index + 1),
        ]
      } else {
        const clone = [...messages]
        clone[index] = nextMessage
        messagesRef.current[uiConversationId] = clone
      }

      refreshMessages()
      return uiConversationId
    },
    [refreshMessages, resolveUiConversationId],
  )

  const applyReactionUpdate = useCallback(
    (
      serverConversationId: string,
      messageId: string,
      emoji: string,
      userId: string,
      username: string,
      action: "add" | "remove",
    ) => {
      if (!emoji || !userId) return
      applyMessageUpdate(serverConversationId, messageId, (message) => {
        if (message.deleted) {
          return message
        }

        const reactions: ReactionSummary = { ...(message.reactions ?? {}) }

        // Always purge this user's entries from every emoji before applying updates.
        for (const [emojiKey, summary] of Object.entries(reactions)) {
          const baseUsers: string[] = summary?.users ? [...summary.users] : []
          const baseUsernames: string[] = summary?.usernames ? [...summary.usernames] : []
          const filtered = baseUsers
            .map((id, index) => ({
              id,
              username: baseUsernames[index] ?? id,
            }))
            .filter((entry) => entry.id !== userId)

          if (filtered.length === 0) {
            delete reactions[emojiKey]
          } else {
            reactions[emojiKey] = {
              count: filtered.length,
              users: filtered.map((entry) => entry.id),
              usernames: filtered.map((entry) => entry.username),
            }
          }
        }

        const existing = reactions[emoji]

        if (action === "add") {
          const baseUsers: string[] = existing?.users ? [...existing.users] : []
          const baseUsernames: string[] = existing?.usernames ? [...existing.usernames] : []
          const entries: Array<{ id: string; username: string }> = baseUsers.map((id, index) => ({
            id,
            username: baseUsernames[index] ?? id,
          }))

          const existingIndex = entries.findIndex((entry) => entry.id === userId)
          if (existingIndex !== -1) {
            const existingEntry = entries[existingIndex]
            if (existingEntry) {
              entries[existingIndex] = {
                id: existingEntry.id,
                username,
              }
            }
          } else {
            entries.push({ id: userId, username })
          }

          reactions[emoji] = {
            count: entries.length,
            users: entries.map((entry) => entry.id),
            usernames: entries.map((entry) => entry.username),
          }
        } else if (action === "remove") {
          // Removal already handled by global purge.
        }

        return { ...message, reactions }
      })
    },
    [applyMessageUpdate],
  )

  const removeConversationFromState = useCallback(
    (serverConversationId: string, options?: { deleteForEveryone?: boolean; suppressBanner?: boolean }) => {
      if (!serverConversationId) return
      const uiConversationId = serverConversationIdMapRef.current.get(String(serverConversationId))
      if (uiConversationId == null) return

      const wasSelected = selectedConversationRef.current === uiConversationId

      conversationMapRef.current.delete(uiConversationId)
      serverConversationIdMapRef.current.delete(String(serverConversationId))
      uiToServerConversationIdMapRef.current.delete(uiConversationId)
      delete messagesRef.current[uiConversationId]
      lastMessageTimestampRef.current.delete(uiConversationId)
      loadedHistoryRef.current.delete(uiConversationId)
      historyStateRef.current.delete(String(serverConversationId))
      setHistoryStateVersion((value) => value + 1)

      refreshMessages()
      refreshConversations()

      if (wasSelected) {
        setSelectedConversation(null)
        selectedConversationRef.current = null
        if (!options?.suppressBanner) {
          setStatusBanner({
            variant: "info",
            message: options?.deleteForEveryone
              ? "Conversation deleted for all participants."
              : "Conversation removed from your inbox.",
          })
        }
      }
    },
    [refreshConversations, refreshMessages, setSelectedConversation, setStatusBanner],
  )

  const handleGroupMembers = useCallback(
    (payload: any) => {
      const groupIdRaw = payload?.groupId ?? payload?.group_id ?? payload?.id
      if (!groupIdRaw) return
      const groupId = String(groupIdRaw)

      const membersRaw = Array.isArray(payload?.members) ? payload.members : []
      const normalized: GroupMemberInfo[] = membersRaw
        .map((member: any) => {
          const userId = member?.userId ?? member?.user_id ?? member?.id ?? member?.username
          if (!userId) return null
          return {
            userId: String(userId),
            username: member?.username ?? member?.displayName ?? member?.name ?? undefined,
            displayName: member?.displayName ?? member?.username ?? undefined,
            role: member?.role ?? member?.membershipRole ?? undefined,
          }
        })
        .filter(
          (member: GroupMemberInfo | null): member is GroupMemberInfo => member !== null,
        )

      groupMembersRef.current[groupId] = normalized
      setGroupMembersVersion((value) => value + 1)

      const memberCount = normalized.length
      if (memberCount > 0) {
        const conversationRecord = upsertConversationFromServer(groupId, {
          members: memberCount,
        })
        if (conversationRecord) {
          refreshConversations()
        }
      }
    },
    [refreshConversations, upsertConversationFromServer],
  )

  const handleGroupMemberDelta = useCallback(
    (payload: any, delta: 1 | -1) => {
      const groupIdRaw = payload?.groupId ?? payload?.group_id ?? payload?.id
      const userIdRaw = payload?.userId ?? payload?.user_id ?? payload?.memberId ?? payload?.member_id
      if (!groupIdRaw || !userIdRaw) return

      const groupId = String(groupIdRaw)
      const userId = String(userIdRaw)

      const existingMembers = groupMembersRef.current[groupId] ?? []
      if (delta === 1) {
        const username = payload?.username ?? payload?.displayName ?? undefined
        const updated = [...existingMembers]
        if (!updated.some((member) => member.userId === userId)) {
          updated.push({
            userId,
            username,
            displayName: username,
            role: payload?.role ?? undefined,
          })
          groupMembersRef.current[groupId] = updated
          setGroupMembersVersion((value) => value + 1)
        }
      } else {
        const updated = existingMembers.filter((member) => member.userId !== userId)
        groupMembersRef.current[groupId] = updated
        setGroupMembersVersion((value) => value + 1)
      }

      if (userId === currentUserIdRef.current) {
        removeConversationFromState(groupId, { suppressBanner: true })
        setStatusBanner({
          variant: "info",
          message: delta < 0 ? "You left the group." : "You joined the group.",
        })
        return
      }

      const uiConversationId = resolveUiConversationId(groupId)
      if (uiConversationId != null) {
        const conversation = conversationMapRef.current.get(uiConversationId)
        const currentCount = conversation?.members ?? existingMembers.length
        upsertConversationFromServer(groupId, {
          members: Math.max(0, currentCount + delta),
        })
        refreshConversations()
      }
    },
    [removeConversationFromState, refreshConversations, resolveUiConversationId, setStatusBanner, upsertConversationFromServer],
  )

  const handleMemberAdded = useCallback(
    (payload: any) => {
      handleGroupMemberDelta(payload, 1)
    },
    [handleGroupMemberDelta],
  )

  const handleMemberRemoved = useCallback(
    (payload: any) => {
      handleGroupMemberDelta(payload, -1)
    },
    [handleGroupMemberDelta],
  )

  const handleGroupDeleted = useCallback(
    (payload: any) => {
      const groupIdRaw = payload?.groupId ?? payload?.group_id ?? payload?.id
      if (!groupIdRaw) return

      const groupId = String(groupIdRaw)
      pinnedMessagesRef.current[groupId] = null
      setPinnedMessagesVersion((value) => value + 1)

      removeConversationFromState(groupId, {
        deleteForEveryone: true,
        suppressBanner: true,
      })

      const isPermanent = Boolean(payload?.permanent)
      const message =
        payload?.message ??
        (isPermanent
          ? "Group deleted permanently."
          : "Group deleted. Owners can restore within 30 days.")

      setStatusBanner({
        variant: "info",
        message,
      })
    },
    [removeConversationFromState, setStatusBanner],
  )

  const updateMemberRole = useCallback(
    (groupId: string, userId: string, newRole: string) => {
      const members = groupMembersRef.current[groupId] ?? []
      let changed = false
      groupMembersRef.current[groupId] = members.map((member) => {
        if (member.userId === userId) {
          changed = true
          return { ...member, role: newRole }
        }
        return member
      })
      if (changed) {
        setGroupMembersVersion((value) => value + 1)
      }

      const currentUserId = currentUserIdRef.current
      if (currentUserId && userId === currentUserId) {
        const uiConversationId = serverConversationIdMapRef.current.get(groupId)
        if (uiConversationId != null) {
          const existing = conversationMapRef.current.get(uiConversationId)
          if (existing && existing.myRole !== newRole) {
            conversationMapRef.current.set(uiConversationId, { ...existing, myRole: newRole })
            refreshConversations()
          }
        }
      }
    },
    [refreshConversations],
  )

  const handleMemberPromoted = useCallback(
    (payload: any) => {
      const groupIdRaw = payload?.groupId ?? payload?.group_id
      const userIdRaw = payload?.userId ?? payload?.user_id
      if (!groupIdRaw || !userIdRaw) return
      const groupId = String(groupIdRaw)
      const userId = String(userIdRaw)
      updateMemberRole(groupId, userId, "admin")
      setStatusBanner({
        variant: "info",
        message: "Member promoted to admin.",
      })
    },
    [setStatusBanner, updateMemberRole],
  )

  const handleMemberDemoted = useCallback(
    (payload: any) => {
      const groupIdRaw = payload?.groupId ?? payload?.group_id
      const userIdRaw = payload?.userId ?? payload?.user_id
      if (!groupIdRaw || !userIdRaw) return
      const groupId = String(groupIdRaw)
      const userId = String(userIdRaw)
      updateMemberRole(groupId, userId, "member")
      setStatusBanner({
        variant: "info",
        message: "Member demoted to participant.",
      })
    },
    [setStatusBanner, updateMemberRole],
  )

  const parseReactions = useCallback((raw: any): ReactionSummary | undefined => {
    if (!raw) return undefined

    let entries: any[] = []
    if (Array.isArray(raw)) {
      entries = raw
    } else if (typeof raw === "object" && raw !== null) {
      const record = raw as Record<string, unknown>
      entries = Object.keys(record).map((emojiKey) => {
        const entryValue: unknown = record[emojiKey]
        const details =
          entryValue && typeof entryValue === "object"
            ? (entryValue as Record<string, unknown>)
            : {}
        return {
          emoji: emojiKey,
          ...details,
        }
      })
    }

    const summary: ReactionSummary = {}

    entries.forEach((entry) => {
      const emoji = entry?.emoji ?? entry?.name ?? entry?.key
      if (!emoji) return

      const usersRaw: any[] = Array.isArray(entry?.users)
        ? entry.users
        : Array.isArray(entry?.userIds)
        ? entry.userIds
        : Array.isArray(entry?.user_ids)
        ? entry.user_ids
        : []

      const usernamesRaw: any[] = Array.isArray(entry?.usernames)
        ? entry.usernames
        : Array.isArray(entry?.users)
        ? entry.users
        : []

      const users = usersRaw
        .map((value) => {
          if (typeof value === "string" || typeof value === "number") {
            return String(value)
          }
          if (value?.userId ?? value?.user_id) {
            return String(value.userId ?? value.user_id)
          }
          if (value?.id) {
            return String(value.id)
          }
          return null
        })
        .filter((value): value is string => Boolean(value))

      const usernames = usernamesRaw
        .map((value) => {
          if (typeof value === "string") {
            return value
          }
          return value?.username ?? value?.displayName ?? value?.name ?? null
        })
        .filter((value): value is string => Boolean(value))

      const count = Number(entry?.count ?? entry?.total ?? users.length ?? 0)

      if (users.length === 0 && count <= 0) {
        return
      }

      summary[String(emoji)] = {
        count: users.length > 0 ? users.length : count,
        users,
        usernames: usernames.length > 0 ? usernames : users,
      }
    })

    return Object.keys(summary).length ? summary : undefined
  }, [])

  const toMessageEntry = useCallback(
    (raw: any, participantName: string): MessageEntry => {
      const messageId =
        String(raw?.id ?? raw?.messageId ?? raw?.message_id ?? crypto.randomUUID?.() ?? Date.now())
      const currentUserId = currentUserIdRef.current
      const senderIdRaw = raw?.senderId ?? raw?.sender_id ?? raw?.sender?.id
      const isCurrentUser =
        currentUserId != null && senderIdRaw != null && String(senderIdRaw) === currentUserId
      const rawTimestamp =
        raw?.timestamp ??
        raw?.createdAt ??
        raw?.created_at ??
        raw?.sentAt ??
        raw?.sent_at ??
        new Date().toISOString()
      const isAnnouncement = Boolean(raw?.isAnnouncement ?? raw?.is_announcement)
      const isPinned = Boolean(raw?.isPinned ?? raw?.is_pinned)
      const pinnedBy =
        raw?.pinnedBy ??
        raw?.pinned_by ??
        raw?.pinnedByUserId ??
        raw?.pinned_by_user_id ??
        undefined
      const pinnedAt = raw?.pinnedAt ?? raw?.pinned_at ?? undefined

      let replyToId: string | undefined
      let replyPreview: string | undefined
      let replySender: string | undefined
      let replyTimestamp: string | undefined

      const replyPayload =
        raw?.replyTo ??
        raw?.reply_to ??
        raw?.reply ??
        raw?.replyContext ??
        raw?.reply_context ??
        (raw?.replyToMessageId != null ? raw : undefined)

      if (replyPayload) {
        if (typeof replyPayload === "string" || typeof replyPayload === "number") {
          replyToId = String(replyPayload)
        } else if (typeof replyPayload === "object") {
          replyToId =
            replyPayload?.messageId ??
            replyPayload?.message_id ??
            replyPayload?.id ??
            replyPayload?.replyTo ??
            undefined
          replyPreview =
            typeof replyPayload?.content === "string"
              ? replyPayload.content
              : typeof replyPayload?.message === "string"
              ? replyPayload.message
              : undefined
          replySender =
            replyPayload?.username ??
            replyPayload?.senderName ??
            replyPayload?.sender_username ??
            replyPayload?.author ??
            undefined
          replyTimestamp =
            replyPayload?.timestamp ??
            replyPayload?.sentAt ??
            replyPayload?.sent_at ??
            replyPayload?.createdAt ??
            replyPayload?.created_at ??
            undefined
        }
      }

      if (!replyToId) {
        const fallbackId =
          raw?.replyToMessageId ??
          raw?.reply_to_message_id ??
          raw?.replyMessageId ??
          raw?.reply_to ??
          raw?.replyTargetId
        if (fallbackId != null) {
          replyToId = String(fallbackId)
        }
      }

      const reactions = parseReactions(raw?.reactions)
      const deleted = Boolean(raw?.isDeleted ?? raw?.deleted ?? raw?.is_removed)
      const edited = Boolean(raw?.isEdited ?? raw?.edited ?? raw?.is_updated)
      const serverMessageIdRaw = raw?.messageId ?? raw?.message_id ?? raw?.id
      const serverMessageId = serverMessageIdRaw != null ? String(serverMessageIdRaw) : messageId

      return {
        id: messageId,
        senderId: isCurrentUser ? "me" : String(senderIdRaw ?? participantName ?? ""),
        senderName: isCurrentUser
          ? "You"
          : raw?.senderName ?? raw?.senderUsername ?? participantName ?? "Unknown",
        content: raw?.content ?? raw?.message ?? "",
        timestamp: formatMessageTime(rawTimestamp),
        rawTimestamp,
        type: raw?.type === "announcement" ? "announcement" : "text",
        isRead: Boolean(raw?.isRead ?? raw?.is_read ?? isCurrentUser),
        serverId: serverMessageId,
        edited,
        deleted,
        reactions,
        isPinned,
        isAnnouncement,
        pinnedBy: pinnedBy != null ? String(pinnedBy) : undefined,
        pinnedAt: typeof pinnedAt === "string" ? pinnedAt : undefined,
        replyToId: replyToId ? String(replyToId) : undefined,
        replyPreview,
        replySender,
        replyTimestamp: replyTimestamp ? String(replyTimestamp) : undefined,
      }
    },
    [formatMessageTime, parseReactions],
  )

  const handlePinnedMessage = useCallback(
    (payload: any) => {
      const groupIdRaw = payload?.groupId ?? payload?.group_id
      if (!groupIdRaw) return
      const groupId = String(groupIdRaw)
      const messagePayload = payload?.message
      if (!messagePayload) {
        pinnedMessagesRef.current[groupId] = null
        setPinnedMessagesVersion((value) => value + 1)
        return
      }

      const conversation = getExistingConversationByServerId(
        serverConversationIdMapRef,
        conversationMapRef,
        groupId,
      )
      const entry = toMessageEntry(
        {
          ...messagePayload,
          id: messagePayload?.messageId ?? messagePayload?.id,
          messageId: messagePayload?.messageId ?? messagePayload?.id,
          senderId: messagePayload?.senderId ?? messagePayload?.sender_id,
          senderUsername: messagePayload?.senderUsername ?? messagePayload?.username,
          timestamp:
            messagePayload?.createdAt ??
            messagePayload?.created_at ??
            messagePayload?.pinnedAt ??
            messagePayload?.pinned_at ??
            new Date().toISOString(),
    isPinned: true,
          isAnnouncement: Boolean(messagePayload?.isAnnouncement ?? messagePayload?.is_announcement),
          pinnedAt: messagePayload?.pinnedAt ?? messagePayload?.pinned_at ?? new Date().toISOString(),
          pinnedBy: messagePayload?.pinnedBy ?? messagePayload?.pinned_by ?? undefined,
        },
        conversation?.name ?? `Group ${humanizeIdentifier(groupId, groupId)}`,
      )
      entry.isPinned = true
      pinnedMessagesRef.current[groupId] = entry
      setPinnedMessagesVersion((value) => value + 1)
    },
    [conversationMapRef, serverConversationIdMapRef, toMessageEntry],
  )


  const handleMessagePinned = useCallback(
    (payload: any) => {
      const groupIdRaw = payload?.groupId ?? payload?.group_id
      const messageIdRaw = payload?.messageId ?? payload?.message_id
      if (!groupIdRaw || !messageIdRaw) return
      const groupId = String(groupIdRaw)
      const messageId = String(messageIdRaw)

      applyMessageUpdate(groupId, messageId, (message) => ({
        ...message,
    isPinned: true,
      }))
      setPinnedMessagesVersion((value) => value + 1)
      chatClientRef.current?.getPinnedMessage(groupId)
    },
    [applyMessageUpdate, setPinnedMessagesVersion],
  )

  const handleMessageUnpinned = useCallback(
    (payload: any) => {
      const groupIdRaw = payload?.groupId ?? payload?.group_id
      const messageIdRaw = payload?.messageId ?? payload?.message_id
      if (!groupIdRaw || !messageIdRaw) return
      const groupId = String(groupIdRaw)
      const messageId = String(messageIdRaw)

      applyMessageUpdate(groupId, messageId, (message) => ({
        ...message,
    isPinned: false,
      }))
      pinnedMessagesRef.current[groupId] = null
      setPinnedMessagesVersion((value) => value + 1)
    },
    [applyMessageUpdate],
  )

  const markConversationMessagesRead = useCallback(
    (conversationId: number) => {
      const conversation = conversationMapRef.current.get(conversationId)
      if (!conversation) return

      const messages = messagesRef.current[conversationId]
      if (!messages || messages.length === 0) return

      const messageIdsToMark: string[] = []
      let changed = false
      const updated = messages.map((message) => {
        if (!message.isRead && message.senderId !== "me") {
          changed = true
          messageIdsToMark.push(message.serverId ?? message.id)
          return { ...message, isRead: true }
        }
        return message
      })

      if (changed) {
        messagesRef.current[conversationId] = updated
        refreshMessages()
      }

      if (conversation.unreadCount !== 0) {
        conversationMapRef.current.set(conversationId, { ...conversation, unreadCount: 0 })
        refreshConversations()
      }

      if (conversation.type !== "group") {
        const serverConversationId = uiToServerConversationIdMapRef.current.get(conversationId)
        const client = chatClientRef.current
        if (client && messageIdsToMark.length > 0) {
          messageIdsToMark.forEach((messageId) => client.markMessageRead(messageId, serverConversationId))
        }
      }
    },
    [refreshConversations, refreshMessages],
  )

  const handleMessageMarkedRead = (payload: any) => {
    const serverConversationIdRaw =
      payload?.conversationId ?? payload?.conversation_id ?? payload?.convId ?? payload?.conversation
    const messageIdRaw = payload?.messageId ?? payload?.message_id ?? payload?.id
    if (!serverConversationIdRaw || !messageIdRaw) return

    const serverConversationId = String(serverConversationIdRaw)
    const messageId = String(messageIdRaw)

    const uiConversationId = applyMessageUpdate(serverConversationId, messageId, (message) => {
      if (message.isRead) return message
      return { ...message, isRead: true }
    })

    if (uiConversationId != null) {
      const messages = messagesRef.current[uiConversationId] ?? []
      const hasUnread = messages.some((entry) => entry.senderId !== "me" && !entry.isRead)
      if (!hasUnread) {
        const snapshot = conversationMapRef.current.get(uiConversationId)
        if (snapshot && snapshot.unreadCount !== 0) {
          conversationMapRef.current.set(uiConversationId, { ...snapshot, unreadCount: 0 })
          refreshConversations()
        }
      }
    }
  }

  const handleMessageReadNotification = (payload: any) => {
    const messageIdRaw = payload?.messageId ?? payload?.message_id ?? payload?.id
    if (!messageIdRaw) return
    const messageId = String(messageIdRaw)

    let serverConversationId: string | null = null

    for (const [serverId, uiId] of serverConversationIdMapRef.current.entries()) {
      const messages = messagesRef.current[uiId]
      if (!messages || messages.length === 0) {
        continue
      }

      const found = messages.some(
        (entry) => entry.id === messageId || entry.serverId === messageId,
      )

      if (found) {
        serverConversationId = serverId
        break
      }
    }

    if (!serverConversationId) return

    applyMessageUpdate(serverConversationId, messageId, (message) => {
      if (message.senderId !== "me" || message.isRead) {
        return message
      }
      return { ...message, isRead: true }
    })
  }

  const processIncomingGroupMessage = useCallback(
    (payload: any) => {
      const messagePayload = payload?.message ?? payload
      const groupId = messagePayload?.groupId ?? payload?.groupId
      if (!groupId) return

      const displayName = deriveGroupDisplayName(
        serverConversationIdMapRef,
        conversationMapRef,
        String(groupId),
        payload?.groupName ?? payload?.group_name ?? payload?.name,
      )

      const conversation = upsertConversationFromServer(String(groupId), {
    type: "group",
        name: displayName,
        username: displayName,
        groupId: String(groupId),
      })

      const messageEntry = toMessageEntry(
        {
          ...messagePayload,
          senderName:
            messagePayload?.username ?? messagePayload?.senderName ?? messagePayload?.senderUsername,
          replyTo:
            messagePayload?.replyTo ??
            messagePayload?.reply_to ??
            payload?.replyTo ??
            payload?.reply_to ??
            null,
        },
        messagePayload?.username ?? conversation.name,
      )

      const existingMessages = messagesRef.current[conversation.id] ?? []
      if (messageEntry.senderId === "me") {
        const pendingIndex = existingMessages.findIndex(
          (entry) => entry.pending && entry.senderId === "me",
        )
        if (pendingIndex !== -1) {
          const updatedMessages = [...existingMessages]
          updatedMessages[pendingIndex] = {
            ...messageEntry,
            pending: false,
            failed: false,
          }
          messagesRef.current[conversation.id] = updatedMessages
        } else {
          messagesRef.current[conversation.id] = [...existingMessages, messageEntry]
        }
      } else {
        messagesRef.current[conversation.id] = [...existingMessages, messageEntry]
      }
      refreshMessages()

      const conversationSnapshot = conversationMapRef.current.get(conversation.id) ?? conversation
      const isActiveConversation = selectedConversationRef.current === conversation.id
      const unreadCount =
        messageEntry.senderId !== "me" && !isActiveConversation
          ? (conversationSnapshot.unreadCount ?? 0) + 1
          : conversationSnapshot.unreadCount ?? 0

      conversationMapRef.current.set(conversation.id, {
        ...conversationSnapshot,
        unreadCount,
      })

      if (messageEntry.senderId !== "me" && isActiveConversation) {
        markConversationMessagesRead(conversation.id)
      } else {
        refreshConversations()
      }

      lastMessageTimestampRef.current.set(
        conversation.id,
        messageEntry.rawTimestamp ?? new Date().toISOString(),
      )
      updateConversationPreviewFromMessages(conversation.id)
    },
    [
      deriveGroupDisplayName,
      markConversationMessagesRead,
      refreshConversations,
      refreshMessages,
      toMessageEntry,
      upsertConversationFromServer,
      updateConversationPreviewFromMessages,
    ],
  )

  const handleAnnouncement = useCallback(
    (payload: any) => {
      const groupIdRaw = payload?.groupId ?? payload?.group_id
      if (!groupIdRaw) return
      const groupId = String(groupIdRaw)

      const announcementPayload = {
        ...payload,
        id: payload?.messageId ?? payload?.id ?? `announcement_${Date.now()}`,
        messageId: payload?.messageId ?? payload?.id,
        groupId,
        timestamp: payload?.timestamp ?? payload?.createdAt ?? payload?.created_at ?? new Date().toISOString(),
        type: "announcement",
        isAnnouncement: true,
        isPinned: true,
      }

      processIncomingGroupMessage({ message: announcementPayload, groupId })
      chatClientRef.current?.getPinnedMessage(groupId)
    },
    [processIncomingGroupMessage],
  )

  const handleCancelReply = useCallback(() => {
    replyContextRef.current = null
    setReplyContext(null)
  }, [])

  const handleCancelEdit = useCallback(() => {
    editingContextRef.current = null
    setEditingContext(null)
    setMessageText("")
  }, [])

  const handleReplyToMessage = useCallback(
    (conversationId: number, message: MessageEntry) => {
      const serverMessageId = message.serverId ?? message.id
      if (!serverMessageId) {
        setStatusBanner({
          variant: "warning",
          message: "Unable to determine the original message.",
        })
        return
      }

      const context: ReplyContext = {
        conversationId,
        messageId: message.id,
        serverId: serverMessageId,
        senderName: message.senderId === "me" ? "You" : message.senderName,
        preview: message.content,
      }
      replyContextRef.current = context
      setReplyContext(context)
      setEditingContext(null)
      editingContextRef.current = null
      setShowEmojiPicker(false)
      requestAnimationFrame(() => messageInputRef.current?.focus())
    },
    [setStatusBanner],
  )

  const handleInsertEmoji = useCallback((emoji: string) => {
    if (!emoji) return
    setMessageText((prev) => `${prev || ""}${emoji}`)
    setShowEmojiPicker(false)
    requestAnimationFrame(() => messageInputRef.current?.focus())
  }, [])

  const handleBeginEditMessage = useCallback(
    (conversationId: number, message: MessageEntry) => {
      if (message.deleted) {
        setStatusBanner({
          variant: "warning",
          message: "Deleted messages cannot be edited.",
        })
        return
      }
      if (message.pending) {
        setStatusBanner({
          variant: "warning",
          message: "Please wait until the message is sent before editing.",
        })
        return
      }
      const serverMessageId = message.serverId ?? message.id
      if (!serverMessageId) {
        setStatusBanner({
          variant: "warning",
          message: "Unable to determine message identifier.",
        })
        return
      }

      const context: EditingContext = {
        conversationId,
        messageId: message.id,
        serverId: serverMessageId,
        originalContent: message.content,
      }
      editingContextRef.current = context
      setEditingContext(context)
      replyContextRef.current = null
      setReplyContext(null)
      setShowEmojiPicker(false)
      setMessageText(message.content)
      requestAnimationFrame(() => messageInputRef.current?.focus())
    },
    [setStatusBanner],
  )

  const handleDeleteMessage = useCallback(
    (conversationId: number, message: MessageEntry) => {
      const conversation = conversationMapRef.current.get(conversationId)
      if (!conversation) return
      if (message.pending) {
        setStatusBanner({
          variant: "warning",
          message: "Pending messages cannot be deleted yet.",
        })
        return
      }

      const serverMessageId = message.serverId ?? message.id
      if (!serverMessageId) {
        setStatusBanner({
          variant: "warning",
          message: "Unable to determine message identifier.",
        })
        return
      }

      const client = chatClientRef.current
      if (!client) return

      if (!window.confirm("Delete this message for everyone?")) {
        return
      }

      const serverConversationId =
        conversation.type === "group"
          ? conversation.groupId
          : uiToServerConversationIdMapRef.current.get(conversationId)

      if (!serverConversationId) {
        setStatusBanner({
          variant: "error",
          message: "Conversation identifier is missing. Please retry after reloading.",
        })
        return
      }

      const snapshot = { ...message }
      const currentEditing = editingContextRef.current
      if (currentEditing && currentEditing.messageId === message.id) {
        editingContextRef.current = null
        setEditingContext(null)
        setMessageText("")
      }
      const currentReply = replyContextRef.current
      if (currentReply && currentReply.serverId === serverMessageId) {
        replyContextRef.current = null
        setReplyContext(null)
      }

      const uiConversationId = applyMessageUpdate(String(serverConversationId), serverMessageId, (current) => ({
        ...current,
        content: current.senderId === "me" ? "Deleting…" : current.content,
        deleted: true,
        edited: false,
        reactions: undefined,
      }))
      if (uiConversationId != null) {
        updateConversationPreviewFromMessages(uiConversationId)
      }

      try {
        if (conversation.type === "group" && conversation.groupId) {
          client.deleteGroupMessage(serverMessageId)
        } else {
          client.deletePrivateMessage(serverMessageId)
        }
      } catch (error) {
        applyMessageUpdate(String(serverConversationId), serverMessageId, () => snapshot)
        setStatusBanner({
          variant: "error",
          message: (error as Error)?.message ?? "Failed to delete message. Please try again.",
        })
        if (uiConversationId != null) {
          updateConversationPreviewFromMessages(uiConversationId)
        }
      }
    },
    [applyMessageUpdate, setStatusBanner, setEditingContext, setMessageText, setReplyContext, updateConversationPreviewFromMessages],
  )

  const handleToggleReaction = useCallback(
    (conversationId: number, message: MessageEntry, emoji: string) => {
      if (!emoji) return
      const conversation = conversationMapRef.current.get(conversationId)
      if (!conversation) return
      if (message.deleted || message.pending) return

      const serverMessageId = message.serverId ?? message.id
      if (!serverMessageId) {
        setStatusBanner({
          variant: "warning",
          message: "Unable to determine message identifier.",
        })
        return
      }

      const client = chatClientRef.current
      const currentUserId = currentUserIdRef.current
      if (!client || !currentUserId) return

      const hasReacted = Boolean(message.reactions?.[emoji]?.users.includes(currentUserId))

      const serverConversationId =
        conversation.type === "group"
          ? conversation.groupId
          : uiToServerConversationIdMapRef.current.get(conversationId)

      if (!serverConversationId) {
        setStatusBanner({
          variant: "warning",
          message: "Conversation identifier is missing. Please retry after reloading.",
        })
        return
      }

      applyReactionUpdate(
        String(serverConversationId),
        String(serverMessageId),
        emoji,
        currentUserId,
        "You",
        hasReacted ? "remove" : "add",
      )

      try {
        if (conversation.type === "group" && conversation.groupId) {
          if (hasReacted) {
            client.removeGroupReaction(serverMessageId, emoji)
          } else {
            client.addGroupReaction(serverMessageId, emoji)
          }
        } else if (conversation.participantId) {
          if (hasReacted) {
            client.removeReaction(serverMessageId, emoji, String(serverConversationId))
          } else {
            client.addReaction(serverMessageId, emoji, String(serverConversationId))
          }
        }
        setReactionMenuTarget(null)
      } catch (error) {
        applyReactionUpdate(
          String(serverConversationId),
          String(serverMessageId),
          emoji,
          currentUserId,
          "You",
          hasReacted ? "add" : "remove",
        )
        if (!hasReacted) {
          // remove optimistic entry we added
          applyReactionUpdate(
            String(serverConversationId),
            String(serverMessageId),
            emoji,
            currentUserId,
            "You",
            "remove",
          )
        }
        setStatusBanner({
          variant: "error",
          message: (error as Error)?.message ?? "Failed to update reaction. Please try again.",
        })
      }
    },
    [applyReactionUpdate, setReactionMenuTarget, setStatusBanner],
  )

  const handleQuickHeart = useCallback(
    (conversationId: number, message: MessageEntry) => {
      handleToggleReaction(conversationId, message, "❤️")
      setReactionMenuTarget(null)
    },
    [handleToggleReaction, setReactionMenuTarget],
  )

  const toggleReactionMenuForMessage = useCallback(
    (conversationId: number, message: MessageEntry) => {
      const targetId = message.serverId ?? message.id
      if (!targetId) return
      const normalizedId = String(targetId)

      setReactionMenuTarget((current) =>
        current &&
        current.conversationId === conversationId &&
        current.messageId === normalizedId
          ? null
          : { conversationId, messageId: normalizedId },
      )
    },
    [setReactionMenuTarget],
  )

  const handleSelectReaction = useCallback(
    (conversationId: number, message: MessageEntry, emoji: string) => {
      handleToggleReaction(conversationId, message, emoji)
      setReactionMenuTarget(null)
    },
    [handleToggleReaction, setReactionMenuTarget],
  )

  const normalizeReactionEvent = useCallback((payload: any) => {
    if (!payload) {
      return null
    }

    const container =
      payload?.reaction && typeof payload.reaction === "object" ? payload.reaction : payload

    const messageId =
      container?.messageId ??
      container?.message_id ??
      payload?.messageId ??
      payload?.message_id ??
      null

    const emoji =
      container?.reaction ??
      container?.emoji ??
      payload?.reaction ??
      payload?.emoji ??
      null

    const userId =
      container?.userId ??
      container?.user_id ??
      container?.user?.id ??
      payload?.userId ??
      payload?.user_id ??
      payload?.user?.id ??
      null

    const username =
      container?.username ??
      container?.user?.username ??
      container?.displayName ??
      payload?.username ??
      payload?.user?.username ??
      payload?.displayName ??
      (userId != null ? String(userId) : null)

    const groupId =
      payload?.groupId ??
      payload?.group_id ??
      container?.groupId ??
      container?.group_id ??
      null

    const conversationId =
      groupId ??
      container?.conversationId ??
      container?.conversation_id ??
      payload?.conversationId ??
      payload?.conversation_id ??
      payload?.id ??
      null

    if (!messageId || !emoji || !userId || !conversationId) {
      return null
    }

    return {
      messageId: String(messageId),
      emoji: String(emoji),
      userId: String(userId),
      username: username ? String(username) : String(userId),
      conversationId: String(conversationId),
    }
  }, [])

  const handlePinMessageRequest = useCallback(
    (conversationId: number, message: MessageEntry) => {
      const conversation = conversationMapRef.current.get(conversationId)
      if (!conversation || conversation.type !== "group" || !conversation.groupId) return
      const role = (conversation.myRole ?? "").toLowerCase()
      if (role !== "owner" && role !== "admin") {
        setStatusBanner({
          variant: "warning",
          message: "Only group admins can pin messages.",
        })
        return
      }
      if (message.deleted) {
        setStatusBanner({
          variant: "warning",
          message: "Deleted messages cannot be pinned.",
        })
        return
      }
      const serverMessageId = message.serverId ?? message.id
      if (!serverMessageId) {
        setStatusBanner({
          variant: "warning",
          message: "Unable to determine message identifier.",
        })
        return
      }
      const client = chatClientRef.current
      if (!client) return
      try {
        client.pinMessage(conversation.groupId, serverMessageId)
        setStatusBanner({
          variant: "info",
          message: "Pinning message…",
        })
      } catch (error) {
        setStatusBanner({
          variant: "error",
          message: (error as Error)?.message ?? "Failed to pin message.",
        })
      }
    },
    [setStatusBanner],
  )

  const handleUnpinMessageRequest = useCallback(
    (conversationId: number, message: MessageEntry) => {
      const conversation = conversationMapRef.current.get(conversationId)
      if (!conversation || conversation.type !== "group" || !conversation.groupId) return
      const role = (conversation.myRole ?? "").toLowerCase()
      if (role !== "owner" && role !== "admin") {
        setStatusBanner({
          variant: "warning",
          message: "Only group admins can unpin messages.",
        })
        return
      }
      const serverMessageId = message.serverId ?? message.id
      if (!serverMessageId) {
        setStatusBanner({
          variant: "warning",
          message: "Unable to determine message identifier.",
        })
        return
      }
      const client = chatClientRef.current
      if (!client) return
      try {
        client.unpinMessage(conversation.groupId, serverMessageId)
        setStatusBanner({
          variant: "info",
          message: "Unpinning message…",
        })
      } catch (error) {
        setStatusBanner({
          variant: "error",
          message: (error as Error)?.message ?? "Failed to unpin message.",
        })
      }
    },
    [setStatusBanner],
  )

  const handleConversationDeleted = useCallback(
    (payload: any) => {
      const serverConversationId =
        payload?.conversationId ?? payload?.conversation_id ?? payload?.id
      if (!serverConversationId) return
      removeConversationFromState(String(serverConversationId), {
        deleteForEveryone: Boolean(payload?.deleteForEveryone),
      })
    },
    [removeConversationFromState],
  )

  const handleGroupCreated = useCallback(
    (payload: any) => {
      const groupPayload = payload?.group ?? payload
      const groupIdRaw = groupPayload?.groupId ?? groupPayload?.id
      if (!groupIdRaw) return
      const groupId = String(groupIdRaw)
      const currentUserId = currentUserIdRef.current

      const displayName = deriveGroupDisplayName(
        serverConversationIdMapRef,
        conversationMapRef,
        groupId,
        groupPayload?.groupName ?? groupPayload?.group_name ?? groupPayload?.name,
      )

      const myRoleCandidate =
        typeof groupPayload?.myRole === "string"
          ? groupPayload.myRole
          : currentUserId && String(groupPayload?.createdBy ?? groupPayload?.creatorUserId ?? groupPayload?.created_by) === currentUserId
          ? "owner"
          : undefined

      const conversation = upsertConversationFromServer(groupId, {
    type: "group",
        name: displayName,
        username: displayName,
        avatar: groupPayload?.avatar ?? groupPayload?.avatarUrl ?? DEFAULT_AVATAR,
        groupId,
        members: Array.isArray(groupPayload?.members) ? groupPayload.members.length : undefined,
        myRole: myRoleCandidate,
      })

      if (Array.isArray(groupPayload?.members)) {
        groupMembersRef.current[groupId] = groupPayload.members
          .map((member: any) => {
            if (typeof member === "string" || typeof member === "number") {
              return {
                userId: String(member),
              } satisfies GroupMemberInfo
            }
            const userId = member?.userId ?? member?.user_id ?? member?.id ?? member?.username
            if (!userId) {
              return null
            }
            return {
              userId: String(userId),
              username: member?.username ?? member?.displayName ?? undefined,
              displayName: member?.displayName ?? member?.username ?? undefined,
              role: member?.role ?? undefined,
            } satisfies GroupMemberInfo
          })
          .filter(
            (member: GroupMemberInfo | null): member is GroupMemberInfo => Boolean(member && member.userId),
          )
        setGroupMembersVersion((value) => value + 1)
      }

      lastMessageTimestampRef.current.set(conversation.id, new Date().toISOString())
      refreshConversations()

      const createdBy = groupPayload?.createdBy ?? groupPayload?.creatorUserId ?? groupPayload?.created_by
      if (currentUserId && createdBy != null && String(createdBy) === currentUserId) {
        setSelectedConversation(conversation.id)
        selectedConversationRef.current = conversation.id
        if (isMobile) {
          setShowConversations(false)
        }
        chatClientRef.current?.getGroupMessages(groupId, MESSAGE_PAGE_SIZE, 0)
      }

      setStatusBanner(null)
      setPendingGroupAction(false)
    },
    [refreshConversations, setStatusBanner, upsertConversationFromServer, isMobile],
  )

  const handleMessageEdited = useCallback(
    (payload: any) => {
      const conversationId =
        payload?.conversationId ?? payload?.conversation_id ?? payload?.convId ?? payload?.id
      const messageId = payload?.messageId ?? payload?.message_id ?? payload?.id
      const messagePayload = payload?.message
      const newContent =
        payload?.newContent ??
        messagePayload?.content ??
        payload?.content ??
        (typeof payload?.message === "string" ? payload?.message : undefined)
      const editedAt =
        payload?.editedAt ??
        messagePayload?.editedAt ??
        payload?.timestamp ??
        messagePayload?.timestamp ??
        undefined
      if (!conversationId || !messageId) return

      const uiConversationId = applyMessageUpdate(String(conversationId), String(messageId), (message) => {
        if (message.deleted) return message
        const updatedContent =
          typeof newContent === "string" && newContent.trim().length > 0 ? newContent : message.content
        return {
          ...message,
          content: updatedContent,
          edited: true,
          editedAt: editedAt ?? message.editedAt,
        }
      })

      if (uiConversationId != null) {
        updateConversationPreviewFromMessages(uiConversationId)
      }
    },
    [applyMessageUpdate, updateConversationPreviewFromMessages],
  )

  const handleMessageDeleted = useCallback(
    (payload: any) => {
      const conversationId =
        payload?.conversationId ?? payload?.conversation_id ?? payload?.convId ?? payload?.id
      const messageId = payload?.messageId ?? payload?.message_id ?? payload?.id
      if (!conversationId || !messageId) return

      const uiConversationId = applyMessageUpdate(String(conversationId), String(messageId), (message) => {
        const isCurrentUser = message.senderId === "me"
        return {
          ...message,
          content: isCurrentUser ? "You deleted this message" : "This message was deleted",
          deleted: true,
          edited: false,
          pending: false,
          failed: false,
      isRead: true,
          reactions: undefined,
        }
      })

      if (uiConversationId != null) {
        updateConversationPreviewFromMessages(uiConversationId)
        const currentEditing = editingContextRef.current
        if (
          currentEditing &&
          currentEditing.conversationId === uiConversationId &&
          (currentEditing.serverId === String(messageId) || currentEditing.messageId === String(messageId))
        ) {
          editingContextRef.current = null
          setEditingContext(null)
          setMessageText("")
        }
        const currentReply = replyContextRef.current
        if (currentReply && currentReply.serverId === String(messageId)) {
          replyContextRef.current = null
          setReplyContext(null)
        }
      }
    },
    [applyMessageUpdate, setEditingContext, setMessageText, setReplyContext, updateConversationPreviewFromMessages],
  )

  const handleGroupMessageEdited = useCallback(
    (payload: any) => {
      const groupId = payload?.groupId ?? payload?.group_id ?? payload?.conversationId ?? payload?.id
      const messageId = payload?.messageId ?? payload?.message_id ?? payload?.id
      const messagePayload = payload?.message
      const newContent =
        payload?.newContent ??
        messagePayload?.content ??
        payload?.content ??
        (typeof payload?.message === "string" ? payload?.message : undefined)
      const editedAt =
        payload?.editedAt ??
        messagePayload?.editedAt ??
        payload?.timestamp ??
        messagePayload?.timestamp ??
        undefined
      if (!groupId || !messageId) return

      const uiConversationId = applyMessageUpdate(String(groupId), String(messageId), (message) => {
        if (message.deleted) return message
        const updatedContent =
          typeof newContent === "string" && newContent.trim().length > 0 ? newContent : message.content
        return {
          ...message,
          content: updatedContent,
          edited: true,
          editedAt: editedAt ?? message.editedAt,
        }
      })

      if (uiConversationId != null) {
        updateConversationPreviewFromMessages(uiConversationId)
      }
    },
    [applyMessageUpdate, updateConversationPreviewFromMessages],
  )

  const handleGroupMessageDeleted = useCallback(
    (payload: any) => {
      const groupId = payload?.groupId ?? payload?.group_id ?? payload?.conversationId ?? payload?.id
      const messageId = payload?.messageId ?? payload?.message_id ?? payload?.id
      if (!groupId || !messageId) return

      const uiConversationId = applyMessageUpdate(String(groupId), String(messageId), (message) => {
        const isCurrentUser = message.senderId === "me"
        const senderLabel = message.senderName ?? "Someone"
        return {
          ...message,
          content: isCurrentUser ? "You deleted this message" : `${senderLabel} deleted a message`,
          deleted: true,
          edited: false,
          pending: false,
          failed: false,
      isRead: true,
          reactions: undefined,
        }
      })

      if (uiConversationId != null) {
        updateConversationPreviewFromMessages(uiConversationId)
        const currentEditing = editingContextRef.current
        if (
          currentEditing &&
          currentEditing.conversationId === uiConversationId &&
          (currentEditing.serverId === String(messageId) || currentEditing.messageId === String(messageId))
        ) {
          editingContextRef.current = null
          setEditingContext(null)
          setMessageText("")
        }
        const currentReply = replyContextRef.current
        if (currentReply && currentReply.serverId === String(messageId)) {
          replyContextRef.current = null
          setReplyContext(null)
        }
      }
    },
    [applyMessageUpdate, setEditingContext, setMessageText, setReplyContext, updateConversationPreviewFromMessages],
  )

  const handleReactionAdded = useCallback(
    (payload: any) => {
      const normalized = normalizeReactionEvent(payload)
      if (!normalized) return

      applyReactionUpdate(
        normalized.conversationId,
        normalized.messageId,
        normalized.emoji,
        normalized.userId,
        normalized.username,
        "add",
      )
    },
    [applyReactionUpdate, normalizeReactionEvent],
  )

  const handleReactionRemoved = useCallback(
    (payload: any) => {
      const normalized = normalizeReactionEvent(payload)
      if (!normalized) return

      applyReactionUpdate(
        normalized.conversationId,
        normalized.messageId,
        normalized.emoji,
        normalized.userId,
        normalized.username,
        "remove",
      )
    },
    [applyReactionUpdate, normalizeReactionEvent],
  )

  const handleCommunityList = useCallback((payload: any) => {
    const list = Array.isArray(payload?.communities) ? payload.communities : []
    if (!Array.isArray(list) || list.length === 0) return

    const normalized = list.reduce<CommunitySummary[]>((acc, community: any) => {
      const communityId =
        community?.communityId ??
        community?.community_id ??
        community?.id ??
        community?.defaultGroupId ??
        community?.default_group_id
      if (!communityId) {
        return acc
      }

      acc.push({
        communityId: String(communityId),
        name: community?.name ?? `Community ${communityId}`,
        description: community?.description ?? community?.bio ?? undefined,
        avatarUrl: community?.avatarUrl ?? community?.avatar ?? undefined,
        defaultGroupId: community?.defaultGroupId ?? community?.default_group_id ?? undefined,
        role: community?.role ?? community?.membershipRole ?? undefined,
        isMuted: community?.isMuted ?? community?.muted ?? false,
      })

      return acc
    }, [])

    if (normalized.length === 0) return
    communitiesRef.current = normalized

    const client = chatClientRef.current
    if (client) {
      normalized.forEach((community) => {
        client.getCommunityProgress(community.communityId)
      })
    }
  }, [])

  const handleCommunityMembers = useCallback((payload: any) => {
    const communityId =
      payload?.communityId ?? payload?.community_id ?? payload?.id ?? payload?.community?.id
    if (!communityId) return

    const membersRaw = Array.isArray(payload?.members) ? payload.members : []
    if (!Array.isArray(membersRaw)) return

    const normalized = membersRaw.reduce<CommunityMember[]>((acc, member: any) => {
      const userId = member?.userId ?? member?.user_id ?? member?.id ?? member?.username
      if (!userId) {
        return acc
      }

      acc.push({
        userId: String(userId),
        role: member?.role ?? member?.membershipRole ?? undefined,
        joinedAt: member?.joinedAt ?? member?.joined_at ?? undefined,
        lastSeenAt: member?.lastSeenAt ?? member?.last_seen_at ?? undefined,
        isMuted: member?.isMuted ?? member?.muted ?? false,
      })

      return acc
    }, [])

    communityMembersRef.current[String(communityId)] = normalized
  }, [])

  const handleCommunityProgress = useCallback((payload: any) => {
    const communityId =
      payload?.communityId ?? payload?.community_id ?? payload?.progress?.communityId
    const progressPayload = payload?.progress ?? payload
    const userId = progressPayload?.userId ?? progressPayload?.user_id

    if (!communityId || !userId) return

    const record: CommunityProgress = {
      communityId: String(communityId),
      userId: String(userId),
      totalXp: Number(progressPayload?.totalXp ?? progressPayload?.total_xp ?? 0),
      dailyStreak: Number(progressPayload?.dailyStreak ?? progressPayload?.daily_streak ?? 0),
      weeklyStreak: Number(progressPayload?.weeklyStreak ?? progressPayload?.weekly_streak ?? 0),
      lastChallengeId: progressPayload?.lastChallengeId ?? progressPayload?.last_challenge_id,
      lastChallengeType:
        progressPayload?.lastChallengeType ?? progressPayload?.last_challenge_type,
      lastCompletedAt: progressPayload?.lastCompletedAt ?? progressPayload?.last_completed_at,
    }

    const key = `${record.communityId}:${record.userId}`
    communityProgressRef.current[key] = record
  }, [])

  const handleCommunityProgressUpdate = useCallback((payload: any) => {
    const communityId = payload?.communityId ?? payload?.community_id
    const userId = payload?.userId ?? payload?.user_id ?? payload?.progress?.userId
    if (!communityId || !userId) return

    const progressPayload = payload?.progress ?? {}
    const eventPayload = payload?.event ?? {}

    const record: CommunityProgress = {
      communityId: String(communityId),
      userId: String(userId),
      totalXp: Number(progressPayload?.totalXp ?? progressPayload?.total_xp ?? 0),
      dailyStreak: Number(progressPayload?.dailyStreak ?? progressPayload?.daily_streak ?? 0),
      weeklyStreak: Number(progressPayload?.weeklyStreak ?? progressPayload?.weekly_streak ?? 0),
      lastChallengeId: progressPayload?.lastChallengeId ?? progressPayload?.last_challenge_id,
      lastChallengeType:
        progressPayload?.lastChallengeType ?? progressPayload?.last_challenge_type,
      lastCompletedAt: progressPayload?.lastCompletedAt ?? progressPayload?.last_completed_at,
    }

    const key = `${record.communityId}:${record.userId}`
    communityProgressRef.current[key] = record

    const eventRecord: CommunityProgressEvent = {
      communityId: String(communityId),
      userId: String(userId),
      challengeId: eventPayload?.challengeId ?? eventPayload?.challenge_id,
      challengeType: eventPayload?.challengeType ?? eventPayload?.challenge_type,
      xpAwarded: Number(eventPayload?.xpAwarded ?? eventPayload?.xp_awarded ?? 0),
      occurredAt: eventPayload?.occurredAt ?? eventPayload?.occurred_at,
    }

    const nextEvents = [...communityEventsRef.current, eventRecord].slice(-20)
    communityEventsRef.current = nextEvents
  }, [])

  const loadInitialConversationsFromServer = useCallback(async () => {
    if (!CONVERSATIONS_ENDPOINT) {
      restoreConversationsFromCache()
      return
    }

    try {
      const token = await resolveStoredToken()
      const headers: HeadersInit = {}
      if (token && token.trim().length > 0) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(CONVERSATIONS_ENDPOINT, {
        credentials: "include",
        headers,
      })

      if (!response.ok) {
        throw new Error(`Failed to load conversations (${response.status})`)
      }

      const payload = await response.json()
      const list: any[] = Array.isArray(payload?.conversations)
        ? payload.conversations
        : Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.items)
        ? payload.items
        : []

      if (!Array.isArray(list) || list.length === 0) {
        const restored = restoreConversationsFromCache()
        if (!restored) {
          skipNextConversationPersistRef.current = true
          refreshConversations()
        }
        return
      }

      list.forEach((item, index) => {
        const serverConversationIdRaw =
          item?.conversationId ??
          item?.conversation_id ??
          item?.id ??
          item?.groupId ??
          item?.group_id ??
          (item?.participantId ? `conv_${item.participantId}` : `conv_dynamic_${index}`)

        const participantId =
          item?.participantId ?? item?.participant_id ?? item?.userId ?? item?.user_id ?? null

        const isGroup =
          (item?.type && String(item.type).toLowerCase() === "group") ||
          Boolean(item?.groupId ?? item?.group_id)

        const name =
          item?.name ??
          item?.displayName ??
          item?.username ??
          (isGroup
            ? `Group ${serverConversationIdRaw}`
            : participantId != null
            ? `User ${participantId}`
            : `Conversation ${index + 1}`)

        const lastTimestamp =
          item?.lastMessageAt ?? item?.last_message_at ?? item?.timestamp ?? item?.lastActivity

        upsertConversationFromServer(String(serverConversationIdRaw), {
          type: isGroup ? "group" : "personal",
          name,
          username: item?.username ?? name,
          avatar: item?.avatar ?? DEFAULT_AVATAR,
          lastMessage: item?.lastMessage ?? item?.last_message ?? "",
          timestamp: lastTimestamp ? formatRelativeTime(lastTimestamp) : "",
          participantId: !isGroup && participantId != null ? String(participantId) : undefined,
          groupId: isGroup ? String(serverConversationIdRaw) : undefined,
          isOnline: false,
          unreadCount:
            typeof item?.unreadCount === "number"
              ? item.unreadCount
              : typeof item?.unread_count === "number"
              ? item.unread_count
              : 0,
        })
      })

      refreshConversations()
    } catch (error) {
      console.warn("Failed to load server conversations", error)
      const restored = restoreConversationsFromCache()
      if (!restored) {
        skipNextConversationPersistRef.current = true
        refreshConversations()
      }
    }
  }, [
    formatRelativeTime,
    refreshConversations,
    resolveStoredToken,
    restoreConversationsFromCache,
    upsertConversationFromServer,
  ])

  const loadFollowerContacts = useCallback(async () => {
    if (!FOLLOWERS_ENDPOINT) return

    try {
      setFollowersLoading(true)
      const token = await resolveStoredToken()
      if (!token) {
        console.warn("No token available when requesting followers")
        return
      }

      const response = await fetch(FOLLOWERS_ENDPOINT, {
        method: "GET",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to load followers (${response.status})`)
      }

      const payload = await response.json()
      const list: any[] = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.followers)
        ? payload.followers
        : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload)
        ? payload
        : []

      const normalized: FollowerContact[] = list
        .map((entry) => {
          const rawId =
            entry?.userId ??
            entry?.user_id ??
            entry?.id ??
            entry?.followerId ??
            entry?.follower_id ??
            entry?.followedById ??
            entry?.followed_by_id ??
            entry?.followerUserId ??
            entry?.follower_user_id
          if (rawId == null) return null

          const usernameRaw =
            entry?.username ??
            entry?.userName ??
            entry?.handle ??
            entry?.email ??
            entry?.displayName ??
            entry?.name ??
            rawId

          const displayNameRaw =
            entry?.displayName ??
            entry?.name ??
            entry?.profileName ??
            entry?.fullName ??
            entry?.username ??
            usernameRaw

          const avatarRaw =
            typeof entry?.avatar === "string"
              ? entry.avatar
              : typeof entry?.profilePicture === "string"
              ? entry.profilePicture
              : typeof entry?.profile_picture === "string"
              ? entry.profile_picture
              : undefined

          return {
            id: String(rawId),
            username: String(usernameRaw ?? rawId),
            displayName: String(displayNameRaw ?? usernameRaw ?? rawId),
            avatar: avatarRaw && avatarRaw.trim().length > 0 ? avatarRaw : DEFAULT_AVATAR,
          }
        })
        .filter((entry): entry is FollowerContact => Boolean(entry))

      setFollowers(normalized)
    } catch (error) {
      console.warn("Failed to load follower contacts", error)
    } finally {
      setFollowersLoading(false)
    }
  }, [resolveStoredToken])

  const persistConversationUpdate = useCallback(
    (conversationId: number) => {
    const conversation = conversationMapRef.current.get(conversationId)
    if (!conversation) return
    refreshConversations()
  },
    [refreshConversations],
  )

  const updateOnlineStatusForParticipant = useCallback(
    (participantId: string, isOnline: boolean) => {
      let changed = false
      conversationMapRef.current.forEach((conversation, uiId) => {
        if (conversation.participantId && conversation.participantId === participantId) {
          if (conversation.isOnline !== isOnline) {
            conversationMapRef.current.set(uiId, { ...conversation, isOnline })
            changed = true
          }
        }
      })
      if (changed) {
        refreshConversations()
      }
    },
    [refreshConversations],
  )

  const appendMessages = useCallback(
    (conversationId: number, newMessages: MessageEntry[]) => {
    const existingMessages = messagesRef.current[conversationId] ?? []
    messagesRef.current[conversationId] = [...existingMessages, ...newMessages]
    refreshMessages()
  },
    [refreshMessages],
  )

  const prependMessages = useCallback(
    (conversationId: number, olderMessages: MessageEntry[]) => {
      if (!olderMessages.length) return
      const existingMessages = messagesRef.current[conversationId] ?? []
      const existingIds = new Set(
        existingMessages.map((entry) => entry.serverId ?? entry.id),
      )
      const filtered = olderMessages.filter((entry) => {
        const identifier = entry.serverId ?? entry.id
        if (!identifier) return true
        return !existingIds.has(identifier)
      })
      if (filtered.length === 0) return
      messagesRef.current[conversationId] = [...filtered, ...existingMessages]
      refreshMessages()
    },
    [refreshMessages],
  )

  const replaceMessages = useCallback(
    (conversationId: number, newMessages: MessageEntry[]) => {
    messagesRef.current[conversationId] = [...newMessages]
    refreshMessages()
  },
    [refreshMessages],
  )

  const markLatestPendingAsFailed = useCallback(
    (conversationId: number | null) => {
      if (conversationId == null) return
      const messages = messagesRef.current[conversationId]
      if (!messages || messages.length === 0) return

      for (let i = messages.length - 1; i >= 0; i -= 1) {
        const message = messages[i]
        if (message?.pending) {
          messages[i] = { ...message, pending: false, failed: true }
          messagesRef.current[conversationId] = [...messages]
          refreshMessages()
          break
        }
      }
    },
    [refreshMessages],
  )

  const markMessageAsFailed = useCallback(
    (conversationId: number, messageId: string) => {
      const messages = messagesRef.current[conversationId]
      if (!messages) return
      messagesRef.current[conversationId] = messages.map((message) =>
        message.id === messageId ? { ...message, pending: false, failed: true } : message,
      )
      refreshMessages()
    },
    [refreshMessages],
  )

  const processUserGroups = useCallback(
    (payload: any) => {
      const groups = Array.isArray(payload?.groups) ? payload.groups : []
      if (!Array.isArray(groups) || groups.length === 0) return

      const currentUserId = currentUserIdRef.current

      groups.forEach((group: any, index: number) => {
        const groupIdRaw = group?.groupId ?? group?.id ?? `group_${index}`
        if (!groupIdRaw) return
        const groupId = String(groupIdRaw)

        let isMember = Boolean(group?.myRole ?? group?.role)
        if (!isMember && currentUserId && Array.isArray(group?.members)) {
          isMember = group.members.some((member: any) => {
            const memberId = member?.userId ?? member?.user_id ?? member?.id
            return memberId != null && String(memberId) === currentUserId
          })
        }
        if (!isMember) return

        const rawName =
          group?.groupName ??
          group?.group_name ??
          group?.name ??
          group?.displayName ??
          group?.title ??
          undefined
        const displayName = deriveGroupDisplayName(
          serverConversationIdMapRef,
          conversationMapRef,
          groupId,
          rawName,
        )
        const createdBy = group?.createdBy ?? group?.created_by ?? group?.creatorUserId
        let myRole: string | undefined =
          typeof group?.myRole === "string"
            ? String(group.myRole)
            : typeof group?.role === "string"
            ? String(group.role)
            : undefined
        if (!myRole && currentUserId && createdBy != null && String(createdBy) === currentUserId) {
          myRole = "owner"
        }

        upsertConversationFromServer(groupId, {
          type: "group",
          name: displayName,
          username: displayName,
          avatar: group?.avatar ?? group?.avatarUrl ?? DEFAULT_AVATAR,
          groupId,
          members:
            typeof group?.memberCount === "number"
              ? Number(group.memberCount)
              : Array.isArray(group?.members)
              ? group.members.length
              : undefined,
          myRole,
          unreadCount:
            typeof group?.unreadCount === "number"
              ? Number(group.unreadCount)
              : typeof group?.unread_count === "number"
              ? Number(group.unread_count)
              : 0,
        })
      })

      refreshConversations()
    },
    [refreshConversations, upsertConversationFromServer],
  )

  const processGroupMessages = useCallback(
    (payload: any) => {
      const groupId = payload?.groupId ?? payload?.id
      if (!groupId) return

      const offset = typeof payload?.offset === "number" ? payload.offset : 0
      const hasMore = Boolean(payload?.hasMore)

      const displayName = deriveGroupDisplayName(
        serverConversationIdMapRef,
        conversationMapRef,
        String(groupId),
        payload?.groupName ?? payload?.group_name ?? payload?.name,
      )

      const conversation = upsertConversationFromServer(String(groupId), {
        type: "group",
        name: displayName,
        username: displayName,
        groupId: String(groupId),
      })

      const messagesPayload = Array.isArray(payload?.messages) ? payload.messages : []
      const normalized = messagesPayload.map((message: any) =>
        toMessageEntry(message, message?.username ?? conversation.name),
      )

      if (offset > 0) {
        prependMessages(conversation.id, normalized)
      } else {
        replaceMessages(conversation.id, normalized)

        const lastMessage = normalized[normalized.length - 1]
        if (lastMessage) {
          const preview =
            lastMessage.senderId === "me"
              ? `You: ${lastMessage.content}`
              : `${lastMessage.senderName}: ${lastMessage.content}`
          lastMessageTimestampRef.current.set(
            conversation.id,
            lastMessage.rawTimestamp ?? new Date().toISOString(),
          )
          upsertConversationFromServer(String(groupId), {
            lastMessage: preview,
            timestamp: formatRelativeTime(lastMessage.rawTimestamp),
          })
        } else {
          updateConversationPreviewFromMessages(conversation.id)
        }

        loadedHistoryRef.current.add(conversation.id)
        requestAnimationFrame(() => scrollToBottom())
      }

      updateHistoryState(String(groupId), (previous) => ({
        offset: offset + normalized.length,
        hasMore,
        loading: false,
        initialLoaded: true,
      }))

      refreshMessages()
      refreshConversations()
      if (selectedConversationRef.current === conversation.id) {
        markConversationMessagesRead(conversation.id)
      }
    },
    [
      formatRelativeTime,
      markConversationMessagesRead,
      prependMessages,
      refreshConversations,
      refreshMessages,
      replaceMessages,
      toMessageEntry,
      updateConversationPreviewFromMessages,
      updateHistoryState,
      upsertConversationFromServer,
    ],
  )

  const loadConversationHistory = useCallback(
    (conversationId: number, options?: { initial?: boolean }) => {
      const conversation = conversationMapRef.current.get(conversationId)
      if (!conversation) return

      const serverConversationId = uiToServerConversationIdMapRef.current.get(conversationId)
      if (!serverConversationId) return

      const historyState = ensureHistoryState(serverConversationId)
      const isInitial = Boolean(options?.initial)

      if (historyState.loading) return
      if (!isInitial && !historyState.hasMore) return

      const offset = isInitial ? 0 : historyState.offset
      const limit = MESSAGE_PAGE_SIZE

      if (!isInitial) {
        const container = messagesContainerRef.current
        if (container) {
          pendingScrollAdjustmentRef.current = {
            conversationId,
            previousHeight: container.scrollHeight,
            previousScrollTop: container.scrollTop,
          }
        }
      } else {
        pendingScrollAdjustmentRef.current = null
      }

      updateHistoryState(serverConversationId, (previous) => ({
        ...previous,
        loading: true,
        offset: isInitial ? 0 : previous.offset,
      }))

      if (conversation.type === "group" && conversation.groupId) {
        chatClientRef.current?.getGroupMessages(conversation.groupId, limit, offset)
      } else if (conversation.participantId) {
        chatClientRef.current?.getPrivateMessages(conversation.participantId, limit, offset)
      } else {
        updateHistoryState(serverConversationId, (previous) => ({
          ...previous,
          loading: false,
        }))
        pendingScrollAdjustmentRef.current = null
      }
    },
    [ensureHistoryState, updateHistoryState],
  )

  const handleMessageScroll = useCallback(() => {
    const container = messagesContainerRef.current
    if (!container) return
    const activeConversationId = selectedConversationRef.current
    if (activeConversationId == null) return
    if (container.scrollTop > HISTORY_SCROLL_THRESHOLD) return
    const serverConversationId = uiToServerConversationIdMapRef.current.get(activeConversationId)
    if (!serverConversationId) return
    const historyState = ensureHistoryState(serverConversationId)
    if (!historyState.initialLoaded || historyState.loading || !historyState.hasMore) return
    loadConversationHistory(activeConversationId, { initial: false })
  }, [ensureHistoryState, loadConversationHistory])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])


  useEffect(() => {
    if (typeof window === "undefined") return

    const url = process.env.NEXT_PUBLIC_CHAT_WS_URL
    if (!url) {
      console.warn("NEXT_PUBLIC_CHAT_WS_URL is not configured.")
      return
    }

    const client = new ChatClient({
      url,
      getToken: resolveStoredToken,
      debug: process.env.NODE_ENV !== "production",
    })

    chatClientRef.current = client
    setPendingAuth(true)
    setStatusBanner({
      variant: "info",
      message: "Connecting to chat server…",
    })

    const handleAuthSuccess = (payload: any) => {
      const user = payload?.user ?? payload
      const id =
        user?.id ?? user?.userId ?? user?.user_id ?? user?.sub ?? user?.username ?? user?.email ?? null
      currentUserIdRef.current = id != null ? String(id) : null
      setPendingAuth(false)
      setStatusBanner(null)

      serverConversationIdMapRef.current.clear()
      conversationMapRef.current.clear()
      messagesRef.current = {}
      lastMessageTimestampRef.current.clear()
      uiToServerConversationIdMapRef.current.clear()
      loadedHistoryRef.current.clear()
      historyStateRef.current.clear()
      pendingScrollAdjustmentRef.current = null
      setHistoryStateVersion((value) => value + 1)
      setFollowers([])
      setSelectedConversation(null)
      selectedConversationRef.current = null
      setShowConversations(true)
      skipNextConversationPersistRef.current = true
      refreshMessages()
      refreshConversations()

      client.getOnlineUsers()
      client.getUserGroups()
      client.getCommunities()
      void loadInitialConversationsFromServer()
      void loadFollowerContacts()
    }

    const handleOnlineUsers = (payload: any) => {
      const users = Array.isArray(payload?.users) ? payload.users : []
      const status: Record<string, boolean> = {}
      const list: { id: string; username: string; displayName: string }[] = []

      users.forEach((user: any) => {
        const id = user?.id ?? user?.userId ?? user?.user_id ?? user?.username
        if (id != null) {
          const idStr = String(id)
          status[idStr] = Boolean(user?.online ?? true)
          list.push({
            id: idStr,
            username: user?.username ?? idStr,
            displayName: user?.displayName ?? user?.username ?? idStr,
          })
        }
      })

      onlineUsersRef.current = status
      setOnlineUsersList(list)

      conversationMapRef.current.forEach((conversation, uiId) => {
        if (!conversation.participantId) return
        const isOnline = Boolean(status[conversation.participantId])
        if (conversation.isOnline !== isOnline) {
          conversationMapRef.current.set(uiId, { ...conversation, isOnline })
        }
      })

      refreshConversations()
    }

    const handleUserStatusChange = (payload: any, isOnline: boolean) => {
      const userPayload = payload?.user ?? payload
      const id = userPayload?.id ?? userPayload?.userId ?? userPayload?.user_id ?? userPayload?.username
      if (id == null) return
      const participantId = String(id)
      onlineUsersRef.current[participantId] = isOnline
      setOnlineUsersList((prev) => {
        if (isOnline) {
          const username =
            userPayload?.username ?? userPayload?.displayName ?? participantId ?? `user-${participantId}`
          const displayName = userPayload?.displayName ?? username

          const exists = prev.some((user) => user.id === participantId)
          if (exists) {
            return prev.map((user) =>
              user.id === participantId ? { ...user, username, displayName } : user,
            )
          }
          return [...prev, { id: participantId, username, displayName }]
        } else {
          return prev.filter((user) => user.id !== participantId)
        }
      })
      updateOnlineStatusForParticipant(participantId, isOnline)
    }

    const handleConversationStarted = (payload: any) => {
      const serverConversationId =
        payload?.conversationId ?? payload?.conversation_id ?? payload?.id ?? payload?.conversation
      if (!serverConversationId) return

      const recipient = payload?.recipient ?? {}
      const participantId =
        recipient?.id ?? recipient?.userId ?? recipient?.user_id ?? recipient?.username ?? recipient?.email
      const participantName =
        recipient?.displayName ?? recipient?.username ?? `User ${participantId ?? "unknown"}`

      const isGroupConversation = payload?.type === "group" || Boolean(payload?.groupId)

      const conversation = upsertConversationFromServer(String(serverConversationId), {
        type: isGroupConversation ? "group" : "personal",
        name: participantName,
        username: recipient?.username ?? participantName,
        participantId: !isGroupConversation && participantId != null ? String(participantId) : undefined,
        groupId: isGroupConversation ? String(serverConversationId) : undefined,
        isOnline:
          !isGroupConversation && participantId != null
            ? Boolean(onlineUsersRef.current[String(participantId)])
            : false,
        unreadCount: 0,
      })

      let messages: MessageEntry[] = []
      if (Array.isArray(payload?.messages) && payload.messages.length > 0) {
        messages = payload.messages.map((message: any) =>
          toMessageEntry(message, participantName),
        )
        replaceMessages(conversation.id, messages)
        loadedHistoryRef.current.add(conversation.id)
        const lastMessage = messages[messages.length - 1]
        if (lastMessage) {
          lastMessageTimestampRef.current.set(
            conversation.id,
            lastMessage.rawTimestamp ?? new Date().toISOString(),
          )
          upsertConversationFromServer(String(serverConversationId), {
            lastMessage: lastMessage.content,
            timestamp: formatRelativeTime(lastMessage.rawTimestamp),
            unreadCount: 0,
          })
        }
      } else {
        replaceMessages(conversation.id, [])
        lastMessageTimestampRef.current.set(conversation.id, new Date().toISOString())
      }

      updateHistoryState(String(serverConversationId), () => ({
        offset: messages.length,
        hasMore: messages.length >= MESSAGE_PAGE_SIZE,
        loading: false,
        initialLoaded: true,
      }))

      refreshMessages()
      refreshConversations()

      setSelectedConversation(conversation.id)
      selectedConversationRef.current = conversation.id
      setShowConversations(false)
      markConversationMessagesRead(conversation.id)
    }

    const handlePrivateMessageHistory = (payload: any) => {
      const serverConversationId =
        payload?.conversationId ?? payload?.conversation_id ?? payload?.id ?? payload?.conversation
      if (!serverConversationId) return

      const offset = typeof payload?.offset === "number" ? payload.offset : 0
      const hasMore = Boolean(payload?.hasMore)
      const messagesPayload = Array.isArray(payload?.messages) ? payload.messages : []
      const participantName =
        conversationMapRef.current.get(
          serverConversationIdMapRef.current.get(String(serverConversationId)) ?? -1,
        )?.name ?? "Unknown"

      const resolvedConversation =
        serverConversationIdMapRef.current.get(String(serverConversationId)) != null
          ? {
              id: serverConversationIdMapRef.current.get(String(serverConversationId))!,
            }
          : upsertConversationFromServer(String(serverConversationId), {
              name: participantName,
              username: participantName,
            })

      const normalizedMessages = messagesPayload.map((message: any) =>
        toMessageEntry(message, participantName),
      )

      if (offset > 0) {
        prependMessages(resolvedConversation.id, normalizedMessages)
      } else {
        replaceMessages(resolvedConversation.id, normalizedMessages)
        const lastMessage = normalizedMessages[normalizedMessages.length - 1]
        if (lastMessage) {
          lastMessageTimestampRef.current.set(
            resolvedConversation.id,
            lastMessage.rawTimestamp ?? new Date().toISOString(),
          )
          upsertConversationFromServer(String(serverConversationId), {
            lastMessage: lastMessage.content,
            timestamp: formatRelativeTime(lastMessage.rawTimestamp),
          })
        }
        loadedHistoryRef.current.add(resolvedConversation.id)
        requestAnimationFrame(() => scrollToBottom())
      }

      updateHistoryState(String(serverConversationId), (previous) => ({
        offset: offset + normalizedMessages.length,
        hasMore,
        loading: false,
        initialLoaded: true,
      }))

      refreshMessages()
      refreshConversations()
    }

    const handleIncomingPrivateMessage = (payload: any) => {
      const rawMessage = payload?.message ?? payload
      const conversationId =
        payload?.conversationId ??
        payload?.conversation_id ??
        rawMessage?.conversationId ??
        rawMessage?.conversation_id
      if (!conversationId) return

      const participantInfo = resolveParticipantInfo(rawMessage, "Conversation")

      const conversation = upsertConversationFromServer(String(conversationId), {
        name: participantInfo.displayName,
        username: participantInfo.username ?? participantInfo.displayName ?? "User",
        participantId: participantInfo.id ?? participantInfo.username,
        isOnline:
          participantInfo.id != null
            ? Boolean(onlineUsersRef.current[participantInfo.id])
            : undefined,
      })

      const message = toMessageEntry(
        {
          ...rawMessage,
          replyTo:
            rawMessage?.replyTo ??
            rawMessage?.reply_to ??
            payload?.replyTo ??
            payload?.reply_to ??
            null,
        },
        conversation.name,
      )
      const existingMessages = messagesRef.current[conversation.id] ?? []
      if (message.senderId === "me") {
        const pendingIndex = existingMessages.findIndex(
          (entry) => entry.pending && entry.senderId === "me",
        )
        if (pendingIndex !== -1) {
          const updatedMessages = [...existingMessages]
          updatedMessages[pendingIndex] = {
            ...message,
            pending: false,
            failed: false,
          }
          messagesRef.current[conversation.id] = updatedMessages
          refreshMessages()
        } else {
          appendMessages(conversation.id, [message])
        }
      } else {
        appendMessages(conversation.id, [message])
      }
      lastMessageTimestampRef.current.set(
        conversation.id,
        message.rawTimestamp ?? new Date().toISOString(),
      )

      const isIncoming = message.senderId !== "me"
      const isSelected = selectedConversationRef.current === conversation.id
      const unreadCount = isIncoming && !isSelected ? conversation.unreadCount + 1 : conversation.unreadCount

      upsertConversationFromServer(String(conversationId), {
        lastMessage: message.content,
        timestamp: formatRelativeTime(message.rawTimestamp),
        unreadCount,
      })

      refreshMessages()
      refreshConversations()

      if (isIncoming && isSelected) {
        markConversationMessagesRead(conversation.id)
      }
      updateConversationPreviewFromMessages(conversation.id)
    }

    const handleAuthError = async (payload: any) => {
      console.error("[Chat] auth_error", payload)
      const message =
        payload?.message ??
        payload?.error ??
        "Authentication failed. Please refresh or sign in again."
      markLatestPendingAsFailed(selectedConversationRef.current)
      const refreshed = await attemptTokenRefresh()
      if (refreshed && chatClientRef.current) {
        setStatusBanner({
          variant: "info",
          message: "Session refreshed. Re-authenticating…",
        })
        await chatClientRef.current.refreshToken()
        return
      }
      setPendingAuth(false)
      setStatusBanner({
        variant: "error",
        message,
      })
      router.push("/login")
    }

    const handleAuthMissing = async () => {
      markLatestPendingAsFailed(selectedConversationRef.current)
      const refreshed = await attemptTokenRefresh()
      if (refreshed && chatClientRef.current) {
        setStatusBanner({
          variant: "info",
          message: "Session refreshed. Re-authenticating…",
        })
        await chatClientRef.current.refreshToken()
        return
      }
      setPendingAuth(false)
      setStatusBanner({
        variant: "error",
        message: "Authentication token missing. Please log in again.",
      })
      router.push("/login")
    }

    const handleSessionConflict = () => {
      markLatestPendingAsFailed(selectedConversationRef.current)
      setStatusBanner({
        variant: "warning",
        message: "You signed in elsewhere. This session was disconnected.",
      })
      setPendingAuth(false)
    }

    const handleGenericError = (payload: any) => {
      const message =
        payload?.message ??
        payload?.details ??
        (typeof payload === "string" ? payload : "Unexpected error from chat server.")
      markLatestPendingAsFailed(selectedConversationRef.current)
      setStatusBanner({
        variant: "error",
        message,
      })
    }

    const handleDisconnected = () => {
      markLatestPendingAsFailed(selectedConversationRef.current)
      setStatusBanner({
        variant: "warning",
        message: "Connection lost. Reconnecting…",
      })
      setPendingAuth(true)
    }

    const handleConnected = () => {
      setPendingAuth(true)
      setStatusBanner({
        variant: "info",
        message: "Authenticating with chat server…",
      })
    }

    const handleReconnectFailed = () => {
      setStatusBanner({
        variant: "error",
        message: "Unable to reconnect to chat server. Please refresh.",
      })
      setPendingAuth(false)
    }

    const handleRateLimit = (payload: any) => {
      const message =
        payload?.message ??
        payload?.details ??
        "You are sending messages too quickly. Please slow down."
      markLatestPendingAsFailed(selectedConversationRef.current)
      setStatusBanner({
        variant: "warning",
        message,
      })
    }

    const handleMessageMarkedRead = (payload: any) => {
      const serverConversationIdRaw =
        payload?.conversationId ?? payload?.conversation_id ?? payload?.convId ?? payload?.conversation
      const messageIdRaw = payload?.messageId ?? payload?.message_id ?? payload?.id
      if (!serverConversationIdRaw || !messageIdRaw) return

      const serverConversationId = String(serverConversationIdRaw)
      const messageId = String(messageIdRaw)

      const uiConversationId = applyMessageUpdate(serverConversationId, messageId, (message) => {
        if (message.isRead) return message
        return { ...message, isRead: true }
      })

      if (uiConversationId != null) {
        const messages = messagesRef.current[uiConversationId] ?? []
        const hasUnread = messages.some((entry) => entry.senderId !== "me" && !entry.isRead)
        if (!hasUnread) {
          const snapshot = conversationMapRef.current.get(uiConversationId)
          if (snapshot && snapshot.unreadCount !== 0) {
            conversationMapRef.current.set(uiConversationId, { ...snapshot, unreadCount: 0 })
            refreshConversations()
          }
        }
      }
    }

    const handleMessageReadNotification = (payload: any) => {
      const messageIdRaw = payload?.messageId ?? payload?.message_id ?? payload?.id
      if (!messageIdRaw) return
      const messageId = String(messageIdRaw)

      let serverConversationId: string | null = null

      for (const [serverId, uiId] of serverConversationIdMapRef.current.entries()) {
        const messages = messagesRef.current[uiId]
        if (!messages || messages.length === 0) {
          continue
        }

        const found = messages.some(
          (entry) => entry.id === messageId || entry.serverId === messageId,
        )

        if (found) {
          serverConversationId = serverId
          break
        }
      }

      if (!serverConversationId) return

      applyMessageUpdate(serverConversationId, messageId, (message) => {
        if (message.senderId !== "me" || message.isRead) {
          return message
        }
        return { ...message, isRead: true }
      })
    }

    const subscriptions = [
      client.on("connected", handleConnected),
      client.on("disconnected", handleDisconnected),
      client.on("reconnect_failed", handleReconnectFailed),
      client.on("auth_success", handleAuthSuccess),
      client.on("auth_error", (payload: any) => {
        void handleAuthError(payload)
      }),
      client.on("auth_missing", () => {
        void handleAuthMissing()
      }),
      client.on("session_conflict", handleSessionConflict),
      client.on("error", handleGenericError),
      client.on("rate_limit", handleRateLimit),
      client.on("online_users", handleOnlineUsers),
      client.on("user_online", (payload: any) => handleUserStatusChange(payload, true)),
      client.on("user_offline", (payload: any) => handleUserStatusChange(payload, false)),
      client.on("conversation_started", handleConversationStarted),
      client.on("private_message_history", handlePrivateMessageHistory),
      client.on("private_message_sent", handleIncomingPrivateMessage),
      client.on("new_private_message", handleIncomingPrivateMessage),
      client.on("user_groups", processUserGroups),
      client.on("group_messages", processGroupMessages),
      client.on("group_message_sent", processIncomingGroupMessage),
      client.on("new_group_message", processIncomingGroupMessage),
      client.on("group_created", handleGroupCreated),
      client.on("message_edited", handleMessageEdited),
      client.on("message_deleted", handleMessageDeleted),
      client.on("group_message_edited", handleGroupMessageEdited),
      client.on("group_message_deleted", handleGroupMessageDeleted),
      client.on("message_pinned", handleMessagePinned),
      client.on("message_unpinned", handleMessageUnpinned),
      client.on("pinned_message", handlePinnedMessage),
      client.on("reaction_added", handleReactionAdded),
      client.on("reaction_removed", handleReactionRemoved),
      client.on("group_reaction_added", handleReactionAdded),
      client.on("group_reaction_removed", handleReactionRemoved),
      client.on("community_list", handleCommunityList),
      client.on("community_members", handleCommunityMembers),
      client.on("community_progress", handleCommunityProgress),
      client.on("community_progress_update", handleCommunityProgressUpdate),
      client.on("group_members", handleGroupMembers),
      client.on("member_added", handleMemberAdded),
      client.on("member_removed", handleMemberRemoved),
      client.on("member_left", handleMemberRemoved),
      client.on("conversation_deleted", handleConversationDeleted),
      client.on("group_deleted", handleGroupDeleted),
      client.on("message_marked_read", handleMessageMarkedRead),
      client.on("message_read", handleMessageReadNotification),
    ]

    client.connect()

    return () => {
      subscriptions.forEach((unsubscribe) => unsubscribe?.())
      chatClientRef.current?.disconnect()
      chatClientRef.current = null
    }
  }, [
    appendMessages,
    formatRelativeTime,
    loadInitialConversationsFromServer,
    loadFollowerContacts,
    markConversationMessagesRead,
    markLatestPendingAsFailed,
    processGroupMessages,
    processIncomingGroupMessage,
    processUserGroups,
    prependMessages,
    refreshConversations,
    refreshMessages,
    replaceMessages,
    resolveParticipantInfo,
    scrollToBottom,
    updateHistoryState,
    toMessageEntry,
    updateOnlineStatusForParticipant,
    updateConversationPreviewFromMessages,
    upsertConversationFromServer,
    handleMessageEdited,
    handleMessageDeleted,
    handleGroupMessageEdited,
    handleGroupMessageDeleted,
    handleMessagePinned,
    handleMessageUnpinned,
    handlePinnedMessage,
    handleReactionAdded,
    handleReactionRemoved,
    handleCommunityList,
    handleCommunityMembers,
    handleCommunityProgress,
    handleCommunityProgressUpdate,
    handleGroupMembers,
    handleMemberAdded,
    handleMemberRemoved,
    handleConversationDeleted,
    handleGroupCreated,
    handleGroupDeleted,
    handleMessageMarkedRead,
    handleMessageReadNotification,
  ])

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // Changed to lg breakpoint
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Removed auto-scroll on conversation selection to prevent unwanted scrolling

  const filteredConversations = conversationsData.filter((conv) => {
    const matchesSearch =
      conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (activeTab === "all") return matchesSearch
    if (activeTab === "followers") return false
    if (activeTab === "groups") return matchesSearch && conv.type === "group"
    if (activeTab === "community") return matchesSearch && conv.type === "community"
    
    return matchesSearch
  })

  const filteredFollowers = useMemo(() => {
    if (activeTab !== "followers") return followers
    const query = searchQuery.trim().toLowerCase()
    if (!query) return followers
    return followers.filter((contact) => {
      return (
        contact.displayName.toLowerCase().includes(query) ||
        contact.username.toLowerCase().includes(query)
      )
    })
  }, [activeTab, followers, searchQuery])

  const selectedConv = selectedConversation ? conversationsData.find(c => c.id === selectedConversation) : null
  const selectedMessages = selectedConversation ? messagesData[selectedConversation] || [] : []
  const selectedGroupId = useMemo(() => {
    if (!selectedConv || selectedConv.type !== "group") return null
    return selectedConv.groupId ?? null
  }, [selectedConv])
  const activeHistoryState = useMemo(() => {
    if (selectedConversation == null) return null
    const serverConversationId = uiToServerConversationIdMapRef.current.get(selectedConversation)
    if (!serverConversationId) return null
    return historyStateRef.current.get(serverConversationId) ?? null
  }, [selectedConversation, historyStateVersion])
  const showHistoryLoading = Boolean(activeHistoryState?.loading)
  const showHistoryCTA =
    Boolean(activeHistoryState?.initialLoaded) &&
    Boolean(activeHistoryState?.hasMore) &&
    !activeHistoryState?.loading &&
    selectedMessages.length > 0
  useEffect(() => {
    setReactionMenuTarget(null)
  }, [selectedConversation])
  const activePinnedMessage = useMemo(() => {
    if (!selectedGroupId) return null
    return pinnedMessagesRef.current[selectedGroupId] ?? null
  }, [selectedGroupId, pinnedMessagesVersion])
  const selectedGroupMembersList = useMemo(() => {
    if (!selectedConv || selectedConv.type !== "group" || !selectedConv.groupId) return []
    return groupMembersRef.current[selectedConv.groupId] ?? []
  }, [selectedConv, groupMembersVersion])
  const existingGroupMemberIds = useMemo(
    () => new Set(selectedGroupMembersList.map((member) => member.userId)),
    [selectedGroupMembersList],
  )
  const filteredNewChatUsers = useMemo(() => {
    const query = newChatSearch.trim().toLowerCase()
    if (!query) return onlineUsersList
    return onlineUsersList.filter(
      (user) =>
        user.displayName.toLowerCase().includes(query) || user.username.toLowerCase().includes(query),
    )
  }, [newChatSearch, onlineUsersList])
  const addMemberCandidates = useMemo(() => {
    if (!selectedConv || selectedConv.type !== "group") return []
    const followerMap = new Map(followers.map((contact) => [contact.id, contact]))
    const mergedList = onlineUsersList.map((user) => {
      const followerInfo = followerMap.get(user.id)
      return followerInfo
        ? {
            id: user.id,
            username: followerInfo.username,
            displayName: followerInfo.displayName,
          }
        : user
    })
    const base = mergedList.filter((user) => !existingGroupMemberIds.has(user.id))
    const query = addMemberSearch.trim().toLowerCase()
    if (!query) return base
    return base.filter(
      (user) =>
        user.displayName.toLowerCase().includes(query) || user.username.toLowerCase().includes(query),
    )
  }, [addMemberSearch, existingGroupMemberIds, followers, onlineUsersList, selectedConv])
  const selectedGroupMemberDetails = useMemo(() => {
    return selectedGroupMembers.map((memberId) => {
      const match = onlineUsersList.find((user) => user.id === memberId)
      return (
        match ?? {
          id: memberId,
          username: memberId,
          displayName: humanizeIdentifier(memberId, memberId),
        }
      )
    })
  }, [onlineUsersList, selectedGroupMembers])

  const performBlockAction = useCallback(
    async (endpoint: "/block" | "/unblock", successMessage: string, defaultError: string) => {
      if (!selectedConv || selectedConv.type !== "personal") {
        setStatusBanner({
          variant: "error",
          message: "Direct conversation required for this action.",
        })
        return
      }

      if (!AUTH_BASE_URL) {
        setStatusBanner({
          variant: "error",
          message: "Blocking service is not configured.",
        })
        return
      }

      const participantIdRaw = selectedConv.participantId ?? selectedConv.username
      const participantId = participantIdRaw != null ? Number(participantIdRaw) : NaN

      if (!participantIdRaw || Number.isNaN(participantId)) {
        setStatusBanner({
          variant: "error",
          message: "Unable to determine the user ID for this conversation.",
        })
        return
      }

      setInfoActionPending(true)

      try {
        const token = await resolveStoredToken()
        if (!token) {
          setStatusBanner({
            variant: "error",
            message: "You need to sign in again before performing this action.",
          })
          return
        }

        const baseUrl = AUTH_BASE_URL.replace(/\/$/, "")
        const url = `${baseUrl}/v1/users${endpoint}`
        const response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: participantId }),
        })

        let responseMessage: string | null = null
        try {
          const data = await response.json()
          responseMessage = typeof data?.message === "string" ? data.message : null
        } catch {
          responseMessage = null
        }

        if (response.ok) {
          setStatusBanner({
            variant: "info",
            message: responseMessage ?? successMessage,
          })
          setShowInfoDialog(false)
        } else {
          setStatusBanner({
            variant: "error",
            message: responseMessage ?? defaultError,
          })
        }
      } catch (error) {
        console.error("Block action failed:", error)
        setStatusBanner({
          variant: "error",
          message: defaultError,
        })
      } finally {
        setInfoActionPending(false)
      }
    },
    [AUTH_BASE_URL, resolveStoredToken, selectedConv, setStatusBanner],
  )

  const handleBlockUser = useCallback(() => {
    void performBlockAction("/block", "User blocked successfully.", "Failed to block this user.")
  }, [performBlockAction])

  const handleUnblockUser = useCallback(() => {
    void performBlockAction("/unblock", "User unblocked successfully.", "Failed to unblock this user.")
  }, [performBlockAction])

  const handleLeaveGroup = useCallback(() => {
    if (!selectedConv || selectedConv.type !== "group" || !selectedConv.groupId) {
      setStatusBanner({
        variant: "error",
        message: "Group information not available.",
      })
      return
    }

    if (!chatClientRef.current) {
      setStatusBanner({
        variant: "error",
        message: "Chat connection is not ready. Please try again shortly.",
      })
      return
    }

    chatClientRef.current.leaveGroup(selectedConv.groupId)
    setStatusBanner({
      variant: "info",
      message: "Requested to leave the group.",
    })
    setShowInfoDialog(false)
  }, [selectedConv, setStatusBanner])
  const canManageMembers = useMemo(() => {
    if (!selectedConv || selectedConv.type !== "group") return false
    const role = (selectedConv.myRole ?? "").toLowerCase()
    return role === "owner" || role === "admin"
  }, [selectedConv])

  const retrySendMessage = useCallback(
    (tempId: string) => {
      const conversationId = selectedConversationRef.current
      if (conversationId == null) return
      const conversation = conversationMapRef.current.get(conversationId)
      if (!conversation) return

      const messages = messagesRef.current[conversationId]
      if (!messages) return
      const pendingMessage = messages.find((message) => message.id === tempId)
      if (!pendingMessage) return

      const client = chatClientRef.current
      if (!client) return

      messagesRef.current[conversationId] = messages.map((message) =>
        message.id === tempId
          ? { ...message, pending: true, failed: false }
          : message,
      )
      refreshMessages()

      if (conversation.type === "group" && conversation.groupId) {
        client.sendGroupMessage(conversation.groupId, pendingMessage.content)
      } else if (conversation.participantId) {
        client.sendPrivateMessage(conversation.participantId, pendingMessage.content)
      }
    },
    [refreshMessages],
  )

  const handleToggleGroupMember = useCallback((userId: string) => {
    setSelectedGroupMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    )
  }, [])

  const handleCreateGroup = useCallback(() => {
    const client = chatClientRef.current
    if (!client) return

    const name = newGroupName.trim()
    if (!name) {
      setStatusBanner({
        variant: "warning",
        message: "Enter a group name before creating the group.",
      })
      return
    }

    if (selectedGroupMembers.length === 0) {
      setStatusBanner({
        variant: "warning",
        message: "Select at least one member to add to the group.",
      })
      return
    }

    setPendingGroupAction(true)
    try {
      client.createGroup(name, Array.from(new Set(selectedGroupMembers)))
      setStatusBanner({
        variant: "info",
        message: `Creating group "${name}"…`,
      })
      setShowNewChatDialog(false)
    } catch (error) {
      setStatusBanner({
        variant: "error",
        message: (error as Error)?.message ?? "Failed to create group.",
      })
    } finally {
      setPendingGroupAction(false)
    }
  }, [newGroupName, selectedGroupMembers, setStatusBanner])

  const handleAddMemberToGroup = useCallback(
    (userId: string) => {
      const conversationId = selectedConversationRef.current
      if (conversationId == null) return
      const conversation = conversationMapRef.current.get(conversationId)
      if (!conversation || conversation.type !== "group" || !conversation.groupId) return
      const role = (conversation.myRole ?? "").toLowerCase()
      if (role !== "owner" && role !== "admin") {
        setStatusBanner({
          variant: "warning",
          message: "Only group admins can add members.",
        })
        return
      }
      const client = chatClientRef.current
      if (!client) return

      setPendingGroupAction(true)
      try {
      client.addGroupMember(conversation.groupId, userId)
        setStatusBanner({
          variant: "info",
          message: "Sending group invite…",
        })
        setShowAddMemberDialog(false)
      } catch (error) {
        setStatusBanner({
          variant: "error",
          message: (error as Error)?.message ?? "Failed to add member.",
        })
      } finally {
        setPendingGroupAction(false)
      }
    },
    [setStatusBanner],
  )

  const handleDeleteGroup = useCallback(() => {
    const conversationId = selectedConversationRef.current
    if (conversationId == null) return
    const conversation = conversationMapRef.current.get(conversationId)
    if (!conversation || conversation.type !== "group" || !conversation.groupId) return
    const role = (conversation.myRole ?? "").toLowerCase()
    if (role !== "owner" && role !== "admin") {
      setStatusBanner({
        variant: "warning",
        message: "Only group admins can delete the group.",
      })
      return
    }

    const client = chatClientRef.current
    if (!client) return

    const confirmDelete = window.confirm("Delete this group for everyone?")
    if (!confirmDelete) {
      return
    }

    const permanent = window.confirm(
      "Permanently delete this group?\n\nOK = permanently delete.\nCancel = allow 30-day restore window.",
    )

    try {
      client.deleteGroup(conversation.groupId, permanent)
      setStatusBanner({
        variant: "info",
        message: permanent ? "Deleting group permanently…" : "Deleting group…",
      })
    } catch (error) {
      setStatusBanner({
        variant: "error",
        message: (error as Error)?.message ?? "Failed to delete group.",
      })
    }
  }, [setStatusBanner])

  const handleDeleteConversation = useCallback(() => {
    const conversationId = selectedConversationRef.current
    if (conversationId == null) return
    const conversation = conversationMapRef.current.get(conversationId)
    if (!conversation) return
    const serverConversationId = uiToServerConversationIdMapRef.current.get(conversationId)
    if (!serverConversationId) {
      setStatusBanner({
        variant: "error",
        message: "Unable to determine conversation identifier.",
      })
      return
    }

    const confirmDelete = window.confirm("Delete this conversation?\n\nOK = delete, Cancel = keep.")
    if (!confirmDelete) {
      return
    }

    const deleteEverywhere = conversation.type === "personal"
      ? window.confirm(
          "Delete for everyone?\n\nOK = delete for both participants.\nCancel = delete only for yourself.",
        )
      : false
    const client = chatClientRef.current
    if (!client) return

    try {
      client.deleteConversation(serverConversationId, deleteEverywhere)
      setStatusBanner({
        variant: "info",
        message: deleteEverywhere
          ? "Deleting conversation for all participants…"
          : "Deleting conversation…",
      })
    } catch (error) {
      setStatusBanner({
        variant: "error",
        message: (error as Error)?.message ?? "Failed to delete conversation.",
      })
    }
  }, [setStatusBanner])

  const handleSendMessage = useCallback(() => {
    const trimmed = messageText.trim()
    if (!trimmed || selectedConversation == null) return

    const conversation = conversationMapRef.current.get(selectedConversation)
    if (!conversation) return

    const client = chatClientRef.current
    if (!client) return

    if (conversation.type === "group" && !conversation.groupId) {
      setStatusBanner({
        variant: "warning",
        message: "Group information not ready yet. Please try again shortly.",
      })
      return
    }

    if (conversation.type !== "group" && !conversation.participantId) {
      setStatusBanner({
        variant: "warning",
        message: "Conversation not ready yet. Please try again in a moment.",
      })
      return
    }

    const isEditingCurrent =
      editingContext && editingContext.conversationId === selectedConversation

    if (isEditingCurrent) {
      const targetMessageId = editingContext.serverId
      const serverConversationId =
        conversation.type === "group"
          ? conversation.groupId
          : uiToServerConversationIdMapRef.current.get(selectedConversation)

      if (!serverConversationId) {
        setStatusBanner({
          variant: "error",
          message: "Unable to locate conversation. Please reload and try again.",
        })
        return
      }

      const previousContent = editingContext.originalContent
      applyMessageUpdate(String(serverConversationId), targetMessageId, (current) => ({
        ...current,
        content: trimmed,
        edited: true,
        deleted: false,
      }))
      updateConversationPreviewFromMessages(selectedConversation)
      setMessageText("")
      setEditingContext(null)
      setShowEmojiPicker(false)

      try {
        if (conversation.type === "group" && conversation.groupId) {
          client.editGroupMessage(targetMessageId, trimmed)
        } else {
          client.editPrivateMessage(targetMessageId, trimmed)
        }
      } catch (error) {
        applyMessageUpdate(String(serverConversationId), targetMessageId, (current) => ({
          ...current,
          content: previousContent,
          edited: current.edited,
        }))
        setStatusBanner({
          variant: "error",
          message: (error as Error)?.message ?? "Failed to edit message. Please try again.",
        })
      }
      return
    }

    const replyServerId =
      replyContext && replyContext.conversationId === selectedConversation
        ? replyContext.serverId
        : undefined
    const replyPreview = replyContext?.preview
    const replySender = replyContext?.senderName

    const tempId =
      crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const now = new Date().toISOString()
    const optimisticMessage: MessageEntry = {
      id: tempId,
      senderId: "me",
      senderName: "You",
      content: trimmed,
      timestamp: formatMessageTime(now),
      rawTimestamp: now,
      type: "text",
      isRead: conversation.type !== "group",
      pending: true,
      failed: false,
      replyToId: replyServerId,
      replyPreview,
      replySender,
    }

    const existing = messagesRef.current[selectedConversation] ?? []
    messagesRef.current[selectedConversation] = [...existing, optimisticMessage]
    refreshMessages()

    const conversationSnapshot = conversationMapRef.current.get(selectedConversation)
    if (conversationSnapshot) {
      conversationMapRef.current.set(selectedConversation, {
        ...conversationSnapshot,
        lastMessage: trimmed,
        timestamp: "Just now",
      })
      refreshConversations()
    }

    setMessageText("")
    setShowEmojiPicker(false)
    setReplyContext(null)
      setTimeout(() => {
        scrollToBottom()
    }, 50)

    try {
      if (conversation.type === "group" && conversation.groupId) {
        client.sendGroupMessage(conversation.groupId, trimmed, replyServerId)
      } else if (conversation.participantId) {
        client.sendPrivateMessage(conversation.participantId, trimmed, replyServerId)
      }
    } catch (error) {
      markMessageAsFailed(selectedConversation, tempId)
      setStatusBanner({
        variant: "error",
        message: (error as Error)?.message ?? "Failed to send message. Please try again.",
      })
    }
  }, [
    applyMessageUpdate,
    editingContext,
    formatMessageTime,
    markMessageAsFailed,
    messageText,
    refreshConversations,
    refreshMessages,
    replyContext,
    scrollToBottom,
    selectedConversation,
    setStatusBanner,
    updateConversationPreviewFromMessages,
  ])

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
    },
    [handleSendMessage],
  )

  const handleConversationSelect = useCallback(
    (conversationId: number) => {
      const conversation = conversationMapRef.current.get(conversationId)
      if (!conversation) return

    setSelectedConversation(conversationId)
      selectedConversationRef.current = conversationId

    if (isMobile) {
      setShowConversations(false)
    }

      if (conversation.type === "group" && conversation.groupId && !loadedGroupMembersRef.current.has(conversation.groupId)) {
        chatClientRef.current?.getGroupMembers(conversation.groupId)
        loadedGroupMembersRef.current.add(conversation.groupId)
      }

      const serverConversationId = uiToServerConversationIdMapRef.current.get(conversationId)
      if (serverConversationId) {
        const historyState = ensureHistoryState(serverConversationId)
        if (!historyState.initialLoaded) {
          loadConversationHistory(conversationId, { initial: true })
        }
      } else {
        loadConversationHistory(conversationId, { initial: true })
      }

      markConversationMessagesRead(conversationId)
    },
    [ensureHistoryState, isMobile, loadConversationHistory, markConversationMessagesRead],
  )

  useEffect(() => {
    selectedConversationRef.current = selectedConversation
  }, [selectedConversation])

  useEffect(() => {
    if (!selectedConversation) {
      setShowInfoDialog(false)
      setInfoActionPending(false)
    }
  }, [selectedConversation])

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return
    const handler = () => handleMessageScroll()
    container.addEventListener("scroll", handler, { passive: true })
    return () => {
      container.removeEventListener("scroll", handler)
    }
  }, [handleMessageScroll, selectedConversation, messagesData])

  useLayoutEffect(() => {
    const pending = pendingScrollAdjustmentRef.current
    if (!pending) return
    if (selectedConversationRef.current !== pending.conversationId) {
      pendingScrollAdjustmentRef.current = null
      return
    }
    const container = messagesContainerRef.current
    if (!container) {
      pendingScrollAdjustmentRef.current = null
      return
    }
    const heightDelta = container.scrollHeight - pending.previousHeight
    container.scrollTop = Math.max(0, pending.previousScrollTop + heightDelta)
    pendingScrollAdjustmentRef.current = null
  }, [historyStateVersion, messagesData])

  useEffect(() => {
    if (!selectedGroupId) return
    chatClientRef.current?.getPinnedMessage(selectedGroupId)
  }, [selectedGroupId])

  useEffect(() => {
    setReactionMenuTarget(null)
  }, [selectedConversation])

  useEffect(() => {
    editingContextRef.current = editingContext
  }, [editingContext])

  useEffect(() => {
    replyContextRef.current = replyContext
  }, [replyContext])

  useEffect(() => {
    if (editingContext && editingContext.conversationId !== selectedConversation) {
      setEditingContext(null)
      setMessageText("")
    }
    if (replyContext && replyContext.conversationId !== selectedConversation) {
      setReplyContext(null)
    }
    setShowEmojiPicker(false)
  }, [editingContext, replyContext, selectedConversation])

  const handleBackToConversations = () => {
    if (isMobile) {
      setShowConversations(true)
      setSelectedConversation(null)
    }
  }

  useEffect(() => {
    if (!showNewChatDialog) {
      setNewChatSearch("")
      setNewChatMode("dm")
      setNewGroupName("")
      setSelectedGroupMembers([])
    }
  }, [showNewChatDialog])

  const renderMessageBubble = ({
    entry,
    messages,
    conversation,
    selectedConversationId,
    canManageMembers,
  }: {
    entry: MessageEntry
    messages: MessageEntry[]
    conversation: ConversationType
    selectedConversationId: number | null
    canManageMembers: boolean
  }) => {
    const message = entry
    const isOwnMessage = message.senderId === "me"
    const replyTarget =
      message.replyToId != null
        ? messages.find(
            (candidate) =>
              candidate.serverId === message.replyToId || candidate.id === message.replyToId,
          )
        : undefined
    const replySummary = message.replyPreview ?? replyTarget?.content
    const replySenderName =
      message.replySender ??
      (replyTarget
        ? replyTarget.senderId === "me"
          ? "You"
          : replyTarget.senderName
        : undefined)
    const currentUserId = currentUserIdRef.current
    const messageKey = String(message.serverId ?? message.id)
    const canEdit = isOwnMessage && !message.deleted && !message.pending && !message.failed
    const canDelete = isOwnMessage && !message.pending
    const canReply = !message.deleted
    const canPinMessage =
      conversation?.type === "group" && canManageMembers && !message.deleted && !message.pending
    const canReact = !message.deleted && !message.pending
    const isReactionMenuOpen =
      reactionMenuTarget != null &&
      selectedConversationId != null &&
      reactionMenuTarget.conversationId === selectedConversationId &&
      reactionMenuTarget.messageId === messageKey
    const currentUserIdString = currentUserId != null ? String(currentUserId) : null
    const isEditingThis =
      editingContext?.conversationId === selectedConversationId &&
      editingContext?.messageId === message.id
    const showToolbar = canReact || canReply || canEdit || canDelete || canPinMessage
    const toolbarAlignmentClass = isOwnMessage ? "justify-end" : "justify-start"
    const bubbleClass = cn(
      "rounded-3xl border px-4 py-3 shadow-lg transition-colors duration-200 backdrop-blur-sm",
      isOwnMessage
        ? "bg-gradient-to-br from-blue-600 via-blue-600 to-blue-500 text-white border-blue-500/60"
        : "bg-zinc-900/85 border-zinc-800/70 text-zinc-100",
      message.pending && isOwnMessage ? "opacity-80" : "",
      message.isPinned ? "border-blue-400/80 shadow-[0_0_18px_rgba(37,99,235,0.35)]" : "",
      isEditingThis ? "ring-2 ring-blue-400/70" : "",
    )

    return (
      <motion.div
        key={message.id}
        className={cn(
          "group/message flex w-full gap-3",
          isOwnMessage ? "justify-end" : "justify-start",
        )}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        layout
        onDoubleClick={(event) => {
          event.preventDefault()
          if (selectedConversationId != null) {
            handleQuickHeart(selectedConversationId, message)
          }
        }}
        onMouseEnter={() => {
          if (selectedConversationId != null) {
            setHoveredMessageTarget({ conversationId: selectedConversationId, messageId: messageKey })
          }
        }}
        onMouseLeave={() => {
          if (!isReactionMenuOpen && selectedConversationId != null) {
            setHoveredMessageTarget((current) =>
              current && current.conversationId === selectedConversationId && current.messageId === messageKey
                ? null
                : current,
            )
          }
        }}
      >
        {!isOwnMessage && (
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage
              src={
                conversation.type === "personal"
                  ? conversation.avatar ?? DEFAULT_AVATAR
                  : conversation.avatar ?? "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&h=150&fit=crop&crop=faces"
              }
            />
            <AvatarFallback className="bg-zinc-800 text-[10px] uppercase">
              {message.senderName.charAt(0)}
            </AvatarFallback>
          </Avatar>
        )}

        <div className={cn("flex max-w-full flex-col", isOwnMessage ? "items-end" : "items-start")}>
          {!isOwnMessage && (
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {message.senderName}
            </p>
          )}
          <div className="relative w-full">
            {showToolbar && (
              <div className={cn("pointer-events-none absolute -top-10 flex w-full", toolbarAlignmentClass)}>
                <div className="pointer-events-auto inline-flex items-center gap-1 rounded-full border border-zinc-700/70 bg-black/75 px-2 py-1 text-xs text-zinc-200 shadow-lg opacity-0 translate-y-2 transition-all duration-150 group-hover/message:translate-y-0 group-hover/message:opacity-100">
                  {canReact && (
                    <button
                      type="button"
                      title="React"
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        if (selectedConversationId != null) {
                          toggleReactionMenuForMessage(selectedConversationId, message)
                        }
                      }}
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full border border-zinc-600/60 bg-zinc-900/70 text-zinc-200 transition hover:bg-zinc-800",
                        isReactionMenuOpen ? "border-blue-500 text-blue-200" : "",
                      )}
                    >
                      <SmilePlus className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {canReply && (
                    <button
                      type="button"
                      title="Reply"
                      onClick={() =>
                        selectedConversationId != null && handleReplyToMessage(selectedConversationId, message)
                      }
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-600/60 bg-zinc-900/70 text-zinc-200 transition hover:bg-zinc-800"
                    >
                      <CornerDownLeft className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {canEdit && (
                    <button
                      type="button"
                      title="Edit"
                      onClick={() =>
                        selectedConversationId != null && handleBeginEditMessage(selectedConversationId, message)
                      }
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-600/60 bg-zinc-900/70 text-zinc-200 transition hover:bg-zinc-800"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {canPinMessage && (
                    <button
                      type="button"
                      title={message.isPinned ? "Unpin message" : "Pin message"}
                      onClick={() => {
                        if (selectedConversationId == null) return
                        message.isPinned
                          ? handleUnpinMessageRequest(selectedConversationId, message)
                          : handlePinMessageRequest(selectedConversationId, message)
                      }}
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-600/60 bg-zinc-900/70 text-zinc-200 transition hover:bg-zinc-800"
                    >
                      {message.isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      title="Delete"
                      onClick={() => {
                        if (selectedConversationId != null) {
                          handleDeleteMessage(selectedConversationId, message)
                        }
                      }}
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-600/60 bg-zinc-900/70 text-red-300 transition hover:bg-zinc-800"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className={bubbleClass}>
              {replySummary && (
                <div
                  className={cn(
                    "mb-3 rounded-2xl border px-3 py-2 text-xs",
                    isOwnMessage
                      ? "border-white/20 bg-white/10 text-white/80"
                      : "border-zinc-700/70 bg-zinc-800/70 text-zinc-200",
                  )}
                >
                  <p className="mb-0.5 font-semibold uppercase tracking-wide text-[10px] opacity-70">
                    Replying to {replySenderName ?? "previous message"}
                  </p>
                  <p className="line-clamp-2 opacity-80">{replySummary}</p>
                </div>
              )}

              <p
                className={cn(
                  "text-sm leading-relaxed break-words",
                  message.deleted ? "italic opacity-70" : "",
                )}
              >
                {message.deleted
                  ? message.content || "This message was deleted."
                  : message.content}
              </p>

              <div
                className={cn(
                  "mt-4 flex items-center gap-3 text-[11px]",
                  isOwnMessage ? "justify-end text-white/80" : "justify-start text-zinc-400",
                )}
              >
                {message.isPinned && (
                  <span className="uppercase tracking-wide text-[10px] text-blue-300">Pinned</span>
                )}
                <span>{message.timestamp}</span>
                {message.edited && !message.deleted && (
                  <span className="italic opacity-80">Edited</span>
                )}
                {message.pending && <span className="italic opacity-90">Sending…</span>}
                {message.failed && (
                  <button
                    type="button"
                    onClick={() => retrySendMessage(message.id)}
                    className="text-red-300 underline underline-offset-2"
                  >
                    Retry
                  </button>
                )}
                {isOwnMessage && !message.pending && !message.failed && !message.deleted && (
                  message.isRead ? (
                    <CheckCheck className="h-3 w-3 text-white/70" />
                  ) : (
                    <Check className="h-3 w-3 text-white/60" />
                  )
                )}
              </div>
            </div>

            {isReactionMenuOpen && (
              <div
                className={cn(
                  "absolute -bottom-12 flex gap-1 rounded-full border border-zinc-700/60 bg-black/80 px-2 py-1 text-xs text-zinc-200 shadow-lg",
                  isOwnMessage ? "right-0" : "left-0",
                )}
              >
                {REACTION_CHOICES.map((emoji) => {
                  const userHasReacted = currentUserIdString
                    ? Boolean(message.reactions?.[emoji]?.users.includes(currentUserIdString))
                    : false
                  return (
                    <button
                      key={emoji}
                      type="button"
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        if (selectedConversationId != null) {
                          handleSelectReaction(selectedConversationId, message, emoji)
                        }
                      }}
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full text-sm transition",
                        userHasReacted ? "bg-blue-600 text-white hover:bg-blue-500" : "hover:bg-zinc-800",
                      )}
                    >
                      {emoji}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {message.reactions && Object.keys(message.reactions).length > 0 && !message.deleted && (
            <div
              className={cn(
                "mt-3 flex flex-wrap gap-1 text-[11px]",
                isOwnMessage ? "justify-end" : "justify-start",
              )}
            >
              {Object.entries(message.reactions).map(([emoji, info]) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    if (selectedConversationId != null) {
                      toggleReactionMenuForMessage(selectedConversationId, message)
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded-full border border-zinc-700/70 bg-zinc-900/60 px-2 py-1 text-zinc-300 hover:border-zinc-600"
                >
                  <span>{emoji}</span>
                  <span>{info.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <DashboardLayout showBottomNav={false}>
      <div className="min-h-screen bg-black">
        {/* Mobile Header */}
        <div className="bg-black border-b border-zinc-800 px-3 py-2.5 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {isMobile && selectedConversation && !showConversations ? (
                <EnhancedButton
                  variant="ghost"
                  size="icon"
                  className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 h-8 w-8"
                  onClick={handleBackToConversations}
                >
                  <ArrowLeft className="h-4 w-4" />
                </EnhancedButton>
              ) : (
                <EnhancedButton
                  variant="ghost"
                  size="icon"
                  className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 h-8 w-8"
                  onClick={() => router.back()}
                >
                  <ArrowLeft className="h-4 w-4" />
                </EnhancedButton>
              )}
              <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {isMobile && selectedConversation && !showConversations ? selectedConv?.name : "Messages"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
                <DialogTrigger asChild>
                  <EnhancedButton
                    variant="ghost"
                    size="icon"
                    className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 h-8 w-8"
                  >
                    <Plus className="h-4 w-4" />
                  </EnhancedButton>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900 border border-zinc-800 text-white max-w-md mx-4 rounded-xl">
                  <DialogHeader>
                    <DialogTitle className="text-base font-bold text-white">
                      New Message
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <EnhancedButton
                        variant={newChatMode === "dm" ? "default" : "ghost"}
                        size="sm"
                        className={cn(
                          "px-3 py-1 text-xs",
                          newChatMode === "dm" ? "bg-blue-600 hover:bg-blue-700" : "bg-zinc-800 hover:bg-zinc-700",
                        )}
                        onClick={() => setNewChatMode("dm")}
                      >
                        Direct Message
                      </EnhancedButton>
                      <EnhancedButton
                        variant={newChatMode === "group" ? "default" : "ghost"}
                        size="sm"
                        className={cn(
                          "px-3 py-1 text-xs",
                          newChatMode === "group" ? "bg-blue-600 hover:bg-blue-700" : "bg-zinc-800 hover:bg-zinc-700",
                        )}
                        onClick={() => setNewChatMode("group")}
                      >
                        Group Chat
                      </EnhancedButton>
                    </div>

                    {newChatMode === "group" && (
                    <Input
                        placeholder="Group name"
                        value={newGroupName}
                        onChange={(event) => setNewGroupName(event.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg h-9 text-sm"
                    />
                    )}

                    <Input
                      placeholder={newChatMode === "group" ? "Search members..." : "Search..."}
                      value={newChatSearch}
                      onChange={(event) => setNewChatSearch(event.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg h-9 text-sm"
                    />

                    {newChatMode === "group" && selectedGroupMemberDetails.length > 0 && (
                      <div className="flex items-center flex-wrap gap-1.5 bg-zinc-900/40 border border-zinc-800 rounded-lg px-2 py-2 text-xs text-zinc-300">
                        {selectedGroupMemberDetails.map((member) => (
                          <button
                            key={member.id}
                            type="button"
                            className="flex items-center gap-1 bg-blue-600/20 border border-blue-600/40 rounded-full px-2 py-1 hover:bg-blue-600/30 transition"
                            onClick={() => handleToggleGroupMember(member.id)}
                          >
                            <span>{member.displayName ?? member.username ?? member.id}</span>
                            <span className="text-blue-200">✕</span>
                          </button>
                        ))}
                        {selectedGroupMemberDetails.length > 0 && (
                          <span className="ml-auto text-[10px] text-zinc-500 uppercase tracking-wide">
                            {selectedGroupMemberDetails.length} selected
                          </span>
                        )}
                      </div>
                    )}

                    <div className="space-y-1 max-h-80 overflow-y-auto hide-scrollbar">
                      {filteredNewChatUsers.length === 0 ? (
                        <p className="text-xs text-zinc-500 text-center py-6">
                          {onlineUsersList.length === 0
                            ? "No contacts are online right now."
                            : "No matches found."}
                        </p>
                      ) : newChatMode === "dm" ? (
                        filteredNewChatUsers.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            className="w-full flex items-center gap-2.5 p-2.5 hover:bg-zinc-800/50 rounded-lg transition-colors active:bg-zinc-800"
                          onClick={() => {
                              const client = chatClientRef.current
                              if (client) {
                                client.startConversation(user.id)
                            setShowNewChatDialog(false)
                              }
                          }}
                        >
                          <Avatar className="h-10 w-10">
                              <AvatarImage src={DEFAULT_AVATAR} />
                              <AvatarFallback className="bg-zinc-800">
                                {user.displayName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                          </Avatar>
                            <div className="flex-1 min-w-0 text-left">
                              <h4 className="font-semibold text-white truncate text-sm">
                                {user.displayName}
                              </h4>
                              <p className="text-xs text-zinc-400 truncate">@{user.username}</p>
                          </div>
                          </button>
                        ))
                      ) : (
                        filteredNewChatUsers.map((user) => {
                          const isSelected = selectedGroupMembers.includes(user.id)
                          return (
                            <button
                              key={user.id}
                              type="button"
                              className={cn(
                                "w-full flex items-center gap-2.5 p-2.5 rounded-lg transition-colors",
                                isSelected
                                  ? "bg-blue-600/20 border border-blue-500/40"
                                  : "hover:bg-zinc-800/50",
                              )}
                              onClick={() => handleToggleGroupMember(user.id)}
                            >
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={DEFAULT_AVATAR} />
                                <AvatarFallback className="bg-zinc-800">
                                  {user.displayName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0 text-left">
                                <h4 className="font-semibold text-white truncate text-sm">
                                  {user.displayName}
                                </h4>
                                <p className="text-xs text-zinc-400 truncate">@{user.username}</p>
                        </div>
                              {isSelected && (
                                <span className="text-[10px] text-blue-300 uppercase tracking-wide">
                                  Added
                                </span>
                              )}
                            </button>
                          )
                        })
                      )}
                    </div>

                    {newChatMode === "group" && (
                      <EnhancedButton
                        disabled={
                          pendingGroupAction ||
                          !newGroupName.trim() ||
                          selectedGroupMembers.length === 0
                        }
                        onClick={handleCreateGroup}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-xs py-2"
                      >
                        {pendingGroupAction ? "Creating…" : "Create Group"}
                      </EnhancedButton>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog
                open={showAddMemberDialog && canManageMembers}
                onOpenChange={(value) => {
                  if (!canManageMembers) {
                    setShowAddMemberDialog(false)
                    return
                  }
                  setShowAddMemberDialog(value)
                }}
              >
                <DialogContent className="bg-zinc-900 border border-zinc-800 text-white max-w-md mx-4 rounded-xl">
                  <DialogHeader>
                    <DialogTitle className="text-base font-bold text-white">
                      Add Member
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Input
                      placeholder="Search users..."
                      value={addMemberSearch}
                      onChange={(event) => setAddMemberSearch(event.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg h-9 text-sm"
                    />
                    <div className="space-y-1 max-h-72 overflow-y-auto hide-scrollbar">
                      {addMemberCandidates.length === 0 ? (
                        <p className="text-xs text-zinc-500 text-center py-6">
                          {onlineUsersList.length === 0
                            ? "No contacts are online right now."
                            : "No available users to add."}
                        </p>
                      ) : (
                        addMemberCandidates.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            disabled={pendingGroupAction}
                            className="w-full flex items-center gap-2.5 p-2.5 hover:bg-zinc-800/50 rounded-lg transition-colors active:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => handleAddMemberToGroup(user.id)}
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={DEFAULT_AVATAR} />
                              <AvatarFallback className="bg-zinc-800">
                                {user.displayName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 text-left">
                              <h4 className="font-semibold text-white truncate text-sm">
                                {user.displayName}
                              </h4>
                              <p className="text-xs text-zinc-400 truncate">@{user.username}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog
                open={Boolean(showInfoDialog && selectedConv)}
                onOpenChange={(value) => {
                  setShowInfoDialog(value)
                  if (!value) {
                    setInfoActionPending(false)
                  }
                }}
              >
                <DialogContent className="bg-zinc-900 border border-zinc-800 text-white max-w-md mx-4 rounded-xl">
                  <DialogHeader>
                    <DialogTitle className="text-base font-bold text-white">
                      {selectedConv?.type === "group" ? "Group Info" : "Conversation Info"}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-zinc-400">
                      {selectedConv?.type === "group"
                        ? "Manage your membership in this group."
                        : "Control your direct conversation with this user."}
                    </DialogDescription>
                  </DialogHeader>
                  {selectedConv ? (
                    selectedConv.type === "group" ? (
                      <div className="space-y-4">
                        <div className="space-y-1 text-sm text-zinc-300">
                          <p className="font-semibold text-white">{selectedConv.name}</p>
                          {selectedConv.username && (
                            <p className="text-xs text-zinc-400">@{selectedConv.username}</p>
                          )}
                          {typeof selectedConv.members === "number" && (
                            <p className="text-xs text-zinc-400">
                              Members: {selectedConv.members}
                            </p>
                          )}
                          {selectedConv.myRole && (
                            <p className="text-xs text-zinc-400">
                              Your role: {selectedConv.myRole}
                            </p>
                          )}
                        </div>
                        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
                          <EnhancedButton
                            className="w-full bg-red-600 hover:bg-red-700 text-white"
                            onClick={handleLeaveGroup}
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            Leave group
                          </EnhancedButton>
                        </DialogFooter>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-1 text-sm text-zinc-300">
                          <p className="font-semibold text-white">{selectedConv.name}</p>
                          {selectedConv.username && (
                            <p className="text-xs text-zinc-400">@{selectedConv.username}</p>
                          )}
                          {selectedConv.participantId && (
                            <p className="text-xs text-zinc-500">
                              User ID: {selectedConv.participantId}
                            </p>
                          )}
                        </div>
                        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
                          <EnhancedButton
                            className="w-full bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleBlockUser}
                            disabled={infoActionPending}
                          >
                            {infoActionPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Ban className="mr-2 h-4 w-4" />
                            )}
                            Block user
                          </EnhancedButton>
                          <EnhancedButton
                            variant="outline"
                            className="w-full border-zinc-700 text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleUnblockUser}
                            disabled={infoActionPending}
                          >
                            {infoActionPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <ShieldCheck className="mr-2 h-4 w-4" />
                            )}
                            Unblock user
                          </EnhancedButton>
                        </DialogFooter>
                      </div>
                    )
                  ) : (
                    <p className="text-sm text-zinc-400">No conversation selected.</p>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
          {/* Conversations List */}
          <div className={cn(
            "bg-zinc-900 border-r-0 lg:border-r border-zinc-800 flex flex-col transition-all duration-300",
            isMobile 
              ? (showConversations ? "w-full h-full" : "hidden") 
              : "w-full lg:w-80 xl:w-96"
          )}>
            {/* Search */}
            <div className="p-3 border-b border-zinc-800 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-zinc-800 border-zinc-700 text-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 h-9 text-sm"
                />
              </div>
              <div className="flex items-center gap-2 mt-3 overflow-x-auto hide-scrollbar">
                {[
                  { id: "all", label: "All" },
                  { id: "followers", label: "Followers" },
                  { id: "groups", label: "Groups" },
                  { id: "community", label: "Communities" },
                ].map((tab) => (
                  <EnhancedButton
                    key={tab.id}
                    size="sm"
                    variant={activeTab === tab.id ? "default" : "ghost"}
                    className={cn(
                      "text-xs px-3 py-1.5",
                      activeTab === tab.id
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300",
                    )}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  >
                    {tab.label}
                  </EnhancedButton>
                ))}
              </div>
            </div>


            {/* Conversations */}
            <div className="flex-1 overflow-y-auto hide-scrollbar">
              {activeTab === "followers" ? (
                filteredFollowers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <MessageCircle className="h-10 w-10 text-zinc-600 mb-3" />
                    <h3 className="text-base font-semibold text-white mb-1.5">
                      {followersLoading ? "Loading followers…" : "No followers yet"}
                    </h3>
                    <p className="text-zinc-400 text-xs">
                      {followersLoading
                        ? "Fetching your followers…"
                        : "When someone follows you, they will appear here."}
                    </p>
                  </div>
                ) : (
                  filteredFollowers.map((contact) => (
                    <button
                      key={contact.id}
                      type="button"
                      className="w-full flex items-center gap-2.5 p-3 text-left hover:bg-zinc-800/40 transition-colors active:bg-zinc-800/70"
                      onClick={() => {
                        const client = chatClientRef.current
                        if (client) {
                          client.startConversation(contact.id)
                          setActiveTab("all")
                          setShowConversations(true)
                        }
                      }}
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-11 w-11">
                          <AvatarImage src={contact.avatar} />
                          <AvatarFallback className="bg-zinc-800">
                            {contact.displayName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h3 className="font-semibold text-white truncate text-sm">
                            {contact.displayName}
                          </h3>
                          <Badge className="text-[10px] bg-blue-600/20 text-blue-300 border border-blue-500/30">
                            Follows you
                          </Badge>
                        </div>
                        <p className="text-xs text-zinc-400 truncate">@{contact.username}</p>
                      </div>
                    </button>
                  ))
                )
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <MessageCircle className="h-10 w-10 text-zinc-600 mb-3" />
                  <h3 className="text-base font-semibold text-white mb-1.5">No conversations</h3>
                  <p className="text-zinc-400 text-xs mb-3">Start a new chat to begin messaging</p>
                  <EnhancedButton
                    onClick={() => setShowNewChatDialog(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-xs px-4 py-2"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    New Chat
                  </EnhancedButton>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={cn(
                      "flex items-center gap-2.5 p-3 cursor-pointer transition-all duration-150 active:bg-zinc-800/70",
                      selectedConversation === conversation.id
                        ? "bg-zinc-800/50"
                        : "hover:bg-zinc-800/30"
                    )}
                    onClick={() => handleConversationSelect(conversation.id)}
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-11 w-11">
                        <AvatarImage src={conversation.avatar} />
                        <AvatarFallback className="bg-zinc-800">
                          {conversation.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {conversation.isOnline && (
                        <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-black"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className="font-semibold text-white truncate text-sm">
                          {conversation.name}
                        </h3>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[10px] text-zinc-500">{conversation.timestamp}</span>
                          {conversation.unreadCount > 0 && (
                            <div className="bg-blue-600 text-white text-[10px] font-semibold rounded-full h-4 min-w-[16px] flex items-center justify-center px-1">
                              {conversation.unreadCount}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-xs text-zinc-400 truncate">
                        {conversation.lastMessage}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={cn(
            "flex-1 flex flex-col bg-black",
            isMobile && showConversations ? "hidden" : "flex"
          )}>
            {statusBanner && (
              <div
                className={cn(
                  "px-3 py-2 text-xs",
                  statusBanner.variant === "error"
                    ? "bg-red-900/40 border-b border-red-900/50 text-red-200"
                    : statusBanner.variant === "warning"
                    ? "bg-amber-900/40 border-b border-amber-900/50 text-amber-200"
                    : "bg-blue-900/30 border-b border-blue-900/30 text-blue-200",
                )}
              >
                {statusBanner.message}
              </div>
            )}
            {selectedConversation && selectedConv ? (
              <>
                {/* Chat Header - Desktop Only */}
                {!isMobile && (
                  <div className="bg-zinc-900 border-b border-zinc-800 px-3 py-2.5 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={selectedConv.avatar} />
                          <AvatarFallback className="bg-zinc-800">
                            {selectedConv.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h2 className="font-semibold text-white text-sm">
                            {selectedConv.name}
                          </h2>
                          <p className="text-xs text-zinc-400">
                            {selectedConv.type === "personal" && selectedConv.isOnline
                              ? "Active now"
                              : selectedConv.type === "group"
                              ? `${selectedConv.members} members`
                              : "Community"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedConv.type === "personal" && (
                          <EnhancedButton
                            variant="ghost"
                            size="icon"
                            className="text-zinc-400 hover:text-red-200 hover:bg-red-900/30 h-8 w-8"
                            onClick={handleDeleteConversation}
                          >
                            <Trash2 className="h-4 w-4" />
                          </EnhancedButton>
                        )}
                        {selectedConv.type === "group" && selectedConv.groupId && canManageMembers && (
                          <EnhancedButton
                            variant="ghost"
                            size="icon"
                            className="text-zinc-400 hover:text-red-200 hover:bg-red-900/30 h-8 w-8"
                            onClick={handleDeleteGroup}
                          >
                            <Trash2 className="h-4 w-4" />
                          </EnhancedButton>
                        )}
                        {selectedConv.type === "group" && selectedConv.groupId && canManageMembers && (
                      <EnhancedButton
                        variant="ghost"
                        size="icon"
                        className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 h-8 w-8"
                            onClick={() => {
                              if (
                                selectedConv.groupId &&
                                !loadedGroupMembersRef.current.has(selectedConv.groupId)
                              ) {
                                chatClientRef.current?.getGroupMembers(selectedConv.groupId)
                                loadedGroupMembersRef.current.add(selectedConv.groupId)
                              }
                              setShowAddMemberDialog(true)
                              setAddMemberSearch("")
                            }}
                          >
                            <UserPlus className="h-4 w-4" />
                          </EnhancedButton>
                        )}
                      <EnhancedButton
                        variant="ghost"
                        size="icon"
                        className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 h-8 w-8 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => setShowInfoDialog(true)}
                        disabled={!selectedConv}
                      >
                        <Info className="h-4 w-4" />
                      </EnhancedButton>
                      </div>
                    </div>
                  </div>
                )}

                {selectedConv.type === "group" && activePinnedMessage && (
                  <div className="bg-zinc-900 border-b border-zinc-800 px-3 py-2 flex items-start gap-2">
                    <Pin className="h-3.5 w-3.5 text-blue-300 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-zinc-400 mb-1 truncate">
                        Message from{" "}
                        {activePinnedMessage.senderId === "me"
                          ? "You"
                          : activePinnedMessage.senderName || "Unknown"}
                        {" · "}
                        {activePinnedMessage.timestamp}
                      </p>
                      <p className="text-sm text-zinc-100 leading-relaxed line-clamp-3">
                        {activePinnedMessage.deleted
                          ? activePinnedMessage.content || "This message was deleted."
                          : activePinnedMessage.content}
                      </p>
                    </div>
                    {canManageMembers && selectedConversation != null && (
                      <EnhancedButton
                        variant="ghost"
                        size="icon"
                        className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 h-8 w-8"
                        onClick={() => handleUnpinMessageRequest(selectedConversation, activePinnedMessage)}
                      >
                        <PinOff className="h-3.5 w-3.5" />
                      </EnhancedButton>
                    )}
                  </div>
                )}

                {/* Messages */}
                <div
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto p-3 hide-scrollbar"
                  style={{ scrollBehavior: "smooth" }}
                >
                  <div className="mx-auto flex w-full max-w-3xl flex-col space-y-6 px-2 sm:px-0">
                    {showHistoryLoading ? (
                      <div className="flex justify-center py-2 text-[11px] text-zinc-400">
                        Loading earlier messages…
                        </div>
                    ) : showHistoryCTA ? (
                      <div className="flex justify-center py-1 text-[10px] text-zinc-500">
                        Scroll up to load earlier messages
                        </div>
                    ) : null}
                    {selectedMessages.map((message) => {
                      return renderMessageBubble({
                        entry: message,
                        messages: selectedMessages,
                        conversation: selectedConv,
                        selectedConversationId: selectedConversation,
                        canManageMembers,
                      })
                    })}
                  <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Message Input */}
                <div className="bg-zinc-900 border-t border-zinc-800 p-3 flex-shrink-0 sticky bottom-0">
                  {(editingContext?.conversationId === selectedConversation ||
                    replyContext?.conversationId === selectedConversation) && (
                    <div className="mb-2 flex items-start justify-between gap-2 rounded-lg border border-blue-600/40 bg-blue-900/20 px-3 py-2">
                      <div className="text-xs text-blue-100">
                        {editingContext?.conversationId === selectedConversation ? (
                          <>
                            <p className="font-semibold tracking-wide uppercase text-[10px] text-blue-200">
                              Editing message
                            </p>
                            <p className="truncate text-xs text-blue-100">
                              {editingContext.originalContent}
                            </p>
                          </>
                        ) : replyContext?.conversationId === selectedConversation ? (
                          <>
                            <p className="font-semibold tracking-wide uppercase text-[10px] text-blue-200">
                              Replying to {replyContext.senderName}
                            </p>
                            <p className="truncate text-xs text-blue-100">{replyContext.preview}</p>
                          </>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={
                          editingContext?.conversationId === selectedConversation
                            ? handleCancelEdit
                            : handleCancelReply
                        }
                        className="text-[11px] font-semibold uppercase tracking-wide text-blue-200 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  <div className="flex items-end gap-2">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker((value) => !value)}
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700/70 text-zinc-300 transition",
                          showEmojiPicker ? "bg-zinc-800 text-white" : "bg-zinc-900 hover:bg-zinc-800",
                        )}
                      >
                        <Smile className="h-4 w-4" />
                      </button>
                      {showEmojiPicker && (
                        <div className="absolute bottom-11 left-0 z-30 grid w-40 grid-cols-5 gap-1 rounded-xl border border-zinc-700/70 bg-zinc-900/95 p-2 shadow-lg">
                          {QUICK_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => handleInsertEmoji(emoji)}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-lg hover:bg-zinc-800"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <Input
                      ref={messageInputRef}
                      placeholder="Message..."
                      value={messageText}
                      onFocus={() => setShowEmojiPicker(false)}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1 bg-zinc-800 border-zinc-700 text-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-full px-3.5 text-xs h-9"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim()}
                      className={cn(
                        "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-all",
                        messageText.trim()
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-zinc-800 text-zinc-500",
                      )}
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Empty State */
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center max-w-sm">
                  <MessageCircle className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-white mb-1.5">Select a conversation</h3>
                  <p className="text-zinc-400 mb-4 text-xs">Choose a chat to start messaging</p>
                  <EnhancedButton
                    onClick={() => setShowNewChatDialog(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-xs px-4 py-2"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Start New Chat
                  </EnhancedButton>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
