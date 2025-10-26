import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut } from "lucide-react";
import PanchayathManagement from "@/components/admin/PanchayathManagement";
import CategoryManagement from "@/components/admin/CategoryManagement";
import ProgramManagement from "@/components/admin/ProgramManagement";
import SurveyResponses from "@/components/admin/SurveyResponses";
import UserManagement from "@/components/admin/UserManagement";

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    // Check if user is super admin
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "super_admin")
      .maybeSingle();

    setIsSuperAdmin(!!userRole);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--gradient-admin)' }}>
      <header className="border-b shadow-sm" style={{ background: 'var(--navbar-bg)' }}>
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <Button onClick={handleLogout} variant="secondary" size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="responses" className="space-y-6">
          <TabsList className={`grid w-full gap-1 ${isSuperAdmin ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5' : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-4'}`}>
            <TabsTrigger value="responses">Survey Responses</TabsTrigger>
            <TabsTrigger value="panchayaths">Panchayaths</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="programs">Programs</TabsTrigger>
            {isSuperAdmin && (
              <TabsTrigger value="users">User Management</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="responses">
            <SurveyResponses />
          </TabsContent>

          <TabsContent value="panchayaths">
            <PanchayathManagement />
          </TabsContent>

          <TabsContent value="categories">
            <CategoryManagement />
          </TabsContent>

          <TabsContent value="programs">
            <ProgramManagement />
          </TabsContent>

          {isSuperAdmin && (
            <TabsContent value="users">
              <UserManagement />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;