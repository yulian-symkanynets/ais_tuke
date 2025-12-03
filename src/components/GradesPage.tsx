import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { TrendingUp, Award, Plus, Trash2, Edit } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

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

interface Subject {
  id: number;
  code: string;
  name: string;
  teacher_id: number;
}

interface Student {
  id: number;
  email: string;
  full_name: string;
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
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentSemester] = useState<string>("Winter 2025/26");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  
  const [newGrade, setNewGrade] = useState({
    student_id: "",
    subject_id: "",
    grade: "A",
    semester: "Winter 2025/26",
    notes: "",
  });

  const isTeacher = user?.role === "teacher" || user?.role === "admin";

  useEffect(() => {
    fetchGrades();
    if (isTeacher) {
      fetchSubjects();
    }
  }, [isTeacher]);

  useEffect(() => {
    if (selectedSubject && isTeacher) {
      fetchStudentsForSubject(selectedSubject);
    }
  }, [selectedSubject, isTeacher]);

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

  const fetchSubjects = async () => {
    try {
      const data = await api.get<Subject[]>("/api/subjects/");
      // Filter to only show subjects the teacher owns
      const mySubjects = data.filter(s => s.teacher_id === user?.id || user?.role === "admin");
      setSubjects(mySubjects);
    } catch (e) {
      console.error("Failed to fetch subjects:", e);
    }
  };

  const fetchStudentsForSubject = async (subjectId: number) => {
    try {
      const data = await api.get<Student[]>(`/api/grades/subject/${subjectId}/students`);
      setStudents(data || []);
    } catch (e) {
      console.error("Failed to fetch students:", e);
      setStudents([]);
    }
  };

  const handleCreateGrade = async () => {
    setError(null);
    setSuccess(null);

    if (!newGrade.student_id || !newGrade.subject_id) {
      setError("Please select a student and subject");
      return;
    }

    setCreating(true);
    try {
      await api.post("/api/grades/", {
        student_id: parseInt(newGrade.student_id),
        subject_id: parseInt(newGrade.subject_id),
        grade: newGrade.grade,
        semester: newGrade.semester,
        notes: newGrade.notes || null,
      });
      
      setIsDialogOpen(false);
      setNewGrade({
        student_id: "",
        subject_id: "",
        grade: "A",
        semester: "Winter 2025/26",
        notes: "",
      });
      setSelectedSubject(null);
      await fetchGrades();
      setSuccess("Grade added successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e.message || "Failed to add grade");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteGrade = async (gradeId: number) => {
    if (!confirm("Are you sure you want to delete this grade?")) return;

    try {
      await api.delete(`/api/grades/${gradeId}`);
      await fetchGrades();
      setSuccess("Grade deleted successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e.message || "Failed to delete grade");
    }
  };

  const overallGPA = weightedGPA(grades);
  const currentSemesterGrades = grades.filter((g) => g.semester === currentSemester);
  const currentGPA = weightedGPA(currentSemesterGrades);
  const totalCredits = grades.length * 6;

  const getGradeBadgeVariant = (grade: string): "default" | "secondary" | "outline" => {
    if (grade === "A") return "default";
    if (grade === "B") return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Grades</h1>
          <p className="text-muted-foreground">
            {isTeacher ? "View and manage student grades" : "View your academic performance and grades"}
          </p>
        </div>
        {isTeacher && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Grade
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Grade</DialogTitle>
                <DialogDescription>
                  Assign a grade to a student for one of your subjects
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {error && (
                  <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={newGrade.subject_id}
                    onChange={(e) => {
                      setNewGrade({ ...newGrade, subject_id: e.target.value, student_id: "" });
                      setSelectedSubject(e.target.value ? parseInt(e.target.value) : null);
                    }}
                  >
                    <option value="">Select a subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Student *</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={newGrade.student_id}
                    onChange={(e) => setNewGrade({ ...newGrade, student_id: e.target.value })}
                    disabled={!selectedSubject}
                  >
                    <option value="">Select a student</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name || s.email}
                      </option>
                    ))}
                  </select>
                  {selectedSubject && students.length === 0 && (
                    <p className="text-xs text-muted-foreground">No students enrolled in this subject</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Grade *</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={newGrade.grade}
                    onChange={(e) => setNewGrade({ ...newGrade, grade: e.target.value })}
                  >
                    <option value="A">A (1.0)</option>
                    <option value="B">B (1.5)</option>
                    <option value="C">C (2.0)</option>
                    <option value="D">D (3.0)</option>
                    <option value="E">E (4.0)</option>
                    <option value="FX">FX (5.0 - Failed)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Semester</Label>
                  <Input
                    value={newGrade.semester}
                    onChange={(e) => setNewGrade({ ...newGrade, semester: e.target.value })}
                    placeholder="Winter 2025/26"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Input
                    value={newGrade.notes}
                    onChange={(e) => setNewGrade({ ...newGrade, notes: e.target.value })}
                    placeholder="Additional notes"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateGrade} disabled={creating}>
                  {creating ? "Adding..." : "Add Grade"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {(error || success) && !isDialogOpen && (
        <div className={`rounded-md p-4 ${error ? 'bg-destructive/15 text-destructive' : 'bg-green-500/15 text-green-600'}`}>
          {error || success}
        </div>
      )}

      {!isTeacher && (
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
      )}

      <Card className="shadow-md border-0">
        <CardHeader>
          <CardTitle>{isTeacher ? "All Grades" : "Grade History"}</CardTitle>
        </CardHeader>
        <CardContent>
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
                  {isTeacher && <TableHead className="text-right">Actions</TableHead>}
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
                    <TableCell colSpan={isTeacher ? 7 : 5} className="text-center text-muted-foreground py-8">
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
                      {isTeacher && (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteGrade(grade.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      )}
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
