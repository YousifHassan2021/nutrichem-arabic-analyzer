import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, Loader2, UserPlus, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";

interface User {
  id: string;
  email: string;
  created_at: string;
  subscriptionStatus: string;
  subscriptionSource: string | null;
  expiresAt: string | null;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [activating, setActivating] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [durationMonths, setDurationMonths] = useState("1");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      navigate("/");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (error || !data) {
        toast.error("غير مصرح: ليس لديك صلاحيات الأدمن");
        navigate("/");
        return;
      }

      setIsAdmin(true);
      await loadUsers();
    } catch (error) {
      console.error("Error checking admin status:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-list-users');
      
      if (error) throw error;
      
      setUsers(data.users || []);
    } catch (error: any) {
      console.error("Error loading users:", error);
      toast.error("حدث خطأ أثناء تحميل المستخدمين");
    }
  };

  const handleActivateSubscription = async () => {
    if (!userEmail || !durationMonths) {
      toast.error("يرجى إدخال البريد الإلكتروني ومدة الاشتراك");
      return;
    }

    try {
      setActivating(true);
      const { data, error } = await supabase.functions.invoke('activate-manual-subscription', {
        body: { userEmail, durationMonths, notes }
      });
      
      if (error) throw error;
      
      toast.success("تم تفعيل الاشتراك بنجاح");
      setUserEmail("");
      setDurationMonths("1");
      setNotes("");
      await loadUsers();
    } catch (error: any) {
      console.error("Error activating subscription:", error);
      toast.error(error.message || "حدث خطأ أثناء تفعيل الاشتراك");
    } finally {
      setActivating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img src={logo} alt="ماعون" className="h-16 w-16 md:h-20 md:w-20" />
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-accent" />
                  <h1 className="text-xl md:text-3xl font-bold text-foreground">
                    لوحة تحكم الأدمن
                  </h1>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground">
                  إدارة المستخدمين والاشتراكات
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate("/")}>
              العودة للرئيسية
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Activate Subscription Card */}
        <Card className="p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="h-5 w-5 text-accent" />
            <h2 className="text-xl font-bold">تفعيل اشتراك يدوي</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">البريد الإلكتروني</label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                dir="ltr"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">مدة الاشتراك (بالأشهر)</label>
              <Input
                type="number"
                min="1"
                value={durationMonths}
                onChange={(e) => setDurationMonths(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">ملاحظات (اختياري)</label>
              <Textarea
                placeholder="ملاحظات إضافية..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={1}
              />
            </div>
          </div>
          
          <Button
            onClick={handleActivateSubscription}
            disabled={activating || !userEmail || !durationMonths}
            className="w-full md:w-auto"
          >
            {activating ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري التفعيل...
              </>
            ) : (
              "تفعيل الاشتراك"
            )}
          </Button>
        </Card>

        {/* Users Table */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">قائمة المستخدمين</h2>
            <Button
              onClick={loadUsers}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 ml-2" />
              تحديث
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">البريد الإلكتروني</TableHead>
                  <TableHead className="text-right">حالة الاشتراك</TableHead>
                  <TableHead className="text-right">مصدر الاشتراك</TableHead>
                  <TableHead className="text-right">تاريخ الانتهاء</TableHead>
                  <TableHead className="text-right">تاريخ التسجيل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium" dir="ltr">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                        {user.subscriptionStatus === 'active' ? 'نشط' : 'غير مشترك'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.subscriptionSource === 'manual' && (
                        <Badge variant="outline">يدوي</Badge>
                      )}
                      {user.subscriptionSource === 'stripe' && (
                        <Badge variant="outline">Stripe</Badge>
                      )}
                      {!user.subscriptionSource && '-'}
                    </TableCell>
                    <TableCell>
                      {user.expiresAt 
                        ? new Date(user.expiresAt).toLocaleDateString('ar-SA')
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('ar-SA')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;
