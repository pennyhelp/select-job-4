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
  age: z.number().min(1, "Age must be at least 1").max(150, "Age must be less than 150")
});
const Index = () => {
  const {
    toast
  } = useToast();
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
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedProgramDetail, setSelectedProgramDetail] = useState<any>(null);
  const [showCustomProgram, setShowCustomProgram] = useState(false);
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [selectedJobCategory, setSelectedJobCategory] = useState<string>("");
  const [programSearch, setProgramSearch] = useState("");
  const [customProgramDialogOpen, setCustomProgramDialogOpen] = useState(false);
  const [panchayathWardDialogOpen, setPanchayathWardDialogOpen] = useState(false);
  const [viewTracked, setViewTracked] = useState(false);
  useEffect(() => {
    fetchPanchayaths();
    fetchCategories();
    fetchPrograms();
    fetchStats();
  }, []);

  // Reset viewTracked when panchayath or ward changes
  useEffect(() => {
    setViewTracked(false);
  }, [selectedPanchayath, selectedWard]);

  // Track view when job dialog opens
  useEffect(() => {
    const trackView = async () => {
      if (jobDialogOpen && selectedPanchayath && selectedWard && !viewTracked) {
        try {
          console.log("Tracking view for:", {
            selectedPanchayath,
            selectedWard
          });
          const {
            data,
            error
          } = await supabase.from("panchayath_views" as any).insert({
            panchayath_id: selectedPanchayath,
            ward_number: parseInt(selectedWard)
          });
          if (error) {
            console.error("Error tracking view:", error);
            toast({
              title: "Error tracking view",
              description: error.message,
              variant: "destructive"
            });
          } else {
            console.log("View tracked successfully:", data);
            setViewTracked(true);
          }
        } catch (error) {
          console.error("Error tracking view:", error);
        }
      }
    };
    trackView();
  }, [jobDialogOpen, selectedPanchayath, selectedWard, viewTracked]);
  const fetchPanchayaths = async () => {
    const {
      data
    } = await supabase.from("panchayaths").select("*").order("name_en");
    if (data) setPanchayaths(data);
  };
  const fetchCategories = async () => {
    const {
      data
    } = await supabase.from("categories").select("*").order("name");
    if (data) {
      setCategories(data);
    }
  };
  const fetchPrograms = async () => {
    const {
      data
    } = await supabase.from("programs").select(`
        *,
        category:categories(name),
        sub_category:sub_categories(name)
      `).order("is_top", {
      ascending: false
    }).order("priority", {
      ascending: false
    }).order("name");
    if (data) setPrograms(data);
  };
  const fetchStats = async () => {
    const {
      count: submissionsCount
    } = await supabase.from("survey_responses").select("*", {
      count: "exact",
      head: true
    });
    const {
      count: panchayathsCount
    } = await supabase.from("panchayaths").select("*", {
      count: "exact",
      head: true
    });
    if (submissionsCount !== null) setTotalSubmissions(submissionsCount);
    if (panchayathsCount !== null) setTotalPanchayaths(panchayathsCount);
  };
  const selectedPanchayathData = panchayaths.find(p => p.id === selectedPanchayath);
  const wardNumbers = selectedPanchayathData ? Array.from({
    length: selectedPanchayathData.ward_count
  }, (_, i) => i + 1) : [];
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      surveySchema.parse({
        name,
        mobileNumber,
        age: parseInt(age)
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive"
        });
        return;
      }
    }
    if (!selectedPanchayath || !selectedWard) {
      toast({
        title: "Error",
        description: "Please select panchayath and ward",
        variant: "destructive"
      });
      return;
    }
    if (!selectedProgram && !customProgram.trim()) {
      toast({
        title: "Error",
        description: "Please select a program or enter your own",
        variant: "destructive"
      });
      return;
    }
    if (customProgram.trim().length > 200) {
      toast({
        title: "Error",
        description: "Program name must be less than 200 characters",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);

    // Check for duplicate mobile number
    const {
      data: existingResponse
    } = await supabase.from("survey_responses").select("id").eq("mobile_number", mobileNumber).maybeSingle();
    if (existingResponse) {
      toast({
        title: "ക്ഷമിക്കണം!!",
        description: "ഈ മൊബൈൽ നമ്പർ ഉപയോഗിച്ച ഇതിനു മുന്നേ അഭിപ്രായം രേഖപെടുത്തിയിട്ടുണ്ട്... നന്ദി",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }
    const selectedProgramData = programs.find(p => p.id === selectedProgram);
    const {
      error
    } = await supabase.from("survey_responses").insert({
      panchayath_id: selectedPanchayath,
      ward_number: parseInt(selectedWard),
      name,
      mobile_number: mobileNumber,
      age: parseInt(age),
      category_id: selectedProgramData?.category_id || null,
      sub_category_id: selectedProgramData?.sub_category_id || null,
      program_id: selectedProgram || null,
      custom_program: customProgram.trim() || null
    });
    if (error) {
      toast({
        title: "Submission Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setSubmitted(true);
      fetchStats(); // Refresh the stats after successful submission
      toast({
        title: "Success!",
        description: "Your survey response has been submitted."
      });
    }
    setLoading(false);
  };
  if (submitted) {
    return <div className="min-h-screen flex items-center justify-center bg-[var(--gradient-hero)] p-4">
        <Card className="w-full max-w-md shadow-elevated text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-secondary" />
            </div>
            <CardTitle className="text-2xl">Thank You!</CardTitle>
            <CardDescription>നിങ്ങളുടെ പഞ്ചായത്തിന്റെ ചുമതലയുള്ള ഉദ്യോഗസ്ഥ നിങ്ങളെ ബന്ധപ്പെടും.. നന്ദി   </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>Name:</strong> {name}</p>
              <p><strong>Mobile:</strong> {mobileNumber}</p>
              <p><strong>Age:</strong> {age}</p>
              <p><strong>Ward:</strong> {selectedWard}</p>
              <p className="text-slate-950 font-bold"><strong>Program:</strong> {selectedProgram ? programs.find(p => p.id === selectedProgram)?.name : customProgram}</p>
            </div>
            <Button onClick={() => window.location.reload()} className="mt-6 w-full">
              Submit Another Response
            </Button>
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="min-h-screen bg-[var(--gradient-hero)]">
      <nav className="border-b backdrop-blur-sm" style={{
      background: 'var(--navbar-bg)'
    }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-lg text-white">Survey Portal</h3>
            <Button variant="ghost" size="sm" onClick={() => window.location.href = '/'} className="text-white hover:text-white/80">
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
            <CardTitle className="text-2xl text-center">Survey Form / സർവേ ഫോം</CardTitle>
            <CardDescription>Please fill in all the required information / ആവശ്യമായ എല്ലാ വിവരങ്ങളും പൂരിപ്പിക്കുക</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="job" className="text-base">
                  Select Job Category / ജോലി വിഭാഗം തിരഞ്ഞെടുക്കുക
                </Label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1 justify-start text-left border-2 h-auto min-h-10 py-2" onClick={() => {
                    if (!selectedPanchayath || !selectedWard) {
                      setPanchayathWardDialogOpen(true);
                    } else {
                      setJobDialogOpen(true);
                    }
                  }}>
                    {selectedProgram ? programs.find(p => p.id === selectedProgram)?.name : showCustomProgram && customProgram ? customProgram : "Select job category / ജോലി വിഭാഗം തിരഞ്ഞെടുക്കുക"}
                  </Button>
                  
                  <Dialog open={jobDialogOpen} onOpenChange={setJobDialogOpen}>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                      <DialogTitle>Select Job Category / ജോലി വിഭാഗം തിരഞ്ഞെടുക്കുക</DialogTitle>
                      <DialogDescription>Choose a category to see available programs or search directly</DialogDescription>
                    </DialogHeader>
                    
                    {!selectedJobCategory ? <div className="overflow-y-auto flex-1 pr-2">
                        <div className="mb-4">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input type="text" placeholder="Search programs directly / പദ്ധതികൾ നേരിട്ട് തിരയുക" value={programSearch} onChange={e => setProgramSearch(e.target.value)} className="pl-10" />
                          </div>
                        </div>

                        {programSearch ? <div>
                            <div className="mb-3 flex items-center justify-between">
                              <h3 className="font-semibold">Search Results</h3>
                              <Button type="button" variant="outline" size="sm" onClick={() => setProgramSearch("")}>
                                Clear Search
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {(() => {
                              const filteredPrograms = programs.filter(p => p.name.toLowerCase().includes(programSearch.toLowerCase()) || p.category?.name.toLowerCase().includes(programSearch.toLowerCase()) || p.sub_category?.name.toLowerCase().includes(programSearch.toLowerCase()));
                              const categoryCounters: Record<string, number> = {};
                              return filteredPrograms.length > 0 ? filteredPrograms.map(p => {
                                const categoryName = p.category?.name || '';
                                const firstLetter = categoryName.charAt(0).toUpperCase();
                                if (!categoryCounters[p.category_id]) {
                                  categoryCounters[p.category_id] = 100;
                                }
                                const serialNumber = `${firstLetter}${categoryCounters[p.category_id]}`;
                                categoryCounters[p.category_id]++;
                                return <Card key={p.id} className={`transition-all hover:shadow-md cursor-pointer ${selectedProgram === p.id ? 'border-primary border-2 bg-accent' : ''}`}>
                                        <CardHeader className="pb-3">
                                          <CardTitle className="text-base">
                                            <span className="font-bold text-primary">{serialNumber}.</span> {p.name}
                                          </CardTitle>
                                          <CardDescription className="text-xs">
                                            {p.category?.name} → {p.sub_category?.name}
                                          </CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                          <div className="flex gap-2">
                                            {p.description && <Button type="button" size="sm" variant="secondary" className="flex-1" onClick={() => {
                                        setSelectedProgramDetail(p);
                                        setDetailDialogOpen(true);
                                      }}>
                                                <Info className="h-3.5 w-3.5 mr-1" />
                                                കൂടുതൽ അറിയാൻ
                                              </Button>}
                                            <Button type="button" size="sm" variant="default" className="flex-1" onClick={() => {
                                        setSelectedProgram(p.id);
                                        setShowCustomProgram(false);
                                        setCustomProgram("");
                                        setJobDialogOpen(false);
                                        setProgramSearch("");
                                        setSelectedJobCategory("");
                                      }}>
                                              തിരഞ്ഞെടുക്കുക
                                            </Button>
                                          </div>
                                        </CardContent>
                                      </Card>;
                              }) : <div className="col-span-2 text-center py-8 text-muted-foreground">
                                    No programs found matching your search
                                  </div>;
                            })()}
                            </div>
                          </div> : <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card className="cursor-pointer hover:shadow-lg transition-all border-2 backdrop-blur-md bg-primary/10 hover:bg-primary/20 border-primary/30 hover:border-primary" onClick={() => setSelectedJobCategory("all")}>
                            <CardHeader>
                              <CardTitle className="text-lg">All Programs</CardTitle>
                              <CardDescription>എല്ലാ പദ്ധതികളും കാണുക</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground">എല്ലാ പ്രോഗ്രാമുകളും കാണുക </p>
                            </CardContent>
                          </Card>
                          
                          {categories.map((category, index) => {
                            const colorClasses = ['backdrop-blur-md bg-secondary/10 hover:bg-secondary/20 border-secondary/30 hover:border-secondary', 'backdrop-blur-md bg-accent/10 hover:bg-accent/20 border-accent/30 hover:border-accent', 'backdrop-blur-md bg-primary/10 hover:bg-primary/20 border-primary/30 hover:border-primary', 'backdrop-blur-md bg-destructive/10 hover:bg-destructive/20 border-destructive/30 hover:border-destructive'];
                            const colorClass = colorClasses[index % colorClasses.length];
                            return <Card key={category.id} onClick={() => setSelectedJobCategory(category.id)} className={`cursor-pointer hover:shadow-lg transition-all border-2 ${colorClass}`}>
                                <CardHeader>
                                  <CardTitle className="text-lg">{category.name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-sm text-muted-foreground">
                                    {programs.filter(p => p.category_id === category.id).length} programs
                                  </p>
                                </CardContent>
                              </Card>;
                          })}
                          
                          <Card className="cursor-pointer hover:shadow-lg transition-all border-2 backdrop-blur-md bg-muted/30 hover:bg-muted/50 border-muted-foreground/30 hover:border-muted-foreground" onClick={() => {
                            setCustomProgramDialogOpen(true);
                            setJobDialogOpen(false);
                          }}>
                            <CardHeader>
                              <CardTitle className="text-lg">ഇവയിൽ ഉൾപ്പെടാത്തത്</CardTitle>
                              <CardDescription>None of these</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground">നിങ്ങളുടെ സ്വന്തം പ്രോഗ്രാം എഴുതുക</p>
                            </CardContent>
                          </Card>
                          </div>}
                      </div> : <div className="overflow-y-auto flex-1">
                        <div className="mb-4 space-y-3">
                          <Button type="button" variant="outline" size="sm" onClick={() => {
                            setSelectedJobCategory("");
                            setProgramSearch("");
                          }}>
                            ← Back to Categories
                          </Button>
                          
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input type="text" placeholder="Search programs / പദ്ധതികൾ തിരയുക" value={programSearch} onChange={e => setProgramSearch(e.target.value)} className="pl-10" />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {(() => {
                            const filteredPrograms = programs.filter(p => selectedJobCategory === "all" || p.category_id === selectedJobCategory).filter(p => programSearch === "" || p.name.toLowerCase().includes(programSearch.toLowerCase()) || p.category?.name.toLowerCase().includes(programSearch.toLowerCase()) || p.sub_category?.name.toLowerCase().includes(programSearch.toLowerCase()));
                            const categoryCounters: Record<string, number> = {};
                            return <>
                                {filteredPrograms.map(p => {
                                const categoryName = p.category?.name || '';
                                const firstLetter = categoryName.charAt(0).toUpperCase();
                                if (!categoryCounters[p.category_id]) {
                                  categoryCounters[p.category_id] = 100;
                                }
                                const serialNumber = `${firstLetter}${categoryCounters[p.category_id]}`;
                                categoryCounters[p.category_id]++;
                                return <Card key={p.id} className={`transition-all hover:shadow-md ${selectedProgram === p.id ? 'border-primary border-2 bg-accent' : ''}`}>
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-base">
                                      <span className="font-bold text-primary">{serialNumber}.</span> {p.name}
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                      {p.category?.name} → {p.sub_category?.name}
                                    </CardDescription>
                                  </CardHeader>
                                <CardContent className="pt-0">
                                  <div className="flex gap-2">
                                    {p.description && <Button type="button" size="sm" variant="secondary" className="flex-1" onClick={() => {
                                        setSelectedProgramDetail(p);
                                        setDetailDialogOpen(true);
                                      }}>
                                        <Info className="h-3.5 w-3.5 mr-1" />
                                        കൂടുതൽ അറിയാൻ
                                      </Button>}
                                    <Button type="button" size="sm" variant="default" className="flex-1" onClick={() => {
                                        setSelectedProgram(p.id);
                                        setJobDialogOpen(false);
                                        setSelectedJobCategory("");
                                      }}>
                                      താല്പര്യമുണ്ട്
                                    </Button>
                                  </div>
                                 </CardContent>
                               </Card>;
                              })}
                           
                           <Card className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-secondary" onClick={() => {
                                setCustomProgramDialogOpen(true);
                                setSelectedProgram("");
                                setJobDialogOpen(false);
                                setSelectedJobCategory("");
                                setProgramSearch("");
                              }}>
                             <CardHeader className="pb-3">
                               <CardTitle className="text-base">ഇവയിൽ ഉൾപ്പെടാത്തത്</CardTitle>
                               <CardDescription className="text-xs">None of these</CardDescription>
                             </CardHeader>
                             <CardContent className="pt-0">
                               <p className="text-sm text-muted-foreground">
                                 Enter your own program
                               </p>
                             </CardContent>
                           </Card>
                         </>;
                          })()}
                        </div>
                      </div>}
                    </DialogContent>
                  </Dialog>
                  {(selectedProgram || showCustomProgram && customProgram) && <Button type="button" variant="ghost" size="sm" onClick={() => {
                    setSelectedProgram("");
                    setShowCustomProgram(false);
                    setCustomProgram("");
                  }} className="px-3">
                      Clear
                    </Button>}
                </div>
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

              <Dialog open={customProgramDialogOpen} onOpenChange={setCustomProgramDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Enter Custom Program</DialogTitle>
                    <DialogDescription>നിങ്ങളുടെ പദ്ധതി എഴുതുക</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="customProgramInput" className="text-base">
                        Program Name / പദ്ധതിയുടെ പേര് *
                      </Label>
                      <Input id="customProgramInput" value={customProgram} onChange={e => setCustomProgram(e.target.value)} placeholder="Enter your program / നിങ്ങളുടെ പദ്ധതി എഴുതുക" maxLength={200} className="border-2" />
                    </div>
                    <Button type="button" className="w-full" onClick={() => {
                      if (customProgram.trim()) {
                        setShowCustomProgram(true);
                        setCustomProgramDialogOpen(false);
                      } else {
                        toast({
                          title: "Error",
                          description: "Please enter a program name",
                          variant: "destructive"
                        });
                      }
                    }}>
                      Save Program / പദ്ധതി സംരക്ഷിക്കുക
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={panchayathWardDialogOpen} onOpenChange={setPanchayathWardDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Select Location / സ്ഥലം തിരഞ്ഞെടുക്കുക</DialogTitle>
                    <DialogDescription>Please select your panchayath and ward first / ആദ്യം നിങ്ങളുടെ പഞ്ചായത്തും വാർഡും തിരഞ്ഞെടുക്കുക</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="dialogPanchayath" className="text-base">
                        Panchayath / പഞ്ചായത്ത് *
                      </Label>
                      <Select value={selectedPanchayath} onValueChange={setSelectedPanchayath}>
                        <SelectTrigger id="dialogPanchayath" className="border-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          {panchayaths.map(p => <SelectItem key={p.id} value={p.id}>
                              {p.name_en} / {p.name_ml} ({p.district})
                            </SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dialogWard" className="text-base">
                        Ward Number / വാർഡ് നമ്പർ *
                      </Label>
                      <Select value={selectedWard} onValueChange={setSelectedWard} disabled={!selectedPanchayath}>
                        <SelectTrigger id="dialogWard" className="border-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          {wardNumbers.map(num => <SelectItem key={num} value={num.toString()}>
                              Ward {num} / വാർഡ് {num}
                            </SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button type="button" className="w-full" onClick={() => {
                      if (!selectedPanchayath || !selectedWard) {
                        toast({
                          title: "Error",
                          description: "Please select both panchayath and ward",
                          variant: "destructive"
                        });
                      } else {
                        setPanchayathWardDialogOpen(false);
                        setJobDialogOpen(true);
                      }
                    }}>
                      Continue / തുടരുക
                    </Button>
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
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {panchayaths.map(p => <SelectItem key={p.id} value={p.id}>
                          {p.name_en} / {p.name_ml} ({p.district})
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ward" className="text-base">
                    Ward Number / വാർഡ് നമ്പർ *
                  </Label>
                  <Select value={selectedWard} onValueChange={setSelectedWard} disabled={!selectedPanchayath}>
                    <SelectTrigger id="ward" className="border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {wardNumbers.map(num => <SelectItem key={num} value={num.toString()}>
                          Ward {num} / വാർഡ് {num}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base">
                    Name / പേര് *
                  </Label>
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} required maxLength={100} className="border-2" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile" className="text-base">
                    Mobile Number / മൊബൈൽ നമ്പർ *
                  </Label>
                  <Input id="mobile" type="tel" value={mobileNumber} onChange={e => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))} required maxLength={10} className="border-2" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="age" className="text-base">
                  Age / പ്രായം *
                </Label>
                <Input id="age" type="number" value={age} onChange={e => setAge(e.target.value)} required min="1" max="150" className="border-2" />
              </div>

              <Button type="submit" className="w-full text-lg py-6 shadow-glow" disabled={loading}>
                {loading ? <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting... / സമർപ്പിക്കുന്നു...
                  </> : "Submit Survey / സമർപ്പിക്കുക"}
              </Button>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>;
};
export default Index;