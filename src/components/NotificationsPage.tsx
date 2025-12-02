import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  Calendar,
  BookOpen,
  GraduationCap,
  Home,
  CreditCard
} from "lucide-react";
import { api } from "../lib/api";

interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.get<Notification[]>("/api/notifications/");
      setNotifications(data || []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.put(`/api/notifications/${id}/read`, {});
      await fetchNotifications();
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put("/api/notifications/read-all", {});
      await fetchNotifications();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "grade":
        return GraduationCap;
      case "enrolment":
        return CheckCircle2;
      case "schedule":
        return Calendar;
      case "deadline":
        return AlertCircle;
      case "material":
        return BookOpen;
      case "payment":
        return CreditCard;
      case "dormitory":
        return Home;
      default:
        return Info;
    }
  };

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
      case "payment":
        return "text-yellow-500";
      case "dormitory":
        return "text-teal-500";
      default:
        return "text-gray-500";
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        {notifications.length === 0 ? (
          <Card className="shadow-md border-0">
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No notifications yet</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => {
            const Icon = getIcon(notification.type);
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
                          {notification.created_at}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      {!notification.read && (
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="mt-2 px-0 h-auto"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          Mark as read
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
