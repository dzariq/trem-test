import { useState, useEffect } from "react";

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

type WelcomeTypingAnimationProps = {
  name?: string | null;
};

export function WelcomeTypingAnimation({ name }: WelcomeTypingAnimationProps) {
  const [displayText, setDisplayText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
  const displayName = name?.trim() || "there";
  const fullText = `${getTimeGreeting()}, ${displayName}!`;

  useEffect(() => {
    let currentIndex = 0;
    setDisplayText("");
    setIsComplete(false);
    setIsVisible(true);
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

  // Hide the message 10 seconds after typing completes
  useEffect(() => {
    if (isComplete) {
      const hideTimeout = setTimeout(() => {
        setIsVisible(false);
      }, 10000);
      return () => clearTimeout(hideTimeout);
    }
  }, [isComplete]);

  if (!isVisible) return null;

  return (
    <div className="absolute bottom-12 right-20 z-10 max-w-[200px]">
      {/* Speech bubble */}
      <div className="relative bg-white rounded-2xl p-2.5 shadow-lg">
        <p className="text-xs text-gray-700 italic leading-relaxed">
          "{displayText}"
          {!isComplete && <span className="animate-pulse text-primary">|</span>}
        </p>
        {/* Speech bubble tail pointing right */}
        <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-0 h-0 
          border-t-[6px] border-t-transparent 
          border-l-[8px] border-l-white 
          border-b-[6px] border-b-transparent" />
      </div>
    </div>
  );
}
