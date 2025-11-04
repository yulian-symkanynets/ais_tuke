import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { BookOpen, Users, Clock, GraduationCap, Filter, ChevronDown, ChevronUp, Plus, Calendar } from "lucide-react";
import { useState, useEffect } from "react";

const API_BASE = "http://127.0.0.1:8000";

type Subject = {
  id: number;
  code: string;
  name: string;
  credits: number;
  semester: string;
  enrolled: boolean;
  students: number;
  lecturer: string;
  schedule: string;
  description?: string;
  year?: number;
};

type TimeOption = {
  id: number;
  subject_code: string;
  option_name: string;
  day: string;
  time: string;
  room: string;
  type: string;
  lecturer: string;
  capacity: number;
  enrolled: number;
  available: number;
};

export function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [semesterFilter, setSemesterFilter] = useState<string>("all");
  const [expandedSubject, setExpandedSubject] = useState<number | null>(null);
  const [showTimeOptions, setShowTimeOptions] = useState<string | null>(null);
  const [timeOptions, setTimeOptions] = useState<Record<string, TimeOption[]>>({});
  const [selectedTimeOptions, setSelectedTimeOptions] = useState<Record<string, number[]>>({});
  
  // Teacher features
  const [userRole, setUserRole] = useState<string>("student");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTimeOptionDialog, setShowTimeOptionDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [currentSubjectForTime, setCurrentSubjectForTime] = useState<string>("");
  
  // Form state
  const [newSubject, setNewSubject] = useState({
    code: "",
    name: "",
    credits: 5,
    semester: "Winter",
    lecturer: "",
    description: "",
    year: 1
  });
  
  const [newTimeOption, setNewTimeOption] = useState({
    option_name: "",
    day: "Monday",
    time: "08:00-09:40",
    room: "",
    type: "Lecture",
    lecturer: "",
    capacity: 30
  });

  useEffect(() => {
    // Get user role from localStorage
    const studentData = localStorage.getItem("student");
    if (studentData) {
      const student = JSON.parse(studentData);
      setUserRole(student.role || "student");
    }
    
    loadSubjects();
  }, [yearFilter, semesterFilter]);

  const loadSubjects = () => {
    setLoading(true);
    let url = `${API_BASE}/api/subjects`;
    const params = new URLSearchParams();
    
    if (yearFilter !== "all") {
      params.append("year", yearFilter);
    }
    if (semesterFilter !== "all") {
      params.append("semester", semesterFilter);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    fetch(url)
      .then(res => res.json())
      .then(data => setSubjects(data))
      .catch(err => console.error("Failed to load subjects:", err))
      .finally(() => setLoading(false));
  };

  const loadTimeOptions = async (subjectCode: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/schedule/options/${subjectCode}`);
      const data = await response.json();
      setTimeOptions(prev => ({ ...prev, [subjectCode]: data }));
      
      // Pre-select one lecture and one lab option by default
      const lectureOption = data.find((opt: TimeOption) => opt.type === 'Lecture');
      const labOption = data.find((opt: TimeOption) => opt.type === 'Lab');
      const defaultSelections = [];
      if (lectureOption) defaultSelections.push(lectureOption.id);
      if (labOption) defaultSelections.push(labOption.id);
      setSelectedTimeOptions(prev => ({ ...prev, [subjectCode]: defaultSelections }));
    } catch (error) {
      console.error("Failed to load time options:", error);
    }
  };

  const toggleTimeOptions = (subjectCode: string) => {
    if (showTimeOptions === subjectCode) {
      setShowTimeOptions(null);
    } else {
      setShowTimeOptions(subjectCode);
      if (!timeOptions[subjectCode]) {
        loadTimeOptions(subjectCode);
      }
    }
  };

  const toggleTimeOption = (subjectCode: string, optionId: number, optionType: string) => {
    setSelectedTimeOptions(prev => {
      const current = prev[subjectCode] || [];
      const options = timeOptions[subjectCode] || [];
      
      // Remove any previously selected option of the same type
      const filtered = current.filter(id => {
        const opt = options.find(o => o.id === id);
        return opt && opt.type !== optionType;
      });
      
      // Toggle the clicked option
      if (current.includes(optionId)) {
        return { ...prev, [subjectCode]: filtered };
      } else {
        return { ...prev, [subjectCode]: [...filtered, optionId] };
      }
    });
  };

  const handleEnroll = async (subjectCode: string) => {
    const selectedIds = selectedTimeOptions[subjectCode] || [];
    
    if (selectedIds.length === 0) {
      alert("Please select at least one time option");
      return;
    }

    setEnrolling(subjectCode);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE}/api/enrolment/enroll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject_code: subjectCode,
          time_option_ids: selectedIds
        }),
      });

      if (response.ok) {
        alert("Successfully enrolled!");
        loadSubjects();
      } else {
        const error = await response.json();
        alert(error.detail || "Failed to enroll");
      }
    } catch (error) {
      console.error("Enrollment failed:", error);
      alert("Failed to enroll. Please try again.");
    } finally {
      setEnrolling(null);
    }
  };

  const handleCreateSubject = async () => {
    if (!newSubject.code || !newSubject.name || !newSubject.lecturer) {
      alert("Please fill in all required fields");
      return;
    }

    setCreating(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE}/api/teacher/subject/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newSubject),
      });

      if (response.ok) {
        alert("Subject created successfully!");
        setShowCreateDialog(false);
        setNewSubject({
          code: "",
          name: "",
          credits: 5,
          semester: "Winter",
          lecturer: "",
          description: "",
          year: 1
        });
        loadSubjects();
      } else {
        const error = await response.json();
        alert(error.detail || "Failed to create subject");
      }
    } catch (error) {
      console.error("Failed to create subject:", error);
      alert("Failed to create subject. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleCreateTimeOption = async () => {
    if (!newTimeOption.option_name || !newTimeOption.room || !newTimeOption.lecturer) {
      alert("Please fill in all required fields");
      return;
    }

    setCreating(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE}/api/teacher/subject/time-option/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newTimeOption,
          subject_code: currentSubjectForTime
        }),
      });

      if (response.ok) {
        alert("Time option created successfully!");
        setShowTimeOptionDialog(false);
        setNewTimeOption({
          option_name: "",
          day: "Monday",
          time: "08:00-09:40",
          room: "",
          type: "Lecture",
          lecturer: "",
          capacity: 30
        });
        // Reload time options for this subject
        if (currentSubjectForTime) {
          loadTimeOptions(currentSubjectForTime);
        }
      } else {
        const error = await response.json();
        alert(error.detail || "Failed to create time option");
      }
    } catch (error) {
      console.error("Failed to create time option:", error);
      alert("Failed to create time option. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.lecturer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subjects</h1>
          <p className="text-muted-foreground">Browse and enroll in available subjects</p>
        </div>
        
        {userRole === "teacher" && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Subject
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Subject</DialogTitle>
                <DialogDescription>
                  Add a new subject to the course catalog. After creating the subject, add time options for students to select.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Subject Code *</Label>
                    <Input
                      placeholder="e.g., ZADS"
                      value={newSubject.code}
                      onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value.toUpperCase() })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Credits *</Label>
                    <Input
                      type="number"
                      min="1"
                      max="15"
                      value={newSubject.credits}
                      onChange={(e) => setNewSubject({ ...newSubject, credits: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Subject Name *</Label>
                  <Input
                    placeholder="e.g., Data Structures and Algorithms"
                    value={newSubject.name}
                    onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Year *</Label>
                    <Select
                      value={newSubject.year.toString()}
                      onValueChange={(value) => setNewSubject({ ...newSubject, year: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Year 1</SelectItem>
                        <SelectItem value="2">Year 2</SelectItem>
                        <SelectItem value="3">Year 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Semester *</Label>
                    <Select
                      value={newSubject.semester}
                      onValueChange={(value) => setNewSubject({ ...newSubject, semester: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Winter">Winter</SelectItem>
                        <SelectItem value="Summer">Summer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Lecturer *</Label>
                  <Input
                    placeholder="e.g., Prof. John Doe"
                    value={newSubject.lecturer}
                    onChange={(e) => setNewSubject({ ...newSubject, lecturer: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Detailed course description..."
                    rows={4}
                    value={newSubject.description}
                    onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button onClick={handleCreateSubject} disabled={creating}>
                  {creating ? "Creating..." : "Create Subject"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle>Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search subjects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  <SelectItem value="1">Year 1</SelectItem>
                  <SelectItem value="2">Year 2</SelectItem>
                  <SelectItem value="3">Year 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Semester</label>
              <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All semesters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All semesters</SelectItem>
                  <SelectItem value="Winter">Winter</SelectItem>
                  <SelectItem value="Summer">Summer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading subjects...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredSubjects.map((subject) => (
            <Card key={subject.id} className="shadow-md border-0 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg">{subject.code}</CardTitle>
                      {subject.enrolled && (
                        <Badge variant="secondary" className="text-xs">Enrolled</Badge>
                      )}
                    </div>
                    <CardDescription className="font-medium text-foreground">
                      {subject.name}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <GraduationCap className="h-4 w-4" />
                    {subject.lecturer}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    {subject.credits} credits • Year {subject.year || 1} • {subject.semester}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {subject.schedule}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {subject.students} students
                  </div>

                  {subject.description && (
                    <>
                      <div className="pt-2 border-t">
                        <button
                          onClick={() => setExpandedSubject(expandedSubject === subject.id ? null : subject.id)}
                          className="text-sm text-primary hover:underline"
                        >
                          {expandedSubject === subject.id ? "Hide" : "Show"} description
                        </button>
                        {expandedSubject === subject.id && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {subject.description}
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {!subject.enrolled && userRole === "student" && (
                    <div className="pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mb-2"
                        onClick={() => toggleTimeOptions(subject.code)}
                      >
                        {showTimeOptions === subject.code ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-2" />
                            Hide Time Options
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-2" />
                            Select Schedule
                          </>
                        )}
                      </Button>

                      {showTimeOptions === subject.code && timeOptions[subject.code] && (
                        <div className="space-y-3 mb-3">
                          <p className="text-xs text-muted-foreground">Choose your class times:</p>
                          
                          {/* Lecture options */}
                          <div className="space-y-2">
                            <p className="text-xs font-semibold">Lecture:</p>
                            {timeOptions[subject.code]
                              .filter(opt => opt.type === "Lecture")
                              .map(option => (
                                <button
                                  key={option.id}
                                  onClick={() => toggleTimeOption(subject.code, option.id, "Lecture")}
                                  disabled={option.available === 0}
                                  className={`w-full text-left p-2 rounded text-xs border transition-colors ${
                                    selectedTimeOptions[subject.code]?.includes(option.id)
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : option.available === 0
                                      ? "bg-muted text-muted-foreground border-muted cursor-not-allowed"
                                      : "bg-card border-border hover:border-primary"
                                  }`}
                                >
                                  <div className="font-medium">{option.option_name}</div>
                                  <div className="text-[10px] mt-1">
                                    {option.day} {option.time} • {option.room} • {option.lecturer}
                                  </div>
                                  <div className="text-[10px] mt-1">
                                    {option.available > 0 ? (
                                      <span className="text-green-600">{option.available} spots left</span>
                                    ) : (
                                      <span className="text-red-600">Full</span>
                                    )}
                                  </div>
                                </button>
                              ))}
                          </div>

                          {/* Lab options */}
                          {timeOptions[subject.code].some(opt => opt.type === "Lab") && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold">Lab:</p>
                              {timeOptions[subject.code]
                                .filter(opt => opt.type === "Lab")
                                .map(option => (
                                  <button
                                    key={option.id}
                                    onClick={() => toggleTimeOption(subject.code, option.id, "Lab")}
                                    disabled={option.available === 0}
                                    className={`w-full text-left p-2 rounded text-xs border transition-colors ${
                                      selectedTimeOptions[subject.code]?.includes(option.id)
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : option.available === 0
                                        ? "bg-muted text-muted-foreground border-muted cursor-not-allowed"
                                        : "bg-card border-border hover:border-primary"
                                    }`}
                                  >
                                    <div className="font-medium">{option.option_name}</div>
                                    <div className="text-[10px] mt-1">
                                      {option.day} {option.time} • {option.room} • {option.lecturer}
                                    </div>
                                    <div className="text-[10px] mt-1">
                                      {option.available > 0 ? (
                                        <span className="text-green-600">{option.available} spots left</span>
                                      ) : (
                                        <span className="text-red-600">Full</span>
                                      )}
                                    </div>
                                  </button>
                                ))}
                            </div>
                          )}
                        </div>
                      )}

                      <Button
                        className="w-full"
                        onClick={() => handleEnroll(subject.code)}
                        disabled={enrolling === subject.code}
                      >
                        {enrolling === subject.code ? "Enrolling..." : "Enroll"}
                      </Button>
                    </div>
                  )}
                  
                  {userRole === "teacher" && (
                    <div className="pt-2 border-t">
                      <Dialog open={showTimeOptionDialog && currentSubjectForTime === subject.code} 
                              onOpenChange={(open) => {
                                setShowTimeOptionDialog(open);
                                if (open) setCurrentSubjectForTime(subject.code);
                              }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full">
                            <Calendar className="h-4 w-4 mr-2" />
                            Add Time Option
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Time Option for {subject.code}</DialogTitle>
                            <DialogDescription>
                              Create a new lecture or lab time slot for students to select.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Option Name *</Label>
                              <Input
                                placeholder="e.g., Morning Session"
                                value={newTimeOption.option_name}
                                onChange={(e) => setNewTimeOption({ ...newTimeOption, option_name: e.target.value })}
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Type *</Label>
                                <Select
                                  value={newTimeOption.type}
                                  onValueChange={(value) => setNewTimeOption({ ...newTimeOption, type: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Lecture">Lecture</SelectItem>
                                    <SelectItem value="Lab">Lab</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="space-y-2">
                                <Label>Day *</Label>
                                <Select
                                  value={newTimeOption.day}
                                  onValueChange={(value) => setNewTimeOption({ ...newTimeOption, day: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Monday">Monday</SelectItem>
                                    <SelectItem value="Tuesday">Tuesday</SelectItem>
                                    <SelectItem value="Wednesday">Wednesday</SelectItem>
                                    <SelectItem value="Thursday">Thursday</SelectItem>
                                    <SelectItem value="Friday">Friday</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Time *</Label>
                                <Input
                                  placeholder="08:00-09:40"
                                  value={newTimeOption.time}
                                  onChange={(e) => setNewTimeOption({ ...newTimeOption, time: e.target.value })}
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label>Room *</Label>
                                <Input
                                  placeholder="PK6 C303"
                                  value={newTimeOption.room}
                                  onChange={(e) => setNewTimeOption({ ...newTimeOption, room: e.target.value })}
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Lecturer *</Label>
                              <Input
                                placeholder="Prof. John Doe"
                                value={newTimeOption.lecturer}
                                onChange={(e) => setNewTimeOption({ ...newTimeOption, lecturer: e.target.value })}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Capacity *</Label>
                              <Input
                                type="number"
                                min="1"
                                max="200"
                                value={newTimeOption.capacity}
                                onChange={(e) => setNewTimeOption({ ...newTimeOption, capacity: parseInt(e.target.value) })}
                              />
                            </div>
                          </div>
                          
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowTimeOptionDialog(false)}>Cancel</Button>
                            <Button onClick={handleCreateTimeOption} disabled={creating}>
                              {creating ? "Creating..." : "Create Time Option"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredSubjects.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No subjects found matching your filters.</p>
        </div>
      )}
    </div>
  );
}
