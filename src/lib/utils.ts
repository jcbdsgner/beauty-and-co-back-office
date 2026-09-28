import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Fusion de classes Tailwind (clsx + tailwind-merge) — même helper que point-de-vente. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
