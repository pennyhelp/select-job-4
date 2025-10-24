import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { z } from "zod";

const surveySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  mobileNumber: z.string().trim().regex(/^[0-9]{10}$/, "Mobile number must be 10 digits"),
  age: z.number().min(1, "Age must be at least 1").max(150, "Age must be less than 150"),
});

const Index = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [panchayaths, setPanchayaths] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  
  const [selectedPanchayath, setSelectedPanchayath] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const [name, setName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [age, setAge] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [customProgram, setCustomProgram] = useState("");

  useEffect(() => {
    fetchPanchayaths();
    fetchPrograms();
  }, []);

  const fetchPanchayaths = async () => {
    const { data } = await supabase.from("panchayaths").select("*").order("name");
    if (data) setPanchayaths(data);
  };

  const fetchPrograms = async () => {
    const { data } = await supabase
      .from("programs")
      .select(`
        *,
        category:categories(name),
        sub_category:sub_categories(name)
      `)
      .order("name");
    if (data) setPrograms(data);
  };

  const selectedPanchayathData = panchayaths.find(p => p.id === selectedPanchayath);
  const wardNumbers = selectedPanchayathData 
    ? Array.from({ length: selectedPanchayathData.ward_count }, (_, i) => i + 1)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      surveySchema.parse({
        name,
        mobileNumber,
        age: parseInt(age),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    if (!selectedPanchayath || !selectedWard) {
      toast({
        title: "Error",
        description: "Please select panchayath and ward",
        variant: "destructive",
      });
      return;
    }

    if (!selectedProgram && !customProgram) {
      toast({
        title: "Error",
        description: "Please select a program or enter your own",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const selectedProgramData = programs.find(p => p.id === selectedProgram);
    
    const { error } = await supabase.from("survey_responses").insert({
      panchayath_id: selectedPanchayath,
      ward_number: parseInt(selectedWard),
      name,
      mobile_number: mobileNumber,
      age: parseInt(age),
      category_id: selectedProgramData?.category_id || null,
      sub_category_id: selectedProgramData?.sub_category_id || null,
      program_id: selectedProgram || null,
      custom_program: customProgram || null,
    });

    if (error) {
      toast({
        title: "Submission Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setSubmitted(true);
      toast({
        title: "Success!",
        description: "Your survey response has been submitted.",
      });
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--gradient-hero)] p-4">
        <Card className="w-full max-w-md shadow-elevated text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-secondary" />
            </div>
            <CardTitle className="text-2xl">Thank You!</CardTitle>
            <CardDescription>Your response has been recorded successfully.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>Name:</strong> {name}</p>
              <p><strong>Mobile:</strong> {mobileNumber}</p>
              <p><strong>Age:</strong> {age}</p>
              <p><strong>Ward:</strong> {selectedWard}</p>
              <p><strong>Program:</strong> {
                selectedProgram 
                  ? programs.find(p => p.id === selectedProgram)?.name 
                  : customProgram
              }</p>
            </div>
            <Button
              onClick={() => window.location.reload()}
              className="mt-6 w-full"
            >
              Submit Another Response
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--gradient-hero)] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-3">
            Self Employment Program Survey
          </h1>
          <p className="text-lg text-muted-foreground">
            Help us understand your employment preferences
          </p>
          <Link to="/auth">
            <Button variant="outline" size="sm" className="mt-4">
              Admin Login
            </Button>
          </Link>
        </div>

        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>Survey Form</CardTitle>
            <CardDescription>Please fill in all the required information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="panchayath">Panchayath *</Label>
                  <Select value={selectedPanchayath} onValueChange={setSelectedPanchayath}>
                    <SelectTrigger id="panchayath">
                      <SelectValue placeholder="Select panchayath" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {panchayaths.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({p.district})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ward">Ward Number *</Label>
                  <Select value={selectedWard} onValueChange={setSelectedWard} disabled={!selectedPanchayath}>
                    <SelectTrigger id="ward">
                      <SelectValue placeholder="Select ward" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {wardNumbers.map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          Ward {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number *</Label>
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    required
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Enter your age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                  min="1"
                  max="150"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="program">Select Program</Label>
                <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                  <SelectTrigger id="program">
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {programs.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.category?.name} - {p.sub_category?.name} - {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom">Your Own Program (if not listed above)</Label>
                <Input
                  id="custom"
                  placeholder="Enter your program idea"
                  value={customProgram}
                  onChange={(e) => setCustomProgram(e.target.value)}
                  maxLength={200}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Survey"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;