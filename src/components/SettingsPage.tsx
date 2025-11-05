import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { 
  Bell, 
  Moon, 
  Globe, 
  Lock,
  Mail,
  Smartphone
} from "lucide-react";
import { useState, useEffect } from "react";

const API_BASE = "http://127.0.0.1:8000";

type SettingsPageProps = {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  language: string;
  onToggleLanguage: () => void;
};

export function SettingsPage({ darkMode, onToggleDarkMode, language, onToggleLanguage }: SettingsPageProps) {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    gradeNotifications: true,
    scheduleNotifications: true,
    pushNotifications: false,
  });
  const [loading, setLoading] = useState(false);

  const handleToggle = async (key: string, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    // Save to backend
    const token = localStorage.getItem("authToken");
    if (token) {
      try {
        await fetch(`${API_BASE}/api/settings/update`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            [key]: value.toString(),
            darkMode: darkMode.toString(),
            language: language,
          }),
        });
      } catch (error) {
        console.error("Failed to save settings:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Settings</h1>
        <p className="text-muted-foreground">
          Manage your preferences and account settings
        </p>
      </div>

      <Card className="shadow-md border-0">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize how AIS TUKE looks on your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Moon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label>Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Use dark theme for reduced eye strain
                </p>
              </div>
            </div>
            <Switch checked={darkMode} onCheckedChange={onToggleDarkMode} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label>Language</Label>
                <p className="text-sm text-muted-foreground">
                  Select your preferred language
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onToggleLanguage}>
              {language}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md border-0">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Choose what notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive important updates via email
                </p>
              </div>
            </div>
            <Switch 
              checked={settings.emailNotifications} 
              onCheckedChange={(val) => handleToggle("emailNotifications", val)} 
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label>Grade Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when new grades are published
                </p>
              </div>
            </div>
            <Switch 
              checked={settings.gradeNotifications} 
              onCheckedChange={(val) => handleToggle("gradeNotifications", val)} 
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label>Schedule Changes</Label>
                <p className="text-sm text-muted-foreground">
                  Be informed about schedule modifications
                </p>
              </div>
            </div>
            <Switch 
              checked={settings.scheduleNotifications} 
              onCheckedChange={(val) => handleToggle("scheduleNotifications", val)} 
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive push notifications on your device
                </p>
              </div>
            </div>
            <Switch 
              checked={settings.pushNotifications} 
              onCheckedChange={(val) => handleToggle("pushNotifications", val)} 
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md border-0">
        <CardHeader>
          <CardTitle>Security & Privacy</CardTitle>
          <CardDescription>
            Manage your account security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label>Change Password</Label>
                <p className="text-sm text-muted-foreground">
                  Update your account password
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Change
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Add extra security to your account
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Enable
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label>Active Sessions</Label>
                <p className="text-sm text-muted-foreground">
                  Manage your active login sessions
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Manage
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md border-0">
        <CardHeader>
          <CardTitle>Data & Privacy</CardTitle>
          <CardDescription>
            Control your data and privacy preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Download Your Data</Label>
              <p className="text-sm text-muted-foreground">
                Export a copy of your academic data
              </p>
            </div>
            <Button variant="outline" size="sm">
              Download
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Privacy Policy</Label>
              <p className="text-sm text-muted-foreground">
                Read our privacy policy
              </p>
            </div>
            <Button variant="outline" size="sm">
              View
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
