"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowRight, Check, X } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

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
const usernameSchema = z.object({
  username: z
    .string()
    .min(3, {
      message: "Username must be at least 3 characters.",
    })
    .max(20, {
      message: "Username must be less than 20 characters.",
    })
    .regex(/^[a-z0-9._-]+$/, {
      message: "Username can only contain lowercase letters, numbers, dots, underscores, and hyphens.",
    }),
})

type UsernameFormValues = z.infer<typeof usernameSchema>

export default function CompleteSignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [googleEmail, setGoogleEmail] = useState<string | null>(null)
  const [googleSub, setGoogleSub] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const form = useForm<UsernameFormValues>({
    resolver: zodResolver(usernameSchema),
    defaultValues: {
      username: "",
    },
    mode: "onChange",
  })

  useEffect(() => {
    // Retrieve Google data from sessionStorage
    try {
      const email = sessionStorage.getItem("google.signup.email")
      const sub = sessionStorage.getItem("google.signup.sub")

      if (!email) {
        // No Google data found, redirect to signup
        router.push("/signup")
        return
      }

      setGoogleEmail(email)
      setGoogleSub(sub)
    } catch (error) {
      console.error("Failed to retrieve Google signup data:", error)
      router.push("/signup")
    }
  }, [router])

  // Handle form submission
  async function onSubmit(data: UsernameFormValues) {
    if (!googleEmail) {
      setErrorMessage("Missing Google account information. Please try signing up again.")
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      // Generate a secure random password for Google sign-ups
      const randomPassword = `google_${googleSub || Date.now()}_${Math.random().toString(36).substring(2, 15)}`

      // Call the signup API
      const response = await fetch(`${API_BASE_URL}/v1/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: data.username.toLowerCase(),
          email: googleEmail.toLowerCase(),
          password: randomPassword,
        }),
      })

      const contentType = response.headers.get("content-type")
      const isJson = contentType?.includes("application/json")

      if (!response.ok) {
        if (response.status === 401) {
          const result = isJson ? await response.json() : null
          setErrorMessage(result?.message || "This username or email is already taken. Please try another.")
        } else if (isJson) {
          const result = await response.json()
          setErrorMessage(result.message || "Registration failed. Please try again.")
        } else {
          const text = await response.text()
          console.error("Server error:", text)
          setErrorMessage(`Server error (${response.status}). Please try again later.`)
        }
        setIsLoading(false)
        return
      }

      // Parse successful response
      const result = isJson ? await response.json() : { success: true }
      console.log("Google signup successful:", result)

      // Now login with the same credentials to get access token
      console.log("[Google Signup] Logging in automatically...")
      
      const loginResponse = await fetch(`${API_BASE_URL}/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: googleEmail.toLowerCase(),
          password: randomPassword,
        }),
      })

      const loginContentType = loginResponse.headers.get("content-type")
      const isLoginJson = loginContentType?.includes("application/json")
      const loginResult = isLoginJson ? await loginResponse.json() : null

      if (loginResponse.ok && loginResult?.success && loginResult?.data) {
        // Extract tokens from login response
        const [userRole, accessToken, refreshToken] = Array.isArray(loginResult.data)
          ? loginResult.data
          : [null, null, null]

        if (accessToken) {
          console.log("[Google Signup] Auto-login successful, storing tokens")
          
          // Store tokens in sessionStorage (or localStorage based on preference)
          try {
            sessionStorage.setItem("auth.accessToken", accessToken)
            if (refreshToken) {
              sessionStorage.setItem("auth.refreshToken", refreshToken)
            }
            if (userRole) {
              sessionStorage.setItem("auth.userRole", userRole)
            }
            sessionStorage.setItem("auth.email", googleEmail.toLowerCase())
            sessionStorage.setItem("auth.username", data.username.toLowerCase())
          } catch (error) {
            console.error("Failed to store auth tokens:", error)
          }

          // Clear Google signup data
          try {
            sessionStorage.removeItem("google.signup.email")
            sessionStorage.removeItem("google.signup.sub")
            sessionStorage.removeItem("google.signup.code")
          } catch (error) {
            console.error("Failed to clear Google signup data:", error)
          }

          // Redirect to home
          router.push("/home")
          return
        }
      }

      // If auto-login failed, clear signup data and redirect to login
      console.warn("[Google Signup] Auto-login failed, redirecting to login page")
      try {
        sessionStorage.removeItem("google.signup.email")
        sessionStorage.removeItem("google.signup.sub")
        sessionStorage.removeItem("google.signup.code")
      } catch (error) {
        console.error("Failed to clear Google signup data:", error)
      }
      
      router.push("/login")
    } catch (error) {
      console.error("Error during Google signup:", error)
      setErrorMessage("Failed to connect to the server. Please check your internet connection and try again.")
      setIsLoading(false)
    }
  }

  if (!googleEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2bbcff] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4 py-12 overflow-x-hidden">
      {/* App name at the top */}
      <div className="w-full flex justify-center pt-8 pb-6">
        <span className="text-2xl font-extrabold tracking-widest uppercase bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">
          ELITESCORE
        </span>
      </div>

      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 -z-10 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[100px]" />
        <div className="absolute right-0 top-1/3 -z-10 h-[600px] w-[600px] rounded-full bg-purple-500/10 blur-[100px]" />
      </div>

      <motion.div
        className="w-full max-w-sm space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="text-center" variants={itemVariants}>
          <h1 className="text-2xl font-extrabold tracking-widest uppercase bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">
            Complete Your Signup
          </h1>
          <p className="mt-2 text-white text-sm">Choose a username to finish setting up your account</p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="shadow-2xl rounded-2xl border-0 bg-card/90 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-lg font-extrabold tracking-widest uppercase bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">
                Choose Username
              </CardTitle>
              <CardDescription className="text-white text-sm">
                Your email: <span className="text-blue-400">{googleEmail}</span>
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Form {...form}>
                <form className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white text-sm">Username</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="johndoe123"
                            className="py-3 text-base lowercase"
                            {...field}
                            onChange={(event) => {
                              // Sanitize: only allow lowercase letters, numbers, dots, underscores, hyphens
                              const sanitized = event.target.value.replace(/[^a-zA-Z0-9._-]/g, "")
                              field.onChange(sanitized.toLowerCase())
                            }}
                          />
                        </FormControl>

                        {/* Username requirements */}
                        {field.value && (
                          <div className="mt-2 space-y-1">
                            <div className="grid grid-cols-1 gap-1">
                              <div className="flex items-center text-xs">
                                {field.value.length >= 3 ? (
                                  <Check className="h-3 w-3 text-green-500 mr-1" />
                                ) : (
                                  <X className="h-3 w-3 text-zinc-400 mr-1" />
                                )}
                                <span className={field.value.length >= 3 ? "text-white" : "text-zinc-400"}>
                                  At least 3 characters
                                </span>
                              </div>
                              <div className="flex items-center text-xs">
                                {/^[a-z0-9._-]+$/.test(field.value) ? (
                                  <Check className="h-3 w-3 text-green-500 mr-1" />
                                ) : (
                                  <X className="h-3 w-3 text-zinc-400 mr-1" />
                                )}
                                <span
                                  className={/^[a-z0-9._-]+$/.test(field.value) ? "text-white" : "text-zinc-400"}
                                >
                                  Only lowercase, numbers, . _ -
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

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
                    Creating account...
                  </>
                ) : (
                  <>
                    Complete signup <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <div className="text-center text-sm text-zinc-400">
                Want to use a different account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    try {
                      sessionStorage.removeItem("google.signup.email")
                      sessionStorage.removeItem("google.signup.sub")
                    } catch (error) {
                      console.error("Failed to clear signup data:", error)
                    }
                    router.push("/signup")
                  }}
                  className="text-zinc-400 hover:text-[#2bbcff] transition-colors underline"
                >
                  Start over
                </button>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}

