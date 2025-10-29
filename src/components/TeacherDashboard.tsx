import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useState } from "react";
import { GraduationCap, Calendar, Award } from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

export function TeacherDashboard() {
  const [examForm, setExamForm] = useState({
    subject: "",
    date: "",
    time: "",
    room: "",
  });

  const [gradeForm, setGradeForm] = useState({
    studentId: "",
    subject: "",
    code: "",
    grade: "",
    credits: "",
    semester: "Winter 2025/26",
  });

  const [creating, setCreating] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const token = localStorage.getItem("authToken");

    try {
      const response = await fetch(`${API_BASE}/api/teacher/exam/create?subject=${encodeURIComponent(examForm.subject)}&date=${encodeURIComponent(examForm.date)}&time=${encodeURIComponent(examForm.time)}&room=${encodeURIComponent(examForm.room)}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert("Exam created successfully!");
        setExamForm({ subject: "", date: "", time: "", room: "" });
      } else {
        const error = await response.json();
        alert(error.detail || "Failed to create exam");
      }
    } catch (error) {
      console.error("Create exam error:", error);
      alert("Failed to create exam");
    } finally {
      setCreating(false);
    }
  };

  const handleAssignGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssigning(true);
    const token = localStorage.getItem("authToken");

    try {
      const response = await fetch(`${API_BASE}/api/teacher/grade/assign?student_id=${gradeForm.studentId}&subject=${encodeURIComponent(gradeForm.subject)}&code=${gradeForm.code}&grade=${gradeForm.grade}&credits=${gradeForm.credits}&semester=${encodeURIComponent(gradeForm.semester)}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert("Grade assigned successfully!");
        setGradeForm({
          studentId: "",
          subject: "",
          code: "",
          grade: "",
          credits: "",
          semester: "Winter 2025/26",
        });
      } else {
        const error = await response.json();
        alert(error.detail || "Failed to assign grade");
      }
    } catch (error) {
      console.error("Assign grade error:", error);
      alert("Failed to assign grade");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Teacher Dashboard</h1>
        <p className="text-muted-foreground">
          Manage exams and student grades
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-md border-0">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Create Exam</CardTitle>
                <CardDescription>Schedule a new exam</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateExam} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="examSubject">Subject</Label>
                <Input
                  id="examSubject"
                  placeholder="e.g., Data Structures"
                  value={examForm.subject}
                  onChange={(e) => setExamForm({ ...examForm, subject: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="examDate">Date</Label>
                <Input
                  id="examDate"
                  type="date"
                  value={examForm.date}
                  onChange={(e) => setExamForm({ ...examForm, date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="examTime">Time</Label>
                <Input
                  id="examTime"
                  placeholder="e.g., 09:00-11:00"
                  value={examForm.time}
                  onChange={(e) => setExamForm({ ...examForm, time: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="examRoom">Room</Label>
                <Input
                  id="examRoom"
                  placeholder="e.g., PK6 C303"
                  value={examForm.room}
                  onChange={(e) => setExamForm({ ...examForm, room: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? "Creating..." : "Create Exam"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-md border-0">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Assign Grade</CardTitle>
                <CardDescription>Add grade for a student</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAssignGrade} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="studentId">Student ID</Label>
                <Input
                  id="studentId"
                  type="number"
                  placeholder="e.g., 1"
                  value={gradeForm.studentId}
                  onChange={(e) => setGradeForm({ ...gradeForm, studentId: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gradeSubject">Subject</Label>
                <Input
                  id="gradeSubject"
                  placeholder="e.g., Data Structures"
                  value={gradeForm.subject}
                  onChange={(e) => setGradeForm({ ...gradeForm, subject: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gradeCode">Code</Label>
                <Input
                  id="gradeCode"
                  placeholder="e.g., ZADS"
                  value={gradeForm.code}
                  onChange={(e) => setGradeForm({ ...gradeForm, code: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grade">Grade</Label>
                  <select
                    id="grade"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={gradeForm.grade}
                    onChange={(e) => setGradeForm({ ...gradeForm, grade: e.target.value })}
                    required
                  >
                    <option value="">Select grade</option>
                    <option value="A">A (1.0)</option>
                    <option value="B">B (1.5)</option>
                    <option value="C">C (2.0)</option>
                    <option value="D">D (3.0)</option>
                    <option value="E">E (4.0)</option>
                    <option value="FX">FX (Failed)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="credits">Credits</Label>
                  <Input
                    id="credits"
                    type="number"
                    placeholder="e.g., 6"
                    value={gradeForm.credits}
                    onChange={(e) => setGradeForm({ ...gradeForm, credits: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <select
                  id="semester"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={gradeForm.semester}
                  onChange={(e) => setGradeForm({ ...gradeForm, semester: e.target.value })}
                  required
                >
                  <option value="Winter 2025/26">Winter 2025/26</option>
                  <option value="Summer 2024/25">Summer 2024/25</option>
                  <option value="Winter 2024/25">Winter 2024/25</option>
                </select>
              </div>

              <Button type="submit" className="w-full" disabled={assigning}>
                {assigning ? "Assigning..." : "Assign Grade"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md border-0">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Teacher Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm"><strong>Role:</strong> Teacher/Administrator</p>
            <p className="text-sm"><strong>Permissions:</strong> Create Exams, Assign Grades, View All Students</p>
            <p className="text-sm text-muted-foreground">You can manage exams and grades for all subjects.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
