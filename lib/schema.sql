-- BSCampus Database Schema
-- Tables for products, users, and categories

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  student_id VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  campus VARCHAR(100) NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for users
CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for conversations and messages
CREATE INDEX IF NOT EXISTS idx_conversations_buyer_id ON conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller_id ON conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_conversations_product_id ON conversations(product_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Create trigger for conversations updated_at
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to update conversations last_message
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET last_message = NEW.content,
        last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for messages insert
CREATE TRIGGER messages_update_conversation
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_message();

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
