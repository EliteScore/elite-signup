"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Eye, EyeOff, ArrowRight, Check, X, Lock } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
// Removed import of Separator due to missing module

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
const signupSchema = z
  .object({
    name: z.string().min(2, {
      message: "Name must be at least 2 characters.",
    }),
    email: z.string().email({
      message: "Please enter a valid email address.",
    }),
    password: z
      .string()
      .min(8, {
        message: "Password must be at least 8 characters.",
      })
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter.",
      })
      .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter.",
      })
      .regex(/[0-9]/, {
        message: "Password must contain at least one number.",
      }),
    confirmPassword: z.string(),
    terms: z.boolean().refine((val) => val === true, {
      message: "You must agree to the terms and conditions.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

type SignupFormValues = z.infer<typeof signupSchema>

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 2

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
    mode: "onChange",
  })

  // Calculate password strength
  useEffect(() => {
    const password = form.watch("password")
    if (!password) {
      setPasswordStrength(0)
      return
    }

    let strength = 0
    // Length check
    if (password.length >= 8) strength += 25
    // Uppercase check
    if (/[A-Z]/.test(password)) strength += 25
    // Lowercase check
    if (/[a-z]/.test(password)) strength += 25
    // Number check
    if (/[0-9]/.test(password)) strength += 25

    setPasswordStrength(strength)
  }, [form.watch("password")])

  // Get strength color
  const getStrengthColor = () => {
    if (passwordStrength <= 25) return "bg-red-500"
    if (passwordStrength <= 50) return "bg-orange-500"
    if (passwordStrength <= 75) return "bg-yellow-500"
    return "bg-green-500"
  }

  // Get strength text
  const getStrengthText = () => {
    if (passwordStrength <= 25) return "Weak"
    if (passwordStrength <= 50) return "Fair"
    if (passwordStrength <= 75) return "Good"
    return "Strong"
  }

  // Handle form submission
  async function onSubmit(data: SignupFormValues) {
    setIsLoading(true)

    try {
      // Call the actual registration API
      const response = await fetch('https://elite-score-a31a0334b58d.herokuapp.com/v1/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: data.name,
          email: data.email,
          password: data.password,
        }),
      })

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type')
      const isJson = contentType?.includes('application/json')

      if (!response.ok) {
        // Handle different error status codes
        if (response.status === 404) {
          alert('Registration endpoint not found. The API might not be deployed correctly.')
        } else if (response.status === 405) {
          alert('Registration method not allowed. The API endpoint might be incorrect.')
        } else if (isJson) {
          const result = await response.json()
          alert(result.message || 'Registration failed. Please try again.')
        } else {
          const text = await response.text()
          console.error('Server error:', text)
          alert(`Server error (${response.status}). Please try again later.`)
        }
        setIsLoading(false)
        return
      }

      // Parse successful response
      const result = isJson ? await response.json() : { success: true }
      console.log('Registration successful:', result)
      
      // Redirect to home page on success
      router.push("/home")
      
    } catch (error) {
      console.error('Error during registration:', error)
      alert('Failed to connect to the server. Please check your internet connection and try again.')
      setIsLoading(false)
    }
  }

  // Handle next step
  const handleNextStep = async () => {
    const isValid = await form.trigger(["name", "email"])
    if (isValid) setCurrentStep(2)
  }

  // Handle previous step
  const handlePrevStep = () => {
    setCurrentStep(1)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4 py-12 overflow-x-hidden">
      {/* App name at the top */}
      <div className="w-full flex justify-center pt-8 pb-6">
        <span className="text-2xl font-extrabold tracking-widest uppercase bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">ELITESCORE</span>
      </div>
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 -z-10 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[100px]" />
        <div className="absolute right-0 top-1/3 -z-10 h-[600px] w-[600px] rounded-full bg-purple-500/10 blur-[100px]" />
      </div>
      <motion.div className="w-full max-w-sm space-y-8" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div className="text-center" variants={itemVariants}>
          <h1 className="text-2xl font-extrabold tracking-widest uppercase bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">Sign Up</h1>
          <p className="mt-2 text-white text-sm">Create your account and start your journey</p>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card className="shadow-2xl rounded-2xl border-0 bg-card/90 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-lg font-extrabold tracking-widest uppercase bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">Create an account</CardTitle>
              <CardDescription className="text-white text-sm">{currentStep === 1 ? "Enter your basic information" : "Set up your password"}</CardDescription>
              {/* Progress indicator */}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Step {currentStep} of {totalSteps}</span>
                  <span>{currentStep === 1 ? "Basic Info" : "Security"}</span>
                </div>
                <div className="h-1 w-full bg-zinc-800 overflow-hidden rounded-full">
                  <motion.div className="h-full bg-gradient-to-r from-[#2bbcff] to-[#a259ff]" initial={{ width: `${((currentStep - 1) / totalSteps) * 100}%` }} animate={{ width: `${(currentStep / totalSteps) * 100}%` }} transition={{ duration: 0.3 }} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form className="space-y-4">
                  {currentStep === 1 ? (
                    <>
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white text-sm">Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" className="py-3 text-base" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white text-sm">Email</FormLabel>
                            <FormControl>
                              <Input placeholder="john@example.com" type="email" className="py-3 text-base" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  ) : (
                    <>
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white text-sm">Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  placeholder="Create a password"
                                  type={showPassword ? "text" : "password"}
                                  className="py-3 text-base"
                                  {...field}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-0 top-0 h-full px-3 text-zinc-400 hover:text-white transition-colors"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                            </FormControl>

                            {/* Password strength indicator */}
                            {field.value && (
                              <div className="mt-2 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-zinc-400">Password strength:</span>
                                  <span className="text-xs font-medium">{getStrengthText()}</span>
                                </div>
                                <Progress
                                  value={passwordStrength}
                                  className="h-1"
                                  indicatorClassName={getStrengthColor()}
                                />

                                {/* Password requirements */}
                                <div className="mt-2 grid grid-cols-2 gap-1">
                                  <div className="flex items-center text-xs">
                                    {/[A-Z]/.test(field.value) ? (
                                      <Check className="h-3 w-3 text-green-500 mr-1" />
                                    ) : (
                                      <X className="h-3 w-3 text-zinc-400 mr-1" />
                                    )}
                                    <span
                                      className={
                                        /[A-Z]/.test(field.value) ? "text-white" : "text-zinc-400"
                                      }
                                    >
                                      Uppercase letter
                                    </span>
                                  </div>
                                  <div className="flex items-center text-xs">
                                    {/[a-z]/.test(field.value) ? (
                                      <Check className="h-3 w-3 text-green-500 mr-1" />
                                    ) : (
                                      <X className="h-3 w-3 text-zinc-400 mr-1" />
                                    )}
                                    <span
                                      className={
                                        /[a-z]/.test(field.value) ? "text-white" : "text-zinc-400"
                                      }
                                    >
                                      Lowercase letter
                                    </span>
                                  </div>
                                  <div className="flex items-center text-xs">
                                    {/[0-9]/.test(field.value) ? (
                                      <Check className="h-3 w-3 text-green-500 mr-1" />
                                    ) : (
                                      <X className="h-3 w-3 text-zinc-400 mr-1" />
                                    )}
                                    <span
                                      className={
                                        /[0-9]/.test(field.value) ? "text-white" : "text-zinc-400"
                                      }
                                    >
                                      Number
                                    </span>
                                  </div>
                                  <div className="flex items-center text-xs">
                                    {field.value.length >= 8 ? (
                                      <Check className="h-3 w-3 text-green-500 mr-1" />
                                    ) : (
                                      <X className="h-3 w-3 text-zinc-400 mr-1" />
                                    )}
                                    <span
                                      className={field.value.length >= 8 ? "text-white" : "text-zinc-400"}
                                    >
                                      8+ characters
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white text-sm">Confirm Password</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Confirm your password"
                                type={showPassword ? "text" : "password"}
                                className="py-3 text-base"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="terms"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-zinc-700 p-4">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-zinc-400 text-xs">
                                I agree to the{" "}
                                <Link href="/terms" className="text-zinc-400 hover:text-[#2bbcff] transition-colors">
                                  Terms of Service
                                </Link>{" "}
                                and{" "}
                                <Link href="/privacy" className="text-zinc-400 hover:text-[#2bbcff] transition-colors">
                                  Privacy Policy
                                </Link>
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              {currentStep === 1 ? (
                <Button
                  className="w-full py-3 rounded-2xl font-bold bg-gradient-to-r from-[#2bbcff] to-[#a259ff] text-white shadow-lg hover:scale-[1.02] transition-transform"
                  onClick={handleNextStep}
                  disabled={isLoading}
                >
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <div className="flex flex-col gap-2 w-full">
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
                        Create account <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={handlePrevStep} disabled={isLoading}>
                    Back
                  </Button>
                </div>
              )}

              <div className="relative w-full flex items-center my-2">
                <div className="flex-grow border-t border-zinc-700"></div>
                <span className="mx-2 bg-card px-2 text-xs text-zinc-400">OR CONTINUE WITH</span>
                <div className="flex-grow border-t border-zinc-700"></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="w-full" disabled={isLoading}>
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
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
                  Google
                </Button>
                <Button variant="outline" className="w-full" disabled={isLoading}>
                  <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  GitHub
                </Button>
              </div>

              <div className="text-center text-sm text-zinc-400">
                Already have an account?{" "}
                <Link href="/login" className="text-zinc-400 hover:text-[#2bbcff] transition-colors">
                  Log in
                </Link>
              </div>
            </CardFooter>
          </Card>
        </motion.div>

        <motion.div
          className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
        >
          <motion.div
            className="flex items-center space-x-2 rounded-lg border border-zinc-700 bg-card/80 p-4 backdrop-blur-sm"
            variants={itemVariants}
          >
            <div className="rounded-full bg-primary/20 p-2">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-primary"
              >
                <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="currentColor" />
              </svg>
            </div>
            <span className="text-sm">Personalized improvement plans</span>
          </motion.div>
          <motion.div
            className="flex items-center space-x-2 rounded-lg border border-zinc-700 bg-card/80 p-4 backdrop-blur-sm"
            variants={itemVariants}
          >
            <div className="rounded-full bg-primary/20 p-2">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-primary"
              >
                <path
                  d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l4.59-4.59L18 11l-6 6z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <span className="text-sm">Track your progress with analytics</span>
          </motion.div>
          <motion.div
            className="flex items-center space-x-2 rounded-lg border border-zinc-700 bg-card/80 p-4 backdrop-blur-sm"
            variants={itemVariants}
          >
            <div className="rounded-full bg-primary/20 p-2">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-primary"
              >
                <path
                  d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <span className="text-sm">Connect with like-minded people</span>
          </motion.div>
        </motion.div>

        {/* Security badge */}
        <motion.div
          className="flex items-center justify-center text-xs text-zinc-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Lock className="h-3 w-3 mr-1" />
          <span>Your data is secure and encrypted</span>
        </motion.div>
      </motion.div>
    </div>
  )
}

