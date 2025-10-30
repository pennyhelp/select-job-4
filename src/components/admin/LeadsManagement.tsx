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
      const { data: responses, error } = await supabase
        .from("survey_responses")
        .select(`
          panchayath_id,
          panchayaths (
            name_en,
            name_ml
          )
        `);

      if (error) throw error;

      // Count submissions per panchayath
      const leadCounts = responses?.reduce((acc: any, response: any) => {
        const panchayathId = response.panchayath_id;
        if (!acc[panchayathId]) {
          acc[panchayathId] = {
            panchayath_id: panchayathId,
            panchayath_name_en: response.panchayaths?.name_en || "Unknown",
            panchayath_name_ml: response.panchayaths?.name_ml || "അറിയില്ല",
            total_submissions: 0,
          };
        }
        acc[panchayathId].total_submissions += 1;
        return acc;
      }, {});

      setLeads(Object.values(leadCounts || {}));
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
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Submissions</p>
              <p className="text-2xl font-bold">{totalSubmissions}</p>
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
                    <TableHead className="text-right">Total Submissions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No submissions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeads.map((lead) => (
                      <TableRow key={lead.panchayath_id}>
                        <TableCell className="font-medium">{lead.panchayath_name_en}</TableCell>
                        <TableCell>{lead.panchayath_name_ml}</TableCell>
                        <TableCell className="text-right font-bold">{lead.total_submissions}</TableCell>
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
