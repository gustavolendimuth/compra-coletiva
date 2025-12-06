import { useState, useEffect } from "react";
import { Input } from "./ui";

interface DateTimeInputProps {
  value: string; // ISO datetime string
  onChange: (value: string) => void;
  className?: string;
  autoFocus?: boolean;
}

export default function DateTimeInput({
  value,
  onChange,
  autoFocus = false,
}: DateTimeInputProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  // Convert ISO string to date and time inputs
  useEffect(() => {
    if (value) {
      const dt = new Date(value);
      // Use local date/time instead of UTC
      const day = dt.getDate().toString().padStart(2, "0");
      const month = (dt.getMonth() + 1).toString().padStart(2, "0");
      const year = dt.getFullYear();
      const hours = dt.getHours().toString().padStart(2, "0");
      const minutes = dt.getMinutes().toString().padStart(2, "0");

      const dateStr = `${day}/${month}/${year}`;
      const timeStr = `${hours}:${minutes}`;

      setDate(dateStr);
      setTime(timeStr);
    } else {
      setDate("");
      setTime("");
    }
  }, [value]);

  const updateISOValue = (dateStr: string, timeStr: string) => {
    if (!dateStr || !timeStr) {
      onChange("");
      return;
    }

    // Parse dd/mm/yyyy
    const dateParts = dateStr.split("/");
    if (dateParts.length !== 3) {
      onChange("");
      return;
    }

    const [day, month, year] = dateParts;

    // Validate date parts
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    if (
      isNaN(dayNum) ||
      isNaN(monthNum) ||
      isNaN(yearNum) ||
      dayNum < 1 ||
      dayNum > 31 ||
      monthNum < 1 ||
      monthNum > 12 ||
      yearNum < 1900
    ) {
      onChange("");
      return;
    }

    // Parse HH:mm
    const timeParts = timeStr.split(":");
    if (timeParts.length !== 2) {
      onChange("");
      return;
    }

    const [hour, minute] = timeParts;
    const hourNum = parseInt(hour, 10);
    const minuteNum = parseInt(minute, 10);

    if (
      isNaN(hourNum) ||
      isNaN(minuteNum) ||
      hourNum < 0 ||
      hourNum > 23 ||
      minuteNum < 0 ||
      minuteNum > 59
    ) {
      onChange("");
      return;
    }

    // Create ISO-like string: yyyy-MM-ddTHH:mm:ss
    const isoDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    const isoTime = `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:00`;
    const isoString = `${isoDate}T${isoTime}`;

    onChange(isoString);
  };

  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ""); // Remove non-digits

    if (value.length >= 2) {
      value = value.slice(0, 2) + "/" + value.slice(2);
    }
    if (value.length >= 5) {
      value = value.slice(0, 5) + "/" + value.slice(5);
    }
    if (value.length > 10) {
      value = value.slice(0, 10);
    }

    setDate(value);

    // Only update ISO if we have a complete date
    if (value.length === 10 && time.length === 5) {
      updateISOValue(value, time);
    }
  };

  const handleTimeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ""); // Remove non-digits

    if (value.length >= 2) {
      value = value.slice(0, 2) + ":" + value.slice(2);
    }
    if (value.length > 5) {
      value = value.slice(0, 5);
    }

    setTime(value);

    // Only update ISO if we have a complete time
    if (date.length === 10 && value.length === 5) {
      updateISOValue(date, value);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <Input
          type="text"
          value={date}
          onChange={handleDateInput}
          placeholder="dd/mm/aaaa"
          maxLength={10}
          autoFocus={autoFocus}
        />
      </div>
      <div>
        <Input
          type="text"
          value={time}
          onChange={handleTimeInput}
          placeholder="HH:mm"
          maxLength={5}
        />
      </div>
    </div>
  );
}
