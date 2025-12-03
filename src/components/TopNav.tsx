import { useState, useEffect } from "react";
import { Bell, Moon, Sun, ChevronDown, Menu } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";

interface TopNavProps {
  onMenuClick: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  language: string;
  onToggleLanguage: () => void;
  onNavigate?: (section: string) => void;
}

export function TopNav({ 
  onMenuClick, 
  darkMode, 
  onToggleDarkMode,
  language,
  onToggleLanguage,
  onNavigate
}: TopNavProps) {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  
  const initials = user?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || user?.email[0].toUpperCase() || "U";

  useEffect(() => {
    fetchUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const data = await api.get<{ count: number }>("/api/notifications/unread-count");
      setUnreadCount(data.count);
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  };

  const handleNavigate = (section: string) => {
    if (onNavigate) {
      onNavigate(section);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="text-primary-foreground font-bold">T</span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-foreground">AIS TUKE</span>
              <span className="text-xs text-muted-foreground hidden sm:block">
                Academic Information System
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleLanguage}
            className="hidden sm:flex"
          >
            {language}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleDarkMode}
          >
            {darkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleNavigate("notifications")}
            >
              <Bell className="h-5 w-5" />
            </Button>
            {unreadCount > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                variant="destructive"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline">
                  {user?.full_name || user?.email || "User"}
                </span>
                <ChevronDown className="h-4 w-4 hidden md:inline" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{user?.full_name || "User"}</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    {user?.email}
                  </span>
                  <span className="text-xs text-muted-foreground font-normal capitalize">
                    {user?.role}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleNavigate("profile")}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleNavigate("settings")}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleNavigate("notifications")}>
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {unreadCount}
                  </Badge>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleNavigate("activity")}>
                Activity Log
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
