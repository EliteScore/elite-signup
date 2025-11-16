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

const API_BASE_URL = "https://elitescore-auth-fafc42d40d58.herokuapp.com/"

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
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
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

  useEffect(() => {
    let isCancelled = false

    async function fetchGoogleConfig() {
      setIsGoogleConfigLoading(true)
      setGoogleConfigError(null)

      try {
        const response = await fetch(`${API_BASE_URL}v1/auth/google/config`, {
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
            setGoogleConfigError(result?.message || "Google sign-in is unavailable right now.")
          }
          return
        }

        const data = result.data as Partial<GoogleOAuthConfig>
        const redirectUris = Array.isArray(data.redirectUris) ? data.redirectUris : []
        const clientId = typeof data.clientId === "string" ? data.clientId : ""

        if (!clientId) {
          if (!isCancelled) {
            setGoogleConfig(null)
            setGoogleConfigError("Google sign-in is not configured.")
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
          setGoogleConfigError("Unable to reach Google sign-in service.")
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

  // Handle credential submission
  async function onSubmit(formData: LoginFormValues) {
    setIsLoginLoading(true)
    setLoginError(null)

    try {
      const statusResponse = await fetch(`${API_BASE_URL}v1/status`, {
        method: "GET",
      })

      if (!statusResponse.ok) {
        throw new Error("Service unavailable")
      }

      const loginPayload = {
        username: formData.email,
        email: formData.email,
        password: formData.password,
      }

        const response = await fetch(`${API_BASE_URL}v1/auth/login`, {
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
        } else if (response.status === 429) {
          errorMessage = errorMessage || "Too many attempts. Please try again later."
        } else if (!response.ok) {
          errorMessage = errorMessage || `Server error (${response.status}). Please try again later.`
        }

        setLoginError(errorMessage)
        return
      }

      const responseData = result?.data
      let tempToken: string | null = null
      let userRole: string | null = null

      if (Array.isArray(responseData)) {
        userRole = responseData[0] != null ? String(responseData[0]) : null
        tempToken = responseData[1] != null ? String(responseData[1]) : null
      } else if (responseData && typeof responseData === "object") {
        const dataObj = responseData as Record<string, unknown>
        if (typeof dataObj.accessToken === "string") {
          tempToken = dataObj.accessToken
        }
        if (typeof dataObj.userRole === "string") {
          userRole = dataObj.userRole
        } else if (typeof dataObj.role === "string") {
          userRole = dataObj.role
        }
      } else if (typeof responseData === "string") {
        tempToken = responseData
      }

      if (!tempToken) {
        setLoginError("Login succeeded but no verification token was returned. Please contact support.")
        return
      }

      // Store verification session data
      sessionStorage.setItem("verify.tempToken", tempToken)
      sessionStorage.setItem("verify.email", formData.email)
      if (userRole) sessionStorage.setItem("verify.role", userRole)
      sessionStorage.setItem("verify.remember", String(formData.remember))
      sessionStorage.setItem("verify.message", result?.message || "")

      // Redirect to verification page
      router.push("/verify")
    } catch (error) {
      setLoginError("Failed to connect to the server. Please check your internet connection and try again.")
    } finally {
      setIsLoginLoading(false)
    }
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

    try {
      const storagePreference = shouldRemember ? "local" : "session"
      window.sessionStorage.setItem("auth.google.storagePreference", storagePreference)
    } catch (error) {
      // Ignore storage errors
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
              Sign In
            </h1>
            <p className="mt-2 text-white text-sm">Sign in to continue your journey</p>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="shadow-2xl rounded-2xl border-0 bg-card/90 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-lg font-extrabold tracking-widest uppercase bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">
                  Welcome back
                </CardTitle>
                <CardDescription className="text-white text-sm">
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
                  <CardContent className="space-y-4">
                    {loginError && (
                      <Alert variant="destructive" className="animate-shake">
                        <AlertDescription>{loginError}</AlertDescription>
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
                      {isGoogleConfigLoading ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <svg
                            className="mr-2 h-4 w-4"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                            focusable="false"
                          >
                            <path
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              fill="#4285F4"
                            />
                            <path
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              fill="#34A853"
                            />
                            <path
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                              fill="#FBBC05"
                            />
                            <path
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                              fill="#EA4335"
                            />
                            <path d="M1 1h22v22H1z" fill="none" />
                          </svg>
                          {googleConfigError ? "Google unavailable" : "Sign in with Google"}
                        </>
                      )}
                    </Button>

                    {!isGoogleConfigLoading && googleConfigError && (
                      <p className="text-center text-xs text-red-400">{googleConfigError}</p>
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
    </>
  )
}
