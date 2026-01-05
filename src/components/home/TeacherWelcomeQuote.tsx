import { useState, useEffect } from "react";

const teacherQuotes = [
  "A teacher affects eternity; you never know where your influence stops.",
  "Teaching is the greatest act of optimism.",
  "The art of teaching is the art of assisting discovery.",
  "You're not just teaching subjects, you're shaping futures.",
  "Every child you teach is a story waiting to be written.",
  "Your patience today creates leaders of tomorrow.",
  "Great teachers ignite curiosity that lasts a lifetime.",
  "You make a difference every single day.",
  "Behind every successful student is a dedicated teacher.",
  "Your words today become their inner voice tomorrow.",
  "Teaching is planting seeds you may never see bloom.",
  "You're not just filling minds, you're opening them.",
  "The influence of a good teacher can never be erased.",
  "Today's lesson is tomorrow's foundation.",
  "You inspire more than you'll ever know.",
  "Great teachers don't just teach - they transform.",
  "Your dedication lights the way for many.",
  "Every moment in class is a chance to inspire.",
  "You're building futures, one lesson at a time.",
  "The world needs teachers like you.",
];

const TeacherWelcomeQuote = () => {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [quote] = useState(() => teacherQuotes[Math.floor(Math.random() * teacherQuotes.length)]);

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
    <div className="absolute bottom-6 right-6 z-10 max-w-[200px]">
      {/* Speech bubble */}
      <div className="relative bg-white rounded-2xl rounded-br-sm p-2.5 shadow-lg">
        <p className="text-xs text-gray-700 italic leading-relaxed">
          "{displayedText}"
          {!isComplete && <span className="animate-pulse text-primary">|</span>}
        </p>
        {/* Speech bubble tail pointing down-right */}
        <div className="absolute -bottom-1.5 right-3 w-0 h-0 
          border-l-[6px] border-l-transparent 
          border-t-[8px] border-t-white 
          border-r-[6px] border-r-transparent" />
      </div>
    </div>
  );
};

export default TeacherWelcomeQuote;
