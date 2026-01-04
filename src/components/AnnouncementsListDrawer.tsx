import { useState, useEffect } from "react";
import { announcements } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Megaphone, Calendar, X } from "lucide-react";
import { AnnouncementDrawer, getReadAnnouncementIds } from "@/components/AnnouncementDrawer";
import { Check } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";

type CategoryFilter = "all" | "Event" | "Academic" | "General";

interface AnnouncementsListDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AnnouncementsListDrawer({ isOpen, onOpenChange }: AnnouncementsListDrawerProps) {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);
  const [readIds, setReadIds] = useState<number[]>([]);

  useEffect(() => {
    setReadIds(getReadAnnouncementIds());
  }, []);

  useEffect(() => {
    if (!detailDrawerOpen) {
      setReadIds(getReadAnnouncementIds());
    }
  }, [detailDrawerOpen]);

  const isRead = (id: number) => readIds.includes(id);

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

  const handleAnnouncementClick = (index: number) => {
    setCurrentAnnouncementIndex(index);
    setDetailDrawerOpen(true);
  };

  return (
    <>
      <Drawer open={isOpen} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[95vh]">
          <DrawerHeader className="flex flex-row items-center justify-between border-b pb-4">
            <DrawerTitle className="text-xl font-semibold">Announcements</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-5 w-5" />
              </Button>
            </DrawerClose>
          </DrawerHeader>

          <div className="overflow-y-auto flex-1 px-4 py-4">
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
            <div className="space-y-4 pb-8">
              {filteredAnnouncements.map((announcement, index) => (
                <Card 
                  key={announcement.id} 
                  className="bg-card border-border shadow-sm overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                  onClick={() => handleAnnouncementClick(index)}
                >
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
                    {/* Category badge & Read status */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <Badge className={getCategoryColor(announcement.category)}>
                        {announcement.category}
                      </Badge>
                      {isRead(announcement.id) && (
                        <Badge variant="outline" className="text-xs gap-1 text-green-600 border-green-600/30 bg-green-500/10 backdrop-blur-sm">
                          <Check className="h-3 w-3" />
                          Read
                        </Badge>
                      )}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAnnouncementClick(index);
                        }}
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
          </div>
        </DrawerContent>
      </Drawer>

      {/* Announcement Detail Drawer */}
      <AnnouncementDrawer
        announcements={filteredAnnouncements}
        currentIndex={currentAnnouncementIndex}
        isOpen={detailDrawerOpen}
        onOpenChange={setDetailDrawerOpen}
        onNavigate={setCurrentAnnouncementIndex}
      />
    </>
  );
}
