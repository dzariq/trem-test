import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Users, GraduationCap } from "lucide-react";
import schoolBadge from "@/assets/school-badge.png";

export default function RoleSelectionPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="text-center mb-10">
        <img src={schoolBadge} alt="School Badge" className="h-24 w-auto mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground">Welcome to School Portal</h1>
        <p className="text-muted-foreground mt-2">Select your portal to continue</p>
      </div>

      <div className="grid gap-6 w-full max-w-md">
        <Card 
          className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-2 hover:border-primary"
          onClick={() => navigate("/login?portal=family")}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Parent / Student Portal</h2>
              <p className="text-sm text-muted-foreground">View attendance, grades, and school updates</p>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-2 hover:border-primary"
          onClick={() => navigate("/login?portal=teacher")}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 rounded-full bg-primary/10">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Teacher Portal</h2>
              <p className="text-sm text-muted-foreground">Manage attendance, grades, and class activities</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
