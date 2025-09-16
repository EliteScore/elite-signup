# Resume Parsing and Scoring API

This project provides a FastAPI-based HTTP service that accepts resume files, extracts structured information using [pyresparser](https://github.com/OmkarPathak/pyresparser), and produces a score using a custom `cv_rater` module.  

It is designed to run locally for development and on Heroku for deployment.  
The setup ensures all required NLP resources from NLTK and spaCy are available at runtime.

---

## Features

- Health check endpoint (`/health`) verifies that required NLTK corpora and the spaCy model are installed.
- Resume parsing endpoint (`/api/resume/score`) accepts a PDF or DOCX file upload, parses it, and returns a JSON response with extracted fields and a score.
- Heroku deployment configuration via `Procfile` and release phase script that pre-downloads NLTK and spaCy assets.
- `.env` file for configuration, loaded via `python-dotenv`. No system environment variables required.

---

## Project Structure

```
file-parse-api/
├─ app.py                # FastAPI app entrypoint
├─ cv_rater.py           # Custom scoring logic
├─ .env                  # Configuration (safe to commit if no secrets)
├─ requirements.txt      # Python dependencies
├─ Procfile              # Heroku process types
├─ runtime.txt           # Python version for Heroku
├─ scripts/
│  └─ fetch_assets.py    # Downloads NLTK corpora and spaCy model at build time
├─ .gitignore            # Ignore venv, caches, local data
└─ nltk_data/            # Local-only cache of NLTK corpora (ignored by git)
```

---

## Endpoints

### GET `/health`
Returns service status and availability of NLTK and spaCy resources.  

Example:
```json
{
  "status": "ok",
  "nltk_data_dir": "./nltk_data",
  "nltk": {
    "wordnet": { "available": true, "path": "corpora/wordnet" },
    "punkt": { "available": true, "path": "tokenizers/punkt" }
  },
  "spacy": { "available": true, "model": "en_core_web_sm" },
  "missing": { "nltk": [], "spacy_model_missing": false }
}
```

### POST `/api/resume/score`
Parses and scores an uploaded resume file.

Example (curl):
```bash
curl -X POST http://127.0.0.1:9000/api/resume/score   -F "file=@/path/to/resume.pdf"
```

Response:
```json
{
  "score": 12,
  "parsed": {
    "name": "John Doe",
    "email": "john@example.com",
    "skills": ["Python", "FastAPI", "NLP"]
  }
}
```

---

## Local Development

1. Clone the repository.
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Linux/Mac
   .\.venv\Scriptsctivate   # Windows
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Ensure NLTK data is available locally:
   ```bash
   python -m nltk.downloader -d ./nltk_data punkt stopwords wordnet averaged_perceptron_tagger maxent_ne_chunker words
   python -m spacy download en_core_web_sm
   ```
5. Start the server:
   ```bash
   uvicorn app:app --host 127.0.0.1 --port 9000 --reload
   ```

---

## Deployment on Heroku

1. Ensure the repo is pushed to GitHub.
2. Connect the GitHub repo to a Heroku app in the Heroku dashboard.
3. On deployment, Heroku will:
   - Install dependencies from `requirements.txt`.
   - Run `scripts/fetch_assets.py` in the release phase to fetch NLTK corpora and spaCy model into the slug.
   - Start the API with `uvicorn`.

The `.env` file is committed so the app runs with the same config locally and on Heroku.

---

## Configuration

The following settings are loaded from `.env`:

- `NLTK_DATA`: Path to NLTK data directory. Use `./nltk_data` locally, `/app/nltk_data` on Heroku.
- `SPACY_MODEL`: SpaCy model name (default: `en_core_web_sm`).
- `AUTO_DOWNLOAD_NLTK`: If set to `true`, missing NLTK corpora will be downloaded at startup (useful locally).
- `AUTO_DOWNLOAD_SPACY`: If set to `true`, spaCy model will be downloaded at startup (useful locally).

---

## Cleanup

To reset the environment locally:
```bash
deactivate
rm -rf .venv nltk_data
```

To remove the app from Heroku:
```bash
heroku apps:destroy --app <your-app-name> --confirm <your-app-name>
```
