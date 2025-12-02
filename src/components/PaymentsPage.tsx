import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  Download,
  Home,
  BookOpen,
  FileText,
  Clock
} from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

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
}

export function PaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const data = await api.get<Payment[]>("/api/payments/");
      setPayments(data || []);
    } catch (error) {
      console.error("Failed to fetch payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const pendingPayments = payments.filter(p => p.status === "pending");
  const paidPayments = payments.filter(p => p.status === "paid" || p.status === "waived");
  
  const totalDue = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

  const paymentMethods = [
    { name: "Bank Transfer", details: "IBAN: SK31 1200 0000 1234 5678 9012", preferred: true },
    { name: "Credit/Debit Card", details: "Visa, Mastercard accepted", preferred: false },
    { name: "Cash", details: "At Student Office (Building A, Room 105)", preferred: false },
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
      <div>
        <h1>Payments</h1>
        <p className="text-muted-foreground">
          Manage your tuition, dormitory, and other university payments
        </p>
      </div>

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
            <span className="text-4xl">€{totalDue}</span>
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
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">€{payment.amount}</p>
                        {getStatusBadge(payment.status)}
                      </div>
                      <Button>Pay Now</Button>
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
                  method.preferred 
                    ? "border-primary bg-primary/5" 
                    : "border-muted bg-muted/30"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {method.name}
                        {method.preferred && <Badge variant="secondary">Recommended</Badge>}
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
                          <p className="font-semibold">€{payment.amount}</p>
                          {getStatusBadge(payment.status)}
                        </div>
                        <Button variant="ghost" size="sm">
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
    </div>
  );
}
