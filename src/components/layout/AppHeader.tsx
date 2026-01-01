import { Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface AppHeaderProps {
  title: string;
  showNotifications?: boolean;
  showProfile?: boolean;
  rightContent?: React.ReactNode;
}

export function AppHeader({ 
  title, 
  showNotifications = false, 
  showProfile = false,
  rightContent 
}: AppHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        
        <div className="flex items-center gap-2">
          {rightContent}
          
          {showNotifications && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={() => {}}
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
              onClick={() => navigate("/profile")}
            >
              <User className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
