"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  BellRing,
  CheckCircle2,
  ChefHat,
  ClipboardList,
  Edit3,
  ExternalLink,
  Flame,
  LogOut,
  Package,
  Plus,
  Printer,
  Trash2,
  TrendingUp,
  Truck,
  UtensilsCrossed,
  XCircle,
} from "lucide-react";
import {
  Order,
  OrderStatus,
  PRODUCT_CATEGORIES,
  ProductCategory,
  ProductVariant,
  ProductWithVariants,
} from "@/types/database";
import {
  DELIVERY_OPTIONS,
  formatRupiah,
  formatTanggalIndonesia,
} from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  ADMIN_SESSION_STORAGE_KEY,
  getLocalOrders,
  getLocalProducts,
  saveLocalOrder,
  saveLocalProducts,
} from "@/lib/demo-store";
import { ThermalReceipt } from "./ThermalReceipt";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AdminDashboardClientProps {
  initialOrders: Order[];
  initialProducts: ProductWithVariants[];
  serverAuthenticated: boolean;
}

type AdminTab = "orders" | "products" | "analytics";

export function AdminDashboardClient({
  initialOrders,
  initialProducts,
  serverAuthenticated,
}: AdminDashboardClientProps) {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("orders");

  // State Data OMS & Menu
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [products, setProducts] =
    useState<ProductWithVariants[]>(initialProducts);
  const [statusFilter, setStatusFilter] = useState<"ALL" | OrderStatus>("ALL");
  const [realtimeAlert, setRealtimeAlert] = useState<string | null>(null);

  // State Print Struk 58mm
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);

  // State Modal Tambah / Edit Menu
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<ProductWithVariants | null>(null);
  const [menuName, setMenuName] = useState("");
  const [menuCategory, setMenuCategory] =
    useState<ProductCategory>("Dimsum Kukus");
  const [menuBasePrice, setMenuBasePrice] = useState<number>(16000);
  const [menuStockQty, setMenuStockQty] = useState<number>(30);
  const [menuImageUrl, setMenuImageUrl] = useState("");
  const [menuDescription, setMenuDescription] = useState("");
  const [menuVariants, setMenuVariants] = useState<
    { id?: string; variant_name: string; additional_price: number }[]
  >([
    { variant_name: "Isi 4 Pcs (Reguler)", additional_price: 0 },
    { variant_name: "Isi 8 Pcs (Double)", additional_price: 14000 },
  ]);

  // Proteksi Autentikasi Admin
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      if (supabase) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          setAuthChecked(true);
          return;
        }
      }

      const localSession =
        typeof window !== "undefined" &&
        window.localStorage.getItem(ADMIN_SESSION_STORAGE_KEY) === "true";

      if (serverAuthenticated || localSession) {
        setAuthChecked(true);
      } else {
        router.replace("/admin/login");
      }
    };

    checkAuth();
  }, [router, serverAuthenticated]);

  // Sinkronisasi awal dengan Local Demo Store & Supabase Realtime
  useEffect(() => {
    const supabase = createClient();
    const localOrders = getLocalOrders();
    const localProds = getLocalProducts();

    if (initialOrders.length === 0 && localOrders.length > 0) {
      setOrders(localOrders);
    } else if (initialOrders.length > 0) {
      // Gabungkan pesanan lokal baru dengan initialOrders
      const mergedMap = new Map<string, Order>();
      [...localOrders, ...initialOrders].forEach((o) =>
        mergedMap.set(o.order_number, o)
      );
      setOrders(
        Array.from(mergedMap.values()).sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      );
    }

    if (!supabase && localProds.length > 0) {
      setProducts(localProds);
    }

    if (!supabase) return;

    const channel = supabase
      .channel("admin-orders-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        async (payload) => {
          const newOrderBasic = payload.new as Order;
          setRealtimeAlert(
            `🔔 Pesanan Baru Masuk: ${newOrderBasic.order_number} dari ${newOrderBasic.customer_name}!`
          );

          const { data: enriched } = await supabase
            .from("orders")
            .select(
              "*, order_items(*, products(name, image_url, category), product_variants(variant_name))"
            )
            .eq("id", newOrderBasic.id)
            .maybeSingle();

          const orderToAdd = (enriched ?? newOrderBasic) as Order;
          setOrders((prev) => [
            orderToAdd,
            ...prev.filter((o) => o.id !== orderToAdd.id),
          ]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          const updated = payload.new as Order;
          setOrders((prev) =>
            prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialOrders]);

  const handleLogout = async () => {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    }
    router.replace("/admin/login");
  };

  // Handler Ubah Status Pesanan Cepat (OMS)
  const handleQuickOrderStatus = async (
    order: Order,
    nextOrderStatus: OrderStatus,
    markPaid?: boolean
  ) => {
    const nextPaymentStatus = markPaid ? "paid" : order.payment_status;

    const optimisticOrder: Order = {
      ...order,
      order_status: nextOrderStatus,
      payment_status: nextPaymentStatus,
    };

    setOrders((prev) =>
      prev.map((o) =>
        o.order_number === order.order_number ? optimisticOrder : o
      )
    );
    saveLocalOrder(optimisticOrder);

    await fetch(`/api/orders/${encodeURIComponent(order.order_number)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_status: nextOrderStatus,
        payment_status: nextPaymentStatus,
      }),
    });
  };

  // Handler Cetak Struk Thermal 58mm
  const handlePrintReceipt = (order: Order) => {
    setReceiptOrder(order);
    setReceiptDialogOpen(true);
  };

  const triggerBrowserPrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  // Handler Quick Toggle Switch Ketersediaan Produk
  const handleToggleProductAvailability = async (
    product: ProductWithVariants,
    checked: boolean
  ) => {
    const updatedProducts = products.map((p) =>
      p.id === product.id
        ? {
            ...p,
            is_available: checked,
            stock_qty: checked && p.stock_qty === 0 ? 25 : p.stock_qty,
          }
        : p
    );
    setProducts(updatedProducts);
    saveLocalProducts(updatedProducts);

    const supabase = createClient();
    if (supabase) {
      await supabase
        .from("products")
        .update({
          is_available: checked,
          stock_qty:
            checked && product.stock_qty === 0 ? 25 : product.stock_qty,
        })
        .eq("id", product.id);
    }
  };

  // Handler Buka Modal Tambah / Edit Menu
  const openCreateMenuModal = () => {
    setEditingProduct(null);
    setMenuName("");
    setMenuCategory("Dimsum Kukus");
    setMenuBasePrice(16000);
    setMenuStockQty(35);
    setMenuImageUrl(
      "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=800&q=80"
    );
    setMenuDescription("");
    setMenuVariants([
      { variant_name: "Isi 4 Pcs (Reguler)", additional_price: 0 },
      { variant_name: "Isi 8 Pcs (Double)", additional_price: 14000 },
    ]);
    setMenuModalOpen(true);
  };

  const openEditMenuModal = (product: ProductWithVariants) => {
    setEditingProduct(product);
    setMenuName(product.name);
    setMenuCategory(product.category);
    setMenuBasePrice(product.base_price);
    setMenuStockQty(product.stock_qty);
    setMenuImageUrl(product.image_url);
    setMenuDescription(product.description);
    setMenuVariants(
      product.product_variants.length > 0
        ? product.product_variants.map((v) => ({
            id: v.id,
            variant_name: v.variant_name,
            additional_price: v.additional_price,
          }))
        : [{ variant_name: "Reguler", additional_price: 0 }]
    );
    setMenuModalOpen(true);
  };

  const handleSaveMenuForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = menuName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const productId = editingProduct ? editingProduct.id : crypto.randomUUID();
    const cleanedVariants: ProductVariant[] = menuVariants
      .filter((v) => v.variant_name.trim() !== "")
      .map((v) => ({
        id: v.id ?? crypto.randomUUID(),
        product_id: productId,
        variant_name: v.variant_name.trim(),
        additional_price: Number(v.additional_price) || 0,
      }));

    const savedProduct: ProductWithVariants = {
      id: productId,
      name: menuName.trim(),
      slug: editingProduct ? editingProduct.slug : `${slug}-${Date.now()}`,
      description:
        menuDescription.trim() ||
        "Dimsum kukus segar dibuat setiap hari dengan bahan pilihan.",
      category: menuCategory,
      base_price: Number(menuBasePrice) || 15000,
      image_url:
        menuImageUrl.trim() ||
        "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=800&q=80",
      is_available: Number(menuStockQty) > 0,
      stock_qty: Number(menuStockQty) || 0,
      created_at: editingProduct
        ? editingProduct.created_at
        : new Date().toISOString(),
      product_variants: cleanedVariants,
    };

    const nextList = editingProduct
      ? products.map((p) => (p.id === editingProduct.id ? savedProduct : p))
      : [savedProduct, ...products];

    setProducts(nextList);
    saveLocalProducts(nextList);

    const supabase = createClient();
    if (supabase) {
      if (editingProduct) {
        await supabase
          .from("products")
          .update({
            name: savedProduct.name,
            description: savedProduct.description,
            category: savedProduct.category,
            base_price: savedProduct.base_price,
            image_url: savedProduct.image_url,
            stock_qty: savedProduct.stock_qty,
            is_available: savedProduct.is_available,
          })
          .eq("id", editingProduct.id);

        await supabase
          .from("product_variants")
          .delete()
          .eq("product_id", editingProduct.id);

        if (cleanedVariants.length > 0) {
          await supabase.from("product_variants").insert(
            cleanedVariants.map((v) => ({
              product_id: editingProduct.id,
              variant_name: v.variant_name,
              additional_price: v.additional_price,
            }))
          );
        }
      } else {
        const { data: inserted } = await supabase
          .from("products")
          .insert({
            name: savedProduct.name,
            slug: savedProduct.slug,
            description: savedProduct.description,
            category: savedProduct.category,
            base_price: savedProduct.base_price,
            image_url: savedProduct.image_url,
            stock_qty: savedProduct.stock_qty,
            is_available: savedProduct.is_available,
          })
          .select("*")
          .single();

        if (inserted && cleanedVariants.length > 0) {
          await supabase.from("product_variants").insert(
            cleanedVariants.map((v) => ({
              product_id: inserted.id,
              variant_name: v.variant_name,
              additional_price: v.additional_price,
            }))
          );
        }
      }
    }

    setMenuModalOpen(false);
  };

  // Filter daftar pesanan di Tab OMS
  const filteredOrders = useMemo(() => {
    if (statusFilter === "ALL") return orders;
    return orders.filter((o) => o.order_status === statusFilter);
  }, [orders, statusFilter]);

  // Kalkulasi Statistik Ringkasan Omzet
  const analytics = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);

    const paidOrders = orders.filter(
      (o) =>
        o.payment_status === "paid" ||
        o.order_status === "preparing" ||
        o.order_status === "delivering" ||
        o.order_status === "completed"
    );

    const todayRevenue = paidOrders
      .filter((o) => o.created_at.slice(0, 10) === todayStr)
      .reduce((sum, o) => sum + o.total_amount, 0);

    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total_amount, 0);

    const completedCount = orders.filter(
      (o) => o.order_status === "completed"
    ).length;

    // Hitung Menu Terlaris
    const salesMap = new Map<
      string,
      { name: string; qty: number; revenue: number }
    >();

    paidOrders.forEach((o) => {
      (o.order_items ?? []).forEach((item) => {
        const prodName = item.products?.name ?? "Siomay Ayam Udang Spesial";
        const current = salesMap.get(prodName) ?? {
          name: prodName,
          qty: 0,
          revenue: 0,
        };
        current.qty += item.quantity;
        current.revenue += item.quantity * item.unit_price;
        salesMap.set(prodName, current);
      });
    });

    const topProducts = Array.from(salesMap.values()).sort(
      (a, b) => b.qty - a.qty
    );

    return {
      todayRevenue: todayRevenue > 0 ? todayRevenue : totalRevenue,
      totalRevenue,
      completedCount,
      activeOrdersCount: orders.filter(
        (o) =>
          o.order_status === "awaiting_payment" ||
          o.order_status === "preparing" ||
          o.order_status === "delivering"
      ).length,
      topProduct: topProducts[0] ?? {
        name: "Siomay Ayam Udang Spesial",
        qty: 12,
        revenue: 360000,
      },
      topProducts,
    };
  }, [orders]);

  if (!authChecked) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Header Navigasi Admin (Disembunyikan saat Print) */}
      <header className="no-print sticky top-0 z-40 border-b border-stone-200 bg-espresso-950 text-white">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-terracotta-600 text-white">
              <Flame className="h-5 w-5 fill-amber-200" />
            </div>
            <div>
              <h1 className="text-base font-extrabold leading-none">
                Dashboard Admin Dimsum
              </h1>
              <span className="text-[11px] text-amber-300 font-medium">
                OMS • Manajemen Stok • Laporan Omzet
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Lihat Toko</span>
              </Button>
            </Link>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-1.5 text-red-300 hover:bg-red-950/50 hover:text-red-200"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Notifikasi Realtime Pesanan Baru */}
      {realtimeAlert && (
        <div className="no-print container mt-4">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-espresso-900 shadow-sm">
            <div className="flex items-center gap-2">
              <BellRing className="h-5 w-5 text-terracotta-600 animate-bounce" />
              <span>{realtimeAlert}</span>
            </div>
            <button
              type="button"
              onClick={() => setRealtimeAlert(null)}
              className="text-xs font-semibold text-terracotta-700 underline"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Konten Utama Admin */}
      <main className="no-print container py-6 space-y-6">
        {/* Navigasi Tab Utama */}
        <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 pb-4">
          <Button
            type="button"
            variant={activeTab === "orders" ? "default" : "outline"}
            onClick={() => setActiveTab("orders")}
            className="gap-2"
          >
            <ClipboardList className="h-4 w-4" />
            <span>Pesanan Masuk (OMS)</span>
            <span className="ml-1 rounded-full bg-amber-300 px-2 py-0.5 text-xs font-extrabold text-espresso-950">
              {orders.length}
            </span>
          </Button>

          <Button
            type="button"
            variant={activeTab === "products" ? "default" : "outline"}
            onClick={() => setActiveTab("products")}
            className="gap-2"
          >
            <UtensilsCrossed className="h-4 w-4" />
            <span>Manajemen Menu & Stok</span>
            <span className="ml-1 rounded-full bg-stone-200 px-2 py-0.5 text-xs font-extrabold text-espresso-900">
              {products.length}
            </span>
          </Button>

          <Button
            type="button"
            variant={activeTab === "analytics" ? "default" : "outline"}
            onClick={() => setActiveTab("analytics")}
            className="gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Ringkasan Omzet</span>
          </Button>
        </div>

        {/* ================================================================ */}
        {/* TAB 1: PESANAN MASUK (ORDER MANAGEMENT SYSTEM)                   */}
        {/* ================================================================ */}
        {activeTab === "orders" && (
          <div className="space-y-5">
            {/* Filter Status */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {(
                [
                  { id: "ALL", label: "Semua Pesanan" },
                  { id: "awaiting_payment", label: "Menunggu Pembayaran" },
                  { id: "preparing", label: "Sedang Dikukus" },
                  { id: "delivering", label: "Dalam Pengiriman" },
                  { id: "completed", label: "Selesai" },
                  { id: "cancelled", label: "Dibatalkan" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                    statusFilter === tab.id
                      ? "bg-espresso-900 text-white"
                      : "bg-white border border-stone-200 text-espresso-800 hover:bg-stone-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Daftar Kartu Pesanan */}
            <div className="grid grid-cols-1 gap-4">
              {filteredOrders.map((order) => (
                <Card key={order.order_number} className="overflow-hidden">
                  <div className="border-b border-stone-100 bg-cream-50/70 px-5 py-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/order/${encodeURIComponent(
                          order.order_number
                        )}`}
                        className="font-mono text-base font-extrabold text-terracotta-700 hover:underline"
                      >
                        {order.order_number}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        • {formatTanggalIndonesia(order.created_at)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          order.payment_status === "paid"
                            ? "success"
                            : "warning"
                        }
                      >
                        {order.payment_status === "paid"
                          ? "Lunas"
                          : "Belum Bayar"}
                      </Badge>
                      <Badge variant="secondary" className="font-bold">
                        {order.order_status === "awaiting_payment" &&
                          "Menunggu Bayar"}
                        {order.order_status === "preparing" &&
                          "🔥 Sedang Dikukus"}
                        {order.order_status === "delivering" &&
                          "🛵 Dalam Pengiriman"}
                        {order.order_status === "completed" && "✓ Selesai"}
                        {order.order_status === "cancelled" && "✕ Dibatalkan"}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    {/* Info Pelanggan */}
                    <div className="lg:col-span-4 space-y-1.5 text-xs">
                      <p className="text-sm font-extrabold text-espresso-900">
                        {order.customer_name} ({order.customer_phone})
                      </p>
                      <p className="font-semibold text-terracotta-700">
                        Metode:{" "}
                        {DELIVERY_OPTIONS[order.delivery_type]?.label ??
                          order.delivery_type}
                      </p>
                      {order.delivery_address && (
                        <p className="text-muted-foreground">
                          Alamat: {order.delivery_address}
                        </p>
                      )}
                      {order.notes && (
                        <p className="italic text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                          Catatan: &ldquo;{order.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Rincian Item */}
                    <div className="lg:col-span-4 space-y-2 border-t lg:border-t-0 lg:border-x border-stone-200 pt-3 lg:pt-0 lg:px-4">
                      {(order.order_items ?? []).map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between text-xs gap-2"
                        >
                          <div>
                            <span className="font-bold text-espresso-900">
                              {item.quantity}x{" "}
                              {item.products?.name ?? "Menu Dimsum"}
                            </span>
                            {item.product_variants?.variant_name && (
                              <span className="block text-[11px] text-terracotta-700">
                                ({item.product_variants.variant_name})
                              </span>
                            )}
                            {item.item_notes && (
                              <span className="block text-[11px] italic text-muted-foreground">
                                Ket: {item.item_notes}
                              </span>
                            )}
                          </div>
                          <span className="font-bold shrink-0">
                            {formatRupiah(item.quantity * item.unit_price)}
                          </span>
                        </div>
                      ))}

                      <div className="border-t border-stone-200 pt-2 flex justify-between text-sm font-extrabold text-espresso-900">
                        <span>Total Tagihan</span>
                        <span className="text-terracotta-700">
                          {formatRupiah(order.total_amount)}
                        </span>
                      </div>
                    </div>

                    {/* Tombol Aksi Cepat OMS & Cetak Struk 58mm */}
                    <div className="lg:col-span-4 flex flex-wrap lg:justify-end gap-2">
                      {(order.order_status === "awaiting_payment" ||
                        order.payment_status === "pending") && (
                        <Button
                          type="button"
                          size="sm"
                          variant="warm"
                          onClick={() =>
                            handleQuickOrderStatus(order, "preparing", true)
                          }
                          className="gap-1.5"
                        >
                          <ChefHat className="h-4 w-4" />
                          Terima & Kukus
                        </Button>
                      )}

                      {order.order_status === "preparing" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="default"
                          onClick={() =>
                            handleQuickOrderStatus(order, "delivering")
                          }
                          className="gap-1.5 bg-amber-600 hover:bg-amber-700"
                        >
                          <Truck className="h-4 w-4" />
                          Kirim Pesanan
                        </Button>
                      )}

                      {order.order_status === "delivering" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="default"
                          onClick={() =>
                            handleQuickOrderStatus(order, "completed")
                          }
                          className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Selesai
                        </Button>
                      )}

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handlePrintReceipt(order)}
                        className="gap-1.5"
                      >
                        <Printer className="h-4 w-4 text-terracotta-600" />
                        Cetak Struk 58mm
                      </Button>

                      {order.order_status !== "completed" &&
                        order.order_status !== "cancelled" && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleQuickOrderStatus(order, "cancelled")
                            }
                            className="text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 2: MANAJEMEN MENU & QUICK TOGGLE STOK                        */}
        {/* ================================================================ */}
        {activeTab === "products" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-espresso-900">
                  Daftar Menu & Ketersediaan Stok
                </h2>
                <p className="text-xs text-muted-foreground">
                  Gunakan tombol Quick Toggle Switch untuk mengaktifkan atau
                  menonaktifkan menu secara instan di halaman pelanggan.
                </p>
              </div>
              <Button
                type="button"
                variant="warm"
                onClick={openCreateMenuModal}
                className="gap-2 font-bold"
              >
                <Plus className="h-4 w-4" />
                Tambah Menu Baru
              </Button>
            </div>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-stone-200 bg-cream-100/70 text-xs font-extrabold uppercase text-espresso-800">
                    <tr>
                      <th className="p-4">Menu Dimsum</th>
                      <th className="p-4">Kategori</th>
                      <th className="p-4">Harga Dasar</th>
                      <th className="p-4">Varian Isi</th>
                      <th className="p-4">Stok</th>
                      <th className="p-4">Quick Toggle Tersedia</th>
                      <th className="p-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        className="hover:bg-cream-50/50 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="h-12 w-12 rounded-xl object-cover border border-stone-200 shrink-0"
                            />
                            <div>
                              <p className="font-bold text-espresso-900">
                                {product.name}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                                {product.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="secondary">{product.category}</Badge>
                        </td>
                        <td className="p-4 font-extrabold text-terracotta-700">
                          {formatRupiah(product.base_price)}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {product.product_variants.map((v) => (
                              <span
                                key={v.id}
                                className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-espresso-800"
                              >
                                {v.variant_name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 font-bold">{product.stock_qty}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <Switch
                              checked={
                                product.is_available && product.stock_qty > 0
                              }
                              onCheckedChange={(checked) =>
                                handleToggleProductAvailability(
                                  product,
                                  checked
                                )
                              }
                            />
                            <span
                              className={`text-xs font-bold ${
                                product.is_available && product.stock_qty > 0
                                  ? "text-emerald-700"
                                  : "text-stone-500"
                              }`}
                            >
                              {product.is_available && product.stock_qty > 0
                                ? "Tersedia"
                                : "Habis"}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => openEditMenuModal(product)}
                            className="gap-1.5"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 3: RINGKASAN OMZET & MENU TERLARIS                           */}
        {/* ================================================================ */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-terracotta-200 bg-gradient-to-br from-white to-terracotta-50/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span>Total Omzet Hari Ini</span>
                    <TrendingUp className="h-4 w-4 text-terracotta-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl sm:text-3xl font-extrabold text-terracotta-700">
                    {formatRupiah(analytics.todayRevenue)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Akumulasi pesanan berstatus Lunas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span>Jumlah Pesanan Selesai</span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl sm:text-3xl font-extrabold text-espresso-900">
                    {analytics.completedCount} Pesanan
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    +{analytics.activeOrdersCount} pesanan sedang diproses dapur
                  </p>
                </CardContent>
              </Card>

              <Card className="border-amber-200 bg-gradient-to-br from-white to-amber-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span>Menu Terlaris</span>
                    <Flame className="h-4 w-4 text-amber-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-extrabold text-espresso-900 line-clamp-1">
                    {analytics.topProduct.name}
                  </p>
                  <p className="text-xs font-semibold text-terracotta-700 mt-1">
                    Terjual {analytics.topProduct.qty} porsi (
                    {formatRupiah(analytics.topProduct.revenue)})
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-5 w-5 text-terracotta-600" />
                  Peringkat Penjualan Menu Dimsum
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-stone-200">
                {analytics.topProducts.map((item, idx) => (
                  <div
                    key={item.name}
                    className="py-3 first:pt-0 last:pb-0 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-terracotta-100 text-xs font-extrabold text-terracotta-800">
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-espresso-900">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.qty} porsi terjual
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-extrabold text-terracotta-700">
                      {formatRupiah(item.revenue)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Dialog Preview & Print Struk Thermal 58mm */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader className="no-print">
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-terracotta-600" />
              Pratinjau Struk Thermal (58mm)
            </DialogTitle>
            <DialogDescription>
              Siap dicetak ke printer kasir thermal 58mm.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <ThermalReceipt order={receiptOrder} />
          </div>

          <div className="no-print flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setReceiptDialogOpen(false)}
            >
              Tutup
            </Button>
            <Button
              type="button"
              variant="warm"
              onClick={triggerBrowserPrint}
              className="gap-2 font-bold"
            >
              <Printer className="h-4 w-4" />
              Cetak Sekarang
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Tambah / Edit Menu & Varian */}
      <Dialog open={menuModalOpen} onOpenChange={setMenuModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Menu Dimsum" : "Tambah Menu Dimsum Baru"}
            </DialogTitle>
            <DialogDescription>
              Atur rincian menu, harga dasar, stok, serta daftar varian porsi.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveMenuForm} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="menuName">Nama Menu</Label>
              <Input
                id="menuName"
                value={menuName}
                onChange={(e) => setMenuName(e.target.value)}
                placeholder="Contoh: Lumpia Udang Kulit Tahu"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="menuCategory">Kategori</Label>
                <select
                  id="menuCategory"
                  value={menuCategory}
                  onChange={(e) =>
                    setMenuCategory(e.target.value as ProductCategory)
                  }
                  className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="menuBasePrice">Harga Dasar (Rp)</Label>
                <Input
                  id="menuBasePrice"
                  type="number"
                  min={0}
                  step={500}
                  value={menuBasePrice}
                  onChange={(e) => setMenuBasePrice(Number(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="menuStockQty">Stok Porsi</Label>
                <Input
                  id="menuStockQty"
                  type="number"
                  min={0}
                  value={menuStockQty}
                  onChange={(e) => setMenuStockQty(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="menuImageUrl">URL Foto Menu</Label>
              <Input
                id="menuImageUrl"
                value={menuImageUrl}
                onChange={(e) => setMenuImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="menuDescription">Deskripsi Singkat</Label>
              <Textarea
                id="menuDescription"
                rows={2}
                value={menuDescription}
                onChange={(e) => setMenuDescription(e.target.value)}
                placeholder="Jelaskan kelezatan bahan dan saus pendamping..."
                required
              />
            </div>

            {/* Editor Varian Isi */}
            <div className="space-y-2 border-t border-stone-200 pt-3">
              <div className="flex items-center justify-between">
                <Label>Varian Isi & Tambahan Harga</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setMenuVariants((prev) => [
                      ...prev,
                      { variant_name: "", additional_price: 0 },
                    ])
                  }
                  className="h-7 text-xs gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Tambah Varian
                </Button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {menuVariants.map((variant, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      placeholder="Contoh: Isi 8 Pcs"
                      value={variant.variant_name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMenuVariants((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, variant_name: val } : item
                          )
                        );
                      }}
                      className="h-9 text-xs"
                    />
                    <Input
                      type="number"
                      min={0}
                      step={500}
                      placeholder="+ Harga"
                      value={variant.additional_price}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setMenuVariants((prev) =>
                          prev.map((item, i) =>
                            i === idx
                              ? { ...item, additional_price: val }
                              : item
                          )
                        );
                      }}
                      className="h-9 w-32 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setMenuVariants((prev) =>
                          prev.filter((_, i) => i !== idx)
                        )
                      }
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMenuModalOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" variant="warm" className="font-bold">
                Simpan Menu
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
