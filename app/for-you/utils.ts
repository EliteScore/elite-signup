import { 
  CommunityType, 
  CommunityAnnouncement, 
  CommunityLeaderboardEntry, 
  CommunityMember, 
  DEFAULT_COMMUNITY_STATS, 
  FALLBACK_COMMUNITY_IMAGE, 
  FALLBACK_MEMBER_IMAGE 
} from "./types"

export const API_BASE_URL = "https://elitescore-social-4046880acb02.herokuapp.com/"
export const AUTH_API_BASE_URL = "https://elitescore-auth-fafc42d40d58.herokuapp.com/"

export function mapCommunityFromApi(rawData: any): CommunityType {
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
    visibility: data?.visibility ?? undefined,
    slug: data?.slug ?? undefined,
  }
}

export function generateSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

