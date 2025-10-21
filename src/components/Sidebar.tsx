import { 
  LayoutDashboard, 
  BookOpen, 
  ClipboardList, 
  Calendar, 
  GraduationCap,
  Bell,
  Settings,
  X,
  Home,
  FileText,
  CreditCard
} from "lucide-react";
import { Button } from "./ui/button";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "subjects", label: "Subjects", icon: BookOpen },
  { id: "enrolment", label: "Enrolment", icon: ClipboardList },
  { id: "schedule", label: "Schedule", icon: Calendar },
  { id: "grades", label: "Grades", icon: GraduationCap },
  { id: "dormitory", label: "Dormitory", icon: Home },
  { id: "thesis", label: "Thesis", icon: FileText },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({ activeSection, onSectionChange, isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-50 h-full w-64 border-r bg-card pt-16 shadow-lg
          transform transition-transform duration-200 ease-in-out
          md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:translate-x-0 md:shadow-none
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex h-full flex-col">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 md:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>

          <nav className="flex-1 space-y-1 p-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-3 ${
                    isActive ? "bg-red-600 text-white hover:bg-red-700 hover:text-white" : ""
                  }`}
                  onClick={() => {
                    onSectionChange(item.id);
                    onClose();
                  }}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Button>
              );
            })}
          </nav>

          <div className="border-t p-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm">
                <strong>Winter Term 2025/26</strong>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Week 8 of 13
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}