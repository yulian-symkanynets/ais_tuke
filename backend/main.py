from typing import List, Optional, Dict, Tuple
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
import random

# ====== MODELY ======
class Grade(BaseModel):
    id: int
    subject: str
    code: str
    grade: str               # A, B, C, D, E, FX
    credits: int
    semester: str            # "Winter 2024/25", "Summer 2024/25", ...
    date: str                # "Jun 15, 2025"
    numericGrade: float      # 1.0 (best) ... 5.0 (fail)

# ====== APP & CORS ======
app = FastAPI(title="AIS TUKE Student Portal – Random Grades API")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "http://localhost:3000"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ====== KONFIG: predmety, mapovania, semestre ======
SUBJECTS: List[Tuple[str, str]] = [
    ("Operating Systems", "OS"),
    ("Computer Networks", "CN"),
    ("Database Systems", "DBS"),
    ("Algorithms", "ALGO"),
    ("Software Engineering", "SE"),
    ("Web Technologies", "WEB"),
    ("Programming in Python", "PY"),
    ("Discrete Mathematics", "DM"),
    ("Computer Graphics", "CG"),
    ("Artificial Intelligence", "AI"),
    ("Data Structures", "DS"),
    ("Cybersecurity", "SEC"),
    ("Mobile Computing", "MOBILE"),
    ("Cloud Computing", "CLOUD"),
    ("Machine Learning Basics", "ML"),
]

LETTER_TO_NUMERIC: Dict[str, float] = {
    "A": 1.0,
    "B": 1.5,
    "C": 2.0,
    "D": 3.0,
    "E": 4.0,
    "FX": 5.0,   # fail
}

CREDITS_POOL = [3, 4, 5, 6, 7, 8]

# semester -> (od, do) pre skúškové okno
SEMESTER_DATE_RANGES = {
    "Winter 2024/25": (datetime(2025, 1, 15), datetime(2025, 2, 15)),
    "Summer 2024/25": (datetime(2025, 6, 1),  datetime(2025, 7, 15)),
    "Winter 2025/26": (datetime(2026, 1, 15), datetime(2026, 2, 15)),
    "Summer 2025/26": (datetime(2026, 6, 1),  datetime(2026, 7, 15)),
}
DEFAULT_SEMESTERS = list(SEMESTER_DATE_RANGES.keys())

# ====== POMOCNÉ ======
def _rand_date(rng: random.Random, start: datetime, end: datetime) -> datetime:
    delta_days = (end - start).days
    return start + timedelta(days=rng.randint(0, max(delta_days, 0)))

def _fmt_date(dt: datetime) -> str:
    return dt.strftime("%b %d, %Y")  # napr. "Jun 15, 2025"

def _generate_grades(
    count: int,
    semesters: List[str],
    seed: Optional[int] = None,
) -> List[Grade]:
    rng = random.Random(seed)

    # aby sme mali rozumnú diverzitu predmetov
    pool = SUBJECTS.copy()
    rng.shuffle(pool)

    items: List[Grade] = []
    for i in range(count):
        subject, code = pool[i % len(pool)]

        semester = rng.choice(semesters)
        start, end = SEMESTER_DATE_RANGES.get(semester, (datetime(2025, 6, 1), datetime(2025, 7, 15)))
        dt = _rand_date(rng, start, end)

        letter = rng.choices(
            population=list(LETTER_TO_NUMERIC.keys()),
            weights=[28, 24, 20, 12, 8, 8],  # viac lepších známok pre príjemnejší demo feeling
            k=1
        )[0]
        numeric = LETTER_TO_NUMERIC[letter]

        credits = rng.choice(CREDITS_POOL)

        items.append(Grade(
            id=i + 1,
            subject=subject,
            code=code,
            grade=letter,
            credits=credits,
            semester=semester,
            date=_fmt_date(dt),
            numericGrade=numeric,
        ))

    # stabilné triedenie pre konzistentné UI
    items.sort(key=lambda g: (g.semester, g.subject, g.code))
    return items

# ====== ENDPOINTY ======
@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok"}

@app.get("/api/semesters", tags=["meta"])
def list_semesters():
    return {"semesters": DEFAULT_SEMESTERS}

@app.get("/api/grades", response_model=List[Grade], tags=["grades"])
def list_grades(
    count: int = Query(12, ge=1, le=200, description="Počet generovaných záznamov"),
    semester: Optional[str] = Query(None, description="Ak zadané, generuje iba pre daný semester"),
    seed: Optional[int] = Query(None, description="Seed pre reprodukovateľný výstup"),
):
    semesters = [semester] if semester else DEFAULT_SEMESTERS
    return _generate_grades(count=count, semesters=semesters, seed=seed)

@app.get("/api/grades/stats", tags=["grades"])
def grade_stats(
    count: int = Query(12, ge=1, le=200),
    semester: Optional[str] = Query(None),
    seed: Optional[int] = Query(None),
):
    semesters = [semester] if semester else DEFAULT_SEMESTERS
    items = _generate_grades(count=count, semesters=semesters, seed=seed)
    total_credits = sum(g.credits for g in items) or 1
    weighted_sum = sum(g.numericGrade * g.credits for g in items)
    weighted_avg = round(weighted_sum / total_credits, 2)
    return {
        "count": len(items),
        "totalCredits": total_credits,
        "weightedAverageNumeric": weighted_avg
    }

# =======================
# DASHBOARD – models & endpoints
# =======================
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
import random

# --- Types pre dashboard ---
class ExamItem(BaseModel):
    subject: str
    date: str      # "Oct 15, 2025"
    time: str      # "09:00"

class SubjectItem(BaseModel):
    name: str
    code: str
    credits: int

class ScheduleItem(BaseModel):
    day: str       # "Monday"
    time: str      # "08:00-09:40"
    subject: str
    room: str      # "PK6 C303"

class NotificationItem(BaseModel):
    type: str      # "grade" | "enrolment" | "info"
    message: str
    time: str      # "2 hours ago"

class NewsItem(BaseModel):
    id: int
    title: str
    description: str
    date: str      # "October 20, 2025"
    category: str  # "Academic" | "Events" | "Services" | "Research"
    pinned: bool = False

# --- Konštanty a pomocné funkcie ---
DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
TIMESLOTS = ["08:00-09:40", "10:00-11:40", "13:00-14:40", "15:00-16:40"]
ROOM_LETTERS = ["A", "B", "C", "D", "E", "F", "G"]

# Ak si v predošlom kóde nemal SUBJECTS, nech je tu aspoň fallback:
try:
    SUBJECTS  # typ: ignore
except NameError:
    SUBJECTS = [
        ("Data Structures", "DS"),
        ("Web Technologies", "WEBTECH"),
        ("Database Systems", "DBS"),
        ("Software Engineering", "SE"),
        ("Operating Systems", "OS"),
        ("Computer Networks", "CN"),
        ("Discrete Mathematics", "DM"),
        ("Programming in Python", "PY"),
        ("Artificial Intelligence", "AI"),
        ("Computer Graphics", "CG"),
    ]

def _rng(seed: Optional[int]) -> random.Random:
    return random.Random(seed)

def _fmt_short(dt: datetime) -> str:
    return dt.strftime("%b %d, %Y")  # "Oct 15, 2025"

def _fmt_long(dt: datetime) -> str:
    return dt.strftime("%B %d, %Y")  # "October 15, 2025"

def _rand_room(rng: random.Random) -> str:
    return f"PK6 {rng.choice(ROOM_LETTERS)}{rng.randint(100, 499)}"

def _start_time(timeslot: str) -> str:
    return timeslot.split("-")[0]

# --- Generátory ---
def gen_subjects(rng: random.Random, count: int) -> List[SubjectItem]:
    pool = [(name, code) for name, code in SUBJECTS]
    rng.shuffle(pool)
    pick = pool[: min(count, len(pool))]
    credits_pool = [3, 4, 5, 6, 7, 8]
    return [
        SubjectItem(name=name, code=code, credits=rng.choice(credits_pool))
        for name, code in pick
    ]

def gen_exams(rng: random.Random, count: int, days_ahead: int = 30) -> List[ExamItem]:
    # náhodné predmety v nasledujúcich X dňoch
    subjects = gen_subjects(rng, count)
    today = datetime.now()
    items: List[ExamItem] = []
    for s in subjects:
        when = today + timedelta(days=rng.randint(1, max(1, days_ahead)))
        hh = rng.choice([8, 9, 10, 11, 12, 13, 14])
        mm = rng.choice([0, 30])
        items.append(
            ExamItem(
                subject=s.name,
                date=_fmt_short(when),
                time=f"{hh:02d}:{mm:02d}",
            )
        )
    return items

def gen_schedule(rng: random.Random, total: int = 5) -> List[ScheduleItem]:
    # rozloží rand. sloty cez pracovné dni
    subs = gen_subjects(rng, 6)
    items: List[ScheduleItem] = []
    day_idx = 0
    used = set()
    for _ in range(total):
        day = DAYS[day_idx % len(DAYS)]
        slot = rng.choice(TIMESLOTS)
        subj = rng.choice(subs).name
        key = (day, slot, subj)
        if key in used:
            continue
        used.add(key)
        items.append(
            ScheduleItem(
                day=day,
                time=slot,
                subject=subj,
                room=_rand_room(rng),
            )
        )
        day_idx += 1
    # sort podľa dňa a času
    day_order = {d: i for i, d in enumerate(DAYS)}
    items.sort(key=lambda it: (day_order.get(it.day, 99), _start_time(it.time)))
    return items

def gen_notifications(rng: random.Random, count: int = 5) -> List[NotificationItem]:
    letters = ["A", "B", "C", "D", "E", "FX"]
    subjects = [name for name, _ in SUBJECTS]
    templates = [
        lambda: NotificationItem(type="grade",
                                 message=f"New grade added: {rng.choice(subjects)} - {rng.choice(letters)}",
                                 time=f"{rng.randint(1, 6)} hours ago"),
        lambda: NotificationItem(type="enrolment",
                                 message=f"Subject enrolment confirmed: {rng.choice(subjects)}",
                                 time=f"{rng.randint(1, 3)} days ago"),
        lambda: NotificationItem(type="info",
                                 message=f"Schedule change: {rng.choice(subjects)} moved to {_rand_room(rng)}",
                                 time=f"{rng.randint(2, 7)} days ago"),
    ]
    return [rng.choice(templates)() for _ in range(count)]

def gen_news(rng: random.Random, count: int = 4) -> List[NewsItem]:
    today = datetime.now()
    categories = ["Academic", "Events", "Services", "Research"]
    headlines = [
        ("Winter Exam Period Schedule Released",
         "The official exam schedule for Winter Semester 2025/26 is now available in the Grades section.",
         "Academic"),
        ("Student Career Fair",
         "Meet top tech companies and explore internship opportunities in the Main Hall.",
         "Events"),
        ("Library Extended Hours During Exam Period",
         "The university library will be open 24/7 to support students during exams.",
         "Services"),
        ("New AI Research Lab Opening",
         "State-of-the-art AI research facility opens next month. Student assistant applications are open.",
         "Research"),
    ]
    rng.shuffle(headlines)
    items: List[NewsItem] = []
    for i in range(count):
        title, desc, cat = headlines[i % len(headlines)]
        past_days = rng.randint(1, 10) + i  # trochu rozličné dátumy v minulosti
        dt = today - timedelta(days=past_days)
        items.append(
            NewsItem(
                id=i + 1,
                title=title,
                description=desc,
                date=_fmt_long(dt),
                category=cat if cat in categories else rng.choice(categories),
                pinned=(i == 0),  # prvá je pripnutá
            )
        )
    # pinned first, potom podľa dátumu zostupne (už si sortíš aj na FE)
    return items

# --- ENDPOINTS ---
@app.get("/api/dashboard/exams", response_model=List[ExamItem], tags=["dashboard"])
def dashboard_exams(
    count: int = 3,
    days_ahead: int = 30,
    seed: Optional[int] = None,
):
    rng = _rng(seed)
    return gen_exams(rng, count=count, days_ahead=days_ahead)

@app.get("/api/dashboard/subjects", response_model=List[SubjectItem], tags=["dashboard"])
def dashboard_subjects(
    count: int = 4,
    seed: Optional[int] = None,
):
    rng = _rng(seed)
    return gen_subjects(rng, count=count)

@app.get("/api/dashboard/schedule", response_model=List[ScheduleItem], tags=["dashboard"])
def dashboard_schedule(
    total: int = 5,  # celkový počet záznamov v týždni
    seed: Optional[int] = None,
):
    rng = _rng(seed)
    return gen_schedule(rng, total=total)

@app.get("/api/dashboard/notifications", response_model=List[NotificationItem], tags=["dashboard"])
def dashboard_notifications(
    count: int = 5,
    seed: Optional[int] = None,
):
    rng = _rng(seed)
    return gen_notifications(rng, count=count)

@app.get("/api/dashboard/news", response_model=List[NewsItem], tags=["dashboard"])
def dashboard_news(
    count: int = 4,
    seed: Optional[int] = None,
):
    rng = _rng(seed)
    return gen_news(rng, count=count)
