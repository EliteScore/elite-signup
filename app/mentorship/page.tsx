"use client"

import { useState } from "react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { Calendar, Clock, Filter, MessageCircle, Search, Star, User, Users, Video, X } from "lucide-react"

import { SiteHeader } from "@/components/site-header"
import { MainNav } from "@/components/main-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

// Mock data for mentors
const mentors = [
  {
    id: 1,
    name: "Dr. Alex Johnson",
    title: "Software Engineering Expert",
    bio: "10+ years of experience in software development and teaching. Specializes in algorithms and system design.",
    image: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&h=150&fit=crop&crop=faces",
    rating: 4.9,
    reviews: 124,
    specialties: ["Algorithms", "System Design", "Career Guidance"],
    availability: "Available next week",
    price: "Free first session, then €50/hour",
    featured: true,
  },
  {
    id: 2,
    name: "Sarah Williams",
    title: "Career Development Coach",
    bio: "Career counselor with expertise in resume building, interview preparation, and professional development.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces",
    rating: 4.8,
    reviews: 98,
    specialties: ["Resume Building", "Interview Prep", "Career Transitions"],
    availability: "Available tomorrow",
    price: "€40/hour",
    featured: false,
  },
  {
    id: 3,
    name: "Michael Chen",
    title: "Data Science Mentor",
    bio: "Data scientist with experience at top tech companies. Helps students master machine learning and data analysis.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces",
    rating: 4.7,
    reviews: 87,
    specialties: ["Machine Learning", "Data Analysis", "Python"],
    availability: "Available this weekend",
    price: "€45/hour",
    featured: true,
  },
  {
    id: 4,
    name: "Emily Rodriguez",
    title: "Business Strategy Advisor",
    bio: "MBA graduate with experience in consulting. Helps students with business case studies and strategic thinking.",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=faces",
    rating: 4.6,
    reviews: 76,
    specialties: ["Business Strategy", "Case Studies", "Entrepreneurship"],
    availability: "Limited availability",
    price: "€55/hour",
    featured: false,
  },
]

// Mock data for upcoming sessions
const upcomingSessions = [
  {
    id: 1,
    mentor: {
      name: "Dr. Alex Johnson",
      image: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&h=150&fit=crop&crop=faces",
    },
    date: "Tomorrow",
    time: "3:00 PM - 4:00 PM",
    topic: "Career Path Planning",
    type: "video",
  },
  {
    id: 2,
    mentor: {
      name: "Michael Chen",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces",
    },
    date: "Jun 15, 2023",
    time: "5:30 PM - 6:30 PM",
    topic: "Introduction to Machine Learning",
    type: "video",
  },
]

// Mock data for past sessions
const pastSessions = [
  {
    id: 1,
    mentor: {
      name: "Sarah Williams",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces",
    },
    date: "Jun 2, 2023",
    time: "2:00 PM - 3:00 PM",
    topic: "Resume Review",
    type: "video",
    feedback: "Great session! Sarah provided valuable feedback on my resume.",
    rating: 5,
  },
  {
    id: 2,
    mentor: {
      name: "Dr. Alex Johnson",
      image: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&h=150&fit=crop&crop=faces",
    },
    date: "May 25, 2023",
    time: "4:00 PM - 5:00 PM",
    topic: "Algorithm Practice",
    type: "chat",
    feedback: "Alex helped me understand complex algorithms in a simple way.",
    rating: 4,
  },
]

// Mock data for group sessions
const groupSessions = [
  {
    id: 1,
    title: "Technical Interview Preparation",
    mentor: {
      name: "Dr. Alex Johnson",
      image: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&h=150&fit=crop&crop=faces",
    },
    date: "Jun 18, 2023",
    time: "6:00 PM - 7:30 PM",
    participants: 12,
    maxParticipants: 20,
    price: "€25",
    description: "Group session focused on technical interview preparation for software engineering roles.",
  },
  {
    id: 2,
    title: "Resume Building Workshop",
    mentor: {
      name: "Sarah Williams",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces",
    },
    date: "Jun 20, 2023",
    time: "5:00 PM - 6:30 PM",
    participants: 8,
    maxParticipants: 15,
    price: "€20",
    description: "Learn how to create a standout resume that will get you noticed by recruiters.",
  },
  {
    id: 3,
    title: "Data Science Career Panel",
    mentor: {
      name: "Michael Chen",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces",
    },
    date: "Jun 25, 2023",
    time: "7:00 PM - 8:30 PM",
    participants: 15,
    maxParticipants: 30,
    price: "Free",
    description: "Panel discussion with data scientists from top companies sharing their career journeys and advice.",
  },
]

export default function MentorshipPage() {
  const isAuthorized = useRequireAuth() // Protect this route
  
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2bbcff] border-t-transparent" />
      </div>
    )
  }
  
  const [activeTab, setActiveTab] = useState("find")
  const [searchQuery, setSearchQuery] = useState("")

  // Filter mentors based on search query
  const filteredMentors = mentors.filter(
    (mentor) =>
      searchQuery === "" ||
      mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.specialties.some((specialty) => specialty.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  // Filter group sessions based on search query
  const filteredGroupSessions = groupSessions.filter(
    (session) =>
      searchQuery === "" ||
      session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.mentor.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="flex flex-col min-h-screen bg-black text-white overflow-x-hidden">
      {/* Header */}
      <SiteHeader title="Mentorship" />

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20">
        {/* Search Bar */}
        {activeTab !== "sessions" && (
          <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-lg border-b border-zinc-800 px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                type="text"
                placeholder={activeTab === "find" ? "Search mentors..." : "Search group sessions..."}
                className="pl-10 pr-10 py-2 bg-zinc-900 border-zinc-800 rounded-full text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 text-zinc-400 hover:text-white"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="find" className="w-full" onValueChange={setActiveTab}>
          <div
            className={cn(
              "sticky z-10 bg-black/95 backdrop-blur-lg border-b border-zinc-800",
              activeTab !== "sessions" ? "top-[69px]" : "top-0",
            )}
          >
            <TabsList className="w-full flex justify-between bg-transparent h-12 p-0">
              <TabsTrigger
                value="find"
                className={cn(
                  "flex-1 rounded-none h-full data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                  activeTab === "find" ? "text-purple-500 border-b-2 border-purple-500" : "text-zinc-400",
                )}
              >
                <User className="h-4 w-4 mr-2" />
                Find Mentors
              </TabsTrigger>
              <TabsTrigger
                value="sessions"
                className={cn(
                  "flex-1 rounded-none h-full data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                  activeTab === "sessions" ? "text-purple-500 border-b-2 border-purple-500" : "text-zinc-400",
                )}
              >
                <Calendar className="h-4 w-4 mr-2" />
                My Sessions
              </TabsTrigger>
              <TabsTrigger
                value="group"
                className={cn(
                  "flex-1 rounded-none h-full data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                  activeTab === "group" ? "text-purple-500 border-b-2 border-purple-500" : "text-zinc-400",
                )}
              >
                <Users className="h-4 w-4 mr-2" />
                Group Sessions
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Find Mentors Tab */}
          <TabsContent value="find" className="mt-0 px-4 py-4 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Available Mentors</h2>
              <Button variant="outline" size="sm" className="text-xs gap-1 rounded-full bg-zinc-900 border-zinc-800">
                <Filter className="h-3 w-3 mr-1" />
                Filter
              </Button>
            </div>

            {/* Featured Mentors */}
            {searchQuery === "" && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-zinc-400 mb-3">Featured Mentors</h3>
                <div className="space-y-4">
                  {mentors
                    .filter((m) => m.featured)
                    .map((mentor) => (
                      <Card
                        key={mentor.id}
                        className="bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border-purple-800/30"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start">
                            <Avatar className="h-16 w-16 mr-4">
                              <AvatarImage src={mentor.image} />
                              <AvatarFallback className="bg-zinc-800">{mentor.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="font-medium">{mentor.name}</h3>
                                  <p className="text-sm text-zinc-400">{mentor.title}</p>
                                </div>
                                <Badge className="bg-purple-900/50 text-purple-300 border-purple-800 text-[10px]">
                                  Featured
                                </Badge>
                              </div>
                              <p className="text-sm text-zinc-300 mt-2 line-clamp-2">{mentor.bio}</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {mentor.specialties.map((specialty, index) => (
                                  <Badge key={index} className="bg-zinc-800 text-zinc-300 border-zinc-700 text-[10px]">
                                    {specialty}
                                  </Badge>
                                ))}
                              </div>
                              <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center">
                                  <Star className="h-4 w-4 text-yellow-500 mr-1" />
                                  <span className="text-sm font-medium">{mentor.rating}</span>
                                  <span className="text-xs text-zinc-400 ml-1">({mentor.reviews} reviews)</span>
                                </div>
                                <Button
                                  size="sm"
                                  className="rounded-full h-8 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                                >
                                  Book Session
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            )}

            {/* All Mentors */}
            {filteredMentors.length > 0 ? (
              <div className="space-y-4">
                {searchQuery !== "" && <h3 className="text-sm font-medium text-zinc-400 mb-3">Search Results</h3>}
                {filteredMentors
                  .filter((m) => searchQuery !== "" || !m.featured)
                  .map((mentor) => (
                    <Card
                      key={mentor.id}
                      className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900 transition-colors"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start">
                          <Avatar className="h-16 w-16 mr-4">
                            <AvatarImage src={mentor.image} />
                            <AvatarFallback className="bg-zinc-800">{mentor.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-medium">{mentor.name}</h3>
                            <p className="text-sm text-zinc-400">{mentor.title}</p>
                            <p className="text-sm text-zinc-300 mt-2 line-clamp-2">{mentor.bio}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {mentor.specialties.map((specialty, index) => (
                                <Badge key={index} className="bg-zinc-800 text-zinc-300 border-zinc-700 text-[10px]">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center">
                                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                                <span className="text-sm font-medium">{mentor.rating}</span>
                                <span className="text-xs text-zinc-400 ml-1">({mentor.reviews} reviews)</span>
                              </div>
                              <Button
                                size="sm"
                                className="rounded-full h-8 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                              >
                                Book Session
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-zinc-900/30 rounded-xl border border-zinc-800 p-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800 mb-4">
                  <Search className="h-8 w-8 text-zinc-400" />
                </div>
                <div className="text-zinc-300 text-lg mb-2">No mentors found</div>
                <div className="text-sm text-zinc-500">Try different keywords or browse all mentors</div>
              </div>
            )}
          </TabsContent>

          {/* My Sessions Tab */}
          <TabsContent value="sessions" className="mt-0 px-4 py-4 space-y-6">
            {/* Upcoming Sessions */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Upcoming Sessions</h2>
              {upcomingSessions.length > 0 ? (
                <div className="space-y-4">
                  {upcomingSessions.map((session) => (
                    <Card key={session.id} className="bg-zinc-900/50 border-zinc-800">
                      <CardContent className="p-4">
                        <div className="flex items-start">
                          <Avatar className="h-12 w-12 mr-3">
                            <AvatarImage src={session.mentor.image} />
                            <AvatarFallback className="bg-zinc-800">{session.mentor.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium">{session.topic}</h3>
                              <Badge
                                className={cn(
                                  "text-[10px]",
                                  session.date === "Tomorrow"
                                    ? "bg-green-900/50 text-green-300 border-green-800"
                                    : "bg-purple-900/50 text-purple-300 border-purple-800",
                                )}
                              >
                                {session.date === "Tomorrow" ? "Tomorrow" : "Upcoming"}
                              </Badge>
                            </div>
                            <p className="text-sm text-zinc-400">with {session.mentor.name}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {session.date}
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {session.time}
                              </div>
                              <div className="flex items-center">
                                {session.type === "video" ? (
                                  <Video className="h-3 w-3 mr-1" />
                                ) : (
                                  <MessageCircle className="h-3 w-3 mr-1" />
                                )}
                                {session.type === "video" ? "Video Call" : "Chat"}
                              </div>
                            </div>
                            <div className="flex justify-end mt-3">
                              <Button
                                size="sm"
                                className="rounded-full h-8 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                              >
                                Join Session
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardContent className="p-6 text-center">
                    <Calendar className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-zinc-400">No upcoming sessions</h3>
                    <p className="text-sm text-zinc-500 mt-1">Book a session with a mentor to get started</p>
                    <Button className="mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                      Find a Mentor
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Past Sessions */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Past Sessions</h2>
              {pastSessions.length > 0 ? (
                <div className="space-y-4">
                  {pastSessions.map((session) => (
                    <Card key={session.id} className="bg-zinc-900/50 border-zinc-800">
                      <CardContent className="p-4">
                        <div className="flex items-start">
                          <Avatar className="h-12 w-12 mr-3">
                            <AvatarImage src={session.mentor.image} />
                            <AvatarFallback className="bg-zinc-800">{session.mentor.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-medium">{session.topic}</h3>
                            <p className="text-sm text-zinc-400">with {session.mentor.name}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {session.date}
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {session.time}
                              </div>
                              <div className="flex items-center">
                                {session.type === "video" ? (
                                  <Video className="h-3 w-3 mr-1" />
                                ) : (
                                  <MessageCircle className="h-3 w-3 mr-1" />
                                )}
                                {session.type === "video" ? "Video Call" : "Chat"}
                              </div>
                            </div>
                            {session.feedback && (
                              <div className="mt-2 p-2 bg-zinc-800/50 rounded-lg">
                                <div className="flex items-center mb-1">
                                  <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={cn(
                                          "h-3 w-3",
                                          i < session.rating ? "text-yellow-500 fill-current" : "text-zinc-600",
                                        )}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs text-zinc-400 ml-2">Your rating</span>
                                </div>
                                <p className="text-xs text-zinc-400">{session.feedback}</p>
                              </div>
                            )}
                            <div className="flex justify-end mt-3">
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full h-8 px-3 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                              >
                                View Notes
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardContent className="p-6 text-center">
                    <Calendar className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-zinc-400">No past sessions</h3>
                    <p className="text-sm text-zinc-500 mt-1">Your completed sessions will appear here</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Group Sessions Tab */}
          <TabsContent value="group" className="mt-0 px-4 py-4 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Upcoming Group Sessions</h2>
              <Button variant="outline" size="sm" className="text-xs gap-1 rounded-full bg-zinc-900 border-zinc-800">
                <Filter className="h-3 w-3 mr-1" />
                Filter
              </Button>
            </div>

            {filteredGroupSessions.length > 0 ? (
              <div className="space-y-4">
                {filteredGroupSessions.map((session) => (
                  <Card key={session.id} className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start">
                        <Avatar className="h-12 w-12 mr-3 rounded-lg">
                          <AvatarImage src={session.mentor.image} />
                          <AvatarFallback className="bg-zinc-800 rounded-lg">
                            {session.mentor.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{session.title}</h3>
                            <Badge className="bg-purple-900/50 text-purple-300 border-purple-800 text-[10px]">
                              {session.price === "Free" ? "Free" : session.price}
                            </Badge>
                          </div>
                          <p className="text-sm text-zinc-400">with {session.mentor.name}</p>
                          <p className="text-sm text-zinc-300 mt-2">{session.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {session.date}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {session.time}
                            </div>
                            <div className="flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              {session.participants}/{session.maxParticipants} participants
                            </div>
                          </div>
                          <div className="flex justify-end mt-3">
                            <Button
                              size="sm"
                              className="rounded-full h-8 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                            >
                              Join Session
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-zinc-900/30 rounded-xl border border-zinc-800 p-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800 mb-4">
                  <Search className="h-8 w-8 text-zinc-400" />
                </div>
                <div className="text-zinc-300 text-lg mb-2">No group sessions found</div>
                <div className="text-sm text-zinc-500">Try different keywords or check back later</div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Bottom Navigation */}
      <MainNav />
    </div>
  )
}

