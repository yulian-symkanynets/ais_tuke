import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { 
  Home, 
  MapPin, 
  Users, 
  Wifi, 
  Utensils, 
  CheckCircle, 
  Clock, 
  Plus, 
  Trash2,
  Building,
  DollarSign
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

interface Dormitory {
  id: number;
  name: string;
  address: string;
  available_rooms: number;
  total_rooms: number;
  monthly_rent: number;
  amenities?: string;
  is_active: boolean;
}

interface DormitoryApplication {
  id: number;
  student_id: number;
  dormitory_id: number;
  status: string;
  room_number?: string;
  room_type?: string;
  move_in_date?: string;
  deposit_paid: boolean;
  created_at?: string;
  dormitory_name?: string;
  student_name?: string;
}

export function DormitoryPage() {
  const { user } = useAuth();
  const [dormitories, setDormitories] = useState<Dormitory[]>([]);
  const [applications, setApplications] = useState<DormitoryApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newDormitory, setNewDormitory] = useState({
    name: "",
    address: "",
    available_rooms: 50,
    total_rooms: 100,
    monthly_rent: 150,
    amenities: "WiFi, Laundry, Kitchen",
  });

  const isStudent = user?.role === "student";
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dormsData, appsData] = await Promise.all([
        api.get<Dormitory[]>("/api/dormitories/"),
        api.get<DormitoryApplication[]>("/api/dormitories/applications/")
      ]);
      setDormitories(dormsData || []);
      setApplications(appsData || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (dormitoryId: number) => {
    try {
      setError("");
      await api.post("/api/dormitories/applications/", {
        dormitory_id: dormitoryId,
        room_type: "Double Room"
      });
      await fetchData();
      setSuccess("Application submitted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      setError(error.message || "Failed to submit application");
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleCreateDormitory = async () => {
    setError("");
    setSuccess("");

    if (!newDormitory.name.trim()) {
      setError("Please enter a dormitory name");
      return;
    }
    if (!newDormitory.address.trim()) {
      setError("Please enter an address");
      return;
    }

    setCreating(true);
    try {
      const payload = {
        name: newDormitory.name.trim(),
        address: newDormitory.address.trim(),
        available_rooms: newDormitory.available_rooms,
        total_rooms: newDormitory.total_rooms,
        monthly_rent: newDormitory.monthly_rent,
        amenities: newDormitory.amenities?.trim() || null,
      };

      console.log("Creating dormitory with payload:", payload);
      await api.post("/api/dormitories/", payload);
      
      setIsDialogOpen(false);
      setNewDormitory({
        name: "",
        address: "",
        available_rooms: 50,
        total_rooms: 100,
        monthly_rent: 150,
        amenities: "WiFi, Laundry, Kitchen",
      });
      await fetchData();
      setSuccess("Dormitory created successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      console.error("Error creating dormitory:", error);
      setError(error.message || "Failed to create dormitory");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteDormitory = async (dormitoryId: number) => {
    if (!confirm("Are you sure you want to delete this dormitory? All applications will also be deleted.")) {
      return;
    }

    try {
      setError("");
      await api.delete(`/api/dormitories/${dormitoryId}`);
      await fetchData();
      setSuccess("Dormitory deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      setError(error.message || "Failed to delete dormitory");
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleUpdateApplicationStatus = async (applicationId: number, newStatus: string) => {
    try {
      setError("");
      await api.put(`/api/dormitories/applications/${applicationId}`, {
        status: newStatus
      });
      await fetchData();
      setSuccess(`Application ${newStatus.toLowerCase()} successfully!`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      setError(error.message || "Failed to update application");
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleCancelApplication = async (applicationId: number) => {
    if (!confirm("Are you sure you want to cancel this application?")) return;
    
    try {
      setError("");
      await api.delete(`/api/dormitories/applications/${applicationId}`);
      await fetchData();
      setSuccess("Application cancelled successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      setError(error.message || "Failed to cancel application");
      setTimeout(() => setError(""), 5000);
    }
  };

  const currentApplication = applications.find(a => a.status === "Approved" || a.status === "Pending");

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case "wifi":
        return <Wifi className="h-4 w-4" />;
      case "kitchen":
      case "cafeteria":
        return <Utensils className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const parseAmenities = (amenities?: string): string[] => {
    if (!amenities) return [];
    return amenities.split(",").map(a => a.trim());
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1>Dormitory</h1>
          <p className="text-muted-foreground">Loading dormitories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
      <div>
        <h1>Dormitory</h1>
        <p className="text-muted-foreground">
            {isAdmin 
              ? "Manage dormitories and student applications"
              : "Manage your accommodation and explore available dormitories"}
          </p>
        </div>
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Dormitory
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Dormitory</DialogTitle>
                <DialogDescription>
                  Add a new dormitory to the system
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {error && (
                  <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Dormitory Name *</Label>
                  <Input
                    value={newDormitory.name}
                    onChange={(e) => setNewDormitory({ ...newDormitory, name: e.target.value })}
                    placeholder="e.g., Student Residence A"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Address *</Label>
                  <Input
                    value={newDormitory.address}
                    onChange={(e) => setNewDormitory({ ...newDormitory, address: e.target.value })}
                    placeholder="e.g., Vysokoškolská 4, Košice"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Total Rooms</Label>
                    <Input
                      type="number"
                      min="1"
                      value={newDormitory.total_rooms}
                      onChange={(e) => setNewDormitory({ 
                        ...newDormitory, 
                        total_rooms: parseInt(e.target.value) || 0 
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Available Rooms</Label>
                    <Input
                      type="number"
                      min="0"
                      value={newDormitory.available_rooms}
                      onChange={(e) => setNewDormitory({ 
                        ...newDormitory, 
                        available_rooms: parseInt(e.target.value) || 0 
                      })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Monthly Rent (€)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newDormitory.monthly_rent}
                    onChange={(e) => setNewDormitory({ 
                      ...newDormitory, 
                      monthly_rent: parseFloat(e.target.value) || 0 
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amenities (comma-separated)</Label>
                  <Input
                    value={newDormitory.amenities}
                    onChange={(e) => setNewDormitory({ ...newDormitory, amenities: e.target.value })}
                    placeholder="WiFi, Laundry, Kitchen, Gym"
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
                <Button onClick={handleCreateDormitory} disabled={creating}>
                  {creating ? "Creating..." : "Create Dormitory"}
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

      {/* Admin: All Applications */}
      {isAdmin && applications.length > 0 && (
        <Card className="shadow-md border-0">
          <CardHeader>
            <CardTitle>All Applications</CardTitle>
            <CardDescription>Manage student dormitory applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {applications.map((app) => (
                <div key={app.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <p className="font-medium">{app.student_name || `Student #${app.student_id}`}</p>
                    <p className="text-sm text-muted-foreground">
                      {app.dormitory_name} • {app.room_type || "Double Room"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={
                      app.status === "Approved" ? "bg-green-600" : 
                      app.status === "Rejected" ? "bg-red-600" : 
                      "bg-orange-600"
                    }>
                      {app.status}
                    </Badge>
                    {app.status === "Pending" && (
                      <>
                        <Button 
                          size="sm" 
                          onClick={() => handleUpdateApplicationStatus(app.id, "Approved")}
                        >
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleUpdateApplicationStatus(app.id, "Rejected")}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Application Status (for students) */}
      {isStudent && currentApplication && (
      <Card className="shadow-md border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your Current Application</CardTitle>
              <Badge className={currentApplication.status === "Approved" ? "bg-green-600" : "bg-orange-600"}>
              {currentApplication.status}
            </Badge>
          </div>
          <CardDescription>Active accommodation details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Dormitory</p>
                <p className="font-medium">{currentApplication.dormitory_name || "Unknown"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Room</p>
                <p className="font-medium">
                  {currentApplication.room_number || "TBD"} ({currentApplication.room_type || "Double Room"})
                </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Move-in Date</p>
              <p className="font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                  {currentApplication.move_in_date 
                    ? new Date(currentApplication.move_in_date).toLocaleDateString() 
                    : "TBD"}
              </p>
            </div>
            <div>
                <p className="text-sm text-muted-foreground">Deposit</p>
                <p className="font-medium">
                  {currentApplication.deposit_paid ? "Paid" : "Pending"}
                </p>
              </div>
          </div>
          <div className="mt-4 flex gap-3">
            <Button variant="outline">View Contract</Button>
              {currentApplication.status === "Pending" && (
                <Button 
                  variant="destructive" 
                  onClick={() => handleCancelApplication(currentApplication.id)}
                >
                  Cancel Application
                </Button>
              )}
          </div>
        </CardContent>
      </Card>
      )}

      {/* Available Dormitories */}
      <div>
        <h2 className="mb-4">Available Dormitories</h2>
        {dormitories.length === 0 ? (
          <Card className="shadow-md border-0">
            <CardContent className="p-8 text-center">
              <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No dormitories available yet.
              </p>
              {isAdmin && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Dormitory
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
        <div className="grid gap-4 md:grid-cols-2">
            {dormitories.map((dorm) => {
              const amenities = parseAmenities(dorm.amenities);
              const isAvailable = dorm.available_rooms > 0;
              const hasApplied = applications.some(a => a.dormitory_id === dorm.id);
              
              return (
            <Card 
              key={dorm.id} 
              className={`shadow-md border-0 hover:shadow-lg transition-shadow ${
                    !isAvailable ? "opacity-60" : ""
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
                      {isAvailable ? (
                    <Badge className="bg-green-600">Available</Badge>
                  ) : (
                    <Badge variant="destructive">Full</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                        <span className={isAvailable ? "font-medium text-green-600" : "text-muted-foreground"}>
                          {dorm.available_rooms} / {dorm.total_rooms} rooms available
                        </span>
                    </div>

                      {amenities.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                          {amenities.map((amenity) => (
                      <Badge key={amenity} variant="secondary" className="gap-1">
                        {getAmenityIcon(amenity)}
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                      )}

                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-muted-foreground">Monthly rent</span>
                          <span className="font-semibold text-primary flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            €{dorm.monthly_rent}/month
                          </span>
                    </div>
                        
                        {isStudent && (
                          <Button 
                            className="w-full"
                            variant={isAvailable && !hasApplied ? "default" : "secondary"}
                            disabled={!isAvailable || hasApplied}
                            onClick={() => handleApply(dorm.id)}
                          >
                            {hasApplied ? "Applied" : isAvailable ? "Apply Now" : "Not Available"}
                          </Button>
                        )}
                        
                        {isAdmin && (
                    <Button 
                      className="w-full"
                            variant="destructive"
                            onClick={() => handleDeleteDormitory(dorm.id)}
                    >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Dormitory
                    </Button>
                        )}
                  </div>
                </div>
              </CardContent>
            </Card>
              );
            })}
        </div>
        )}
      </div>
    </div>
  );
}
