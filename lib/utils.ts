import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhone(phone: string) {
  const clean = phone.replace(/\D/g, "").slice(-10);
  if (clean.length !== 10) return phone;
  return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
