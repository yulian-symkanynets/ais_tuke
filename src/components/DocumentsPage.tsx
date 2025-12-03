import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { 
  FileText, 
  Download, 
  Upload, 
  Trash2, 
  GraduationCap,
  ClipboardList,
  FileCheck,
  File,
  X
} from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
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

interface Document {
  id: number;
  user_id: number;
  filename: string;
  original_filename: string;
  file_size?: number;
  mime_type?: string;
  document_type: string;
  description?: string;
  uploaded_at: string;
}

export function DocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    document_type: "",
    description: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await api.get<Document[]>("/api/documents/my-uploads");
      setDocuments(data || []);
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadData.document_type) {
      setError("Please select a file and document type");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("document_type", uploadData.document_type);
      if (uploadData.description) {
        formData.append("description", uploadData.description);
      }

      const response = await fetch("http://127.0.0.1:8000/api/documents/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Upload failed");
      }

      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadData({ document_type: "", description: "" });
      setSuccess("Document uploaded successfully!");
      setTimeout(() => setSuccess(""), 3000);
      await fetchDocuments();
    } catch (err: any) {
      setError(err.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: number) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      await api.delete(`/api/documents/${docId}`);
      setSuccess("Document deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
      await fetchDocuments();
    } catch (err: any) {
      setError(err.message || "Failed to delete document");
    }
  };

  const handleDownloadUploaded = async (doc: Document) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/documents/download/uploaded/${doc.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });

      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.original_filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Failed to download:", err);
      setError("Failed to download document");
    }
  };

  const handleDownloadOfficial = async (type: string, filename: string) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/documents/download/${type}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });

      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Failed to download:", err);
      setError("Failed to download document");
    }
  };

  const documentTypes = [
    { value: "assignment", label: "Assignment Submission" },
    { value: "thesis_material", label: "Thesis Material" },
    { value: "dormitory_application", label: "Dormitory Application" },
    { value: "other", label: "Other" },
  ];

  const officialDocuments = [
    {
      title: "Proof of Enrollment",
      description: "Official document confirming your enrollment status",
      icon: ClipboardList,
      type: "enrollment-proof",
      filename: "enrollment_proof.html",
    },
    {
      title: "Grade Transcript",
      description: "Complete academic record with all grades",
      icon: GraduationCap,
      type: "grade-transcript",
      filename: "grade_transcript.html",
    },
  ];

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocumentTypeLabel = (type: string) => {
    const found = documentTypes.find(t => t.value === type);
    return found ? found.label : type;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1>Documents</h1>
          <p className="text-muted-foreground">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Documents</h1>
          <p className="text-muted-foreground">
            Download official documents and upload submissions
          </p>
        </div>
        <Button onClick={() => setIsUploadDialogOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
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

      {/* Official Documents */}
      <Card className="shadow-md border-0">
        <CardHeader>
          <CardTitle>Official Documents</CardTitle>
          <CardDescription>
            Download official university documents (HTML format - can be printed to PDF)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {officialDocuments.map((doc) => {
              const Icon = doc.icon;
              return (
                <div
                  key={doc.type}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{doc.title}</p>
                      <p className="text-sm text-muted-foreground">{doc.description}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadOfficial(doc.type, doc.filename)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* My Uploads */}
      <Card className="shadow-md border-0">
        <CardHeader>
          <CardTitle>My Uploads</CardTitle>
          <CardDescription>
            Documents you have uploaded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No documents uploaded yet</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setIsUploadDialogOpen(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload your first document
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <File className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{doc.original_filename}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="secondary">{getDocumentTypeLabel(doc.document_type)}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(doc.file_size)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(doc.uploaded_at).toLocaleDateString()}
                        </span>
                      </div>
                      {doc.description && (
                        <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadUploaded(doc)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(doc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a document for assignments or applications
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Select File *</Label>
              <div className="flex items-center gap-3">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {selectedFile ? selectedFile.name : "Choose file..."}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Allowed: PDF, DOC, DOCX, JPEG, PNG, TXT (max 10MB)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Document Type *</Label>
              <Select
                value={uploadData.document_type}
                onValueChange={(v) => setUploadData({ ...uploadData, document_type: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                value={uploadData.description}
                onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                placeholder="Brief description of the document"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsUploadDialogOpen(false);
                setSelectedFile(null);
                setUploadData({ document_type: "", description: "" });
                setError("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

