import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Panchayath {
  id: string;
  name_en: string;
  name_ml: string;
  district: string;
  ward_count: number;
}

interface PanchayathLead {
  panchayath_id: string;
  panchayath_name_en: string;
  panchayath_name_ml: string;
  total_submissions: number;
  total_views: number;
}

const LeadsManagement = () => {
  const [panchayaths, setPanchayaths] = useState<Panchayath[]>([]);
  const [leads, setLeads] = useState<PanchayathLead[]>([]);
  const [selectedPanchayath, setSelectedPanchayath] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPanchayaths();
    fetchLeads();
  }, []);

  useEffect(() => {
    if (selectedPanchayath) {
      fetchLeads();
    }
  }, [selectedPanchayath]);

  const fetchPanchayaths = async () => {
    try {
      const { data, error } = await supabase
        .from("panchayaths")
        .select("*")
        .order("name_en");

      if (error) throw error;
      setPanchayaths(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching panchayaths",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      // Fetch submissions
      const { data: responses, error: responsesError } = await supabase
        .from("survey_responses")
        .select(`
          panchayath_id,
          panchayaths (
            name_en,
            name_ml
          )
        `);

      if (responsesError) throw responsesError;

      // Fetch views
      const { data: views, error: viewsError } = await supabase
        .from("panchayath_views" as any)
        .select(`
          panchayath_id,
          panchayaths (
            name_en,
            name_ml
          )
        `);

      if (viewsError) throw viewsError;

      // Count submissions per panchayath
      const leadCounts: Record<string, PanchayathLead> = {};

      responses?.forEach((response: any) => {
        const panchayathId = response.panchayath_id;
        if (!leadCounts[panchayathId]) {
          leadCounts[panchayathId] = {
            panchayath_id: panchayathId,
            panchayath_name_en: response.panchayaths?.name_en || "Unknown",
            panchayath_name_ml: response.panchayaths?.name_ml || "അറിയില്ല",
            total_submissions: 0,
            total_views: 0,
          };
        }
        leadCounts[panchayathId].total_submissions += 1;
      });

      // Count views per panchayath
      views?.forEach((view: any) => {
        const panchayathId = view.panchayath_id;
        if (!leadCounts[panchayathId]) {
          leadCounts[panchayathId] = {
            panchayath_id: panchayathId,
            panchayath_name_en: view.panchayaths?.name_en || "Unknown",
            panchayath_name_ml: view.panchayaths?.name_ml || "അറിയില്ല",
            total_submissions: 0,
            total_views: 0,
          };
        }
        leadCounts[panchayathId].total_views += 1;
      });

      setLeads(Object.values(leadCounts));
    } catch (error: any) {
      toast({
        title: "Error fetching leads",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = selectedPanchayath === "all"
    ? leads
    : leads.filter(lead => lead.panchayath_id === selectedPanchayath);

  const totalSubmissions = filteredLeads.reduce((sum, lead) => sum + lead.total_submissions, 0);
  const totalViews = filteredLeads.reduce((sum, lead) => sum + lead.total_views, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Panchayath Leads</CardTitle>
          <CardDescription>
            View survey submission counts by panchayath
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={selectedPanchayath} onValueChange={setSelectedPanchayath}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Panchayaths</SelectItem>
                  {panchayaths.map((panchayath) => (
                    <SelectItem key={panchayath.id} value={panchayath.id}>
                      {panchayath.name_en} / {panchayath.name_ml}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-6">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold text-blue-600">{totalViews}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Submissions</p>
                <p className="text-2xl font-bold text-green-600">{totalSubmissions}</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Panchayath (English)</TableHead>
                    <TableHead>പഞ്ചായത്ത് (Malayalam)</TableHead>
                    <TableHead className="text-right">Shows (Views)</TableHead>
                    <TableHead className="text-right">Submissions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No data found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeads
                      .sort((a, b) => b.total_views - a.total_views)
                      .map((lead) => (
                        <TableRow key={lead.panchayath_id}>
                          <TableCell className="font-medium">{lead.panchayath_name_en}</TableCell>
                          <TableCell>{lead.panchayath_name_ml}</TableCell>
                          <TableCell className="text-right font-bold text-blue-600">{lead.total_views}</TableCell>
                          <TableCell className="text-right font-bold text-green-600">{lead.total_submissions}</TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadsManagement;
