import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Home, MapPin, Users, Wifi, Utensils, CheckCircle, Clock } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

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
}

export function DormitoryPage() {
  const { user } = useAuth();
  const [dormitories, setDormitories] = useState<Dormitory[]>([]);
  const [applications, setApplications] = useState<DormitoryApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const isStudent = user?.role === "student";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dormsData, appsData] = await Promise.all([
        api.get<Dormitory[]>("/api/dormitories/"),
        api.get<DormitoryApplication[]>("/api/dormitories/applications")
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
      await api.post("/api/dormitories/applications", {
        dormitory_id: dormitoryId,
        room_type: "Double Room"
      });
      await fetchData();
      alert("Application submitted successfully!");
    } catch (error: any) {
      alert(error.message || "Failed to submit application");
    }
  };

  const currentApplication = applications.find(a => a.status === "Approved" || a.status === "Pending");

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
              <Button variant="outline">Pay Rent</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Dormitories */}
      <div>
        <h2 className="mb-4">Available Dormitories</h2>
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
                    {isAvailable && (
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-green-600">
                          {dorm.available_rooms} rooms available
                        </span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {amenities.map((amenity) => (
                        <Badge key={amenity} variant="secondary" className="gap-1">
                          {getAmenityIcon(amenity)}
                          {amenity}
                        </Badge>
                      ))}
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-muted-foreground">Monthly rent</span>
                        <span className="font-semibold text-primary">€{dorm.monthly_rent}/month</span>
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
