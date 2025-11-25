import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  subscribed: boolean;
  subscriptionEnd: string | null;
  productId: string | null;
  checkingSubscription: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  checkSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const { toast } = useToast();

  const checkSubscription = async () => {
    setCheckingSubscription(true);
    try {
      // الحصول على معرف الجهاز من localStorage
      let deviceId = localStorage.getItem("deviceId");
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem("deviceId", deviceId);
      }

      const { data, error } = await supabase.functions.invoke("check-subscription", {
        body: { deviceId }
      });
      
      if (error) {
        console.error("Error checking subscription:", error);
        setSubscribed(false);
      } else {
        setSubscribed(data?.subscribed || false);
        setSubscriptionEnd(data?.subscription_end || null);
        setProductId(data?.product_id || null);
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
      setSubscribed(false);
    } finally {
      setCheckingSubscription(false);
    }
  };

  useEffect(() => {
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      // التحقق من الاشتراك بغض النظر عن حالة تسجيل الدخول
      await checkSubscription();
      
      setLoading(false);
    };

    initAuth();

    return () => {
      authSubscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // التحقق الدوري من الاشتراك كل دقيقة
    const interval = setInterval(() => {
      checkSubscription();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    
    if (error) {
      toast({
        title: "خطأ في التسجيل",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم التسجيل بنجاح",
        description: "يمكنك الآن تسجيل الدخول",
      });
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: error.message,
        variant: "destructive",
      });
    }
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "تم تسجيل الخروج",
      description: "نراك قريباً",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        subscribed,
        subscriptionEnd,
        productId,
        checkingSubscription,
        signUp,
        signIn,
        signOut,
        checkSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
