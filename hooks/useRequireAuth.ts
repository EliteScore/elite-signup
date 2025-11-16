import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { getStoredAccessToken } from "@/lib/auth-storage"

/**
 * Hook to protect routes that require authentication.
 * Redirects to /login if no valid token is found.
 * Returns true when auth check is complete and user is authorized.
 */
export function useRequireAuth(): boolean {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)

  useEffect(() => {
    // Prevent running on server
    if (typeof window === "undefined") return

    // Check both localStorage and sessionStorage for token
    const token = getStoredAccessToken()

    if (!token) {
      // No token found - redirect to login
      router.replace("/login")
      setIsAuthorized(false)
      setHasChecked(true)
      return
    }

    // Token exists - allow access
    setIsAuthorized(true)
    setHasChecked(true)

    // Optional: Add JWT expiry check here
    // Try to decode token and verify it hasn't expired
    // If expired, try to refresh or redirect to login
  }, [router])

  // Return false until we've checked (prevents flash of content)
  return hasChecked && isAuthorized
}
