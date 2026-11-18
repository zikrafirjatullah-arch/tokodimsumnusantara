"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  DeliveryType,
  Product,
  ProductVariant,
  Voucher,
} from "@/types/database";
import { DELIVERY_OPTIONS } from "@/lib/utils";

export interface CartItem {
  cartItemId: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string;
  category: Product["category"];
  basePrice: number;
  variantId: string | null;
  variantName: string;
  additionalPrice: number;
  unitPrice: number;
  quantity: number;
  itemNotes: string;
}

interface AddToCartInput {
  product: Product;
  variant: ProductVariant | null;
  quantity: number;
  itemNotes: string;
}

interface CartState {
  items: CartItem[];
  deliveryType: DeliveryType;
  appliedVoucher: Voucher | null;
  addItem: (input: AddToCartInput) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  updateItemNotes: (cartItemId: string, notes: string) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  setDeliveryType: (type: DeliveryType) => void;
  setAppliedVoucher: (voucher: Voucher | null) => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getDeliveryFee: () => number;
  getTotalAmount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      deliveryType: "instant_courier",
      appliedVoucher: null,

      addItem: ({ product, variant, quantity, itemNotes }) => {
        const normalizedNotes = itemNotes.trim();
        const variantId = variant ? variant.id : null;
        const variantName = variant ? variant.variant_name : "Reguler";
        const additionalPrice = variant ? variant.additional_price : 0;
        const unitPrice = product.base_price + additionalPrice;
        const cartItemId = `${product.id}__${variantId ?? "default"}__${normalizedNotes.toLowerCase()}`;

        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) => item.cartItemId === cartItemId
          );

          if (existingIndex > -1) {
            const updatedItems = [...state.items];
            updatedItems[existingIndex] = {
              ...updatedItems[existingIndex],
              quantity: updatedItems[existingIndex].quantity + quantity,
            };
            return { items: updatedItems };
          }

          const newItem: CartItem = {
            cartItemId,
            productId: product.id,
            productName: product.name,
            productSlug: product.slug,
            productImage: product.image_url,
            category: product.category,
            basePrice: product.base_price,
            variantId,
            variantName,
            additionalPrice,
            unitPrice,
            quantity,
            itemNotes: normalizedNotes,
          };

          return { items: [...state.items, newItem] };
        });
      },

      updateQuantity: (cartItemId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter((i) => i.cartItemId !== cartItemId),
            };
          }
          return {
            items: state.items.map((item) =>
              item.cartItemId === cartItemId ? { ...item, quantity } : item
            ),
          };
        });
      },

      updateItemNotes: (cartItemId, notes) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.cartItemId === cartItemId
              ? { ...item, itemNotes: notes }
              : item
          ),
        }));
      },

      removeItem: (cartItemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.cartItemId !== cartItemId),
        }));
      },

      clearCart: () => {
        set({ items: [], appliedVoucher: null });
      },

      setDeliveryType: (deliveryType) => {
        set({ deliveryType });
      },

      setAppliedVoucher: (voucher) => {
        set({ appliedVoucher: voucher });
      },

      getTotalItems: () => {
        return get().items.reduce((acc, item) => acc + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce(
          (acc, item) => acc + item.unitPrice * item.quantity,
          0
        );
      },

      getDiscountAmount: () => {
        const subtotal = get().getSubtotal();
        const voucher = get().appliedVoucher;
        if (!voucher || !voucher.is_active || subtotal < voucher.min_order) {
          return 0;
        }
        if (voucher.discount_type === "fixed") {
          return Math.min(voucher.discount_value, subtotal);
        }
        return Math.round((subtotal * voucher.discount_value) / 100);
      },

      getDeliveryFee: () => {
        const items = get().items;
        if (items.length === 0) return 0;
        const type = get().deliveryType;
        return DELIVERY_OPTIONS[type]?.fee ?? 0;
      },

      getTotalAmount: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscountAmount();
        const deliveryFee = get().getDeliveryFee();
        return Math.max(0, subtotal - discount + deliveryFee);
      },
    }),
    {
      name: "dimsum-cart-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
