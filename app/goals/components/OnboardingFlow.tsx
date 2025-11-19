"use client"

import React from "react"
import { motion } from "framer-motion"
import {
  Target,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Users,
  TrendingUp,
  Zap,
} from "lucide-react"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import { EnhancedCard, EnhancedCardContent } from "@/components/ui/enhanced-card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { goalCategories, activityPreferences } from "../constants"

interface OnboardingFlowProps {
  onboardingStep: 'goals' | 'skills'
  selectedGoals: string[]
  selectedSkills: string[]
  isSavingPreferences: boolean
  onGoalToggle: (goalId: string) => void
  onSkillToggle: (skillId: string) => void
  onStepChange: (step: 'goals' | 'skills') => void
  onComplete: () => void
}

export function OnboardingFlow({
  onboardingStep,
  selectedGoals,
  selectedSkills,
  isSavingPreferences,
  onGoalToggle,
  onSkillToggle,
  onStepChange,
  onComplete,
}: OnboardingFlowProps) {
  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-md mx-auto px-4 py-4 sm:py-6">
        {onboardingStep === 'goals' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4 sm:space-y-6"
          >
            <div className="text-center mb-6 sm:mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="flex justify-center mb-4"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-xl opacity-50 animate-pulse" />
                  <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-[0_0_40px_rgba(139,92,246,0.8)]">
                    <Target className="h-10 w-10 text-white" />
                  </div>
                </div>
              </motion.div>
              <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Choose Your Goals
              </h1>
              <p className="text-sm sm:text-base text-zinc-400 mb-4 px-2 max-w-sm mx-auto">
                Select at least 2 areas you want to focus on. Join thousands of others on their journey.
              </p>
              <div className="flex items-center justify-center gap-2">
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/40 px-3 py-1">
                  <Users className="h-3 w-3 mr-1" />
                  {selectedGoals.length} / 2+ selected
                </Badge>
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/40 px-3 py-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  15.2k active users
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              {goalCategories.map((goal, index) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <EnhancedCard
                    variant={selectedGoals.includes(goal.id) ? "gradient" : "default"}
                    className={cn(
                      "cursor-pointer transition-all duration-300 relative overflow-hidden",
                      selectedGoals.includes(goal.id)
                        ? "border-blue-500/60 shadow-[0_0_30px_rgba(59,130,246,0.5)] scale-[1.02]"
                        : "border-zinc-800 hover:border-blue-500/40 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                    )}
                    onClick={() => onGoalToggle(goal.id)}
                  >
                    {selectedGoals.includes(goal.id) && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10"
                      />
                    )}
                    <EnhancedCardContent className="p-4 relative">
                      <div className="flex items-center gap-3">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className={`w-16 h-16 rounded-xl bg-gradient-to-br ${goal.gradient} flex items-center justify-center shadow-lg`}
                        >
                          <goal.icon className="h-8 w-8 text-white" />
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-bold text-white mb-1">{goal.name}</h3>
                          <p className="text-xs sm:text-sm text-zinc-400 line-clamp-2 mb-2">{goal.description}</p>
                          <Badge variant="outline" className="text-xs text-zinc-500 border-zinc-700">
                            <Users className="h-3 w-3 mr-1" />
                            {Math.floor(Math.random() * 5000) + 2000} members
                          </Badge>
                        </div>
                        <div className="flex-shrink-0">
                          <motion.div
                            animate={selectedGoals.includes(goal.id) ? { scale: [1, 1.2, 1] } : {}}
                            transition={{ duration: 0.3 }}
                          >
                            {selectedGoals.includes(goal.id) ? (
                              <div className="h-7 w-7 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                                <CheckCircle className="h-5 w-5 text-white" />
                              </div>
                            ) : (
                              <div className="h-7 w-7 rounded-full border-2 border-zinc-600" />
                            )}
                          </motion.div>
                        </div>
                      </div>
                    </EnhancedCardContent>
                  </EnhancedCard>
                </motion.div>
              ))}
            </div>

            <EnhancedButton
              variant="gradient"
              className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 shadow-[0_0_30px_rgba(139,92,246,0.5)] h-14 text-base font-bold"
              onClick={() => onStepChange('skills')}
              disabled={selectedGoals.length < 2}
            >
              Continue to Skills
              <ArrowRight className="ml-2 h-5 w-5" />
            </EnhancedButton>
          </motion.div>
        )}

        {onboardingStep === 'skills' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4 sm:space-y-6"
          >
            <div className="text-center mb-6 sm:mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="flex justify-center mb-4"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-full blur-xl opacity-50 animate-pulse" />
                  <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.8)]">
                    <Sparkles className="h-10 w-10 text-white" />
                  </div>
                </div>
              </motion.div>
              <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
                Select Your Skills
              </h1>
              <p className="text-sm sm:text-base text-zinc-400 mb-4 px-2 max-w-sm mx-auto">
                Choose 3-4 activities to master. We'll create personalized challenges just for you.
              </p>
              <div className="flex items-center justify-center gap-2">
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/40 px-3 py-1">
                  <Zap className="h-3 w-3 mr-1" />
                  {selectedSkills.length} / 3-4 selected
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activityPreferences.map((skill, index) => (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <EnhancedCard
                    variant={selectedSkills.includes(skill.id) ? "gradient" : "default"}
                    className={cn(
                      "cursor-pointer transition-all duration-300",
                      selectedSkills.includes(skill.id)
                        ? "border-purple-500/60 shadow-[0_0_25px_rgba(168,85,247,0.5)] scale-[1.02]"
                        : "border-zinc-800 hover:border-purple-500/40 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                    )}
                    onClick={() => onSkillToggle(skill.id)}
                  >
                    <EnhancedCardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className="w-11 h-11 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg"
                        >
                          <skill.icon className="h-6 w-6 text-white" />
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-white">{skill.name}</h4>
                        </div>
                        <div className="flex-shrink-0">
                          <motion.div
                            animate={selectedSkills.includes(skill.id) ? { scale: [1, 1.2, 1] } : {}}
                            transition={{ duration: 0.3 }}
                          >
                            {selectedSkills.includes(skill.id) ? (
                              <div className="h-6 w-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                                <CheckCircle className="h-4 w-4 text-white" />
                              </div>
                            ) : (
                              <div className="h-6 w-6 rounded-full border-2 border-zinc-600" />
                            )}
                          </motion.div>
                        </div>
                      </div>
                    </EnhancedCardContent>
                  </EnhancedCard>
                </motion.div>
              ))}
            </div>

            <div className="flex gap-3">
              <EnhancedButton
                variant="outline"
                className="flex-1 h-12 border-zinc-700"
                onClick={() => onStepChange('goals')}
              >
                Back
              </EnhancedButton>
              <EnhancedButton
                variant="gradient"
                className="flex-1 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 shadow-[0_0_30px_rgba(168,85,247,0.5)] h-12 font-bold"
                onClick={onComplete}
                disabled={selectedSkills.length < 3 || selectedSkills.length > 4 || isSavingPreferences}
              >
                {isSavingPreferences ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    Start Journey
                    <Sparkles className="ml-2 h-5 w-5" />
                  </>
                )}
              </EnhancedButton>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

