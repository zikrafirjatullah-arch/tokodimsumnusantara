export type ProductCategory =
  | "Dimsum Kukus"
  | "Dimsum Goreng"
  | "Dimsum Mentai"
  | "Frozen Pack"
  | "Saus & Minuman";

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  "Dimsum Kukus",
  "Dimsum Goreng",
  "Dimsum Mentai",
  "Frozen Pack",
  "Saus & Minuman",
];

export type DeliveryType = "pickup" | "instant_courier" | "frozen_expedition";

export type PaymentStatus = "pending" | "paid" | "failed";

export type OrderStatus =
  | "awaiting_payment"
  | "preparing"
  | "delivering"
  | "completed"
  | "cancelled";

export type DiscountType = "fixed" | "percentage";

export interface ProductVariant {
  id: string;
  product_id: string;
  variant_name: string;
  additional_price: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: ProductCategory;
  base_price: number;
  image_url: string;
  is_available: boolean;
  stock_qty: number;
  created_at: string;
}

export interface ProductWithVariants extends Product {
  product_variants: ProductVariant[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price: number;
  item_notes: string | null;
  products?: Pick<Product, "name" | "image_url" | "category"> | null;
  product_variants?: Pick<ProductVariant, "variant_name"> | null;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  delivery_type: DeliveryType;
  delivery_address: string | null;
  subtotal: number;
  delivery_fee: number;
  discount_amount: number;
  total_amount: number;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  notes: string | null;
  created_at: string;
  order_items?: OrderItem[];
}

export interface Voucher {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order: number;
  quota: number;
  is_active: boolean;
}

/**
 * Fallback Seed Data yang identik dengan `supabase/schema.sql`.
 * Digunakan secara otomatis jika environment variable Supabase belum dikonfigurasi,
 * sehingga aplikasi dapat langsung dijalankan dan diuji penuh tanpa kendala.
 */
export const INITIAL_PRODUCTS: ProductWithVariants[] = [
  {
    id: "11111111-1111-4111-8111-111111111101",
    name: "Siomay Ayam Udang Spesial",
    slug: "siomay-ayam-udang-spesial",
    description:
      "Dimsum klasik favorit dengan daging paha ayam segar pilihan dan potongan udang utuh yang juicy, disajikan hangat dengan taburan tobiko dan chili oil khas.",
    category: "Dimsum Kukus",
    base_price: 16000,
    image_url:
      "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=800&q=80",
    is_available: true,
    stock_qty: 45,
    created_at: "2026-11-18T08:00:00.000Z",
    product_variants: [
      {
        id: "22222222-2222-4222-8222-222222222101",
        product_id: "11111111-1111-4111-8111-111111111101",
        variant_name: "Isi 4 Pcs (Reguler)",
        additional_price: 0,
      },
      {
        id: "22222222-2222-4222-8222-222222222102",
        product_id: "11111111-1111-4111-8111-111111111101",
        variant_name: "Isi 8 Pcs (Double)",
        additional_price: 14000,
      },
      {
        id: "22222222-2222-4222-8222-222222222103",
        product_id: "11111111-1111-4111-8111-111111111101",
        variant_name: "Party Box 16 Pcs",
        additional_price: 42000,
      },
    ],
  },
  {
    id: "11111111-1111-4111-8111-111111111102",
    name: "Hakau Udang Kristal",
    slug: "hakau-udang-kristal",
    description:
      "Kulit hakau tipis transparan yang lembut membungkus udang vaname segar utuh dengan sedikit minyak wijen harum.",
    category: "Dimsum Kukus",
    base_price: 18000,
    image_url:
      "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80",
    is_available: true,
    stock_qty: 30,
    created_at: "2026-11-18T08:05:00.000Z",
    product_variants: [
      {
        id: "22222222-2222-4222-8222-222222222201",
        product_id: "11111111-1111-4111-8111-111111111102",
        variant_name: "Isi 4 Pcs (Reguler)",
        additional_price: 0,
      },
      {
        id: "22222222-2222-4222-8222-222222222202",
        product_id: "11111111-1111-4111-8111-111111111102",
        variant_name: "Isi 8 Pcs (Double)",
        additional_price: 16000,
      },
      {
        id: "22222222-2222-4222-8222-222222222203",
        product_id: "11111111-1111-4111-8111-111111111102",
        variant_name: "Party Box 16 Pcs",
        additional_price: 48000,
      },
    ],
  },
  {
    id: "11111111-1111-4111-8111-111111111103",
    name: "Angsio Ceker Empuk Bumbu Tausi",
    slug: "angsio-ceker-empuk-bumbu-tausi",
    description:
      "Ceker ayam presto super lembut yang dimasak perlahan selama 4 jam dalam saus angsio kedelai hitam manis gurih hingga meresap ke tulang.",
    category: "Dimsum Kukus",
    base_price: 15000,
    image_url:
      "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=800&q=80",
    is_available: true,
    stock_qty: 25,
    created_at: "2026-11-18T08:10:00.000Z",
    product_variants: [
      {
        id: "22222222-2222-4222-8222-222222222301",
        product_id: "11111111-1111-4111-8111-111111111103",
        variant_name: "Porsi Reguler (4 Potong)",
        additional_price: 0,
      },
      {
        id: "22222222-2222-4222-8222-222222222302",
        product_id: "11111111-1111-4111-8111-111111111103",
        variant_name: "Porsi Jumbo (8 Potong)",
        additional_price: 13000,
      },
    ],
  },
  {
    id: "11111111-1111-4111-8111-111111111104",
    name: "Lumpia Kulit Tahu Udang Crispy",
    slug: "lumpia-kulit-tahu-udang-crispy",
    description:
      "Gulungan kulit tahu renyah keemasan berisi adonan udang dan ayam cincang dengan daun ketumbar dan saus tiram.",
    category: "Dimsum Goreng",
    base_price: 17000,
    image_url:
      "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&w=800&q=80",
    is_available: true,
    stock_qty: 35,
    created_at: "2026-11-18T08:15:00.000Z",
    product_variants: [
      {
        id: "22222222-2222-4222-8222-222222222401",
        product_id: "11111111-1111-4111-8111-111111111104",
        variant_name: "Isi 4 Pcs",
        additional_price: 0,
      },
      {
        id: "22222222-2222-4222-8222-222222222402",
        product_id: "11111111-1111-4111-8111-111111111104",
        variant_name: "Isi 8 Pcs",
        additional_price: 15000,
      },
      {
        id: "22222222-2222-4222-8222-222222222403",
        product_id: "11111111-1111-4111-8111-111111111104",
        variant_name: "Party Box 16 Pcs",
        additional_price: 45000,
      },
    ],
  },
  {
    id: "11111111-1111-4111-8111-111111111105",
    name: "Ekado Telur Puyuh Kantong Emas",
    slug: "ekado-telur-puyuh-kantong-emas",
    description:
      "Kantong kembang tahu renyah diikat kucai segar dengan isian telur puyuh utuh yang dibalut olahan daging ayam udang gurih.",
    category: "Dimsum Goreng",
    base_price: 17000,
    image_url:
      "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80",
    is_available: true,
    stock_qty: 20,
    created_at: "2026-11-18T08:20:00.000Z",
    product_variants: [
      {
        id: "22222222-2222-4222-8222-222222222501",
        product_id: "11111111-1111-4111-8111-111111111105",
        variant_name: "Isi 4 Pcs",
        additional_price: 0,
      },
      {
        id: "22222222-2222-4222-8222-222222222502",
        product_id: "11111111-1111-4111-8111-111111111105",
        variant_name: "Isi 8 Pcs",
        additional_price: 15000,
      },
    ],
  },
  {
    id: "11111111-1111-4111-8111-111111111106",
    name: "Siomay Mentai Torch Melted",
    slug: "siomay-mentai-torch-melted",
    description:
      "Siomay ayam udang dengan siraman saus mentaiko creamy melimpah yang di-torch hingga mengeluarkan aroma smoky, ditaburi rumput laut nori & tobiko.",
    category: "Dimsum Mentai",
    base_price: 24000,
    image_url:
      "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80",
    is_available: true,
    stock_qty: 40,
    created_at: "2026-11-18T08:25:00.000Z",
    product_variants: [
      {
        id: "22222222-2222-4222-8222-222222222601",
        product_id: "11111111-1111-4111-8111-111111111106",
        variant_name: "Isi 6 Pcs (Personal Box)",
        additional_price: 0,
      },
      {
        id: "22222222-2222-4222-8222-222222222602",
        product_id: "11111111-1111-4111-8111-111111111106",
        variant_name: "Isi 12 Pcs (Sharing Tray)",
        additional_price: 21000,
      },
      {
        id: "22222222-2222-4222-8222-222222222603",
        product_id: "11111111-1111-4111-8111-111111111106",
        variant_name: "Party Platter 20 Pcs + Extra Keju",
        additional_price: 48000,
      },
    ],
  },
  {
    id: "11111111-1111-4111-8111-111111111107",
    name: "Gyoza Panggang Mentai Mozzarella",
    slug: "gyoza-panggang-mentai-mozzarella",
    description:
      "Gyoza ayam sayuran yang dipanggang renyah di bagian bawah, disiram saus mentai pedas gurih dan lelehan keju mozzarella.",
    category: "Dimsum Mentai",
    base_price: 25000,
    image_url:
      "https://images.unsplash.com/photo-1607330289024-1535c6b4e1c1?auto=format&fit=crop&w=800&q=80",
    is_available: false,
    stock_qty: 0,
    created_at: "2026-11-18T08:30:00.000Z",
    product_variants: [
      {
        id: "22222222-2222-4222-8222-222222222701",
        product_id: "11111111-1111-4111-8111-111111111107",
        variant_name: "Isi 6 Pcs",
        additional_price: 0,
      },
      {
        id: "22222222-2222-4222-8222-222222222702",
        product_id: "11111111-1111-4111-8111-111111111107",
        variant_name: "Isi 12 Pcs",
        additional_price: 22000,
      },
    ],
  },
  {
    id: "11111111-1111-4111-8111-111111111108",
    name: "Frozen Pack Mix Dimsum Spesial (Vacuum)",
    slug: "frozen-pack-mix-dimsum-spesial",
    description:
      "Paket dimsum beku kemasan vakum higienis siap kukus di rumah! Terdiri dari Siomay Udang, Ayam Jamur, Nori, Kepiting, dan Wortel lengkap dengan saus sambal & chili oil.",
    category: "Frozen Pack",
    base_price: 55000,
    image_url:
      "https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=800&q=80",
    is_available: true,
    stock_qty: 50,
    created_at: "2026-11-18T08:35:00.000Z",
    product_variants: [
      {
        id: "22222222-2222-4222-8222-222222222801",
        product_id: "11111111-1111-4111-8111-111111111108",
        variant_name: "Pack Isi 20 Pcs",
        additional_price: 0,
      },
      {
        id: "22222222-2222-4222-8222-222222222802",
        product_id: "11111111-1111-4111-8111-111111111108",
        variant_name: "Pack Isi 40 Pcs (Hemat)",
        additional_price: 48000,
      },
      {
        id: "22222222-2222-4222-8222-222222222803",
        product_id: "11111111-1111-4111-8111-111111111108",
        variant_name: "Reseller Box 100 Pcs",
        additional_price: 175000,
      },
    ],
  },
  {
    id: "11111111-1111-4111-8111-111111111109",
    name: "Chili Oil Rebon Wangi Spesial",
    slug: "chili-oil-rebon-wangi-spesial",
    description:
      "Minyak cabai racikan rahasia dengan ebi/rebon pilihan, bawang putih crispy, dan rempah Sichuan yang gurih pedas menggugah selera.",
    category: "Saus & Minuman",
    base_price: 12000,
    image_url:
      "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?auto=format&fit=crop&w=800&q=80",
    is_available: true,
    stock_qty: 60,
    created_at: "2026-11-18T08:40:00.000Z",
    product_variants: [
      {
        id: "22222222-2222-4222-8222-222222222901",
        product_id: "11111111-1111-4111-8111-111111111109",
        variant_name: "Cup Ekstra 50ml",
        additional_price: 0,
      },
      {
        id: "22222222-2222-4222-8222-222222222902",
        product_id: "11111111-1111-4111-8111-111111111109",
        variant_name: "Botol Jar Kaca 150ml",
        additional_price: 18000,
      },
    ],
  },
  {
    id: "11111111-1111-4111-8111-111111111110",
    name: "Es Liang Teh & Bunga Krisan Asli",
    slug: "es-liang-teh-bunga-krisan",
    description:
      "Minuman herbal segar seduhan bunga krisan, kundur, dan gula batu asli untuk menemani santapan dimsum hangat Anda.",
    category: "Saus & Minuman",
    base_price: 10000,
    image_url:
      "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80",
    is_available: true,
    stock_qty: 40,
    created_at: "2026-11-18T08:45:00.000Z",
    product_variants: [
      {
        id: "22222222-2222-4222-8222-222222222001",
        product_id: "11111111-1111-4111-8111-111111111110",
        variant_name: "Cup 350ml (Less Sugar)",
        additional_price: 0,
      },
      {
        id: "22222222-2222-4222-8222-222222222002",
        product_id: "11111111-1111-4111-8111-111111111110",
        variant_name: "Cup 350ml (Normal Sugar)",
        additional_price: 0,
      },
      {
        id: "22222222-2222-4222-8222-222222222003",
        product_id: "11111111-1111-4111-8111-111111111110",
        variant_name: "Botol 1 Liter (Keluarga)",
        additional_price: 18000,
      },
    ],
  },
];

export const INITIAL_VOUCHERS: Voucher[] = [
  {
    id: "33333333-3333-4333-8333-333333333301",
    code: "DIMSUMHEMAT",
    discount_type: "fixed",
    discount_value: 10000,
    min_order: 50000,
    quota: 100,
    is_active: true,
  },
  {
    id: "33333333-3333-4333-8333-333333333302",
    code: "MENTAILOVER",
    discount_type: "percentage",
    discount_value: 15,
    min_order: 75000,
    quota: 50,
    is_active: true,
  },
  {
    id: "33333333-3333-4333-8333-333333333303",
    code: "UMKMBANGKIT",
    discount_type: "fixed",
    discount_value: 20000,
    min_order: 120000,
    quota: 25,
    is_active: true,
  },
];
