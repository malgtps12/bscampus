-- Migrasi 004: Selaraskan skema DB live dengan kode aplikasi
--
-- PENYEBAB: Migrasi 002 (reviews/wishlists/rating) dan tabel transactions
-- tidak pernah dijalankan di database produksi, sehingga kolom bank_name dll.
-- tidak ada dan /api/auth/me gagal (menyebabkan loop login).
--
-- Migrasi ini IDEMPOTEN - aman dijalankan berulang kali di SQL Editor Supabase.

-- ============================================================
-- 1. users: kolom rekening bank & dompet digital
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_name VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_number VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_holder_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS ewallet_type VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS ewallet_number VARCHAR(50);

-- ============================================================
-- 2. products: kolom terjual & rating
-- ============================================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS sold BOOLEAN DEFAULT FALSE;
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- ============================================================
-- 3. Tabel transactions (transaksi/pembayaran)
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  product_title VARCHAR(255) NOT NULL,
  seller_id UUID NOT NULL,
  seller_name VARCHAR(100) NOT NULL,
  seller_student_id VARCHAR(20) NOT NULL,
  buyer_id UUID,
  buyer_name VARCHAR(100),
  price INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'shipped', 'completed', 'cancelled', 'expired', 'transferred')),
  payment_method VARCHAR(50),
  payment_id VARCHAR(50),
  paid_at TIMESTAMP WITH TIME ZONE,
  transferred_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_seller_id ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_product_id ON transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- ============================================================
-- 4. Tabel reviews & wishlists
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

CREATE TABLE IF NOT EXISTS wishlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON wishlists(product_id);

-- ============================================================
-- 5. Fungsi & trigger rating produk (re-run aman, CREATE OR REPLACE)
-- ============================================================
CREATE OR REPLACE FUNCTION update_product_rating(p_product_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET
    rating = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE product_id = p_product_id),
    review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = p_product_id)
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trigger_update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM update_product_rating(OLD.product_id);
    RETURN OLD;
  ELSE
    PERFORM update_product_rating(NEW.product_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reviews_update_rating ON reviews;
CREATE TRIGGER reviews_update_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION trigger_update_product_rating();

-- ============================================================
-- 6. Trigger updated_at (DROP + CREATE supaya idempoten)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
