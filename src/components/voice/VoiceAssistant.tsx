import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Send, X, Bot } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSimStore } from "@/lib/sim/provider";
import { JUNCTION_IDS, JUNCTIONS } from "@/lib/sim/junctions";
import { pick } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";

export function VoiceAssistant() {
  const { t, i18n } = useTranslation();
  const store = useSimStore();
  const { profile, realRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Hello! Ask me about traffic, or tell me to trigger an ambulance or fallback mode." }
  ]);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // @ts-ignore - vendor prefixes
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        handleCommand(text);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const speak = (text: string) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = i18n.language === 'kn' ? 'kn-IN' : 'en-US';
    window.speechSynthesis.speak(u);
  };

  const addMessage = (role: "user" | "ai", text: string) => {
    setMessages(prev => [...prev, { role, text }]);
    if (role === "ai") speak(text);
  };

  const handleCommand = (cmd: string) => {
    setTranscript("");
    addMessage("user", cmd);
    const lowerCmd = cmd.toLowerCase();
    const state = store.getState();

    // Intent Matching
    if (lowerCmd.includes("ambulance") || lowerCmd.includes("emergency")) {
      store.simulateAmbulance("silk-board", "S", profile?.display_name || "Voice", realRole || "operator");
      addMessage("ai", "Green corridor activated for an ambulance at Silk Board on the South approach.");
    } else if (lowerCmd.includes("fallback") || lowerCmd.includes("low confidence")) {
      store.simulateLowConfidence("hebbal", profile?.display_name || "Voice", realRole || "operator");
      addMessage("ai", "Simulated low confidence at Hebbal. Switching to 60-second fixed-timer fallback.");
    } else if (lowerCmd.includes("status") || lowerCmd.includes("traffic") || lowerCmd.includes("congestion")) {
      const sb = state.junctions["silk-board"];
      addMessage("ai", `Silk Board is currently experiencing ${sb.level} congestion with a score of ${sb.score}. AI confidence is at ${sb.confidence}%.`);
    } else {
      addMessage("ai", "I didn't quite catch that. Try asking about 'traffic status', or say 'trigger ambulance at Silk Board'.");
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current.lang = i18n.language === 'kn' ? 'kn-IN' : 'en-IN';
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button size="icon" className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lift z-50">
          <Mic className="size-6" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={16} className="w-80 p-0 flex flex-col overflow-hidden shadow-lift border-primary/20">
        <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="size-5" />
            <h3 className="font-semibold">Ask EthiFlow</h3>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-primary/20" onClick={() => setIsOpen(false)}>
            <X className="size-4" />
          </Button>
        </div>
        
        <div className="flex-1 p-4 max-h-64 overflow-y-auto space-y-3 bg-muted/30">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`text-sm px-3 py-2 rounded-2xl max-w-[85%] ${m.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-card border shadow-sm rounded-tl-sm'}`}>
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 border-t bg-card flex gap-2 items-center">
          <Button variant={isListening ? "destructive" : "outline"} size="icon" onClick={toggleListening} className="shrink-0">
            {isListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
          </Button>
          <form 
            onSubmit={(e) => { e.preventDefault(); if (transcript.trim()) handleCommand(transcript); }}
            className="flex-1 flex gap-2"
          >
            <Input 
              value={transcript} 
              onChange={(e) => setTranscript(e.target.value)} 
              placeholder={isListening ? "Listening..." : "Type a command..."}
              className="flex-1 text-sm h-9"
            />
            <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={!transcript.trim()}>
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      </PopoverContent>
    </Popover>
  );
}