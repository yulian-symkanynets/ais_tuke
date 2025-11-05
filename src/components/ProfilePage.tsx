import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { User, Mail, Phone, MapPin, Calendar, GraduationCap } from "lucide-react";
import { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

type Student = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  year: number;
  program: string;
  gpa: number;
};

export function ProfilePage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/profile`)
      .then(res => res.json())
      .then(data => setStudent(data))
      .catch(err => console.error("Failed to load profile:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !student) {
    return (
      <div className="space-y-6">
        <div>
          <h1>Profile</h1>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  const initials = `${student.firstName[0]}${student.lastName[0]}`;

  return (
    <div className="space-y-6">
      <div>
        <h1>Profile</h1>
        <p className="text-muted-foreground">
          Manage your account information
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-md border-0 lg:col-span-1">
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <Avatar className="h-32 w-32">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" className="w-full">
              Change Photo
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-md border-0 lg:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your personal details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" defaultValue={student.firstName} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" defaultValue={student.lastName} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                defaultValue={student.email} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" defaultValue="+421 123 456 789" />
            </div>

            <Button className="mt-4">Save Changes</Button>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md border-0">
        <CardHeader>
          <CardTitle>Academic Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Program</p>
                <p className="mt-1">{student.program}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Student ID</p>
                <p className="mt-1">{student.studentId}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Year</p>
                <p className="mt-1">{student.year}rd Year</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Badge className="h-10 w-10 rounded-lg justify-center">GPA</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Grade Point Average</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Faculty</p>
                <p className="mt-1">Faculty of Electrical Engineering and Informatics</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Academic Status</p>
                <Badge className="mt-1 bg-green-500 text-white">Active</Badge>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Enrollment Date</p>
                <p className="mt-1">September 2023</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md border-0">
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>
            Manage your account preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p>Email Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive updates about grades and schedules
              </p>
            </div>
            <Button variant="outline">Configure</Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p>Change Password</p>
              <p className="text-sm text-muted-foreground">
                Update your account password
              </p>
            </div>
            <Button variant="outline">Change</Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p>Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security
              </p>
            </div>
            <Button variant="outline">Enable</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}