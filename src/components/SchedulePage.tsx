import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Clock, MapPin, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

const API_BASE = "http://127.0.0.1:8000";

type ScheduleItem = {
  id: number;
  day: string;
  time: string;
  subject: string;
  code: string;
  room: string;
  type: string;
};

type TimeOption = {
  id: number;
  subject_code: string;
  option_name: string;
  day: string;
  time: string;
  room: string;
  type: string;
  lecturer: string;
  capacity: number;
  enrolled: number;
  available: number;
};

export function SchedulePage() {
  const [scheduleData, setScheduleData] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [timeOptions, setTimeOptions] = useState<TimeOption[]>([]);
  const [currentSelections, setCurrentSelections] = useState<Record<string, number[]>>({});
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);

  useEffect(() => {
    loadSchedule();
    loadCurrentSelections();
  }, []);

  const loadSchedule = () => {
    const token = localStorage.getItem("authToken");
    
    fetch(`${API_BASE}/api/schedule`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => setScheduleData(data))
      .catch(err => console.error("Failed to load schedule:", err))
      .finally(() => setLoading(false));
  };

  const loadCurrentSelections = async () => {
    const token = localStorage.getItem("authToken");
    
    try {
      const response = await fetch(`${API_BASE}/api/schedule/selections`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();
      setCurrentSelections(data);
    } catch (error) {
      console.error("Failed to load selections:", error);
    }
  };

  const loadTimeOptions = async (subjectCode: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/schedule/options/${subjectCode}`);
      const data = await response.json();
      setTimeOptions(data);
      
      // Set currently selected options
      const current = currentSelections[subjectCode] || [];
      setSelectedOptions(current.map(s => s.time_option_id));
    } catch (error) {
      console.error("Failed to load time options:", error);
    }
  };

  const handleEditSchedule = (subjectCode: string) => {
    setEditingSubject(subjectCode);
    loadTimeOptions(subjectCode);
  };

  const toggleOption = (optionId: number, type: string) => {
    setSelectedOptions(prev => {
      // Remove any existing selection of the same type
      const filtered = prev.filter(id => {
        const opt = timeOptions.find(o => o.id === id);
        return opt && opt.type !== type;
      });
      
      // Toggle the selected option
      if (prev.includes(optionId)) {
        return filtered;
      } else {
        return [...filtered, optionId];
      }
    });
  };

  const saveScheduleChange = async () => {
    if (!editingSubject) return;
    
    const token = localStorage.getItem("authToken");
    
    try {
      const response = await fetch(`${API_BASE}/api/schedule/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          subject_code: editingSubject,
          time_option_ids: selectedOptions
        })
      });

      if (response.ok) {
        alert("Schedule updated successfully!");
        setEditingSubject(null);
        loadSchedule();
        loadCurrentSelections();
      } else {
        alert("Failed to update schedule");
      }
    } catch (error) {
      console.error("Failed to update schedule:", error);
      alert("Failed to update schedule");
    }
  };

  // Group schedule by day
  const schedule = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(day => ({
    day,
    classes: scheduleData.filter(item => item.day === day)
  }));

  const getTypeColor = (type: string) => {
    return type === "Lecture" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1>Schedule</h1>
          <p className="text-muted-foreground">Loading schedule...</p>
        </div>
      </div>
    );
  }

  // Get unique subject codes from schedule
  const uniqueSubjects = Array.from(new Set(scheduleData.map(item => item.code)));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1>Schedule</h1>
          <p className="text-muted-foreground">
            Your weekly class schedule - customize your time slots
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      {uniqueSubjects.length > 0 && (
        <Card className="shadow-md border-0">
          <CardHeader>
            <CardTitle className="text-base">Customize Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {uniqueSubjects.map(code => (
                <Dialog key={code}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditSchedule(code)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      {code}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Change Schedule for {code}</DialogTitle>
                      <DialogDescription>
                        Select your preferred lecture and lab time slots
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {['Lecture', 'Lab'].map(type => {
                        const options = timeOptions.filter(opt => opt.type === type);
                        if (options.length === 0) return null;
                        
                        return (
                          <div key={type} className="space-y-2">
                            <h4 className="font-medium">{type} Options</h4>
                            {options.map(option => {
                              const isSelected = selectedOptions.includes(option.id);
                              const isFull = option.available <= 0 && !isSelected;
                              
                              return (
                                <button
                                  key={option.id}
                                  onClick={() => !isFull && toggleOption(option.id, type)}
                                  disabled={isFull}
                                  className={`w-full text-left p-3 rounded border transition-colors ${
                                    isSelected
                                      ? 'bg-primary text-primary-foreground border-primary'
                                      : isFull
                                      ? 'bg-muted text-muted-foreground border-muted cursor-not-allowed'
                                      : 'hover:bg-accent border-border'
                                  }`}
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="font-medium">{option.option_name}</div>
                                      <div className="text-sm opacity-80">
                                        {option.day} {option.time}
                                      </div>
                                      <div className="text-sm opacity-80">
                                        {option.room} • {option.lecturer}
                                      </div>
                                    </div>
                                    <div>
                                      {isFull ? (
                                        <Badge variant="destructive">Full</Badge>
                                      ) : (
                                        <span className="text-sm opacity-70">{option.available} spots</span>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        );
                      })}
                      <div className="flex justify-end gap-2 pt-4">
                        <DialogTrigger asChild>
                          <Button variant="outline">Cancel</Button>
                        </DialogTrigger>
                        <Button onClick={saveScheduleChange}>Save Changes</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {schedule.map((day) => (
          <Card key={day.day} className="shadow-md border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <span className="text-primary">{day.day.slice(0, 3)}</span>
                </div>
                {day.day}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {day.classes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No classes scheduled</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {day.classes.map((classItem, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <div className="mb-1 flex items-center gap-2">
                            <Badge variant="outline">{classItem.code}</Badge>
                            <Badge className={getTypeColor(classItem.type)}>
                              {classItem.type}
                            </Badge>
                          </div>
                          <h4 className="text-sm">{classItem.subject}</h4>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {classItem.time}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {classItem.room}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
