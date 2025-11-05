import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, Clock } from "lucide-react";

interface SupportMessage {
  id: string;
  message: string;
  contact_number: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

export const SupportMessages = () => {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("support_messages" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages((data as any) || []);
    } catch (error) {
      console.error("Error fetching support messages:", error);
      toast.error("Failed to load support messages");
    } finally {
      setLoading(false);
    }
  };

  const markAsResolved = async (id: string) => {
    try {
      const { error } = await supabase
        .from("support_messages" as any)
        .update({ 
          status: "resolved",
          resolved_at: new Date().toISOString()
        } as any)
        .eq("id", id);

      if (error) throw error;
      toast.success("Message marked as resolved");
      fetchMessages();
    } catch (error) {
      console.error("Error updating message:", error);
      toast.error("Failed to update message");
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading support messages...</div>;
  }

  const pendingCount = messages.filter(m => m.status === "pending").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Support Messages</h2>
        {pendingCount > 0 && (
          <Badge variant="destructive" className="text-lg px-3 py-1">
            {pendingCount} Pending
          </Badge>
        )}
      </div>

      <div className="grid gap-4">
        {messages.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No support messages yet
            </CardContent>
          </Card>
        ) : (
          messages.map((msg) => (
            <Card key={msg.id} className={msg.status === "pending" ? "border-orange-500" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Contact: {msg.contact_number}
                  </CardTitle>
                  <Badge variant={msg.status === "pending" ? "default" : "secondary"}>
                    {msg.status === "pending" ? (
                      <>
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Resolved
                      </>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4 whitespace-pre-wrap">{msg.message}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {new Date(msg.created_at).toLocaleString("ml-IN")}
                  </span>
                  {msg.status === "pending" && (
                    <Button
                      size="sm"
                      onClick={() => markAsResolved(msg.id)}
                    >
                      Mark as Resolved
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
