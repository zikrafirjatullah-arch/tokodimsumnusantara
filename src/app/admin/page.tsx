import React from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  INITIAL_PRODUCTS,
  Order,
  ProductWithVariants,
} from "@/types/database";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const dynamic = "force-dynamic";

async function getAdminInitialData(): Promise<{
  orders: Order[];
  products: ProductWithVariants[];
  authenticated: boolean;
}> {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return {
      orders: [],
      products: INITIAL_PRODUCTS,
      authenticated: false,
    };
  }

  try {
    const [
      {
        data: { session },
      },
      { data: ordersData },
      { data: productsData },
    ] = await Promise.all([
      supabase.auth.getSession(),
      supabase
        .from("orders")
        .select(
          "*, order_items(*, products(name, image_url, category), product_variants(variant_name))"
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("products")
        .select("*, product_variants(*)")
        .order("created_at", { ascending: true }),
    ]);

    return {
      orders: (ordersData as Order[]) ?? [],
      products:
        productsData && productsData.length > 0
          ? (productsData as ProductWithVariants[])
          : INITIAL_PRODUCTS,
      authenticated: Boolean(session),
    };
  } catch {
    return {
      orders: [],
      products: INITIAL_PRODUCTS,
      authenticated: false,
    };
  }
}

export default async function AdminPage() {
  const { orders, products, authenticated } = await getAdminInitialData();

  return (
    <AdminDashboardClient
      initialOrders={orders}
      initialProducts={products}
      serverAuthenticated={authenticated}
    />
  );
}
