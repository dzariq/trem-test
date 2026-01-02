import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { announcements } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Megaphone, Calendar, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

type CategoryFilter = "all" | "Event" | "Academic" | "General";

export default function AnnouncementsPage() {
  const navigate = useNavigate();
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      month: "long", 
      day: "numeric",
      year: "numeric"
    });
  };

  const categories: CategoryFilter[] = ["all", "Event", "Academic", "General"];

  const filteredAnnouncements = categoryFilter === "all"
    ? announcements
    : announcements.filter(a => a.category === categoryFilter);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Event": return "bg-blue-500 text-white";
      case "Academic": return "bg-amber-500 text-white";
      case "General": return "bg-primary text-primary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <AppLayout>
      <AppHeader 
        leftContent={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-foreground">Announcements</h1>
          </div>
        }
      />

      <section className="px-4 py-4">
        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
          {categories.map((category) => (
            <Badge
              key={category}
              variant={categoryFilter === category ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap capitalize"
              onClick={() => setCategoryFilter(category)}
            >
              {category === "all" ? "All" : category}
            </Badge>
          ))}
        </div>

        {/* Announcements List */}
        <div className="space-y-4">
          {filteredAnnouncements.map((announcement) => (
            <Card key={announcement.id} className="bg-card border-border shadow-sm overflow-hidden">
              {/* Image header or default pattern */}
              <div className="relative h-32 overflow-hidden">
                {announcement.image ? (
                  <img 
                    src={announcement.image} 
                    alt={announcement.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 flex items-center justify-center">
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-2 left-4 w-8 h-8 rounded-full bg-primary/30" />
                      <div className="absolute top-6 right-8 w-12 h-12 rounded-full bg-secondary/30" />
                      <div className="absolute bottom-4 left-1/3 w-6 h-6 rounded-full bg-primary/20" />
                    </div>
                    <Megaphone className="h-12 w-12 text-primary/40" />
                  </div>
                )}
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                {/* Category badge */}
                <div className="absolute top-3 left-3">
                  <Badge className={getCategoryColor(announcement.category)}>
                    {announcement.category}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground text-lg mb-2">
                  {announcement.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {announcement.snippet}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(announcement.date)}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/parent/announcements/${announcement.id}`)}
                  >
                    Read More
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredAnnouncements.length === 0 && (
            <div className="text-center py-12">
              <Megaphone className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No announcements in this category</p>
            </div>
          )}
        </div>
      </section>
    </AppLayout>
  );
}
