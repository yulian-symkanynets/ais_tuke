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
  BookOpen
} from "lucide-react";

export function ThesisPage() {
  const thesisInfo = {
    title: "Application of Machine Learning in Web Security Analysis",
    type: "Bachelor Thesis",
    status: "In Progress",
    supervisor: "Prof. Dr. Michael Brown",
    consultant: "Dr. Anna Johnson",
    department: "Department of Computers and Informatics",
    startDate: "September 1, 2025",
    submissionDeadline: "May 15, 2026",
    defenseDate: "June 20, 2026",
    progress: 45,
  };

  const milestones = [
    { 
      id: 1, 
      title: "Thesis Registration", 
      status: "completed", 
      date: "September 1, 2025",
      description: "Thesis topic approved and registered"
    },
    { 
      id: 2, 
      title: "Literature Review", 
      status: "completed", 
      date: "October 15, 2025",
      description: "Research and review of relevant literature"
    },
    { 
      id: 3, 
      title: "Research Methodology", 
      status: "in-progress", 
      date: "December 20, 2025",
      description: "Define research methods and approach"
    },
    { 
      id: 4, 
      title: "Implementation", 
      status: "pending", 
      date: "March 15, 2026",
      description: "Develop practical implementation"
    },
    { 
      id: 5, 
      title: "Final Draft Submission", 
      status: "pending", 
      date: "May 1, 2026",
      description: "Submit complete thesis draft"
    },
    { 
      id: 6, 
      title: "Thesis Defense", 
      status: "pending", 
      date: "June 20, 2026",
      description: "Oral defense presentation"
    },
  ];

  const documents = [
    { name: "Thesis Template.docx", size: "245 KB", uploaded: "Sep 1, 2025" },
    { name: "Literature Review.pdf", size: "1.2 MB", uploaded: "Oct 15, 2025" },
    { name: "Research Proposal.pdf", size: "890 KB", uploaded: "Sep 20, 2025" },
    { name: "Bibliography.bib", size: "45 KB", uploaded: "Oct 10, 2025" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case "in-progress":
        return <Badge className="bg-blue-600"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>;
      case "pending":
        return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Thesis</h1>
        <p className="text-muted-foreground">
          Manage your bachelor/master thesis and track your progress
        </p>
      </div>

      {/* Thesis Overview */}
      <Card className="shadow-md border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Thesis Overview</CardTitle>
            <Badge className="bg-blue-600">{thesisInfo.status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-primary mt-1" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Thesis Title</p>
                  <p className="font-medium">{thesisInfo.title}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-start gap-3">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{thesisInfo.type}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Supervisor</p>
                  <p className="font-medium">{thesisInfo.supervisor}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Consultant</p>
                  <p className="font-medium">{thesisInfo.consultant}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{thesisInfo.department}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Submission Deadline</p>
                  <p className="font-medium">{thesisInfo.submissionDeadline}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Defense Date</p>
                  <p className="font-medium">{thesisInfo.defenseDate}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm font-medium text-primary">{thesisInfo.progress}%</span>
              </div>
              <Progress value={thesisInfo.progress} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestones */}
      <Card className="shadow-md border-0">
        <CardHeader>
          <CardTitle>Milestones & Timeline</CardTitle>
          <CardDescription>Track your thesis progress through key milestones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {milestones.map((milestone, index) => (
              <div key={milestone.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`
                    h-8 w-8 rounded-full flex items-center justify-center
                    ${milestone.status === "completed" ? "bg-green-600" : ""}
                    ${milestone.status === "in-progress" ? "bg-blue-600" : ""}
                    ${milestone.status === "pending" ? "bg-muted" : ""}
                  `}>
                    {milestone.status === "completed" && <CheckCircle className="h-5 w-5 text-white" />}
                    {milestone.status === "in-progress" && <Clock className="h-5 w-5 text-white" />}
                    {milestone.status === "pending" && <div className="h-3 w-3 rounded-full bg-muted-foreground" />}
                  </div>
                  {index < milestones.length - 1 && (
                    <div className={`w-0.5 h-16 ${
                      milestone.status === "completed" ? "bg-green-600" : "bg-muted"
                    }`} />
                  )}
                </div>
                <div className="flex-1 pb-8">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium">{milestone.title}</h3>
                    {getStatusBadge(milestone.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{milestone.description}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {milestone.date}
                  </p>
                </div>
              </div>
            ))}
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
            {documents.map((doc, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.size} • Uploaded {doc.uploaded}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
