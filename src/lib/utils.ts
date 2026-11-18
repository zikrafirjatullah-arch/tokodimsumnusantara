import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { DeliveryType } from "@/types/database";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format angka ke format mata uang Rupiah standar Indonesia (contoh: Rp 15.000)
 */
export function formatRupiah(amount: number): string {
  const formatted = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(amount)));

  return `Rp ${formatted}`;
}

/**
 * Generate nomor pesanan dengan format DMS-YYYYMMDD-XXXX
 */
export function generateOrderNumber(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `DMS-${year}${month}${day}-${randomSuffix}`;
}

export const DELIVERY_OPTIONS: Record<
  DeliveryType,
  { label: string; description: string; fee: number; eta: string }
> = {
  pickup: {
    label: "Ambil Sendiri di Outlet",
    description: "Bebas ongkir, pesanan disiapkan hangat sesuai jam ambil",
    fee: 0,
    eta: "Siap 15-20 menit",
  },
  instant_courier: {
    label: "Kurir Lokal / Instan",
    description: "Diantar langsung selagi hangat (area radius 10 km)",
    fee: 10000,
    eta: "Estimasi 30-45 menit",
  },
  frozen_expedition: {
    label: "Ekspedisi Frozen (Luar Kota)",
    description: "Kemasan vakum + ice gel tahan hingga 3x24 jam perjalanan",
    fee: 20000,
    eta: "Estimasi 1-2 hari kerja",
  },
};

export function formatTanggalIndonesia(isoString: string): string {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}
