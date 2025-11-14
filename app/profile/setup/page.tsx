"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { motion } from "framer-motion"
import { ArrowRight, Check, X, User } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"

const API_BASE_URL = "https://elite-score-a31a0334b58d.herokuapp.com"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
    },
  },
}

// Form schema with validation
const profileSetupSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, { message: "Phone number is required." })
    .regex(/^\+?[0-9()\s\-]{7,15}$/, {
      message: "Please enter a valid phone number.",
    })
    .refine(
      (val) => {
        const digitsOnly = val.replace(/\D/g, "")
        return digitsOnly.length >= 10 && digitsOnly.length <= 15
      },
      { message: "Phone number must contain between 10 and 15 digits." }
    ),
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  bio: z.string().optional(),
})

type ProfileSetupFormValues = z.infer<typeof profileSetupSchema>

export default function ProfileSetupPage() {
  const isAuthorized = useRequireAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const form = useForm<ProfileSetupFormValues>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      phoneNumber: "",
      firstName: "",
      lastName: "",
      bio: "",
    },
    mode: "onChange",
  })

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2bbcff] border-t-transparent" />
      </div>
    )
  }

  async function onSubmit(data: ProfileSetupFormValues) {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const token =
        localStorage.getItem("auth.accessToken") || sessionStorage.getItem("auth.accessToken")

      if (!token) {
        setErrorMessage("Authentication required. Please log in again.")
        setIsLoading(false)
        return
      }

      // Call POST /v1/users/profile/add_profile
      const requestBody: Record<string, unknown> = {
        phoneNumber: data.phoneNumber.trim(),
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
      }

      if (data.bio && data.bio.trim()) {
        requestBody.bio = data.bio.trim()
      }

      console.log("[Profile Setup] Creating profile with:", requestBody)

      const response = await fetch(`${API_BASE_URL}/v1/users/profile/add_profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      })

      const contentType = response.headers.get("content-type")
      const isJson = contentType?.includes("application/json")
      const result = isJson ? await response.json() : null

      if (!response.ok) {
        const errorMsg =
          result?.message || result?.error || `Profile creation failed (${response.status}).`
        console.error("[Profile Setup] Error:", errorMsg)
        setErrorMessage(errorMsg)
        setIsLoading(false)
        return
      }

      console.log("[Profile Setup] Profile created successfully:", result)

      // Mark profile as existing
      localStorage.setItem("profile.exists", "true")

      // Verify by fetching the profile
      const verifyResponse = await fetch(`${API_BASE_URL}/v1/users/profile/get_own_profile`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (verifyResponse.ok) {
        const verifyResult = await verifyResponse.json()
        console.log("[Profile Setup] Profile verified:", verifyResult)
      }

      // Redirect to profile page
      router.push("/profile")
    } catch (error) {
      console.error("[Profile Setup] Error:", error)
      setErrorMessage("Failed to connect to the server. Please check your internet connection and try again.")
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-radial from-blue-500/20 via-purple-700/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-24 w-72 h-72 bg-gradient-radial from-purple-700/20 via-pink-600/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-gradient-radial from-fuchsia-500/15 via-blue-600/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 py-12">
        <motion.div
          className="w-full max-w-lg space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="text-center" variants={itemVariants}>
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-[0_0_24px_0_rgba(80,0,255,0.5)]">
                <User className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-extrabold tracking-widest uppercase bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">
              Setup Your Profile
            </h1>
            <p className="mt-2 text-white text-sm">Complete your profile to get started</p>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="shadow-2xl rounded-2xl border-0 bg-card/90 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-lg font-extrabold tracking-widest uppercase bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">
                  Personal Information
                </CardTitle>
                <CardDescription className="text-white text-sm">
                  Tell us a bit about yourself
                </CardDescription>
              </CardHeader>

              <CardContent>
                <Form {...form}>
                  <form className="space-y-4">
                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white text-sm">Phone Number *</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              inputMode="tel"
                              placeholder="+1234567890"
                              className="py-3 text-base"
                              {...field}
                            />
                          </FormControl>
                          <p className="text-[10px] text-zinc-500 mt-1">
                            Include country code, e.g. +1 234 567 8901
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white text-sm">First Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="John" className="py-3 text-base" {...field} />
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
                            <FormLabel className="text-white text-sm">Last Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" className="py-3 text-base" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white text-sm">Bio (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell us about yourself..."
                              className="min-h-[100px] py-3 text-base resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {errorMessage && (
                      <div className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs text-red-200">
                        {errorMessage}
                      </div>
                    )}
                  </form>
                </Form>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                <Button
                  className="w-full py-3 rounded-2xl font-bold bg-gradient-to-r from-[#2bbcff] to-[#a259ff] text-white shadow-lg hover:scale-[1.02] transition-transform"
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={!form.formState.isValid || isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Creating profile...
                    </>
                  ) : (
                    <>
                      Complete Setup <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <p className="text-center text-xs text-zinc-400">
                  * Required fields
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}

