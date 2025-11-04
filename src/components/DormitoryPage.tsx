import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { 
  Home, MapPin, Users, Wifi, Utensils, CheckCircle, Clock, FileText, 
  Upload, Download, Search, Building, Phone, Mail, User, Plus, Edit,
  Calendar, Euro, BedDouble, Info
} from "lucide-react";
import { useState, useEffect } from "react";

const API_BASE = "http://127.0.0.1:8000";

type Dormitory = {
  id: number;
  name: string;
  address: string;
  distance: string;
  rooms: number;
  amenities: string[];
  rent: string;
  available: boolean;
  description?: string;
  roomTypes?: string;
  capacity?: number;
  managerName?: string;
  managerEmail?: string;
  managerPhone?: string;
};

type DormitoryApplication = {
  id?: number;
  dormitoryId?: number;
  dormitory: string;
  room: string;
  roomType: string;
  floor: number;
  status: string;
  moveInDate: string;
  rent: string;
  deposit: string;
  appliedDate?: string;
  notes?: string;
};

type DormitoryDocument = {
  id: number;
  name: string;
  type: string;
  size: string;
  uploaded: string;
  uploadedBy?: number;
  fileUrl?: string;
};

export function DormitoryPage() {
  const [activeTab, setActiveTab] = useState<"my-application" | "browse">("my-application");
  const [dormitories, setDormitories] = useState<Dormitory[]>([]);
  const [currentApplication, setCurrentApplication] = useState<DormitoryApplication | null>(null);
  const [documents, setDocuments] = useState<DormitoryDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDormId, setExpandedDormId] = useState<number | null>(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDormitory, setNewDormitory] = useState({
    name: "",
    address: "",
    distance: "",
    rooms: 0,
    rent: "",
    description: "",
    roomTypes: "Single Room,Double Room",
    capacity: 0,
    managerName: "",
    managerEmail: "",
    managerPhone: "",
    amenities: ["WiFi", "Kitchen"]
  });

  useEffect(() => {
    checkUserRole();
    fetchAvailableDormitories();
    fetchCurrentApplication();
  }, []);

  const checkUserRole = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setIsTeacher(data.role === "teacher");
      }
    } catch (error) {
      console.error("Failed to check user role:", error);
    }
  };

  const fetchAvailableDormitories = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      params.append("available_only", "false");

      const response = await fetch(`${API_BASE}/api/dormitory/available?${params}`);
      if (response.ok) {
        const data = await response.json();
        setDormitories(data);
      }
    } catch (error) {
      console.error("Failed to fetch dormitories:", error);
    }
  };

  const fetchCurrentApplication = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/dormitory/my-application`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentApplication(data);
        if (data.id) {
          fetchDocuments(data.id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch application:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async (applicationId: number) => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/api/dormitory/application/${applicationId}/documents`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    }
  };

  const handleApply = async (dormId: number, dormName: string) => {
    setApplying(dormId);
    const token = localStorage.getItem("authToken");
    
    try {
      const response = await fetch(`${API_BASE}/api/dormitory/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          dormitory_id: dormId,
          room_type: "Double Room",
        }),
      });

      if (response.ok) {
        alert(`Application for ${dormName} submitted successfully!`);
        fetchCurrentApplication();
        fetchAvailableDormitories();
        setActiveTab("my-application");
      } else {
        const error = await response.json();
        alert(error.detail || "Failed to apply");
      }
    } catch (error) {
      console.error("Application error:", error);
      alert("Failed to submit application");
    } finally {
      setApplying(null);
    }
  };

  const handleCreateDormitory = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");

    try {
      const response = await fetch(`${API_BASE}/api/dormitory/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(newDormitory),
      });

      if (response.ok) {
        alert("Dormitory created successfully!");
        setShowCreateForm(false);
        fetchAvailableDormitories();
        // Reset form
        setNewDormitory({
          name: "",
          address: "",
          distance: "",
          rooms: 0,
          rent: "",
          description: "",
          roomTypes: "Single Room,Double Room",
          capacity: 0,
          managerName: "",
          managerEmail: "",
          managerPhone: "",
          amenities: ["WiFi", "Kitchen"]
        });
      } else {
        const error = await response.json();
        alert(error.detail || "Failed to create dormitory");
      }
    } catch (error) {
      console.error("Creation error:", error);
      alert("Failed to create dormitory");
    }
  };

  const handleUploadDocument = async () => {
    if (!currentApplication?.id) return;

    const token = localStorage.getItem("authToken");
    const fileName = prompt("Enter document name (e.g., Passport.pdf):");
    if (!fileName) return;

    const docType = prompt("Enter document type (e.g., ID Document, Contract, Insurance):");
    if (!docType) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/dormitory/application/${currentApplication.id}/upload?name=${encodeURIComponent(fileName)}&doc_type=${encodeURIComponent(docType)}&size=123KB`,
        {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        }
      );

      if (response.ok) {
        alert("Document uploaded successfully!");
        fetchDocuments(currentApplication.id);
      } else {
        alert("Failed to upload document");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload document");
    }
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity) {
      case "WiFi":
        return <Wifi className="h-4 w-4" />;
      case "Kitchen":
      case "Cafeteria":
        return <Utensils className="h-4 w-4" />;
      case "Study Room":
        return <FileText className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === "approved") return <Badge className="bg-green-600">Approved</Badge>;
    if (statusLower === "pending") return <Badge className="bg-yellow-600">Pending</Badge>;
    return <Badge className="bg-gray-600">{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Dormitory Management</h1>
          <p className="text-muted-foreground">
            {isTeacher ? "Manage dormitories and view student applications" : "Manage your accommodation and explore available dormitories"}
          </p>
        </div>
        {isTeacher && (
          <Button onClick={() => setShowCreateForm(!showCreateForm)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Dormitory
          </Button>
        )}
      </div>

      {/* Create Dormitory Form (Teacher Only) */}
      {isTeacher && showCreateForm && (
        <Card className="shadow-md border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Create New Dormitory
            </CardTitle>
            <CardDescription>Add a new dormitory to the system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateDormitory} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Dormitory Name*</Label>
                  <Input
                    id="name"
                    value={newDormitory.name}
                    onChange={(e) => setNewDormitory({ ...newDormitory, name: e.target.value })}
                    placeholder="e.g., Park Dormitory"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address*</Label>
                  <Input
                    id="address"
                    value={newDormitory.address}
                    onChange={(e) => setNewDormitory({ ...newDormitory, address: e.target.value })}
                    placeholder="e.g., Park Komenského 1, Košice"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="distance">Distance to Campus*</Label>
                  <Input
                    id="distance"
                    value={newDormitory.distance}
                    onChange={(e) => setNewDormitory({ ...newDormitory, distance: e.target.value })}
                    placeholder="e.g., 8 min walk"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rent">Monthly Rent*</Label>
                  <Input
                    id="rent"
                    value={newDormitory.rent}
                    onChange={(e) => setNewDormitory({ ...newDormitory, rent: e.target.value })}
                    placeholder="e.g., €150/month"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rooms">Available Rooms*</Label>
                  <Input
                    id="rooms"
                    type="number"
                    value={newDormitory.rooms || ""}
                    onChange={(e) => setNewDormitory({ ...newDormitory, rooms: parseInt(e.target.value) || 0 })}
                    placeholder="e.g., 45"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Total Capacity*</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={newDormitory.capacity || ""}
                    onChange={(e) => setNewDormitory({ ...newDormitory, capacity: parseInt(e.target.value) || 0 })}
                    placeholder="e.g., 180"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="managerName">Manager Name*</Label>
                  <Input
                    id="managerName"
                    value={newDormitory.managerName}
                    onChange={(e) => setNewDormitory({ ...newDormitory, managerName: e.target.value })}
                    placeholder="e.g., John Smith"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="managerEmail">Manager Email*</Label>
                  <Input
                    id="managerEmail"
                    type="email"
                    value={newDormitory.managerEmail}
                    onChange={(e) => setNewDormitory({ ...newDormitory, managerEmail: e.target.value })}
                    placeholder="e.g., john.smith@tuke.sk"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="managerPhone">Manager Phone*</Label>
                  <Input
                    id="managerPhone"
                    value={newDormitory.managerPhone}
                    onChange={(e) => setNewDormitory({ ...newDormitory, managerPhone: e.target.value })}
                    placeholder="e.g., +421 55 602 4123"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roomTypes">Room Types* (comma separated)</Label>
                  <Input
                    id="roomTypes"
                    value={newDormitory.roomTypes}
                    onChange={(e) => setNewDormitory({ ...newDormitory, roomTypes: e.target.value })}
                    placeholder="e.g., Single Room,Double Room,Triple Room"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description*</Label>
                <Textarea
                  id="description"
                  value={newDormitory.description}
                  onChange={(e) => setNewDormitory({ ...newDormitory, description: e.target.value })}
                  placeholder="Detailed description of the dormitory, its facilities, and features..."
                  rows={4}
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Dormitory</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {!isTeacher && (
        <>
          {/* Tabs */}
          <div className="flex gap-2 border-b">
            <Button
              variant={activeTab === "my-application" ? "default" : "ghost"}
              onClick={() => setActiveTab("my-application")}
              className="rounded-b-none"
            >
              My Application
            </Button>
            <Button
              variant={activeTab === "browse" ? "default" : "ghost"}
              onClick={() => setActiveTab("browse")}
              className="rounded-b-none"
            >
              Browse Available Dormitories
            </Button>
          </div>

          {/* My Application Tab */}
          {activeTab === "my-application" && (
            <div className="space-y-6">
              {loading ? (
                <Card className="shadow-md border-0">
                  <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">Loading application...</div>
                  </CardContent>
                </Card>
              ) : currentApplication ? (
                <>
                  {/* Application Overview */}
                  <Card className="shadow-md border-0">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Home className="h-5 w-5" />
                          Your Dormitory Application
                        </CardTitle>
                        {getStatusBadge(currentApplication.status)}
                      </div>
                      <CardDescription>Application details and status</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div>
                          <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            Accommodation Details
                          </h3>
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-muted-foreground">Dormitory</p>
                              <p className="font-medium">{currentApplication.dormitory}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Room</p>
                              <p className="font-medium">{currentApplication.room} ({currentApplication.roomType})</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Floor</p>
                              <p className="font-medium">Floor {currentApplication.floor}</p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Euro className="h-4 w-4" />
                            Financial Details
                          </h3>
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-muted-foreground">Monthly Rent</p>
                              <p className="font-medium text-lg">{currentApplication.rent}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Security Deposit</p>
                              <p className="font-medium">{currentApplication.deposit}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Move-in Date</p>
                              <p className="font-medium flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {currentApplication.moveInDate}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {currentApplication.notes && (
                        <div className="border-t pt-4">
                          <p className="text-sm text-muted-foreground mb-2">Notes</p>
                          <p className="text-sm">{currentApplication.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Documents */}
                  <Card className="shadow-md border-0">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Documents
                          </CardTitle>
                          <CardDescription>Application documents and files</CardDescription>
                        </div>
                        <Button onClick={handleUploadDocument} className="gap-2">
                          <Upload className="h-4 w-4" />
                          Upload Document
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {documents.length > 0 ? (
                        <div className="space-y-2">
                          {documents.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-primary" />
                                <div>
                                  <p className="font-medium">{doc.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {doc.type} • {doc.size} • {doc.uploaded}
                                  </p>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" className="gap-2">
                                <Download className="h-4 w-4" />
                                Download
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No documents uploaded yet. Click "Upload Document" to add files.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="shadow-md border-0">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-3">
                      <Home className="h-12 w-12 mx-auto text-muted-foreground" />
                      <div>
                        <h3 className="font-semibold mb-1">No Active Application</h3>
                        <p className="text-sm text-muted-foreground">
                          You haven't applied for dormitory accommodation yet.
                        </p>
                      </div>
                      <Button onClick={() => setActiveTab("browse")}>
                        Browse Available Dormitories
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Browse Tab */}
          {activeTab === "browse" && (
            <div className="space-y-4">
              {/* Search */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, address, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button onClick={fetchAvailableDormitories}>Search</Button>
              </div>

              {/* Dormitories List */}
              <div className="grid gap-4 md:grid-cols-2">
                {dormitories.map((dorm) => (
                  <Card 
                    key={dorm.id} 
                    className={`shadow-md border-0 hover:shadow-lg transition-shadow ${
                      !dorm.available ? "opacity-60" : ""
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Home className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg">{dorm.name}</CardTitle>
                          </div>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {dorm.address}
                          </CardDescription>
                        </div>
                        {dorm.available ? (
                          <Badge className="bg-green-600">Available</Badge>
                        ) : (
                          <Badge variant="destructive">Full</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Distance to campus</span>
                          <span className="font-medium">{dorm.distance}</span>
                        </div>
                        
                        {dorm.available && (
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-green-600">{dorm.rooms} rooms available</span>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {dorm.amenities.map((amenity) => (
                            <Badge key={amenity} variant="secondary" className="gap-1">
                              {getAmenityIcon(amenity)}
                              {amenity}
                            </Badge>
                          ))}
                        </div>

                        {expandedDormId === dorm.id && dorm.description && (
                          <div className="border-t pt-3 mt-3">
                            <p className="text-sm text-muted-foreground mb-2 font-medium">Description</p>
                            <p className="text-sm">{dorm.description}</p>
                            {dorm.managerName && (
                              <div className="mt-3 space-y-2 text-sm">
                                <p className="font-medium flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  Contact Manager
                                </p>
                                <div className="pl-6 space-y-1 text-muted-foreground">
                                  <p className="flex items-center gap-2">
                                    <User className="h-3 w-3" />
                                    {dorm.managerName}
                                  </p>
                                  <p className="flex items-center gap-2">
                                    <Mail className="h-3 w-3" />
                                    {dorm.managerEmail}
                                  </p>
                                  <p className="flex items-center gap-2">
                                    <Phone className="h-3 w-3" />
                                    {dorm.managerPhone}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          onClick={() => setExpandedDormId(expandedDormId === dorm.id ? null : dorm.id)}
                        >
                          <Info className="h-4 w-4 mr-2" />
                          {expandedDormId === dorm.id ? "Hide Details" : "Show Details"}
                        </Button>

                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-muted-foreground">Monthly rent</span>
                            <span className="font-semibold text-primary">{dorm.rent}</span>
                          </div>
                          <Button 
                            className="w-full"
                            variant={dorm.available ? "default" : "secondary"}
                            disabled={!dorm.available || applying === dorm.id || !!currentApplication}
                            onClick={() => dorm.available && handleApply(dorm.id, dorm.name)}
                          >
                            {applying === dorm.id ? "Applying..." : currentApplication ? "Already Applied" : dorm.available ? "Apply Now" : "Not Available"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
