import React from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { INITIAL_PRODUCTS, ProductWithVariants } from "@/types/database";
import { StorefrontClient } from "@/components/storefront/StorefrontClient";

export const dynamic = "force-dynamic";

async function getCatalogProducts(): Promise<ProductWithVariants[]> {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return INITIAL_PRODUCTS;
  }

  try {
    const { data, error } = await supabase
      .from("products")
      .select("*, product_variants(*)")
      .order("created_at", { ascending: true });

    if (error || !data || data.length === 0) {
      return INITIAL_PRODUCTS;
    }

    return data as ProductWithVariants[];
  } catch {
    return INITIAL_PRODUCTS;
  }
}

export default async function HomePage() {
  const products = await getCatalogProducts();
  return <StorefrontClient initialProducts={products} />;
}
