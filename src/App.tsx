import { useState, useEffect } from "react";
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
import { LoginPage } from "./components/LoginPage";
import { RegisterPage } from "./components/RegisterPage";
import { TeacherDashboard } from "./components/TeacherDashboard";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [userRole, setUserRole] = useState<string>("student");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("EN");

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("authToken");
    const student = localStorage.getItem("student");
    if (token && student) {
      setIsAuthenticated(true);
      const studentData = JSON.parse(student);
      setUserRole(studentData.role || "student");
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const handleLoginSuccess = (token: string, student: any) => {
    setIsAuthenticated(true);
    setShowRegister(false);
    setUserRole(student.role || "student");
  };

  const handleRegisterSuccess = (token: string, student: any) => {
    setIsAuthenticated(true);
    setShowRegister(false);
    setUserRole(student.role || "student");
    setShowRegister(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("student");
    setIsAuthenticated(false);
    setActiveSection("dashboard");
  };

  // Show login/register page if not authenticated
  if (!isAuthenticated) {
    if (showRegister) {
      return (
        <RegisterPage
          onRegisterSuccess={handleRegisterSuccess}
          onSwitchToLogin={() => setShowRegister(false)}
        />
      );
    }
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onSwitchToRegister={() => setShowRegister(true)}
      />
    );
  }

  const renderContent = () => {
    // Show Teacher Dashboard for teacher role
    if (userRole === "teacher") {
      if (activeSection === "dashboard") {
        return <TeacherDashboard />;
      }
      // Teachers can also view other pages
    }

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
        return <SettingsPage 
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          language={language}
          onToggleLanguage={() => setLanguage(language === "EN" ? "SK" : "EN")}
        />;
      case "profile":
        return <ProfilePage />;
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
        onLogout={handleLogout}
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