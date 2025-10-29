import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const ProgramManagement = () => {
  const { toast } = useToast();
  const [programs, setPrograms] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [programName, setProgramName] = useState("");
  const [programDescription, setProgramDescription] = useState("");
  const [programPriority, setProgramPriority] = useState("0");
  const [programIsTop, setProgramIsTop] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [editingProgram, setEditingProgram] = useState<any>(null);
  const [editProgramName, setEditProgramName] = useState("");
  const [editProgramDescription, setEditProgramDescription] = useState("");
  const [editProgramPriority, setEditProgramPriority] = useState("0");
  const [editProgramIsTop, setEditProgramIsTop] = useState(false);
  const [editProgramCategory, setEditProgramCategory] = useState("");
  const [editProgramSubCategory, setEditProgramSubCategory] = useState("");
  const [editSubCategories, setEditSubCategories] = useState<any[]>([]);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSubCategory, setFilterSubCategory] = useState("");
  const [filterSubCategories, setFilterSubCategories] = useState<any[]>([]);

  useEffect(() => {
    fetchCategories();
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchSubCategories(selectedCategory);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (editProgramCategory) {
      fetchEditSubCategories(editProgramCategory);
    }
  }, [editProgramCategory]);

  useEffect(() => {
    if (filterCategory) {
      fetchFilterSubCategories(filterCategory);
    } else {
      setFilterSubCategories([]);
      setFilterSubCategory("");
    }
  }, [filterCategory]);

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    if (data) setCategories(data);
  };

  const fetchSubCategories = async (categoryId: string) => {
    const { data } = await supabase
      .from("sub_categories")
      .select("*")
      .eq("category_id", categoryId)
      .order("name");
    if (data) setSubCategories(data);
  };

  const fetchEditSubCategories = async (categoryId: string) => {
    const { data } = await supabase
      .from("sub_categories")
      .select("*")
      .eq("category_id", categoryId)
      .order("name");
    if (data) setEditSubCategories(data);
  };

  const fetchFilterSubCategories = async (categoryId: string) => {
    const { data } = await supabase
      .from("sub_categories")
      .select("*")
      .eq("category_id", categoryId)
      .order("name");
    if (data) setFilterSubCategories(data);
  };

  const fetchPrograms = async () => {
    const { data } = await supabase
      .from("programs")
      .select("*, categories(name), sub_categories(name)")
      .order("is_top", { ascending: false })
      .order("priority", { ascending: false })
      .order("name");
    if (data) setPrograms(data);
  };

  const handleAddProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase.from("programs").insert({
      category_id: selectedCategory,
      sub_category_id: selectedSubCategory,
      name: programName,
      description: programDescription,
      priority: parseInt(programPriority),
      is_top: programIsTop,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Success", description: "Program added successfully" });
      setProgramName("");
      setProgramDescription("");
      setProgramPriority("0");
      setProgramIsTop(false);
      setSelectedCategory("");
      setSelectedSubCategory("");
      fetchPrograms();
    }
  };

  const handleDeleteProgram = async (id: string) => {
    const { error } = await supabase.from("programs").delete().eq("id", id);
    
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Success", description: "Program deleted successfully" });
      fetchPrograms();
    }
  };

  const handleEditProgram = (program: any) => {
    setEditingProgram(program);
    setEditProgramName(program.name);
    setEditProgramDescription(program.description || "");
    setEditProgramPriority(String(program.priority || 0));
    setEditProgramIsTop(program.is_top || false);
    setEditProgramCategory(program.category_id);
    setEditProgramSubCategory(program.sub_category_id);
  };

  const handleUpdateProgram = async () => {
    const { error } = await supabase
      .from("programs")
      .update({
        name: editProgramName,
        description: editProgramDescription,
        priority: parseInt(editProgramPriority),
        is_top: editProgramIsTop,
        category_id: editProgramCategory,
        sub_category_id: editProgramSubCategory,
      })
      .eq("id", editingProgram.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Success", description: "Program updated successfully" });
      setEditingProgram(null);
      fetchPrograms();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Program</CardTitle>
          <CardDescription>Create a new program under a sub-category</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddProgram} className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="progcat">Category</Label>
                <Select value={selectedCategory} onValueChange={(val) => {
                  setSelectedCategory(val);
                  setSelectedSubCategory("");
                }}>
                  <SelectTrigger id="progcat">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="progsub">Sub-Category</Label>
                <Select 
                  value={selectedSubCategory} 
                  onValueChange={setSelectedSubCategory}
                  disabled={!selectedCategory}
                >
                  <SelectTrigger id="progsub">
                    <SelectValue placeholder="Select sub-category" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {subCategories.map((sc) => (
                      <SelectItem key={sc.id} value={sc.id}>
                        {sc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="progname">Program Name</Label>
                <Input
                  id="progname"
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="progdesc">Description (Optional)</Label>
              <Textarea
                id="progdesc"
                value={programDescription}
                onChange={(e) => setProgramDescription(e.target.value)}
                placeholder="Enter program description..."
                className="min-h-[100px]"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="progpriority">Priority</Label>
                <Input
                  id="progpriority"
                  type="number"
                  value={programPriority}
                  onChange={(e) => setProgramPriority(e.target.value)}
                  placeholder="0"
                  min="0"
                />
                <p className="text-xs text-muted-foreground">Higher numbers = higher priority</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="progistop">Mark as Top 10</Label>
                <div className="flex items-center h-10">
                  <Switch
                    id="progistop"
                    checked={programIsTop}
                    onCheckedChange={setProgramIsTop}
                  />
                  <span className="ml-2 text-sm text-muted-foreground">
                    {programIsTop ? "Top 10 Program" : "Regular Program"}
                  </span>
                </div>
              </div>
            </div>
            <Button type="submit" disabled={!selectedSubCategory}>
              Add Program
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Programs List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Label htmlFor="filter-cat">Filter by Category</Label>
              <Select value={filterCategory} onValueChange={(val) => {
                setFilterCategory(val);
                setFilterSubCategory("");
              }}>
                <SelectTrigger id="filter-cat">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="filter-sub">Filter by Sub-Category</Label>
              <Select 
                value={filterSubCategory} 
                onValueChange={setFilterSubCategory}
                disabled={!filterCategory || filterCategory === "all"}
              >
                <SelectTrigger id="filter-sub">
                  <SelectValue placeholder="All Sub-Categories" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="all">All Sub-Categories</SelectItem>
                  {filterSubCategories.map((sc) => (
                    <SelectItem key={sc.id} value={sc.id}>
                      {sc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(filterCategory || filterSubCategory) && (
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFilterCategory("");
                    setFilterSubCategory("");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Sub-Category</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Top 10</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs
                .filter((p: any) => {
                  if (filterCategory && filterCategory !== "all" && p.category_id !== filterCategory) return false;
                  if (filterSubCategory && filterSubCategory !== "all" && p.sub_category_id !== filterSubCategory) return false;
                  return true;
                })
                .map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>{p.categories?.name}</TableCell>
                  <TableCell>{p.sub_categories?.name}</TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{p.priority || 0}</Badge>
                  </TableCell>
                  <TableCell>
                    {p.is_top && <Badge variant="default">Top 10</Badge>}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditProgram(p)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteProgram(p.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editingProgram} onOpenChange={() => setEditingProgram(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Program</DialogTitle>
            <DialogDescription>Update program details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-prog-cat">Category</Label>
                <Select 
                  value={editProgramCategory} 
                  onValueChange={(val) => {
                    setEditProgramCategory(val);
                    setEditProgramSubCategory("");
                  }}
                >
                  <SelectTrigger id="edit-prog-cat">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-prog-sub">Sub-Category</Label>
                <Select 
                  value={editProgramSubCategory} 
                  onValueChange={setEditProgramSubCategory}
                  disabled={!editProgramCategory}
                >
                  <SelectTrigger id="edit-prog-sub">
                    <SelectValue placeholder="Select sub-category" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {editSubCategories.map((sc) => (
                      <SelectItem key={sc.id} value={sc.id}>
                        {sc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-prog-name">Program Name</Label>
              <Input
                id="edit-prog-name"
                value={editProgramName}
                onChange={(e) => setEditProgramName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-prog-desc">Description</Label>
              <Textarea
                id="edit-prog-desc"
                value={editProgramDescription}
                onChange={(e) => setEditProgramDescription(e.target.value)}
                placeholder="Enter program description..."
                className="min-h-[100px]"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-prog-priority">Priority</Label>
                <Input
                  id="edit-prog-priority"
                  type="number"
                  value={editProgramPriority}
                  onChange={(e) => setEditProgramPriority(e.target.value)}
                  min="0"
                />
                <p className="text-xs text-muted-foreground">Higher numbers = higher priority</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-prog-istop">Mark as Top 10</Label>
                <div className="flex items-center h-10">
                  <Switch
                    id="edit-prog-istop"
                    checked={editProgramIsTop}
                    onCheckedChange={setEditProgramIsTop}
                  />
                  <span className="ml-2 text-sm text-muted-foreground">
                    {editProgramIsTop ? "Top 10 Program" : "Regular Program"}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProgram(null)}>Cancel</Button>
            <Button onClick={handleUpdateProgram}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProgramManagement;