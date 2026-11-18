"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bike,
  CheckCircle2,
  Loader2,
  MapPin,
  Minus,
  Package,
  Phone,
  Plus,
  ShoppingBag,
  Store,
  TicketPercent,
  Trash2,
  User,
  XCircle,
  ShieldCheck,
} from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { DeliveryType, Order, Voucher } from "@/types/database";
import { DELIVERY_OPTIONS, formatRupiah } from "@/lib/utils";
import { saveLocalOrder } from "@/lib/demo-store";
import { Navbar } from "@/components/storefront/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const items = useCartStore((state) => state.items);
  const deliveryType = useCartStore((state) => state.deliveryType);
  const appliedVoucher = useCartStore((state) => state.appliedVoucher);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const setDeliveryType = useCartStore((state) => state.setDeliveryType);
  const setAppliedVoucher = useCartStore((state) => state.setAppliedVoucher);
  const clearCart = useCartStore((state) => state.clearCart);
  const getSubtotal = useCartStore((state) => state.getSubtotal);
  const getDiscountAmount = useCartStore((state) => state.getDiscountAmount);
  const getDeliveryFee = useCartStore((state) => state.getDeliveryFee);
  const getTotalAmount = useCartStore((state) => state.getTotalAmount);

  // Guest Checkout Form State
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [orderNotes, setOrderNotes] = useState("");

  // Voucher State
  const [voucherInput, setVoucherInput] = useState("");
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherMessage, setVoucherMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Submit State
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (appliedVoucher) {
      setVoucherInput(appliedVoucher.code);
    }
  }, [appliedVoucher]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-terracotta-600" />
        </div>
      </div>
    );
  }

  const subtotal = getSubtotal();
  const discountAmount = getDiscountAmount();
  const deliveryFee = getDeliveryFee();
  const totalAmount = getTotalAmount();

  const handleApplyVoucher = async (codeOverride?: string) => {
    const codeToTest = (codeOverride ?? voucherInput).trim().toUpperCase();
    if (!codeToTest) return;

    setVoucherLoading(true);
    setVoucherMessage(null);

    try {
      const res = await fetch("/api/vouchers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: codeToTest,
          subtotal,
        }),
      });

      const data = (await res.json()) as {
        valid: boolean;
        voucher?: Voucher;
        message: string;
      };

      if (!res.ok || !data.valid || !data.voucher) {
        setAppliedVoucher(null);
        setVoucherMessage({
          type: "error",
          text: data.message || "Kode voucher tidak valid.",
        });
      } else {
        setVoucherInput(data.voucher.code);
        setAppliedVoucher(data.voucher);
        setVoucherMessage({
          type: "success",
          text: data.message,
        });
      }
    } catch {
      setVoucherMessage({
        type: "error",
        text: "Gagal memverifikasi voucher. Coba lagi.",
      });
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherInput("");
    setVoucherMessage(null);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (items.length === 0) {
      setFormError("Keranjang belanja Anda masih kosong.");
      return;
    }

    if (customerName.trim().length < 2) {
      setFormError("Mohon isi Nama Lengkap penerima pesanan.");
      return;
    }

    if (customerPhone.trim().length < 8) {
      setFormError("Mohon isi Nomor WhatsApp aktif yang valid.");
      return;
    }

    if (deliveryType !== "pickup" && deliveryAddress.trim().length < 8) {
      setFormError("Mohon isi alamat lengkap pengiriman beserta patokan.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          deliveryType,
          deliveryAddress:
            deliveryType === "pickup" ? undefined : deliveryAddress,
          notes: orderNotes,
          voucherCode: appliedVoucher ? appliedVoucher.code : null,
          items: items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            productImage: item.productImage,
            category: item.category,
            variantId: item.variantId,
            variantName: item.variantName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            itemNotes: item.itemNotes,
          })),
        }),
      });

      const result = (await response.json()) as {
        success?: boolean;
        order_number?: string;
        order?: Order;
        error?: string;
      };

      if (!response.ok || !result.order_number) {
        setFormError(
          result.error || "Gagal membuat pesanan. Silakan periksa data Anda."
        );
        setSubmitting(false);
        return;
      }

      if (result.order) {
        saveLocalOrder(result.order);
      }

      clearCart();
      router.push(`/order/${encodeURIComponent(result.order_number)}`);
    } catch {
      setFormError("Terjadi gangguan jaringan saat membuat pesanan.");
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="container flex-1 flex items-center justify-center py-16">
          <Card className="max-w-md w-full text-center p-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-terracotta-50 text-terracotta-600 mb-4">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h1 className="text-xl font-extrabold text-espresso-900">
              Keranjang Belanja Kosong
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5 mb-6">
              Yuk pilih dimsum kukus hangat, mentai torch, atau frozen pack
              favoritmu terlebih dahulu!
            </p>
            <Link href="/">
              <Button variant="warm" size="lg" className="w-full gap-2">
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Katalog Menu
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <Navbar />

      <div className="container py-6 sm:py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-terracotta-700 hover:underline mb-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Tambah Menu Lainnya
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-espresso-900">
              Checkout Pesanan
            </h1>
          </div>
          <Badge variant="warning" className="hidden sm:inline-flex gap-1 py-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            Guest Checkout (Tanpa Login)
          </Badge>
        </div>

        <form
          onSubmit={handleCheckoutSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        >
          {/* Kolom Kiri: Form Pelanggan, Pengiriman, & Daftar Item */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Data Pemesan (Guest Checkout) */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <User className="h-5 w-5 text-terracotta-600" />
                  1. Informasi Pemesan (Guest Checkout)
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="customerName"
                    placeholder="Contoh: Rina Wulandari"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerPhone">
                    Nomor WhatsApp Aktif <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="customerPhone"
                      type="tel"
                      placeholder="081234567890"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. Metode Pengiriman */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Bike className="h-5 w-5 text-terracotta-600" />
                  2. Pilih Metode Pengiriman
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  {(
                    [
                      {
                        key: "pickup" as DeliveryType,
                        icon: Store,
                      },
                      {
                        key: "instant_courier" as DeliveryType,
                        icon: Bike,
                      },
                      {
                        key: "frozen_expedition" as DeliveryType,
                        icon: Package,
                      },
                    ] as const
                  ).map(({ key, icon: Icon }) => {
                    const option = DELIVERY_OPTIONS[key];
                    const isSelected = deliveryType === key;

                    return (
                      <label
                        key={key}
                        onClick={() => setDeliveryType(key)}
                        className={`flex cursor-pointer items-start justify-between gap-3 rounded-2xl border p-4 transition-all ${
                          isSelected
                            ? "border-terracotta-600 bg-terracotta-50/70 ring-1 ring-terracotta-600"
                            : "border-stone-200 bg-white hover:border-stone-300"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${
                              isSelected
                                ? "bg-terracotta-600 text-white"
                                : "bg-stone-100 text-stone-700"
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-espresso-900">
                                {option.label}
                              </span>
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                                {option.eta}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {option.description}
                            </p>
                          </div>
                        </div>

                        <span className="text-sm font-extrabold text-terracotta-700 shrink-0">
                          {option.fee === 0
                            ? "GRATIS"
                            : formatRupiah(option.fee)}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {/* Alamat Lengkap jika bukan Ambil Sendiri */}
                {deliveryType !== "pickup" ? (
                  <div className="space-y-2 pt-2">
                    <Label
                      htmlFor="deliveryAddress"
                      className="flex items-center gap-1.5"
                    >
                      <MapPin className="h-4 w-4 text-terracotta-600" />
                      Alamat Lengkap Pengiriman{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="deliveryAddress"
                      placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan, dan patokan lokasi..."
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      required
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-900">
                    <p className="font-bold">
                      📍 Lokasi Outlet Dimsum Hangat Nusantara:
                    </p>
                    <p className="mt-0.5">
                      Jl. Kuliner Nusantara No. 88, Kebayoran Baru, Jakarta
                      Selatan (Buka 09:00 - 21:30 WIB).
                    </p>
                  </div>
                )}

                <div className="space-y-2 pt-1">
                  <Label htmlFor="orderNotes">
                    Catatan Tambahan Pesanan (Opsional)
                  </Label>
                  <Input
                    id="orderNotes"
                    placeholder="Contoh: Sumpit 3 pasang, titip di satpam jika hujan"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 3. Rincian Item Keranjang */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-terracotta-600" />
                    3. Daftar Menu Dipesan ({items.length} Menu)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-stone-200">
                {items.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="h-16 w-16 rounded-xl object-cover border border-stone-200 shrink-0"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-espresso-900">
                          {item.productName}
                        </h4>
                        <p className="text-xs font-semibold text-terracotta-700">
                          Varian: {item.variantName}
                        </p>
                        {item.itemNotes && (
                          <p className="text-xs italic text-muted-foreground mt-0.5">
                            Catatan: &ldquo;{item.itemNotes}&rdquo;
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatRupiah(item.unitPrice)} x {item.quantity}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className="text-sm font-extrabold text-espresso-900">
                        {formatRupiah(item.unitPrice * item.quantity)}
                      </span>
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
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Kolom Kanan: Kode Voucher & Ringkasan Pembayaran */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            {/* Kartu Voucher Promo */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TicketPercent className="h-5 w-5 text-terracotta-600" />
                  Kode Voucher Promo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Masukkan kode voucher..."
                    value={voucherInput}
                    onChange={(e) =>
                      setVoucherInput(e.target.value.toUpperCase())
                    }
                    className="uppercase font-mono"
                  />
                  {appliedVoucher ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRemoveVoucher}
                      className="shrink-0 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Hapus
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handleApplyVoucher()}
                      disabled={voucherLoading || !voucherInput.trim()}
                      className="shrink-0 font-bold"
                    >
                      {voucherLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Pakai"
                      )}
                    </Button>
                  )}
                </div>

                {/* Tombol Cepat Pilih Voucher */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground">Klik cepat:</span>
                  {["DIMSUMHEMAT", "MENTAILOVER", "UMKMBANGKIT"].map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => {
                        setVoucherInput(code);
                        handleApplyVoucher(code);
                      }}
                      className="rounded-lg border border-amber-300 bg-amber-50 px-2 py-0.5 font-mono text-[11px] font-bold text-terracotta-700 hover:bg-amber-100"
                    >
                      {code}
                    </button>
                  ))}
                </div>

                {voucherMessage && (
                  <div
                    className={`flex items-start gap-2 rounded-xl p-3 text-xs font-medium ${
                      voucherMessage.type === "success"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {voucherMessage.type === "success" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <span>{voucherMessage.text}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ringkasan Tagihan */}
            <Card className="border-terracotta-200 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">
                  Ringkasan Pembayaran
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal Menu</span>
                    <span className="font-semibold text-espresso-900">
                      {formatRupiah(subtotal)}
                    </span>
                  </div>

                  <div className="flex justify-between text-muted-foreground">
                    <span>
                      Ongkos Kirim ({DELIVERY_OPTIONS[deliveryType].label})
                    </span>
                    <span className="font-semibold text-espresso-900">
                      {deliveryFee === 0 ? "GRATIS" : formatRupiah(deliveryFee)}
                    </span>
                  </div>

                  {discountAmount > 0 && appliedVoucher && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Diskon Voucher ({appliedVoucher.code})</span>
                      <span>- {formatRupiah(discountAmount)}</span>
                    </div>
                  )}

                  <div className="border-t border-stone-200 pt-3 flex items-center justify-between">
                    <span className="text-base font-extrabold text-espresso-900">
                      Total Pembayaran
                    </span>
                    <span className="text-xl font-extrabold text-terracotta-700">
                      {formatRupiah(totalAmount)}
                    </span>
                  </div>
                </div>

                {formError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                    {formError}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="warm"
                  size="lg"
                  disabled={submitting}
                  className="w-full font-extrabold text-base shadow-lg"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Memproses Pesanan...
                    </span>
                  ) : (
                    <span>Buat Pesanan & Bayar ({formatRupiah(totalAmount)})</span>
                  )}
                </Button>

                <p className="text-[11px] text-center text-muted-foreground">
                  Dengan menekan tombol di atas, pesanan Anda akan tercatat dan
                  diarahkan ke halaman pembayaran QRIS & pelacakan pesanan.
                </p>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}
