"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Flame,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const ADMIN_SESSION_STORAGE_KEY = "dimsum_admin_authenticated";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@dimsum.id");
  const [password, setPassword] = useState("dimsum123");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const supabaseActive = isSupabaseConfigured();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const supabase = createClient();

      if (supabase) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          // Izinkan fallback demo kredensial jika akun belum dibuat di Supabase Auth
          if (
            email.trim().toLowerCase() === "admin@dimsum.id" &&
            password === "dimsum123"
          ) {
            window.localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, "true");
            router.push("/admin");
            router.refresh();
            return;
          }
          setErrorMsg(
            error.message || "Email atau kata sandi Admin tidak sesuai."
          );
          setLoading(false);
          return;
        }

        window.localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, "true");
        router.push("/admin");
        router.refresh();
        return;
      }

      // Mode lokal / demo jika variabel environment Supabase belum disetel
      if (
        email.trim().toLowerCase() === "admin@dimsum.id" &&
        password === "dimsum123"
      ) {
        window.localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, "true");
        router.push("/admin");
        return;
      } else {
        setErrorMsg(
          "Kredensial tidak valid. Gunakan akun demo: admin@dimsum.id / dimsum123"
        );
        setLoading(false);
      }
    } catch {
      setErrorMsg("Gagal melakukan autentikasi. Silakan coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-espresso-950 via-espresso-900 to-terracotta-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke Halaman Pelanggan (Storefront)
        </Link>

        <Card className="border-stone-200/20 shadow-2xl">
          <CardHeader className="space-y-2 text-center pb-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-terracotta-600 to-amber-600 text-white shadow-md">
              <Flame className="h-6 w-6 fill-amber-200" />
            </div>
            <CardTitle className="text-2xl font-extrabold text-espresso-900">
              Portal Admin UMKM Dimsum
            </CardTitle>
            <CardDescription>
              Masuk untuk mengelola pesanan masuk (OMS), ketersediaan stok menu,
              dan laporan omzet harian.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-950 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-terracotta-800">
                <ShieldCheck className="h-4 w-4" />
                <span>
                  {supabaseActive
                    ? "Supabase Auth Terhubung"
                    : "Mode Akses Cepat / Demo Siap Uji"}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Akun Admin Default:{" "}
                <code className="font-mono font-bold">admin@dimsum.id</code> |
                Sandi: <code className="font-mono font-bold">dimsum123</code>
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Admin</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@dimsum.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Kata Sandi</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                  {errorMsg}
                </div>
              )}

              <Button
                type="submit"
                variant="warm"
                size="lg"
                disabled={loading}
                className="w-full gap-2 font-extrabold"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memverifikasi Akses...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Masuk ke Dashboard Admin
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
