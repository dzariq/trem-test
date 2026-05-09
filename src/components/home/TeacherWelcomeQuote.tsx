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
  "Small encouragements today can shape a child's whole year.",
  "A calm classroom begins with a calm teacher.",
  "Your kindness is part of every lesson you teach.",
  "Students remember how you made them feel long after the bell.",
  "Every question welcomed is a mind set free.",
  "Teaching well is showing up fully, one class at a time.",
  "Your standards today become their habits tomorrow.",
  "A good teacher learns alongside their students.",
  "Consistency in care is the quietest form of greatness.",
  "You turn ordinary mornings into meaningful moments.",
  "Curiosity grows where teachers make it safe to wonder.",
  "Your effort behind the scenes shapes what shines in front.",
  "Every lesson plan is a small act of hope.",
  "Listening is half of great teaching.",
  "You're shaping confidence, not just knowledge.",
  "The best teachers make difficult things feel possible.",
  "Your encouragement may be the highlight of a child's day.",
  "Real learning happens when students feel seen.",
  "Teaching is leadership lived out in small daily choices.",
  "Your steadiness is a gift to every student in the room.",
  "Hard days pass; the impact you leave does not.",
  "You're growing thinkers, not just test-takers.",
  "A patient teacher creates brave learners.",
  "Your classroom is a place where futures begin.",
  "Teaching is a craft you refine your whole life.",
  "Even on quiet days, your work matters deeply.",
  "You give students permission to try, fail, and try again.",
  "Great teaching is mostly preparation and presence.",
  "Your belief in a child can outlast their doubt.",
  "Thank you for showing up for them today.",
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
    <div className="absolute bottom-12 right-20 z-10 max-w-[200px]">
      {/* Speech bubble */}
      <div className="relative bg-white rounded-2xl p-2.5 shadow-lg">
        <p className="text-xs text-gray-700 italic leading-relaxed">
          "{displayedText}"
          {!isComplete && <span className="animate-pulse text-primary">|</span>}
        </p>
        {/* Speech bubble tail pointing right toward teacher */}
        <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-0 h-0 
          border-t-[6px] border-t-transparent 
          border-l-[8px] border-l-white 
          border-b-[6px] border-b-transparent" />
      </div>
    </div>
  );
};

export default TeacherWelcomeQuote;
