import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageCircle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const HelpChatButton = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [message, setMessage] = useState("ഫോം ഫില്ല് ചെയ്യാൻ എനിക്ക് നിങ്ങളുടെ സഹായം വേണം, സഹായിക്കാമോ ?");
  const [contactNumber, setContactNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendClick = () => {
    if (!message.trim()) {
      toast.error("ദയവായി ഒരു സന്ദേശം എഴുതുക");
      return;
    }
    setChatOpen(false);
    setContactOpen(true);
  };

  const handleSubmit = async () => {
    if (!contactNumber.trim() || contactNumber.length !== 10) {
      toast.error("ദയവായി സാധുവായ മൊബൈൽ നമ്പർ നൽകുക");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("support_messages" as any)
        .insert({
          message: message.trim(),
          contact_number: contactNumber.trim(),
        } as any);

      if (error) throw error;

      toast.success("നിങ്ങളുടെ സന്ദേശം വിജയകരമായി അയച്ചു!");
      setContactOpen(false);
      setMessage("ഫോം ഫില്ല് ചെയ്യാൻ എനിക്ക് നിങ്ങളുടെ സഹായം വേണം, സഹായിക്കാമോ ?");
      setContactNumber("");
    } catch (error) {
      console.error("Error submitting support message:", error);
      toast.error("സന്ദേശം അയയ്ക്കുന്നതിൽ പിശക് സംഭവിച്ചു");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 rounded-full h-14 px-6 shadow-lg z-50"
        size="lg"
      >
        <MessageCircle className="mr-2 h-5 w-5" />
        സഹായം ആവശ്യമാണോ ?
      </Button>

      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>സഹായവും പിന്തുണയും</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="message">നിങ്ങളുടെ സന്ദേശം</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="നിങ്ങളുടെ സന്ദേശം ഇവിടെ എഴുതുക..."
                className="min-h-[120px]"
              />
            </div>
            <Button onClick={handleSendClick} className="w-full">
              <Send className="mr-2 h-4 w-4" />
              സന്ദേശം അയയ്ക്കുക
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ബന്ധപ്പെടാനുള്ള വിവരങ്ങൾ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="contact">മൊബൈൽ നമ്പർ</Label>
              <Input
                id="contact"
                type="tel"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="10 അക്ക മൊബൈൽ നമ്പർ"
                maxLength={10}
              />
            </div>
            <Button 
              onClick={handleSubmit} 
              className="w-full"
              disabled={isSubmitting}
            >
              സമർപ്പിക്കുക
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
