import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Search, BookOpen, Users, Clock } from "lucide-react";

export function SubjectsPage() {
  const subjects = [
    {
      code: "ZADS",
      name: "Data Structures and Algorithms",
      credits: 6,
      semester: "Winter",
      enrolled: true,
      students: 145,
      lecturer: "Prof. John Smith",
      schedule: "Mon, Wed 08:00-09:40",
    },
    {
      code: "WEBTECH",
      name: "Web Technologies",
      credits: 5,
      semester: "Winter",
      enrolled: true,
      students: 132,
      lecturer: "Dr. Anna Johnson",
      schedule: "Mon, Thu 10:00-11:40",
    },
    {
      code: "DBS",
      name: "Database Systems",
      credits: 6,
      semester: "Winter",
      enrolled: true,
      students: 128,
      lecturer: "Prof. Michael Brown",
      schedule: "Tue 13:00-14:40",
    },
    {
      code: "SE",
      name: "Software Engineering",
      credits: 6,
      semester: "Winter",
      enrolled: true,
      students: 156,
      lecturer: "Dr. Sarah Wilson",
      schedule: "Wed 08:00-09:40",
    },
    {
      code: "AI",
      name: "Artificial Intelligence",
      credits: 6,
      semester: "Winter",
      enrolled: false,
      students: 98,
      lecturer: "Prof. David Lee",
      schedule: "Fri 10:00-11:40",
    },
    {
      code: "MOBILE",
      name: "Mobile Application Development",
      credits: 5,
      semester: "Winter",
      enrolled: false,
      students: 87,
      lecturer: "Dr. Emily Davis",
      schedule: "Thu 13:00-14:40",
    },
  ];

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
          />
        </div>
        <Badge variant="secondary" className="px-4 py-2">
          {subjects.filter(s => s.enrolled).length} Enrolled
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {subjects.map((subject) => (
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
    </div>
  );
}