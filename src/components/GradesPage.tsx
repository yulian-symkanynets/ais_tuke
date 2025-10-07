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

export function GradesPage() {
  const grades = [
    {
      subject: "Data Structures and Algorithms",
      code: "ZADS",
      grade: "A",
      credits: 6,
      semester: "Winter 2025/26",
      date: "Oct 5, 2025",
      numericGrade: 1.0,
    },
    {
      subject: "Web Technologies",
      code: "WEBTECH",
      grade: "B",
      credits: 5,
      semester: "Winter 2025/26",
      date: "Oct 3, 2025",
      numericGrade: 1.5,
    },
    {
      subject: "Operating Systems",
      code: "OS",
      grade: "A",
      credits: 6,
      semester: "Summer 2024/25",
      date: "Jun 15, 2025",
      numericGrade: 1.0,
    },
    {
      subject: "Computer Networks",
      code: "CN",
      grade: "B",
      credits: 5,
      semester: "Summer 2024/25",
      date: "Jun 12, 2025",
      numericGrade: 2.0,
    },
    {
      subject: "Programming in Java",
      code: "JAVA",
      grade: "A",
      credits: 6,
      semester: "Winter 2024/25",
      date: "Jan 20, 2025",
      numericGrade: 1.0,
    },
    {
      subject: "Mathematics II",
      code: "MATH2",
      grade: "C",
      credits: 6,
      semester: "Winter 2024/25",
      date: "Jan 18, 2025",
      numericGrade: 2.5,
    },
  ];

  const getGradeBadgeVariant = (grade: string) => {
    if (grade === "A") return "default";
    if (grade === "B") return "secondary";
    return "outline";
  };

  const currentSemesterGrades = grades.filter(g => g.semester === "Winter 2025/26");
  const currentGPA = (
    currentSemesterGrades.reduce((sum, g) => sum + g.numericGrade, 0) /
    currentSemesterGrades.length
  ).toFixed(2);
  
  const totalCredits = grades.reduce((sum, g) => sum + g.credits, 0);
  const overallGPA = (
    grades.reduce((sum, g) => sum + g.numericGrade, 0) / grades.length
  ).toFixed(2);

  return (
    <div className="space-y-6">
      <div>
        <h1>Grades</h1>
        <p className="text-muted-foreground">
          View your academic performance and grades
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Overall GPA</CardTitle>
            <TrendingUp className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{overallGPA}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on {grades.length} subjects
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Current Semester GPA</CardTitle>
            <Award className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{currentGPA}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Winter 2025/26
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Total Credits</CardTitle>
            <Award className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{totalCredits}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ECTS credits earned
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md border-0">
        <CardHeader>
          <CardTitle>Grade History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead className="text-center">Credits</TableHead>
                  <TableHead className="text-center">Grade</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grades.map((grade, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{grade.subject}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{grade.code}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {grade.semester}
                    </TableCell>
                    <TableCell className="text-center">
                      {grade.credits}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={getGradeBadgeVariant(grade.grade)}
                        className="min-w-[40px] justify-center"
                      >
                        {grade.grade}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {grade.date}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}