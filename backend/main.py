"""
AIS TUKE Student Portal - Backend API with DuckDB
"""
from typing import List, Optional, Dict
from fastapi import FastAPI, Query, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from database import get_connection, init_database
import hashlib
import secrets
from datetime import datetime, timedelta

# Initialize database on startup
init_database()

# ====== AUTH MODELS ======
class RegisterRequest(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    studentId: str
    password: str
    program: str = "Computer Science"
    year: int = 1

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    token: str
    student: Dict

class EnrollRequest(BaseModel):
    subject_code: str

class DormitoryApplyRequest(BaseModel):
    dormitory_id: int
    room_type: str

# ====== MODELS ======
class Grade(BaseModel):
    id: int
    subject: str
    code: str
    grade: str
    credits: int
    semester: str
    date: str
    numericGrade: float

class Subject(BaseModel):
    id: int
    code: str
    name: str
    credits: int
    semester: str
    enrolled: bool
    students: int
    lecturer: str
    schedule: str
    description: str = ""
    year: int = 1

class ScheduleItem(BaseModel):
    id: int
    day: str
    time: str
    subject: str
    code: str
    room: str
    type: str

class EnrolmentPeriod(BaseModel):
    id: int
    name: str
    status: str
    startDate: str
    endDate: str

class EnrolledSubject(BaseModel):
    id: int
    code: str
    name: str
    credits: int
    status: str
    enrolledDate: str

class Thesis(BaseModel):
    id: int
    title: str
    type: str
    status: str
    supervisor: str
    consultant: str
    department: str
    startDate: str
    submissionDeadline: str
    defenseDate: str
    progress: int

class ThesisMilestone(BaseModel):
    id: int
    title: str
    status: str
    date: str
    description: str

class ThesisDocument(BaseModel):
    id: int
    name: str
    size: str
    uploaded: str

class Dormitory(BaseModel):
    id: int
    name: str
    address: str
    distance: str
    rooms: int
    amenities: List[str]
    rent: str
    available: bool

class DormitoryApplication(BaseModel):
    dormitory: str
    room: str
    roomType: str
    floor: int
    status: str
    moveInDate: str
    rent: str
    deposit: str

class Payment(BaseModel):
    id: int
    type: str
    description: str
    amount: float
    date: str
    dueDate: str
    status: str
    method: str
    invoice: str
    icon: str

class Notification(BaseModel):
    id: int
    type: str
    message: str
    time: str
    read: bool

class NewsItem(BaseModel):
    id: int
    title: str
    description: str
    date: str
    category: str
    pinned: bool

class ExamItem(BaseModel):
    subject: str
    date: str
    time: str

class SubjectItem(BaseModel):
    name: str
    code: str
    credits: int

class DashboardScheduleItem(BaseModel):
    day: str
    time: str
    subject: str
    room: str

class NotificationItem(BaseModel):
    type: str
    message: str
    time: str

class Student(BaseModel):
    id: int
    firstName: str
    lastName: str
    email: str
    studentId: str
    year: int
    program: str
    gpa: float

# ====== APP & CORS ======
app = FastAPI(title="AIS TUKE Student Portal API with DuckDB")

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

# ====== HELPER FUNCTIONS ======
def hash_password(password: str) -> str:
    """
    Hash password using SHA-256.
    
    WARNING: This is for DEMO purposes only! 
    In production, use bcrypt, argon2, or scrypt with proper salt.
    """
    return hashlib.sha256(password.encode()).hexdigest()

def create_session_token() -> str:
    return secrets.token_urlsafe(32)

def verify_token(token: Optional[str]) -> Optional[int]:
    """Verify session token and return student_id if valid"""
    if not token:
        return None
    
    conn = get_connection()
    result = conn.execute("""
        SELECT student_id FROM sessions 
        WHERE token = ? AND expires_at > now()
    """, [token]).fetchone()
    conn.close()
    
    return result[0] if result else None

# ====== AUTH ENDPOINTS ======
@app.post("/api/auth/register", response_model=AuthResponse, tags=["auth"])
def register(req: RegisterRequest):
    conn = get_connection()
    
    # Check if email or student_id already exists
    existing = conn.execute("""
        SELECT id FROM students WHERE email = ? OR student_id = ?
    """, [req.email, req.studentId]).fetchone()
    
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="Email or Student ID already registered")
    
    # Get next ID
    max_id = conn.execute("SELECT COALESCE(MAX(id), 0) FROM students").fetchone()[0]
    new_id = max_id + 1
    
    # Hash password and create student
    password_hash = hash_password(req.password)
    conn.execute("""
        INSERT INTO students (id, first_name, last_name, email, student_id, year, program, gpa, password_hash, role)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0.0, ?, 'student')
    """, [new_id, req.firstName, req.lastName, req.email, req.studentId, req.year, req.program, password_hash])
    
    # Create session token
    token = create_session_token()
    expires_at = datetime.now() + timedelta(days=7)
    created_at = datetime.now()
    
    # Get next session id
    session_id_result = conn.execute("SELECT COALESCE(MAX(id), 0) + 1 FROM sessions").fetchone()
    session_id = session_id_result[0]
    
    conn.execute("""
        INSERT INTO sessions (id, student_id, token, created_at, expires_at)
        VALUES (?, ?, ?, ?, ?)
    """, [session_id, new_id, token, created_at.isoformat(), expires_at.isoformat()])
    
    conn.close()
    
    return AuthResponse(
        token=token,
        student={
            "id": new_id,
            "firstName": req.firstName,
            "lastName": req.lastName,
            "email": req.email,
            "studentId": req.studentId,
            "year": req.year,
            "program": req.program,
            "gpa": 0.0,
            "role": "student"
        }
    )

@app.post("/api/auth/login", response_model=AuthResponse, tags=["auth"])
def login(req: LoginRequest):
    conn = get_connection()
    
    # Find student
    password_hash = hash_password(req.password)
    result = conn.execute("""
        SELECT id, first_name, last_name, email, student_id, year, program, gpa, role
        FROM students
        WHERE email = ? AND password_hash = ?
    """, [req.email, password_hash]).fetchone()
    
    if not result:
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    student_id = result[0]
    
    # Create session token
    token = create_session_token()
    expires_at = datetime.now() + timedelta(days=7)
    created_at = datetime.now()
    
    # Get next session id
    session_id_result = conn.execute("SELECT COALESCE(MAX(id), 0) + 1 FROM sessions").fetchone()
    session_id = session_id_result[0]
    
    conn.execute("""
        INSERT INTO sessions (id, student_id, token, created_at, expires_at)
        VALUES (?, ?, ?, ?, ?)
    """, [session_id, student_id, token, created_at.isoformat(), expires_at.isoformat()])
    
    conn.close()
    
    return AuthResponse(
        token=token,
        student={
            "id": result[0],
            "firstName": result[1],
            "lastName": result[2],
            "email": result[3],
            "studentId": result[4],
            "year": result[5],
            "program": result[6],
            "gpa": result[7],
            "role": result[8] if len(result) > 8 else "student"
        }
    )

@app.post("/api/auth/logout", tags=["auth"])
def logout(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    conn = get_connection()
    conn.execute("DELETE FROM sessions WHERE token = ?", [token])
    conn.close()
    
    return {"message": "Logged out successfully"}

@app.get("/api/auth/me", tags=["auth"])
def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    student_id = verify_token(token)
    
    if not student_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    conn = get_connection()
    result = conn.execute("""
        SELECT id, first_name, last_name, email, student_id, year, program, gpa
        FROM students WHERE id = ?
    """, [student_id]).fetchone()
    conn.close()
    
    if not result:
        raise HTTPException(status_code=404, detail="Student not found")
    
    return {
        "id": result[0],
        "firstName": result[1],
        "lastName": result[2],
        "email": result[3],
        "studentId": result[4],
        "year": result[5],
        "program": result[6],
        "gpa": result[7]
    }

# ====== HEALTH & META ENDPOINTS ======
@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok"}

@app.get("/api/semesters", tags=["meta"])
def list_semesters():
    conn = get_connection()
    result = conn.execute("SELECT DISTINCT semester FROM grades ORDER BY semester").fetchall()
    semesters = [row[0] for row in result]
    conn.close()
    return {"semesters": semesters}

# ====== GRADES ENDPOINTS ======
@app.get("/api/grades", response_model=List[Grade], tags=["grades"])
def list_grades(
    semester: Optional[str] = Query(None, description="Filter by semester"),
):
    conn = get_connection()
    
    if semester:
        result = conn.execute("""
            SELECT id, subject, code, grade, credits, semester, date, numeric_grade
            FROM grades
            WHERE semester = ?
            ORDER BY semester, subject, code
        """, [semester]).fetchall()
    else:
        result = conn.execute("""
            SELECT id, subject, code, grade, credits, semester, date, numeric_grade
            FROM grades
            ORDER BY semester, subject, code
        """).fetchall()
    
    conn.close()
    
    return [
        Grade(
            id=row[0],
            subject=row[1],
            code=row[2],
            grade=row[3],
            credits=row[4],
            semester=row[5],
            date=row[6],
            numericGrade=row[7]
        )
        for row in result
    ]

@app.get("/api/grades/stats", tags=["grades"])
def grade_stats(semester: Optional[str] = Query(None)):
    conn = get_connection()
    
    if semester:
        result = conn.execute("""
            SELECT 
                COUNT(*) as count,
                SUM(credits) as total_credits,
                SUM(numeric_grade * credits) / SUM(credits) as weighted_avg
            FROM grades
            WHERE semester = ?
        """, [semester]).fetchone()
    else:
        result = conn.execute("""
            SELECT 
                COUNT(*) as count,
                SUM(credits) as total_credits,
                SUM(numeric_grade * credits) / SUM(credits) as weighted_avg
            FROM grades
        """).fetchone()
    
    conn.close()
    
    return {
        "count": result[0],
        "totalCredits": result[1] or 0,
        "weightedAverageNumeric": round(result[2], 2) if result[2] else 0
    }

# ====== SUBJECTS ENDPOINTS ======
@app.get("/api/subjects", response_model=List[Subject], tags=["subjects"])
def list_subjects(
    year: Optional[int] = Query(None, description="Filter by year (1, 2, 3)"),
    semester: Optional[str] = Query(None, description="Filter by semester (Winter, Summer)")
):
    conn = get_connection()
    
    # Build dynamic query with filters
    query = """
        SELECT id, code, name, credits, semester, enrolled, students, lecturer, schedule, description, year
        FROM subjects
        WHERE 1=1
    """
    params = []
    
    if year is not None:
        query += " AND year = ?"
        params.append(year)
    
    if semester:
        query += " AND semester = ?"
        params.append(semester)
    
    query += " ORDER BY year, name"
    
    result = conn.execute(query, params).fetchall()
    conn.close()
    
    return [
        Subject(
            id=row[0],
            code=row[1],
            name=row[2],
            credits=row[3],
            semester=row[4],
            enrolled=row[5],
            students=row[6],
            lecturer=row[7],
            schedule=row[8],
            description=row[9] if len(row) > 9 else "",
            year=row[10] if len(row) > 10 else 1
        )
        for row in result
    ]

# ====== SCHEDULE ENDPOINTS ======
@app.get("/api/schedule", response_model=List[ScheduleItem], tags=["schedule"])
def list_schedule():
    conn = get_connection()
    result = conn.execute("""
        SELECT id, day, time, subject, code, room, type
        FROM schedule
        ORDER BY 
            CASE day
                WHEN 'Monday' THEN 1
                WHEN 'Tuesday' THEN 2
                WHEN 'Wednesday' THEN 3
                WHEN 'Thursday' THEN 4
                WHEN 'Friday' THEN 5
            END,
            time
    """).fetchall()
    conn.close()
    
    return [
        ScheduleItem(
            id=row[0],
            day=row[1],
            time=row[2],
            subject=row[3],
            code=row[4],
            room=row[5],
            type=row[6]
        )
        for row in result
    ]

# ====== ENROLMENT ENDPOINTS ======
@app.get("/api/enrolment/periods", response_model=List[EnrolmentPeriod], tags=["enrolment"])
def list_enrolment_periods():
    conn = get_connection()
    result = conn.execute("""
        SELECT id, name, status, start_date, end_date
        FROM enrolment_periods
        ORDER BY id
    """).fetchall()
    conn.close()
    
    return [
        EnrolmentPeriod(
            id=row[0],
            name=row[1],
            status=row[2],
            startDate=row[3],
            endDate=row[4]
        )
        for row in result
    ]

@app.get("/api/enrolment/subjects", response_model=List[EnrolledSubject], tags=["enrolment"])
def list_enrolled_subjects():
    conn = get_connection()
    result = conn.execute("""
        SELECT id, code, name, credits, status, enrolled_date
        FROM enrolled_subjects
        WHERE student_id = 1
        ORDER BY enrolled_date DESC
    """).fetchall()
    conn.close()
    
    return [
        EnrolledSubject(
            id=row[0],
            code=row[1],
            name=row[2],
            credits=row[3],
            status=row[4],
            enrolledDate=row[5]
        )
        for row in result
    ]

# ====== THESIS ENDPOINTS ======
@app.get("/api/thesis", response_model=Thesis, tags=["thesis"])
def get_thesis():
    conn = get_connection()
    result = conn.execute("""
        SELECT id, title, type, status, supervisor, consultant, department,
               start_date, submission_deadline, defense_date, progress
        FROM thesis
        WHERE student_id = 1
        LIMIT 1
    """).fetchone()
    conn.close()
    
    if not result:
        raise HTTPException(status_code=404, detail="Thesis not found")
    
    return Thesis(
        id=result[0],
        title=result[1],
        type=result[2],
        status=result[3],
        supervisor=result[4],
        consultant=result[5],
        department=result[6],
        startDate=result[7],
        submissionDeadline=result[8],
        defenseDate=result[9],
        progress=result[10]
    )

@app.get("/api/thesis/milestones", response_model=List[ThesisMilestone], tags=["thesis"])
def get_thesis_milestones():
    conn = get_connection()
    result = conn.execute("""
        SELECT tm.id, tm.title, tm.status, tm.date, tm.description
        FROM thesis_milestones tm
        JOIN thesis t ON tm.thesis_id = t.id
        WHERE t.student_id = 1
        ORDER BY tm.id
    """).fetchall()
    conn.close()
    
    return [
        ThesisMilestone(
            id=row[0],
            title=row[1],
            status=row[2],
            date=row[3],
            description=row[4]
        )
        for row in result
    ]

@app.get("/api/thesis/documents", response_model=List[ThesisDocument], tags=["thesis"])
def get_thesis_documents():
    conn = get_connection()
    result = conn.execute("""
        SELECT td.id, td.name, td.size, td.uploaded
        FROM thesis_documents td
        JOIN thesis t ON td.thesis_id = t.id
        WHERE t.student_id = 1
        ORDER BY td.uploaded DESC
    """).fetchall()
    conn.close()
    
    return [
        ThesisDocument(
            id=row[0],
            name=row[1],
            size=row[2],
            uploaded=row[3]
        )
        for row in result
    ]

# ====== DORMITORY ENDPOINTS ======
@app.get("/api/dormitory/list", response_model=List[Dormitory], tags=["dormitory"])
def list_dormitories():
    conn = get_connection()
    result = conn.execute("""
        SELECT id, name, address, distance, rooms, rent, available
        FROM dormitories
        ORDER BY available DESC, name
    """).fetchall()
    
    dormitories = []
    for row in result:
        amenities_result = conn.execute("""
            SELECT amenity FROM dormitory_amenities WHERE dormitory_id = ?
        """, [row[0]]).fetchall()
        amenities = [a[0] for a in amenities_result]
        
        dormitories.append(
            Dormitory(
                id=row[0],
                name=row[1],
                address=row[2],
                distance=row[3],
                rooms=row[4],
                amenities=amenities,
                rent=row[5],
                available=row[6]
            )
        )
    
    conn.close()
    return dormitories

@app.get("/api/dormitory/application", response_model=DormitoryApplication, tags=["dormitory"])
def get_dormitory_application():
    conn = get_connection()
    result = conn.execute("""
        SELECT dormitory, room, room_type, floor, status, move_in_date, rent, deposit
        FROM dormitory_applications
        WHERE student_id = 1
        LIMIT 1
    """).fetchone()
    conn.close()
    
    if not result:
        raise HTTPException(status_code=404, detail="No dormitory application found")
    
    return DormitoryApplication(
        dormitory=result[0],
        room=result[1],
        roomType=result[2],
        floor=result[3],
        status=result[4],
        moveInDate=result[5],
        rent=result[6],
        deposit=result[7]
    )

# ====== PAYMENTS ENDPOINTS ======
@app.get("/api/payments", response_model=List[Payment], tags=["payments"])
def list_payments():
    conn = get_connection()
    result = conn.execute("""
        SELECT id, type, description, amount, date, due_date, status, method, invoice, icon
        FROM payments
        WHERE student_id = 1
        ORDER BY 
            CASE 
                WHEN status = 'pending' THEN 1
                ELSE 2
            END,
            CASE 
                WHEN due_date != '' THEN due_date
                WHEN date != '' THEN date
                ELSE '9999-99-99'
            END DESC
    """).fetchall()
    conn.close()
    
    return [
        Payment(
            id=row[0],
            type=row[1],
            description=row[2],
            amount=row[3],
            date=row[4],
            dueDate=row[5],
            status=row[6],
            method=row[7],
            invoice=row[8],
            icon=row[9]
        )
        for row in result
    ]

@app.get("/api/payments/balance", tags=["payments"])
def get_payment_balance():
    conn = get_connection()
    result = conn.execute("""
        SELECT SUM(CASE WHEN status = 'pending' THEN -amount ELSE 0 END) as balance
        FROM payments
        WHERE student_id = 1
    """).fetchone()
    conn.close()
    
    return {
        "total": result[0] or 0,
        "currency": "€"
    }

# ====== NOTIFICATIONS ENDPOINTS ======
@app.get("/api/notifications", response_model=List[Notification], tags=["notifications"])
def list_notifications():
    conn = get_connection()
    result = conn.execute("""
        SELECT id, type, message, time, read
        FROM notifications
        WHERE student_id = 1
        ORDER BY read ASC, id DESC
    """).fetchall()
    conn.close()
    
    return [
        Notification(
            id=row[0],
            type=row[1],
            message=row[2],
            time=row[3],
            read=row[4]
        )
        for row in result
    ]

# ====== NEWS ENDPOINTS ======
@app.get("/api/news", response_model=List[NewsItem], tags=["news"])
def list_news():
    conn = get_connection()
    result = conn.execute("""
        SELECT id, title, description, date, category, pinned
        FROM news
        ORDER BY pinned DESC, id DESC
    """).fetchall()
    conn.close()
    
    return [
        NewsItem(
            id=row[0],
            title=row[1],
            description=row[2],
            date=row[3],
            category=row[4],
            pinned=row[5]
        )
        for row in result
    ]

# ====== DASHBOARD ENDPOINTS ======
@app.get("/api/dashboard/exams", response_model=List[ExamItem], tags=["dashboard"])
def dashboard_exams():
    conn = get_connection()
    result = conn.execute("""
        SELECT subject, date, time
        FROM exams
        ORDER BY date, time
    """).fetchall()
    conn.close()
    
    return [
        ExamItem(
            subject=row[0],
            date=row[1],
            time=row[2]
        )
        for row in result
    ]

@app.get("/api/dashboard/subjects", response_model=List[SubjectItem], tags=["dashboard"])
def dashboard_subjects(count: int = Query(4, ge=1, le=10)):
    conn = get_connection()
    result = conn.execute("""
        SELECT name, code, credits
        FROM subjects
        WHERE enrolled = true
        LIMIT ?
    """, [count]).fetchall()
    conn.close()
    
    return [
        SubjectItem(
            name=row[0],
            code=row[1],
            credits=row[2]
        )
        for row in result
    ]

@app.get("/api/dashboard/schedule", response_model=List[DashboardScheduleItem], tags=["dashboard"])
def dashboard_schedule(total: int = Query(5, ge=1, le=20)):
    conn = get_connection()
    result = conn.execute("""
        SELECT day, time, subject, room
        FROM schedule
        ORDER BY 
            CASE day
                WHEN 'Monday' THEN 1
                WHEN 'Tuesday' THEN 2
                WHEN 'Wednesday' THEN 3
                WHEN 'Thursday' THEN 4
                WHEN 'Friday' THEN 5
            END,
            time
        LIMIT ?
    """, [total]).fetchall()
    conn.close()
    
    return [
        DashboardScheduleItem(
            day=row[0],
            time=row[1],
            subject=row[2],
            room=row[3]
        )
        for row in result
    ]

@app.get("/api/dashboard/notifications", response_model=List[NotificationItem], tags=["dashboard"])
def dashboard_notifications(count: int = Query(5, ge=1, le=20)):
    conn = get_connection()
    result = conn.execute("""
        SELECT type, message, time
        FROM notifications
        WHERE student_id = 1
        ORDER BY read ASC, id DESC
        LIMIT ?
    """, [count]).fetchall()
    conn.close()
    
    return [
        NotificationItem(
            type=row[0],
            message=row[1],
            time=row[2]
        )
        for row in result
    ]

@app.get("/api/dashboard/news", response_model=List[NewsItem], tags=["dashboard"])
def dashboard_news(count: int = Query(4, ge=1, le=20)):
    conn = get_connection()
    result = conn.execute("""
        SELECT id, title, description, date, category, pinned
        FROM news
        ORDER BY pinned DESC, id DESC
        LIMIT ?
    """, [count]).fetchall()
    conn.close()
    
    return [
        NewsItem(
            id=row[0],
            title=row[1],
            description=row[2],
            date=row[3],
            category=row[4],
            pinned=row[5]
        )
        for row in result
    ]

# ====== PROFILE ENDPOINTS ======
@app.get("/api/profile", response_model=Student, tags=["profile"])
def get_profile():
    conn = get_connection()
    result = conn.execute("""
        SELECT id, first_name, last_name, email, student_id, year, program, gpa
        FROM students
        WHERE id = 1
        LIMIT 1
    """).fetchone()
    conn.close()
    
    if not result:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return Student(
        id=result[0],
        firstName=result[1],
        lastName=result[2],
        email=result[3],
        studentId=result[4],
        year=result[5],
        program=result[6],
        gpa=result[7]
    )

# ====== SETTINGS ENDPOINTS ======
@app.get("/api/settings", tags=["settings"])
def get_settings():
    conn = get_connection()
    result = conn.execute("""
        SELECT key, value
        FROM settings
        WHERE student_id = 1
    """).fetchall()
    conn.close()
    
    settings = {row[0]: row[1] for row in result}
    
    # Return default settings if none exist
    if not settings:
        settings = {
            "language": "EN",
            "notifications": "true",
            "darkMode": "false"
        }
    
    return settings

# ====== TEACHER/ADMIN ENDPOINTS ======
@app.post("/api/teacher/exam/create", tags=["teacher"])
def create_exam(
    subject: str,
    date: str,
    time: str,
    room: str,
    authorization: Optional[str] = Header(None)
):
    """Create a new exam (teacher only)"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    student_id = verify_token(token)
    
    if not student_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Check if user is teacher
    conn = get_connection()
    user_role = conn.execute("SELECT role FROM students WHERE id = ?", [student_id]).fetchone()
    
    if not user_role or user_role[0] != 'teacher':
        conn.close()
        raise HTTPException(status_code=403, detail="Teacher access required")
    
    # Get next exam id
    max_id = conn.execute("SELECT COALESCE(MAX(id), 0) FROM exams").fetchone()[0]
    new_id = max_id + 1
    
    conn.execute("""
        INSERT INTO exams (id, subject, date, time, room)
        VALUES (?, ?, ?, ?, ?)
    """, [new_id, subject, date, time, room])
    
    conn.close()
    
    return {"message": "Exam created successfully", "id": new_id}

@app.post("/api/teacher/grade/assign", tags=["teacher"])
def assign_grade(
    student_id: int,
    subject: str,
    code: str,
    grade: str,
    credits: int,
    semester: str,
    authorization: Optional[str] = Header(None)
):
    """Assign a grade to a student (teacher only)"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    teacher_id = verify_token(token)
    
    if not teacher_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Check if user is teacher
    conn = get_connection()
    user_role = conn.execute("SELECT role FROM students WHERE id = ?", [teacher_id]).fetchone()
    
    if not user_role or user_role[0] != 'teacher':
        conn.close()
        raise HTTPException(status_code=403, detail="Teacher access required")
    
    # Grade to numeric mapping
    grade_map = {"A": 1.0, "B": 1.5, "C": 2.0, "D": 3.0, "E": 4.0, "FX": 5.0}
    numeric_grade = grade_map.get(grade, 1.0)
    
    # Get next grade id
    max_id = conn.execute("SELECT COALESCE(MAX(id), 0) FROM grades").fetchone()[0]
    new_id = max_id + 1
    
    from datetime import datetime
    current_date = datetime.now().strftime("%b %d, %Y")
    
    conn.execute("""
        INSERT INTO grades (id, student_id, subject, code, grade, credits, semester, date, numeric_grade)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, [new_id, student_id, subject, code, grade, credits, semester, current_date, numeric_grade])
    
    conn.close()
    
    return {"message": "Grade assigned successfully", "id": new_id}

# ====== STUDENT ACTION ENDPOINTS ======
@app.post("/api/enrolment/enroll", tags=["enrolment"])
def enroll_subject(
    req: EnrollRequest,
    authorization: Optional[str] = Header(None)
):
    """Enroll in a subject"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    student_id = verify_token(token)
    
    if not student_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    conn = get_connection()
    
    # Get subject details
    subject = conn.execute("""
        SELECT name, credits FROM subjects WHERE code = ?
    """, [req.subject_code]).fetchone()
    
    if not subject:
        conn.close()
        raise HTTPException(status_code=404, detail="Subject not found")
    
    # Check if already enrolled
    existing = conn.execute("""
        SELECT id FROM enrolled_subjects WHERE student_id = ? AND code = ?
    """, [student_id, req.subject_code]).fetchone()
    
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="Already enrolled in this subject")
    
    # Get next id
    max_id = conn.execute("SELECT COALESCE(MAX(id), 0) FROM enrolled_subjects").fetchone()[0]
    new_id = max_id + 1
    
    from datetime import datetime
    current_date = datetime.now().strftime("%b %d, %Y")
    
    conn.execute("""
        INSERT INTO enrolled_subjects (id, student_id, code, name, credits, status, enrolled_date)
        VALUES (?, ?, ?, ?, ?, 'pending', ?)
    """, [new_id, student_id, req.subject_code, subject[0], subject[1], current_date])
    
    # Update subject enrollment status
    conn.execute("UPDATE subjects SET enrolled = TRUE WHERE code = ?", [req.subject_code])
    
    conn.close()
    
    return {"message": "Successfully enrolled in subject", "id": new_id}

@app.post("/api/dormitory/apply", tags=["dormitory"])
def apply_dormitory(
    req: DormitoryApplyRequest,
    authorization: Optional[str] = Header(None)
):
    """Apply for dormitory accommodation"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    student_id = verify_token(token)
    
    if not student_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    conn = get_connection()
    
    # Get dormitory details
    dorm = conn.execute("""
        SELECT name, rent FROM dormitories WHERE id = ? AND available = TRUE
    """, [req.dormitory_id]).fetchone()
    
    if not dorm:
        conn.close()
        raise HTTPException(status_code=404, detail="Dormitory not available")
    
    # Check if already has application
    existing = conn.execute("""
        SELECT id FROM dormitory_applications WHERE student_id = ?
    """, [student_id]).fetchone()
    
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="Already have a dormitory application")
    
    # Get next id
    max_id = conn.execute("SELECT COALESCE(MAX(id), 0) FROM dormitory_applications").fetchone()[0]
    new_id = max_id + 1
    
    from datetime import datetime
    move_in = (datetime.now() + timedelta(days=30)).strftime("%B %d, %Y")
    
    # Generate room number
    import random
    floor = random.randint(1, 5)
    room_num = f"{chr(65 + random.randint(0, 3))}-{random.randint(100, 599)}"
    
    conn.execute("""
        INSERT INTO dormitory_applications 
        (id, student_id, dormitory, room, room_type, floor, status, move_in_date, rent, deposit)
        VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
    """, [new_id, student_id, dorm[0], room_num, req.room_type, floor, move_in, dorm[1], dorm[1].replace("€", "€2")])
    
    conn.close()
    
    return {"message": "Dormitory application submitted", "id": new_id}

@app.put("/api/settings/update", tags=["settings"])
def update_settings(
    settings: Dict[str, str],
    authorization: Optional[str] = Header(None)
):
    """Update user settings"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    student_id = verify_token(token)
    
    if not student_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    conn = get_connection()
    
    # Delete existing settings
    conn.execute("DELETE FROM settings WHERE student_id = ?", [student_id])
    
    # Insert new settings
    for key, value in settings.items():
        max_id = conn.execute("SELECT COALESCE(MAX(id), 0) FROM settings").fetchone()[0]
        new_id = max_id + 1
        conn.execute("""
            INSERT INTO settings (id, student_id, key, value)
            VALUES (?, ?, ?, ?)
        """, [new_id, student_id, key, value])
    
    conn.close()
    
    return {"message": "Settings updated successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
