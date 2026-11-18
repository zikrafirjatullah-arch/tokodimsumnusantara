-- ============================================================================
-- SUPABASE POSTGRESQL SCHEMA & SEED DATA - UMKM DIMSUM E-COMMERCE
-- ============================================================================

-- Aktifkan ekstensi UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Bersihkan tabel jika sudah ada (urutan memperhatikan foreign key)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS vouchers CASCADE;

-- ============================================================================
-- 1. TABEL PRODUCTS
-- ============================================================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (
        category IN (
            'Dimsum Kukus',
            'Dimsum Goreng',
            'Dimsum Mentai',
            'Frozen Pack',
            'Saus & Minuman'
        )
    ),
    base_price INTEGER NOT NULL CHECK (base_price >= 0),
    image_url TEXT NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    stock_qty INTEGER NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_available ON products(is_available);

-- ============================================================================
-- 2. TABEL PRODUCT_VARIANTS
-- ============================================================================
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_name TEXT NOT NULL,
    additional_price INTEGER NOT NULL DEFAULT 0 CHECK (additional_price >= 0)
);

CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);

-- ============================================================================
-- 3. TABEL ORDERS
-- ============================================================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    delivery_type TEXT NOT NULL CHECK (
        delivery_type IN ('pickup', 'instant_courier', 'frozen_expedition')
    ),
    delivery_address TEXT,
    subtotal INTEGER NOT NULL CHECK (subtotal >= 0),
    delivery_fee INTEGER NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
    discount_amount INTEGER NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (
        payment_status IN ('pending', 'paid', 'failed')
    ),
    order_status TEXT NOT NULL DEFAULT 'awaiting_payment' CHECK (
        order_status IN (
            'awaiting_payment',
            'preparing',
            'delivering',
            'completed',
            'cancelled'
        )
    ),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_order_status ON orders(order_status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- ============================================================================
-- 4. TABEL ORDER_ITEMS
-- ============================================================================
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
    item_notes TEXT
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- ============================================================================
-- 5. TABEL VOUCHERS
-- ============================================================================
CREATE TABLE vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('fixed', 'percentage')),
    discount_value INTEGER NOT NULL CHECK (discount_value > 0),
    min_order INTEGER NOT NULL DEFAULT 0 CHECK (min_order >= 0),
    quota INTEGER NOT NULL DEFAULT 0 CHECK (quota >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_vouchers_code ON vouchers(code);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) & POLICIES
-- ============================================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;

-- Public Read Access untuk Katalog & Voucher
CREATE POLICY "Public can read products"
    ON products FOR SELECT
    USING (true);

CREATE POLICY "Public can read product_variants"
    ON product_variants FOR SELECT
    USING (true);

CREATE POLICY "Public can read active vouchers"
    ON vouchers FOR SELECT
    USING (true);

-- Guest Checkout & Order Tracking Access
CREATE POLICY "Anyone can create orders"
    ON orders FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Anyone can read orders"
    ON orders FOR SELECT
    USING (true);

CREATE POLICY "Anyone can create order_items"
    ON order_items FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Anyone can read order_items"
    ON order_items FOR SELECT
    USING (true);

-- Admin Full Access (Authenticated users via Supabase Auth + Service Role)
CREATE POLICY "Authenticated admin can update products"
    ON products FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated admin can manage variants"
    ON product_variants FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated admin can update orders"
    ON orders FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated admin can manage vouchers"
    ON vouchers FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow public payment simulation & voucher quota decrement for demo/checkout flow
CREATE POLICY "Public can update order status for payment simulation"
    ON orders FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public can update voucher quota on checkout"
    ON vouchers FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- SUPABASE REALTIME CONFIGURATION
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE orders;
        ALTER PUBLICATION supabase_realtime ADD TABLE products;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SEED DATA: PRODUK DIMSUM, VARIAN, & KODE VOUCHER
-- ============================================================================
DO $$
DECLARE
    p_siomay_ayam UUID := '11111111-1111-4111-8111-111111111101';
    p_hakau_udang UUID := '11111111-1111-4111-8111-111111111102';
    p_ceker_tausi UUID := '11111111-1111-4111-8111-111111111103';
    p_lumpia_kulit_tahu UUID := '11111111-1111-4111-8111-111111111104';
    p_ekado_puyuh UUID := '11111111-1111-4111-8111-111111111105';
    p_mentai_platter UUID := '11111111-1111-4111-8111-111111111106';
    p_gyoza_mentai UUID := '11111111-1111-4111-8111-111111111107';
    p_frozen_mix UUID := '11111111-1111-4111-8111-111111111108';
    p_chili_oil UUID := '11111111-1111-4111-8111-111111111109';
    p_liang_teh UUID := '11111111-1111-4111-8111-111111111110';
BEGIN
    -- 1. Siomay Ayam Udang Premium (Dimsum Kukus)
    INSERT INTO products (id, name, slug, description, category, base_price, image_url, is_available, stock_qty)
    VALUES (
        p_siomay_ayam,
        'Siomay Ayam Udang Spesial',
        'siomay-ayam-udang-spesial',
        'Dimsum klasik favorit dengan daging paha ayam segar pilihan dan potongan udang utuh yang juicy, disajikan hangat dengan taburan tobiko dan chili oil khas.',
        'Dimsum Kukus',
        16000,
        'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=800&q=80',
        true,
        45
    );

    INSERT INTO product_variants (product_id, variant_name, additional_price) VALUES
        (p_siomay_ayam, 'Isi 4 Pcs (Reguler)', 0),
        (p_siomay_ayam, 'Isi 8 Pcs (Double)', 14000),
        (p_siomay_ayam, 'Party Box 16 Pcs', 42000);

    -- 2. Hakau Udang Kristal (Dimsum Kukus)
    INSERT INTO products (id, name, slug, description, category, base_price, image_url, is_available, stock_qty)
    VALUES (
        p_hakau_udang,
        'Hakau Udang Kristal',
        'hakau-udang-kristal',
        'Kulit hakau tipis transparan yang lembut membungkus udang vaname segar utuh dengan sedikit minyak wijen harumm.',
        'Dimsum Kukus',
        18000,
        'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
        true,
        30
    );

    INSERT INTO product_variants (product_id, variant_name, additional_price) VALUES
        (p_hakau_udang, 'Isi 4 Pcs (Reguler)', 0),
        (p_hakau_udang, 'Isi 8 Pcs (Double)', 16000),
        (p_hakau_udang, 'Party Box 16 Pcs', 48000);

    -- 3. Angsio Ceker Ayam Merah (Dimsum Kukus)
    INSERT INTO products (id, name, slug, description, category, base_price, image_url, is_available, stock_qty)
    VALUES (
        p_ceker_tausi,
        'Angsio Ceker Empuk Bumbu Tausi',
        'angsio-ceker-empuk-bumbu-tausi',
        'Ceker ayam presto super lembut yang dimasak perlahan selama 4 jam dalam saus angsio kedelai hitam manis gurih hingga meresap ke tulang.',
        'Dimsum Kukus',
        15000,
        'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=800&q=80',
        true,
        25
    );

    INSERT INTO product_variants (product_id, variant_name, additional_price) VALUES
        (p_ceker_tausi, 'Porsi Reguler (4 Potong)', 0),
        (p_ceker_tausi, 'Porsi Jumbo (8 Potong)', 13000);

    -- 4. Lumpia Kulit Tahu Udang Goreng (Dimsum Goreng)
    INSERT INTO products (id, name, slug, description, category, base_price, image_url, is_available, stock_qty)
    VALUES (
        p_lumpia_kulit_tahu,
        'Lumpia Kulit Tahu Udang Crispy',
        'lumpia-kulit-tahu-udang-crispy',
        'Gulungan kulit tahu renyah keemasan berisi adonan udang dan ayam cincang dengan daun ketumbar dan saus tiram.',
        'Dimsum Goreng',
        17000,
        'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&w=800&q=80',
        true,
        35
    );

    INSERT INTO product_variants (product_id, variant_name, additional_price) VALUES
        (p_lumpia_kulit_tahu, 'Isi 4 Pcs', 0),
        (p_lumpia_kulit_tahu, 'Isi 8 Pcs', 15000),
        (p_lumpia_kulit_tahu, 'Party Box 16 Pcs', 45000);

    -- 5. Ekado Telur Puyuh Crispy (Dimsum Goreng)
    INSERT INTO products (id, name, slug, description, category, base_price, image_url, is_available, stock_qty)
    VALUES (
        p_ekado_puyuh,
        'Ekado Telur Puyuh Kantong Emas',
        'ekado-telur-puyuh-kantong-emas',
        'Kantong kembang tahu renyah diikat kucai segar dengan isian telur puyuh utuh yang dibalut olahan daging ayam udang gurih.',
        'Dimsum Goreng',
        17000,
        'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
        true,
        20
    );

    INSERT INTO product_variants (product_id, variant_name, additional_price) VALUES
        (p_ekado_puyuh, 'Isi 4 Pcs', 0),
        (p_ekado_puyuh, 'Isi 8 Pcs', 15000);

    -- 6. Dimsum Mentai Torch Bakar (Dimsum Mentai)
    INSERT INTO products (id, name, slug, description, category, base_price, image_url, is_available, stock_qty)
    VALUES (
        p_mentai_platter,
        'Siomay Mentai Torch Melted',
        'siomay-mentai-torch-melted',
        'Siomay ayam udang dengan siraman saus mentaiko creamy melimpah yang di-torch hingga mengeluarkan aroma smoky, ditaburi rumput laut nori & tobiko.',
        'Dimsum Mentai',
        24000,
        'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80',
        true,
        40
    );

    INSERT INTO product_variants (product_id, variant_name, additional_price) VALUES
        (p_mentai_platter, 'Isi 6 Pcs (Personal Box)', 0),
        (p_mentai_platter, 'Isi 12 Pcs (Sharing Tray)', 21000),
        (p_mentai_platter, 'Party Platter 20 Pcs + Extra Keju', 48000);

    -- 7. Gyoza Panggang Saus Mentai (Dimsum Mentai)
    INSERT INTO products (id, name, slug, description, category, base_price, image_url, is_available, stock_qty)
    VALUES (
        p_gyoza_mentai,
        'Gyoza Panggang Mentai Mozzarella',
        'gyoza-panggang-mentai-mozzarella',
        'Gyoza ayam sayuran yang dipanggang renyah di bagian bawah, disiram saus mentai pedas gurih dan lelehan keju mozzarella.',
        'Dimsum Mentai',
        25000,
        'https://images.unsplash.com/photo-1607330289024-1535c6b4e1c1?auto=format&fit=crop&w=800&q=80',
        false,
        0
    );

    INSERT INTO product_variants (product_id, variant_name, additional_price) VALUES
        (p_gyoza_mentai, 'Isi 6 Pcs', 0),
        (p_gyoza_mentai, 'Isi 12 Pcs', 22000);

    -- 8. Frozen Pack Mix Dimsum Keluarga (Frozen Pack)
    INSERT INTO products (id, name, slug, description, category, base_price, image_url, is_available, stock_qty)
    VALUES (
        p_frozen_mix,
        'Frozen Pack Mix Dimsum Spesial (Vacuum)',
        'frozen-pack-mix-dimsum-spesial',
        'Paket dimsum beku kemasan vakum higienis siap kukus di rumah! Terdiri dari Siomay Udang, Ayam Jamur, Nori, Kepiting, dan Wortel lengkap dengan saus sambal & chili oil.',
        'Frozen Pack',
        55000,
        'https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=800&q=80',
        true,
        50
    );

    INSERT INTO product_variants (product_id, variant_name, additional_price) VALUES
        (p_frozen_mix, 'Pack Isi 20 Pcs', 0),
        (p_frozen_mix, 'Pack Isi 40 Pcs (Hemat)', 48000),
        (p_frozen_mix, 'Reseller Box 100 Pcs', 175000);

    -- 9. Chili Oil Hong Kong Jar (Saus & Minuman)
    INSERT INTO products (id, name, slug, description, category, base_price, image_url, is_available, stock_qty)
    VALUES (
        p_chili_oil,
        'Chili Oil Rebon Wangi Spesial',
        'chili-oil-rebon-wangi-spesial',
        'Minyak cabai racikan rahasia dengan ebi/rebon pilihan, bawang putih crispy, dan rempah Sichuan yang gurih pedas menggugah selera.',
        'Saus & Minuman',
        12000,
        'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?auto=format&fit=crop&w=800&q=80',
        true,
        60
    );

    INSERT INTO product_variants (product_id, variant_name, additional_price) VALUES
        (p_chili_oil, 'Cup Ekstra 50ml', 0),
        (p_chili_oil, 'Botol Jar Kaca 150ml', 18000);

    -- 10. Es Liang Teh Bunga Krisan (Saus & Minuman)
    INSERT INTO products (id, name, slug, description, category, base_price, image_url, is_available, stock_qty)
    VALUES (
        p_liang_teh,
        'Es Liang Teh & Bunga Krisan Asli',
        'es-liang-teh-bunga-krisan',
        'Minuman herbal segar seduhan bunga krisan, kundur, dan gula batu asli untuk menemani santapan dimsum hangat Anda.',
        'Saus & Minuman',
        10000,
        'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80',
        true,
        40
    );

    INSERT INTO product_variants (product_id, variant_name, additional_price) VALUES
        (p_liang_teh, 'Cup 350ml (Less Sugar)', 0),
        (p_liang_teh, 'Cup 350ml (Normal Sugar)', 0),
        (p_liang_teh, 'Botol 1 Liter (Keluarga)', 18000);

    -- ========================================================================
    -- SEED VOUCHERS
    -- ========================================================================
    INSERT INTO vouchers (code, discount_type, discount_value, min_order, quota, is_active)
    VALUES
        ('DIMSUMHEMAT', 'fixed', 10000, 50000, 100, true),
        ('MENTAILOVER', 'percentage', 15, 75000, 50, true),
        ('UMKMBANGKIT', 'fixed', 20000, 120000, 25, true);
END $$;
