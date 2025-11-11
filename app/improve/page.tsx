"use client"

import { useState } from "react"
import { TrendingUp, Award, Calendar, FileText, ArrowRight, ChevronRight, Star } from "lucide-react"
import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"

import { AppShell } from "@/components/layout/app-shell"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import {
  EnhancedCard,
  EnhancedCardContent,
  EnhancedCardDescription,
  EnhancedCardFooter,
  EnhancedCardHeader,
  EnhancedCardTitle,
} from "@/components/ui/enhanced-card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { LevelIndicator } from "@/components/level-indicator"

export default function ImprovePage() {
  const isAuthorized = useRequireAuth() // Protect this route
  const router = useRouter()
  const [currentLevel, setCurrentLevel] = useState(3)
  const [currentXP, setCurrentXP] = useState(2450)
  const nextLevelXP = 3000
  const progress = (currentXP / nextLevelXP) * 100
  const [level, setLevel] = useState(3)

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2bbcff] border-t-transparent" />
      </div>
    )
  }

  return (
    <AppShell title="Improve">
      {/* User Progress */}
      <div className="px-4 py-6 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-4 max-w-4xl mx-auto">
          <div className="flex items-center">
            <Avatar className="h-14 w-14 mr-4 border-2 border-primary-500 ring-2 ring-primary-500/30 interactive">
              <AvatarImage src="/placeholder.svg?height=150&width=150" />
              <AvatarFallback className="bg-zinc-800">U</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold font-display">Your Progress</h2>
              <div className="flex items-center mt-1">
                <LevelIndicator
                  level={level}
                  currentXP={currentXP}
                  nextLevelXP={nextLevelXP}
                  size="sm"
                  showProgress={false}
                />
                <span className="text-sm text-zinc-400 ml-2">Software Engineer</span>
              </div>
            </div>
          </div>
          <EnhancedButton
            variant="outline"
            rounded="full"
            className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-700 hover:border-primary-500/50"
            onClick={() => router.push("/profile")}
          >
            View Profile
          </EnhancedButton>
        </div>

        <div className="space-y-2 max-w-4xl mx-auto">
          <div className="flex items-center justify-between text-sm">
            <span>
              XP: {currentXP}/{nextLevelXP}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress
            value={progress}
            className="h-2 bg-zinc-800 overflow-hidden relative progress-animate"
            indicatorClassName="bg-gradient-to-r from-primary-600 to-secondary-600"
          />
        </div>
      </div>

      {/* Improvement Options */}
      <div className="px-4 py-6 space-y-6 max-w-4xl mx-auto">
        <h2 className="text-xl font-bold flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-primary-500" />
          Improvement Path
        </h2>

        <EnhancedCard variant="gradient" hover="lift" animation="fadeIn">
          <EnhancedCardHeader className="pb-2">
            <EnhancedCardTitle className="text-lg">Create Your Improvement Plan</EnhancedCardTitle>
            <EnhancedCardDescription className="text-zinc-400">
              Customize your improvement journey based on your goals
            </EnhancedCardDescription>
          </EnhancedCardHeader>
          <EnhancedCardContent className="space-y-4">
            <div className="flex items-center p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-all duration-300 cursor-pointer group">
              <div className="bg-primary-900/30 p-2 rounded-full mr-3 group-hover:scale-110 transition-transform duration-300">
                <Award className="h-5 w-5 text-primary-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Set Your Goals</h3>
                <p className="text-sm text-zinc-400">Define what you want to achieve</p>
              </div>
              <ChevronRight className="h-5 w-5 text-zinc-500 group-hover:text-primary-400 group-hover:translate-x-1 transition-all duration-300" />
            </div>

            <div className="flex items-center p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-all duration-300 cursor-pointer group">
              <div className="bg-primary-900/30 p-2 rounded-full mr-3 group-hover:scale-110 transition-transform duration-300">
                <Star className="h-5 w-5 text-primary-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Choose Your Interests</h3>
                <p className="text-sm text-zinc-400">Select 5 areas you want to focus on</p>
              </div>
              <ChevronRight className="h-5 w-5 text-zinc-500 group-hover:text-primary-400 group-hover:translate-x-1 transition-all duration-300" />
            </div>

            <div className="flex items-center p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-all duration-300 cursor-pointer group">
              <div className="bg-primary-900/30 p-2 rounded-full mr-3 group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-5 w-5 text-primary-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Upload Your Resume</h3>
                <p className="text-sm text-zinc-400">Get personalized improvement suggestions</p>
              </div>
              <ChevronRight className="h-5 w-5 text-zinc-500 group-hover:text-primary-400 group-hover:translate-x-1 transition-all duration-300" />
            </div>
          </EnhancedCardContent>
          <EnhancedCardFooter>
            <EnhancedButton
              variant="gradient"
              rounded="full"
              animation="shimmer"
              className="w-full"
              rightIcon={<ArrowRight className="h-4 w-4" />}
              onClick={() => router.push("/improve/journey")}
            >
              Start Your Journey
            </EnhancedButton>
          </EnhancedCardFooter>
        </EnhancedCard>

        <h2 className="text-xl font-bold flex items-center mt-8">
          <Calendar className="h-5 w-5 mr-2 text-primary-500" />
          Book a Session
        </h2>

        <EnhancedCard variant="default" hover="glow" animation="fadeIn" className="bg-zinc-900/50 border-zinc-800">
          <EnhancedCardHeader className="pb-2">
            <EnhancedCardTitle className="text-lg">Personal Improvement Counselor</EnhancedCardTitle>
            <EnhancedCardDescription className="text-zinc-400">
              Get expert guidance tailored to your needs
            </EnhancedCardDescription>
          </EnhancedCardHeader>
          <EnhancedCardContent className="space-y-4">
            <div className="flex items-center">
              <Avatar className="h-12 w-12 mr-4 interactive">
                <AvatarImage src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&h=150&fit=crop&crop=faces" />
                <AvatarFallback className="bg-zinc-800">AJ</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">Alex Johnson</h3>
                <p className="text-sm text-zinc-400">Career Development Specialist</p>
              </div>
            </div>

            <Separator className="bg-zinc-800" />

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-zinc-300">Available Plans:</h4>

              <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-all duration-300 group">
                <div>
                  <h3 className="font-medium">Free Trial</h3>
                  <p className="text-sm text-zinc-400">First session free</p>
                </div>
                <EnhancedButton
                  variant="outline"
                  rounded="full"
                  className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 hover:border-primary-500/50 group-hover:scale-105"
                >
                  Book
                </EnhancedButton>
              </div>

              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary-900/20 to-secondary-900/20 border border-primary-800/30 rounded-lg hover:shadow-lg transition-all duration-300 group">
                <div>
                  <div className="flex items-center">
                    <h3 className="font-medium">Gold Plan</h3>
                    <Badge className="ml-2 bg-accent-warning/20 text-accent-warning border-accent-warning/30 text-[10px]">
                      Popular
                    </Badge>
                  </div>
                  <p className="text-sm text-zinc-400">€20/month - Bi-weekly sessions</p>
                </div>
                <EnhancedButton variant="gradient" rounded="full" animation="shimmer" className="group-hover:scale-105">
                  Subscribe
                </EnhancedButton>
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-all duration-300 group">
                <div>
                  <h3 className="font-medium">Premium Plan</h3>
                  <p className="text-sm text-zinc-400">€50/month - Weekly sessions + perks</p>
                </div>
                <EnhancedButton
                  variant="outline"
                  rounded="full"
                  className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 hover:border-primary-500/50 group-hover:scale-105"
                >
                  Subscribe
                </EnhancedButton>
              </div>
            </div>
          </EnhancedCardContent>
        </EnhancedCard>
      </div>
    </AppShell>
  )
}

