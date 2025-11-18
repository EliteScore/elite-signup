/**
 * Shared logout utility function that handles:
 * 1. Calling the logout API endpoint
 * 2. Clearing tokens from storage
 * 3. Clearing profile data
 * 4. Clearing profile pictures
 * 5. Clearing other auth-related data
 */

const API_BASE_URL = "https://elitescore-auth-fafc42d40d58.herokuapp.com/"

interface LogoutOptions {
	onRedirect?: () => void
	userId?: number | null
}

/**
 * Parse API response, handling both JSON and empty responses
 */
async function parseApiResponse(response: Response) {
	if (response.status === 204) {
		return null
	}

	const contentType = response.headers.get("content-type")
	const isJson = contentType?.includes("application/json")

	if (isJson) {
		try {
			return await response.json()
		} catch (error) {
			console.warn("[Logout] Failed to parse JSON response:", error)
			return null
		}
	}

	return null
}

/**
 * Get profile picture key for a user
 */
function getProfilePictureKey(userId?: number | null): string {
	return userId ? `profile.picture.${userId}` : "profile.picture.default"
}

/**
 * Main logout function that handles the complete logout process
 */
export async function handleLogout(options: LogoutOptions = {}): Promise<void> {
	const { onRedirect, userId } = options

	// Use console.group instead of console.groupCollapsed for better visibility
	console.group("🚪 [LOGOUT] Starting logout process")
	console.log("⏰ Timestamp:", new Date().toISOString())
	console.warn("🔍 DEBUG: Logout function called - checking status...")

	if (typeof window === "undefined") {
		console.warn("⚠️ [Logout] Running on server, skipping logout")
		console.groupEnd()
		return
	}

	// Import here to avoid SSR issues
	const { getStoredAccessToken } = await import("@/lib/auth-storage")
	const token = getStoredAccessToken()

	console.log("🔑 [Logout] Token found:", token ? "✅ Yes" : "❌ No")
	console.log("📏 [Logout] Token length:", token?.length || 0)
	
	if (token) {
		console.warn("✅ DEBUG: Token exists - logout API will be called")
	} else {
		console.warn("⚠️ DEBUG: No token found - will skip API call but clear local storage")
	}

	try {
		// Step 1: Call logout API endpoint
		if (token) {
			console.warn("📡 [Logout] Step 1: Calling logout API endpoint")
			console.log("🌐 [Logout] Endpoint:", `${API_BASE_URL}v1/auth/logout`)
			console.warn("🔄 DEBUG: Making API request now...")

			const logoutResponse = await fetch(`${API_BASE_URL}v1/auth/logout`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			})

			console.warn("📥 [Logout] API Response received!")
			console.log("📊 [Logout] API Response Status:", logoutResponse.status)
			console.log("✅ [Logout] API Response OK:", logoutResponse.ok)
			console.log("📝 [Logout] API Response Status Text:", logoutResponse.statusText)

			const logoutResult = await parseApiResponse(logoutResponse)
			console.log("📦 [Logout] API Response Body:", logoutResult)

			if (!logoutResponse.ok) {
				console.error("❌ [Logout] API logout FAILED, but continuing with local cleanup")
				const errorMessage = logoutResult?.message || logoutResult?.error || "Logout API call failed"
				console.error("⚠️ [Logout] Error:", errorMessage)
				console.warn("🔄 DEBUG: Will still clear local storage despite API failure")
			} else {
				console.warn("✅ [Logout] API logout SUCCESSFUL!")
				console.warn("✅ DEBUG: Server confirmed logout")
			}
		} else {
			console.warn("⚠️ [Logout] No token found, skipping API call")
			console.warn("🔄 DEBUG: Proceeding with local storage cleanup only")
		}

		// Step 2: Clear tokens from storage
		console.warn("🗑️ [Logout] Step 2: Clearing tokens from storage")
		const localStorageToken = localStorage.getItem("auth.accessToken")
		const sessionStorageToken = sessionStorage.getItem("auth.accessToken")
		console.log("💾 [Logout] localStorage token exists:", !!localStorageToken ? "✅ Yes" : "❌ No")
		console.log("💾 [Logout] sessionStorage token exists:", !!sessionStorageToken ? "✅ Yes" : "❌ No")

		localStorage.removeItem("auth.accessToken")
		sessionStorage.removeItem("auth.accessToken")
		console.warn("✅ [Logout] Tokens removed from storage")
		console.warn("✅ DEBUG: Access tokens cleared")

		// Step 3: Clear profile data
		console.warn("🗑️ [Logout] Step 3: Clearing profile data")
		const profileExistsBefore = localStorage.getItem("profile.exists")
		console.log("👤 [Logout] profile.exists before:", profileExistsBefore ? "✅ Yes" : "❌ No")

		localStorage.removeItem("profile.exists")
		console.warn("✅ [Logout] profile.exists removed")
		console.warn("✅ DEBUG: Profile data cleared")

		// Step 4: Clear profile picture
		console.warn("🗑️ [Logout] Step 4: Clearing profile picture")
		const pictureKey = getProfilePictureKey(userId)
		console.log("🖼️ [Logout] Profile picture key:", pictureKey)
		const pictureExists = localStorage.getItem(pictureKey)
		console.log("🖼️ [Logout] Profile picture exists:", !!pictureExists ? "✅ Yes" : "❌ No")

		if (pictureExists) {
			localStorage.removeItem(pictureKey)
			console.warn("✅ [Logout] Profile picture removed")
		}

		// Also clear default profile picture if it exists
		const defaultPictureKey = getProfilePictureKey(null)
		if (localStorage.getItem(defaultPictureKey)) {
			localStorage.removeItem(defaultPictureKey)
			console.warn("✅ [Logout] Default profile picture removed")
		}
		console.warn("✅ DEBUG: Profile pictures cleared")

		// Step 5: Clear any other auth-related data
		console.warn("🗑️ [Logout] Step 5: Clearing other auth data")
		const authKeys: string[] = []
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i)
			if (key && key.startsWith("auth.")) {
				authKeys.push(key)
			}
		}
		console.log("🔑 [Logout] Found auth keys:", authKeys.length > 0 ? authKeys : "None")
		authKeys.forEach((key) => {
			localStorage.removeItem(key)
			console.log("🗑️ [Logout] Removed:", key)
		})
		if (authKeys.length > 0) {
			console.warn("✅ DEBUG: Additional auth keys cleared")
		}

		// Step 6: Redirect to login
		console.warn("🔄 [Logout] Step 6: Redirecting to login page")
		console.warn("🚀 DEBUG: About to redirect to /login")
		if (onRedirect) {
			onRedirect()
		} else {
			// Default redirect if no callback provided
			window.location.href = "/login"
		}
		console.warn("✅ [Logout] Redirect initiated")

		console.warn("=".repeat(50))
		console.warn("✅✅✅ LOGOUT COMPLETED SUCCESSFULLY ✅✅✅")
		console.warn("=".repeat(50))
		console.warn("🎉 DEBUG: All logout steps completed!")
		console.warn("📋 Summary:")
		console.warn("   - API called:", token ? "✅ Yes" : "⏭️ Skipped (no token)")
		console.warn("   - Tokens cleared: ✅ Yes")
		console.warn("   - Profile data cleared: ✅ Yes")
		console.warn("   - Profile pictures cleared: ✅ Yes")
		console.warn("   - Redirecting to login: ✅ Yes")
		console.warn("=".repeat(50))
		console.groupEnd()
	} catch (error) {
		console.error("=".repeat(50))
		console.error("❌❌❌ LOGOUT ERROR OCCURRED ❌❌❌")
		console.error("=".repeat(50))
		console.error("🚨 [Logout] Error during logout:", error)
		console.error("📋 [Logout] Error details:", {
			message: error instanceof Error ? error.message : "Unknown error",
			stack: error instanceof Error ? error.stack : undefined,
		})

		// Even if logout API fails, clear local data
		console.warn("🔄 [Logout] Attempting local cleanup despite error")
		console.warn("🔄 DEBUG: Will try to clear storage and redirect anyway")
		try {
			localStorage.removeItem("auth.accessToken")
			sessionStorage.removeItem("auth.accessToken")
			localStorage.removeItem("profile.exists")
			const pictureKey = getProfilePictureKey(userId)
			localStorage.removeItem(pictureKey)
			const defaultPictureKey = getProfilePictureKey(null)
			localStorage.removeItem(defaultPictureKey)
			console.warn("✅ [Logout] Local cleanup completed")

			// Redirect anyway
			if (onRedirect) {
				onRedirect()
			} else {
				window.location.href = "/login"
			}
			console.warn("🔄 [Logout] Redirected to login despite error")
			console.warn("⚠️ DEBUG: Logout completed with errors, but user was redirected")
		} catch (cleanupError) {
			console.error("❌ [Logout] Error during cleanup:", cleanupError)
			console.error("❌ DEBUG: Even cleanup failed!")
		}

		console.error("=".repeat(50))
		console.groupEnd()
	}
}

