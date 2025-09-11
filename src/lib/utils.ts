import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { api } from "./api"
import { toast } from "sonner"

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

// Simple short date like: 11 Aug '25
export function formatDateShort(iso?: string | number | Date) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const day = d.getDate();
  const month = d.toLocaleString("en-US", { month: "short" });
  const year2 = d.getFullYear().toString().slice(-2);
  return `${day} ${month} '${year2}`;
}

// Centralized SWR fetcher with error handling
export const swrFetcher = async (url: string) => {
  try {
    const response = await api.get(url);
    return response.data;
  } catch (error: unknown) {
    // Don't show toast for 401s - handled by interceptor
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
      if (axiosError.response?.status === 401) {
        throw error; // Let the interceptor handle this
      }
      
      // For other errors, show a toast if in development or for specific error codes
      if (process.env.NODE_ENV === 'development' || axiosError.response?.status === 500) {
        const message = axiosError.response?.data?.message ?? 'API request failed';
        toast.error(message);
      }
    }
    throw error;
  }
};
