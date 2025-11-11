"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Script from "next/script"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Eye, EyeOff, ArrowRight, Lock } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

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

const API_BASE_URL = "https://elite-score-a31a0334b58d.herokuapp.com"

// Form schema with validation
const loginSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(1, {
    message: "Password is required.",
  }),
  remember: z.boolean().default(false),
})

type LoginFormValues = z.infer<typeof loginSchema>

const verifySchema = z.object({
  code: z
    .string()
    .regex(/^\d{6}$/, {
      message: "Enter the 6-digit verification code.",
    }),
})

type VerifyFormValues = z.infer<typeof verifySchema>

type GoogleOAuthConfig = {
  clientId: string
  redirectUris: string[]
  javascriptOrigins?: string[]
  authUri?: string
  tokenUri?: string
}

export default function LoginPage() {
  const router = useRouter()
  const [isLoginLoading, setIsLoginLoading] = useState(false)
  const [isVerifyLoading, setIsVerifyLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [flowStep, setFlowStep] = useState<"credentials" | "verification">("credentials")
  const [pendingToken, setPendingToken] = useState<string | null>(null)
  const [pendingEmail, setPendingEmail] = useState<string>("")
  const [userRole, setUserRole] = useState<string | null>(null)
  const [rememberChoice, setRememberChoice] = useState(false)
  const [isGoogleScriptLoaded, setIsGoogleScriptLoaded] = useState(false)
  const [googleConfig, setGoogleConfig] = useState<GoogleOAuthConfig | null>(null)
  const [isGoogleConfigLoading, setIsGoogleConfigLoading] = useState(false)
  const [googleConfigError, setGoogleConfigError] = useState<string | null>(null)
  const codeClientRef = useRef<any>(null)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  })

  const verifyForm = useForm<VerifyFormValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      code: "",
    },
  })

  useEffect(() => {
    let isCancelled = false

    async function fetchGoogleConfig() {
      setIsGoogleConfigLoading(true)
      setGoogleConfigError(null)

      try {
        const response = await fetch(`${API_BASE_URL}/v1/auth/google/config`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        })

        const result = await response
          .json()
          .catch(() => ({ success: false, message: "Invalid response from Google config endpoint." }))

        if (!response.ok || result?.success === false || !result?.data) {
          if (!isCancelled) {
            setGoogleConfig(null)
            setGoogleConfigError(result?.message || "Google sign-in is unavailable right now. Please try again later.")
          }
          return
        }

        const data = result.data as Partial<GoogleOAuthConfig>
        const redirectUris = Array.isArray(data.redirectUris) ? data.redirectUris : []
        const clientId = typeof data.clientId === "string" ? data.clientId : ""

        if (!clientId) {
          if (!isCancelled) {
            setGoogleConfig(null)
            setGoogleConfigError("Google sign-in is not configured. Please contact support.")
          }
          return
        }

        if (!isCancelled) {
          setGoogleConfig({
            clientId,
            redirectUris: redirectUris.length > 0 ? redirectUris : [`${window.location.origin}/auth/callback`],
            javascriptOrigins: Array.isArray(data.javascriptOrigins) ? data.javascriptOrigins : undefined,
            authUri: typeof data.authUri === "string" ? data.authUri : undefined,
            tokenUri: typeof data.tokenUri === "string" ? data.tokenUri : undefined,
          })
        }
      } catch (error) {
        if (!isCancelled) {
          setGoogleConfigError("Unable to reach Google sign-in service. Please check your connection and try again.")
        }
      } finally {
        if (!isCancelled) {
          setIsGoogleConfigLoading(false)
        }
      }
    }

    fetchGoogleConfig()

    return () => {
      isCancelled = true
    }
  }, [])

  useEffect(() => {
    codeClientRef.current = null
  }, [googleConfig?.clientId])

  // Handle credential submission (step 1)
  async function onSubmit(formData: LoginFormValues) {
    setIsLoginLoading(true)
    setLoginError(null)
    setInfoMessage(null)

    try {
      const loginPayload = {
        username: formData.email,
        email: formData.email,
        password: formData.password,
      }

      const response = await fetch(`${API_BASE_URL}/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(loginPayload),
      })

      const contentType = response.headers.get("content-type")
      const isJson = contentType?.includes("application/json")
      const result = isJson ? await response.json() : null

      if (!response.ok || result?.success === false) {
        let errorMessage = result?.message || result?.error || "Login failed. Please try again."

        if (response.status === 404) {
          errorMessage = "Login endpoint not found. The API might not be deployed correctly."
        } else if (response.status === 405) {
          errorMessage = "Login method not allowed. The API endpoint might be incorrect."
        } else if (response.status === 401) {
          errorMessage = errorMessage || "Invalid email or password. Please try again."
        } else if (!response.ok) {
          errorMessage = errorMessage || `Server error (${response.status}). Please try again later.`
        }

        setLoginError(errorMessage)
        return
      }

      const responseData = result?.data
      let nextToken: string | null = null
      let nextRole: string | null = null

      if (Array.isArray(responseData)) {
        nextRole = responseData[0] != null ? String(responseData[0]) : null
        nextToken = responseData[1] != null ? String(responseData[1]) : null
      } else if (responseData && typeof responseData === "object") {
        const dataObj = responseData as Record<string, unknown>
        if (typeof dataObj.accessToken === "string") {
          nextToken = dataObj.accessToken
        }
        if (typeof dataObj.userRole === "string") {
          nextRole = dataObj.userRole
        } else if (typeof dataObj.role === "string") {
          nextRole = dataObj.role
        }
      } else if (typeof responseData === "string") {
        nextToken = responseData
      }

      if (!nextToken) {
        setLoginError("Login succeeded but no verification token was returned. Please contact support.")
        return
      }

      setPendingToken(nextToken)
      setUserRole(nextRole)
      setPendingEmail(formData.email)
      setRememberChoice(Boolean(formData.remember))
      setInfoMessage(result?.message ?? `Login success. Enter the code sent to ${formData.email}.`)
      setFlowStep("verification")
      setLoginError(null)
      verifyForm.reset({ code: "" })
    } catch (error) {
      setLoginError("Failed to connect to the server. Please check your internet connection and try again.")
    } finally {
      setIsLoginLoading(false)
    }
  }

  async function onVerifyCode(formData: VerifyFormValues) {
    if (!pendingToken) {
      setLoginError("Your login session expired. Please sign in again.")
      handleRestart()
      return
    }

    setIsVerifyLoading(true)
    setLoginError(null)
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
          handleRestart()
        }

        setLoginError(errorMessage)
        return
      }

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
      }

      setInfoMessage(result?.message ?? "Verification successful! Redirecting...")
      setLoginError(null)
      router.push("/home")
    } catch (error) {
      setLoginError("Failed to verify the code. Please try again.")
    } finally {
      setIsVerifyLoading(false)
    }
  }

  async function onResendCode() {
    if (!pendingToken) {
      setLoginError("Your login session expired. Please sign in again.")
      handleRestart()
      return
    }

    setIsResending(true)
    setLoginError(null)
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
          handleRestart()
        }

        setLoginError(errorMessage)
        return
      }

      setInfoMessage(result?.message ?? "A new verification code has been sent to your email.")
    } catch (error) {
      setLoginError("Failed to resend the verification code. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  function handleRestart(resetEmail?: string) {
    const preservedEmail = resetEmail ?? pendingEmail
    setFlowStep("credentials")
    setPendingToken(null)
    setPendingEmail("")
    setUserRole(null)
    setInfoMessage(null)

    form.reset({
      email: preservedEmail,
      password: "",
      remember: rememberChoice,
    })

    verifyForm.reset({ code: "" })
  }

  const handleGoogleScriptLoaded = useCallback(() => {
    setIsGoogleScriptLoaded(true)
  }, [])

  const handleGoogleScriptError = useCallback(() => {
    setIsGoogleScriptLoaded(false)
    setGoogleConfigError("Google sign-in script failed to load. Please refresh the page and try again.")
  }, [])

  const handleGoogleSignIn = useCallback(() => {
    setLoginError(null)
    setInfoMessage(null)

    if (googleConfigError) {
      setLoginError(googleConfigError)
      return
    }

    if (!googleConfig) {
      setLoginError("Google sign-in is not available right now. Please try again later.")
      return
    }

    if (!googleConfig.clientId) {
      setLoginError("Google sign-in is misconfigured. Please contact support.")
      return
    }

    if (!isGoogleScriptLoaded) {
      setLoginError("Google sign-in is still loading. Please wait a moment and try again.")
      return
    }

    const googleAuth = (window as any)?.google?.accounts?.oauth2
    if (!googleAuth) {
      setLoginError("Unable to initialize Google sign-in. Please refresh the page and try again.")
      return
    }

    const rememberValue = form.getValues("remember")
    const shouldRemember = Boolean(rememberValue)
    setRememberChoice(shouldRemember)

    try {
      const storagePreference = shouldRemember ? "local" : "session"
      window.sessionStorage.setItem("auth.google.storagePreference", storagePreference)
    } catch (error) {
      // Ignore storage errors (e.g., private mode)
    }

    if (!codeClientRef.current) {
      const redirectUri =
        googleConfig.redirectUris.find((uri) => uri.startsWith(window.location.origin)) ??
        `${window.location.origin}/auth/callback`

      codeClientRef.current = googleAuth.initCodeClient({
        client_id: googleConfig.clientId,
        scope: "openid email profile",
        ux_mode: "redirect",
        redirect_uri: redirectUri,
      })
    }

    codeClientRef.current.requestCode()
  }, [form, googleConfig, googleConfigError, isGoogleScriptLoaded])

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={handleGoogleScriptLoaded}
        onError={handleGoogleScriptError}
      />
      <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4 py-12 overflow-x-hidden">
      {/* App name at the top */}
      <div className="w-full flex justify-center pt-8 pb-4">
        <span className="text-2xl font-extrabold tracking-widest uppercase bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">ELITESCORE</span>
      </div>
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 -z-10 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[100px]" />
        <div className="absolute right-0 top-1/3 -z-10 h-[600px] w-[600px] rounded-full bg-purple-500/10 blur-[100px]" />
      </div>
      <motion.div className="w-full max-w-sm space-y-8" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div className="text-center" variants={itemVariants}>
          <h1 className="text-2xl font-extrabold tracking-widest uppercase bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">Sign In</h1>
          <p className="mt-2 text-white text-sm">Sign in to continue your journey</p>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card className="shadow-2xl rounded-2xl border-0 bg-card/90 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-lg font-extrabold tracking-widest uppercase bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">
                {flowStep === "credentials" ? "Welcome back" : "Verify your login"}
              </CardTitle>
              <CardDescription className="text-white text-sm">
                {flowStep === "credentials"
                  ? "Enter your credentials to access your account"
                  : `Enter the verification code sent to ${pendingEmail || "your email address"}.`}
              </CardDescription>
            </CardHeader>

            {flowStep === "credentials" ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
                  <CardContent className="space-y-4">
                    {loginError && (
                      <Alert variant="destructive" className="animate-shake">
                        <AlertDescription>{loginError}</AlertDescription>
                      </Alert>
                    )}

                    {infoMessage && !loginError && (
                      <Alert>
                        <AlertDescription>{infoMessage}</AlertDescription>
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
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-white text-sm">Password</FormLabel>
                            <Link
                              href="/forgot-password"
                              className="text-xs text-zinc-400 hover:text-[#2bbcff] transition-colors"
                            >
                              Forgot password?
                            </Link>
                          </div>
                          <FormControl>
                            <div className="relative">
                              <Input
                                className="py-3 text-base rounded-xl border border-zinc-700 bg-black/60 text-white focus:ring-2 focus:ring-[#2bbcff] focus:border-[#2bbcff] transition-all"
                                placeholder="Enter your password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="current-password"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 text-zinc-400 hover:text-[#2bbcff] transition-colors"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="remember"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="rounded-md border-zinc-700 focus:ring-[#2bbcff]"
                            />
                          </FormControl>
                          <div className="leading-none">
                            <FormLabel className="text-white text-xs">Remember me for 30 days</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="flex flex-col space-y-4">
                    <Button
                      type="submit"
                      className="w-full py-3 rounded-2xl font-bold bg-gradient-to-r from-[#2bbcff] to-[#a259ff] text-white shadow-lg hover:scale-[1.02] transition-transform"
                      disabled={isLoginLoading}
                    >
                      {isLoginLoading ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          Sign in <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                    <div className="relative w-full flex items-center my-2">
                      <div className="flex-grow border-t border-zinc-700"></div>
                      <span className="mx-2 bg-black px-2 text-xs text-zinc-400">OR</span>
                      <div className="flex-grow border-t border-zinc-700"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full rounded-xl border-zinc-700 text-white hover:bg-zinc-900 transition-colors"
                        onClick={handleGoogleSignIn}
                        disabled={
                          isLoginLoading ||
                          isGoogleConfigLoading ||
                          !googleConfig ||
                          !isGoogleScriptLoaded ||
                          Boolean(googleConfigError)
                        }
                      >
                        {isGoogleConfigLoading
                          ? "Loading..."
                          : googleConfigError
                              ? "Google unavailable"
                              : "Sign in with Google"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full rounded-xl border-zinc-700 text-white hover:bg-zinc-900 transition-colors"
                        disabled={isLoginLoading}
                      >
                        GitHub
                      </Button>
                    </div>
                    {!isGoogleConfigLoading && googleConfigError && (
                      <p className="text-center text-xs text-red-400">
                        {googleConfigError}
                      </p>
                    )}
                    <div className="text-center text-xs text-zinc-400">
                      Don't have an account?{" "}
                      <Link href="/signup" className="text-zinc-400 hover:text-[#2bbcff] transition-colors">
                        Sign up
                      </Link>
                    </div>
                  </CardFooter>
                </form>
              </Form>
            ) : (
              <Form {...verifyForm}>
                <form onSubmit={verifyForm.handleSubmit(onVerifyCode)} className="space-y-0">
                  <CardContent className="space-y-4">
                    {loginError && (
                      <Alert variant="destructive" className="animate-shake">
                        <AlertDescription>{loginError}</AlertDescription>
                      </Alert>
                    )}

                    {infoMessage && !loginError && (
                      <Alert>
                        <AlertDescription>{infoMessage}</AlertDescription>
                      </Alert>
                    )}

                    <div className="rounded-xl border border-[#2bbcff]/30 bg-black/40 p-4 text-xs text-zinc-300">
                      We just emailed a one-time code to{" "}
                      <span className="font-semibold text-white">{pendingEmail}</span>. Enter it below to finish signing in.
                    </div>

                    <FormField
                      control={verifyForm.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-white text-sm text-center">Verification code</FormLabel>
                          <FormControl>
                            <InputOTP
                              ref={field.ref}
                              value={field.value ?? ""}
                              onChange={(value) => {
                                const sanitized = value.replace(/\D/g, "").slice(0, 6)
                                field.onChange(sanitized)
                              }}
                              onBlur={field.onBlur}
                              maxLength={6}
                              inputMode="numeric"
                              pattern="[0-9]*"
                              autoFocus
                              aria-label="Six digit verification code"
                              containerClassName="w-full justify-center gap-2"
                            >
                              <InputOTPGroup className="flex gap-2">
                                {Array.from({ length: 6 }).map((_, index) => (
                                  <InputOTPSlot
                                    key={index}
                                    index={index}
                                    className="h-12 w-12 rounded-xl border border-zinc-700 bg-black/60 text-lg font-semibold text-white shadow-sm"
                                  />
                                ))}
                              </InputOTPGroup>
                            </InputOTP>
                          </FormControl>
                          <FormMessage />
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
                      onClick={() => handleRestart()}
                      disabled={isVerifyLoading || isResending}
                    >
                      Use a different account
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            )}
          </Card>
        </motion.div>
        <motion.div className="flex items-center justify-center text-xs text-zinc-500" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <Lock className="h-3 w-3 mr-1" />
          <span>Secure login • 256-bit encryption</span>
        </motion.div>
      </motion.div>
      </div>
    </>
  )
}

