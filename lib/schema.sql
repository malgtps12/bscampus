-- BSCampus Database Schema
-- Tables for products, users, and categories

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  category VARCHAR(50) NOT NULL,
  condition VARCHAR(20) NOT NULL CHECK (condition IN ('baru', 'bekas')),
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  seller_name VARCHAR(100) NOT NULL,
  seller_student_id VARCHAR(20) NOT NULL,
  seller_contact VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sold BOOLEAN DEFAULT FALSE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_condition ON products(condition);
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_student_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- Insert sample data
INSERT INTO products (title, description, price, category, condition, seller_name, seller_student_id, seller_contact) VALUES
('Laptop ASUS VivoBook 15', 'Laptop bekas kondisi bagus, sudah ganti SSD 512GB, RAM 8GB', 3500000, 'elektronik', 'bekas', 'Ahmad Rizki', '2123001', '0812-3456-7890'),
('Buku Algoritma dan Pemrograman', 'Buku pelajaran semester 2, lengkap dengan catatan tangan, jarang dipakai', 80000, 'buku', 'bekas', 'Siti Nurhaliza', '2123045', '0898-7654-3210'),
('Headphone Wireless Sony', 'Headphone baru, belum pernah digunakan, masih lengkap dengan box', 1200000, 'elektronik', 'baru', 'Budi Santoso', '2123087', '0821-5555-6666'),
('Meja Belajar Lipat', 'Meja belajar lipat berwarna putih, mudah dibersihkan, praktis untuk kamar kost', 250000, 'furniture', 'baru', 'Rina Wijaya', '2123056', '0815-1234-5678'),
('Sepeda Gunung MTB', 'Sepeda MTB dengan ban offroad, frame aluminum, cocok untuk touring', 2000000, 'olahraga', 'bekas', 'Hendra Gunawan', '2122998', '0833-9999-8888'),
('Kamera Digital Canon EOS', 'Kamera DSLR bagus untuk fotografi, lensa 18-55mm included', 4500000, 'elektronik', 'bekas', 'Dwi Pratama', '2122901', '0812-7777-6666')
ON CONFLICT (id) DO NOTHING;

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
