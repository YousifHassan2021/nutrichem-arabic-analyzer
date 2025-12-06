import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Shield, Loader2, UserPlus, RefreshCw, Clock, XCircle } from "lucide-react";
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
  subscriptionId: string | null;
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
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [extendMonths, setExtendMonths] = useState("1");
  const [extending, setExtending] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    // First check if logged-in user is admin
    if (user) {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();

        if (data && !error) {
          setIsAdmin(true);
          await loadUsers();
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
      }
    }

    // Check device-based subscription for admin status
    const deviceId = localStorage.getItem("deviceId");
    if (deviceId) {
      try {
        const { data: subData } = await supabase.functions.invoke("check-subscription", {
          body: { deviceId, checkAdmin: true }
        });
        
        if (subData?.isAdmin) {
          setIsAdmin(true);
          await loadUsers();
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error("Error checking admin via subscription:", error);
      }
    }

    toast.error("غير مصرح: ليس لديك صلاحيات الأدمن");
    navigate("/");
  };

  const loadUsers = async () => {
    try {
      const deviceId = localStorage.getItem("deviceId");
      const { data, error } = await supabase.functions.invoke('admin-list-users', {
        body: { deviceId }
      });
      
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

  const handleExtendSubscription = async () => {
    if (!selectedSubId || !extendMonths) {
      toast.error("يرجى إدخال مدة التمديد");
      return;
    }

    try {
      setExtending(true);
      const { data, error } = await supabase.functions.invoke('extend-manual-subscription', {
        body: { subscriptionId: selectedSubId, additionalMonths: extendMonths }
      });
      
      if (error) throw error;
      
      toast.success("تم تمديد الاشتراك بنجاح");
      setExtendDialogOpen(false);
      setSelectedSubId(null);
      setExtendMonths("1");
      await loadUsers();
    } catch (error: any) {
      console.error("Error extending subscription:", error);
      toast.error(error.message || "حدث خطأ أثناء تمديد الاشتراك");
    } finally {
      setExtending(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm("هل أنت متأكد من إلغاء هذا الاشتراك؟")) {
      return;
    }

    try {
      setCancelling(subscriptionId);
      const { data, error } = await supabase.functions.invoke('cancel-manual-subscription', {
        body: { subscriptionId }
      });
      
      if (error) throw error;
      
      toast.success("تم إلغاء الاشتراك بنجاح");
      await loadUsers();
    } catch (error: any) {
      console.error("Error cancelling subscription:", error);
      toast.error(error.message || "حدث خطأ أثناء إلغاء الاشتراك");
    } finally {
      setCancelling(null);
    }
  };

  const openExtendDialog = (subscriptionId: string) => {
    setSelectedSubId(subscriptionId);
    setExtendDialogOpen(true);
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
                  <TableHead className="text-right">تاريخ البداية</TableHead>
                  <TableHead className="text-right">تاريخ الانتهاء</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
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
                      {user.created_at 
                        ? new Date(user.created_at).toLocaleDateString('ar-SA', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {user.expiresAt 
                        ? new Date(user.expiresAt).toLocaleDateString('ar-SA', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {user.subscriptionSource === 'stripe' && user.subscriptionStatus === 'active' && (
                        <div className="flex gap-2">
                          <Badge variant="secondary">Stripe - نشط</Badge>
                        </div>
                      )}
                      {user.subscriptionSource === 'device' && user.subscriptionStatus === 'active' && (
                        <div className="flex gap-2">
                          <Badge variant="secondary">جهاز - نشط</Badge>
                        </div>
                      )}
                      {user.subscriptionSource === 'manual' && user.subscriptionId && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openExtendDialog(user.subscriptionId!)}
                          >
                            <Clock className="h-4 w-4 ml-1" />
                            تمديد
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleCancelSubscription(user.subscriptionId!)}
                            disabled={cancelling === user.subscriptionId}
                          >
                            {cancelling === user.subscriptionId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 ml-1" />
                                إلغاء
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                      {!user.subscriptionSource && '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </main>

      {/* Extend Subscription Dialog */}
      <Dialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تمديد الاشتراك</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">مدة التمديد (بالأشهر)</label>
              <Input
                type="number"
                min="1"
                value={extendMonths}
                onChange={(e) => setExtendMonths(e.target.value)}
                placeholder="عدد الأشهر"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setExtendDialogOpen(false)}
                disabled={extending}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleExtendSubscription}
                disabled={extending || !extendMonths}
              >
                {extending ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري التمديد...
                  </>
                ) : (
                  "تمديد الاشتراك"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
