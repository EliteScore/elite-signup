"use client"

import { useState, useEffect, useRef } from "react"
import { motion, useScroll, useTransform, useSpring, useInView, useAnimation, AnimatePresence, useMotionValue, useVelocity } from "framer-motion"

// Hook to detect mobile devices and reduce motion
function useReducedMotion() {
  const [isMobile, setIsMobile] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setIsMobile(window.innerWidth < 768)
    setPrefersReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Return false during SSR and initial render to avoid hydration mismatch
  if (!mounted) return { shouldReduceMotion: false, isMobile: false }
  
  return { shouldReduceMotion: isMobile || prefersReducedMotion, isMobile }
}
import { ArrowRight, CheckCircle, Trophy, Users, BarChart2, Zap, Star, User, GraduationCap, Briefcase, TrendingUp, ChevronDown, Shield, Lock, Zap as ZapIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { cn } from "@/lib/utils"

// Outcome testimonials - EliteScore Style (removed - replaced with team section)

// Feature data - EliteScore Style
  const features = [
  {
      title: "Resume Score & XP System",
      description:
        "Upload your resume and get an instant score. Complete challenges to earn XP and level up your profile like an RPG character.",
    icon: BarChart2,
  },
      {
      title: "Peer Competition & Learning",
      description:
        "See how students at your dream university got accepted. Learn from their strategies and compete with friends on the leaderboard.",
      icon: Users,
    },
  {
    title: "Daily & Weekly Challenges",
    description:
        "Turn self-improvement into quests. Complete daily challenges, weekly meetings, and monthly projects to earn badges and XP.",
    icon: Zap,
  },
  {
    title: "Social Hierarchy & Status",
      description: "Build your reputation through achievements. Show off your badges, compete in university rankings, and gain recognition.",
    icon: Trophy,
  },
]

// Live Activity Stats - EliteScore Style
  const stats = [
  { label: "Target Launch", value: 2025, suffix: "" },
  { label: "Founding Beta Spots", value: 200, suffix: "" },
  { label: "Core Features at Beta", value: 12, suffix: "+" },
  { label: "Referral Perks", value: 3, suffix: "+" },
]

// Use-case tabs data - EliteScore Style
const useCases = [
  {
    id: "highschool",
    title: "High School Students",
    subtitle: "See what it takes to get into your dream university.",
    icon: GraduationCap,
    content: "Check scores of students already at your dream university. Learn their strategies, complete challenges they did, and compete with peers applying to the same schools."
  },
  {
    id: "college",
    title: "College Students", 
    subtitle: "Level up your skills and compete for opportunities.",
    icon: Briefcase,
    content: "See how students landed internships at top companies. Complete skill-building challenges, earn XP, and build a profile that recruiters will notice."
  },
  {
    id: "graduates",
    title: "Recent Graduates",
    subtitle: "Turn your degree into career success through gamification.",
    icon: TrendingUp,
    content: "Compete with other graduates, see what successful professionals did, and complete challenges that directly improve your job prospects and career trajectory."
  }
]

// FAQ data - EliteScore Style
const faqs = [
  {
    question: "How does the scoring system work?",
    answer: "Your EliteScore is calculated based on your resume, completed challenges, achievements, and skill development. We analyze your profile against students at top universities and companies to show you exactly where you stand. The scoring focuses on improvement rather than reaching a specific level - it's about the distance from where you started to where you end up. Your score improves as you complete daily challenges, weekly meetings, monthly projects, and skill-building activities."
  },
  {
    question: "Is it really free?",
    answer: "Yes! The beta is completely free with no credit card required. You'll get full access to all features including challenges, leaderboards, peer comparisons, and community features during the beta period. We believe in making self-improvement accessible to all students, so our core platform will always remain free with optional premium features for advanced users."
  },
  {
    question: "Can I see other students' profiles?",
    answer: "Absolutely! You can see profiles of students at your dream university or company to learn exactly what they did to get there. If your friend got into Harvard, you can see their strategies, completed challenges, and progression path. You can also compare with peers applying to the same schools and create friendly leaderboards. All profiles respect privacy settings - you control what's visible on yours."
  },
  {
    question: "Is my data private?",
    answer: "Your privacy is our top priority. You have complete control over your profile visibility - keep it private or make it public for leaderboards. Your personal data is encrypted and never shared without permission. You can choose to show anonymized information or keep everything private. We also provide daily mental health reminders and exercises to support your wellbeing throughout your improvement journey."
  },
  {
    question: "What kind of challenges are there?",
    answer: "We offer a comprehensive range of engaging activities: Daily challenges (coding practice, skill-building courses), weekly peer meetings and group projects, monthly long-term projects, online quizzes, and skill assessments. You'll also discover new hobbies and passions through our community-driven activities. Each challenge is verified through certificates, online tests, or app completion tracking. Complete challenges earn you XP, badges, and improve your overall score."
  },
  {
    question: "How do I earn XP and level up?",
    answer: "Earn XP by completing challenges, uploading achievements, participating in community activities, and helping other students. Your level increases as you accumulate XP, and you'll earn collectible badges that showcase your progress. The system focuses on meaningful improvement rather than point-chasing - we verify progress through quizzes, interviews, and skill assessments. You'll also get personalized roadmaps, daily motivation emails, workshops, and guest lectures to keep you motivated on your journey."
  }
]

// Simplified gradient background - static for mobile performance
function AnimatedGradientMesh({ shouldReduceMotion }: { shouldReduceMotion: boolean }) {
  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 1000], [0, -20])
  const y2 = useTransform(scrollY, [0, 1000], [0, -15])

  // Use static gradients on mobile for better performance
  if (shouldReduceMotion) {
    return (
      <div className="fixed inset-0 -z-10">
        <div
          className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full opacity-30"
          style={{
            background: "radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%)",
            filter: "blur(60px)"
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, rgba(124, 58, 237, 0.04) 0%, transparent 70%)",
            filter: "blur(80px)"
          }}
        />
      </div>
    )
  }

  // Desktop version with minimal scroll effects
  return (
    <div className="fixed inset-0 -z-10">
      <motion.div
        className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full opacity-30"
        style={{
          background: "radial-gradient(circle, rgba(59, 130, 246, 0.04) 0%, transparent 70%)",
          filter: "blur(80px)",
          y: y1
        }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, rgba(124, 58, 237, 0.03) 0%, transparent 70%)",
          filter: "blur(100px)",
          y: y2
        }}
      />
    </div>
  )
}

// Simplified floating particles - reduced count and complexity for mobile performance
function FloatingParticles({ shouldReduceMotion }: { shouldReduceMotion: boolean }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Skip particles on mobile for better performance
  if (!mounted || shouldReduceMotion) return null

  return (
    <div className="fixed inset-0 -z-5 pointer-events-none">
      {/* Reduced to only 3 particles for desktop */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute bg-white rounded-full opacity-20"
          style={{
            left: `${20 + i * 30}%`,
            top: `${30 + i * 20}%`,
            width: '2px',
            height: '2px'
          }}
          animate={{ 
            y: [-10, 10, -10],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

// Optimized animations - conditional based on motion preference and mobile detection
const createAnimation = (shouldReduceMotion: boolean, isMobile: boolean = false) => {
  // Mobile-optimized durations and easing
  const duration = isMobile ? 0.25 : 0.4
  const ease = isMobile ? "easeOut" : [0.2, 0.8, 0.2, 1]
  const staggerDelay = isMobile ? 0.02 : 0.05
  
  return {
    fadeInUp: {
      initial: shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: isMobile ? 10 : 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration, ease }
    },
    staggerContainer: {
      initial: {},
      animate: shouldReduceMotion ? {} : {
        transition: {
          staggerChildren: staggerDelay
        }
      }
    },
    revealAnimation: {
      initial: shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: isMobile ? 10 : 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration, ease }
    },
    slideInLeft: {
      initial: shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: isMobile ? -10 : -20 },
      animate: { opacity: 1, x: 0 },
      transition: { duration, ease }
    },
    slideInRight: {
      initial: shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: isMobile ? 10 : 20 },
      animate: { opacity: 1, x: 0 },
      transition: { duration, ease }
    },
    scaleIn: {
      initial: shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: isMobile ? 0.98 : 0.95 },
      animate: { opacity: 1, scale: 1 },
      transition: { duration, ease }
    }
  }
}

// Use-case Tabs Component - Modern Design
function UseCaseTabs() {
  const [activeTab, setActiveTab] = useState("highschool")

  return (
    <div className="space-y-8">
      {/* Tab Headers */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {useCases.map((useCase) => (
          <motion.button
            key={useCase.id}
            onClick={() => setActiveTab(useCase.id)}
            className={cn(
              "flex items-center gap-3 px-6 py-4 rounded-xl transition-all duration-200 text-left",
              activeTab === useCase.id
                ? "bg-zinc-900/50 backdrop-blur-sm border border-zinc-700/50 text-white"
                : "border border-zinc-800/50 text-zinc-400 hover:text-white hover:border-zinc-700/50 hover:bg-zinc-900/30"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <useCase.icon className="h-5 w-5 flex-shrink-0" />
            <div>
              <div className="font-semibold">{useCase.title}</div>
              <div className="text-xs opacity-80">{useCase.subtitle}</div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {useCases.map((useCase) => 
          activeTab === useCase.id && (
            <motion.div
              key={useCase.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className="bg-zinc-900/30 backdrop-blur-sm rounded-2xl p-8 max-w-2xl mx-auto border border-zinc-800/30">
                <div className="w-14 h-14 bg-gradient-to-r from-[#3B82F6] to-[#7C3AED] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <useCase.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-[700] mb-4">
                  <span className="bg-gradient-to-r from-[#3B82F6] to-[#7C3AED] bg-clip-text text-transparent">
                    {useCase.title}
                  </span>
                </h3>
                <p className="text-zinc-300 leading-relaxed mb-6">{useCase.content}</p>
                <motion.button
                  onClick={() => document.getElementById('beta-signup')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-white text-black hover:bg-zinc-100 px-6 py-3 rounded-full font-semibold text-sm transition-all duration-200 shadow-lg hover:shadow-xl"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Try it free
                </motion.button>
              </div>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  )
}

// FAQ Component - Modern Design
function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {faqs.map((faq, index) => (
        <motion.div
          key={index}
          className="bg-zinc-900/30 backdrop-blur-sm rounded-2xl border border-zinc-800/30 overflow-hidden hover:border-zinc-700/50 transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ 
            delay: index * 0.05, 
            duration: 0.3, 
            ease: "easeOut" 
          }}
        >
          <motion.button
            className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-zinc-800/20 transition-colors"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
          >
            <span className="font-semibold text-white text-left">{faq.question}</span>
            <motion.div
              animate={{ rotate: openIndex === index ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-5 w-5 text-zinc-400" />
            </motion.div>
          </motion.button>
          <AnimatePresence>
            {openIndex === index && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-5 text-zinc-300 leading-relaxed">
                  {faq.answer}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  )
}

// Enterprise number counter
function AnimatedCounter({ value, suffix = "", isMobile = false }: { value: number; suffix?: string; isMobile?: boolean }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: isMobile ? "-50px" : "-100px" })

  useEffect(() => {
    if (isInView) {
      const duration = isMobile ? 1000 : 2000
      const steps = isMobile ? 25 : 50
      const increment = value / steps
      let current = 0
      
      const timer = setInterval(() => {
        current += increment
        if (current >= value) {
          setCount(value)
          clearInterval(timer)
        } else {
          setCount(Math.floor(current))
        }
      }, duration / steps)
      
      return () => clearInterval(timer)
    }
  }, [isInView, value])

  return (
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  )
}

export default function HomePage() {
  const [formData, setFormData] = useState({ name: '', email: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeFeature, setActiveFeature] = useState('Challenge System')
  const { scrollYProgress } = useScroll()
  const { shouldReduceMotion, isMobile } = useReducedMotion()
  
  // Resume upload states
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showScore, setShowScore] = useState(false)
  const [resumeScore, setResumeScore] = useState({
    overall: 0,
    experience: 0,
    skills: 0,
    education: 0,
    projects: 0
  })
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear any existing error when user starts typing
    if (errorMessage) {
      setErrorMessage(null)
    }
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
      // Call the backend API (same as old working code)
      // Use Next.js API routes in production, Express server in development
      const isProduction = process.env.NODE_ENV === 'production'
      const apiUrl = isProduction ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081')
      const endpoint = isProduction ? '/api/auth/pre-signup' : '/v1/auth/pre-signup'
      
      const response = await fetch(`${apiUrl}${endpoint}`, {
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
        // Reset form after 3 seconds (same as old code)
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

  // Resume upload handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!allowedTypes.includes(file.type)) {
        setErrorMessage('Please upload a PDF, DOC, or DOCX file.')
        return
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('File size must be less than 10MB.')
        return
      }
      
      setResumeFile(file)
      setErrorMessage(null)
    }
  }

  const handleAnalyzeResume = async () => {
    if (!resumeFile) {
      setErrorMessage('Please upload a resume file first.')
      return
    }

    setIsAnalyzing(true)
    setErrorMessage(null)

    try {
      // Create FormData for multipart/form-data upload
      const formData = new FormData()
      formData.append('file', resumeFile)
      
      // Use the Heroku CV scoring API
      const apiUrl = 'https://elite-score-cv-rating-only-a1143431be59.herokuapp.com/v1/parser/resume/score'
      
      console.log('Calling resume scoring API:', apiUrl)

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      })
      
      console.log('Resume scoring response status:', response.status)

      if (!response.ok) {
        // Try to get the specific error message from the response
        try {
          const errorData = await response.json()
          throw new Error(errorData.error || `Server error: ${response.status}`)
        } catch (parseError) {
          throw new Error(`Server error: ${response.status}`)
        }
      }

      const result = await response.json()
      console.log('Resume scoring API response:', result)
      
      // Validate the API response structure
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid response format from scoring API')
      }
      
      // Map the API response to our component's expected format with robust parsing
      const scores = {
        overall: Math.max(0, Math.min(100, Math.round(Number(result.overall_score) || 0))),
        experience: Math.max(0, Math.min(100, Math.round(Number(result.components?.experience) || 0))),
        skills: Math.max(0, Math.min(100, Math.round(Number(result.components?.skills) || 0))), 
        education: Math.max(0, Math.min(100, Math.round(Number(result.components?.education) || 0))),
        projects: Math.max(0, Math.min(100, Math.round(Number(result.components?.ai_signal) || 0))) // ai_signal maps to projects in our UI
      }
      
      console.log('Mapped scores:', scores)
      
      // Validate that we have at least some valid scores
      const hasValidScores = Object.values(scores).some(score => score > 0)
      if (!hasValidScores) {
        throw new Error('No valid scores received from the API')
      }
      
      setResumeScore(scores)
      setShowScore(true)
      
    } catch (error) {
      console.error('Error analyzing resume:', error)
      setErrorMessage('Failed to analyze resume. Please check your connection and try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const resetResumeAnalysis = () => {
    setResumeFile(null)
    setShowScore(false)
    setResumeScore({ overall: 0, experience: 0, skills: 0, education: 0, projects: 0 })
    setErrorMessage(null)
  }

  return (
    <>
      <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        
        /* Respect user's motion preferences */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
        
        /* Mobile animation optimizations */
        @media (max-width: 768px) {
          * {
            will-change: auto;
          }
          
          [data-framer-motion] {
            will-change: transform, opacity;
          }
          
          /* Reduce motion complexity on mobile */
          .motion-reduce-mobile {
            animation-duration: 0.3s !important;
            transition-duration: 0.3s !important;
          }
        }
      `}</style>
      
      <div className="min-h-screen bg-black text-white overflow-x-hidden relative">
        {/* Scroll Progress Bar - only on desktop */}
        {!shouldReduceMotion && (
          <motion.div
            className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#3B82F6] to-[#7C3AED] z-50 origin-left"
            style={{ scaleX: scrollYProgress }}
          />
        )}
        
        {/* Simplified Dark Background */}
        <div className="fixed inset-0 bg-black">
          {/* Minimal gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/10 via-transparent to-slate-800/5" />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#3B82F6]/3 via-transparent to-[#7C3AED]/3" />
        </div>
        
        {/* Modern Animated Background */}
        <AnimatedGradientMesh shouldReduceMotion={shouldReduceMotion} />
        
        {/* Floating Particles */}
        <FloatingParticles shouldReduceMotion={shouldReduceMotion} />
      
      {/* Modern Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <motion.div 
              className="flex items-center"
              initial={{ opacity: 0, x: -30, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
              whileHover={{ scale: 1.05 }}
            >
              <motion.span 
                className="text-2xl font-bold bg-gradient-to-r from-[#3B82F6] to-[#7C3AED] bg-clip-text text-transparent cursor-pointer"
                whileHover={{ 
                  backgroundImage: "linear-gradient(45deg, #3B82F6, #7C3AED, #EC4899)",
                  transition: { duration: 0.3 }
                }}
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                EliteScore
              </motion.span>
            </motion.div>
            
            {/* Desktop Navigation */}
            <motion.div 
              className="hidden md:flex items-center space-x-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: isMobile ? 0.3 : 0.6, delay: isMobile ? 0.1 : 0.2 }}
            >
              {[
                { href: "#features", label: "Features" },
                { href: "#how-it-works", label: "How it works" },
                { href: "#resume-score", label: "Get Your Resume Score" },
                { href: "#faq", label: "FAQ" }
              ].map((item, index) => (
                <motion.a 
                  key={item.label}
                  href={item.href}
                  className="text-zinc-400 hover:text-white transition-all duration-200 text-sm font-medium relative group px-3 py-2 rounded-lg hover:bg-zinc-800/30"
                  initial={{ opacity: 0, y: -15, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: isMobile ? 0.3 : 0.5, 
                    delay: isMobile ? 0.15 + index * 0.05 : 0.3 + index * 0.1,
                    ease: isMobile ? "easeOut" : [0.2, 0.8, 0.2, 1]
                  }}
                  whileHover={{ 
                    y: -2, 
                    scale: 1.05,
                    transition: { type: "spring", stiffness: 300, damping: 20 }
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  {item.label}
                  <motion.span 
                    className="absolute -bottom-1 left-0 h-px bg-gradient-to-r from-[#3B82F6] to-[#7C3AED]"
                    initial={{ width: 0 }}
                    whileHover={{ width: "100%" }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.a>
              ))}
            </motion.div>
            
            {/* Center CTA Button */}
            <motion.div
              className="hidden md:flex"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: isMobile ? 0.3 : 0.6, 
                delay: isMobile ? 0.15 : 0.3, 
                ease: isMobile ? "easeOut" : [0.2, 0.8, 0.2, 1] 
              }}
            >
              <motion.button 
                onClick={() => document.getElementById('beta-signup')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white text-black hover:bg-zinc-100 transition-all duration-200 text-sm px-6 py-2.5 rounded-full font-semibold shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                Sign Up Now
              </motion.button>
            </motion.div>
            
            {/* Mobile Navigation */}
            <div className="md:hidden">
              <motion.button
                className="text-zinc-400 hover:text-white transition-all duration-200 p-2 rounded-lg hover:bg-zinc-800/50"
                initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ 
                  duration: isMobile ? 0.25 : 0.5, 
                  delay: isMobile ? 0.1 : 0.2, 
                  ease: isMobile ? "easeOut" : [0.2, 0.8, 0.2, 1] 
                }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setIsMobileMenuOpen(!isMobileMenuOpen);
                  const mobileMenu = document.getElementById('mobile-menu');
                  if (mobileMenu) {
                    mobileMenu.classList.toggle('hidden');
                  }
                }}
              >
                <motion.svg 
                  className="h-6 w-6" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  animate={{ 
                    rotate: isMobileMenuOpen ? 180 : 0,
                    scale: isMobileMenuOpen ? 1.1 : 1
                  }}
                  transition={{ 
                    duration: 0.3,
                    ease: [0.2, 0.8, 0.2, 1]
                  }}
                >
                  {isMobileMenuOpen ? (
                    <motion.g
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </motion.g>
                  ) : (
                    <motion.g
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </motion.g>
                  )}
                </motion.svg>
              </motion.button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              id="mobile-menu" 
              className="md:hidden bg-black/95 backdrop-blur-2xl border-b border-white/5 overflow-hidden"
              initial={{ height: 0, opacity: 0, y: -20 }}
              animate={{ height: "auto", opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -20 }}
              transition={{ 
                duration: 0.4, 
                ease: [0.2, 0.8, 0.2, 1],
                height: { duration: 0.3 },
                opacity: { duration: 0.2, delay: 0.1 }
              }}
            >
          <div className="px-6 py-6 space-y-6">
            {/* Center CTA Button for Mobile */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <motion.button 
                onClick={() => {
                  document.getElementById('beta-signup')?.scrollIntoView({ behavior: 'smooth' });
                  setIsMobileMenuOpen(false);
                }}
                className="bg-white text-black hover:bg-zinc-100 transition-all duration-200 text-sm px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                Sign Up Now
              </motion.button>
            </motion.div>

            {/* Navigation Links */}
            <div className="space-y-4">
              {[
                { href: "#features", label: "Features" },
                { href: "#how-it-works", label: "How it works" },
                { href: "#resume-score", label: "Get Your Resume Score" },
                { href: "#faq", label: "FAQ" }
              ].map((item, index) => (
                <motion.a 
                  key={item.label}
                  href={item.href}
                  className="block text-zinc-400 hover:text-white transition-all duration-200 text-sm font-medium py-3 px-4 rounded-lg hover:bg-zinc-800/30"
                  initial={{ opacity: 0, x: -30, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ 
                    duration: isMobile ? 0.25 : 0.4, 
                    delay: isMobile ? 0.1 + index * 0.05 : 0.2 + index * 0.1,
                    ease: isMobile ? "easeOut" : [0.2, 0.8, 0.2, 1]
                  }}
                  whileHover={{ x: 5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                  }}
                >
                  {item.label}
                </motion.a>
              ))}
            </div>
          </div>
        </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Modern Hero Section */}
      <section className="relative pt-28 pb-24 px-6 min-h-screen flex items-center overflow-hidden">
        {/* Simplified background - static on mobile */}
        {!shouldReduceMotion ? (
          <motion.div
            className="absolute inset-0 opacity-5"
            animate={{
              background: [
                "radial-gradient(circle at 20% 20%, #3B82F6 0%, transparent 60%)",
                "radial-gradient(circle at 80% 80%, #7C3AED 0%, transparent 60%)"
              ]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          />
        ) : (
          <div 
            className="absolute inset-0 opacity-5"
            style={{
              background: "radial-gradient(circle at 50% 50%, #3B82F6 0%, transparent 60%)"
            }}
          />
        )}
        
        {/* Floating dots - simplified for mobile */}
        {!shouldReduceMotion ? (
          <>
            <motion.div
              className="absolute top-1/4 left-1/4 w-1 h-1 bg-[#3B82F6] rounded-full opacity-40"
              animate={{
                y: [-10, 10, -10],
                opacity: [0.2, 0.6, 0.2]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute top-1/3 right-1/3 w-1 h-1 bg-[#7C3AED] rounded-full opacity-30"
              animate={{
                y: [10, -10, 10],
                opacity: [0.1, 0.5, 0.1]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
            />
          </>
        ) : (
          <>
            <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-[#3B82F6] rounded-full opacity-20" />
            <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-[#7C3AED] rounded-full opacity-15" />
          </>
        )}
        
        <div className="max-w-5xl mx-auto w-full relative z-10">
          <div className="text-center space-y-10">
            {/* Main Headline - Optimized */}
            <motion.div 
              className="space-y-8"
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: shouldReduceMotion ? 0 : (isMobile ? 0.4 : 0.8), 
                ease: isMobile ? "easeOut" : [0.16, 1, 0.3, 1],
                delay: shouldReduceMotion ? 0 : (isMobile ? 0.05 : 0.1)
              }}
            >
              <h1 className="text-[clamp(48px,6vw,64px)] font-[800] leading-[1.1] tracking-[-0.01em] text-center">
                <motion.span 
                  className="block text-white"
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: shouldReduceMotion ? 0 : (isMobile ? 0.1 : 0.2), 
                    duration: shouldReduceMotion ? 0 : (isMobile ? 0.3 : 0.6), 
                    ease: isMobile ? "easeOut" : [0.16, 1, 0.3, 1] 
                  }}
                >
                  Make Hard Work
                </motion.span>
                <motion.span 
                  className="block bg-gradient-to-r from-[#3B82F6] via-[#6366F1] to-[#7C3AED] bg-clip-text text-transparent"
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: shouldReduceMotion ? 0 : (isMobile ? 0.15 : 0.3), 
                    duration: shouldReduceMotion ? 0 : (isMobile ? 0.3 : 0.6), 
                    ease: isMobile ? "easeOut" : [0.16, 1, 0.3, 1] 
                  }}
                >
                  Addictive
                </motion.span>
              </h1>
              
              <motion.p 
                className="text-[clamp(16px,2vw,20px)] leading-[1.6] text-zinc-400 max-w-2xl mx-auto text-center"
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: shouldReduceMotion ? 0 : (isMobile ? 0.2 : 0.4), 
                  duration: shouldReduceMotion ? 0 : (isMobile ? 0.25 : 0.5), 
                  ease: isMobile ? "easeOut" : [0.16, 1, 0.3, 1] 
                }}
              >
                EliteScore is a competitive social network where students turn self-improvement into a game. Upload your resume, complete challenges to earn XP, and compete with peers to get into your dream university or land that internship.
              </motion.p>
            </motion.div>

            {/* CTAs - Optimized */}
            <motion.div
              className="space-y-6"
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                delay: shouldReduceMotion ? 0 : (isMobile ? 0.25 : 0.5), 
                duration: shouldReduceMotion ? 0 : (isMobile ? 0.3 : 0.5), 
                ease: isMobile ? "easeOut" : [0.16, 1, 0.3, 1] 
              }}
            >
              <motion.button
                onClick={() => document.getElementById('beta-signup')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-gradient-to-r from-[#3B82F6] to-[#7C3AED] text-white hover:from-[#2563EB] hover:to-[#6D28D9] transition-all duration-300 text-base px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl w-full max-w-sm mx-auto block backdrop-blur-sm"
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: shouldReduceMotion ? 0 : (isMobile ? 0.3 : 0.6), 
                  duration: shouldReduceMotion ? 0 : (isMobile ? 0.25 : 0.4), 
                  ease: isMobile ? "easeOut" : [0.16, 1, 0.3, 1] 
                }}
                whileHover={shouldReduceMotion ? {} : { 
                  scale: isMobile ? 1.01 : 1.02, 
                  y: isMobile ? -0.5 : -1,
                  transition: { duration: isMobile ? 0.15 : 0.2, ease: isMobile ? "easeOut" : [0.16, 1, 0.3, 1] }
                }}
                whileTap={shouldReduceMotion ? {} : { 
                  scale: isMobile ? 0.99 : 0.98,
                  transition: { duration: isMobile ? 0.05 : 0.1 }
                }}
              >
                Sign Up Now
              </motion.button>
            </motion.div>

            {/* Beta Trust Indicators - Cluely Style */}
            <motion.div
              className="mt-16"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                delay: 1.4, 
                duration: 0.8, 
                ease: [0.16, 1, 0.3, 1] 
              }}
            >
              <div className="flex flex-wrap justify-center gap-8 text-sm">
                <motion.div 
                  className="flex items-center gap-2 text-zinc-400"
                  initial={{ opacity: 0, x: -20, filter: "blur(3px)" }}
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  transition={{ 
                    delay: 1.5, 
                    duration: 0.6, 
                    ease: [0.16, 1, 0.3, 1] 
                  }}
                >
                  <motion.div 
                    className="w-2 h-2 bg-green-400 rounded-full"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                  />
                  <span>Free beta access</span>
                </motion.div>
                <motion.div 
                  className="flex items-center gap-2 text-zinc-400"
                  initial={{ opacity: 0, y: 20, filter: "blur(3px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ 
                    delay: 1.6, 
                    duration: 0.6, 
                    ease: [0.16, 1, 0.3, 1] 
                  }}
                >
                  <motion.div 
                    className="w-2 h-2 bg-blue-400 rounded-full"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{ 
                      duration: 2.5, 
                      repeat: Infinity, 
                      ease: "easeInOut",
                      delay: 0.3 
                    }}
                  />
                  <span>No credit card required</span>
                </motion.div>
                <motion.div 
                  className="flex items-center gap-2 text-zinc-400"
                  initial={{ opacity: 0, x: 20, filter: "blur(3px)" }}
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  transition={{ 
                    delay: 1.7, 
                    duration: 0.6, 
                    ease: [0.16, 1, 0.3, 1] 
                  }}
                >
                  <motion.div 
                    className="w-2 h-2 bg-purple-400 rounded-full"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity, 
                      ease: "easeInOut",
                      delay: 0.6 
                    }}
                  />
                  <span>Early adopter perks</span>
                </motion.div>
              </div>
            </motion.div>

            {/* Problem Statement - Consistent Design */}
            <motion.div 
              className="max-w-3xl mx-auto space-y-12 mt-24"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
              delay: isMobile ? 0.4 : 0.8, 
              duration: isMobile ? 0.4 : 0.8 
            }}
            >
              <h2 className="text-[clamp(32px,4vw,48px)] font-[800] leading-[1.1] tracking-[-0.01em] text-center">
                <span className="text-white">When's the last time you felt </span>
                <span className="bg-gradient-to-r from-[#3B82F6] via-[#6366F1] to-[#7C3AED] bg-clip-text text-transparent">behind your peers?</span>
              </h2>
              
              <div className="space-y-6 text-center">
                <div className="space-y-4 text-zinc-300 text-[clamp(16px,2vw,18px)] leading-[1.6]">
                  <p>• "How did Sarah get into Harvard?" <span className="text-zinc-500">[I have no idea what she did differently...]</span></p>
                  <p>• "How did Mark get that Google internship?" <span className="text-zinc-500">[His resume looked just like mine...]</span></p>
                  <p>• "Everyone's leveling up except me" <span className="text-zinc-500">[I don't even know where to start...]</span></p>
                </div>
              </div>
              
              <h3 className="text-[clamp(24px,3vw,32px)] font-[700] leading-[1.2] text-center">
                <span className="text-white">EliteScore shows you exactly what </span>
                <span className="bg-gradient-to-r from-[#3B82F6] via-[#6366F1] to-[#7C3AED] bg-clip-text text-transparent">successful students did and turns it into a game you can win.</span>
              </h3>
              
              <motion.p 
                className="text-sm text-zinc-500 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.8 }}
              >
                Suggestion: <span className="text-zinc-400 font-medium">Scroll down to see EliteScore in action.</span>
              </motion.p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* AI Second Brain Section - Modern Design */}
      <section className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          {/* Section Header - Modern Style */}
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: isMobile ? "-50px" : "-100px" }}
            transition={{ duration: isMobile ? 0.4 : 0.8 }}
          >
            <h2 className="text-[clamp(36px,5vw,52px)] font-[900] leading-[1.1] tracking-[-0.02em] mb-6">
              <span className="text-white">Social competition meets </span>
              <span className="bg-gradient-to-r from-[#3B82F6] via-[#6366F1] to-[#7C3AED] bg-clip-text text-transparent">self-improvement</span>
            </h2>
            <p className="text-[clamp(18px,2.5vw,22px)] leading-[1.5] text-zinc-300 max-w-4xl mx-auto">
              If your friend got into Harvard, see exactly what they did to get there. Complete the same challenges, earn XP, and compete on leaderboards with students aiming for the same goals.
            </p>
          </motion.div>

          {/* Feature Pills - Interactive */}
          <motion.div 
            className="flex flex-wrap justify-center gap-3 mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: isMobile ? "-50px" : "-100px" }}
            transition={{ 
              delay: isMobile ? 0.1 : 0.2, 
              duration: isMobile ? 0.4 : 0.8 
            }}
          >
            {["Social Leaderboards", "Challenge System", "Peer Learning"].map((feature, index) => (
              <motion.button
                key={feature}
                onClick={() => setActiveFeature(feature)}
                className={`px-6 py-3 backdrop-blur-sm rounded-full text-sm font-medium transition-all duration-200 ${
                  activeFeature === feature
                    ? "bg-gradient-to-r from-[#3B82F6] to-[#7C3AED] text-white border border-[#3B82F6]/50 shadow-lg"
                    : "bg-zinc-900/50 border border-zinc-800/50 text-zinc-300 hover:bg-zinc-800/50 hover:border-zinc-700/50"
                }`}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ 
                  delay: isMobile ? 0.15 + index * 0.05 : 0.3 + index * 0.1, 
                  duration: isMobile ? 0.3 : 0.6 
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {feature}
              </motion.button>
            ))}
          </motion.div>

          {/* Product Demo - Interactive */}
          <motion.div 
            className="relative"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            {/* Modern Card Design */}
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-zinc-800/50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-800/50">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/60"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/60"></div>
                </div>
                <div className="flex-1 text-center">
                  <span className="text-zinc-300 text-sm font-medium">EliteScore Dashboard</span>
                </div>
                <div className="w-16"></div>
              </div>

              {/* Dynamic Content Based on Active Feature */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeature}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="p-8"
                >
                  {activeFeature === 'Social Leaderboards' && (
                  <div className="space-y-6">
                      {/* Header with Crown Icon and Member Count */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                      </div>
                          <div>
                            <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-yellow-500 bg-clip-text text-transparent">
                              University Students
                            </h3>
                            <p className="text-zinc-400 text-sm">Students from top universities</p>
                          </div>
                        </div>
                        <div className="bg-zinc-800/50 px-3 py-1 rounded-full">
                          <span className="text-yellow-400 text-sm font-medium">2500 members</span>
                        </div>
                    </div>
                    
                      {/* Leaderboard Entries */}
                    <div className="space-y-3">
                        {[
                          { rank: 1, name: "You", role: "Full Stack Developer", streak: 8, level: 7, score: 2650, xp: 10800, isCurrent: true },
                          { rank: 2, name: "James Wilson", role: "ML Engineer", streak: 6, level: 7, score: 2580, xp: 10400 },
                          { rank: 3, name: "Lisa Chen", role: "Software Engineer", streak: 12, level: 6, score: 2420, xp: 9600 },
                          { rank: 4, name: "David Park", role: "Product Manager", streak: 4, level: 6, score: 2380, xp: 9200 }
                        ].map((student, index) => (
                          <motion.div
                            key={student.name}
                            className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                              student.isCurrent 
                                ? 'bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-blue-500/50 shadow-lg shadow-blue-500/20' 
                                : 'bg-zinc-800/30 border-zinc-700/30 hover:border-zinc-600/50'
                            }`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                                student.rank === 1 
                                  ? 'bg-gradient-to-r from-orange-400 to-yellow-500 text-white' 
                                  : student.rank === 2
                                  ? 'bg-zinc-600 text-white'
                                  : student.rank === 3
                                  ? 'bg-gradient-to-r from-orange-400 to-yellow-500 text-white'
                                  : 'bg-zinc-600 text-white'
                              }`}>
                                {student.rank}
                      </div>
                              <div>
                                <div className="text-white font-medium text-lg">{student.name}</div>
                                <div className="text-zinc-400 text-sm">{student.role}</div>
                                <div className="flex items-center gap-4 mt-1">
                                  <div className="flex items-center gap-1">
                                    <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 7.05 1 1 0 004 8v10a1 1 0 102 0v-5.394l.02-.02.02-.02 4.5-4.5a1 1 0 011.414 0l4.5 4.5.02.02.02.02V18a1 1 0 102 0V8a1 1 0 00-1.05-1.05z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-zinc-300 text-sm">{student.streak} day streak</span>
                      </div>
                                  <div className="text-zinc-300 text-sm">Level {student.level}</div>
                      </div>
                    </div>
                  </div>
                            <div className="text-right">
                              <div className="text-yellow-400 font-bold text-xl">{student.score}</div>
                              <div className="text-zinc-400 text-sm">{student.xp} XP</div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeFeature === 'Challenge System' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Daily Challenges */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                          </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Daily Challenges</h3>
                            <p className="text-zinc-400 text-sm">Complete these to earn XP and improve your score</p>
                        </div>
                      </div>

                        <div className="space-y-4">
                          {/* Challenge 1 */}
                          <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/30">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-white font-semibold">Code for 30 Minutes</h4>
                              <div className="bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full text-xs font-medium">
                                Medium
                              </div>
                            </div>
                            <p className="text-zinc-300 text-sm mb-4">Practice coding on LeetCode or similar platform</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-zinc-400 text-sm">
                                <div className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                  </svg>
                                  <span>30 mins</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>+100 XP</span>
                                </div>
                              </div>
                              <button className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* Challenge 2 - Completed */}
                          <div className="bg-green-900/20 rounded-xl p-4 border border-green-500/30">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-green-400 font-semibold">Watch Tutorial Video</h4>
                              <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs font-medium">
                                Easy
                              </div>
                            </div>
                            <p className="text-green-300 text-sm mb-4">Learn something new from YouTube or course platform</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-green-400 text-sm">
                                <div className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                  </svg>
                                  <span>15 mins</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>+40 XP</span>
                                </div>
                              </div>
                              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Monthly Projects */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <Trophy className="w-5 h-5 text-white" />
                          </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Monthly Projects</h3>
                            <p className="text-zinc-400 text-sm">Long-term challenges for significant skill growth</p>
                        </div>
                      </div>

                        <div className="space-y-4">
                          {/* Project 1 */}
                          <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/30">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-white font-semibold">Build a Complete Project</h4>
                              <div className="text-purple-400 font-semibold">35%</div>
                            </div>
                            <p className="text-zinc-300 text-sm mb-4">Create a full-stack application with modern technologies</p>
                            <div className="w-full bg-zinc-700 rounded-full h-2 mb-4">
                              <div className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full" style={{width: '35%'}}></div>
                            </div>
                            <div className="flex items-center justify-between text-zinc-400 text-sm">
                              <div className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                                <span>Due 28/02/2024</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>+1000 XP</span>
                              </div>
                            </div>
                          </div>

                          {/* Project 2 */}
                          <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/30">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-white font-semibold">Get a Professional Certification</h4>
                              <div className="text-purple-400 font-semibold">15%</div>
                            </div>
                            <p className="text-zinc-300 text-sm mb-4">Complete AWS, Google Cloud, or similar certification</p>
                            <div className="w-full bg-zinc-700 rounded-full h-2 mb-4">
                              <div className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full" style={{width: '15%'}}></div>
                            </div>
                            <div className="flex items-center justify-between text-zinc-400 text-sm">
                              <div className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                                <span>Due 15/03/2024</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>+1500 XP</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeFeature === 'Peer Learning' && (
                    <div className="space-y-8">
                      {/* Level and Score Section */}
                      <div className="bg-zinc-800/50 rounded-2xl p-6 border border-zinc-700/30">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                              <div className="text-2xl font-bold text-white">4</div>
                            </div>
                        <div>
                              <div className="text-2xl font-bold text-white">Level 4</div>
                              <div className="text-zinc-400 text-sm">69% to Level 5</div>
                              <div className="text-zinc-500 text-xs">34505000</div>
                        </div>
                      </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2 mb-1">
                              <Trophy className="w-6 h-6 text-yellow-400" />
                              <span className="text-2xl font-bold text-white">785</span>
                    </div>
                            <div className="text-zinc-400 text-sm">Score</div>
                  </div>
                </div>
              </div>

                      {/* Skills Section */}
                      <div className="space-y-4">
                        <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                          Skills
                        </h3>
                        <div className="space-y-4">
                          {[
                            { skill: "Python", progress: 85 },
                            { skill: "Machine Learning", progress: 70 },
                            { skill: "Web Development", progress: 65 },
                            { skill: "Public Speaking", progress: 60 },
                            { skill: "Leadership", progress: 55 }
                          ].map((skill, index) => (
                            <div key={index} className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-white font-medium">{skill.skill}</span>
                                <span className="text-zinc-400 text-sm">{skill.progress}%</span>
                              </div>
                              <div className="w-full bg-zinc-700 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                                  style={{width: `${skill.progress}%`}}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Badges Section */}
                      <div className="space-y-4">
                        <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                          Badges
                        </h3>
                        <div className="grid grid-cols-4 gap-4">
                          {[
                            { name: "Coding Expert", color: "from-blue-500 to-blue-600", icon: "📄" },
                            { name: "Team Player", color: "from-green-500 to-green-600", icon: "👥" },
                            { name: "Fast Learner", color: "from-purple-500 to-purple-600", icon: "📈" },
                            { name: "Problem Solver", color: "from-orange-500 to-orange-600", icon: "⭐" }
                          ].map((badge, index) => (
                            <div key={index} className="text-center">
                              <div className={`w-16 h-16 bg-gradient-to-r ${badge.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                                <span className="text-2xl">{badge.icon}</span>
                              </div>
                              <div className="text-white text-sm font-medium">{badge.name}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recent Achievements */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold">
                            <span className="text-blue-400">Recent </span>
                            <span className="text-purple-400">Achievements</span>
                          </h3>
                          <span className="text-blue-400 text-sm cursor-pointer hover:underline">See All</span>
                        </div>
                        <div className="space-y-3">
                          {[
                            { 
                              title: "Coding Master", 
                              description: "Completed 50 coding challenges", 
                              time: "2 weeks ago", 
                              xp: 500,
                              icon: "📄"
                            },
                            { 
                              title: "Public Speaker", 
                              description: "Delivered 5 presentations", 
                              time: "1 month ago", 
                              xp: 350,
                              icon: "👥"
                            }
                          ].map((achievement, index) => (
                            <div key={index} className="bg-zinc-800/50 rounded-xl p-4 border border-purple-500/20 relative">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <span className="text-lg">{achievement.icon}</span>
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-white font-semibold mb-1">{achievement.title}</h4>
                                  <p className="text-zinc-300 text-sm mb-1">{achievement.description}</p>
                                  <p className="text-zinc-500 text-xs">{achievement.time}</p>
                                </div>
                                <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                                  +{achievement.xp} XP
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Live Stats - Modern Style */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="text-center group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  delay: isMobile ? 0.35 + index * 0.05 : 0.7 + index * 0.1, 
                  duration: isMobile ? 0.3 : 0.6 
                }}
                whileHover={{ y: -5 }}
              >
                <div className="text-3xl font-bold text-white mb-2">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} isMobile={isMobile} />
                </div>
                <div className="text-sm text-zinc-400">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section - Modern Design */}
      <section id="features" className="py-24 px-6 relative overflow-hidden">
        {/* Background decoration */}
        <motion.div
          className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-[#3B82F6]/10 to-[#7C3AED]/10 rounded-full blur-3xl"
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.5 }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-gradient-to-r from-[#7C3AED]/10 to-[#3B82F6]/10 rounded-full blur-3xl"
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.7 }}
        />
        
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Section Header */}
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-[clamp(32px,5vw,48px)] font-[900] leading-[1.1] tracking-[-0.02em] mb-6">
              <span className="text-white">Built for every </span>
              <span className="bg-gradient-to-r from-[#3B82F6] via-[#6366F1] to-[#7C3AED] bg-clip-text text-transparent">student level</span>
            </h2>
            <p className="text-[clamp(18px,2.5vw,22px)] leading-[1.5] text-zinc-300 max-w-3xl mx-auto">
              From high school to college graduates, EliteScore helps you level up and compete with peers at every stage.
            </p>
          </motion.div>

          {/* Features Grid - Cluely Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="group"
                initial={{ 
                  opacity: 0, 
                  y: isMobile ? 30 : 60, 
                  scale: isMobile ? 0.98 : 0.95,
                  filter: isMobile ? "blur(5px)" : "blur(10px)"
                }}
                whileInView={{ 
                  opacity: 1, 
                  y: 0, 
                  scale: 1,
                  filter: "blur(0px)"
                }}
                viewport={{ once: true, margin: isMobile ? "-50px" : "-100px" }}
                transition={{ 
                  delay: isMobile ? index * 0.05 : index * 0.15,
                  duration: isMobile ? 0.6 : 1.2,
                  ease: isMobile ? "easeOut" : [0.16, 1, 0.3, 1]
                }}
                whileHover={{ 
                  y: isMobile ? -4 : -8,
                  scale: isMobile ? 1.01 : 1.02,
                  transition: { 
                    duration: isMobile ? 0.2 : 0.3, 
                    ease: isMobile ? "easeOut" : [0.16, 1, 0.3, 1] 
                  }
                }}
              >
                <div className="bg-zinc-900/40 backdrop-blur-md rounded-2xl p-8 border border-zinc-800/50 hover:border-zinc-700/80 transition-all duration-500 h-full hover:bg-zinc-900/60">
                  <div className="flex items-start gap-6">
                    {/* Icon */}
                    <motion.div 
                      className="flex-shrink-0"
                      whileHover={{ 
                        rotate: isMobile ? [0, -5, 5, 0] : [0, -10, 10, 0],
                        transition: { duration: isMobile ? 0.3 : 0.5 }
                      }}
                    >
                      <motion.div 
                        className="w-14 h-14 rounded-2xl bg-gradient-to-r from-[#3B82F6] to-[#7C3AED] flex items-center justify-center shadow-lg"
                        whileHover={{ 
                          scale: isMobile ? 1.08 : 1.15,
                          boxShadow: isMobile ? "0 10px 20px -6px rgba(59, 130, 246, 0.3)" : "0 20px 40px -12px rgba(59, 130, 246, 0.4)"
                        }}
                        transition={{ 
                          duration: isMobile ? 0.2 : 0.3, 
                          ease: isMobile ? "easeOut" : [0.16, 1, 0.3, 1] 
                        }}
                      >
                        <feature.icon className="h-7 w-7 text-white" />
                      </motion.div>
                    </motion.div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <motion.h3 
                        className="text-xl font-[700] text-white mb-3 group-hover:text-[#3B82F6] transition-colors duration-300"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ 
                          delay: isMobile ? index * 0.05 + 0.1 : index * 0.15 + 0.2, 
                          duration: isMobile ? 0.4 : 0.8,
                          ease: isMobile ? "easeOut" : [0.16, 1, 0.3, 1]
                        }}
                      >
                        {feature.title}
                      </motion.h3>
                      <motion.p 
                        className="text-zinc-300 leading-relaxed text-base"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ 
                          delay: isMobile ? index * 0.05 + 0.2 : index * 0.15 + 0.4, 
                          duration: isMobile ? 0.4 : 0.8,
                          ease: isMobile ? "easeOut" : [0.16, 1, 0.3, 1]
                        }}
                      >
                        {feature.description}
                      </motion.p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* Competitive Environment Section */}
      <section className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: isMobile ? "-50px" : "-100px" }}
            transition={{ duration: isMobile ? 0.4 : 0.8 }}
          >
            <h2 className="text-[clamp(36px,5vw,52px)] font-[900] mb-8 leading-[1.1]">
              <span className="text-white">Turn peer pressure into </span>
              <span className="bg-gradient-to-r from-[#3B82F6] via-[#6366F1] to-[#7C3AED] bg-clip-text text-transparent">peer power</span>
            </h2>
            <p className="text-[clamp(18px,2.5vw,22px)] leading-[1.5] text-zinc-300 max-w-4xl mx-auto">
              Everyone starts at different levels, just like life. The goal isn't to reach a specific score—it's to improve faster than you ever thought possible by competing with friends.
            </p>
          </motion.div>

          {/* Competitive Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <motion.div
              className="bg-zinc-900/30 backdrop-blur-sm rounded-2xl p-8 border border-zinc-800/30"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h3 className="text-xl font-[700] mb-4">
                <span className="text-white">See What </span>
                <span className="bg-gradient-to-r from-[#3B82F6] via-[#6366F1] to-[#7C3AED] bg-clip-text text-transparent">Winners Did</span>
              </h3>
              <p className="text-zinc-300 leading-relaxed mb-4">
                If your friend got into Harvard, see their exact strategy. What courses they took, what projects they built, what challenges they completed. No more guessing.
              </p>
              <div className="text-sm text-zinc-400">
                "I saw exactly what students at MIT did to get in. Completed the same 47-day challenge they did. Got accepted early decision." — Sarah, Harvard '25
              </div>
            </motion.div>

            <motion.div
              className="bg-zinc-900/30 backdrop-blur-sm rounded-2xl p-8 border border-zinc-800/30"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h3 className="text-xl font-[700] mb-4">
                <span className="text-white">Compete in </span>
                <span className="bg-gradient-to-r from-[#3B82F6] via-[#6366F1] to-[#7C3AED] bg-clip-text text-transparent">Real-Time</span>
              </h3>
              <p className="text-zinc-300 leading-relaxed mb-4">
                Daily leaderboards, weekly challenges, monthly competitions. See your ranking among students applying to the same universities or companies.
              </p>
              <div className="text-sm text-zinc-400">
                "The leaderboard made it addictive. I completed way more projects than I would have alone. Now I'm at Google." — Marcus, Google Intern
              </div>
            </motion.div>
          </div>

          <UseCaseTabs />
        </div>
      </section>

      {/* How It Works Section - Simple and Consistent */}
      <section id="how-it-works" className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          {/* Section Header - Consistent with other sections */}
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: isMobile ? "-50px" : "-100px" }}
            transition={{ duration: isMobile ? 0.4 : 0.8 }}
          >
            <h2 className="text-[clamp(32px,5vw,48px)] font-[900] leading-[1.1] tracking-[-0.02em] mb-6">
              <span className="text-white">How it </span>
              <span className="bg-gradient-to-r from-[#3B82F6] via-[#6366F1] to-[#7C3AED] bg-clip-text text-transparent">works</span>
            </h2>
            <p className="text-[clamp(18px,2.5vw,22px)] leading-[1.5] text-zinc-300 max-w-3xl mx-auto">
              Four simple steps to turn self-improvement into a competitive game.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Upload Resume & Get Score",
                description: "Upload your resume and get an instant profile score. See how you stack up against students at your dream university or company.",
                icon: User,
              },
              {
                step: "2",
                title: "Complete Challenges & Earn XP",
                description: "Take on daily challenges, weekly meetings, and monthly projects. Each completion earns you XP and helps you level up.",
                icon: Zap,
              },
              {
                step: "3",
                title: "Compete with Peers",
                description: "See what successful students did to get into their dream schools. Learn their strategies and compete on leaderboards.",
                icon: BarChart2,
              },
              {
                step: "4",
                title: "Level Up & Gain Recognition",
                description: "Earn badges, climb rankings, and build a reputation. Show off your achievements and inspire others to improve.",
                icon: Trophy,
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                className="group relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: isMobile ? "-50px" : "-100px" }}
                transition={{ 
                  delay: isMobile ? index * 0.1 : index * 0.2, 
                  duration: isMobile ? 0.4 : 0.6,
                  ease: isMobile ? "easeOut" : [0.2, 0.8, 0.2, 1]
                }}
              >
                <div className="bg-zinc-900/30 backdrop-blur-sm rounded-2xl p-8 h-full border border-zinc-800/30 hover:border-zinc-700/50 transition-all duration-300 relative group">
                  {/* Step Number */}
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-r from-[#3B82F6] to-[#7C3AED] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {item.step}
                  </div>
                  
                  {/* Icon */}
                  <div className="w-14 h-14 bg-gradient-to-r from-[#3B82F6] to-[#7C3AED] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <item.icon className="h-7 w-7 text-white" />
                    </div>
                  
                  <h3 className="text-lg font-[700] mb-4">
                    <span className="bg-gradient-to-r from-[#3B82F6] to-[#7C3AED] bg-clip-text text-transparent">
                      {item.title}
                    </span>
                  </h3>
                  <p className="text-zinc-300 leading-relaxed text-sm mb-6">
                      {item.description}
                  </p>
                  
                  {/* Mini CTA */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span 
                      className="text-sm text-[#3B82F6] font-medium cursor-pointer hover:text-[#7C3AED] transition-colors"
                      onClick={() => document.getElementById('beta-signup')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      Try it →
                    </span>
                </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Word from our Team Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        {/* Background decoration */}
        <motion.div
          className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-[#3B82F6]/10 to-[#7C3AED]/10 rounded-full blur-3xl"
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.5 }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-gradient-to-r from-[#7C3AED]/10 to-[#3B82F6]/10 rounded-full blur-3xl"
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.7 }}
        />
        
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Section Header */}
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: isMobile ? "-50px" : "-100px" }}
            transition={{ duration: isMobile ? 0.4 : 0.8 }}
          >
            <h2 className="text-[clamp(32px,5vw,48px)] font-[900] leading-[1.1] tracking-[-0.02em] mb-6">
              <span className="text-white">Word from our </span>
              <span className="bg-gradient-to-r from-[#3B82F6] via-[#6366F1] to-[#7C3AED] bg-clip-text text-transparent">team</span>
            </h2>
            <p className="text-[clamp(18px,2.5vw,22px)] leading-[1.5] text-zinc-300 max-w-4xl mx-auto">
              Meet the passionate team behind EliteScore, dedicated to helping students achieve their goals.
            </p>
          </motion.div>

          {/* Team Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Calin Baculescu",
                role: "Tech Lead Developer",
                image: "/calin.jpeg",
                quote: "Developing this app has deepened my understanding of self-improvement. If you're ready to elevate your life, try our product and you'll see the difference."
              },
              {
                name: "Taksh Dange", 
                role: "Founder",
                image: "/taksh.jpeg",
                quote: "With EliteScore, I want to help everyone achieve their goals and stay motivated. Learn from the best, keep dreaming, keep achieving."
              },
              {
                name: "Givanna Lopez",
                role: "Marketing Lead & Strategist", 
                image: "/givanna.jpeg",
                quote: "Help design the experience you want: motivating quests, fair leaderboards, and a Resume Score you're proud to show."
              }
            ].map((member, index) => (
              <motion.div
                key={index}
                className="group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  delay: isMobile ? index * 0.05 : index * 0.1,
                  duration: isMobile ? 0.4 : 0.8,
                  ease: isMobile ? "easeOut" : [0.25, 0.46, 0.45, 0.94]
                }}
                whileHover={{ y: -5 }}
              >
                <div className="bg-zinc-900/30 backdrop-blur-sm rounded-2xl p-8 border border-zinc-800/30 hover:border-zinc-700/50 transition-all duration-300 h-full group-hover:shadow-xl group-hover:shadow-[#3B82F6]/10">
                  {/* Stars */}
                  <motion.div 
                    className="flex items-center gap-1 mb-6"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ 
                      delay: isMobile ? 0.1 + index * 0.05 : 0.2 + index * 0.1, 
                      duration: isMobile ? 0.3 : 0.6 
                    }}
                  >
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ 
                          delay: isMobile ? 0.15 + index * 0.05 + i * 0.05 : 0.3 + index * 0.1 + i * 0.1, 
                          duration: isMobile ? 0.2 : 0.4,
                          type: isMobile ? "tween" : "spring",
                          stiffness: isMobile ? 100 : 200
                        }}
                      >
                        <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                      </motion.div>
                    ))}
                  </motion.div>
                  
                  {/* Quote */}
                  <motion.p 
                    className="text-zinc-200 leading-relaxed mb-8 text-lg italic"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ 
                      delay: isMobile ? 0.2 + index * 0.05 : 0.4 + index * 0.1, 
                      duration: isMobile ? 0.3 : 0.6 
                    }}
                  >
                    "{member.quote}"
                  </motion.p>
                  
                  {/* Team Member Info */}
                  <motion.div 
                    className="flex items-center gap-4"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ 
                      delay: isMobile ? 0.25 + index * 0.05 : 0.5 + index * 0.1, 
                      duration: isMobile ? 0.3 : 0.6 
                    }}
                  >
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-zinc-700 group-hover:border-[#3B82F6]/50 transition-colors duration-300">
                      <img 
                        src={member.image} 
                        alt={member.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          console.log('Image failed to load:', member.image);
                          e.currentTarget.src = '/logo.png'; // fallback to logo
                        }}
                      />
                    </div>
                    <div>
                      <div className="font-bold text-white text-lg group-hover:text-[#3B82F6] transition-colors duration-300">
                        {member.name}
                      </div>
                      <div className="text-zinc-400 group-hover:text-zinc-300 transition-colors duration-300">
                        {member.role}
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Resume Score Section - Coming Soon */}
      <section id="resume-score" className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: isMobile ? "-50px" : "-100px" }}
            transition={{ duration: isMobile ? 0.4 : 0.8 }}
          >
            <h2 className="text-[clamp(32px,5vw,48px)] font-[900] leading-[1.1] tracking-[-0.02em] mb-6">
              <span className="text-white">Get Your </span>
              <span className="bg-gradient-to-r from-[#3B82F6] via-[#6366F1] to-[#7C3AED] bg-clip-text text-transparent">Resume Score</span>
            </h2>
            <p className="text-[clamp(18px,2.5vw,22px)] leading-[1.5] text-zinc-300 max-w-3xl mx-auto">
              Upload your resume and get an instant score. See how you compare to students at top universities and get personalized recommendations to level up.
            </p>
          </motion.div>

          <motion.div 
            className="bg-zinc-900/30 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-zinc-800/30 relative overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            {!showScore ? (
              /* Upload Interface */
              <div className="max-w-2xl mx-auto text-center">
                <div className="space-y-8">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-4">Upload Your Resume</h3>
                    <p className="text-zinc-300 mb-8">Get your personalized score and see how you stack up against students at your dream university.</p>
                  </div>
                
                  {/* File Upload Area */}
                  <div className="relative">
                    <input
                      type="file"
                      id="resume-upload"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="border-2 border-dashed border-zinc-600 rounded-2xl p-12 text-center hover:border-zinc-500 transition-colors cursor-pointer group">
                      <div className="w-20 h-20 bg-gradient-to-r from-[#3B82F6] to-[#7C3AED] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      {resumeFile ? (
                        <div>
                          <p className="text-white font-semibold mb-2">✓ {resumeFile.name}</p>
                          <p className="text-zinc-400 text-sm">Click to upload a different file</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-white font-semibold mb-2">Drop your resume here</p>
                          <p className="text-zinc-400 text-sm">PDF, DOC, or DOCX files accepted</p>
                        </div>
                      )}
                    </div>
                  </div>
                
                  {/* Error Message */}
                  {errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm"
                    >
                      {errorMessage}
                    </motion.div>
                  )}
                  
                  {/* Analyze Button */}
                  <motion.button
                    onClick={handleAnalyzeResume}
                    disabled={!resumeFile || isAnalyzing}
                    className="w-full bg-gradient-to-r from-[#3B82F6] to-[#7C3AED] text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: resumeFile && !isAnalyzing ? 1.02 : 1 }}
                    whileTap={{ scale: resumeFile && !isAnalyzing ? 0.98 : 1 }}
                  >
                    {isAnalyzing ? (
                      <div className="flex items-center justify-center gap-3">
                        <motion.div 
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <span>Analyzing your resume...</span>
                      </div>
                    ) : (
                      'Get My Score'
                    )}
                  </motion.button>
                </div>
              </div>
            ) : (
              /* Score Results */
              <div className="space-y-8">
                <motion.div 
                  className="text-center mb-16"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <motion.h2 
                    className="text-[clamp(48px,5vw,72px)] font-[900] leading-[1.1] tracking-[-0.02em] mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                  >
                    <span className="text-white">Your </span>
                    <span className="bg-gradient-to-r from-[#3B82F6] via-[#6366F1] to-[#7C3AED] bg-clip-text text-transparent">
                      EliteScore: {Number(resumeScore.overall) || 0}
                    </span>
                  </motion.h2>
                  <motion.p 
                    className="text-[clamp(18px,2vw,20px)] text-zinc-300 max-w-2xl mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                  >
                    Here's your current progress and personalized insights
                  </motion.p>
                </motion.div>

                {/* Score Breakdown */}
                <div className="max-w-4xl mx-auto mb-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'experience', label: 'Experience', score: resumeScore.experience, description: 'Your work experience and professional background' },
                      { key: 'skills', label: 'Skills', score: resumeScore.skills, description: 'Technical and soft skills assessment' },
                      { key: 'education', label: 'Education', score: resumeScore.education, description: 'Educational background and achievements' },
                      { key: 'projects', label: 'Projects', score: resumeScore.projects, description: 'Project portfolio and practical experience' }
                    ].map((item, index) => (
                      <motion.div
                        key={item.key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ 
                          delay: isMobile ? index * 0.05 + 0.3 : index * 0.1 + 0.6, 
                          duration: isMobile ? 0.3 : 0.6 
                        }}
                        className="bg-zinc-900/30 backdrop-blur-sm rounded-xl p-5 border border-zinc-800/40 hover:border-zinc-700/60 transition-all duration-300"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-lg font-semibold text-white">{item.label}</h4>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold bg-gradient-to-r from-[#3B82F6] to-[#7C3AED] bg-clip-text text-transparent">
                              {Number(item.score) || 0}
                            </span>
                            <span className="text-zinc-500 text-sm">/100</span>
                          </div>
                        </div>
                        
                        <div className="w-full bg-zinc-800/60 rounded-full h-2 mb-3">
                          <motion.div 
                            className="bg-gradient-to-r from-[#3B82F6] to-[#7C3AED] h-2 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(0, Math.min(100, Number(item.score) || 0))}%` }}
                            transition={{ 
                              delay: isMobile ? index * 0.05 + 0.5 : index * 0.1 + 1, 
                              duration: isMobile ? 0.5 : 1, 
                              ease: "easeOut" 
                            }}
                          />
                        </div>
                        
                        <p className="text-sm text-zinc-400 leading-relaxed">{item.description}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Reset Button */}
                <div className="text-center">
                  <motion.button
                    onClick={resetResumeAnalysis}
                    className="bg-zinc-800/50 hover:bg-zinc-700/50 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Analyze Another Resume
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* FAQ Section - Modern Design */}
      <section id="faq" className="py-24 px-6 relative">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: isMobile ? "-50px" : "-100px" }}
            transition={{ duration: isMobile ? 0.4 : 0.8 }}
          >
            <h2 className="text-[clamp(32px,5vw,48px)] font-[900] leading-[1.1] tracking-[-0.02em] mb-6">
              <span className="text-white">Frequently asked </span>
              <span className="bg-gradient-to-r from-[#3B82F6] via-[#6366F1] to-[#7C3AED] bg-clip-text text-transparent">questions</span>
            </h2>
            <p className="text-[clamp(18px,2.5vw,22px)] leading-[1.5] text-zinc-300 max-w-3xl mx-auto">
              Everything you need to know about EliteScore.
            </p>
          </motion.div>

          <FAQ />
        </div>

        {/* Beta Signup Section - Integrated */}
        <div id="beta-signup" className="pt-16 pb-24 relative overflow-hidden">
          {/* Background Elements - Consistent with other sections */}
          <motion.div 
            className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-[#3B82F6]/10 to-[#7C3AED]/10 rounded-full blur-3xl"
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.5 }}
          />
          <motion.div
            className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-gradient-to-r from-[#7C3AED]/10 to-[#3B82F6]/10 rounded-full blur-3xl"
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.7 }}
          />
        
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div 
            className="text-center space-y-12"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {/* Header */}
            <div className="text-center space-y-6">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-[clamp(32px,5vw,48px)] font-[900] leading-[1.1] tracking-[-0.02em] mb-6"
              >
                  <span className="text-white">Ready to turn </span>
                  <span className="bg-gradient-to-r from-[#3B82F6] via-[#6366F1] to-[#7C3AED] bg-clip-text text-transparent">self-improvement into a game you can win?</span>
              </motion.h2>
              
              <motion.p 
                  className="text-[clamp(18px,2.5vw,22px)] leading-[1.5] text-zinc-300 max-w-3xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Join the elite community of ambitious students who refuse to be left behind. Level up together, compete with friends, and turn peer pressure into your biggest advantage.
              </motion.p>
            </div>

            {/* Main Signup Card */}
            <motion.div 
              className="relative max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <div className="bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/30 rounded-2xl p-8 md:p-10 relative overflow-hidden hover:border-zinc-700/50 transition-all duration-300">
                {isSubmitted ? (
                  <motion.div 
                    className="text-center py-12"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
                  >
                    <motion.div 
                      className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    >
                      <CheckCircle className="h-8 w-8 text-white" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-white mb-3">Welcome to EliteScore!</h3>
                    <p className="text-zinc-400 text-sm">
                      You're now on the beta waitlist. We'll notify you when we launch.
                    </p>
                   </motion.div>
                 ) : (
                  <div>
                    <div className="text-center mb-8">
                      <h3 className="text-xl font-bold text-white mb-2">Get Early Access</h3>
                      <p className="text-zinc-400 text-sm">Be among the first to experience the future of career development.</p>
                    </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {errorMessage && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-red-500/10 border border-red-500/20 rounded-lg p-4"
                        >
                          <p className="text-red-400 text-sm">{errorMessage}</p>
                        </motion.div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: 0.8 }}
                        >
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
                            className="w-full px-4 py-3 bg-zinc-800/30 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] transition-all duration-200 text-sm hover:border-zinc-600/50"
                            placeholder="Enter your full name"
                            autoComplete="name"
                          />
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: 0.9 }}
                        >
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
                            className="w-full px-4 py-3 bg-zinc-800/30 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] transition-all duration-200 text-sm hover:border-zinc-600/50"
                            placeholder="Enter your email address"
                            autoComplete="email"
                          />
                        </motion.div>
                     </div>
                     
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 1.0 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                        <button
                          type="submit"
                          disabled={isSubmitting}
                           className="w-full py-4 bg-gradient-to-r from-[#3B82F6] to-[#7C3AED] text-white font-bold rounded-2xl transition-all duration-300 disabled:opacity-50 relative overflow-hidden group text-base shadow-xl hover:shadow-2xl border border-transparent hover:border-white/20"
                        >
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#3B82F6] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                          />
                          
                          {/* Animated background shimmer */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                            initial={{ x: '-100%' }}
                            whileHover={{ x: '100%' }}
                            transition={{ duration: 0.6, ease: "easeInOut" }}
                          />
                          
                          <div className="relative z-10 flex items-center justify-center">
                           {isSubmitting ? (
                               <motion.div 
                                className="flex items-center gap-3"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            <motion.div 
                                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                 animate={{ rotate: 360 }}
                                 transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                               />
                                <span className="font-medium">Securing your spot...</span>
                          </motion.div>
                        ) : (
                          <motion.div 
                                className="flex items-center gap-3"
                            whileHover={{ x: 2 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                          >
                                <span className="font-bold"> Join Beta Waitlist</span>
                                <motion.div
                                  whileHover={{ x: 3, scale: 1.1 }}
                                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                >
                                <ArrowRight className="h-5 w-5" />
                                </motion.div>
                          </motion.div>
                           )}
                          </div>
                          
                          {/* Subtle glow effect */}
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#3B82F6]/20 to-[#7C3AED]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                        </button>
                     </motion.div>
                   </form>
                  </div>
                )}

                {/* Trust Indicators */}
                <motion.div 
                  className="mt-8 pt-6 border-t border-zinc-700/50 text-center"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 1.2 }}
                >
                  <p className="text-xs text-zinc-500 mb-4">
                    Join 2,000+ students already on the waitlist
                  </p>
                  <div className="flex items-center justify-center gap-6 text-xs text-zinc-400">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span>100% Free</span>
                </div>
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      <span>Secure</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ZapIcon className="h-4 w-4" />
                      <span>No Spam</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Benefits Grid */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              {[
                {
                  icon: Trophy,
                  title: "Early Access",
                  description: "Get exclusive access to all features before public launch"
                },
                {
                  icon: Star,
                  title: "Founding Member Badge",
                  description: "Showcase your early adoption with a special NFT badge"
                },
                {
                  icon: Users,
                  title: "Shape the Platform",
                  description: "Your feedback directly influences our development roadmap"
                }
              ].map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  className="text-center group"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ 
                    duration: isMobile ? 0.3 : 0.6, 
                    delay: isMobile ? 0.5 + index * 0.05 : 1.0 + index * 0.1 
                  }}
                  whileHover={{ y: -5 }}
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-[#3B82F6] to-[#7C3AED] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <benefit.icon className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">{benefit.title}</h4>
                  <p className="text-zinc-300 text-sm leading-relaxed">{benefit.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
          </div>
        </div>
      </section>

      {/* Footer - Cluely Style */}

      </div>
    </>
  )
}