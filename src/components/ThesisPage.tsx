import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import { 
  FileText, 
  Calendar, 
  User, 
  Building, 
  CheckCircle, 
  Clock,
  Upload,
  Download,
  AlertCircle,
  BookOpen,
  Plus,
  Trash2
} from "lucide-react";
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
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface Thesis {
  id: number;
  student_id: number;
  title: string;
  thesis_type: string;
  status: string;
  supervisor_name: string;
  consultant_name?: string;
  department: string;
  start_date: string;
  submission_deadline: string;
  defense_date?: string;
  progress: number;
  description?: string;
  created_at?: string;
  student_name?: string;
}

interface Student {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

export function ThesisPage() {
  const { user } = useAuth();
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newThesis, setNewThesis] = useState({
    title: "",
    thesis_type: "Bachelor Thesis",
    supervisor_name: "",
    consultant_name: "",
    department: "Department of Computers and Informatics",
    start_date: new Date().toISOString().split("T")[0],
    submission_deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    description: "",
    student_id: "",
  });

  const isStudent = user?.role === "student";
  const isTeacher = user?.role === "teacher" || user?.role === "admin";

  useEffect(() => {
    fetchTheses();
  }, []);

  const fetchTheses = async () => {
    try {
      setLoading(true);
      const data = await api.get<Thesis[]>("/api/theses/");
      setTheses(data || []);
    } catch (error) {
      console.error("Failed to fetch theses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateThesis = async () => {
    setError("");
    setSuccess("");

    if (!newThesis.title.trim()) {
      setError("Please enter a thesis title");
      return;
    }
    if (!newThesis.supervisor_name.trim()) {
      setError("Please enter a supervisor name");
      return;
    }
    if (isTeacher && !newThesis.student_id) {
      setError("Please enter a student ID");
      return;
    }

    setCreating(true);
    try {
      const payload: any = {
        title: newThesis.title.trim(),
        thesis_type: newThesis.thesis_type,
        supervisor_name: newThesis.supervisor_name.trim(),
        consultant_name: newThesis.consultant_name?.trim() || null,
        department: newThesis.department.trim(),
        start_date: new Date(newThesis.start_date).toISOString(),
        submission_deadline: new Date(newThesis.submission_deadline).toISOString(),
        description: newThesis.description?.trim() || null,
      };

      // Teachers must provide student_id
      if (isTeacher) {
        payload.student_id = parseInt(newThesis.student_id);
      }

      console.log("Creating thesis with payload:", payload);
      await api.post("/api/theses/", payload);
      
      setIsDialogOpen(false);
      setNewThesis({
        title: "",
        thesis_type: "Bachelor Thesis",
        supervisor_name: "",
        consultant_name: "",
        department: "Department of Computers and Informatics",
        start_date: new Date().toISOString().split("T")[0],
        submission_deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        description: "",
        student_id: "",
      });
      await fetchTheses();
      setSuccess("Thesis registered successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      console.error("Error creating thesis:", error);
      setError(error.message || "Failed to register thesis");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateProgress = async (thesisId: number, progress: number) => {
    try {
      await api.put(`/api/theses/${thesisId}`, { progress });
      await fetchTheses();
    } catch (error: any) {
      alert(error.message || "Failed to update progress");
    }
  };

  const handleDeleteThesis = async (thesisId: number) => {
    if (!confirm("Are you sure you want to delete this thesis?")) return;
    
    try {
      await api.delete(`/api/theses/${thesisId}`);
      await fetchTheses();
      setSuccess("Thesis deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      setError(error.message || "Failed to delete thesis");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case "In Progress":
        return <Badge className="bg-blue-600"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>;
      case "Registered":
        return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Registered</Badge>;
      case "Submitted":
        return <Badge className="bg-purple-600">Submitted</Badge>;
      case "Defended":
        return <Badge className="bg-green-700">Defended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // For students, show their thesis; for teachers, show all theses
  const currentThesis = isStudent ? theses.find(t => t.student_id === user?.id) : null;
  const canAddThesis = isStudent ? !currentThesis : isTeacher;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1>Thesis</h1>
          <p className="text-muted-foreground">Loading thesis information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Thesis</h1>
          <p className="text-muted-foreground">
            {isTeacher 
              ? "Manage and assign thesis topics to students"
              : "Manage your bachelor/master thesis and track your progress"}
          </p>
        </div>
        {canAddThesis && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {isTeacher ? "Assign Thesis" : "Register Thesis"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{isTeacher ? "Assign New Thesis" : "Register New Thesis"}</DialogTitle>
                <DialogDescription>
                  {isTeacher 
                    ? "Assign a thesis topic to a student"
                    : "Register your thesis topic"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                {error && (
                  <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
                
                {isTeacher && (
                  <div className="space-y-2">
                    <Label>Student ID *</Label>
                    <Input
                      type="number"
                      value={newThesis.student_id}
                      onChange={(e) => setNewThesis({ ...newThesis, student_id: e.target.value })}
                      placeholder="Enter student ID (e.g., 1)"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the ID of the student to assign this thesis to
                    </p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={newThesis.title}
                    onChange={(e) => setNewThesis({ ...newThesis, title: e.target.value })}
                    placeholder="Thesis title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={newThesis.thesis_type}
                    onChange={(e) => setNewThesis({ ...newThesis, thesis_type: e.target.value })}
                  >
                    <option value="Bachelor Thesis">Bachelor Thesis</option>
                    <option value="Master Thesis">Master Thesis</option>
                    <option value="Doctoral Thesis">Doctoral Thesis</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Supervisor *</Label>
                  <Input
                    value={newThesis.supervisor_name}
                    onChange={(e) => setNewThesis({ ...newThesis, supervisor_name: e.target.value })}
                    placeholder={isTeacher ? user?.full_name || "Your name" : "Prof. Dr. Name"}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Consultant (optional)</Label>
                  <Input
                    value={newThesis.consultant_name}
                    onChange={(e) => setNewThesis({ ...newThesis, consultant_name: e.target.value })}
                    placeholder="Dr. Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input
                    value={newThesis.department}
                    onChange={(e) => setNewThesis({ ...newThesis, department: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={newThesis.start_date}
                      onChange={(e) => setNewThesis({ ...newThesis, start_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Submission Deadline</Label>
                    <Input
                      type="date"
                      value={newThesis.submission_deadline}
                      onChange={(e) => setNewThesis({ ...newThesis, submission_deadline: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Input
                    value={newThesis.description}
                    onChange={(e) => setNewThesis({ ...newThesis, description: e.target.value })}
                    placeholder="Brief description of the thesis topic"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setError("");
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateThesis} disabled={creating}>
                  {creating ? "Creating..." : (isTeacher ? "Assign Thesis" : "Register Thesis")}
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

      {/* Teacher view - show all theses */}
      {isTeacher && (
        <div className="space-y-4">
          {theses.length === 0 ? (
            <Card className="shadow-md border-0">
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  No theses registered yet.
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Assign Thesis
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {theses.map((thesis) => (
                <Card key={thesis.id} className="shadow-md border-0">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{thesis.title}</CardTitle>
                        <CardDescription className="mt-1">
                          Student: {thesis.student_name || `ID: ${thesis.student_id}`}
                        </CardDescription>
                      </div>
                      {getStatusBadge(thesis.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <span>{thesis.thesis_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Supervisor:</span>
                        <span>{thesis.supervisor_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Progress:</span>
                        <span>{thesis.progress}%</span>
                      </div>
                      <Progress value={thesis.progress} className="h-2 mt-2" />
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full mt-4"
                      onClick={() => handleDeleteThesis(thesis.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Thesis
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Student view - show their thesis */}
      {isStudent && (
        <>
          {!currentThesis ? (
            <Card className="shadow-md border-0">
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  You haven't registered a thesis yet.
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Register Thesis
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Thesis Overview */}
              <Card className="shadow-md border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Thesis Overview</CardTitle>
                    {getStatusBadge(currentThesis.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-primary mt-1" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Thesis Title</p>
                          <p className="font-medium">{currentThesis.title}</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <div className="flex items-start gap-3">
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Type</p>
                          <p className="font-medium">{currentThesis.thesis_type}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Supervisor</p>
                          <p className="font-medium">{currentThesis.supervisor_name}</p>
                        </div>
                      </div>

                      {currentThesis.consultant_name && (
                        <div className="flex items-start gap-3">
                          <User className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Consultant</p>
                            <p className="font-medium">{currentThesis.consultant_name}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-3">
                        <Building className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Department</p>
                          <p className="font-medium">{currentThesis.department}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Submission Deadline</p>
                          <p className="font-medium">
                            {new Date(currentThesis.submission_deadline).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {currentThesis.defense_date && (
                        <div className="flex items-start gap-3">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Defense Date</p>
                            <p className="font-medium">
                              {new Date(currentThesis.defense_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Overall Progress</span>
                        <span className="text-sm font-medium text-primary">{currentThesis.progress}%</span>
                      </div>
                      <Progress value={currentThesis.progress} className="h-2" />
                      <div className="flex gap-2 mt-3">
                        {[25, 50, 75, 100].map((p) => (
                          <Button
                            key={p}
                            variant={currentThesis.progress >= p ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleUpdateProgress(currentThesis.id, p)}
                          >
                            {p}%
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Documents */}
              <Card className="shadow-md border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Documents & Files</CardTitle>
                      <CardDescription>Manage your thesis-related documents</CardDescription>
                    </div>
                    <Button>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium text-sm">Thesis Template.docx</p>
                          <p className="text-xs text-muted-foreground">245 KB • Template</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
