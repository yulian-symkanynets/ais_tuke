import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Home, MapPin, Users, Wifi, Utensils, CheckCircle, XCircle, Clock } from "lucide-react";

export function DormitoryPage() {
  const currentApplication = {
    dormitory: "Jedlíkova Dormitory",
    room: "B-312",
    roomType: "Double Room",
    floor: 3,
    status: "Approved",
    moveInDate: "September 15, 2025",
    rent: "€120/month",
    deposit: "€240",
  };

  const availableDormitories = [
    {
      id: 1,
      name: "Jedlíkova Dormitory",
      address: "Jedlíkova 2, 042 00 Košice",
      distance: "5 min walk",
      rooms: 45,
      amenities: ["WiFi", "Kitchen", "Study Room", "Laundry"],
      rent: "€120/month",
      available: true,
    },
    {
      id: 2,
      name: "Park Dormitory",
      address: "Park Komenského 1, 042 00 Košice",
      distance: "8 min walk",
      rooms: 12,
      amenities: ["WiFi", "Kitchen", "Gym", "Parking"],
      rent: "€150/month",
      available: true,
    },
    {
      id: 3,
      name: "Medická Dormitory",
      address: "Medická 2, 040 01 Košice",
      distance: "12 min walk",
      rooms: 0,
      amenities: ["WiFi", "Kitchen", "Study Room"],
      rent: "€110/month",
      available: false,
    },
    {
      id: 4,
      name: "VŠ Campus Dormitory",
      address: "Boženy Němcovej 3, 040 01 Košice",
      distance: "15 min walk",
      rooms: 23,
      amenities: ["WiFi", "Kitchen", "Cafeteria", "Sports Hall"],
      rent: "€135/month",
      available: true,
    },
  ];

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
      <Card className="shadow-md border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your Current Application</CardTitle>
            <Badge className="bg-green-600">
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

      {/* Available Dormitories */}
      <div>
        <h2 className="mb-4">Available Dormitories</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {availableDormitories.map((dorm) => (
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
                      disabled={!dorm.available}
                    >
                      {dorm.available ? "Apply Now" : "Not Available"}
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
