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
import LeadsManagement from "@/components/admin/LeadsManagement";

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
      <header className="sticky top-0 z-50 border-b shadow-sm" style={{ background: 'var(--navbar-bg)' }}>
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex justify-between items-center gap-2">
          <h1 className="text-lg sm:text-2xl font-bold text-white">Admin Panel</h1>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button onClick={() => navigate("/")} variant="ghost" size="sm" className="text-white hover:text-white/80 text-xs sm:text-sm">
              Home
            </Button>
            <Button onClick={handleLogout} variant="secondary" size="sm" className="text-xs sm:text-sm">
              <LogOut className="mr-0 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <Tabs defaultValue="responses" className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full gap-1 p-1" style={{ gridTemplateColumns: `repeat(${isSuperAdmin ? 6 : 5}, minmax(0, 1fr))` }}>
              <TabsTrigger value="responses" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3">Responses</TabsTrigger>
              <TabsTrigger value="leads" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3">Leads</TabsTrigger>
              <TabsTrigger value="panchayaths" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3">Panchayaths</TabsTrigger>
              <TabsTrigger value="categories" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3">Categories</TabsTrigger>
              <TabsTrigger value="programs" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3">Programs</TabsTrigger>
              {isSuperAdmin && (
                <TabsTrigger value="users" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3">Users</TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="responses">
            <SurveyResponses />
          </TabsContent>

          <TabsContent value="leads">
            <LeadsManagement />
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