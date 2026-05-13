"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-0 p-4 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl relative",
        month: "space-y-4 px-4 first:border-r first:border-slate-800/50",
        month_caption: "flex justify-center pt-1 items-center mb-4 h-9",
        caption_label: "text-sm font-bold text-slate-100 uppercase tracking-widest",
        nav: "absolute top-5 left-4 right-4 flex justify-between items-center z-20 pointer-events-none",
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "h-7 w-7 p-0 text-slate-500 hover:text-white transition-all pointer-events-auto"
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "h-7 w-7 p-0 text-slate-500 hover:text-white transition-all pointer-events-auto"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex justify-center mb-2",
        weekday: "text-slate-500 w-9 font-medium text-[0.7rem] uppercase text-center",
        week: "flex w-full mt-1 justify-center",
        day: cn(
          "h-9 w-9 p-0 font-normal text-slate-400 hover:bg-slate-800 hover:text-white aria-selected:opacity-100 transition-all rounded-md flex items-center justify-center cursor-pointer"
        ),
        selected: "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white font-bold !rounded-md",
        today: "text-blue-400 font-bold bg-blue-400/10 rounded-md",
        outside: "day-outside text-slate-700 opacity-20 aria-selected:bg-slate-800/40 aria-selected:text-slate-600 aria-selected:opacity-10",
        disabled: "text-slate-800 opacity-10",
        range_start: "day-range-start",
        range_end: "day-range-end",
        range_middle: "aria-selected:bg-blue-600/20 aria-selected:text-blue-300 font-medium !rounded-none",
        hidden: "invisible",
        ...classNames,
      }}
      components={
        {
          Chevron: ({ orientation }: { orientation?: "left" | "right" }) => {
            if (orientation === "left") {
              return <ChevronLeft className="h-4 w-4" />;
            }
            return <ChevronRight className="h-4 w-4" />;
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any
      }
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
