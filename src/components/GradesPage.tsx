import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { TrendingUp, Award } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

interface Grade {
  id: number;
  student_id: number;
  subject_id: number;
  teacher_id: number;
  grade: string;
  numeric_grade: number;
  semester: string;
  date: string;
  notes?: string;
  subject_name?: string;
  subject_code?: string;
  student_name?: string;
}

function weightedGPA(items: Grade[]): number | null {
  if (!items.length) return null;
  const sum = items.reduce((s, g) => s + g.numeric_grade, 0);
  return +(sum / items.length).toFixed(2);
}

function fmtNumber(n: number | null | undefined) {
  return n == null || Number.isNaN(n) ? "—" : n.toFixed(2);
}

export function GradesPage() {
  const { user } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSemester] = useState<string>("Winter 2025/26");

  const isTeacher = user?.role === "teacher" || user?.role === "admin";

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<Grade[]>("/api/grades/");
      setGrades(data || []);
    } catch (e: any) {
      setError(e.message || "Failed to load grades");
    } finally {
      setLoading(false);
    }
  };

  const overallGPA = weightedGPA(grades);
  const currentSemesterGrades = grades.filter((g) => g.semester === currentSemester);
  const currentGPA = weightedGPA(currentSemesterGrades);
  const totalCredits = grades.length * 6; // Assume 6 credits per subject for display

  const getGradeBadgeVariant = (grade: string): "default" | "secondary" | "outline" => {
    if (grade === "A") return "default";
    if (grade === "B") return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Grades</h1>
        <p className="text-muted-foreground">
          {isTeacher ? "View and manage student grades" : "View your academic performance and grades"}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Overall GPA</CardTitle>
            <TrendingUp className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{fmtNumber(overallGPA)}</div>
            <p className="text-xs text-muted-foreground mt-1">Based on {grades.length} subjects</p>
          </CardContent>
        </Card>

        <Card className="shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Current Semester GPA</CardTitle>
            <Award className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{fmtNumber(currentGPA)}</div>
            <p className="text-xs text-muted-foreground mt-1">{currentSemester}</p>
          </CardContent>
        </Card>

        <Card className="shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Total Credits</CardTitle>
            <Award className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{totalCredits}</div>
            <p className="text-xs text-muted-foreground mt-1">ECTS credits earned</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md border-0">
        <CardHeader>
          <CardTitle>Grade History</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm">
              Failed to load grades: {error}
            </div>
          )}
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead className="text-center">Grade</TableHead>
                  <TableHead>Date</TableHead>
                  {isTeacher && <TableHead>Student</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={`sk-${i}`}>
                      <TableCell><div className="h-4 w-40 animate-pulse rounded bg-muted" /></TableCell>
                      <TableCell><div className="h-6 w-14 animate-pulse rounded bg-muted" /></TableCell>
                      <TableCell><div className="h-4 w-32 animate-pulse rounded bg-muted" /></TableCell>
                      <TableCell><div className="mx-auto h-6 w-12 animate-pulse rounded bg-muted" /></TableCell>
                      <TableCell><div className="h-4 w-28 animate-pulse rounded bg-muted" /></TableCell>
                    </TableRow>
                  ))
                ) : grades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isTeacher ? 6 : 5} className="text-center text-muted-foreground py-8">
                      No grades found
                    </TableCell>
                  </TableRow>
                ) : (
                  grades.map((grade) => (
                    <TableRow key={grade.id}>
                      <TableCell>{grade.subject_name || "Unknown"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{grade.subject_code || "-"}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{grade.semester}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getGradeBadgeVariant(grade.grade)} className="min-w-[40px] justify-center">
                          {grade.grade}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{grade.date}</TableCell>
                      {isTeacher && <TableCell>{grade.student_name || "-"}</TableCell>}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
