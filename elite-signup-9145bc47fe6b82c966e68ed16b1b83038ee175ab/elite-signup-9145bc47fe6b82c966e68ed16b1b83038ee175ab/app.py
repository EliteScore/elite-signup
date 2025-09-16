import os
import tempfile
from typing import Dict, List

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from nltk.data import find
import nltk
from spacy.util import get_package_path
from pyresparser import ResumeParser

from cv_rater import rate_dict

# ---------- Config ----------
# NLTK data directory (Heroku will prefer $NLTK_DATA if set)

NLTK_DATA_DIR = os.getenv("NLTK_DATA", os.path.join(os.getcwd(), "nltk_data"))
os.environ["NLTK_DATA"] = NLTK_DATA_DIR

# Mapping of NLTK packages to their internal paths
NLTK_RESOURCES: Dict[str, str] = {
    "punkt": "tokenizers/punkt",
    "stopwords": "corpora/stopwords",
    "wordnet": "corpora/wordnet",
    "averaged_perceptron_tagger": "taggers/averaged_perceptron_tagger",
    "maxent_ne_chunker": "chunkers/maxent_ne_chunker",
    "words": "corpora/words",
}

# spaCy model name (default: small English model)
SPACY_MODEL = os.getenv("SPACY_MODEL", "en_core_web_sm")

# ---------- FastAPI instance ----------
app = FastAPI(title="Resume Parser & Scorer API")


# ---------- NLTK Utility Functions ----------
def nltk_status(resources: Dict[str, str]) -> Dict[str, Dict[str, str]]:
    """
    Checks the availability of all required NLTK resources.

    Args:
        resources (Dict[str, str]): Mapping of resource name to NLTK internal path.

    Returns:
        Dict[str, Dict[str, str]]: Dictionary containing availability and path/error.
    """
    status = {}
    for name, path in resources.items():
        try:
            find(path)
            status[name] = {"available": True, "path": path}
        except LookupError as e:
            status[name] = {"available": False, "error": str(e)}
    return status


def ensure_nltk(resources: Dict[str, str], auto_download: bool = False) -> List[str]:
    """
    Ensure all required NLTK resources exist. Optionally download missing ones.

    Args:
        resources (Dict[str, str]): Mapping of NLTK resources.
        auto_download (bool): If True, downloads missing resources at runtime.

    Returns:
        List[str]: List of missing resource names after attempted downloads.
    """
    missing = []
    for name, path in resources.items():
        try:
            find(path)
        except LookupError:
            missing.append(name)
    if auto_download and missing:
        os.makedirs(NLTK_DATA_DIR, exist_ok=True)
        for name in list(missing):
            try:
                nltk.download(name, download_dir=NLTK_DATA_DIR, quiet=True)
                find(resources[name])
                missing.remove(name)
            except Exception:
                pass
    return missing


# ---------- spaCy Utility Functions ----------
def spacy_status(model_name: str) -> Dict[str, str]:
    """
    Checks if the spaCy model is installed and available.

    Args:
        model_name (str): Name of the spaCy model.

    Returns:
        Dict[str, str]: Availability status and optional error message.
    """
    try:
        get_package_path(model_name)
        return {"available": True, "model": model_name}
    except Exception as e:
        return {"available": False, "model": model_name, "error": str(e)}


def ensure_spacy(model_name: str, auto_download: bool = False) -> bool:
    """
    Ensure the spaCy model is available. Optionally download at runtime.

    Args:
        model_name (str): Name of the spaCy model.
        auto_download (bool): If True, attempt download if model is missing.

    Returns:
        bool: True if model is available, False otherwise.
    """
    ok = spacy_status(model_name)["available"]
    if ok:
        return True
    if auto_download:
        try:
            import spacy.cli
            spacy.cli.download(model_name)
            return spacy_status(model_name)["available"]
        except Exception:
            return False
    return False


# ---------- FastAPI Events ----------
@app.on_event("startup")
def _startup():
    """
    Startup event handler: verifies NLTK and spaCy resources.
    """
    auto_nltk = os.getenv("AUTO_DOWNLOAD_NLTK", "false").lower() in {"1", "true", "yes"}
    auto_spacy = os.getenv("AUTO_DOWNLOAD_SPACY", "false").lower() in {"1", "true", "yes"}

    missing_nltk = ensure_nltk(NLTK_RESOURCES, auto_download=auto_nltk)
    if missing_nltk:
        print(f"[startup] Missing NLTK resources: {missing_nltk}")
    else:
        print("[startup] NLTK resources available")

    sp_ok = ensure_spacy(SPACY_MODEL, auto_download=auto_spacy)
    print(f"[startup] spaCy model '{SPACY_MODEL}' available: {sp_ok}")


# ---------- Health Check ----------
@app.get("/health")
def health():
    """
    Returns health status and availability of required NLP resources.

    Returns:
        JSONResponse: Dictionary with NLTK, spaCy, and overall status.
    """
    nstatus = nltk_status(NLTK_RESOURCES)
    missing = [k for k, v in nstatus.items() if not v["available"]]
    sstatus = spacy_status(SPACY_MODEL)
    ok = (len(missing) == 0) and sstatus["available"]

    payload = {
        "status": "ok" if ok else "degraded",
        "nltk_data_dir": NLTK_DATA_DIR,
        "nltk": nstatus,
        "spacy": sstatus,
        "missing": {"nltk": missing, "spacy_model_missing": not sstatus["available"]},
    }
    return JSONResponse(status_code=200 if ok else 503, content=payload)


# ---------- Resume Parsing & Scoring ----------
@app.post("/api/resume/score")
async def parse_resume(file: UploadFile = File(...)):
    """
    Parses an uploaded resume and returns a JSON rating.

    Args:
        file (UploadFile): Resume file (PDF/DOCX).

    Returns:
        JSONResponse: Parsed resume data with rating.

    Raises:
        HTTPException: If parsing fails.
    """
    suffix = os.path.splitext(file.filename or "")[1] or ".pdf"
    path = None

    try:
        # Write file to temporary path
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await file.read())
            path = tmp.name

        # Parse resume to JSON
        data = ResumeParser(path).get_extracted_data() or {}

        # Rate parsed data
        output = rate_dict(data)
        return JSONResponse(content=output, media_type="application/json")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Parse error: {e}")
    finally:
        # Cleanup temp file
        if path:
            try:
                os.remove(path)
            except Exception:
                pass
