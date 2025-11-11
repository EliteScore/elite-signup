"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { User, Phone, FileText, Lock, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

const API_BASE_URL = "https://elite-score-a31a0334b58d.herokuapp.com"

const profileEditSchema = z.object({
  phoneNumber: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  bio: z.string().optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
})

type ProfileEditFormValues = z.infer<typeof profileEditSchema>

interface ProfileData {
  userId: number
  phoneNumber: string | null
  firstName: string | null
  lastName: string | null
  bio: string | null
  visibility: "PUBLIC" | "PRIVATE"
  followersCount: number | null
  followingCount: number | null
  createdAt: string | null
  updatedAt: string | null
}

interface ProfileEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ProfileEditDialog({ open, onOpenChange, onSuccess }: ProfileEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)

  const form = useForm<ProfileEditFormValues>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      phoneNumber: "",
      firstName: "",
      lastName: "",
      bio: "",
      visibility: "PUBLIC",
    },
  })

  useEffect(() => {
    if (open) {
      fetchProfile()
    }
  }, [open])

  async function fetchProfile() {
    setIsFetching(true)
    setError(null)

    try {
      const token = localStorage.getItem("auth.accessToken") || sessionStorage.getItem("auth.accessToken")

      if (!token) {
        setError("You must be logged in to edit your profile")
        return
      }

      const response = await fetch(`${API_BASE_URL}/v1/users/profile/get_own_profile`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      const result = await response.json().catch(() => null)

      if (!response.ok || result?.success === false) {
        setError(result?.message || "Failed to load profile")
        return
      }

      const data = result.data as ProfileData
      setProfileData(data)

      // Populate form with existing data
      form.reset({
        phoneNumber: data.phoneNumber || "",
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        bio: data.bio || "",
        visibility: data.visibility || "PUBLIC",
      })
    } catch (error) {
      setError("Failed to connect to the server")
    } finally {
      setIsFetching(false)
    }
  }

  async function onSubmit(data: ProfileEditFormValues) {
    setIsLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem("auth.accessToken") || sessionStorage.getItem("auth.accessToken")

      if (!token) {
        setError("You must be logged in to update your profile")
        return
      }

      // Only send fields that have values
      const updateData: Partial<ProfileEditFormValues> = {}
      if (data.phoneNumber) updateData.phoneNumber = data.phoneNumber
      if (data.firstName) updateData.firstName = data.firstName
      if (data.lastName) updateData.lastName = data.lastName
      if (data.bio !== undefined) updateData.bio = data.bio
      if (data.visibility) updateData.visibility = data.visibility

      const response = await fetch(`${API_BASE_URL}/v1/users/profile/update_profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      })

      const result = await response.json().catch(() => null)

      if (!response.ok || result?.success === false) {
        setError(result?.message || "Failed to update profile")
        return
      }

      // Success
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (error) {
      setError("Failed to connect to the server")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Profile</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Update your profile information. Only fill in the fields you want to change.
          </DialogDescription>
        </DialogHeader>

        {isFetching ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-[#2bbcff]" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">First Name</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-zinc-800 border-zinc-700 text-white"
                          placeholder="John"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Last Name</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-zinc-800 border-zinc-700 text-white"
                          placeholder="Doe"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        className="bg-zinc-800 border-zinc-700 text-white"
                        placeholder="+1 (555) 123-4567"
                        type="tel"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        className="bg-zinc-800 border-zinc-700 text-white min-h-[100px]"
                        placeholder="Tell us about yourself..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Profile Visibility</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} value={field.value} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="PUBLIC" id="edit-public" />
                          <Label htmlFor="edit-public" className="text-white cursor-pointer">
                            Public - Anyone can see your profile
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="PRIVATE" id="edit-private" />
                          <Label htmlFor="edit-private" className="text-white cursor-pointer">
                            Private - Only connections can see your profile
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                  className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-gradient-to-r from-[#2bbcff] to-[#a259ff] text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}

