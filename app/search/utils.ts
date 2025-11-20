import { getStoredAccessToken } from "@/lib/auth-storage"
import { API_BASE_URL, RESUME_SCORES_API_BASE_URL, COMMUNITIES_API_BASE_URL, COMMUNITY_SEARCH_DEFAULT_LIMIT, type ProfileInfo, type SearchResult, type CommunitySearchResult } from "./types"

export const pickFirstValidPicture = (...candidates: Array<string | null | undefined>) => {
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate
    }
  }
  return null
}

export const resolvePictureFromApiProfile = (profile: any): string | null => {
  if (!profile || typeof profile !== "object") return null

  // Top-level picture fields (like profile page uses)
  const directPicture = pickFirstValidPicture(
    profile.profilePictureUrl,
    profile.profilePicture,
    profile.avatarUrl,
  )

  if (directPicture) return directPicture

  // Nested resume picture fields
  if (profile.resume) {
    return pickFirstValidPicture(
      profile.resume.profilePictureUrl,
      profile.resume.profilePicture,
      profile.resume.avatarUrl,
    )
  }

  return null
}

export const mapProfileInfoToResult = (profile: ProfileInfo): SearchResult => {
  const firstName = profile.firstName?.trim() ?? ""
  const lastName = profile.lastName?.trim() ?? ""
  const fullName = `${firstName} ${lastName}`.trim() || `User ${profile.userId}`

  // Check if resume contains structured CV data (wrapped in { profile: {...} })
  const resumeFromProfile = profile.resume as any
  const structuredResumeProfile = resumeFromProfile?.profile || resumeFromProfile
  
  // Extract title from structured CV data (LinkedIn-style)
  let title: string | null = null
  
  if (structuredResumeProfile && typeof structuredResumeProfile === 'object' && !Array.isArray(structuredResumeProfile)) {
    // Try to get current/most recent job from structured CV
    const experience = structuredResumeProfile.experience || []
    if (Array.isArray(experience) && experience.length > 0) {
      // Find current job first, then most recent
      const currentJob = experience.find((exp: any) => 
        exp.is_current === true || exp.end_date === null || exp.end_date === undefined
      )
      
      const jobToUse = currentJob || experience.sort((a: any, b: any) => {
        const dateA = a.start_date || ""
        const dateB = b.start_date || ""
        return dateB.localeCompare(dateA)
      })[0]
      
      if (jobToUse) {
        title = jobToUse.title || null
        if (jobToUse.company) {
          title = title ? `${title} at ${jobToUse.company}` : jobToUse.company
        }
      }
    }
    
    // If no job, try headline from basics
    if (!title && structuredResumeProfile.basics?.headline) {
      title = structuredResumeProfile.basics.headline
    }
  }
  
  // Fallback to legacy resume fields
  if (!title && profile.resume?.currentRole) {
    title = `${profile.resume.currentRole}${profile.resume.company ? ` at ${profile.resume.company}` : ""}`
  }

  // Try multiple sources for profile picture
  const image =
    profile.resume?.profilePictureUrl ||
    profile.resume?.profilePicture ||
    profile.resume?.avatarUrl ||
    null

  return {
    userId: profile.userId,
    name: fullName,
    title,
    image,
    bio: profile.bio,
    followersCount: profile.followersCount,
    followingCount: profile.followingCount,
    visibility: profile.visibility,
    resumeScore: null, // Will be enriched later
  }
}

export const getSearchUrl = (input: string) => {
  const trimmed = input.trim()
  const encoded = encodeURIComponent(trimmed)
  const url = `${API_BASE_URL}v1/users/search/${encoded}`
  console.log("[Search Utils] People search URL constructed:")
  console.log("[Search Utils]   Input:", trimmed)
  console.log("[Search Utils]   Encoded:", encoded)
  console.log("[Search Utils]   Full URL:", url)
  console.log("[Search Utils]   API Base:", API_BASE_URL)
  return url
}

export const sanitizeVisibilityFilter = (value?: string): string | undefined => {
  if (!value) return undefined
  const normalized = value.trim().toLowerCase()
  if (normalized === "public" || normalized === "private") {
    return normalized
  }
  return undefined
}

export const clampCommunityLimit = (value?: number) => {
  if (value == null) return COMMUNITY_SEARCH_DEFAULT_LIMIT
  if (Number.isNaN(value)) return COMMUNITY_SEARCH_DEFAULT_LIMIT
  return Math.min(50, Math.max(1, value))
}

export const getCommunitySearchUrl = (
  input: string,
  options?: {
    limit?: number
    name?: string
    slug?: string
    visibility?: string
    is_pro?: boolean
    tags?: string[]
    tagMode?: "any" | "all"
  },
) => {
  const trimmed = input.trim() || "_"
  const encoded = encodeURIComponent(trimmed)
  const searchParams = new URLSearchParams()
  const limit = clampCommunityLimit(options?.limit)
  searchParams.set("limit", limit.toString())

  if (options?.name) {
    searchParams.set("name", options.name.trim())
  }

  if (options?.slug) {
    searchParams.set("slug", options.slug.trim())
  }

  const visibility = sanitizeVisibilityFilter(options?.visibility)
  if (visibility) {
    searchParams.set("visibility", visibility)
  }

  if (options?.is_pro !== undefined) {
    searchParams.set("is_pro", options.is_pro ? "true" : "false")
  }

  // Add tags support (CSV format)
  if (options?.tags && options.tags.length > 0) {
    const tagsCsv = options.tags.map(tag => tag.trim()).filter(tag => tag.length > 0).join(",")
    if (tagsCsv) {
      searchParams.set("tags", tagsCsv)
      // Add mode (any | all), default to "any"
      const mode = options.tagMode === "all" ? "all" : "any"
      searchParams.set("mode", mode)
      console.log("[Search] Adding tags to search:", tagsCsv, "mode:", mode)
    }
  }

  const queryString = searchParams.toString()
  // Use Next.js API route instead of direct backend call
  const url = `/api/communities/search/${encoded}${queryString ? `?${queryString}` : ""}`
  console.log("[Search Utils] Community search URL constructed:")
  console.log("[Search Utils]   Input:", trimmed)
  console.log("[Search Utils]   Encoded:", encoded)
  console.log("[Search Utils]   Query params:", queryString || "none")
  console.log("[Search Utils]   Full URL:", url)
  console.log("[Search Utils]   Note: This proxies to backend:", `${COMMUNITIES_API_BASE_URL}v1/communities/search/${encoded}${queryString ? `?${queryString}` : ""}`)
  return url
}

export const parseBooleanFlag = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") return value
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (normalized === "true" || normalized === "1") return true
    if (normalized === "false" || normalized === "0") return false
  }
  return undefined
}

export const normalizeCommunityResult = (raw: any): CommunitySearchResult | null => {
  if (!raw || typeof raw !== "object") return null
  const rawId = raw.id ?? raw.communityId ?? raw.community_id
  const id = Number(rawId)
  if (!Number.isFinite(id)) return null

  const rawName = typeof raw.name === "string" && raw.name.trim()
    ? raw.name.trim()
    : raw.slug ?? raw.community_slug ?? `Community ${id}`

  const slugCandidate = raw.slug ?? raw.community_slug ?? raw.slugified
  const slug = typeof slugCandidate === "string" ? slugCandidate : undefined
  const visibility = typeof raw.visibility === "string" ? raw.visibility.toUpperCase() : undefined
  const description = typeof raw.description === "string"
    ? raw.description
    : typeof raw.summary === "string"
      ? raw.summary
      : undefined

  const membersValue =
    Number(raw.members ?? raw.members_count ?? raw.member_count ?? raw.membersCount)
  const members = Number.isFinite(membersValue) ? membersValue : undefined

  const isPro = parseBooleanFlag(raw.is_pro ?? raw.isPro ?? raw.pro)

  return {
    id,
    name: rawName,
    slug,
    visibility,
    description,
    members,
    is_pro: isPro,
  }
}

// Fetch profile picture for a user using the new endpoint
export async function fetchUserProfilePicture(userId: number): Promise<string | null> {
  const token = getStoredAccessToken()
  if (!token) {
    return null
  }

  try {
    // Check cache first
    const cacheKey = `profile.picture.${userId}`
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
          const cachedData = JSON.parse(cached)
          const cacheAge = Date.now() - (cachedData.timestamp || 0)
          const oneHour = 60 * 60 * 1000
          
          if (cacheAge < oneHour && cachedData.dataUrl) {
            return cachedData.dataUrl
          } else {
            localStorage.removeItem(cacheKey)
          }
        }
      } catch (e) {
        // Invalid cache, continue to fetch
      }
    }

    // Fetch raw image directly (skip metadata check for speed)
    const imageResponse = await fetch(`/api/user/profile/pfp/${userId}/raw`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (imageResponse.ok) {
      const imageData = await imageResponse.json()
      // Check if response indicates default picture
      if (imageData.default) {
        // Default picture, no custom image
        return null
      } else if (imageData.dataUrl) {
        // Cache the image
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(cacheKey, JSON.stringify({
              dataUrl: imageData.dataUrl,
              timestamp: Date.now(),
            }))
          } catch (e) {
            // Ignore cache write errors
          }
        }
        return imageData.dataUrl
      }
    }
    
    return null
  } catch (error) {
    return null
  }
}

// Fetch profile pictures in parallel for all users (much faster)
export async function fetchAllProfilePictures(userIds: number[]): Promise<Map<number, string | null>> {
  const token = getStoredAccessToken()
  if (!token || userIds.length === 0) {
    return new Map()
  }

  // Check cache for all users first
  const cacheResults = new Map<number, string | null>()
  const usersToFetch: number[] = []

  if (typeof window !== "undefined") {
    userIds.forEach(userId => {
      const cacheKey = `profile.picture.${userId}`
      try {
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
          const cachedData = JSON.parse(cached)
          const cacheAge = Date.now() - (cachedData.timestamp || 0)
          const oneHour = 60 * 60 * 1000
          
          if (cacheAge < oneHour && cachedData.dataUrl) {
            cacheResults.set(userId, cachedData.dataUrl)
            return
          } else {
            localStorage.removeItem(cacheKey)
          }
        }
      } catch (e) {
        // Invalid cache, continue
      }
      usersToFetch.push(userId)
    })
  } else {
    usersToFetch.push(...userIds)
  }

  if (usersToFetch.length === 0) {
    return cacheResults
  }

  // Fetch all missing pictures in parallel
  const fetchPromises = usersToFetch.map(async (userId) => {
    try {
      const imageResponse = await fetch(`/api/user/profile/pfp/${userId}/raw`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (imageResponse.ok) {
        const imageData = await imageResponse.json()
        if (imageData.dataUrl) {
          // Cache the image
          if (typeof window !== "undefined") {
            try {
              const cacheKey = `profile.picture.${userId}`
              localStorage.setItem(cacheKey, JSON.stringify({
                dataUrl: imageData.dataUrl,
                timestamp: Date.now(),
              }))
            } catch (e) {
              // Ignore cache write errors
            }
          }
          return { userId, image: imageData.dataUrl }
        }
      }
      return { userId, image: null }
    } catch (error) {
      return { userId, image: null }
    }
  })

  const fetchedResults = await Promise.all(fetchPromises)
  fetchedResults.forEach(({ userId, image }) => {
    cacheResults.set(userId, image)
  })

  return cacheResults
}

// Enrich base search results with extra profile data (especially pictures) from get_profile
export async function enrichResultsWithProfiles(results: SearchResult[]): Promise<SearchResult[]> {
  const token = getStoredAccessToken()
  if (!token) {
    return results
  }

  if (results.length === 0) {
    return results
  }

  // Fetch all profile pictures in parallel first (fastest approach)
  const userIds = results.map(r => r.userId)
  const pictureMap = await fetchAllProfilePictures(userIds)

  // Now enrich with profile data in parallel (but skip if we already have a picture)
  return Promise.all(
    results.map(async (user) => {
      // If we already have a picture from the parallel fetch, use it
      const cachedPicture = pictureMap.get(user.userId)
      if (cachedPicture) {
        return {
          ...user,
          image: cachedPicture,
        }
      }

      // Otherwise, try to get picture from profile data (but don't wait for it if slow)
      try {
        const url = `${API_BASE_URL}v1/users/profile/get_profile/${user.userId}`

        const resp = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        if (resp.ok) {
          const result = await resp.json()
          const profile = result?.data || result
          if (profile) {
            const picture = resolvePictureFromApiProfile(profile)
            if (picture) {
              return {
                ...user,
                image: picture,
              }
            }
          }
        }
      } catch (error) {
        // Ignore errors, use existing image
      }

      return {
        ...user,
        image: user.image,
      }
    }),
  )
}

// Fetch resume scores for multiple users
export async function enrichResultsWithResumeScores(results: SearchResult[]): Promise<SearchResult[]> {
  const token = getStoredAccessToken()
  if (!token) {
    return results
  }

  if (results.length === 0) {
    return results
  }

  return Promise.all(
    results.map(async (user) => {
      try {
        const url = `${RESUME_SCORES_API_BASE_URL}v1/users/resume-scores/${user.userId}`

        const resp = await fetch(url, {
          method: "GET",
          headers: {
            "Accept": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        if (!resp.ok) {
          // 404 means no resume score, which is fine
          if (resp.status === 404) {
            return { ...user, resumeScore: null }
          }
          return { ...user, resumeScore: null }
        }

        let result
        try {
          result = await resp.json()
        } catch (parseError) {
          return { ...user, resumeScore: null }
        }

        // Handle wrapped response
        const data = result?.data || result
        const score = data?.overall_score || null

        return {
          ...user,
          resumeScore: typeof score === 'number' ? score : null,
        }
      } catch (error) {
        // swallow errors; continue without resume score
        return { ...user, resumeScore: null }
      }
    }),
  )
}

