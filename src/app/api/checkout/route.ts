import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  DeliveryType,
  INITIAL_VOUCHERS,
  Order,
  OrderItem,
  Voucher,
} from "@/types/database";
import { DELIVERY_OPTIONS, generateOrderNumber } from "@/lib/utils";

interface CheckoutItemPayload {
  productId: string;
  productName: string;
  productImage: string;
  category: OrderItem["products"] extends infer T
    ? T extends { category: infer C }
      ? C
      : string
    : string;
  variantId: string | null;
  variantName: string;
  quantity: number;
  unitPrice: number;
  itemNotes: string;
}

interface CheckoutRequestBody {
  customerName: string;
  customerPhone: string;
  deliveryType: DeliveryType;
  deliveryAddress?: string;
  notes?: string;
  voucherCode?: string | null;
  items: CheckoutItemPayload[];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CheckoutRequestBody;

    const customerName = (body.customerName ?? "").trim();
    const customerPhone = (body.customerPhone ?? "").trim();
    const deliveryType: DeliveryType = body.deliveryType ?? "instant_courier";
    const deliveryAddress =
      deliveryType === "pickup" ? null : (body.deliveryAddress ?? "").trim();
    const notes = (body.notes ?? "").trim() || null;
    const items = Array.isArray(body.items) ? body.items : [];

    if (!customerName || customerName.length < 2) {
      return NextResponse.json(
        { error: "Nama pemesan wajib diisi." },
        { status: 400 }
      );
    }

    if (!customerPhone || customerPhone.length < 8) {
      return NextResponse.json(
        { error: "Nomor WhatsApp aktif wajib diisi." },
        { status: 400 }
      );
    }

    if (
      deliveryType !== "pickup" &&
      (!deliveryAddress || deliveryAddress.length < 5)
    ) {
      return NextResponse.json(
        { error: "Alamat pengiriman lengkap wajib diisi untuk metode kurir." },
        { status: 400 }
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        { error: "Keranjang belanja Anda masih kosong." },
        { status: 400 }
      );
    }

    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.unitPrice) * Number(item.quantity),
      0
    );
    const deliveryFee = DELIVERY_OPTIONS[deliveryType]?.fee ?? 0;

    let discountAmount = 0;
    const voucherCode = body.voucherCode
      ? body.voucherCode.trim().toUpperCase()
      : null;

    const supabase = createServerSupabaseClient();
    let matchedVoucher: Voucher | null = null;

    if (voucherCode) {
      if (supabase) {
        const { data: vData } = await supabase
          .from("vouchers")
          .select("*")
          .eq("code", voucherCode)
          .maybeSingle();
        if (vData) matchedVoucher = vData as Voucher;
      }

      if (!matchedVoucher) {
        matchedVoucher =
          INITIAL_VOUCHERS.find((v) => v.code === voucherCode) ?? null;
      }

      if (
        matchedVoucher &&
        matchedVoucher.is_active &&
        matchedVoucher.quota > 0 &&
        subtotal >= matchedVoucher.min_order
      ) {
        discountAmount =
          matchedVoucher.discount_type === "fixed"
            ? Math.min(matchedVoucher.discount_value, subtotal)
            : Math.round((subtotal * matchedVoucher.discount_value) / 100);
      }
    }

    const totalAmount = Math.max(0, subtotal - discountAmount + deliveryFee);
    const orderNumber = generateOrderNumber(new Date());
    const nowIso = new Date().toISOString();

    // Simpan ke Supabase apabila dikonfigurasi
    if (supabase) {
      const { data: insertedOrder, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          customer_name: customerName,
          customer_phone: customerPhone,
          delivery_type: deliveryType,
          delivery_address: deliveryAddress,
          subtotal,
          delivery_fee: deliveryFee,
          discount_amount: discountAmount,
          total_amount: totalAmount,
          payment_status: "pending",
          order_status: "awaiting_payment",
          notes,
        })
        .select("*")
        .single();

      if (!orderError && insertedOrder) {
        const orderItemsPayload = items.map((item) => ({
          order_id: insertedOrder.id,
          product_id: item.productId,
          variant_id: item.variantId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          item_notes: item.itemNotes ? item.itemNotes.trim() : null,
        }));

        await supabase.from("order_items").insert(orderItemsPayload);

        // Kurangi kuota voucher jika ada
        if (matchedVoucher) {
          await supabase
            .from("vouchers")
            .update({ quota: Math.max(0, matchedVoucher.quota - 1) })
            .eq("id", matchedVoucher.id);
        }

        // Ambil kembali order lengkap beserta relasinya
        const { data: fullOrder } = await supabase
          .from("orders")
          .select(
            "*, order_items(*, products(name, image_url, category), product_variants(variant_name))"
          )
          .eq("id", insertedOrder.id)
          .single();

        return NextResponse.json({
          success: true,
          order_number: orderNumber,
          order: (fullOrder ?? insertedOrder) as Order,
        });
      }
    }

    // Fallback Order Object (untuk penyimpanan instan apabila Supabase belum disambungkan)
    const fallbackOrderId = crypto.randomUUID();
    const fallbackOrder: Order = {
      id: fallbackOrderId,
      order_number: orderNumber,
      customer_name: customerName,
      customer_phone: customerPhone,
      delivery_type: deliveryType,
      delivery_address: deliveryAddress,
      subtotal,
      delivery_fee: deliveryFee,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      payment_status: "pending",
      order_status: "awaiting_payment",
      notes,
      created_at: nowIso,
      order_items: items.map((item) => ({
        id: crypto.randomUUID(),
        order_id: fallbackOrderId,
        product_id: item.productId,
        variant_id: item.variantId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        item_notes: item.itemNotes ? item.itemNotes.trim() : null,
        products: {
          name: item.productName,
          image_url: item.productImage,
          category: item.category as OrderItem["products"] extends infer P
            ? P extends { category: infer Cat }
              ? Cat
              : "Dimsum Kukus"
            : "Dimsum Kukus",
        },
        product_variants: {
          variant_name: item.variantName,
        },
      })),
    };

    return NextResponse.json({
      success: true,
      order_number: orderNumber,
      order: fallbackOrder,
    });
  } catch {
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memproses pesanan Anda." },
      { status: 500 }
    );
  }
}
