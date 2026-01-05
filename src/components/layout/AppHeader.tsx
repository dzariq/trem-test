import { useState } from "react";
import { Bell, User, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { NotificationsDrawer } from "@/components/NotificationsDrawer";

interface AppHeaderProps {
  title?: string;
  showNotifications?: boolean;
  showProfile?: boolean;
  showBack?: boolean;
  rightContent?: React.ReactNode;
  leftContent?: React.ReactNode;
}

export function AppHeader({ 
  title, 
  showNotifications = false, 
  showProfile = false,
  showBack = false,
  rightContent,
  leftContent
}: AppHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const isTeacherPortal = location.pathname.startsWith("/teacher");
  const basePath = isTeacherPortal ? "/teacher" : "/parent";

  return (
    <>
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="w-full flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            {showBack && (
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            {leftContent || (title && <h1 className="text-xl font-semibold text-foreground">{title}</h1>)}
          </div>
          
          <div className="flex items-center gap-2">
            {rightContent}
            
            {showNotifications && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                onClick={() => setIsNotificationsOpen(true)}
              >
                <Bell className="h-5 w-5" />
                <Badge 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive text-destructive-foreground"
                >
                  3
                </Badge>
              </Button>
            )}
            
            {showProfile && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate(`${basePath}/profile`)}
              >
                <User className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </header>

      <NotificationsDrawer 
        open={isNotificationsOpen} 
        onOpenChange={setIsNotificationsOpen}
        isTeacher={isTeacherPortal}
      />
    </>
  );
}