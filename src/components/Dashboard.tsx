import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Calendar, BookOpen, TrendingUp, Clock, Newspaper, Pin } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

// ---- Types ----
type Exam = { subject: string; date: string; time: string };
type Subject = { name: string; code: string; credits: number };
type ScheduleItem = { day: string; time: string; subject: string; room: string };
type NotificationItem = { type: "grade" | "enrolment" | "info" | string; message: string; time: string };
type NewsItem = { id: number; title: string; description: string; date: string; category: string; pinned?: boolean };

const API_BASE = "http://127.0.0.1:8000"; // adjust if your backend runs elsewhere

// ---- Local fallbacks (used if API isn't ready) ----
const FALLBACK_EXAMS: Exam[] = [
  { subject: "Data Structures", date: "Oct 12, 2025", time: "09:00" },
  { subject: "Web Technologies", date: "Oct 15, 2025", time: "13:00" },
  { subject: "Database Systems", date: "Oct 18, 2025", time: "10:30" },
];

const FALLBACK_SUBJECTS: Subject[] = [
  { name: "Data Structures", code: "ZADS", credits: 6 },
  { name: "Web Technologies", code: "WEBTECH", credits: 5 },
  { name: "Database Systems", code: "DBS", credits: 6 },
  { name: "Software Engineering", code: "SE", credits: 6 },
];

const FALLBACK_SCHEDULE: ScheduleItem[] = [
  { day: "Monday", time: "08:00-09:40", subject: "Data Structures", room: "PK6 C303" },
  { day: "Monday", time: "10:00-11:40", subject: "Web Technologies", room: "PK6 C409" },
  { day: "Tuesday", time: "13:00-14:40", subject: "Database Systems", room: "PK6 C208" },
  { day: "Wednesday", time: "08:00-09:40", subject: "Software Engineering", room: "PK6 C303" },
  { day: "Thursday", time: "10:00-11:40", subject: "Web Technologies", room: "PK6 C409" },
];

const FALLBACK_NOTIFICATIONS: NotificationItem[] = [
  { type: "grade", message: "New grade added: Data Structures - A", time: "2 hours ago" },
  { type: "enrolment", message: "Subject enrolment confirmed: Web Technologies", time: "1 day ago" },
  { type: "info", message: "Schedule change: Database Systems moved to PK6 C208", time: "2 days ago" },
];

const FALLBACK_NEWS: NewsItem[] = [
  {
    id: 1,
    title: "Winter Exam Period Schedule Released",
    description: "The official exam schedule for Winter Semester 2025/26 is now available in the Grades section.",
    date: "October 20, 2025",
    category: "Academic",
    pinned: true,
  },
  {
    id: 2,
    title: "Student Career Fair 2025",
    description: "Meet top tech companies and explore internship opportunities. November 15-16 in Main Hall.",
    date: "October 18, 2025",
    category: "Events",
    pinned: false,
  },
  {
    id: 3,
    title: "Library Extended Hours During Exam Period",
    description: "The university library will be open 24/7 from December 1st to support students during exams.",
    date: "October 17, 2025",
    category: "Services",
    pinned: false,
  },
  {
    id: 4,
    title: "New AI Research Lab Opening",
    description: "State-of-the-art AI research facility opens next month. Applications for student assistants now open.",
    date: "October 15, 2025",
    category: "Research",
    pinned: false,
  },
];

function getCategoryColor(category: string) {
  switch (category) {
    case "Academic":
      return "bg-blue-600";
    case "Events":
      return "bg-purple-600";
    case "Services":
      return "bg-green-600";
    case "Research":
      return "bg-orange-600";
    default:
      return "bg-gray-600";
  }
}

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [upcomingExams, setUpcomingExams] = useState<Exam[]>(FALLBACK_EXAMS);
  const [activeSubjects, setActiveSubjects] = useState<Subject[]>(FALLBACK_SUBJECTS);
  const [weekSchedule, setWeekSchedule] = useState<ScheduleItem[]>(FALLBACK_SCHEDULE);
  const [notifications, setNotifications] = useState<NotificationItem[]>(FALLBACK_NOTIFICATIONS);
  const [newsItems, setNewsItems] = useState<NewsItem[]>(FALLBACK_NEWS);

  const abortRef = useRef<AbortController | null>(null);

  const fetchAll = () => {
    setLoading(true);
    setError(null);

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    const safeFetch = async <T,>(path: string, fallback: T): Promise<T> => {
      try {
        const res = await fetch(`${API_BASE}${path}`, { signal: ac.signal });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const data = await res.json();
        return data as T;
      } catch (e) {
        return fallback;
      }
    };

    Promise.all([
      safeFetch<Exam[]>("/api/dashboard/exams", FALLBACK_EXAMS),
      safeFetch<Subject[]>("/api/dashboard/subjects", FALLBACK_SUBJECTS),
      safeFetch<ScheduleItem[]>("/api/dashboard/schedule", FALLBACK_SCHEDULE),
      safeFetch<NotificationItem[]>("/api/dashboard/notifications", FALLBACK_NOTIFICATIONS),
      safeFetch<NewsItem[]>("/api/dashboard/news", FALLBACK_NEWS),
    ])
      .then(([exams, subjects, schedule, notifs, news]) => {
        setUpcomingExams(exams);
        setActiveSubjects(subjects);
        setWeekSchedule(schedule);
        setNotifications(notifs);
        // sort: pinned first, then by date desc if dates look comparable
        const sorted = [...news].sort((a, b) => {
          if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
          const da = Date.parse(a.date);
          const db = Date.parse(b.date);
          if (!Number.isNaN(da) && !Number.isNaN(db)) return db - da;
          return a.id - b.id;
        });
        setNewsItems(sorted);
      })
      .catch((e) => setError((e as Error).message || "Failed to load dashboard"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const examsCount = useMemo(() => upcomingExams.length, [upcomingExams]);

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="rounded-xl bg-gradient-to-r from-primary to-primary/80 p-8 text-primary-foreground shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl mb-2" style={{ fontFamily: "'Brush Script MT', 'Lucida Handwriting', cursive" }}>
              Welcome, Yulian!
            </h1>
            <p className="opacity-90">Winter Term 2025/26 • Week 8 of 13</p>
          </div>
          <button
            onClick={fetchAll}
            className="rounded-xl border bg-white/10 px-4 py-2 text-sm shadow hover:bg-white/20"
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm">
          Failed to load latest data: {error}
        </div>
      )}

      {/* Info Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Upcoming Exams</CardTitle>
            <Calendar className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl mb-4">{examsCount}</div>
            <div className="space-y-2">
              {(loading ? FALLBACK_EXAMS : upcomingExams).slice(0, 2).map((exam, idx) => (
                <div key={idx} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{exam.subject}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {exam.date} at {exam.time}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Active Subjects</CardTitle>
            <BookOpen className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl mb-4">{activeSubjects.length}</div>
            <div className="space-y-2">
              {(loading ? FALLBACK_SUBJECTS : activeSubjects).slice(0, 2).map((subject, idx) => (
                <div key={idx} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{subject.code}</span>
                    <Badge variant="secondary">{subject.credits} ECTS</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Academic Progress</CardTitle>
            <TrendingUp className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl mb-1">3.45</div>
            <p className="text-xs text-muted-foreground mb-4">Current GPA</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Credits Earned</span>
                <span>142 / 180</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div className="h-2 rounded-full bg-accent transition-all" style={{ width: "79%" }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* News/Aktuality Section */}
      <Card className="shadow-md border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-primary" />
            <CardTitle>Aktuality / News</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(loading ? FALLBACK_NEWS : newsItems).map((news) => (
              <div key={news.id} className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors border-l-4 border-primary/50">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {news.pinned && <Pin className="h-4 w-4 text-primary fill-primary" />}
                      <h3 className="font-medium">{news.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{news.description}</p>
                    <div className="flex items-center gap-3">
                      <Badge className={getCategoryColor(news.category)}>{news.category}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {news.date}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Schedule and Notifications */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-md border-0 lg:col-span-2">
          <CardHeader>
            <CardTitle>This Week's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(loading ? FALLBACK_SCHEDULE : weekSchedule).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg bg-muted/50 p-3 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="min-w-[80px]">
                      <div className="text-sm">{item.day}</div>
                      <div className="text-xs text-muted-foreground">{item.time}</div>
                    </div>
                    <div>
                      <div className="text-sm">{item.subject}</div>
                      <div className="text-xs text-muted-foreground">{item.room}</div>
                    </div>
                  </div>
                  <Badge variant="outline">{item.time.split("-")[0]}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-0">
          <CardHeader>
            <CardTitle>Recent Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(loading ? FALLBACK_NOTIFICATIONS : notifications).map((notif, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-start gap-2">
                    <div className="mt-1 h-2 w-2 rounded-full bg-accent flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm">{notif.message}</p>
                      <p className="text-xs text-muted-foreground">{notif.time}</p>
                    </div>
                  </div>
                  {idx < notifications.length - 1 && <div className="ml-1 h-4 w-px bg-border" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
