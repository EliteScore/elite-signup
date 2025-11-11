"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import {
  ArrowLeft,
  Search,
  Info,
  Send,
  Plus,
  Check,
  CheckCheck,
  MessageCircle,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
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
} from "@/components/ui/dialog"

// Mock data for conversations
const conversations = [
  {
    id: 1,
    type: "personal",
    name: "Sarah Williams",
    username: "sarah_w",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces",
    lastMessage: "Thanks for the feedback on my project!",
    timestamp: "2m",
    unreadCount: 0,
    isOnline: true,
    isPinned: false,
    isMuted: false,
  },
  {
    id: 2,
    type: "group",
    name: "EliteScore Developers",
    username: "elitescore_devs",
    avatar: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=150&h=150&fit=crop&crop=faces",
    lastMessage: "Alex: The new feature is ready for testing",
    timestamp: "5m",
    unreadCount: 3,
    isOnline: true,
    isPinned: true,
    isMuted: false,
    members: 8,
  },
  {
    id: 3,
    type: "community",
    name: "Community Announcements",
    username: "elitescore_announcements",
    avatar: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=150&h=150&fit=crop&crop=faces",
    lastMessage: "New challenge: 30-day coding streak starts tomorrow!",
    timestamp: "1h",
    unreadCount: 1,
    isOnline: false,
    isPinned: true,
    isMuted: false,
    isOfficial: true,
  },
  {
    id: 4,
    type: "personal",
    name: "Michael Chen",
    username: "mike_chen",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces",
    lastMessage: "Let's schedule a meeting for next week",
    timestamp: "2h",
    unreadCount: 0,
    isOnline: false,
    isPinned: false,
    isMuted: false,
  },
  {
    id: 5,
    type: "group",
    name: "Study Group - CS101",
    username: "cs101_study",
    avatar: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=150&h=150&fit=crop&crop=faces",
    lastMessage: "Jessica: Don't forget about the assignment due Friday",
    timestamp: "3h",
    unreadCount: 0,
    isOnline: false,
    isPinned: false,
    isMuted: true,
    members: 12,
  },
]

// Mock data for messages
const messages = {
  1: [
    {
      id: 1,
      senderId: "sarah_w",
      senderName: "Sarah Williams",
      content: "Hey! How's your project going?",
      timestamp: "10:30 AM",
      type: "text",
      isRead: true,
    },
    {
      id: 2,
      senderId: "me",
      senderName: "You",
      content: "Going great! Just finished the backend API",
      timestamp: "10:32 AM",
      type: "text",
      isRead: true,
    },
    {
      id: 3,
      senderId: "sarah_w",
      senderName: "Sarah Williams",
      content: "That's awesome! I'd love to see it when you're ready",
      timestamp: "10:35 AM",
      type: "text",
      isRead: true,
    },
    {
      id: 4,
      senderId: "me",
      senderName: "You",
      content: "Sure! I'll share the repo link with you",
      timestamp: "10:36 AM",
      type: "text",
      isRead: true,
    },
    {
      id: 5,
      senderId: "sarah_w",
      senderName: "Sarah Williams",
      content: "Thanks for the feedback on my project!",
      timestamp: "2m ago",
      type: "text",
      isRead: false,
    },
  ],
  2: [
    {
      id: 1,
      senderId: "alex_j",
      senderName: "Alex Johnson",
      content: "Good morning team! How's everyone doing?",
      timestamp: "9:00 AM",
      type: "text",
      isRead: true,
    },
    {
      id: 2,
      senderId: "mike_c",
      senderName: "Michael Chen",
      content: "Morning! Working on the new feature",
      timestamp: "9:15 AM",
      type: "text",
      isRead: true,
    },
    {
      id: 3,
      senderId: "alex_j",
      senderName: "Alex Johnson",
      content: "The new feature is ready for testing",
      timestamp: "5m ago",
      type: "text",
      isRead: false,
    },
  ],
  3: [
    {
      id: 1,
      senderId: "elitescore_team",
      senderName: "EliteScore Team",
      content: "🎉 Welcome to EliteScore! We're excited to have you join our community.",
      timestamp: "Yesterday",
      type: "announcement",
      isRead: true,
    },
    {
      id: 2,
      senderId: "elitescore_team",
      senderName: "EliteScore Team",
      content: "New challenge: 30-day coding streak starts tomorrow! Complete daily coding tasks to earn XP and badges. Are you ready? 🚀",
      timestamp: "1h ago",
      type: "announcement",
      isRead: false,
    },
  ],
}

// Mock data for current user
const currentUser = {
  id: "me",
  name: "Alex Morgan",
  username: "alex_morgan",
  avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&h=150&fit=crop&crop=faces",
}

export default function ChatPage() {
  const isAuthorized = useRequireAuth() // Protect this route
  const router = useRouter()
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [messageText, setMessageText] = useState("")
  const [showNewChatDialog, setShowNewChatDialog] = useState(false)
  const [activeTab, setActiveTab] = useState<"all" | "groups" | "community">("all")
  const [showConversations, setShowConversations] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2bbcff] border-t-transparent" />
      </div>
    )
  }

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // Changed to lg breakpoint
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Removed auto-scroll on conversation selection to prevent unwanted scrolling

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch = conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (activeTab === "all") return matchesSearch
    if (activeTab === "groups") return matchesSearch && conv.type === "group"
    if (activeTab === "community") return matchesSearch && conv.type === "community"
    
    return matchesSearch
  })

  const selectedConv = selectedConversation ? conversations.find(c => c.id === selectedConversation) : null
  const selectedMessages = selectedConversation ? messages[selectedConversation as keyof typeof messages] || [] : []

  const handleSendMessage = () => {
    if (messageText.trim() && selectedConversation) {
      // In a real app, this would send the message to the server
      console.log("Sending message:", messageText)
      setMessageText("")
      // Only scroll to bottom when actually sending a message
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleConversationSelect = (conversationId: number) => {
    setSelectedConversation(conversationId)
    if (isMobile) {
      setShowConversations(false)
    }
  }

  const handleBackToConversations = () => {
    if (isMobile) {
      setShowConversations(true)
      setSelectedConversation(null)
    }
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
                  <div className="space-y-2.5">
                    <Input
                      placeholder="Search..."
                      className="bg-zinc-800 border-zinc-700 text-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg h-9 text-sm"
                    />
                    <div className="space-y-1 max-h-80 overflow-y-auto hide-scrollbar">
                      {conversations.filter(c => c.type === "personal").map((person) => (
                        <div
                          key={person.id}
                          className="flex items-center gap-2.5 p-2.5 hover:bg-zinc-800/50 rounded-lg cursor-pointer transition-colors active:bg-zinc-800"
                          onClick={() => {
                            handleConversationSelect(person.id)
                            setShowNewChatDialog(false)
                          }}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={person.avatar} />
                            <AvatarFallback className="bg-zinc-800">{person.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-white truncate text-sm">{person.name}</h4>
                            <p className="text-xs text-zinc-400 truncate">@{person.username}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
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
            </div>


            {/* Conversations */}
            <div className="flex-1 overflow-y-auto hide-scrollbar">
              {filteredConversations.length === 0 ? (
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
                      
                      <EnhancedButton
                        variant="ghost"
                        size="icon"
                        className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 h-8 w-8"
                      >
                        <Info className="h-4 w-4" />
                      </EnhancedButton>
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5 hide-scrollbar" style={{ scrollBehavior: 'smooth' }}>
                  {selectedMessages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      className={cn(
                        "flex gap-2",
                        message.senderId === "me" ? "justify-end" : "justify-start"
                      )}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      layout
                    >
                      {message.senderId !== "me" && (
                        <Avatar className="h-6 w-6 flex-shrink-0">
                          <AvatarImage src={
                            selectedConv.type === "personal" 
                              ? selectedConv.avatar 
                              : "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&h=150&fit=crop&crop=faces"
                          } />
                          <AvatarFallback className="bg-zinc-800 text-[10px]">
                            {message.senderName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={cn(
                        "max-w-[85%] sm:max-w-[80%] lg:max-w-md",
                        message.senderId === "me" ? "order-first" : "order-last"
                      )}>
                        {message.senderId !== "me" && (
                          <p className="text-[10px] text-zinc-400 mb-0.5 px-1">
                            {message.senderName}
                          </p>
                        )}
                        
                        <div className={cn(
                          "rounded-2xl px-3 py-2 relative inline-block",
                          message.type === "announcement"
                            ? "bg-blue-900/20 border border-blue-700/40"
                            : message.senderId === "me"
                            ? "bg-blue-600 text-white"
                            : "bg-zinc-800 text-white"
                        )}>
                          <p className="text-xs leading-relaxed break-words">{message.content}</p>
                        </div>
                        
                        {/* Timestamp and Read Status */}
                        <div className={cn(
                          "flex items-center gap-1 mt-0.5 px-1",
                          message.senderId === "me" ? "justify-end" : "justify-start"
                        )}>
                          <span className="text-[10px] text-zinc-500">{message.timestamp}</span>
                          {message.senderId === "me" && (
                            message.isRead ? (
                              <CheckCheck className="h-2.5 w-2.5 text-blue-400" />
                            ) : (
                              <Check className="h-2.5 w-2.5 text-zinc-500" />
                            )
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="bg-zinc-900 border-t border-zinc-800 p-3 flex-shrink-0 sticky bottom-0">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1 bg-zinc-800 border-zinc-700 text-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-full px-3.5 text-xs h-9"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim()}
                      className={cn(
                        "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all",
                        messageText.trim()
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "bg-zinc-800 text-zinc-500"
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
