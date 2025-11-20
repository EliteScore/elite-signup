// Mock data for communities
export const communities = [
  {
    id: 1,
    name: "Software Engineers Elite",
    description: "A community for passionate software developers pushing the boundaries of technology",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&h=150&fit=crop",
    members: 12547,
    joined: true,
    rank: 1,
    trending: true,
    category: "Technology",
    created_by: undefined as number | undefined,
    announcements: [
      {
        id: 1,
        title: "Q1 2024 Coding Challenge Results",
        content: "Congratulations to all participants! Top 10 winners will receive exclusive mentorship sessions.",
        timestamp: "2 hours ago",
        priority: "high",
        pinned: true,
        type: "achievement"
      },
      {
        id: 2,
        title: "New AI/ML Study Group Starting",
        content: "Join our weekly study sessions focusing on advanced machine learning concepts. Starting next Monday.",
        timestamp: "1 day ago",
        priority: "medium",
        pinned: false,
        type: "event"
      },
      {
        id: 3,
        title: "Community Guidelines Updated",
        content: "Please review the updated community guidelines to ensure a positive environment for all members.",
        timestamp: "3 days ago",
        priority: "low",
        pinned: false,
        type: "info"
      }
    ],
    leaderboard: [
      { id: 1, name: "Alex Rodriguez", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces", points: 2847, badges: 12, rank: 1, streak: 45, contributions: 156 },
      { id: 2, name: "Sarah Chen", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces", points: 2634, badges: 10, rank: 2, streak: 32, contributions: 142 },
      { id: 3, name: "Marcus Johnson", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces", points: 2421, badges: 9, rank: 3, streak: 28, contributions: 134 },
      { id: 4, name: "Elena Vasquez", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces", points: 2198, badges: 8, rank: 4, streak: 24, contributions: 118 },
      { id: 5, name: "David Kim", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces", points: 1987, badges: 7, rank: 5, streak: 21, contributions: 102 },
    ],
    membersList: [
      { id: 1, name: "Alex Rodriguez", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces", title: "Senior Software Engineer", company: "Google", joined: "2 years ago", isOnline: true, achievements: ["Top Contributor", "Mentor"] },
      { id: 2, name: "Sarah Chen", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces", title: "Full Stack Developer", company: "Microsoft", joined: "1 year ago", isOnline: true, achievements: ["Innovation Award"] },
      { id: 3, name: "Marcus Johnson", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces", title: "Tech Lead", company: "Amazon", joined: "3 years ago", isOnline: false, achievements: ["Leadership", "Top Performer"] },
    ],
    stats: {
      totalMembers: 12547,
      activeToday: 1847,
      weeklyGrowth: 8.5,
      monthlyActivity: 94.2
    }
  },
  {
    id: 2,
    name: "Product Managers United",
    description: "Strategic thinking and product excellence for the next generation of product leaders",
    image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=150&h=150&fit=crop",
    members: 8934,
    joined: true,
    rank: 2,
    trending: false,
    category: "Product",
    announcements: [
      {
        id: 1,
        title: "Product Strategy Workshop",
        content: "Join us for an intensive workshop on modern product strategy frameworks. Limited seats available.",
        timestamp: "4 hours ago",
        priority: "high",
        pinned: true,
        type: "event"
      }
    ],
    leaderboard: [
      { id: 1, name: "Jessica Taylor", image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=faces", points: 1987, badges: 8, rank: 1, streak: 35, contributions: 89 },
      { id: 2, name: "Michael Brown", image: "https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=150&h=150&fit=crop&crop=faces", points: 1743, badges: 6, rank: 2, streak: 28, contributions: 76 },
    ],
    membersList: [
      { id: 1, name: "Jessica Taylor", image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=faces", title: "Senior Product Manager", company: "Uber", joined: "1 year ago", isOnline: true, achievements: ["Strategy Expert"] },
    ],
    stats: {
      totalMembers: 8934,
      activeToday: 1234,
      weeklyGrowth: 6.2,
      monthlyActivity: 87.5
    }
  }
]

export type CommunityType = (typeof communities)[number] & {
  visibility?: "public" | "private"
  slug?: string
}
export type CommunityAnnouncement = CommunityType['announcements'][number]
export type CommunityLeaderboardEntry = CommunityType['leaderboard'][number]
export type CommunityMember = CommunityType['membersList'][number]

export const DEFAULT_COMMUNITY_STATS = {
  totalMembers: 0,
  activeToday: 0,
  weeklyGrowth: 0,
  monthlyActivity: 0,
}

export const FALLBACK_COMMUNITY_IMAGE = communities[0]?.image ?? 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&h=150&fit=crop'
export const FALLBACK_MEMBER_IMAGE = communities[0]?.membersList?.[0]?.image ?? FALLBACK_COMMUNITY_IMAGE

