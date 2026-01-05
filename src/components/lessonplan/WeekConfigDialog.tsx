import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { 
  weekConfigs, 
  updateWeekConfig, 
  type WeekConfig 
} from "@/data/weekConfigData";
import { toast } from "sonner";

interface WeekConfigDialogProps {
  onConfigUpdate?: () => void;
}

export function WeekConfigDialog({ onConfigUpdate }: WeekConfigDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const handleWeekSelect = (weekNum: string) => {
    const week = parseInt(weekNum);
    setSelectedWeek(week);
    const config = weekConfigs.find(w => w.weekNumber === week);
    if (config) {
      setStartDate(new Date(config.startDate));
      setEndDate(new Date(config.endDate));
    }
  };

  const handleSave = () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }
    
    if (startDate > endDate) {
      toast.error("Start date must be before end date");
      return;
    }

    updateWeekConfig(
      selectedWeek,
      startDate.toISOString().split("T")[0],
      endDate.toISOString().split("T")[0]
    );
    
    toast.success(`Week ${selectedWeek} dates updated`);
    onConfigUpdate?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configure Week Dates</DialogTitle>
          <DialogDescription>
            Set the start and end dates for each week. These dates will apply to all lesson plans.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Week Selector */}
          <div className="space-y-2">
            <Label>Select Week</Label>
            <Select 
              value={selectedWeek.toString()} 
              onValueChange={handleWeekSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select week" />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-60">
                  {weekConfigs.map((week) => (
                    <SelectItem key={week.weekNumber} value={week.weekNumber.toString()}>
                      Week {week.weekNumber} ({format(new Date(week.startDate), "d MMM")} - {format(new Date(week.endDate), "d MMM")})
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "d MMM yyyy") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "d MMM yyyy") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Button onClick={handleSave} className="w-full">
            Save Week {selectedWeek} Dates
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
