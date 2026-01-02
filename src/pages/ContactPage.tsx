import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import schoolLogo from "@/assets/school-badge.png";

const campuses = [
  {
    name: "Collinz International School (Glenmarie)",
    address: "Blok 2 & 3 Level G-03A, 05, Level 1, 2, Jln Doktor U1/67, Perniagaan Temasya 8, 40150 Shah Alam, Selangor",
    phones: ["012-902 9664", "012-886 0901"],
    email: "school.gl@collinz.edu.my",
    mapUrl: "https://maps.google.com/?q=Collinz+International+School+Glenmarie"
  },
  {
    name: "Collinz International School (Klang)",
    address: "No. 35, 37, 39, 41 & 43, Jalan Kasuarina 7, Bandar Botanic, 41200 Klang, Selangor",
    phones: ["012-580 8609", "012-886 0970"],
    email: "school.bo@collinz.edu.my",
    mapUrl: "https://maps.google.com/?q=Collinz+International+School+Klang"
  }
];

const officeHours = [
  { day: "Monday", hours: "7:30 am – 4:30 pm" },
  { day: "Tuesday", hours: "7:30 am – 4:30 pm" },
  { day: "Wednesday", hours: "7:30 am – 4:30 pm" },
  { day: "Thursday", hours: "7:30 am – 4:30 pm" },
  { day: "Friday", hours: "7:30 am – 4:30 pm" },
  { day: "Saturday", hours: "9:00 am – 2:00 pm" },
  { day: "Sunday", hours: "Closed" },
];

export default function ContactPage() {
  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone.replace(/[^0-9+]/g, '')}`;
  };

  return (
    <AppLayout>
      <AppHeader 
        leftContent={
          <div className="flex items-center gap-2">
            <img src={schoolLogo} alt="School Logo" className="h-12 w-auto -my-2 drop-shadow-md" />
            <h1 className="text-xl font-semibold text-foreground">Contact Us</h1>
          </div>
        }
      />

      {/* Header Section */}
      <section className="px-4 py-6 text-center">
        <h2 className="text-2xl font-bold text-primary mb-2">Find Us</h2>
        <p className="text-muted-foreground text-sm">Get in touch with our campuses</p>
      </section>

      {/* Campus Cards */}
      <section className="px-4 pb-6 space-y-4">
        {campuses.map((campus, index) => (
          <Card key={index} className="bg-card border-border shadow-sm overflow-hidden">
            <CardContent className="p-4 space-y-4">
              {/* Campus Name */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-base">{campus.name}</h3>
                </div>
              </div>

              {/* Address */}
              <div className="pl-11">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {campus.address}
                </p>
              </div>

              {/* Phone Numbers */}
              <div className="pl-11 flex flex-wrap gap-2">
                {campus.phones.map((phone, phoneIndex) => (
                  <Button
                    key={phoneIndex}
                    variant="outline"
                    size="sm"
                    className="text-primary border-primary/30 hover:bg-primary/10"
                    onClick={() => handleCall(phone)}
                  >
                    <Phone className="h-3.5 w-3.5 mr-1.5" />
                    {phone}
                  </Button>
                ))}
              </div>

              {/* Email */}
              <div className="pl-11 flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-primary" />
                <a 
                  href={`mailto:${campus.email}`}
                  className="text-sm text-primary hover:underline"
                >
                  {campus.email}
                </a>
              </div>

              {/* Map Link */}
              <div className="pl-11">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-primary p-0 h-auto"
                  onClick={() => window.open(campus.mapUrl, '_blank')}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  View on Google Maps
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Office Hours */}
      <section className="px-4 pb-6">
        <Card className="bg-accent/30 border-border">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Office Hours
            </h3>
            <div className="text-sm pl-6">
              {officeHours.map((item) => (
                <div key={item.day} className="flex justify-between py-1 border-b border-border/50 last:border-0">
                  <span className="text-muted-foreground">{item.day}</span>
                  <span className={item.hours === "Closed" ? "text-destructive font-medium" : "text-foreground"}>
                    {item.hours}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </AppLayout>
  );
}