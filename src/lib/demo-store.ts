import {
  INITIAL_PRODUCTS,
  INITIAL_VOUCHERS,
  Order,
  ProductWithVariants,
  Voucher,
} from "@/types/database";

export const ADMIN_SESSION_STORAGE_KEY = "dimsum_admin_authenticated";
const ORDERS_STORAGE_KEY = "dimsum_orders_db";
const PRODUCTS_STORAGE_KEY = "dimsum_products_db";
const VOUCHERS_STORAGE_KEY = "dimsum_vouchers_db";

const SEED_DEMO_ORDERS: Order[] = [
  {
    id: "99999999-9999-4999-8999-999999999001",
    order_number: "DMS-20261118-8821",
    customer_name: "Budi Santoso",
    customer_phone: "081298765432",
    delivery_type: "instant_courier",
    delivery_address: "Jl. Melawai Raya No. 45, Kebayoran Baru, Jakarta Selatan",
    subtotal: 75000,
    delivery_fee: 10000,
    discount_amount: 10000,
    total_amount: 75000,
    payment_status: "paid",
    order_status: "preparing",
    notes: "Tolong saus mentai dan chili oil dipisah ya kak",
    created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    order_items: [
      {
        id: "88888888-8888-4888-8888-888888888001",
        order_id: "99999999-9999-4999-8999-999999999001",
        product_id: "11111111-1111-4111-8111-111111111101",
        variant_id: "22222222-2222-4222-8222-222222222102",
        quantity: 1,
        unit_price: 30000,
        item_notes: "Chili oil ekstra pedas",
        products: {
          name: "Siomay Ayam Udang Spesial",
          image_url:
            "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=800&q=80",
          category: "Dimsum Kukus",
        },
        product_variants: {
          variant_name: "Isi 8 Pcs (Double)",
        },
      },
      {
        id: "88888888-8888-4888-8888-888888888002",
        order_id: "99999999-9999-4999-8999-999999999001",
        product_id: "11111111-1111-4111-8111-111111111106",
        variant_id: "22222222-2222-4222-8222-222222222602",
        quantity: 1,
        unit_price: 45000,
        item_notes: "Torch agak kering",
        products: {
          name: "Siomay Mentai Torch Melted",
          image_url:
            "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80",
          category: "Dimsum Mentai",
        },
        product_variants: {
          variant_name: "Isi 12 Pcs (Sharing Tray)",
        },
      },
    ],
  },
  {
    id: "99999999-9999-4999-8999-999999999002",
    order_number: "DMS-20261118-4109",
    customer_name: "Siti Rahmawati",
    customer_phone: "085711223344",
    delivery_type: "pickup",
    delivery_address: null,
    subtotal: 92000,
    delivery_fee: 0,
    discount_amount: 0,
    total_amount: 92000,
    payment_status: "paid",
    order_status: "completed",
    notes: "Diambil jam 12 siang",
    created_at: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    order_items: [
      {
        id: "88888888-8888-4888-8888-888888888003",
        order_id: "99999999-9999-4999-8999-999999999002",
        product_id: "11111111-1111-4111-8111-111111111102",
        variant_id: "22222222-2222-4222-8222-222222222203",
        quantity: 1,
        unit_price: 66000,
        item_notes: null,
        products: {
          name: "Hakau Udang Kristal",
          image_url:
            "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80",
          category: "Dimsum Kukus",
        },
        product_variants: {
          variant_name: "Party Box 16 Pcs",
        },
      },
      {
        id: "88888888-8888-4888-8888-888888888004",
        order_id: "99999999-9999-4999-8999-999999999002",
        product_id: "11111111-1111-4111-8111-111111111110",
        variant_id: "22222222-2222-4222-8222-222222222001",
        quantity: 2,
        unit_price: 13000,
        item_notes: "Es batu pisah",
        products: {
          name: "Es Liang Teh & Bunga Krisan Asli",
          image_url:
            "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80",
          category: "Saus & Minuman",
        },
        product_variants: {
          variant_name: "Cup 350ml (Less Sugar)",
        },
      },
    ],
  },
];

export function getLocalProducts(): ProductWithVariants[] {
  if (typeof window === "undefined") return INITIAL_PRODUCTS;
  try {
    const raw = window.localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(
        PRODUCTS_STORAGE_KEY,
        JSON.stringify(INITIAL_PRODUCTS)
      );
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(raw) as ProductWithVariants[];
  } catch {
    return INITIAL_PRODUCTS;
  }
}

export function saveLocalProducts(products: ProductWithVariants[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
}

export function getLocalOrders(): Order[] {
  if (typeof window === "undefined") return SEED_DEMO_ORDERS;
  try {
    const raw = window.localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(
        ORDERS_STORAGE_KEY,
        JSON.stringify(SEED_DEMO_ORDERS)
      );
      return SEED_DEMO_ORDERS;
    }
    return JSON.parse(raw) as Order[];
  } catch {
    return SEED_DEMO_ORDERS;
  }
}

export function saveLocalOrder(order: Order): void {
  if (typeof window === "undefined") return;
  const current = getLocalOrders();
  const existingIdx = current.findIndex(
    (o) => o.order_number === order.order_number
  );
  if (existingIdx > -1) {
    current[existingIdx] = order;
  } else {
    current.unshift(order);
  }
  window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(current));
}

export function getLocalOrderByNumber(orderNumber: string): Order | null {
  const orders = getLocalOrders();
  return (
    orders.find(
      (o) => o.order_number.toUpperCase() === orderNumber.toUpperCase()
    ) ?? null
  );
}

export function getLocalVouchers(): Voucher[] {
  if (typeof window === "undefined") return INITIAL_VOUCHERS;
  try {
    const raw = window.localStorage.getItem(VOUCHERS_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(
        VOUCHERS_STORAGE_KEY,
        JSON.stringify(INITIAL_VOUCHERS)
      );
      return INITIAL_VOUCHERS;
    }
    return JSON.parse(raw) as Voucher[];
  } catch {
    return INITIAL_VOUCHERS;
  }
}
