import { useState, useRef } from "react";
import { Clock, ChevronRight, Trash2 } from "lucide-react";

interface SwipeableNotificationProps {
  id: string;
  icon: React.ReactNode;
  iconBgClass: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  hasLink: boolean;
  onClick: () => void;
  onDelete: () => void;
}

export function SwipeableNotification({
  id,
  icon,
  iconBgClass,
  title,
  message,
  time,
  isRead,
  hasLink,
  onClick,
  onDelete,
}: SwipeableNotificationProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const isDraggingRef = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = e.touches[0].clientX;
    isDraggingRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    currentXRef.current = e.touches[0].clientX;
    const diff = currentXRef.current - startXRef.current;
    
    // Only allow swiping left (negative direction)
    if (diff < 0) {
      isDraggingRef.current = true;
      // Limit the swipe to -100px
      setTranslateX(Math.max(diff, -100));
    }
  };

  const handleTouchEnd = () => {
    // If swiped more than 80px, trigger delete
    if (translateX < -80) {
      setIsDeleting(true);
      setTranslateX(-400); // Slide off screen
      setTimeout(() => {
        onDelete();
      }, 200);
    } else {
      // Snap back
      setTranslateX(0);
    }
  };

  const handleClick = () => {
    // Only trigger click if not dragging
    if (!isDraggingRef.current && Math.abs(translateX) < 10) {
      setIsDeleting(true);
      setTimeout(() => {
        onClick();
      }, 150);
    }
  };

  // Only show delete background when swiping
  const showDeleteBackground = translateX < -5;

  return (
    <div className="relative overflow-hidden rounded-xl w-full max-w-full box-border">
      {/* Delete background - only visible when swiping */}
      <div 
        className={`absolute inset-y-0 right-0 w-24 bg-destructive flex items-center justify-center rounded-r-xl transition-opacity duration-150 ${
          showDeleteBackground ? "opacity-100" : "opacity-0"
        }`}
      >
        <Trash2 className="h-5 w-5 text-destructive-foreground" />
      </div>
      
      {/* Notification content */}
      <div
        className={`relative flex items-center gap-3 p-3 rounded-xl bg-card ${
          isDeleting ? "opacity-0 scale-95" : ""
        } ${
          !isRead 
            ? "border border-primary/20 bg-primary/5" 
            : "border border-border"
        } ${hasLink ? "cursor-pointer active:scale-[0.98]" : ""}`}
        style={{ 
          transform: `translateX(${translateX}px)`,
          transition: isDraggingRef.current && Math.abs(translateX) > 0 ? 'none' : 'transform 0.2s ease-out, opacity 0.15s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
      >
        {/* Icon */}
        <div className={`w-10 h-10 rounded-full ${iconBgClass} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`text-sm text-foreground truncate ${!isRead ? "font-semibold" : "font-medium"}`}>
              {title}
            </h3>
            {!isRead && (
              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {message}
          </p>
          <span className="text-[10px] text-muted-foreground/70 mt-1 flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" />
            {time}
          </span>
        </div>
        
        {/* Arrow */}
        {hasLink && (
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
      </div>
    </div>
  );
}
