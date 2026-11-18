import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Order, OrderStatus, PaymentStatus } from "@/types/database";

export async function GET(
  _req: NextRequest,
  { params }: { params: { order_number: string } }
) {
  const orderNumber = decodeURIComponent(params.order_number)
    .trim()
    .toUpperCase();
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      { order: null, source: "local" },
      { status: 200 }
    );
  }

  const { data, error } = await supabase
    .from("orders")
    .select(
      "*, order_items(*, products(name, image_url, category), product_variants(variant_name))"
    )
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ order: null }, { status: 404 });
  }

  return NextResponse.json({ order: data as Order, source: "supabase" });
}

interface UpdateOrderPatchBody {
  payment_status?: PaymentStatus;
  order_status?: OrderStatus;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { order_number: string } }
) {
  try {
    const orderNumber = decodeURIComponent(params.order_number)
      .trim()
      .toUpperCase();
    const body = (await req.json()) as UpdateOrderPatchBody;

    const updates: Partial<Pick<Order, "payment_status" | "order_status">> = {};
    if (body.payment_status) updates.payment_status = body.payment_status;
    if (body.order_status) updates.order_status = body.order_status;

    const supabase = createServerSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("orders")
        .update(updates)
        .eq("order_number", orderNumber)
        .select(
          "*, order_items(*, products(name, image_url, category), product_variants(variant_name))"
        )
        .maybeSingle();

      if (!error && data) {
        return NextResponse.json({
          success: true,
          order: data as Order,
        });
      }
    }

    return NextResponse.json({
      success: true,
      updates,
    });
  } catch {
    return NextResponse.json(
      { error: "Gagal memperbarui status pesanan." },
      { status: 500 }
    );
  }
}
