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
            password_hash VARCHAR,
            role VARCHAR DEFAULT 'student'
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
            enrolled BOOLEAN,
            description VARCHAR,
            year INTEGER
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
            supervisor_email VARCHAR,
            consultant VARCHAR,
            department VARCHAR,
            description VARCHAR,
            start_date VARCHAR,
            submission_deadline VARCHAR,
            defense_date VARCHAR,
            progress INTEGER,
            created_by INTEGER,
            is_available BOOLEAN DEFAULT TRUE,
            FOREIGN KEY (student_id) REFERENCES students(id),
            FOREIGN KEY (created_by) REFERENCES students(id)
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
            uploaded_by INTEGER,
            file_url VARCHAR,
            FOREIGN KEY (thesis_id) REFERENCES thesis(id),
            FOREIGN KEY (uploaded_by) REFERENCES students(id)
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
            available BOOLEAN,
            description VARCHAR,
            room_types VARCHAR,
            capacity INTEGER,
            manager_name VARCHAR,
            manager_email VARCHAR,
            manager_phone VARCHAR,
            created_by INTEGER,
            created_at TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES students(id)
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
            dormitory_id INTEGER,
            dormitory VARCHAR,
            room VARCHAR,
            room_type VARCHAR,
            floor INTEGER,
            status VARCHAR,
            move_in_date VARCHAR,
            rent VARCHAR,
            deposit VARCHAR,
            applied_date TIMESTAMP,
            notes VARCHAR,
            FOREIGN KEY (student_id) REFERENCES students(id),
            FOREIGN KEY (dormitory_id) REFERENCES dormitories(id)
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS dormitory_documents (
            id INTEGER PRIMARY KEY,
            application_id INTEGER,
            name VARCHAR,
            type VARCHAR,
            size VARCHAR,
            uploaded VARCHAR,
            uploaded_by INTEGER,
            file_url VARCHAR,
            FOREIGN KEY (application_id) REFERENCES dormitory_applications(id),
            FOREIGN KEY (uploaded_by) REFERENCES students(id)
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
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS subject_time_options (
            id INTEGER PRIMARY KEY,
            subject_code VARCHAR,
            option_name VARCHAR,
            day VARCHAR,
            time VARCHAR,
            room VARCHAR,
            type VARCHAR,
            lecturer VARCHAR,
            capacity INTEGER,
            enrolled INTEGER DEFAULT 0
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS student_schedule_selections (
            id INTEGER PRIMARY KEY,
            student_id INTEGER,
            subject_code VARCHAR,
            time_option_id INTEGER,
            FOREIGN KEY (student_id) REFERENCES students(id),
            FOREIGN KEY (time_option_id) REFERENCES subject_time_options(id)
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
                                    'ST12345', 3, 'Computer Science', 3.45, ?, 'student')
    """, [password_hash])
    
    # Insert teacher/admin account (password: "teacher123")
    teacher_hash = hashlib.sha256("teacher123".encode()).hexdigest()
    conn.execute("""
        INSERT INTO students VALUES (2, 'Prof. John', 'Smith', 'john.smith@tuke.sk', 
                                    'T001', 0, 'Faculty', 0.0, ?, 'teacher')
    """, [teacher_hash])
    
    # Insert subjects
    subjects_data = [
        (1, 'ZADS', 'Data Structures and Algorithms', 6, 'Winter', 'Prof. John Smith', 'Mon, Wed 08:00-09:40', 145, True, 'Learn fundamental data structures like arrays, linked lists, trees, and graphs. Master algorithm design and analysis.', 2),
        (2, 'WEBTECH', 'Web Technologies', 5, 'Winter', 'Dr. Anna Johnson', 'Mon, Thu 10:00-11:40', 132, True, 'Modern web development with HTML5, CSS3, JavaScript, and popular frameworks. Build responsive web applications.', 2),
        (3, 'DBS', 'Database Systems', 6, 'Winter', 'Prof. Michael Brown', 'Tue 13:00-14:40', 128, True, 'Database design, SQL, transactions, and NoSQL databases. Learn to build and optimize database systems.', 2),
        (4, 'SE', 'Software Engineering', 6, 'Winter', 'Dr. Sarah Wilson', 'Wed 08:00-09:40', 156, True, 'Software development methodologies, design patterns, testing, and project management principles.', 3),
        (5, 'AI', 'Artificial Intelligence', 6, 'Winter', 'Prof. David Lee', 'Fri 10:00-11:40', 98, False, 'Introduction to AI concepts, machine learning algorithms, neural networks, and practical applications.', 3),
        (6, 'MOBILE', 'Mobile Application Development', 5, 'Winter', 'Dr. Emily Davis', 'Thu 13:00-14:40', 87, False, 'Develop mobile apps for iOS and Android using modern frameworks like React Native and Flutter.', 3),
        (7, 'COMPNET', 'Computer Networks', 5, 'Winter', 'Dr. Robert Garcia', 'Tue, Thu 10:00-11:40', 112, False, 'Network protocols, TCP/IP, routing, security, and network programming. Hands-on labs with real network equipment.', 2),
        (8, 'OS', 'Operating Systems', 6, 'Winter', 'Prof. Maria Rodriguez', 'Mon, Wed 13:00-14:40', 95, False, 'OS architecture, process management, memory management, file systems, and concurrency.', 2),
        (9, 'PROG1', 'Programming 1', 6, 'Winter', 'Dr. James Wilson', 'Mon, Wed, Fri 08:00-09:40', 180, False, 'Introduction to programming using Python. Learn variables, loops, functions, and basic algorithms.', 1),
        (10, 'MATH1', 'Mathematics 1', 8, 'Winter', 'Prof. Elena Petrova', 'Tue, Thu 08:00-09:40', 165, False, 'Calculus, linear algebra, and discrete mathematics for computer science students.', 1),
    ]
    
    for subj in subjects_data:
        conn.execute("""
            INSERT INTO subjects VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    
    # Insert thesis (id, student_id, title, type, status, supervisor, supervisor_email, consultant, department, description, start_date, submission_deadline, defense_date, progress, created_by, is_available)
    thesis_data = [
        # Assigned thesis (student 1)
        (1, 1, 'Application of Machine Learning in Web Security Analysis', 'Bachelor Thesis', 'In Progress', 
         'Prof. Dr. Michael Brown', 'michael.brown@tuke.sk', 'Dr. Anna Johnson', 'Department of Computers and Informatics',
         'This thesis focuses on applying machine learning algorithms to detect and prevent web security vulnerabilities. The research includes analysis of common attacks such as SQL injection, XSS, and CSRF, and proposes ML-based detection mechanisms.',
         'September 1, 2025', 'May 15, 2026', 'June 20, 2026', 45, 2, False),
        
        # Available theses created by teacher (student_id=2 is teacher)
        (2, None, 'Blockchain Technology in Supply Chain Management', 'Bachelor Thesis', 'Available',
         'Prof. Dr. Michael Brown', 'michael.brown@tuke.sk', None, 'Department of Computers and Informatics',
         'Research and implement blockchain-based solutions for improving transparency and traceability in supply chain management. The work will include a prototype implementation and performance analysis.',
         None, None, None, 0, 2, True),
         
        (3, None, 'Deep Learning for Medical Image Analysis', 'Master Thesis', 'Available',
         'Dr. Anna Johnson', 'anna.johnson@tuke.sk', 'Prof. Dr. Michael Brown', 'Department of Computers and Informatics',
         'Develop deep learning models for automated analysis of medical images (X-rays, MRI, CT scans). Focus on disease detection and classification using convolutional neural networks.',
         None, None, None, 0, 2, True),
         
        (4, None, 'IoT Security: Vulnerabilities and Solutions', 'Bachelor Thesis', 'Available',
         'Dr. Robert Garcia', 'robert.garcia@tuke.sk', None, 'Department of Computers and Informatics',
         'Comprehensive study of security vulnerabilities in IoT devices and networks. Propose and implement security measures to protect IoT ecosystems from common attacks.',
         None, None, None, 0, 2, True),
         
        (5, None, 'Natural Language Processing for Slovak Language', 'Master Thesis', 'Available',
         'Prof. David Lee', 'david.lee@tuke.sk', 'Dr. Emily Davis', 'Department of Computers and Informatics',
         'Develop NLP tools and models specifically for the Slovak language, including sentiment analysis, named entity recognition, and machine translation improvements.',
         None, None, None, 0, 2, True),
         
        (6, None, 'Augmented Reality in Education', 'Bachelor Thesis', 'Available',
         'Dr. Emily Davis', 'emily.davis@tuke.sk', None, 'Department of Computers and Informatics',
         'Design and develop AR applications for educational purposes. Evaluate the effectiveness of AR in improving student engagement and learning outcomes.',
         None, None, None, 0, 2, True),
         
        (7, None, 'Cloud-Native Microservices Architecture', 'Master Thesis', 'Available',
         'Prof. Dr. Michael Brown', 'michael.brown@tuke.sk', 'Dr. Robert Garcia', 'Department of Computers and Informatics',
         'Design and implement a scalable microservices architecture using cloud-native technologies (Kubernetes, Docker, Service Mesh). Include monitoring and CI/CD pipelines.',
         None, None, None, 0, 2, True),
         
        (8, None, 'AI-Powered Chatbot for Customer Service', 'Bachelor Thesis', 'Available',
         'Dr. Anna Johnson', 'anna.johnson@tuke.sk', None, 'Department of Computers and Informatics',
         'Develop an intelligent chatbot using NLP and machine learning for automated customer service. Implement context awareness and continuous learning capabilities.',
         None, None, None, 0, 2, True),
    ]
    
    for thesis in thesis_data:
        conn.execute("""INSERT INTO thesis VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""", thesis)
    
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
    
    # Insert thesis documents (id, thesis_id, name, size, uploaded, uploaded_by, file_url)
    documents_data = [
        (1, 1, 'Thesis Template.docx', '245 KB', 'Sep 1, 2025', 1, '/files/thesis_template.docx'),
        (2, 1, 'Literature Review.pdf', '1.2 MB', 'Oct 15, 2025', 1, '/files/literature_review.pdf'),
        (3, 1, 'Research Proposal.pdf', '890 KB', 'Sep 20, 2025', 1, '/files/research_proposal.pdf'),
        (4, 1, 'Bibliography.bib', '45 KB', 'Oct 10, 2025', 1, '/files/bibliography.bib'),
    ]
    
    for doc in documents_data:
        conn.execute("INSERT INTO thesis_documents VALUES (?, ?, ?, ?, ?, ?, ?)", doc)
    
    # Insert dormitories (id, name, address, distance, rooms, rent, available, description, room_types, capacity, manager_name, manager_email, manager_phone, created_by, created_at)
    dormitories_data = [
        (1, 'Jedlíkova Dormitory', 'Jedlíkova 2, 042 00 Košice', '5 min walk', 45, '€120/month', True,
         'Modern student dormitory located near the main campus. Features renovated rooms with private bathrooms, high-speed WiFi, shared kitchens on each floor, study rooms, and laundry facilities. 24/7 security and reception service.',
         'Single Room,Double Room,Triple Room', 180, 'Martin Novák', 'martin.novak@tuke.sk', '+421 55 602 4123', 2, '2024-01-15 10:00:00'),
        
        (2, 'Park Dormitory', 'Park Komenského 1, 042 00 Košice', '8 min walk', 12, '€150/month', True,
         'Premium dormitory with excellent facilities including a gym, underground parking, and modern common areas. All rooms have private bathrooms and balconies. Perfect for students who value comfort and convenience.',
         'Single Room,Double Room', 48, 'Eva Horváthová', 'eva.horvathova@tuke.sk', '+421 55 602 4156', 2, '2024-02-10 14:30:00'),
        
        (3, 'Medická Dormitory', 'Medická 2, 040 01 Košice', '12 min walk', 0, '€110/month', False,
         'Traditional student dormitory currently undergoing major renovations. Expected to reopen in Spring 2026 with completely renovated rooms, new furniture, and improved facilities. Will offer the most affordable accommodation option.',
         'Double Room,Triple Room', 120, 'Peter Kováč', 'peter.kovac@tuke.sk', '+421 55 602 4189', 2, '2023-11-20 09:15:00'),
        
        (4, 'VŠ Campus Dormitory', 'Boženy Němcovej 3, 040 01 Košice', '15 min walk', 23, '€135/month', True,
         'Large campus dormitory complex with extensive amenities including cafeteria, sports hall, study rooms, and social spaces. Well-connected to public transport. Popular among international students for its vibrant community atmosphere.',
         'Single Room,Double Room,Triple Room', 300, 'Jana Šimková', 'jana.simkova@tuke.sk', '+421 55 602 4201', 2, '2024-03-05 11:45:00'),
    ]
    
    for dorm in dormitories_data:
        conn.execute("INSERT INTO dormitories VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", dorm)
    
    # Insert dormitory amenities
    amenities_data = [
        (1, 1, 'WiFi'), (2, 1, 'Kitchen'), (3, 1, 'Study Room'), (4, 1, 'Laundry'),
        (5, 2, 'WiFi'), (6, 2, 'Kitchen'), (7, 2, 'Gym'), (8, 2, 'Parking'),
        (9, 3, 'WiFi'), (10, 3, 'Kitchen'), (11, 3, 'Study Room'),
        (12, 4, 'WiFi'), (13, 4, 'Kitchen'), (14, 4, 'Cafeteria'), (15, 4, 'Sports Hall'),
    ]
    
    for amenity in amenities_data:
        conn.execute("INSERT INTO dormitory_amenities VALUES (?, ?, ?)", amenity)
    
    # Insert dormitory application (id, student_id, dormitory_id, dormitory, room, room_type, floor, status, move_in_date, rent, deposit, applied_date, notes)
    conn.execute("""
        INSERT INTO dormitory_applications VALUES (1, 1, 1, 'Jedlíkova Dormitory', 'B-312',
                                                   'Double Room', 3, 'Approved',
                                                   'September 15, 2025', '€120/month', '€240',
                                                   '2025-07-10 09:30:00', 'Application approved. Contract signed.')
    """)
    
    # Insert dormitory documents (id, application_id, name, type, size, uploaded, uploaded_by, file_url)
    dormitory_docs = [
        (1, 1, 'Housing Contract.pdf', 'Contract', '156 KB', 'Jul 15, 2025', 1, '/files/dorm_contract.pdf'),
        (2, 1, 'Student ID Copy.pdf', 'ID Document', '89 KB', 'Jul 10, 2025', 1, '/files/student_id.pdf'),
        (3, 1, 'Health Insurance.pdf', 'Insurance', '245 KB', 'Jul 10, 2025', 1, '/files/health_insurance.pdf'),
    ]
    
    for doc in dormitory_docs:
        conn.execute("INSERT INTO dormitory_documents VALUES (?, ?, ?, ?, ?, ?, ?, ?)", doc)
    
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
    
    # Insert subject time options (multiple time slots for each subject)
    time_options_data = [
        # ZADS - Data Structures
        (1, 'ZADS', 'Morning Session', 'Monday', '08:00-09:40', 'PK6 C303', 'Lecture', 'Prof. John Smith', 80, 45),
        (2, 'ZADS', 'Morning Session Lab', 'Wednesday', '08:00-09:40', 'PK6 LAB2', 'Lab', 'Prof. John Smith', 40, 45),
        (3, 'ZADS', 'Afternoon Session', 'Tuesday', '14:00-15:40', 'PK6 C208', 'Lecture', 'Dr. Anna Johnson', 80, 65),
        (4, 'ZADS', 'Afternoon Session Lab', 'Thursday', '14:00-15:40', 'PK6 LAB3', 'Lab', 'Dr. Anna Johnson', 40, 65),
        
        # WEBTECH - Web Technologies
        (5, 'WEBTECH', 'Morning Lecture', 'Monday', '10:00-11:40', 'PK6 C409', 'Lecture', 'Dr. Anna Johnson', 70, 52),
        (6, 'WEBTECH', 'Morning Lab', 'Thursday', '10:00-11:40', 'PK6 LAB1', 'Lab', 'Dr. Anna Johnson', 35, 52),
        (7, 'WEBTECH', 'Evening Lecture', 'Wednesday', '16:00-17:40', 'PK6 C303', 'Lecture', 'Dr. Maria Rodriguez', 70, 80),
        (8, 'WEBTECH', 'Evening Lab', 'Friday', '16:00-17:40', 'PK6 LAB2', 'Lab', 'Dr. Maria Rodriguez', 35, 80),
        
        # DBS - Database Systems
        (9, 'DBS', 'Tuesday Morning', 'Tuesday', '08:00-09:40', 'PK6 C303', 'Lecture', 'Prof. Michael Brown', 75, 68),
        (10, 'DBS', 'Tuesday Morning Lab', 'Thursday', '08:00-09:40', 'PK6 LAB3', 'Lab', 'Prof. Michael Brown', 38, 68),
        (11, 'DBS', 'Wednesday Afternoon', 'Wednesday', '13:00-14:40', 'PK6 C208', 'Lecture', 'Dr. James Wilson', 75, 60),
        (12, 'DBS', 'Wednesday Afternoon Lab', 'Friday', '13:00-14:40', 'PK6 LAB1', 'Lab', 'Dr. James Wilson', 38, 60),
        
        # SE - Software Engineering
        (13, 'SE', 'Wednesday Morning', 'Wednesday', '08:00-09:40', 'PK6 C303', 'Lecture', 'Dr. Sarah Wilson', 85, 76),
        (14, 'SE', 'Friday Morning Lab', 'Friday', '08:00-09:40', 'PK6 LAB1', 'Lab', 'Dr. Sarah Wilson', 42, 76),
        (15, 'SE', 'Thursday Afternoon', 'Thursday', '13:00-14:40', 'PK6 C409', 'Lecture', 'Dr. Robert Garcia', 85, 80),
        (16, 'SE', 'Monday Afternoon Lab', 'Monday', '13:00-14:40', 'PK6 LAB2', 'Lab', 'Dr. Robert Garcia', 42, 80),
        
        # AI - Artificial Intelligence
        (17, 'AI', 'Friday Morning', 'Friday', '10:00-11:40', 'PK6 C208', 'Lecture', 'Prof. David Lee', 60, 48),
        (18, 'AI', 'Tuesday Afternoon', 'Tuesday', '15:00-16:40', 'PK6 LAB3', 'Lab', 'Prof. David Lee', 30, 48),
        (19, 'AI', 'Monday Evening', 'Monday', '16:00-17:40', 'PK6 C409', 'Lecture', 'Dr. Emily Davis', 60, 50),
        (20, 'AI', 'Wednesday Evening Lab', 'Wednesday', '16:00-17:40', 'PK6 LAB1', 'Lab', 'Dr. Emily Davis', 30, 50),
        
        # COMPNET - Computer Networks
        (21, 'COMPNET', 'Morning Option', 'Tuesday', '10:00-11:40', 'PK6 C303', 'Lecture', 'Dr. Robert Garcia', 65, 52),
        (22, 'COMPNET', 'Morning Lab', 'Thursday', '10:00-11:40', 'PK6 LAB2', 'Lab', 'Dr. Robert Garcia', 32, 52),
        (23, 'COMPNET', 'Afternoon Option', 'Monday', '14:00-15:40', 'PK6 C208', 'Lecture', 'Dr. Maria Rodriguez', 65, 60),
        (24, 'COMPNET', 'Afternoon Lab', 'Wednesday', '14:00-15:40', 'PK6 LAB3', 'Lab', 'Dr. Maria Rodriguez', 32, 60),
    ]
    
    for option in time_options_data:
        conn.execute("INSERT INTO subject_time_options VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", option)
    
    # Insert default schedule selections for enrolled subjects
    # Student 1 is enrolled in ZADS, WEBTECH, DBS, SE - let's give them default selections
    default_selections = [
        (1, 1, 'ZADS', 1),  # Morning Session Lecture
        (2, 1, 'ZADS', 2),  # Morning Session Lab
        (3, 1, 'WEBTECH', 5),  # Morning Lecture
        (4, 1, 'WEBTECH', 6),  # Morning Lab
        (5, 1, 'DBS', 11),  # Wednesday Afternoon Lecture
        (6, 1, 'DBS', 12),  # Wednesday Afternoon Lab
        (7, 1, 'SE', 13),  # Wednesday Morning Lecture
        (8, 1, 'SE', 14),  # Friday Morning Lab
    ]
    
    for selection in default_selections:
        conn.execute("INSERT INTO student_schedule_selections VALUES (?, ?, ?, ?)", selection)
    
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
