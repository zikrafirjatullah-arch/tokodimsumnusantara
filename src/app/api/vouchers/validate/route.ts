import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { INITIAL_VOUCHERS, Voucher } from "@/types/database";
import { formatRupiah } from "@/lib/utils";

interface ValidateVoucherBody {
  code?: string;
  subtotal?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ValidateVoucherBody;
    const rawCode = (body.code ?? "").trim().toUpperCase();
    const subtotal = Number(body.subtotal ?? 0);

    if (!rawCode) {
      return NextResponse.json(
        { valid: false, message: "Masukkan kode voucher terlebih dahulu." },
        { status: 400 }
      );
    }

    let voucher: Voucher | null = null;
    const supabase = createServerSupabaseClient();

    if (supabase) {
      const { data, error } = await supabase
        .from("vouchers")
        .select("*")
        .eq("code", rawCode)
        .maybeSingle();

      if (!error && data) {
        voucher = data as Voucher;
      }
    }

    if (!voucher) {
      voucher =
        INITIAL_VOUCHERS.find((v) => v.code.toUpperCase() === rawCode) ?? null;
    }

    if (!voucher) {
      return NextResponse.json(
        {
          valid: false,
          message: `Kode voucher "${rawCode}" tidak ditemukan.`,
        },
        { status: 404 }
      );
    }

    if (!voucher.is_active) {
      return NextResponse.json(
        {
          valid: false,
          message: `Voucher "${rawCode}" sudah tidak aktif.`,
        },
        { status: 400 }
      );
    }

    if (voucher.quota <= 0) {
      return NextResponse.json(
        {
          valid: false,
          message: `Kuota promo voucher "${rawCode}" sudah habis.`,
        },
        { status: 400 }
      );
    }

    if (subtotal < voucher.min_order) {
      return NextResponse.json(
        {
          valid: false,
          message: `Minimal belanja untuk voucher ${rawCode} adalah ${formatRupiah(
            voucher.min_order
          )}.`,
        },
        { status: 400 }
      );
    }

    const discountAmount =
      voucher.discount_type === "fixed"
        ? Math.min(voucher.discount_value, subtotal)
        : Math.round((subtotal * voucher.discount_value) / 100);

    return NextResponse.json({
      valid: true,
      voucher,
      discountAmount,
      message: `Voucher ${voucher.code} berhasil dipasang! Hemat ${formatRupiah(
        discountAmount
      )}.`,
    });
  } catch {
    return NextResponse.json(
      { valid: false, message: "Terjadi kesalahan saat memvalidasi voucher." },
      { status: 500 }
    );
  }
}
