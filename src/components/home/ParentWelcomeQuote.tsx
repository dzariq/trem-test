import { useState, useEffect } from "react";

const quotesAboutChild = [
  "Every child blooms on their own clock. Ours is patience.",
  "Every day you send them to us is a gift we don't take for granted.",
  "Welcome back — your child's second home is glad to see you.",
  "Behind every confident child is a parent who believed first.",
  "Big or small, every win counts today.",
  "Good to see you. Let's make today a good one.",
  "The roots of education are bitter, but the fruit is sweet.",
  "It takes a village to raise a child.",
  "Children are not things to be molded, but people to be unfolded.",
  "Raising a child takes a village — and you're not alone in it.",
  "Every effort you make at home shapes who they become.",
];

const quotesAboutParenting = [
  "The care you give at home is the foundation we build on.",
  "The home that listens and the school that teaches raise a whole child.",
  "We teach the lessons; you teach the heart.",
  "When school and home pull in the same direction, children thrive.",
  "We're stronger as a team — thank you for being on it.",
  "Great things happen when parents and teachers trust each other.",
  "Your child is blessed to have you.",
  "Education is a partnership — thank you for being part of it.",
  "Your presence teaches more than any lesson ever could.",
  "You're doing more than you realise — and it shows in your child.",
];

function getDailyQuote() {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const isChildQuote = dayOfYear % 2 === 0;
  const pool = isChildQuote ? quotesAboutChild : quotesAboutParenting;
  const index = dayOfYear % pool.length;
  return pool[index];
}

const ParentWelcomeQuote = () => {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [quote] = useState(() => getDailyQuote());

  useEffect(() => {
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= quote.length) {
        setDisplayedText(quote.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setIsComplete(true);
      }
    }, 50);

    return () => clearInterval(typingInterval);
  }, [quote]);

  useEffect(() => {
    if (isComplete) {
      const hideTimeout = setTimeout(() => setIsVisible(false), 10000);
      return () => clearTimeout(hideTimeout);
    }
  }, [isComplete]);

  if (!isVisible) return null;

  return (
    <div className="absolute bottom-12 right-20 z-10 max-w-[200px]">
      <div className="relative bg-white rounded-2xl p-2.5 shadow-lg">
        <p className="text-xs text-gray-700 italic leading-relaxed">
          "{displayedText}"
          {!isComplete && <span className="animate-pulse text-primary">|</span>}
        </p>
        <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-0 h-0 
          border-t-[6px] border-t-transparent 
          border-l-[8px] border-l-white 
          border-b-[6px] border-b-transparent" />
      </div>
    </div>
  );
};

export default ParentWelcomeQuote;