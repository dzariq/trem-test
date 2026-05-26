import { useState, useEffect } from "react";

const quotesAboutChild = [
  "Your child is becoming someone wonderful.",
  "There's a spark in your child that the world needs.",
  "Your child carries pieces of your kindness wherever they go.",
  "Every child blooms in their own season — yours is blooming beautifully.",
  "The way your child smiles started with the love you gave.",
  "Your child is learning the world by watching how you love them.",
  "Small as they are, your child is doing big, brave things.",
  "Your child's confidence is built on the quiet 'I believe in you' from home.",
  "There's no one your child would rather be cheered on by than you.",
  "The curiosity in your child's eyes is a gift you helped create.",
  "Your child is writing a story only they can tell.",
  "The world sees what you first believed in your child.",
  "Your child's laughter is proof that love lives at home.",
  "Every question your child asks is a sign of a mind growing freely.",
  "Your child is capable of more than they know — and you're there to show them.",
];

const quotesAboutParenting = [
  "You're doing better than you think.",
  "Parenting isn't about being perfect — it's about being present.",
  "The love you give today becomes strength they carry tomorrow.",
  "Your patience is shaping a kinder world, one child at a time.",
  "Some of your best parenting happens in the quietest moments.",
  "You don't need all the answers — you just need to be there.",
  "Showing up is half the magic of being a parent.",
  "Your child doesn't need a perfect parent — they need a real one.",
  "Even on the hard days, you're exactly who they need.",
  "The little things you do every day matter more than you'll ever see.",
  "Trust yourself — your instincts know more than you realize.",
  "Rest is part of parenting too. You can't pour from an empty cup.",
  "Your child won't remember a perfect house, but they will remember a present parent.",
  "Comparison steals joy. Your family journey is uniquely yours.",
  "Being your child's safe place is the greatest job in the world.",
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