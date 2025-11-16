/**
 * Shared helpers for reading and writing auth-related data in browser storage.
 * Always prefer sessionStorage (current session) before falling back to
 * localStorage (remember me) to avoid stale data.
 */

const getBrowserStorages = (): Storage[] => {
  if (typeof window === "undefined") {
    return []
  }

  const storages: Storage[] = []

  try {
    storages.push(window.sessionStorage)
  } catch (error) {
    console.warn("[AuthStorage] sessionStorage is unavailable:", error)
  }

  try {
    storages.push(window.localStorage)
  } catch (error) {
    console.warn("[AuthStorage] localStorage is unavailable:", error)
  }

  return storages
}

export const getStoredAuthValue = (key: string): string | null => {
  const storages = getBrowserStorages()

  for (const storage of storages) {
    try {
      const value = storage.getItem(key)
      if (value) {
        return value
      }
    } catch (error) {
      console.warn(`[AuthStorage] Failed to read ${key} from storage`, error)
    }
  }

  return null
}

export const getStoredAccessToken = (): string | null => {
  return getStoredAuthValue("auth.accessToken")
}

export const clearAuthKeys = (keys: string[]): void => {
  if (!keys.length) return

  const storages = getBrowserStorages()

  for (const key of keys) {
    for (const storage of storages) {
      try {
        storage.removeItem(key)
      } catch (error) {
        console.warn(`[AuthStorage] Failed to clear ${key} from storage`, error)
      }
    }
  }
}

