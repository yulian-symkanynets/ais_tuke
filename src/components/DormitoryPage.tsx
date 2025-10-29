import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Home, MapPin, Users, Wifi, Utensils, CheckCircle, XCircle, Clock } from "lucide-react";
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
};

type DormitoryApplication = {
  dormitory: string;
  room: string;
  roomType: string;
  floor: number;
  status: string;
  moveInDate: string;
  rent: string;
  deposit: string;
};

export function DormitoryPage() {
  const [dormitories, setDormitories] = useState<Dormitory[]>([]);
  const [currentApplication, setCurrentApplication] = useState<DormitoryApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<number | null>(null);

  useEffect(() => {
    fetchDormitories();
    fetchCurrentApplication();
  }, []);

  const fetchDormitories = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/dormitory/list`);
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
      const response = await fetch(`${API_BASE}/api/dormitory/application`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentApplication(data);
      }
    } catch (error) {
      console.error("Failed to fetch application:", error);
    } finally {
      setLoading(false);
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
        fetchDormitories();
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

  const getAmenityIcon = (amenity: string) => {
    switch (amenity) {
      case "WiFi":
        return <Wifi className="h-4 w-4" />;
      case "Kitchen":
      case "Cafeteria":
        return <Utensils className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Dormitory</h1>
        <p className="text-muted-foreground">
          Manage your accommodation and explore available dormitories
        </p>
      </div>

      {/* Current Application Status */}
      {currentApplication && (
        <Card className="shadow-md border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Your Current Application</CardTitle>
              <Badge className={currentApplication.status === "Approved" ? "bg-green-600" : currentApplication.status === "Pending" ? "bg-yellow-600" : "bg-gray-600"}>
                {currentApplication.status}
              </Badge>
            </div>
            <CardDescription>Active accommodation details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Dormitory</p>
                <p className="font-medium">{currentApplication.dormitory}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Room</p>
                <p className="font-medium">{currentApplication.room} ({currentApplication.roomType})</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Move-in Date</p>
                <p className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {currentApplication.moveInDate}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Rent</p>
                <p className="font-medium">{currentApplication.rent}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <Button variant="outline">View Contract</Button>
              <Button variant="outline">Pay Rent</Button>
              <Button variant="destructive">Cancel Application</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && !currentApplication && (
        <Card className="shadow-md border-0">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">Loading application status...</div>
          </CardContent>
        </Card>
      )}

      {/* Available Dormitories */}
      <div>
        <h2 className="mb-4">Available Dormitories</h2>
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

                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-muted-foreground">Monthly rent</span>
                      <span className="font-semibold text-primary">{dorm.rent}</span>
                    </div>
                    <Button 
                      className="w-full"
                      variant={dorm.available ? "default" : "secondary"}
                      disabled={!dorm.available || applying === dorm.id}
                      onClick={() => dorm.available && handleApply(dorm.id, dorm.name)}
                    >
                      {applying === dorm.id ? "Applying..." : dorm.available ? "Apply Now" : "Not Available"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
