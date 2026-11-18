"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Flame,
  Loader2,
  MapPin,
  MessageCircle,
  PackageCheck,
  QrCode,
  ShoppingBag,
  Sparkles,
  Truck,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import { Order, OrderStatus } from "@/types/database";
import {
  DELIVERY_OPTIONS,
  formatRupiah,
  formatTanggalIndonesia,
} from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { getLocalOrderByNumber, saveLocalOrder } from "@/lib/demo-store";
import { Navbar } from "@/components/storefront/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface OrderTrackerClientProps {
  orderNumber: string;
  initialOrder: Order | null;
}

const ORDER_STEPS: {
  status: OrderStatus;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    status: "awaiting_payment",
    title: "Menunggu Pembayaran",
    subtitle: "Selesaikan pembayaran via QRIS / E-Wallet",
    icon: Clock,
  },
  {
    status: "preparing",
    title: "Sedang Dikukus",
    subtitle: "Dimsum sedang dikukus hangat & disiapkan dapur",
    icon: Flame,
  },
  {
    status: "delivering",
    title: "Dalam Pengiriman",
    subtitle: "Pesanan sedang dibawa kurir / siap diambil",
    icon: Truck,
  },
  {
    status: "completed",
    title: "Selesai",
    subtitle: "Pesanan telah diterima. Selamat menikmati!",
    icon: PackageCheck,
  },
];

export function OrderTrackerClient({
  orderNumber,
  initialOrder,
}: OrderTrackerClientProps) {
  const [order, setOrder] = useState<Order | null>(initialOrder);
  const [loading, setLoading] = useState<boolean>(!initialOrder);
  const [simulatingPayment, setSimulatingPayment] = useState(false);
  const [copiedOrderNo, setCopiedOrderNo] = useState(false);

  // Cari di Local Demo Store jika belum ada dari server (mode tanpa env Supabase)
  useEffect(() => {
    if (!order) {
      const localMatch = getLocalOrderByNumber(orderNumber);
      if (localMatch) {
        setOrder(localMatch);
      }
      setLoading(false);
    } else {
      saveLocalOrder(order);
      setLoading(false);
    }
  }, [order, orderNumber]);

  // Langganan Supabase Realtime untuk update status pesanan secara langsung
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`order-track-${orderNumber}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `order_number=eq.${orderNumber}`,
        },
        (payload) => {
          const updated = payload.new as Partial<Order>;
          setOrder((prev) => {
            if (!prev) return prev;
            const merged = { ...prev, ...updated };
            saveLocalOrder(merged);
            return merged;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderNumber]);

  const handleSimulateQrisPayment = async () => {
    if (!order) return;
    setSimulatingPayment(true);

    try {
      const res = await fetch(
        `/api/orders/${encodeURIComponent(order.order_number)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payment_status: "paid",
            order_status: "preparing",
          }),
        }
      );

      const data = (await res.json()) as { order?: Order };
      const updatedOrder: Order = data.order ?? {
        ...order,
        payment_status: "paid",
        order_status: "preparing",
      };

      setOrder(updatedOrder);
      saveLocalOrder(updatedOrder);
    } finally {
      setSimulatingPayment(false);
    }
  };

  const handleCopyOrderNo = () => {
    if (!order) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(order.order_number);
    }
    setCopiedOrderNo(true);
    setTimeout(() => setCopiedOrderNo(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-terracotta-600" />
          <p className="text-sm text-muted-foreground">
            Memuat rincian pesanan {orderNumber}...
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-16">
          <Card className="max-w-md mx-auto text-center p-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 mb-3">
              <XCircle className="h-8 w-8" />
            </div>
            <h1 className="text-xl font-extrabold text-espresso-900">
              Pesanan Tidak Ditemukan
            </h1>
            <p className="text-sm text-muted-foreground mt-1 mb-6">
              Nomor pesanan{" "}
              <code className="font-mono font-bold text-espresso-900">
                {orderNumber}
              </code>{" "}
              tidak ditemukan. Pastikan kode yang dimasukkan sudah benar.
            </p>
            <Link href="/">
              <Button variant="warm" className="w-full gap-2">
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Beranda
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const currentStepIndex = ORDER_STEPS.findIndex(
    (s) => s.status === order.order_status
  );
  const isCancelled = order.order_status === "cancelled";

  const whatsappMessage = encodeURIComponent(
    `Halo Admin Dimsum Hangat Nusantara! Saya ingin konfirmasi pesanan saya:\nNo. Order: *${order.order_number}*\nNama: ${order.customer_name}\nTotal: ${formatRupiah(order.total_amount)}`
  );

  return (
    <div className="min-h-screen bg-background pb-16">
      <Navbar />

      <div className="container py-6 sm:py-8 max-w-4xl">
        {/* Header Nomor Order */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-terracotta-700 hover:underline mb-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Pesan Lagi di Katalog
            </Link>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold font-mono text-espresso-900">
                {order.order_number}
              </h1>
              <button
                type="button"
                onClick={handleCopyOrderNo}
                className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-xs font-semibold text-espresso-800 hover:bg-stone-100"
              >
                {copiedOrderNo ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Disalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Salin Kode</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Dibuat pada {formatTanggalIndonesia(order.created_at)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={
                order.payment_status === "paid"
                  ? "success"
                  : order.payment_status === "failed"
                  ? "destructive"
                  : "warning"
              }
              className="px-3 py-1 text-xs font-bold"
            >
              {order.payment_status === "paid"
                ? "✓ LUNAS (PAID)"
                : order.payment_status === "failed"
                ? "PEMBAYARAN GAGAL"
                : "MENUNGGU PEMBAYARAN"}
            </Badge>
          </div>
        </div>

        {/* Visual Stepper Status Pesanan */}
        <Card className="mb-6 overflow-hidden border-stone-200">
          <div className="bg-gradient-to-r from-espresso-950 via-espresso-900 to-terracotta-900 px-5 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span className="text-sm font-bold">
                Status Pelacakan Pesanan Real-time
              </span>
            </div>
            <span className="text-xs text-amber-200 font-medium">
              Live Sync Aktif
            </span>
          </div>

          <CardContent className="pt-6 pb-6">
            {isCancelled ? (
              <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
                <XCircle className="h-7 w-7 text-red-600 shrink-0" />
                <div>
                  <h3 className="font-bold text-base">Pesanan Dibatalkan</h3>
                  <p className="text-xs mt-0.5">
                    Pesanan ini telah dibatalkan. Silakan hubungi WhatsApp Admin
                    jika Anda memerlukan bantuan lebih lanjut.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
                {ORDER_STEPS.map((step, index) => {
                  const Icon = step.icon;
                  const isCompleted = index < currentStepIndex;
                  const isCurrent = index === currentStepIndex;

                  return (
                    <div
                      key={step.status}
                      className={`relative flex sm:flex-col items-start sm:items-center sm:text-center gap-3.5 rounded-2xl border p-3.5 transition-all ${
                        isCurrent
                          ? "border-terracotta-500 bg-terracotta-50/70 ring-2 ring-terracotta-500/20"
                          : isCompleted
                          ? "border-emerald-200 bg-emerald-50/40"
                          : "border-stone-200 bg-stone-50/60 opacity-60"
                      }`}
                    >
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-2xl shrink-0 ${
                          isCurrent
                            ? "bg-terracotta-600 text-white shadow-md animate-pulse-warm"
                            : isCompleted
                            ? "bg-emerald-600 text-white"
                            : "bg-stone-200 text-stone-600"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                          Tahap {index + 1}
                        </span>
                        <h3 className="text-sm font-extrabold text-espresso-900">
                          {step.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                          {step.subtitle}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Kolom Kiri: QRIS Payment Box (jika belum dibayar) atau Info Status */}
          <div className="md:col-span-5 space-y-6">
            {order.payment_status === "pending" && !isCancelled ? (
              <Card className="border-2 border-terracotta-500 shadow-lg overflow-hidden">
                <div className="bg-terracotta-600 px-5 py-3 text-white flex items-center justify-between">
                  <span className="text-sm font-extrabold flex items-center gap-1.5">
                    <QrCode className="h-4 w-4" />
                    Pembayaran QRIS Instan
                  </span>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
                    Midtrans Snap Ready
                  </span>
                </div>

                <CardContent className="pt-5 space-y-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Total Tagihan Pembayaran
                    </p>
                    <p className="text-2xl font-extrabold text-terracotta-700 mt-0.5">
                      {formatRupiah(order.total_amount)}
                    </p>
                  </div>

                  {/* Mockup Kode QRIS Standar Nasional */}
                  <div className="mx-auto w-52 rounded-2xl border-2 border-dashed border-stone-300 bg-white p-4 shadow-inner">
                    <div className="flex items-center justify-between text-[10px] font-extrabold text-espresso-900 mb-2 border-b pb-1">
                      <span>QRIS</span>
                      <span className="text-terracotta-600">
                        DIMSUM HANGAT NUSANTARA
                      </span>
                    </div>
                    <div className="aspect-square w-full rounded-xl bg-stone-900 p-3 flex flex-col items-center justify-center text-white relative overflow-hidden">
                      <QrCode className="h-28 w-28 text-white" />
                      <span className="mt-1 font-mono text-[9px] text-amber-300">
                        NMID: ID102600882199
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Scan dengan GoPay, OVO, Dana, ShopeePay, atau Mobile
                      Banking
                    </p>
                  </div>

                  <div className="space-y-2 pt-1">
                    <Button
                      type="button"
                      variant="warm"
                      size="lg"
                      onClick={handleSimulateQrisPayment}
                      disabled={simulatingPayment}
                      className="w-full font-extrabold shadow-md gap-2"
                    >
                      {simulatingPayment ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Memverifikasi Pembayaran...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Simulasikan Bayar Lunas (QRIS)
                        </>
                      )}
                    </Button>
                    <p className="text-[11px] text-muted-foreground">
                      Klik tombol di atas untuk mensimulasikan webhook callback
                      pembayaran berhasil dan meneruskan pesanan ke dapur.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-emerald-200 bg-emerald-50/50">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shrink-0">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-espresso-900">
                        Pembayaran Telah Diterima!
                      </h3>
                      <p className="text-xs text-emerald-800">
                        Dapur kami sedang memproses pesanan Anda sesuai antrean.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Detail Pengiriman & Kontak */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-terracotta-600" />
                  Informasi Pengiriman
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span className="text-muted-foreground">Nama Penerima</span>
                  <span className="font-bold text-espresso-900">
                    {order.customer_name}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span className="text-muted-foreground">No. WhatsApp</span>
                  <span className="font-bold text-espresso-900">
                    {order.customer_phone}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span className="text-muted-foreground">Metode Kirim</span>
                  <span className="font-bold text-terracotta-700">
                    {DELIVERY_OPTIONS[order.delivery_type]?.label ??
                      order.delivery_type}
                  </span>
                </div>
                {order.delivery_address && (
                  <div className="pt-1">
                    <span className="block text-muted-foreground mb-1">
                      Alamat Tujuan:
                    </span>
                    <p className="rounded-xl bg-cream-50 p-3 font-medium text-espresso-900 border border-stone-200/80">
                      {order.delivery_address}
                    </p>
                  </div>
                )}
                {order.notes && (
                  <div className="pt-1">
                    <span className="block text-muted-foreground mb-1">
                      Catatan Pesanan:
                    </span>
                    <p className="italic text-espresso-800">
                      &ldquo;{order.notes}&rdquo;
                    </p>
                  </div>
                )}

                <div className="pt-3">
                  <a
                    href={`https://wa.me/6281234567890?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Hubungi Admin via WhatsApp
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Kolom Kanan: Rincian Menu & Total Harga */}
          <div className="md:col-span-7">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-terracotta-600" />
                  Rincian Menu Dipesan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="divide-y divide-stone-200">
                  {(order.order_items ?? []).map((item) => (
                    <div
                      key={item.id}
                      className="py-3 first:pt-0 flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        {item.products?.image_url && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={item.products.image_url}
                            alt={item.products.name}
                            className="h-14 w-14 rounded-xl object-cover border border-stone-200 shrink-0"
                          />
                        )}
                        <div>
                          <h4 className="text-sm font-bold text-espresso-900">
                            {item.products?.name ?? "Menu Dimsum"}
                          </h4>
                          {item.product_variants?.variant_name && (
                            <p className="text-xs font-semibold text-terracotta-700">
                              Varian: {item.product_variants.variant_name}
                            </p>
                          )}
                          {item.item_notes && (
                            <p className="text-xs italic text-muted-foreground">
                              Catatan: &ldquo;{item.item_notes}&rdquo;
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.quantity} x {formatRupiah(item.unit_price)}
                          </p>
                        </div>
                      </div>

                      <span className="text-sm font-extrabold text-espresso-900">
                        {formatRupiah(item.quantity * item.unit_price)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-stone-200 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-semibold text-espresso-900">
                      {formatRupiah(order.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Biaya Pengiriman</span>
                    <span className="font-semibold text-espresso-900">
                      {order.delivery_fee === 0
                        ? "GRATIS"
                        : formatRupiah(order.delivery_fee)}
                    </span>
                  </div>
                  {order.discount_amount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Potongan Diskon Voucher</span>
                      <span>- {formatRupiah(order.discount_amount)}</span>
                    </div>
                  )}
                  <div className="border-t border-stone-200 pt-2.5 flex justify-between text-base font-extrabold text-espresso-900">
                    <span>Total Pembayaran</span>
                    <span className="text-lg text-terracotta-700">
                      {formatRupiah(order.total_amount)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
