import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Search, BookOpen, Users, Plus, Trash2 } from "lucide-react";
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
import { Label } from "./ui/label";

interface Subject {
  id: number;
  code: string;
  name: string;
  credits: number;
  semester: string;
  description?: string;
  teacher_id: number;
  teacher_name?: string;
  enrolled_count?: number;
}

interface Enrollment {
  id: number;
  subject_id: number;
  status: string;
}

export function SubjectsPage() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSubject, setNewSubject] = useState({
    code: "",
    name: "",
    credits: 6,
    semester: "Winter",
    description: "",
  });
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const isTeacher = user?.role === "teacher" || user?.role === "admin";

  useEffect(() => {
    fetchSubjects();
    if (user?.role === "student") {
      fetchEnrollments();
    }
  }, [user]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError("");
      console.log("Fetching subjects...");
      const data = await api.get<Subject[]>("/api/subjects/");
      console.log("Subjects fetched:", data);
      setSubjects(data || []);
    } catch (error: any) {
      console.error("Failed to fetch subjects:", error);
      setError(`Failed to load subjects: ${error.message}`);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    try {
      const data = await api.get<Enrollment[]>("/api/enrollments/");
      setEnrollments(data || []);
    } catch (error: any) {
      console.error("Failed to fetch enrollments:", error);
    }
  };

  const handleEnroll = async (subjectId: number) => {
    try {
      setError("");
      console.log("Enrolling in subject:", subjectId);
      await api.post("/api/enrollments/", {
        subject_id: subjectId,
        semester: "Winter 2025/26",
      });
      await fetchEnrollments();
      await fetchSubjects();
      setSuccess("Enrollment request submitted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      console.error("Error enrolling:", error);
      setError(error.message || "Failed to enroll. You may already be enrolled.");
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleCreateSubject = async () => {
    // Clear previous messages
    setError("");
    setSuccess("");

    // Validate form
    if (!newSubject.code.trim()) {
      setError("Please enter a subject code");
      return;
    }
    if (!newSubject.name.trim()) {
      setError("Please enter a subject name");
      return;
    }

    setCreating(true);
    try {
      // Send only the required fields - backend will use current user as teacher
      const payload = {
        code: newSubject.code.trim().toUpperCase(),
        name: newSubject.name.trim(),
        credits: newSubject.credits,
        semester: newSubject.semester,
        description: newSubject.description?.trim() || null,
      };
      
      console.log("Creating subject with payload:", payload);
      const response = await api.post("/api/subjects/", payload);
      console.log("Subject created:", response);
      
      setIsDialogOpen(false);
      setNewSubject({ code: "", name: "", credits: 6, semester: "Winter", description: "" });
      await fetchSubjects();
      setSuccess("Subject created successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      console.error("Error creating subject:", error);
      setError(error.message || "Failed to create subject");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSubject = async (subjectId: number) => {
    if (!confirm("Are you sure you want to delete this subject? This will also delete all enrollments, schedules, and grades for this subject.")) {
      return;
    }
    
    try {
      setError("");
      setSuccess("");
      console.log("Deleting subject:", subjectId);
      await api.delete(`/api/subjects/${subjectId}`);
      console.log("Subject deleted successfully");
      await fetchSubjects();
      setSuccess("Subject deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      console.error("Error deleting subject:", error);
      setError(error.message || "Failed to delete subject. You may only delete subjects you created.");
      setTimeout(() => setError(""), 5000);
    }
  };

  const isEnrolled = (subjectId: number) => {
    return enrollments.some(
      (e) => e.subject_id === subjectId && e.status === "confirmed"
    );
  };

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1>Subjects</h1>
          <p className="text-muted-foreground">Loading subjects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Subjects</h1>
          <p className="text-muted-foreground">
            {isTeacher
              ? "Manage courses and subjects"
              : "Browse and manage your course enrolments"}
          </p>
        </div>
        {isTeacher && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Subject</DialogTitle>
                <DialogDescription>
                  Add a new subject to the system. You will be assigned as the teacher.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {error && (
                  <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="code">Subject Code *</Label>
                  <Input
                    id="code"
                    value={newSubject.code}
                    onChange={(e) =>
                      setNewSubject({ ...newSubject, code: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g., WEBTECH"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Subject Name *</Label>
                  <Input
                    id="name"
                    value={newSubject.name}
                    onChange={(e) =>
                      setNewSubject({ ...newSubject, name: e.target.value })
                    }
                    placeholder="Web Technologies"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credits">Credits *</Label>
                  <Input
                    id="credits"
                    type="number"
                    min="1"
                    max="20"
                    value={newSubject.credits}
                    onChange={(e) =>
                      setNewSubject({
                        ...newSubject,
                        credits: parseInt(e.target.value) || 6,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="semester">Semester *</Label>
                  <select
                    id="semester"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={newSubject.semester}
                    onChange={(e) =>
                      setNewSubject({ ...newSubject, semester: e.target.value })
                    }
                  >
                    <option value="Winter">Winter</option>
                    <option value="Summer">Summer</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    value={newSubject.description}
                    onChange={(e) =>
                      setNewSubject({
                        ...newSubject,
                        description: e.target.value,
                      })
                    }
                    placeholder="Course description..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setNewSubject({ code: "", name: "", credits: 6, semester: "Winter", description: "" });
                    setError("");
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={handleCreateSubject}
                  disabled={creating}
                >
                  {creating ? "Creating..." : "Create Subject"}
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

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search subjects..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {!isTeacher && (
          <Badge variant="secondary" className="px-4 py-2">
            {enrollments.filter((e) => e.status === "confirmed").length} Enrolled
          </Badge>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filteredSubjects.map((subject) => {
          const enrolled = isEnrolled(subject.id);
          const isMySubject = subject.teacher_id === user?.id;
          return (
            <Card
              key={subject.id}
              className="shadow-md border-0 hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{subject.code}</Badge>
                      <Badge className="bg-accent text-accent-foreground">
                        {subject.credits} ECTS
                      </Badge>
                      <Badge variant="secondary">{subject.semester}</Badge>
                    </div>
                    <CardTitle className="text-lg">{subject.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {subject.teacher_name || "Teacher"}
                    </CardDescription>
                    {subject.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {subject.description}
                      </p>
                    )}
                  </div>
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {subject.enrolled_count || 0} students enrolled
                  </div>
                  {isTeacher && isMySubject ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={() => handleDeleteSubject(subject.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Subject
                    </Button>
                  ) : isTeacher ? (
                    <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                      Created by {subject.teacher_name || "another teacher"}
                    </div>
                  ) : (
                    <Button
                      className="w-full mt-2"
                      variant={enrolled ? "secondary" : "default"}
                      disabled={enrolled}
                      onClick={() => handleEnroll(subject.id)}
                    >
                      {enrolled ? "✓ Enrolled" : "Enroll in Subject"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {filteredSubjects.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm ? "No subjects found matching your search" : "No subjects available"}
        </div>
      )}
    </div>
  );
}
