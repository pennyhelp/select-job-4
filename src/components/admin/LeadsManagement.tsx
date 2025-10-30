import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, ChevronDown, ChevronRight } from "lucide-react";

interface Panchayath {
  id: string;
  name_en: string;
  name_ml: string;
  district: string;
  ward_count: number;
}

interface WardDetail {
  ward_number: number;
  views: number;
  submissions: number;
}

interface PanchayathLead {
  panchayath_id: string;
  panchayath_name_en: string;
  panchayath_name_ml: string;
  ward_count: number;
  total_submissions: number;
  total_views: number;
  ward_details: WardDetail[];
}

const LeadsManagement = () => {
  const [panchayaths, setPanchayaths] = useState<Panchayath[]>([]);
  const [leads, setLeads] = useState<PanchayathLead[]>([]);
  const [selectedPanchayath, setSelectedPanchayath] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

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
      // Fetch submissions with ward info
      const { data: responses, error: responsesError } = await supabase
        .from("survey_responses")
        .select("panchayath_id, ward_number");

      if (responsesError) throw responsesError;

      // Fetch views with ward info
      const { data: views, error: viewsError } = await supabase
        .from("panchayath_views" as any)
        .select("panchayath_id, ward_number");

      if (viewsError) throw viewsError;

      // Group by panchayath and ward
      const submissionsByPanchayathWard: Record<string, number> = {};
      const viewsByPanchayathWard: Record<string, number> = {};

      responses?.forEach((response: any) => {
        const key = `${response.panchayath_id}-${response.ward_number}`;
        submissionsByPanchayathWard[key] = (submissionsByPanchayathWard[key] || 0) + 1;
      });

      views?.forEach((view: any) => {
        const key = `${view.panchayath_id}-${view.ward_number}`;
        viewsByPanchayathWard[key] = (viewsByPanchayathWard[key] || 0) + 1;
      });

      // Build leads with ward details
      const leadsData: PanchayathLead[] = panchayaths.map((p) => {
        const wardDetails: WardDetail[] = [];
        for (let ward = 1; ward <= p.ward_count; ward++) {
          const key = `${p.id}-${ward}`;
          wardDetails.push({
            ward_number: ward,
            views: viewsByPanchayathWard[key] || 0,
            submissions: submissionsByPanchayathWard[key] || 0,
          });
        }

        return {
          panchayath_id: p.id,
          panchayath_name_en: p.name_en,
          panchayath_name_ml: p.name_ml,
          ward_count: p.ward_count,
          total_submissions: wardDetails.reduce((sum, w) => sum + w.submissions, 0),
          total_views: wardDetails.reduce((sum, w) => sum + w.views, 0),
          ward_details: wardDetails,
        };
      });

      setLeads(leadsData);
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
                        <>
                          <TableRow 
                            key={lead.panchayath_id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => toggleRow(lead.panchayath_id)}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {expandedRows.has(lead.panchayath_id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                                {lead.panchayath_name_en}
                              </div>
                            </TableCell>
                            <TableCell>{lead.panchayath_name_ml}</TableCell>
                            <TableCell className="text-right font-bold text-blue-600">{lead.total_views}</TableCell>
                            <TableCell className="text-right font-bold text-green-600">{lead.total_submissions}</TableCell>
                          </TableRow>
                          {expandedRows.has(lead.panchayath_id) && (
                            <TableRow key={`${lead.panchayath_id}-details`}>
                              <TableCell colSpan={4} className="bg-muted/30 p-4">
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-sm mb-3">Ward-wise Details:</h4>
                                  <div className="grid grid-cols-4 gap-3">
                                    {lead.ward_details.map((ward) => (
                                      <div 
                                        key={ward.ward_number} 
                                        className="border rounded-lg p-3 bg-background shadow-sm"
                                      >
                                        <div className="font-semibold text-sm mb-1">Ward {ward.ward_number}</div>
                                        <div className="text-xs text-blue-600">Views: {ward.views}</div>
                                        <div className="text-xs text-green-600">Submissions: {ward.submissions}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
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
