"use client"

import { useState } from "react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { Award, Bell, FileText, MessageCircle, ThumbsUp, Trophy, User, Users } from "lucide-react"

import { SiteHeader } from "@/components/site-header"
import { MainNav } from "@/components/main-nav"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

// Mock notifications data
const notifications = [
  {
    id: 1,
    type: "achievement",
    title: "You earned a new badge!",
    description: "Coding Master - Complete 50 coding challenges",
    time: "2 hours ago",
    read: false,
    icon: <Award className="h-5 w-5 text-purple-400" />,
    iconBg: "bg-purple-900/30",
  },
  {
    id: 2,
    type: "like",
    user: {
      name: "Sarah Williams",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces",
    },
    description: "liked your recent achievement",
    time: "5 hours ago",
    read: false,
    icon: <ThumbsUp className="h-5 w-5 text-blue-400" />,
    iconBg: "bg-blue-900/30",
  },
  {
    id: 3,
    type: "comment",
    user: {
      name: "Michael Chen",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces",
    },
    description: "commented on your project",
    time: "Yesterday",
    read: true,
    icon: <MessageCircle className="h-5 w-5 text-green-400" />,
    iconBg: "bg-green-900/30",
  },
  {
    id: 4,
    type: "follow",
    user: {
      name: "Emily Rodriguez",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=faces",
    },
    description: "started following you",
    time: "2 days ago",
    read: true,
    icon: <User className="h-5 w-5 text-indigo-400" />,
    iconBg: "bg-indigo-900/30",
  },
  {
    id: 5,
    type: "challenge",
    title: "New Challenge Available!",
    description: "Complete the 'Public Speaking 101' challenge",
    time: "3 days ago",
    read: true,
    icon: <FileText className="h-5 w-5 text-yellow-400" />,
    iconBg: "bg-yellow-900/30",
  },
  {
    id: 6,
    type: "leaderboard",
    title: "You moved up in the leaderboard!",
    description: "You're now #42 in the global rankings",
    time: "4 days ago",
    read: true,
    icon: <Trophy className="h-5 w-5 text-yellow-400" />,
    iconBg: "bg-yellow-900/30",
  },
  {
    id: 7,
    type: "group",
    title: "You were added to a group",
    description: "You're now part of 'Stanford CS Study Group'",
    time: "5 days ago",
    read: true,
    icon: <Users className="h-5 w-5 text-pink-400" />,
    iconBg: "bg-pink-900/30",
  },
]

export default function NotificationsPage() {
  const isAuthorized = useRequireAuth() // Protect this route
  
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2bbcff] border-t-transparent" />
      </div>
    )
  }
  
  const [activeTab, setActiveTab] = useState("all")
  const [notificationsList, setNotificationsList] = useState(notifications)

  const unreadCount = notificationsList.filter((n) => !n.read).length

  const markAllAsRead = () => {
    setNotificationsList(notificationsList.map((n) => ({ ...n, read: true })))
  }

  const markAsRead = (id: number) => {
    setNotificationsList(notificationsList.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const filteredNotifications = notificationsList.filter((notification) => {
    if (activeTab === "all") return true
    if (activeTab === "unread") return !notification.read
    return notification.type === activeTab
  })

  return (
    <div className="flex flex-col min-h-screen bg-black text-white overflow-x-hidden">
      {/* Header */}
      <SiteHeader
        title="Notifications"
        rightElement={
          <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        }
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20">
        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
          <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-lg border-b border-zinc-800">
            <TabsList className="w-full flex justify-between bg-transparent h-12 p-0">
              <TabsTrigger
                value="all"
                className={cn(
                  "flex-1 rounded-none h-full data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                  activeTab === "all" ? "text-purple-500 border-b-2 border-purple-500" : "text-zinc-400",
                )}
              >
                All
                {unreadCount > 0 && <Badge className="ml-2 bg-purple-500 text-white">{unreadCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger
                value="unread"
                className={cn(
                  "flex-1 rounded-none h-full data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                  activeTab === "unread" ? "text-purple-500 border-b-2 border-purple-500" : "text-zinc-400",
                )}
              >
                Unread
              </TabsTrigger>
              <TabsTrigger
                value="achievement"
                className={cn(
                  "flex-1 rounded-none h-full data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                  activeTab === "achievement" ? "text-purple-500 border-b-2 border-purple-500" : "text-zinc-400",
                )}
              >
                <Award className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger
                value="challenge"
                className={cn(
                  "flex-1 rounded-none h-full data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                  activeTab === "challenge" ? "text-purple-500 border-b-2 border-purple-500" : "text-zinc-400",
                )}
              >
                <FileText className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-0">
            <NotificationsList notifications={filteredNotifications} onMarkAsRead={markAsRead} />
          </TabsContent>

          <TabsContent value="unread" className="mt-0">
            <NotificationsList notifications={filteredNotifications} onMarkAsRead={markAsRead} />
          </TabsContent>

          <TabsContent value="achievement" className="mt-0">
            <NotificationsList notifications={filteredNotifications} onMarkAsRead={markAsRead} />
          </TabsContent>

          <TabsContent value="challenge" className="mt-0">
            <NotificationsList notifications={filteredNotifications} onMarkAsRead={markAsRead} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Bottom Navigation */}
      <MainNav />
    </div>
  )
}

interface NotificationsListProps {
  notifications: typeof notifications
  onMarkAsRead: (id: number) => void
}

function NotificationsList({ notifications, onMarkAsRead }: NotificationsListProps) {
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <Bell className="h-12 w-12 text-zinc-700 mb-4" />
        <h3 className="text-lg font-medium text-zinc-400">No notifications</h3>
        <p className="text-sm text-zinc-500 text-center">You're all caught up!</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-zinc-800">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={cn("p-4 hover:bg-zinc-900/50 transition-colors", !notification.read && "bg-purple-900/5")}
          onClick={() => onMarkAsRead(notification.id)}
        >
          <div className="flex items-start gap-3">
            {notification.type === "like" || notification.type === "comment" || notification.type === "follow" ? (
              <Avatar className="h-10 w-10">
                <AvatarImage src={(notification as any).user.image} />
                <AvatarFallback className="bg-zinc-800">{(notification as any).user.name.charAt(0)}</AvatarFallback>
              </Avatar>
            ) : (
              <div className={cn("p-2 rounded-full", notification.iconBg)}>{notification.icon}</div>
            )}

            <div className="flex-1 min-w-0">
              {notification.type === "like" || notification.type === "comment" || notification.type === "follow" ? (
                <p className="text-sm">
                  <span className="font-medium">{(notification as any).user.name}</span>{" "}
                  <span className="text-zinc-400">{notification.description}</span>
                </p>
              ) : (
                <>
                  <p className="font-medium">{notification.title}</p>
                  <p className="text-sm text-zinc-400">{notification.description}</p>
                </>
              )}
              <p className="text-xs text-zinc-500 mt-1">{notification.time}</p>
            </div>

            {!notification.read && <div className="h-2 w-2 rounded-full bg-purple-500 mt-2"></div>}
          </div>
        </div>
      ))}
    </div>
  )
}

