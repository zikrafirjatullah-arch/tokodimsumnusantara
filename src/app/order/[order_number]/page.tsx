import React from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Order } from "@/types/database";
import { OrderTrackerClient } from "@/components/order/OrderTrackerClient";

export const dynamic = "force-dynamic";

async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("orders")
      .select(
        "*, order_items(*, products(name, image_url, category), product_variants(variant_name))"
      )
      .eq("order_number", orderNumber.toUpperCase())
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as Order;
  } catch {
    return null;
  }
}

export default async function OrderTrackingPage({
  params,
}: {
  params: { order_number: string };
}) {
  const decodedOrderNumber = decodeURIComponent(params.order_number)
    .trim()
    .toUpperCase();
  const initialOrder = await getOrderByNumber(decodedOrderNumber);

  return (
    <OrderTrackerClient
      orderNumber={decodedOrderNumber}
      initialOrder={initialOrder}
    />
  );
}
