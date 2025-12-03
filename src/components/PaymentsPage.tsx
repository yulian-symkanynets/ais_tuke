import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  Download,
  Home,
  BookOpen,
  FileText,
  Clock,
  Plus,
  X,
  Banknote
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

interface Payment {
  id: number;
  user_id: number;
  payment_type: string;
  description: string;
  amount: number;
  status: string;
  due_date?: string;
  paid_date?: string;
  payment_method?: string;
  invoice_number?: string;
  created_at?: string;
  user_name?: string;
  user_email?: string;
}

interface UserOption {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

export function PaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [newPayment, setNewPayment] = useState({
    user_id: "",
    payment_type: "",
    description: "",
    amount: "",
    due_date: "",
  });

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    fetchPayments();
    if (isAdmin) {
      fetchUsers();
    }
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const data = await api.get<Payment[]>("/api/payments/");
      setPayments(data || []);
    } catch (err) {
      console.error("Failed to fetch payments:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await api.get<UserOption[]>("/api/payments/users");
      setUsers(data || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const handlePayNow = (payment: Payment) => {
    setSelectedPayment(payment);
    setPaymentMethod("");
    setIsPayDialogOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedPayment || !paymentMethod) {
      setError("Please select a payment method");
      return;
    }

    try {
      await api.put(`/api/payments/${selectedPayment.id}/pay`, {
        payment_method: paymentMethod,
      });
      setIsPayDialogOpen(false);
      setSuccess("Payment successful!");
      setTimeout(() => setSuccess(""), 3000);
      await fetchPayments();
    } catch (err: any) {
      setError(err.message || "Payment failed");
    }
  };

  const handleCreatePayment = async () => {
    if (!newPayment.user_id || !newPayment.payment_type || !newPayment.amount) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      await api.post("/api/payments/", {
        user_id: parseInt(newPayment.user_id),
        payment_type: newPayment.payment_type,
        description: newPayment.description,
        amount: parseFloat(newPayment.amount),
        due_date: newPayment.due_date ? new Date(newPayment.due_date).toISOString() : null,
      });
      setIsCreateDialogOpen(false);
      setNewPayment({
        user_id: "",
        payment_type: "",
        description: "",
        amount: "",
        due_date: "",
      });
      setSuccess("Payment created successfully!");
      setTimeout(() => setSuccess(""), 3000);
      await fetchPayments();
    } catch (err: any) {
      setError(err.message || "Failed to create payment");
    }
  };

  const handleCancelPayment = async (paymentId: number) => {
    if (!confirm("Are you sure you want to cancel this payment?")) return;
    
    try {
      await api.put(`/api/payments/${paymentId}/cancel`, {});
      setSuccess("Payment cancelled");
      setTimeout(() => setSuccess(""), 3000);
      await fetchPayments();
    } catch (err: any) {
      setError(err.message || "Failed to cancel payment");
    }
  };

  const handleDownloadInvoice = async (paymentId: number) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/documents/download/invoice/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      
      if (!response.ok) throw new Error("Download failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice_${paymentId}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Failed to download invoice:", err);
      setError("Failed to download invoice");
    }
  };

  const pendingPayments = payments.filter(p => p.status === "pending" || p.status === "overdue");
  const paidPayments = payments.filter(p => p.status === "paid" || p.status === "waived" || p.status === "refunded");
  
  const totalDue = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

  const paymentMethods = [
    { value: "Bank Transfer", label: "Bank Transfer", details: "IBAN: SK31 1200 0000 1234 5678 9012" },
    { value: "Credit/Debit Card", label: "Credit/Debit Card", details: "Visa, Mastercard accepted" },
    { value: "Cash", label: "Cash", details: "At Student Office (Building A, Room 105)" },
  ];

  const paymentTypes = [
    { value: "Tuition Fee", label: "Tuition Fee" },
    { value: "Dormitory", label: "Dormitory Fee" },
    { value: "Administrative Fee", label: "Administrative Fee" },
    { value: "Dormitory Deposit", label: "Dormitory Deposit" },
    { value: "Other", label: "Other" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>;
      case "pending":
        return <Badge className="bg-orange-600"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "overdue":
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Overdue</Badge>;
      case "waived":
        return <Badge variant="secondary">Waived</Badge>;
      case "refunded":
        return <Badge variant="outline">Refunded</Badge>;
      default:
        return null;
    }
  };

  const getPaymentIcon = (type: string) => {
    if (type.includes("Dormitory")) return Home;
    if (type.includes("Tuition")) return BookOpen;
    return FileText;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1>Payments</h1>
          <p className="text-muted-foreground">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Payments</h1>
          <p className="text-muted-foreground">
            Manage your tuition, dormitory, and other university payments
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Payment
          </Button>
        )}
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

      {/* Balance Overview */}
      <Card className="shadow-md border-0 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <CardHeader>
          <CardTitle className="text-primary-foreground">Account Balance</CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Your current payment status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl">€{totalDue.toFixed(2)}</span>
            {totalDue > 0 && (
              <Badge variant="destructive" className="mb-2">Amount Due</Badge>
            )}
            {totalDue === 0 && (
              <Badge className="bg-green-600 mb-2">All Paid</Badge>
            )}
          </div>
          <p className="text-sm text-primary-foreground/80 mt-2">
            {totalDue > 0 
              ? "You have outstanding payments" 
              : "Your account is up to date"}
          </p>
        </CardContent>
      </Card>

      {/* Pending Payments */}
      {pendingPayments.length > 0 && (
        <Card className="shadow-md border-0">
          <CardHeader>
            <CardTitle>Upcoming Payments</CardTitle>
            <CardDescription>Payments due soon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingPayments.map((payment) => {
                const Icon = getPaymentIcon(payment.payment_type);
                return (
                  <div 
                    key={payment.id} 
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{payment.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Due: {payment.due_date ? new Date(payment.due_date).toLocaleDateString() : "N/A"}
                          </p>
                          {isAdmin && payment.user_email && (
                            <span className="text-sm text-muted-foreground ml-2">
                              ({payment.user_email})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">€{payment.amount.toFixed(2)}</p>
                        {getStatusBadge(payment.status)}
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => handlePayNow(payment)}>
                          <Banknote className="h-4 w-4 mr-2" />
                          Pay Now
                        </Button>
                        {isAdmin && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleCancelPayment(payment.id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Methods */}
      <Card className="shadow-md border-0">
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Available options for making payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {paymentMethods.map((method, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  index === 0 
                    ? "border-primary bg-primary/5" 
                    : "border-muted bg-muted/30"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {method.label}
                        {index === 0 && <Badge variant="secondary">Recommended</Badge>}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">{method.details}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card className="shadow-md border-0">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Your past transactions and invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {paidPayments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No payment history</p>
          ) : (
            <div className="space-y-3">
              {paidPayments.map((payment, index) => {
                const Icon = getPaymentIcon(payment.payment_type);
                return (
                  <div key={payment.id}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{payment.description}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {payment.paid_date ? new Date(payment.paid_date).toLocaleDateString() : "N/A"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {payment.payment_method || "N/A"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {payment.invoice_number || ""}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-semibold">€{payment.amount.toFixed(2)}</p>
                          {getStatusBadge(payment.status)}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDownloadInvoice(payment.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {index < paidPayments.length - 1 && <Separator className="my-2" />}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pay Dialog */}
      <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              Pay €{selectedPayment?.amount.toFixed(2)} for {selectedPayment?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label>Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsPayDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmPayment}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Payment Dialog (Admin Only) */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Payment</DialogTitle>
            <DialogDescription>
              Create a new payment request for a user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label>User *</Label>
              <Select 
                value={newPayment.user_id} 
                onValueChange={(v) => setNewPayment({ ...newPayment, user_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.full_name || u.email} ({u.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Payment Type *</Label>
              <Select 
                value={newPayment.payment_type} 
                onValueChange={(v) => setNewPayment({ ...newPayment, payment_type: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {paymentTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={newPayment.description}
                onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
                placeholder="Payment description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (€) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={newPayment.due_date}
                  onChange={(e) => setNewPayment({ ...newPayment, due_date: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePayment}>
              Create Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
