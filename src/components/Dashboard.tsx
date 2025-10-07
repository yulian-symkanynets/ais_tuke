import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Calendar, BookOpen, TrendingUp, Clock } from "lucide-react";

export function Dashboard() {
  const upcomingExams = [
    { subject: "Data Structures", date: "Oct 12, 2025", time: "09:00" },
    { subject: "Web Technologies", date: "Oct 15, 2025", time: "13:00" },
    { subject: "Database Systems", date: "Oct 18, 2025", time: "10:30" },
  ];

  const activeSubjects = [
    { name: "Data Structures", code: "ZADS", credits: 6 },
    { name: "Web Technologies", code: "WEBTECH", credits: 5 },
    { name: "Database Systems", code: "DBS", credits: 6 },
    { name: "Software Engineering", code: "SE", credits: 6 },
  ];

  const weekSchedule = [
    { day: "Monday", time: "08:00-09:40", subject: "Data Structures", room: "PK6 C303" },
    { day: "Monday", time: "10:00-11:40", subject: "Web Technologies", room: "PK6 C409" },
    { day: "Tuesday", time: "13:00-14:40", subject: "Database Systems", room: "PK6 C208" },
    { day: "Wednesday", time: "08:00-09:40", subject: "Software Engineering", room: "PK6 C303" },
    { day: "Thursday", time: "10:00-11:40", subject: "Web Technologies", room: "PK6 C409" },
  ];

  const notifications = [
    { type: "grade", message: "New grade added: Data Structures - A", time: "2 hours ago" },
    { type: "enrolment", message: "Subject enrolment confirmed: Web Technologies", time: "1 day ago" },
    { type: "info", message: "Schedule change: Database Systems moved to PK6 C208", time: "2 days ago" },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="rounded-xl bg-gradient-to-r from-primary to-primary/80 p-8 text-primary-foreground shadow-lg">
        <h1 className="text-3xl mb-2">Welcome, Yulian!</h1>
        <p className="opacity-90">
          Winter Term 2025/26 • Week 8 of 13
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Upcoming Exams</CardTitle>
            <Calendar className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl mb-4">3</div>
            <div className="space-y-2">
              {upcomingExams.slice(0, 2).map((exam, idx) => (
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
            <div className="text-2xl mb-4">4</div>
            <div className="space-y-2">
              {activeSubjects.slice(0, 2).map((subject, idx) => (
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
                <div 
                  className="h-2 rounded-full bg-accent transition-all"
                  style={{ width: "79%" }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule and Notifications */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-md border-0 lg:col-span-2">
          <CardHeader>
            <CardTitle>This Week's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {weekSchedule.map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between rounded-lg bg-muted/50 p-3 hover:bg-muted transition-colors"
                >
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
              {notifications.map((notif, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-start gap-2">
                    <div className="mt-1 h-2 w-2 rounded-full bg-accent flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm">{notif.message}</p>
                      <p className="text-xs text-muted-foreground">{notif.time}</p>
                    </div>
                  </div>
                  {idx < notifications.length - 1 && (
                    <div className="ml-1 h-4 w-px bg-border" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}