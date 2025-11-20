"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import {
  MessageCircle,
  Trophy,
  Users,
  Award,
  Bell,
  Pin,
  Calendar,
  Clock,
  ChevronRight,
  Crown,
  Medal,
  Star,
  TrendingUp,
  Zap,
  CheckCircle,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  UserPlus,
  Settings,
  ChevronDown,
  Edit,
  Save,
  Hash,
  Globe,
  Lock,
  X,
  Trash2,
  Camera,
  Upload,
  UserX,
  CheckSquare,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import {
  EnhancedCard,
  EnhancedCardContent,
  EnhancedCardFooter,
  EnhancedCardHeader,
  EnhancedCardTitle,
} from "@/components/ui/enhanced-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { getStoredAccessToken } from "@/lib/auth-storage"
import AnimatedCounter from "@/components/ui/animated-counter"
import { AnimatedProgress } from "@/components/ui/animated-progress"
import { AnimatedSection } from "@/components/ui/animated-section"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Mock data for communities
const communities = [
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

type CommunityType = (typeof communities)[number]
type CommunityAnnouncement = CommunityType['announcements'][number]
type CommunityLeaderboardEntry = CommunityType['leaderboard'][number]
type CommunityMember = CommunityType['membersList'][number]

const DEFAULT_COMMUNITY_STATS = {
  totalMembers: 0,
  activeToday: 0,
  weeklyGrowth: 0,
  monthlyActivity: 0,
}

const FALLBACK_COMMUNITY_IMAGE = communities[0]?.image ?? 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&h=150&fit=crop'
const FALLBACK_MEMBER_IMAGE = communities[0]?.membersList?.[0]?.image ?? FALLBACK_COMMUNITY_IMAGE

function mapCommunityFromApi(rawData: any): CommunityType {
  const data = rawData?.data ?? rawData ?? {}

  const stats = {
    totalMembers:
      Number(data?.membersCount ?? data?.member_count ?? data?.total_members ?? DEFAULT_COMMUNITY_STATS.totalMembers) ||
      DEFAULT_COMMUNITY_STATS.totalMembers,
    activeToday:
      Number(data?.activeToday ?? data?.active_today ?? DEFAULT_COMMUNITY_STATS.activeToday) ||
      DEFAULT_COMMUNITY_STATS.activeToday,
    weeklyGrowth:
      Number(data?.weeklyGrowth ?? data?.weekly_growth ?? DEFAULT_COMMUNITY_STATS.weeklyGrowth) ||
      DEFAULT_COMMUNITY_STATS.weeklyGrowth,
    monthlyActivity:
      Number(data?.monthlyActivity ?? data?.monthly_activity ?? DEFAULT_COMMUNITY_STATS.monthlyActivity) ||
      DEFAULT_COMMUNITY_STATS.monthlyActivity,
  }

  const normalizedAnnouncements: CommunityAnnouncement[] = Array.isArray(data?.announcements)
    ? data.announcements.map((item: any, index: number) => ({
        id: item?.id ?? index,
        title: item?.title ?? 'Announcement',
        content: item?.content ?? item?.message ?? '',
        timestamp: item?.timestamp ?? item?.created_at ?? 'Just now',
        priority: (item?.priority ?? 'low') as CommunityAnnouncement['priority'],
        pinned: Boolean(item?.pinned),
        type: item?.type ?? 'info',
      }))
    : []

  const normalizedLeaderboard: CommunityLeaderboardEntry[] = Array.isArray(data?.leaderboard)
    ? data.leaderboard.map((entry: any, index: number) => ({
        id: entry?.id ?? index,
        name: entry?.name ?? entry?.display_name ?? 'Member',
        image: entry?.image ?? entry?.avatar ?? FALLBACK_MEMBER_IMAGE,
        points: Number(entry?.points ?? entry?.score ?? 0),
        badges: Number(entry?.badges ?? entry?.badge_count ?? 0),
        rank: Number(entry?.rank ?? index + 1),
        streak: Number(entry?.streak ?? 0),
        contributions: Number(entry?.contributions ?? entry?.posts ?? 0),
      }))
    : []

  const normalizedMembers: CommunityMember[] = Array.isArray(data?.membersList ?? data?.members)
    ? (data?.membersList ?? data?.members).map((member: any, index: number) => ({
        id: member?.id ?? member?.userId ?? index,
        name: member?.name ?? member?.fullName ?? 'Member',
        image: member?.image ?? member?.avatar ?? FALLBACK_MEMBER_IMAGE,
        title: member?.title ?? member?.role ?? 'Member',
        company: member?.company ?? member?.organization ?? '',
        joined: member?.joined ?? member?.joined_at ?? '',
        isOnline: Boolean(member?.isOnline ?? member?.online ?? false),
        achievements: Array.isArray(member?.achievements) ? member.achievements : [],
      }))
    : []

  const normalizedId = Number(data?.id ?? data?.communityId ?? data?.community_id ?? Date.now())

  return {
    id: Number.isNaN(normalizedId) ? Date.now() : normalizedId,
    name: data?.name ?? 'Community',
    description: data?.description ?? data?.tagline ?? 'A community on Elite',
    image: data?.image ?? data?.coverImage ?? data?.avatarUrl ?? FALLBACK_COMMUNITY_IMAGE,
    members: stats.totalMembers,
    joined: true,
    rank: Number(data?.rank ?? 0),
    trending: Boolean(data?.trending ?? data?.isTrending ?? false),
    category: data?.category ?? 'Community',
    announcements: normalizedAnnouncements,
    leaderboard: normalizedLeaderboard,
    membersList: normalizedMembers,
    stats,
    created_by: data?.created_by ? Number(data.created_by) : undefined,
  }
}

const API_BASE_URL = "https://elitescore-social-4046880acb02.herokuapp.com/"
const AUTH_API_BASE_URL = "https://elitescore-auth-fafc42d40d58.herokuapp.com/"

export default function ForYouPage() {
  const isAuthorized = useRequireAuth() // Protect this route
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedCommunity, setSelectedCommunity] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState('announcements')
  const [searchQuery, setSearchQuery] = useState('')
  const [isEditingCommunity, setIsEditingCommunity] = useState(false)
  const [isSavingCommunity, setIsSavingCommunity] = useState(false)
  const [communityEditError, setCommunityEditError] = useState<string | null>(null)
  const [communityEditSuccess, setCommunityEditSuccess] = useState(false)
  const [communityList, setCommunityList] = useState<CommunityType[]>(communities)
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(false)
  const [communityLoadError, setCommunityLoadError] = useState<string | null>(null)
  const [isDeletingCommunity, setIsDeletingCommunity] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false)
  const [isCreatingAnnouncement, setIsCreatingAnnouncement] = useState(false)
  const [announcementError, setAnnouncementError] = useState<string | null>(null)
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    description: '',
  })
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<number | null>(null)
  const [isUpdatingAnnouncement, setIsUpdatingAnnouncement] = useState(false)
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false)
  const [isDeletingAnnouncement, setIsDeletingAnnouncement] = useState(false)
  const [deletingAnnouncementId, setDeletingAnnouncementId] = useState<number | null>(null)
  const [isUploadingPfp, setIsUploadingPfp] = useState(false)
  const [pfpUploadError, setPfpUploadError] = useState<string | null>(null)
  const [pfpPreview, setPfpPreview] = useState<string | null>(null)
  const [selectedPfpFile, setSelectedPfpFile] = useState<File | null>(null)
  const [isDeletingPfp, setIsDeletingPfp] = useState(false)
  const [showDeletePfpConfirm, setShowDeletePfpConfirm] = useState(false)
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [membersError, setMembersError] = useState<string | null>(null)
  const [isUserStaff, setIsUserStaff] = useState(false)
  const [isKickingMember, setIsKickingMember] = useState(false)
  const [kickingMemberId, setKickingMemberId] = useState<number | null>(null)
  const [kickError, setKickError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [isCommunityMember, setIsCommunityMember] = useState(false)
  const [isCheckingMembership, setIsCheckingMembership] = useState(false)
  const [isCommunityOwner, setIsCommunityOwner] = useState(false)
  const [isLeavingCommunity, setIsLeavingCommunity] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [leaveError, setLeaveError] = useState<string | null>(null)
  
  // Fetch current user ID
  useEffect(() => {
    if (!isAuthorized || currentUserId !== null) return

    async function fetchOwnUserId() {
      try {
        const token = getStoredAccessToken()
        if (!token) return

        console.log('[ForYou] Fetching current user ID...')
        const response = await fetch(`${AUTH_API_BASE_URL}v1/users/profile/get_own_profile`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const result = await response.json()
          const profile = result?.data || result
          if (profile?.userId) {
            console.log('[ForYou] Current user ID:', profile.userId)
            setCurrentUserId(profile.userId)
          }
        }
      } catch (error) {
        console.warn('[ForYou] Failed to fetch own user ID:', error)
      }
    }

    fetchOwnUserId()
  }, [isAuthorized, currentUserId])

  // Check if user is a member of the selected community using GET /v1/communities/user/{user_id}
  const checkCommunityMembership = async (communityId: number) => {
    if (!currentUserId) {
      setIsCommunityMember(false)
      return
    }
    
    setIsCheckingMembership(true)
    try {
      console.log('[ForYou] Checking membership for community:', communityId, 'user:', currentUserId)
      const response = await fetch(`/api/communities/user/${currentUserId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result = await response.json()
        const userCommunityIds: number[] = result?.community_ids || []
        const isMember = userCommunityIds.includes(communityId)
        console.log('[ForYou] Membership status:', isMember ? 'Member' : 'Not a member', 'User communities:', userCommunityIds)
        setIsCommunityMember(isMember)
      } else {
        console.warn('[ForYou] Failed to check membership:', response.status)
        setIsCommunityMember(false)
      }
    } catch (error) {
      console.error('[ForYou] Error checking membership:', error)
      setIsCommunityMember(false)
    } finally {
      setIsCheckingMembership(false)
    }
  }

  // Check membership when selected community or current user changes
  useEffect(() => {
    if (!isAuthorized || !selectedCommunity || !currentUserId) {
      setIsCommunityMember(false)
      return
    }

    checkCommunityMembership(selectedCommunity)
  }, [selectedCommunity, currentUserId, isAuthorized])


  // Check if user is staff (by trying to create an announcement - if successful, user is staff)
  useEffect(() => {
    if (!isAuthorized || !selectedCommunity || currentUserId === null) {
      setIsUserStaff(false)
      return
    }

    const token = getStoredAccessToken()
    if (!token) return

    let isCancelled = false

    async function checkStaffStatus() {
      try {
        console.log('[ForYou] Checking if user is staff for community:', selectedCommunity)
        // Try to fetch announcements endpoint - if user can access it, they might be staff
        // Actually, a better approach is to check if user can perform staff actions
        // For now, we'll check by trying to access staff-only endpoints or infer from community data
        // Since we don't have a direct API, we'll set it based on whether user can create announcements
        // This will be checked when user tries to create an announcement
        setIsUserStaff(false) // Default to false, will be updated when user tries staff actions
      } catch (error) {
        console.warn('[ForYou] Error checking staff status:', error)
        setIsUserStaff(false)
      }
    }

    checkStaffStatus()

    return () => {
      isCancelled = true
    }
  }, [isAuthorized, selectedCommunity, currentUserId])
  
  useEffect(() => {
    if (!isAuthorized) return

    const token = getStoredAccessToken()
    if (!token) return

    let isCancelled = false

    async function fetchCommunities() {
      setIsLoadingCommunities(true)
      setCommunityLoadError(null)

      // Check if communityId is in URL params (from search)
      const communityIdParam = searchParams?.get('communityId')
      if (communityIdParam) {
        const communityId = Number(communityIdParam)
        if (!Number.isNaN(communityId)) {
          console.log('[ForYou] ===== Fetching community from search =====')
          console.log('[ForYou] Community ID from URL:', communityId)
          
          try {
            const detailResponse = await fetch(`/api/communities/${communityId}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            })

            if (!detailResponse.ok) {
              const errorText = await detailResponse.text()
              console.error('[ForYou] Failed to load community from search:', errorText)
              throw new Error(errorText || `Failed to load community ${communityId}.`)
            }

            const detailData = await detailResponse.json()
            const communityData = mapCommunityFromApi(detailData)
            console.log('[ForYou] Community fetched from search:', {
              id: communityData.id,
              name: communityData.name,
            })

            if (!isCancelled) {
              // Set this community as the only one in the list (no demo data)
              setCommunityList([communityData])
              setSelectedCommunity(communityId)
              // Clear the URL parameter
              router.replace('/for-you', { scroll: false })
            }
            return
          } catch (error) {
            console.error('[ForYou] Error fetching community from search:', error)
            if (!isCancelled) {
              setCommunityLoadError(error instanceof Error ? error.message : 'Unable to load community.')
            }
          } finally {
            if (!isCancelled) {
              setIsLoadingCommunities(false)
            }
          }
        }
      }

      // Normal flow: fetch user's own communities
      try {
        const ownResponse = await fetch('/api/communities/own', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })

        if (!ownResponse.ok) {
          const errorText = await ownResponse.text()
          throw new Error(errorText || 'Failed to fetch your communities.')
        }

        const ownData = await ownResponse.json()
        const rawIds = ownData?.community_ids ?? ownData?.data?.community_ids ?? []
        const normalizedIds = Array.isArray(rawIds)
          ? Array.from(new Set(rawIds.map((id: number | string) => Number(id)).filter((id) => !Number.isNaN(id))))
          : []

        if (normalizedIds.length === 0) {
          if (!isCancelled) {
            // Don't use demo data - show empty state
            setCommunityList([])
            setSelectedCommunity(null)
          }
          return
        }

        const detailResults = await Promise.all(
          normalizedIds.map(async (id) => {
            const detailResponse = await fetch(`/api/communities/${id}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            })

            if (!detailResponse.ok) {
              const errorText = await detailResponse.text()
              throw new Error(errorText || `Failed to load community ${id}.`)
            }

            const detailData = await detailResponse.json()
            return mapCommunityFromApi(detailData)
          })
        )

        if (!isCancelled) {
          setCommunityList(detailResults)
          setSelectedCommunity((prev) => {
            if (prev && detailResults.some((community) => community.id === prev)) {
              return prev
            }
            return detailResults[0]?.id ?? null
          })
        }
      } catch (error) {
        if (!isCancelled) {
          setCommunityLoadError(error instanceof Error ? error.message : 'Unable to load communities.')
          // Don't use demo data - show empty state
          setCommunityList([])
          setSelectedCommunity(null)
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingCommunities(false)
        }
      }
    }

    fetchCommunities()

    return () => {
      isCancelled = true
    }
  }, [isAuthorized, searchParams])
  
  // Fetch announcements when community changes
  useEffect(() => {
    if (!isAuthorized || !selectedCommunity) {
      return
    }

    const token = getStoredAccessToken()
    if (!token) return

    let isCancelled = false

    async function fetchAnnouncements() {
      setIsLoadingAnnouncements(true)
      
      try {
        console.log('[ForYou] Fetching announcements for community:', selectedCommunity)
        const response = await fetch(`/api/communities/${selectedCommunity}/announcements`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          console.warn('[ForYou] Failed to fetch announcements:', response.status)
          if (!isCancelled) {
            setIsLoadingAnnouncements(false)
          }
          return
        }

        const data = await response.json()
        // Handle response structure: { data: [...] } or just [...]
        const announcementsList = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
        console.log('[ForYou] Fetched', announcementsList.length, 'announcements')

        if (!isCancelled) {
          const normalizedAnnouncements: CommunityAnnouncement[] = announcementsList.map((item: any, index: number) => ({
            id: item?.id ?? index,
            title: item?.title ?? 'Announcement',
            content: item?.description ?? item?.content ?? '',
            timestamp: item?.timestamp ?? item?.created_at ?? 'Just now',
            priority: (item?.priority ?? 'low') as CommunityAnnouncement['priority'],
            pinned: Boolean(item?.pinned),
            type: (item?.type ?? 'info') as CommunityAnnouncement['type'],
          }))

          setCommunityList((prev) =>
            prev.map((item) =>
              item.id === selectedCommunity
                ? {
                    ...item,
                    announcements: normalizedAnnouncements,
                  }
                : item,
            ),
          )
        }
      } catch (error) {
        // Silently handle errors for announcements
      } finally {
        if (!isCancelled) {
          setIsLoadingAnnouncements(false)
        }
      }
    }

    fetchAnnouncements()

    return () => {
      isCancelled = true
    }
  }, [isAuthorized, selectedCommunity])

  // Fetch members when community changes
  useEffect(() => {
    if (!isAuthorized || !selectedCommunity) {
      return
    }

    const token = getStoredAccessToken()
    if (!token) return

    let isCancelled = false

    async function fetchMembers() {
      console.log('[ForYou] ===== Fetching members for community:', selectedCommunity)
      setIsLoadingMembers(true)
      setMembersError(null)
      
      try {
        // Step 1: Get active count
        console.log('[ForYou] Step 1: Fetching active members count...')
        const activeCountResponse = await fetch(`/api/communities/${selectedCommunity}/members/active-count`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })

        if (!activeCountResponse.ok) {
          console.warn('[ForYou] Failed to fetch active count:', activeCountResponse.status)
        } else {
          const activeCountData = await activeCountResponse.json()
          const activeCount = activeCountData?.count ?? activeCountData?.active_count ?? activeCountData?.data?.count ?? 0
          console.log('[ForYou] Active members count:', activeCount)
          
          // Update active count in stats
          if (!isCancelled) {
            setCommunityList((prev) =>
              prev.map((item) =>
                item.id === selectedCommunity
                  ? {
                      ...item,
                      stats: {
                        ...item.stats,
                        activeToday: activeCount,
                      },
                    }
                  : item,
              ),
            )
          }
        }

        // Step 2: Get member IDs
        console.log('[ForYou] Step 2: Fetching member IDs...')
        const memberIdsResponse = await fetch(`/api/communities/${selectedCommunity}/members/ids?limit=1000&offset=0`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })

        if (!memberIdsResponse.ok) {
          console.warn('[ForYou] Failed to fetch member IDs:', memberIdsResponse.status)
          if (!isCancelled) {
            setMembersError('Failed to load members')
            setIsLoadingMembers(false)
          }
          return
        }

        const memberIdsData = await memberIdsResponse.json()
        const userIds = memberIdsData?.user_ids ?? memberIdsData?.data?.user_ids ?? []
        const totalMembers = memberIdsData?.total ?? memberIdsData?.data?.total ?? userIds.length
        
        console.log('[ForYou] Total members:', totalMembers)
        console.log('[ForYou] Member IDs to fetch:', userIds.length)

        // Update total members count
        if (!isCancelled) {
          setCommunityList((prev) =>
            prev.map((item) =>
              item.id === selectedCommunity
                ? {
                    ...item,
                    members: totalMembers,
                    stats: {
                      ...item.stats,
                      totalMembers: totalMembers,
                    },
                  }
                : item,
            ),
          )
        }

        if (userIds.length === 0) {
          console.log('[ForYou] No members found')
          if (!isCancelled) {
            setCommunityList((prev) =>
              prev.map((item) =>
                item.id === selectedCommunity
                  ? {
                      ...item,
                      membersList: [],
                    }
                  : item,
              ),
            )
            setIsLoadingMembers(false)
          }
          return
        }

        // Step 3: Fetch profiles for each member ID
        console.log('[ForYou] Step 3: Fetching profiles for', userIds.length, 'members...')
        const profilePromises = userIds.map(async (userId: number, index: number) => {
          try {
            console.log(`[ForYou] Fetching profile ${index + 1}/${userIds.length} for userId:`, userId)
            const profileResponse = await fetch(`${AUTH_API_BASE_URL}v1/users/profile/get_profile/${userId}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            })

            if (!profileResponse.ok) {
              console.warn(`[ForYou] Failed to fetch profile for userId ${userId}:`, profileResponse.status)
              return null
            }

            const profileData = await profileResponse.json()
            const profile = profileData?.data || profileData
            
            console.log(`[ForYou] Profile fetched for userId ${userId}:`, {
              name: profile?.firstName && profile?.lastName ? `${profile.firstName} ${profile.lastName}` : 'Unknown',
              hasResume: !!profile?.resume,
            })

            // Fetch profile picture
            let image = FALLBACK_MEMBER_IMAGE
            try {
              console.log(`[ForYou] Fetching profile picture for userId ${userId}...`)
              const pfpResponse = await fetch(`/api/user/profile/pfp/${userId}/raw`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
              })

              if (pfpResponse.ok) {
                const pfpData = await pfpResponse.json()
                if (pfpData?.dataUrl && !pfpData?.default) {
                  image = pfpData.dataUrl
                  console.log(`[ForYou] Profile picture fetched for userId ${userId}`)
                } else {
                  console.log(`[ForYou] Using default profile picture for userId ${userId}`)
                }
              } else {
                console.warn(`[ForYou] Failed to fetch profile picture for userId ${userId}:`, pfpResponse.status)
                // Fallback to profile data image
                image = profile?.profilePictureUrl || profile?.profilePicture || profile?.avatarUrl || FALLBACK_MEMBER_IMAGE
              }
            } catch (pfpError) {
              console.warn(`[ForYou] Error fetching profile picture for userId ${userId}:`, pfpError)
              // Fallback to profile data image
              image = profile?.profilePictureUrl || profile?.profilePicture || profile?.avatarUrl || FALLBACK_MEMBER_IMAGE
            }
            
            // Extract resume data
            const resume = profile?.resume || {}
            const jobTitle = resume?.currentRole || resume?.title || ''
            const company = resume?.company || ''
            
            // Determine display title - show job title if available, otherwise "Member"
            // Note: Community role (admin/staff/member) is not available from profile API
            // This will be enhanced when community role API is available
            const displayTitle = jobTitle || 'Member'

            return {
              id: userId,
              name: profile?.firstName && profile?.lastName 
                ? `${profile.firstName} ${profile.lastName}` 
                : profile?.username || 'Member',
              image: image,
              title: displayTitle,
              company: company,
              joined: '', // We don't have this data from the API
              isOnline: false, // We don't have this data from the API
              achievements: [], // We don't have this data from the API
            } as CommunityMember
          } catch (error) {
            console.error(`[ForYou] Error fetching profile for userId ${userId}:`, error)
            return null
          }
        })

        const members = (await Promise.all(profilePromises)).filter((m): m is CommunityMember => m !== null)
        console.log('[ForYou] Successfully fetched', members.length, 'member profiles')

        if (!isCancelled) {
          setCommunityList((prev) =>
            prev.map((item) =>
              item.id === selectedCommunity
                ? {
                    ...item,
                    membersList: members,
                  }
                : item,
            ),
          )
        }
      } catch (error) {
        console.error('[ForYou] Error fetching members:', error)
        if (!isCancelled) {
          setMembersError(error instanceof Error ? error.message : 'Failed to load members')
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingMembers(false)
        }
      }
    }

    fetchMembers()

    return () => {
      isCancelled = true
    }
  }, [isAuthorized, selectedCommunity])
  
  const community = communityList.find((c) => c.id === selectedCommunity) || null
  const communityStats = community?.stats ?? DEFAULT_COMMUNITY_STATS
  const communityAnnouncements = community?.announcements ?? []
  const communityLeaderboard = community?.leaderboard ?? []
  const communityMembers = community?.membersList ?? []
  const joinedCommunities = communityList.filter((c) => c.joined !== false)

  // Check if user is the owner of the selected community
  useEffect(() => {
    if (!community || !currentUserId) {
      setIsCommunityOwner(false)
      return
    }

    const isOwner = community.created_by !== undefined && community.created_by === currentUserId
    console.log('[ForYou] Checking ownership:', {
      communityId: community.id,
      created_by: community.created_by,
      currentUserId,
      isOwner,
    })
    setIsCommunityOwner(isOwner)
  }, [community, currentUserId])

  // Community edit form state
  const [editFormData, setEditFormData] = useState({
    name: "",
    slug: "",
    visibility: "public" as "public" | "private"
  })

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
  }

  // Initialize edit form when opening edit mode
  const handleStartEdit = () => {
    if (community) {
      setEditFormData({
        name: community.name,
        slug: community.name.toLowerCase().replace(/\s+/g, "-"), // Generate slug from name
        visibility: "public" // Default, you may want to get this from community data
      })
      setCommunityEditError(null)
      setCommunityEditSuccess(false)
      setIsEditingCommunity(true)
    }
  }

  const handleCancelEdit = () => {
    setIsEditingCommunity(false)
    setCommunityEditError(null)
    setCommunityEditSuccess(false)
  }

  const handleSaveCommunity = async () => {
    if (!community || !community.id) {
      setCommunityEditError("No community selected")
      return
    }

    if (!editFormData.name.trim()) {
      setCommunityEditError("Community name is required")
      return
    }

    setIsSavingCommunity(true)
    setCommunityEditError(null)
    setCommunityEditSuccess(false)

    try {
      const token = getStoredAccessToken()
      if (!token) {
        setCommunityEditError("Authentication required. Please log in again.")
        setIsSavingCommunity(false)
        return
      }

      const payload = {
        name: editFormData.name.trim(),
        slug: editFormData.slug.trim() || generateSlug(editFormData.name),
        visibility: editFormData.visibility
      }

      const response = await fetch(`/api/communities/edit/${community.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload)
      })

        if (!response.ok) {
          let errorMessage = "Failed to update community"
          const errorText = await response.text()
          
          if (errorText) {
            try {
              const errorData = JSON.parse(errorText)
              errorMessage = errorData.message || errorData.error || errorData.details || errorMessage
              
              // Handle 403 Forbidden - user is not the owner
              if (response.status === 403) {
                errorMessage = "You must be the owner of this community to edit it."
                setIsCommunityOwner(false)
              }
            } catch {
              errorMessage = errorText
            }
          }

          setCommunityEditError(errorMessage)
          setIsSavingCommunity(false)
          return
        }

      const data = await response.json()
      
      setCommunityEditSuccess(true)
      setIsEditingCommunity(false)
      
      setCommunityList((prev) =>
        prev.map((item) =>
          item.id === community.id
            ? {
                ...item,
                name: data?.name ?? editFormData.name,
                description: data?.description ?? item.description,
              }
            : item,
        ),
      )

      // Clear success message after 3 seconds
      setTimeout(() => {
        setCommunityEditSuccess(false)
      }, 3000)
    } catch (error) {
      setCommunityEditError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsSavingCommunity(false)
    }
  }

  const handleDeleteCommunity = async () => {
    if (!community || !community.id) {
      setDeleteError("No community selected")
      return
    }

    setIsDeletingCommunity(true)
    setDeleteError(null)

    try {
      const token = getStoredAccessToken()
      if (!token) {
        setDeleteError("Authentication required. Please log in again.")
        setIsDeletingCommunity(false)
        return
      }

      const response = await fetch(`/api/communities/delete/${community.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        let errorMessage = "Failed to delete community"
        const errorText = await response.text()
        
        if (errorText) {
          try {
            const errorData = JSON.parse(errorText)
            errorMessage = errorData.message || errorData.error || errorData.details || errorMessage
          } catch {
            errorMessage = errorText
          }
        }

        setDeleteError(errorMessage)
        setIsDeletingCommunity(false)
        return
      }

      // 204 No Content - successful deletion
      setShowDeleteConfirm(false)
      
      // Remove the deleted community from the list
      setCommunityList((prev) => prev.filter((item) => item.id !== community.id))
      
      // Select the first available community or null
      const remainingCommunities = communityList.filter((item) => item.id !== community.id)
      setSelectedCommunity(remainingCommunities[0]?.id ?? null)
      
      // If no communities left, redirect or show message
      if (remainingCommunities.length === 0) {
        router.push('/for-you/create')
      }
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsDeletingCommunity(false)
    }
  }

  /**
   * Creates a new announcement for the selected community.
   * 
   * Authorization Requirements (enforced by backend):
   * - User must be a member of the community (RoleGuard.isMember)
   * - User must be staff of the community (RoleGuard.isStaff)
   * 
   * Both conditions must be satisfied. The backend will return 403 Forbidden if not authorized.
   */
  const handleCreateAnnouncement = async () => {
    if (!community || !community.id) {
      setAnnouncementError("No community selected")
      return
    }

    if (!announcementForm.title.trim()) {
      setAnnouncementError("Title is required")
      return
    }

    if (!announcementForm.description.trim()) {
      setAnnouncementError("Description is required")
      return
    }

    setIsCreatingAnnouncement(true)
    setAnnouncementError(null)

    try {
      const token = getStoredAccessToken()
      if (!token) {
        setAnnouncementError("Authentication required. Please log in again.")
        setIsCreatingAnnouncement(false)
        return
      }

      const response = await fetch(`/api/communities/${community.id}/announcements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: announcementForm.title.trim(),
          description: announcementForm.description.trim(),
        }),
      })

      if (!response.ok) {
        let errorMessage = "Failed to create announcement"
        let errorData: any = null
        const errorText = await response.text()
        
        if (errorText) {
          try {
            errorData = JSON.parse(errorText)
            errorMessage = errorData.message || errorData.error || errorData.details || errorMessage
          } catch {
            errorMessage = errorText
          }
        }

        // Handle 403 Forbidden - user doesn't have required roles
        if (response.status === 403) {
          errorMessage = errorData?.message || "You must be both a member and staff of this community to create announcements."
          console.log('[ForYou] User is NOT staff (403 on create announcement)')
          setIsUserStaff(false)
        } else if (response.ok) {
          // If successful, user is staff
          console.log('[ForYou] User IS staff (successful announcement creation)')
          setIsUserStaff(true)
        }

        setAnnouncementError(errorMessage)
        setIsCreatingAnnouncement(false)
        return
      }

      const data = await response.json()
      
      // Add the new announcement to the list
      const newAnnouncement: CommunityAnnouncement = {
        id: data?.id ?? Date.now(),
        title: data?.title ?? announcementForm.title,
        content: data?.description ?? data?.content ?? announcementForm.description,
        timestamp: "Just now",
        priority: "low" as const,
        pinned: false,
        type: "info" as const,
      }

      setCommunityList((prev) =>
        prev.map((item) =>
          item.id === community.id
            ? {
                ...item,
                announcements: [newAnnouncement, ...item.announcements],
              }
            : item,
        ),
      )

      // Reset form and close dialog
      setAnnouncementForm({ title: '', description: '' })
      setEditingAnnouncementId(null)
      setShowCreateAnnouncement(false)
      
      // Optionally refresh announcements from API
      // The useEffect will handle this when selectedCommunity changes, but we can trigger a manual refresh if needed
    } catch (error) {
      setAnnouncementError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsCreatingAnnouncement(false)
    }
  }

  /**
   * Updates an existing announcement for the selected community.
   * 
   * Authorization Requirements (enforced by backend):
   * - User must be a member of the community (RoleGuard.isMember)
   * - User must be staff of the community (RoleGuard.isStaff)
   * 
   * Both conditions must be satisfied. The backend will return 403 Forbidden if not authorized.
   */
  const handleUpdateAnnouncement = async () => {
    if (!community || !community.id || !editingAnnouncementId) {
      setAnnouncementError("No community or announcement selected")
      return
    }

    if (!announcementForm.title.trim()) {
      setAnnouncementError("Title is required")
      return
    }

    if (!announcementForm.description.trim()) {
      setAnnouncementError("Description is required")
      return
    }

    setIsUpdatingAnnouncement(true)
    setAnnouncementError(null)

    try {
      const token = getStoredAccessToken()
      if (!token) {
        setAnnouncementError("Authentication required. Please log in again.")
        setIsUpdatingAnnouncement(false)
        return
      }

      const response = await fetch(`/api/communities/${community.id}/announcements/${editingAnnouncementId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: announcementForm.title.trim(),
          description: announcementForm.description.trim(),
        }),
      })

      if (!response.ok) {
        let errorMessage = "Failed to update announcement"
        let errorData: any = null
        const errorText = await response.text()
        
        if (errorText) {
          try {
            errorData = JSON.parse(errorText)
            errorMessage = errorData.message || errorData.error || errorData.details || errorMessage
          } catch {
            errorMessage = errorText
          }
        }

        // Handle 403 Forbidden - user doesn't have required roles
        if (response.status === 403) {
          errorMessage = errorData?.message || "You must be both a member and staff of this community to update announcements."
        }

        setAnnouncementError(errorMessage)
        setIsUpdatingAnnouncement(false)
        return
      }

      const data = await response.json()
      
      // Update the announcement in the list
      setCommunityList((prev) =>
        prev.map((item) =>
          item.id === community.id
            ? {
                ...item,
                announcements: item.announcements.map((ann) =>
                  ann.id === editingAnnouncementId
                    ? {
                        ...ann,
                        title: data?.title ?? announcementForm.title,
                        content: data?.description ?? data?.content ?? announcementForm.description,
                      }
                    : ann,
                ),
              }
            : item,
        ),
      )

      // Reset form and close dialog
      setAnnouncementForm({ title: '', description: '' })
      setEditingAnnouncementId(null)
      setShowCreateAnnouncement(false)
    } catch (error) {
      setAnnouncementError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsUpdatingAnnouncement(false)
    }
  }

  const handleStartEditAnnouncement = (announcement: CommunityAnnouncement) => {
    setAnnouncementForm({
      title: announcement.title,
      description: announcement.content,
    })
    setEditingAnnouncementId(announcement.id)
    setAnnouncementError(null)
    setShowCreateAnnouncement(true)
  }

  const handleCancelAnnouncementEdit = () => {
    setAnnouncementForm({ title: '', description: '' })
    setEditingAnnouncementId(null)
    setShowCreateAnnouncement(false)
    setAnnouncementError(null)
  }

  /**
   * Deletes an announcement from the selected community.
   * 
   * Authorization Requirements (enforced by backend):
   * - User must be a member of the community (RoleGuard.isMember)
   * - User must be staff of the community (RoleGuard.isStaff)
   * 
   * Both conditions must be satisfied. The backend will return 403 Forbidden if not authorized.
   */
  const handleDeleteAnnouncement = async (announcementId: number) => {
    if (!community || !community.id) {
      return
    }

    setIsDeletingAnnouncement(true)
    setDeletingAnnouncementId(announcementId)
    setAnnouncementError(null)

    try {
      const token = getStoredAccessToken()
      if (!token) {
        setAnnouncementError("Authentication required. Please log in again.")
        setIsDeletingAnnouncement(false)
        setDeletingAnnouncementId(null)
        return
      }

      const response = await fetch(`/api/communities/${community.id}/announcements/${announcementId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        let errorMessage = "Failed to delete announcement"
        let errorData: any = null
        const errorText = await response.text()
        
        if (errorText) {
          try {
            errorData = JSON.parse(errorText)
            errorMessage = errorData.message || errorData.error || errorData.details || errorMessage
          } catch {
            errorMessage = errorText
          }
        }

        // Handle 403 Forbidden - user doesn't have required roles
        if (response.status === 403) {
          errorMessage = errorData?.message || "You must be both a member and staff of this community to delete announcements."
        }

        setAnnouncementError(errorMessage)
        setIsDeletingAnnouncement(false)
        setDeletingAnnouncementId(null)
        return
      }

      // 204 No Content - successful deletion
      // Remove the announcement from the list
      setCommunityList((prev) =>
        prev.map((item) =>
          item.id === community.id
            ? {
                ...item,
                announcements: item.announcements.filter((ann) => ann.id !== announcementId),
              }
            : item,
        ),
      )
    } catch (error) {
      setAnnouncementError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsDeletingAnnouncement(false)
      setDeletingAnnouncementId(null)
    }
  }

  /**
   * Gets the profile picture URL for a community.
   * Returns the API endpoint URL if community ID is available, otherwise falls back to the provided image.
   */
  const getCommunityPfpUrl = (communityId: number | null | undefined, fallbackImage: string | undefined): string => {
    // If we have a preview, use it
    if (pfpPreview) {
      return pfpPreview
    }
    
    // If we have a community ID, try to use the API endpoint
    if (communityId) {
      const token = getStoredAccessToken()
      // Include token as query param for img tag requests (since img tags can't send custom headers)
      // The API route will prefer the Authorization header if available
      const url = `/api/communities/${communityId}/pfp/raw`
      return token ? `${url}?token=${encodeURIComponent(token)}` : url
    }
    
    // Fallback to the provided image or default
    return fallbackImage || FALLBACK_COMMUNITY_IMAGE
  }

  /**
   * Handles file selection for profile picture upload
   */
  const handlePfpFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validImageTypes.includes(file.type)) {
      setPfpUploadError('Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed.')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setPfpUploadError('File size exceeds 5MB limit.')
      return
    }

    setSelectedPfpFile(file)
    setPfpUploadError(null)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPfpPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  /**
   * Uploads the selected profile picture to the community.
   * 
   * Authorization Requirements (enforced by backend):
   * - User must be a member of the community (RoleGuard.isMember)
   * - User must be staff of the community (RoleGuard.isStaff)
   * 
   * Both conditions must be satisfied. The backend will return 403 Forbidden if not authorized.
   */
  const handleUploadPfp = async () => {
    if (!community || !community.id || !selectedPfpFile) {
      setPfpUploadError("No file selected")
      return
    }

    setIsUploadingPfp(true)
    setPfpUploadError(null)

    try {
      const token = getStoredAccessToken()
      if (!token) {
        setPfpUploadError("Authentication required. Please log in again.")
        setIsUploadingPfp(false)
        return
      }

      const formData = new FormData()
      formData.append('file', selectedPfpFile)

      const response = await fetch(`/api/communities/${community.id}/pfp`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          // Don't set Content-Type - browser will set it with boundary for FormData
        },
        body: formData,
      })

      if (!response.ok) {
        let errorMessage = "Failed to upload profile picture"
        const errorText = await response.text()
        
        if (errorText) {
          try {
            const errorData = JSON.parse(errorText)
            errorMessage = errorData.message || errorData.error || errorData.details || errorMessage
          } catch {
            errorMessage = errorText
          }
        }

        // Handle 403 Forbidden - user doesn't have required roles
        if (response.status === 403) {
          errorMessage = "You must be both a member and staff of this community to update the profile picture."
        }

        setPfpUploadError(errorMessage)
        setIsUploadingPfp(false)
        return
      }

      const data = await response.json()
      
      // After successful upload, update the community image to use the API endpoint
      // This ensures we get the latest uploaded image
      const newImageUrl = data?.imageUrl || data?.image || data?.url || (community.id ? `/api/communities/${community.id}/pfp/raw` : pfpPreview)
      
      setCommunityList((prev) =>
        prev.map((item) =>
          item.id === community.id
            ? {
                ...item,
                image: newImageUrl || item.image,
              }
            : item,
        ),
      )

      // Clear preview and selected file
      setPfpPreview(null)
      setSelectedPfpFile(null)
      
      // Reset file input
      const fileInput = document.getElementById('pfp-upload-input') as HTMLInputElement
      if (fileInput) {
        fileInput.value = ''
      }
    } catch (error) {
      setPfpUploadError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsUploadingPfp(false)
    }
  }

  /**
   * Deletes the profile picture for the selected community.
   * 
   * Authorization Requirements (enforced by backend):
   * - User must be a member of the community (RoleGuard.isMember)
   * - User must be staff of the community (RoleGuard.isStaff)
   * 
   * Both conditions must be satisfied. The backend will return 403 Forbidden if not authorized.
   */
  const handleDeletePfp = async () => {
    if (!community || !community.id) {
      setPfpUploadError("No community selected")
      return
    }

    setIsDeletingPfp(true)
    setPfpUploadError(null)
    setShowDeletePfpConfirm(false)

    try {
      const token = getStoredAccessToken()
      if (!token) {
        setPfpUploadError("Authentication required. Please log in again.")
        setIsDeletingPfp(false)
        return
      }

      const response = await fetch(`/api/communities/${community.id}/pfp`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        let errorMessage = "Failed to delete profile picture"
        const errorText = await response.text()
        
        if (errorText) {
          try {
            const errorData = JSON.parse(errorText)
            errorMessage = errorData.message || errorData.error || errorData.details || errorMessage
          } catch {
            errorMessage = errorText
          }
        }

        // Handle 403 Forbidden - user doesn't have required roles
        if (response.status === 403) {
          errorMessage = "You must be both a member and staff of this community to delete the profile picture."
        }

        setPfpUploadError(errorMessage)
        setIsDeletingPfp(false)
        return
      }

      // Update the community image in the list to use fallback
      setCommunityList((prev) =>
        prev.map((item) =>
          item.id === community.id
            ? {
                ...item,
                image: FALLBACK_COMMUNITY_IMAGE,
              }
            : item,
        ),
      )

      // Clear any preview
      setPfpPreview(null)
      setSelectedPfpFile(null)
      
      // Reset file input
      const fileInput = document.getElementById('pfp-upload-input') as HTMLInputElement
      if (fileInput) {
        fileInput.value = ''
      }
    } catch (error) {
      setPfpUploadError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsDeletingPfp(false)
    }
  }

  /**
   * Leaves the selected community.
   * 
   * Authorization Requirements (enforced by backend):
   * - User must be a member of the community
   * 
   * The backend will return 403 Forbidden if not authorized.
   */
  const handleLeaveCommunity = async () => {
    if (!community || !community.id) {
      setLeaveError("No community selected")
      return
    }

    setIsLeavingCommunity(true)
    setLeaveError(null)

    try {
      const token = getStoredAccessToken()
      if (!token) {
        setLeaveError("Authentication required. Please log in again.")
        setIsLeavingCommunity(false)
        return
      }

      console.log('[ForYou] ===== Leaving community =====')
      console.log('[ForYou] Community ID:', community.id)

      const response = await fetch(`/api/communities/${community.id}/leave`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })

      console.log('[ForYou] Leave community response status:', response.status)

      if (!response.ok) {
        let errorMessage = "Failed to leave community"
        const errorText = await response.text()
        
        if (errorText) {
          try {
            const errorData = JSON.parse(errorText)
            errorMessage = errorData.message || errorData.error || errorData.details || errorMessage
          } catch {
            errorMessage = errorText
          }
        }

        setLeaveError(errorMessage)
        setIsLeavingCommunity(false)
        return
      }

      console.log('[ForYou] Successfully left community')
      
      setShowLeaveConfirm(false)
      
      // Remove the community from the list
      setCommunityList((prev) => prev.filter((item) => item.id !== community.id))
      
      // Select the first available community or null
      const remainingCommunities = communityList.filter((item) => item.id !== community.id)
      setSelectedCommunity(remainingCommunities[0]?.id ?? null)
      
      // If no communities left, redirect or show message
      if (remainingCommunities.length === 0) {
        router.push('/for-you/create')
      }
    } catch (error) {
      console.error('[ForYou] Error leaving community:', error)
      setLeaveError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsLeavingCommunity(false)
    }
  }

  /**
   * Kicks a member from the selected community.
   * 
   * Authorization Requirements (enforced by backend):
   * - User must be staff of the community (RoleGuard.isStaff)
   * 
   * The backend will return 403 Forbidden if not authorized.
   */
  const handleKickMember = async (memberId: number) => {
    if (!community || !community.id) {
      setKickError("No community selected")
      return
    }

    setIsKickingMember(true)
    setKickingMemberId(memberId)
    setKickError(null)

    try {
      const token = getStoredAccessToken()
      if (!token) {
        setKickError("Authentication required. Please log in again.")
        setIsKickingMember(false)
        setKickingMemberId(null)
        return
      }

      console.log('[ForYou] ===== Kicking member =====')
      console.log('[ForYou] Community ID:', community.id)
      console.log('[ForYou] Member ID to kick:', memberId)

      const response = await fetch(`/api/communities/${community.id}/members/${memberId}/kick`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })

      console.log('[ForYou] Kick member response status:', response.status)

      if (!response.ok) {
        let errorMessage = "Failed to kick member"
        const errorText = await response.text()
        
        if (errorText) {
          try {
            const errorData = JSON.parse(errorText)
            errorMessage = errorData.message || errorData.error || errorData.details || errorMessage
          } catch {
            errorMessage = errorText
          }
        }

        // Handle 403 Forbidden - user doesn't have required roles
        if (response.status === 403) {
          errorMessage = "You must be staff of this community to kick members."
          console.log('[ForYou] User is NOT staff (403 on kick member)')
          setIsUserStaff(false)
        }

        setKickError(errorMessage)
        setIsKickingMember(false)
        setKickingMemberId(null)
        return
      }

      console.log('[ForYou] Member kicked successfully')
      
      // If successful, user is staff
      console.log('[ForYou] User IS staff (successful kick action)')
      setIsUserStaff(true)

      // Remove the kicked member from the list
      setCommunityList((prev) =>
        prev.map((item) =>
          item.id === community.id
            ? {
                ...item,
                membersList: item.membersList.filter((member) => member.id !== memberId),
                members: Math.max(0, item.members - 1),
                stats: {
                  ...item.stats,
                  totalMembers: Math.max(0, item.stats.totalMembers - 1),
                },
              }
            : item,
        ),
      )
    } catch (error) {
      console.error('[ForYou] Error kicking member:', error)
      setKickError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsKickingMember(false)
      setKickingMemberId(null)
    }
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2bbcff] border-t-transparent" />
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col min-h-screen bg-black text-white relative overflow-x-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-black" />
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black to-transparent" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-radial from-blue-500/40 via-purple-700/30 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-24 w-72 h-72 bg-gradient-radial from-purple-700/40 via-pink-600/30 to-transparent rounded-full blur-3xl" />
        </div>
        
        {/* Main Content - Full Width */}
        <div className="relative z-10 w-full">
          <div className="w-full sm:max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
            <AnimatedSection delay={0.1}>
              {communityLoadError && (
                <div className="w-full mb-4">
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs sm:text-sm text-red-200">
                    {communityLoadError}
                  </div>
                </div>
              )}
              {isLoadingCommunities && (
                <div className="w-full mb-3 flex items-center gap-2 text-xs sm:text-sm text-zinc-400">
                  <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  Loading community...
                </div>
              )}
              {!isLoadingCommunities && !community && !communityLoadError && (
                <div className="w-full mb-3 flex items-center justify-center py-8">
                  <div className="text-center">
                    <p className="text-sm text-zinc-400 mb-2">No community selected</p>
                    <p className="text-xs text-zinc-500">Search for a community or select one from your list</p>
                  </div>
                </div>
              )}
              {community && (
                <>
              {/* HERO SECTION - compact for mobile */}
              <section className="flex flex-col items-center gap-3 sm:gap-4 mb-5 sm:mb-6">
                <div className="flex items-center gap-3 sm:gap-4 w-full">
                  <div className="relative group">
                    <Avatar className="h-14 w-14 sm:h-16 sm:w-16 border-2 sm:border-3 border-blue-700/40 ring-2 sm:ring-3 ring-blue-500/30 shadow-[0_0_16px_0_rgba(80,0,255,0.4)]">
                      <AvatarImage 
                        src={getCommunityPfpUrl(community?.id, community?.image)} 
                        onError={(e) => {
                          // Fallback to the original image if the API endpoint fails
                          const target = e.target as HTMLImageElement
                          if (target.src !== community?.image && community?.image) {
                            target.src = community.image
                          } else if (target.src !== FALLBACK_COMMUNITY_IMAGE) {
                            target.src = FALLBACK_COMMUNITY_IMAGE
                          }
                        }}
                      />
                      <AvatarFallback className="bg-zinc-800 text-lg sm:text-2xl">{community?.name?.charAt(0) ?? 'C'}</AvatarFallback>
                    </Avatar>
                    {community?.trending && (
                      <Badge className="absolute -top-1 -right-1 bg-purple-900/50 text-purple-300 border-purple-800 text-[9px] sm:text-[10px]">Hot</Badge>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                      <label
                        htmlFor="pfp-upload-input"
                        className="flex items-center justify-center cursor-pointer p-1 hover:bg-white/20 rounded-full"
                        title="Change profile picture"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Camera className="h-4 w-4 text-white" />
                      </label>
                      {community?.image && 
                       community.image !== FALLBACK_COMMUNITY_IMAGE && 
                       !community.image.includes('unsplash.com') && 
                       !pfpPreview && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowDeletePfpConfirm(true)
                          }}
                          className="flex items-center justify-center cursor-pointer p-1 hover:bg-red-500/30 rounded-full"
                          title="Delete profile picture"
                          disabled={isDeletingPfp}
                        >
                          <Trash2 className="h-4 w-4 text-white" />
                        </button>
                      )}
                    </div>
                    <input
                      id="pfp-upload-input"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={handlePfpFileSelect}
                      disabled={isUploadingPfp || isDeletingPfp}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Profile Picture Upload Preview and Controls */}
                    {pfpPreview && (
                      <div className="mb-2 p-2 rounded-lg border border-blue-500/30 bg-blue-500/10">
                        <div className="flex items-center gap-2 mb-2">
                          <img
                            src={pfpPreview}
                            alt="Preview"
                            className="h-10 w-10 rounded-full object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-zinc-300 truncate">{selectedPfpFile?.name}</p>
                            <p className="text-xs text-zinc-500">
                              {(selectedPfpFile?.size ? selectedPfpFile.size / 1024 : 0).toFixed(1)} KB
                            </p>
                          </div>
                          <EnhancedButton
                            variant="ghost"
                            size="sm"
                            rounded="full"
                            className="h-6 w-6 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                            onClick={() => {
                              setPfpPreview(null)
                              setSelectedPfpFile(null)
                              const fileInput = document.getElementById('pfp-upload-input') as HTMLInputElement
                              if (fileInput) fileInput.value = ''
                            }}
                            title="Cancel"
                          >
                            <X className="h-3 w-3" />
                          </EnhancedButton>
                        </div>
                        {pfpUploadError && (
                          <div className="mb-2 text-xs text-red-400">{pfpUploadError}</div>
                        )}
                        <EnhancedButton
                          variant="gradient"
                          size="sm"
                          rounded="default"
                          className="w-full text-xs"
                          onClick={handleUploadPfp}
                          disabled={isUploadingPfp}
                        >
                          {isUploadingPfp ? (
                            <>
                              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-3 w-3 mr-1" />
                              Upload Picture
                            </>
                          )}
                        </EnhancedButton>
                      </div>
                    )}
                    {pfpUploadError && !pfpPreview && (
                      <div className="mb-2 text-xs text-red-400">{pfpUploadError}</div>
                    )}
                    <div className="flex items-center gap-2">
                      <h1 className="text-lg sm:text-2xl font-extrabold leading-tight bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent truncate">
                        {community?.name}
                      </h1>
                      <div className="flex items-center gap-1">
                        {isCommunityOwner && (
                          <>
                            <EnhancedButton
                              variant="ghost"
                              size="sm"
                              rounded="full"
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                              onClick={handleStartEdit}
                              title="Edit community"
                            >
                              <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </EnhancedButton>
                            <EnhancedButton
                              variant="ghost"
                              size="sm"
                              rounded="full"
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-zinc-400 hover:text-red-400 hover:bg-red-950/20"
                              onClick={() => setShowDeleteConfirm(true)}
                              title="Delete community"
                            >
                              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </EnhancedButton>
                          </>
                        )}
                        {isCommunityMember && !isCommunityOwner && (
                          <EnhancedButton
                            variant="ghost"
                            size="sm"
                            rounded="full"
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-zinc-400 hover:text-red-400 hover:bg-red-950/20"
                            onClick={() => setShowLeaveConfirm(true)}
                            title="Leave community"
                          >
                            <UserX className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </EnhancedButton>
                        )}
                      </div>
                        <Select value={selectedCommunity !== null ? selectedCommunity.toString() : undefined} onValueChange={(value) => setSelectedCommunity(Number(value))}>
                          <SelectTrigger className="h-7 w-7 sm:h-8 sm:w-8 p-0 bg-zinc-800/80 border-zinc-700/50 hover:bg-zinc-700">
                            <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-400" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-800">
                            {joinedCommunities.length ? (
                              joinedCommunities.map((c) => (
                                <SelectItem key={c.id} value={c.id.toString()} className="text-white hover:bg-zinc-800 text-xs sm:text-sm">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                                      <AvatarImage 
                                        src={getCommunityPfpUrl(c.id, c.image)}
                                        onError={(e) => {
                                          // Fallback to the original image if the API endpoint fails
                                          const target = e.target as HTMLImageElement
                                          if (target.src !== c.image && c.image) {
                                            target.src = c.image
                                          } else if (target.src !== FALLBACK_COMMUNITY_IMAGE) {
                                            target.src = FALLBACK_COMMUNITY_IMAGE
                                          }
                                        }}
                                      />
                                      <AvatarFallback className="bg-zinc-800 text-[10px]">{c.name?.charAt(0) ?? 'C'}</AvatarFallback>
                                    </Avatar>
                                    <span className="truncate">{c.name}</span>
                                    {c.trending && <Badge className="bg-purple-900/50 text-purple-300 border-purple-800 text-[9px] ml-1.5">Hot</Badge>}
                                  </div>
                                </SelectItem>
                              ))
                            ) : (
                              <div className="px-2 py-1.5 text-xs sm:text-sm text-zinc-400">
                                No communities yet.
                              </div>
                            )}
                            <div className="border-t border-zinc-800 mt-1 pt-1">
                              <div
                                onClick={() => router.push("/for-you/create")}
                                className="flex items-center gap-2 px-2 py-1.5 text-xs sm:text-sm text-blue-400 hover:bg-zinc-800 cursor-pointer rounded-md transition-colors"
                              >
                                <Plus className="h-4 w-4" />
                                <span>Create New Community</span>
                              </div>
                            </div>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <p className="text-zinc-400 text-xs sm:text-sm mt-0.5 line-clamp-1">{community?.description ?? 'No description yet.'}</p>
                  </div>
                
                {/* Stats Row - Compact */}
                <div className="flex flex-wrap gap-3 sm:gap-4 justify-center items-center w-full">
                  <div className="flex flex-col items-center">
                    <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
                      <AnimatedCounter from={0} to={community?.members || 0} duration={2} delay={0.5} />
                    </span>
                    <span className="text-[10px] sm:text-xs text-zinc-400">Members</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
                      <AnimatedCounter from={0} to={communityStats.activeToday || 0} duration={2} delay={0.6} />
                    </span>
                    <span className="text-[10px] sm:text-xs text-zinc-400">Active</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
                      <AnimatedCounter from={0} to={communityStats.weeklyGrowth || 0} duration={2} delay={0.7} />%
                    </span>
                    <span className="text-[10px] sm:text-xs text-zinc-400">Growth</span>
                  </div>
                  {isCommunityMember && !isCommunityOwner && (
                    <EnhancedButton
                      variant="outline"
                      size="sm"
                      rounded="full"
                      className="bg-red-900/20 border-red-700/50 text-red-400 hover:bg-red-900/40 hover:border-red-600 h-8 sm:h-9 text-xs sm:text-sm px-3 sm:px-4"
                      onClick={() => setShowLeaveConfirm(true)}
                    >
                      <UserX className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5" />
                      <span className="hidden sm:inline">Leave Community</span>
                      <span className="sm:hidden">Leave</span>
                    </EnhancedButton>
                  )}
                </div>

                {/* Progress Bar - Compact */}
                <div className="w-full mt-2">
                  <AnimatedProgress value={communityStats.monthlyActivity || 0} max={100} className="h-2 bg-zinc-800 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:via-purple-500 [&>div]:to-fuchsia-500 [&>div]:shadow-[0_0_8px_0_rgba(80,0,255,0.5)]" delay={0.9} />
                  <p className="text-[10px] sm:text-xs text-zinc-500 mt-1 text-center">{communityStats.monthlyActivity}% Activity</p>
                </div>

                {/* Member Avatars - Compact */}
                <div className="flex gap-1.5 sm:gap-2 justify-center">
                  {communityMembers.slice(0, 3).map((member) => (
                    <Avatar key={member.id} className="h-7 w-7 sm:h-8 sm:w-8 border border-blue-700/40">
                      <AvatarImage src={member.image} />
                      <AvatarFallback className="bg-zinc-800 text-[10px]">{member.name?.charAt(0) ?? 'M'}</AvatarFallback>
                    </Avatar>
                  ))}
                  {community && community.members > 3 && (
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-zinc-800 border border-blue-700/40 flex items-center justify-center text-[9px] sm:text-[10px] text-zinc-400">
                      +{Math.floor(community.members / 1000)}k
                    </div>
                  )}
                </div>
              </section>

              {/* Edit Community Dialog */}
              {isEditingCommunity && (
                <AnimatedSection delay={0.1}>
                  <EnhancedCard variant="default" className="bg-zinc-900 border border-zinc-800 rounded-xl mb-4 sm:mb-5">
                    <EnhancedCardHeader className="p-3 sm:p-4 border-b border-zinc-800">
                      <div className="flex items-center justify-between">
                        <EnhancedCardTitle className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                          <Edit className="h-4 w-4" />
                          Edit Community
                        </EnhancedCardTitle>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </EnhancedCardHeader>
                    <EnhancedCardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                      {communityEditError && (
                        <div className="bg-red-900/20 border border-red-700/40 rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm text-red-300">
                          {communityEditError}
                        </div>
                      )}
                      {communityEditSuccess && (
                        <div className="bg-green-900/20 border border-green-700/40 rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm text-green-300">
                          Community updated successfully!
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="edit-community-name" className="text-xs sm:text-sm font-medium text-zinc-300 flex items-center gap-2">
                          <Users className="h-3.5 w-3.5" />
                          Community Name <span className="text-red-400">*</span>
                        </Label>
                        <Input
                          id="edit-community-name"
                          type="text"
                          placeholder="e.g., Software Engineers Elite"
                          value={editFormData.name}
                          onChange={(e) => setEditFormData(prev => ({
                            ...prev,
                            name: e.target.value,
                            slug: prev.slug || generateSlug(e.target.value)
                          }))}
                          className="bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 h-9 sm:h-10 text-xs sm:text-sm"
                          required
                          maxLength={100}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-community-slug" className="text-xs sm:text-sm font-medium text-zinc-300 flex items-center gap-2">
                          <Hash className="h-3.5 w-3.5" />
                          URL Slug
                        </Label>
                        <Input
                          id="edit-community-slug"
                          type="text"
                          placeholder="e.g., software-engineers-elite"
                          value={editFormData.slug}
                          onChange={(e) => setEditFormData(prev => ({
                            ...prev,
                            slug: generateSlug(e.target.value)
                          }))}
                          className="bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 h-9 sm:h-10 text-xs sm:text-sm font-mono"
                          maxLength={100}
                        />
                        <p className="text-[10px] sm:text-xs text-zinc-500">Used in the community URL</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-community-visibility" className="text-xs sm:text-sm font-medium text-zinc-300 flex items-center gap-2">
                          {editFormData.visibility === "public" ? (
                            <Globe className="h-3.5 w-3.5" />
                          ) : (
                            <Lock className="h-3.5 w-3.5" />
                          )}
                          Visibility <span className="text-red-400">*</span>
                        </Label>
                        <Select
                          value={editFormData.visibility}
                          onValueChange={(value: "public" | "private") => setEditFormData(prev => ({ ...prev, visibility: value }))}
                        >
                          <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 h-9 sm:h-10 text-xs sm:text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-800">
                            <SelectItem value="public" className="text-white hover:bg-zinc-800">
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                <span>Public</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="private" className="text-white hover:bg-zinc-800">
                              <div className="flex items-center gap-2">
                                <Lock className="h-4 w-4" />
                                <span>Private</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-[10px] sm:text-xs text-zinc-500">
                          {editFormData.visibility === "public" 
                            ? "Anyone can find and join your community"
                            : "Only invited members can join your community"}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <EnhancedButton
                          type="button"
                          variant="outline"
                          rounded="full"
                          className="flex-1 bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800 h-9 sm:h-10 text-xs sm:text-sm"
                          onClick={handleCancelEdit}
                          disabled={isSavingCommunity}
                        >
                          Cancel
                        </EnhancedButton>
                        <EnhancedButton
                          type="button"
                          variant="gradient"
                          rounded="full"
                          animation="shimmer"
                          className="flex-1 bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 shadow-[0_0_16px_0_rgba(80,0,255,0.4)] h-9 sm:h-10 text-xs sm:text-sm font-bold"
                          onClick={handleSaveCommunity}
                          disabled={isSavingCommunity || !editFormData.name.trim()}
                          isLoading={isSavingCommunity}
                        >
                          {isSavingCommunity ? "Saving..." : "Save Changes"}
                        </EnhancedButton>
                      </div>
                    </EnhancedCardContent>
                  </EnhancedCard>
                </AnimatedSection>
              )}

              {/* Delete Profile Picture Confirmation */}
              {showDeletePfpConfirm && (
                <AnimatedSection delay={0.1}>
                  <EnhancedCard variant="default" className="bg-zinc-900 border border-red-800/50 rounded-xl mb-4 sm:mb-5">
                    <EnhancedCardHeader className="p-3 sm:p-4 border-b border-red-800/30">
                      <div className="flex items-center justify-between">
                        <EnhancedCardTitle className="text-sm sm:text-base font-bold text-red-400 flex items-center gap-2">
                          <Trash2 className="h-4 w-4" />
                          Delete Profile Picture
                        </EnhancedCardTitle>
                        <button
                          onClick={() => {
                            setShowDeletePfpConfirm(false)
                            setPfpUploadError(null)
                          }}
                          className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
                          disabled={isDeletingPfp}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </EnhancedCardHeader>
                    <EnhancedCardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                      {pfpUploadError && (
                        <div className="bg-red-900/20 border border-red-700/40 rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm text-red-300">
                          {pfpUploadError}
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <p className="text-xs sm:text-sm text-zinc-300">
                          Are you sure you want to delete the profile picture for <span className="font-bold text-white">{community?.name}</span>?
                        </p>
                        <p className="text-xs sm:text-sm text-zinc-400">
                          This action cannot be undone. The community will revert to the default profile picture.
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <EnhancedButton
                          type="button"
                          variant="outline"
                          rounded="full"
                          className="flex-1 bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800 h-9 sm:h-10 text-xs sm:text-sm"
                          onClick={() => {
                            setShowDeletePfpConfirm(false)
                            setPfpUploadError(null)
                          }}
                          disabled={isDeletingPfp}
                        >
                          Cancel
                        </EnhancedButton>
                        <EnhancedButton
                          type="button"
                          variant="outline"
                          rounded="full"
                          className="flex-1 bg-red-900/20 border-red-700/50 text-red-400 hover:bg-red-900/40 hover:border-red-600 h-9 sm:h-10 text-xs sm:text-sm font-bold"
                          onClick={handleDeletePfp}
                          disabled={isDeletingPfp}
                          isLoading={isDeletingPfp}
                        >
                          {isDeletingPfp ? "Deleting..." : "Delete Picture"}
                        </EnhancedButton>
                      </div>
                    </EnhancedCardContent>
                  </EnhancedCard>
                </AnimatedSection>
              )}

              {/* Leave Community Confirmation Dialog */}
              {showLeaveConfirm && (
                <AnimatedSection delay={0.1}>
                  <EnhancedCard variant="default" className="bg-zinc-900 border border-orange-800/50 rounded-xl mb-4 sm:mb-5">
                    <EnhancedCardHeader className="p-3 sm:p-4 border-b border-orange-800/30">
                      <div className="flex items-center justify-between">
                        <EnhancedCardTitle className="text-sm sm:text-base font-bold text-orange-400 flex items-center gap-2">
                          <UserX className="h-4 w-4" />
                          Leave Community
                        </EnhancedCardTitle>
                        <button
                          onClick={() => {
                            setShowLeaveConfirm(false)
                            setLeaveError(null)
                          }}
                          className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
                          disabled={isLeavingCommunity}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </EnhancedCardHeader>
                    <EnhancedCardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                      {leaveError && (
                        <div className="bg-red-900/20 border border-red-700/40 rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm text-red-300">
                          {leaveError}
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <p className="text-xs sm:text-sm text-zinc-300">
                          Are you sure you want to leave <span className="font-bold text-white">{community?.name}</span>?
                        </p>
                        <p className="text-xs sm:text-sm text-zinc-400">
                          You will no longer have access to this community's announcements, members, and other features. You can rejoin later if the community is public.
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <EnhancedButton
                          type="button"
                          variant="outline"
                          rounded="full"
                          className="flex-1 bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800 h-9 sm:h-10 text-xs sm:text-sm"
                          onClick={() => {
                            setShowLeaveConfirm(false)
                            setLeaveError(null)
                          }}
                          disabled={isLeavingCommunity}
                        >
                          Cancel
                        </EnhancedButton>
                        <EnhancedButton
                          type="button"
                          variant="outline"
                          rounded="full"
                          className="flex-1 bg-orange-900/20 border-orange-700/50 text-orange-400 hover:bg-orange-900/40 hover:border-orange-600 h-9 sm:h-10 text-xs sm:text-sm font-bold"
                          onClick={handleLeaveCommunity}
                          disabled={isLeavingCommunity}
                          isLoading={isLeavingCommunity}
                        >
                          {isLeavingCommunity ? "Leaving..." : "Leave Community"}
                        </EnhancedButton>
                      </div>
                    </EnhancedCardContent>
                  </EnhancedCard>
                </AnimatedSection>
              )}

              {/* Delete Community Confirmation Dialog */}
              {showDeleteConfirm && (
                <AnimatedSection delay={0.1}>
                  <EnhancedCard variant="default" className="bg-zinc-900 border border-red-800/50 rounded-xl mb-4 sm:mb-5">
                    <EnhancedCardHeader className="p-3 sm:p-4 border-b border-red-800/30">
                      <div className="flex items-center justify-between">
                        <EnhancedCardTitle className="text-sm sm:text-base font-bold text-red-400 flex items-center gap-2">
                          <Trash2 className="h-4 w-4" />
                          Delete Community
                        </EnhancedCardTitle>
                        <button
                          onClick={() => {
                            setShowDeleteConfirm(false)
                            setDeleteError(null)
                          }}
                          className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
                          disabled={isDeletingCommunity}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </EnhancedCardHeader>
                    <EnhancedCardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                      {deleteError && (
                        <div className="bg-red-900/20 border border-red-700/40 rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm text-red-300">
                          {deleteError}
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <p className="text-xs sm:text-sm text-zinc-300">
                          Are you sure you want to delete <span className="font-bold text-white">{community?.name}</span>?
                        </p>
                        <p className="text-xs sm:text-sm text-zinc-400">
                          This action cannot be undone. All memberships will be automatically removed, and the community will be permanently deleted.
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <EnhancedButton
                          type="button"
                          variant="outline"
                          rounded="full"
                          className="flex-1 bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800 h-9 sm:h-10 text-xs sm:text-sm"
                          onClick={() => {
                            setShowDeleteConfirm(false)
                            setDeleteError(null)
                          }}
                          disabled={isDeletingCommunity}
                        >
                          Cancel
                        </EnhancedButton>
                        <EnhancedButton
                          type="button"
                          variant="outline"
                          rounded="full"
                          className="flex-1 bg-red-900/20 border-red-700/50 text-red-400 hover:bg-red-900/40 hover:border-red-600 h-9 sm:h-10 text-xs sm:text-sm font-bold"
                          onClick={handleDeleteCommunity}
                          disabled={isDeletingCommunity}
                          isLoading={isDeletingCommunity}
                        >
                          {isDeletingCommunity ? "Deleting..." : "Delete Community"}
                        </EnhancedButton>
                      </div>
                    </EnhancedCardContent>
                  </EnhancedCard>
                </AnimatedSection>
              )}

              <Tabs defaultValue={activeTab} className="w-full" onValueChange={setActiveTab}>
                <TabsList className="bg-zinc-900 border border-zinc-800 rounded-lg p-1 mb-4 sm:mb-5">
                  <TabsTrigger value="announcements" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md transition-all text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 flex items-center gap-1.5">
                    <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Announcements</span>
                    <span className="sm:hidden">News</span>
                  </TabsTrigger>
                  <TabsTrigger value="tasks" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md transition-all text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 flex items-center gap-1.5">
                    <CheckSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Tasks</span>
                    <span className="sm:hidden">Tasks</span>
                  </TabsTrigger>
                  <TabsTrigger value="members" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md transition-all text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 flex items-center gap-1.5">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                    Members
                  </TabsTrigger>
                </TabsList>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <TabsContent value="announcements" className="space-y-3">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm sm:text-base font-extrabold bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">
                          Announcements
                        </h3>
                        <div className="flex items-center gap-2">
                          <EnhancedButton 
                            variant="gradient" 
                            size="sm" 
                            rounded="full" 
                            className="bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 h-7 px-3 text-xs"
                            onClick={() => {
                              setEditingAnnouncementId(null)
                              setAnnouncementForm({ title: '', description: '' })
                              setAnnouncementError(null)
                              setShowCreateAnnouncement(true)
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            New
                          </EnhancedButton>
                        <EnhancedButton variant="ghost" size="sm" rounded="full" className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 h-7 w-7 p-0">
                          <Filter className="h-3.5 w-3.5" />
                        </EnhancedButton>
                        </div>
            </div>

                      {isLoadingAnnouncements && (
                        <div className="flex items-center justify-center py-8">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                          <span className="ml-2 text-xs sm:text-sm text-zinc-400">Loading announcements...</span>
                        </div>
                      )}

                       {!isLoadingAnnouncements && communityAnnouncements.length ? communityAnnouncements.map((announcement, index) => (
                        <AnimatedSection key={announcement.id} delay={0.1 + index * 0.1}>
                          <EnhancedCard 
                            variant="default" 
                            hover="lift" 
                            className="bg-zinc-900 border border-zinc-800 rounded-xl"
                          >
                            <EnhancedCardContent className="p-3 sm:p-3.5">
                              <div className="flex items-start gap-3">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-white text-xs sm:text-sm mb-1.5 line-clamp-2">
                                      {announcement.title}
                                    </h4>
                                  <p className="text-zinc-300 text-xs sm:text-sm mb-2 line-clamp-3">{announcement.content}</p>
                                  <div className="flex items-center text-[10px] sm:text-xs text-zinc-500">
                                    <Clock className="h-3 w-3 mr-1" />
                                      {announcement.timestamp}
                                  </div>
                                </div>
                                {isUserStaff && (
                                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                                    <EnhancedButton
                                      variant="ghost"
                                      size="sm"
                                      rounded="full"
                                      className="h-7 w-7 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                                      onClick={() => handleStartEditAnnouncement(announcement)}
                                      title="Edit announcement"
                                      disabled={isDeletingAnnouncement || isUpdatingAnnouncement}
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </EnhancedButton>
                                    <EnhancedButton
                                      variant="ghost"
                                      size="sm"
                                      rounded="full"
                                      className="h-7 w-7 p-0 text-zinc-400 hover:text-red-400 hover:bg-red-950/20"
                                      onClick={() => handleDeleteAnnouncement(announcement.id)}
                                      title="Delete announcement"
                                      disabled={isDeletingAnnouncement || isUpdatingAnnouncement || deletingAnnouncementId === announcement.id}
                                      isLoading={deletingAnnouncementId === announcement.id}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </EnhancedButton>
                                  </div>
                                )}
                              </div>
                            </EnhancedCardContent>
                          </EnhancedCard>
                        </AnimatedSection>
                       )) : !isLoadingAnnouncements ? (
                        <EnhancedCard variant="default" className="bg-zinc-900 border border-zinc-800 rounded-xl">
                          <EnhancedCardContent className="p-4 text-xs sm:text-sm text-zinc-400">
                            No announcements yet.
                          </EnhancedCardContent>
                        </EnhancedCard>
                       ) : null}

                      {/* Create/Edit Announcement Dialog */}
                      {showCreateAnnouncement && (
                        <AnimatedSection delay={0.1}>
                          <EnhancedCard variant="default" className="bg-zinc-900 border border-zinc-800 rounded-xl">
                            <EnhancedCardHeader className="p-3 sm:p-4 border-b border-zinc-800">
                              <div className="flex items-center justify-between">
                                <EnhancedCardTitle className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                                  {editingAnnouncementId ? (
                                    <>
                                      <Edit className="h-4 w-4" />
                                      Edit Announcement
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="h-4 w-4" />
                                      Create Announcement
                                    </>
                                  )}
                                </EnhancedCardTitle>
                                <button
                                  onClick={handleCancelAnnouncementEdit}
                                  className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
                                  disabled={isCreatingAnnouncement || isUpdatingAnnouncement}
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </EnhancedCardHeader>
                            <EnhancedCardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                              {announcementError && (
                                <div className="bg-red-900/20 border border-red-700/40 rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm text-red-300">
                                  {announcementError}
                                </div>
                              )}

                              <div className="space-y-2">
                                <Label htmlFor="announcement-title" className="text-xs sm:text-sm font-medium text-zinc-300 flex items-center gap-2">
                                  <Bell className="h-3.5 w-3.5" />
                                  Title <span className="text-red-400">*</span>
                                </Label>
                                <Input
                                  id="announcement-title"
                                  type="text"
                                  placeholder="e.g., Important Update"
                                  value={announcementForm.title}
                                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                                  className="bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 h-9 sm:h-10 text-xs sm:text-sm"
                                  required
                                  maxLength={200}
                                  disabled={isCreatingAnnouncement || isUpdatingAnnouncement}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="announcement-description" className="text-xs sm:text-sm font-medium text-zinc-300 flex items-center gap-2">
                                  <MessageCircle className="h-3.5 w-3.5" />
                                  Description <span className="text-red-400">*</span>
                                </Label>
                                <textarea
                                  id="announcement-description"
                                  placeholder="Enter announcement details..."
                                  value={announcementForm.description}
                                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, description: e.target.value }))}
                                  className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-md px-3 py-2 text-xs sm:text-sm min-h-[100px] resize-y"
                                  required
                                  maxLength={1000}
                                  disabled={isCreatingAnnouncement || isUpdatingAnnouncement}
                                />
                                <p className="text-[10px] sm:text-xs text-zinc-500">
                                  {announcementForm.description.length}/1000 characters
                                </p>
                              </div>

                              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                                <EnhancedButton
                                  type="button"
                                  variant="outline"
                                  rounded="full"
                                  className="flex-1 bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800 h-9 sm:h-10 text-xs sm:text-sm"
                                  onClick={handleCancelAnnouncementEdit}
                                  disabled={isCreatingAnnouncement || isUpdatingAnnouncement}
                                >
                                  Cancel
                                </EnhancedButton>
                                <EnhancedButton
                                  type="button"
                                  variant="gradient"
                                  rounded="full"
                                  animation="shimmer"
                                  className="flex-1 bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 shadow-[0_0_16px_0_rgba(80,0,255,0.4)] h-9 sm:h-10 text-xs sm:text-sm font-bold"
                                  onClick={editingAnnouncementId ? handleUpdateAnnouncement : handleCreateAnnouncement}
                                  disabled={(isCreatingAnnouncement || isUpdatingAnnouncement) || !announcementForm.title.trim() || !announcementForm.description.trim()}
                                  isLoading={isCreatingAnnouncement || isUpdatingAnnouncement}
                                >
                                  {isUpdatingAnnouncement 
                                    ? "Updating..." 
                                    : isCreatingAnnouncement 
                                    ? "Creating..." 
                                    : editingAnnouncementId 
                                    ? "Update Announcement" 
                                    : "Create Announcement"}
                                </EnhancedButton>
                              </div>
                            </EnhancedCardContent>
                          </EnhancedCard>
                        </AnimatedSection>
                       )}
                    </TabsContent>

                    <TabsContent value="tasks" className="space-y-3">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm sm:text-base font-extrabold bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent flex items-center gap-1.5">
                          <CheckSquare className="h-4 w-4 text-blue-500" />
                          <span>Tasks</span>
                        </h3>
                      </div>

                      <EnhancedCard variant="default" className="bg-zinc-900 border border-zinc-800 rounded-xl">
                        <EnhancedCardContent className="p-8 text-center">
                          <CheckSquare className="h-12 w-12 mx-auto mb-4 text-zinc-600" />
                          <h4 className="text-lg font-bold text-white mb-2">Coming Soon</h4>
                          <p className="text-sm text-zinc-400">
                            Community tasks and assignments will be available here soon.
                          </p>
                        </EnhancedCardContent>
                      </EnhancedCard>
                    </TabsContent>

                    <TabsContent value="members" className="space-y-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
                        <h3 className="text-sm sm:text-base font-extrabold bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">
                          Members
                        </h3>
                        <div className="flex gap-2">
                          <div className="relative flex-1 sm:flex-initial">
                            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                            <Input
                              placeholder="Search..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-8 pr-2 py-1.5 h-8 bg-zinc-800/80 border-blue-700/40 text-white text-xs focus:border-blue-500 w-full sm:w-48"
                            />
                          </div>
                          <EnhancedButton variant="outline" size="sm" rounded="full" className="bg-zinc-800/80 border-blue-700/40 text-white hover:bg-zinc-700 h-8 w-8 p-0">
                            <Filter className="h-3.5 w-3.5" />
                          </EnhancedButton>
                        </div>
                      </div>

                      {isLoadingMembers && (
                        <div className="flex items-center justify-center py-8">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                          <span className="ml-2 text-xs sm:text-sm text-zinc-400">Loading members...</span>
                        </div>
                      )}

                      {membersError && !isLoadingMembers && (
                        <EnhancedCard variant="default" className="bg-zinc-900 border border-red-800/50 rounded-xl">
                          <EnhancedCardContent className="p-4 text-xs sm:text-sm text-red-300">
                            {membersError}
                          </EnhancedCardContent>
                        </EnhancedCard>
                      )}

                      {kickError && (
                        <EnhancedCard variant="default" className="bg-zinc-900 border border-red-800/50 rounded-xl mb-3">
                          <EnhancedCardContent className="p-3 text-xs sm:text-sm text-red-300">
                            {kickError}
                          </EnhancedCardContent>
                        </EnhancedCard>
                      )}

                      {kickError && (
                        <EnhancedCard variant="default" className="bg-zinc-900 border border-red-800/50 rounded-xl mb-3">
                          <EnhancedCardContent className="p-3 text-xs sm:text-sm text-red-300">
                            {kickError}
                          </EnhancedCardContent>
                        </EnhancedCard>
                      )}

                       {!isLoadingMembers && !membersError && communityMembers.length ? communityMembers
                        .filter((member) => {
                          if (!searchQuery.trim()) return true
                          const query = searchQuery.toLowerCase()
                          return (
                            member.name.toLowerCase().includes(query) ||
                            member.title.toLowerCase().includes(query) ||
                            member.company.toLowerCase().includes(query)
                          )
                        })
                        .map((member, index) => (
                        <AnimatedSection key={member.id} delay={0.1 + index * 0.1}>
                          <EnhancedCard variant="default" hover="lift" className="bg-zinc-900 border border-zinc-800 rounded-xl">
                            <EnhancedCardContent className="p-3 sm:p-3.5">
                              <div className="flex items-start gap-2.5">
                                <div className="relative flex-shrink-0">
                                  <Avatar className="h-10 w-10 sm:h-11 sm:w-11 border border-blue-500/30">
                                    <AvatarImage src={member.image} />
                                     <AvatarFallback className="bg-zinc-800 text-xs">{member.name?.charAt(0) ?? 'M'}</AvatarFallback>
                                  </Avatar>
                                  {member.isOnline && (
                                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-black rounded-full" />
                    )}
                  </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-bold text-white text-xs sm:text-sm truncate">{member.name}</h4>
                                      <p className="text-[10px] sm:text-xs text-zinc-400 truncate">
                                        {member.title}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      <div className={cn(
                                        "h-1.5 w-1.5 rounded-full",
                                        member.isOnline ? "bg-green-500" : "bg-zinc-500"
                                      )} />
                                      <span className="text-[9px] sm:text-[10px] text-zinc-400">
                                        {member.isOnline ? "Online" : "Offline"}
                                      </span>
                                    </div>
    </div>
                                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                    {member.achievements.map((achievement, i) => (
                                      <Badge key={i} className="bg-green-900/40 text-green-300 border-green-800 text-[9px] sm:text-[10px] px-1.5 py-0.5">
                                        {achievement}
                </Badge>
                                    ))}
            </div>
                                  <div className="flex gap-1.5 mt-2">
                                    <EnhancedButton 
                                      variant="gradient" 
                                      size="sm"
                                      rounded="full" 
                                      className="bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 text-[10px] sm:text-xs px-2 sm:px-3 py-1 h-auto flex-1"
                                      onClick={() => router.push(`/profile?userId=${member.id}`)}
                                    >
                                      <UserPlus className="h-3 w-3 sm:mr-1" />
                                      <span className="hidden sm:inline">Connect</span>
                                    </EnhancedButton>
                                    {isUserStaff && member.id !== currentUserId && (
                                      <EnhancedButton 
                                        variant="outline" 
                                        size="sm"
                                        rounded="full" 
                                        className="bg-red-900/20 border-red-700/50 text-red-400 hover:bg-red-900/40 hover:border-red-600 text-[10px] sm:text-xs px-2 sm:px-3 py-1 h-auto"
                                        onClick={() => handleKickMember(member.id)}
                                        disabled={isKickingMember && kickingMemberId === member.id}
                                        isLoading={isKickingMember && kickingMemberId === member.id}
                                        title="Kick member"
                                      >
                                        <UserX className="h-3 w-3" />
                                      </EnhancedButton>
                                    )}
                                  </div>
          </div>
            </div>
                            </EnhancedCardContent>
                          </EnhancedCard>
                        </AnimatedSection>
                      )) : !isLoadingMembers && !membersError ? (
                        <EnhancedCard variant="default" className="bg-zinc-900 border border-zinc-800 rounded-xl">
                          <EnhancedCardContent className="p-4 text-xs sm:text-sm text-zinc-400">
                            No members to display yet.
                          </EnhancedCardContent>
                        </EnhancedCard>
                      ) : null}
                    </TabsContent>
                  </motion.div>
                </AnimatePresence>
              </Tabs>
              </>
              )}
            </AnimatedSection>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

