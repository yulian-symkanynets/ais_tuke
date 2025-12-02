import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Calendar, BookOpen, TrendingUp, Clock, Newspaper, Pin } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

// ---- Types ----
type Exam = { id: number; subject_code: string; subject_name: string; date: string; time: string; room: string; type: string };
type Subject = { id: number; code: string; name: string; credits: number; teacher_name?: string };
type ScheduleItem = { id: number; day: string; time: string; subject_code: string; subject_name: string; room: string; class_type: string };
type NotificationItem = { id: number; type: string; title: string; message: string; read: boolean; created_at: string };
type NewsItem = { id: number; title: string; summary: string; date: string; category: string };
type DashboardStats = { enrolled_subjects: number; total_credits: number; average_grade: number | null; unread_notifications: number; upcoming_exams: number };

// ---- Local fallbacks (used if API isn't ready) ----
const FALLBACK_EXAMS: Exam[] = [
  { id: 1, subject_code: "ZADS", subject_name: "Data Structures", date: "Oct 12, 2025", time: "09:00", room: "PK6 A101", type: "Final Exam" },
  { id: 2, subject_code: "WEBTECH", subject_name: "Web Technologies", date: "Oct 15, 2025", time: "13:00", room: "PK6 A102", type: "Final Exam" },
];

const FALLBACK_SUBJECTS: Subject[] = [
  { id: 1, code: "ZADS", name: "Data Structures", credits: 6 },
  { id: 2, code: "WEBTECH", name: "Web Technologies", credits: 5 },
];

const FALLBACK_SCHEDULE: ScheduleItem[] = [
  { id: 1, day: "Monday", time: "08:00-09:40", subject_code: "ZADS", subject_name: "Data Structures", room: "PK6 C303", class_type: "Lecture" },
  { id: 2, day: "Tuesday", time: "10:00-11:40", subject_code: "WEBTECH", subject_name: "Web Technologies", room: "PK6 C409", class_type: "Lab" },
];

const FALLBACK_NOTIFICATIONS: NotificationItem[] = [
  { id: 1, type: "grade", title: "New Grade", message: "New grade added: Data Structures - A", read: false, created_at: "2 hours ago" },
  { id: 2, type: "enrolment", title: "Enrollment", message: "Subject enrolment confirmed: Web Technologies", read: true, created_at: "1 day ago" },
];

const FALLBACK_NEWS: NewsItem[] = [
  { id: 1, title: "Winter Exam Period Schedule Released", summary: "The official exam schedule for Winter Semester 2025/26 is now available.", date: "November 15, 2025", category: "Academic" },
  { id: 2, title: "Student Career Fair 2025", summary: "Meet top tech companies and explore internship opportunities.", date: "November 10, 2025", category: "Events" },
];

const FALLBACK_STATS: DashboardStats = {
  enrolled_subjects: 4,
  total_credits: 24,
  average_grade: 1.5,
  unread_notifications: 2,
  upcoming_exams: 3
};

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
    case "Facilities":
      return "bg-teal-600";
    default:
      return "bg-gray-600";
  }
}

export function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<DashboardStats>(FALLBACK_STATS);
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>(FALLBACK_EXAMS);
  const [activeSubjects, setActiveSubjects] = useState<Subject[]>(FALLBACK_SUBJECTS);
  const [weekSchedule, setWeekSchedule] = useState<ScheduleItem[]>(FALLBACK_SCHEDULE);
  const [notifications, setNotifications] = useState<NotificationItem[]>(FALLBACK_NOTIFICATIONS);
  const [newsItems, setNewsItems] = useState<NewsItem[]>(FALLBACK_NEWS);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);

    try {
      const [statsData, examsData, subjectsData, scheduleData, notifsData, newsData] = await Promise.all([
        api.get<DashboardStats>("/api/dashboard/stats").catch(() => FALLBACK_STATS),
        api.get<Exam[]>("/api/dashboard/exams").catch(() => FALLBACK_EXAMS),
        api.get<Subject[]>("/api/dashboard/subjects").catch(() => FALLBACK_SUBJECTS),
        api.get<ScheduleItem[]>("/api/dashboard/schedule").catch(() => FALLBACK_SCHEDULE),
        api.get<NotificationItem[]>("/api/dashboard/notifications").catch(() => FALLBACK_NOTIFICATIONS),
        api.get<NewsItem[]>("/api/dashboard/news").catch(() => FALLBACK_NEWS),
      ]);

      setStats(statsData);
      setUpcomingExams(examsData);
      setActiveSubjects(subjectsData);
      setWeekSchedule(scheduleData);
      setNotifications(notifsData);
      setNewsItems(newsData);
    } catch (e: any) {
      setError(e.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const examsCount = useMemo(() => upcomingExams.length, [upcomingExams]);

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="rounded-xl bg-gradient-to-r from-primary to-primary/80 p-8 text-primary-foreground shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl mb-2">
              Welcome, {user?.full_name || "Student"}!
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
            <div className="text-2xl mb-4">{stats.upcoming_exams}</div>
            <div className="space-y-2">
              {upcomingExams.slice(0, 2).map((exam) => (
                <div key={exam.id} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{exam.subject_name}</span>
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
            <div className="text-2xl mb-4">{stats.enrolled_subjects}</div>
            <div className="space-y-2">
              {activeSubjects.slice(0, 2).map((subject) => (
                <div key={subject.id} className="text-sm">
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
            <div className="text-2xl mb-1">{stats.average_grade?.toFixed(2) || "N/A"}</div>
            <p className="text-xs text-muted-foreground mb-4">Current GPA</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Credits Earned</span>
                <span>{stats.total_credits} / 180</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div 
                  className="h-2 rounded-full bg-accent transition-all" 
                  style={{ width: `${Math.min((stats.total_credits / 180) * 100, 100)}%` }} 
                />
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
            {newsItems.map((news) => (
              <div key={news.id} className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors border-l-4 border-primary/50">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{news.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{news.summary}</p>
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
              {weekSchedule.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No classes scheduled</p>
              ) : (
                weekSchedule.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3 hover:bg-muted transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="min-w-[80px]">
                        <div className="text-sm">{item.day}</div>
                        <div className="text-xs text-muted-foreground">{item.time}</div>
                      </div>
                      <div>
                        <div className="text-sm">{item.subject_name}</div>
                        <div className="text-xs text-muted-foreground">{item.room}</div>
                      </div>
                    </div>
                    <Badge variant="outline">{item.class_type}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-0">
          <CardHeader>
            <CardTitle>Recent Updates</CardTitle>
            {stats.unread_notifications > 0 && (
              <Badge variant="secondary">{stats.unread_notifications} unread</Badge>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No notifications</p>
              ) : (
                notifications.map((notif, idx) => (
                  <div key={notif.id} className="space-y-1">
                    <div className="flex items-start gap-2">
                      <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${notif.read ? 'bg-muted' : 'bg-accent'}`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{notif.title}</p>
                        <p className="text-sm text-muted-foreground">{notif.message}</p>
                        <p className="text-xs text-muted-foreground">{notif.created_at}</p>
                      </div>
                    </div>
                    {idx < notifications.length - 1 && <div className="ml-1 h-4 w-px bg-border" />}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
