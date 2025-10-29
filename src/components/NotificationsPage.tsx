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
import { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

type Notification = {
  id: number;
  type: string;
  message: string;
  time: string;
  read: boolean;
};

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/notifications`)
      .then(res => res.json())
      .then(data => setNotifications(data))
      .catch(err => console.error("Failed to load notifications:", err))
      .finally(() => setLoading(false));
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "grade": return GraduationCap;
      case "enrolment": return CheckCircle2;
      case "schedule": return Calendar;
      case "deadline": return AlertCircle;
      case "material": return BookOpen;
      default: return Info;
    }
  };

  const getTitle = (type: string) => {
    switch (type) {
      case "grade": return "Grade Notification";
      case "enrolment": return "Enrolment Update";
      case "info": return "Information";
      default: return "Notification";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1>Notifications</h1>
          <p className="text-muted-foreground">Loading notifications...</p>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;
  
  const notificationsWithIcons = notifications.map(notif => ({
    ...notif,
    title: getTitle(notif.type),
    date: notif.time,
    icon: getIcon(notif.type),
  }));

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
        {notificationsWithIcons.map((notification) => {
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