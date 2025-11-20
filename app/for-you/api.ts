import { getStoredAccessToken } from "@/lib/auth-storage"
import { AUTH_API_BASE_URL } from "./utils"
import { mapCommunityFromApi, CommunityType } from "./utils"
import { FALLBACK_MEMBER_IMAGE } from "./types"

/**
 * Fetches the current user's ID
 */
export async function fetchOwnUserId(): Promise<number | null> {
  try {
    const token = getStoredAccessToken()
    if (!token) return null

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
        return profile.userId
      }
    }
  } catch (error) {
    console.warn('[ForYou] Failed to fetch own user ID:', error)
  }
  return null
}

/**
 * Fetches community data for editing
 */
export async function fetchCommunityForEdit(communityId: number): Promise<any | null> {
  const token = getStoredAccessToken()
  if (!token) return null

  try {
    const response = await fetch(`/api/communities/${communityId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data?.data || data
  } catch (error) {
    console.error('[ForYou] Error fetching community for edit:', error)
    return null
  }
}

/**
 * Fetches a single announcement by ID
 */
export async function fetchAnnouncement(communityId: number, announcementId: number): Promise<any | null> {
  const token = getStoredAccessToken()
  if (!token) return null

  try {
    const response = await fetch(`/api/communities/${communityId}/announcements/${announcementId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data?.data || data
  } catch (error) {
    console.error('[ForYou] Error fetching announcement:', error)
    return null
  }
}

/**
 * Fetches user profile picture
 */
export async function fetchUserProfilePicture(userId: number): Promise<string | null> {
  const token = getStoredAccessToken()
  if (!token) return null

  try {
    const response = await fetch(`/api/user/profile/pfp/${userId}/raw`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      if (data?.dataUrl && !data?.default) {
        return data.dataUrl
      }
    }
  } catch (error) {
    // Silent fail
  }
  return null
}

/**
 * Fetches user profile data
 */
export async function fetchUserProfile(userId: number): Promise<any | null> {
  const token = getStoredAccessToken()
  if (!token) return null

  try {
    const response = await fetch(`${AUTH_API_BASE_URL}v1/users/profile/get_profile/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      return data?.data || data
    }
  } catch (error) {
    console.warn(`[ForYou] Failed to fetch profile for user ${userId}:`, error)
  }
  return null
}

