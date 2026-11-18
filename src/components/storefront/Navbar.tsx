"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Flame,
  ShoppingBag,
  Search,
  ShieldCheck,
  TicketPercent,
  PackageSearch,
} from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function Navbar() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const [orderCodeInput, setOrderCodeInput] = useState("");
  const totalItems = useCartStore((state) => state.getTotalItems());

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = orderCodeInput.trim().toUpperCase();
    if (!cleaned) return;
    setTrackOpen(false);
    router.push(`/order/${encodeURIComponent(cleaned)}`);
  };

  return (
    <>
      {/* Promo Bar Atas */}
      <div className="bg-espresso-900 text-cream-100 text-xs py-2 px-4">
        <div className="container flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 truncate">
            <TicketPercent className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="truncate">
              Pakai kode{" "}
              <strong className="text-amber-300 font-bold">DIMSUMHEMAT</strong>{" "}
              diskon Rp 10.000 (Min. Rp 50.000)
            </span>
          </div>
          <Link
            href="/admin"
            className="hidden sm:inline-flex items-center gap-1 text-stone-300 hover:text-amber-300 transition-colors shrink-0"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Portal Admin</span>
          </Link>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-40 w-full border-b border-stone-200/80 bg-background/95 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-terracotta-600 to-amber-600 text-white shadow-sm group-hover:scale-105 transition-transform">
              <Flame className="h-5 w-5 fill-amber-200 text-white" />
            </div>
            <div>
              <span className="block text-base font-extrabold tracking-tight text-espresso-900 leading-none">
                Dimsum Hangat
              </span>
              <span className="block text-[11px] font-medium text-terracotta-700 mt-0.5">
                Artisan Steamed & Mentai Bar
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTrackOpen(true)}
              className="gap-1.5 border-stone-300 bg-white text-espresso-900"
            >
              <PackageSearch className="h-4 w-4 text-terracotta-600" />
              <span className="hidden xs:inline">Lacak Pesanan</span>
              <span className="xs:hidden">Lacak</span>
            </Button>

            <Link href="/checkout">
              <Button
                type="button"
                variant="default"
                size="sm"
                className="relative gap-1.5"
              >
                <ShoppingBag className="h-4 w-4" />
                <span className="hidden sm:inline">Keranjang</span>
                {mounted && totalItems > 0 && (
                  <span className="ml-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-300 px-1.5 text-[11px] font-extrabold text-espresso-950">
                    {totalItems}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Modal Lacak Pesanan */}
      <Dialog open={trackOpen} onOpenChange={setTrackOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackageSearch className="h-5 w-5 text-terracotta-600" />
              Lacak Status Pesanan
            </DialogTitle>
            <DialogDescription>
              Masukkan nomor pesanan Anda (contoh:{" "}
              <code className="font-mono font-bold text-terracotta-700">
                DMS-20261118-8821
              </code>
              ) untuk memantau status kukusan & pengiriman.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleTrackSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Input
                placeholder="Contoh: DMS-20261118-8821"
                value={orderCodeInput}
                onChange={(e) => setOrderCodeInput(e.target.value)}
                className="uppercase font-mono"
                required
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Coba klik nomor pesanan contoh:</span>
                <button
                  type="button"
                  onClick={() => setOrderCodeInput("DMS-20261118-8821")}
                  className="font-mono font-semibold text-terracotta-600 hover:underline"
                >
                  DMS-20261118-8821
                </button>
              </div>
            </div>

            <Button type="submit" variant="warm" className="w-full gap-2">
              <Search className="h-4 w-4" />
              Cek Pesanan Sekarang
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
