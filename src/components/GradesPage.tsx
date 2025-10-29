import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { TrendingUp, Award } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

// --- Types ---
type Grade = {
  id: number;
  subject: string;
  code: string;
  grade: string; // A, B, C, D, E, FX
  credits: number;
  semester: string;
  date: string; // e.g. "Jun 15, 2025"
  numericGrade: number; // 1.0 best ... 5.0 fail
};

// Helpers
function weightedGPA(items: Grade[]): number | null {
  if (!items.length) return null;
  const totalCredits = items.reduce((s, g) => s + g.credits, 0);
  if (!totalCredits) return null;
  const sum = items.reduce((s, g) => s + g.numericGrade * g.credits, 0);
  return +(sum / totalCredits).toFixed(2);
}

function fmtNumber(n: number | null | undefined) {
  return n == null || Number.isNaN(n) ? "—" : n.toFixed(2);
}

const API_BASE = "http://127.0.0.1:8000"; // adjust if needed

export function GradesPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [semesters, setSemesters] = useState<string[]>([]);

  // Controls for filtering
  const [onlySemester, setOnlySemester] = useState(false);
  const [currentSemester, setCurrentSemester] = useState<string>("Winter 2025/26");

  const abortRef = useRef<AbortController | null>(null);

  // Fetch semesters on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/semesters`)
      .then((r) => r.json())
      .then((data) => {
        const list: string[] = data?.semesters ?? [];
        setSemesters(list);
        // Prefer a Winter semester if present, fallback to first
        const preferred = list.find((s) => /Winter/.test(s)) ?? list[0] ?? "Winter 2025/26";
        setCurrentSemester(preferred);
      })
      .catch(() => {
        // non-fatal for the page, keep default currentSemester
      });
  }, []);

  // Fetch grades
  const fetchGrades = () => {
    setLoading(true);
    setError(null);
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    const params = new URLSearchParams();
    if (onlySemester && currentSemester) params.set("semester", currentSemester);

    fetch(`${API_BASE}/api/grades?${params.toString()}`, { 
      signal: ac.signal,
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then((data: Grade[]) => setGrades(data))
      .catch((e) => setError(e.message || "Failed to load grades"))
      .finally(() => setLoading(false));
  };

  // initial load
  useEffect(() => {
    fetchGrades();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // recompute stats
  const overallGPA = useMemo(() => weightedGPA(grades), [grades]);
  const totalCredits = useMemo(() => grades.reduce((s, g) => s + g.credits, 0), [grades]);
  const currentSemesterGrades = useMemo(
    () => grades.filter((g) => g.semester === currentSemester),
    [grades, currentSemester]
  );
  const currentGPA = useMemo(() => weightedGPA(currentSemesterGrades), [currentSemesterGrades]);

  const getGradeBadgeVariant = (grade: string): "default" | "secondary" | "outline" => {
    if (grade === "A") return "default";
    if (grade === "B") return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Grades</h1>
        <p className="text-muted-foreground">View your academic performance and grades</p>
      </div>

      {/* Controls */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="text-sm text-muted-foreground">Filter by semester</label>
            <select
              value={currentSemester}
              onChange={(e) => setCurrentSemester(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2"
            >
              {(semesters.length ? semesters : [currentSemester]).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm mt-6">
            <input
              id="only-sem"
              type="checkbox"
              checked={onlySemester}
              onChange={(e) => {
                setOnlySemester(e.target.checked);
                // Auto-refresh when toggling
                setTimeout(() => fetchGrades(), 100);
              }}
              className="h-4 w-4"
            />
            Show only this semester
          </label>
        </div>
        <div className="flex items-end gap-3">
          <button
            onClick={fetchGrades}
            className="inline-flex items-center justify-center rounded-xl border px-4 py-2 shadow-sm hover:bg-accent/10"
            disabled={loading}
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Overall GPA</CardTitle>
            <TrendingUp className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{fmtNumber(overallGPA ?? null)}</div>
            <p className="text-xs text-muted-foreground mt-1">Based on {grades.length} subjects</p>
          </CardContent>
        </Card>

        <Card className="shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Current Semester GPA</CardTitle>
            <Award className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{fmtNumber(currentGPA ?? null)}</div>
            <p className="text-xs text-muted-foreground mt-1">{currentSemester}</p>
          </CardContent>
        </Card>

        <Card className="shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Total Credits</CardTitle>
            <Award className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{totalCredits}</div>
            <p className="text-xs text-muted-foreground mt-1">ECTS credits earned</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md border-0">
        <CardHeader>
          <CardTitle>Grade History</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm">
              Failed to load grades: {error}
            </div>
          )}
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead className="text-center">Credits</TableHead>
                  <TableHead className="text-center">Grade</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={`sk-${i}`}>
                        <TableCell>
                          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                        </TableCell>
                        <TableCell>
                          <div className="h-6 w-14 animate-pulse rounded bg-muted" />
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                        </TableCell>
                        <TableCell>
                          <div className="mx-auto h-4 w-8 animate-pulse rounded bg-muted" />
                        </TableCell>
                        <TableCell>
                          <div className="mx-auto h-6 w-12 animate-pulse rounded bg-muted" />
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                        </TableCell>
                      </TableRow>
                    ))
                  : grades.map((grade) => (
                      <TableRow key={grade.id}>
                        <TableCell>{grade.subject}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{grade.code}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{grade.semester}</TableCell>
                        <TableCell className="text-center">{grade.credits}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={getGradeBadgeVariant(grade.grade)} className="min-w-[40px] justify-center">
                            {grade.grade}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{grade.date}</TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
