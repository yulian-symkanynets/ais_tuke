import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LoginPage } from "./components/LoginPage";
import { TopNav } from "./components/TopNav";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { SubjectsPage } from "./components/SubjectsPage";
import { EnrolmentPage } from "./components/EnrolmentPage";
import { SchedulePage } from "./components/SchedulePage";
import { GradesPage } from "./components/GradesPage";
import { DormitoryPage } from "./components/DormitoryPage";
import { ThesisPage } from "./components/ThesisPage";
import { PaymentsPage } from "./components/PaymentsPage";
import { NotificationsPage } from "./components/NotificationsPage";
import { SettingsPage } from "./components/SettingsPage";
import { ProfilePage } from "./components/ProfilePage";
import { AssignmentsPage } from "./components/AssignmentsPage";
import { ActivityPage } from "./components/ActivityPage";
import { DocumentsPage } from "./components/DocumentsPage";

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("EN");

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
    }
    const savedLang = localStorage.getItem("language");
    if (savedLang) {
      setLanguage(savedLang);
    }
  }, []);

  // Save theme preference
  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Save language preference
  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleNavigate = (section: string) => {
    setActiveSection(section);
  };

  const handleThemeChange = (isDark: boolean) => {
    setDarkMode(isDark);
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
  };

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <Dashboard />;
      case "subjects":
        return <SubjectsPage />;
      case "enrolment":
        return <EnrolmentPage />;
      case "schedule":
        return <SchedulePage />;
      case "grades":
        return <GradesPage />;
      case "dormitory":
        return <DormitoryPage />;
      case "thesis":
        return <ThesisPage />;
      case "payments":
        return <PaymentsPage />;
      case "notifications":
        return <NotificationsPage />;
      case "settings":
        return (
          <SettingsPage 
            onThemeChange={handleThemeChange} 
            onLanguageChange={handleLanguageChange}
          />
        );
      case "profile":
        return <ProfilePage />;
      case "assignments":
        return <AssignmentsPage />;
      case "activity":
        return <ActivityPage />;
      case "documents":
        return <DocumentsPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav
        onMenuClick={() => setSidebarOpen(true)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        language={language}
        onToggleLanguage={() => setLanguage(language === "EN" ? "SK" : "EN")}
        onNavigate={handleNavigate}
      />
      
      <div className="flex">
        <Sidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        
        <main className="flex-1 p-6 md:p-8 lg:p-10">
          <div className="mx-auto max-w-7xl">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
