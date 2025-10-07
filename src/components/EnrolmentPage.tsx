import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

export function EnrolmentPage() {
  const enrolmentPeriods = [
    {
      name: "Main Enrolment Period",
      status: "closed",
      startDate: "Sep 1, 2025",
      endDate: "Sep 15, 2025",
    },
    {
      name: "Late Enrolment",
      status: "active",
      startDate: "Sep 16, 2025",
      endDate: "Oct 15, 2025",
    },
    {
      name: "Subject Withdrawal Period",
      status: "upcoming",
      startDate: "Nov 1, 2025",
      endDate: "Nov 30, 2025",
    },
  ];

  const enrolledSubjects = [
    {
      code: "ZADS",
      name: "Data Structures and Algorithms",
      credits: 6,
      status: "confirmed",
      enrolledDate: "Sep 14, 2025",
    },
    {
      code: "WEBTECH",
      name: "Web Technologies",
      credits: 5,
      status: "confirmed",
      enrolledDate: "Sep 14, 2025",
    },
    {
      code: "DBS",
      name: "Database Systems",
      credits: 6,
      status: "confirmed",
      enrolledDate: "Sep 14, 2025",
    },
    {
      code: "SE",
      name: "Software Engineering",
      credits: 6,
      status: "confirmed",
      enrolledDate: "Sep 14, 2025",
    },
  ];

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
          You are currently enrolled in <strong>4 subjects</strong> for a total of <strong>23 ECTS credits</strong>.
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