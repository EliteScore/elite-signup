#!/usr/bin/env python3
"""
CV Rater — Heuristics-first, data-driven, Heroku-friendly.

- NO heavy deps (no transformers/torch).
- If sentence-transformers is present, uses it. Else BOW cosine with numpy.
- Loads rich domain lexicons from ./data if present (overrides defaults):
    skills.txt, tooling_keywords.txt, stem_terms.txt, archetypes.txt
    cert_keywords.txt, seniority_cues.txt, strong_skills.txt,
    proficiency_terms.txt, stopwords.txt,
    buckets/*.txt  (each file = one bucket of related skills/keywords)
"""
from __future__ import annotations
import json, math, re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple, Set

import numpy as np

# Optional light embeddings
try:
    from sentence_transformers import SentenceTransformer
    _HAS_ST = True
except Exception:
    _HAS_ST = False

# ---------------------------
# Built-in defaults (overridable by ./data files)
# ---------------------------

DEFAULT_STOPWORDS = {
    "a","an","the","and","or","but","if","then","else","for","while","of","to","in","on","at","by","with","from",
    "is","are","was","were","be","been","being","as","that","this","these","those","it","its","i","we","you","they",
    "he","she","him","her","them","our","your","their","my","me","us","do","did","done","does","have","has","had",
    "will","would","can","could","may","might","must","should",
}

DEFAULT_CERT_KEYWORDS = {
    "aws certified","aws solutions architect","aws developer","azure fundamentals","gcp professional",
    "security+","network+","ccna","ccnp","pmp","scrum master","cspo","itil",
}

DEFAULT_SENIORITY_CUES = {
    "principal": 10, "staff": 8, "senior": 7, "lead": 7, "head": 6, "manager": 6, "director": 8, "vp": 10,
}
DEFAULT_LEADERSHIP_CUES = {"led","leader","leadership","organized","coordinated","managed","owner","owned"}

DEFAULT_STRONG_SKILLS = {
    "python","java","c++","c#","javascript","sql","solidworks","analytics","biology","chemistry","physics","modeling","research"
}

DEFAULT_BUCKETS = {
    "programming": {"python","java","c","c++","c#","javascript","typescript","go","rust","r","sql","scala"},
    "web": {"node.js","react","vue","angular","next.js","django","flask","fastapi"},
    "devops": {"docker","kubernetes","terraform","ci","cd","pipeline","github actions","jenkins"},
    "data": {"analytics","statistics","excel","pandas","numpy","scikit-learn","tensorflow","pytorch","modeling","data analysis"},
    "cloud": {"aws","azure","gcp","cloud"},
    "cad_eng": {"solidworks","cad","engineering","electrical","mechanical","autocad"},
    "science": {"biology","chemistry","physics","geochemistry","petrology","earth","ocean"},
    "language": {"spanish","french","german","mandarin"},
    "teaching": {"teaching","mentoring","tutoring","lecturer","ta"},
}

DEFAULT_PROF_TERMS = {
    3: {"expert","advanced","proficient","strong"},
    2: {"intermediate","working knowledge"},
    1: {"beginner","familiar","basic"},
}

_MONTHS = {
    "jan":1,"january":1,"feb":2,"february":2,"mar":3,"march":3,"apr":4,"april":4,"may":5,"jun":6,"june":6,"jul":7,"july":7,
    "aug":8,"august":8,"sep":9,"sept":9,"september":9,"oct":10,"october":10,"nov":11,"november":11,"dec":12,"december":12
}

_SKILL_NORMALIZE = {
    "py": "python","nodejs": "node.js","node": "node.js","js": "javascript","ts": "typescript",
    "reactjs": "react","react.js": "react","vuejs": "vue","vue.js": "vue",
    "c sharp": "c#","c plus plus": "c++","sql server": "sql","postgresql": "postgres","sklearn": "scikit-learn",
}

# ---------------------------
# File loaders (safe, optional)
# ---------------------------

def _read_lines(path: Path) -> List[str]:
    if not path.exists(): return []
    return [ln.strip() for ln in path.read_text(encoding="utf-8").splitlines()
            if ln.strip() and not ln.strip().startswith("#")]

def _load_set(path: Path) -> Optional[Set[str]]:
    rows = _read_lines(path)
    return {r.lower() for r in rows} if rows else None

def _load_map_int(path: Path) -> Optional[Dict[str,int]]:
    """
    Lines like:
      senior : 7
      principal : 10
    """
    rows = _read_lines(path)
    if not rows: return None
    out: Dict[str,int] = {}
    for ln in rows:
        if ":" in ln:
            k, v = ln.split(":", 1)
            k = k.strip().lower()
            try: out[k] = int(v.strip())
            except: pass
    return out or None

def _load_prof_terms(path: Path) -> Optional[Dict[int,Set[str]]]:
    """
    Lines like:
      expert:3
      advanced:3
      proficient:3
      intermediate:2
      beginner:1
      familiar:1
      working knowledge:2
    """
    rows = _read_lines(path)
    if not rows: return None
    out: Dict[int,Set[str]] = {1:set(),2:set(),3:set()}
    for ln in rows:
        if ":" in ln:
            term, lvl = ln.split(":", 1)
            term = term.strip().lower()
            try:
                n = int(lvl.strip())
                if n in (1,2,3): out[n].add(term)
            except: pass
    return out

def _load_buckets_dir(dirpath: Path) -> Optional[Dict[str,Set[str]]]:
    if not dirpath.exists() or not dirpath.is_dir():
        return None
    out: Dict[str,Set[str]] = {}
    for p in sorted(dirpath.glob("*.txt")):
        items = _load_set(p) or set()
        if items:
            out[p.stem.lower()] = items
    return out or None

# ---------------------------
# Tokenization & small utils
# ---------------------------

def _tokenize(text: str) -> List[str]:
    parts = re.findall(r"[A-Za-z][A-Za-z0-9.+#]*|\+\+|R|C\+\+|C#", text)
    return [p for p in parts if p]

def _norm_skill(s: str) -> str:
    s = s.strip().lower()
    return _SKILL_NORMALIZE.get(s, s)

def _sigmoid(x: float) -> float:
    return 1.0 / (1.0 + math.exp(-x))

def _normalize_0_100(x: float, lo: float, hi: float) -> float:
    if hi == lo: return 0.0
    return max(0.0, min(100.0, 100.0 * (x - lo) / (hi - lo)))

def _flatten_strings(obj: Any) -> List[str]:
    out: List[str] = []
    if isinstance(obj, str):
        out.append(obj)
    elif isinstance(obj, (int, float)):
        out.append(str(obj))
    elif isinstance(obj, list):
        for it in obj: out.extend(_flatten_strings(it))
    elif isinstance(obj, dict):
        for v in obj.values(): out.extend(_flatten_strings(v))
    return out

def _extract_email(text: str):
    m = re.search(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b", text)
    return m.group(0) if m else None

def _extract_phone(text: str):
    m = re.search(r"(\+?\d[\d\-\s()]{7,}\d)", text)
    return m.group(0) if m else None

def _extract_gpa(text: str) -> Optional[float]:
    m = re.search(r"\b(?:c?gpa)[:\s]*([0-9]+(?:\.[0-9]+)?)\s*(?:/\s*([0-9]+(?:\.[0-9]+)?))?", text.lower())
    if not m: return None
    val = float(m.group(1))
    base = float(m.group(2)) if m.group(2) else (10.0 if val <= 10.0 else 4.0)
    if base <= 0: return None
    return 4.0 * (val / base)

def _has_honors(text: str) -> bool:
    t = text.lower()
    return any(k in t for k in ("summa cum laude","magna cum laude","cum laude","dean's list","honors","distinction","valedictorian"))

def _count_metrics(text: str) -> int:
    return len(re.findall(r"\b\d+(?:\.\d+)?\s*%|\$\s*\d|\b\d{2,}\b", text))

def _explicit_years_phrases(text: str) -> Optional[float]:
    t = text.lower()
    vals = []
    for m in re.findall(r"(\d+(?:\.\d+)?)\s*(?:\+|plus)?\s*(?:years|yrs|yr)\b", t):
        try: vals.append(float(m))
        except: pass
    return max(vals) if vals else None

# ---------------------------
# Data classes
# ---------------------------

@dataclass
class ComponentScores:
    education: float
    experience: float
    skills: float
    ai_signal: float
    def overall(self, w: Tuple[float,float,float,float]) -> float:
        e,x,s,a = self.education, self.experience, self.skills, self.ai_signal
        total = e*w[0] + x*w[1] + s*w[2] + a*w[3]
        return max(0.0, min(100.0, total))

# ---------------------------
# Main rater
# ---------------------------

class CVRater:
    def __init__(self, data_dir: str = "data", model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
                 device: Optional[str] = None, weights: Tuple[float,float,float,float]=(0.25,0.35,0.20,0.20)):
        self.data_dir = Path(data_dir)
        self.model_name = model_name
        self.device = device
        self.weights = weights
        self._model = None

        # Base lexicons (original four; safe if empty)
        self.skills_lex = set(_read_lines(self.data_dir / "skills.txt"))
        self.skills_lex = {s.lower() for s in self.skills_lex}
        self.tool_keywords = set(_read_lines(self.data_dir / "tooling_keywords.txt"))
        self.tool_keywords = {s.lower() for s in self.tool_keywords}
        self.stem_terms = set(_read_lines(self.data_dir / "stem_terms.txt"))
        self.stem_terms = {s.lower() for s in self.stem_terms}

        self.archetypes: Dict[str,str] = {}
        for ln in _read_lines(self.data_dir / "archetypes.txt"):
            if ":" in ln:
                name, desc = ln.split(":", 1)
                self.archetypes[name.strip()] = desc.strip()
        if not self.archetypes:
            self.archetypes = {"general": "Well-rounded candidate with education, experience, and relevant skills."}

        # Optional overrides
        self.stopwords = _load_set(self.data_dir / "stopwords.txt") or DEFAULT_STOPWORDS
        self.cert_keywords = _load_set(self.data_dir / "cert_keywords.txt") or DEFAULT_CERT_KEYWORDS
        self.seniority_cues = _load_map_int(self.data_dir / "seniority_cues.txt") or DEFAULT_SENIORITY_CUES
        self.strong_skills = _load_set(self.data_dir / "strong_skills.txt") or DEFAULT_STRONG_SKILLS
        self.prof_terms = _load_prof_terms(self.data_dir / "proficiency_terms.txt") or DEFAULT_PROF_TERMS

        buckets_dir = self.data_dir / "buckets"
        self.buckets = _load_buckets_dir(buckets_dir) or DEFAULT_BUCKETS

        # convenience: union of all bucket terms (for quick skill surfacing)
        self.bucket_union: Set[str] = set()
        for s in self.buckets.values():
            self.bucket_union |= set(map(str.lower, s))

    def _ensure_model(self):
        if self._model is None and _HAS_ST:
            try:
                self._model = SentenceTransformer(self.model_name, device=self.device)
            except Exception:
                self._model = None

    # ---------------------------
    # Public API
    # ---------------------------

    def rate(self, cv: Dict[str,Any], explain: bool=True) -> Dict[str,Any]:
        f = self._flex_parse(cv)
        ed = self._score_education(f)
        ex = self._score_experience(f)
        sk = self._score_skills(f)
        ai = self._score_ai_signal(f)
        comps = ComponentScores(ed, ex, sk, ai)
        out = {
            "overall_score": round(comps.overall(self.weights), 1),
            "components": {"education": round(ed,1), "experience": round(ex,1), "skills": round(sk,1), "ai_signal": round(ai,1)},
            "weights": {"education": self.weights[0], "experience": self.weights[1], "skills": self.weights[2], "ai_signal": self.weights[3]}
        }
        if explain: out["explanation"] = self._explain(f, comps)
        return out

    # ---------------------------
    # Parsing / feature building
    # ---------------------------

    def _flex_parse(self, cv: Dict[str,Any]) -> Dict[str,Any]:
        all_strings = _flatten_strings(cv)
        aggregate_text = "\n".join([s for s in all_strings if isinstance(s, str)])

        email = next((e for s in all_strings if isinstance(s,str) and (e:=_extract_email(s))), None)
        phone = next((p for s in all_strings if isinstance(s,str) and (p:=_extract_phone(s))), None)

        degree_text = ""
        deg_field = cv.get("degree")
        if isinstance(deg_field, str): degree_text = deg_field
        elif isinstance(deg_field, list): degree_text = " ".join([str(x) for x in deg_field if isinstance(x, (str,int,float))])
        if _extract_email(degree_text or ""): degree_text = ""

        college_text = cv.get("college_name") if isinstance(cv.get("college_name"), str) else ""

        # skills: provided + lexicon + buckets
        skills: Set[str] = set()
        if isinstance(cv.get("skills"), list):
            for s in cv["skills"]:
                if isinstance(s, str) and s.strip():
                    skills.add(_norm_skill(s))
        tokens = [_norm_skill(t.lower()) for t in _tokenize(aggregate_text)]
        # n-grams from tokens against skills_lex
        for ng in self._generate_ngrams(tokens, 3):
            if ng in self.skills_lex:
                skills.add(ng)
        # bucket-backed surfacing
        for t in tokens:
            if t in self.bucket_union:
                skills.add(t)

        years = _explicit_years_phrases(aggregate_text)
        if years is None:
            years = self._infer_years_from_text(aggregate_text)

        exp_text = ""
        for k in ("experience","work_experience","employment","positions"):
            if k in cv and isinstance(cv[k], list):
                exp_text = " ".join([str(x) for x in cv[k] if isinstance(x, (str,int,float))])
                break
        if not exp_text: exp_text = aggregate_text

        gpa = _extract_gpa(aggregate_text)  # normalized to 4.0
        honors = _has_honors(aggregate_text)
        certs = self._count_certs(aggregate_text)

        return {
            "aggregate_text": aggregate_text,
            "email": email, "phone": phone,
            "degree_text": degree_text, "college_text": college_text,
            "skills": sorted(skills),
            "experience_text": exp_text,
            "total_experience_years": float(years or 0.0),
            "gpa4": gpa, "honors": honors, "cert_count": certs,
            "last_year": self._last_year(aggregate_text),
        }

    def _generate_ngrams(self, tokens: List[str], max_n: int = 3) -> List[str]:
        out = []
        n = len(tokens)
        for L in range(1, max_n + 1):
            for i in range(n - L + 1):
                out.append(" ".join(tokens[i:i+L]))
        return out

    def _last_year(self, text: str) -> Optional[int]:
        ys = [int(y) for y in re.findall(r"\b((?:19|20)\d{2})\b", text)]
        return max(ys) if ys else None

    def _infer_years_from_text(self, text: str) -> float:
        t = text.lower()
        from datetime import datetime
        cur = datetime.now()
        cur_y, cur_m = cur.year, cur.month
        months = 0

        # Month-aware spans
        for sm, sy, em, ey in re.findall(
            r"(?:(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+(\d{4}))\s*(?:-|to|–|—)\s*(?:(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+(\d{4})|present|now|current)",
            t
        ):
            sy, sm = int(sy), _MONTHS.get(sm, 1)
            if ey in ("present","now","current"):
                ey, em = cur_y, cur_m
            else:
                ey, em = int(ey), _MONTHS.get(em, 1)
            if 1950 <= sy <= ey <= 2100:
                months += max(0, (ey - sy) * 12 + (em - sm))

        # Year-only spans
        for a,b in re.findall(r"(\d{4})\s*(?:-|to|–|—)\s*(\d{4}|present|now|current)", t):
            y1 = int(a)
            y2 = cur_y if not b.isdigit() else int(b)
            if 1950 <= y1 <= y2 <= 2100:
                months += max(0, (y2 - y1)) * 12

        # Bullet density heuristic
        bullets = len(re.findall(r"(^|\n)\s*[\-\u2022\u25CF\u25A0•]", text))
        months += int(bullets * 0.5)

        return months / 12.0 if months else 0.0

    # ---------------------------
    # Component scoring
    # ---------------------------

    def _score_education(self, f: Dict[str, Any]) -> float:
        deg = (f.get("degree_text") or "").lower()
        college = (f.get("college_text") or "").strip()
        email = (f.get("email") or "")
        gpa = f.get("gpa4")
        honors = bool(f.get("honors"))
        certs = int(f.get("cert_count") or 0)

        base = 20.0
        if any(k in deg for k in ("phd","doctor","md","jd","dphil")): base += 55
        elif any(k in deg for k in ("master","msc","m.s","m.eng","ms ")): base += 45
        elif any(k in deg for k in ("bachelor","b.sc","beng","b.s","ba ")): base += 35
        elif any(k in deg for k in ("bootcamp","nanodegree","certificate")): base += 20
        elif any(k in deg for k in ("high school","secondary","undergrad")): base += 15
        else: base += 10

        if any(t in deg for t in self.stem_terms): base += 7
        if isinstance(gpa,(int,float)):
            if gpa >= 3.9: base += 10
            elif gpa >= 3.7: base += 7
            elif gpa >= 3.5: base += 5
            elif gpa >= 3.2: base += 3
        if honors: base += 6
        if college: base += 5
        if isinstance(email,str) and email.endswith(".edu"): base += 5
        base += min(8, 2 * certs)

        return max(0.0, min(100.0, base))

    def _score_experience(self, f: Dict[str, Any]) -> float:
        years = float(f.get("total_experience_years") or 0.0)
        text = (f.get("experience_text") or "").lower()

        s = 100.0 * _sigmoid(0.55 * (years - 2.5))
        s = 20 + 0.8 * (s - 50)
        s = max(0.0, min(100.0, s))

        for k, bonus in self.seniority_cues.items():
            if k in text: s += bonus

        for k, bonus in {"intern":3,"trainee":2,"research assistant":3,"junior":2}.items():
            if k in text: s += bonus

        for kw in self.tool_keywords:
            if kw in text: s += 1.2

        last_year = f.get("last_year")
        if isinstance(last_year, int):
            from datetime import datetime
            cur = datetime.now().year
            if cur - last_year <= 1: s += 6
            elif cur - last_year <= 3: s += 3

        s += min(10, _count_metrics(text) * 1.0)
        return max(0.0, min(100.0, s))

    def _score_skills(self, f: Dict[str, Any]) -> float:
        skills = [_norm_skill(s) for s in (f.get("skills") or [])]
        unique = sorted(set(skills))
        n = len(unique)

        txt = (f.get("aggregate_text") or "").lower()
        prof_bonus = 0.0
        expert_terms = self.prof_terms.get(3, set())
        inter_terms  = self.prof_terms.get(2, set())
        begin_terms  = self.prof_terms.get(1, set())

        def level_hit(skill: str, terms: Set[str]) -> int:
            for term in terms:
                if re.search(rf"\b{re.escape(term)}\s+{re.escape(skill)}\b", txt) or \
                   re.search(rf"\b{re.escape(skill)}\s+{re.escape(term)}\b", txt):
                    return 1
            return 0

        for s in unique:
            occ = len(re.findall(rf"\b{re.escape(s)}\b", txt))
            lvl = 0
            lvl += 3 * level_hit(s, expert_terms)
            lvl += 2 * level_hit(s, inter_terms)
            lvl += 1 * level_hit(s, begin_terms)
            prof_bonus += min(4.0, 0.5 * occ + 1.0 * (lvl > 0) + 0.5 * max(0, lvl - 1))

        breadth = 100.0 * (1 - math.exp(-n / 9.0))

        coverage = 0.0
        for keys in self.buckets.values():
            if any(k in unique for k in keys):
                coverage += 1.0
        coverage = _normalize_0_100(coverage, 0, len(self.buckets))

        depth = 30.0
        if any(s in self.strong_skills for s in unique): depth += 25.0
        depth += min(20.0, prof_bonus)

        return max(0.0, min(100.0, 0.45 * breadth + 0.30 * coverage + 0.25 * depth))

    def _explain(self, f: Dict[str, Any], comps: ComponentScores) -> Dict[str, Any]:
        """
        Build a structured, human-readable explanation aligned with the current
        heuristic scoring (no ML dependencies).

        Returns:
          {
            "highlights": [str, ...],
            "top_archetype_matches": [{"name": str, "match_pct": float}],
            "component_details": {...},
            "notes": {"strengths": [..], "weaknesses": [..]}
          }
        """
        import re
        txt = (f.get("aggregate_text") or "")
        low = txt.lower()
        tokens = set(_tokenize(low))
        bullets = len(re.findall(r"(^|\n)\s*[\-\u2022\u25CF\u25A0•]", txt))
        years = float(f.get("total_experience_years") or 0.0)
        skills = {s.lower() for s in (f.get("skills") or [])}

        # ---------- Highlights (signals that recruiters scan for quickly)
        highlights: List[str] = []
        if re.search(r"\b(intern|internship)\b", low):
            highlights.append("Internship experience detected.")
        if re.search(r"\b(vice[-\s]?president|leader|led|managed|director|head)\b", low):
            highlights.append("Leadership/ownership signals present.")
        if re.search(r"\b(published|publication|peer[-\s]?review|in press|doi|arxiv)\b", low):
            highlights.append("Publication or knowledge-sharing track record.")
        if re.search(r"\b(deployed|shipped|released|production)\b", low):
            highlights.append("Evidence of shipping to production.")
        if re.search(r"\b(taught|teaching|lecturer|mentoring|tutoring|supervised)\b", low):
            highlights.append("Teaching/mentoring experience.")
        if re.search(r"\b(docker|kubernetes|ci/?cd|pipeline|terraform|ansible)\b", low):
            highlights.append("DevOps/automation exposure.")
        if re.search(r"\b(spanish|bilingual|multilingual|english|french|german|mandarin|hindi|arabic)\b", low):
            highlights.append("Language/cross-cultural capability.")
        if len(re.findall(r"\b\d+(?:\.\d+)?\s*%|\$\s*\d|\b\d{2,}\b", low)) >= 2:
            highlights.append("Quantified outcomes present (%, $, counts).")
        if bullets >= 10:
            highlights.append("Well-structured resume with clear bulleting.")
        if any(t in low for t in ("sop", "iso", "rohs", "gmp", "glp", "compliance", "regulatory", "quality")):
            highlights.append("Quality/standards/compliance awareness.")

        # ---------- Rule-based “archetype” ranking (token overlap + phrase hits)
        def _rank_archetypes_rulebased(text: str) -> List[Dict[str, Any]]:
            sw = {
                "the","a","an","and","or","to","for","of","in","on","with","by","from","as","at",
                "this","that","these","those","be","is","are","was","were","will","can","able",
                "using","use","used","via","per","based","including","include","across"
            }
            def toks(s: str) -> Set[str]:
                return {t for t in _tokenize(s.lower()) if t not in sw}

            T = toks(text)
            if not self.archetypes:
                return []

            scores = []
            for name, desc in self.archetypes.items():
                D = toks(desc)
                if not D:
                    continue
                # token overlap
                overlap = len(T & D)

                # light phrase hits (split desc to semi-phrases)
                phrases = [p.strip() for p in re.split(r"[;,/]| and | or ", desc.lower()) if p.strip()]
                phrase_hits = 0
                for p in phrases:
                    if len(p) >= 8 and p in text.lower():
                        phrase_hits += 2  # weight phrases more than single tokens

                raw = overlap + phrase_hits
                scores.append((name, raw, overlap, phrase_hits))

            if not scores:
                return []

            max_raw = max(s for _, s, _, _ in scores) or 1
            ranked = sorted(scores, key=lambda x: x[1], reverse=True)[:3]
            out = []
            for name, raw, overlap, phrase_hits in ranked:
                pct = round(100.0 * raw / max_raw, 1)
                out.append({"name": name, "match_pct": pct})
            return out

        top_arch = _rank_archetypes_rulebased(txt)

        # ---------- Component details (verbalized evidence that matches _score_* logic)
        # Education evidence
        edu_bits = []
        deg = (f.get("degree_text") or "").lower()
        if any(k in deg for k in ("phd", "doctor", "md", "jd", "dphil")):
            edu_bits.append("Doctoral-level degree signals.")
        elif any(k in deg for k in ("master", "msc", "m.s", "m.eng", "ms ")):
            edu_bits.append("Master’s-level degree signals.")
        elif any(k in deg for k in ("bachelor", "b.sc", "beng", "b.s", "ba ")):
            edu_bits.append("Bachelor-level degree signals.")
        elif deg.strip():
            edu_bits.append("Degree present (level not clearly parsed).")

        stem_hits = [t for t in self.stem_terms if t in deg]
        if stem_hits:
            edu_bits.append(f"STEM keywords found: {', '.join(sorted(stem_hits)[:6])}{'…' if len(stem_hits)>6 else ''}")

        college = (f.get("college_text") or "").strip()
        if college:
            edu_bits.append("College/University name present.")
        email = f.get("email") or ""
        if isinstance(email, str) and email.endswith(".edu"):
            edu_bits.append("Academic (.edu) email detected.")

        # Experience evidence
        exp_bits = [f"Estimated total experience ~{years:.1f} years."]
        # date spans seen?
        spans = re.findall(r"(\d{4})\s*[-\u2013]\s*(\d{4}|present|now|current)", low)
        if spans:
            exp_bits.append(f"Date spans detected: {len(spans)}.")
        # role indicators
        for kw, label in [
            ("intern", "Internship"),
            ("research assistant", "Research assistant"),
            ("postdoc", "Postdoc"),
            ("lecturer", "Lecturing/teaching"),
            ("manager", "Management/leadership"),
            ("lead", "Lead role"),
        ]:
            if kw in low:
                exp_bits.append(f"{label} signal present.")
        # tooling examples
        tk_hits = [kw for kw in self.tool_keywords if kw in low]
        if tk_hits:
            sample = ", ".join(sorted(tk_hits)[:8])
            exp_bits.append(f"Process/tooling keywords: {sample}{'…' if len(tk_hits)>8 else ''}")
        if bullets:
            exp_bits.append(f"Bullet structure count: {bullets}.")

        # Skills evidence
        unique_skills = sorted(skills)
        sk_bits = [f"{len(unique_skills)} unique skills parsed."]
        if unique_skills:
            sk_bits.append("Examples: " + ", ".join(unique_skills[:10]) + ("…" if len(unique_skills) > 10 else ""))

        # Coverage buckets (mirror _score_skills buckets)
        buckets = {
            "programming": {"python", "java", "c", "c++", "r", "sql"},
            "cad_eng": {"solidworks", "cad", "engineering", "electrical", "mechanical"},
            "analytics": {"analytics", "statistics", "excel", "microsoft office", "data analysis", "modeling"},
            "science": {"biology", "chemistry", "physics", "geochemistry", "petrology", "earth", "ocean"},
            "language": {"spanish"},
            "teaching": {"teaching", "mentoring"},
        }
        covered = [b for b, keys in buckets.items() if any(k in skills for k in keys)]
        if covered:
            sk_bits.append("Coverage across buckets: " + ", ".join(covered))

        strong = {"python", "java", "solidworks", "analytics", "biology", "chemistry", "physics", "modeling", "research"}
        strong_hits = sorted(strong & skills)
        if strong_hits:
            sk_bits.append("Depth signals: " + ", ".join(strong_hits))

        # AI-signal evidence (rule-based match snapshot)
        ai_bits = []
        if top_arch:
            ai_bits.append("Top archetype alignment present.")
        if any(k in low for k in ("vice-president", "vice president", "lecturer", "postdoc", "intern", "research assistant")):
            ai_bits.append("Role keywords boosting alignment detected.")

        # ---------- Final assembly
        details = {
            "education": round(comps.education, 1),
            "experience": round(comps.experience, 1),
            "skills": round(comps.skills, 1),
            "ai_signal": round(comps.ai_signal, 1),
        }

        # Use your rule catalog to produce exactly 3 strengths & 3 weaknesses
        notes = self._select_strengths_weaknesses(f, comps)

        # Keep backward-compatible shape; encode evidence into highlights when useful
        # (you can also surface evidence in your UI if you’d like)
        # To keep payload compact, we won’t attach verbose evidence fields to JSON.
        # If you prefer, add an "evidence" key here.

        # Fold a few top evidence lines into highlights for readability
        for msg in (edu_bits[:1] + exp_bits[:1] + sk_bits[:1]):
            if msg and msg not in highlights:
                highlights.append(msg)

        return {
            "highlights": highlights[:10],
            "top_archetype_matches": top_arch,
            "component_details": details,
            "notes": notes,
        }


    # -------- AI signal (embeddings if available; else BOW cosine) --------

    def _bow_similarity(self, text: str, labels: List[str], descs: List[str]) -> np.ndarray:
        def toks(s: str) -> List[str]:
            return [w for w in (t.lower() for t in _tokenize(s)) if w not in self.stopwords]

        docs = [text] + descs
        tokenized = [toks(d) for d in docs]

        vocab: Dict[str,int] = {}
        for toks_ in tokenized:
            for w in set(toks_):
                vocab[w] = vocab.get(w, 0) + 1
        vocab_index = {w:i for i,w in enumerate(vocab.keys())}
        N = len(docs)
        idf = np.zeros(len(vocab_index), dtype=np.float32)
        for w, df in vocab.items():
            idf[vocab_index[w]] = math.log(1 + (N / (1 + df))) + 1.0

        def vec(toks_):
            v = np.zeros(len(vocab_index), dtype=np.float32)
            for w in toks_:
                i = vocab_index.get(w)
                if i is not None: v[i] += 1.0
            v = np.log1p(v) * idf
            n = np.linalg.norm(v) or 1.0
            return v / n

        vecs = [vec(t) for t in tokenized]
        q = vecs[0]
        A = np.stack(vecs[1:], axis=0)
        sims = A @ q
        sims = np.clip((sims + 1.0) / 2.0, 0.0, 1.0) * 100.0
        return sims.astype(np.float64)

    def _score_ai_signal(self, f: Dict[str, Any]) -> float:
        text = f.get("aggregate_text") or ""
        if not text.strip(): return 0.0
        names = list(self.archetypes.keys())
        descs = [self.archetypes[k] for k in names]

        self._ensure_model()
        try:
            if self._model is not None:
                resume = self._model.encode([text], normalize_embeddings=True)
                arch = self._model.encode(descs, normalize_embeddings=True)
                sims = (resume @ arch.T).flatten().astype(np.float64)
                sims = np.clip((sims + 1.0) / 2.0, 0.0, 1.0) * 100.0
            else:
                sims = self._bow_similarity(text, names, descs)
        except Exception:
            sims = self._bow_similarity(text, names, descs)

        topk = min(4, sims.size)
        ai = 0.7 * float(np.mean(np.sort(sims)[-topk:])) + 0.3 * float(np.mean(sims))

        txt = text.lower()
        if any(k in txt for k in ("vice-president","vice president","president","lecturer","postdoc")): ai += 3.0
        if "intern" in txt or "research assistant" in txt: ai += 3.0

        return max(0.0, min(100.0, ai))

    # ---------------------------
    # Explanations
    # ---------------------------

    def _select_strengths_weaknesses(self, f: Dict[str, Any], comps: ComponentScores) -> Dict[str, list]:
        txt = (f.get("aggregate_text") or "").lower()
        skills = {s.lower() for s in (f.get("skills") or [])}
        years = float(f.get("total_experience_years") or 0.0)
        bullets = len(re.findall(r"(^|\n)\s*[\-\u2022\u25CF\u25A0•]", f.get("aggregate_text") or ""))
        last_year = f.get("last_year") or 0
        certs = int(f.get("cert_count") or 0)

        def has_any(keys, haystack):
            if isinstance(haystack, set): return any(k in haystack for k in keys)
            return any(k in txt for k in keys)

        strengths, weaknesses = [], []

        if has_any({"python","java","c++","c#","javascript","sql"}, skills): strengths.append("Solid programming foundation is evident.")
        if has_any({"analytics","statistics","modeling","excel","data analysis","pandas","numpy"}, skills): strengths.append("Strong analytical/data skills are demonstrated.")
        if has_any({"solidworks","cad","mechanical","electrical","autocad"}, skills): strengths.append("Hands-on CAD/engineering design experience.")
        if any(k in txt for k in DEFAULT_LEADERSHIP_CUES): strengths.append("Clear leadership/ownership experience.")
        if any(k in txt for k in ("teaching","mentoring","tutoring","lecturer","ta")): strengths.append("Experience mentoring/teaching others.")
        if any(k in txt for k in ("published","peer-reviewed","in press","conference abstract","patent")): strengths.append("Publication/patent or knowledge-sharing track record.")
        if any(k in txt for k in ("presented","conference","symposium","workshop","talk")): strengths.append("Public speaking/presentation exposure.")
        if any(k in txt for k in ("github","gitlab","bitbucket")): strengths.append("Evidence of code sharing or open-source involvement.")
        if any(kw in txt for kw in self.tool_keywords): strengths.append("Good familiarity with process/tooling keywords.")
        if comps.education >= 70: strengths.append("Strong academic credentials.")
        if years >= 3: strengths.append("Meaningful professional experience (3+ years).")
        if len(skills) >= 12: strengths.append("Broad skill coverage across multiple areas.")
        if comps.ai_signal >= 70: strengths.append("Profile aligns well with target role archetypes.")
        if certs >= 1: strengths.append("Relevant professional certifications add credibility.")
        if f.get("gpa4") and f["gpa4"] >= 3.7: strengths.append("High GPA indicates strong academic performance.")
        if isinstance(last_year, int):
            from datetime import datetime
            if datetime.now().year - last_year <= 2:
                strengths.append("Recent, up-to-date experience.")
        if bullets >= 10: strengths.append("Well-structured resume with clear bulleting.")
        if comps.skills >= 70: strengths.append("Skills mix indicates both breadth and depth.")

        if years < 1.0: weaknesses.append("Limited professional experience (<1 year).")
        if len(skills) < 5: weaknesses.append("Narrow skills list—consider broadening toolset.")
        if _count_metrics(txt) == 0: weaknesses.append("Few quantified outcomes—add metrics (%, $, time saved).")
        if not any(k in txt for k in ("github","portfolio","personal website","linkedin")): weaknesses.append("No work links (GitHub/portfolio/LinkedIn) included.")
        if not (f.get("degree_text") or "").strip(): weaknesses.append("Education details are minimal or unclear.")
        if not any(k in txt for k in DEFAULT_LEADERSHIP_CUES): weaknesses.append("No explicit leadership examples.")
        if not any(k in txt for k in ("team","collaborat","cross-functional","stakeholder")): weaknesses.append("Teamwork/collaboration not highlighted.")
        if not any(k in txt for k in ("shipped","deployed","released","production","launched")): weaknesses.append("Production delivery not emphasized.")
        if not any(k in txt for k in ("test","qa","pytest","junit","verification","validation")): weaknesses.append("Testing/QA practices not visible.")
        if sum(1 for kw in self.tool_keywords if kw in txt) < 3: weaknesses.append("Process/tooling keywords are light—add relevant methods/tools.")
        if len(txt) < 800: weaknesses.append("Resume may be too brief—add scope, context, and impact.")
        if len(txt) > 8000: weaknesses.append("Resume may be overly long—tighten to key wins and scope.")
        if not skills: weaknesses.append("Skills section is sparse or missing.")
        if not (f.get("email") or f.get("phone")): weaknesses.append("Contact info (email/phone) is missing.")
        if not any(k in txt for k in ("docker","kubernetes","ci","cd","pipeline","terraform")): weaknesses.append("DevOps/CI-CD exposure appears limited.")
        if not any(k in txt for k in ("mentor","mentoring","tutor","coached","supervised")): weaknesses.append("Mentoring/coaching not demonstrated.")
        if not any(k in txt for k in ("publication","published","peer-review","conference","patent")): weaknesses.append("Publications or knowledge sharing are not highlighted.")
        if not any(k in txt for k in ("healthcare","finance","retail","manufacturing","energy","telecom","domain","industry")): weaknesses.append("Domain focus is unclear—specify industries/projects.")
        if "responsible for" in txt: weaknesses.append("Language is passive—rephrase with strong action verbs.")
        if sum(1 for b in self.buckets.values() if any(k in skills for k in b)) < 3: weaknesses.append("Skills coverage spans few categories—broaden for balance.")
        if f.get("gpa4") and f["gpa4"] < 3.0: weaknesses.append("GPA appears low—offset with strong projects and outcomes.")

        def dedup(seq):
            seen=set(); out=[]
            for x in seq:
                if x not in seen: out.append(x); seen.add(x)
            return out

        strengths = dedup(strengths)[:3]
        weaknesses = dedup(weaknesses)[:3]

        # Fallbacks to ensure exactly 3
        fallback_strengths = [
            "Evidence of continuous learning and upskilling.",
            "Clear problem-solving orientation is visible.",
            "Good mix of theory and practical application.",
            "Communication artifacts (talks/docs) strengthen the profile.",
            "Ability to work across disciplines and contexts."
        ]
        fallback_weaknesses = [
            "Tailor the summary to the specific role and company.",
            "Add more concrete outcomes for major projects.",
            "Clarify your role and scope within each project.",
            "Include the most relevant tools/technologies for the target role.",
            "Tighten wording and remove repetition."
        ]
        i=0
        while len(strengths)<3 and i<len(fallback_strengths):
            if fallback_strengths[i] not in strengths: strengths.append(fallback_strengths[i])
            i+=1
        i=0
        while len(weaknesses)<3 and i<len(fallback_weaknesses):
            if fallback_weaknesses[i] not in weaknesses: weaknesses.append(fallback_weaknesses[i])
            i+=1

        return {"strengths": strengths, "weaknesses": weaknesses}

    def _count_certs(self, text: str) -> int:
        t = text.lower()
        return sum(1 for kw in self.cert_keywords if kw in t)

# ---------------------------
# Shared instance + simple API
# ---------------------------

_SHARED_RATER: Optional["CVRater"] = None

def get_shared_rater(
    data_dir: str = "data",
    model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
    device: Optional[str] = None,
    weights: Tuple[float, float, float, float] = (0.25, 0.25, 0.20, 0.35),
) -> "CVRater":
    global _SHARED_RATER
    if _SHARED_RATER is None:
        _SHARED_RATER = CVRater(
            data_dir=data_dir,
            model_name=model_name,
            device=device,
            weights=weights,
        )
    return _SHARED_RATER

def rate_dict(cv_data: Dict[str, Any]) -> str:
    if not isinstance(cv_data, dict):
        raise TypeError("cv_data must be a dict")
    result = get_shared_rater().rate(cv_data)
    return json.dumps(result, ensure_ascii=False)
