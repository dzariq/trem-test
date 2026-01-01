import { useState, useEffect } from "react";
import { parentProfile } from "@/data/mockData";

export function WelcomeTypingAnimation() {
  const [displayText, setDisplayText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  
  const fullText = `Welcome back, Mr. ${parentProfile.name}`;

  useEffect(() => {
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setIsComplete(true);
      }
    }, 50);

    return () => clearInterval(typingInterval);
  }, [fullText]);

  return (
    <div className="absolute bottom-8 right-4 z-10">
      <div className="relative bg-background/95 backdrop-blur-sm rounded-xl border border-border shadow-lg p-3 max-w-[200px]">
        {/* Speech bubble tail pointing to teacher */}
        <div className="absolute -top-2 right-6 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-background/95" />
        <div className="absolute -top-[9px] right-6 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-border" style={{ zIndex: -1 }} />
        
        <p className="text-sm font-medium text-foreground">
          {displayText}
          {!isComplete && (
            <span className="inline-block w-0.5 h-4 ml-0.5 bg-primary animate-pulse" />
          )}
        </p>
      </div>
    </div>
  );
}
