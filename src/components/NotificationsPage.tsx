import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  Calendar,
  BookOpen,
  GraduationCap
} from "lucide-react";

export function NotificationsPage() {
  const notifications = [
    {
      id: 1,
      type: "grade",
      title: "New Grade Added",
      message: "Your grade for Data Structures has been published: A (1.0)",
      date: "2 hours ago",
      read: false,
      icon: GraduationCap,
    },
    {
      id: 2,
      type: "enrolment",
      title: "Enrolment Confirmed",
      message: "Your enrolment for Web Technologies has been confirmed",
      date: "1 day ago",
      read: false,
      icon: CheckCircle2,
    },
    {
      id: 3,
      type: "schedule",
      title: "Schedule Change",
      message: "Database Systems class moved to room PK6 C208",
      date: "2 days ago",
      read: true,
      icon: Calendar,
    },
    {
      id: 4,
      type: "info",
      title: "Exam Registration Open",
      message: "Registration for final exams is now open until October 20",
      date: "3 days ago",
      read: true,
      icon: Info,
    },
    {
      id: 5,
      type: "deadline",
      title: "Assignment Deadline",
      message: "Software Engineering project submission due in 5 days",
      date: "4 days ago",
      read: true,
      icon: AlertCircle,
    },
    {
      id: 6,
      type: "material",
      title: "New Study Material",
      message: "New lecture notes available for Database Systems",
      date: "5 days ago",
      read: true,
      icon: BookOpen,
    },
    {
      id: 7,
      type: "grade",
      title: "Grade Updated",
      message: "Your grade for Web Technologies has been updated: B (1.5)",
      date: "1 week ago",
      read: true,
      icon: GraduationCap,
    },
    {
      id: 8,
      type: "info",
      title: "System Maintenance",
      message: "AIS TUKE will be unavailable on Saturday from 2:00 AM to 6:00 AM",
      date: "1 week ago",
      read: true,
      icon: Info,
    },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case "grade":
        return "text-green-500";
      case "enrolment":
        return "text-blue-500";
      case "schedule":
        return "text-purple-500";
      case "deadline":
        return "text-red-500";
      case "material":
        return "text-orange-500";
      default:
        return "text-gray-500";
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with your academic activities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {unreadCount} unread
          </Badge>
          <Button variant="outline" size="sm">
            Mark all as read
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {notifications.map((notification) => {
          const Icon = notification.icon;
          return (
            <Card 
              key={notification.id} 
              className={`shadow-md border-0 transition-all hover:shadow-lg ${
                !notification.read ? "bg-accent/5 border-l-4 border-l-accent" : ""
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted flex-shrink-0 ${getTypeColor(notification.type)}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <h3 className="font-medium">{notification.title}</h3>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {notification.date}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    {!notification.read && (
                      <Button variant="link" size="sm" className="mt-2 px-0 h-auto">
                        Mark as read
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
  );
}