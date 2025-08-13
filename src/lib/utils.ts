import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date formatting helpers
function pad2(n: number) { return n.toString().padStart(2, "0"); }

export function formatDateTimeSmart(iso?: string | number | Date) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yest.toDateString();
  const hours = d.getHours();
  const mins = pad2(d.getMinutes());
  const ampm = hours >= 12 ? "PM" : "AM";
  const hr12 = hours % 12 === 0 ? 12 : hours % 12;
  const time = `${pad2(hr12)}:${mins} ${ampm}`;
  if (sameDay) return `Today ${time}`;
  if (isYesterday) return `Yesterday ${time}`;
  const day = d.getDate();
  const month = d.toLocaleString("en-US", { month: "short" });
  const year2 = d.getFullYear().toString().slice(-2);
  return `${day} ${month} '${year2} ${time}`;
}
