import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-2 sm:p-3 pointer-events-auto", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 justify-center",
        month: "space-y-4 w-full",
        caption: "flex justify-center pt-1 relative items-center h-10",
        caption_label: "text-base font-semibold",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-9 w-9 bg-transparent p-0 opacity-60 hover:opacity-100 hover:bg-muted",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full table-fixed border-collapse",
        head_row: "grid grid-cols-7 gap-1 mb-1",
        head_cell: "text-muted-foreground font-medium text-sm text-center py-2",
        row: "grid grid-cols-7 gap-1 mt-1",
        cell: "relative grid place-items-center p-0 focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "relative isolate grid h-9 w-9 place-items-center p-0 text-sm leading-none font-normal rounded-full hover:bg-muted active:bg-muted/80 aria-selected:opacity-100",
        ),
        day_range_end: "day-range-end",
        day_selected:
          "text-primary-foreground hover:text-primary-foreground focus:text-primary-foreground [&::before]:content-[''] [&::before]:absolute [&::before]:h-8 [&::before]:w-8 [&::before]:rounded-full [&::before]:bg-primary [&::before]:z-[-1]",
        day_today:
          "font-semibold text-foreground [&::before]:content-[''] [&::before]:absolute [&::before]:h-8 [&::before]:w-8 [&::before]:rounded-full [&::before]:ring-2 [&::before]:ring-primary [&::before]:bg-transparent [&::before]:z-[-1] aria-selected:[&::before]:ring-0",
        day_outside:
          "day-outside text-muted-foreground opacity-40 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-5 w-5" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-5 w-5" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
