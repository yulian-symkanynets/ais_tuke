import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { 
  Bell, 
  Moon, 
  Globe, 
  Lock,
  Save,
  Shield,
  Clock,
  X,
  Copy,
  Check
} from "lucide-react";
import { api } from "../lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface UserSettings {
  theme: string;
  language: string;
  timezone: string;
  notifications_enabled: boolean;
  two_factor_enabled: boolean;
}

interface TwoFASetup {
  secret: string;
  qr_url: string;
}

interface Timezone {
  value: string;
  label: string;
}

interface SettingsPageProps {
  onThemeChange?: (isDark: boolean) => void;
  onLanguageChange?: (lang: string) => void;
}

export function SettingsPage({ onThemeChange, onLanguageChange }: SettingsPageProps) {
  const [settings, setSettings] = useState<UserSettings>({
    theme: "light",
    language: "en",
    timezone: "Europe/Bratislava",
    notifications_enabled: true,
    two_factor_enabled: false,
  });
  const [timezones, setTimezones] = useState<Timezone[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // 2FA state
  const [is2FADialogOpen, setIs2FADialogOpen] = useState(false);
  const [isDisable2FADialogOpen, setIsDisable2FADialogOpen] = useState(false);
  const [twoFASetup, setTwoFASetup] = useState<TwoFASetup | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [copiedSecret, setCopiedSecret] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchTimezones();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await api.get<UserSettings>("/api/settings/me");
      setSettings(data);
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimezones = async () => {
    try {
      const data = await api.get<Timezone[]>("/api/settings/timezones");
      setTimezones(data);
    } catch (err) {
      console.error("Failed to fetch timezones:", err);
    }
  };

  const handleSaveSettings = async () => {
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      await api.put("/api/settings/me", {
        theme: settings.theme,
        language: settings.language,
        timezone: settings.timezone,
        notifications_enabled: settings.notifications_enabled,
      });
      setSuccess("Settings saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
      
      // Apply theme change
      if (onThemeChange) {
        onThemeChange(settings.theme === "dark");
      }
      
      // Apply language change
      if (onLanguageChange) {
        onLanguageChange(settings.language === "sk" ? "SK" : "EN");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleThemeToggle = (isDark: boolean) => {
    const newTheme = isDark ? "dark" : "light";
    setSettings({ ...settings, theme: newTheme });
  };

  const handleLanguageChange = (lang: string) => {
    setSettings({ ...settings, language: lang });
  };

  const handleEnable2FA = async () => {
    try {
      const data = await api.post<TwoFASetup>("/api/auth/2fa/enable", {});
      setTwoFASetup(data);
      setIs2FADialogOpen(true);
    } catch (err: any) {
      setError(err.message || "Failed to enable 2FA");
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    try {
      await api.post("/api/auth/2fa/verify-setup", { code: verificationCode });
      setSettings({ ...settings, two_factor_enabled: true });
      setIs2FADialogOpen(false);
      setTwoFASetup(null);
      setVerificationCode("");
      setSuccess("Two-factor authentication enabled successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Invalid verification code");
    }
  };

  const handleDisable2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    try {
      await api.post("/api/auth/2fa/disable", { code: verificationCode });
      setSettings({ ...settings, two_factor_enabled: false });
      setIsDisable2FADialogOpen(false);
      setVerificationCode("");
      setSuccess("Two-factor authentication disabled!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Invalid verification code");
    }
  };

  const copySecret = () => {
    if (twoFASetup?.secret) {
      navigator.clipboard.writeText(twoFASetup.secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1>Settings</h1>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Settings</h1>
          <p className="text-muted-foreground">
            Manage your preferences and account settings
          </p>
        </div>
        <Button onClick={handleSaveSettings} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {(error || success) && (
        <div className={`rounded-md p-4 ${error ? 'bg-destructive/15 text-destructive' : 'bg-green-500/15 text-green-600'}`}>
          {error || success}
          <Button
            variant="ghost"
            size="sm"
            className="float-right"
            onClick={() => { setError(""); setSuccess(""); }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

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
            <Switch 
              checked={settings.theme === "dark"}
              onCheckedChange={handleThemeToggle}
            />
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
            <Select value={settings.language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="sk">Slovenčina</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label>Timezone</Label>
                <p className="text-sm text-muted-foreground">
                  Set your local timezone
                </p>
              </div>
            </div>
            <Select 
              value={settings.timezone} 
              onValueChange={(v) => setSettings({ ...settings, timezone: v })}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label>Enable Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications about grades, schedules, and updates
                </p>
              </div>
            </div>
            <Switch 
              checked={settings.notifications_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, notifications_enabled: checked })}
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
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Add extra security to your account with TOTP
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={settings.two_factor_enabled ? "default" : "secondary"}>
                {settings.two_factor_enabled ? "Enabled" : "Disabled"}
              </Badge>
              {settings.two_factor_enabled ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsDisable2FADialogOpen(true)}
                >
                  Disable
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleEnable2FA}
                >
                  Enable
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label>Change Password</Label>
                <p className="text-sm text-muted-foreground">
                  Update your account password from Profile page
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled>
              Go to Profile
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

      {/* Enable 2FA Dialog */}
      <Dialog open={is2FADialogOpen} onOpenChange={setIs2FADialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set up Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app or enter the secret manually
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            
            {twoFASetup && (
              <>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Scan this QR code with Google Authenticator, Authy, or similar app:
                  </p>
                  <div className="bg-white p-4 rounded-lg inline-block">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(twoFASetup.qr_url)}`}
                      alt="2FA QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Or enter this secret manually:</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={twoFASetup.secret} 
                      readOnly 
                      className="font-mono text-sm"
                    />
                    <Button variant="outline" size="sm" onClick={copySecret}>
                      {copiedSecret ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Enter verification code from your app:</Label>
                  <Input
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="text-center text-2xl font-mono tracking-widest"
                  />
                </div>
              </>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setIs2FADialogOpen(false);
                setTwoFASetup(null);
                setVerificationCode("");
                setError("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleVerify2FA}>
              Verify & Enable
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Dialog */}
      <Dialog open={isDisable2FADialogOpen} onOpenChange={setIsDisable2FADialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter your current 2FA code to disable two-factor authentication
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Verification Code</Label>
              <Input
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="text-center text-2xl font-mono tracking-widest"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDisable2FADialogOpen(false);
                setVerificationCode("");
                setError("");
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDisable2FA}>
              Disable 2FA
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
