"use client"

import { Badge } from "@/components/ui/badge"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { useState, useEffect, useCallback, ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import {
  Settings,
  User,
  Bell,
  Lock,
  Globe,
  // Moon, Sun, Smartphone removed as their related sections are no longer rendered
  LogOut,
  ChevronRight,
  Check,
  Save,
} from "lucide-react"
import { motion } from "framer-motion"

import { DashboardLayout } from "@/components/dashboard-layout"
import { EnhancedCard, EnhancedCardContent, EnhancedCardHeader, EnhancedCardTitle } from "@/components/ui/enhanced-card"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { AnimatedSection } from "@/components/ui/animated-section"
import { getStoredAccessToken } from "@/lib/auth-storage"

const API_BASE_URL = "https://elitescore-auth-fafc42d40d58.herokuapp.com/"

type SettingsSection = {
  id: string
  title: string
  icon: React.ReactElement
  description: string
}

type StatusMessage = {
  type: "success" | "error"
  message: string
}

export default function SettingsPage() {
  const router = useRouter()
  const isAuthorized = useRequireAuth() // Protect this route
  const [theme, setTheme] = useState<"light" | "dark" | "system">("dark")
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [weeklyDigest, setWeeklyDigest] = useState(true)
  const [mentionNotifications, setMentionNotifications] = useState(true)
  const [connectionRequests, setConnectionRequests] = useState(true)
  const [twoFactorAuth, setTwoFactorAuth] = useState(false)
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "public",
    activityVisibility: "connections",
    searchVisibility: "everyone",
  })
  const [activeSection, setActiveSection] = useState("account")

  const [personalInfo, setPersonalInfo] = useState({
    phoneNumber: "",
    firstName: "",
    lastName: "",
    bio: "",
    visibility: "PUBLIC" as "PUBLIC" | "PRIVATE",
  })
  const [professionalInfo, setProfessionalInfo] = useState({
    currentRole: "",
    company: "",
    experienceSummary: "",
    topSkills: "",
  })
  const [isEditingPersonal, setIsEditingPersonal] = useState(false)
  const [isEditingProfessional, setIsEditingProfessional] = useState(false)
  const [isSavingPersonal, setIsSavingPersonal] = useState(false)
  const [isSavingProfessional, setIsSavingProfessional] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [profileExists, setProfileExists] = useState(false)
  const [personalStatus, setPersonalStatus] = useState<StatusMessage | null>(null)
  const [professionalStatus, setProfessionalStatus] = useState<StatusMessage | null>(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>("")
  const [userId, setUserId] = useState<number | null>(null)
  const PHONE_REGEX = /^\+?[0-9()\s-]{7,15}$/

  // Helper function to get user-specific profile picture key
  const getProfilePictureKey = useCallback((targetUserId?: number | null): string => {
    const id = targetUserId ?? userId
    return id ? `profile.picture.${id}` : "profile.picture.default"
  }, [userId])

  const getStoredToken = () => getStoredAccessToken()

  const parseApiResponse = async (response: Response) => {
    if (response.status === 204) {
      return null
    }

    const contentType = response.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
      return response.json()
    }

    const text = await response.text()
    if (!text) {
      return null
    }

    try {
      return JSON.parse(text)
    } catch {
      return { message: text }
    }
  }

  const sendProfileRequest = async (
    payload: Record<string, unknown>,
    options: { method?: "PATCH" | "POST"; endpoint?: string } = {},
  ) => {
    if (!payload || Object.keys(payload).length === 0) {
      throw new Error("Please provide at least one field to update.")
    }

    const token = getStoredToken()
    if (!token) {
      throw new Error("Authentication required. Please log in again.")
    }

    const { method = "PATCH", endpoint = `${API_BASE_URL}v1/users/profile/update_profile` } = options

    console.groupCollapsed("[Profile API] Request")
    console.log("Method:", method)
    console.log("Endpoint:", endpoint)
    console.log("Payload:", payload)
    console.groupEnd()

    const response = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    console.groupCollapsed("[Profile API] Response")
    console.log("Status:", response.status)
    console.log("OK:", response.ok)
    console.log("Status Text:", response.statusText)
    console.groupEnd()

    const result = await parseApiResponse(response)

    if (!response.ok) {
      const errorMessage =
        result?.message ||
        result?.error ||
        (typeof result === "string" ? result : `Request failed (${response.status}).`)
      console.error("[Profile API] Error:", errorMessage)
      throw new Error(errorMessage)
    }

    const defaultSuccessMessage =
      method === "POST" ? "Profile created successfully!" : "Profile updated successfully!"

    if (result && typeof result === "object" && "message" in result && typeof result.message === "string") {
      return result.message
    }

    return defaultSuccessMessage
  }

  useEffect(() => {
    if (typeof window === "undefined") return
    const storedFlag = localStorage.getItem("profile.exists")
    if (storedFlag === "true") {
      setProfileExists(true)
    }
  }, [])

  const fetchProfile = useCallback(async () => {
    if (!isAuthorized) return

    console.groupCollapsed("[Profile API] Fetch Profile")
    console.log("Action:", "get_own_profile")
    console.groupEnd()

    if (typeof window === "undefined") {
      setIsLoadingProfile(false)
      return
    }

    const accessToken = getStoredAccessToken()

    if (!accessToken) {
      setIsLoadingProfile(false)
      const pictureKey = getProfilePictureKey()
      const storedPicture = localStorage.getItem(pictureKey)
      if (storedPicture) {
        setProfilePicturePreview(storedPicture)
      }
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}v1/users/profile/get_own_profile`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        console.log("[Profile API] fetchProfile status:", response.status)
        const contentType = response.headers.get("content-type")
        const isJson = contentType?.includes("application/json")

        if (isJson) {
          const result = await response.json()

          if (result.success && result.data) {
            const profileData = result.data

            // Store userId for user-specific profile picture key
            if (profileData.userId) {
              setUserId(profileData.userId)
            }

            setPersonalInfo((prev) => ({
              ...prev,
              phoneNumber: profileData.phoneNumber || "",
              firstName: profileData.firstName || "",
              lastName: profileData.lastName || "",
              bio: profileData.bio || "",
              visibility: profileData.visibility || "PUBLIC",
            }))

            const pictureFromApi =
              profileData.profilePictureUrl ||
              profileData.profilePicture ||
              profileData.avatarUrl ||
              null

            if (typeof pictureFromApi === "string" && pictureFromApi.length > 0) {
              setProfilePicturePreview(pictureFromApi)
            } else {
              // Use userId from profileData if available, otherwise use state
              const pictureKey = getProfilePictureKey(profileData.userId)
              const storedPicture = localStorage.getItem(pictureKey)
              if (storedPicture) {
                setProfilePicturePreview(storedPicture)
              }
            }

            setProfileExists(true)
            localStorage.setItem("profile.exists", "true")
            console.log("Profile loaded successfully:", profileData)
          }
        }
      } else if (response.status === 401) {
        console.log("No profile found or unauthorized")
        setProfileExists(false)
        localStorage.removeItem("profile.exists")
        const pictureKey = getProfilePictureKey()
        const storedPicture = localStorage.getItem(pictureKey)
        if (storedPicture) {
          setProfilePicturePreview(storedPicture)
        }
      } else {
        console.warn("Failed to fetch profile:", response.status)
        setProfileExists(false)
        localStorage.removeItem("profile.exists")
        const pictureKey = getProfilePictureKey()
        const storedPicture = localStorage.getItem(pictureKey)
        if (storedPicture) {
          setProfilePicturePreview(storedPicture)
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      setProfileExists(false)
      localStorage.removeItem("profile.exists")
      const pictureKey = getProfilePictureKey()
      const storedPicture = localStorage.getItem(pictureKey)
      if (storedPicture) {
        setProfilePicturePreview(storedPicture)
      }
    } finally {
      setIsLoadingProfile(false)
    }
  }, [isAuthorized, userId])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  useEffect(() => {
    if (typeof window === "undefined") return
    const pictureKey = getProfilePictureKey()
    const storedPicture = localStorage.getItem(pictureKey)
    if (storedPicture) {
      setProfilePicturePreview((prev) => prev || storedPicture)
    }
  }, [userId])

  const handlePersonalChange = (field: keyof typeof personalInfo) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setPersonalInfo((prev) => ({
      ...prev,
      [field]: event.target.value,
    }))

    if (personalStatus) {
      setPersonalStatus(null)
    }
  }

  const handleProfilePictureUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setPersonalStatus({
        type: "error",
        message: "Please choose a valid image file.",
      })
      return
    }

    const maxSizeBytes = 5 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      setPersonalStatus({
        type: "error",
        message: "Image is too large. Please choose a file smaller than 5MB.",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setProfilePicturePreview(result)
      try {
        const pictureKey = getProfilePictureKey()
        localStorage.setItem(pictureKey, result)
      } catch (error) {
        console.warn("Unable to store picture locally", error)
      }
      setPersonalStatus(null)
    }
    reader.onerror = () => {
      setPersonalStatus({
        type: "error",
        message: "Failed to read the selected image. Please try another file.",
      })
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveProfilePicture = () => {
    setProfilePicturePreview("")
    const pictureKey = getProfilePictureKey()
    localStorage.removeItem(pictureKey)
    if (personalStatus?.type === "error") {
      setPersonalStatus(null)
    }
  }

  const handleProfessionalChange = (field: keyof typeof professionalInfo) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setProfessionalInfo((prev) => ({
      ...prev,
      [field]: event.target.value,
    }))
    if (professionalStatus) {
      setProfessionalStatus(null)
    }
  }

  const handleSavePersonal = async () => {
    if (isSavingPersonal) return

    setPersonalStatus(null)

    const trimmed = {
      phoneNumber: personalInfo.phoneNumber.trim(),
      firstName: personalInfo.firstName.trim(),
      lastName: personalInfo.lastName.trim(),
      bio: personalInfo.bio.trim(),
    }

    // For POST (creating new profile), all fields are required
    if (!profileExists && (!trimmed.phoneNumber || !trimmed.firstName || !trimmed.lastName)) {
      setPersonalStatus({ type: "error", message: "Phone number, first name, and last name are required." })
      return
    }

    if (trimmed.phoneNumber) {
      if (!PHONE_REGEX.test(trimmed.phoneNumber)) {
        setPersonalStatus({
          type: "error",
          message: "Please enter a valid phone number, e.g. +1234567890.",
        })
        return
      }

      const digitsOnly = trimmed.phoneNumber.replace(/\D/g, "")
      if (digitsOnly.length < 10 || digitsOnly.length > 15) {
        setPersonalStatus({
          type: "error",
          message: "Phone number must contain between 10 and 15 digits.",
        })
        return
      }
    }

    setIsSavingPersonal(true)

    try {
      const requestBody: Record<string, unknown> = {}

      if (trimmed.phoneNumber) requestBody.phoneNumber = trimmed.phoneNumber
      if (trimmed.firstName) requestBody.firstName = trimmed.firstName
      if (trimmed.lastName) requestBody.lastName = trimmed.lastName
      if (trimmed.bio) {
        requestBody.bio = trimmed.bio
      }
      if (profileExists && personalInfo.visibility) {
        requestBody.visibility = personalInfo.visibility
      }

      if (!Object.keys(requestBody).length) {
        setPersonalStatus({
          type: "error",
          message: "Please update at least one field before saving.",
        })
        return
      }

      const requestOptions = profileExists
        ? undefined
        : { method: "POST" as const, endpoint: `${API_BASE_URL}v1/users/profile/add_profile` }

      const successMessage = await sendProfileRequest(requestBody, requestOptions)

      setPersonalStatus({
        type: "success",
        message: successMessage,
      })

      setPersonalInfo((prev) => ({
        ...prev,
        phoneNumber: trimmed.phoneNumber,
        firstName: trimmed.firstName,
        lastName: trimmed.lastName,
        bio: trimmed.bio,
      }))
      
      // Mark profile as existing after successful creation
      if (!profileExists) {
        setProfileExists(true)
        if (typeof window !== "undefined") {
          localStorage.setItem("profile.exists", "true")
        }
      }

      await fetchProfile()
      
      setIsEditingPersonal(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to reach the server. Please check your connection and try again."
      setPersonalStatus({ type: "error", message: errorMessage })
    } finally {
      setIsSavingPersonal(false)
    }
  }

  const handleSaveProfessional = async () => {
    if (isSavingProfessional) return

    setProfessionalStatus(null)

    const trimmedRole = professionalInfo.currentRole.trim()
    const trimmedCompany = professionalInfo.company.trim()
    const trimmedSummary = professionalInfo.experienceSummary.trim()
    const normalizedSkills = professionalInfo.topSkills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean)

    const resumePayload: Record<string, unknown> = {
      ...(trimmedRole ? { currentRole: trimmedRole } : {}),
      ...(trimmedCompany ? { company: trimmedCompany } : {}),
      ...(trimmedSummary ? { summary: trimmedSummary } : {}),
      ...(normalizedSkills.length ? { skills: normalizedSkills } : {}),
    }

    if (!Object.keys(resumePayload).length) {
      setProfessionalStatus({
        type: "error",
        message: "Please update at least one professional field before saving.",
      })
      return
    }

    resumePayload.updatedAt = new Date().toISOString()
    resumePayload.source = "settings-page"

    setIsSavingProfessional(true)

    try {
      const successMessage = await sendProfileRequest({ resume: resumePayload })

      setProfessionalStatus({
        type: "success",
        message: successMessage,
      })

      setProfessionalInfo((prev) => ({
        ...prev,
        currentRole: trimmedRole,
        company: trimmedCompany,
        experienceSummary: trimmedSummary,
        topSkills: normalizedSkills.join(", "),
      }))

      await fetchProfile()

      setIsEditingProfessional(false)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to reach the server. Please check your connection and try again."
      setProfessionalStatus({ type: "error", message: errorMessage })
    } finally {
      setIsSavingProfessional(false)
    }
  }

  const handleLogout = async () => {
    console.groupCollapsed("[Logout] Starting logout process")
    console.log("Timestamp:", new Date().toISOString())
    
    if (typeof window === "undefined") {
      console.warn("[Logout] Running on server, skipping logout")
      console.groupEnd()
      return
    }

    const token = getStoredToken()
    console.log("[Logout] Token found:", token ? "Yes" : "No")
    console.log("[Logout] Token length:", token?.length || 0)

    try {
      // Step 1: Call logout API endpoint
      if (token) {
        console.log("[Logout] Step 1: Calling logout API endpoint")
        console.log("[Logout] Endpoint:", `${API_BASE_URL}v1/auth/logout`)
        
        const logoutResponse = await fetch(`${API_BASE_URL}v1/auth/logout`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        console.log("[Logout] API Response Status:", logoutResponse.status)
        console.log("[Logout] API Response OK:", logoutResponse.ok)
        console.log("[Logout] API Response Status Text:", logoutResponse.statusText)

        const logoutResult = await parseApiResponse(logoutResponse)
        console.log("[Logout] API Response Body:", logoutResult)

        if (!logoutResponse.ok) {
          console.warn("[Logout] API logout failed, but continuing with local cleanup")
          const errorMessage = logoutResult?.message || logoutResult?.error || "Logout API call failed"
          console.warn("[Logout] Error:", errorMessage)
        } else {
          console.log("[Logout] API logout successful")
        }
      } else {
        console.log("[Logout] No token found, skipping API call")
      }

      // Step 2: Clear tokens from storage
      console.log("[Logout] Step 2: Clearing tokens from storage")
      const localStorageToken = localStorage.getItem("auth.accessToken")
      const sessionStorageToken = sessionStorage.getItem("auth.accessToken")
      console.log("[Logout] localStorage token exists:", !!localStorageToken)
      console.log("[Logout] sessionStorage token exists:", !!sessionStorageToken)

      localStorage.removeItem("auth.accessToken")
      sessionStorage.removeItem("auth.accessToken")
      console.log("[Logout] Tokens removed from storage")

      // Step 3: Clear profile data
      console.log("[Logout] Step 3: Clearing profile data")
      const profileExistsBefore = localStorage.getItem("profile.exists")
      console.log("[Logout] profile.exists before:", profileExistsBefore)
      
      localStorage.removeItem("profile.exists")
      console.log("[Logout] profile.exists removed")

      // Step 4: Clear profile picture
      console.log("[Logout] Step 4: Clearing profile picture")
      const pictureKey = getProfilePictureKey()
      console.log("[Logout] Profile picture key:", pictureKey)
      const pictureExists = localStorage.getItem(pictureKey)
      console.log("[Logout] Profile picture exists:", !!pictureExists)
      
      if (pictureExists) {
        localStorage.removeItem(pictureKey)
        console.log("[Logout] Profile picture removed")
      }

      // Step 5: Clear any other auth-related data
      console.log("[Logout] Step 5: Clearing other auth data")
      const authKeys = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith("auth.")) {
          authKeys.push(key)
        }
      }
      console.log("[Logout] Found auth keys:", authKeys)
      authKeys.forEach((key) => {
        localStorage.removeItem(key)
        console.log("[Logout] Removed:", key)
      })

      // Step 6: Reset state
      console.log("[Logout] Step 6: Resetting component state")
      setProfileExists(false)
      setProfilePicturePreview("")
      setPersonalInfo({
        phoneNumber: "",
        firstName: "",
        lastName: "",
        bio: "",
        visibility: "PUBLIC",
      })
      setProfessionalInfo({
        currentRole: "",
        company: "",
        experienceSummary: "",
        topSkills: "",
      })
      console.log("[Logout] State reset complete")

      // Step 7: Redirect to login
      console.log("[Logout] Step 7: Redirecting to login page")
      router.push("/login")
      console.log("[Logout] Redirect initiated")

      console.log("[Logout] Logout process completed successfully")
      console.groupEnd()
    } catch (error) {
      console.error("[Logout] Error during logout:", error)
      console.error("[Logout] Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      })
      
      // Even if logout API fails, clear local data
      console.log("[Logout] Attempting local cleanup despite error")
      try {
        localStorage.removeItem("auth.accessToken")
        sessionStorage.removeItem("auth.accessToken")
        localStorage.removeItem("profile.exists")
        const pictureKey = getProfilePictureKey()
        localStorage.removeItem(pictureKey)
        console.log("[Logout] Local cleanup completed")
        
        // Redirect anyway
        router.push("/login")
        console.log("[Logout] Redirected to login despite error")
      } catch (cleanupError) {
        console.error("[Logout] Error during cleanup:", cleanupError)
      }
      
      console.groupEnd()
    }
  }
  
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2bbcff] border-t-transparent" />
      </div>
    )
  }

  // Settings sections
  const settingsSections = [
    {
      id: "account",
      title: "Account Settings",
      icon: <User className="h-5 w-5" />,
      description: "Manage your account information and preferences",
    },
    {
      id: "notifications",
      title: "Notifications",
      icon: <Bell className="h-5 w-5" />,
      description: "Control how you receive notifications",
    },
    {
      id: "security",
      title: "Security & Privacy",
      icon: <Lock className="h-5 w-5" />,
      description: "Manage your security settings and privacy preferences",
    },
    // Appearance and Devices sections removed per requirement
  ]

  return (
    <DashboardLayout>
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-radial from-blue-500/20 via-purple-700/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-24 w-72 h-72 bg-gradient-radial from-purple-700/20 via-pink-600/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-gradient-radial from-fuchsia-500/15 via-blue-600/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-6 relative z-10">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Settings Navigation */}
          <div className="md:w-1/4">
            <AnimatedSection delay={0.1}>
              <EnhancedCard variant="default" className="bg-zinc-900/80 border border-blue-700/40 shadow-[0_0_24px_0_rgba(80,0,255,0.3)] sticky top-20">
                <EnhancedCardHeader className="pb-2">
                  <EnhancedCardTitle className="text-lg flex items-center">
                    <Settings className="h-5 w-5 mr-2 text-blue-400" />
                    <span className="bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent font-extrabold">Settings</span>
                  </EnhancedCardTitle>
                </EnhancedCardHeader>
                <EnhancedCardContent className="p-0">
                  <nav className="space-y-1">
                    {settingsSections.map((section) => (
                      <button
                        key={section.id}
                        className={cn(
                          "w-full flex items-center p-3 text-left transition-colors",
                          activeSection === section.id
                            ? "bg-blue-900/30 text-blue-400 border-r-2 border-blue-500 shadow-[0_0_8px_0_rgba(59,130,246,0.3)]"
                            : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white hover:border-r-2 hover:border-blue-700/40",
                        )}
                        onClick={() => setActiveSection(section.id)}
                      >
                        <div className="mr-3">{section.icon}</div>
                        <div className="flex-1">
                          <div className="font-bold text-sm text-white">{section.title}</div>
                          <div className="text-xs text-zinc-500 hidden md:block">{section.description}</div>
                        </div>
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 transition-transform",
                            activeSection === section.id && "transform rotate-90",
                          )}
                        />
                      </button>
                    ))}

                    <div className="my-2 h-px bg-gradient-to-r from-transparent via-blue-700/50 to-transparent" />

                    <button
                      className="w-full flex items-center p-3 text-left text-red-400 hover:bg-red-900/20 hover:border-r-2 hover:border-red-500/40 transition-colors"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      <div className="font-bold text-sm">Log Out</div>
                    </button>
                  </nav>
                </EnhancedCardContent>
              </EnhancedCard>
            </AnimatedSection>
          </div>

          {/* Settings Content */}
          <div className="md:w-3/4 space-y-6">
            {/* Account Settings */}
            {activeSection === "account" && (
              <AnimatedSection delay={0.2}>
                <EnhancedCard variant="default" className="bg-zinc-900/80 border border-blue-700/40 shadow-[0_0_24px_0_rgba(80,0,255,0.3)]">
                  <EnhancedCardHeader className="pb-2">
                    <EnhancedCardTitle className="text-lg flex items-center">
                      <User className="h-5 w-5 mr-2 text-blue-400" />
                      <span className="bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent font-extrabold">Account Settings</span>
                    </EnhancedCardTitle>
                  </EnhancedCardHeader>
                  <EnhancedCardContent className="p-4">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-sm font-bold text-white">Profile Information</h3>
                        <p className="text-xs text-zinc-400">
                          Manage your personal information and how it appears on your profile
                        </p>
                        <div className="bg-zinc-800/60 border border-blue-700/30 rounded-lg p-4 mt-2 shadow-[0_0_8px_0_rgba(80,0,255,0.2)] space-y-4">
                          {isLoadingProfile ? (
                            <div className="flex items-center justify-center py-8">
                              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                              <span className="ml-2 text-sm text-zinc-400">Loading profile...</span>
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="text-sm font-bold text-white">Personal Information</div>
                                  <div className="text-xs text-zinc-500">Name, email, bio, and profile picture</div>
                                </div>
                                <EnhancedButton
                                  variant="outline"
                                  size="sm"
                                  rounded="full"
                                  className="bg-zinc-800/80 border-blue-700/40 text-white hover:bg-zinc-700 hover:shadow-[0_0_8px_0_rgba(80,0,255,0.3)]"
                                  onClick={() => {
                                    setIsEditingPersonal((prev) => !prev)
                                    // Clear status message when starting to edit
                                    if (!isEditingPersonal) {
                                      setPersonalStatus(null)
                                    }
                                  }}
                                >
                                  {isEditingPersonal ? "Cancel" : personalInfo.firstName || personalInfo.phoneNumber ? "Edit" : "Add"}
                                </EnhancedButton>
                              </div>

                              {isEditingPersonal ? (
                            <div className="grid gap-3">
                              <div>
                                <Label htmlFor="phoneNumber" className="text-xs text-zinc-400">Phone Number</Label>
                                <Input
                                  id="phoneNumber"
                                  type="tel"
                                  inputMode="tel"
                                  pattern="^\\+?[0-9()\\s\\-]{7,15}$"
                                  value={personalInfo.phoneNumber}
                                  onChange={handlePersonalChange("phoneNumber")}
                                  placeholder="+1234567890"
                                  className="bg-black/40 border-zinc-700 text-white"
                                />
                                <p className="text-[10px] text-zinc-500 mt-1">Include country code, e.g. +1 234 567 8901.</p>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <Label htmlFor="firstName" className="text-xs text-zinc-400">First Name</Label>
                                  <Input
                                    id="firstName"
                                    value={personalInfo.firstName}
                                    onChange={handlePersonalChange("firstName")}
                                    placeholder="Ada"
                                    className="bg-black/40 border-zinc-700 text-white"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="lastName" className="text-xs text-zinc-400">Last Name</Label>
                                  <Input
                                    id="lastName"
                                    value={personalInfo.lastName}
                                    onChange={handlePersonalChange("lastName")}
                                    placeholder="Lovelace"
                                    className="bg-black/40 border-zinc-700 text-white"
                                  />
                                </div>
                              </div>
                              <div>
                                <Label htmlFor="profilePictureUpload" className="text-xs text-zinc-400">
                                  Profile Photo
                                </Label>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 mt-2">
                                  <div className="relative h-20 w-20 rounded-full overflow-hidden border border-zinc-700 bg-zinc-900 flex items-center justify-center">
                                    {profilePicturePreview ? (
                                      <img
                                        src={profilePicturePreview}
                                        alt="Profile preview"
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-[10px] text-zinc-500 text-center px-2">
                                        No photo
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <Input
                                      id="profilePictureUpload"
                                      type="file"
                                      accept="image/*"
                                      capture="environment"
                                      onChange={handleProfilePictureUpload}
                                      className="bg-black/40 border-zinc-700 text-white file:bg-transparent file:border-0 file:text-zinc-400 file:text-xs"
                                    />
                                    <p className="text-[10px] text-zinc-500 mt-1">
                                      Choose an image from your gallery or take a new photo (max 5MB).
                                    </p>
                                    {profilePicturePreview && (
                                      <button
                                        type="button"
                                        onClick={handleRemoveProfilePicture}
                                        className="mt-2 text-[10px] text-red-400 hover:text-red-300 underline-offset-2 hover:underline"
                                      >
                                        Remove photo
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div>
                                <Label htmlFor="bio" className="text-xs text-zinc-400">Bio</Label>
                                <Textarea
                                  id="bio"
                                  value={personalInfo.bio}
                                  onChange={handlePersonalChange("bio")}
                                  placeholder="Share a quick summary about yourself (e.g., “iOS engineer building accessible fintech apps.”)"
                                  className="min-h-[100px] bg-black/40 border-zinc-700 text-white"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-zinc-400">Profile Visibility</Label>
                                <div className="flex gap-3 mt-2">
                                  <label htmlFor="visibility-public" className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="radio"
                                      id="visibility-public"
                                      name="visibility"
                                      value="PUBLIC"
                                      checked={personalInfo.visibility === "PUBLIC"}
                                      onChange={(e) =>
                                        setPersonalInfo((prev) => ({
                                          ...prev,
                                          visibility: e.target.value as "PUBLIC" | "PRIVATE",
                                        }))
                                      }
                                      className="w-4 h-4 text-blue-600 bg-zinc-800 border-zinc-700 focus:ring-blue-500"
                                    />
                                    <span className="text-xs text-white">Public</span>
                                  </label>
                                  <label htmlFor="visibility-private" className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="radio"
                                      id="visibility-private"
                                      name="visibility"
                                      value="PRIVATE"
                                      checked={personalInfo.visibility === "PRIVATE"}
                                      onChange={(e) =>
                                        setPersonalInfo((prev) => ({
                                          ...prev,
                                          visibility: e.target.value as "PUBLIC" | "PRIVATE",
                                        }))
                                      }
                                      className="w-4 h-4 text-blue-600 bg-zinc-800 border-zinc-700 focus:ring-blue-500"
                                    />
                                    <span className="text-xs text-white">Private</span>
                                  </label>
                                </div>
                              </div>
                              {personalStatus && (
                                <div
                                  className={cn(
                                    "rounded-lg border px-3 py-2 text-xs",
                                    personalStatus.type === "success"
                                      ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-200"
                                      : "border-red-500/40 bg-red-950/40 text-red-200",
                                  )}
                                >
                                  {personalStatus.message}
                                </div>
                              )}
                              <div className="flex items-center justify-end gap-2">
                                <EnhancedButton
                                  variant="ghost"
                                  rounded="full"
                                  className="text-zinc-400 hover:text-white"
                                  onClick={() => setIsEditingPersonal(false)}
                                  disabled={isSavingPersonal}
                                >
                                  Cancel
                                </EnhancedButton>
                                <EnhancedButton
                                  variant="gradient"
                                  rounded="full"
                                  animation="shimmer"
                                  className="bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500"
                                  onClick={handleSavePersonal}
                                  disabled={isSavingPersonal}
                                  leftIcon={isSavingPersonal ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : undefined}
                                >
                                  {isSavingPersonal ? "Saving" : "Save Changes"}
                                </EnhancedButton>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2 text-xs text-zinc-400">
                              {personalInfo.phoneNumber && (
                                <div>
                                  <span className="text-zinc-500">Phone:</span> {personalInfo.phoneNumber}
                                </div>
                              )}
                              {personalInfo.firstName || personalInfo.lastName ? (
                                <div>
                                  <span className="text-zinc-500">Name:</span> {personalInfo.firstName} {personalInfo.lastName}
                                </div>
                              ) : (
                                <p>No personal information added yet.</p>
                              )}
                              <div>
                                <span className="text-zinc-500">Profile Photo:</span>
                                {profilePicturePreview ? (
                                  <div className="mt-2 h-16 w-16 rounded-full overflow-hidden border border-zinc-700">
                                    <img
                                      src={profilePicturePreview}
                                      alt="Profile photo"
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <p className="mt-1 text-[10px] text-zinc-500">No profile photo added yet.</p>
                                )}
                              </div>
                              {personalInfo.bio && (
                                <div>
                                  <span className="text-zinc-500">Bio:</span> {personalInfo.bio}
                                </div>
                              )}
                              {personalInfo.visibility && (
                                <div>
                                  <span className="text-zinc-500">Visibility:</span>{" "}
                                  <span className={personalInfo.visibility === "PUBLIC" ? "text-emerald-400" : "text-orange-400"}>
                                    {personalInfo.visibility}
                                  </span>
                                </div>
                              )}
                              {personalStatus && personalStatus.type === "success" && (
                                <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-200">
                                  {personalStatus.message}
                                </div>
                              )}
                            </div>
                          )}
                            </>
                          )}
                        </div>

                        <div className="bg-zinc-800/60 border border-purple-700/30 rounded-lg p-4 shadow-[0_0_8px_0_rgba(147,51,234,0.2)] space-y-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-sm font-bold text-white">Professional Information</div>
                              <div className="text-xs text-zinc-500">Work experience, education, and skills</div>
                            </div>
                            <EnhancedButton
                              variant="outline"
                              size="sm"
                              rounded="full"
                              className="bg-zinc-800/80 border-purple-700/40 text-white hover:bg-zinc-700 hover:shadow-[0_0_8px_0_rgba(147,51,234,0.3)]"
                              onClick={() => setIsEditingProfessional((prev) => !prev)}
                            >
                              {isEditingProfessional ? "Cancel" : professionalInfo.currentRole || professionalInfo.topSkills ? "Edit" : "Add"}
                            </EnhancedButton>
                          </div>

                          {isEditingProfessional ? (
                            <div className="grid gap-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <Label htmlFor="currentRole" className="text-xs text-zinc-400">Current Role</Label>
                                  <Input
                                    id="currentRole"
                                    value={professionalInfo.currentRole}
                                    onChange={handleProfessionalChange("currentRole")}
                                    placeholder="Senior Developer"
                                    className="bg-black/40 border-zinc-700 text-white"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="company" className="text-xs text-zinc-400">Company/Organization</Label>
                                  <Input
                                    id="company"
                                    value={professionalInfo.company}
                                    onChange={handleProfessionalChange("company")}
                                    placeholder="EliteScore"
                                    className="bg-black/40 border-zinc-700 text-white"
                                  />
                                </div>
                              </div>
                              <div>
                                <Label htmlFor="experienceSummary" className="text-xs text-zinc-400">Experience Summary</Label>
                                <Textarea
                                  id="experienceSummary"
                                  value={professionalInfo.experienceSummary}
                                  onChange={handleProfessionalChange("experienceSummary")}
                                  placeholder="Highlight your experience, responsibilities, and wins"
                                  className="min-h-[100px] bg-black/40 border-zinc-700 text-white"
                                />
                              </div>
                              <div>
                                <Label htmlFor="topSkills" className="text-xs text-zinc-400">Top Skills</Label>
                                <Textarea
                                  id="topSkills"
                                  value={professionalInfo.topSkills}
                                  onChange={handleProfessionalChange("topSkills")}
                                  placeholder="Separate skills with commas (e.g. React, TypeScript, UX Research)"
                                  className="min-h-[80px] bg-black/40 border-zinc-700 text-white"
                                />
                              </div>
                              {professionalStatus && (
                                <div
                                  className={cn(
                                    "rounded-lg border px-3 py-2 text-xs",
                                    professionalStatus.type === "success"
                                      ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-200"
                                      : "border-red-500/40 bg-red-950/40 text-red-200",
                                  )}
                                >
                                  {professionalStatus.message}
                                </div>
                              )}
                              <div className="flex items-center justify-end gap-2">
                                <EnhancedButton
                                  variant="ghost"
                                  rounded="full"
                                  className="text-zinc-400 hover:text-white"
                                  onClick={() => setIsEditingProfessional(false)}
                                  disabled={isSavingProfessional}
                                >
                                  Cancel
                                </EnhancedButton>
                                <EnhancedButton
                                  variant="gradient"
                                  rounded="full"
                                  animation="shimmer"
                                  className="bg-gradient-to-r from-purple-500 via-blue-500 to-fuchsia-500"
                                  onClick={handleSaveProfessional}
                                  disabled={isSavingProfessional}
                                  leftIcon={isSavingProfessional ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : undefined}
                                >
                                  {isSavingProfessional ? "Saving" : "Save Changes"}
                                </EnhancedButton>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2 text-xs text-zinc-400">
                              {professionalInfo.currentRole || professionalInfo.company ? (
                                <div>
                                  <span className="text-zinc-500">Role:</span> {professionalInfo.currentRole}
                                  {professionalInfo.company && (
                                    <span className="text-zinc-500"> @ {professionalInfo.company}</span>
                                  )}
                                </div>
                              ) : (
                                <p>No professional information added yet.</p>
                              )}
                              {professionalInfo.experienceSummary && (
                                <div>
                                  <span className="text-zinc-500">Summary:</span> {professionalInfo.experienceSummary}
                                </div>
                              )}
                              {professionalInfo.topSkills && (
                                <div>
                                  <span className="text-zinc-500">Skills:</span> {professionalInfo.topSkills}
                                </div>
                              )}
                              {professionalStatus && professionalStatus.type === "success" && (
                                <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-200">
                                  {professionalStatus.message}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Divider before Danger Zone */}
                      <div className="h-px bg-gradient-to-r from-transparent via-red-700/50 to-transparent" />

                      <div className="space-y-2">
                        <h3 className="text-sm font-bold text-red-400">Danger Zone</h3>
                        <p className="text-xs text-zinc-400">Permanent actions that affect your account</p>
                        <div className="bg-red-900/20 border border-red-800/40 rounded-lg p-4 mt-2 shadow-[0_0_8px_0_rgba(239,68,68,0.3)]">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-sm font-medium text-red-400">Delete Account</div>
                              <div className="text-xs text-zinc-500">Permanently delete your account and all data</div>
                            </div>
                            <EnhancedButton
                              variant="outline"
                              size="sm"
                              rounded="full"
                              className="bg-red-900/30 border-red-800/40 text-red-400 hover:bg-red-900/40 hover:shadow-[0_0_8px_0_rgba(239,68,68,0.4)]"
                            >
                              Delete
                            </EnhancedButton>
                          </div>
                        </div>
                      </div>
                    </div>
                  </EnhancedCardContent>
                </EnhancedCard>
              </AnimatedSection>
            )}

            {/* Notifications Settings */}
            {activeSection === "notifications" && (
              <AnimatedSection delay={0.2}>
                <EnhancedCard variant="default" className="bg-zinc-900/80 border border-blue-700/40 shadow-[0_0_24px_0_rgba(80,0,255,0.3)]">
                  <EnhancedCardHeader className="pb-2">
                    <EnhancedCardTitle className="text-lg flex items-center">
                      <Bell className="h-5 w-5 mr-2 text-blue-400" />
                      <span className="bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent font-extrabold">Notification Settings</span>
                    </EnhancedCardTitle>
                  </EnhancedCardHeader>
                  <EnhancedCardContent className="p-4">
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-white">Email Notifications</h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="email-notifications" className="flex items-center gap-2">
                              <span className="text-white font-medium">Email Notifications</span>
                              <Badge className="bg-blue-900/50 text-blue-300 border-blue-800 text-[10px]">
                                All
                              </Badge>
                            </Label>
                            <Switch
                              id="email-notifications"
                              checked={emailNotifications}
                              onCheckedChange={setEmailNotifications}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="weekly-digest" className="flex items-center gap-2">
                              <span className="text-white font-medium">Weekly Digest</span>
                              <Badge className="bg-zinc-800 text-zinc-300 border-zinc-700 text-[10px]">Summary</Badge>
                            </Label>
                            <Switch id="weekly-digest" checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-gradient-to-r from-transparent via-blue-700/50 to-transparent" />

                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-white">Push Notifications</h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="push-notifications" className="flex items-center gap-2">
                              <span className="text-white font-medium">Push Notifications</span>
                              <Badge className="bg-blue-900/50 text-blue-300 border-blue-800 text-[10px]">
                                All
                              </Badge>
                            </Label>
                            <Switch
                              id="push-notifications"
                              checked={pushNotifications}
                              onCheckedChange={setPushNotifications}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="mention-notifications" className="text-white font-medium">Mentions & Comments</Label>
                            <Switch
                              id="mention-notifications"
                              checked={mentionNotifications}
                              onCheckedChange={setMentionNotifications}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="connection-requests" className="text-white font-medium">Connection Requests</Label>
                            <Switch
                              id="connection-requests"
                              checked={connectionRequests}
                              onCheckedChange={setConnectionRequests}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <EnhancedButton
                          variant="gradient"
                          rounded="full"
                          animation="shimmer"
                          className="bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 shadow-[0_0_16px_0_rgba(80,0,255,0.4)]"
                          leftIcon={<Save className="h-4 w-4" />}
                        >
                          Save Changes
                        </EnhancedButton>
                      </div>
                    </div>
                  </EnhancedCardContent>
                </EnhancedCard>
              </AnimatedSection>
            )}

            {/* Security & Privacy Settings */}
            {activeSection === "security" && (
              <AnimatedSection delay={0.2}>
                <EnhancedCard variant="default" className="bg-zinc-900/80 border border-blue-700/40 shadow-[0_0_24px_0_rgba(80,0,255,0.3)]">
                  <EnhancedCardHeader className="pb-2">
                    <EnhancedCardTitle className="text-lg flex items-center">
                      <Lock className="h-5 w-5 mr-2 text-blue-400" />
                      <span className="bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent font-extrabold">Security & Privacy</span>
                    </EnhancedCardTitle>
                  </EnhancedCardHeader>
                  <EnhancedCardContent className="p-4">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-sm font-bold text-white">Security Settings</h3>
                        <div className="bg-zinc-800/60 border border-blue-700/30 rounded-lg p-4 mt-2 shadow-[0_0_8px_0_rgba(80,0,255,0.2)]">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-sm font-bold text-white">Password</div>
                              <div className="text-xs text-zinc-500">Last changed 3 months ago</div>
                            </div>
                            <EnhancedButton
                              variant="outline"
                              size="sm"
                              rounded="full"
                              className="bg-zinc-800/80 border-blue-700/40 text-white hover:bg-zinc-700 hover:shadow-[0_0_8px_0_rgba(80,0,255,0.3)]"
                            >
                              Change
                            </EnhancedButton>
                          </div>
                        </div>
                        <div className="bg-zinc-800/60 border border-purple-700/30 rounded-lg p-4 shadow-[0_0_8px_0_rgba(147,51,234,0.2)]">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-sm font-bold text-white">Two-Factor Authentication</div>
                              <div className="text-xs text-zinc-500">{twoFactorAuth ? "Enabled" : "Disabled"}</div>
                            </div>
                            <Switch checked={twoFactorAuth} onCheckedChange={setTwoFactorAuth} />
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-gradient-to-r from-transparent via-blue-700/50 to-transparent" />

                      <div className="space-y-2">
                        <h3 className="text-sm font-bold text-white">Privacy Settings</h3>
                        <div className="space-y-4 mt-2">
                          <div className="bg-zinc-800/60 border border-green-700/30 rounded-lg p-4 shadow-[0_0_8px_0_rgba(34,197,94,0.2)]">
                            <div className="space-y-3">
                              <div className="text-sm font-bold text-white">Profile Visibility</div>
                              <RadioGroup
                                value={privacySettings.profileVisibility}
                                onValueChange={(value) =>
                                  setPrivacySettings({ ...privacySettings, profileVisibility: value })
                                }
                                className="space-y-2"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="public" id="profile-public" />
                                  <Label htmlFor="profile-public" className="text-white font-medium">Public</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="connections" id="profile-connections" />
                                  <Label htmlFor="profile-connections" className="text-white font-medium">Connections Only</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="private" id="profile-private" />
                                  <Label htmlFor="profile-private" className="text-white font-medium">Private</Label>
                                </div>
                              </RadioGroup>
                            </div>
                          </div>

                          <div className="bg-zinc-800/60 border border-fuchsia-700/30 rounded-lg p-4 shadow-[0_0_8px_0_rgba(217,70,239,0.2)]">
                            <div className="space-y-3">
                              <div className="text-sm font-bold text-white">Activity Visibility</div>
                              <RadioGroup
                                value={privacySettings.activityVisibility}
                                onValueChange={(value) =>
                                  setPrivacySettings({ ...privacySettings, activityVisibility: value })
                                }
                                className="space-y-2"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="public" id="activity-public" />
                                  <Label htmlFor="activity-public" className="text-white font-medium">Public</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="connections" id="activity-connections" />
                                  <Label htmlFor="activity-connections" className="text-white font-medium">Connections Only</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="private" id="activity-private" />
                                  <Label htmlFor="activity-private" className="text-white font-medium">Private</Label>
                                </div>
                              </RadioGroup>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <EnhancedButton
                          variant="gradient"
                          rounded="full"
                          animation="shimmer"
                          className="bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 shadow-[0_0_16px_0_rgba(80,0,255,0.4)]"
                          leftIcon={<Save className="h-4 w-4" />}
                        >
                          Save Changes
                        </EnhancedButton>
                      </div>
                    </div>
                  </EnhancedCardContent>
                </EnhancedCard>
              </AnimatedSection>
            )}

            {/* Notifications and Security sections retained; Appearance and Devices sections removed */}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

