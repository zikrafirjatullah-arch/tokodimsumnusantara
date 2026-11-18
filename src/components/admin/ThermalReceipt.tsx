"use client";

import React from "react";
import { Order } from "@/types/database";
import {
  DELIVERY_OPTIONS,
  formatRupiah,
  formatTanggalIndonesia,
} from "@/lib/utils";

interface ThermalReceiptProps {
  order: Order | null;
}

/**
 * Komponen Struk Thermal 58mm.
 * Tersembunyi di layar biasa (kecuali di dalam preview dialog),
 * dan otomatis menjadi satu-satunya elemen yang dicetak saat `window.print()` dipanggil.
 */
export function ThermalReceipt({ order }: ThermalReceiptProps) {
  if (!order) return null;

  return (
    <div
      id="thermal-receipt-print"
      className="mx-auto w-[58mm] bg-white p-3 font-mono text-[11px] leading-tight text-black border border-dashed border-stone-300 rounded-lg"
    >
      <div className="text-center border-b border-dashed border-black pb-2 mb-2">
        <p className="font-bold text-xs uppercase">DIMSUM HANGAT NUSANTARA</p>
        <p className="text-[10px]">Jl. Kuliner Nusantara No. 88</p>
        <p className="text-[10px]">WA: 0812-3456-7890</p>
      </div>

      <div className="space-y-0.5 border-b border-dashed border-black pb-2 mb-2 text-[10px]">
        <div className="flex justify-between">
          <span>No:</span>
          <span className="font-bold">{order.order_number}</span>
        </div>
        <div className="flex justify-between">
          <span>Tgl:</span>
          <span>{formatTanggalIndonesia(order.created_at)}</span>
        </div>
        <div className="flex justify-between">
          <span>Plg:</span>
          <span className="font-bold truncate max-w-[120px]">
            {order.customer_name}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Telp:</span>
          <span>{order.customer_phone}</span>
        </div>
        <div className="flex justify-between">
          <span>Tipe:</span>
          <span className="font-bold">
            {DELIVERY_OPTIONS[order.delivery_type]?.label ??
              order.delivery_type}
          </span>
        </div>
      </div>

      {/* Daftar Item */}
      <div className="space-y-1.5 border-b border-dashed border-black pb-2 mb-2">
        {(order.order_items ?? []).map((item) => {
          const lineTotal = item.quantity * item.unit_price;
          return (
            <div key={item.id} className="text-[10px]">
              <p className="font-bold">
                {item.products?.name ?? "Menu Dimsum"}
              </p>
              {item.product_variants?.variant_name && (
                <p className="text-[9px]">
                  Var: {item.product_variants.variant_name}
                </p>
              )}
              {item.item_notes && (
                <p className="text-[9px] italic">Ket: {item.item_notes}</p>
              )}
              <div className="flex justify-between">
                <span>
                  {item.quantity} x {formatRupiah(item.unit_price)}
                </span>
                <span className="font-bold">{formatRupiah(lineTotal)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ringkasan Total */}
      <div className="space-y-0.5 border-b border-dashed border-black pb-2 mb-2 text-[10px]">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatRupiah(order.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Ongkir</span>
          <span>{formatRupiah(order.delivery_fee)}</span>
        </div>
        {order.discount_amount > 0 && (
          <div className="flex justify-between">
            <span>Diskon</span>
            <span>-{formatRupiah(order.discount_amount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-xs pt-1">
          <span>TOTAL</span>
          <span>{formatRupiah(order.total_amount)}</span>
        </div>
        <div className="flex justify-between text-[9px] pt-0.5">
          <span>Status Bayar:</span>
          <span className="font-bold uppercase">
            {order.payment_status === "paid" ? "LUNAS" : "BELUM LUNAS"}
          </span>
        </div>
      </div>

      {order.delivery_address && (
        <div className="border-b border-dashed border-black pb-2 mb-2 text-[9px]">
          <p className="font-bold">Alamat Kirim:</p>
          <p>{order.delivery_address}</p>
        </div>
      )}

      {order.notes && (
        <div className="border-b border-dashed border-black pb-2 mb-2 text-[9px]">
          <p className="font-bold">Catatan Order:</p>
          <p>{order.notes}</p>
        </div>
      )}

      <div className="text-center text-[9px] pt-1">
        <p className="font-bold">Terima Kasih atas Pesanan Anda!</p>
        <p>Nikmati selagi hangat</p>
      </div>
    </div>
  );
}
