"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, Lock } from "lucide-react"
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

const API_BASE_URL = "https://elite-score-a31a0334b58d.herokuapp.com"

const verifySchema = z.object({
  code: z
    .string()
    .regex(/^\d{6}$/, {
      message: "Enter the 6-digit verification code.",
    }),
})

type VerifyFormValues = z.infer<typeof verifySchema>

export default function VerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isVerifyLoading, setIsVerifyLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [pendingToken, setPendingToken] = useState<string | null>(null)
  const [pendingEmail, setPendingEmail] = useState<string>("")
  const [userRole, setUserRole] = useState<string | null>(null)
  const [rememberChoice, setRememberChoice] = useState(false)

  const form = useForm<VerifyFormValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      code: "",
    },
  })

  useEffect(() => {
    // Load verification session from sessionStorage
    const storedToken = sessionStorage.getItem("verify.tempToken")
    const storedEmail = sessionStorage.getItem("verify.email")
    const storedRole = sessionStorage.getItem("verify.role")
    const storedRemember = sessionStorage.getItem("verify.remember")
    const storedMessage = sessionStorage.getItem("verify.message")

    if (!storedToken || !storedEmail) {
      router.replace("/login")
      return
    }

    setPendingToken(storedToken)
    setPendingEmail(storedEmail)
    setUserRole(storedRole)
    setRememberChoice(storedRemember === "true")
    if (storedMessage) {
      setInfoMessage(storedMessage)
    }
  }, [router])

  async function onVerifyCode(formData: VerifyFormValues) {
    if (!pendingToken) {
      setVerifyError("Your login session expired. Please sign in again.")
      handleBackToLogin()
      return
    }

    setIsVerifyLoading(true)
    setVerifyError(null)
    setInfoMessage(null)

    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/auth/verify_code?code=${encodeURIComponent(formData.code)}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${pendingToken}`,
          },
        }
      )

      const contentType = response.headers.get("content-type")
      const isJson = contentType?.includes("application/json")
      const result = isJson ? await response.json() : null

      if (!response.ok || result?.success === false) {
        let errorMessage = result?.message || "Invalid verification code. Please try again."

        if (response.status === 401) {
          errorMessage = result?.message || "Your login session expired. Please sign in again."
          handleBackToLogin()
        }

        setVerifyError(errorMessage)
        return
      }

      // Store final tokens
      if (typeof window !== "undefined") {
        const storage = rememberChoice ? window.localStorage : window.sessionStorage

        if (result?.data && typeof result.data === "object") {
          const dataObj = result.data as Record<string, unknown>
          if (typeof dataObj.accessToken === "string") {
            storage.setItem("auth.accessToken", dataObj.accessToken)
          }
          if (typeof dataObj.refreshToken === "string") {
            storage.setItem("auth.refreshToken", dataObj.refreshToken)
          }
        } else if (typeof result?.data === "string") {
          storage.setItem("auth.accessToken", result.data)
        }

        if (userRole) {
          storage.setItem("auth.userRole", userRole)
        }

        if (pendingEmail) {
          storage.setItem("auth.email", pendingEmail)
        }

        // Clear verification session
        sessionStorage.removeItem("verify.tempToken")
        sessionStorage.removeItem("verify.email")
        sessionStorage.removeItem("verify.role")
        sessionStorage.removeItem("verify.remember")
        sessionStorage.removeItem("verify.message")
      }

      setInfoMessage(result?.message ?? "Verification successful! Redirecting...")
      setVerifyError(null)
      
      setTimeout(() => {
        router.push("/home")
      }, 800)
    } catch (error) {
      setVerifyError("Failed to verify the code. Please try again.")
    } finally {
      setIsVerifyLoading(false)
    }
  }

  async function onResendCode() {
    if (!pendingToken) {
      setVerifyError("Your login session expired. Please sign in again.")
      handleBackToLogin()
      return
    }

    setIsResending(true)
    setVerifyError(null)
    setInfoMessage(null)

    try {
      const response = await fetch(`${API_BASE_URL}/v1/auth/resend_code`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${pendingToken}`,
        },
      })

      const contentType = response.headers.get("content-type")
      const isJson = contentType?.includes("application/json")
      const result = isJson ? await response.json() : null

      if (!response.ok || result?.success === false) {
        let errorMessage = result?.message || "Unable to resend the verification code right now."

        if (response.status === 403) {
          errorMessage = result?.message || "Too many code requests. Please wait a little before trying again."
        } else if (response.status === 401) {
          errorMessage = result?.message || "Your login session expired. Please sign in again."
          handleBackToLogin()
        }

        setVerifyError(errorMessage)
        return
      }

      setInfoMessage(result?.message ?? "A new verification code has been sent to your email.")
    } catch (error) {
      setVerifyError("Failed to resend the verification code. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  function handleBackToLogin() {
    // Clear verification session
    sessionStorage.removeItem("verify.tempToken")
    sessionStorage.removeItem("verify.email")
    sessionStorage.removeItem("verify.role")
    sessionStorage.removeItem("verify.remember")
    sessionStorage.removeItem("verify.message")
    router.replace("/login")
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
            Verify Your Login
          </h1>
          <p className="mt-2 text-white text-sm">Enter the code sent to your email</p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="shadow-2xl rounded-2xl border-0 bg-card/90 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-lg font-extrabold tracking-widest uppercase bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">
                Verify your login
              </CardTitle>
              <CardDescription className="text-white text-sm">
                Enter the verification code sent to {pendingEmail || "your email address"}.
              </CardDescription>
            </CardHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onVerifyCode)} className="space-y-0">
                <CardContent className="space-y-4">
                  {verifyError && (
                    <Alert variant="destructive" className="animate-shake">
                      <AlertDescription>{verifyError}</AlertDescription>
                    </Alert>
                  )}

                  {infoMessage && !verifyError && (
                    <Alert>
                      <AlertDescription>{infoMessage}</AlertDescription>
                    </Alert>
                  )}

                  <div className="rounded-xl border border-[#2bbcff]/30 bg-black/40 p-4 text-xs text-zinc-300">
                    We just emailed a one-time code to{" "}
                    <span className="font-semibold text-white">{pendingEmail}</span>. Enter it below to finish
                    signing in.
                  </div>

                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white text-sm">Verification code</FormLabel>
                        <FormControl>
                          <Input
                            className="py-3 text-center text-lg tracking-widest font-mono rounded-xl border border-zinc-700 bg-black/60 text-white focus:ring-2 focus:ring-[#2bbcff] focus:border-[#2bbcff] transition-all"
                            placeholder=""
                            type="tel"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            autoFocus
                            maxLength={6}
                            {...field}
                            onChange={(e) => {
                              const sanitized = e.target.value.replace(/\D/g, "").slice(0, 6)
                              field.onChange(sanitized)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-center text-xs text-zinc-400 mt-2">
                          Enter the 6-digit code we emailed you. You can paste it directly into this field.
                        </p>
                      </FormItem>
                    )}
                  />

                  <p className="text-center text-xs text-zinc-400">
                    Didn&apos;t get a code? Check your spam folder or request a new one below.
                  </p>
                </CardContent>

                <CardFooter className="flex flex-col space-y-3">
                  <Button
                    type="submit"
                    className="w-full py-3 rounded-2xl font-bold bg-gradient-to-r from-[#2bbcff] to-[#a259ff] text-white shadow-lg hover:scale-[1.02] transition-transform"
                    disabled={isVerifyLoading}
                  >
                    {isVerifyLoading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Verifying...
                      </>
                    ) : (
                      "Verify code"
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-xl border-zinc-700 text-white hover:bg-zinc-900 transition-colors disabled:opacity-60"
                    onClick={onResendCode}
                    disabled={isResending || isVerifyLoading}
                  >
                    {isResending ? "Sending new code..." : "Resend code"}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="text-xs text-zinc-400 hover:text-[#2bbcff] transition-colors"
                    onClick={handleBackToLogin}
                    disabled={isVerifyLoading || isResending}
                  >
                    <ArrowLeft className="mr-2 h-3 w-3" />
                    Use a different account
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </motion.div>

        <motion.div
          className="flex items-center justify-center text-xs text-zinc-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Lock className="h-3 w-3 mr-1" />
          <span>Secure login • 256-bit encryption</span>
        </motion.div>
      </motion.div>
    </div>
  )
}

