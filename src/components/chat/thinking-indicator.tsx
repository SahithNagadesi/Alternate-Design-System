"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const PHASES = [
  "Analyzing request...",
  "Understanding context...",
  "Generating response...",
  "Preparing code...",
];

export function ThinkingIndicator() {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setPhaseIndex((prev) => (prev + 1) % PHASES.length);
        setVisible(true);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="chat-fade-in flex items-center gap-3 pl-12">
      <div className="flex items-center gap-2.5 rounded-xl bg-muted/70 px-4 py-3">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span
          className={`text-sm text-muted-foreground transition-opacity duration-300 ${
            visible ? "opacity-100" : "opacity-0"
          }`}
        >
          {PHASES[phaseIndex]}
        </span>
      </div>
    </div>
  );
}
