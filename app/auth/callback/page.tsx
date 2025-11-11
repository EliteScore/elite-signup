"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

const API_BASE_URL = "https://elite-score-a31a0334b58d.herokuapp.com"

type GoogleExchangeResult =
  | {
      success: true
      message?: string
      data: unknown
    }
  | {
      success: false
      message?: string
      data?: unknown
    }

export default function GoogleCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading")
  const [message, setMessage] = useState("Finalizing your Google sign-in...")

  useEffect(() => {
    let redirectTimeout: number | undefined
    let isMounted = true

    async function finalizeGoogleLogin() {
      const searchParams = new URLSearchParams(window.location.search)
      const errorParam = searchParams.get("error")
      const errorDescription = searchParams.get("error_description")
      const code = searchParams.get("code")

      if (!isMounted) return

      if (errorParam) {
        if (!isMounted) return
        setStatus("error")
        setMessage(
          decodeURIComponent(errorDescription || errorParam || "Google sign-in was cancelled or failed.")
        )
        return
      }

      if (!code) {
        if (!isMounted) return
        setStatus("error")
        setMessage("No authorization code was returned from Google. Please try signing in again.")
        return
      }

      setStatus("loading")
      setMessage("Exchanging Google authorization code...")

      const redirectUri = `${window.location.origin}/auth/callback`
      let result: GoogleExchangeResult | null = null
      let responseOk = false

      try {
        const response = await fetch(`${API_BASE_URL}/v1/auth/google`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            code,
            redirectUri,
          }),
        })

        responseOk = response.ok
        result = await response.json().catch(() => null)
      } catch (error) {
        if (!isMounted) return
        setStatus("error")
        setMessage("We were unable to reach the server. Please check your connection and try again.")
        return
      }

      if (!isMounted) return

      if (!responseOk || !result || result.success === false) {
        setStatus("error")
        setMessage(result?.message || "Google sign-in failed. Please try again.")
        return
      }

      let accessToken: string | null = null
      let refreshToken: string | null = null
      let userRole: string | null = null
      let email: string | null = null

      const data = result.data
      if (Array.isArray(data)) {
        userRole = data[0] != null ? String(data[0]) : null
        accessToken = data[1] != null ? String(data[1]) : null
        refreshToken = data[2] != null ? String(data[2]) : null
      } else if (data && typeof data === "object") {
        const dataObj = data as Record<string, unknown>
        if (typeof dataObj.accessToken === "string") {
          accessToken = dataObj.accessToken
        }
        if (typeof dataObj.refreshToken === "string") {
          refreshToken = dataObj.refreshToken
        }
        if (typeof dataObj.userRole === "string") {
          userRole = dataObj.userRole
        } else if (typeof dataObj.role === "string") {
          userRole = dataObj.role
        }
        if (typeof dataObj.email === "string") {
          email = dataObj.email
        }
      } else if (typeof data === "string") {
        accessToken = data
      }

      if (!accessToken) {
        setStatus("error")
        setMessage("Login completed but no access token was returned. Please contact support.")
        return
      }

      let storagePreference = "session"
      try {
        storagePreference = window.sessionStorage.getItem("auth.google.storagePreference") || "session"
      } catch (error) {
        storagePreference = "session"
      }

      const storage = storagePreference === "local" ? window.localStorage : window.sessionStorage

      try {
        storage.setItem("auth.accessToken", accessToken)
        if (refreshToken) {
          storage.setItem("auth.refreshToken", refreshToken)
        }
        if (userRole) {
          storage.setItem("auth.userRole", userRole)
        }
        if (email) {
          storage.setItem("auth.email", email)
        }
      } catch (error) {
        // If storage fails, fall back to session storage
        try {
          window.sessionStorage.setItem("auth.accessToken", accessToken)
          if (refreshToken) {
            window.sessionStorage.setItem("auth.refreshToken", refreshToken)
          }
          if (userRole) {
            window.sessionStorage.setItem("auth.userRole", userRole)
          }
          if (email) {
            window.sessionStorage.setItem("auth.email", email)
          }
        } catch (innerError) {
          setStatus("error")
          setMessage("We couldn't securely store your session. Please check your browser settings and try again.")
          return
        }
      } finally {
        try {
          window.sessionStorage.removeItem("auth.google.storagePreference")
        } catch (error) {
          // ignore
        }
      }

      setStatus("success")
      setMessage(result.message || "Google sign-in successful! Redirecting to your dashboard...")

      redirectTimeout = window.setTimeout(() => {
        router.push("/home")
      }, 1200)
    }

    finalizeGoogleLogin()

    return () => {
      isMounted = false
      if (redirectTimeout) {
        window.clearTimeout(redirectTimeout)
      }
    }
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black px-6 py-12 text-white">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950/80 p-10 text-center shadow-2xl">
        <h1 className="text-2xl font-bold tracking-widest uppercase bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">
          Finishing Sign-In
        </h1>
        <p className="mt-4 text-sm text-zinc-300">{message}</p>

        {status === "loading" && (
          <div className="mt-6 flex justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2bbcff] border-t-transparent" />
          </div>
        )}

        {status === "error" && (
          <div className="mt-6 space-y-4">
            <Button
              type="button"
              className="w-full rounded-2xl bg-gradient-to-r from-[#2bbcff] to-[#a259ff] text-white"
              onClick={() => router.push("/login")}
            >
              Back to login
            </Button>
          </div>
        )}

        {status === "success" && (
          <p className="mt-6 text-xs uppercase tracking-widest text-zinc-400">Redirecting...</p>
        )}
      </div>
    </div>
  )
}


