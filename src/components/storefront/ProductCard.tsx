"use client";

import React from "react";
import { Plus, Flame, Sparkles } from "lucide-react";
import { ProductWithVariants } from "@/types/database";
import { formatRupiah } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  product: ProductWithVariants;
  onSelectProduct: (product: ProductWithVariants) => void;
}

export function ProductCard({ product, onSelectProduct }: ProductCardProps) {
  const isAvailable = product.is_available && product.stock_qty > 0;

  return (
    <div
      onClick={() => {
        if (isAvailable) onSelectProduct(product);
      }}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-200 ${
        isAvailable
          ? "cursor-pointer border-stone-200/90 hover:border-terracotta-400 hover:shadow-md active:scale-[0.99]"
          : "cursor-not-allowed border-stone-200 bg-stone-50/70 opacity-75"
      }`}
    >
      {/* Gambar Produk */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          className={`h-full w-full object-cover transition-transform duration-300 ${
            isAvailable ? "group-hover:scale-105" : "grayscale"
          }`}
        />

        {/* Overlay Gradient Halus */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

        {/* Badge Kategori di Kiri Atas */}
        <div className="absolute top-2.5 left-2.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-espresso-950/80 backdrop-blur-xs px-2.5 py-1 text-[11px] font-semibold text-cream-50">
            {product.category === "Dimsum Mentai" ? (
              <Flame className="h-3 w-3 text-amber-400" />
            ) : (
              <Sparkles className="h-3 w-3 text-amber-300" />
            )}
            {product.category}
          </span>
        </div>

        {/* Badge Ketersediaan Stok di Kanan Atas */}
        <div className="absolute top-2.5 right-2.5">
          {isAvailable ? (
            <Badge
              variant="success"
              className="shadow-xs font-bold backdrop-blur-xs bg-emerald-50/95"
            >
              Tersedia • {product.stock_qty}
            </Badge>
          ) : (
            <Badge
              variant="soldout"
              className="shadow-xs font-bold bg-stone-900/90 text-white border-none"
            >
              Habis
            </Badge>
          )}
        </div>

        {/* Info Varian Singkat di Bawah Gambar */}
        {product.product_variants && product.product_variants.length > 0 && (
          <div className="absolute bottom-2 left-2.5 right-2.5 flex flex-wrap gap-1">
            {product.product_variants.slice(0, 3).map((v) => (
              <span
                key={v.id}
                className="rounded-md bg-white/90 backdrop-blur-xs px-1.5 py-0.5 text-[10px] font-semibold text-espresso-900"
              >
                {v.variant_name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Konten Informasi Produk */}
      <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-4">
        <div className="space-y-1.5">
          <h3 className="font-bold text-espresso-900 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-terracotta-700 transition-colors">
            {product.name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
          <div>
            <span className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Mulai dari
            </span>
            <span className="text-base sm:text-lg font-extrabold text-terracotta-700">
              {formatRupiah(product.base_price)}
            </span>
          </div>

          <Button
            type="button"
            size="sm"
            variant={isAvailable ? "default" : "secondary"}
            disabled={!isAvailable}
            onClick={(e) => {
              e.stopPropagation();
              if (isAvailable) onSelectProduct(product);
            }}
            className="gap-1 rounded-xl px-3.5 font-bold shadow-xs"
          >
            {isAvailable ? (
              <>
                <Plus className="h-4 w-4" />
                <span>Tambah</span>
              </>
            ) : (
              <span>Stok Habis</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
