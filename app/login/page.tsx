"use client"

import { useState } from "react"
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
import { Separator } from "@/components/ui/separator"
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

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  })

  // Handle form submission
  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true)
    setLoginError(null)

    try {
      // Prepare login payload - exactly matching JSON structure
      const loginPayload = {
        username: data.email,
        password: data.password,
      }
      
      console.log('Login request payload:', JSON.stringify(loginPayload, null, 2))
      
      // Call the actual login API
      const response = await fetch('https://elite-score-a31a0334b58d.herokuapp.com/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(loginPayload),
      })
      
      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type')
      const isJson = contentType?.includes('application/json')

      if (!response.ok) {
        // Try to get the actual error message from the API
        let errorMessage = 'Login failed. Please try again.'
        
        if (isJson) {
          try {
            const result = await response.json()
            console.log('API Error Response:', result)
            errorMessage = result.message || result.error || errorMessage
          } catch (e) {
            console.error('Failed to parse error response:', e)
          }
        } else {
          const text = await response.text()
          console.error('Server error response:', text)
        }
        
        // Handle different error status codes
        if (response.status === 404) {
          setLoginError('Login endpoint not found. The API might not be deployed correctly.')
        } else if (response.status === 405) {
          setLoginError('Login method not allowed. The API endpoint might be incorrect.')
        } else if (response.status === 401) {
          setLoginError(errorMessage || 'Invalid email or password. Please try again.')
        } else {
          setLoginError(errorMessage || `Server error (${response.status}). Please try again later.`)
        }
        setIsLoading(false)
        return
      }

      // Parse successful response
      const result = isJson ? await response.json() : { success: true }
      console.log('Login successful:', result)
      
      // Redirect to home page on success
      router.push("/home")
      
    } catch (error) {
      console.error('Error during login:', error)
      setLoginError('Failed to connect to the server. Please check your internet connection and try again.')
      setIsLoading(false)
    }
  }

  return (
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
              <CardTitle className="text-lg font-extrabold tracking-widest uppercase bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">Welcome back</CardTitle>
              <CardDescription className="text-white text-sm">Enter your credentials to access your account</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form className="space-y-4">
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
                          <Input className="py-3 text-base rounded-xl border border-zinc-700 bg-black/60 text-white focus:ring-2 focus:ring-[#2bbcff] focus:border-[#2bbcff] transition-all" placeholder="john@example.com" type="email" {...field} />
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
                          <Link href="/forgot-password" className="text-xs text-zinc-400 hover:text-[#2bbcff] transition-colors">Forgot password?</Link>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <Input className="py-3 text-base rounded-xl border border-zinc-700 bg-black/60 text-white focus:ring-2 focus:ring-[#2bbcff] focus:border-[#2bbcff] transition-all" placeholder="Enter your password" type={showPassword ? "text" : "password"} {...field} />
                            <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 text-zinc-400 hover:text-[#2bbcff] transition-colors" onClick={() => setShowPassword(!showPassword)}>
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
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} className="rounded-md border-zinc-700 focus:ring-[#2bbcff]" />
                        </FormControl>
                        <div className="leading-none">
                          <FormLabel className="text-white text-xs">Remember me for 30 days</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button className="w-full py-3 rounded-2xl font-bold bg-gradient-to-r from-[#2bbcff] to-[#a259ff] text-white shadow-lg hover:scale-[1.02] transition-transform" onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
                {isLoading ? (
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
                <Button variant="outline" className="w-full rounded-xl border-zinc-700 text-white hover:bg-zinc-900 transition-colors" disabled={isLoading}>Google</Button>
                <Button variant="outline" className="w-full rounded-xl border-zinc-700 text-white hover:bg-zinc-900 transition-colors" disabled={isLoading}>GitHub</Button>
              </div>
              <div className="text-center text-xs text-zinc-400">
                Don't have an account?{' '}
                <Link href="/signup" className="text-zinc-400 hover:text-[#2bbcff] transition-colors">Sign up</Link>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
        <motion.div className="flex items-center justify-center text-xs text-zinc-500" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <Lock className="h-3 w-3 mr-1" />
          <span>Secure login • 256-bit encryption</span>
        </motion.div>
      </motion.div>
    </div>
  )
}

