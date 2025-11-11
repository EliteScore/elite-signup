import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

const API_BASE_URL = "https://elite-score-a31a0334b58d.herokuapp.com"

/**
 * Hook to check if the authenticated user has completed their profile setup.
 * Redirects to /profile-setup if profile doesn't exist.
 * Returns true when profile check is complete and profile exists.
 */
export function useProfileCheck(): boolean {
  const router = useRouter()
  const [hasProfile, setHasProfile] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)

  useEffect(() => {
    // Prevent running on server
    if (typeof window === "undefined") return

    async function checkProfile() {
      // Check for auth token
      const token = localStorage.getItem("auth.accessToken") || sessionStorage.getItem("auth.accessToken")

      if (!token) {
        // No token - let useRequireAuth handle redirect to login
        setHasChecked(true)
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/v1/users/profile/get_own_profile`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        const result = await response.json().catch(() => null)

        if (!response.ok || !result?.data || result?.success === false) {
          // Profile doesn't exist or error - redirect to setup
          router.replace("/profile-setup")
          setHasProfile(false)
          setHasChecked(true)
          return
        }

        // Profile exists
        setHasProfile(true)
        setHasChecked(true)
      } catch (error) {
        // Network error - assume profile doesn't exist
        console.error("Profile check failed:", error)
        router.replace("/profile-setup")
        setHasProfile(false)
        setHasChecked(true)
      }
    }

    checkProfile()
  }, [router])

  // Return false until we've checked (prevents flash of content)
  return hasChecked && hasProfile
}

