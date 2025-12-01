import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(price: number): string {
    const parts = price.toFixed(2).split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];

    const formattedIntegerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    if (decimalPart === '00') {
        return `$${formattedIntegerPart}`;
    }

    return `$${formattedIntegerPart},${decimalPart}`;
}
