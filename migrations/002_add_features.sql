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

