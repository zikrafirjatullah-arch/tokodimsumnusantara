# Dimsum Hangat Nusantara — Aplikasi Web E-Commerce & OMS UMKM Dimsum

Aplikasi web pemesanan *Mobile-First* & Order Management System (OMS) siap produksi untuk **UMKM Dimsum**, dibangun dengan **Next.js 14+ (App Router)**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, **Zustand**, dan **Supabase (PostgreSQL, Auth, & Realtime)**.

---

## Fitur Utama

1. **Storefront Pelanggan (`/`)**
   - **Hero Section** hangat dengan CTA *smooth-scroll* ke katalog.
   - **Filter Kategori Horizontal** (`Dimsum Kukus`, `Dimsum Goreng`, `Dimsum Mentai`, `Frozen Pack`, `Saus & Minuman`) & pencarian *real-time*.
   - **Modal Kustomisasi Produk**: Pilihan **Varian Isi** dengan kalkulasi harga otomatis, pengatur jumlah porsi, dan **Catatan Item** (contoh: *"Saus dipisah, chili oil ekstra"*).
   - **Floating Cart Bar** dengan persistensi `localStorage` via **Zustand**.

2. **Guest Checkout & Validasi Voucher (`/checkout`)**
   - Pemesanan cepat tanpa wajib registrasi/login (cukup Nama & Nomor WhatsApp).
   - Pilihan pengiriman: **Ambil Sendiri** (`Rp 0`), **Kurir Lokal/Instan** (`Rp 10.000`), dan **Ekspedisi Frozen** (`Rp 20.000`).
   - Validasi kode voucher promo langsung ke tabel `vouchers` (`DIMSUMHEMAT`, `MENTAILOVER`, `UMKMBANGKIT`).

3. **Pelacakan Pesanan & Simulasi QRIS (`/order/[order_number]`)**
   - Visual Stepper status pesanan secara *real-time* (`Menunggu Pembayaran` -> `Sedang Dikukus` -> `Dalam Pengiriman` -> `Selesai`).
   - Kartu pembayaran QRIS (*Midtrans Snap Ready*) lengkap dengan tombol simulasi pelunasan instan.

4. **Dashboard Admin (`/admin` & `/admin/login`)**
   - Dilindungi **Supabase Auth** (dilengkapi mode demo lokal `admin@dimsum.id` / `dimsum123` jika `.env.local` belum dihubungkan).
   - **Tab Pesanan Masuk (OMS)**: Filter status, tombol aksi cepat (`Terima & Kukus` -> `Kirim Pesanan` -> `Selesai`), notifikasi pesanan baru via **Supabase Realtime**, dan **Cetak Struk Thermal 58mm** (`@media print`).
   - **Tab Manajemen Menu & Stok**: *Quick Toggle Switch* untuk mengubah status `is_available` secara instan serta modal tambah/edit menu beserta varian isi.
   - **Tab Ringkasan Omzet**: Kartu statistik **Total Omzet Hari Ini**, **Jumlah Pesanan Selesai**, dan **Menu Terlaris**.

---

## Cara Menjalankan Proyek

1. **Instalasi Dependensi**
   ```bash
   npm install
   ```

2. **Konfigurasi Variabel Environment (Opsional untuk Mode Demo, Wajib untuk Produksi)**
   Salin `.env.example` menjadi `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Jalankan seluruh isi file [`supabase/schema.sql`](./supabase/schema.sql) pada **SQL Editor** di dashboard proyek Supabase Anda untuk membuat seluruh tabel, kebijakan RLS, publikasi Realtime, dan *seed data*.

3. **Jalankan Server Development**
   ```bash
   npm run dev
   ```
   Buka `http://localhost:3000` di browser Anda.
