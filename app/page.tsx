"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, useInView } from "framer-motion"
import { ArrowRight, CheckCircle, Trophy, Users, BarChart2, Zap, Star, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { cn } from "@/lib/utils"

// Remove lazy loading for now to debug performance
// const AnimatedCounter = lazy(() => import("@/components/ui/animated-counter"))

// Optimized animation variants with reduced motion support
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      when: "beforeChildren",
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
      stiffness: 100,
      damping: 15,
    },
  },
}

// Testimonial data
  const testimonials = [
  {
    name: "Calin Baculescu",
    role: "Tech Lead Developer",
    image: "/calin.jpeg",
    content:
      "Developing this app has deepened my understanding of self-improvement. If you’re ready to elevate your life, try our product and you’ll see the difference.",
    rating: 5,
  },
  {
    name: "Taksh Dange",
    role: "Founder",
    image: "/taksh.jpeg",
    content:
      "With EliteScore, I want to help everyone achieve their goals and stay motivated. Learn from the best, keep dreaming, keep achieving.",
    rating: 5,
  },
  {
    name: "Givanna Lopez",
    role: "Marketing Lead & Strategist",
    image: "/givanna.jpeg",
    content:
      "Help design the experience you want: motivating quests, fair leaderboards, and a Resume Score™ you’re proud to show.",
    rating: 5,
  },
]

// Feature data
  const features = [
  {
      title: "AI Resume Score Analysis",
      description:
        "Upload your résumé to get an instant Resume Score plus personalized, actionable fixes that raise your score fast.",
    icon: BarChart2,
  },
      {
      title: "Connect & Learn from Peers",
      description:
        "Connect with like-minded individuals, see how others got into their dream universities and jobs, and learn from their resume strategies.",
      icon: Users,
    },
  {
    title: "Gamified Challenges",
    description:
        "Turn goals into daily and monthly challenges so you never lose momentum.",
    icon: Zap,
  },
  {
    title: "Leaderboards & Rankings",
      description: "Compete with friends and peers on dynamic leaderboards that showcase your progress in real time.",
    icon: Trophy,
  },
]

// Stats data
  const stats = [
  { label: "Target Launch", value: 2025, suffix: "" },
  { label: "Founding Beta Spots", value: 200, suffix: "" },
  { label: "Core Features at Beta", value: 12, suffix: "+" },
  { label: "Referral Perks", value: 3, suffix: "+" },
]

// Simple static background for better performance
function SimpleBackground() {
  return null // Remove all background elements that cause divisions
}

// Interactive stat card component with enhanced animations
function StatCard({ stat, index }: { stat: typeof stats[0], index: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [isHovered, setIsHovered] = useState(false)
  const [count, setCount] = useState(0)
  
  // Animate the counter when in view
  useEffect(() => {
    if (isInView) {
      const duration = 2000 // 2 seconds
      const steps = 60
      const increment = stat.value / steps
      let current = 0
      
      const timer = setInterval(() => {
        current += increment
        if (current >= stat.value) {
          setCount(stat.value)
          clearInterval(timer)
        } else {
          setCount(Math.floor(current))
        }
      }, duration / steps)
      
      return () => clearInterval(timer)
    }
  }, [isInView, stat.value])
  
  return (
    <motion.div
      ref={ref}
      className="relative group cursor-pointer"
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.8 }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.15,
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ 
        scale: 1.05,
        y: -5,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10 rounded-2xl border border-white/10 group-hover:border-white/20 transition-all duration-300"
        animate={{
          boxShadow: isHovered 
            ? "0 0 30px rgba(43, 188, 255, 0.3)" 
            : "0 0 0px rgba(43, 188, 255, 0)"
        }}
        transition={{ duration: 0.3 }}
      />
      
      <div className="relative p-6">
        <motion.div 
          className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent"
          animate={{
            scale: isHovered ? [1, 1.05, 1] : 1,
          }}
          transition={{
            duration: 0.5,
            repeat: isHovered ? Infinity : 0,
          }}
        >
          {count.toLocaleString()}{stat.suffix}
        </motion.div>
        
        <motion.div 
          className="text-lg text-zinc-300 mt-2 font-medium"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: index * 0.2 + 0.3 }}
        >
          {stat.label}
        </motion.div>
        
        <motion.div 
          className="mt-4 w-full bg-white/10 rounded-full h-1 overflow-hidden"
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 1, delay: index * 0.2 + 0.5 }}
        >
          <motion.div 
            className="bg-gradient-to-r from-[#2bbcff] to-[#a259ff] h-1 rounded-full"
            initial={{ width: 0 }}
            animate={isInView ? { 
              width: `${Math.min(100, (stat.value / 1000000) * 100)}%` 
            } : { width: 0 }}
            transition={{ 
              duration: 1.5, 
              delay: index * 0.2 + 0.8,
              ease: "easeOut"
            }}
            style={{
              boxShadow: isHovered 
                ? "0 0 10px rgba(43, 188, 255, 0.5)" 
                : "none"
            }}
          />
        </motion.div>
      </div>
    </motion.div>
  )
}



// Simple wrapper without parallax for better performance
function SimpleSection({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

export default function HomePage() {
  const [formData, setFormData] = useState({ name: '', email: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    // Client-side validation
    const trimmedName = formData.name.trim()
    const trimmedEmail = formData.email.trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!trimmedName || !trimmedEmail) {
      setErrorMessage('Please provide both your name and email address.')
      return
    }

    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.')
      return
    }

    setIsSubmitting(true)

    try {
      // Call the backend API
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "https://elitescore-auth-fafc42d40d58.herokuapp.com/").replace(/\/$/, "")
      const response = await fetch(`${apiUrl}/v1/auth/pre-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: trimmedName,
          email: trimmedEmail
        })
      })

      const data = await response.json()

      if (response.ok) {
        setIsSubmitted(true)
        // Reset form after 3 seconds
        setTimeout(() => {
          setIsSubmitted(false)
          setFormData({ name: '', email: '' })
        }, 3000)
      } else {
        // Handle server errors (e.g., user already exists)
        setErrorMessage(data.message || 'An unexpected error occurred. Please try again.')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      setErrorMessage('Failed to connect to server. Please try again later.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/40 to-blue-950/30 overflow-x-hidden">

      
      {/* App name at the top */}
      <motion.div 
        className="w-full flex justify-center pt-8 pb-6 relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <span className="text-2xl font-extrabold tracking-widest uppercase bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">
          ELITESCORE
        </span>
      </motion.div>

      {/* Simple Background */}
      <SimpleBackground />

            {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto max-w-7xl px-4">
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-[60vh] lg:min-h-[70vh]"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="space-y-8 lg:space-y-12 text-center lg:text-left" variants={itemVariants}>
              <div className="space-y-6 lg:space-y-8">
                <motion.div 
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 text-orange-300 text-sm font-medium"
                  whileHover={{ scale: 1.05, borderColor: "rgba(249, 115, 22, 0.5)" }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                    Beta Launch - September 2025
                </motion.div>
                
                <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-widest uppercase leading-tight">
                  <span className="bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">
                    UNLOCK YOUR
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-[#a259ff] to-[#2bbcff] bg-clip-text text-transparent">
                    POTENTIAL
                  </span>
                  </h1>
                
                <p className="text-lg sm:text-xl md:text-2xl text-zinc-200 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  Get an instant AI Resume Score, unlock personalized challenges, and connect with peers who've achieved their goals. Join the Community and start working on your goals today.
                </p>
                
                {/* Pre-launch note (no social proof yet) */}
                <motion.div 
                  className="flex items-center gap-2 text-sm text-zinc-400 justify-center lg:justify-start"
                  whileHover={{ x: 5 }}
                >
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>Founding beta — help shape EliteScore with your feedback</span>
                </motion.div>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="lg"
                      className="py-4 sm:py-5 px-8 sm:px-10 rounded-2xl font-bold bg-gradient-to-r from-[#2bbcff] to-[#a259ff] text-white shadow-lg hover:shadow-[0_0_40px_rgba(43,188,255,0.5)] relative overflow-hidden group"
                    onClick={() => document.getElementById('beta-signup')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                      <span className="relative z-10">Join Beta Waitlist</span>
                      <ArrowRight className="ml-3 h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                      <div className="absolute inset-0 bg-gradient-to-r from-[#a259ff] to-[#2bbcff] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Button>
                  </motion.div>
                  
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="lg"
                    variant="outline"
                      className="py-4 sm:py-5 px-8 sm:px-10 rounded-2xl font-bold border-zinc-600 text-white hover:bg-zinc-800/50 hover:border-zinc-500 transition-all duration-300"
                    onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                      <span className="text-base sm:text-lg">Learn More</span>
                  </Button>
                  </motion.div>
                </div>
                
                {/* Trust indicators */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-zinc-400 justify-center lg:justify-start">
                  {["No credit card required", "Free beta access", "September 2025 launch"].map((text, i) => (
                    <motion.div
                      key={text}
                      className="flex items-center gap-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                    >
                    <CheckCircle className="h-4 w-4 text-green-400" />
                      <span>{text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
              </motion.div>

            <SimpleSection>
                          <motion.div 
              className="flex items-center justify-center relative"
              variants={itemVariants}
            >
              <div className="relative">
                {/* Enhanced background effects */}
                  <div className="absolute inset-0 bg-black/50 rounded-full blur-3xl"></div>
                  
                
                
                <Image
                  src="/ChatGPT Image Aug 5, 2025, 07_26_16 AM.png"
                  alt="EliteScore logo with high-quality gradient dotted ring"
                  width={700}
                  height={700}
                    className="object-contain max-w-[350px] sm:max-w-[450px] md:max-w-[550px] lg:max-w-[700px] w-full h-auto relative z-10 drop-shadow-[0_0_50px_rgba(59,130,246,0.5)] hover:drop-shadow-[0_0_60px_rgba(59,130,246,0.6)] transition-all duration-300"
                  priority
                  quality={100}
                    loading="eager"
                />
                
                
              </div>
            </motion.div>
            </SimpleSection>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Stats Section with Scroll Animations */}
      <section className="py-16 sm:py-20 px-4 relative">
        <div className="container mx-auto max-w-7xl px-4">
          <motion.div 
            className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-100 mb-4">
              Beta Launch Plan
            </h2>
            <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto">
              We’re getting ready for September 2025. Join the waitlist to get updates and early access.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat, index) => (
              <StatCard key={index} stat={stat} index={index} />
            ))}
          </div>
          
          {/* Live indicator */}
          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 text-orange-300 text-sm font-medium"
              whileHover={{ scale: 1.05, borderColor: "rgba(249, 115, 22, 0.5)" }}
            >
              <motion.div 
                className="w-2 h-2 bg-orange-400 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [1, 0.5, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />
              Beta Waitlist - Join Now
          </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section with Hover Effects */}
      <section id="features" className="py-16 sm:py-20 px-4">
        <div className="container mx-auto max-w-7xl px-4">
          <motion.div 
            className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-widest uppercase bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent mb-6">
              How It Works
            </h2>
            <p className="text-zinc-200 text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed">
              Our platform combines AI resume analysis, personalized challenges, and community learning to help you achieve your goals and connect with like-minded peers.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
            {features.map((feature, index) => (
              <SimpleSection key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.02, y: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Card className="shadow-2xl rounded-2xl border-zinc-700 bg-card/90 backdrop-blur-lg hover:shadow-[0_0_30px_rgba(43,188,255,0.2)] transition-all duration-300 h-full">
                  <CardHeader>
                        <motion.div 
                          className="w-16 h-16 rounded-full bg-gradient-to-r from-[#2bbcff] to-[#a259ff] flex items-center justify-center mb-6"
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                        >
                      <feature.icon className="h-8 w-8 text-white" />
                        </motion.div>
                        <CardTitle className="text-lg sm:text-xl font-extrabold tracking-widest uppercase bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                        <CardDescription className="text-zinc-400 text-sm sm:text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
                </motion.div>
              </SimpleSection>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section with Timeline */}
      <section id="how-it-works" className="py-16 sm:py-20 px-4">
        <div className="container mx-auto max-w-7xl px-4">
          <motion.div 
            className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-widest uppercase bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent mb-6">
              Your Path to Improvement
            </h2>
            <p className="text-zinc-200 text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed">
              Follow these simple steps to start tracking your progress, competing with peers, and achieving your goals.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {[
              {
                step: "1",
                title: "Upload Resume & Get AI Score",
                description: "Upload your resume and get an instant AI-powered Resume Score with personalized improvement suggestions.",
                icon: User,
              },
              {
                step: "2",
                title: "Set Goals & Join Challenges",
                description: "Transform your goals into personalized challenges and connect with peers working on similar objectives.",
                icon: Zap,
              },
              {
                step: "3",
                title: "Learn from Successful Peers",
                description: "See how others achieved their dream universities and jobs, and learn from their resume strategies.",
                icon: BarChart2,
              },
              {
                step: "4",
                title: "Track Progress & Celebrate Wins",
                description: "Monitor your improvement, unlock achievements, and showcase your growth to potential employers.",
                icon: Trophy,
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <motion.div whileHover={{ y: -10 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Card className="shadow-2xl rounded-2xl border-zinc-700 bg-card/90 backdrop-blur-lg relative hover:shadow-[0_0_30px_rgba(43,188,255,0.2)] transition-all duration-300 h-full">
                    <motion.div 
                      className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-gradient-to-r from-[#2bbcff] to-[#a259ff] flex items-center justify-center text-white font-bold text-lg"
                      whileHover={{ scale: 1.2, rotate: 360 }}
                      transition={{ duration: 0.3 }}
                    >
                    {item.step}
                    </motion.div>
                  <CardHeader className="pt-10">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#2bbcff] to-[#a259ff] flex items-center justify-center mb-6">
                      <item.icon className="h-6 w-6 text-white" />
                    </div>
                      <CardTitle className="text-lg sm:text-xl font-extrabold tracking-widest uppercase bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                      <CardDescription className="text-zinc-300 text-sm sm:text-base leading-relaxed">
                      {item.description}
                    </CardDescription>
                  </CardContent>
                </Card>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section with Carousel Effect */}
      <section className="py-16 sm:py-20 px-4 overflow-hidden">
        <div className="container mx-auto max-w-7xl px-4">
          <motion.div 
            className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-widest uppercase bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent mb-6">
              Word from Our Team
            </h2>
            <p className="text-zinc-200 text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed">
              Meet the passionate team behind EliteScore, dedicated to helping students achieve their goals.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <motion.div
                  whileHover={{ scale: 1.02, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="h-full"
                >
                <Card className="shadow-2xl rounded-2xl border-zinc-700 bg-card/90 backdrop-blur-lg h-full hover:shadow-[0_0_30px_rgba(43,188,255,0.2)] transition-all duration-300">
                    <CardContent className="p-6 sm:p-8 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-6">
                      {[...Array(5)].map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 + i * 0.05 }}
                          >
                        <Star
                              className={cn(
                                "h-5 w-5 transition-colors",
                                i < testimonial.rating 
                                  ? "text-yellow-400 fill-yellow-400" 
                                  : "text-zinc-600"
                              )}
                            />
                          </motion.div>
                      ))}
                    </div>
                      <p className="text-zinc-300 italic text-sm sm:text-base leading-relaxed mb-6 flex-grow">
                        "{testimonial.content}"
                      </p>
                    <div className="flex items-center gap-4">
                        <motion.div 
                          className="w-16 h-16 rounded-full overflow-hidden border-2 border-zinc-700"
                          whileHover={{ scale: 1.1, borderColor: "rgba(43, 188, 255, 0.5)" }}
                        >
                        <Image
                            src={testimonial.image}
                          alt={`EliteScore testimonial user ${testimonial.name}`}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover object-center"
                          style={{ 
                            objectPosition: testimonial.name === 'Taksh Dange' || testimonial.name === 'Givanna Lopez' 
                              ? 'center 30%' 
                              : 'center top' 
                          }}
                          loading="lazy"
                        />
                        </motion.div>
                      <div>
                          <div className="font-bold text-white text-sm sm:text-base">{testimonial.name}</div>
                          <div className="text-xs sm:text-sm text-zinc-400">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Beta Signup Section */}
      <section id="beta-signup" className="py-16 sm:py-20 px-4 relative overflow-hidden">
        
        <div className="container mx-auto max-w-4xl px-4 relative z-10">
          <motion.div 
            className="text-center space-y-8 sm:space-y-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div>
              <motion.div 
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 text-orange-300 text-sm font-medium mb-6"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
              >
                <motion.div 
                  className="w-2 h-2 bg-orange-400 rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [1, 0.5, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                />
                Beta Launch - September 2024
              </motion.div>
              
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-widest uppercase bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent mb-6">
                Join the Beta Waitlist
              </h2>
              <p className="text-zinc-200 text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed">
                Be among the first to experience EliteScore. Get early access, exclusive features, and help shape the future of career development.
              </p>
            </div>

            {/* Beta Signup Form */}
            <motion.div 
              className="max-w-md mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
                             <div className="bg-zinc-900/50 backdrop-blur-lg rounded-2xl border border-zinc-700 p-6 sm:p-8 shadow-2xl">
                 {isSubmitted ? (
                   <motion.div 
                     className="text-center py-8"
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                   >
                     <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                       <CheckCircle className="h-8 w-8 text-green-400" />
                     </div>
                     <h3 className="text-xl font-bold text-white mb-2">Welcome to the Waitlist!</h3>
                     <p className="text-zinc-300">You'll be notified when the beta launches in September 2024.</p>
                   </motion.div>
                 ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {errorMessage && (
                      <Alert variant="destructive" className="animate-shake">
                        <AlertDescription>{errorMessage}</AlertDescription>
                      </Alert>
                    )}
                     <div>
                       <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-2">
                         Full Name
                       </label>
                       <input
                         type="text"
                         id="name"
                         name="name"
                         value={formData.name}
                         onChange={handleInputChange}
                         required
                         className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-600 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                         placeholder="Enter your full name"
                       />
                     </div>
                     
                     <div>
                       <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">
                         Email Address
                       </label>
                       <input
                         type="email"
                         id="email"
                         name="email"
                         value={formData.email}
                         onChange={handleInputChange}
                         required
                         className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-600 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                         placeholder="Enter your email address"
                       />
                     </div>
                     
                     <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                         type="submit"
                size="lg"
                         disabled={isSubmitting}
                         className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-[#2bbcff] to-[#a259ff] text-white shadow-lg hover:shadow-[0_0_30px_rgba(43,188,255,0.4)] transition-all duration-300 disabled:opacity-50"
                       >
                         <span className="flex items-center justify-center">
                           {isSubmitting ? (
                             <>
                               <motion.div 
                                 className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                                 animate={{ rotate: 360 }}
                                 transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                               />
                               Joining Waitlist...
                             </>
                           ) : (
                             <>
                               Join Beta Waitlist
                               <ArrowRight className="ml-2 h-5 w-5" />
                             </>
                           )}
                         </span>
              </Button>
                     </motion.div>
                   </form>
                 )}
                
                <div className="mt-6 text-center">
                  <p className="text-xs text-zinc-400">
                    By joining the waitlist, you'll be notified when the beta launches in September 2024.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {["Early access to all features", "Exclusive beta tester badge", "Help shape the platform"].map((text, i) => (
                <motion.div 
                  key={text}
                  className="flex flex-col items-center gap-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                <CheckCircle className="h-6 w-6 text-green-400" />
                  <span className="text-sm sm:text-base text-zinc-300 font-medium">{text}</span>
              </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>


    </div>
  )
}