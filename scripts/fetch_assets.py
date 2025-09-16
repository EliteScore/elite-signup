# scripts/fetch_assets.py
import os, shutil, zipfile, urllib.request
from pathlib import Path
from dotenv import load_dotenv, find_dotenv

# Load .env if present
load_dotenv(find_dotenv(), override=False)

# Always force the Heroku slug path during release
NLTK_DIR = Path(os.getenv("NLTK_DATA", "/app/nltk_data"))
SPACY_MODEL = os.getenv("SPACY_MODEL", "en_core_web_sm")
os.environ["NLTK_DATA"] = str(NLTK_DIR)

TARGET_WORDNET = NLTK_DIR / "corpora" / "wordnet"
NLTK_DIR.mkdir(parents=True, exist_ok=True)
(TARGET_WORDNET.parent).mkdir(parents=True, exist_ok=True)

def wordnet_ok(path: Path) -> bool:
    need = {"index.noun", "index.verb", "data.noun", "data.verb"}
    return path.exists() and need.issubset({p.name for p in path.glob("*")})

def download_with_nltk():
    import nltk
    for pkg in ["punkt","stopwords","wordnet","averaged_perceptron_tagger","maxent_ne_chunker","words"]:
        print(f"[release] downloading via nltk: {pkg}")
        nltk.download(pkg, download_dir=str(NLTK_DIR), quiet=False)

def manual_wordnet_fallback():
    # Official NLTK data zip URL
    URL = "https://raw.githubusercontent.com/nltk/nltk_data/gh-pages/packages/corpora/wordnet.zip"
    zip_path = NLTK_DIR / "wordnet.zip"
    print("[release] manual fetch:", URL)
    with urllib.request.urlopen(URL) as r, open(zip_path, "wb") as out:
        out.write(r.read())
    # Extract handling various internal layouts
    with zipfile.ZipFile(zip_path) as zf:
        bad = zf.testzip()
        if bad:
            raise RuntimeError(f"Corrupted zip member: {bad}")
        # clean target first
        shutil.rmtree(TARGET_WORDNET, ignore_errors=True)
        TARGET_WORDNET.mkdir(parents=True, exist_ok=True)
        for m in zf.namelist():
            if m.endswith("/"):
                continue
            norm = m.replace("\\", "/")
            # strip common prefixes to land files directly in .../corpora/wordnet/
            for pref in ("wordnet/", "dict/", "corpora/wordnet/"):
                if norm.startswith(pref):
                    norm = norm[len(pref):]
                    break
            dest = TARGET_WORDNET / norm.split("/")[-1]
            dest.parent.mkdir(parents=True, exist_ok=True)
            with zf.open(m) as src, open(dest, "wb") as out:
                out.write(src.read())
    zip_path.unlink(missing_ok=True)
    print("[release] manual wordnet extraction done")

def install_spacy_model():
    import spacy.cli
    print(f"[release] installing spaCy model: {SPACY_MODEL}")
    spacy.cli.download(SPACY_MODEL)

def main():
    print("[release] NLTK_DATA:", NLTK_DIR)
    # Clean any partial wordnet (rarely needed, but safe)
    shutil.rmtree(TARGET_WORDNET, ignore_errors=True)

    # 1) try nltk downloader
    download_with_nltk()

    # 2) validate; if not OK, do manual unzip fallback
    if not wordnet_ok(TARGET_WORDNET):
        print("[release] wordnet validation failed; running manual fallback")
        manual_wordnet_fallback()

    # 3) validate again
    if not wordnet_ok(TARGET_WORDNET):
        raise RuntimeError("WordNet still invalid after fallback")

    # 4) install spaCy model
    install_spacy_model()

    print("[release] Assets ready")

if __name__ == "__main__":
    main()
