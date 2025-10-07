import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Clock, MapPin } from "lucide-react";

export function SchedulePage() {
  const schedule = [
    {
      day: "Monday",
      classes: [
        {
          time: "08:00-09:40",
          subject: "Data Structures",
          code: "ZADS",
          room: "PK6 C303",
          type: "Lecture",
        },
        {
          time: "10:00-11:40",
          subject: "Web Technologies",
          code: "WEBTECH",
          room: "PK6 C409",
          type: "Lab",
        },
      ],
    },
    {
      day: "Tuesday",
      classes: [
        {
          time: "13:00-14:40",
          subject: "Database Systems",
          code: "DBS",
          room: "PK6 C208",
          type: "Lecture",
        },
      ],
    },
    {
      day: "Wednesday",
      classes: [
        {
          time: "08:00-09:40",
          subject: "Software Engineering",
          code: "SE",
          room: "PK6 C303",
          type: "Lecture",
        },
        {
          time: "10:00-11:40",
          subject: "Data Structures",
          code: "ZADS",
          room: "PK6 LAB2",
          type: "Lab",
        },
      ],
    },
    {
      day: "Thursday",
      classes: [
        {
          time: "10:00-11:40",
          subject: "Web Technologies",
          code: "WEBTECH",
          room: "PK6 C409",
          type: "Lecture",
        },
        {
          time: "13:00-14:40",
          subject: "Database Systems",
          code: "DBS",
          room: "PK6 LAB3",
          type: "Lab",
        },
      ],
    },
    {
      day: "Friday",
      classes: [
        {
          time: "08:00-09:40",
          subject: "Software Engineering",
          code: "SE",
          room: "PK6 LAB1",
          type: "Lab",
        },
      ],
    },
  ];

  const getTypeColor = (type: string) => {
    return type === "Lecture" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Schedule</h1>
        <p className="text-muted-foreground">
          Your weekly class schedule
        </p>
      </div>

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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}