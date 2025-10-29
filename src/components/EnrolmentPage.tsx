import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

type EnrolmentPeriod = {
  id: number;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
};

type EnrolledSubject = {
  id: number;
  code: string;
  name: string;
  credits: number;
  status: string;
  enrolledDate: string;
};

export function EnrolmentPage() {
  const [enrolmentPeriods, setEnrolmentPeriods] = useState<EnrolmentPeriod[]>([]);
  const [enrolledSubjects, setEnrolledSubjects] = useState<EnrolledSubject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/enrolment/periods`).then(res => res.json()),
      fetch(`${API_BASE}/api/enrolment/subjects`).then(res => res.json()),
    ])
      .then(([periods, subjects]) => {
        setEnrolmentPeriods(periods);
        setEnrolledSubjects(subjects);
      })
      .catch(err => console.error("Failed to load enrolment data:", err))
      .finally(() => setLoading(false));
  }, []);

  const totalCredits = enrolledSubjects.reduce((sum, s) => sum + s.credits, 0);

  const getStatusIcon = (status: string) => {
    if (status === "active") return <Clock className="h-4 w-4" />;
    if (status === "closed") return <XCircle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  const getStatusColor = (status: string) => {
    if (status === "active") return "bg-green-500 text-white";
    if (status === "closed") return "bg-gray-500 text-white";
    return "bg-blue-500 text-white";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1>Enrolment</h1>
          <p className="text-muted-foreground">Loading enrolment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1>Enrolment</h1>
        <p className="text-muted-foreground">
          Manage your course enrolments and view enrolment periods
        </p>
      </div>

      <Alert className="bg-accent/10 border-accent">
        <CheckCircle2 className="h-4 w-4 text-accent" />
        <AlertDescription>
          You are currently enrolled in <strong>{enrolledSubjects.length} subjects</strong> for a total of <strong>{totalCredits} ECTS credits</strong>.
        </AlertDescription>
      </Alert>

      <Card className="shadow-md border-0">
        <CardHeader>
          <CardTitle>Enrolment Periods</CardTitle>
          <CardDescription>
            Important dates for course enrolment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {enrolmentPeriods.map((period, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border bg-card p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    {getStatusIcon(period.status)}
                  </div>
                  <div>
                    <p>{period.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {period.startDate} - {period.endDate}
                    </p>
                  </div>
                </div>
                <Badge className={getStatusColor(period.status)}>
                  {period.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md border-0">
        <CardHeader>
          <CardTitle>Your Enrolled Subjects</CardTitle>
          <CardDescription>
            Subjects you are currently enrolled in for Winter 2025/26
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {enrolledSubjects.map((subject, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border bg-card p-4"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{subject.code}</Badge>
                      <Badge className="bg-accent text-accent-foreground">
                        {subject.credits} ECTS
                      </Badge>
                    </div>
                    <p>{subject.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Enrolled: {subject.enrolledDate}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Details
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md border-0">
        <CardHeader>
          <CardTitle>Enrolment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Total Subjects</p>
              <p className="text-2xl mt-1">4</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Total Credits</p>
              <p className="text-2xl mt-1">23 ECTS</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className="mt-1 bg-green-500 text-white">
                Complete
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}