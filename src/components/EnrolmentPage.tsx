import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { CheckCircle2, Clock, XCircle, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

interface Enrollment {
  id: number;
  student_id: number;
  subject_id: number;
  status: string;
  enrolled_date?: string;
  semester: string;
  subject_name?: string;
  subject_code?: string;
}

export function EnrolmentPage() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const data = await api.get<Enrollment[]>("/api/enrollments/");
      setEnrollments(data || []);
    } catch (error) {
      console.error("Failed to fetch enrollments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (enrollmentId: number) => {
    if (!confirm("Are you sure you want to withdraw from this subject?")) return;
    
    try {
      await api.delete(`/api/enrollments/${enrollmentId}`);
      await fetchEnrollments();
      alert("Successfully withdrawn from subject");
    } catch (error: any) {
      alert(error.message || "Failed to withdraw");
    }
  };

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

  const confirmedEnrollments = enrollments.filter(e => e.status === "confirmed");
  const totalCredits = confirmedEnrollments.length * 6; // Assume 6 credits per subject

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

  const getEnrollmentStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-600">Confirmed</Badge>;
      case "pending":
        return <Badge className="bg-orange-600">Pending</Badge>;
      case "withdrawn":
        return <Badge variant="secondary">Withdrawn</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1>Enrolment</h1>
          <p className="text-muted-foreground">Loading enrollments...</p>
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
          You are currently enrolled in <strong>{confirmedEnrollments.length} subjects</strong> for a total of <strong>{totalCredits} ECTS credits</strong>.
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
            Subjects you are currently enrolled in
          </CardDescription>
        </CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              You are not enrolled in any subjects yet. Go to Subjects page to enroll.
            </p>
          ) : (
            <div className="space-y-3">
              {enrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between rounded-lg border bg-card p-4"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{enrollment.subject_code || "-"}</Badge>
                        <Badge className="bg-accent text-accent-foreground">
                          6 ECTS
                        </Badge>
                        {getEnrollmentStatusBadge(enrollment.status)}
                      </div>
                      <p>{enrollment.subject_name || "Unknown Subject"}</p>
                      <p className="text-sm text-muted-foreground">
                        {enrollment.semester} • Enrolled: {enrollment.enrolled_date 
                          ? new Date(enrollment.enrolled_date).toLocaleDateString() 
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                  {enrollment.status === "confirmed" && user?.role === "student" && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleWithdraw(enrollment.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Withdraw
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
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
              <p className="text-2xl mt-1">{confirmedEnrollments.length}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Total Credits</p>
              <p className="text-2xl mt-1">{totalCredits} ECTS</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className="mt-1 bg-green-500 text-white">
                {confirmedEnrollments.length > 0 ? "Active" : "No Enrollments"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
