import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Get the uploaded file from the form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a PDF, DOC, or DOCX file.' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB.' },
        { status: 400 }
      )
    }

    // Try forwarding to external CV service if configured
    const cvServiceUrl = process.env.CV_SERVICE_URL
    if (cvServiceUrl) {
      try {
        const backendFormData = new FormData()
        backendFormData.append('file', file)
        const response = await fetch(`${cvServiceUrl}/v1/parser/resume/score`, {
          method: 'POST',
          body: backendFormData,
        })
        if (response.ok) {
          const result = await response.json()
          return NextResponse.json(result)
        } else {
          const errorText = await response.text()
          console.error('CV service error:', response.status, errorText)
        }
      } catch (err) {
        console.error('CV service unreachable, falling back to heuristic:', err)
      }
    }

    // Built-in heuristic fallback: read a small chunk and score
    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    const sampleText = new TextDecoder('utf-8').decode(bytes.subarray(0, Math.min(2000, bytes.length))).toLowerCase()

    const score = scoreResumeHeuristically(file.name, sampleText, file.size)
    return NextResponse.json(score)
    
  } catch (error) {
    console.error('Resume scoring API error:', error)
    
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}

type HeuristicScores = {
  overall_score: number
  components: {
    education: number
    experience: number
    skills: number
    ai_signal: number
  }
  weights: Record<string, number>
  explanation: any
  analysis: {
    filename: string
    file_size: number
    processed_at: string
    service_used: string
  }
}

function scoreResumeHeuristically(filename: string, text: string, fileSize: number): HeuristicScores {
  const education = scoreEducation(text)
  const experience = scoreExperience(text)
  const skills = scoreSkills(text)
  const aiSignal = scoreAISignal(text)
  const weights = { education: 0.25, experience: 0.35, skills: 0.2, ai_signal: 0.2 }
  const overall = Math.round(
    education * weights.education +
    experience * weights.experience +
    skills * weights.skills +
    aiSignal * weights.ai_signal
  )

  return {
    overall_score: overall,
    components: { education, experience, skills, ai_signal: aiSignal },
    weights,
    explanation: buildExplanation(text, { education, experience, skills, ai_signal: aiSignal }),
    analysis: {
      filename,
      file_size: fileSize,
      processed_at: new Date().toISOString(),
      service_used: 'heuristic_fallback',
    },
  }
}

function scoreEducation(text: string): number {
  let score = 40
  if (text.includes('phd') || text.includes('doctorate')) score += 30
  else if (text.includes('master') || text.includes('msc') || text.includes('m.s.') || text.includes('ma ')) score += 25
  else if (text.includes('bachelor') || text.includes('bsc') || text.includes('b.s.') || text.includes('ba ') || text.includes('degree')) score += 20
  else if (text.includes('diploma') || text.includes('certificate')) score += 10
  const stem = ['engineering','computer science','mathematics','physics','chemistry','biology','technology','data science']
  score += Math.min(15, stem.filter(k=>text.includes(k)).length * 3)
  if (text.includes('university') || text.includes('college') || text.includes('institute')) score += 5
  if (text.includes('.edu') || text.includes('academic')) score += 5
  if (text.includes('magna cum laude') || text.includes('summa cum laude') || text.includes('honors')) score += 10
  if (text.includes('gpa') && (text.includes('3.') || text.includes('4.'))) score += 5
  return Math.max(0, Math.min(100, score))
}

function scoreExperience(text: string): number {
  let score = 30
  const yearMatches = text.match(/20\d{2}/g) || []
  const years = Array.from(new Set(yearMatches)).map(Number)
  const range = years.length > 1 ? Math.max(...years) - Math.min(...years) : 0
  if (range >= 5) score += 25
  else if (range >= 3) score += 20
  else if (range >= 1) score += 15
  else if (range > 0) score += 10
  const leadership = ['lead','manage','director','senior','head','supervisor','coordinator','team lead']
  score += Math.min(15, leadership.filter(k=>text.includes(k)).length * 3)
  const verbs = ['developed','implemented','designed','created','built','managed','optimized','improved']
  score += Math.min(20, verbs.filter(k=>text.includes(k)).length * 2)
  const bulletCount = (text.match(/•|·|\*|-/g) || []).length
  if (bulletCount >= 10) score += 10
  else if (bulletCount >= 5) score += 5
  return Math.max(0, Math.min(100, score))
}

function scoreSkills(text: string): number {
  let score = 25
  const categories: Record<string,string[]> = {
    programming: ['python','javascript','java','c++','react','node','sql','html','css','php'],
    tools: ['git','docker','kubernetes','aws','azure','linux','windows','excel','powerpoint'],
    frameworks: ['react','angular','vue','django','flask','express','spring','laravel'],
    databases: ['mysql','postgresql','mongodb','redis','sqlite','oracle'],
    design: ['photoshop','illustrator','figma','sketch','autocad','solidworks'],
    analytics: ['tableau','power bi','excel','r','matlab','spss','statistics'],
  }
  let total = 0
  let cats = 0
  for (const key of Object.keys(categories) as (keyof typeof categories)[]) {
    const arr = categories[key] ?? []
    const count = arr.filter(s=>text.includes(s)).length
    if (count > 0) {
      cats++
      total += count
    }
  }
  score += Math.min(25, cats * 4)
  score += Math.min(30, total * 2)
  const soft = ['communication','leadership','teamwork','problem solving','analytical','creative']
  score += Math.min(15, soft.filter(s=>text.includes(s)).length * 3)
  if (text.includes('certified') || text.includes('certification')) score += 5
  return Math.max(0, Math.min(100, score))
}

function scoreAISignal(text: string): number {
  const archetypes: Record<string,string[]> = {
    'Data Analyst': ['data','analysis','sql','python','statistics','visualization','tableau','excel'],
    'Software Engineer': ['software','programming','code','development','javascript','python','git','agile'],
    'Product Manager': ['product','strategy','roadmap','stakeholder','requirements','user experience','metrics'],
    'Marketing Specialist': ['marketing','campaign','social media','content','brand','analytics','seo'],
    'Mechanical Engineer': ['mechanical','design','cad','manufacturing','materials','testing','autocad'],
    'Research Scientist': ['research','publication','experiment','methodology','analysis','phd','laboratory'],
  }
  let best = 30
  for (const key of Object.keys(archetypes) as (keyof typeof archetypes)[]) {
    const words = archetypes[key] ?? []
    const matches = words.filter(w=>text.includes(w)).length
    const pct = (matches / (words.length || 1)) * 100
    if (pct > best) best = Math.round(pct)
  }
  return Math.max(30, Math.min(100, best))
}

function buildExplanation(text: string, scores: { education: number; experience: number; skills: number; ai_signal: number }) {
  const strengths: string[] = []
  const weaknesses: string[] = []
  const highlights: string[] = []
  if (scores.education >= 80) strengths.push('Strong educational background')
  if (scores.experience >= 80) strengths.push('Extensive professional experience')
  if (scores.skills >= 80) strengths.push('Comprehensive skill set')
  if (scores.education < 60) weaknesses.push('Consider highlighting educational achievements')
  if (scores.experience < 60) weaknesses.push('Add more detailed work experience')
  if (scores.skills < 60) weaknesses.push('Include more technical skills')
  if (text.includes('lead') || text.includes('manage')) highlights.push('Leadership experience demonstrated')
  if (text.includes('project')) highlights.push('Project management experience')
  if ((text.match(/•|·|\*|-/g) || []).length >= 8) highlights.push('Well-structured resume with clear formatting')
  const archetypes = [
    { name: 'Data Analyst', match_pct: text.includes('data') ? 85 : 45 },
    { name: 'Software Engineer', match_pct: text.includes('software') || text.includes('programming') ? 80 : 40 },
    { name: 'Product Manager', match_pct: text.includes('product') ? 75 : 35 },
  ].sort((a,b)=>b.match_pct - a.match_pct)
  return {
    highlights: highlights.length ? highlights : ['Resume processed successfully'],
    top_archetype_matches: archetypes.slice(0, 3),
    component_details: {
      education: scores.education >= 70 ? 'Strong academic foundation' : 'Consider adding educational details',
      experience: scores.experience >= 70 ? 'Good professional background' : 'Add more work experience details',
      skills: scores.skills >= 70 ? 'Solid skill set' : 'Include more relevant technical skills',
      ai_signal: scores.ai_signal >= 70 ? 'Clear professional focus' : 'Consider clarifying career direction',
    },
    notes: {
      strengths: strengths.length ? strengths : ['Professional presentation', 'Clear formatting', 'Relevant content'],
      weaknesses: weaknesses.length ? weaknesses : ['Consider adding more quantified achievements', 'Include specific metrics where possible', 'Add more industry keywords'],
    },
  }
}
