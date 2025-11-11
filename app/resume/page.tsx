"use client"

import type React from "react"

import { useState } from "react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { ArrowRight, CheckCircle, FileText, GraduationCap, Info, Upload, X } from "lucide-react"

import { SiteHeader } from "@/components/site-header"
import { MainNav } from "@/components/main-nav"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function ResumePage() {
  const isAuthorized = useRequireAuth() // Protect this route
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
  
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2bbcff] border-t-transparent" />
      </div>
    )
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
    <div className="flex flex-col min-h-screen bg-black text-white overflow-x-hidden">
      {/* Header */}
      <SiteHeader title="Resume Analysis" showBackButton />

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20 px-4 py-6">
        <div className="max-w-md mx-auto">
          {uploadState === "initial" && (
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-xl">Upload Your Resume</CardTitle>
                <CardDescription className="text-zinc-400">
                  Get a personalized score and improvement suggestions based on your resume
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center hover:border-purple-500 transition-colors">
                  <input
                    type="file"
                    id="resume-upload"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center">
                      <Upload className="h-10 w-10 text-zinc-500 mb-2" />
                      {file ? (
                        <div className="flex items-center bg-zinc-800 px-3 py-2 rounded-lg">
                          <FileText className="h-4 w-4 mr-2 text-purple-400" />
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
                            <X className="h-4 w-4" />
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
                  <Info className="h-5 w-5 text-purple-400 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-zinc-400">
                    Your resume will be analyzed based on academic achievements (30%), extracurricular activities (40%),
                    and skills (30%).
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  disabled={!file}
                  onClick={handleUpload}
                >
                  Analyze Resume
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {uploadState === "uploading" && (
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-xl">Uploading Resume</CardTitle>
                <CardDescription className="text-zinc-400">Please wait while we upload your resume</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center py-8">
                  <div className="w-20 h-20 rounded-full border-4 border-t-purple-500 border-r-indigo-500 border-b-purple-500 border-l-transparent animate-spin"></div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading {file?.name}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress
                    value={uploadProgress}
                    className="h-2 bg-zinc-800"
                    indicatorClassName="bg-gradient-to-r from-purple-600 to-indigo-600"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {uploadState === "processing" && (
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-xl">Analyzing Resume</CardTitle>
                <CardDescription className="text-zinc-400">
                  Our AI is analyzing your resume to provide personalized insights
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center py-8">
                  <div className="w-20 h-20 rounded-full border-4 border-t-purple-500 border-r-indigo-500 border-b-purple-500 border-l-transparent animate-spin"></div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Analyzing resume content</span>
                    <span>{processingProgress}%</span>
                  </div>
                  <Progress
                    value={processingProgress}
                    className="h-2 bg-zinc-800"
                    indicatorClassName="bg-gradient-to-r from-purple-600 to-indigo-600"
                  />
                </div>
                <div className="text-sm text-zinc-400 italic">This may take a few moments...</div>
              </CardContent>
            </Card>
          )}

          {uploadState === "complete" && score !== null && scoreBreakdown !== null && (
            <div className="space-y-6">
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">Resume Analysis</CardTitle>
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                  <CardDescription className="text-zinc-400">Analysis completed successfully</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
                            <stop offset="0%" stopColor="#9333ea" />
                            <stop offset="100%" stopColor="#4f46e5" />
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
                      <p className="text-sm text-zinc-400 mt-1">This score represents your overall profile strength</p>
                    </div>
                  </div>

                  <Separator className="bg-zinc-800" />

                  <div>
                    <h3 className="font-medium mb-3">Score Breakdown</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center">
                            <GraduationCap className="h-4 w-4 mr-2 text-blue-400" />
                            <span className="text-sm">Academic Achievements (30%)</span>
                          </div>
                          <span className="text-sm font-medium">{scoreBreakdown.academic}</span>
                        </div>
                        <Progress
                          value={(scoreBreakdown.academic / 300) * 100}
                          className="h-2 bg-zinc-800"
                          indicatorClassName="bg-blue-500"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-green-400" />
                            <span className="text-sm">Extracurricular Activities (40%)</span>
                          </div>
                          <span className="text-sm font-medium">{scoreBreakdown.extracurricular}</span>
                        </div>
                        <Progress
                          value={(scoreBreakdown.extracurricular / 400) * 100}
                          className="h-2 bg-zinc-800"
                          indicatorClassName="bg-green-500"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-yellow-400" />
                            <span className="text-sm">Skills & Expertise (30%)</span>
                          </div>
                          <span className="text-sm font-medium">{scoreBreakdown.skills}</span>
                        </div>
                        <Progress
                          value={(scoreBreakdown.skills / 300) * 100}
                          className="h-2 bg-zinc-800"
                          indicatorClassName="bg-yellow-500"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Improvement Suggestions</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Based on your resume analysis, here are some areas to focus on
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start p-3 bg-zinc-800/50 rounded-lg">
                    <div className="bg-blue-900/30 p-2 rounded-full mr-3 flex-shrink-0">
                      <GraduationCap className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">Academic Improvement</h3>
                      <p className="text-xs text-zinc-400 mt-1">
                        Consider taking advanced courses in your field to strengthen your academic profile.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start p-3 bg-zinc-800/50 rounded-lg">
                    <div className="bg-green-900/30 p-2 rounded-full mr-3 flex-shrink-0">
                      <FileText className="h-4 w-4 text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">Extracurricular Enhancement</h3>
                      <p className="text-xs text-zinc-400 mt-1">
                        Join leadership positions in clubs or organizations related to your field of interest.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start p-3 bg-zinc-800/50 rounded-lg">
                    <div className="bg-yellow-900/30 p-2 rounded-full mr-3 flex-shrink-0">
                      <FileText className="h-4 w-4 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">Skills Development</h3>
                      <p className="text-xs text-zinc-400 mt-1">
                        Focus on developing technical skills like programming languages or data analysis tools.
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                    onClick={resetUpload}
                  >
                    Upload Another Resume
                  </Button>
                  <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                    View Detailed Report
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}

          {uploadState === "error" && (
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Upload Error</CardTitle>
                  <X className="h-6 w-6 text-red-500" />
                </div>
                <CardDescription className="text-zinc-400">There was an error processing your resume</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-900/20 border border-red-900/30 rounded-lg p-4 text-center">
                  <p className="text-red-400 mb-2">We couldn't process your resume file.</p>
                  <p className="text-sm text-zinc-400">
                    Please make sure it's in a supported format (PDF, DOC, DOCX) and try again.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  onClick={resetUpload}
                >
                  Try Again
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <MainNav />
    </div>
  )
}

