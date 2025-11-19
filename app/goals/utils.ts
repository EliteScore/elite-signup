import {
  Code,
  Users,
  BookOpen,
  Mic,
  Rocket,
  Target,
} from "lucide-react"
import { goalCategories, activityPreferences } from "./constants"

// Helper function to map challenge data to icon based on goals/activities/tags
export const getChallengeIcon = (challenge: any) => {
  // Check activities first
  if (challenge.activities && challenge.activities.length > 0) {
    const activityName = challenge.activities[0]
    const activity = activityPreferences.find(a => a.name === activityName)
    if (activity) return activity.icon
  }
  
  // Check goals
  if (challenge.goals && challenge.goals.length > 0) {
    const goalName = challenge.goals[0]
    const goal = goalCategories.find(g => g.name === goalName)
    if (goal) return goal.icon
  }
  
  // Check tags for common keywords
  if (challenge.tags && challenge.tags.length > 0) {
    const tags = challenge.tags.map((t: string) => t.toLowerCase())
    if (tags.some((t: string) => t.includes('code') || t.includes('programming'))) return Code
    if (tags.some((t: string) => t.includes('network') || t.includes('connect'))) return Users
    if (tags.some((t: string) => t.includes('read') || t.includes('book'))) return BookOpen
    if (tags.some((t: string) => t.includes('speak') || t.includes('present'))) return Mic
    if (tags.some((t: string) => t.includes('project') || t.includes('build'))) return Rocket
  }
  
  // Default icon
  return Target
}

// Helper function to get category from goals/activities
export const getChallengeCategory = (challenge: any): string => {
  if (challenge.activities && challenge.activities.length > 0) {
    const activityName = challenge.activities[0]
    const activity = activityPreferences.find(a => a.name === activityName)
    if (activity) return activity.category
  }
  
  if (challenge.goals && challenge.goals.length > 0) {
    const goalName = challenge.goals[0]
    const goal = goalCategories.find(g => g.name === goalName)
    if (goal) return goal.id
  }
  
  return "learning"
}

// Map API challenge to component format
export const mapApiChallengeToComponent = (apiChallenge: any) => {
  const icon = getChallengeIcon(apiChallenge)
  const category = getChallengeCategory(apiChallenge)
  const difficulty = apiChallenge.difficulty 
    ? apiChallenge.difficulty.charAt(0).toUpperCase() + apiChallenge.difficulty.slice(1)
    : "Medium"
  const timeEstimate = apiChallenge.est_minutes 
    ? `${apiChallenge.est_minutes} mins`
    : "30 mins"
  
  return {
    id: apiChallenge.challenge_id || apiChallenge.uc_id,
    uc_id: apiChallenge.uc_id,
    title: apiChallenge.title || "Untitled Challenge",
    description: apiChallenge.description || "",
    xp: apiChallenge.base_xp || 100,
    difficulty,
    timeEstimate,
    category,
    icon,
    participants: 0, // Not in API response
    completions: 0, // Not in API response
    status: apiChallenge.status,
    progress_pct: apiChallenge.progress_pct || 0,
    due_at: apiChallenge.due_at,
    goals: apiChallenge.goals || [],
    activities: apiChallenge.activities || [],
    tags: apiChallenge.tags || [],
    cadence: apiChallenge.cadence || "daily",
  }
}

