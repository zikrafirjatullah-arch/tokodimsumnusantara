"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Sparkles,
  UtensilsCrossed,
  X,
  TicketPercent,
  Check,
  Copy,
} from "lucide-react";
import {
  PRODUCT_CATEGORIES,
  ProductCategory,
  ProductWithVariants,
} from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { getLocalProducts } from "@/lib/demo-store";
import { Navbar } from "./Navbar";
import { HeroBanner } from "./HeroBanner";
import { ProductCard } from "./ProductCard";
import { ProductCustomizationModal } from "./ProductCustomizationModal";
import { FloatingCartBar } from "./FloatingCartBar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface StorefrontClientProps {
  initialProducts: ProductWithVariants[];
}

export function StorefrontClient({ initialProducts }: StorefrontClientProps) {
  const [products, setProducts] =
    useState<ProductWithVariants[]>(initialProducts);
  const [selectedCategory, setSelectedCategory] = useState<
    "Semua" | ProductCategory
  >("Semua");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeProduct, setActiveProduct] =
    useState<ProductWithVariants | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Sinkronisasi perubahan produk dari Local Demo Store & Supabase Realtime
  useEffect(() => {
    const supabase = createClient();

    if (!supabase) {
      const localProds = getLocalProducts();
      if (localProds.length > 0) {
        setProducts(localProds);
      }
      return;
    }

    const channel = supabase
      .channel("public-products-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        async () => {
          const { data } = await supabase
            .from("products")
            .select("*, product_variants(*)")
            .order("created_at", { ascending: true });
          if (data) {
            setProducts(data as ProductWithVariants[]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "Semua" || product.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        query === "" ||
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const handleOpenProductModal = (product: ProductWithVariants) => {
    setActiveProduct(product);
    setModalOpen(true);
  };

  const handleCopyVoucher = (code: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col pb-24">
      <Navbar />
      <HeroBanner />

      {/* Strip Kupon Promo Interaktif */}
      <section className="container -mt-5 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              code: "DIMSUMHEMAT",
              label: "Potongan Rp 10.000",
              sub: "Min. belanja Rp 50.000",
            },
            {
              code: "MENTAILOVER",
              label: "Diskon 15% Mentai",
              sub: "Min. belanja Rp 75.000",
            },
            {
              code: "UMKMBANGKIT",
              label: "Potongan Rp 20.000",
              sub: "Min. belanja Rp 120.000",
            },
          ].map((promo) => (
            <div
              key={promo.code}
              className="flex items-center justify-between rounded-2xl border border-amber-300/70 bg-gradient-to-r from-white via-cream-50 to-amber-50/70 px-4 py-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-terracotta-100 text-terracotta-700 shrink-0">
                  <TicketPercent className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-espresso-900">
                    {promo.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {promo.sub}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopyVoucher(promo.code)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-terracotta-300 bg-white px-3 py-1.5 text-xs font-mono font-bold text-terracotta-700 hover:bg-terracotta-50 transition-colors"
              >
                {copiedCode === promo.code ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Tersalin</span>
                  </>
                ) : (
                  <>
                    <span>{promo.code}</span>
                    <Copy className="h-3 w-3 opacity-70" />
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Katalog Menu Utama */}
      <main id="katalog-menu" className="container flex-1 pt-8 sm:pt-10">
        {/* Judul & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-terracotta-600">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Katalog Menu Kami</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-espresso-900 mt-1">
              Pilih Dimsum Favoritmu
            </h2>
          </div>

          {/* Search Bar Real-time */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari siomay, hakau, mentai, frozen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-9 bg-white border-stone-300"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Filter Kategori Horizontal (Scrollable di Mobile) */}
        <div className="sticky top-16 z-30 -mx-4 px-4 py-3 bg-background/95 backdrop-blur-md border-b border-stone-200/70 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {(["Semua", ...PRODUCT_CATEGORIES] as const).map((cat) => {
              const isActive = selectedCategory === cat;
              const count =
                cat === "Semua"
                  ? products.length
                  : products.filter((p) => p.category === cat).length;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs sm:text-sm font-bold transition-all shrink-0 ${
                    isActive
                      ? "bg-terracotta-600 text-white shadow-sm"
                      : "bg-white text-espresso-800 border border-stone-200 hover:border-terracotta-300 hover:bg-cream-100"
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid Produk */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelectProduct={handleOpenProductModal}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-white/60 p-12 text-center my-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-terracotta-50 text-terracotta-600 mb-3">
              <UtensilsCrossed className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-espresso-900">
              Menu Tidak Ditemukan
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
              Tidak ada menu dimsum untuk kata kunci &ldquo;{searchQuery}&rdquo;{" "}
              pada kategori <strong>{selectedCategory}</strong>.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCategory("Semua");
                setSearchQuery("");
              }}
              className="mt-4"
            >
              Reset Filter & Pencarian
            </Button>
          </div>
        )}
      </main>

      {/* Footer Toko */}
      <footer className="mt-16 border-t border-stone-200 bg-cream-100/70 py-8 text-xs text-muted-foreground">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-espresso-900 text-sm">
              Dimsum Hangat Nusantara — UMKM Dimsum Artisan
            </p>
            <p className="mt-0.5">
              Jl. Kuliner Nusantara No. 88, Jakarta Selatan • WhatsApp:
              0812-3456-7890
            </p>
          </div>
          <p>© {new Date().getFullYear()} Dimsum Hangat Nusantara. Siap Produksi.</p>
        </div>
      </footer>

      {/* Modal Kustomisasi Varian & Catatan */}
      <ProductCustomizationModal
        product={activeProduct}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />

      {/* Floating Cart Bar Mobile-First */}
      <FloatingCartBar />
    </div>
  );
}
