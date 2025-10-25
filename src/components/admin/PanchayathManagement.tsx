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

const PanchayathManagement = () => {
  const { toast } = useToast();
  const [panchayaths, setPanchayaths] = useState<any[]>([]);
  const [nameEn, setNameEn] = useState("");
  const [nameMl, setNameMl] = useState("");
  const [district, setDistrict] = useState("Malappuram");
  const [wardCount, setWardCount] = useState("");

  useEffect(() => {
    fetchPanchayaths();
  }, []);

  const fetchPanchayaths = async () => {
    const { data } = await supabase.from("panchayaths").select("*").order("name_en");
    if (data) setPanchayaths(data);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase.from("panchayaths").insert([{
      name_en: nameEn,
      name_ml: nameMl,
      district,
      ward_count: parseInt(wardCount),
    }]);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Success", description: "Panchayath added successfully" });
      setNameEn("");
      setNameMl("");
      setWardCount("");
      fetchPanchayaths();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("panchayaths").delete().eq("id", id);
    
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Success", description: "Panchayath deleted successfully" });
      fetchPanchayaths();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Panchayath</CardTitle>
          <CardDescription>Add new panchayath with district and ward information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pname_en">Panchayath Name (English)</Label>
                <Input
                  id="pname_en"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pname_ml">Panchayath Name (Malayalam)</Label>
                <Input
                  id="pname_ml"
                  value={nameMl}
                  onChange={(e) => setNameMl(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Select value={district} onValueChange={setDistrict}>
                  <SelectTrigger id="district">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="Malappuram">Malappuram</SelectItem>
                    <SelectItem value="Kozhikode">Kozhikode</SelectItem>
                    <SelectItem value="Palakkad">Palakkad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="wards">Ward Count</Label>
                <Input
                  id="wards"
                  type="number"
                  min="1"
                  value={wardCount}
                  onChange={(e) => setWardCount(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit">Add Panchayath</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Panchayaths List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name (English)</TableHead>
                <TableHead>Name (Malayalam)</TableHead>
                <TableHead>District</TableHead>
                <TableHead>Ward Count</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {panchayaths.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.name_en}</TableCell>
                  <TableCell>{p.name_ml}</TableCell>
                  <TableCell>{p.district}</TableCell>
                  <TableCell>{p.ward_count}</TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(p.id)}
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

export default PanchayathManagement;