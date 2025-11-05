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
import { HelpChatButton } from "@/components/HelpChatButton";
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
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");
  const [currentStep, setCurrentStep] = useState(1);
  const [incompleteSurveyId, setIncompleteSurveyId] = useState<string | null>(null);
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

  const fetchSubCategories = async (categoryId: string) => {
    const { data } = await supabase
      .from("sub_categories")
      .select("*")
      .eq("category_id", categoryId)
      .order("name");
    if (data) setSubCategories(data);
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
      category_id: selectedProgramData?.category_id || selectedJobCategory || null,
      sub_category_id: selectedProgramData?.sub_category_id || selectedSubCategory || null,
      program_id: selectedProgram || null,
      custom_program: customProgram.trim() || null
    });
    if (error) {
      // Check if it's a duplicate mobile number error (database unique constraint)
      if (error.code === '23505' && error.message.includes('mobile_number')) {
        toast({
          title: "ക്ഷമിക്കണം!!",
          description: "ഈ മൊബൈൽ നമ്പർ ഉപയോഗിച്ച ഇതിനു മുന്നേ അഭിപ്രായം രേഖപെടുത്തിയിട്ടുണ്ട്... നന്ദി",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Submission Error",
          description: error.message,
          variant: "destructive"
        });
      }
    } else {
      // Delete incomplete survey record on successful submission
      if (incompleteSurveyId) {
        await supabase
          .from("incomplete_surveys")
          .delete()
          .eq("id", incompleteSurveyId);
      }
      
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
          <p className="text-lg text-muted-foreground">ഈ സർവ്വേ ഒരു പ്രദേശത്ത് സ്വയംതൊഴിൽ ആവശ്യക്കാരെ കണ്ടത്താനും കൂടുതൽ ആളുകളുടെ താല്പര്യം മനസ്സിലാക്കാനും വേണ്ടിയാണ്. സ്വയംതൊഴിൽ രജിസ്‌ട്രേഷൻ മുന്നോട്ട് പോകാൻ കസ്റ്റമർ രജിസ്‌ട്രേഷൻ പോർട്ടലിൽ രജിസ്‌ട്രേഷൻ പൂർത്തിയാകേണ്ടതുണ്ട്. കൂടുതൽ സംശയങ്ങൾക്ക് 7025715877 എന്ന നമ്പറിൽ വാട്സാപ്പ് ചെയ്യുക </p>
          
          <div className="flex justify-center gap-4 mt-6 mb-4">
            <Card className="bg-card/80 backdrop-blur border-primary/20 shadow-glow">
              <CardContent className="p-4 bg-sky-800">
                <p className="text-sm mb-1 text-slate-50">Total Submissions</p>
                <p className="text-2xl font-bold text-slate-50">{1230 + totalSubmissions}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/80 backdrop-blur border-accent/20 shadow-glow">
              <CardContent className="p-4 bg-pink-900">
                <p className="text-sm mb-1 text-slate-50">Panchayaths</p>
                <p className="text-2xl font-bold text-slate-50">{totalPanchayaths}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="shadow-elevated bg-[var(--gradient-card)] border-2">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Survey Form / സർവേ ഫോം</CardTitle>
            <CardDescription>Step {currentStep} of 6 / ഘട്ടം {currentStep} / 6</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {currentStep === 1 && (
                <Card className="border-2 border-primary/20 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-xl">Name / പേര്</CardTitle>
                    <CardDescription>Enter your full name / നിങ്ങളുടെ പൂർണ്ണ പേര് നൽകുക</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-base">
                        Name / പേര് *
                      </Label>
                      <Input 
                        id="name" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        required 
                        maxLength={100} 
                        className="border-2" 
                        placeholder="Enter your name / പേര് എഴുതുക"
                      />
                    </div>
                    <Button 
                      type="button" 
                      className="w-full text-lg py-6" 
                      onClick={() => {
                        if (!name.trim()) {
                          toast({
                            title: "Error",
                            description: "Please enter your name / പേര് നൽകുക",
                            variant: "destructive"
                          });
                          return;
                        }
                        setCurrentStep(2);
                      }}
                    >
                      തുടരുക (Continue)
                    </Button>
                  </CardContent>
                </Card>
              )}

              {currentStep === 2 && (
                <Card className="border-2 border-primary/20 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-xl">Mobile Number / മൊബൈൽ നമ്പർ</CardTitle>
                    <CardDescription>Enter your 10-digit mobile number / 10 അക്ക മൊബൈൽ നമ്പർ നൽകുക</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="mobile" className="text-base">
                        Mobile Number / മൊബൈൽ നമ്പർ *
                      </Label>
                      <Input 
                        id="mobile" 
                        type="tel" 
                        value={mobileNumber} 
                        onChange={e => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))} 
                        required 
                        maxLength={10} 
                        className="border-2" 
                        placeholder="Enter mobile number / മൊബൈൽ നമ്പർ"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="flex-1 text-lg py-6" 
                        onClick={() => setCurrentStep(1)}
                      >
                        ← Back / തിരികെ
                      </Button>
                      <Button 
                      type="button" 
                      className="flex-1 text-lg py-6" 
                      onClick={async () => {
                        if (!/^[0-9]{10}$/.test(mobileNumber)) {
                          toast({
                            title: "Error",
                            description: "Please enter a valid 10-digit mobile number",
                            variant: "destructive"
                          });
                          return;
                        }
                        
                        // Create or update incomplete survey record
                        const { data, error } = await supabase
                          .from("incomplete_surveys")
                          .insert({
                            name,
                            mobile_number: mobileNumber
                          })
                          .select()
                          .single();
                        
                        if (data) {
                          setIncompleteSurveyId(data.id);
                        }
                        
                        setCurrentStep(3);
                        }}
                      >
                        തുടരുക (Continue)
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentStep === 3 && (
                <Card className="border-2 border-primary/20 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-xl">Panchayath / പഞ്ചായത്ത്</CardTitle>
                    <CardDescription>Select your panchayath / നിങ്ങളുടെ പഞ്ചായത്ത് തിരഞ്ഞെടുക്കുക</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="panchayath" className="text-base">
                        Panchayath / പഞ്ചായത്ത് *
                      </Label>
                      <Select value={selectedPanchayath} onValueChange={setSelectedPanchayath}>
                        <SelectTrigger id="panchayath" className="border-2">
                          <SelectValue placeholder="Select panchayath / പഞ്ചായത്ത് തിരഞ്ഞെടുക്കുക" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          {panchayaths.map(p => <SelectItem key={p.id} value={p.id}>
                              {p.name_en} / {p.name_ml} ({p.district})
                            </SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="flex-1 text-lg py-6" 
                        onClick={() => setCurrentStep(2)}
                      >
                        ← Back / തിരികെ
                      </Button>
                      <Button 
                      type="button" 
                      className="flex-1 text-lg py-6" 
                      onClick={async () => {
                        if (!selectedPanchayath) {
                          toast({
                            title: "Error",
                            description: "Please select a panchayath / പഞ്ചായത്ത് തിരഞ്ഞെടുക്കുക",
                            variant: "destructive"
                          });
                          return;
                        }
                        
                        // Update incomplete survey with panchayath
                        if (incompleteSurveyId) {
                          await supabase
                            .from("incomplete_surveys")
                            .update({ panchayath_id: selectedPanchayath })
                            .eq("id", incompleteSurveyId);
                        }
                        
                        setCurrentStep(4);
                        }}
                      >
                        തുടരുക (Continue)
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentStep === 4 && (
                <Card className="border-2 border-primary/20 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-xl">Ward Number / വാർഡ് നമ്പർ</CardTitle>
                    <CardDescription>Select your ward number / നിങ്ങളുടെ വാർഡ് നമ്പർ തിരഞ്ഞെടുക്കുക</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ward" className="text-base">
                        Ward Number / വാർഡ് നമ്പർ *
                      </Label>
                      <Select value={selectedWard} onValueChange={setSelectedWard}>
                        <SelectTrigger id="ward" className="border-2">
                          <SelectValue placeholder="Select ward / വാർഡ് തിരഞ്ഞെടുക്കുക" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          {wardNumbers.map(num => <SelectItem key={num} value={num.toString()}>
                              Ward {num} / വാർഡ് {num}
                            </SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="flex-1 text-lg py-6" 
                        onClick={() => setCurrentStep(3)}
                      >
                        ← Back / തിരികെ
                      </Button>
                      <Button 
                      type="button" 
                      className="flex-1 text-lg py-6" 
                      onClick={async () => {
                        if (!selectedWard) {
                          toast({
                            title: "Error",
                            description: "Please select a ward / വാർഡ് തിരഞ്ഞെടുക്കുക",
                            variant: "destructive"
                          });
                          return;
                        }
                        
                        // Update incomplete survey with ward
                        if (incompleteSurveyId) {
                          await supabase
                            .from("incomplete_surveys")
                            .update({ ward_number: parseInt(selectedWard) })
                            .eq("id", incompleteSurveyId);
                        }
                        
                        setCurrentStep(5);
                        }}
                      >
                        തുടരുക (Continue)
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentStep === 5 && (
                <Card className="border-2 border-primary/20 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-xl">Age / പ്രായം</CardTitle>
                    <CardDescription>Enter your age / നിങ്ങളുടെ പ്രായം നൽകുക</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="age" className="text-base">
                        Age / പ്രായം *
                      </Label>
                      <Input 
                        id="age" 
                        type="number" 
                        value={age} 
                        onChange={e => setAge(e.target.value)} 
                        required 
                        min="1" 
                        max="150" 
                        className="border-2" 
                        placeholder="Enter age / പ്രായം നൽകുക"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="flex-1 text-lg py-6" 
                        onClick={() => setCurrentStep(4)}
                      >
                        ← Back / തിരികെ
                      </Button>
                      <Button 
                        type="button" 
                        className="flex-1 text-lg py-6" 
                        onClick={() => {
                          const ageNum = parseInt(age);
                          if (!age || ageNum < 1 || ageNum > 150) {
                            toast({
                              title: "Error",
                              description: "Please enter a valid age (1-150)",
                              variant: "destructive"
                            });
                            return;
                          }
                          setCurrentStep(6);
                          // Track view when moving to job selection
                          if (selectedPanchayath && selectedWard && !viewTracked) {
                            supabase.from("panchayath_views" as any).insert({
                              panchayath_id: selectedPanchayath,
                              ward_number: parseInt(selectedWard)
                            }).then(() => setViewTracked(true));
                          }
                        }}
                      >
                        തുടരുക (Continue)
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentStep === 6 && (
                <Card className="border-2 border-primary/20 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-xl">Select Job Category / ജോലി വിഭാഗം</CardTitle>
                    <CardDescription>Choose your preferred job category / നിങ്ങളുടെ ജോലി വിഭാഗം തിരഞ്ഞെടുക്കുക</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="job" className="text-base">
                        Select Job Category / ജോലി വിഭാഗം തിരഞ്ഞെടുക്കുക
                      </Label>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" className="flex-1 justify-start text-left border-2 h-auto min-h-10 py-2" onClick={() => setJobDialogOpen(true)}>
                          {selectedProgram ? programs.find(p => p.id === selectedProgram)?.name : showCustomProgram && customProgram ? customProgram : "Select job category / ജോലി വിഭാഗം തിരഞ്ഞെടുക്കുക"}
                        </Button>
                        
                        {(selectedProgram || showCustomProgram && customProgram) && <Button type="button" variant="ghost" size="sm" onClick={() => {
                          setSelectedProgram("");
                          setShowCustomProgram(false);
                          setCustomProgram("");
                        }} className="px-3">
                            Clear
                          </Button>}
                      </div>
                    </div>

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
                                  <CardContent className="bg-slate-50">
                                    <p className="text-sm text-muted-foreground">
                                      {programs.filter(p => p.category_id === category.id).length} programs
                                    </p>
                                  </CardContent>
                                </Card>;
                            })}
                            
                            <Card className="cursor-pointer hover:shadow-lg transition-all border-2 backdrop-blur-md bg-muted/30 hover:bg-muted/50 border-muted-foreground/30 hover:border-muted-foreground" onClick={() => {
                              setCustomProgramDialogOpen(true);
                              setJobDialogOpen(false);
                              setSelectedSubCategory("");
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
                             
                             <Card className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-secondary" onClick={async () => {
                                  setCustomProgramDialogOpen(true);
                                  setSelectedProgram("");
                                  setJobDialogOpen(false);
                                  setSelectedSubCategory("");
                                  setProgramSearch("");
                                  // Fetch sub-categories if Marketing category is selected
                                  if (selectedJobCategory) {
                                    const marketingCategory = categories.find(c => c.name === "Marketing");
                                    if (marketingCategory && selectedJobCategory === marketingCategory.id) {
                                      await fetchSubCategories(selectedJobCategory);
                                    }
                                  }
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
                          {(() => {
                            const marketingCategory = categories.find(c => c.name === "Marketing");
                            const isMarketing = marketingCategory && selectedJobCategory === marketingCategory.id;
                            
                            return isMarketing && subCategories.length > 0 ? (
                              <>
                                <div className="space-y-2">
                                  <Label htmlFor="subCategorySelect" className="text-base">
                                    Select Sub Category / ഉപവിഭാഗം തിരഞ്ഞെടുക്കുക *
                                  </Label>
                                  <Select value={selectedSubCategory} onValueChange={setSelectedSubCategory}>
                                    <SelectTrigger id="subCategorySelect" className="border-2">
                                      <SelectValue placeholder="Select sub category / ഉപവിഭാഗം തിരഞ്ഞെടുക്കുക" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover z-50">
                                      {subCategories.map(sc => (
                                        <SelectItem key={sc.id} value={sc.id}>
                                          {sc.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="customProgramInput" className="text-base">
                                    Program Name / പദ്ധതിയുടെ പേര് *
                                  </Label>
                                  <Input 
                                    id="customProgramInput" 
                                    value={customProgram} 
                                    onChange={e => setCustomProgram(e.target.value)} 
                                    placeholder="Enter your program / നിങ്ങളുടെ പദ്ധതി എഴുതുക" 
                                    maxLength={200} 
                                    className="border-2" 
                                  />
                                </div>
                              </>
                            ) : (
                              <div className="space-y-2">
                                <Label htmlFor="customProgramInput" className="text-base">
                                  Program Name / പദ്ധതിയുടെ പേര് *
                                </Label>
                                <Input 
                                  id="customProgramInput" 
                                  value={customProgram} 
                                  onChange={e => setCustomProgram(e.target.value)} 
                                  placeholder="Enter your program / നിങ്ങളുടെ പദ്ധതി എഴുതുക" 
                                  maxLength={200} 
                                  className="border-2" 
                                />
                              </div>
                            );
                          })()}
                          <Button type="button" className="w-full" onClick={() => {
                            const marketingCategory = categories.find(c => c.name === "Marketing");
                            const isMarketing = marketingCategory && selectedJobCategory === marketingCategory.id;
                            
                            if (!customProgram.trim()) {
                              toast({
                                title: "Error",
                                description: "Please enter a program name",
                                variant: "destructive"
                              });
                              return;
                            }
                            
                            if (isMarketing && subCategories.length > 0 && !selectedSubCategory) {
                              toast({
                                title: "Error",
                                description: "Please select a sub category",
                                variant: "destructive"
                              });
                              return;
                            }
                            
                            setShowCustomProgram(true);
                            setCustomProgramDialogOpen(false);
                          }}>
                            Save Program / പദ്ധതി സംരക്ഷിക്കുക
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="flex-1 text-lg py-6" 
                        onClick={() => setCurrentStep(5)}
                      >
                        ← Back / തിരികെ
                      </Button>
                      <Button type="submit" className="flex-1 text-lg py-6 shadow-glow" disabled={loading}>
                        {loading ? <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting... / സമർപ്പിക്കുന്നു...
                          </> : "Submit Survey / സമർപ്പിക്കുക"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
      <HelpChatButton />
    </div>;
};
export default Index;