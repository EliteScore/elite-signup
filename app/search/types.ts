export const API_BASE_URL = "https://elitescore-auth-fafc42d40d58.herokuapp.com/"
export const RESUME_SCORES_API_BASE_URL = "https://elite-challenges-xp-c57c556a0fd2.herokuapp.com/"
export const COMMUNITIES_API_BASE_URL = "https://elitescore-social-4046880acb02.herokuapp.com/"

export type Resume = {
  currentRole?: string | null
  company?: string | null
  profilePicture?: string | null
  profilePictureUrl?: string | null
  avatarUrl?: string | null
  [key: string]: unknown
}

export type ProfileInfo = {
  userId: number
  phoneNumber: string | null
  firstName: string | null
  lastName: string | null
  bio: string | null
  resume: Resume | null
  followersCount: number | null
  followingCount: number | null
  visibility: "PUBLIC" | "PRIVATE" | null
  createdAt: string | null
  updatedAt: string | null
  profilePictureUrl?: string | null
  profilePicture?: string | null
  avatarUrl?: string | null
}

export type ApiResponse<T> = {
  success: boolean
  message: string | null
  data: T | null
}

export type SearchResult = {
  userId: number
  name: string
  title: string | null
  image: string | null
  bio: string | null
  followersCount: number | null
  followingCount: number | null
  visibility: "PUBLIC" | "PRIVATE" | null
  resumeScore: number | null
}

export type CommunitySearchResult = {
  id: number
  name: string
  slug?: string
  visibility?: string
  description?: string
  is_pro?: boolean
  members?: number
  image?: string | null
}

export const COMMUNITY_SEARCH_DEFAULT_LIMIT = 20

