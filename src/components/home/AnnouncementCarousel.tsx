import { useState } from "react";
import { announcements } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Megaphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { AnnouncementDrawer } from "@/components/AnnouncementDrawer";

export function AnnouncementCarousel() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const mainAnnouncement = announcements[0];
  const otherAnnouncements = announcements.slice(1, 4);

  const handleAnnouncementClick = (index: number) => {
    setCurrentAnnouncementIndex(index);
    setDrawerOpen(true);
  };

  return (
    <section className="py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-4">
        <h2 className="text-lg font-semibold text-foreground">Announcements</h2>
        <Button 
          variant="link" 
          className="text-primary p-0 h-auto text-sm"
          onClick={() => navigate("/parent/announcements")}
        >
          See all <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Featured Main Announcement */}
      <div className="px-4 mb-4">
        <Card 
          className="bg-card border-border shadow-md overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
          onClick={() => handleAnnouncementClick(0)}
        >
          {/* Large Image Header */}
          <div className="relative h-48 overflow-hidden">
            {mainAnnouncement.image ? (
              <img 
                src={mainAnnouncement.image} 
                alt={mainAnnouncement.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary/20 to-secondary/30 flex items-center justify-center">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-4 left-8 w-16 h-16 rounded-full bg-primary/30" />
                  <div className="absolute top-12 right-12 w-24 h-24 rounded-full bg-secondary/30" />
                  <div className="absolute bottom-8 left-1/4 w-12 h-12 rounded-full bg-primary/20" />
                </div>
                <Megaphone className="h-16 w-16 text-primary/50" />
              </div>
            )}
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
            {/* Featured Badge */}
            <div className="absolute top-3 left-3">
              <Badge className="bg-primary text-primary-foreground text-xs">
                Featured
              </Badge>
            </div>
            {/* Category and Date */}
            <div className="absolute bottom-3 left-4 flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {mainAnnouncement.category}
              </Badge>
              <Badge variant="outline" className="text-xs bg-card/80 backdrop-blur-sm">
                {formatDate(mainAnnouncement.date)}
              </Badge>
            </div>
          </div>
          <CardContent className="p-4">
            <h3 className="font-bold text-foreground text-lg mb-2">
              {mainAnnouncement.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {mainAnnouncement.snippet}
            </p>
            <Button 
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                handleAnnouncementClick(0);
              }}
            >
              Read More
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* Other Announcements Carousel */}
      {otherAnnouncements.length > 0 && (
        <div className="px-4">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2">
              {otherAnnouncements.map((announcement, idx) => (
                <CarouselItem key={announcement.id} className="pl-2 basis-[75%]">
                  <Card 
                    className="bg-card border-border shadow-sm overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                    onClick={() => handleAnnouncementClick(idx + 1)}
                  >
                    <div className="relative h-20 overflow-hidden">
                      {announcement.image ? (
                        <img 
                          src={announcement.image} 
                          alt={announcement.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 flex items-center justify-center">
                          <Megaphone className="h-8 w-8 text-primary/40" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                      <div className="absolute bottom-2 left-3">
                        <Badge variant="secondary" className="text-[10px]">
                          {announcement.category}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-3 pt-2">
                      <h3 className="font-medium text-foreground text-sm line-clamp-1 mb-1">
                        {announcement.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {announcement.snippet}
                      </p>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex -left-2" />
            <CarouselNext className="hidden sm:flex -right-2" />
          </Carousel>
        </div>
      )}

      {/* Announcement Drawer */}
      <AnnouncementDrawer
        announcements={announcements}
        currentIndex={currentAnnouncementIndex}
        isOpen={drawerOpen}
        onOpenChange={setDrawerOpen}
        onNavigate={setCurrentAnnouncementIndex}
      />
    </section>
  );
}