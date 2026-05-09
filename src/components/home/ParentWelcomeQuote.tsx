import { useState, useEffect } from "react";

const parentQuotes = [
  "Every child learns at their own pace, and that's perfectly okay.",
  "Your encouragement at home is your child's greatest advantage.",
  "Small moments of attention shape big confidence in children.",
  "Children grow best where they feel safe, seen, and supported.",
  "Learning happens everywhere, not just in the classroom.",
  "Your interest in their day means more than you know.",
  "Reading together today builds thinkers for tomorrow.",
  "Asking 'how was school?' is the start of real connection.",
  "Progress, not perfection, is the goal worth celebrating.",
  "Mistakes are how children learn to try again.",
  "Praise effort, and effort will follow.",
  "A calm home is a strong foundation for learning.",
  "Your child watches how you handle hard things.",
  "Curiosity grows when questions are welcomed at home.",
  "Sleep, food, and routine quietly power great school days.",
  "Every child shines in their own way.",
  "Listening is one of the kindest things you can do.",
  "Celebrate small wins; they add up to big growth.",
  "Your child's character matters more than any score.",
  "Encouragement today builds confidence for life.",
  "Behind every confident student is a supportive family.",
  "Time spent talking is never time wasted.",
  "Your patience teaches more than any lesson plan.",
  "Children learn best when they feel believed in.",
  "A simple 'I'm proud of you' goes a long way.",
  "Habits formed at home travel to school every day.",
  "Curiosity is a gift you can nurture every day.",
  "Routines bring comfort, focus, and confidence.",
  "Asking about their friends shows you care about their world.",
  "Reading 10 minutes a day changes a child's future.",
  "Your example is the lesson they remember most.",
  "Effort, kindness, and honesty matter more than grades.",
  "Children rise to the expectations we set with love.",
  "Take a breath; parenting is a long, beautiful journey.",
  "Your child is learning, growing, and becoming.",
  "Mistakes today are stepping stones for tomorrow.",
  "Great parents don't have all the answers — they keep showing up.",
  "A warm home is the best classroom there is.",
  "Every conversation is a chance to connect.",
  "Your support is the wind beneath their progress.",
  "Help them try; let them learn; watch them grow.",
  "Confidence is built one kind word at a time.",
  "Today's small effort becomes tomorrow's strong habit.",
  "Children remember moments, not lectures.",
  "Your love is the safety net that lets them climb.",
  "Encourage questions; they are the seeds of learning.",
  "Be the calm in their busy school day.",
  "Curiosity, kindness, and courage — the lessons that last.",
  "Cheer effort louder than results.",
  "Thank you for being your child's biggest supporter.",
];

const ParentWelcomeQuote = () => {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [quote] = useState(() => parentQuotes[Math.floor(Math.random() * parentQuotes.length)]);

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