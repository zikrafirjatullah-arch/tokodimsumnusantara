"use client";

import React, { useState, useEffect } from "react";
import {
  Check,
  Minus,
  Plus,
  ShoppingBag,
  Utensils,
  MessageSquareText,
} from "lucide-react";
import { ProductVariant, ProductWithVariants } from "@/types/database";
import { formatRupiah } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ProductCustomizationModalProps {
  product: ProductWithVariants | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QUICK_NOTE_SUGGESTIONS = [
  "Saus dipisah",
  "Chili oil ekstra",
  "Tanpa saus pedas",
  "Kukus ekstra hangat",
];

export function ProductCustomizationModal({
  product,
  open,
  onOpenChange,
}: ProductCustomizationModalProps) {
  const addItem = useCartStore((state) => state.addItem);

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [itemNotes, setItemNotes] = useState<string>("");

  useEffect(() => {
    if (product) {
      const variants = product.product_variants ?? [];
      setSelectedVariant(variants.length > 0 ? variants[0] : null);
      setQuantity(1);
      setItemNotes("");
    }
  }, [product, open]);

  if (!product) return null;

  const variants = product.product_variants ?? [];
  const unitPrice =
    product.base_price + (selectedVariant ? selectedVariant.additional_price : 0);
  const totalPrice = unitPrice * quantity;
  const maxQty = Math.max(1, product.stock_qty);

  const handleAddToCart = () => {
    addItem({
      product,
      variant: selectedVariant,
      quantity,
      itemNotes,
    });
    onOpenChange(false);
  };

  const handleAppendSuggestion = (suggestion: string) => {
    if (itemNotes.toLowerCase().includes(suggestion.toLowerCase())) return;
    setItemNotes((prev) =>
      prev.trim().length > 0 ? `${prev.trim()}, ${suggestion}` : suggestion
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden gap-0">
        {/* Header Gambar Produk */}
        <div className="relative h-48 sm:h-52 w-full bg-stone-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-espresso-950/85 via-espresso-950/25 to-transparent" />
          <div className="absolute bottom-3.5 left-5 right-5 text-white">
            <Badge className="mb-1.5 bg-terracotta-600 text-white border-none">
              {product.category}
            </Badge>
            <DialogHeader className="text-left">
              <DialogTitle className="text-xl font-extrabold text-white">
                {product.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-200 line-clamp-2 mt-1">
                {product.description}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        {/* Body Kustomisasi */}
        <div className="p-5 space-y-5 max-h-[62vh] overflow-y-auto">
          {/* Pilihan Varian Isi (Radio Button) */}
          {variants.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-sm font-bold text-espresso-900">
                  <Utensils className="h-4 w-4 text-terracotta-600" />
                  Pilih Varian Isi
                </Label>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                  Wajib Pilih 1
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {variants.map((variant) => {
                  const isSelected = selectedVariant?.id === variant.id;
                  const variantFullPrice =
                    product.base_price + variant.additional_price;

                  return (
                    <label
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border p-3.5 transition-all ${
                        isSelected
                          ? "border-terracotta-600 bg-terracotta-50/70 ring-1 ring-terracotta-600"
                          : "border-stone-200 bg-white hover:border-stone-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="product-variant"
                          checked={isSelected}
                          onChange={() => setSelectedVariant(variant)}
                          className="sr-only"
                        />
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                            isSelected
                              ? "border-terracotta-600 bg-terracotta-600 text-white"
                              : "border-stone-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-espresso-900">
                            {variant.variant_name}
                          </p>
                          {variant.additional_price > 0 ? (
                            <p className="text-[11px] text-muted-foreground">
                              +{formatRupiah(variant.additional_price)} dari harga dasar
                            </p>
                          ) : (
                            <p className="text-[11px] text-emerald-700 font-medium">
                              Harga dasar
                            </p>
                          )}
                        </div>
                      </div>

                      <span className="text-sm font-extrabold text-terracotta-700">
                        {formatRupiah(variantFullPrice)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Catatan Item */}
          <div className="space-y-2">
            <Label
              htmlFor="item-notes"
              className="flex items-center gap-1.5 text-sm font-bold text-espresso-900"
            >
              <MessageSquareText className="h-4 w-4 text-terracotta-600" />
              Catatan Khusus Item{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (Opsional)
              </span>
            </Label>

            {/* Chip saran cepat */}
            <div className="flex flex-wrap gap-1.5">
              {QUICK_NOTE_SUGGESTIONS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleAppendSuggestion(chip)}
                  className="rounded-full border border-stone-200 bg-cream-100 px-2.5 py-1 text-xs font-medium text-espresso-800 hover:border-terracotta-400 hover:bg-terracotta-50 transition-colors"
                >
                  + {chip}
                </button>
              ))}
            </div>

            <Textarea
              id="item-notes"
              placeholder='Contoh: "Saus dipisah, chili oil banyak ya kak"'
              value={itemNotes}
              onChange={(e) => setItemNotes(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Pengatur Jumlah (Quantity) */}
          <div className="flex items-center justify-between rounded-2xl border border-stone-200 bg-cream-50 p-3.5">
            <div>
              <p className="text-sm font-bold text-espresso-900">
                Jumlah Pesanan
              </p>
              <p className="text-xs text-muted-foreground">
                Stok tersedia: {product.stock_qty} porsi
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="h-9 w-9 rounded-xl bg-white"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center text-base font-extrabold text-espresso-900">
                {quantity}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                disabled={quantity >= maxQty}
                className="h-9 w-9 rounded-xl bg-white"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Footer Tombol Tambah ke Keranjang */}
        <div className="border-t border-stone-200 bg-white p-4">
          <Button
            type="button"
            variant="warm"
            size="lg"
            onClick={handleAddToCart}
            className="w-full justify-between px-5 font-extrabold shadow-md"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Tambah ke Keranjang ({quantity}x)
            </span>
            <span>{formatRupiah(totalPrice)}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
