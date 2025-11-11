"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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

const API_BASE_URL = "https://elite-score-a31a0334b58d.herokuapp.com"

const forgotPasswordSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  async function onSubmit(data: ForgotPasswordFormValues) {
    setIsLoading(true)
    setError(null)

    try {
      // Quick availability check before requesting the reset
      const statusResponse = await fetch(`${API_BASE_URL}/v1/status`, {
        method: "GET",
      })

      if (!statusResponse.ok) {
        throw new Error("Service unavailable")
      }

      const response = await fetch(`${API_BASE_URL}/v1/auth/forgot-password`, {
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
                Reset your password
              </CardTitle>
              <CardDescription className="text-white text-sm">
                Enter your email address and we'll send you a link to reset your password
              </CardDescription>
            </CardHeader>

            {!success ? (
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

