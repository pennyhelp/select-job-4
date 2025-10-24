import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";

const ProgramManagement = () => {
  const { toast } = useToast();
  const [programs, setPrograms] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [programName, setProgramName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");

  useEffect(() => {
    fetchCategories();
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchSubCategories(selectedCategory);
    }
  }, [selectedCategory]);

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

  const fetchPrograms = async () => {
    const { data } = await supabase
      .from("programs")
      .select("*, categories(name), sub_categories(name)")
      .order("name");
    if (data) setPrograms(data);
  };

  const handleAddProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase.from("programs").insert({
      category_id: selectedCategory,
      sub_category_id: selectedSubCategory,
      name: programName,
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Sub-Category</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>{p.categories?.name}</TableCell>
                  <TableCell>{p.sub_categories?.name}</TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteProgram(p.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgramManagement;