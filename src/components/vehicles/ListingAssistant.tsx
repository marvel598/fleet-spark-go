import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircleQuestion, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Msg = { role: "user" | "assistant"; content: string };
const SUGGESTIONS = ["How much for 3 days?", "Where do I pick it up?", "Is delivery available?"];

export function ListingAssistant({ vehicleId }: { vehicleId: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = async (q: string) => {
    const question = q.trim();
    if (!question || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: question }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ask-listing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ vehicleId, messages: next.slice(-20) }),
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not answer right now");
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let text = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += dec.decode(value, { stream: true });
        setMessages([...next, { role: "assistant", content: text }]);
      }
      if (!text) throw new Error("No answer came back. Please ask again.");
    } catch (e) {
      setMessages(next);
      setError(e instanceof Error ? e.message : "Could not answer right now");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-6 bg-card/60 border-border/60">
      <div className="flex items-center gap-2 mb-1">
        <MessageCircleQuestion className="w-5 h-5 text-primary" />
        <h3 className="font-serif text-xl">Ask about this car</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Answers come from this listing's details, pricing and pickup location.</p>

      <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="ml-auto max-w-[85%] rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm">{m.content}</div>
          ) : (
            <div key={i} className="prose prose-sm prose-invert max-w-none text-foreground">
              {m.content ? <ReactMarkdown>{m.content}</ReactMarkdown> : <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            </div>
          ),
        )}
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <Button key={s} size="sm" variant="outline" onClick={() => ask(s)}>{s}</Button>
            ))}
          </div>
        )}
      </div>
      {error && <p className="text-sm text-destructive mb-2">{error}</p>}
      <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="flex gap-2 items-end">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input); } }}
          placeholder="e.g. Is it good for a Maasai Mara trip?"
          maxLength={2000}
          rows={2}
        />
        <Button type="submit" disabled={busy || !input.trim()}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ask"}</Button>
      </form>
    </Card>
  );
}
