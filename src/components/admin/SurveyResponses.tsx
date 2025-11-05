import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileDown, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const SurveyResponses = () => {
  const { toast } = useToast();
  const [responses, setResponses] = useState<any[]>([]);
  const [incompleteResponses, setIncompleteResponses] = useState<any[]>([]);
  const [filteredResponses, setFilteredResponses] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("completed");
  const [panchayaths, setPanchayaths] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);

  const [filterPanchayath, setFilterPanchayath] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSubCategory, setFilterSubCategory] = useState("");
  const [filterProgram, setFilterProgram] = useState("");

  const [editingResponse, setEditingResponse] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchResponses();
    fetchIncompleteResponses();
    fetchPanchayaths();
    fetchCategories();
    fetchSubCategories();
    fetchPrograms();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [responses, incompleteResponses, filterPanchayath, filterCategory, filterSubCategory, filterProgram, activeTab]);

  const fetchResponses = async () => {
    const { data } = await supabase
      .from("survey_responses")
      .select(`
        *,
        panchayaths(name_en, name_ml, district),
        categories(name),
        sub_categories(name),
        programs(name)
      `)
      .order("created_at", { ascending: false });
    if (data) setResponses(data);
  };

  const fetchIncompleteResponses = async () => {
    const { data } = await supabase
      .from("incomplete_surveys")
      .select(`
        *,
        panchayaths(name_en, name_ml, district)
      `)
      .order("created_at", { ascending: false });
    if (data) setIncompleteResponses(data);
  };

  const fetchPanchayaths = async () => {
    const { data } = await supabase.from("panchayaths").select("*").order("name_en");
    if (data) setPanchayaths(data);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    if (data) setCategories(data);
  };

  const fetchSubCategories = async () => {
    const { data } = await supabase.from("sub_categories").select("*").order("name");
    if (data) setSubCategories(data);
  };

  const fetchPrograms = async () => {
    const { data } = await supabase.from("programs").select("*").order("name");
    if (data) setPrograms(data);
  };

  const applyFilters = () => {
    let filtered: any[] = [];

    // Filter by tab first
    if (activeTab === "completed") {
      filtered = [...responses];
      
      if (filterPanchayath) {
        filtered = filtered.filter((r) => r.panchayath_id === filterPanchayath);
      }
      if (filterCategory) {
        filtered = filtered.filter((r) => r.category_id === filterCategory);
      }
      if (filterSubCategory) {
        filtered = filtered.filter((r) => r.sub_category_id === filterSubCategory);
      }
      if (filterProgram) {
        filtered = filtered.filter((r) => r.program_id === filterProgram);
      }
    } else {
      filtered = [...incompleteResponses];
      
      if (filterPanchayath) {
        filtered = filtered.filter((r) => r.panchayath_id === filterPanchayath);
      }
    }

    setFilteredResponses(filtered);
  };

  const exportToExcel = () => {
    const data = filteredResponses.map((r: any) => ({
      Name: r.name,
      "Mobile Number": r.mobile_number,
      Age: r.age,
      Panchayath: r.panchayaths?.name_en,
      "Panchayath (ML)": r.panchayaths?.name_ml,
      District: r.panchayaths?.district,
      Ward: r.ward_number,
      Category: r.categories?.name || "N/A",
      "Sub-Category": r.sub_categories?.name || "N/A",
      Program: r.programs?.name || r.custom_program || "N/A",
      Date: new Date(r.created_at).toLocaleDateString(),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Survey Responses");
    XLSX.writeFile(wb, "survey_responses.xlsx");

    toast({ title: "Success", description: "Exported to Excel successfully" });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text("Survey Responses", 14, 15);

    const tableData = filteredResponses.map((r: any) => [
      r.name,
      r.mobile_number,
      r.age,
      r.panchayaths?.name_en,
      r.ward_number,
      r.categories?.name || "N/A",
      r.programs?.name || r.custom_program || "N/A",
    ]);

    autoTable(doc, {
      head: [["Name", "Mobile", "Age", "Panchayath", "Ward", "Category", "Program"]],
      body: tableData,
      startY: 25,
      styles: { fontSize: 8 },
    });

    doc.save("survey_responses.pdf");
    toast({ title: "Success", description: "Exported to PDF successfully" });
  };

  const handleEdit = (response: any) => {
    setEditingResponse(response);
  };

  const handleUpdate = async () => {
    if (!editingResponse) return;

    const { error } = await supabase
      .from("survey_responses")
      .update({
        name: editingResponse.name,
        mobile_number: editingResponse.mobile_number,
        age: editingResponse.age,
        ward_number: editingResponse.ward_number,
        custom_program: editingResponse.custom_program,
      })
      .eq("id", editingResponse.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Success", description: "Response updated successfully" });
      setEditingResponse(null);
      fetchResponses();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const tableName = activeTab === "completed" ? "survey_responses" : "incomplete_surveys";
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq("id", deleteId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Success", description: "Response deleted successfully" });
      setDeleteId(null);
      if (activeTab === "completed") {
        fetchResponses();
      } else {
        fetchIncompleteResponses();
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Survey Responses</CardTitle>
          <CardDescription>View and manage survey data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="completed">Submission Report</TabsTrigger>
              <TabsTrigger value="incomplete">Visited but Not Submitted</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4 mt-4">
              <div className="grid md:grid-cols-4 gap-4">
                <Select value={filterPanchayath} onValueChange={setFilterPanchayath}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Panchayath" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value=" ">All Panchayaths</SelectItem>
                    {panchayaths.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name_en} / {p.name_ml}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {activeTab === "completed" && (
                  <>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by Category" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value=" ">All Categories</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={filterSubCategory} onValueChange={setFilterSubCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by Sub-Category" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value=" ">All Sub-Categories</SelectItem>
                        {subCategories.map((sc) => (
                          <SelectItem key={sc.id} value={sc.id}>
                            {sc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={filterProgram} onValueChange={setFilterProgram}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by Program" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value=" ">All Programs</SelectItem>
                        {programs.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={exportToExcel} variant="outline">
                  <FileDown className="mr-2 h-4 w-4" />
                  Export to Excel
                </Button>
                <Button onClick={exportToPDF} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export to PDF
                </Button>
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Mobile</TableHead>
                      {activeTab === "completed" && <TableHead>Age</TableHead>}
                      <TableHead>Panchayath</TableHead>
                      <TableHead>Ward</TableHead>
                      {activeTab === "completed" && (
                        <>
                          <TableHead>Category</TableHead>
                          <TableHead>Sub-Category</TableHead>
                          <TableHead>Program</TableHead>
                        </>
                      )}
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResponses.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.name}</TableCell>
                        <TableCell>{r.mobile_number}</TableCell>
                        {activeTab === "completed" && <TableCell>{r.age}</TableCell>}
                        <TableCell>
                          {r.panchayaths?.name_en || "—"} {r.panchayaths?.name_ml ? `/ ${r.panchayaths.name_ml}` : ""} {r.panchayaths?.district ? `(${r.panchayaths.district})` : ""}
                        </TableCell>
                        <TableCell>{r.ward_number || "—"}</TableCell>
                        {activeTab === "completed" && (
                          <>
                            <TableCell>{r.categories?.name || "—"}</TableCell>
                            <TableCell>{r.sub_categories?.name || "—"}</TableCell>
                            <TableCell>
                              {r.programs?.name || r.custom_program || "—"}
                            </TableCell>
                          </>
                        )}
                        <TableCell>
                          {new Date(r.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {activeTab === "completed" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(r)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeleteId(r.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredResponses.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  {activeTab === "completed" 
                    ? "No completed submissions found" 
                    : "No incomplete visits found"}
                </p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingResponse} onOpenChange={() => setEditingResponse(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Survey Response</DialogTitle>
            <DialogDescription>Update the survey response details</DialogDescription>
          </DialogHeader>
          {editingResponse && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editingResponse.name}
                  onChange={(e) =>
                    setEditingResponse({ ...editingResponse, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-mobile">Mobile Number</Label>
                <Input
                  id="edit-mobile"
                  value={editingResponse.mobile_number}
                  onChange={(e) =>
                    setEditingResponse({
                      ...editingResponse,
                      mobile_number: e.target.value.replace(/\D/g, "").slice(0, 10),
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-age">Age</Label>
                <Input
                  id="edit-age"
                  type="number"
                  value={editingResponse.age}
                  onChange={(e) =>
                    setEditingResponse({
                      ...editingResponse,
                      age: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-ward">Ward Number</Label>
                <Input
                  id="edit-ward"
                  type="number"
                  value={editingResponse.ward_number}
                  onChange={(e) =>
                    setEditingResponse({
                      ...editingResponse,
                      ward_number: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-custom-program">Custom Program</Label>
                <Input
                  id="edit-custom-program"
                  value={editingResponse.custom_program || ""}
                  onChange={(e) =>
                    setEditingResponse({
                      ...editingResponse,
                      custom_program: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingResponse(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the survey response.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SurveyResponses;