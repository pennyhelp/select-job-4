import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, Search, Info } from "lucide-react";
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
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [totalPanchayaths, setTotalPanchayaths] = useState(0);
  
  const [selectedPanchayath, setSelectedPanchayath] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const [name, setName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [age, setAge] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [customProgram, setCustomProgram] = useState("");
  const [programDialogOpen, setProgramDialogOpen] = useState(false);
  const [programSearch, setProgramSearch] = useState("");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedProgramDetail, setSelectedProgramDetail] = useState<any>(null);
  const [showCustomProgram, setShowCustomProgram] = useState(false);

  useEffect(() => {
    fetchPanchayaths();
    fetchCategories();
    fetchPrograms();
    fetchStats();
  }, []);

  const fetchPanchayaths = async () => {
    const { data } = await supabase.from("panchayaths").select("*").order("name_en");
    if (data) setPanchayaths(data);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    if (data) {
      setCategories(data);
      if (data.length > 0) setSelectedCategory(data[0].id);
    }
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

  const fetchStats = async () => {
    const { count: submissionsCount } = await supabase
      .from("survey_responses")
      .select("*", { count: "exact", head: true });
    
    const { count: panchayathsCount } = await supabase
      .from("panchayaths")
      .select("*", { count: "exact", head: true });

    if (submissionsCount !== null) setTotalSubmissions(submissionsCount);
    if (panchayathsCount !== null) setTotalPanchayaths(panchayathsCount);
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

    if (!selectedProgram && !customProgram.trim()) {
      toast({
        title: "Error",
        description: "Please select a program or enter your own",
        variant: "destructive",
      });
      return;
    }

    if (customProgram.trim().length > 200) {
      toast({
        title: "Error",
        description: "Program name must be less than 200 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Check for duplicate mobile number
    const { data: existingResponse } = await supabase
      .from("survey_responses")
      .select("id")
      .eq("mobile_number", mobileNumber)
      .maybeSingle();

    if (existingResponse) {
      toast({
        title: "Duplicate Entry",
        description: "This mobile number has already been submitted.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

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
      custom_program: customProgram.trim() || null,
    });

    if (error) {
      toast({
        title: "Submission Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setSubmitted(true);
      fetchStats(); // Refresh the stats after successful submission
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
    <div className="min-h-screen bg-[var(--gradient-hero)]">
      <nav className="border-b backdrop-blur-sm" style={{ background: 'var(--navbar-bg)' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-lg text-white">Survey Portal</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.location.href = '/'}
              className="text-white hover:text-white/80"
            >
              Home
            </Button>
          </div>
          <Link to="/auth">
            <Button variant="secondary" size="sm">
              Admin Login
            </Button>
          </Link>
        </div>
      </nav>
      
      <div className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent mb-3">
            Self Employment Program Survey
          </h1>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent mb-4">
            സ്വയം തൊഴിൽ പദ്ധതി സർവേ
          </h2>
          <p className="text-lg text-muted-foreground">
            Help us understand your employment preferences / നിങ്ങളുടെ തൊഴിൽ മുൻഗണനകൾ മനസ്സിലാക്കാൻ ഞങ്ങളെ സഹായിക്കുക
          </p>
          
          <div className="flex justify-center gap-4 mt-6 mb-4">
            <Card className="bg-card/80 backdrop-blur border-primary/20 shadow-glow">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-1">Total Submissions</p>
                <p className="text-2xl font-bold text-primary">{1000 + totalSubmissions}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/80 backdrop-blur border-accent/20 shadow-glow">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-1">Panchayaths</p>
                <p className="text-2xl font-bold text-accent">{totalPanchayaths}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="shadow-elevated bg-[var(--gradient-card)] border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Survey Form / സർവേ ഫോം</CardTitle>
            <CardDescription>Please fill in all the required information / ആവശ്യമായ എല്ലാ വിവരങ്ങളും പൂരിപ്പിക്കുക</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="program" className="text-base">
                  Select Program / പദ്ധതി തിരഞ്ഞെടുക്കുക
                </Label>
                <Dialog open={programDialogOpen} onOpenChange={setProgramDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start text-left border-2 h-auto min-h-10 py-2"
                    >
                      {selectedProgram 
                        ? programs.find(p => p.id === selectedProgram)?.name
                        : customProgram
                        ? customProgram
                        : "Select program / പദ്ധതി തിരഞ്ഞെടുക്കുക"
                      }
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                      <DialogTitle>Select Program / പദ്ധതി തിരഞ്ഞെടുക്കുക</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {categories.map((category) => (
                        <Button
                          key={category.id}
                          type="button"
                          size="sm"
                          variant={selectedCategory === category.id ? "default" : "outline"}
                          onClick={() => {
                            setSelectedCategory(category.id);
                            setProgramSearch("");
                          }}
                        >
                          {category.name}
                        </Button>
                      ))}
                    </div>
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search programs... / പദ്ധതികൾ തിരയുക..."
                        value={programSearch}
                        onChange={(e) => setProgramSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="mb-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full border-2 border-dashed"
                        onClick={() => {
                          setSelectedProgram("");
                          setShowCustomProgram(true);
                          setProgramSearch("");
                          setTimeout(() => {
                            document.getElementById("custom-program-input")?.focus();
                          }, 100);
                        }}
                      >
                        ഇവയിൽ ഒന്നുമല്ലാത്തത് (None of these)
                      </Button>
                    </div>
                    {showCustomProgram && (
                      <div className="mb-4 p-4 border-2 border-primary rounded-lg bg-accent/50">
                        <Label htmlFor="custom-program-input" className="text-base mb-2 block">
                          Your Own Program / നിങ്ങളുടെ സ്വന്തം പദ്ധതി
                        </Label>
                        <Input
                          id="custom-program-input"
                          placeholder="Enter your program idea / നിങ്ങളുടെ പദ്ധതി"
                          value={customProgram}
                          onChange={(e) => setCustomProgram(e.target.value)}
                          className="border-2"
                          maxLength={200}
                        />
                        <div className="mt-3 flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              if (customProgram.trim()) {
                                setProgramDialogOpen(false);
                                setProgramSearch("");
                              } else {
                                toast({
                                  title: "Error",
                                  description: "Please enter a program name",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            സമർപ്പിക്കുക (Submit)
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setShowCustomProgram(false);
                              setCustomProgram("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="overflow-y-auto flex-1 space-y-2 pr-2">
                      {programs
                        .filter(p => 
                          p.category_id === selectedCategory &&
                          (p.name.toLowerCase().includes(programSearch.toLowerCase()) ||
                          p.category?.name.toLowerCase().includes(programSearch.toLowerCase()) ||
                          p.sub_category?.name.toLowerCase().includes(programSearch.toLowerCase()))
                        )
                        .map((p) => (
                          <div
                            key={p.id}
                            className={`flex items-start gap-2 p-4 rounded-lg border-2 transition-all ${
                              selectedProgram === p.id ? 'border-primary bg-accent' : 'border-border'
                            }`}
                          >
                            <div className="flex-1">
                              <div className="font-medium">{p.name}</div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {p.category?.name} → {p.sub_category?.name}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 shrink-0">
                              {p.description && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => {
                                    setSelectedProgramDetail(p);
                                    setDetailDialogOpen(true);
                                  }}
                                >
                                  കൂടുതൽ അറിയാൻ
                                </Button>
                              )}
                              <Button
                                type="button"
                                size="sm"
                                variant="default"
                                onClick={() => {
                                  setSelectedProgram(p.id);
                                  setShowCustomProgram(false);
                                  setCustomProgram("");
                                  setProgramDialogOpen(false);
                                  setProgramSearch("");
                                }}
                              >
                                താല്പര്യമുണ്ട്
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{selectedProgramDetail?.name}</DialogTitle>
                    <DialogDescription>
                      {selectedProgramDetail?.category?.name} → {selectedProgramDetail?.sub_category?.name}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedProgramDetail?.description}
                    </p>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="panchayath" className="text-base">
                    Panchayath / പഞ്ചായത്ത് *
                  </Label>
                  <Select value={selectedPanchayath} onValueChange={setSelectedPanchayath}>
                    <SelectTrigger id="panchayath" className="border-2">
                      <SelectValue placeholder="Select panchayath / പഞ്ചായത്ത് തിരഞ്ഞെടുക്കുക" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {panchayaths.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name_en} / {p.name_ml} ({p.district})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ward" className="text-base">
                    Ward Number / വാർഡ് നമ്പർ *
                  </Label>
                  <Select value={selectedWard} onValueChange={setSelectedWard} disabled={!selectedPanchayath}>
                    <SelectTrigger id="ward" className="border-2">
                      <SelectValue placeholder="Select ward / വാർഡ് തിരഞ്ഞെടുക്കുക" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {wardNumbers.map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          Ward {num} / വാർഡ് {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base">
                    Name / പേര് *
                  </Label>
                  <Input
                    id="name"
                    placeholder="Enter your name / നിങ്ങളുടെ പേര്"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={100}
                    className="border-2"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile" className="text-base">
                    Mobile Number / മൊബൈൽ നമ്പർ *
                  </Label>
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="10-digit / 10 അക്കം"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    required
                    maxLength={10}
                    className="border-2"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="age" className="text-base">
                  Age / പ്രായം *
                </Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Enter your age / പ്രായം"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                  min="1"
                  max="150"
                  className="border-2"
                />
              </div>

              <Button type="submit" className="w-full text-lg py-6 shadow-glow" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting... / സമർപ്പിക്കുന്നു...
                  </>
                ) : (
                  "Submit Survey / സമർപ്പിക്കുക"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;