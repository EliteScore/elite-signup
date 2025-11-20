"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { ArrowLeft, Users, Globe, Lock, Hash } from "lucide-react"
import { motion } from "framer-motion"

import { DashboardLayout } from "@/components/dashboard-layout"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { getStoredAccessToken } from "@/lib/auth-storage"

export default function CreateCommunityPage() {
  const isAuthorized = useRequireAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    slug: "",
    visibility: "public" as "public" | "private"
  })

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
  }

  const handleNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      name: value,
      slug: prev.slug || generateSlug(value)
    }))
  }

  const handleSlugChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      slug: generateSlug(value)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    console.log("[Create Community] ===== Form submission started =====")
    console.log("[Create Community] Form data:", formData)

    try {
      const token = getStoredAccessToken()
      console.log("[Create Community] Token present:", !!token)
      if (!token) {
        console.error("[Create Community] ERROR: No token found")
        setError("Authentication required. Please log in again.")
        setIsSubmitting(false)
        return
      }

      // Validate required fields
      if (!formData.name.trim()) {
        console.error("[Create Community] ERROR: Name is required")
        setError("Community name is required")
        setIsSubmitting(false)
        return
      }

      // Auto-generate slug if not provided
      const finalSlug = formData.slug.trim() || generateSlug(formData.name)
      console.log("[Create Community] Generated slug:", finalSlug)

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || "",
        slug: finalSlug,
        visibility: formData.visibility
      }

      console.log("[Create Community] Payload to send:", JSON.stringify(payload, null, 2))
      console.log("[Create Community] Making request to /api/communities/create...")

      const response = await fetch("/api/communities/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload)
      })

      console.log("[Create Community] Response received")
      console.log("[Create Community] Response status:", response.status, response.statusText)
      console.log("[Create Community] Response ok:", response.ok)

      if (!response.ok) {
        let errorMessage = "Failed to create community"
        
        // Read response as text first (can only read once)
        const errorText = await response.text()
        console.log("[Create Community] Error response text:", errorText)
        
        if (errorText) {
          try {
            // Try to parse as JSON
            const errorData = JSON.parse(errorText)
            console.log("[Create Community] Error response (parsed):", errorData)
            errorMessage = errorData.message || errorData.error || errorData.details || errorMessage
          } catch {
            // If not JSON, use the text as-is
            console.log("[Create Community] Error response is not JSON, using as text")
            errorMessage = errorText
          }
        }

        if (response.status === 409) {
          errorMessage = "You can only create one community. You already have a community."
        } else if (response.status === 401) {
          errorMessage = "Authentication failed. Please log in again."
        } else if (response.status === 400) {
          errorMessage = errorMessage || "Invalid data. Please check your inputs."
        }

        console.error("[Create Community] Request failed:", {
          status: response.status,
          errorMessage
        })

        setError(errorMessage)
        setIsSubmitting(false)
        return
      }

      const data = await response.json()
      console.log("[Create Community] Success! Response data:", data)
      console.log("[Create Community] ===== Form submission completed successfully =====")
      
      // Redirect to the community page or for-you page
      router.push("/for-you")
    } catch (err) {
      console.error("[Create Community] ===== EXCEPTION OCCURRED =====")
      console.error("[Create Community] Error:", err)
      console.error("[Create Community] Error message:", err instanceof Error ? err.message : String(err))
      console.error("[Create Community] Error stack:", err instanceof Error ? err.stack : "No stack trace")
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
      setIsSubmitting(false)
    }
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2bbcff] border-t-transparent" />
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col min-h-screen bg-black text-white relative overflow-x-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-black" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-radial from-blue-500/20 via-purple-700/15 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-24 w-72 h-72 bg-gradient-radial from-purple-700/20 via-pink-600/15 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 w-full">
          <div className="w-full sm:max-w-2xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5 sm:mb-6">
              <EnhancedButton
                variant="ghost"
                size="sm"
                rounded="full"
                className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 h-8 w-8 p-0"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4" />
              </EnhancedButton>
              <h1 className="text-lg sm:text-2xl font-extrabold bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">
                Create Community
              </h1>
            </div>

            {/* Form */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSubmit}
              className="space-y-4 sm:space-y-5"
            >
              {/* Error Message */}
              {error && (
                <div className="bg-red-900/20 border border-red-700/40 rounded-lg p-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              {/* Community Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs sm:text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" />
                  Community Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., Software Engineers Elite"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 h-10 sm:h-11 text-sm"
                  required
                  maxLength={100}
                />
                <p className="text-[10px] sm:text-xs text-zinc-500">
                  Choose a unique name for your community
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs sm:text-sm font-medium text-zinc-300">
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe what your community is about..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 min-h-[100px] text-sm resize-none"
                  maxLength={500}
                />
                <p className="text-[10px] sm:text-xs text-zinc-500">
                  {formData.description.length}/500 characters
                </p>
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug" className="text-xs sm:text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <Hash className="h-3.5 w-3.5" />
                  URL Slug
                </Label>
                <Input
                  id="slug"
                  type="text"
                  placeholder="e.g., software-engineers-elite"
                  value={formData.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 h-10 sm:h-11 text-sm font-mono"
                  maxLength={100}
                />
                <p className="text-[10px] sm:text-xs text-zinc-500">
                  Auto-generated from name. Used in the community URL
                </p>
              </div>

              {/* Visibility */}
              <div className="space-y-2">
                <Label htmlFor="visibility" className="text-xs sm:text-sm font-medium text-zinc-300 flex items-center gap-2">
                  {formData.visibility === "public" ? (
                    <Globe className="h-3.5 w-3.5" />
                  ) : (
                    <Lock className="h-3.5 w-3.5" />
                  )}
                  Visibility <span className="text-red-400">*</span>
                </Label>
                <Select
                  value={formData.visibility}
                  onValueChange={(value: "public" | "private") => setFormData(prev => ({ ...prev, visibility: value }))}
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 h-10 sm:h-11 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="public" className="text-white hover:bg-zinc-800">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span>Public</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="private" className="text-white hover:bg-zinc-800">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        <span>Private</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] sm:text-xs text-zinc-500">
                  {formData.visibility === "public" 
                    ? "Anyone can find and join your community"
                    : "Only invited members can join your community"}
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <EnhancedButton
                  type="button"
                  variant="outline"
                  rounded="full"
                  className="flex-1 bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800 h-11 sm:h-12 text-sm sm:text-base"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </EnhancedButton>
                <EnhancedButton
                  type="submit"
                  variant="gradient"
                  rounded="full"
                  animation="shimmer"
                  className="flex-1 bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 shadow-[0_0_16px_0_rgba(80,0,255,0.4)] h-11 sm:h-12 text-sm sm:text-base font-bold"
                  disabled={isSubmitting || !formData.name.trim()}
                  isLoading={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Create Community"}
                </EnhancedButton>
              </div>
            </motion.form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

