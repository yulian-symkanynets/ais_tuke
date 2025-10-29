"""
DuckDB database initialization and management
"""
import duckdb
from pathlib import Path
from typing import Optional
import random
from datetime import datetime, timedelta

# Database path
DB_PATH = Path(__file__).parent / "ais_tuke.db"

def get_connection():
    """Get a database connection"""
    return duckdb.connect(str(DB_PATH))

def init_database():
    """Initialize the database schema and seed data"""
    conn = get_connection()
    
    # Create tables
    conn.execute("""
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY,
            first_name VARCHAR,
            last_name VARCHAR,
            email VARCHAR UNIQUE,
            student_id VARCHAR UNIQUE,
            year INTEGER,
            program VARCHAR,
            gpa DOUBLE,
            password_hash VARCHAR
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY,
            student_id INTEGER,
            token VARCHAR UNIQUE,
            created_at TIMESTAMP,
            expires_at TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES students(id)
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS subjects (
            id INTEGER PRIMARY KEY,
            code VARCHAR,
            name VARCHAR,
            credits INTEGER,
            semester VARCHAR,
            lecturer VARCHAR,
            schedule VARCHAR,
            students INTEGER,
            enrolled BOOLEAN
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS grades (
            id INTEGER PRIMARY KEY,
            student_id INTEGER,
            subject VARCHAR,
            code VARCHAR,
            grade VARCHAR,
            credits INTEGER,
            semester VARCHAR,
            date VARCHAR,
            numeric_grade DOUBLE,
            FOREIGN KEY (student_id) REFERENCES students(id)
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS schedule (
            id INTEGER PRIMARY KEY,
            day VARCHAR,
            time VARCHAR,
            subject VARCHAR,
            code VARCHAR,
            room VARCHAR,
            type VARCHAR
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS enrolment_periods (
            id INTEGER PRIMARY KEY,
            name VARCHAR,
            status VARCHAR,
            start_date VARCHAR,
            end_date VARCHAR
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS enrolled_subjects (
            id INTEGER PRIMARY KEY,
            student_id INTEGER,
            code VARCHAR,
            name VARCHAR,
            credits INTEGER,
            status VARCHAR,
            enrolled_date VARCHAR,
            FOREIGN KEY (student_id) REFERENCES students(id)
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS thesis (
            id INTEGER PRIMARY KEY,
            student_id INTEGER,
            title VARCHAR,
            type VARCHAR,
            status VARCHAR,
            supervisor VARCHAR,
            consultant VARCHAR,
            department VARCHAR,
            start_date VARCHAR,
            submission_deadline VARCHAR,
            defense_date VARCHAR,
            progress INTEGER,
            FOREIGN KEY (student_id) REFERENCES students(id)
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS thesis_milestones (
            id INTEGER PRIMARY KEY,
            thesis_id INTEGER,
            title VARCHAR,
            status VARCHAR,
            date VARCHAR,
            description VARCHAR,
            FOREIGN KEY (thesis_id) REFERENCES thesis(id)
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS thesis_documents (
            id INTEGER PRIMARY KEY,
            thesis_id INTEGER,
            name VARCHAR,
            size VARCHAR,
            uploaded VARCHAR,
            FOREIGN KEY (thesis_id) REFERENCES thesis(id)
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS dormitories (
            id INTEGER PRIMARY KEY,
            name VARCHAR,
            address VARCHAR,
            distance VARCHAR,
            rooms INTEGER,
            rent VARCHAR,
            available BOOLEAN
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS dormitory_amenities (
            id INTEGER PRIMARY KEY,
            dormitory_id INTEGER,
            amenity VARCHAR,
            FOREIGN KEY (dormitory_id) REFERENCES dormitories(id)
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS dormitory_applications (
            id INTEGER PRIMARY KEY,
            student_id INTEGER,
            dormitory VARCHAR,
            room VARCHAR,
            room_type VARCHAR,
            floor INTEGER,
            status VARCHAR,
            move_in_date VARCHAR,
            rent VARCHAR,
            deposit VARCHAR,
            FOREIGN KEY (student_id) REFERENCES students(id)
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY,
            student_id INTEGER,
            type VARCHAR,
            description VARCHAR,
            amount DOUBLE,
            date VARCHAR,
            due_date VARCHAR,
            status VARCHAR,
            method VARCHAR,
            invoice VARCHAR,
            icon VARCHAR,
            FOREIGN KEY (student_id) REFERENCES students(id)
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY,
            student_id INTEGER,
            type VARCHAR,
            message VARCHAR,
            time VARCHAR,
            read BOOLEAN,
            FOREIGN KEY (student_id) REFERENCES students(id)
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS news (
            id INTEGER PRIMARY KEY,
            title VARCHAR,
            description VARCHAR,
            date VARCHAR,
            category VARCHAR,
            pinned BOOLEAN
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS exams (
            id INTEGER PRIMARY KEY,
            subject VARCHAR,
            date VARCHAR,
            time VARCHAR,
            room VARCHAR
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY,
            student_id INTEGER,
            key VARCHAR,
            value VARCHAR,
            FOREIGN KEY (student_id) REFERENCES students(id)
        )
    """)
    
    # Check if data already exists
    result = conn.execute("SELECT COUNT(*) FROM students").fetchone()
    if result[0] == 0:
        seed_data(conn)
    
    conn.close()

def seed_data(conn):
    """Seed initial data"""
    rng = random.Random(42)
    
    # Insert student with hashed password (password: "password123")
    # In production, use proper password hashing like bcrypt
    import hashlib
    password_hash = hashlib.sha256("password123".encode()).hexdigest()
    conn.execute("""
        INSERT INTO students VALUES (1, 'Yulian', 'Symkanynets', 'yulian@student.tuke.sk', 
                                    'ST12345', 3, 'Computer Science', 3.45, ?)
    """, [password_hash])
    
    # Insert subjects
    subjects_data = [
        (1, 'ZADS', 'Data Structures and Algorithms', 6, 'Winter', 'Prof. John Smith', 'Mon, Wed 08:00-09:40', 145, True),
        (2, 'WEBTECH', 'Web Technologies', 5, 'Winter', 'Dr. Anna Johnson', 'Mon, Thu 10:00-11:40', 132, True),
        (3, 'DBS', 'Database Systems', 6, 'Winter', 'Prof. Michael Brown', 'Tue 13:00-14:40', 128, True),
        (4, 'SE', 'Software Engineering', 6, 'Winter', 'Dr. Sarah Wilson', 'Wed 08:00-09:40', 156, True),
        (5, 'AI', 'Artificial Intelligence', 6, 'Winter', 'Prof. David Lee', 'Fri 10:00-11:40', 98, False),
        (6, 'MOBILE', 'Mobile Application Development', 5, 'Winter', 'Dr. Emily Davis', 'Thu 13:00-14:40', 87, False),
    ]
    
    for subj in subjects_data:
        conn.execute("""
            INSERT INTO subjects VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, subj)
    
    # Insert schedule
    schedule_data = [
        (1, 'Monday', '08:00-09:40', 'Data Structures', 'ZADS', 'PK6 C303', 'Lecture'),
        (2, 'Monday', '10:00-11:40', 'Web Technologies', 'WEBTECH', 'PK6 C409', 'Lab'),
        (3, 'Tuesday', '13:00-14:40', 'Database Systems', 'DBS', 'PK6 C208', 'Lecture'),
        (4, 'Wednesday', '08:00-09:40', 'Software Engineering', 'SE', 'PK6 C303', 'Lecture'),
        (5, 'Wednesday', '10:00-11:40', 'Data Structures', 'ZADS', 'PK6 LAB2', 'Lab'),
        (6, 'Thursday', '10:00-11:40', 'Web Technologies', 'WEBTECH', 'PK6 C409', 'Lecture'),
        (7, 'Thursday', '13:00-14:40', 'Database Systems', 'DBS', 'PK6 LAB3', 'Lab'),
        (8, 'Friday', '08:00-09:40', 'Software Engineering', 'SE', 'PK6 LAB1', 'Lab'),
    ]
    
    for sched in schedule_data:
        conn.execute("INSERT INTO schedule VALUES (?, ?, ?, ?, ?, ?, ?)", sched)
    
    # Insert enrolment periods
    enrolment_periods_data = [
        (1, 'Main Enrolment Period', 'closed', 'Sep 1, 2025', 'Sep 15, 2025'),
        (2, 'Late Enrolment', 'active', 'Sep 16, 2025', 'Oct 15, 2025'),
        (3, 'Subject Withdrawal Period', 'upcoming', 'Nov 1, 2025', 'Nov 30, 2025'),
    ]
    
    for period in enrolment_periods_data:
        conn.execute("INSERT INTO enrolment_periods VALUES (?, ?, ?, ?, ?)", period)
    
    # Insert enrolled subjects
    enrolled_data = [
        (1, 1, 'ZADS', 'Data Structures and Algorithms', 6, 'confirmed', 'Sep 14, 2025'),
        (2, 1, 'WEBTECH', 'Web Technologies', 5, 'confirmed', 'Sep 14, 2025'),
        (3, 1, 'DBS', 'Database Systems', 6, 'confirmed', 'Sep 14, 2025'),
        (4, 1, 'SE', 'Software Engineering', 6, 'confirmed', 'Sep 14, 2025'),
    ]
    
    for enr in enrolled_data:
        conn.execute("INSERT INTO enrolled_subjects VALUES (?, ?, ?, ?, ?, ?, ?)", enr)
    
    # Insert thesis
    conn.execute("""
        INSERT INTO thesis VALUES (1, 1, 'Application of Machine Learning in Web Security Analysis',
                                   'Bachelor Thesis', 'In Progress', 'Prof. Dr. Michael Brown',
                                   'Dr. Anna Johnson', 'Department of Computers and Informatics',
                                   'September 1, 2025', 'May 15, 2026', 'June 20, 2026', 45)
    """)
    
    # Insert thesis milestones
    milestones_data = [
        (1, 1, 'Thesis Registration', 'completed', 'September 1, 2025', 'Thesis topic approved and registered'),
        (2, 1, 'Literature Review', 'completed', 'October 15, 2025', 'Research and review of relevant literature'),
        (3, 1, 'Research Methodology', 'in-progress', 'December 20, 2025', 'Define research methods and approach'),
        (4, 1, 'Implementation', 'pending', 'March 15, 2026', 'Develop practical implementation'),
        (5, 1, 'Final Draft Submission', 'pending', 'May 1, 2026', 'Submit complete thesis draft'),
        (6, 1, 'Thesis Defense', 'pending', 'June 20, 2026', 'Oral defense presentation'),
    ]
    
    for milestone in milestones_data:
        conn.execute("INSERT INTO thesis_milestones VALUES (?, ?, ?, ?, ?, ?)", milestone)
    
    # Insert thesis documents
    documents_data = [
        (1, 1, 'Thesis Template.docx', '245 KB', 'Sep 1, 2025'),
        (2, 1, 'Literature Review.pdf', '1.2 MB', 'Oct 15, 2025'),
        (3, 1, 'Research Proposal.pdf', '890 KB', 'Sep 20, 2025'),
        (4, 1, 'Bibliography.bib', '45 KB', 'Oct 10, 2025'),
    ]
    
    for doc in documents_data:
        conn.execute("INSERT INTO thesis_documents VALUES (?, ?, ?, ?, ?)", doc)
    
    # Insert dormitories
    dormitories_data = [
        (1, 'Jedlíkova Dormitory', 'Jedlíkova 2, 042 00 Košice', '5 min walk', 45, '€120/month', True),
        (2, 'Park Dormitory', 'Park Komenského 1, 042 00 Košice', '8 min walk', 12, '€150/month', True),
        (3, 'Medická Dormitory', 'Medická 2, 040 01 Košice', '12 min walk', 0, '€110/month', False),
        (4, 'VŠ Campus Dormitory', 'Boženy Němcovej 3, 040 01 Košice', '15 min walk', 23, '€135/month', True),
    ]
    
    for dorm in dormitories_data:
        conn.execute("INSERT INTO dormitories VALUES (?, ?, ?, ?, ?, ?, ?)", dorm)
    
    # Insert dormitory amenities
    amenities_data = [
        (1, 1, 'WiFi'), (2, 1, 'Kitchen'), (3, 1, 'Study Room'), (4, 1, 'Laundry'),
        (5, 2, 'WiFi'), (6, 2, 'Kitchen'), (7, 2, 'Gym'), (8, 2, 'Parking'),
        (9, 3, 'WiFi'), (10, 3, 'Kitchen'), (11, 3, 'Study Room'),
        (12, 4, 'WiFi'), (13, 4, 'Kitchen'), (14, 4, 'Cafeteria'), (15, 4, 'Sports Hall'),
    ]
    
    for amenity in amenities_data:
        conn.execute("INSERT INTO dormitory_amenities VALUES (?, ?, ?)", amenity)
    
    # Insert dormitory application
    conn.execute("""
        INSERT INTO dormitory_applications VALUES (1, 1, 'Jedlíkova Dormitory', 'B-312',
                                                   'Double Room', 3, 'Approved',
                                                   'September 15, 2025', '€120/month', '€240')
    """)
    
    # Insert payments
    payments_data = [
        (1, 1, 'Dormitory', 'Monthly rent - December 2025', 120, '', 'December 1, 2025', 'pending', '', '', 'Home'),
        (2, 1, 'Tuition Fee', 'Winter Semester 2025/26', 0, 'November 30, 2025', '', 'paid', 'Bank Transfer', 'INV-2025-0150', 'BookOpen'),
        (3, 1, 'Dormitory', 'Monthly rent - November 2025', 120, 'November 1, 2025', '', 'paid', 'Bank Transfer', 'INV-2025-0145', 'Home'),
        (4, 1, 'Administrative Fee', 'Document issuance', 15, 'October 28, 2025', '', 'paid', 'Credit Card', 'INV-2025-0132', 'FileText'),
        (5, 1, 'Dormitory', 'Monthly rent - October 2025', 120, 'October 1, 2025', '', 'paid', 'Bank Transfer', 'INV-2025-0098', 'Home'),
        (6, 1, 'Dormitory Deposit', 'Security deposit', 240, 'September 1, 2025', '', 'paid', 'Bank Transfer', 'INV-2025-0067', 'Home'),
        (7, 1, 'Tuition Fee', 'Winter Semester 2025/26', 0, 'September 15, 2025', '', 'waived', 'N/A', 'INV-2025-0045', 'BookOpen'),
    ]
    
    for payment in payments_data:
        conn.execute("INSERT INTO payments VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", payment)
    
    # Insert notifications
    notifications_data = [
        (1, 1, 'grade', 'New grade added: Data Structures - A', '2 hours ago', False),
        (2, 1, 'enrolment', 'Subject enrolment confirmed: Web Technologies', '1 day ago', False),
        (3, 1, 'info', 'Schedule change: Database Systems moved to PK6 C208', '2 days ago', False),
        (4, 1, 'grade', 'New grade added: Software Engineering - B', '3 days ago', True),
        (5, 1, 'info', 'Thesis milestone completed: Literature Review', '5 days ago', True),
    ]
    
    for notif in notifications_data:
        conn.execute("INSERT INTO notifications VALUES (?, ?, ?, ?, ?, ?)", notif)
    
    # Insert news
    news_data = [
        (1, 'Winter Exam Period Schedule Released',
         'The official exam schedule for Winter Semester 2025/26 is now available in the Grades section.',
         'October 20, 2025', 'Academic', True),
        (2, 'Student Career Fair 2025',
         'Meet top tech companies and explore internship opportunities. November 15-16 in Main Hall.',
         'October 18, 2025', 'Events', False),
        (3, 'Library Extended Hours During Exam Period',
         'The university library will be open 24/7 from December 1st to support students during exams.',
         'October 17, 2025', 'Services', False),
        (4, 'New AI Research Lab Opening',
         'State-of-the-art AI research facility opens next month. Applications for student assistants now open.',
         'October 15, 2025', 'Research', False),
    ]
    
    for news in news_data:
        conn.execute("INSERT INTO news VALUES (?, ?, ?, ?, ?, ?)", news)
    
    # Insert exams
    exams_data = [
        (1, 'Data Structures', 'Oct 12, 2025', '09:00', 'PK6 C303'),
        (2, 'Web Technologies', 'Oct 15, 2025', '13:00', 'PK6 C409'),
        (3, 'Database Systems', 'Oct 18, 2025', '10:30', 'PK6 C208'),
    ]
    
    for exam in exams_data:
        conn.execute("INSERT INTO exams VALUES (?, ?, ?, ?, ?)", exam)
    
    # Insert grades with random data
    subjects = [
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
    ]
    
    letter_to_numeric = {"A": 1.0, "B": 1.5, "C": 2.0, "D": 3.0, "E": 4.0, "FX": 5.0}
    credits_pool = [3, 4, 5, 6, 7, 8]
    semesters = ["Winter 2024/25", "Summer 2024/25", "Winter 2025/26"]
    
    semester_dates = {
        "Winter 2024/25": (datetime(2025, 1, 15), datetime(2025, 2, 15)),
        "Summer 2024/25": (datetime(2025, 6, 1), datetime(2025, 7, 15)),
        "Winter 2025/26": (datetime(2026, 1, 15), datetime(2026, 2, 15)),
    }
    
    for i in range(12):
        subject, code = subjects[i % len(subjects)]
        semester = rng.choice(semesters)
        start, end = semester_dates[semester]
        delta_days = (end - start).days
        dt = start + timedelta(days=rng.randint(0, max(delta_days, 0)))
        
        letter = rng.choices(
            population=list(letter_to_numeric.keys()),
            weights=[28, 24, 20, 12, 8, 8],
            k=1
        )[0]
        numeric = letter_to_numeric[letter]
        credits = rng.choice(credits_pool)
        
        conn.execute("""
            INSERT INTO grades VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?)
        """, (i + 1, subject, code, letter, credits, semester, dt.strftime("%b %d, %Y"), numeric))

if __name__ == "__main__":
    print("Initializing database...")
    init_database()
    print("Database initialized successfully!")
