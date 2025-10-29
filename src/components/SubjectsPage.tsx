import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Search, BookOpen, Users, Clock } from "lucide-react";
import { useEffect, useState } from "react";

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
};

export function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/api/subjects`)
      .then(res => res.json())
      .then(data => setSubjects(data))
      .catch(err => console.error("Failed to load subjects:", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1>Subjects</h1>
        <p className="text-muted-foreground">
          Browse and manage your course enrolments
        </p>
      </div>

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
        <Badge variant="secondary" className="px-4 py-2">
          {subjects.filter(s => s.enrolled).length} Enrolled
        </Badge>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading subjects...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredSubjects.map((subject) => (
            <Card key={subject.code} className="shadow-md border-0 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{subject.code}</Badge>
                      <Badge className="bg-accent text-accent-foreground">
                        {subject.credits} ECTS
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{subject.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {subject.lecturer}
                    </CardDescription>
                  </div>
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {subject.schedule}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {subject.students} students
                  </div>
                  <Button 
                    className="w-full mt-2"
                    variant={subject.enrolled ? "secondary" : "default"}
                    disabled={subject.enrolled}
                  >
                    {subject.enrolled ? "Enrolled" : "Enroll"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}