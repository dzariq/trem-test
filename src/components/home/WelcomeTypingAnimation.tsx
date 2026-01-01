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
    <div className="absolute bottom-4 left-4 right-4 z-10">
      <div className="bg-background/90 backdrop-blur-sm rounded-lg border border-border shadow-lg p-3 max-w-xs">
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary animate-pulse" />
          <p className="text-sm font-medium text-foreground">
            {displayText}
            {!isComplete && (
              <span className="inline-block w-0.5 h-4 ml-0.5 bg-primary animate-pulse" />
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
