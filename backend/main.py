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
    time_option_ids: Optional[List[int]] = None  # Optional time slot selections

class DormitoryApplyRequest(BaseModel):
    dormitory_id: int
    room_type: str

class EnrollWithTimeRequest(BaseModel):
    subject_code: str
    time_option_ids: List[int]  # List of selected time option IDs (lecture + lab)

class ScheduleSelectionRequest(BaseModel):
    subject_code: str
    time_option_ids: List[int]

class CreateSubjectRequest(BaseModel):
    code: str
    name: str
    credits: int
    semester: str
    lecturer: str
    description: str
    year: int
    
class CreateTimeOptionRequest(BaseModel):
    subject_code: str
    option_name: str
    day: str
    time: str
    room: str
    type: str  # "Lecture" or "Lab"
    lecturer: str
    capacity: int

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

class SubjectTimeOption(BaseModel):
    id: int
    subject_code: str
    option_name: str
    day: str
    time: str
    room: str
    type: str
    lecturer: str
    capacity: int
    enrolled: int
    available: int

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
    studentId: Optional[int] = None
    title: str
    type: str
    status: str
    supervisor: str
    supervisorEmail: Optional[str] = None
    consultant: Optional[str] = None
    department: str
    description: Optional[str] = None
    startDate: Optional[str] = None
    submissionDeadline: Optional[str] = None
    defenseDate: Optional[str] = None
    progress: int = 0
    isAvailable: bool = False

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
    uploadedBy: Optional[int] = None
    fileUrl: Optional[str] = None

class CreateThesisRequest(BaseModel):
    title: str
    type: str
    supervisor: str
    supervisorEmail: str
    consultant: Optional[str] = None
    department: str
    description: str

class AssignThesisRequest(BaseModel):
    thesis_id: int

class UploadDocumentRequest(BaseModel):
    thesis_id: int
    name: str
    size: str

class Dormitory(BaseModel):
    id: int
    name: str
    address: str
    distance: str
    rooms: int
    amenities: List[str]
    rent: str
    available: bool
    description: Optional[str] = None
    roomTypes: Optional[str] = None
    capacity: Optional[int] = None
    managerName: Optional[str] = None
    managerEmail: Optional[str] = None
    managerPhone: Optional[str] = None

class DormitoryApplication(BaseModel):
    id: Optional[int] = None
    dormitoryId: Optional[int] = None
    dormitory: str
    room: str
    roomType: str
    floor: int
    status: str
    moveInDate: str
    rent: str
    deposit: str
    appliedDate: Optional[str] = None
    notes: Optional[str] = None

class DormitoryDocument(BaseModel):
    id: int
    name: str
    type: str
    size: str
    uploaded: str
    uploadedBy: Optional[int] = None
    fileUrl: Optional[str] = None

class CreateDormitoryRequest(BaseModel):
    name: str
    address: str
    distance: str
    rooms: int
    rent: str
    description: str
    roomTypes: str
    capacity: int
    managerName: str
    managerEmail: str
    managerPhone: str
    amenities: List[str]

class UpdateDormitoryRequest(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    distance: Optional[str] = None
    rooms: Optional[int] = None
    rent: Optional[str] = None
    description: Optional[str] = None
    roomTypes: Optional[str] = None
    capacity: Optional[int] = None
    managerName: Optional[str] = None
    managerEmail: Optional[str] = None
    managerPhone: Optional[str] = None
    amenities: Optional[List[str]] = None
    available: Optional[bool] = None

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

def verify_token(token: Optional[str]) -> Optional[Dict]:
    """Verify session token and return student info if valid"""
    if not token:
        return None
    
    conn = get_connection()
    session = conn.execute("""
        SELECT student_id FROM sessions 
        WHERE token = ? AND expires_at > now()
    """, [token]).fetchone()
    
    if not session:
        conn.close()
        return None
    
    student_id = session[0]
    
    # Get full student info
    student = conn.execute("""
        SELECT id, first_name, last_name, email, student_id, year, program, gpa, role
        FROM students WHERE id = ?
    """, [student_id]).fetchone()
    conn.close()
    
    if not student:
        return None
    
    return {
        "id": student[0],
        "firstName": student[1],
        "lastName": student[2],
        "email": student[3],
        "studentId": student[4],
        "year": student[5],
        "program": student[6],
        "gpa": student[7],
        "role": student[8] if len(student) > 8 else "student"
    }

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
    authorization: Optional[str] = Header(None)
):
    """Get grades for authenticated student"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    student_id = verify_token(token)
    
    if not student_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    conn = get_connection()
    
    if semester:
        result = conn.execute("""
            SELECT id, subject, code, grade, credits, semester, date, numeric_grade
            FROM grades
            WHERE student_id = ? AND semester = ?
            ORDER BY semester, subject, code
        """, [student_id, semester]).fetchall()
    else:
        result = conn.execute("""
            SELECT id, subject, code, grade, credits, semester, date, numeric_grade
            FROM grades
            WHERE student_id = ?
            ORDER BY semester, subject, code
        """, [student_id]).fetchall()
    
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
def grade_stats(
    semester: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None)
):
    """Get grade statistics for authenticated student"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    student_id = verify_token(token)
    
    if not student_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    conn = get_connection()
    
    if semester:
        result = conn.execute("""
            SELECT 
                COUNT(*) as count,
                SUM(credits) as total_credits,
                SUM(numeric_grade * credits) / SUM(credits) as weighted_avg
            FROM grades
            WHERE student_id = ? AND semester = ?
        """, [student_id, semester]).fetchone()
    else:
        result = conn.execute("""
            SELECT 
                COUNT(*) as count,
                SUM(credits) as total_credits,
                SUM(numeric_grade * credits) / SUM(credits) as weighted_avg
            FROM grades
            WHERE student_id = ?
        """, [student_id]).fetchone()
    
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
def list_schedule(authorization: Optional[str] = Header(None)):
    """Get student's personalized schedule based on their time slot selections"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    student_id = verify_token(token)
    
    if not student_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    conn = get_connection()
    # Get schedule based on student's selected time options
    result = conn.execute("""
        SELECT DISTINCT
            sto.id,
            sto.day,
            sto.time,
            s.name as subject,
            s.code,
            sto.room,
            sto.type
        FROM student_schedule_selections sss
        JOIN subject_time_options sto ON sss.time_option_id = sto.id
        JOIN subjects s ON s.code = sto.subject_code
        WHERE sss.student_id = ?
        ORDER BY 
            CASE sto.day
                WHEN 'Monday' THEN 1
                WHEN 'Tuesday' THEN 2
                WHEN 'Wednesday' THEN 3
                WHEN 'Thursday' THEN 4
                WHEN 'Friday' THEN 5
            END,
            sto.time
    """, [student_id]).fetchall()
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

@app.get("/api/schedule/options/{subject_code}", response_model=List[SubjectTimeOption], tags=["schedule"])
def get_subject_time_options(subject_code: str):
    """Get all available time options for a specific subject"""
    conn = get_connection()
    result = conn.execute("""
        SELECT id, subject_code, option_name, day, time, room, type, lecturer, capacity, enrolled
        FROM subject_time_options
        WHERE subject_code = ?
        ORDER BY type, day, time
    """, [subject_code]).fetchall()
    conn.close()
    
    return [
        SubjectTimeOption(
            id=row[0],
            subject_code=row[1],
            option_name=row[2],
            day=row[3],
            time=row[4],
            room=row[5],
            type=row[6],
            lecturer=row[7],
            capacity=row[8],
            enrolled=row[9],
            available=row[8] - row[9]
        )
        for row in result
    ]

@app.get("/api/schedule/selections", tags=["schedule"])
def get_schedule_selections(authorization: Optional[str] = Header(None)):
    """Get student's current schedule time slot selections"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    student_id = verify_token(token)
    
    if not student_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    conn = get_connection()
    result = conn.execute("""
        SELECT sss.subject_code, sss.time_option_id, sto.option_name, sto.type
        FROM student_schedule_selections sss
        JOIN subject_time_options sto ON sss.time_option_id = sto.id
        WHERE sss.student_id = ?
    """, [student_id]).fetchall()
    conn.close()
    
    # Group by subject code
    selections = {}
    for row in result:
        code = row[0]
        if code not in selections:
            selections[code] = []
        selections[code].append({
            "time_option_id": row[1],
            "option_name": row[2],
            "type": row[3]
        })
    
    return selections

@app.post("/api/schedule/update", tags=["schedule"])
def update_schedule_selection(request: ScheduleSelectionRequest, authorization: Optional[str] = Header(None)):
    """Update student's time slot selection for a subject"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    student_id = verify_token(token)
    
    if not student_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    conn = get_connection()
    
    # Delete existing selections for this subject
    conn.execute("""
        DELETE FROM student_schedule_selections
        WHERE student_id = ? AND subject_code = ?
    """, [student_id, request.subject_code])
    
    # Insert new selections
    for option_id in request.time_option_ids:
        # Get next ID
        next_id_result = conn.execute("SELECT COALESCE(MAX(id), 0) + 1 FROM student_schedule_selections").fetchone()
        next_id = next_id_result[0]
        
        conn.execute("""
            INSERT INTO student_schedule_selections VALUES (?, ?, ?, ?)
        """, [next_id, student_id, request.subject_code, option_id])
    
    conn.close()
    
    return {"success": True, "message": "Schedule updated successfully"}

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

# Get all available theses (for browsing/searching)
@app.get("/api/thesis/available", response_model=List[Thesis], tags=["thesis"])
def get_available_theses(
    authorization: str = Header(None),
    search: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    supervisor: Optional[str] = Query(None),
    department: Optional[str] = Query(None)
):
    """Get all available theses for students to browse and assign"""
    student = verify_token(authorization)
    
    conn = get_connection()
    
    query = """
        SELECT id, student_id, title, type, status, supervisor, supervisor_email, 
               consultant, department, description, start_date, submission_deadline, 
               defense_date, progress, is_available
        FROM thesis
        WHERE is_available = TRUE
    """
    params = []
    
    if search:
        query += " AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(supervisor) LIKE ?)"
        search_term = f"%{search.lower()}%"
        params.extend([search_term, search_term, search_term])
    
    if type:
        query += " AND type = ?"
        params.append(type)
    
    if supervisor:
        query += " AND LOWER(supervisor) LIKE ?"
        params.append(f"%{supervisor.lower()}%")
    
    if department:
        query += " AND LOWER(department) LIKE ?"
        params.append(f"%{department.lower()}%")
    
    query += " ORDER BY id DESC"
    
    result = conn.execute(query, params).fetchall()
    conn.close()
    
    return [
        Thesis(
            id=row[0],
            studentId=row[1],
            title=row[2],
            type=row[3],
            status=row[4],
            supervisor=row[5],
            supervisorEmail=row[6],
            consultant=row[7],
            department=row[8],
            description=row[9],
            startDate=row[10],
            submissionDeadline=row[11],
            defenseDate=row[12],
            progress=row[13],
            isAvailable=row[14]
        )
        for row in result
    ]

# Get student's assigned thesis
@app.get("/api/thesis/my-thesis", response_model=Optional[Thesis], tags=["thesis"])
def get_my_thesis(authorization: str = Header(None)):
    """Get the thesis assigned to the current student"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    student = verify_token(token)
    
    if not student:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    conn = get_connection()
    result = conn.execute("""
        SELECT id, student_id, title, type, status, supervisor, supervisor_email,
               consultant, department, description, start_date, submission_deadline, 
               defense_date, progress, is_available
        FROM thesis
        WHERE student_id = ?
        LIMIT 1
    """, [student['id']]).fetchone()
    conn.close()
    
    if not result:
        return None
    
    return Thesis(
        id=result[0],
        studentId=result[1],
        title=result[2],
        type=result[3],
        status=result[4],
        supervisor=result[5],
        supervisorEmail=result[6],
        consultant=result[7],
        department=result[8],
        description=result[9],
        startDate=result[10],
        submissionDeadline=result[11],
        defenseDate=result[12],
        progress=result[13],
        isAvailable=result[14]
    )

# Assign thesis to student
@app.post("/api/thesis/assign", tags=["thesis"])
def assign_thesis(request: AssignThesisRequest, authorization: str = Header(None)):
    """Student assigns a thesis to themselves"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    student = verify_token(token)
    
    if not student:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    conn = get_connection()
    
    # Check if thesis is available
    thesis_check = conn.execute("""
        SELECT is_available, student_id FROM thesis WHERE id = ?
    """, [request.thesis_id]).fetchone()
    
    if not thesis_check:
        conn.close()
        raise HTTPException(status_code=404, detail="Thesis not found")
    
    if not thesis_check[0]:
        conn.close()
        raise HTTPException(status_code=400, detail="Thesis is not available")
    
    if thesis_check[1] is not None:
        conn.close()
        raise HTTPException(status_code=400, detail="Thesis already assigned")
    
    # Check if student already has a thesis
    existing = conn.execute("""
        SELECT id FROM thesis WHERE student_id = ?
    """, [student['id']]).fetchone()
    
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="You already have a thesis assigned")
    
    # Assign thesis to student
    from datetime import datetime, timedelta
    today = datetime.now()
    submission = (today + timedelta(days=270)).strftime('%B %d, %Y')  # 9 months
    defense = (today + timedelta(days=300)).strftime('%B %d, %Y')  # 10 months
    
    conn.execute("""
        UPDATE thesis 
        SET student_id = ?, 
            status = 'In Progress',
            is_available = FALSE,
            start_date = ?,
            submission_deadline = ?,
            defense_date = ?
        WHERE id = ?
    """, [student['id'], today.strftime('%B %d, %Y'), submission, defense, request.thesis_id])
    
    # Create default milestones
    milestones = [
        ('Thesis Registration', 'completed', today.strftime('%B %d, %Y'), 'Thesis topic approved and registered'),
        ('Literature Review', 'in-progress', (today + timedelta(days=45)).strftime('%B %d, %Y'), 'Research and review of relevant literature'),
        ('Research Methodology', 'pending', (today + timedelta(days=105)).strftime('%B %d, %Y'), 'Define research methods and approach'),
        ('Implementation', 'pending', (today + timedelta(days=180)).strftime('%B %d, %Y'), 'Develop practical implementation'),
        ('Final Draft Submission', 'pending', (today + timedelta(days=255)).strftime('%B %d, %Y'), 'Submit complete thesis draft'),
        ('Thesis Defense', 'pending', defense, 'Oral defense presentation'),
    ]
    
    for idx, milestone in enumerate(milestones, 1):
        # Get max milestone id
        max_id = conn.execute("SELECT COALESCE(MAX(id), 0) FROM thesis_milestones").fetchone()[0]
        conn.execute("""
            INSERT INTO thesis_milestones (id, thesis_id, title, status, date, description)
            VALUES (?, ?, ?, ?, ?, ?)
        """, [max_id + idx, request.thesis_id, milestone[0], milestone[1], milestone[2], milestone[3]])
    
    conn.close()
    
    return {"message": "Thesis assigned successfully", "thesis_id": request.thesis_id}

# Create new thesis (teacher only)
@app.post("/api/thesis/create", tags=["thesis"])
def create_thesis(request: CreateThesisRequest, authorization: str = Header(None)):
    """Teacher creates a new thesis topic"""
    token = authorization.replace("Bearer ", "") if authorization else None
    student = verify_token(token)
    
    if not student:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    if student.get('role') != 'teacher':
        raise HTTPException(status_code=403, detail="Only teachers can create thesis topics")
    
    conn = get_connection()
    
    # Get max thesis id
    max_id = conn.execute("SELECT COALESCE(MAX(id), 0) FROM thesis").fetchone()[0]
    new_id = max_id + 1
    
    conn.execute("""
        INSERT INTO thesis (id, student_id, title, type, status, supervisor, supervisor_email,
                           consultant, department, description, start_date, submission_deadline,
                           defense_date, progress, created_by, is_available)
        VALUES (?, NULL, ?, ?, 'Available', ?, ?, ?, ?, ?, NULL, NULL, NULL, 0, ?, TRUE)
    """, [new_id, request.title, request.type, request.supervisor, request.supervisorEmail,
          request.consultant, request.department, request.description, student['id']])
    
    conn.close()
    
    return {"message": "Thesis created successfully", "thesis_id": new_id}

# Update thesis (teacher only)
@app.put("/api/thesis/{thesis_id}", tags=["thesis"])
def update_thesis(thesis_id: int, request: CreateThesisRequest, authorization: str = Header(None)):
    """Teacher updates thesis information"""
    token = authorization.replace("Bearer ", "") if authorization else None
    student = verify_token(token)
    
    if not student:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    if student.get('role') != 'teacher':
        raise HTTPException(status_code=403, detail="Only teachers can update thesis")
    
    conn = get_connection()
    
    conn.execute("""
        UPDATE thesis 
        SET title = ?, type = ?, supervisor = ?, supervisor_email = ?,
            consultant = ?, department = ?, description = ?
        WHERE id = ?
    """, [request.title, request.type, request.supervisor, request.supervisorEmail,
          request.consultant, request.department, request.description, thesis_id])
    
    conn.close()
    
    return {"message": "Thesis updated successfully"}

# Get thesis milestones
@app.get("/api/thesis/{thesis_id}/milestones", response_model=List[ThesisMilestone], tags=["thesis"])
def get_thesis_milestones(thesis_id: int, authorization: str = Header(None)):
    """Get milestones for a specific thesis"""
    student = verify_token(authorization)
    
    conn = get_connection()
    result = conn.execute("""
        SELECT tm.id, tm.title, tm.status, tm.date, tm.description
        FROM thesis_milestones tm
        WHERE tm.thesis_id = ?
        ORDER BY tm.id
    """, [thesis_id]).fetchall()
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

# Get thesis documents
@app.get("/api/thesis/{thesis_id}/documents", response_model=List[ThesisDocument], tags=["thesis"])
def get_thesis_documents(thesis_id: int, authorization: str = Header(None)):
    """Get documents for a specific thesis"""
    student = verify_token(authorization)
    
    conn = get_connection()
    result = conn.execute("""
        SELECT td.id, td.name, td.size, td.uploaded, td.uploaded_by, td.file_url
        FROM thesis_documents td
        WHERE td.thesis_id = ?
        ORDER BY td.uploaded DESC
    """, [thesis_id]).fetchall()
    conn.close()
    
    return [
        ThesisDocument(
            id=row[0],
            name=row[1],
            size=row[2],
            uploaded=row[3],
            uploadedBy=row[4],
            fileUrl=row[5]
        )
        for row in result
    ]

# Upload document
@app.post("/api/thesis/{thesis_id}/upload", tags=["thesis"])
def upload_document(thesis_id: int, request: UploadDocumentRequest, authorization: str = Header(None)):
    """Upload a document to thesis (simulated - returns success)"""
    student = verify_token(authorization)
    
    conn = get_connection()
    
    # Verify thesis exists and belongs to student or user is teacher
    thesis = conn.execute("""
        SELECT student_id FROM thesis WHERE id = ?
    """, [thesis_id]).fetchone()
    
    if not thesis:
        conn.close()
        raise HTTPException(status_code=404, detail="Thesis not found")
    
    if thesis[0] != student['id'] and student.get('role') != 'teacher':
        conn.close()
        raise HTTPException(status_code=403, detail="Not authorized to upload to this thesis")
    
    # Get max document id
    max_id = conn.execute("SELECT COALESCE(MAX(id), 0) FROM thesis_documents").fetchone()[0]
    new_id = max_id + 1
    
    from datetime import datetime
    uploaded_date = datetime.now().strftime('%b %d, %Y')
    file_url = f"/files/thesis_{thesis_id}_{new_id}_{request.name}"
    
    conn.execute("""
        INSERT INTO thesis_documents (id, thesis_id, name, size, uploaded, uploaded_by, file_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, [new_id, thesis_id, request.name, request.size, uploaded_date, student['id'], file_url])
    
    conn.close()
    
    return {"message": "Document uploaded successfully", "document_id": new_id, "file_url": file_url}

# ====== DORMITORY ENDPOINTS ======

# List all dormitories with optional search and filters
@app.get("/api/dormitory/available", response_model=List[Dormitory], tags=["dormitory"])
def list_available_dormitories(
    search: Optional[str] = Query(None),
    available_only: Optional[bool] = Query(True)
):
    """Get list of available dormitories with search and filters"""
    conn = get_connection()
    
    query = """
        SELECT id, name, address, distance, rooms, rent, available, description, room_types, capacity, manager_name, manager_email, manager_phone
        FROM dormitories
        WHERE 1=1
    """
    params = []
    
    if available_only:
        query += " AND available = TRUE"
    
    if search:
        query += " AND (LOWER(name) LIKE ? OR LOWER(address) LIKE ? OR LOWER(description) LIKE ?)"
        search_param = f"%{search.lower()}%"
        params.extend([search_param, search_param, search_param])
    
    query += " ORDER BY available DESC, name"
    
    result = conn.execute(query, params).fetchall()
    
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
                available=row[6],
                description=row[7],
                roomTypes=row[8],
                capacity=row[9],
                managerName=row[10],
                managerEmail=row[11],
                managerPhone=row[12]
            )
        )
    
    conn.close()
    return dormitories

# Get student's current application
@app.get("/api/dormitory/my-application", response_model=DormitoryApplication, tags=["dormitory"])
def get_my_application(authorization: Optional[str] = Header(None)):
    """Get student's dormitory application"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    student_id = verify_token(token)
    
    if not student_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    conn = get_connection()
    result = conn.execute("""
        SELECT id, dormitory_id, dormitory, room, room_type, floor, status, move_in_date, rent, deposit, applied_date, notes
        FROM dormitory_applications
        WHERE student_id = ?
        ORDER BY id DESC
        LIMIT 1
    """, [student_id]).fetchone()
    conn.close()
    
    if not result:
        raise HTTPException(status_code=404, detail="No dormitory application found")
    
    return DormitoryApplication(
        id=result[0],
        dormitoryId=result[1],
        dormitory=result[2],
        room=result[3],
        roomType=result[4],
        floor=result[5],
        status=result[6],
        moveInDate=result[7],
        rent=result[8],
        deposit=result[9],
        appliedDate=result[10],
        notes=result[11]
    )

# Backward compatible endpoint
@app.get("/api/dormitory/application", response_model=DormitoryApplication, tags=["dormitory"])
def get_dormitory_application(authorization: Optional[str] = Header(None)):
    """Get dormitory application (alias for my-application)"""
    return get_my_application(authorization)

# List all dormitories (backward compatible)
@app.get("/api/dormitory/list", response_model=List[Dormitory], tags=["dormitory"])
def list_dormitories():
    """Get list of all dormitories"""
    return list_available_dormitories(search=None, available_only=False)

# Get documents for an application
@app.get("/api/dormitory/application/{application_id}/documents", response_model=List[DormitoryDocument], tags=["dormitory"])
def get_dormitory_documents(application_id: int, authorization: str = Header(None)):
    """Get documents for a dormitory application"""
    student = verify_token(authorization)
    
    conn = get_connection()
    
    # Verify application belongs to student
    app = conn.execute("""
        SELECT student_id FROM dormitory_applications WHERE id = ?
    """, [application_id]).fetchone()
    
    if not app:
        conn.close()
        raise HTTPException(status_code=404, detail="Application not found")
    
    if app[0] != student['id']:
        conn.close()
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = conn.execute("""
        SELECT id, name, type, size, uploaded, uploaded_by, file_url
        FROM dormitory_documents
        WHERE application_id = ?
        ORDER BY uploaded DESC
    """, [application_id]).fetchall()
    
    conn.close()
    
    return [
        DormitoryDocument(
            id=row[0],
            name=row[1],
            type=row[2],
            size=row[3],
            uploaded=row[4],
            uploadedBy=row[5],
            fileUrl=row[6]
        )
        for row in result
    ]

# Upload document to application
@app.post("/api/dormitory/application/{application_id}/upload", tags=["dormitory"])
def upload_dormitory_document(
    application_id: int,
    name: str,
    doc_type: str,
    size: str,
    authorization: str = Header(None)
):
    """Upload a document to dormitory application"""
    student = verify_token(authorization)
    
    conn = get_connection()
    
    # Verify application belongs to student
    app = conn.execute("""
        SELECT student_id FROM dormitory_applications WHERE id = ?
    """, [application_id]).fetchone()
    
    if not app:
        conn.close()
        raise HTTPException(status_code=404, detail="Application not found")
    
    if app[0] != student['id']:
        conn.close()
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get max document id
    max_id = conn.execute("SELECT COALESCE(MAX(id), 0) FROM dormitory_documents").fetchone()[0]
    new_id = max_id + 1
    
    from datetime import datetime
    uploaded_date = datetime.now().strftime('%b %d, %Y')
    file_url = f"/files/dorm_{application_id}_{new_id}_{name}"
    
    conn.execute("""
        INSERT INTO dormitory_documents (id, application_id, name, type, size, uploaded, uploaded_by, file_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, [new_id, application_id, name, doc_type, size, uploaded_date, student['id'], file_url])
    
    conn.close()
    
    return {"message": "Document uploaded successfully", "document_id": new_id, "file_url": file_url}

# Create new dormitory (teacher only)
@app.post("/api/dormitory/create", tags=["dormitory"])
def create_dormitory(request: CreateDormitoryRequest, authorization: str = Header(None)):
    """Create a new dormitory (teacher only)"""
    token = authorization.replace("Bearer ", "") if authorization else None
    student = verify_token(token)
    
    if not student:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    if student.get('role') != 'teacher':
        raise HTTPException(status_code=403, detail="Only teachers can create dormitories")
    
    conn = get_connection()
    
    # Get max dormitory id
    max_id = conn.execute("SELECT COALESCE(MAX(id), 0) FROM dormitories").fetchone()[0]
    new_id = max_id + 1
    
    from datetime import datetime
    created_at = datetime.now().isoformat()
    
    conn.execute("""
        INSERT INTO dormitories (id, name, address, distance, rooms, rent, available, description, room_types, capacity, manager_name, manager_email, manager_phone, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, TRUE, ?, ?, ?, ?, ?, ?, ?, ?)
    """, [new_id, request.name, request.address, request.distance, request.rooms, request.rent, request.description, request.roomTypes, request.capacity, request.managerName, request.managerEmail, request.managerPhone, student['id'], created_at])
    
    # Insert amenities
    max_amenity_id = conn.execute("SELECT COALESCE(MAX(id), 0) FROM dormitory_amenities").fetchone()[0]
    for i, amenity in enumerate(request.amenities):
        conn.execute("""
            INSERT INTO dormitory_amenities (id, dormitory_id, amenity)
            VALUES (?, ?, ?)
        """, [max_amenity_id + i + 1, new_id, amenity])
    
    conn.close()
    
    return {"message": "Dormitory created successfully", "dormitory_id": new_id}

# Update dormitory (teacher only)
@app.put("/api/dormitory/{dormitory_id}", tags=["dormitory"])
def update_dormitory(dormitory_id: int, request: UpdateDormitoryRequest, authorization: str = Header(None)):
    """Update dormitory information (teacher only)"""
    token = authorization.replace("Bearer ", "") if authorization else None
    student = verify_token(token)
    
    if not student:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    if student.get('role') != 'teacher':
        raise HTTPException(status_code=403, detail="Only teachers can update dormitories")
    
    conn = get_connection()
    
    # Check if dormitory exists
    existing = conn.execute("SELECT id FROM dormitories WHERE id = ?", [dormitory_id]).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Dormitory not found")
    
    # Build update query dynamically
    updates = []
    params = []
    
    if request.name is not None:
        updates.append("name = ?")
        params.append(request.name)
    if request.address is not None:
        updates.append("address = ?")
        params.append(request.address)
    if request.distance is not None:
        updates.append("distance = ?")
        params.append(request.distance)
    if request.rooms is not None:
        updates.append("rooms = ?")
        params.append(request.rooms)
    if request.rent is not None:
        updates.append("rent = ?")
        params.append(request.rent)
    if request.description is not None:
        updates.append("description = ?")
        params.append(request.description)
    if request.roomTypes is not None:
        updates.append("room_types = ?")
        params.append(request.roomTypes)
    if request.capacity is not None:
        updates.append("capacity = ?")
        params.append(request.capacity)
    if request.managerName is not None:
        updates.append("manager_name = ?")
        params.append(request.managerName)
    if request.managerEmail is not None:
        updates.append("manager_email = ?")
        params.append(request.managerEmail)
    if request.managerPhone is not None:
        updates.append("manager_phone = ?")
        params.append(request.managerPhone)
    if request.available is not None:
        updates.append("available = ?")
        params.append(request.available)
    
    if updates:
        params.append(dormitory_id)
        query = f"UPDATE dormitories SET {', '.join(updates)} WHERE id = ?"
        conn.execute(query, params)
    
    # Update amenities if provided
    if request.amenities is not None:
        # Delete existing amenities
        conn.execute("DELETE FROM dormitory_amenities WHERE dormitory_id = ?", [dormitory_id])
        
        # Insert new amenities
        max_amenity_id = conn.execute("SELECT COALESCE(MAX(id), 0) FROM dormitory_amenities").fetchone()[0]
        for i, amenity in enumerate(request.amenities):
            conn.execute("""
                INSERT INTO dormitory_amenities (id, dormitory_id, amenity)
                VALUES (?, ?, ?)
            """, [max_amenity_id + i + 1, dormitory_id, amenity])
    
    conn.close()
    
    return {"message": "Dormitory updated successfully"}

# ====== PAYMENTS ENDPOINTS ======
@app.get("/api/payments", response_model=List[Payment], tags=["payments"])
def list_payments(authorization: str = Header(None)):
    student_id = verify_token(authorization)
    conn = get_connection()
    result = conn.execute("""
        SELECT id, type, description, amount, date, due_date, status, method, invoice, icon
        FROM payments
        WHERE student_id = ?
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
    """, [student_id]).fetchall()
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
def get_payment_balance(authorization: str = Header(None)):
    student_id = verify_token(authorization)
    conn = get_connection()
    result = conn.execute("""
        SELECT SUM(CASE WHEN status = 'pending' THEN -amount ELSE 0 END) as balance
        FROM payments
        WHERE student_id = ?
    """, [student_id]).fetchone()
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
    token = authorization.replace("Bearer ", "") if authorization else None
    student = verify_token(token)
    
    if not student:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    if student.get('role') != 'teacher':
        raise HTTPException(status_code=403, detail="Teacher access required")
    
    conn = get_connection()
    
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
    token = authorization.replace("Bearer ", "") if authorization else None
    teacher = verify_token(token)
    
    if not teacher:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    if teacher.get('role') != 'teacher':
        raise HTTPException(status_code=403, detail="Teacher access required")
    
    conn = get_connection()
    
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

@app.post("/api/teacher/subject/create", tags=["teacher"])
def create_subject(
    req: CreateSubjectRequest,
    authorization: Optional[str] = Header(None)
):
    """Create a new subject (teacher only)"""
    token = authorization.replace("Bearer ", "") if authorization else None
    teacher = verify_token(token)
    
    if not teacher:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    if teacher.get('role') != 'teacher':
        raise HTTPException(status_code=403, detail="Teacher access required")
    
    conn = get_connection()
    
    # Check if subject code already exists
    existing = conn.execute("SELECT id FROM subjects WHERE code = ?", [req.code]).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="Subject code already exists")
    
    # Get next id
    max_id = conn.execute("SELECT COALESCE(MAX(id), 0) FROM subjects").fetchone()[0]
    new_id = max_id + 1
    
    # Default schedule text (can be updated with time options)
    schedule = f"{req.semester} term"
    
    conn.execute("""
        INSERT INTO subjects (id, code, name, credits, semester, enrolled, students, lecturer, schedule, description, year)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, [new_id, req.code, req.name, req.credits, req.semester, False, 0, req.lecturer, schedule, req.description, req.year])
    
    conn.close()
    
    return {"message": "Subject created successfully", "id": new_id, "code": req.code}

@app.post("/api/teacher/subject/time-option/create", tags=["teacher"])
def create_time_option(
    req: CreateTimeOptionRequest,
    authorization: Optional[str] = Header(None)
):
    """Create a new time option for a subject (teacher only)"""
    token = authorization.replace("Bearer ", "") if authorization else None
    teacher = verify_token(token)
    
    if not teacher:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    if teacher.get('role') != 'teacher':
        raise HTTPException(status_code=403, detail="Teacher access required")
    
    conn = get_connection()
    
    # Check if subject exists
    subject = conn.execute("SELECT id FROM subjects WHERE code = ?", [req.subject_code]).fetchone()
    if not subject:
        conn.close()
        raise HTTPException(status_code=404, detail="Subject not found")
    
    # Get next id
    max_id = conn.execute("SELECT COALESCE(MAX(id), 0) FROM subject_time_options").fetchone()[0]
    new_id = max_id + 1
    
    conn.execute("""
        INSERT INTO subject_time_options (id, subject_code, option_name, day, time, room, type, lecturer, capacity, enrolled)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, [new_id, req.subject_code, req.option_name, req.day, req.time, req.room, req.type, req.lecturer, req.capacity, 0])
    
    conn.close()
    
    return {"message": "Time option created successfully", "id": new_id}

@app.put("/api/teacher/subject/{subject_id}", tags=["teacher"])
def update_subject(
    subject_id: int,
    req: CreateSubjectRequest,
    authorization: Optional[str] = Header(None)
):
    """Update an existing subject (teacher only)"""
    token = authorization.replace("Bearer ", "") if authorization else None
    teacher = verify_token(token)
    
    if not teacher:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    if teacher.get('role') != 'teacher':
        raise HTTPException(status_code=403, detail="Teacher access required")
    
    conn = get_connection()
    
    # Check if subject exists
    existing = conn.execute("SELECT id FROM subjects WHERE id = ?", [subject_id]).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Subject not found")
    
    schedule = f"{req.semester} term"
    
    conn.execute("""
        UPDATE subjects 
        SET code = ?, name = ?, credits = ?, semester = ?, lecturer = ?, 
            schedule = ?, description = ?, year = ?
        WHERE id = ?
    """, [req.code, req.name, req.credits, req.semester, req.lecturer, schedule, req.description, req.year, subject_id])
    
    conn.close()
    
    return {"message": "Subject updated successfully"}

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
    
    # If time options provided, save schedule selections
    if req.time_option_ids:
        for option_id in req.time_option_ids:
            # Get next ID for schedule selection
            next_sel_id = conn.execute("SELECT COALESCE(MAX(id), 0) + 1 FROM student_schedule_selections").fetchone()[0]
            
            conn.execute("""
                INSERT INTO student_schedule_selections (id, student_id, subject_code, time_option_id)
                VALUES (?, ?, ?, ?)
            """, [next_sel_id, student_id, req.subject_code, option_id])
    
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
    student = verify_token(token)
    
    if not student:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    student_id = student['id']
    
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
    applied_date = datetime.now().isoformat()
    
    # Generate room number
    import random
    floor = random.randint(1, 5)
    room_num = f"{chr(65 + random.randint(0, 3))}-{random.randint(100, 599)}"
    
    # Calculate deposit (usually double the rent)
    rent_value = dorm[1].replace("€", "").replace("/month", "").strip()
    try:
        deposit_value = int(rent_value) * 2
        deposit = f"€{deposit_value}"
    except:
        deposit = dorm[1].replace("/month", "")
    
    conn.execute("""
        INSERT INTO dormitory_applications 
        (id, student_id, dormitory_id, dormitory, room, room_type, floor, status, move_in_date, rent, deposit, applied_date, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?, 'Application submitted. Awaiting approval.')
    """, [new_id, student_id, req.dormitory_id, dorm[0], room_num, req.room_type, floor, move_in, dorm[1], deposit, applied_date])
    
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
