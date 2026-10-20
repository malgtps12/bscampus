-- ============================================================================
-- BSCampus - Jalankan SEMUA migrasi sekaligus
-- ============================================================================
-- Cara pakai:
--   1. Supabase Dashboard -> SQL Editor -> New query
--   2. Paste SELURUH isi file ini
--   3. Klik Run (cukup sekali)
--
-- Semua statement di bawah IDEMPOTEN - aman dijalankan berulang kali.
--
-- CATATAN: JANGAN paste lib/schema.sql. File itu TIDAK idempoten
-- (CREATE TRIGGER tanpa DROP dan ada INSERT produk contoh -> bisa duplikat).
-- ============================================================================


-- ############################################################################
-- # 001_add_password_reset.sql
-- ############################################################################

-- Migration: Add password reset functionality (6 digit code)
--
-- Catatan: versi lama tabel ini memakai kolom reset_code VARCHAR(4) yang
-- tidak pernah dipakai kode aplikasi (flow reset sebelumnya gagal).
-- Tabel lama tersebut dibuang lalu dibuat ulang (kode reset bersifat sementara,
-- jadi tidak ada data yang perlu dipertahankan) supaya kolom email/code_hash
-- benar-benar terpasang dan aman dijalankan berulang kali.

DROP TABLE IF EXISTS password_reset_codes CASCADE;

CREATE TABLE IF NOT EXISTS password_reset_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Satu kode aktif per email
CREATE UNIQUE INDEX IF NOT EXISTS idx_password_reset_codes_email
  ON password_reset_codes (email);

CREATE INDEX IF NOT EXISTS idx_password_reset_codes_user_id ON password_reset_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_expires_at ON password_reset_codes(expires_at);


-- ############################################################################
-- # 002_add_features.sql
-- ############################################################################

-- Reviews table
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

-- Wishlists table
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON wishlists(product_id);

-- Add rating columns to products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Function to update product rating
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

-- Trigger to update product rating after review insert/update/delete
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


-- ############################################################################
-- # 003_add_webhook_logs.sql
-- ############################################################################

-- Create webhook_logs table for monitoring
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event VARCHAR(50) NOT NULL,
  payment_id VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL,
  amount INTEGER NOT NULL,
  reference VARCHAR(100),
  verified BOOLEAN DEFAULT FALSE,
  livemode BOOLEAN DEFAULT FALSE,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for webhook_logs
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_payment_id ON webhook_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event ON webhook_logs(event);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);


-- ############################################################################
-- # 004_align_schema.sql
-- ############################################################################

-- users: kolom rekening bank & dompet digital
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_name VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_number VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_holder_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS ewallet_type VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS ewallet_number VARCHAR(50);

-- products: kolom terjual
ALTER TABLE products ADD COLUMN IF NOT EXISTS sold BOOLEAN DEFAULT FALSE;

-- Tabel transactions (transaksi/pembayaran)
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

-- Trigger updated_at (DROP + CREATE supaya idempoten)
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


-- ============================================================================
-- SELESAI. Verifikasi hasilnya:
-- ============================================================================
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name IN (
  'users', 'products', 'transactions', 'reviews', 'wishlists',
  'password_reset_codes', 'webhook_logs'
)
ORDER BY table_name, ordinal_position;
