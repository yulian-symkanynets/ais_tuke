import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { BookOpen, Users, Clock, GraduationCap, Filter, ChevronDown, ChevronUp } from "lucide-react";
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

  useEffect(() => {
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

  const toggleTimeOptionSelection = (subjectCode: string, optionId: number, type: string) => {
    setSelectedTimeOptions(prev => {
      const current = prev[subjectCode] || [];
      const options = timeOptions[subjectCode] || [];
      
      // Remove any existing selection of the same type (only one lecture and one lab)
      const filtered = current.filter(id => {
        const opt = options.find(o => o.id === id);
        return opt && opt.type !== type;
      });
      
      // Toggle the selected option
      if (current.includes(optionId)) {
        return { ...prev, [subjectCode]: filtered };
      } else {
        return { ...prev, [subjectCode]: [...filtered, optionId] };
      }
    });
  };

  const handleEnroll = async (subjectCode: string) => {
    setEnrolling(subjectCode);
    const token = localStorage.getItem("authToken");
    const selections = selectedTimeOptions[subjectCode] || [];
    
    try {
      const response = await fetch(`${API_BASE}/api/enrolment/enroll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          subject_code: subjectCode,
          time_option_ids: selections.length > 0 ? selections : undefined
        }),
      });

      if (response.ok) {
        // Reload subjects to update enrollment status
        loadSubjects();
        setShowTimeOptions(null);
        alert("Successfully enrolled in subject!");
      } else {
        const error = await response.json();
        alert(error.detail || "Failed to enroll");
      }
    } catch (error) {
      console.error("Enrollment error:", error);
      alert("Failed to enroll in subject");
    } finally {
      setEnrolling(null);
    }
  };

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.lecturer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1>Subjects</h1>
        <p className="text-muted-foreground">
          Browse and enroll in available subjects
        </p>
      </div>

      {/* Filters */}
      <Card className="shadow-md border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
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

                  {!subject.enrolled && (
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
                          <p className="text-sm font-medium">Choose your class times:</p>
                          
                          {/* Group by type */}
                          {['Lecture', 'Lab'].map(type => {
                            const options = timeOptions[subject.code].filter(opt => opt.type === type);
                            if (options.length === 0) return null;
                            
                            return (
                              <div key={type} className="space-y-2">
                                <p className="text-xs font-semibold text-muted-foreground">{type}:</p>
                                {options.map(option => {
                                  const isSelected = (selectedTimeOptions[subject.code] || []).includes(option.id);
                                  const isFull = option.available <= 0;
                                  
                                  return (
                                    <button
                                      key={option.id}
                                      onClick={() => !isFull && toggleTimeOptionSelection(subject.code, option.id, type)}
                                      disabled={isFull}
                                      className={`w-full text-left p-2 rounded border text-xs transition-colors ${
                                        isSelected
                                          ? 'bg-primary text-primary-foreground border-primary'
                                          : isFull
                                          ? 'bg-muted text-muted-foreground border-muted cursor-not-allowed'
                                          : 'hover:bg-accent border-border'
                                      }`}
                                    >
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <div className="font-medium">{option.option_name}</div>
                                          <div className="text-xs opacity-80">
                                            {option.day} {option.time} • {option.room}
                                          </div>
                                          <div className="text-xs opacity-80">{option.lecturer}</div>
                                        </div>
                                        <div className="text-xs">
                                          {isFull ? (
                                            <Badge variant="destructive" className="text-xs">Full</Badge>
                                          ) : (
                                            <span className="opacity-70">{option.available} left</span>
                                          )}
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  <Button 
                    className="w-full mt-2"
                    variant={subject.enrolled ? "secondary" : "default"}
                    disabled={subject.enrolled || enrolling === subject.code}
                    onClick={() => !subject.enrolled && handleEnroll(subject.code)}
                  >
                    {enrolling === subject.code ? "Enrolling..." : subject.enrolled ? "Enrolled" : "Enroll"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredSubjects.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No subjects found matching your filters.
        </div>
      )}
    </div>
  );
}
