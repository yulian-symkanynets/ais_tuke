import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./ui/dialog";
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
  Search,
  Plus,
  Eye,
  Filter
} from "lucide-react";
import { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

type Thesis = {
  id: number;
  studentId?: number;
  title: string;
  type: string;
  status: string;
  supervisor: string;
  supervisorEmail?: string;
  consultant?: string;
  department: string;
  description?: string;
  startDate?: string;
  submissionDeadline?: string;
  defenseDate?: string;
  progress: number;
  isAvailable: boolean;
};

type ThesisMilestone = {
  id: number;
  title: string;
  status: string;
  date: string;
  description: string;
};

type ThesisDocument = {
  id: number;
  name: string;
  size: string;
  uploaded: string;
  uploadedBy?: number;
  fileUrl?: string;
};

export function ThesisPage() {
  const [myThesis, setMyThesis] = useState<Thesis | null>(null);
  const [availableTheses, setAvailableTheses] = useState<Thesis[]>([]);
  const [milestones, setMilestones] = useState<ThesisMilestone[]>([]);
  const [documents, setDocuments] = useState<ThesisDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-thesis' | 'browse'>('my-thesis');
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSupervisor, setFilterSupervisor] = useState('');
  
  // Create thesis form states (for teachers)
  const [isTeacher, setIsTeacher] = useState(false);
  const [createThesisOpen, setCreateThesisOpen] = useState(false);
  const [newThesis, setNewThesis] = useState({
    title: '',
    type: 'Bachelor Thesis',
    supervisor: '',
    supervisorEmail: '',
    consultant: '',
    department: 'Department of Computers and Informatics',
    description: ''
  });
  
  // Upload document states
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFileSize, setUploadFileSize] = useState('');
  
  // View thesis details
  const [selectedThesis, setSelectedThesis] = useState<Thesis | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const loadMyThesis = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/thesis/my-thesis`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setMyThesis(data);
        
        if (data) {
          // Load milestones and documents
          const [milestonesRes, docsRes] = await Promise.all([
            fetch(`${API_BASE}/api/thesis/${data.id}/milestones`, { headers: getAuthHeaders() }),
            fetch(`${API_BASE}/api/thesis/${data.id}/documents`, { headers: getAuthHeaders() })
          ]);
          
          if (milestonesRes.ok) setMilestones(await milestonesRes.json());
          if (docsRes.ok) setDocuments(await docsRes.json());
        }
      }
    } catch (err) {
      console.error("Failed to load thesis:", err);
    }
  };

  const loadAvailableTheses = async () => {
    try {
      let url = `${API_BASE}/api/thesis/available?`;
      if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}&`;
      if (filterType !== 'all') url += `type=${encodeURIComponent(filterType)}&`;
      if (filterSupervisor) url += `supervisor=${encodeURIComponent(filterSupervisor)}&`;
      
      const response = await fetch(url, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setAvailableTheses(data);
      }
    } catch (err) {
      console.error("Failed to load available theses:", err);
    }
  };

  const checkIfTeacher = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setIsTeacher(data.role === 'teacher');
      }
    } catch (err) {
      console.error("Failed to check user role:", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadMyThesis(), loadAvailableTheses(), checkIfTeacher()]);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'browse') {
      loadAvailableTheses();
    }
  }, [searchTerm, filterType, filterSupervisor, activeTab]);

  const handleAssignThesis = async (thesisId: number) => {
    try {
      const response = await fetch(`${API_BASE}/api/thesis/assign`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ thesis_id: thesisId })
      });
      
      if (response.ok) {
        alert('Thesis assigned successfully!');
        await loadMyThesis();
        await loadAvailableTheses();
        setActiveTab('my-thesis');
      } else {
        const error = await response.json();
        alert(`Failed to assign thesis: ${error.detail}`);
      }
    } catch (err) {
      console.error("Failed to assign thesis:", err);
      alert('Failed to assign thesis');
    }
  };

  const handleCreateThesis = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/thesis/create`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newThesis)
      });
      
      if (response.ok) {
        alert('Thesis created successfully!');
        setCreateThesisOpen(false);
        setNewThesis({
          title: '',
          type: 'Bachelor Thesis',
          supervisor: '',
          supervisorEmail: '',
          consultant: '',
          department: 'Department of Computers and Informatics',
          description: ''
        });
        await loadAvailableTheses();
      } else {
        const error = await response.json();
        alert(`Failed to create thesis: ${error.detail}`);
      }
    } catch (err) {
      console.error("Failed to create thesis:", err);
      alert('Failed to create thesis');
    }
  };

  const handleUploadDocument = async () => {
    if (!myThesis || !uploadFileName || !uploadFileSize) {
      alert('Please fill in all fields');
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/api/thesis/${myThesis.id}/upload`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          thesis_id: myThesis.id,
          name: uploadFileName,
          size: uploadFileSize
        })
      });
      
      if (response.ok) {
        alert('Document uploaded successfully!');
        setUploadOpen(false);
        setUploadFileName('');
        setUploadFileSize('');
        
        // Reload documents
        const docsRes = await fetch(`${API_BASE}/api/thesis/${myThesis.id}/documents`, {
          headers: getAuthHeaders()
        });
        if (docsRes.ok) setDocuments(await docsRes.json());
      } else {
        const error = await response.json();
        alert(`Failed to upload document: ${error.detail}`);
      }
    } catch (err) {
      console.error("Failed to upload document:", err);
      alert('Failed to upload document');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case "in-progress":
        return <Badge className="bg-blue-600"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>;
      case "pending":
        return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Pending</Badge>;
      case "Available":
        return <Badge className="bg-green-600">Available</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1>Thesis Management</h1>
          <p className="text-muted-foreground">Loading thesis information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Thesis Management</h1>
          <p className="text-muted-foreground">
            {isTeacher ? "Manage thesis topics and supervise students" : "Browse available topics and manage your thesis"}
          </p>
        </div>
        {isTeacher && (
          <Dialog open={createThesisOpen} onOpenChange={setCreateThesisOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Thesis Topic
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Thesis Topic</DialogTitle>
                <DialogDescription>
                  Add a new thesis topic for students to browse and assign
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={newThesis.title}
                    onChange={(e) => setNewThesis({...newThesis, title: e.target.value})}
                    placeholder="Enter thesis title"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type *</Label>
                    <Select value={newThesis.type} onValueChange={(value) => setNewThesis({...newThesis, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bachelor Thesis">Bachelor Thesis</SelectItem>
                        <SelectItem value="Master Thesis">Master Thesis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Department *</Label>
                    <Input
                      value={newThesis.department}
                      onChange={(e) => setNewThesis({...newThesis, department: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Supervisor *</Label>
                    <Input
                      value={newThesis.supervisor}
                      onChange={(e) => setNewThesis({...newThesis, supervisor: e.target.value})}
                      placeholder="e.g., Prof. Dr. John Smith"
                    />
                  </div>
                  <div>
                    <Label>Supervisor Email *</Label>
                    <Input
                      type="email"
                      value={newThesis.supervisorEmail}
                      onChange={(e) => setNewThesis({...newThesis, supervisorEmail: e.target.value})}
                      placeholder="john.smith@tuke.sk"
                    />
                  </div>
                </div>
                <div>
                  <Label>Consultant (Optional)</Label>
                  <Input
                    value={newThesis.consultant}
                    onChange={(e) => setNewThesis({...newThesis, consultant: e.target.value})}
                    placeholder="e.g., Dr. Jane Doe"
                  />
                </div>
                <div>
                  <Label>Description *</Label>
                  <Textarea
                    value={newThesis.description}
                    onChange={(e) => setNewThesis({...newThesis, description: e.target.value})}
                    placeholder="Describe the thesis topic, objectives, and requirements..."
                    rows={6}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateThesisOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateThesis}>Create Thesis</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === 'my-thesis' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('my-thesis')}
          className="rounded-b-none"
        >
          My Thesis
        </Button>
        <Button
          variant={activeTab === 'browse' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('browse')}
          className="rounded-b-none"
        >
          Browse Available Topics
        </Button>
      </div>

      {activeTab === 'my-thesis' && (
        <>
          {myThesis ? (
            <>
              {/* Thesis Overview */}
              <Card className="shadow-md border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Thesis Overview</CardTitle>
                    {getStatusBadge(myThesis.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-primary mt-1" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Thesis Title</p>
                          <p className="font-medium">{myThesis.title}</p>
                        </div>
                      </div>
                    </div>

                    {myThesis.description && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Description</p>
                          <p className="text-sm">{myThesis.description}</p>
                        </div>
                      </>
                    )}

                    <Separator />

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <div className="flex items-start gap-3">
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Type</p>
                          <p className="font-medium">{myThesis.type}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Supervisor</p>
                          <p className="font-medium">{myThesis.supervisor}</p>
                        </div>
                      </div>

                      {myThesis.consultant && (
                        <div className="flex items-start gap-3">
                          <User className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Consultant</p>
                            <p className="font-medium">{myThesis.consultant}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-3">
                        <Building className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Department</p>
                          <p className="font-medium">{myThesis.department}</p>
                        </div>
                      </div>

                      {myThesis.submissionDeadline && (
                        <div className="flex items-start gap-3">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Submission Deadline</p>
                            <p className="font-medium">{myThesis.submissionDeadline}</p>
                          </div>
                        </div>
                      )}

                      {myThesis.defenseDate && (
                        <div className="flex items-start gap-3">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Defense Date</p>
                            <p className="font-medium">{myThesis.defenseDate}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Overall Progress</span>
                        <span className="text-sm font-medium text-primary">{myThesis.progress}%</span>
                      </div>
                      <Progress value={myThesis.progress} className="h-2" />
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
                    <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Upload Document</DialogTitle>
                          <DialogDescription>
                            Upload a thesis-related document (simulated)
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>File Name</Label>
                            <Input
                              value={uploadFileName}
                              onChange={(e) => setUploadFileName(e.target.value)}
                              placeholder="e.g., Chapter1.pdf"
                            />
                          </div>
                          <div>
                            <Label>File Size</Label>
                            <Input
                              value={uploadFileSize}
                              onChange={(e) => setUploadFileSize(e.target.value)}
                              placeholder="e.g., 1.5 MB"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
                          <Button onClick={handleUploadDocument}>Upload</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {documents.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No documents uploaded yet
                      </p>
                    ) : (
                      documents.map((doc) => (
                        <div 
                          key={doc.id}
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
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="shadow-md border-0">
              <CardContent className="py-12 text-center">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Thesis Assigned</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You don't have a thesis assigned yet. Browse available topics and assign one to get started.
                </p>
                <Button onClick={() => setActiveTab('browse')}>
                  Browse Available Topics
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {activeTab === 'browse' && (
        <>
          {/* Search and Filters */}
          <Card className="shadow-md border-0">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-10"
                        placeholder="Search by title, description, or supervisor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[200px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Bachelor Thesis">Bachelor Thesis</SelectItem>
                      <SelectItem value="Master Thesis">Master Thesis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Theses List */}
          <div className="grid gap-6 md:grid-cols-2">
            {availableTheses.length === 0 ? (
              <Card className="shadow-md border-0 md:col-span-2">
                <CardContent className="py-12 text-center">
                  <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Theses Found</h3>
                  <p className="text-sm text-muted-foreground">
                    No available thesis topics match your search criteria.
                  </p>
                </CardContent>
              </Card>
            ) : (
              availableTheses.map((thesis) => (
                <Card key={thesis.id} className="shadow-md border-0 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg leading-tight mb-2">{thesis.title}</CardTitle>
                        <div className="flex gap-2 flex-wrap">
                          <Badge className="bg-blue-600">{thesis.type}</Badge>
                          {getStatusBadge(thesis.status)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {thesis.description && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {thesis.description}
                        </p>
                      )}
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{thesis.supervisor}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{thesis.department}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => setSelectedThesis(thesis)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>{thesis.title}</DialogTitle>
                              <div className="flex gap-2 mt-2">
                                <Badge className="bg-blue-600">{thesis.type}</Badge>
                                {getStatusBadge(thesis.status)}
                              </div>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium mb-2">Description</h4>
                                <p className="text-sm text-muted-foreground">
                                  {thesis.description || "No description provided"}
                                </p>
                              </div>
                              <Separator />
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">Supervisor</p>
                                  <p className="font-medium">{thesis.supervisor}</p>
                                  {thesis.supervisorEmail && (
                                    <p className="text-xs text-muted-foreground">{thesis.supervisorEmail}</p>
                                  )}
                                </div>
                                {thesis.consultant && (
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-1">Consultant</p>
                                    <p className="font-medium">{thesis.consultant}</p>
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">Department</p>
                                  <p className="font-medium">{thesis.department}</p>
                                </div>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button onClick={() => handleAssignThesis(thesis.id)} disabled={!!myThesis}>
                                {myThesis ? "Already Have Thesis" : "Assign to Me"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button 
                          className="flex-1"
                          onClick={() => handleAssignThesis(thesis.id)}
                          disabled={!!myThesis}
                        >
                          {myThesis ? "Already Assigned" : "Assign to Me"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
