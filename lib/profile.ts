const API_BASE_URL = "https://elite-score-a31a0334b58d.herokuapp.com"

const PROFILE_NEEDS_SETUP_KEY = "profile.needsSetup"
const PROFILE_DATA_KEY = "profile.data"

export type ProfileInfo = {
  firstName?: string | null
  lastName?: string | null
  phoneNumber?: string | null
  bio?: string | null
  visibility?: string | null
  [key: string]: unknown
}

type ProfileResponse =
  | {
      success: true
      message?: string
      data: ProfileInfo | null
    }
  | {
      success: false
      message?: string
      data?: ProfileInfo | null
    }

type SyncResult = {
  needsSetup: boolean
  profile: ProfileInfo | null
  success: boolean
  message?: string
}

function computeNeedsSetup(profile: ProfileInfo | null | undefined): boolean {
  if (!profile) return true

  const requiredFields: Array<keyof ProfileInfo> = ["firstName", "lastName", "phoneNumber"]

  return requiredFields.some((field) => {
    const value = profile[field]
    if (value == null) return true
    if (typeof value === "string" && value.trim().length === 0) return true
    return false
  })
}

function getAllStorages(preferred?: Storage | null): Storage[] {
  if (typeof window === "undefined") return []
  const storages: Storage[] = []
  if (preferred) {
    storages.push(preferred)
  }
  if (preferred !== window.localStorage) {
    storages.push(window.localStorage)
  }
  if (preferred !== window.sessionStorage) {
    storages.push(window.sessionStorage)
  }
  return storages
}

function writeProfileState(
  storages: Storage[],
  state: { needsSetup: boolean; profile: ProfileInfo | null; timestamp?: string }
) {
  const payload = {
    profile: state.profile,
    timestamp: state.timestamp ?? new Date().toISOString(),
  }

  const needsSetupValue = state.needsSetup ? "true" : "false"
  const profileValue = JSON.stringify(payload)

  storages.forEach((storage) => {
    try {
      storage.setItem(PROFILE_NEEDS_SETUP_KEY, needsSetupValue)
      storage.setItem(PROFILE_DATA_KEY, profileValue)
    } catch (error) {
      // Ignore storage quota errors silently
    }
  })
}

export function clearProfileState(preferred?: Storage | null) {
  const storages = getAllStorages(preferred)
  storages.forEach((storage) => {
    try {
      storage.removeItem(PROFILE_NEEDS_SETUP_KEY)
      storage.removeItem(PROFILE_DATA_KEY)
    } catch (error) {
      // ignore
    }
  })
}

export function readNeedsProfileSetup(): boolean {
  if (typeof window === "undefined") return false
  try {
    const localValue = window.localStorage.getItem(PROFILE_NEEDS_SETUP_KEY)
    if (localValue === "true") return true
    if (localValue === "false") return false
  } catch (error) {
    // ignore
  }

  try {
    const sessionValue = window.sessionStorage.getItem(PROFILE_NEEDS_SETUP_KEY)
    return sessionValue === "true"
  } catch (error) {
    return false
  }
}

export function readStoredProfile(): ProfileInfo | null {
  if (typeof window === "undefined") return null

  const readFromStorage = (storage: Storage) => {
    try {
      const raw = storage.getItem(PROFILE_DATA_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === "object" && "profile" in parsed) {
        return (parsed as { profile: ProfileInfo | null }).profile ?? null
      }
      return null
    } catch (error) {
      return null
    }
  }

  return readFromStorage(window.localStorage) ?? readFromStorage(window.sessionStorage)
}

async function fetchProfile(token: string): Promise<SyncResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/users/profile/get_own_profile`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    const contentType = response.headers.get("content-type")
    const isJson = contentType?.includes("application/json")
    const result: ProfileResponse | null = isJson ? await response.json().catch(() => null) : null

    if (!response.ok || !result) {
      return {
        needsSetup: true,
        profile: null,
        success: false,
        message: result?.message || "Unable to retrieve profile information.",
      }
    }

    const profileData = result.data ?? null
    const needsSetup = !result.success || computeNeedsSetup(profileData)

    return {
      needsSetup,
      profile: profileData,
      success: result.success,
      message: result.message,
    }
  } catch (error) {
    return {
      needsSetup: true,
      profile: null,
      success: false,
      message: "Failed to reach the profile service.",
    }
  }
}

export async function syncProfileStateWithToken(token: string, preferredStorage?: Storage | null) {
  if (!token) return
  const result = await fetchProfile(token)
  const storages = getAllStorages(preferredStorage ?? null)
  writeProfileState(storages, {
    needsSetup: result.needsSetup,
    profile: result.profile,
  })
  return result
}

export function markProfileNeedsSetup(needsSetup: boolean, preferredStorage?: Storage | null) {
  const storages = getAllStorages(preferredStorage ?? null)
  writeProfileState(storages, { needsSetup, profile: null })
}

