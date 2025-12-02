import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Clock, MapPin, Plus } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface Schedule {
  id: number;
  subject_id: number;
  day: string;
  time: string;
  room: string;
  class_type: string;
  semester: string;
  subject_name?: string;
  subject_code?: string;
}

interface Subject {
  id: number;
  code: string;
  name: string;
}

interface ScheduleByDay {
  day: string;
  classes: Schedule[];
}

const DAYS_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function SchedulePage() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    subject_id: "",
    day: "Monday",
    time: "",
    room: "",
    class_type: "Lecture",
    semester: "Winter 2025/26",
  });

  const isTeacher = user?.role === "teacher" || user?.role === "admin";

  useEffect(() => {
    fetchSchedules();
    if (isTeacher) {
      fetchSubjects();
    }
  }, [isTeacher]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const data = await api.get<Schedule[]>("/api/schedules/");
      setSchedules(data);
    } catch (error) {
      console.error("Failed to fetch schedules:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const data = await api.get<Subject[]>("/api/subjects/");
      setSubjects(data);
    } catch (error) {
      console.error("Failed to fetch subjects:", error);
    }
  };

  const handleCreateSchedule = async () => {
    if (!newSchedule.subject_id || !newSchedule.time || !newSchedule.room) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      await api.post("/api/schedules/", {
        subject_id: parseInt(newSchedule.subject_id),
        day: newSchedule.day,
        time: newSchedule.time,
        room: newSchedule.room,
        class_type: newSchedule.class_type,
        semester: newSchedule.semester,
      });
      setIsDialogOpen(false);
      setNewSchedule({
        subject_id: "",
        day: "Monday",
        time: "",
        room: "",
        class_type: "Lecture",
        semester: "Winter 2025/26",
      });
      await fetchSchedules();
    } catch (error: any) {
      alert(error.message || "Failed to create schedule");
    }
  };

  const getTypeColor = (type: string) => {
    return type === "Lecture" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground";
  };

  // Group schedules by day
  const schedulesByDay: ScheduleByDay[] = DAYS_ORDER.map((day) => {
    const classes = schedules.filter((s) => s.day === day);
    return { day, classes };
  }).filter((dayGroup) => dayGroup.classes.length > 0);

  // If no schedules, still show all days with empty state
  const allDaysWithSchedules = DAYS_ORDER.map((day) => {
    const classes = schedules.filter((s) => s.day === day);
    return { day, classes };
  });

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Schedule</h1>
          <p className="text-muted-foreground">
            {isTeacher ? "Manage class schedules" : "Your weekly class schedule"}
          </p>
        </div>
        {isTeacher && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Schedule</DialogTitle>
                <DialogDescription>
                  Add a new class schedule entry
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Subject</Label>
                  <Select
                    value={newSchedule.subject_id}
                    onValueChange={(value) =>
                      setNewSchedule({ ...newSchedule, subject_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id.toString()}>
                          {subject.code} - {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Day</Label>
                  <Select
                    value={newSchedule.day}
                    onValueChange={(value) =>
                      setNewSchedule({ ...newSchedule, day: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_ORDER.map((day) => (
                        <SelectItem key={day} value={day}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Time (e.g., 08:00-09:40)</Label>
                  <Input
                    value={newSchedule.time}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, time: e.target.value })
                    }
                    placeholder="08:00-09:40"
                  />
                </div>
                <div>
                  <Label>Room</Label>
                  <Input
                    value={newSchedule.room}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, room: e.target.value })
                    }
                    placeholder="PK6 C303"
                  />
                </div>
                <div>
                  <Label>Class Type</Label>
                  <Select
                    value={newSchedule.class_type}
                    onValueChange={(value) =>
                      setNewSchedule({ ...newSchedule, class_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Lecture">Lecture</SelectItem>
                      <SelectItem value="Lab">Lab</SelectItem>
                      <SelectItem value="Seminar">Seminar</SelectItem>
                      <SelectItem value="Practical">Practical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Semester</Label>
                  <Input
                    value={newSchedule.semester}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, semester: e.target.value })
                    }
                    placeholder="Winter 2025/26"
                  />
                </div>
                <Button onClick={handleCreateSchedule} className="w-full">
                  Create Schedule
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4">
        {allDaysWithSchedules.map((dayGroup) => (
          <Card key={dayGroup.day} className="shadow-md border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <span className="text-primary">{dayGroup.day.slice(0, 3)}</span>
                </div>
                {dayGroup.day}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dayGroup.classes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No classes scheduled</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {dayGroup.classes.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <div className="mb-1 flex items-center gap-2">
                            <Badge variant="outline">
                              {schedule.subject_code || `ID: ${schedule.subject_id}`}
                            </Badge>
                            <Badge className={getTypeColor(schedule.class_type)}>
                              {schedule.class_type}
                            </Badge>
                          </div>
                          <h4 className="text-sm font-medium">
                            {schedule.subject_name || "Unknown Subject"}
                          </h4>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {schedule.time}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {schedule.room}
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
      {schedules.length === 0 && (
        <Card className="shadow-md border-0">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              {isTeacher
                ? "No schedules created yet. Create your first schedule above."
                : "No schedules available."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
