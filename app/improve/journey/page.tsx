"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Upload,
  Award,
  Star,
  FileText,
  Target,
  Briefcase,
  Code,
  BookOpen,
  Dumbbell,
  Brain,
  Lightbulb,
  Rocket,
} from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

// Available goals
const goals = [
  {
    id: "career-growth",
    title: "Career Growth",
    description: "Advance in your current career path",
    icon: <Briefcase className="h-6 w-6" />,
    color: "bg-primary-500",
  },
  {
    id: "skill-development",
    title: "Skill Development",
    description: "Learn new skills or improve existing ones",
    icon: <Code className="h-6 w-6" />,
    color: "bg-secondary-500",
  },
  {
    id: "education",
    title: "Education",
    description: "Pursue further education or certifications",
    icon: <BookOpen className="h-6 w-6" />,
    color: "bg-accent-success",
  },
  {
    id: "physical-fitness",
    title: "Physical Fitness",
    description: "Improve your physical health and fitness",
    icon: <Dumbbell className="h-6 w-6" />,
    color: "bg-accent-error",
  },
  {
    id: "mental-wellbeing",
    title: "Mental Wellbeing",
    description: "Enhance your mental health and mindfulness",
    icon: <Brain className="h-6 w-6" />,
    color: "bg-accent-warning",
  },
  {
    id: "innovation",
    title: "Innovation & Creativity",
    description: "Develop creative thinking and innovation skills",
    icon: <Lightbulb className="h-6 w-6" />,
    color: "bg-orange-500",
  },
]

// Available interests
const interests = [
  {
    id: "programming",
    title: "Programming",
    icon: <Code className="h-5 w-5" />,
    color: "bg-primary-500/20 border-primary-500/30",
  },
  {
    id: "design",
    title: "Design",
    icon: <Lightbulb className="h-5 w-5" />,
    color: "bg-secondary-500/20 border-secondary-500/30",
  },
  {
    id: "data-science",
    title: "Data Science",
    icon: <Brain className="h-5 w-5" />,
    color: "bg-accent-success/20 border-accent-success/30",
  },
  {
    id: "leadership",
    title: "Leadership",
    icon: <Target className="h-5 w-5" />,
    color: "bg-accent-error/20 border-accent-error/30",
  },
  {
    id: "public-speaking",
    title: "Public Speaking",
    icon: <Award className="h-5 w-5" />,
    color: "bg-accent-warning/20 border-accent-warning/30",
  },
  {
    id: "writing",
    title: "Writing",
    icon: <FileText className="h-5 w-5" />,
    color: "bg-indigo-500/20 border-indigo-500/30",
  },
  {
    id: "fitness",
    title: "Fitness",
    icon: <Dumbbell className="h-5 w-5" />,
    color: "bg-orange-500/20 border-orange-500/30",
  },
  {
    id: "meditation",
    title: "Meditation",
    icon: <Brain className="h-5 w-5" />,
    color: "bg-teal-500/20 border-teal-500/30",
  },
  {
    id: "networking",
    title: "Networking",
    icon: <Briefcase className="h-5 w-5" />,
    color: "bg-pink-500/20 border-pink-500/30",
  },
  {
    id: "entrepreneurship",
    title: "Entrepreneurship",
    icon: <Rocket className="h-5 w-5" />,
    color: "bg-cyan-500/20 border-cyan-500/30",
  },
]

export default function ImprovementJourneyPage() {
  const isAuthorized = useRequireAuth() // Protect this route
  const router = useRouter()

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2bbcff] border-t-transparent" />
      </div>
    )
  }
  const [step, setStep] = useState(1)
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [profession, setProfession] = useState("")
  const [uploadState, setUploadState] = useState<"initial" | "uploading" | "processing" | "complete" | "error">(
    "initial",
  )
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const [score, setScore] = useState<number | null>(null)
  const [scoreBreakdown, setScoreBreakdown] = useState<{
    academic: number
    extracurricular: number
    skills: number
    total: number
  } | null>(null)

  const totalSteps = 4
  const progress = (step / totalSteps) * 100

  const handleNextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1)
      window.scrollTo(0, 0)
    } else {
      // Complete the journey
      router.push("/improve")
    }
  }

  const handlePreviousStep = () => {
    if (step > 1) {
      setStep(step - 1)
      window.scrollTo(0, 0)
    } else {
      router.push("/improve")
    }
  }

  const toggleInterest = (interestId: string) => {
    if (selectedInterests.includes(interestId)) {
      setSelectedInterests(selectedInterests.filter((id) => id !== interestId))
    } else {
      if (selectedInterests.length < 5) {
        setSelectedInterests([...selectedInterests, interestId])
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = () => {
    if (!file) return

    setUploadState("uploading")
    setUploadProgress(0)

    // Simulate upload progress
    const uploadInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(uploadInterval)
          setUploadState("processing")
          simulateProcessing()
          return 100
        }
        return prev + 10
      })
    }, 300)
  }

  const simulateProcessing = () => {
    setProcessingProgress(0)

    // Simulate processing progress
    const processingInterval = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(processingInterval)
          setUploadState("complete")
          // Set mock score and breakdown
          setScore(785)
          setScoreBreakdown({
            academic: 230, // 30% of 785 = ~235
            extracurricular: 315, // 40% of 785 = ~314
            skills: 240, // 30% of 785 = ~235
            total: 785,
          })
          return 100
        }
        return prev + 5
      })
    }, 400)
  }

  const resetUpload = () => {
    setUploadState("initial")
    setUploadProgress(0)
    setProcessingProgress(0)
    setFile(null)
    setScore(null)
    setScoreBreakdown(null)
  }

  return (
    <AppShell title="Improvement Journey" showBackButton backUrl="/improve">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-zinc-400">
              Step {step} of {totalSteps}
            </span>
            <span className="text-zinc-400">{Math.round(progress)}%</span>
          </div>
          <Progress
            value={progress}
            className="h-2 bg-zinc-800 overflow-hidden relative progress-animate"
            indicatorClassName="bg-gradient-to-r from-primary-600 to-secondary-600"
          />
        </div>

        {/* Step 1: Select Goal */}
        {step === 1 && (
          <EnhancedCard variant="default" hover="lift" animation="fadeIn">
            <EnhancedCardHeader>
              <EnhancedCardTitle className="text-xl">Select Your Primary Goal</EnhancedCardTitle>
              <EnhancedCardDescription className="text-zinc-400">
                Choose the main area you want to focus on for your improvement journey
              </EnhancedCardDescription>
            </EnhancedCardHeader>
            <EnhancedCardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {goals.map((goal) => (
                  <div
                    key={goal.id}
                    className={cn(
                      "flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-300",
                      selectedGoal === goal.id
                        ? "border-primary-500 bg-primary-900/20"
                        : "border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900",
                    )}
                    onClick={() => setSelectedGoal(goal.id)}
                  >
                    <div className={cn("p-2 rounded-full mr-3", goal.color)}>{goal.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-medium">{goal.title}</h3>
                      <p className="text-sm text-zinc-400">{goal.description}</p>
                    </div>
                    {selectedGoal === goal.id && (
                      <div className="h-5 w-5 bg-primary-500 rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </EnhancedCardContent>
            <EnhancedCardFooter>
              <EnhancedButton
                variant="gradient"
                rounded="full"
                animation="shimmer"
                className="w-full"
                disabled={!selectedGoal}
                onClick={handleNextStep}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Continue
              </EnhancedButton>
            </EnhancedCardFooter>
          </EnhancedCard>
        )}

        {/* Step 2: Enter Profession */}
        {step === 2 && (
          <EnhancedCard variant="default" hover="lift" animation="fadeIn">
            <EnhancedCardHeader>
              <EnhancedCardTitle className="text-xl">Your Profession</EnhancedCardTitle>
              <EnhancedCardDescription className="text-zinc-400">
                Tell us about your current profession or career path
              </EnhancedCardDescription>
            </EnhancedCardHeader>
            <EnhancedCardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profession">Current Profession</Label>
                <Input
                  id="profession"
                  placeholder="e.g., Software Engineer, Student, Marketing Manager"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white focus:border-primary-500 transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Years of Experience</Label>
                <RadioGroup defaultValue="1-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="0-1" id="exp-0-1" />
                    <Label htmlFor="exp-0-1">0-1 years</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1-3" id="exp-1-3" />
                    <Label htmlFor="exp-1-3">1-3 years</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="3-5" id="exp-3-5" />
                    <Label htmlFor="exp-3-5">3-5 years</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="5+" id="exp-5+" />
                    <Label htmlFor="exp-5+">5+ years</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="goals">Career Goals (Optional)</Label>
                <Textarea
                  id="goals"
                  placeholder="Briefly describe your career goals and aspirations..."
                  className="bg-zinc-800 border-zinc-700 text-white min-h-[100px] focus:border-primary-500 transition-all duration-300"
                />
              </div>
            </EnhancedCardContent>
            <EnhancedCardFooter className="flex justify-between">
              <EnhancedButton
                variant="outline"
                rounded="full"
                className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                leftIcon={<ArrowLeft className="h-4 w-4" />}
                onClick={handlePreviousStep}
              >
                Back
              </EnhancedButton>
              <EnhancedButton
                variant="gradient"
                rounded="full"
                animation="shimmer"
                disabled={!profession.trim()}
                rightIcon={<ArrowRight className="h-4 w-4" />}
                onClick={handleNextStep}
              >
                Continue
              </EnhancedButton>
            </EnhancedCardFooter>
          </EnhancedCard>
        )}

        {/* Step 3: Select Interests */}
        {step === 3 && (
          <EnhancedCard variant="default" hover="lift" animation="fadeIn">
            <EnhancedCardHeader>
              <EnhancedCardTitle className="text-xl">Select Your Interests</EnhancedCardTitle>
              <EnhancedCardDescription className="text-zinc-400">
                Choose up to 5 areas you're interested in improving
              </EnhancedCardDescription>
            </EnhancedCardHeader>
            <EnhancedCardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {interests.map((interest) => (
                  <Badge
                    key={interest.id}
                    className={cn(
                      "cursor-pointer py-2 px-3 text-sm transition-all duration-300 hover:shadow-md interactive",
                      selectedInterests.includes(interest.id)
                        ? "bg-primary-900/50 text-primary-100 border-primary-500"
                        : interest.color,
                    )}
                    onClick={() => toggleInterest(interest.id)}
                  >
                    <div className="flex items-center">
                      {interest.icon}
                      <span className="ml-1">{interest.title}</span>
                      {selectedInterests.includes(interest.id) && <Check className="ml-1 h-3 w-3" />}
                    </div>
                  </Badge>
                ))}
              </div>
              <div className="text-sm text-zinc-400 mt-2">{selectedInterests.length}/5 interests selected</div>
            </EnhancedCardContent>
            <EnhancedCardFooter className="flex justify-between">
              <EnhancedButton
                variant="outline"
                rounded="full"
                className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                leftIcon={<ArrowLeft className="h-4 w-4" />}
                onClick={handlePreviousStep}
              >
                Back
              </EnhancedButton>
              <EnhancedButton
                variant="gradient"
                rounded="full"
                animation="shimmer"
                disabled={selectedInterests.length === 0}
                rightIcon={<ArrowRight className="h-4 w-4" />}
                onClick={handleNextStep}
              >
                Continue
              </EnhancedButton>
            </EnhancedCardFooter>
          </EnhancedCard>
        )}

        {/* Step 4: Upload Resume */}
        {step === 4 && (
          <div className="space-y-6">
            {uploadState === "initial" && (
              <EnhancedCard variant="default" hover="lift" animation="fadeIn">
                <EnhancedCardHeader>
                  <EnhancedCardTitle className="text-xl">Upload Your Resume</EnhancedCardTitle>
                  <EnhancedCardDescription className="text-zinc-400">
                    Get a personalized score and improvement suggestions based on your resume
                  </EnhancedCardDescription>
                </EnhancedCardHeader>
                <EnhancedCardContent className="space-y-4">
                  <div className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center hover:border-primary-500 transition-all duration-300">
                    <input
                      type="file"
                      id="resume-upload"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                    />
                    <label htmlFor="resume-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center">
                        <Upload className="h-10 w-10 text-zinc-500 mb-2 animate-bounce" />
                        {file ? (
                          <div className="flex items-center bg-zinc-800 px-3 py-2 rounded-lg">
                            <FileText className="h-4 w-4 mr-2 text-primary-400" />
                            <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 ml-2 text-zinc-400"
                              onClick={(e) => {
                                e.preventDefault()
                                setFile(null)
                              }}
                            >
                              <ArrowLeft className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <p className="text-zinc-400 mb-1">Drag and drop your resume here</p>
                            <p className="text-zinc-500 text-sm">or click to browse files</p>
                            <p className="text-zinc-600 text-xs mt-2">Supported formats: PDF, DOC, DOCX</p>
                          </>
                        )}
                      </div>
                    </label>
                  </div>

                  <div className="bg-zinc-800/50 rounded-lg p-3 flex items-start">
                    <Award className="h-5 w-5 text-primary-400 mr-2 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-zinc-400">
                      Your resume will be analyzed based on academic achievements (30%), extracurricular activities
                      (40%), and skills (30%).
                    </div>
                  </div>
                </EnhancedCardContent>
                <EnhancedCardFooter className="flex justify-between">
                  <EnhancedButton
                    variant="outline"
                    rounded="full"
                    className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                    leftIcon={<ArrowLeft className="h-4 w-4" />}
                    onClick={handlePreviousStep}
                  >
                    Back
                  </EnhancedButton>
                  <EnhancedButton
                    variant="gradient"
                    rounded="full"
                    animation="shimmer"
                    disabled={!file}
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                    onClick={handleUpload}
                  >
                    Analyze Resume
                  </EnhancedButton>
                </EnhancedCardFooter>
              </EnhancedCard>
            )}

            {uploadState === "uploading" && (
              <EnhancedCard variant="default" hover="lift" animation="fadeIn">
                <EnhancedCardHeader>
                  <EnhancedCardTitle className="text-xl">Uploading Resume</EnhancedCardTitle>
                  <EnhancedCardDescription className="text-zinc-400">
                    Please wait while we upload your resume
                  </EnhancedCardDescription>
                </EnhancedCardHeader>
                <EnhancedCardContent className="space-y-4">
                  <div className="flex items-center justify-center py-8">
                    <div className="w-20 h-20 rounded-full border-4 border-t-primary-500 border-r-secondary-500 border-b-primary-500 border-l-transparent animate-spin"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Uploading {file?.name}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress
                      value={uploadProgress}
                      className="h-2 bg-zinc-800"
                      indicatorClassName="bg-gradient-to-r from-primary-600 to-secondary-600"
                    />
                  </div>
                </EnhancedCardContent>
              </EnhancedCard>
            )}

            {uploadState === "processing" && (
              <EnhancedCard variant="default" hover="lift" animation="fadeIn">
                <EnhancedCardHeader>
                  <EnhancedCardTitle className="text-xl">Analyzing Resume</EnhancedCardTitle>
                  <EnhancedCardDescription className="text-zinc-400">
                    Our AI is analyzing your resume to provide personalized insights
                  </EnhancedCardDescription>
                </EnhancedCardHeader>
                <EnhancedCardContent className="space-y-4">
                  <div className="flex items-center justify-center py-8">
                    <div className="w-20 h-20 rounded-full border-4 border-t-primary-500 border-r-secondary-500 border-b-primary-500 border-l-transparent animate-spin"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Analyzing resume content</span>
                      <span>{processingProgress}%</span>
                    </div>
                    <Progress
                      value={processingProgress}
                      className="h-2 bg-zinc-800"
                      indicatorClassName="bg-gradient-to-r from-primary-600 to-secondary-600"
                    />
                  </div>
                  <div className="text-sm text-zinc-400 italic">This may take a few moments...</div>
                </EnhancedCardContent>
              </EnhancedCard>
            )}

            {uploadState === "complete" && score !== null && scoreBreakdown !== null && (
              <div className="space-y-6">
                <EnhancedCard variant="gradient" hover="lift" animation="fadeIn">
                  <EnhancedCardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <EnhancedCardTitle className="text-xl">Resume Analysis</EnhancedCardTitle>
                      <Check className="h-6 w-6 text-accent-success" />
                    </div>
                    <EnhancedCardDescription className="text-zinc-400">
                      Analysis completed successfully
                    </EnhancedCardDescription>
                  </EnhancedCardHeader>
                  <EnhancedCardContent className="space-y-6">
                    <div className="flex flex-col items-center py-4">
                      <div className="relative">
                        <svg className="w-36 h-36" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="#27272a" strokeWidth="10" />
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="url(#gradient)"
                            strokeWidth="10"
                            strokeDasharray="283"
                            strokeDashoffset={283 - 283 * (score / 1000)}
                            transform="rotate(-90 50 50)"
                          />
                          <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#6941e8" />
                              <stop offset="100%" stopColor="#0967d2" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-bold">{score}</span>
                          <span className="text-xs text-zinc-400">out of 1000</span>
                        </div>
                      </div>
                      <div className="mt-4 text-center">
                        <h3 className="font-medium text-lg">Your Resume Score</h3>
                        <p className="text-sm text-zinc-400 mt-1">
                          This score represents your overall profile strength
                        </p>
                      </div>
                    </div>

                    <Separator className="my-6" />

                    <div>
                      <h3 className="font-medium mb-3">Score Breakdown</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center">
                              <BookOpen className="h-4 w-4 mr-2 text-secondary-400" />
                              <span className="text-sm">Academic Achievements (30%)</span>
                            </div>
                            <span className="text-sm font-medium">{scoreBreakdown.academic}</span>
                          </div>
                          <Progress
                            value={(scoreBreakdown.academic / 300) * 100}
                            className="h-2 bg-zinc-800"
                            indicatorClassName="bg-secondary-500"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-2 text-accent-success" />
                              <span className="text-sm">Extracurricular Activities (40%)</span>
                            </div>
                            <span className="text-sm font-medium">{scoreBreakdown.extracurricular}</span>
                          </div>
                          <Progress
                            value={(scoreBreakdown.extracurricular / 400) * 100}
                            className="h-2 bg-zinc-800"
                            indicatorClassName="bg-accent-success"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 mr-2 text-accent-warning" />
                              <span className="text-sm">Skills & Expertise (30%)</span>
                            </div>
                            <span className="text-sm font-medium">{scoreBreakdown.skills}</span>
                          </div>
                          <Progress
                            value={(scoreBreakdown.skills / 300) * 100}
                            className="h-2 bg-zinc-800"
                            indicatorClassName="bg-accent-warning"
                          />
                        </div>
                      </div>
                    </div>
                  </EnhancedCardContent>
                  <EnhancedCardFooter>
                    <EnhancedButton
                      variant="gradient"
                      rounded="full"
                      animation="shimmer"
                      className="w-full"
                      onClick={handleNextStep}
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                    >
                      Complete Setup
                    </EnhancedButton>
                  </EnhancedCardFooter>
                </EnhancedCard>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}

