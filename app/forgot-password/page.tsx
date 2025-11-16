"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, Lock, Mail } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

const API_BASE_URL = "https://elitescore-auth-fafc42d40d58.herokuapp.com/"

const forgotPasswordSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, {
        message: "Password must be at least 8 characters.",
      })
      .max(128, {
        message: "Password is too long.",
      }),
    confirmPassword: z.string().min(1, {
      message: "Please confirm your password.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export default function ForgotPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = useMemo(() => searchParams.get("token"), [searchParams])
  const isResetMode = Boolean(token)
  const tokenSubject = useMemo(() => {
    if (!token) return null
    const parts = token.split(".")
    if (parts.length !== 3) return null

    try {
      const payloadPart = parts[1]
      if (!payloadPart) return null
      
      let payload = payloadPart.replace(/-/g, "+").replace(/_/g, "/")
      while (payload.length % 4 !== 0) {
        payload += "="
      }
      const decoded = JSON.parse(atob(payload))
      console.log("[Forgot Password] Decoded JWT payload:", decoded)
      console.log("[Forgot Password] Token subject (sub):", decoded.sub)
      console.log("[Forgot Password] Token email (if present):", decoded.email)
      
      // The token's 'sub' field should contain the username
      return typeof decoded.sub === "string" ? decoded.sub : null
    } catch (error) {
      console.error("[Forgot Password] Error decoding token:", error)
      return null
    }
  }, [token])

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isResetLoading, setIsResetLoading] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null)

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  const resetForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  useEffect(() => {
    // Reset state when switching modes
    setError(null)
    setSuccess(false)
    setSuccessMessage(null)
    setIsLoading(false)

    setResetError(null)
    setResetSuccess(false)
    setResetSuccessMessage(null)
    setIsResetLoading(false)
  }, [isResetMode])

  async function onSubmit(data: ForgotPasswordFormValues) {
    setIsLoading(true)
    setError(null)

    try {
      // Quick availability check before requesting the reset
      const statusResponse = await fetch(`${API_BASE_URL}v1/status`, {
        method: "GET",
      })

      if (!statusResponse.ok) {
        throw new Error("Service unavailable")
      }

      const response = await fetch(`${API_BASE_URL}v1/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: data.email.trim(),
        }),
      })

      const contentType = response.headers.get("content-type")
      const isJson = contentType?.includes("application/json")
      const result = isJson ? await response.json() : null

      if (!response.ok || result?.success === false) {
        let errorMessage =
          result?.message ||
          (response.status === 404
            ? "We couldn't find an account with that email."
            : response.status === 429
                ? "Too many reset attempts. Please wait a few minutes and try again."
                : "We couldn't process your request right now. Please try again.")

        setError(errorMessage)
        return
      }

      setSuccess(true)
      setSuccessMessage(result?.message || null)
      setError(null)
    } catch (error) {
      setError("Failed to connect to the server. Please check your internet connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  async function onResetSubmit(data: ResetPasswordFormValues) {
    if (!token || !tokenSubject) {
      setResetError("Reset link is invalid. Please request a new password reset email.")
      router.replace("/forgot-password")
      return
    }

    setIsResetLoading(true)
    setResetError(null)

    try {
      const statusResponse = await fetch(`${API_BASE_URL}v1/status`, {
        method: "GET",
      })

      if (!statusResponse.ok) {
        throw new Error("Service unavailable")
      }

      // Use the hyphen format (as per API docs)
      const apiUrl = `${API_BASE_URL}v1/auth/forgot_password-${encodeURIComponent(token)}`
      console.log("[Forgot Password] ===== Password Reset Request =====")
      console.log("[Forgot Password] API URL:", apiUrl)
      console.log("[Forgot Password] Token subject (username from JWT):", tokenSubject)
      console.log("[Forgot Password] New password length:", data.password.length)

      const requestBody = {
        username: tokenSubject,
        password: data.password,
      }
      console.log("[Forgot Password] Request body (password hidden):", {
        username: tokenSubject,
        password: "***"
      })

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      console.log("[Forgot Password] Response status:", response.status)
      console.log("[Forgot Password] Response ok:", response.ok)

      const contentType = response.headers.get("content-type")
      const isJson = contentType?.includes("application/json")
      let result = null
      
      if (isJson) {
        result = await response.json()
        console.log("[Forgot Password] Response JSON:", result)
      } else {
        const text = await response.text()
        console.log("[Forgot Password] Response text (non-JSON):", text)
        console.warn("[Forgot Password] ⚠️ Non-JSON response received!")
      }

      if (!response.ok || result?.success === false) {
        const status = response.status
        let errorMessage = result?.message || "Unable to reset your password. Please request a new link."

        console.error("[Forgot Password] ✗ Error - Status:", status)
        console.error("[Forgot Password] Error message:", errorMessage)
        console.error("[Forgot Password] Full error response:", result)

        if (status === 401) {
          errorMessage = result?.message || "Reset link expired or invalid. Please request a new password reset email."
        } else if (status === 400) {
          errorMessage = result?.message || `The username "${tokenSubject}" does not match the reset link. Please verify your username and try again.`
          console.error("[Forgot Password] Username mismatch! Token subject:", tokenSubject)
        }

        setResetError(errorMessage)

        if (status === 401) {
          setTimeout(() => {
            router.replace("/forgot-password")
          }, 2000)
        }

        return
      }

      console.log("[Forgot Password] ✓ Password reset successful!")
      console.log("[Forgot Password] Success message:", result?.message)
      console.log("[Forgot Password] ===== Password Reset Complete =====")
      
      setResetSuccess(true)
      setResetSuccessMessage(
        result?.message ||
          `Password reset successfully for ${tokenSubject}. Redirecting you to the login page so you can sign in with your new credentials.`
      )

      setTimeout(() => {
        router.push("/login")
      }, 1500)
    } catch (error) {
      console.error("[Forgot Password] ✗ Exception:", error)
      setResetError("Failed to connect to the server. Please check your internet connection and try again.")
    } finally {
      setIsResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4 py-12 overflow-x-hidden">
      {/* App name at the top */}
      <div className="w-full flex justify-center pt-8 pb-4">
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
            Forgot Password
          </h1>
          <p className="mt-2 text-white text-sm">We'll send you a reset link</p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="shadow-2xl rounded-2xl border-0 bg-card/90 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-lg font-extrabold tracking-widest uppercase bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">
                {isResetMode ? "Set a new password" : "Reset your password"}
              </CardTitle>
              <CardDescription className="text-white text-sm">
                {isResetMode
                  ? "Enter your username and a new password to finish resetting your account."
                  : "Enter your email address and we'll send you a link to reset your password"}
              </CardDescription>
            </CardHeader>

            {isResetMode ? (
              <Form {...resetForm}>
                {!resetSuccess ? (
                  <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-0">
                    <CardContent className="space-y-4">
                      {resetError && (
                        <Alert variant="destructive" className="animate-shake">
                          <AlertDescription>{resetError}</AlertDescription>
                        </Alert>
                      )}

                      <p className="rounded-xl border border-[#2bbcff]/30 bg-black/40 p-4 text-xs text-zinc-300">
                        {tokenSubject ? (
                          <>
                            Resetting password for{" "}
                            <span className="font-semibold text-white">{tokenSubject}</span>. Choose a new password to
                            complete the reset. If this link has expired, request a new reset email.
                          </>
                        ) : (
                          "We couldn't verify which account this reset is for. Please request a new link."
                        )}
                      </p>

                      <FormField
                        control={resetForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white text-sm">New password</FormLabel>
                            <FormControl>
                              <Input
                                className="py-3 text-base rounded-xl border border-zinc-700 bg-black/60 text-white focus:ring-2 focus:ring-[#2bbcff] focus:border-[#2bbcff] transition-all"
                                type="password"
                                autoComplete="new-password"
                                placeholder="Enter new password"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={resetForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white text-sm">Confirm password</FormLabel>
                            <FormControl>
                              <Input
                                className="py-3 text-base rounded-xl border border-zinc-700 bg-black/60 text-white focus:ring-2 focus:ring-[#2bbcff] focus:border-[#2bbcff] transition-all"
                                type="password"
                                autoComplete="new-password"
                                placeholder="Confirm new password"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-4">
                      <Button
                        type="submit"
                        className="w-full py-3 rounded-2xl font-bold bg-gradient-to-r from-[#2bbcff] to-[#a259ff] text-white shadow-lg hover:scale-[1.02] transition-transform"
                        disabled={isResetLoading}
                      >
                        {isResetLoading ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Updating password...
                          </>
                        ) : (
                          "Update password"
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        className="text-xs text-zinc-400 hover:text-[#2bbcff] transition-colors"
                        onClick={() => router.replace("/forgot-password")}
                        disabled={isResetLoading}
                      >
                        Use a different email
                      </Button>
                    </CardFooter>
                  </form>
                ) : (
                  <CardContent className="space-y-4 pb-6">
                    <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-green-500/20 p-2">
                          <Mail className="h-5 w-5 text-green-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">Password updated</h3>
                          <p className="mt-1 text-sm text-zinc-300">{resetSuccessMessage}</p>
                        </div>
                      </div>
                    </div>

                    <p className="text-center text-xs text-zinc-400">
                      We are redirecting you to the login page. If nothing happens, use the button below.
                    </p>

                    <Button
                      className="w-full py-3 rounded-2xl font-bold bg-gradient-to-r from-[#2bbcff] to-[#a259ff] text-white shadow-lg hover:scale-[1.02] transition-transform"
                      onClick={() => router.push("/login")}
                    >
                      Back to login
                    </Button>
                  </CardContent>
                )}
              </Form>
            ) : !success ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
                  <CardContent className="space-y-4">
                    {error && (
                      <Alert variant="destructive" className="animate-shake">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white text-sm">Email</FormLabel>
                          <FormControl>
                            <Input
                              className="py-3 text-base rounded-xl border border-zinc-700 bg-black/60 text-white focus:ring-2 focus:ring-[#2bbcff] focus:border-[#2bbcff] transition-all"
                              placeholder="john@example.com"
                              type="email"
                              autoComplete="email"
                              autoFocus
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>

                  <CardFooter className="flex flex-col space-y-4">
                    <Button
                      type="submit"
                      className="w-full py-3 rounded-2xl font-bold bg-gradient-to-r from-[#2bbcff] to-[#a259ff] text-white shadow-lg hover:scale-[1.02] transition-transform"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Sending reset link...
                        </>
                      ) : (
                        <>
                          Send reset link <Mail className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      className="text-xs text-zinc-400 hover:text-[#2bbcff] transition-colors"
                      onClick={() => router.push("/login")}
                      disabled={isLoading}
                    >
                      <ArrowLeft className="mr-2 h-3 w-3" />
                      Back to login
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            ) : (
              <CardContent className="space-y-4 pb-6">
                <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-green-500/20 p-2">
                      <Mail className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">Check your email</h3>
                      <p className="mt-1 text-sm text-zinc-300">
                        {successMessage
                          ? successMessage
                          : (
                              <>
                                We've sent a password reset link to <strong>{form.getValues("email")}</strong>. Click the
                                link in the email to reset your password.
                              </>
                            )}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-center text-xs text-zinc-400">
                  Didn't receive the email? Check your spam folder or{" "}
                  <button
                    className="text-[#2bbcff] hover:underline"
                    onClick={() => {
                      setSuccess(false)
                      form.reset()
                    }}
                  >
                    try again
                  </button>
                </p>

                <Button
                  className="w-full py-3 rounded-2xl font-bold bg-gradient-to-r from-[#2bbcff] to-[#a259ff] text-white shadow-lg hover:scale-[1.02] transition-transform"
                  onClick={() => router.push("/login")}
                >
                  Back to login
                </Button>
              </CardContent>
            )}
          </Card>
        </motion.div>

        <motion.div
          className="flex items-center justify-center text-xs text-zinc-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Lock className="h-3 w-3 mr-1" />
          <span>Secure password reset • 256-bit encryption</span>
        </motion.div>
      </motion.div>
    </div>
  )
}

