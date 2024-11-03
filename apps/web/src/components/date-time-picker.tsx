"use client";

import { add } from "date-fns";
import { Clock } from "lucide-react";
import * as React from "react";

import { Calendar } from "@/components/ui/calendar";
import { TimePickerInput } from "./time-picker-input";
import { Label } from "./ui/label";

export function DateTimePicker({
  value,
  disabled,
  onChange,
}: {
  value: Date | undefined;
  onChange: (date: Date) => void;
  disabled?: (date: Date) => boolean;
}) {
  const minuteRef = React.useRef<HTMLInputElement>(null);
  const hourRef = React.useRef<HTMLInputElement>(null);
  const [date, setDate] = React.useState<Date | undefined>(value);

  /**
   * carry over the current time when a user clicks a new day
   * instead of resetting to 00:00
   */
  const handleSelect = (newDay: Date | undefined) => {
    if (!newDay) return;
    if (!date) {
      setDate(newDay);
      onChange(newDay);
      return;
    }

    const diff = newDay.getTime() - date.getTime();
    const diffInDays = diff / (1000 * 60 * 60 * 24);
    const newDateFull = add(date, { days: Math.ceil(diffInDays) });
    setDate(newDateFull);
    onChange(newDateFull);
  };

  const handleTimeChange = (time: Date | undefined) => {
    if (!time) return;
    setDate(time);
    onChange(time);
  };

  return (
    <>
      <Calendar
        mode="single"
        selected={date}
        onSelect={(d) => handleSelect(d)}
        disabled={disabled}
      />
      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2">
          <div className="flex h-10 items-center">
            <Clock className="ml-2 h-4 w-4" />
          </div>
          <div className="grid gap-1 text-center">
            <Label htmlFor="hours" className="text-xs">
              Hours
            </Label>
            <TimePickerInput
              picker="hours"
              date={date}
              setDate={handleTimeChange}
              ref={hourRef}
              onRightFocus={() => minuteRef.current?.focus()}
            />
          </div>
          <div className="grid gap-1 text-center">
            <Label htmlFor="minutes" className="text-xs">
              Minutes
            </Label>
            <TimePickerInput
              picker="minutes"
              date={date}
              setDate={handleTimeChange}
              ref={minuteRef}
              onLeftFocus={() => hourRef.current?.focus()}
            />
          </div>
        </div>
      </div>
    </>
  );
}
