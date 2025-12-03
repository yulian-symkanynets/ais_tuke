import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { 
  Activity, 
  LogIn, 
  Key, 
  User, 
  Settings, 
  FileText, 
  Home,
  GraduationCap,
  Upload
} from "lucide-react";
import { api } from "../lib/api";

interface ActivityLog {
  id: number;
  user_id: number;
  action: string;
  details: string | null;
  ip_address: string | null;
  user_agent: string | null;
  timestamp: string;
}

export function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityLogs();
  }, []);

  const fetchActivityLogs = async () => {
    try {
      setLoading(true);
      const data = await api.get<ActivityLog[]>("/api/activity/me");
      setLogs(data || []);
    } catch (err) {
      console.error("Failed to fetch activity logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "login_success":
        return LogIn;
      case "password_changed":
        return Key;
      case "profile_updated":
        return User;
      case "settings_changed":
        return Settings;
      case "thesis_created":
        return FileText;
      case "dormitory_application":
        return Home;
      case "assignment_submitted":
        return Upload;
      case "grade_added":
        return GraduationCap;
      default:
        return Activity;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "login_success":
        return "Login";
      case "password_changed":
        return "Password Changed";
      case "profile_updated":
        return "Profile Updated";
      case "settings_changed":
        return "Settings Changed";
      case "thesis_created":
        return "Thesis Created";
      case "dormitory_application":
        return "Dormitory Application";
      case "assignment_submitted":
        return "Assignment Submitted";
      case "grade_added":
        return "Grade Added";
      default:
        return action.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "login_success":
        return "bg-green-600";
      case "password_changed":
        return "bg-orange-600";
      case "profile_updated":
        return "bg-blue-600";
      case "settings_changed":
        return "bg-purple-600";
      default:
        return "bg-gray-600";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const truncateUserAgent = (ua: string | null) => {
    if (!ua) return "Unknown";
    // Extract browser name
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari")) return "Safari";
    if (ua.includes("Edge")) return "Edge";
    return ua.substring(0, 30) + "...";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1>Activity Log</h1>
          <p className="text-muted-foreground">Loading activity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1>Activity Log</h1>
        <p className="text-muted-foreground">
          View your recent account activity and security events
        </p>
      </div>

      <Card className="shadow-md border-0">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your last {logs.length} account actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No activity recorded yet</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Browser</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const Icon = getActionIcon(log.action);
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <Badge className={getActionColor(log.action)}>
                              {getActionLabel(log.action)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-xs truncate">
                          {log.details || "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {log.ip_address || "Unknown"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {truncateUserAgent(log.user_agent)}
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {formatTimestamp(log.timestamp)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

