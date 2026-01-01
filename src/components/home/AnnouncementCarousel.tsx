import { announcements } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Megaphone } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export function AnnouncementCarousel() {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <section className="px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-foreground">Announcements</h2>
        <Button variant="link" className="text-primary p-0 h-auto text-sm">
          See all <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2">
          {announcements.slice(0, 3).map((announcement) => (
            <CarouselItem key={announcement.id} className="pl-2 basis-[85%]">
              <Card className="bg-card border-border shadow-sm overflow-hidden">
                {/* Image header or default pattern */}
                <div className="relative h-24 overflow-hidden">
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
                      <Megaphone className="h-10 w-10 text-primary/40" />
                    </div>
                  )}
                  {/* Overlay gradient for readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                  {/* Badge positioned on image */}
                  <div className="absolute bottom-2 left-4 flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {announcement.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(announcement.date)}
                    </span>
                  </div>
                </div>
                <CardContent className="p-4 pt-2">
                  <h3 className="font-semibold text-foreground mb-1 line-clamp-1">
                    {announcement.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {announcement.snippet}
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex -left-2" />
        <CarouselNext className="hidden sm:flex -right-2" />
      </Carousel>
    </section>
  );
}
