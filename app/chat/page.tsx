"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Search,
  MoreVertical,
  Phone,
  Video,
  Info,
  Send,
  Image,
  Smile,
  Paperclip,
  Users,
  MessageCircle,
  Bell,
  Settings,
  Plus,
  Crown,
  Shield,
  Star,
  Check,
  CheckCheck,
  Clock,
  Reply,
  Forward,
  Copy,
  Trash2,
  Pin,
  Archive,
  VolumeX,
  UserX,
  Flag,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { AnimatedSection } from "@/components/ui/animated-section"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  const router = useRouter()
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [messageText, setMessageText] = useState("")
  const [showNewChatDialog, setShowNewChatDialog] = useState(false)
  const [activeTab, setActiveTab] = useState<"all" | "personal" | "groups" | "community">("all")
  const [showConversations, setShowConversations] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [selectedConversation, messageText])

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch = conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (activeTab === "all") return matchesSearch
    if (activeTab === "personal") return matchesSearch && conv.type === "personal"
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
      <div className="h-screen flex flex-col bg-black overflow-hidden">
        {/* Mobile Header */}
        <div className="bg-zinc-900/95 backdrop-blur-sm border-b border-blue-700/40 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isMobile && selectedConversation && !showConversations ? (
                <EnhancedButton
                  variant="ghost"
                  size="icon"
                  className="text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                  onClick={handleBackToConversations}
                >
                  <ArrowLeft className="h-5 w-5" />
                </EnhancedButton>
              ) : (
                <EnhancedButton
                  variant="ghost"
                  size="icon"
                  className="text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                  onClick={() => router.back()}
                >
                  <ArrowLeft className="h-5 w-5" />
                </EnhancedButton>
              )}
              <h1 className="text-xl font-bold bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">
                {isMobile && selectedConversation && !showConversations ? selectedConv?.name : "Messages"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
                <DialogTrigger asChild>
                  <EnhancedButton
                    variant="ghost"
                    size="icon"
                    className="text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                  >
                    <Plus className="h-5 w-5" />
                  </EnhancedButton>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900/95 border border-blue-700/40 text-white max-w-md mx-4">
                  <DialogHeader>
                    <DialogTitle className="bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">
                      Start New Chat
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                      Choose who you want to message
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Search for people..."
                      className="bg-zinc-800/80 border-blue-700/40 text-white focus:border-blue-500"
                    />
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {conversations.filter(c => c.type === "personal").map((person) => (
                        <div
                          key={person.id}
                          className="flex items-center gap-3 p-2 hover:bg-zinc-800/50 rounded-lg cursor-pointer"
                          onClick={() => {
                            handleConversationSelect(person.id)
                            setShowNewChatDialog(false)
                          }}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={person.avatar} />
                            <AvatarFallback className="bg-zinc-800">{person.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-medium text-white">{person.name}</h4>
                            <p className="text-sm text-zinc-400">@{person.username}</p>
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

        <div className="flex flex-1 overflow-hidden">
          {/* Conversations List */}
          <div className={cn(
            "bg-zinc-900/50 border-r border-blue-700/40 flex flex-col transition-all duration-300",
            isMobile 
              ? (showConversations ? "w-full" : "hidden") 
              : "w-full sm:w-80 lg:w-96"
          )}>
            {/* Search */}
            <div className="p-4 border-b border-blue-700/40 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-zinc-800/80 border-blue-700/40 text-white focus:border-blue-500"
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="px-4 py-2 border-b border-blue-700/40 flex-shrink-0">
              <div className="flex gap-1 bg-zinc-800/50 rounded-lg p-1">
                {[
                  { id: "all", label: "All", icon: MessageCircle },
                  { id: "personal", label: "Personal", icon: Users },
                  { id: "groups", label: "Groups", icon: Users },
                  { id: "community", label: "Community", icon: Bell },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-md text-xs font-medium transition-all duration-200",
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-white shadow-[0_0_8px_0_rgba(80,0,255,0.3)]"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-700/50"
                    )}
                  >
                    <tab.icon className="h-3 w-3" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <MessageCircle className="h-12 w-12 text-zinc-600 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No conversations</h3>
                  <p className="text-zinc-400 text-sm mb-4">Start a new chat to begin messaging</p>
                  <EnhancedButton
                    onClick={() => setShowNewChatDialog(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Chat
                  </EnhancedButton>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <motion.div
                    key={conversation.id}
                    className={cn(
                      "flex items-center gap-3 p-4 cursor-pointer transition-all duration-200 border-b border-zinc-800/50",
                      selectedConversation === conversation.id
                        ? "bg-blue-900/20 border-blue-700/40"
                        : "hover:bg-zinc-800/50"
                    )}
                    onClick={() => handleConversationSelect(conversation.id)}
                    whileHover={{ backgroundColor: "rgba(80, 0, 255, 0.1)" }}
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={conversation.avatar} />
                        <AvatarFallback className="bg-zinc-800">
                          {conversation.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {conversation.isOnline && (
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-zinc-900">
                          <div className="h-full w-full bg-green-400 rounded-full animate-ping opacity-75"></div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 className="font-semibold text-white truncate">
                            {conversation.name}
                          </h3>
                          {conversation.isPinned && (
                            <Pin className="h-3 w-3 text-blue-400 flex-shrink-0" />
                          )}
                          {conversation.isOfficial && (
                            <Crown className="h-3 w-3 text-yellow-400 flex-shrink-0" />
                          )}
                          {conversation.isMuted && (
                            <VolumeX className="h-3 w-3 text-zinc-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-zinc-500">{conversation.timestamp}</span>
                          {conversation.unreadCount > 0 && (
                            <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs px-2 py-1 rounded-full">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-zinc-400 truncate flex-1">
                          {conversation.lastMessage}
                        </p>
                        {conversation.type === "group" && (
                          <div className="flex items-center gap-1 text-xs text-zinc-500 ml-2 flex-shrink-0">
                            <Users className="h-3 w-3" />
                            <span>{conversation.members}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={cn(
            "flex-1 flex flex-col",
            isMobile && showConversations ? "hidden" : "flex"
          )}>
            {selectedConversation && selectedConv ? (
              <>
                {/* Chat Header - Desktop Only */}
                {!isMobile && (
                  <div className="bg-zinc-900/80 backdrop-blur-sm border-b border-blue-700/40 px-4 py-3 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={selectedConv.avatar} />
                          <AvatarFallback className="bg-zinc-800">
                            {selectedConv.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h2 className="font-semibold text-white flex items-center gap-2">
                            {selectedConv.name}
                            {selectedConv.isOfficial && (
                              <Crown className="h-4 w-4 text-yellow-400" />
                            )}
                          </h2>
                          <p className="text-sm text-zinc-400">
                            {selectedConv.type === "personal" && selectedConv.isOnline
                              ? "Online"
                              : selectedConv.type === "group"
                              ? `${selectedConv.members} members`
                              : "Official channel"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {selectedConv.type === "personal" && (
                          <>
                            <EnhancedButton
                              variant="ghost"
                              size="icon"
                              className="text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                            >
                              <Phone className="h-5 w-5" />
                            </EnhancedButton>
                            <EnhancedButton
                              variant="ghost"
                              size="icon"
                              className="text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                            >
                              <Video className="h-5 w-5" />
                            </EnhancedButton>
                          </>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <EnhancedButton
                              variant="ghost"
                              size="icon"
                              className="text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                            >
                              <MoreVertical className="h-5 w-5" />
                            </EnhancedButton>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-zinc-900 border border-blue-700/40 text-white">
                            <DropdownMenuItem>
                              <Info className="h-4 w-4 mr-2" />
                              View Info
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Pin className="h-4 w-4 mr-2" />
                              {selectedConv.isPinned ? "Unpin" : "Pin"}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <VolumeX className="h-4 w-4 mr-2" />
                              {selectedConv.isMuted ? "Unmute" : "Mute"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-400">
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedMessages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        message.senderId === "me" ? "justify-end" : "justify-start"
                      )}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {message.senderId !== "me" && (
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={
                            selectedConv.type === "personal" 
                              ? selectedConv.avatar 
                              : "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&h=150&fit=crop&crop=faces"
                          } />
                          <AvatarFallback className="bg-zinc-800">
                            {message.senderName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={cn(
                        "max-w-[85%] sm:max-w-xs lg:max-w-md",
                        message.senderId === "me" ? "order-first" : "order-last"
                      )}>
                        {message.senderId !== "me" && (
                          <p className="text-xs text-zinc-400 mb-1 px-1">
                            {message.senderName}
                          </p>
                        )}
                        
                        <div className={cn(
                          "rounded-2xl px-4 py-2 relative",
                          message.type === "announcement"
                            ? "bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-700/40"
                            : message.senderId === "me"
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                            : "bg-zinc-800 text-white"
                        )}>
                          <p className="text-sm leading-relaxed break-words">{message.content}</p>
                          
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span className="text-xs opacity-70">{message.timestamp}</span>
                            {message.senderId === "me" && (
                              <div className="flex items-center">
                                {message.isRead ? (
                                  <CheckCheck className="h-3 w-3 text-blue-300" />
                                ) : (
                                  <Check className="h-3 w-3 text-zinc-400" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="bg-zinc-900/80 backdrop-blur-sm border-t border-blue-700/40 p-4 flex-shrink-0">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <EnhancedButton
                      variant="ghost"
                      size="icon"
                      className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 flex-shrink-0"
                    >
                      <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
                    </EnhancedButton>
                    
                    <div className="flex-1 relative">
                      <Input
                        placeholder="Type a message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="bg-zinc-800/80 border-blue-700/40 text-white focus:border-blue-500 pr-10 sm:pr-12 text-sm sm:text-base"
                      />
                      <EnhancedButton
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-white h-8 w-8"
                      >
                        <Smile className="h-4 w-4" />
                      </EnhancedButton>
                    </div>
                    
                    <EnhancedButton
                      variant="ghost"
                      size="icon"
                      className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 flex-shrink-0"
                    >
                      <Image className="h-4 w-4 sm:h-5 sm:w-5" />
                    </EnhancedButton>
                    
                    <EnhancedButton
                      onClick={handleSendMessage}
                      disabled={!messageText.trim()}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 flex-shrink-0"
                    >
                      <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                    </EnhancedButton>
                  </div>
                </div>
              </>
            ) : (
              /* Empty State */
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-sm">
                  <MessageCircle className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Select a conversation</h3>
                  <p className="text-zinc-400 mb-6 text-sm">Choose a chat to start messaging</p>
                  <EnhancedButton
                    onClick={() => setShowNewChatDialog(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
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
