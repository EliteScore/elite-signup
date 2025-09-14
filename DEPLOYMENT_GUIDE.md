# Complete Deployment Guide

## 🚀 Deploy EliteScore Resume Scoring to Your Domain

This guide covers deploying both your frontend and the CV scoring service to work together.

## Prerequisites

- Your domain (e.g., `yourdomain.com`)
- Heroku account (for CV service)
- Vercel/Netlify account (for frontend) OR your own server

## Part 1: Deploy CV Scoring Service to Heroku

### 1. Create CV Service Repository

Create a new repository with these files based on your documentation:

**Directory Structure:**
```
cv-service/
├── app.py                 # FastAPI app
├── cv_rater.py           # Scoring engine
├── requirements.txt      # Dependencies
├── Procfile             # web: uvicorn app:app --host 0.0.0.0 --port $PORT
├── .python-version      # 3.9
├── nltk.txt            # NLTK dependencies
└── data/               # Lexicon files
    ├── skills.txt
    ├── archetypes.txt
    └── ...
```

### 2. Deploy to Heroku

```bash
# Create Heroku app
heroku create your-cv-service-name

# Set Python version
echo "3.9" > .python-version

# Deploy
git add .
git commit -m "Deploy CV service"
git push heroku main

# Get your Heroku URL
heroku info
```

Your CV service will be at: `https://your-cv-service-name.herokuapp.com`

## Part 2: Update Frontend Configuration

### 1. Update Backend Service URL

Create `.env.production` in your project root:

```env
# Production CV Service URL
CV_SERVICE_URL=https://your-cv-service-name.herokuapp.com
RESUME_API_URL=https://yourdomain.com

# For local development
NEXT_PUBLIC_API_URL=https://yourdomain.com
```

### 2. Update Backend Server

Your `backend-server.js` is already configured! Just make sure it reads the environment variable:

```javascript
const realCvServiceUrl = process.env.CV_SERVICE_URL || 'https://your-cv-service-name.herokuapp.com';
```

## Part 3: Deploy Frontend Options

### Option A: Deploy to Vercel (Recommended)

1. **Connect Repository:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure domain: `yourdomain.com`

2. **Environment Variables:**
   ```
   CV_SERVICE_URL=https://your-cv-service-name.herokuapp.com
   RESUME_API_URL=https://yourdomain.com
   ```

3. **Deploy:**
   - Vercel auto-deploys on push
   - Your site will be live at `yourdomain.com`

### Option B: Deploy to Your Own Server

1. **Build the Application:**
   ```bash
   npm run build
   npm start
   ```

2. **Configure Reverse Proxy (Nginx):**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

## Part 4: Test the Complete System

### 1. Test CV Service Directly

```bash
curl -X POST "https://your-cv-service-name.herokuapp.com/v1/parser/resume/score" \
  -F "file=@your-resume.pdf"
```

Expected response:
```json
{
  "overall_score": 78.6,
  "components": {
    "education": 72.5,
    "experience": 81.2,
    "skills": 74.0,
    "ai_signal": 79.3
  },
  "explanation": {
    "top_archetype_matches": [
      {"name": "Data Analyst", "match_pct": 84.1}
    ],
    "notes": {
      "strengths": ["Strong technical background"],
      "weaknesses": ["Consider adding more projects"]
    }
  }
}
```

### 2. Test Complete Flow

1. Visit `https://yourdomain.com`
2. Navigate to "Score Your Resume" section
3. Upload a proper resume (filename should contain "resume" or "cv")
4. Verify you get real analysis-based scores

## Part 5: Environment Variables Summary

### Frontend (.env.production)
```env
CV_SERVICE_URL=https://your-cv-service-name.herokuapp.com
RESUME_API_URL=https://yourdomain.com
```

### CV Service (Heroku Config Vars)
```env
NLTK_DATA=/app/.heroku/python/nltk_data
SPACY_MODEL=en_core_web_sm
AUTO_DOWNLOAD_NLTK=false
AUTO_DOWNLOAD_SPACY=false
```

## Part 6: Domain Configuration

### DNS Settings
Point your domain to your hosting provider:

**For Vercel:**
- Add CNAME: `yourdomain.com` → `cname.vercel-dns.com`

**For Custom Server:**
- Add A Record: `yourdomain.com` → `your-server-ip`

## Part 7: SSL Certificate

### Automatic (Vercel/Netlify)
- SSL certificates are automatically provisioned

### Manual (Custom Server)
```bash
# Using Let's Encrypt
sudo certbot --nginx -d yourdomain.com
```

## Troubleshooting

### CV Service Issues
```bash
# Check service health
curl https://your-cv-service-name.herokuapp.com/v1/parser/health

# Check logs
heroku logs --tail -a your-cv-service-name
```

### Frontend Issues
```bash
# Check API connectivity
curl https://yourdomain.com/api/resume/score

# Local testing
npm run dev
```

## Final Checklist

- [ ] CV service deployed to Heroku
- [ ] CV service health check passes
- [ ] Frontend deployed to your domain
- [ ] Environment variables configured
- [ ] DNS pointing to hosting provider
- [ ] SSL certificate active
- [ ] Resume upload works end-to-end
- [ ] Real CV scoring returns proper analysis

## Expected Flow

1. **User uploads resume** → `yourdomain.com`
2. **Frontend validates** → File type, size, filename
3. **Calls backend API** → `yourdomain.com/api/resume/score`
4. **Backend forwards to CV service** → `your-cv-service-name.herokuapp.com/v1/parser/resume/score`
5. **CV service analyzes** → Real spaCy/NLTK processing
6. **Returns detailed scores** → Education, Experience, Skills, AI Signal
7. **Frontend displays results** → Beautiful score breakdown with explanations

Your resume scoring system will now be fully deployed and functional on your domain! 🎉
