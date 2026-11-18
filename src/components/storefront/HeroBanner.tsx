"use client";

import React from "react";
import {
  ArrowDown,
  Clock,
  Flame,
  ShieldCheck,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function HeroBanner() {
  const scrollToCatalog = () => {
    const element = document.getElementById("katalog-menu");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-espresso-950 via-espresso-900 to-terracotta-900 text-cream-50">
      {/* Dekorasi Latar Hangat */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-terracotta-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-amber-500/15 blur-3xl" />

      <div className="container relative py-8 sm:py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Kolom Teks & CTA */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>100% Daging Ayam & Udang Segar • Tanpa Pengawet</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.15]">
              Dimsum Kukus Hangat &{" "}
              <span className="bg-gradient-to-r from-amber-300 via-orange-300 to-terracotta-300 bg-clip-text text-transparent">
                Mentai Torch
              </span>{" "}
              Langsung dari Klakat!
            </h1>

            <p className="text-sm sm:text-base text-stone-300 max-w-xl leading-relaxed">
              Dibuat segar setiap pagi dengan resep otentik UMKM kebanggaan
              keluarga. Lengkap dengan siraman{" "}
              <strong className="text-amber-200 font-semibold">
                Chili Oil Rebon Wangi
              </strong>{" "}
              dan saus mentai smoky yang meleleh di mulut.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button
                type="button"
                size="lg"
                variant="warm"
                onClick={scrollToCatalog}
                className="gap-2 text-base font-bold shadow-lg shadow-terracotta-950/50"
              >
                <span>Pesan Sekarang</span>
                <ArrowDown className="h-4 w-4 animate-bounce" />
              </Button>

              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-stone-200">
                <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                <div>
                  <span className="block font-bold text-white">
                    Buka Setiap Hari
                  </span>
                  <span className="text-stone-300">09:00 – 21:30 WIB</span>
                </div>
              </div>
            </div>

            {/* Poin Keunggulan */}
            <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="text-stone-200 font-medium">100% Halal</span>
              </div>
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="text-stone-200 font-medium">
                  Dikukus Dadakan
                </span>
              </div>
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4 text-terracotta-300 shrink-0" />
                <span className="text-stone-200 font-medium">
                  Free Chili Oil
                </span>
              </div>
            </div>
          </div>

          {/* Kolom Kartu Visual Promo */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md rounded-3xl border border-white/15 bg-white/5 p-3 backdrop-blur-sm shadow-2xl">
              <div className="relative h-56 sm:h-64 w-full overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=900&q=80"
                  alt="Dimsum Kukus Bambu Hangat"
                  className="h-full w-full object-cover object-center transform hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-espresso-950/90 via-espresso-950/20 to-transparent" />

                <Badge className="absolute top-3 left-3 bg-terracotta-600 text-white border-none px-3 py-1 text-xs font-bold shadow">
                  🔥 Terlaris Minggu Ini
                </Badge>

                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                  <div>
                    <p className="text-xs font-medium text-amber-300">
                      Paket Favorit Keluarga
                    </p>
                    <h2 className="text-lg font-extrabold leading-tight">
                      Siomay Ayam Udang & Mentai Platter
                    </h2>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="block text-[10px] text-stone-300">
                      Mulai dari
                    </span>
                    <span className="text-lg font-extrabold text-amber-300">
                      Rp 16.000
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
