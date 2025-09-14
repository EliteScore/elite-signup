const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const FormData = require('form-data');

// Import fetch with compatibility handling
let fetch;
try {
    fetch = require('node-fetch').default || require('node-fetch');
} catch (e) {
    console.error('node-fetch not available, please install: npm install node-fetch@2');
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 8081;
const SIGNUPS_FILE = path.join(__dirname, 'beta-signups.json');

// Initialize signups file if it doesn't exist
if (!fs.existsSync(SIGNUPS_FILE)) {
    fs.writeFileSync(SIGNUPS_FILE, JSON.stringify([], null, 2));
}

// Load existing signups
let betaSignups = JSON.parse(fs.readFileSync(SIGNUPS_FILE, 'utf8'));

// Middleware
// Configure CORS for production
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'));
        }
    }
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Save signups to file
const saveSignups = () => {
    fs.writeFileSync(SIGNUPS_FILE, JSON.stringify(betaSignups, null, 2));
};

// Built-in CV Analysis Engine (based on your documentation)
const analyzeResumeContent = (filename, content, fileSize) => {
    console.log('Analyzing resume content...');
    
    const text = content.toLowerCase();
    
    // Education scoring (0-100)
    const educationScore = calculateEducationScore(text);
    
    // Experience scoring (0-100) 
    const experienceScore = calculateExperienceScore(text);
    
    // Skills scoring (0-100)
    const skillsScore = calculateSkillsScore(text);
    
    // AI Signal scoring (archetype matching)
    const aiSignalScore = calculateAISignalScore(text);
    
    // Overall weighted score (based on your documentation weights)
    const weights = { education: 0.25, experience: 0.35, skills: 0.20, ai_signal: 0.20 };
    const overallScore = Math.round(
        (educationScore * weights.education) +
        (experienceScore * weights.experience) + 
        (skillsScore * weights.skills) +
        (aiSignalScore * weights.ai_signal)
    );
    
    // Generate explanations
    const explanation = generateExplanation(text, {
        education: educationScore,
        experience: experienceScore, 
        skills: skillsScore,
        ai_signal: aiSignalScore
    });
    
    return {
        overall_score: overallScore,
        components: {
            education: educationScore,
            experience: experienceScore,
            skills: skillsScore,
            ai_signal: aiSignalScore
        },
        weights: weights,
        explanation: explanation,
        analysis: {
            filename: filename,
            file_size: fileSize,
            processed_at: new Date().toISOString(),
            service_used: 'built_in_cv_analyzer'
        }
    };
};

// Education scoring based on degree detection and keywords
const calculateEducationScore = (text) => {
    let score = 40; // Base score
    
    // Degree level detection
    if (text.includes('phd') || text.includes('doctorate')) score += 30;
    else if (text.includes('master') || text.includes('msc') || text.includes('ma ')) score += 25;
    else if (text.includes('bachelor') || text.includes('bsc') || text.includes('ba ') || text.includes('degree')) score += 20;
    else if (text.includes('diploma') || text.includes('certificate')) score += 10;
    
    // STEM keywords bonus
    const stemKeywords = ['engineering', 'computer science', 'mathematics', 'physics', 'chemistry', 'biology', 'technology', 'data science'];
    const stemCount = stemKeywords.filter(keyword => text.includes(keyword)).length;
    score += Math.min(15, stemCount * 3);
    
    // University indicators
    if (text.includes('university') || text.includes('college') || text.includes('institute')) score += 5;
    if (text.includes('.edu') || text.includes('academic')) score += 5;
    
    // Honors and achievements
    if (text.includes('magna cum laude') || text.includes('summa cum laude') || text.includes('honors')) score += 10;
    if (text.includes('gpa') && (text.includes('3.') || text.includes('4.'))) score += 5;
    
    return Math.min(100, Math.max(0, score));
};

// Experience scoring based on years and keywords
const calculateExperienceScore = (text) => {
    let score = 30; // Base score
    
    // Year range detection (simple heuristic)
    const yearMatches = text.match(/20\d{2}/g) || [];
    const uniqueYears = [...new Set(yearMatches)];
    const experienceYears = uniqueYears.length > 1 ? Math.max(...uniqueYears) - Math.min(...uniqueYears) : 0;
    
    // Experience length bonus
    if (experienceYears >= 5) score += 25;
    else if (experienceYears >= 3) score += 20;
    else if (experienceYears >= 1) score += 15;
    else if (experienceYears > 0) score += 10;
    
    // Leadership and responsibility keywords
    const leadershipKeywords = ['lead', 'manage', 'director', 'senior', 'head', 'supervisor', 'coordinator', 'team lead'];
    const leadershipCount = leadershipKeywords.filter(keyword => text.includes(keyword)).length;
    score += Math.min(15, leadershipCount * 3);
    
    // Professional keywords
    const professionalKeywords = ['developed', 'implemented', 'designed', 'created', 'built', 'managed', 'optimized', 'improved'];
    const professionalCount = professionalKeywords.filter(keyword => text.includes(keyword)).length;
    score += Math.min(20, professionalCount * 2);
    
    // Bullet point density (indicates structured experience)
    const bulletCount = (text.match(/•|·|\*|-/g) || []).length;
    if (bulletCount >= 10) score += 10;
    else if (bulletCount >= 5) score += 5;
    
    return Math.min(100, Math.max(0, score));
};

// Skills scoring based on breadth and depth
const calculateSkillsScore = (text) => {
    let score = 25; // Base score
    
    // Technical skills categories
    const skillCategories = {
        programming: ['python', 'javascript', 'java', 'c++', 'react', 'node', 'sql', 'html', 'css', 'php'],
        tools: ['git', 'docker', 'kubernetes', 'aws', 'azure', 'linux', 'windows', 'excel', 'powerpoint'],
        frameworks: ['react', 'angular', 'vue', 'django', 'flask', 'express', 'spring', 'laravel'],
        databases: ['mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'oracle'],
        design: ['photoshop', 'illustrator', 'figma', 'sketch', 'autocad', 'solidworks'],
        analytics: ['tableau', 'power bi', 'excel', 'r', 'matlab', 'spss', 'statistics']
    };
    
    let totalSkills = 0;
    let categoriesWithSkills = 0;
    
    for (const [category, skills] of Object.entries(skillCategories)) {
        const foundSkills = skills.filter(skill => text.includes(skill)).length;
        if (foundSkills > 0) {
            categoriesWithSkills++;
            totalSkills += foundSkills;
        }
    }
    
    // Breadth bonus (multiple categories)
    score += Math.min(25, categoriesWithSkills * 4);
    
    // Depth bonus (many skills)
    score += Math.min(30, totalSkills * 2);
    
    // Soft skills
    const softSkills = ['communication', 'leadership', 'teamwork', 'problem solving', 'analytical', 'creative'];
    const softSkillCount = softSkills.filter(skill => text.includes(skill)).length;
    score += Math.min(15, softSkillCount * 3);
    
    // Certifications
    if (text.includes('certified') || text.includes('certification')) score += 5;
    
    return Math.min(100, Math.max(0, score));
};

// AI Signal scoring (archetype matching)
const calculateAISignalScore = (text) => {
    const archetypes = {
        'Data Analyst': ['data', 'analysis', 'sql', 'python', 'statistics', 'visualization', 'tableau', 'excel'],
        'Software Engineer': ['software', 'programming', 'code', 'development', 'javascript', 'python', 'git', 'agile'],
        'Product Manager': ['product', 'strategy', 'roadmap', 'stakeholder', 'requirements', 'user experience', 'metrics'],
        'Marketing Specialist': ['marketing', 'campaign', 'social media', 'content', 'brand', 'analytics', 'seo'],
        'Mechanical Engineer': ['mechanical', 'design', 'cad', 'manufacturing', 'materials', 'testing', 'autocad'],
        'Research Scientist': ['research', 'publication', 'experiment', 'methodology', 'analysis', 'phd', 'laboratory']
    };
    
    let bestMatch = { name: 'General', score: 30 };
    
    for (const [archetype, keywords] of Object.entries(archetypes)) {
        const matches = keywords.filter(keyword => text.includes(keyword)).length;
        const matchPercentage = (matches / keywords.length) * 100;
        
        if (matchPercentage > bestMatch.score) {
            bestMatch = { name: archetype, score: Math.round(matchPercentage) };
        }
    }
    
    return Math.min(100, Math.max(30, bestMatch.score));
};

// Generate detailed explanations
const generateExplanation = (text, scores) => {
    const strengths = [];
    const weaknesses = [];
    const highlights = [];
    
    // Analyze strengths
    if (scores.education >= 80) strengths.push("Strong educational background");
    if (scores.experience >= 80) strengths.push("Extensive professional experience");
    if (scores.skills >= 80) strengths.push("Comprehensive skill set");
    
    // Analyze weaknesses  
    if (scores.education < 60) weaknesses.push("Consider highlighting educational achievements");
    if (scores.experience < 60) weaknesses.push("Add more detailed work experience");
    if (scores.skills < 60) weaknesses.push("Include more technical skills");
    
    // Generate highlights
    if (text.includes('lead') || text.includes('manage')) highlights.push("Leadership experience demonstrated");
    if (text.includes('project')) highlights.push("Project management experience");
    if ((text.match(/•|·|\*|-/g) || []).length >= 8) highlights.push("Well-structured resume with clear formatting");
    
    // Archetype matching
    const archetypes = [
        { name: "Data Analyst", match_pct: text.includes('data') ? 85 : 45 },
        { name: "Software Engineer", match_pct: text.includes('software') || text.includes('programming') ? 80 : 40 },
        { name: "Product Manager", match_pct: text.includes('product') ? 75 : 35 }
    ].sort((a, b) => b.match_pct - a.match_pct);
    
    return {
        highlights: highlights.length > 0 ? highlights : ["Resume processed successfully"],
        top_archetype_matches: archetypes.slice(0, 3),
        component_details: {
            education: scores.education >= 70 ? "Strong academic foundation" : "Consider adding educational details",
            experience: scores.experience >= 70 ? "Good professional background" : "Add more work experience details", 
            skills: scores.skills >= 70 ? "Solid skill set" : "Include more relevant technical skills",
            ai_signal: scores.ai_signal >= 70 ? "Clear professional focus" : "Consider clarifying career direction"
        },
        notes: {
            strengths: strengths.length > 0 ? strengths : ["Professional presentation", "Clear formatting", "Relevant content"],
            weaknesses: weaknesses.length > 0 ? weaknesses : ["Consider adding more quantified achievements", "Include specific metrics where possible", "Add more industry keywords"]
        }
    };
};

// Pre-signup endpoint
app.post('/v1/auth/pre-signup', (req, res) => {
    const { username, email } = req.body;
    
    console.log('Received signup request:', { username, email });
    
    if (!username || !email) {
        return res.status(400).json({
            success: false,
            message: "All fields must be completed",
            data: null
        });
    }
    
    // Check if email already exists
    const exists = betaSignups.find(signup => signup.email === email);
    if (exists) {
        console.log('Duplicate email detected:', email);
        return res.status(409).json({
            success: false,
            message: "User with this email already exists",
            data: null
        });
    }
    
    // Add to signups
    const newSignup = { username, email, timestamp: new Date().toISOString() };
    betaSignups.push(newSignup);
    saveSignups();
    
    console.log('New beta signup added:', newSignup);
    console.log('Total signups:', betaSignups.length);
    
    return res.status(200).json({
        success: true,
        message: "User registered successfully",
        data: null
    });
});

// Status endpoint
app.get('/v1/status', (req, res) => {
    res.json({
        status: 'ok',
        signups: betaSignups.length,
        uptime: process.uptime()
    });
});

// List signups (for testing)
app.get('/v1/signups', (req, res) => {
    res.json({
        success: true,
        count: betaSignups.length,
        data: betaSignups
    });
});

// Resume scoring endpoint
app.post('/v1/parser/resume/score', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'No file provided'
            });
        }

        console.log('Resume upload received:', {
            filename: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype
        });

        // Validate file type (additional check)
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(req.file.mimetype)) {
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);
            return res.status(400).json({
                error: 'Invalid file type. Please upload a PDF, DOC, or DOCX file.'
            });
        }

        // Enhanced resume detection by filename patterns
        const filename = req.file.originalname.toLowerCase();
        const resumeKeywords = ['resume', 'cv', 'curriculum vitae', 'curriculum_vitae'];
        const nonResumeKeywords = [
            'contract', 'agreement', 'invoice', 'receipt', 'bill', 'statement',
            'injury', 'medical', 'report', 'document', 'letter', 'proposal',
            'presentation', 'slides', 'notes', 'manual', 'guide', 'handbook',
            'policy', 'procedure', 'form', 'application', 'license', 'certificate',
            'transcript', 'diploma', 'degree', 'assignment', 'homework', 'project',
            'essay', 'paper', 'research', 'thesis', 'dissertation', 'book',
            'ebook', 'novel', 'story', 'article', 'blog', 'newsletter',
            'brochure', 'flyer', 'poster', 'banner', 'card', 'invitation'
        ];
        
        const hasResumeKeywords = resumeKeywords.some(keyword => filename.includes(keyword));
        const hasNonResumeKeywords = nonResumeKeywords.some(keyword => filename.includes(keyword));
        
        // More strict validation: require resume keywords OR reject non-resume keywords
        if (hasNonResumeKeywords || (!hasResumeKeywords && !filename.includes('resume') && !filename.includes('cv'))) {
            // Additional check for common resume patterns
            const hasPersonalNamePattern = /^[a-z]+[_\s-]+[a-z]+/i.test(filename); // "john_doe" or "jane smith"
            const hasResumePattern = /resume|cv|curriculum/i.test(filename);
            
            // Only allow if it has personal name pattern AND no obvious non-resume keywords
            if (!hasResumePattern && (hasNonResumeKeywords || !hasPersonalNamePattern)) {
                // Clean up uploaded file
                fs.unlinkSync(req.file.path);
                return res.status(400).json({
                    error: 'This file does not appear to be a resume. Please upload your resume or CV with a proper filename (e.g., "John_Doe_Resume.pdf", "Jane_Smith_CV.docx").'
                });
            }
        }

        // Additional file size validation for resumes
        const fileSizeKB = req.file.size / 1024;
        if (fileSizeKB < 10 || fileSizeKB > 5000) { // Less than 10KB or more than 5MB is suspicious
            if (fileSizeKB < 10) {
                fs.unlinkSync(req.file.path);
                return res.status(400).json({
                    error: 'File too small to be a proper resume. Please upload a complete resume document.'
                });
            }
            if (fileSizeKB > 5000) {
                fs.unlinkSync(req.file.path);
                return res.status(400).json({
                    error: 'File too large for a typical resume. Please upload a standard resume document (under 5MB).'
                });
            }
        }

        // Built-in CV scoring service - no external dependencies!
        console.log('Processing resume with built-in CV analyzer...');
        
        // Read the file for analysis
        const fileContent = fs.readFileSync(req.file.path);
        const fileText = fileContent.toString('utf8', 0, Math.min(1000, fileContent.length)); // Sample for analysis
        
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        // Heuristic resume analysis based on your documentation
        const analysis = analyzeResumeContent(req.file.originalname, fileText, req.file.size);
        
        console.log('Built-in CV analysis complete:', analysis);
        
        return res.json(analysis);
    } catch (error) {
        console.error('Resume scoring error:', error);
        
        // Clean up uploaded file if it exists
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (cleanupError) {
                console.error('File cleanup error:', cleanupError);
            }
        }
        
        res.status(500).json({
            error: 'Failed to process resume. Please try again.'
        });
    }
});

// Health check
app.get('/', (req, res) => {
    res.send('Beta Signup Backend Server is running!');
});

app.listen(PORT, () => {
    console.log(`\n🚀 Beta Signup Backend Server is running!`);
    console.log(`📡 Server URL: http://localhost:${PORT}`);
    console.log(`\n📌 Available endpoints:`);
    console.log(`   POST /v1/auth/pre-signup        - Register for beta`);
    console.log(`   POST /v1/parser/resume/score    - Score resume files`);
    console.log(`   GET  /v1/status                 - Check server status`);
    console.log(`   GET  /v1/signups                - List all signups`);
    console.log(`\n💾 Signups are saved to: ${SIGNUPS_FILE}`);
    console.log(`📊 Current signups: ${betaSignups.length}`);
    console.log('\n✨ Ready to accept beta signups!\n');
});