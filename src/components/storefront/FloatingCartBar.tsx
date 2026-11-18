"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { formatRupiah } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function FloatingCartBar() {
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const totalItems = useCartStore((state) => state.getTotalItems());
  const subtotal = useCartStore((state) => state.getSubtotal());

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || totalItems === 0) return null;

  return (
    <>
      {/* Floating Cart Bar di Bawah Layar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-3 sm:p-4 pointer-events-none">
        <div className="container max-w-2xl mx-auto pointer-events-auto">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-400/30 bg-espresso-950/95 p-3 sm:p-3.5 text-white shadow-2xl backdrop-blur-md">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-3 text-left group"
            >
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-terracotta-600 text-white shadow-inner group-hover:bg-terracotta-500 transition-colors">
                <ShoppingBag className="h-5 w-5" />
                <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-300 px-1 text-[11px] font-extrabold text-espresso-950">
                  {totalItems}
                </span>
              </div>
              <div>
                <p className="text-xs text-stone-300 flex items-center gap-1">
                  <span>{totalItems} item di keranjang</span>
                  <span className="underline text-amber-300 font-semibold ml-1">
                    Lihat Rincian
                  </span>
                </p>
                <p className="text-base sm:text-lg font-extrabold text-amber-300">
                  {formatRupiah(subtotal)}
                </p>
              </div>
            </button>

            <Link href="/checkout">
              <Button
                type="button"
                variant="warm"
                size="default"
                className="gap-2 rounded-xl px-4 sm:px-6 font-extrabold shadow-lg"
              >
                <span>Checkout</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Drawer / Modal Ringkasan Keranjang Cepat */}
      <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-terracotta-600" />
              Keranjang Dimsum Anda ({totalItems} Item)
            </DialogTitle>
            <DialogDescription>
              Periksa kembali varian isi dan catatan sebelum lanjut ke halaman
              pengiriman & pembayaran.
            </DialogDescription>
          </DialogHeader>

          <div className="divide-y divide-stone-200 max-h-[55vh] overflow-y-auto pr-1">
            {items.map((item) => (
              <div
                key={item.cartItemId}
                className="py-3.5 flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="h-14 w-14 rounded-xl object-cover border border-stone-200 shrink-0"
                  />
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-espresso-900">
                      {item.productName}
                    </h4>
                    <p className="text-xs font-semibold text-terracotta-700">
                      Varian: {item.variantName}
                    </p>
                    {item.itemNotes && (
                      <p className="text-xs italic text-muted-foreground">
                        Catatan: &ldquo;{item.itemNotes}&rdquo;
                      </p>
                    )}
                    <p className="text-xs font-bold text-espresso-900 pt-0.5">
                      {formatRupiah(item.unitPrice)} / porsi
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.cartItemId, item.quantity - 1)
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-300 bg-white hover:bg-stone-100"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center text-xs font-extrabold">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.cartItemId, item.quantity + 1)
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-300 bg-white hover:bg-stone-100"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.cartItemId)}
                      className="ml-1 flex h-7 w-7 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
                      title="Hapus item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="text-xs font-extrabold text-terracotta-700">
                    {formatRupiah(item.unitPrice * item.quantity)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-stone-200 pt-4 space-y-3">
            <div className="flex items-center justify-between text-base font-extrabold text-espresso-900">
              <span>Subtotal Pesanan</span>
              <span className="text-terracotta-700">
                {formatRupiah(subtotal)}
              </span>
            </div>

            <Link
              href="/checkout"
              onClick={() => setDrawerOpen(false)}
              className="block"
            >
              <Button variant="warm" size="lg" className="w-full gap-2 font-bold">
                <span>Lanjut ke Checkout & Pengiriman</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
