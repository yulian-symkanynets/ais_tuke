import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { 
  FileText, 
  Plus, 
  Trash2, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Upload,
  MessageSquare,
  Award
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

interface Assignment {
  id: number;
  subject_id: number;
  teacher_id: number;
  title: string;
  description?: string;
  due_date: string;
  max_points: number;
  created_at?: string;
  subject_name?: string;
  subject_code?: string;
  teacher_name?: string;
  submission_count: number;
}

interface Submission {
  id: number;
  assignment_id: number;
  student_id: number;
  submitted_at?: string;
  file_url?: string;
  text_answer?: string;
  grade?: number;
  feedback?: string;
  student_name?: string;
  assignment_title?: string;
}

interface Subject {
  id: number;
  code: string;
  name: string;
  teacher_id: number;
}

export function AssignmentsPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [mySubmissions, setMySubmissions] = useState<Submission[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isViewSubmissionsOpen, setIsViewSubmissionsOpen] = useState(false);
  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false);
  
  const [creating, setCreating] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  
  const [newAssignment, setNewAssignment] = useState({
    subject_id: "",
    title: "",
    description: "",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    max_points: 100,
  });
  
  const [submitForm, setSubmitForm] = useState({
    text_answer: "",
    file_url: "",
  });
  
  const [gradeForm, setGradeForm] = useState({
    grade: 0,
    feedback: "",
  });

  const isTeacher = user?.role === "teacher" || user?.role === "admin";
  const isStudent = user?.role === "student";

  useEffect(() => {
    fetchAssignments();
    if (isTeacher) {
      fetchSubjects();
    }
    if (isStudent) {
      fetchMySubmissions();
    }
  }, [isTeacher, isStudent]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<Assignment[]>("/api/assignments/");
      setAssignments(data || []);
    } catch (e: any) {
      setError(e.message || "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const data = await api.get<Subject[]>("/api/subjects/");
      const mySubjects = data.filter(s => s.teacher_id === user?.id || user?.role === "admin");
      setSubjects(mySubjects);
    } catch (e) {
      console.error("Failed to fetch subjects:", e);
    }
  };

  const fetchMySubmissions = async () => {
    try {
      const data = await api.get<Submission[]>("/api/assignments/my-submissions/");
      setMySubmissions(data || []);
    } catch (e) {
      console.error("Failed to fetch submissions:", e);
    }
  };

  const fetchAssignmentSubmissions = async (assignmentId: number) => {
    try {
      const data = await api.get<Submission[]>(`/api/assignments/${assignmentId}/submissions`);
      setAssignmentSubmissions(data || []);
    } catch (e) {
      console.error("Failed to fetch submissions:", e);
    }
  };

  const handleCreateAssignment = async () => {
    setError(null);
    setSuccess(null);

    if (!newAssignment.subject_id || !newAssignment.title.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    setCreating(true);
    try {
      await api.post("/api/assignments/", {
        subject_id: parseInt(newAssignment.subject_id),
        title: newAssignment.title.trim(),
        description: newAssignment.description?.trim() || null,
        due_date: new Date(newAssignment.due_date).toISOString(),
        max_points: newAssignment.max_points,
      });
      
      setIsAddDialogOpen(false);
      setNewAssignment({
        subject_id: "",
        title: "",
        description: "",
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        max_points: 100,
      });
      await fetchAssignments();
      setSuccess("Assignment created successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e.message || "Failed to create assignment");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: number) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;

    try {
      await api.delete(`/api/assignments/${assignmentId}`);
      await fetchAssignments();
      setSuccess("Assignment deleted successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e.message || "Failed to delete assignment");
    }
  };

  const handleSubmitAssignment = async () => {
    if (!selectedAssignment) return;
    
    setError(null);
    setSuccess(null);

    if (!submitForm.text_answer.trim() && !submitForm.file_url.trim()) {
      setError("Please provide an answer or file URL");
      return;
    }

    setCreating(true);
    try {
      await api.post("/api/assignments/submissions/", {
        assignment_id: selectedAssignment.id,
        text_answer: submitForm.text_answer?.trim() || null,
        file_url: submitForm.file_url?.trim() || null,
      });
      
      setIsSubmitDialogOpen(false);
      setSubmitForm({ text_answer: "", file_url: "" });
      setSelectedAssignment(null);
      await fetchMySubmissions();
      setSuccess("Assignment submitted successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e.message || "Failed to submit assignment");
    } finally {
      setCreating(false);
    }
  };

  const handleGradeSubmission = async () => {
    if (!selectedSubmission) return;
    
    setError(null);
    setSuccess(null);
    setCreating(true);

    try {
      await api.put(`/api/assignments/submissions/${selectedSubmission.id}/grade`, {
        grade: gradeForm.grade,
        feedback: gradeForm.feedback?.trim() || null,
      });
      
      setIsGradeDialogOpen(false);
      setGradeForm({ grade: 0, feedback: "" });
      setSelectedSubmission(null);
      if (selectedAssignment) {
        await fetchAssignmentSubmissions(selectedAssignment.id);
      }
      setSuccess("Submission graded successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e.message || "Failed to grade submission");
    } finally {
      setCreating(false);
    }
  };

  const openSubmitDialog = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsSubmitDialogOpen(true);
  };

  const openViewSubmissions = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    await fetchAssignmentSubmissions(assignment.id);
    setIsViewSubmissionsOpen(true);
  };

  const openGradeDialog = (submission: Submission) => {
    setSelectedSubmission(submission);
    setGradeForm({
      grade: submission.grade || 0,
      feedback: submission.feedback || "",
    });
    setIsGradeDialogOpen(true);
  };

  const getSubmissionForAssignment = (assignmentId: number) => {
    return mySubmissions.find(s => s.assignment_id === assignmentId);
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1>Assignments</h1>
          <p className="text-muted-foreground">Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Assignments</h1>
          <p className="text-muted-foreground">
            {isTeacher ? "Create and manage assignments for your subjects" : "View and submit your assignments"}
          </p>
        </div>
        {isTeacher && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Assignment</DialogTitle>
                <DialogDescription>
                  Create an assignment for one of your subjects
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
                    value={newAssignment.subject_id}
                    onChange={(e) => setNewAssignment({ ...newAssignment, subject_id: e.target.value })}
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
                  <Label>Title *</Label>
                  <Input
                    value={newAssignment.title}
                    onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                    placeholder="Assignment title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newAssignment.description}
                    onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                    placeholder="Assignment description and instructions"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Due Date *</Label>
                    <Input
                      type="date"
                      value={newAssignment.due_date}
                      onChange={(e) => setNewAssignment({ ...newAssignment, due_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Points</Label>
                    <Input
                      type="number"
                      min="1"
                      value={newAssignment.max_points}
                      onChange={(e) => setNewAssignment({ ...newAssignment, max_points: parseInt(e.target.value) || 100 })}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateAssignment} disabled={creating}>
                  {creating ? "Creating..." : "Create Assignment"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {(error || success) && !isAddDialogOpen && !isSubmitDialogOpen && !isGradeDialogOpen && (
        <div className={`rounded-md p-4 ${error ? 'bg-destructive/15 text-destructive' : 'bg-green-500/15 text-green-600'}`}>
          {error || success}
        </div>
      )}

      {/* Assignments Grid */}
      {assignments.length === 0 ? (
        <Card className="shadow-md border-0">
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {isTeacher ? "No assignments created yet." : "No assignments available."}
            </p>
            {isTeacher && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {assignments.map((assignment) => {
            const submission = getSubmissionForAssignment(assignment.id);
            const overdue = isOverdue(assignment.due_date);
            
            return (
              <Card key={assignment.id} className="shadow-md border-0">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{assignment.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {assignment.subject_name} ({assignment.subject_code})
                      </CardDescription>
                    </div>
                    {submission ? (
                      submission.grade !== null && submission.grade !== undefined ? (
                        <Badge className="bg-green-600">
                          <Award className="h-3 w-3 mr-1" />
                          {submission.grade}/{assignment.max_points}
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Submitted
                        </Badge>
                      )
                    ) : overdue ? (
                      <Badge variant="destructive">
                        <Clock className="h-3 w-3 mr-1" />
                        Overdue
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {assignment.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {assignment.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Due: {new Date(assignment.due_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Award className="h-4 w-4" />
                        {assignment.max_points} pts
                      </div>
                    </div>

                    {isTeacher && (
                      <div className="text-sm text-muted-foreground">
                        {assignment.submission_count} submission(s)
                      </div>
                    )}

                    {submission?.feedback && (
                      <div className="p-2 rounded bg-muted/50 text-sm">
                        <p className="font-medium">Feedback:</p>
                        <p className="text-muted-foreground">{submission.feedback}</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      {isStudent && !submission && (
                        <Button 
                          className="flex-1"
                          onClick={() => openSubmitDialog(assignment)}
                          disabled={overdue}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Submit
                        </Button>
                      )}
                      
                      {isTeacher && (
                        <>
                          <Button 
                            variant="outline"
                            className="flex-1"
                            onClick={() => openViewSubmissions(assignment)}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            View Submissions ({assignment.submission_count})
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteAssignment(assignment.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Submit Assignment Dialog */}
      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Assignment</DialogTitle>
            <DialogDescription>
              {selectedAssignment?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label>Your Answer</Label>
              <Textarea
                value={submitForm.text_answer}
                onChange={(e) => setSubmitForm({ ...submitForm, text_answer: e.target.value })}
                placeholder="Write your answer here..."
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label>File URL (optional)</Label>
              <Input
                value={submitForm.file_url}
                onChange={(e) => setSubmitForm({ ...submitForm, file_url: e.target.value })}
                placeholder="https://drive.google.com/..."
              />
              <p className="text-xs text-muted-foreground">
                Paste a link to your file (Google Drive, Dropbox, etc.)
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsSubmitDialogOpen(false);
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitAssignment} disabled={creating}>
              {creating ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Submissions Dialog */}
      <Dialog open={isViewSubmissionsOpen} onOpenChange={setIsViewSubmissionsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Submissions for: {selectedAssignment?.title}</DialogTitle>
            <DialogDescription>
              {assignmentSubmissions.length} submission(s)
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {assignmentSubmissions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No submissions yet</p>
            ) : (
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Answer</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignmentSubmissions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell>{sub.student_name || `Student #${sub.student_id}`}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : "-"}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {sub.text_answer || sub.file_url || "-"}
                        </TableCell>
                        <TableCell>
                          {sub.grade !== null && sub.grade !== undefined ? (
                            <Badge>{sub.grade}/{selectedAssignment?.max_points}</Badge>
                          ) : (
                            <Badge variant="outline">Not graded</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => openGradeDialog(sub)}
                          >
                            Grade
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Grade Submission Dialog */}
      <Dialog open={isGradeDialogOpen} onOpenChange={setIsGradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grade Submission</DialogTitle>
            <DialogDescription>
              Student: {selectedSubmission?.student_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            
            {selectedSubmission?.text_answer && (
              <div className="space-y-2">
                <Label>Student's Answer</Label>
                <div className="p-3 rounded bg-muted/50 text-sm max-h-32 overflow-y-auto">
                  {selectedSubmission.text_answer}
                </div>
              </div>
            )}
            
            {selectedSubmission?.file_url && (
              <div className="space-y-2">
                <Label>Submitted File</Label>
                <a 
                  href={selectedSubmission.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {selectedSubmission.file_url}
                </a>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Grade (0-{selectedAssignment?.max_points})</Label>
              <Input
                type="number"
                min="0"
                max={selectedAssignment?.max_points}
                value={gradeForm.grade}
                onChange={(e) => setGradeForm({ ...gradeForm, grade: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Feedback (optional)</Label>
              <Textarea
                value={gradeForm.feedback}
                onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                placeholder="Provide feedback to the student..."
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsGradeDialogOpen(false);
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleGradeSubmission} disabled={creating}>
              {creating ? "Saving..." : "Save Grade"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

